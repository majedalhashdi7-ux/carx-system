#!/usr/bin/env node
/**
 * تحليل دقيق لبيانات السيارات في قاعدة البيانات
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const CarSchema = new mongoose.Schema({}, { strict: false });
const Car = mongoose.model('Car', CarSchema);

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected\n');

        const total = await Car.countDocuments({ tenantId: 'hmcar' });
        
        // Cars with Unsplash images
        const withUnsplash = await Car.countDocuments({
            tenantId: 'hmcar',
            images: { $elemMatch: { $regex: 'unsplash\\.com', $options: 'i' } }
        });
        
        // Cars with real Encar images
        const withEncar = await Car.countDocuments({
            tenantId: 'hmcar',
            images: { $elemMatch: { $regex: 'encar\\.com|encar\\.co\\.kr|carpicture', $options: 'i' } }
        });
        
        // Cars with image-proxy URLs
        const withProxy = await Car.countDocuments({
            tenantId: 'hmcar',
            images: { $elemMatch: { $regex: 'image-proxy', $options: 'i' } }
        });

        console.log('=== HM CAR Stats ===');
        console.log(`Total:                ${total}`);
        console.log(`With Unsplash (fake): ${withUnsplash}`);
        console.log(`With Encar images:    ${withEncar}`);
        console.log(`With proxy URLs:      ${withProxy}`);

        // Sample 5 cars sorted by date
        const latest = await Car.find({ tenantId: 'hmcar' })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        
        console.log('\n=== Latest 5 HM CAR Cars ===');
        latest.forEach((c, i) => {
            const img = c.images?.[0] || c.imageUrl || 'NO IMAGE';
            const imgPreview = img.substring(0, 70);
            const isReal = !img.includes('unsplash');
            console.log(`${i+1}. ${isReal ? '✅' : '❌'} ${c.title?.substring(0, 60)} | source: ${c.source}`);
            console.log(`   img: ${imgPreview}`);
        });

        // Check if there are still fake hmcar cars
        if (withUnsplash > 0) {
            console.log('\n⚠️ Need to delete fake cars!');
            const fakeCars = await Car.find({
                tenantId: 'hmcar',
                images: { $elemMatch: { $regex: 'unsplash\\.com', $options: 'i' } }
            }).lean();
            fakeCars.forEach(c => console.log(`  - Delete: ${c.title?.substring(0, 60)}`));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
