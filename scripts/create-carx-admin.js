// سكريبت لإنشاء حساب الإدمن في قاعدة بيانات CAR X
// تشغيل: node scripts/create-carx-admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://car-auction:jyT24fgC7TXfyKEt@cluster0.1bqjdzp.mongodb.net/carx_production?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  phone: String,
  password: String,
  role: { type: String, default: 'buyer' },
  status: { type: String, default: 'active' },
  loginAttempts: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.models.CXUser || mongoose.model('CXUser', userSchema);

async function createAdmin() {
  console.log('🔌 جاري الاتصال بـ carx_production...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('✅ متصل بـ carx_production');

  const adminEmail = process.env.ADMIN_EMAIL || 'dawoodalhash@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'daood@112233';
  const adminName = 'Daood Al-Hashemi';

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log(`⚠️ المستخدم موجود بالفعل: ${adminEmail}`);
    console.log(`   الدور الحالي: ${existing.role}`);
    // Update to admin if needed
    if (existing.role !== 'admin') {
      await User.findByIdAndUpdate(existing._id, { role: 'admin' });
      console.log('✅ تم ترقية المستخدم لإدمن');
    }
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });
    console.log(`✅ تم إنشاء حساب الإدمن: ${adminEmail}`);
    console.log(`   كلمة المرور: ${adminPassword}`);
  }

  await mongoose.disconnect();
  console.log('✅ انتهى!');
}

createAdmin().catch(err => {
  console.error('❌ خطأ:', err.message);
  process.exit(1);
});
