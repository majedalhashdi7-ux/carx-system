/**
 * scripts/fix/apply_watermarks_all.js
 * تطبيق العلامة المائية على جميع الصور الموجودة في Atlas
 * يُطبّق على: Cars + SpareParts
 */

require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

function applyWatermark(img) {
    if (!img || typeof img !== 'string') return img;
    const trimmed = img.trim();
    if (!trimmed) return img;
    // تخطّى المعالجة المسبقة
    if (trimmed.includes('image-proxy') || trimmed.includes('watermark=true')) return img;
    // تخطّى الصور الداخلية (uploads/)
    if (trimmed.startsWith('/uploads/') || trimmed.includes('/uploads/')) return img;
    // طبّق البروكسي على الروابط الخارجية
    if (trimmed.startsWith('http')) {
        return `/api/v2/image-proxy?url=${encodeURIComponent(trimmed)}&watermark=true&text=${encodeURIComponent('HM CAR')}`;
    }
    return img;
}

function processImages(images) {
    if (!Array.isArray(images)) return images;
    return images.map(applyWatermark);
}

async function main() {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI غير موجود في متغيرات البيئة');
        process.exit(1);
    }

    console.log('🔌 جاري الاتصال بـ MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ تم الاتصال بنجاح\n');

    const db = mongoose.connection.db;

    // ── 1. معالجة السيارات ──────────────────────────────────────────────────
    console.log('🚗 معالجة صور السيارات...');
    const carsCollection = db.collection('cars');
    const cars = await carsCollection.find({}).toArray();
    let carsUpdated = 0;
    let carsSkipped = 0;

    for (const car of cars) {
        const origImages = car.images || [];
        const origImageUrl = car.imageUrl || '';

        const newImages = processImages(origImages);
        const newImageUrl = applyWatermark(origImageUrl);

        const imagesChanged = JSON.stringify(newImages) !== JSON.stringify(origImages);
        const imageUrlChanged = newImageUrl !== origImageUrl;

        if (imagesChanged || imageUrlChanged) {
            await carsCollection.updateOne(
                { _id: car._id },
                { $set: { images: newImages, imageUrl: newImageUrl } }
            );
            carsUpdated++;
            if (carsUpdated % 20 === 0) console.log(`  ↳ تم معالجة ${carsUpdated} سيارة...`);
        } else {
            carsSkipped++;
        }
    }

    console.log(`✅ السيارات: ${carsUpdated} محدّثة | ${carsSkipped} لا تحتاج تغيير\n`);

    // ── 2. معالجة قطع الغيار ────────────────────────────────────────────────
    console.log('🔧 معالجة صور قطع الغيار...');
    const partsCollection = db.collection('spareparts');
    const parts = await partsCollection.find({}).toArray();
    let partsUpdated = 0;
    let partsSkipped = 0;

    for (const part of parts) {
        const origImages = part.images || (part.img ? [part.img] : []);
        const newImages = processImages(origImages);
        const changed = JSON.stringify(newImages) !== JSON.stringify(origImages);

        if (changed) {
            const updateObj = { images: newImages };
            if (part.img) updateObj.img = applyWatermark(part.img);
            await partsCollection.updateOne({ _id: part._id }, { $set: updateObj });
            partsUpdated++;
            if (partsUpdated % 50 === 0) console.log(`  ↳ تم معالجة ${partsUpdated} قطعة...`);
        } else {
            partsSkipped++;
        }
    }

    console.log(`✅ قطع الغيار: ${partsUpdated} محدّثة | ${partsSkipped} لا تحتاج تغيير\n`);

    // ── الملخص النهائي ───────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════');
    console.log(`🎯 الملخص النهائي:`);
    console.log(`  🚗 السيارات المحدّثة:      ${carsUpdated} / ${cars.length}`);
    console.log(`  🔧 قطع الغيار المحدّثة:    ${partsUpdated} / ${parts.length}`);
    console.log(`  ✅ العلامة المائية مطبّقة على جميع الصور الخارجية`);
    console.log('═══════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال. انتهت العملية بنجاح 🏁');
}

main().catch(err => {
    console.error('❌ خطأ فادح:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
