/**
 * db-organize.js
 * ===================================================
 * سكريبت تنظيم قاعدة البيانات الشامل
 * يقوم بـ:
 * 1. فحص حالة كل الجداول (42 Collection)
 * 2. إنشاء الفهارس (Indexes) لتسريع الاستعلامات
 * 3. ملء الجداول الفارغة ببيانات تجريبية
 * 4. حفظ أسعار الصرف في قاعدة البيانات
 * 5. طباعة تقرير شامل
 * ===================================================
 * الاستخدام المحلي:
 *   $env:MONGO_URI="mongodb://127.0.0.1:27017/car-auction"; node scripts/database/db-organize.js
 *
 * الاستخدام على Atlas (يتطلب إنترنت):
 *   node scripts/database/db-organize.js              ← يقرأ .env.local تلقائياً
 *   npm run db:check                                   ← فحص فقط
 *   npm run db:indexes                                 ← فهارس فقط
 *   npm run db:seed                                    ← بيانات تجريبية فقط
 *   npm run db:organize                                ← كل شيء
 */

require('dotenv').config({ path: '.env.local', override: false });
require('dotenv').config({ path: '.env', override: false });

const mongoose = require('mongoose');

const args = process.argv.slice(2);
const CHECK_ONLY    = args.includes('--check-only');
const INDEXES_ONLY  = args.includes('--indexes-only');
const SEED_ONLY     = args.includes('--seed-only');
const DO_ALL        = !CHECK_ONLY && !INDEXES_ONLY && !SEED_ONLY;

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI غير موجود في .env.local');
  process.exit(1);
}

// ===================================================
// تعريف الأقسام والجداول
// ===================================================
const DB_SECTIONS = {
  '🚗 المخزون (Inventory)': [
    'cars', 'spareparts', 'brands', 'sparebrands', 'vehiclecategories',
    'koreancardimports', 'importedspareparts'
  ],
  '👤 المستخدمون والصلاحيات': [
    'users', 'roles', 'advancedpermissions', 'authsettings',
    'devicefingerprints', 'clientsessions'
  ],
  '💰 المبيعات والمزادات': [
    'auctions', 'bids', 'liveauctions', 'liveauctionrequests',
    'orders', 'payments', 'invoices'
  ],
  '🌟 تجربة العميل': [
    'favorites', 'comparisons', 'reviews', 'searchhistories', 'conciergerequests'
  ],
  '💬 التواصل والدعم': [
    'messages', 'conversations', 'contacts', 'supportmessages', 'leads'
  ],
  '🔔 الإشعارات والتنبيهات': [
    'usernotifications', 'usernotificationpreferences',
    'advancednotifications', 'pushsubscriptions', 'smartalerts'
  ],
  '⚙️ الإدارة والنظام': [
    'sitesettings', 'exchangerates', 'analytics', 'reports',
    'auditlogs', 'backups', 'importlogs'
  ]
};

