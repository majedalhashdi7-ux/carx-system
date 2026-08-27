require('dotenv').config({ path: 'c:/car-auction/.env' });
const mongoose = require('mongoose');

async function cleanAndDeduplicate() {
  console.log('====================================================');
  console.log('🧹 DATABASE PURGE & DEDUPLICATION');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB Atlas:', mongoose.connection.name);

  // 1. Clean up Cars
  console.log('\n[1] Purging Fake Cars & Deduplicating Real Cars...');
  const allCars = await mongoose.connection.db.collection('cars').find({}).toArray();
  console.log(`  Initial Cars Count: ${allCars.length}`);

  // Delete cars with dummy titles or unsplash placeholders or missing title/make
  const dummyDeleteResult = await mongoose.connection.db.collection('cars').deleteMany({
    $or: [
      { title: { $regex: /test|demo|placeholder|تجريبي|وهمي/i } },
      { make: { $regex: /test|demo|placeholder|تجريبي/i } },
      { 'images.0': { $regex: /unsplash|via\.placeholder|dummyimage/i } },
      { source: { $in: ['dummy', 'mock', 'seed_fake'] } }
    ]
  });
  console.log(`  Deleted ${dummyDeleteResult.deletedCount} dummy/fake cars.`);

  // Deduplicate remaining cars by externalId, encarId, or unique title+year
  const remainingCars = await mongoose.connection.db.collection('cars').find({}).toArray();
  const seenIdentifiers = new Set();
  const duplicateIds = [];

  for (const car of remainingCars) {
    // Unique identifier key
    const rawExternalId = car.externalId ? car.externalId.replace(/^carx-/, '') : null;
    const key = rawExternalId || `${car.make}_${car.model}_${car.year}_${car.specs?.vin || car.priceKrw || car.title}`;

    const dedupeKey = `${car.tenantId || 'default'}_${key}`;
    if (seenIdentifiers.has(dedupeKey)) {
      duplicateIds.push(car._id);
    } else {
      seenIdentifiers.add(dedupeKey);
    }
  }

  if (duplicateIds.length > 0) {
    const dedupeResult = await mongoose.connection.db.collection('cars').deleteMany({
      _id: { $in: duplicateIds }
    });
    console.log(`  Deleted ${dedupeResult.deletedCount} duplicate cars.`);
  } else {
    console.log('  No duplicate cars found.');
  }

  // 2. Ensure all valid real cars have watermarked images & valid fields
  console.log('\n[2] Ensuring Clean Watermark Proxy on All Real Car Images...');
  const validCars = await mongoose.connection.db.collection('cars').find({}).toArray();
  
  for (const car of validCars) {
    let images = car.images || [];
    let updatedImages = [];
    
    for (let img of images) {
      if (typeof img === 'string') {
        if (img.startsWith('/api/v2/image-proxy') || img.startsWith('https://hmcar-system-two.vercel.app/api/v2/image-proxy')) {
          updatedImages.push(img);
        } else if (img.includes('encar.com') || img.includes('encar.co.kr') || img.startsWith('http')) {
          const proxyUrl = `/api/v2/image-proxy?url=${encodeURIComponent(img)}&watermark=true&text=HM%20CAR%20%7C%20CAR%20X`;
          updatedImages.push(proxyUrl);
        } else {
          updatedImages.push(img);
        }
      }
    }

    if (updatedImages.length > 0) {
      await mongoose.connection.db.collection('cars').updateOne(
        { _id: car._id },
        {
          $set: {
            images: updatedImages,
            mainImage: updatedImages[0],
            imageUrl: updatedImages[0],
            watermarkedImages: updatedImages,
            isAvailable: true,
            status: 'available',
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
    }
  }
  console.log(`  Checked & normalized images for ${validCars.length} cars.`);

  // 3. Clean up other collections (dummy orders, bids, reviews)
  console.log('\n[3] Purging other dummy collections...');
  const fakeReviews = await mongoose.connection.db.collection('reviews').deleteMany({
    $or: [{ comment: { $regex: /test|تجريبي|mock/i } }, { user: null }]
  });
  console.log(`  Deleted ${fakeReviews.deletedCount} fake reviews.`);

  // 4. Final Count
  const finalCarsCount = await mongoose.connection.db.collection('cars').countDocuments();
  console.log(`\n✅ Database Cleaned! Total Valid Real Cars: ${finalCarsCount}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

cleanAndDeduplicate().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
