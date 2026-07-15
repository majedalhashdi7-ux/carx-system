const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-auction';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    
    const User = require('../models/User');
    
    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Email: ${u.email}, Phone: ${u.phone}, Role: ${u.role}, Status: ${u.status}, TenantId: ${u.tenantId || 'none'}`);
    });
  } catch (error) {
    console.error('Error querying users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
