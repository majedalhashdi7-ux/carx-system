#!/usr/bin/env node

/**
 * سكريبت لعرض قائمة كل العملاء (المعارض)
 * 
 * الاستخدام:
 *   node scripts/list-tenants.js
 * 
 * أو:
 *   npm run list:tenants
 */

const fs = require('fs');
const path = require('path');

function main() {
  console.log('\n📋 قائمة العملاء (المعارض)\n');
  console.log('═'.repeat(80));
  
  // قراءة ملف tenants.json
  const tenantsFile = path.join(__dirname, '..', 'tenants', 'tenants.json');
  let config;
  
  try {
    const raw = fs.readFileSync(tenantsFile, 'utf8');
    config = JSON.parse(raw);
  } catch (err) {
    console.error('❌ فشل قراءة ملف tenants.json:', err.message);
    return;
  }
  
  const tenants = config.tenants || {};
  const tenantIds = Object.keys(tenants);
  
  if (tenantIds.length === 0) {
    console.log('⚠️  لا يوجد معارض مسجلة');
    return;
  }
  
  console.log(`\n📊 المجموع: ${tenantIds.length} معرض\n`);
  
  // عرض كل معرض
  tenantIds.forEach((id, index) => {
    const tenant = tenants[id];
    const status = tenant.enabled ? '✅ مفعّل' : '❌ معطّل';
    const isDefault = id === config.defaultTenant ? '⭐ افتراضي' : '';
    
    console.log(`${index + 1}. ${tenant.name} (${tenant.nameEn})`);
    console.log(`   المعرف: ${id} ${isDefault}`);
    console.log(`   الحالة: ${status}`);
    console.log(`   الدومينات: ${tenant.domains.join(', ')}`);
    console.log(`   اللون الأساسي: ${tenant.theme.primaryColor}`);
    console.log(`   الواتساب: ${tenant.contact.whatsapp}`);
    console.log(`   البريد: ${tenant.contact.email}`);
    
    // التحقق من وجود الشعار
    const logoPath = path.join(__dirname, '..', tenant.logo);
    const logoExists = fs.existsSync(logoPath);
    console.log(`   الشعار: ${logoExists ? '✅ موجود' : '❌ غير موجود'}`);
    
    // التحقق من قاعدة البيانات
    if (tenant.mongoUri) {
      if (tenant.mongoUri.startsWith('ENV:')) {
        const envVar = tenant.mongoUri.substring(4);
        const hasEnv = !!process.env[envVar];
        console.log(`   قاعدة البيانات: ${hasEnv ? '✅' : '❌'} ${envVar}`);
      } else {
        console.log(`   قاعدة البيانات: ✅ مباشر`);
      }
    } else {
      console.log(`   قاعدة البيانات: ❌ غير محدد`);
    }
    
    console.log('');
  });
  
  console.log('═'.repeat(80));
  
  // إحصائيات
  const enabled = tenantIds.filter(id => tenants[id].enabled).length;
  const disabled = tenantIds.length - enabled;
  
  console.log('\n📈 الإحصائيات:');
  console.log(`   المعارض المفعّلة: ${enabled}`);
  console.log(`   المعارض المعطّلة: ${disabled}`);
  console.log(`   المعرض الافتراضي: ${config.defaultTenant}`);
  console.log('');
}

main();