// ===================================================
// الفهارس لكل جدول
// ===================================================
async function createAllIndexes(db) {
  console.log('\n📋 إنشاء الفهارس...\n');

  const indexes = [
    // cars
    { col: 'cars', idx: { tenantId: 1, isActive: 1 } },
    { col: 'cars', idx: { tenantId: 1, listingType: 1 } },
    { col: 'cars', idx: { tenantId: 1, source: 1 } },
    { col: 'cars', idx: { make: 1, model: 1, year: -1 } },
    { col: 'cars', idx: { price: 1 } },
    { col: 'cars', idx: { createdAt: -1 } },
    { col: 'cars', idx: { isSold: 1, isActive: 1 } },

    // spareparts
    { col: 'spareparts', idx: { tenantId: 1, inStock: 1 } },
    { col: 'spareparts', idx: { carMake: 1, carModel: 1 } },
    { col: 'spareparts', idx: { price: 1 } },
    { col: 'spareparts', idx: { createdAt: -1 } },

    // brands
    { col: 'brands', idx: { tenantId: 1, isActive: 1 } },
    { col: 'brands', idx: { key: 1 }, options: { unique: true, sparse: true } },

    // users
    { col: 'users', idx: { tenantId: 1, role: 1 } },
    { col: 'users', idx: { email: 1 }, options: { unique: true, sparse: true } },
    { col: 'users', idx: { isActive: 1 } },
    { col: 'users', idx: { createdAt: -1 } },

    // orders
    { col: 'orders', idx: { tenantId: 1, status: 1 } },
    { col: 'orders', idx: { tenantId: 1, buyer: 1 } },
    { col: 'orders', idx: { orderNumber: 1 }, options: { unique: true, sparse: true } },
    { col: 'orders', idx: { createdAt: -1 } },

    // auctions
    { col: 'auctions', idx: { tenantId: 1, status: 1 } },
    { col: 'auctions', idx: { endDate: 1 } },
    { col: 'auctions', idx: { car: 1 } },

    // bids
    { col: 'bids', idx: { auction: 1, amount: -1 } },
    { col: 'bids', idx: { bidder: 1 } },
    { col: 'bids', idx: { createdAt: -1 } },

    // favorites
    { col: 'favorites', idx: { tenantId: 1, user: 1 } },
    { col: 'favorites', idx: { user: 1, car: 1 } },

    // reviews
    { col: 'reviews', idx: { tenantId: 1, car: 1 } },
    { col: 'reviews', idx: { user: 1, rating: -1 } },

    // comparisons
    { col: 'comparisons', idx: { tenantId: 1, user: 1 } },
    { col: 'comparisons', idx: { createdAt: -1 } },

    // messages
    { col: 'messages', idx: { conversation: 1, createdAt: 1 } },
    { col: 'messages', idx: { sender: 1 } },

    // usernotifications
    { col: 'usernotifications', idx: { tenantId: 1, user: 1, isRead: 1 } },
    { col: 'usernotifications', idx: { createdAt: -1 } },

    // payments
    { col: 'payments', idx: { tenantId: 1, status: 1 } },
    { col: 'payments', idx: { order: 1 } },
    { col: 'payments', idx: { createdAt: -1 } },

    // invoices
    { col: 'invoices', idx: { tenantId: 1, order: 1 } },
    { col: 'invoices', idx: { createdAt: -1 } },

    // auditlogs
    { col: 'auditlogs', idx: { tenantId: 1, action: 1 } },
    { col: 'auditlogs', idx: { userId: 1, createdAt: -1 } },
    { col: 'auditlogs', idx: { createdAt: -1 } },

    // exchangerates
    { col: 'exchangerates', idx: { currency: 1 } },
    { col: 'exchangerates', idx: { updatedAt: -1 } },

    // sitesettings
    { col: 'sitesettings', idx: { tenantId: 1 } },

    // analytics
    { col: 'analytics', idx: { tenantId: 1, event: 1 } },
    { col: 'analytics', idx: { createdAt: -1 } },

    // smartalerts
    { col: 'smartalerts', idx: { tenantId: 1, isActive: 1 } },
    { col: 'smartalerts', idx: { user: 1 } },

    // leads
    { col: 'leads', idx: { tenantId: 1, status: 1 } },
    { col: 'leads', idx: { createdAt: -1 } },

    // contacts
    { col: 'contacts', idx: { tenantId: 1, createdAt: -1 } },

    // searchhistories
    { col: 'searchhistories', idx: { tenantId: 1, user: 1 } },
    { col: 'searchhistories', idx: { createdAt: -1 } },

    // conciergerequests
    { col: 'conciergerequests', idx: { tenantId: 1, status: 1 } },
    { col: 'conciergerequests', idx: { user: 1 } },

    // liveauctions
    { col: 'liveauctions', idx: { tenantId: 1, status: 1 } },
    { col: 'liveauctions', idx: { startTime: 1 } },

    // importlogs
    { col: 'importlogs', idx: { tenantId: 1, type: 1 } },
    { col: 'importlogs', idx: { createdAt: -1 } },

    // roles
    { col: 'roles', idx: { tenantId: 1, name: 1 } },
  ];

  let created = 0, skipped = 0, failed = 0;

  for (const { col, idx, options = {} } of indexes) {
    try {
      await db.collection(col).createIndex(idx, { background: true, ...options });
      created++;
    } catch (err) {
      if (err.code === 85 || err.code === 86 || err.message.includes('already exists')) {
        skipped++;
      } else {
        failed++;
        console.warn(`  ⚠️ فشل فهرس ${col}:`, err.message.substring(0, 60));
      }
    }
  }

  console.log(`  ✅ تم إنشاء: ${created} فهرس`);
  console.log(`  ⏭️  موجود مسبقاً: ${skipped} فهرس`);
  if (failed > 0) console.log(`  ❌ فشل: ${failed} فهرس`);
}

