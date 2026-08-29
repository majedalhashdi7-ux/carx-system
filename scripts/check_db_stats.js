#!/usr/bin/env node
/**
 * فحص إحصائيات قاعدة البيانات - HM CAR System
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const CarSchema = new mongoose.Schema({}, { strict: false });
const Car = mongoose.model('Car', CarSchema);

(async () => {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!\n');

        const total = await Car.countDocuments();
        const hmcarTenant = await Car.countDocuments({ tenantId: 'hmcar' });
        const noTenant = await Car.countDocuments({ tenantId: { $exists: false } });
        
        // Check for unsplash (fake) images
        const fakeUnsplash = await Car.countDocuments({ 
            images: { $elemMatch: { $regex: 'unsplash.com', $options: 'i' } } 
        });
        
        // Check for broken/garbled titles (titles with many question marks)
        const allCars = await Car.find({}, { title: 1, source: 1 }).lean();
        const brokenTitle = allCars.filter(c => c.title && (c.title.match(/\?/g) || []).length > 3).length;
        
        // Source counts
        const encarSource = await Car.countDocuments({ source: 'encar_korea' });
        const koreanImport = await Car.countDocuments({ source: 'korean_import' });
        const hmLocal = await Car.countDocuments({ source: 'hm_local' });
        const noSource = await Car.countDocuments({ source: { $exists: false } });
        
        // Active/inactive
        const active = await Car.countDocuments({ isActive: { $ne: false }, isSold: { $ne: true } });
        const sold = await Car.countDocuments({ isSold: true });
        const inactive = await Car.countDocuments({ isActive: false });

        console.log('=== 📊 Database Statistics ===');
        console.log(`Total cars:          ${total}`);
        console.log(`HM CAR tenant:       ${hmcarTenant}`);
        console.log(`No tenant set:       ${noTenant}`);
        console.log('');
        console.log(`Active cars:         ${active}`);
        console.log(`Sold cars:           ${sold}`);
        console.log(`Inactive cars:       ${inactive}`);
        console.log('');
        console.log(`Source: encar_korea: ${encarSource}`);
        console.log(`Source: korean_imp:  ${koreanImport}`);
        console.log(`Source: hm_local:    ${hmLocal}`);
        console.log(`Source: none:        ${noSource}`);
        console.log('');
        console.log(`Fake (Unsplash):     ${fakeUnsplash}`);
        console.log(`Broken titles:       ${brokenTitle}`);
        
        // Show sample real car
        const realCar = await Car.findOne({ 
            source: { $in: ['encar_korea', 'korean_import'] },
            images: { $not: { $elemMatch: { $regex: 'unsplash.com', $options: 'i' } } }
        }).lean();
        
        if (realCar) {
            console.log('\n=== ✅ Sample Real Car ===');
            console.log(`Title:   ${realCar.title}`);
            console.log(`Source:  ${realCar.source}`);
            console.log(`Tenant:  ${realCar.tenantId}`);
            console.log(`Images:  ${realCar.images?.length || 0} images`);
            console.log(`Img[0]:  ${realCar.images?.[0]?.substring(0, 80)}`);
        }
        
        // Show sample fake car
        const fakeCar = await Car.findOne({ 
            images: { $elemMatch: { $regex: 'unsplash.com', $options: 'i' } }
        }).lean();
        
        if (fakeCar) {
            console.log('\n=== ⚠️ Sample Fake Car (Unsplash) ===');
            console.log(`Title:   ${fakeCar.title?.substring(0, 80)}`);
            console.log(`Source:  ${fakeCar.source}`);
            console.log(`Tenant:  ${fakeCar.tenantId}`);
            console.log(`Img[0]:  ${fakeCar.images?.[0]?.substring(0, 80)}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
