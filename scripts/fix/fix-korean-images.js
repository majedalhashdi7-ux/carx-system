#!/usr/bin/env node

/**
 * سكريبت لإصلاح روابط صور السيارات الكورية
 * يقوم بتصحيح الروابط الناقصة أو المعطوبة
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

/**
 * تنظيف وإصلاح رابط الصورة
 */
function normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    const trimmed = url.trim();
    if (!trimmed) return null;

    // إزالة التكرار في الرابط
    if (trimmed.includes('https://ci.encar.comhttps://ci.encar.com')) {
        return trimmed.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
    }

    // إصلاح الروابط التي تنتهي بـ _
    if (trimmed.endsWith('_')) {
        if (trimmed.startsWith('http')) {
            return `${trimmed}001.jpg`;
        }
        return `https://ci.encar.com${trimmed}001.jpg`;
    }

    // إضافة النطاق إذا كان الرابط نسبي
    if (trimmed.startsWith('/carpicture')) {
        return `https://ci.encar.com${trimmed}`;
    }

    if (trimmed.startsWith('/') && !trimmed.startsWith('http')) {
        return `https://ci.encar.com/carpicture${trimmed}`;
    }

    // إذا كان الرابط كامل، نرجعه كما هو
    if (trimmed.startsWith('http')) {
        return trimmed;
    }

    // إذا لم يكن هناك بروتوكول، نضيف النطاق الكامل
    return `https://ci.encar.com/carpicture${trimmed}`;
}

async function fixKoreanImages() {
    try {
        console.log('🖼️  جاري إصلاح روابط صور السيارات الكورية...\n');

        // الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات\n');

        // البحث عن السيارات الكورية
        const koreanCars = await Car.find({
            $or: [
                { source: 'korean_import' },
                { listingType: 'showroom' }
            ]
        });

        console.log(`📊 وجدنا ${koreanCars.length} سيارة كورية\n`);

        if (koreanCars.length === 0) {
            console.log('✅ لا توجد سيارات كورية للإصلاح');
            process.exit(0);
        }

        let fixedCount = 0;
        let carsWithIssues = 0;

        for (const car of koreanCars) {
            let needsUpdate = false;
            const fixedImages = [];

            // فحص وإصلاح كل صورة
            if (Array.isArray(car.images)) {
                for (const img of car.images) {
                    const normalized = normalizeImageUrl(img);
                    if (normalized) {
                        fixedImages.push(normalized);
                        if (normalized !== img) {
                            needsUpdate = true;
                        }
                    }
                }
            }

            // إذا لم توجد صور أو كانت فارغة، نضيف صورة افتراضية
            if (fixedImages.length === 0) {
                fixedImages.push('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop');
                needsUpdate = true;
                carsWithIssues++;
            }

            // تحديث السيارة إذا لزم الأمر
            if (needsUpdate) {
                await Car.updateOne(
                    { _id: car._id },
                    { $set: { images: fixedImages } }
                );
                fixedCount++;
                
                console.log(`✅ تم إصلاح: ${car.title}`);
                console.log(`   - عدد الصور: ${car.images?.length || 0} → ${fixedImages.length}`);
                
                // عرض عينة من الصور المصلحة
                if (fixedImages.length > 0) {
                    console.log(`   - الصورة الأولى: ${fixedImages[0].substring(0, 60)}...`);
                }
                console.log('');
            }
        }

        console.log(`\n📊 النتائج:`);
        console.log(`   - إجمالي السيارات: ${koreanCars.length}`);
        console.log(`   - تم إصلاحها: ${fixedCount}`);
        console.log(`   - سيارات بدون صور: ${carsWithIssues}`);

        if (fixedCount > 0) {
            console.log('\n✅ تم إصلاح روابط الصور بنجاح!');
            console.log('💡 يمكنك الآن التحقق من المعرض الكوري في لوحة الأدمن');
        } else {
            console.log('\n✅ جميع الصور صحيحة بالفعل');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    }
}

fixKoreanImages();
