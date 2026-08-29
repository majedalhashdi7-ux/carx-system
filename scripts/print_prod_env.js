const fs = require('fs');
const envContent = fs.readFileSync('.env.prod.local', 'utf8');
console.log('=== RAW FILE ===');
console.log(envContent);
