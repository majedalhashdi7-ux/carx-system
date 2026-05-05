// تحديث المفاتيح السرية في ملف .env
const fs = require('fs');
const path = require('path');

// قراءة ملف .env
const envPath = path.join(process.cwd(), '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// توليد مفاتيح جديدة
const jwtSecret = require('crypto').randomBytes(32).toString('hex');
const sessionSecret = require('crypto').randomBytes(32).toString('hex');

// استبدال المفاتيح
envContent = envContent.replace(/^JWT_SECRET=.*/m, `JWT_SECRET=${jwtSecret}`);
envContent = envContent.replace(/^SESSION_SECRET=.*/m, `SESSION_SECRET=${sessionSecret}`);

// كتابة الملف
fs.writeFileSync(envPath, envContent);

console.log('✅ تم تحديث المفاتيح السرية بنجاح!');
console.log('');
console.log('المفاتيح الجديدة:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('');
console.log('⚠️  مهم: قم بتشغيل الأمر التالي لإخفاء المفاتيح القديمة من Git:');
console.log('   git add .env && git commit -m "chore: rotate secrets"');
