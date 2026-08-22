/**
 * migrate_to_cloud_db.js
 * سكريبت ترحيل ونقل قاعدة البيانات المحلية إلى السحابة (MongoDB Atlas / Production DB)
 * الاستخدام:
 *   node scripts/migrate_to_cloud_db.js "mongodb+srv://<user>:<password>@cluster.mongodb.net/car-auction?retryWrites=true&w=majority"
 */

const mongoose = require('mongoose');
require('dotenv').config();

const targetUri = process.argv[2] || process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI_ATLAS;

async function migrate() {
  console.log('====================================================');
  console.log('🚀 بدء ترحيل ونقل قاعدة البيانات إلى السحابة');
  console.log('====================================================\n');

  if (!targetUri || targetUri.includes('127.0.0.1') || targetUri.includes('localhost')) {
    console.log('💡 لم يتم تحديد رابط سحابي خارجي كمعامل للسكريبت.');
    console.log('👉 الاستخدام: node scripts/migrate_to_cloud_db.js "mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/car-auction"');
    console.log('\nسوف نقوم باختبار التجهيز والتحقق من حجم البيانات الجاهزة للترحيل:');
  }

  const sourceConn = await mongoose.createConnection(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
  console.log('✅ تم الاتصال بقاعدة البيانات المصدرية المحلية.');

  const schemas = {
    Car: require('../models/Car').schema,
    SparePart: require('../models/SparePart').schema,
    Brand: require('../models/Brand').schema,
    Auction: require('../models/Auction').schema,
    User: require('../models/User').schema,
    SiteSettings: require('../models/SiteSettings').schema,
  };

  const counts = {};
  for (const [name, schema] of Object.entries(schemas)) {
    const Model = sourceConn.model(name, schema);
    counts[name] = await Model.countDocuments();
    console.log(`📦 [${name}]: ${counts[name]} سجل جاهز للترحيل`);
  }

  if (targetUri && !targetUri.includes('127.0.0.1') && !targetUri.includes('localhost')) {
    console.log(`\n🌐 جاري الاتصال بقاعدة البيانات السحابية المستهدفة...`);
    const targetConn = await mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 10000 }).asPromise();
    console.log('✅ تم الاتصال بقاعدة البيانات السحابية بنجاح.');

    for (const [name, schema] of Object.entries(schemas)) {
      const SourceModel = sourceConn.model(name, schema);
      const TargetModel = targetConn.model(name, schema);

      const docs = await SourceModel.find().lean();
      if (docs.length > 0) {
        console.log(`⏳ جاري رفع ${docs.length} سجل إلى جدول ${name}...`);
        await TargetModel.deleteMany({});
        await TargetModel.insertMany(docs);
        console.log(`✅ تم ترحيل جدول ${name} بنجاح!`);
      }
    }

    await targetConn.close();
    console.log('\n🎉 اكتمل الترحيل السحابي لقاعدة البيانات بنجاح 100%!');
  } else {
    console.log('\n✨ جميع البيانات جاهزة 100% للترحيل الفوري عند تزويد الرابط السحابي.');
  }

  await sourceConn.close();
}

migrate().catch(err => {
  console.error('❌ حدث خطأ أثناء الترحيل:', err.message);
  process.exit(1);
});