// ===================================================
// بيانات تجريبية لملء الجداول الفارغة
// ===================================================
async function seedEmptyCollections(db, tenantId = 'hmcar') {
  console.log('\n🌱 ملء الجداول الفارغة ببيانات تجريبية...\n');

  const results = [];

  // 1. أسعار الصرف
  const ratesCount = await db.collection('exchangerates').countDocuments();
  if (ratesCount === 0) {
    await db.collection('exchangerates').insertMany([
      {
        tenantId,
        currency: 'USD',
        rateToSar: Number(process.env.USD_TO_SAR) || 3.75,
        rateToKrw: Number(process.env.USD_TO_KRW) || 1300,
        source: 'manual',
        isActive: true,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        tenantId,
        currency: 'KRW',
        rateToSar: (Number(process.env.USD_TO_SAR) || 3.75) / (Number(process.env.USD_TO_KRW) || 1300),
        rateToKrw: 1,
        source: 'manual',
        isActive: true,
        createdAt: new Date(), updatedAt: new Date()
      }
    ]);
    results.push('💱 exchangerates: أُضيف 2 سجل (USD, KRW)');
  } else {
    results.push(`💱 exchangerates: موجود (${ratesCount} سجل) ✅`);
  }

  // 2. تصنيفات المركبات
  const catCount = await db.collection('vehiclecategories').countDocuments();
  if (catCount === 0) {
    const categories = [
      'sedan', 'suv', 'pickup', 'coupe', 'hatchback', 'van', 'truck', 'sports', 'luxury', 'electric'
    ].map(name => ({
      tenantId,
      name,
      nameAr: { sedan: 'سيدان', suv: 'دفع رباعي', pickup: 'بيك أب', coupe: 'كوبيه', hatchback: 'هاتشباك', van: 'فان', truck: 'شاحنة', sports: 'رياضي', luxury: 'فاخر', electric: 'كهربائي' }[name] || name,
      isActive: true,
      createdAt: new Date(), updatedAt: new Date()
    }));
    await db.collection('vehiclecategories').insertMany(categories);
    results.push(`🚗 vehiclecategories: أُضيف ${categories.length} تصنيف`);
  } else {
    results.push(`🚗 vehiclecategories: موجود (${catCount} سجل) ✅`);
  }

  // 3. إعدادات الموقع
  const settCount = await db.collection('sitesettings').countDocuments({ tenantId });
  if (settCount === 0) {
    await db.collection('sitesettings').insertOne({
      tenantId,
      siteName: 'HM CAR',
      siteNameAr: 'اتش ام كار',
      siteUrl: process.env.CLIENT_URL || 'https://hmcar-system-two.vercel.app',
      contactEmail: process.env.ADMIN_EMAIL || 'info@hmcar.com',
      whatsappNumber: process.env.WHATSAPP_NUMBER || '+967781007805',
      currencySettings: {
        defaultCurrency: 'SAR',
        usdToSar: Number(process.env.USD_TO_SAR) || 3.75,
        usdToKrw: Number(process.env.USD_TO_KRW) || 1300,
      },
      maintenanceMode: false,
      isActive: true,
      createdAt: new Date(), updatedAt: new Date()
    });
    results.push('⚙️ sitesettings: أُضيف إعداد افتراضي للنظام');
  } else {
    results.push(`⚙️ sitesettings: موجود (${settCount} سجل) ✅`);
  }

  // 4. إعدادات المصادقة
  const authCount = await db.collection('authsettings').countDocuments();
  if (authCount === 0) {
    await db.collection('authsettings').insertOne({
      tenantId,
      jwtExpiry: '30d',
      sessionTimeout: 86400,
      maxLoginAttempts: 5,
      lockoutDuration: 900,
      require2FA: false,
      allowedRegistration: true,
      emailVerification: false,
      createdAt: new Date(), updatedAt: new Date()
    });
    results.push('🔐 authsettings: أُضيف إعداد افتراضي للمصادقة');
  } else {
    results.push(`🔐 authsettings: موجود (${authCount} سجل) ✅`);
  }

  // 5. SpareBrands إذا فارغة
  const sbCount = await db.collection('sparebrands').countDocuments();
  if (sbCount === 0) {
    const spareBrands = ['Toyota', 'Hyundai', 'Kia', 'Nissan', 'Honda', 'BMW', 'Mercedes'].map(name => ({
      tenantId, name, isActive: true, createdAt: new Date(), updatedAt: new Date()
    }));
    await db.collection('sparebrands').insertMany(spareBrands);
    results.push(`🔧 sparebrands: أُضيف ${spareBrands.length} ماركة`);
  } else {
    results.push(`🔧 sparebrands: موجود (${sbCount} سجل) ✅`);
  }

  // 6. إشعار تجريبي واحد للنظام
  const notifCount = await db.collection('usernotifications').countDocuments();
  if (notifCount === 0) {
    await db.collection('usernotifications').insertOne({
      tenantId,
      title: 'مرحباً بك في HM CAR',
      titleEn: 'Welcome to HM CAR',
      body: 'تم إعداد النظام بنجاح. يمكنك الآن تصفح السيارات والقطع.',
      type: 'system',
      isRead: false,
      isGlobal: true,
      createdAt: new Date(), updatedAt: new Date()
    });
    results.push('🔔 usernotifications: أُضيف إشعار ترحيب');
  } else {
    results.push(`🔔 usernotifications: موجود (${notifCount} سجل) ✅`);
  }

  // 7. Analytics - سجل تجريبي للبدء
  const analyticCount = await db.collection('analytics').countDocuments();
  if (analyticCount === 0) {
    await db.collection('analytics').insertOne({
      tenantId,
      event: 'system_initialized',
      data: { version: process.env.SYSTEM_VERSION || '2.0.0', timestamp: new Date() },
      createdAt: new Date(), updatedAt: new Date()
    });
    results.push('📊 analytics: أُضيف سجل تهيئة النظام');
  } else {
    results.push(`📊 analytics: موجود (${analyticCount} سجل) ✅`);
  }

  results.forEach(r => console.log('  ' + r));
  return results;
}

