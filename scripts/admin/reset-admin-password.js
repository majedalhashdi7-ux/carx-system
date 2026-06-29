// [[ARABIC_HEADER]] هذا الملف (scripts/admin/reset-admin-password.js) جزء من مشروع HM CAR / CAR X
// مسؤول عن إعادة تعيين كلمة مرور الأدمن إلى 'admin123' وتجنب التشفير المزدوج (Double-Hashing)

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const dns = require('dns');

// Fix for Windows DNS resolution issues with MongoDB Atlas SRV records in Node.js
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('⚠️ Could not set DNS servers:', e.message);
}

// Load default .env
dotenv.config();

// Load other environment files to extract database URIs
const envFiles = [
  '.env.local',
  '.env.production.local',
  '.env.production',
  'carx-system/.env.production.local',
  'carx-system/.env.local',
  'client-app/.env.production.local',
  'client-app/.env.local',
];

for (const file of envFiles) {
  const fullPath = path.resolve(__dirname, '..', '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`ℹ️ Loading environment file: ${file}`);
    try {
      const envConfig = dotenv.parse(fs.readFileSync(fullPath));
      for (const k in envConfig) {
        let val = envConfig[k];
        if (typeof val === 'string') {
          // Clean quotes and newlines
          val = val.replace(/^["']|["']$/g, '').trim();
        }
        process.env[k] = val;
      }
    } catch (e) {
      console.warn(`⚠️ Could not parse env file ${file}:`, e.message);
    }
  }
}

const mongoose = require('mongoose');
const User = require('../../models/User');

async function resetPassword() {
  console.log('🚀 بدء إعادة تعيين كلمة مرور الأدمن...');

  // قائمة قواعد البيانات المحددة في ملف البيئة
  const dbs = [
    { name: 'Default/HM CAR', uri: process.env.MONGO_URI },
    { name: 'CAR X', uri: process.env.MONGO_URI_CARX },
    { name: 'HM CAR Specific', uri: process.env.MONGO_URI_HMCAR },
    { name: 'Production', uri: process.env.MONGO_URI_PRODUCTION }
  ];

  const adminEmail = 'dawoodalhash@gmail.com';
  const newPassword = 'admin123';

  for (const db of dbs) {
    if (!db.uri) {
      console.log(`⚠️ تخطي ${db.name} (لم يتم تحديد URI في ملف البيئة)`);
      continue;
    }

    console.log(`\n📡 جاري الاتصال بقاعدة بيانات ${db.name}...`);
    try {
      // إغلاق أي اتصال مفتوح لتجنب تداخل النماذج
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      await mongoose.connect(db.uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`✅ متصل بنجاح بـ ${db.name}`);

      // البحث عن المستخدم
      let user = await User.findOne({ email: adminEmail.toLowerCase() });

      if (user) {
        console.log(`👤 تم العثور على حساب الأدمن الحالي: ${user.name} (${user.email})`);
        
        // تعيين كلمة المرور كأصلي (Plain text) ليقوم الـ pre-save hook بتشفيرها لمرة واحدة فقط وبشكل صحيح
        user.password = newPassword;
        user.status = 'active';
        
        // التأكد من أن الدور مناسب للدخول
        if (!['admin', 'super_admin', 'manager'].includes(user.role)) {
          console.log(`🔄 ترقية دور المستخدم من '${user.role}' إلى 'admin'`);
          user.role = 'admin';
        }
        
        // التأكد من وجود الصلاحيات الكاملة
        user.permissions = [
          'manage_users', 'manage_settings', 'manage_footer',
          'manage_whatsapp', 'manage_cars', 'manage_parts',
          'manage_auctions', 'manage_concierge', 'view_analytics',
          'manage_content', 'super_admin'
        ];

        await user.save();
        console.log(`✨ تم إعادة تعيين كلمة المرور بنجاح إلى '${newPassword}' وتفعيل الحساب!`);
      } else {
        console.log(`👤 لم يتم العثور على حساب الأدمن '${adminEmail}'. جاري إنشاؤه...`);
        
        const newUser = new User({
          tenantId: db.name.includes('CAR X') ? 'carx' : 'default',
          name: 'HM Admin',
          email: adminEmail,
          password: newPassword, // سيُشفّر تلقائياً عبر الـ pre-save hook
          role: 'admin',
          status: 'active',
          permissions: [
            'manage_users', 'manage_settings', 'manage_footer',
            'manage_whatsapp', 'manage_cars', 'manage_parts',
            'manage_auctions', 'manage_concierge', 'view_analytics',
            'manage_content', 'super_admin'
          ]
        });

        await newUser.save();
        console.log(`✨ تم إنشاء حساب أدمن جديد بنجاح بكلمة مرور '${newPassword}'!`);
      }

    } catch (err) {
      console.error(`❌ خطأ أثناء التعامل مع قاعدة بيانات ${db.name}:`, err.message);
    }
  }

  // إغلاق الاتصال النهائي
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات.');
  }
  
  console.log('\n🎉 انتهت العملية بنجاح! يمكنك الآن تجربة تسجيل الدخول.');
}

resetPassword().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
