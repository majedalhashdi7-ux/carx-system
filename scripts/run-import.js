/**
 * run-import.js
 * يسجل الدخول كأدمن ثم يستورد سيارات ومزاد مباشر من Encar
 */

const BASE = 'https://hmcar-system-two.vercel.app';

async function login() {
  console.log('🔐 تسجيل الدخول...');
  const r = await fetch(`${BASE}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': 'hmcar' },
    body: JSON.stringify({ email: 'dawoodalhash@gmail.com', password: 'admin123' })
  });
  const data = await r.json();
  if (!data.token && !data.data?.token) {
    console.error('❌ فشل تسجيل الدخول:', JSON.stringify(data));
    process.exit(1);
  }
  const token = data.token || data.data?.token;
  console.log('✅ تم تسجيل الدخول. Token:', token.slice(0, 20) + '...');
  return token;
}

async function importShowroomCars(token, limit = 15) {
  console.log(`\n🚗 استيراد ${limit} سيارة للمعرض...`);
  const r = await fetch(`${BASE}/api/v2/import/showroom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': 'hmcar'
    },
    body: JSON.stringify({ limit })
  });
  const data = await r.json();
  if (data.success || data.imported) {
    console.log(`✅ سيارات المعرض: تم استيراد ${data.imported || data.data?.length || '?'} سيارة`);
    console.log('   الرسالة:', data.message || data.msg || '');
  } else {
    console.warn('⚠️ النتيجة:', JSON.stringify(data).slice(0, 300));
  }
  return data;
}

async function importLiveAuctions(token, limit = 10) {
  console.log(`\n🔴 استيراد ${limit} سيارة للمزاد المباشر...`);
  const r = await fetch(`${BASE}/api/v2/import/live-auctions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': 'hmcar'
    },
    body: JSON.stringify({ limit })
  });
  const data = await r.json();
  if (data.success || data.imported) {
    console.log(`✅ المزاد المباشر: تم استيراد ${data.imported || data.data?.length || '?'} سيارة`);
    console.log('   الرسالة:', data.message || data.msg || '');
  } else {
    console.warn('⚠️ النتيجة:', JSON.stringify(data).slice(0, 300));
  }
  return data;
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  🚀 HM CAR — سكريبت الاستيراد التلقائي');
  console.log('═══════════════════════════════════════\n');

  try {
    const token = await login();
    await importShowroomCars(token, 15);
    await importLiveAuctions(token, 10);
    console.log('\n🎉 اكتمل الاستيراد!');
    console.log('🌐 تحقق من: https://hmcar-system-two.vercel.app/auctions/live');
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  }
}

main();
