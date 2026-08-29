require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI_HMCAR || process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { dbName: 'car-auction' }).then(async () => {
    const cars = mongoose.connection.db.collection('cars');
    const total = await cars.countDocuments();
    const active = await cars.countDocuments({ isActive: { $ne: false }, isSold: { $ne: true } });
    const hmcarTotal = await cars.countDocuments({ tenantId: 'hmcar' });
    const hmcarActive = await cars.countDocuments({ tenantId: 'hmcar', isActive: { $ne: false }, isSold: { $ne: true } });
    console.log(JSON.stringify({ total, active, hmcarTotal, hmcarActive }, null, 2));

    const bySource = await cars.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]).toArray();
    console.log('By source:', bySource);

    const sample = await cars.find({ source: 'encar_korea' }).sort({ _id: -1 }).limit(3).toArray();
    console.log('Sample recently imported cars:');
    sample.forEach(c => {
        console.log(`- Title: ${c.title}, Source: ${c.source}, Tenant: ${c.tenantId}, Active: ${c.isActive}, Sold: ${c.isSold}, Images: ${c.images?.length}`);
    });

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
