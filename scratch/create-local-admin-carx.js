const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createLocalAdmin() {
    // Use local URI from .env.local if available, otherwise .env
    const uri = 'mongodb://127.0.0.1:27017/carx_local';
    console.log('Connecting to local DB:', uri);

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected successfully');

        // User Schema for CXUser
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, unique: true, required: true },
            password: { type: String, required: true },
            role: { type: String, enum: ['buyer', 'admin', 'manager'], default: 'buyer' },
            status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
        }, { collection: 'cxusers' }); // Using the same collection as CXUser model

        const User = mongoose.models.CXUser || mongoose.model('CXUser', userSchema);

        const adminEmail = process.env.ADMIN_EMAIL || 'dawoodalhash@gmail.com';
        const adminPass = process.env.ADMIN_PASSWORD || 'Daood@2026!Secure';

        const existing = await User.findOne({ email: adminEmail });

        if (existing) {
            console.log(`⚠️  Admin already exists: ${adminEmail}. Updating password...`);
            const hashed = await bcrypt.hash(adminPass, 12);
            await User.updateOne({ _id: existing._id }, { password: hashed, role: 'admin', status: 'active' });
            console.log('✅ Admin updated successfully.');
        } else {
            console.log(`Creating new admin: ${adminEmail}`);
            const hashed = await bcrypt.hash(adminPass, 12);
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: hashed,
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Admin created successfully.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createLocalAdmin();
