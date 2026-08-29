#!/usr/bin/env node
/**
 * إصلاح نظام HM CAR - تحديث tenantId وحذف السيارات الوهمية
 * Fix: Assign all real Encar cars to hmcar tenant + delete fake cars
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const CarSchema = new mongoose.Schema({}, { strict: false });
const Car = mongoose.model('Car', CarSchema);

(async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!\n');

        // ─── Step 1: حذف السيارات الوهمية (Unsplash) المرتبطة بـ hmcar أو default
        console.log('🗑️  Step 1: Deleting fake cars with Unsplash images...');
        const fakeDeleted = await Car.deleteMany({
            images: { $elemMatch: { $regex: 'unsplash\\.com', $options: 'i' } }
        });
        console.log(`   Deleted ${fakeDeleted.deletedCount} fake cars\n`);

        // ─── Step 2: نقل جميع سيارات Encar من tenantId='default' إلى 'hmcar'
        console.log('🔄 Step 2: Moving Encar cars from "default" → "hmcar" tenant...');
        const moved = await Car.updateMany(
            {
                source: 'encar_korea',
                tenantId: { $in: ['default', null, undefined] }
            },
            { $set: { tenantId: 'hmcar' } }
        );
        console.log(`   Moved ${moved.modifiedCount} cars to hmcar tenant\n`);

        // ─── Step 3: تحديث isActive=true لجميع سيارات hmcar
        console.log('✅ Step 3: Activating all hmcar cars...');
        const activated = await Car.updateMany(
            { tenantId: 'hmcar', isActive: { $ne: true } },
            { $set: { isActive: true } }
        );
        console.log(`   Activated ${activated.modifiedCount} cars\n`);

        // ─── Step 4: إصلاح source لسيارات Encar التي ليس لديها source صحيح
        console.log('🔄 Step 4: Fixing source field for hmcar encar cars...');
        const sourceFixed = await Car.updateMany(
            { tenantId: 'hmcar', source: { $nin: ['encar_korea', 'korean_import'] } },
            { $set: { source: 'encar_korea' } }
        );
        console.log(`   Fixed source for ${sourceFixed.modifiedCount} cars\n`);

        // ─── Final Stats
        const total = await Car.countDocuments({ tenantId: 'hmcar' });
        const active = await Car.countDocuments({ tenantId: 'hmcar', isActive: { $ne: false }, isSold: { $ne: true } });
        const encar = await Car.countDocuments({ tenantId: 'hmcar', source: 'encar_korea' });

        console.log('=== ✅ Final HM CAR Stats ===');
        console.log(`Total hmcar cars:   ${total}`);
        console.log(`Active cars:        ${active}`);
        console.log(`Encar Korea cars:   ${encar}`);

        await mongoose.disconnect();
        console.log('\n🎉 Done! HM CAR system is now fixed.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
