const mongoose = require('mongoose');
require('dotenv').config();

async function fixDbMainImages() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.log('No MONGO_URI in .env');
    return;
  }
  await mongoose.connect(uri);
  const Car = mongoose.model('Car', new mongoose.Schema({}, { strict: false }));
  
  const cars = await Car.find({});
  console.log(`Auditing ${cars.length} cars in MongoDB...`);
  
  let updatedCount = 0;
  
  for (const car of cars) {
    const rawImages = Array.isArray(car.images) ? car.images : [];
    const realImg = rawImages.find(img => typeof img === 'string' && img.trim() && !img.includes('unsplash.com'));
    
    let needsFix = false;
    const updates = {};
    
    if (realImg) {
      if (!car.mainImage || car.mainImage.includes('unsplash.com')) {
        updates.mainImage = realImg;
        needsFix = true;
      }
      if (!car.imageUrl || car.imageUrl.includes('unsplash.com')) {
        updates.imageUrl = realImg;
        needsFix = true;
      }
      if (!car.image || car.image.includes('unsplash.com')) {
        updates.image = realImg;
        needsFix = true;
      }
    }
    
    if (needsFix) {
      await Car.findByIdAndUpdate(car._id, { $set: updates });
      updatedCount++;
      console.log(`✅ Fixed car ${car._id}: ${car.title || car.make + ' ' + car.model} -> mainImage: ${updates.mainImage || realImg}`);
    }
  }
  
  console.log(`\n🎉 Completed! Updated ${updatedCount} cars in MongoDB.`);
  await mongoose.disconnect();
}

fixDbMainImages().catch(console.error);
