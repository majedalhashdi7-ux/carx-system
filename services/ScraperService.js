// [[ARABIC_HEADER]] هذا الملف (services/ScraperService.js) جزء من مشروع HM CAR

/**
 * @file services/ScraperService.js
 * @description خدمة استخراج البيانات من المواقع الخارجية (Web Scraping)
 * 
 * يدعم:
 * - استخراج عام من أي رابط (OG tags + HTML)
 * - استخراج متخصص لمواقع السيارات الكورية (Encar)
 * - تصفية الصور غير المرغوبة (أيقونات، شعارات)
 * - timeout وحماية من المواقع المحظورة
 */

const axios = require('axios');
const cheerio = require('cheerio');

class ScraperService {
  /**
   * استخراج البيانات والصور من أي رابط
   * @param {string} url - الرابط المطلوب استخراج البيانات منه
   * @returns {object} البيانات المستخرجة
   */
  async scrapeUrl(url) {
    try {
      // التحقق من صحة الرابط
      const parsedUrl = new URL(url);
      
      // اختيار الاستراتيجية المناسبة حسب الموقع
      if (parsedUrl.hostname.includes('encar.com') || parsedUrl.hostname.includes('encar.co.kr')) {
        return await this._scrapeEncar(url);
      }
      
      return await this._scrapeGeneric(url);
    } catch (error) {
      if (error.code === 'ERR_INVALID_URL') {
        return { success: false, error: 'الرابط غير صالح' };
      }
      console.error('⚠️ [Scraper] Error:', error.message);
      return { 
        success: false, 
        error: `فشل استخراج البيانات: ${error.message}` 
      };
    }
  }

  /**
   * استخراج عام من أي موقع
   */
  async _scrapeGeneric(url) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8,ko;q=0.7'
        },
        timeout: 15000,
        maxRedirects: 5,
      });
      
      const $ = cheerio.load(data);
      
      // استخراج العنوان (أفضلية OG > title > h1)
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('title').text() || 
                    $('h1').first().text() || '';
                    
      // استخراج الوصف
      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content') || '';
                          
      // استخراج السعر (محاولة عامة)
      let price = null;
      $('[class*="price"], [id*="price"], [data-price]').each((i, el) => {
        const text = $(el).text().trim();
        const match = text.match(/[\d,]+/);
        if (match && !price) {
          const val = parseInt(match[0].replace(/,/g, ''));
          if (val > 0) price = val;
        }
      });

      // استخراج الصور
      const images = this._extractImages($, url);

      return {
        success: true,
        data: {
          title: title.trim(),
          description: description.trim(),
          price,
          images,
          url
        }
      };
    } catch (err) {
       throw new Error(`تعذر الوصول للموقع: ${err.message}`);
    }
  }

  /**
   * استخراج متخصص لموقع Encar (سيارات كورية)
   */
  async _scrapeEncar(url) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8'
        },
        timeout: 15000,
      });
      
      const $ = cheerio.load(data);
      
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('.prod_name').text() || 
                    $('title').text() || '';
      
      const description = $('meta[property="og:description"]').attr('content') || '';
      
      // استخراج السعر من Encar (بالـ "مان وون" الكوري)
      let price = null;
      const priceText = $('.price .num').text() || $('[class*="price"]').first().text();
      if (priceText) {
        const match = priceText.match(/[\d,]+/);
        if (match) {
           const rawPrice = parseInt(match[0].replace(/,/g, ''));
           // تحويل من "مان وون" (10,000 وون) إلى وون كامل
           price = rawPrice * 10000;
        }
      }

      const images = this._extractImages($, url);

      return {
        success: true,
        data: {
          title: title.trim(),
          description: description.trim(),
          price,
          images,
          url,
          source: 'encar'
        }
      };
    } catch (error) {
      console.warn('[Scraper] Encar specialized scrape failed, falling back to generic...', error.message);
      return await this._scrapeGeneric(url);
    }
  }

  /**
   * استخراج الصور من صفحة HTML مع تصفية ذكية
   */
  _extractImages($, baseUrl) {
    const images = [];
    const seen = new Set();
    
    // الصورة الرئيسية من OG
    const mainImage = $('meta[property="og:image"]').attr('content');
    if (mainImage && mainImage.startsWith('http')) {
      images.push(mainImage);
      seen.add(mainImage);
    }
    
    // صور إضافية من الصفحة
    $('img').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original');
      if (!src) return;
      
      // تحويل الروابط النسبية
      if (src.startsWith('//')) {
        src = 'https:' + src;
      } else if (src.startsWith('/')) {
        try {
          const urlObj = new URL(baseUrl);
          src = `${urlObj.origin}${src}`;
        } catch(e) { return; }
      }
      
      // تصفية الصور غير المرغوبة
      if (!src.startsWith('http')) return;
      if (seen.has(src)) return;
      
      const lowerSrc = src.toLowerCase();
      const excludePatterns = ['logo', 'icon', 'favicon', 'sprite', 'pixel', 'tracking', 'banner', 'ad_', 'advertisement', '.svg', '1x1', 'spacer'];
      if (excludePatterns.some(p => lowerSrc.includes(p))) return;
      
      // تحقق من أن الصورة كبيرة بما يكفي (عبر الأبعاد HTML attributes)
      const width = parseInt($(el).attr('width')) || 999;
      const height = parseInt($(el).attr('height')) || 999;
      if (width < 100 || height < 100) return;
      
      seen.add(src);
      images.push(src);
    });

    return images.slice(0, 15); // أول 15 صورة كحد أقصى
  }
}

module.exports = new ScraperService();
