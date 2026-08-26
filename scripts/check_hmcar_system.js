/**
 * فحص شامل لنظام HM CAR - قاعدة البيانات والبيانات والإعدادات
 */
const mongoose = require('mongoose');
require('dotenv').config();

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const pass = (msg) => console.log(`${COLORS.green}  ✅ ${msg}${COLORS.reset}`);
const fail = (msg) => console.log(`${COLORS.red}  ❌ ${msg}${COLORS.reset}`);
const warn = (msg) => console.log(`${COLORS.yellow}  ⚠️  ${msg}${COLORS.reset}`);
const info = (msg) => console.log(`${COLORS.cyan}  ℹ️  ${msg}${COLORS.reset}`);
const section = (msg) => console.log(`\n${COLORS.bold}${COLORS.blue}══════════════════════════════════════${COLORS.reset}\n${COLORS.bold}  ${msg}${COLORS.reset}`);

async function runChecks() {
  let issues = 0;
  let warnings = 0;

  try {
    // === 1. DATABASE CONNECTION ===
    section('1️⃣  اتصال قاعدة البيانات');
    
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) { fail('متغير MONGO_URI غير موجود في .env'); issues++; }
    else { pass(`MONGO_URI موجود: ${mongoUri.replace(/\/\/.*@/, '//***@')}`); }

    await mongoose.connect(mongoUri);
    pass('تم الاتصال بقاعدة البيانات بنجاح ✓');
    
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    info(`اسم قاعدة البيانات: ${dbName}`);

    // === 2. CARS CHECK ===
    section('2️⃣  فحص السيارات (Cars)');
    const Car = require('../models/Car');
    
    const totalCars = await Car.countDocuments({});
    const hmcarCars = await Car.countDocuments({ tenantId: 'hmcar' });
    const activeCars = await Car.countDocuments({ tenantId: 'hmcar', isActive: true });
    const carsWithImages = await Car.countDocuments({ tenantId: 'hmcar', 'images.0': { $exists: true } });
    const carsNoImages = await Car.countDocuments({ tenantId: 'hmcar', $or: [{ images: { $size: 0 } }, { images: { $exists: false } }] });
    const carsWithPrice = await Car.countDocuments({ tenantId: 'hmcar', price: { $gt: 0 } });
    const carsWithArabicName = await Car.countDocuments({ tenantId: 'hmcar', 'title.ar': { $exists: true } });

    info(`إجمالي السيارات في قاعدة البيانات: ${totalCars}`);
    hmcarCars > 0 ? pass(`سيارات HM CAR: ${hmcarCars}`) : fail(`لا توجد سيارات بـ tenantId: hmcar!`);
    if (hmcarCars === 0) issues++;
    activeCars > 0 ? pass(`سيارات نشطة (isActive: true): ${activeCars}`) : warn(`لا توجد سيارات نشطة`);
    carsWithImages === hmcarCars ? pass(`جميع السيارات لديها صور: ${carsWithImages}/${hmcarCars}`) : warn(`سيارات بدون صور: ${carsNoImages}`);
    if (carsNoImages > 0) warnings++;
    carsWithPrice === hmcarCars ? pass(`جميع السيارات لديها أسعار: ${carsWithPrice}/${hmcarCars}`) : warn(`سيارات بدون سعر: ${hmcarCars - carsWithPrice}`);
    carsWithArabicName > 0 ? pass(`سيارات بأسماء عربية: ${carsWithArabicName}`) : warn(`لا توجد أسماء عربية للسيارات`);
    
    // عرض عينة من السيارات
    const sampleCars = await Car.find({ tenantId: 'hmcar' }).select('title price brand year images').limit(5);
    info('عينة من السيارات:');
    sampleCars.forEach(c => {
      const name = c.title?.ar || c.title?.en || c.title || 'بدون اسم';
      const imgs = (c.images || []).length;
      console.log(`     • ${name} | SAR ${c.price?.toLocaleString() || 0} | صور: ${imgs}`);
    });

    // === 3. BRANDS CHECK ===
    section('3️⃣  فحص الوكالات (Brands)');
    const Brand = require('../models/Brand');
    
    const totalBrands = await Brand.countDocuments({});
    const hmcarBrands = await Brand.countDocuments({ tenantId: 'hmcar' });
    const activeBrands = await Brand.countDocuments({ tenantId: 'hmcar', isActive: true });

    info(`إجمالي الوكالات: ${totalBrands}`);
    hmcarBrands > 0 ? pass(`وكالات HM CAR: ${hmcarBrands}`) : fail(`لا توجد وكالات بـ tenantId: hmcar!`);
    if (hmcarBrands === 0) issues++;
    activeBrands > 0 ? pass(`وكالات نشطة: ${activeBrands}`) : warn(`لا توجد وكالات نشطة`);
    
    const brandNames = await Brand.find({ tenantId: 'hmcar', isActive: true }).select('name').limit(10);
    info(`الوكالات: ${brandNames.map(b => b.name).join(', ')}`);

    // === 4. SPARE PARTS CHECK ===
    section('4️⃣  فحص قطع الغيار (Spare Parts)');
    const SparePart = require('../models/SparePart');
    
    const totalParts = await SparePart.countDocuments({});
    const hmcarParts = await SparePart.countDocuments({ tenantId: 'hmcar' });
    const inStockParts = await SparePart.countDocuments({ tenantId: 'hmcar', inStock: true });

    info(`إجمالي قطع الغيار: ${totalParts}`);
    hmcarParts > 0 ? pass(`قطع غيار HM CAR: ${hmcarParts}`) : fail(`لا توجد قطع غيار بـ tenantId: hmcar!`);
    if (hmcarParts === 0) issues++;
    inStockParts > 0 ? pass(`قطع غيار متوفرة: ${inStockParts}/${hmcarParts}`) : warn(`لا توجد قطع غيار متوفرة`);

    // === 5. AUCTIONS CHECK ===
    section('5️⃣  فحص المزادات (Auctions)');
    const Auction = require('../models/Auction');
    
    const totalAuctions = await Auction.countDocuments({});
    const hmcarAuctions = await Auction.countDocuments({ tenantId: 'hmcar' });
    const activeAuctions = await Auction.countDocuments({ tenantId: 'hmcar', status: 'active' });
    const pendingAuctions = await Auction.countDocuments({ tenantId: 'hmcar', status: 'pending' });

    info(`إجمالي المزادات: ${totalAuctions}`);
    hmcarAuctions > 0 ? pass(`مزادات HM CAR: ${hmcarAuctions}`) : warn(`لا توجد مزادات بـ tenantId: hmcar`);
    info(`مزادات نشطة: ${activeAuctions} | مزادات معلقة: ${pendingAuctions}`);

    // === 6. ENV VARIABLES CHECK ===
    section('6️⃣  فحص متغيرات البيئة (Environment Variables)');
    
    const envVars = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
    envVars.forEach(v => {
      process.env[v] ? pass(`${v}: موجود ✓`) : fail(`${v}: مفقود!`);
      if (!process.env[v]) issues++;
    });
    
    const optionalVars = ['CLOUDINARY_URL', 'SMTP_HOST', 'REDIS_URL', 'WHATSAPP_API_KEY'];
    optionalVars.forEach(v => {
      process.env[v] ? pass(`${v}: موجود ✓`) : warn(`${v}: غير مضبوط (اختياري)`);
      if (!process.env[v]) warnings++;
    });

    // === 7. PRODUCTION BACKEND URL ===
    section('7️⃣  فحص اتصال الـ Backend API');
    const https = require('https');
    await new Promise((resolve) => {
      const req = https.get('https://hmcar-system-two.vercel.app/api/v2/health', { timeout: 8000 }, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          res.statusCode === 200 ? pass(`Backend API مستجيب: HTTP ${res.statusCode}`) : warn(`Backend API: HTTP ${res.statusCode}`);
          if (res.statusCode !== 200) warnings++;
          try { const j = JSON.parse(data); info(`Backend status: ${j.status || 'unknown'}`); } catch {}
          resolve();
        });
      });
      req.on('error', (e) => { warn(`Backend API غير متاح عبر الإنترنت: ${e.message}`); warnings++; resolve(); });
      req.on('timeout', () => { warn('Backend API: انتهت مهلة الاتصال (timeout)'); warnings++; req.destroy(); resolve(); });
    });

    // === SUMMARY ===
    section('📊 ملخص فحص نظام HM CAR');
    console.log();
    if (issues === 0 && warnings === 0) {
      console.log(`${COLORS.green}${COLORS.bold}  🎉 النظام جاهز 100%! لا توجد أي مشاكل.${COLORS.reset}`);
    } else if (issues === 0) {
      console.log(`${COLORS.yellow}${COLORS.bold}  ⚠️  النظام جاهز مع ${warnings} تنبيه/تحذير بدون مشاكل جوهرية.${COLORS.reset}`);
    } else {
      console.log(`${COLORS.red}${COLORS.bold}  ❌ يوجد ${issues} مشكلة جوهرية و${warnings} تحذير تحتاج إصلاح.${COLORS.reset}`);
    }
    console.log();

  } catch (err) {
    fail(`خطأ عام في الفحص: ${err.message}`);
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

runChecks();
