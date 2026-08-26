const mongoose = require('mongoose');

async function inspect() {
  try {
    const conn = await mongoose.createConnection('mongodb://127.0.0.1:27017/car-auction').asPromise();
    console.log('Connected to local MongoDB');
    const colls = await conn.db.listCollections().toArray();
    console.log('--- Collections Summary ---');
    for (const c of colls) {
      const total = await conn.db.collection(c.name).countDocuments();
      const hmcar = await conn.db.collection(c.name).countDocuments({ tenantId: 'hmcar' });
      console.log(`${c.name}: total=${total}, hmcar=${hmcar}`);
    }
    await conn.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspect();
