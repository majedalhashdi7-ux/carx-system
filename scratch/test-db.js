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
    const MONGO_URI = process.env.MONGO_URI;
    const MONGO_URI_CARX = process.env.MONGO_URI_CARX;
    if (!MONGO_URI || !MONGO_URI_CARX) {
        console.error('❌ Set MONGO_URI and MONGO_URI_CARX environment variables');
        process.exit(1);
    }
    await test(MONGO_URI, 'MONGO_URI');
    await test(MONGO_URI_CARX, 'MONGO_URI_CARX');
}
run();
