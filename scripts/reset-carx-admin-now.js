/**
 * سكريبت إعادة تعيين/إنشاء حساب أدمن CarX مباشرة في MongoDB Atlas
 * يتصل مباشرة بقاعدة البيانات ويُصلح أو يُنشئ حساب الأدمن
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// قراءة MONGO_URI من الملفات المتاحة
const MONGO_URI = 
  'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0';

const ADMIN_EMAIL = 'carx-admin@hmcar.com';
const ADMIN_PASSWORD = 'CarX@Admin2026!';
const TENANT_ID = 'carx';

async function run() {
  console.log('🔌 جاري الاتصال بـ MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ تم الاتصال بنجاح!\n');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');

  // عرض كل المستخدمين من tenant carx
  const allCarxUsers = await usersCol.find(
    { tenantId: TENANT_ID },
    { projection: { email: 1, role: 1, tenantId: 1, status: 1, name: 1 } }
  ).toArray();

  console.log(`📋 المستخدمون الحاليون في tenant [${TENANT_ID}]:`);
  console.log(JSON.stringify(allCarxUsers, null, 2));
  console.log(`\n📊 العدد: ${allCarxUsers.length} مستخدم\n`);

  // عرض كل الأدمن في النظام
  const allAdmins = await usersCol.find(
    { role: { $in: ['admin', 'super_admin', 'manager'] } },
    { projection: { email: 1, role: 1, tenantId: 1, status: 1, name: 1 } }
  ).toArray();

  console.log(`👑 جميع حسابات الأدمن في النظام:`);
  console.log(JSON.stringify(allAdmins, null, 2));
  console.log(`\n📊 العدد: ${allAdmins.length} أدمن\n`);

  // إعادة تعيين/إنشاء حساب أدمن CarX
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const result = await usersCol.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: 'مدير نظام كار إكس',
        role: 'admin',
        tenantId: TENANT_ID,
        status: 'active',
        isActive: true,
        isVerified: true,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date(),
        createdVia: 'admin-reset-script'
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (result) {
    console.log('✅ تم إنشاء/تحديث حساب الأدمن بنجاح!');
  }

  console.log('\n════════════════════════════════════════');
  console.log('🔐 بيانات دخول الأدمن الجديدة:');
  console.log(`   📧 البريد:      ${ADMIN_EMAIL}`);
  console.log(`   🔑 كلمة المرور: ${ADMIN_PASSWORD}`);
  console.log(`   🏢 Tenant:      ${TENANT_ID}`);
  console.log(`   🌐 رابط الدخول: https://carx-system-five.vercel.app/login`);
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('✅ تم قطع الاتصال. العملية مكتملة!');
}

run().catch(err => {
  console.error('❌ خطأ:', err.message);
  process.exit(1);
});
