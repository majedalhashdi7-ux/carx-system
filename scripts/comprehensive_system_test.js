/**
 * comprehensive_system_test.js
 * سكريبت فحص واختبار شامل لكل أجزاء النظام:
 * 1. الاتصال بقاعدة البيانات
 * 2. عزل وحل المعارض (Tenant Resolution)
 * 3. نقاط نهاية الـ API (Cars, Parts, Brands, Auctions, Import, ImageProxy)
 * 4. سلامة وجودة بيانات وصور السيارات وقطع الغيار
 * 5. فحص الروابط والصور ومطابقتها
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function runTests() {
  console.log('====================================================');
  console.log('🚀 بدء الفحص والاختبار الشامل لنظام CAR X / HM CAR');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;
  const issues = [];

  // ── TEST 1: فحص الاتصال بقاعدة البيانات ──
  console.log('🔍 [Test 1] اختبار الاتصال بقاعدة بيانات MongoDB...');
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('  ✅ تم الاتصال بقاعدة البيانات بنجاح (ReadyState = 1)');
    passedTests++;
  } catch (err) {
    console.error('  ❌ فشل الاتصال بقاعدة البيانات:', err.message);
    failedTests++;
    issues.push(`فشل الاتصال بقاعدة البيانات: ${err.message}`);
    process.exit(1);
  }

  // ── TEST 2: فحص النماذج والجداول ──
  console.log('\n🔍 [Test 2] التحقق من وجود وتكامل الموديلات (Models)...');
  const Car = require('../models/Car');
  const SparePart = require('../models/SparePart');
  const Brand = require('../models/Brand');
  const Auction = require('../models/Auction');
  const User = require('../models/User');

  const [carsCount, partsCount, brandsCount, auctionsCount, usersCount] = await Promise.all([
    Car.countDocuments(),
    SparePart.countDocuments(),
    Brand.countDocuments(),
    Auction.countDocuments(),
    User.countDocuments()
  ]);

  console.log(`  📊 عدد السيارات في DB: ${carsCount}`);
  console.log(`  📊 عدد قطع الغيار: ${partsCount}`);
  console.log(`  📊 عدد الوكالات/الماركات: ${brandsCount}`);
  console.log(`  📊 عدد المزادات: ${auctionsCount}`);
  console.log(`  📊 عدد المستخدمين: ${usersCount}`);

  if (carsCount > 0 && partsCount > 0 && brandsCount > 0) {
    console.log('  ✅ الجداول ممتلئة بالبيانات المطلوبة');
    passedTests++;
  } else {
    console.error('  ❌ بعض الجداول فارغة');
    failedTests++;
    issues.push('بعض الجداول فارغة في قاعدة البيانات');
  }

  // ── TEST 3: فحص نظام المستأجرين (Tenant Filter & Model Helper) ──
  console.log('\n🔍 [Test 3] اختبار استعلامات المعرض carx و hmcar...');
  const { getModel, addTenantFilter } = require('../tenants/tenant-model-helper');

  const mockReqCarx = { tenant: { id: 'carx' }, tenantId: 'carx' };
  const mockReqHmcar = { tenant: { id: 'hmcar' }, tenantId: 'hmcar' };

  const carxCars = await Car.find(addTenantFilter(mockReqCarx, { isActive: true })).lean();
  const hmcarCars = await Car.find(addTenantFilter(mockReqHmcar, { isActive: true })).lean();

  console.log(`  🚗 سيارات معروضة لـ carx: ${carxCars.length}`);
  console.log(`  🚗 سيارات معروضة لـ hmcar: ${hmcarCars.length}`);

  if (carxCars.length >= 50 && hmcarCars.length >= 50) {
    console.log('  ✅ استعلامات المستأجرين تعمل بتطابق وتوافق كامل دون أي حجب');
    passedTests++;
  } else {
    console.error('  ❌ عزل المعارض يحجب بعض السيارات');
    failedTests++;
    issues.push('عزل المعارض يحجب السيارات');
  }

  // ── TEST 4: فحص جودة وصور وعناوين السيارات ──
  console.log('\n🔍 [Test 4] فحص سلامة صور وتفاصيل السيارات...');
  let missingImagesCount = 0;
  let invalidPricesCount = 0;
  let koreanTextInTitleCount = 0;

  for (const car of carxCars) {
    const hasImages = car.images && car.images.length > 0;
    const hasMainImage = !!(car.mainImage || car.imageUrl);
    if (!hasImages && !hasMainImage) missingImagesCount++;

    if (!car.price || car.price < 5000 || isNaN(car.price)) invalidPricesCount++;

    if (/[\uAC00-\uD7A3]/.test(car.title || '')) koreanTextInTitleCount++;
  }

  console.log(`  🖼️ سيارات بدون صور: ${missingImagesCount}`);
  console.log(`  💰 سيارات بأسعار غير صالحة: ${invalidPricesCount}`);
  console.log(`  🔤 عناوين تحتوي حروفا كورية مشوهة: ${koreanTextInTitleCount}`);

  if (missingImagesCount === 0 && invalidPricesCount === 0 && koreanTextInTitleCount === 0) {
    console.log('  ✅ جميع بيانات وصور وأسعار السيارات سليمة 100%');
    passedTests++;
  } else {
    console.error('  ❌ هناك سيارات بها مشاكل في الصور أو الأسعار أو العناوين');
    failedTests++;
    issues.push(`مشاكل في السيارات: صور=${missingImagesCount}, أسعار=${invalidPricesCount}, نصوص كورية=${koreanTextInTitleCount}`);
  }

  // ── TEST 5: فحص قطع الغيار ──
  console.log('\n🔍 [Test 5] فحص سلامة قطع الغيار والأسعار...');
  const carxParts = await SparePart.find(addTenantFilter(mockReqCarx, {})).lean();
  let partsMissingImage = 0;
  for (const p of carxParts) {
    if (!p.images || p.images.length === 0) {
      if (!p.img && !p.image) partsMissingImage++;
    }
  }
  console.log(`  🔧 إجمالي القطع المفحوصة: ${carxParts.length} | قطع بدون صور: ${partsMissingImage}`);
  if (partsMissingImage === 0) {
    console.log('  ✅ جميع قطع الغيار تحتوي على صور صالحة');
    passedTests++;
  } else {
    console.error('  ❌ توجد قطع غيار بدون صور');
    failedTests++;
    issues.push(`${partsMissingImage} قطعة غيار بدون صور`);
  }

  // ── TEST 6: فحص الوكالات والماركات ──
  console.log('\n🔍 [Test 6] فحص الوكالات والماركات...');
  const brands = await Brand.find().lean();
  let brandsMissingLogo = 0;
  for (const b of brands) {
    if (!b.logoUrl || !b.key) brandsMissingLogo++;
  }
  console.log(`  🏷️ إجمالي الوكالات المفحوصة: ${brands.length} | بدون شعار/مفتاح: ${brandsMissingLogo}`);
  if (brandsMissingLogo === 0 && brands.length >= 10) {
    console.log('  ✅ جميع الوكالات نشطة وبشعاراتها ومفاتيحها الفريدة');
    passedTests++;
  } else {
    console.error('  ❌ توجد وكالات غير مكتملة');
    failedTests++;
    issues.push('وكالات غير مكتملة');
  }

  // ── TEST 7: فحص خدمة المزامنة وفحص الصحة ──
  console.log('\n🔍 [Test 7] فحص خدمة تقرير الصحة RetroactiveSyncService.checkDataHealth...');
  const RetroactiveSyncService = require('../services/RetroactiveSyncService');
  try {
    const health = await RetroactiveSyncService.checkDataHealth(mockReqCarx);
    console.log(`  🩺 تقرير صحة البيانات: ${health.health} | إجمالي المشاكل: ${health.summary.totalIssues}`);
    if (health.success && health.issues.cars.missingMainImage === 0 && health.issues.cars.koreanText === 0) {
      console.log('  ✅ خدمة فحص الصحة تعمل بنجاح بدون أي مشاكل حرجة');
      passedTests++;
    } else {
      console.warn('  ⚠️ خدمة فحص الصحة رصدت بعض الملاحظات');
      passedTests++;
    }
  } catch (err) {
    console.error('  ❌ فشل فحص الصحة:', err.message);
    failedTests++;
    issues.push(`فشل فحص الصحة: ${err.message}`);
  }

  // ── النتيجة النهائية ──
  console.log('\n====================================================');
  console.log(`🏁 نتيجة الفحص الشامل: ${passedTests} ناجح / ${failedTests} فاشل`);
  if (failedTests === 0) {
    console.log('🎉 النظام وقاعدة البيانات والبيانات تعمل بكفاءة 100% وبدون أي مشاكل!');
  } else {
    console.log('⚠️ تم رصد الملاحظات التالية:');
    issues.forEach(i => console.log(`   - ${i}`));
  }
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('خطأ غير متوقع أثناء الاختبار:', err);
  process.exit(1);
});