// ===================================================
// فحص شامل لكل الجداول
// ===================================================
async function checkAllCollections(db) {
  console.log('\n📊 حالة الجداول:\n');

  const existingCols = await db.listCollections().toArray();
  const existingNames = new Set(existingCols.map(c => c.name));

  const report = { total: 0, hasData: 0, empty: 0, missing: 0 };

  for (const [section, tables] of Object.entries(DB_SECTIONS)) {
    console.log(`${section}`);
    for (const table of tables) {
      report.total++;
      if (!existingNames.has(table)) {
        console.log(`    ❌ ${table.padEnd(35)} — غير موجود`);
        report.missing++;
      } else {
        const count = await db.collection(table).countDocuments();
        const icon = count > 0 ? '✅' : '⚠️ ';
        const status = count > 0 ? `${count} سجل` : 'فارغ';
        console.log(`    ${icon} ${table.padEnd(35)} — ${status}`);
        if (count > 0) report.hasData++; else report.empty++;
      }
    }
    console.log('');
  }

  return report;
}

// ===================================================
// الدالة الرئيسية
// ===================================================
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🗄️  تنظيم قاعدة البيانات — HMCar      ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log('🔗 الاتصال بـ:', MONGO_URI.replace(/:([^@]+)@/, ':***@'));

  let conn;
  try {
    conn = await mongoose.createConnection(MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    }).asPromise();
    console.log('✅ متصل بقاعدة البيانات\n');
  } catch (err) {
    console.error('❌ فشل الاتصال:', err.message);
    console.log('\n💡 تأكد من:');
    console.log('   1. اتصالك بالإنترنت');
    console.log('   2. صحة MONGO_URI في .env.local');
    console.log('   3. السماح لـ IP الخاص بك في MongoDB Atlas Network Access');
    process.exit(1);
  }

  const db = conn.db;

  try {
    // --- فحص الجداول ---
    if (DO_ALL || CHECK_ONLY) {
      const report = await checkAllCollections(db);
      console.log('═══════════════════════════════════════════');
      console.log(`📈 الإجمالي: ${report.total} جدول`);
      console.log(`  ✅ بها بيانات: ${report.hasData}`);
      console.log(`  ⚠️  فارغة: ${report.empty}`);
      console.log(`  ❌ غير موجودة: ${report.missing}`);
      console.log('═══════════════════════════════════════════');
    }

    if (CHECK_ONLY) {
      console.log('\n✅ انتهى الفحص.');
      await conn.close();
      process.exit(0);
    }

    // --- إنشاء الفهارس ---
    if (DO_ALL || INDEXES_ONLY) {
      await createAllIndexes(db);
    }

    if (INDEXES_ONLY) {
      console.log('\n✅ انتهى إنشاء الفهارس.');
      await conn.close();
      process.exit(0);
    }

    // --- ملء الجداول الفارغة ---
    if (DO_ALL || SEED_ONLY) {
      await seedEmptyCollections(db);
    }

    // --- تقرير نهائي ---
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   ✅ اكتمل التنظيم بنجاح!                ║');
    console.log('╚══════════════════════════════════════════╝\n');

    console.log('📌 ما تم إنجازه:');
    if (DO_ALL || INDEXES_ONLY) console.log('  ✅ إنشاء الفهارس لجميع الجداول');
    if (DO_ALL || SEED_ONLY)    console.log('  ✅ ملء الجداول الفارغة بالبيانات الأساسية');
    console.log('\n🚀 قاعدة البيانات جاهزة للاستخدام الإنتاجي!\n');

  } catch (err) {
    console.error('\n❌ خطأ أثناء التنفيذ:', err.message);
  } finally {
    await conn.close();
    process.exit(0);
  }
}

main();
