#!/usr/bin/env node

/**
 * سكريبت للتحقق من حالة المعرض الكوري وإصلاح المشاكل
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const SiteSettings = require('../models/SiteSettings');

async function checkKoreanShowroom() {
    try {
        console.log('🔍 جاري التحقق من المعرض الكوري...\n');

        // الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات\n');

        // 1. التحقق من إعدادات المعرض
        console.log('📋 التحقق من إعدادات المعرض:');
        const settings = await SiteSettings.findOne({ key: 'main' });
        
        if (!settings) {
            console.log('❌ لا توجد إعدادات في قاعدة البيانات');
        } else {
            console.log('   - رابط Encar:', settings.showroomSettings?.encarUrl || 'غير محدد');
            console.log('   - آخر صفحة تم جلبها:', settings.showroomSettings?.lastScrapedPage || 'لم يتم الجلب بعد');
            console.log('   - إعدادات الإعلانات:', settings.advertisingSettings?.showroomSource || 'غير محدد');
        }

        // 2. التحقق من السيارات الكورية في قاعدة البيانات
        console.log('\n🚗 التحقق من السيارات الكورية:');
        
        const koreanCarsCount = await Car.countDocuments({
            $or: [
                { source: 'korean_import' },
                { listingType: 'showroom' }
            ]
        });
        
        const activeKoreanCars = await Car.countDocuments({
            isActive: true,
            isSold: false,
            $or: [
                { source: 'korean_import' },
                { listingType: 'showroom' }
            ]
        });

        console.log(`   - إجمالي السيارات الكورية: ${koreanCarsCount}`);
        console.log(`   - السيارات النشطة: ${activeKoreanCars}`);

        // 3. عرض عينة من السيارات
        if (activeKoreanCars > 0) {
            console.log('\n📊 عينة من السيارات النشطة:');
            const sampleCars = await Car.find({
                isActive: true,
                isSold: false,
                $or: [
                    { source: 'korean_import' },
                    { listingType: 'showroom' }
                ]
            }).limit(5).select('title make model year source listingType priceKrw priceSar');

            sampleCars.forEach((car, i) => {
                console.log(`   ${i + 1}. ${car.title}`);
                console.log(`      - المصدر: ${car.source}`);
                console.log(`      - النوع: ${car.listingType}`);
                console.log(`      - السعر: ${car.priceSar || car.priceKrw || 'غير محدد'}`);
            });
        }

        // 4. التحقق من السيارات التي قد تكون كورية لكن غير مصنفة بشكل صحيح
        console.log('\n🔧 التحقق من السيارات غير المصنفة:');
        const possibleKoreanCars = await Car.countDocuments({
            $or: [
                { externalUrl: { $regex: 'encar.com' } },
                { priceKrw: { $gt: 0 } }
            ],
            source: { $ne: 'korean_import' }
        });

        if (possibleKoreanCars > 0) {
            console.log(`   ⚠️  وجدنا ${possibleKoreanCars} سيارة قد تكون كورية لكن غير مصنفة بشكل صحيح`);
            console.log('   💡 يمكنك تشغيل سكريبت الإصلاح لتصحيح التصنيف');
        } else {
            console.log('   ✅ جميع السيارات مصنفة بشكل صحيح');
        }

        // 5. التوصيات
        console.log('\n💡 التوصيات:');
        
        if (!settings?.showroomSettings?.encarUrl) {
            console.log('   ⚠️  يجب تحديد رابط Encar في إعدادات المعرض');
            console.log('   📝 يمكنك القيام بذلك من لوحة الأدمن > الإعدادات > المعرض الكوري');
        }

        if (activeKoreanCars === 0) {
            console.log('   ⚠️  لا توجد سيارات كورية نشطة');
            console.log('   📝 يمكنك جلب السيارات من Encar باستخدام:');
            console.log('      POST /api/v2/showroom/scrape');
            console.log('      أو من لوحة الأدمن > المعرض الكوري > جلب السيارات');
        }

        if (possibleKoreanCars > 0) {
            console.log('   ⚠️  بعض السيارات قد تحتاج إلى إعادة تصنيف');
            console.log('   📝 شغل: node scripts/fix-korean-cars.js');
        }

        console.log('\n✅ انتهى الفحص');
        process.exit(0);

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    }
}

checkKoreanShowroom();
