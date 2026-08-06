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
const https = require('https');

// Agent to ignore SSL certificate validation issues during external site scraping
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

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
      if (parsedUrl.hostname.includes('desert-korea-auto.com') || parsedUrl.hostname.includes('desert-korea')) {
        return await this._scrapeDesertKorea(url);
      }

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
        httpsAgent,
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
   * استخراج متخصص لموقع المزادات الكورية Desert Korea Auto
   */
  async _scrapeDesertKorea(url) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8,ko;q=0.7'
        },
        timeout: 20000,
        httpsAgent,
      });

      const $ = cheerio.load(data);

      const title = $('meta[property="og:title"]').attr('content') || 
                    $('h1.entry-title, h1.product_title, .car-title, h1').first().text() || 
                    $('title').text() || 'سيارة مزاد كوري مباشر';

      const description = $('meta[property="og:description"]').attr('content') || 
                          $('.car-description, .entry-content').text() || '';

      // استخراج VIN (رقم هيكل السيارة)
      let vin = '';
      const pageHtml = $.html();
      const vinMatch = pageHtml.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{11,17})/i) || pageHtml.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
      if (vinMatch) vin = vinMatch[1];

      // استخراج الأسعار من عناصر الصفحة
      let price = null;
      $('[class*="price"], [id*="price"], .auction-price, .current-bid').each((i, el) => {
        const text = $(el).text().trim();
        const match = text.match(/[\d,]+/);
        if (match) {
          const val = parseInt(match[0].replace(/,/g, ''));
          if (val > 0 && !price) price = val;
        }
      });

      const images = this._extractImages($, url);
      const cleanTitle = title.trim();
      const words = cleanTitle.split(' ');
      const make = words[0] || 'غير محدد';
      const model = words.slice(1, 3).join(' ') || 'غير محدد';

      return {
        success: true,
        data: {
          title: cleanTitle,
          description: description.trim(),
          vin: vin || `DKA-${Date.now().toString(36).toUpperCase()}`,
          make,
          model,
          year: new Date().getFullYear(),
          price: price || 12000,
          startingPrice: price || 12000,
          currentBid: price || 12000,
          fuelType: 'Petrol',
          transmission: 'Automatic',
          images,
          url,
          source: 'desert_korea',
          isLiveAuction: true
        }
      };
    } catch (err) {
      console.warn('[Scraper] Desert Korea specialized scrape failed, falling back to generic...', err.message);
      return await this._scrapeGeneric(url);
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
        httpsAgent,
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

  _extractImages($, baseUrl) {
    const images = [];
    const seen = new Set();
    
    // 1. الصورة الرئيسية من OG
    const mainImage = $('meta[property="og:image"]').attr('content');
    if (mainImage && mainImage.startsWith('http')) {
      images.push(mainImage);
      seen.add(mainImage);
    }
    
    // 2. إذا كان الرابط يخص encar، نستخرج كل روابط الصور من سكريبت الصفحة والـ HTML الخام
    const lowerBase = String(baseUrl).toLowerCase();
    if (lowerBase.includes('encar.com') || lowerBase.includes('encar.co.kr')) {
        const rawHtml = $.html();
        let match;
        // مطابقة روابط الصور المطلقة لـ Encar
        const regexAbs = /(?:https?:)?\/\/[a-z0-9.-]*encar\.(?:com|co\.kr)\/[^\s"'`<>]+?\.(?:jpg|jpeg|png|webp)/gi;
        while ((match = regexAbs.exec(rawHtml)) !== null) {
            let imgUrl = match[0];
            if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
            const lowerImg = imgUrl.toLowerCase();
            if (!['logo', 'icon', 'favicon', 'sprite', 'pixel', 'banner', 'btn', 'spacer', 'loading', 'ad_'].some(p => lowerImg.includes(p))) {
                if (!seen.has(imgUrl)) {
                    seen.add(imgUrl);
                    images.push(imgUrl);
                }
            }
        }
        // مطابقة الروابط النسبية لـ carpicture
        const regexRel = /\/carpicture\/[^\s"'`<>]+?\.(?:jpg|jpeg|png|webp)/gi;
        while ((match = regexRel.exec(rawHtml)) !== null) {
            const imgUrl = 'https://ci.encar.com' + match[0];
            if (!seen.has(imgUrl)) {
                seen.add(imgUrl);
                images.push(imgUrl);
            }
        }
    }
    
    // 3. صور إضافية من عناصر img
    $('img').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || $(el).attr('data-zoom-image') || $(el).attr('data-large');
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

    // 4. البحث في الروابط <a> التي تشير لصور كبيرة (مثل قطع الغيار والسيارات)
    $('a').each((i, el) => {
      let href = $(el).attr('href') || $(el).attr('data-zoom') || $(el).attr('data-image');
      if (!href) return;
      const lowerHref = href.toLowerCase();
      if (lowerHref.match(/\.(jpg|jpeg|png|webp)(?:\?.*)?$/i)) {
          if (href.startsWith('//')) href = 'https:' + href;
          else if (href.startsWith('/') && !href.startsWith('http')) {
              try {
                  const urlObj = new URL(baseUrl);
                  href = `${urlObj.origin}${href}`;
              } catch(e) { return; }
          }
          if (href.startsWith('http') && !seen.has(href)) {
              const lower = href.toLowerCase();
              if (!['logo', 'icon', 'favicon', 'sprite', 'pixel', 'banner', 'btn', 'spacer', 'loading', 'ad_'].some(p => lower.includes(p))) {
                  seen.add(href);
                  images.push(href);
              }
          }
      }
    });

    return images.slice(0, 80); // أول 80 صورة كحد أقصى
  }
}

module.exports = new ScraperService();
