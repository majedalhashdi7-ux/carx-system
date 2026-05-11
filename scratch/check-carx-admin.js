
const mongoose = require('mongoose');
require('dotenv').config();

async function checkCarXAdmin() {
    const uri = process.env.MONGO_URI_CARX;
    if (!uri) {
        console.error('MONGO_URI_CARX is missing in .env');
        return;
    }

    try {
        await mongoose.connect(uri);
        console.log('Connected to CarX DB');
        
        const User = require('./models/User');
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
        
        if (admins.length > 0) {
            console.log('Admins found in CarX DB:');
            admins.forEach(admin => {
                console.log(`- Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}`);
            });
        } else {
            console.log('No admins found in CarX DB');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkCarXAdmin();
