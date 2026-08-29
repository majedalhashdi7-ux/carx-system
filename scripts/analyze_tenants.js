#!/usr/bin/env node
/**
 * تحليل أعداد السيارات حسب التينانت
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const CarSchema = new mongoose.Schema({}, { strict: false });
const Car = mongoose.model('Car', CarSchema);

(async () => {
    try {
        await mongoose.connect(MONGO_URI);

        // Count by tenantId
        const byTenant = await Car.aggregate([
            { $group: { _id: '$tenantId', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('=== Count by TenantId ===');
        byTenant.forEach(t => console.log(`  ${t._id || 'NULL'}: ${t.count}`));

        // Count by source
        const bySource = await Car.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('\n=== Count by Source ===');
        bySource.forEach(s => console.log(`  ${s._id || 'NULL'}: ${s.count}`));

        // What the API would return for hmcar tenant (matching addTenantFilter logic)
        const hmcarQueryFilter = {
            $or: [
                { tenantId: 'hmcar' },
                { tenantId: 'default' },
                { tenantId: { $exists: false } },
                { tenantId: null },
            ]
        };
        
        const apiTotal = await Car.countDocuments({
            ...hmcarQueryFilter,
            isActive: { $ne: false },
            isSold: { $ne: true }
        });
        
        console.log(`\n=== API Query Result (hmcar filter) ===`);
        console.log(`Active cars visible to HM CAR API: ${apiTotal}`);
        
        // Show fake ones (unsplash)
        const fakeInDefault = await Car.countDocuments({
            tenantId: 'default',
            images: { $elemMatch: { $regex: 'unsplash\\.com', $options: 'i' } }
        });
        console.log(`Fake (unsplash) in default tenant: ${fakeInDefault}`);

        // Sample from default tenant
        const defaultSamples = await Car.find({ tenantId: 'default' })
            .limit(3)
            .lean();
        
        console.log('\n=== Sample Default Tenant Cars ===');
        defaultSamples.forEach((c, i) => {
            const img = c.images?.[0] || 'NO IMG';
            const isReal = !img.includes('unsplash');
            console.log(`${i+1}. ${isReal ? '✅' : '❌'} ${c.title?.substring(0, 60)} | source: ${c.source}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
