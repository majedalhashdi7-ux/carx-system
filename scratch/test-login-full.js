const https = require('https');

const data = JSON.stringify({
  identifier: 'dawoodalhash@gmail.com',
  email: 'dawoodalhash@gmail.com',
  password: 'admin123',
  role: 'admin'
});

// Test 1: via carx frontend proxy (should set Host to carx-system-five.vercel.app)
const options1 = {
  hostname: 'carx-system-five.vercel.app',
  port: 443,
  path: '/api/v2/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'x-bypass-limiter': 'HMCarSecretBypass2026',
    'User-Agent': 'Mozilla/5.0 TestAgent'
  }
};

// Test 2: directly to backend with bypass
const options2 = {
  hostname: 'hmcar-system-two.vercel.app',
  port: 443,
  path: '/api/v2/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'x-bypass-limiter': 'HMCarSecretBypass2026',
    'X-Tenant-ID': 'carx',
    'User-Agent': 'Mozilla/5.0 TestAgent'
  }
};

function makeRequest(label, options) {
  return new Promise((resolve) => {
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`\n[${label}]`);
        console.log('Status:', res.statusCode);
        const parsed = JSON.parse(body);
        if (parsed.success) {
          console.log('✅ SUCCESS! Token:', parsed.token?.substring(0, 30) + '...');
          console.log('User:', JSON.stringify(parsed.user));
        } else {
          console.log('❌ FAILED:', parsed.message);
        }
        resolve();
      });
    });
    req.on('error', e => {
      console.log(`[${label}] Error:`, e.message);
      resolve();
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  await makeRequest('CarX Frontend Proxy', options1);
  await makeRequest('Backend Direct + X-Tenant-ID: carx', options2);
}

run();
