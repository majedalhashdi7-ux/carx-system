const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDeduplicate() {
  await mongoose.connect(process.env.MONGO_URI);
  const Car = require('../models/Car');

  console.log('--- تنظيف وإزالة التكرار من قاعدة البيانات ---');

  // 1. حذف السيارات التالفة التي بدون صور أو ذات أسماء غير صالحة مثل "S 4 5"
  const deletedBroken = await Car.deleteMany({
    $or: [
      { title: { $in: ['S 4 5', 'S 4 5 202504', 'undefined', 'null', ''] } },
      { images: { $size: 0 }, mainImage: { $in: ['', null] } },
      { price: { $lt: 5000 } }
    ]
  });
  console.log(`تم حذف ${deletedBroken.deletedCount} سيارة تالفة.`);

  // 2. تزويد أي سيارة بمجموعة صور متعددة (3 صور على الأقل) بناءً على نوعها
  const { getCuratedModelImages } = require('../services/ShowroomImportService');
  const allCars = await Car.find().lean();
  console.log(`مراجعة وتحديث صور ${allCars.length} سيارة...`);

  for (const car of allCars) {
    let images = (car.images && car.images.length > 0) ? car.images : [];
    
    // إذا كانت الصور قليلة أو فارغة، نمنحها صور الموديل الحقيقي
    if (images.length < 2) {
      const curated = getCuratedModelImages(car.make || car.brand, car.model || car.title);
      images = curated;
    }

    const mainImg = images[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200';

    await Car.findByIdAndUpdate(car._id, {
      $set: {
        images: images,
        mainImage: mainImg,
        imageUrl: mainImg,
        image: mainImg,
        priceSar: car.price,
        tenantId: 'carx',
        isActive: true,
        isSold: false
      }
    });
  }

  // 3. إزالة السجلات المكررة بالكامل مع الإبقاء على نسخة واحدة فقط
  const seenTitles = new Set();
  const duplicateIds = [];
  const currentCars = await Car.find().sort({ createdAt: -1 }).lean();

  for (const c of currentCars) {
    const key = (c.title || '').trim().toLowerCase();
    if (seenTitles.has(key)) {
      duplicateIds.push(c._id);
    } else {
      seenTitles.add(key);
    }
  }

  if (duplicateIds.length > 0) {
    await Car.deleteMany({ _id: { $in: duplicateIds } });
    console.log(`تم حذف ${duplicateIds.length} سيارة مكررة.`);
  }

  const finalCount = await Car.countDocuments();
  console.log(`✅ إجمالي السيارات النظيفة والفريدة في المعرض الآن: ${finalCount}`);

  await mongoose.disconnect();
}

cleanDeduplicate().catch(console.error);
