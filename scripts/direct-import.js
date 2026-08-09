/**
 * direct-import.js
 * يتصل بـ MongoDB Atlas مباشرة ويستورد سيارات من Encar
 * بدون الحاجة لـ Auth أو rate limit
 */
require('dotenv').config({ path: '../.env.local' });
const mongoose = require('mongoose');
const ShowroomImportService = require('../services/ShowroomImportService');
const LiveAuctionImportService = require('../services/LiveAuctionImportService');

const MONGO_URI = process.env.MONGO_URI;
const TENANT_ID = 'hmcar';

// نبني req مزيف (mock) لأن الخدمات تحتاجه
function buildMockReq(models) {
  return {
    tenant: { id: TENANT_ID },
    tenantId: TENANT_ID,
    tenantModels: models,
    tenantDb: mongoose.connection,
    user: { name: 'Admin Script', email: 'admin@hmcar.com', role: 'super_admin' },
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🚀 HM CAR — الاستيراد المباشر من Encar كوريا');
  console.log('═══════════════════════════════════════════════════\n');

  // الاتصال بقاعدة البيانات
  console.log('📡 الاتصال بـ MongoDB Atlas...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ متصل!\n');

  // تحميل النماذج
  const Car = require('../models/Car');
  const LiveAuction = require('../models/LiveAuction');

  const models = {
    Car,
    LiveAuction,
    ImportLog: (() => {
      try { return require('../models/ImportLog'); } catch { return null; }
    })(),
  };

  const mockReq = buildMockReq(models);

  // ══════════════════════════════════════════
  // 1. استيراد 15 سيارة للمعرض
  // ══════════════════════════════════════════
  console.log('─────────────────────────────────────────');
  console.log('🚗 استيراد سيارات المعرض (15 سيارة)...');
  console.log('─────────────────────────────────────────');
  try {
    const result = await ShowroomImportService.importShowroomCars(mockReq, {
      limit: 15,
      targetUrl: '',
      adminUser: 'Admin Script'
    });
    console.log(`\n✅ سيارات المعرض:`);
    console.log(`   • تم جلب: ${result.totalFetched || '?'} سيارة`);
    console.log(`   • تم حفظ: ${result.totalImported || result.imported || '?'} سيارة`);
    console.log(`   • تم تخطي (موجودة): ${result.totalSkipped || result.skipped || '?'} سيارة`);
    if (result.message) console.log(`   • الرسالة: ${result.message}`);
  } catch (err) {
    console.error('❌ فشل استيراد المعرض:', err.message);
  }

  // ══════════════════════════════════════════
  // 2. استيراد 10 سيارات للمزاد المباشر
  // ══════════════════════════════════════════
  console.log('\n─────────────────────────────────────────');
  console.log('🔴 استيراد المزاد المباشر (10 سيارات)...');
  console.log('─────────────────────────────────────────');
  try {
    const result = await LiveAuctionImportService.importLiveAuctionCars(mockReq, {
      limit: 10,
      targetUrl: '',
      adminUser: 'Admin Script'
    });
    console.log(`\n✅ المزاد المباشر:`);
    console.log(`   • تم جلب: ${result.totalFetched || '?'} سيارة`);
    console.log(`   • تم حفظ: ${result.totalImported || result.imported || '?'} سيارة`);
    console.log(`   • تم تخطي (موجودة): ${result.totalSkipped || result.skipped || '?'} سيارة`);
    if (result.message) console.log(`   • الرسالة: ${result.message}`);
  } catch (err) {
    console.error('❌ فشل استيراد المزاد:', err.message);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎉 اكتمل الاستيراد!');
  console.log('🌐 تحقق من: https://hmcar-system-two.vercel.app');
  console.log('🔴 المزاد: https://hmcar-system-two.vercel.app/auctions/live');
  console.log('═══════════════════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('💥 خطأ حرج:', err.message);
  process.exit(1);
});
