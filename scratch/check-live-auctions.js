require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

(async () => {
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 }).asPromise();
    const Car = conn.model('Car', new mongoose.Schema({}, { strict: false }));
    const LiveAuction = conn.model('LiveAuction', new mongoose.Schema({}, { strict: false }));

    const auctionCars = await Car.find({ listingType: 'auction' }).limit(10).lean();
    console.log('=== Cars with listingType=auction in Car collection ===', auctionCars.length);

    const liveSessions = await LiveAuction.find().lean();
    console.log('=== LiveAuction sessions count ===', liveSessions.length);
    liveSessions.forEach(s => {
      console.log(`Session: ${s.title} | Status: ${s.status} | Cars: ${(s.cars || []).length}`);
      if (s.cars && s.cars.length > 0) {
        console.log('  First car title:', s.cars[0].title);
        console.log('  First car images:', s.cars[0].images);
      }
    });

    await conn.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
})();
