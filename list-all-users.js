const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/car-auction';

async function listUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}).select('name email role');
        console.log('Total Users:', users.length);
        users.forEach(u => {
            console.log(`- [${u.role}] ID: ${u._id} | Name: ${u.name} | Email: ${u.email}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

listUsers();
