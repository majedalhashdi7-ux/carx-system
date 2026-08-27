// [[ARABIC_HEADER]] سكريبت استيراد وتعبئة سيارات المعرض من Encar مباشرة مع العلامة المائية الشفافة
require('dotenv').config({ path: 'c:/car-auction/.env' });
const mongoose = require('mongoose');

const TARGET_ENCAR_URL = 'https://car.encar.com/list/car?page=1&search=%7B%22type%22%3A%22car%22%2C%22action%22%3A%22(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))%22%2C%22title%22%3A%22%22%2C%22toggle%22%3A%7B%7D%2C%22layer%22%3A%22%22%2C%22sort%22%3A%22MobileModifiedDate%22%7D';

async function run() {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_CARX;
    if (!MONGO_URI) {
        console.error('❌ No MONGO_URI provided in environment');
        process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Register all required models
    require('../models/Car');
    require('../models/SiteSettings');
    require('../models/ImportLog');

    const SiteSettings = mongoose.model('SiteSettings');
    const Car = mongoose.model('Car');

    // 1. تحديث إعدادات الموقع برابط المعرض الكوري المستهدف
    console.log('⚙️ Updating SiteSettings with target Encar URL...');
    let settings = await SiteSettings.findOne({ tenantId: 'default' });
    if (!settings) {
        settings = await SiteSettings.create({
            tenantId: 'default',
            showroomSettings: { encarUrl: TARGET_ENCAR_URL, enabled: true },
            currencySettings: { usdToSar: 3.75, usdToKrw: 1350, auctionMultiplier: 1.10 }
        });
    } else {
        if (!settings.showroomSettings) settings.showroomSettings = {};
        settings.showroomSettings.encarUrl = TARGET_ENCAR_URL;
        settings.showroomSettings.enabled = true;
        await settings.save();
    }
    console.log('✅ SiteSettings updated successfully');

    // 2. تشغيل خدمة الاستيراد ShowroomImportService
    const ShowroomImportService = require('../services/ShowroomImportService');

    const tenants = ['hmcar', 'carx', 'default'];
    for (const tenantId of tenants) {
        console.log(`\n🚗 Starting Encar Showroom Import for Tenant: [${tenantId}]...`);
        const fakeReq = {
            tenantId,
            tenantDb: mongoose.connection,
            tenantModels: { Car, SiteSettings }
        };

        const result = await ShowroomImportService.importShowroomCars(fakeReq, {
            limit: 20,
            targetUrl: TARGET_ENCAR_URL,
            adminUser: 'system_auto_importer'
        });

        console.log('📊 Import Result:', JSON.stringify(result.stats || result.message));
    }

    // 3. التحقق من عدد السيارات المستوردة
    const totalShowroomCars = await Car.countDocuments({
        $or: [
            { source: 'encar_korea' },
            { source: 'korean_import' },
            { listingType: 'showroom' }
        ]
    });
    console.log(`\n🎉 Total Live Showroom Cars in Database: ${totalShowroomCars}`);

    // عينة من السيارات المستوردة
    const sampleCars = await Car.find({ source: 'encar_korea' }).limit(3).lean();
    console.log('\n🔍 Sample Imported Cars:');
    sampleCars.forEach((c, idx) => {
        console.log(`  [${idx + 1}] ${c.title} | ${c.priceSar} SAR | ${c.priceKrw} KRW | ${c.images?.length || 0} Images`);
        if (c.images?.[0]) console.log(`      Sample Image with Watermark: ${c.images[0].slice(0, 100)}...`);
    });

    await mongoose.disconnect();
    console.log('\n🏁 Import finished successfully!');
}

run().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
