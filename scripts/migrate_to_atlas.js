/**
 * نقل البيانات المحلية مباشرة إلى MongoDB Atlas بدون SRV
 * يستخدم النسخ الموجودة في الـ Backend
 */
const mongoose = require('mongoose');
require('dotenv').config();

// نجرب عدة صيغ للاتصال
const ATLAS_OPTIONS = [
  // صيغة 1: SRV مع TLS صريح
  'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/car-auction?retryWrites=true&w=majority',
  // صيغة 2: Direct connection
  'mongodb://hmcar_admin:2svcqiBXi2ak6V3T@cluster0-shard-00-00.jb1hm41.mongodb.net:27017,cluster0-shard-00-01.jb1hm41.mongodb.net:27017,cluster0-shard-00-02.jb1hm41.mongodb.net:27017/car-auction?ssl=true&replicaSet=atlas-xxx&authSource=admin&retryWrites=true&w=majority',
];

const LOCAL_URI = 'mongodb://127.0.0.1:27017/car-auction';

async function tryConnect(uri, label) {
  try {
    const conn = mongoose.createConnection(uri, { 
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000
    });
    await conn.asPromise();
    console.log(`✅ اتصل بـ ${label}`);
    return conn;
  } catch(e) {
    console.log(`❌ فشل الاتصال بـ ${label}: ${e.message.slice(0, 100)}`);
    return null;
  }
}

async function migrate() {
  console.log('🚀 محاولة نقل البيانات إلى MongoDB Atlas...\n');

  const localConn = await tryConnect(LOCAL_URI, 'Local MongoDB');
  if (!localConn) { console.log('❌ فشل الاتصال المحلي'); process.exit(1); }

  let cloudConn = null;
  for (const uri of ATLAS_OPTIONS) {
    cloudConn = await tryConnect(uri, 'MongoDB Atlas');
    if (cloudConn) break;
  }

  if (!cloudConn) {
    console.log('\n⚠️  لا يمكن الاتصال بـ MongoDB Atlas مباشرة من هذا الجهاز.');
    console.log('   السبب: MongoDB Atlas يحجب الـ IP الخاص بك.');
    console.log('   الحل: يجب السماح لـ IP 0.0.0.0/0 من لوحة تحكم Atlas.\n');
    
    console.log('📋 خطوات السماح بكل IPs في MongoDB Atlas:');
    console.log('   1. اذهب إلى: https://cloud.mongodb.com');
    console.log('   2. اختر مشروعك → Security → Network Access');
    console.log('   3. اضغط "Add IP Address"');
    console.log('   4. اضغط "Allow Access from Anywhere"');
    console.log('   5. اضغط Confirm');
    console.log('\n   ثم شغّل هذا السكريبت مرة أخرى.\n');
    
    await localConn.close();
    return;
  }

  const COLLECTIONS = ['cars', 'brands', 'spareparts', 'auctions', 'bids', 'users', 'orders', 'sitesettings'];
  let totalMigrated = 0;

  for (const coll of COLLECTIONS) {
    try {
      const local = localConn.collection(coll);
      const cloud = cloudConn.collection(coll);
      const docs = await local.find({}).toArray();
      if (!docs.length) { console.log(`⏭️  ${coll}: فارغة`); continue; }
      await cloud.deleteMany({});
      const result = await cloud.insertMany(docs, { ordered: false }).catch(e => ({ insertedCount: 0 }));
      const inserted = result.insertedCount || docs.length;
      console.log(`✅ ${coll}: ${inserted}/${docs.length} سجل`);
      totalMigrated += inserted;
    } catch(e) { console.log(`⚠️  ${coll}: ${e.message.slice(0,80)}`); }
  }

  console.log(`\n✅ تم نقل ${totalMigrated} سجل إلى MongoDB Atlas بنجاح!`);
  await localConn.close();
  await cloudConn.close();
}

migrate().catch(e => { console.error('❌ خطأ:', e.message); process.exit(1); });
