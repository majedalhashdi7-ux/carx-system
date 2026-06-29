const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS set warning:', e.message);
}

const uris = [
  { name: 'hmcar_production_default', uri: 'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0' },
  { name: 'hmcar_production_carx_db', uri: 'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/carx?retryWrites=true&w=majority&appName=Cluster0' }
];

async function run() {
  for (const item of uris) {
    console.log(`\n--- ${item.name} ---`);
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(item.uri);
      
      const User = mongoose.connection.model('User', new mongoose.Schema({}, { strict: false }), 'users');
      const users = await User.find({ email: /dawoodalhash/i }).lean();
      
      for (const u of users) {
        const isMatch = u.password ? bcrypt.compareSync('admin123', u.password) : false;
        console.log(`User: ${u.email}, tenantId: ${u.tenantId}, role: ${u.role}, isMatch(admin123): ${isMatch}, passwordHash: ${u.password}`);
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
  process.exit(0);
}

run();
