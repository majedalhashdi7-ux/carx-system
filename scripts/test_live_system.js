/**
 * اختبار النظام الكامل عبر الإنترنت - HM CAR Production
 */
const https = require('https');

const BASE = 'hmcar-system-two.vercel.app';

function get(path) {
  return new Promise((resolve) => {
    const opts = {
      hostname: BASE,
      path,
      method: 'GET',
      headers: { 'X-Tenant-ID': 'hmcar', 'Content-Type': 'application/json' },
      timeout: 12000
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data.slice(0, 200) }); }
      });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    req.end();
  });
}

const G = '\x1b[32m✅\x1b[0m';
const R = '\x1b[31m❌\x1b[0m';
const W = '\x1b[33m⚠️\x1b[0m';
const I = '\x1b[36mℹ️\x1b[0m';

async function test() {
  console.log(`\n\x1b[1m\x1b[34m🔍 اختبار نظام HM CAR عبر الإنترنت\x1b[0m`);
  console.log(`   URL: https://${BASE}\n`);

  // 1. Health check
  process.stdout.write('  [1] فحص Health API ... ');
  const health = await get('/api/v2/health');
  if (health.status === 200) {
    console.log(`${G} HTTP ${health.status} | status: ${health.body?.status || 'ok'}`);
    if (health.body?.database) console.log(`      ${I} قاعدة البيانات: ${health.body.database}`);
  } else {
    console.log(`${R} HTTP ${health.status} | ${health.error || JSON.stringify(health.body).slice(0,100)}`);
  }

  // 2. Cars API
  process.stdout.write('  [2] فحص API السيارات ... ');
  const cars = await get('/api/v2/cars?limit=5');
  if (cars.status === 200) {
    const count = cars.body?.total || cars.body?.data?.length || cars.body?.cars?.length || 0;
    console.log(`${G} HTTP ${cars.status} | عدد السيارات: ${count}`);
  } else {
    console.log(`${W} HTTP ${cars.status} | ${cars.error || JSON.stringify(cars.body).slice(0,100)}`);
  }

  // 3. Brands API
  process.stdout.write('  [3] فحص API الوكالات ... ');
  const brands = await get('/api/v2/brands');
  if (brands.status === 200) {
    const count = brands.body?.data?.length || brands.body?.brands?.length || 0;
    console.log(`${G} HTTP ${brands.status} | عدد الوكالات: ${count}`);
  } else {
    console.log(`${W} HTTP ${brands.status} | ${brands.error || JSON.stringify(brands.body).slice(0,100)}`);
  }

  // 4. Parts API
  process.stdout.write('  [4] فحص API قطع الغيار ... ');
  const parts = await get('/api/v2/parts?limit=5');
  if (parts.status === 200) {
    const count = parts.body?.total || parts.body?.data?.length || parts.body?.parts?.length || 0;
    console.log(`${G} HTTP ${parts.status} | عدد قطع الغيار: ${count}`);
  } else {
    console.log(`${W} HTTP ${parts.status} | ${parts.error || JSON.stringify(parts.body).slice(0,100)}`);
  }

  // 5. Auctions API
  process.stdout.write('  [5] فحص API المزادات ... ');
  const auctions = await get('/api/v2/auctions');
  if (auctions.status === 200) {
    const count = auctions.body?.total || auctions.body?.data?.length || auctions.body?.auctions?.length || 0;
    console.log(`${G} HTTP ${auctions.status} | عدد المزادات: ${count}`);
  } else {
    console.log(`${W} HTTP ${auctions.status} | ${auctions.error || JSON.stringify(auctions.body).slice(0,100)}`);
  }

  // 6. Frontend page
  process.stdout.write('  [6] فحص الواجهة الأمامية (Frontend) ... ');
  const frontend = await get('/');
  if (frontend.status === 200 || frontend.status === 307 || frontend.status === 301) {
    console.log(`${G} HTTP ${frontend.status} | الصفحة الرئيسية تستجيب`);
  } else {
    console.log(`${W} HTTP ${frontend.status}`);
  }

  console.log(`\n\x1b[1m  🌐 الرابط المباشر: https://${BASE}\x1b[0m\n`);
}

test().catch(console.error);
