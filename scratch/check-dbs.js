const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS set warning:', e.message);
}

const uris = [
  { name: 'carx_db_dedicated', uri: 'mongodb+srv://carx:alQ1ZGSVtOZ1IPle@cluster0.1bqjdzp.mongodb.net/carx?retryWrites=true&w=majority&appName=Cluster0' },
  { name: 'hmcar_production_default', uri: 'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0' },
  { name: 'hmcar_production_carx_db', uri: 'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/carx?retryWrites=true&w=majority&appName=Cluster0' }
];

async function run() {
  for (const item of uris) {
    console.log(`\n--- Connecting to ${item.name} ---`);
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(item.uri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected!');
      
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Collections:', collections.map(c => c.name));
      
      // Let's check for users
      try {
        const User = mongoose.connection.model('User', new mongoose.Schema({}, { strict: false }), 'users');
        const users = await User.find({ email: /dawoodalhash/i }).lean();
        console.log('Matching Users:', users.map(u => ({ email: u.email, role: u.role, tenantId: u.tenantId, hasPassword: !!u.password })));
      } catch (err) {
        console.error('Error querying users:', err.message);
      }
    } catch (e) {
      console.error('Connection failed:', e.message);
    }
  }
  process.exit(0);
}

run();
