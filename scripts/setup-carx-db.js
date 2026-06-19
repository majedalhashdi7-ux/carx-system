// setup-carx-db.js - سكريبت لإنشاء قاعدة البيانات car-x على MongoDB Atlas

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// تعريف نموذج المستخدم البسيط
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function setupCarxDatabase() {
    console.log('🚀 Starting CAR X database setup...\n');

    const mongoUri = process.env.MONGO_URI_CARX || process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('❌ MONGO_URI_CARX أو MONGO_URI مطلوب في متغيرات البيئة');
    }
    
    console.log('📡 Connecting to MongoDB Atlas (CAR X)...');
    console.log(`URI: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}\n`);

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB Atlas successfully!\n');

        // إنشاء الأدمن
        console.log('👤 Creating admin user...');
        const adminEmail = 'dawoodalhash@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD;
        if (!adminPassword) {
            throw new Error('❌ ADMIN_PASSWORD أو DEFAULT_ADMIN_PASSWORD مطلوب في متغيرات البيئة');
        }
        
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const admin = new User({
                name: 'CAR X Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                status: 'active'
            });
            await admin.save();
            console.log(`✅ Admin created: ${adminEmail}`);
        } else {
            console.log(`⚠️ Admin already exists: ${adminEmail}`);
        }

        console.log('\n✅ CAR X database setup completed!');
        console.log('\n📋 Summary:');
        console.log('  - Database: car-x');
        console.log('  - Admin email: dawoodalhash@gmail.com');
        console.log('  - Admin password: [من متغيرات البيئة]');

    } catch (error) {
        console.error('\n❌ Error during database setup:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

setupCarxDatabase();
