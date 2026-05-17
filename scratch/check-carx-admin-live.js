require('dotenv').config();
const mongoose = require('mongoose');

async function checkAdmin() {
    const uri = process.env.MONGO_URI_CARX || process.env.MONGO_URI;
    console.log('Connecting to:', uri.split('@')[1]); // Log host only for safety
    
    try {
        await mongoose.connect(uri);
        console.log('Connected successfully');
        
        const UserSchema = new mongoose.Schema({
            email: String,
            role: String,
            status: String
        }, { strict: false });
        
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log('Admin found:', admin.email);
        } else {
            console.log('No admin found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdmin();
