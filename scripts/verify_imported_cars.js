require('dotenv').config({ path: 'c:/car-auction/.env' });
const mongoose = require('mongoose');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    require('../models/Car');
    const Car = mongoose.model('Car');

    const cars = await Car.find({ source: 'encar_korea' }).sort({ updatedAt: -1 }).limit(5).lean();
    console.log(`\n✅ Found ${cars.length} recently imported Encar cars:`);

    cars.forEach((c, idx) => {
        console.log(`\n[${idx + 1}] ${c.title}`);
        console.log(`    Make / Model: ${c.make} / ${c.model} (${c.year})`);
        console.log(`    Price: ${c.priceSar?.toLocaleString()} SAR | ${c.priceKrw?.toLocaleString()} KRW`);
        console.log(`    Specs: Fuel=${c.specs?.fuelType_ar || c.fuelType}, Trans=${c.specs?.transmission_ar || c.transmission}, Seats=${c.specs?.seats}, Vin=${c.specs?.vin || 'N/A'}`);
        console.log(`    Images count: ${c.images?.length || 0}`);
        console.log(`    Sample Image: ${c.images?.[0]}`);
    });

    await mongoose.disconnect();
})();
