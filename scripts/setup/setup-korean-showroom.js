#!/usr/bin/env node

/**
 * سكريبت لإعداد المعرض الكوري
 * يقوم بإضافة رابط Encar الافتراضي وإعدادات المعرض
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');

async function setupKoreanShowroom() {
    try {
        console.log('⚙️  جاري إعداد المعرض الكوري...\n');

        // الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات\n');

        // رابط Encar الافتراضي (يعرض أحدث السيارات)
        const defaultEncarUrl = 'https://car.encar.com/dc/dc_cardetailview.do?method=kcarList&wtClick_korList=015';

        // البحث عن الإعدادات الحالية
        let settings = await SiteSettings.findOne({ key: 'main' });

        if (!settings) {
            console.log('📝 إنشاء إعدادات جديدة...');
            settings = new SiteSettings({
                key: 'main',
                showroomSettings: {
                    encarUrl: defaultEncarUrl,
                    lastScrapedPage: 1
                },
                advertisingSettings: {
                    showLiveAuction: true,
                    showroomSource: 'korean',
                    bannerLabel: '⚡ عروض حصرية',
                    bannerLabelEn: '⚡ EXCLUSIVE DEALS'
                }
            });
            await settings.save();
            console.log('✅ تم إنشاء الإعدادات بنجاح');
        } else {
            console.log('📝 تحديث الإعدادات الحالية...');
            
            // تحديث إعدادات المعرض
            if (!settings.showroomSettings) {
                settings.showroomSettings = {};
            }
            
            if (!settings.showroomSettings.encarUrl) {
                settings.showroomSettings.encarUrl = defaultEncarUrl;
                console.log('   ✅ تم إضافة رابط Encar الافتراضي');
            } else {
                console.log('   ℹ️  رابط Encar موجود بالفعل:', settings.showroomSettings.encarUrl);
            }

            if (!settings.showroomSettings.lastScrapedPage) {
                settings.showroomSettings.lastScrapedPage = 1;
            }

            // تحديث إعدادات الإعلانات
            if (!settings.advertisingSettings) {
                settings.advertisingSettings = {};
            }

            if (!settings.advertisingSettings.showroomSource) {
                settings.advertisingSettings.showroomSource = 'korean';
                console.log('   ✅ تم تفعيل عرض المعرض الكوري في الإعلانات');
            }

            if (!settings.advertisingSettings.showLiveAuction) {
                settings.advertisingSettings.showLiveAuction = true;
            }

            await settings.save();
            console.log('✅ تم تحديث الإعدادات بنجاح');
        }

        console.log('\n📋 الإعدادات الحالية:');
        console.log('   - رابط Encar:', settings.showroomSettings.encarUrl);
        console.log('   - آخر صفحة تم جلبها:', settings.showroomSettings.lastScrapedPage);
        console.log('   - مصدر المعرض في الإعلانات:', settings.advertisingSettings.showroomSource);

        console.log('\n💡 الخطوات التالية:');
        console.log('   1. قم بجلب السيارات من Encar:');
        console.log('      POST /api/v2/showroom/scrape');
        console.log('      أو من لوحة الأدمن > المعرض الكوري > جلب السيارات');
        console.log('\n   2. تحقق من السيارات:');
        console.log('      node scripts/check-korean-showroom.js');

        console.log('\n✅ تم إعداد المعرض الكوري بنجاح');
        process.exit(0);

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    }
}

setupKoreanShowroom();
