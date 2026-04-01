#!/usr/bin/env node

/**
 * سكريبت لإصلاح تصنيف السيارات الكورية
 * يقوم بتحديث السيارات التي تحتوي على مؤشرات كورية لكن غير مصنفة بشكل صحيح
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixKoreanCars() {
    try {
        console.log('🔧 جاري إصلاح تصنيف السيارات الكورية...\n');

        // الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات\n');

        // البحث عن السيارات التي تحتاج إلى إصلاح
        const carsToFix = await Car.find({
            $or: [
                // سيارات تحتوي على رابط Encar
                { externalUrl: { $regex: 'encar.com', $options: 'i' } },
                // سيارات لها سعر بالوون الكوري
                { priceKrw: { $gt: 0 } },
                // سيارات نوعها showroom لكن المصدر ليس korean_import
                { listingType: 'showroom', source: { $ne: 'korean_import' } }
            ]
        });

        console.log(`📊 وجدنا ${carsToFix.length} سيارة تحتاج إلى إصلاح\n`);

        if (carsToFix.length === 0) {
            console.log('✅ جميع السيارات مصنفة بشكل صحيح');
            process.exit(0);
        }

        let fixedCount = 0;

        for (const car of carsToFix) {
            const updates = {};
            let needsUpdate = false;

            // تحديد المصدر
            if (car.source !== 'korean_import') {
                updates.source = 'korean_import';
                needsUpdate = true;
            }

            // تحديد نوع العرض
            if (car.listingType !== 'showroom') {
                updates.listingType = 'showroom';
                needsUpdate = true;
            }

            // التأكد من أن السيارة نشطة
            if (!car.isActive) {
                updates.isActive = true;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await Car.updateOne({ _id: car._id }, { $set: updates });
                fixedCount++;
                console.log(`✅ تم إصلاح: ${car.title}`);
                console.log(`   - المصدر: ${car.source} → korean_import`);
                console.log(`   - النوع: ${car.listingType} → showroom\n`);
            }
        }

        console.log(`\n✅ تم إصلاح ${fixedCount} سيارة بنجاح`);
        
        // عرض الإحصائيات النهائية
        const totalKoreanCars = await Car.countDocuments({
            source: 'korean_import',
            isActive: true,
            isSold: false
        });

        console.log(`\n📊 الإحصائيات النهائية:`);
        console.log(`   - إجمالي السيارات الكورية النشطة: ${totalKoreanCars}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    }
}

fixKoreanCars();
