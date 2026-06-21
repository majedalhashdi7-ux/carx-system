const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  console.log('Connecting to Atlas production URI:', MONGO_URI.replace(/:([^:@]{4})[^:@]*@/, ':****@'));
  try {
    const conn = await mongoose.createConnection(MONGO_URI, { serverSelectionTimeoutMS: 15000 }).asPromise();
    console.log('Successfully connected!');
    const collections = await conn.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
    // We want to list all databases in the cluster
    const adminDb = conn.db.admin();
    try {
      const dbs = await adminDb.listDatabases();
      console.log('Databases on cluster:', dbs.databases.map(d => d.name));
    } catch (e) {
      console.log('Cannot list databases (probably lack admin permission):', e.message);
    }

    // Check 'users' collection in current database
    const usersCol = conn.collection('users');
    const users = await usersCol.find({}).toArray();
    console.log(`\nFound ${users.length} users in 'users' collection:`);
    for (const u of users) {
      let matchesAdmin123 = false;
      if (u.password) {
        try {
          matchesAdmin123 = await bcrypt.compare('admin123', u.password);
        } catch (e) {}
      }
      let matchesAdminAt123 = false;
      try {
        matchesAdminAt123 = await bcrypt.compare('Admin@123', u.password);
      } catch (e) {}
      let matchesDaood = false;
      try {
        matchesDaood = await bcrypt.compare('daood@112233', u.password);
      } catch (e) {}

      console.log(` - Name: ${u.name}, Email: ${u.email}, Username: ${u.username}, Role: ${u.role}, Tenant: ${u.tenantId}, Status: ${u.status}, matches 'admin123': ${matchesAdmin123}, matches 'Admin@123': ${matchesAdminAt123}, matches 'daood@112233': ${matchesDaood}`);
    }
    
    await conn.close();
  } catch (err) {
    console.error('Error connecting to Atlas:', err.message);
  }
}

check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
