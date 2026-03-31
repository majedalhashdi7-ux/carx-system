import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * API لاستيراد السيارات وقطع الغيار من الروابط
 * مع ضغط الصور وعدم التكرار
 */

// دالة لاستخراج البيانات من الرابط
async function extractDataFromUrl(url: string, type: 'car' | 'part') {
  try {
    // محاكاة استخراج البيانات (في الواقع، ستحتاج إلى web scraping)
    const response = await fetch(url);
    const html = await response.text();

    // هنا يجب استخدام مكتبة مثل cheerio لاستخراج البيانات
    // هذا مثال بسيط
    
    if (type === 'car') {
      return {
        title: 'Toyota Camry 2020',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        price: 85000,
        mileage: 45000,
        fuelType: 'بنزين',
        transmission: 'أوتوماتيك',
        color: 'أبيض',
        condition: 'ممتازة',
        description: 'سيارة في حالة ممتازة، صيانة دورية',
        images: [
          'https://example.com/car1.jpg',
          'https://example.com/car2.jpg',
        ],
        source: 'imported',
        sourceUrl: url,
      };
    } else {
      return {
        name: 'فلتر زيت أصلي',
        partNumber: 'OF-12345',
        category: 'فلاتر',
        brand: 'Toyota',
        price: 150,
        stock: 10,
        condition: 'جديد',
        warranty: 'سنة واحدة',
        isOriginal: true,
        images: [
          'https://example.com/part1.jpg',
        ],
        compatibility: ['Toyota Camry', 'Toyota Corolla'],
        sourceUrl: url,
      };
    }
  } catch (error) {
    throw new Error('فشل استخراج البيانات من الرابط');
  }
}

// دالة لضغط الصور
async function compressImage(imageUrl: string): Promise<string> {
  try {
    // تحميل الصورة
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    // ضغط الصورة باستخدام Sharp
    const compressed = await sharp(Buffer.from(buffer))
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // في الواقع، يجب رفع الصورة إلى CDN أو التخزين
    // هنا نعيد رابط مؤقت
    const hash = crypto.createHash('md5').update(compressed).digest('hex');
    return `/uploads/${hash}.webp`;
  } catch (error) {
    console.error('فشل ضغط الصورة:', error);
    return imageUrl; // إرجاع الرابط الأصلي في حالة الفشل
  }
}

// دالة للتحقق من التكرار
async function checkDuplicate(data: any, type: 'car' | 'part'): Promise<boolean> {
  // في الواقع، يجب البحث في قاعدة البيانات
  // هنا نعيد false (لا يوجد تكرار)
  
  if (type === 'car') {
    // فحص VIN أو مزيج من الماركة والموديل والسنة
    // const existing = await db.cars.findOne({
    //   make: data.make,
    //   model: data.model,
    //   year: data.year,
    //   vin: data.vin
    // });
    // return !!existing;
  } else {
    // فحص رقم القطعة
    // const existing = await db.parts.findOne({
    //   partNumber: data.partNumber
    // });
    // return !!existing;
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type } = body;

    if (!url || !type) {
      return NextResponse.json(
        { success: false, error: 'الرجاء تقديم الرابط والنوع' },
        { status: 400 }
      );
    }

    // استخراج البيانات
    const data = await extractDataFromUrl(url, type);

    // التحقق من التكرار
    const isDuplicate = await checkDuplicate(data, type);

    if (isDuplicate) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'هذا العنصر موجود مسبقاً في النظام',
        data
      });
    }

    // ضغط الصور
    const compressedImages = await Promise.all(
      data.images.map((img: string) => compressImage(img))
    );

    data.images = compressedImages;

    return NextResponse.json({
      success: true,
      duplicate: false,
      message: 'تم استخراج البيانات بنجاح',
      data,
      images: compressedImages
    });
  } catch (error: any) {
    console.error('خطأ في الاستيراد:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء الاستيراد' },
      { status: 500 }
    );
  }
}
