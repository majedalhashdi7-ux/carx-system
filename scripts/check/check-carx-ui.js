#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 فحص تفصيلي للواجهات والصفحات في CAR X\n');
console.log('='.repeat(70) + '\n');

// فحص الصفحات
const pages = [
  { path: 'carx-system/src/app/page.tsx', name: 'الصفحة الرئيسية', priority: 'حرجة' },
  { path: 'carx-system/src/app/showroom/page.tsx', name: 'صفحة المعرض', priority: 'حرجة' },
  { path: 'carx-system/src/app/showroom/[id]/page.tsx', name: 'تفاصيل السيارة', priority: 'حرجة' },
  { path: 'carx-system/src/app/brands/page.tsx', name: 'صفحة الوكالات', priority: 'حرجة' },
  { path: 'carx-system/src/app/brands/[id]/page.tsx', name: 'تفاصيل الوكالة', priority: 'مهمة' },
  { path: 'carx-system/src/app/parts/page.tsx', name: 'صفحة قطع الغيار', priority: 'حرجة' },
  { path: 'carx-system/src/app/parts/[id]/page.tsx', name: 'تفاصيل القطعة', priority: 'مهمة' },
  { path: 'carx-system/src/app/admin/page.tsx', name: 'لوحة الإدارة', priority: 'مهمة' },
  { path: 'carx-system/src/app/admin/cars/page.tsx', name: 'إدارة السيارات', priority: 'مهمة' },
  { path: 'carx-system/src/app/admin/cars/new/page.tsx', name: 'إضافة سيارة', priority: 'مهمة' },
  { path: 'carx-system/src/app/login/page.tsx', name: 'صفحة تسجيل الدخول', priority: 'حرجة' },
];

console.log('📄 الصفحات:\n');

let criticalPages = { found: 0, missing: 0 };
let importantPages = { found: 0, missing: 0 };
let pagesWithMockData = [];
let pagesWithAPI = [];

pages.forEach(page => {
  const exists = fs.existsSync(page.path);
  const icon = exists ? '✅' : '❌';
  const status = exists ? 'موجودة' : 'مفقودة';
  
  console.log(`${icon} ${page.name.padEnd(25)} [${page.priority}] - ${status}`);
  
  if (page.priority === 'حرجة') {
    exists ? criticalPages.found++ : criticalPages.missing++;
  } else {
    exists ? importantPages.found++ : importantPages.missing++;
  }
  
  if (exists) {
    const content = fs.readFileSync(page.path, 'utf8');
    const hasAPI = content.includes('fetch(') || content.includes('api.');
    const hasMockData = content.includes('mockCars') || content.includes('mockBrands') || content.includes('mockParts');
    
    if (hasMockData) {
      console.log('   ⚠️  يستخدم بيانات وهمية (Mock Data)');
      pagesWithMockData.push(page.name);
    } else if (hasAPI) {
      console.log('   ✅ يستخدم API حقيقي');
      pagesWithAPI.push(page.name);
    } else {
      console.log('   ℹ️  لا يحتاج بيانات');
    }
  }
});

console.log('\n' + '='.repeat(70) + '\n');

// فحص المكونات
const components = [
  { name: 'Navbar', desc: 'شريط التنقل', critical: true },
  { name: 'AuthModals', desc: 'نوافذ المصادقة', critical: true },
  { name: 'ModernCarXHome', desc: 'الصفحة الرئيسية', critical: true },
  { name: 'UltraModernCarCard', desc: 'بطاقة السيارة', critical: true },
  { name: 'UltraModernPartCard', desc: 'بطاقة القطعة', critical: true },
  { name: 'CircularBrandCard', desc: 'بطاقة الوكالة', critical: true },
  { name: 'CurrencySwitcher', desc: 'تبديل العملات', critical: false },
  { name: 'SearchBar', desc: 'شريط البحث', critical: false },
  { name: 'FilterPanel', desc: 'لوحة الفلاتر', critical: false },
  { name: 'CarGallery', desc: 'معرض الصور', critical: false },
];

console.log('🧩 المكونات:\n');

let criticalComponents = { found: 0, missing: 0 };
let optionalComponents = { found: 0, missing: 0 };

components.forEach(comp => {
  const exists = fs.existsSync(`carx-system/src/components/${comp.name}.tsx`);
  const icon = exists ? '✅' : '❌';
  const type = comp.critical ? '[حرجة]' : '[إضافية]';
  
  console.log(`${icon} ${comp.name.padEnd(25)} ${type} - ${comp.desc}`);
  
  if (comp.critical) {
    exists ? criticalComponents.found++ : criticalComponents.missing++;
  } else {
    exists ? optionalComponents.found++ : optionalComponents.missing++;
  }
});

console.log('\n' + '='.repeat(70) + '\n');

// الخلاصة
console.log('📊 الخلاصة:\n');

console.log('الصفحات الحرجة:');
console.log(`   ✅ موجودة: ${criticalPages.found}`);
console.log(`   ❌ مفقودة: ${criticalPages.missing}`);

console.log('\nالصفحات المهمة:');
console.log(`   ✅ موجودة: ${importantPages.found}`);
console.log(`   ❌ مفقودة: ${importantPages.missing}`);

console.log('\nالمكونات الحرجة:');
console.log(`   ✅ موجودة: ${criticalComponents.found}`);
console.log(`   ❌ مفقودة: ${criticalComponents.missing}`);

console.log('\nالمكونات الإضافية:');
console.log(`   ✅ موجودة: ${optionalComponents.found}`);
console.log(`   ❌ مفقودة: ${optionalComponents.missing}`);

if (pagesWithMockData.length > 0) {
  console.log('\n⚠️  صفحات تستخدم بيانات وهمية:');
  pagesWithMockData.forEach(page => console.log(`   • ${page}`));
}

if (pagesWithAPI.length > 0) {
  console.log('\n✅ صفحات تستخدم API حقيقي:');
  pagesWithAPI.forEach(page => console.log(`   • ${page}`));
}

console.log('\n' + '='.repeat(70) + '\n');

// التقييم النهائي
const totalCritical = criticalPages.found + criticalComponents.found;
const totalCriticalNeeded = (criticalPages.found + criticalPages.missing) + (criticalComponents.found + criticalComponents.missing);
const criticalPercent = ((totalCritical / totalCriticalNeeded) * 100).toFixed(1);

console.log('🎯 التقييم النهائي:\n');
console.log(`العناصر الحرجة: ${totalCritical}/${totalCriticalNeeded} (${criticalPercent}%)`);

if (criticalPages.missing === 0 && criticalComponents.missing === 0) {
  console.log('\n✅ جميع الواجهات والصفحات الحرجة موجودة وجاهزة!');
  
  if (pagesWithMockData.length > 0) {
    console.log('\n⚠️  لكن بعض الصفحات تستخدم بيانات وهمية - يجب ربطها بالـ API');
  } else {
    console.log('✅ جميع الصفحات تستخدم API حقيقي!');
  }
} else {
  console.log('\n❌ يوجد صفحات أو مكونات حرجة مفقودة');
}

console.log('\n' + '='.repeat(70));
