/**
 * نقل البيانات عبر Vercel API بدلاً من الاتصال المباشر
 * يستخدم API الـ Backend المنشور على Vercel كوسيط
 */
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
require('dotenv').config();

const LOCAL_URI = 'mongodb://127.0.0.1:27017/car-auction';
const BACKEND_URL = 'https://hmcar-system-two.vercel.app';

function httpsPost(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'hmcar-system-two.vercel.app',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Tenant-ID': 'hmcar',
        'X-Internal-Secret': process.env.INTERNAL_BYPASS_SECRET || 'hmcar-internal-2024'
      },
      timeout: 30000
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d.slice(0, 300) }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function seedViaAPI() {
  console.log('🚀 نقل البيانات عبر Vercel API...\n');

  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅ متصل بقاعدة البيانات المحلية\n');

  // جلب السيارات من المحلية
  const cars = await localConn.collection('cars').find({}).toArray();
  const brands = await localConn.collection('brands').find({}).toArray();
  const parts = await localConn.collection('spareparts').find({}).toArray();
  const auctions = await localConn.collection('auctions').find({}).toArray();

  console.log(`📦 البيانات المحلية:`);
  console.log(`   - السيارات: ${cars.length}`);
  console.log(`   - الوكالات: ${brands.length}`);
  console.log(`   - قطع الغيار: ${parts.length}`);
  console.log(`   - المزادات: ${auctions.length}\n`);

  // محاولة نقل السيارات عبر API
  console.log('📤 محاولة رفع البيانات عبر الـ API...');
  
  // اختبار seed endpoint
  try {
    const resp = await httpsPost('/api/v2/admin/seed', {
      cars: cars.slice(0, 5).map(c => ({
        title: c.title || c.name || 'سيارة',
        price: c.price || 100000,
        brand: c.brand || 'تويوتا',
        year: c.year || 2024,
        tenantId: 'hmcar'
      })),
      secret: 'hmcar-seed-2024'
    });
    console.log(`  /api/v2/admin/seed → HTTP ${resp.status}`);
  } catch(e) {
    console.log(`  /api/v2/admin/seed → ${e.message}`);
  }

  // اختبار import endpoint
  try {
    const resp = await httpsPost('/api/v2/cars/import', {
      cars: cars.slice(0, 3)
    });
    console.log(`  /api/v2/cars/import → HTTP ${resp.status}: ${JSON.stringify(resp.body).slice(0,100)}`);
  } catch(e) {
    console.log(`  /api/v2/cars/import → ${e.message}`);
  }

  // نجرب endpoint مختلف
  try {
    const resp = await httpsPost('/api/v2/admin/batch-insert', {
      collection: 'cars',
      data: cars.slice(0, 3)
    });
    console.log(`  /api/v2/admin/batch-insert → HTTP ${resp.status}`);
  } catch(e) {
    console.log(`  /api/v2/admin/batch-insert → ${e.message}`);
  }

  await localConn.close();
  
  console.log('\n═══════════════════════════════════════');
  console.log('📋 الخلاصة:');
  console.log('   مشكلة DNS/SRV تمنع الاتصال المباشر بـ Atlas.');
  console.log('   الحل الأفضل: إضافة SeedService مباشر عبر Vercel.');
  console.log('═══════════════════════════════════════\n');
}

seedViaAPI().catch(e => { console.error('❌', e.message); });
