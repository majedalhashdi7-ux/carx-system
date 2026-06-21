const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://car-auction:jyT24fgC7TXfyKEt@cluster0.1bqjdzp.mongodb.net/carx_production?retryWrites=true&w=majority';

async function check() {
  console.log('Connecting to Atlas production URI:', MONGO_URI.replace(/:([^:@]{4})[^:@]*@/, ':****@'));
  try {
    const conn = await mongoose.createConnection(MONGO_URI, { serverSelectionTimeoutMS: 10000 }).asPromise();
    const collections = await conn.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
    // Check both 'users' and 'cxusers' collections
    for (const colName of ['users', 'cxusers']) {
      const col = conn.collection(colName);
      try {
        const users = await col.find({}).toArray();
        console.log(`\nFound ${users.length} users in collection '${colName}':`);
        for (const u of users) {
          let matchesAdmin123 = false;
          if (u.password) {
            try {
              matchesAdmin123 = await bcrypt.compare('admin123', u.password);
            } catch (e) {}
          }
          let matchesEnv = false;
          try {
            matchesEnv = await bcrypt.compare('HMCarAdmin2026!Secure', u.password);
          } catch (e) {}

          console.log(` - Name: ${u.name}, Email: ${u.email}, Username: ${u.username}, Role: ${u.role}, Tenant: ${u.tenantId}, Password length: ${u.password ? u.password.length : 0}, matches 'admin123': ${matchesAdmin123}, matches 'HMCarAdmin2026!Secure': ${matchesEnv}`);
        }
      } catch (err) {
        console.error(`Error reading collection ${colName}:`, err.message);
      }
    }
    await conn.close();
  } catch (err) {
    console.error('Error connecting to Atlas:', err.message);
  }
}

check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
