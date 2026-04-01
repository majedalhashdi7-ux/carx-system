#!/usr/bin/env node

/**
 * سكريبت لإضافة عميل (معرض) جديد بسهولة
 * 
 * الاستخدام:
 *   node scripts/add-tenant.js
 * 
 * أو مباشرة:
 *   npm run add:tenant
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🚀 إضافة عميل (معرض) جديد\n');
  console.log('═'.repeat(50));
  
  // جمع المعلومات
  const id = await question('\n1️⃣  معرف المعرض (بالإنجليزي، بدون مسافات): ');
  const nameAr = await question('2️⃣  اسم المعرض (بالعربي): ');
  const nameEn = await question('3️⃣  اسم المعرض (بالإنجليزي): ');
  const domain = await question('4️⃣  الدومين (مثال: alwaha-cars.com): ');
  const mongoUri = await question('5️⃣  MongoDB URI: ');
  const whatsapp = await question('6️⃣  رقم الواتساب (مثال: +966501234567): ');
  const email = await question('7️⃣  البريد الإلكتروني: ');
  const primaryColor = await question('8️⃣  اللون الأساسي (مثال: #2ecc71): ');
  
  console.log('\n📋 معاينة البيانات:');
  console.log('═'.repeat(50));
  console.log(`المعرف: ${id}`);
  console.log(`الاسم: ${nameAr} / ${nameEn}`);
  console.log(`الدومين: ${domain}`);
  console.log(`اللون: ${primaryColor}`);
  console.log('═'.repeat(50));
  
  const confirm = await question('\n✅ هل البيانات صحيحة؟ (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ تم الإلغاء');
    rl.close();
    return;
  }
  
  // قراءة ملف tenants.json
  const tenantsFile = path.join(__dirname, '..', 'tenants', 'tenants.json');
  let config;
  
  try {
    const raw = fs.readFileSync(tenantsFile, 'utf8');
    config = JSON.parse(raw);
  } catch (err) {
    console.error('❌ فشل قراءة ملف tenants.json:', err.message);
    rl.close();
    return;
  }
  
  // التحقق من عدم وجود المعرف
  if (config.tenants[id]) {
    console.error(`❌ المعرض "${id}" موجود بالفعل!`);
    rl.close();
    return;
  }
  
  // إنشاء بيانات المعرض الجديد
  const newTenant = {
    id: id,
    name: nameAr,
    nameEn: nameEn,
    description: `${nameAr} للسيارات`,
    descriptionEn: `${nameEn} Cars Showroom`,
    domains: [domain, `www.${domain}`],
    mongoUri: mongoUri,
    logo: `/uploads/tenants/${id}/logo.png`,
    favicon: `/uploads/tenants/${id}/favicon.ico`,
    theme: {
      primaryColor: primaryColor,
      secondaryColor: adjustColor(primaryColor, -20),
      accentColor: '#3498db',
      backgroundColor: '#ffffff',
      textColor: '#2c3e50'
    },
    contact: {
      whatsapp: whatsapp,
      email: email,
      phone: whatsapp
    },
    settings: {
      currency: 'SAR',
      language: 'ar',
      direction: 'rtl'
    },
    enabled: true
  };
  
  // إضافة المعرض
  config.tenants[id] = newTenant;
  
  // حفظ الملف
  try {
    fs.writeFileSync(tenantsFile, JSON.stringify(config, null, 2), 'utf8');
    console.log('\n✅ تم إضافة المعرض بنجاح!');
  } catch (err) {
    console.error('❌ فشل حفظ الملف:', err.message);
    rl.close();
    return;
  }
  
  // إنشاء مجلد الشعار
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'tenants', id);
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ تم إنشاء مجلد: ${uploadsDir}`);
  } catch (err) {
    console.warn('⚠️  فشل إنشاء مجلد الشعار:', err.message);
  }
  
  // تعليمات ما بعد الإضافة
  console.log('\n📌 الخطوات التالية:');
  console.log('═'.repeat(50));
  console.log(`1. ضع الشعار في: uploads/tenants/${id}/logo.png`);
  console.log(`2. ضع الأيقونة في: uploads/tenants/${id}/favicon.ico`);
  console.log(`3. اضبط DNS للدومين ${domain}:`);
  console.log('   Type: A, Name: @, Value: [IP السيرفر]');
  console.log('   Type: A, Name: www, Value: [IP السيرفر]');
  console.log(`4. أعد تشغيل السيرفر`);
  console.log(`5. اختبر: https://${domain}?tenant=${id}`);
  console.log('═'.repeat(50));
  
  rl.close();
}

/**
 * تعديل لون (تفتيح أو تغميق)
 */
function adjustColor(color, amount) {
  const clamp = (val) => Math.min(255, Math.max(0, val));
  
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  r = clamp(r + amount);
  g = clamp(g + amount);
  b = clamp(b + amount);
  
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

main().catch(console.error);
