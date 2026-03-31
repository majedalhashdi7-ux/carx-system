/**
 * فحص شامل لنظام CAR X
 * يتحقق من جميع المكونات والصفحات
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 بدء الفحص الشامل لنظام CAR X...\n');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

// 1. فحص المكونات الأساسية
console.log('📦 فحص المكونات الأساسية...');
const components = [
  'src/components/CinematicSplash.tsx',
  'src/components/LuxuryCarCard.tsx',
  'src/components/LuxuryPartCard.tsx',
  'src/components/ReviewSystem.tsx',
  'src/components/ComparisonSystem.tsx',
  'src/components/TheatricalCarDisplay.tsx',
  'src/components/AdvancedCart.tsx',
  'src/components/CurrencySelector.tsx',
  'src/components/Navbar.tsx',
  'src/components/ModernCarXHome.tsx',
];

components.forEach(comp => {
  if (fs.existsSync(path.join(__dirname, '..', comp))) {
    checks.passed.push(`✅ ${comp}`);
  } else {
    checks.failed.push(`❌ ${comp} - غير موجود`);
  }
});

// 2. فحص الـ Contexts
console.log('\n🔗 فحص Contexts...');
const contexts = [
  'src/lib/CartContext.tsx',
  'src/lib/CurrencyContext.tsx',
  'src/lib/AuthContext.tsx',
  'src/lib/LanguageContext.tsx',
];

contexts.forEach(ctx => {
  if (fs.existsSync(path.join(__dirname, '..', ctx))) {
    checks.passed.push(`✅ ${ctx}`);
  } else {
    checks.failed.push(`❌ ${ctx} - غير موجود`);
  }
});

// 3. فحص الصفحات
console.log('\n📄 فحص الصفحات...');
const pages = [
  'src/app/page.tsx',
  'src/app/showroom/page.tsx',
  'src/app/showroom/[id]/page.tsx',
  'src/app/parts/page.tsx',
  'src/app/brands/page.tsx',
  'src/app/login/page.tsx',
];

pages.forEach(page => {
  if (fs.existsSync(path.join(__dirname, '..', page))) {
    checks.passed.push(`✅ ${page}`);
  } else {
    checks.failed.push(`❌ ${page} - غير موجود`);
  }
});

// 4. فحص APIs
console.log('\n🔌 فحص APIs...');
const apis = [
  'src/app/api/cars/route.ts',
  'src/app/api/parts/route.ts',
  'src/app/api/admin/import/route.ts',
];

apis.forEach(api => {
  if (fs.existsSync(path.join(__dirname, '..', api))) {
    checks.passed.push(`✅ ${api}`);
  } else {
    checks.warnings.push(`⚠️ ${api} - غير موجود`);
  }
});

// 5. فحص الملفات الأساسية
console.log('\n⚙️ فحص الملفات الأساسية...');
const essentials = [
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'src/app/globals.css',
  'src/app/layout.tsx',
];

essentials.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    checks.passed.push(`✅ ${file}`);
  } else {
    checks.failed.push(`❌ ${file} - غير موجود`);
  }
});

// 6. فحص الفيديو
console.log('\n🎬 فحص ملف الفيديو...');
const videoPath = path.join(__dirname, '..', 'public', 'videos', 'CAR_X.mp4');
if (fs.existsSync(videoPath)) {
  checks.passed.push('✅ ملف الفيديو موجود');
} else {
  checks.warnings.push('⚠️ ملف الفيديو غير موجود - يجب إضافته في public/videos/CAR_X.mp4');
}

// النتائج
console.log('\n' + '='.repeat(60));
console.log('📊 نتائج الفحص:');
console.log('='.repeat(60));

console.log(`\n✅ نجح: ${checks.passed.length}`);
console.log(`❌ فشل: ${checks.failed.length}`);
console.log(`⚠️ تحذيرات: ${checks.warnings.length}`);

if (checks.failed.length > 0) {
  console.log('\n❌ الأخطاء:');
  checks.failed.forEach(f => console.log(f));
}

if (checks.warnings.length > 0) {
  console.log('\n⚠️ التحذيرات:');
  checks.warnings.forEach(w => console.log(w));
}

console.log('\n' + '='.repeat(60));

if (checks.failed.length === 0) {
  console.log('✅ النظام جاهز للاستخدام!');
} else {
  console.log('❌ يوجد أخطاء يجب إصلاحها');
}

console.log('='.repeat(60) + '\n');
