const mongoose = require('mongoose');
require('dotenv').config();

async function checkCars() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.log('No MONGO_URI in .env');
    return;
  }
  await mongoose.connect(uri);
  const Car = mongoose.model('Car', new mongoose.Schema({}, { strict: false }));
  const cars = await Car.find({}).limit(20).sort({ createdAt: -1 }).lean();
  console.log(`Found ${cars.length} cars`);
  cars.forEach((c, idx) => {
    console.log(`\n[${idx + 1}] ID: ${c._id} | Title: ${c.title || c.make + ' ' + c.model}`);
    console.log(`    Source: ${c.source} | listingType: ${c.listingType}`);
    console.log(`    ExternalRef/Url: ${c.externalRef || c.externalUrl || 'None'}`);
    console.log(`    MainImg: ${c.mainImage} | ImgUrl: ${c.imageUrl}`);
    console.log(`    Images: ${JSON.stringify(c.images?.slice(0, 3))}`);
  });
  await mongoose.disconnect();
}
checkCars().catch(console.error);
