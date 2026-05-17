const mongoose = require('mongoose');

async function testLocal() {
    try {
        console.log('Testing local MongoDB at 127.0.0.1:27017...');
        await mongoose.connect('mongodb://127.0.0.1:27017/test_connect', {
            serverSelectionTimeoutMS: 2000
        });
        console.log('✅ Local MongoDB is running!');
    } catch (error) {
        console.log('❌ Local MongoDB is NOT running.');
        console.error(error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testLocal();
