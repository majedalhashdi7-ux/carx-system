require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI_HMCAR || process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, dbName: 'car-auction' }).then(async () => {
    const cars = mongoose.connection.db.collection('cars');
    
    // إحصائيات بحسب tenantId
    const byTenant = await cars.aggregate([{ $group: { _id: '$tenantId', count: { $sum: 1 } } }]).toArray();
    console.log('By tenantId:');
    byTenant.forEach(t => console.log(`  "${t._id || 'null'}": ${t.count}`));
    
    // إحصائيات بحسب source
    const bySource = await cars.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]).toArray();
    console.log('\nBy source:');
    bySource.forEach(s => console.log(`  "${s._id || 'null'}": ${s.count}`));
    
    // تصحيح: جميع السيارات تُعيَّن لـ hmcar tenant
    const fixed = await cars.updateMany(
        { tenantId: { $ne: 'hmcar' } },
        { $set: { tenantId: 'hmcar', isActive: true } }
    );
    console.log(`\n✅ Fixed tenantId for ${fixed.modifiedCount} cars → hmcar`);
    
    const total = await cars.countDocuments({ tenantId: 'hmcar' });
    console.log(`📊 Total hmcar cars now: ${total}`);
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(e => { console.error('❌', e.message); process.exit(1); });
