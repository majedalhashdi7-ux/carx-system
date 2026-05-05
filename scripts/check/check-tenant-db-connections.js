#!/usr/bin/env node

// [[ARABIC_HEADER]] هذا السكريبت يتحقق من اتصال كل معرض بقاعدة البيانات الخاصة به.
// يستخدم إعدادات المعارض في tenants/tenants.json ويحل القيم من متغيرات البيئة.

require('dotenv').config();
const mongoose = require('mongoose');
const { getAllTenants } = require('../../tenants/tenant-resolver');

const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 5,
  bufferCommands: false,
  family: 4,
};

function sanitizeUri(uri) {
  if (!uri) return uri;
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

function isValidMongoUri(uri) {
  return typeof uri === 'string' && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'));
}

async function testConnection(tenantId, uri) {
  const connection = mongoose.createConnection(uri, options);
  try {
    await connection.asPromise();
    await connection.db.admin().ping();
    return { tenantId, uri, ok: true };
  } finally {
    try {
      await connection.close();
    } catch (error) {
      // ignore close errors
    }
  }
}

async function run() {
  const tenants = getAllTenants();

  if (!tenants.length) {
    console.error('❌ لم يتم العثور على أي معرض في tenants/tenants.json');
    process.exit(1);
  }

  console.log('🔍 فحص اتصالات قواعد البيانات لكل معرض...\n');

  let passed = 0;
  let failed = 0;

  for (const tenant of tenants) {
    const tenantId = tenant.id;
    const name = tenant.name || tenantId;
    const uri = tenant.mongoUri;

    console.log(`🚀 ${name} (${tenantId})`);

    if (!uri) {
      console.log('   ❌ لم يتم تحديد MongoDB URI لهذا المعرض. تحقق من متغيرات البيئة أو tenants/tenants.json.\n');
      failed += 1;
      continue;
    }

    if (!isValidMongoUri(uri)) {
      console.log(`   ❌ URI غير صالح: ${sanitizeUri(uri)}\n`);
      failed += 1;
      continue;
    }

    console.log(`   🔗 محاولة الاتصال: ${sanitizeUri(uri)}`);

    try {
      await testConnection(tenantId, uri);
      console.log('   ✅ الاتصال ناجح\n');
      passed += 1;
    } catch (error) {
      console.log(`   ❌ فشل الاتصال: ${error.message}\n`);
      failed += 1;
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ ناجح: ${passed}`);
  console.log(`❌ فشل: ${failed}`);
  console.log('═══════════════════════════════════════════════════════');

  process.exit(failed === 0 ? 0 : 1);
}

run().catch(error => {
  console.error('❌ حدث خطأ غير متوقع:', error.message);
  process.exit(1);
});
