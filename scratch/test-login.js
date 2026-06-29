const https = require('https');

const data = JSON.stringify({
  identifier: 'dawoodalhash@gmail.com',
  email: 'dawoodalhash@gmail.com',
  password: 'admin123',
  role: 'admin'
});

const options = {
  hostname: 'hmcar-system-two.vercel.app',
  port: 443,
  path: '/api/v2/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'X-Forwarded-Host': 'carx-system-five.vercel.app'
  }
};

const req = https.request(options, res => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
