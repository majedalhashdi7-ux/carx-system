const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const uris = [
  { name: 'car-auction (HM CAR)', uri: 'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0' },
  { name: 'carx (CAR X)', uri: 'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/carx?retryWrites=true&w=majority&appName=Cluster0' }
];

async function run() {
  for (const item of uris) {
    console.log(`\n--- Inspecting ${item.name} ---`);
    try {
      await mongoose.connect(item.uri);
      const User = mongoose.connection.model('User', new mongoose.Schema({}, { strict: false }), 'users');
      
      const count = await User.countDocuments({});
      console.log(`Total users in DB: ${count}`);
      
      const buyers = await User.find({ role: 'buyer' }).lean();
      console.log(`Total buyers (clients): ${buyers.length}`);
      for (const b of buyers) {
        console.log(`Buyer: name="${b.name}", email="${b.email}", status="${b.status}", createdVia="${b.createdVia}", passwordHash="${b.password}"`);
      }

      const admins = await User.find({ role: { $in: ['admin', 'super_admin', 'manager'] } }).lean();
      console.log(`Total admins/managers: ${admins.length}`);
      for (const a of admins) {
        console.log(`Admin: name="${a.name}", email="${a.email}", role="${a.role}", status="${a.status}"`);
      }
      
      await mongoose.disconnect();
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
  process.exit(0);
}

run();
