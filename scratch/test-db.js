const mongoose = require('mongoose');

async function test(uri, name) {
    console.log(`Testing ${name}...`);
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`✅ ${name} connected successfully!`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(`❌ ${name} failed:`, err.message);
    }
}

async function run() {
    await test('mongodb+srv://hmcar_admin:2svcqiBXi2ak6V3T@cluster0.jb1hm41.mongodb.net/?appName=Cluster0', 'MONGO_URI');
    await test('mongodb+srv://carx:alQ1ZGSVtOZ1IPle@cluster0.1bqjdzp.mongodb.net/carx?retryWrites=true&w=majority&appName=Cluster0', 'MONGO_URI_CARX');
}
run();
