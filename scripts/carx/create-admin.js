// Create admin user in CAR X database
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createCarXAdmin() {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_CARX;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI أو MONGO_URI_CARX مطلوب');
    process.exit(1);
  }

  console.log('🔌 Connecting to CAR X database...');
  
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  // Define schema inline to avoid import issues
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    password: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'admin', 'manager'], default: 'buyer' },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
    lastLoginAt: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    tokenVersion: { type: Number, default: 0 },
  }, { timestamps: true });

  const User = mongoose.models.CXUser || mongoose.model('CXUser', userSchema);

  const email = process.env.ADMIN_EMAIL || 'dawoodalhash@gmail.com';
   const password = process.env.ADMIN_PASSWORD || 'HMCarAdmin2026!Secure';
  const hashedPassword = await bcrypt.hash(password, 12);

  // Upsert admin user
  const admin = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $setOnInsert: {
        name: 'مدير النظام',
        email: email.toLowerCase(),
        phone: '+967781007805',
        city: 'Sanaa',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        tokenVersion: 0,
        lastLoginAt: null,
        loginAttempts: 0,
      }
    },
    { upsert: true, new: true }
  );

  if (admin.isNew || !admin.lastLoginAt) {
    console.log('✅ Admin user created/updated in CAR X database');
    console.log('  Email:', email);
    console.log('  Role:', admin.role);
    console.log('  Status:', admin.status);
  } else {
    console.log('✅ Admin user already exists in CAR X database');
    console.log('  Email:', email);
    console.log('  Role:', admin.role);
    console.log('  Status:', admin.status);
  }

  await mongoose.disconnect();
  console.log('👋 Done');
}

createCarXAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
