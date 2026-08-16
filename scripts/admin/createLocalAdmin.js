// [[ARABIC_HEADER]] هذا الملف (scripts/createLocalAdmin.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getDefaultPermissions } = require('../middleware/permissions');

async function createLocalAdmin() {
  try {
    console.log('👑 Creating local admin user...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction');
    console.log('✅ Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      console.log('ℹ️ Super admin already exists:', existingAdmin.email);
      return;
    }

    // Create super admin
    const superAdminPass = process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD;
    if (!superAdminPass) throw new Error('❌ ADMIN_PASSWORD env var is required!');
    const hashedPassword = await bcrypt.hash(superAdminPass, 12);
    
    const superAdmin = new User({
      name: 'مدير النظام',
      email: process.env.ADMIN_EMAIL || 'admin@hmcar.com',
      phone: '+966500000001',
      password: hashedPassword,
      role: 'super_admin',
      permissions: getDefaultPermissions('super_admin'),
      status: 'active',
      isEmailVerified: true
    });

    await superAdmin.save();
    
    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', process.env.ADMIN_EMAIL || 'admin@hmcar.com');
    console.log('🔑 Password: [from ADMIN_PASSWORD env var]');
    console.log('📱 Phone: +966500000001');

    // Create regular admin
    const adminPass = process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD;
    const hashedAdminPass = await bcrypt.hash(adminPass, 12);
    
    const admin = new User({
      name: 'مدير الموقع',
      email: 'manager@hmcar.com',
      phone: '+966500000002',
      password: hashedAdminPass,
      role: 'admin',
      permissions: getDefaultPermissions('admin'),
      status: 'active',
      isEmailVerified: true
    });

    await admin.save();
    
    console.log('✅ Admin created successfully!');
    console.log('📧 Email: manager@hmcar.com');
    console.log('🔑 Password: [from ADMIN_PASSWORD env var]');
    console.log('📱 Phone: +966500000002');

    console.log('🎉 Admin users created successfully!');
    console.log('🌐 You can now login at: https://hmcar.vercel.app/auth/login');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createLocalAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { createLocalAdmin };
