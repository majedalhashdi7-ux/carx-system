/**
 * سكريبت تصدير ونقل كافة البيانات الحقيقية من قاعدة البيانات المحلية إلى MongoDB Atlas
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');
const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction';
const ATLAS_URI = process.env.MONGO_URI;
const HOST = process.env.PROD_HOST || 'hmcar-system-two.vercel.app';
const SECRET = process.env.SEED_SECRET || 'hmcar-import-2026';

function postBatch(collection, documents, clearFirst = true) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      secret: SECRET,
      collection,
      documents,
      clearFirst
    });

    const options = {
      hostname: HOST,
      path: '/api/v2/system/import-batch',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Tenant-ID': 'hmcar'
      },
      timeout: 60000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('🚀 بدء نقل كافة البيانات الحقيقية إلى MongoDB Atlas السحابية...\n');
  
  const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅ متصل بقاعدة البيانات المحلية');

  const collectionsToMigrate = [
    'brands',
    'cars',
    'spareparts',
    'auctions',
    'bids',
    'invoices',
    'orders',
    'users',
    'sitesettings',
    'vehiclecategories',
    'sparebrands',
    'roles',
    'authsettings'
  ];

  for (const colName of collectionsToMigrate) {
    try {
      const col = conn.db.collection(colName);
      const docs = await col.find({}).toArray();
      console.log(`\n📦 جلب ${docs.length} سجل حقيقي من [${colName}]...`);

      if (docs.length === 0) {
        console.log(`⏩ [${colName}] فارغة، تخطي.`);
        continue;
      }

      // Send in batches of 25 to avoid payload limits
      const BATCH_SIZE = 25;
      let totalInserted = 0;

      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = docs.slice(i, i + BATCH_SIZE);
        const isFirst = (i === 0);
        process.stdout.write(`   رفع الدفعة ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(docs.length / BATCH_SIZE)} (${batch.length} سجل)... `);
        
        const res = await postBatch(colName, batch, isFirst);
        if (res.status === 200 && res.body?.success) {
          totalInserted += res.body.inserted;
          console.log(`✅ تم! (إجمالي Atlas: ${res.body.total})`);
        } else {
          console.log(`❌ فشل HTTP ${res.status}:`, res.body);
        }
      }

      console.log(`✨ اكتمل نقل [${colName}]: تم نقل ${totalInserted}/${docs.length} سجل.`);
    } catch (err) {
      console.error(`❌ خطأ في نقل [${colName}]:`, err.message);
    }
  }

  await conn.close();
  console.log('\n🎉 تم الانتهاء بنجاح من نقل كافة البيانات الحقيقية إلى قاعدة البيانات السحابية Atlas!');
}

run().catch(console.error);
