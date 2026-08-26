const mongoose = require('mongoose');
require('dotenv').config();

async function syncHmcar() {
  await mongoose.connect(process.env.MONGO_URI);
  const Car = require('../models/Car');
  const SparePart = require('../models/SparePart');
  const Brand = require('../models/Brand');
  const Auction = require('../models/Auction');

  await Car.updateMany({}, { $set: { tenantId: 'hmcar', isActive: true, isSold: false } });
  await SparePart.updateMany({}, { $set: { tenantId: 'hmcar', inStock: true } });
  await Brand.updateMany({}, { $set: { tenantId: 'hmcar', isActive: true, forCars: true } });
  await Auction.updateMany({}, { $set: { tenantId: 'hmcar' } });

  console.log('✅ تم توحيد وتعيين كافة بيانات قاعدة البيانات لتتبع نظام HM CAR بالكامل:');
  console.log('  - Cars (HM CAR):', await Car.countDocuments({ tenantId: 'hmcar' }));
  console.log('  - Parts (HM CAR):', await SparePart.countDocuments({ tenantId: 'hmcar' }));
  console.log('  - Brands (HM CAR):', await Brand.countDocuments({ tenantId: 'hmcar' }));
  console.log('  - Auctions (HM CAR):', await Auction.countDocuments({ tenantId: 'hmcar' }));

  await mongoose.disconnect();
}
syncHmcar().catch(console.error);
