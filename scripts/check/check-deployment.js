#!/usr/bin/env node

/**
 * سكريبت للتحقق من حالة النشر على Vercel
 */

const https = require('https');

const SITE_URL = 'https://hmcar.xyz';
const BRANDS_URL = 'https://hmcar.okigo.net/brands';

console.log('🔍 جاري التحقق من النشر...\n');

// فحص الصفحة الرئيسية
function checkUrl(url, name) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const { statusCode } = res;
      const success = statusCode === 200;
      
      console.log(`${success ? '✅' : '❌'} ${name}: ${statusCode}`);
      
      if (success) {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          // فحص محتوى الصفحة
          const hasContent = data.length > 1000;
          console.log(`   📄 حجم المحتوى: ${(data.length / 1024).toFixed(2)} KB`);
          resolve(success && hasContent);
        });
      } else {
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`❌ ${name}: خطأ في الاتصال`);
      console.log(`   ⚠️  ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('📍 الموقع:', SITE_URL);
  console.log('⏰ الوقت:', new Date().toLocaleString('ar-SA'));
  console.log('─────────────────────────────────\n');

  const homeOk = await checkUrl(SITE_URL, 'الصفحة الرئيسية');
  const brandsOk = await checkUrl(BRANDS_URL, 'صفحة الوكالات');

  console.log('\n─────────────────────────────────');
  
  if (homeOk && brandsOk) {
    console.log('✅ النشر ناجح! الموقع يعمل بشكل صحيح');
    console.log('\n💡 نصيحة: امسح كاش المتصفح (Ctrl+Shift+R) لرؤية التغييرات');
  } else {
    console.log('⚠️  هناك مشكلة في النشر');
    console.log('\n🔧 الحلول المقترحة:');
    console.log('   1. انتظر 2-3 دقائق وحاول مرة أخرى');
    console.log('   2. تحقق من Vercel Dashboard');
    console.log('   3. راجع Build Logs');
  }
  
  console.log('\n🌐 الروابط:');
  console.log('   • الموقع:', SITE_URL);
  console.log('   • الوكالات:', BRANDS_URL);
  console.log('   • Vercel: https://vercel.com/dashboard');
}

main();
