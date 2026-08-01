require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.useDb('car-auction');
    const admins = await db.collection('users').find({
        role: { $in: ['admin', 'super_admin', 'manager'] }
    }).project({ email: 1, name: 1, role: 1, status: 1, tenantId: 1 }).toArray();
    console.log('Admin users found:', admins.length);
    console.log(JSON.stringify(admins, null, 2));
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
