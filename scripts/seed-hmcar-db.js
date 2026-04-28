// seed-hmcar-db.js - رفع البيانات الأولية لقاعدة car-auction
const mongoose = require('mongoose');
const SeedService = require('../services/SeedService');

async function seedHmcarDatabase() {
    console.log('🌱 Starting seeding for HM CAR database...\n');

    const mongoUri = process.env.MONGO_URI_HMCAR || process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('❌ MONGO_URI_HMCAR أو MONGO_URI مطلوب في متغيرات البيئة');
    }

    console.log('📡 Connecting to MongoDB Atlas (HM CAR)...');
    console.log(`URI: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}\n`);

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ Connected to MongoDB Atlas successfully!\n');

        // تشغيل SeedService
        console.log('🌱 Seeding database with initial data...\n');
        await SeedService.runAll();

        console.log('\n✅ HM CAR database seeding completed!');
        console.log('\n📋 Summary:');
        console.log('  - Database: car-auction');
        console.log('  - Admin: dawoodalhash@gmail.com / daood@112233');

    } catch (error) {
        console.error('\n❌ Error during seeding:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

seedHmcarDatabase();
