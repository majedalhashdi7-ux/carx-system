#!/usr/bin/env node

/**
 * سكريبت فحص شامل للنظام Multi-Tenant
 * يفحص: المعارض، قواعد البيانات، الدومينات، الملفات
 */

const fs = require('fs');
const path = require('path');
const { getAllTenants, getTenantById } = require('../tenants/tenant-resolver');

console.log('\n═══════════════════════════════════════════════════════');
console.log('   🔍 فحص نظام Multi-Tenant');
console.log('═══════════════════════════════════════════════════════\n');

// ── 1. فحص ملف tenants.json ──
console.log('📋 فحص ملف التكوين...\n');

const tenantsFile = path.join(__dirname, '..', 'tenants', 'tenants.json');
if (!fs.existsSync(tenantsFile)) {
  console.error('❌ ملف tenants.json غير موجود!');
  process.exit(1);
}

let config;
try {
  const raw = fs.readFileSync(tenantsFile, 'utf8');
  config = JSON.parse(raw);
  console.log('✅ ملف tenants.json صحيح');
} catch (err) {
  console.error('❌ خطأ في قراءة tenants.json:', err.message);
  process.exit(1);
}

// ── 2. عرض المعارض ──
console.log(`\n📊 المعارض المسجلة: ${Object.keys(config.tenants).length}\n`);

const tenants = getAllTenants();
console.log(`✅ المعارض المفعّلة: ${tenants.length}\n`);

tenants.forEach((tenant, i) => {
  console.log(`${i + 1}. ${tenant.name} (${tenant.id})`);
  console.log(`   الاسم بالإنجليزي: ${tenant.nameEn}`);
  console.log(`   الدومينات: ${tenant.domains.join(', ')}`);
  console.log(`   اللون الأساسي: ${tenant.theme.primaryColor}`);
  console.log('');
});

// ── 3. فحص الملفات (الشعارات والأيقونات) ──
console.log('📁 فحص الملفات...\n');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'tenants');
if (!fs.existsSync(uploadsDir)) {
  console.warn('⚠️  مجلد uploads/tenants غير موجود');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ تم إنشاء المجلد');
}

for (const tenant of tenants) {
  const fullTenant = getTenantById(tenant.id);
  if (!fullTenant) continue;

  const tenantDir = path.join(uploadsDir, tenant.id);
  const logoPath = fullTenant.logo ? path.join(__dirname, '..', fullTenant.logo) : null;
  const faviconPath = fullTenant.favicon ? path.join(__dirname, '..', fullTenant.favicon) : null;

  console.log(`📂 ${tenant.name} (${tenant.id}):`);

  // فحص المجلد
  if (!fs.existsSync(tenantDir)) {
    console.log('   ⚠️  المجلد غير موجود');
  } else {
    console.log('   ✅ المجلد موجود');
  }

  // فحص الشعار
  if (!logoPath) {
    console.log('   ⚠️  لم يتم تحديد مسار الشعار');
  } else if (!fs.existsSync(logoPath)) {
    console.log('   ❌ الشعار غير موجود:', fullTenant.logo);
  } else {
    const stats = fs.statSync(logoPath);
    console.log(`   ✅ الشعار موجود (${(stats.size / 1024).toFixed(2)} KB)`);
  }

  // فحص الأيقونة
  if (!faviconPath) {
    console.log('   ⚠️  لم يتم تحديد مسار الأيقونة');
  } else if (!fs.existsSync(faviconPath)) {
    console.log('   ❌ الأيقونة غير موجودة:', fullTenant.favicon);
  } else {
    const stats = fs.statSync(faviconPath);
    console.log(`   ✅ الأيقونة موجودة (${(stats.size / 1024).toFixed(2)} KB)`);
  }

  console.log('');
}

// ── 4. فحص قواعد البيانات ──
console.log('🔗 فحص قواعد البيانات...\n');

for (const tenant of tenants) {
  const fullTenant = getTenantById(tenant.id);
  console.log(`${tenant.name} (${tenant.id}):`);

  if (!fullTenant.mongoUri) {
    console.log('   ❌ لا يوجد mongoUri');
  } else if (fullTenant.mongoUri.startsWith('ENV:')) {
    console.log(`   ⚠️  يستخدم متغير بيئة: ${fullTenant.mongoUri}`);
  } else if (fullTenant.mongoUri.includes('mongodb')) {
    console.log('   ✅ URI صحيح');
    // إخفاء كلمة المرور
    const safeUri = fullTenant.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`   📍 ${safeUri.substring(0, 60)}...`);
  } else {
    console.log('   ❌ URI غير صحيح');
  }

  console.log('');
}

