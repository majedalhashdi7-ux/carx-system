const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function check() {
  try {
    console.log('Connecting to CAR X DB...');
    await mongoose.connect(process.env.MONGO_URI_CARX);
    console.log('Connected.');

    const admin = await User.findOne({ tenantId: 'carx', role: 'super_admin' });
    if (admin) {
      console.log('✅ Admin found for CAR X:', admin.email);
    } else {
      console.log('❌ No admin found for CAR X. Seeding required.');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
