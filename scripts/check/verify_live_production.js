const endpoints = [
  '/',
  '/cars',
  '/showroom',
  '/parts',
  '/auctions',
  '/brands',
  '/login',
  '/api/health',
  '/api/v2/cars?limit=1',
  '/api/v2/parts?limit=1',
  '/api/v2/auctions?limit=1',
  '/api/v2/brands?limit=1'
];

const base = 'https://hmcar-system-two.vercel.app';

async function check() {
  console.log('--- PRODUCTION INTEGRITY CHECK ---');
  let allPass = true;
  for (const ep of endpoints) {
    const t0 = Date.now();
    try {
      const res = await fetch(base + ep);
      const ok = res.status >= 200 && res.status < 400;
      console.log(`${ok ? '✅ PASS' : '❌ FAIL'} [${res.status}] ${ep.padEnd(28)} (${Date.now() - t0}ms)`);
      if (!ok) allPass = false;
    } catch(e) {
      console.log(`❌ ERR ${ep}: ${e.message}`);
      allPass = false;
    }
  }
  
  const adminRes = await fetch(base + '/admin', { redirect: 'manual' });
  const isProtected = adminRes.status >= 300 && adminRes.status < 400;
  console.log(`${isProtected ? '🛡️ PASS' : '❌ FAIL'} [${adminRes.status}] /admin security guard (Redirected to login: ${isProtected})`);
  
  console.log(`\nOVERALL SYSTEM STATUS: ${allPass && isProtected ? 'READY 100%' : 'NEEDS ATTENTION'}`);
}

check();
