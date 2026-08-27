const https = require('https');

const ENDPOINTS_TO_TEST = [
  'https://hmcar-system-two.vercel.app/api/v2/health',
  'https://hmcar-system-two.vercel.app/api/v2/cars?limit=5',
  'https://hmcar-system-two.vercel.app/api/v2/showroom/cars?limit=5',
  'https://hmcar-system-two.vercel.app/api/v2/brands',
  'https://hmcar-system-two.vercel.app/api/v2/parts?limit=5',
  'https://hmcar-system-two.vercel.app/cars',
  'https://hmcar-system-two.vercel.app/showroom',
  'https://carx-system-five.vercel.app/',
  'https://carx-system-five.vercel.app/showroom',
  'https://carx-system-five.vercel.app/cars',
  'https://carx-system-five.vercel.app/brands',
  'https://carx-system-five.vercel.app/admin'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          contentLength: data.length,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });
    req.on('error', (err) => {
      resolve({ url, error: err.message, success: false });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, error: 'TIMEOUT (15s)', success: false });
    });
  });
}

async function run() {
  console.log('🌐 Testing Live Online Endpoints (Vercel & APIs)...');
  console.log('====================================================');
  let passed = 0;
  for (let url of ENDPOINTS_TO_TEST) {
    const result = await testUrl(url);
    if (result.success) {
      console.log(`✅ [${result.statusCode}] ${result.duration.padEnd(7)} | ${url}`);
      passed++;
    } else {
      console.log(`❌ [${result.statusCode || 'ERR'}] ${url} -> ${result.error || 'Failed'}`);
    }
  }
  console.log('====================================================');
  console.log(`Summary: ${passed} / ${ENDPOINTS_TO_TEST.length} endpoints succeeded online.`);
}

run();
