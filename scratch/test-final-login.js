const https = require('https');

const data = JSON.stringify({
  identifier: 'dawoodalhash@gmail.com',
  email: 'dawoodalhash@gmail.com',
  password: 'admin123',
  role: 'admin'
});

// Test via carx frontend - this is how the real browser does it
const options = {
  hostname: 'carx-system-five.vercel.app',
  port: 443,
  path: '/api/v2/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const req = https.request(options, res => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (parsed.success) {
        console.log('✅ SUCCESS! Login worked!');
        console.log('User:', parsed.user?.name, '| Role:', parsed.user?.role);
        console.log('Token preview:', parsed.token?.substring(0, 40) + '...');
      } else {
        console.log('❌ FAILED:', parsed.message, '| Code:', parsed.code);
      }
    } catch (e) {
      console.log('Response (raw):', body.substring(0, 200));
    }
  });
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
