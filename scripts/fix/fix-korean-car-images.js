#!/usr/bin/env node

/**
 * سكريبت إصلاح صور السيارات الكورية
 * يقوم بإصلاح روابط الصور المكسورة وتحسين عرضها
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixKoreanCarImages() {
    console.log('🚗 بدء إصلاح صور السيارات الكورية...');
    
    let client;
    try {
        // الاتصال بقاعدة البيانات
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_CARX;
        if (!mongoUri) {
            throw new Error('❌ لم يتم العثور على MONGO_URI في متغيرات البيئة');
        }

        console.log('📡 الاتصال بقاعدة البيانات...');
        client = new MongoClient(mongoUri);
        await client.connect();
        
        const db = client.db();
        const carsCollection = db.collection('cars');

        // البحث عن السيارات الكورية
        console.log('🔍 البحث عن السيارات الكورية...');
        const koreanCars = await carsCollection.find({
            $or: [
                { source: 'korean_import' },
                { source: 'korean' },
                { 'imageUrl': { $regex: 'encar.com', $options: 'i' } },
                { 'images': { $elemMatch: { $regex: 'encar.com', $options: 'i' } } }
            ]
        }).toArray();

        console.log(`📊 تم العثور على ${koreanCars.length} سيارة كورية`);

        let fixedCount = 0;
        let errorCount = 0;

        for (const car of koreanCars) {
            try {
                let needsUpdate = false;
                const updates = {};

                // إصلاح الصورة الرئيسية
                if (car.imageUrl) {
                    const fixedImageUrl = fixImageUrl(car.imageUrl);
                    if (fixedImageUrl !== car.imageUrl) {
                        updates.imageUrl = fixedImageUrl;
                        needsUpdate = true;
                    }
                }

                // إصلاح مصفوفة الصور
                if (car.images && Array.isArray(car.images)) {
                    const fixedImages = car.images.map(img => fixImageUrl(img));
                    const hasChanges = fixedImages.some((img, index) => img !== car.images[index]);
                    
                    if (hasChanges) {
                        updates.images = fixedImages;
                        needsUpdate = true;
                    }
                }

                // إضافة معلومات إضافية للسيارات الكورية
                if (!car.source || car.source !== 'korean_import') {
                    updates.source = 'korean_import';
                    needsUpdate = true;
                }

                // إضافة شارة الفحص للسيارات الكورية
                if (car.imageUrl && car.imageUrl.includes('encar.com') && !car.isInspected) {
                    updates.isInspected = true;
                    needsUpdate = true;
                }

                // تحديث السيارة إذا كانت تحتاج إصلاح
                if (needsUpdate) {
                    await carsCollection.updateOne(
                        { _id: car._id },
                        { $set: updates }
                    );
                    fixedCount++;
                    console.log(`✅ تم إصلاح السيارة: ${car.title || car.model || car._id}`);
                }

            } catch (error) {
                errorCount++;
                console.error(`❌ خطأ في إصلاح السيارة ${car._id}:`, error.message);
            }
        }

        // إنشاء فهرس للبحث السريع
        console.log('📚 إنشاء فهارس للبحث السريع...');
        try {
            await carsCollection.createIndex({ source: 1 });
            await carsCollection.createIndex({ isInspected: 1 });
            await carsCollection.createIndex({ imageUrl: 1 });
            console.log('✅ تم إنشاء الفهارس بنجاح');
        } catch (indexError) {
            console.log('⚠️ الفهارس موجودة مسبقاً');
        }

        // تقرير النتائج
        console.log('\n📋 تقرير الإصلاح:');
        console.log(`✅ تم إصلاح: ${fixedCount} سيارة`);
        console.log(`❌ أخطاء: ${errorCount} سيارة`);
        console.log(`📊 إجمالي السيارات الكورية: ${koreanCars.length}`);
        
        if (fixedCount > 0) {
            console.log('\n🎉 تم إصلاح صور السيارات الكورية بنجاح!');
            console.log('🌐 يمكنك الآن رؤية الصور بوضوح على الموقع');
        } else {
            console.log('\n✨ جميع صور السيارات الكورية سليمة!');
        }

    } catch (error) {
        console.error('❌ خطأ في إصلاح صور السيارات:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
        }
    }
}

/**
 * دالة إصلاح رابط الصورة
 */
function fixImageUrl(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
    }
    
    let url = imageUrl.trim();
    
    // إزالة المسافات والأحرف الغريبة
    url = url.replace(/\s+/g, '');
    
    // إصلاح الروابط المكررة
    if (url.includes('https://ci.encar.comhttps://ci.encar.com')) {
        url = url.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
    }
    
    // إصلاح الروابط التي تحتوي على بروتوكولات مكررة
    url = url.replace(/https?:\/\/https?:\/\//g, 'https://');
    
    // إصلاح الروابط التي تنتهي بـ _
    if (url.endsWith('_')) {
        url = `${url}001.jpg`;
    }
    
    // إضافة بروتوكول إذا كان مفقوداً
    if (!url.startsWith('http') && !url.startsWith('//')) {
        url = `https://${url}`;
    }
    
    // إصلاح الروابط التي تبدأ بـ //
    if (url.startsWith('//')) {
        url = `https:${url}`;
    }
    
    // التأكد من صحة الرابط
    try {
        new URL(url);
        return url;
    } catch (error) {
        console.warn(`⚠️ رابط صورة غير صحيح: ${imageUrl}`);
        return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
    }
}

// تشغيل السكريبت
if (require.main === module) {
    fixKoreanCarImages();
}

module.exports = { fixKoreanCarImages, fixImageUrl };