// ── 5. فحص الدومينات ──
console.log('🌐 فحص الدومينات...\n');

const allDomains = [];
for (const tenant of tenants) {
  for (const domain of tenant.domains) {
    allDomains.push({ domain, tenant: tenant.id });
  }
}

console.log(`إجمالي الدومينات: ${allDomains.length}\n`);

// تجميع حسب النوع
const localhost = allDomains.filter(d => d.domain.includes('localhost'));
const vercel = allDomains.filter(d => d.domain.includes('vercel.app'));
const custom = allDomains.filter(d => !d.domain.includes('localhost') && !d.domain.includes('vercel.app'));

if (localhost.length > 0) {
  console.log('🏠 دومينات محلية:');
  localhost.forEach(d => console.log(`   - ${d.domain} → ${d.tenant}`));
  console.log('');
}

if (vercel.length > 0) {
  console.log('☁️  دومينات Vercel:');
  vercel.forEach(d => console.log(`   - ${d.domain} → ${d.tenant}`));
  console.log('');
}

if (custom.length > 0) {
  console.log('🌍 دومينات مخصصة:');
  custom.forEach(d => console.log(`   - ${d.domain} → ${d.tenant}`));
  console.log('');
}

// ── 6. فحص التكرارات ──
console.log('🔍 فحص التكرارات...\n');

const domainMap = new Map();
for (const { domain, tenant } of allDomains) {
  if (!domainMap.has(domain)) {
    domainMap.set(domain, []);
  }
  domainMap.get(domain).push(tenant);
}

let hasDuplicates = false;
for (const [domain, tenants] of domainMap) {
  if (tenants.length > 1) {
    console.log(`⚠️  الدومين "${domain}" مستخدم في عدة معارض:`);
    tenants.forEach(t => console.log(`   - ${t}`));
    console.log('');
    hasDuplicates = true;
  }
}

if (!hasDuplicates) {
  console.log('✅ لا توجد دومينات مكررة\n');
}

// ── 7. الخلاصة ──
console.log('═══════════════════════════════════════════════════════');
console.log('   📊 الخلاصة');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`✅ المعارض المفعّلة: ${tenants.length}`);
console.log(`🌐 إجمالي الدومينات: ${allDomains.length}`);
console.log(`🏠 دومينات محلية: ${localhost.length}`);
console.log(`☁️  دومينات Vercel: ${vercel.length}`);
console.log(`🌍 دومينات مخصصة: ${custom.length}`);

// فحص الملفات الناقصة
let missingFiles = 0;
for (const tenant of tenants) {
  const fullTenant = getTenantById(tenant.id);
  if (!fullTenant) continue;

  const logoPath = fullTenant.logo ? path.join(__dirname, '..', fullTenant.logo) : null;
  const faviconPath = fullTenant.favicon ? path.join(__dirname, '..', fullTenant.favicon) : null;

  if (logoPath && !fs.existsSync(logoPath)) missingFiles++;
  if (faviconPath && !fs.existsSync(faviconPath)) missingFiles++;
}

if (missingFiles > 0) {
  console.log(`⚠️  ملفات ناقصة: ${missingFiles}`);
} else {
  console.log('✅ جميع الملفات موجودة');
}

console.log('\n═══════════════════════════════════════════════════════\n');

// ── 8. نصائح ──
console.log('💡 نصائح:\n');

if (custom.length === 0) {
  console.log('- لم يتم ربط أي دومينات مخصصة بعد');
  console.log('- استخدم Vercel Dashboard لإضافة دومينات');
}

if (missingFiles > 0) {
  console.log('- بعض الشعارات أو الأيقونات ناقصة');
  console.log('- ضع الملفات في: uploads/tenants/[tenant-id]/');
}

if (hasDuplicates) {
  console.log('- يوجد دومينات مكررة، قد يسبب مشاكل');
  console.log('- تأكد أن كل دومين مرتبط بمعرض واحد فقط');
}

console.log('\n✅ انتهى الفحص!\n');
