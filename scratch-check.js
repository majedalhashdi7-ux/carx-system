const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function check() {
  const uris = {
    MONGO_URI: process.env.MONGO_URI,
    MONGO_URI_CARX: process.env.MONGO_URI_CARX,
    MONGO_URI_HMCAR: process.env.MONGO_URI_HMCAR,
  };
  
  console.log('URIs in env:', uris);
  
  for (const [key, uri] of Object.entries(uris)) {
    if (!uri) continue;
    console.log(`\nChecking database for ${key}: ${uri}`);
    try {
      const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
      const collections = await conn.db.listCollections().toArray();
      console.log('Collections in database:', collections.map(c => c.name));
      
      const usersCol = conn.collection('users');
      const users = await usersCol.find({}).toArray();
      console.log(`Found ${users.length} users:`);
      for (const u of users) {
        let matchesAdmin123 = false;
        if (u.password) {
          try {
            matchesAdmin123 = await bcrypt.compare('admin123', u.password);
          } catch (e) {}
        }
        
        let matchesOther = false;
        try {
          matchesOther = await bcrypt.compare('HMCarAdmin2026!Secure', u.password);
        } catch (e) {}

        console.log(` - Name: ${u.name}, Email: ${u.email}, Username: ${u.username}, Role: ${u.role}, Tenant: ${u.tenantId}, Password length: ${u.password ? u.password.length : 0}, matches 'admin123': ${matchesAdmin123}, matches 'HMCarAdmin2026!Secure': ${matchesOther}`);
      }
      await conn.close();
    } catch (err) {
      console.error(`Error checking ${key}:`, err.message);
    }
  }
}

check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
