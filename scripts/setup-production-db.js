// setup-production-db.js - سكريبت لإنشاء قاعدة البيانات على MongoDB Atlas

const mongoose = require('mongoose');
const SeedService = require('../services/SeedService');

async function setupProductionDatabase() {
    console.log('🚀 Starting production database setup...\n');

    // استخدام MongoDB Atlas الإنتاجية مباشرة
    const mongoUri = process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('❌ MONGO_URI_PRODUCTION أو MONGO_URI مطلوب في متغيرات البيئة');
    }

    console.log('📡 Connecting to MongoDB Atlas (Production)...');
    console.log(`URI: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}\n`);

    try {
        // الاتصال بقاعدة البيانات
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB Atlas successfully!\n');

        // تشغيل SeedService لإنشاء البيانات
        console.log('🌱 Seeding database with initial data...\n');
        await SeedService.runAll();

        console.log('\n✅ Database setup completed successfully!');
        console.log('\n📋 Summary:');
        console.log('  - Database: car-auction');
        console.log('  - Admin account created');
        console.log('  - Default settings initialized');
        console.log('  - Sample data added (if not production)\n');

    } catch (error) {
        console.error('\n❌ Error during database setup:');
        console.error(error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Possible causes:');
            console.log('  - Wrong username or password in MONGO_URI');
            console.log('  - User does not have access to this cluster');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log('\n💡 Possible causes:');
            console.log('  - Wrong cluster name in MONGO_URI');
            console.log('  - Network connectivity issues');
        } else if (error.message.includes('IP')) {
            console.log('\n💡 Possible causes:');
            console.log('  - Your IP is not whitelisted in MongoDB Atlas');
            console.log('  - Add 0.0.0.0/0 to IP Whitelist');
        }
        
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// تشغيل السكريبت
setupProductionDatabase();
