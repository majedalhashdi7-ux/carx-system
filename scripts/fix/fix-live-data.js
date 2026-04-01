/**
 * fix-live-data.js
 * يصلح 3 مشاكل في قاعدة البيانات الحية:
 * 1. سنة السيارات الخاطئة (202111 → 2021)
 * 2. المزادات المنتهية لا تزال "running"
 * 3. رابط الواتساب الخاطئ في الإعدادات
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI غير موجود في .env');
        process.exit(1);
    }

    console.log('🔄 جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        tls: true,
        tlsAllowInvalidCertificates: false,
    });
    console.log('✅ متصل بقاعدة البيانات');

    // ─────────────────────────────────────────────
    // 1. إصلاح سنة السيارات
    // Encar يحفظ السنة كـ YYYYMM (مثل 202111 = نوفمبر 2021)
    // نقسم على 100 للحصول على السنة الصحيحة
    // ─────────────────────────────────────────────
    console.log('\n📅 إصلاح سنة السيارات...');

    const carCollection = mongoose.connection.collection('cars');

    // جلب السيارات التي سنتها أكبر من 9999 (يعني YYYYMM)
    const wrongYearCars = await carCollection.find({
        year: { $gt: 9999 }
    }).toArray();

    console.log(`   وجدت ${wrongYearCars.length} سيارة بسنة خاطئة`);

    let fixedYears = 0;
    for (const car of wrongYearCars) {
        const correctYear = Math.floor(car.year / 100); // 202111 → 2021
        await carCollection.updateOne(
            { _id: car._id },
            { $set: { year: correctYear } }
        );
        fixedYears++;
    }
    console.log(`   ✅ تم إصلاح ${fixedYears} سيارة`);

    // ─────────────────────────────────────────────
    // 2. إصلاح المزادات المنتهية
    // المزادات التي endsAt < الآن ولا تزال status = "running"
    // ─────────────────────────────────────────────
    console.log('\n🔨 إصلاح المزادات المنتهية...');

    const auctionCollection = mongoose.connection.collection('auctions');
    const now = new Date();

    const expiredResult = await auctionCollection.updateMany(
        {
            status: 'running',
            endsAt: { $lt: now }
        },
        {
            $set: { status: 'ended' }
        }
    );
    console.log(`   ✅ تم إغلاق ${expiredResult.modifiedCount} مزاد منتهي`);

    // إصلاح المزادات المجدولة التي بدأت بالفعل
    const startedResult = await auctionCollection.updateMany(
        {
            status: 'scheduled',
            startsAt: { $lte: now },
            endsAt: { $gt: now }
        },
        {
            $set: { status: 'running' }
        }
    );
    console.log(`   ✅ تم تفعيل ${startedResult.modifiedCount} مزاد بدأ وقته`);

    // ─────────────────────────────────────────────
    // 3. إصلاح رابط الواتساب في الإعدادات
    // "https://wa.me/+8210-8088-0014" → "https://wa.me/821080880014"
    // ─────────────────────────────────────────────
    console.log('\n📱 إصلاح رابط الواتساب...');

    const settingsCollection = mongoose.connection.collection('sitesettings');
    const settings = await settingsCollection.findOne({ key: 'main' });

    if (settings) {
        const currentWhatsapp = settings?.socialLinks?.whatsapp || '';
        console.log(`   الرابط الحالي: ${currentWhatsapp}`);

        // تنظيف الرقم: إزالة +، شرطات، مسافات، وإزالة https://wa.me/ إذا موجود
        let cleanNumber = currentWhatsapp
            .replace('https://wa.me/', '')
            .replace(/[+\-\s]/g, '');

        const correctUrl = `https://wa.me/${cleanNumber}`;

        await settingsCollection.updateOne(
            { key: 'main' },
            { $set: { 'socialLinks.whatsapp': correctUrl } }
        );
        console.log(`   ✅ تم التصحيح إلى: ${correctUrl}`);
    } else {
        console.log('   ⚠️ لم يتم العثور على إعدادات الموقع');
    }

    // ─────────────────────────────────────────────
    // ملخص
    // ─────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────────');
    console.log('✅ اكتملت جميع الإصلاحات:');
    console.log(`   • سنة السيارات: ${fixedYears} سيارة تم إصلاحها`);
    console.log(`   • المزادات المنتهية: ${expiredResult.modifiedCount} مزاد تم إغلاقه`);
    console.log(`   • المزادات المفعّلة: ${startedResult.modifiedCount} مزاد تم تفعيله`);
    console.log(`   • رابط الواتساب: تم التصحيح`);
    console.log('─────────────────────────────────────────────');

    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
});
