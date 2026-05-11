
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection(name, uri) {
    console.log(`Testing ${name} connection...`);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ ${name} connected successfully!`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(`❌ ${name} failed: ${err.message}`);
    }
}

async function run() {
    await testConnection('HMCAR', process.env.MONGO_URI);
    await testConnection('CARX', process.env.MONGO_URI_CARX);
}

run();
