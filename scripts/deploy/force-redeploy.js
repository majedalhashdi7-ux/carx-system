#!/usr/bin/env node

/**
 * سكريبت إعادة النشر القسري
 * يقوم بإنشاء commit فارغ ورفعه لتحفيز Vercel على إعادة النشر
 */

const { execSync } = require('child_process');

console.log('🚀 بدء عملية إعادة النشر القسري...\n');

try {
  // 1. التحقق من حالة Git
  console.log('📋 التحقق من حالة Git...');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (status.trim()) {
    console.log('⚠️  هناك تغييرات غير محفوظة:');
    console.log(status);
    console.log('\n💡 احفظ التغييرات أولاً باستخدام:');
    console.log('   git add .');
    console.log('   git commit -m "حفظ التغييرات"');
    process.exit(1);
  }

  // 2. إنشاء commit فارغ لتحفيز النشر
  console.log('✅ لا توجد تغييرات غير محفوظة\n');
  console.log('📝 إنشاء commit فارغ لتحفيز النشر...');
  
  const timestamp = new Date().toISOString();
  execSync(`git commit --allow-empty -m "🔄 إعادة نشر قسري - ${timestamp}"`, { 
    stdio: 'inherit' 
  });

  // 3. رفع التغييرات إلى GitHub
  console.log('\n📤 رفع التغييرات إلى GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('\n✅ تم رفع التغييرات بنجاح!');
  console.log('\n⏳ انتظر 5-7 دقائق حتى يكمل Vercel عملية النشر');
  console.log('\n🔗 تحقق من حالة النشر:');
  console.log('   https://vercel.com/dashboard');
  console.log('\n🌐 الموقع:');
  console.log('   https://hmcar.okigo.net');

} catch (error) {
  console.error('\n❌ حدث خطأ:', error.message);
  process.exit(1);
}
