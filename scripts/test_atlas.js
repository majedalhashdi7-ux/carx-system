const mongoose = require('mongoose');
const uri = 'mongodb+srv://hmcar_user:VoXK0xd2COvWbTH1@cluster0.tirfqnb.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 }).then(async () => {
    const cars = mongoose.connection.db.collection('cars');
    const count = await cars.countDocuments();
    const bySource = await cars.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]).toArray();
    console.log('✅ ATLAS CONNECTED! Total cars:', count);
    console.log('By source:', bySource);
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});
