import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import connectDB from '@/lib/db';
import { Car, SparePart } from '@/lib/models';

/**
 * نظام استيراد متقدم للسيارات وقطع الغيار
 * - استخراج البيانات من المواقع
 * - ضغط الصور تلقائياً
 * - فحص التكرار
 * - حفظ في قاعدة البيانات
 */

// دالة لتحميل وضغط الصور
async function downloadAndCompressImage(imageUrl: string): Promise<string | null> {
  try {
    // تحميل الصورة
    const response = await fetch(imageUrl, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    
    // ضغط الصورة باستخدام sharp
    const compressed = await sharp(Buffer.from(buffer))
      .resize(1200, 800, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 80,
        effort: 6
      })
      .toBuffer();
    
    // تحويل إلى base64 للتخزين المؤقت
    // في الإنتاج: ارفع إلى Cloudinary أو S3
    const base64 = compressed.toString('base64');
    return `data:image/webp;base64,${base64}`;
    
  } catch (error) {
    console.error('فشل ضغط الصورة:', imageUrl, error);
    return null;
  }
}

// استخراج بيانات السيارة من HTML
function extractCarData(html: string, url: string) {
  const $ = cheerio.load(html);
  
  // محاولة استخراج العنوان
  const title = $('h1').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                $('.car-title').text().trim() ||
                $('.vehicle-title').text().trim();
  
  // استخراج السعر
  const priceText = $('.price').text() || 
                    $('.car-price').text() || 
                    $('[class*="price"]').text();
  const priceMatch = priceText.match(/[\d,]+/);
  const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
  
  // استخراج السنة
  const yearText = title || $('body').text();
  const yearMatch = yearText.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
  
  // استخراج الصور
  const images: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && !src.includes('logo') && !src.includes('icon')) {
      images.push(src.startsWith('http') ? src : new URL(src, url).href);
    }
  });
  
  // استخراج الوصف
  const description = $('meta[name="description"]').attr('content') ||
                      $('.description').text().trim() ||
                      $('p').first().text().trim();
  
  // تخمين الماركة والموديل من العنوان
  const titleParts = title.split(/\s+/);
  const make = titleParts[0] || 'Unknown';
  const model = titleParts.slice(1, -1).join(' ') || 'Unknown';
  
  return {
    title: title.substring(0, 100),
    make,
    model,
    year,
    price,
    priceSar: price * 3.75, // تحويل افتراضي
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    description: description.substring(0, 500),
    images: images.slice(0, 10), // أول 10 صور فقط
    source: 'imported',
    sourceUrl: url,
    isActive: true,
  };
}

// استخراج بيانات قطعة الغيار
function extractPartData(html: string, url: string) {
  const $ = cheerio.load(html);
  
  const name = $('h1').first().text().trim() || 
               $('.product-title').text().trim() ||
               $('.part-name').text().trim();
  
  const priceText = $('.price').text() || $('.part-price').text();
  const priceMatch = priceText.match(/[\d,]+/);
  const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
  
  const images: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src) {
      images.push(src.startsWith('http') ? src : new URL(src, url).href);
    }
  });
  
  return {
    name,
    nameAr: name,
    price,
    priceSar: price * 3.75,
    images: images.slice(0, 5),
    condition: 'NEW',
    inStock: true,
    stockQty: 10,
    source: 'imported',
    isActive: true,
  };
}

// فحص التكرار في قاعدة البيانات
async function checkDuplicate(url: string, type: 'car' | 'part'): Promise<boolean> {
  await connectDB();
  
  if (type === 'car') {
    const existing = await Car.findOne({ sourceUrl: url });
    return !!existing;
  } else {
    const existing = await SparePart.findOne({ sourceUrl: url });
    return !!existing;
  }
}

// POST - استيراد من رابط
export async function POST(request: NextRequest) {
  try {
    const { url, type } = await request.json();
    
    if (!url || !type) {
      return NextResponse.json(
        { success: false, error: 'الرجاء تقديم الرابط والنوع (car/part)' },
        { status: 400 }
      );
    }
    
    // التحقق من التكرار
    const isDuplicate = await checkDuplicate(url, type);
    if (isDuplicate) {
      return NextResponse.json({
        success: false,
        duplicate: true,
        error: 'هذا العنصر موجود مسبقاً في النظام'
      });
    }
    
    // جلب الصفحة
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`فشل جلب الصفحة: ${response.status}`);
    }
    
    const html = await response.text();
    
    // استخراج البيانات
    const rawData = type === 'car' 
      ? extractCarData(html, url)
      : extractPartData(html, url);
    
    // ضغط الصور
    const compressedImages: string[] = [];
    for (const imgUrl of rawData.images) {
      const compressed = await downloadAndCompressImage(imgUrl);
      if (compressed) compressedImages.push(compressed);
    }
    
    // تحديث البيانات بالصور المضغوطة
    const data = {
      ...rawData,
      images: compressedImages.length > 0 ? compressedImages : rawData.images
    };
    
    return NextResponse.json({
      success: true,
      duplicate: false,
      message: 'تم استخراج البيانات بنجاح',
      data,
      compressedCount: compressedImages.length
    });
    
  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء الاستيراد' },
      { status: 500 }
    );
  }
}
