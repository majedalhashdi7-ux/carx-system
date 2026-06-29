const https = require('https');

function makeRequest(tenantId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'hmcar-system-two.vercel.app',
      port: 443,
      path: '/api/v2/auth/temp-reset-admin-password?secret=HMCarSecureReset2026',
      method: 'GET',
      headers: {
        'X-Tenant-ID': tenantId
      }
    };
    const req = https.request(options, res => {
      console.log(`Tenant: ${tenantId}, Status:`, res.statusCode);
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Tenant: ${tenantId}, Response:`, body);
        resolve();
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    console.log('Sending reset request for tenant: carx');
    await makeRequest('carx');
    
    console.log('Sending reset request for tenant: default');
    await makeRequest('default');
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
