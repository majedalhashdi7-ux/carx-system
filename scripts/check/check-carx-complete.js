#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 فحص شامل لنظام CAR X...\n');
console.log('='.repeat(60));

const results = {
  found: [],
  missing: [],
  total: 0
};

function checkFile(filePath, description) {
  results.total++;
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const result = `${status} ${description}`;
  
  if (exists) {
    results.found.push(description);
  } else {
    results.missing.push(description);
  }
  
  return result;
}

// 1. فحص API Routes
console.log('\n📁 1. API Routes:');
console.log('-'.repeat(60));

const apiRoutes = [
  ['carx-system/src/app/api/auth/login/route.ts', 'API: تسجيل الدخول'],
  ['carx-system/src/app/api/auth/register/route.ts', 'API: التسجيل'],
  ['carx-system/src/app/api/auth/logout/route.ts', 'API: تسجيل الخروج'],
  ['carx-system/src/app/api/cars/route.ts', 'API: قائمة السيارات'],
  ['carx-system/src/app/api/cars/[id]/route.ts', 'API: تفاصيل السيارة'],
  ['carx-system/src/app/api/brands/route.ts', 'API: قائمة الوكالات'],
  ['carx-system/src/app/api/brands/[id]/route.ts', 'API: تفاصيل الوكالة'],
  ['carx-system/src/app/api/parts/route.ts', 'API: قائمة قطع الغيار'],
  ['carx-system/src/app/api/parts/[id]/route.ts', 'API: تفاصيل القطعة'],
  ['carx-system/src/app/api/upload/route.ts', 'API: رفع الصور'],
  ['carx-system/src/app/api/orders/route.ts', 'API: الطلبات']
];

apiRoutes.forEach(([path, desc]) => {
  console.log('   ' + checkFile(path, desc));
});

// 2. فحص الصفحات
console.log('\n📄 2. الصفحات:');
console.log('-'.repeat(60));

const pages = [
  ['carx-system/src/app/page.tsx', 'الصفحة الرئيسية'],
  ['carx-system/src/app/showroom/page.tsx', 'صفحة المعرض'],
  ['carx-system/src/app/showroom/[id]/page.tsx', 'تفاصيل السيارة'],
  ['carx-system/src/app/brands/page.tsx', 'صفحة الوكالات'],
  ['carx-system/src/app/brands/[id]/page.tsx', 'تفاصيل الوكالة'],
  ['carx-system/src/app/parts/page.tsx', 'صفحة قطع الغيار'],
  ['carx-system/src/app/parts/[id]/page.tsx', 'تفاصيل القطعة'],
  ['carx-system/src/app/admin/page.tsx', 'لوحة الإدارة'],
  ['carx-system/src/app/admin/cars/page.tsx', 'إدارة السيارات'],
  ['carx-system/src/app/admin/cars/add/page.tsx', 'إضافة سيارة'],
  ['carx-system/src/app/admin/parts/page.tsx', 'إدارة قطع الغيار'],
  ['carx-system/src/app/admin/brands/page.tsx', 'إدارة الوكالات'],
  ['carx-system/src/app/dashboard/page.tsx', 'لوحة المستخدم'],
  ['carx-system/src/app/about/page.tsx', 'عن الموقع'],
  ['carx-system/src/app/contact/page.tsx', 'اتصل بنا']
];

pages.forEach(([path, desc]) => {
  console.log('   ' + checkFile(path, desc));
});

// 3. فحص المكونات
console.log('\n🧩 3. المكونات:');
console.log('-'.repeat(60));

const components = [
  ['carx-system/src/components/Navbar.tsx', 'شريط التنقل'],
  ['carx-system/src/components/AuthModals.tsx', 'نوافذ المصادقة'],
  ['carx-system/src/components/ModernCarXHome.tsx', 'الصفحة الرئيسية'],
  ['carx-system/src/components/UltraModernCarCard.tsx', 'بطاقة السيارة'],
  ['carx-system/src/components/UltraModernPartCard.tsx', 'بطاقة القطعة'],
  ['carx-system/src/components/CircularBrandCard.tsx', 'بطاقة الوكالة'],
  ['carx-system/src/components/CurrencySwitcher.tsx', 'تبديل العملات'],
  ['carx-system/src/components/SearchBar.tsx', 'شريط البحث'],
  ['carx-system/src/components/FilterPanel.tsx', 'لوحة الفلاتر'],
  ['carx-system/src/components/CarGallery.tsx', 'معرض صور السيارة'],
  ['carx-system/src/components/AdminSidebar.tsx', 'قائمة الإدارة'],
  ['carx-system/src/components/NotificationToast.tsx', 'إشعارات Toast'],
  ['carx-system/src/components/LoadingSpinner.tsx', 'مؤشر التحميل'],
  ['carx-system/src/components/Pagination.tsx', 'ترقيم الصفحات']
];

components.forEach(([path, desc]) => {
  console.log('   ' + checkFile(path, desc));
});

// 4. فحص Contexts
console.log('\n🔄 4. Contexts:');
console.log('-'.repeat(60));

const contexts = [
  ['carx-system/src/lib/AuthContext.tsx', 'سياق المصادقة'],
  ['carx-system/src/lib/LanguageContext.tsx', 'سياق اللغة'],
  ['carx-system/src/lib/SettingsContext.tsx', 'سياق الإعدادات'],
  ['carx-system/src/lib/TenantContext.tsx', 'سياق المستأجر'],
  ['carx-system/src/lib/NotificationContext.tsx', 'سياق الإشعارات']
];

contexts.forEach(([path, desc]) => {
  console.log('   ' + checkFile(path, desc));
});

// 5. فحص Utilities
console.log('\n🛠️ 5. Utilities:');
console.log('-'.repeat(60));

const utils = [
  ['carx-system/src/lib/api.ts', 'API Client'],
  ['carx-system/src/lib/utils.ts', 'دوال مساعدة'],
  ['carx-system/src/lib/db.ts', 'اتصال قاعدة البيانات'],
  ['carx-system/src/lib/auth.ts', 'دوال المصادقة'],
  ['carx-system/middleware.ts', 'Middleware للحماية']
];

utils.forEach(([path, desc]) => {
  console.log('   ' + checkFile(path, desc));
});

// 6. فحص Models
console.log('\n📊 6. Models:');
console.log('-'.repeat(60));

const models = [
  ['carx-system/src/models/Car.ts', 'نموذج السيارة'],
  ['carx-system/src/models/Part.ts', 'نموذج القطعة'],
  ['carx-system/src/models/Brand.ts', 'نموذج الوكالة'],
  ['carx-system/src/models/User.ts', 'نموذج المستخدم'],
  ['carx-system/src/models/Order.ts', 'نموذج الطلب']
];

models.forEach(([path, desc]) => {
  console.log('   ' + checkFile(path, desc));
});

// 7. فحص الإعدادات
console.log('\n⚙️ 7. الإعدادات:');
console.log('-'.repeat(60));

const configs = [
  ['carx-system/.env.local', 'متغيرات البيئة'],
  ['carx-system/next.config.js', 'إعدادات Next.js'],
  ['carx-system/package.json', 'حزم NPM'],
  ['carx-system/tsconfig.json', 'إعدادات TypeScript'],
  ['carx-system/tailwind.config.js', 'إعدادات Tailwind']
];

configs.forEach(([path, desc]) => {
  console.log('   ' + checkFile(path, desc));
});

// 8. فحص محتوى .env.local
console.log('\n💾 8. فحص قاعدة البيانات:');
console.log('-'.repeat(60));

if (fs.existsSync('carx-system/.env.local')) {
  const content = fs.readFileSync('carx-system/.env.local', 'utf8');
  
  const checks = [
    [content.includes('MONGO_URI=mongodb+srv://'), 'MONGO_URI موجود'],
    [content.includes('carx_production'), 'قاعدة بيانات carx_production'],
    [content.includes('NEXTAUTH_SECRET'), 'NEXTAUTH_SECRET موجود'],
    [!content.includes('daood@112233'), 'كلمة السر غير مكشوفة']
  ];
  
  checks.forEach(([condition, desc]) => {
    console.log(`   ${condition ? '✅' : '❌'} ${desc}`);
  });
} else {
  console.log('   ❌ ملف .env.local غير موجود');
}

// النتائج النهائية
console.log('\n' + '='.repeat(60));
console.log('📊 النتائج النهائية:');
console.log('='.repeat(60));

const foundPercent = ((results.found.length / results.total) * 100).toFixed(1);
const missingPercent = ((results.missing.length / results.total) * 100).toFixed(1);

console.log(`\n✅ موجود: ${results.found.length}/${results.total} (${foundPercent}%)`);
console.log(`❌ مفقود: ${results.missing.length}/${results.total} (${missingPercent}%)`);

if (results.missing.length > 0) {
  console.log('\n🔴 العناصر المفقودة الأكثر أهمية:');
  console.log('-'.repeat(60));
  
  // تصنيف حسب الأولوية
  const critical = results.missing.filter(item => 
    item.includes('API:') || 
    item.includes('تفاصيل') || 
    item.includes('قاعدة البيانات')
  );
  
  const important = results.missing.filter(item => 
    item.includes('إدارة') || 
    item.includes('لوحة') ||
    item.includes('نموذج')
  );
  
  const nice = results.missing.filter(item => 
    !critical.includes(item) && !important.includes(item)
  );
  
  if (critical.length > 0) {
    console.log('\n🔴 حرجة (أولوية قصوى):');
    critical.forEach(item => console.log(`   • ${item}`));
  }
  
  if (important.length > 0) {
    console.log('\n🟡 مهمة (أولوية عالية):');
    important.forEach(item => console.log(`   • ${item}`));
  }
  
  if (nice.length > 0) {
    console.log('\n🟢 إضافية (أولوية متوسطة):');
    nice.slice(0, 10).forEach(item => console.log(`   • ${item}`));
    if (nice.length > 10) {
      console.log(`   ... و ${nice.length - 10} عنصر آخر`);
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ انتهى الفحص الشامل');
console.log('='.repeat(60) + '\n');
