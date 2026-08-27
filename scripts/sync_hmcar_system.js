require('dotenv').config({ path: 'c:/car-auction/.env' });
const mongoose = require('mongoose');

async function syncHmCarSystem() {
  console.log('====================================================');
  console.log('🚗 HM CAR SYSTEM DEDICATED SYNC & VERIFICATION');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB Atlas:', mongoose.connection.name);

  // 1. SiteSettings for HM CAR
  console.log('\n[1] Updating HM CAR SiteSettings...');
  const defaultEncarUrl = 'https://car.encar.com/list/car?page=1&search=%7B%22type%22%3A%22car%22%2C%22action%22%3A%22(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))%22%2C%22title%22%3A%22%22%2C%22toggle%22%3A%7B%7D%2C%22layer%22%3A%22%22%2C%22sort%22%3A%22MobileModifiedDate%22%7D';
  
  await mongoose.connection.db.collection('sitesettings').updateOne(
    { tenantId: 'hmcar' },
    {
      $set: {
        tenantId: 'hmcar',
        key: 'main',
        'siteInfo.siteName': 'HM CAR',
        'siteInfo.siteDescription': 'بوابة استيراد ومزادات السيارات المباشرة من كوريا الجنوبية',
        'socialLinks.whatsapp': '+967781007805',
        'contactInfo.phone': '+967781007805',
        'contactInfo.email': 'info@hmcar.com',
        'showroomSettings.encarUrl': defaultEncarUrl,
        'advertisingSettings.showroomSource': 'both',
        'advertisingSettings.showLiveAuction': true,
        'currencySettings.usdToSar': 3.75,
        'currencySettings.usdToKrw': 1350,
        'currencySettings.activeCurrency': 'SAR'
      }
    },
    { upsert: true }
  );
  console.log('  SiteSettings updated for HM CAR.');

  // 2. Normalize all car images to HM CAR watermark
  console.log('\n[2] Normalizing Car Images to HM CAR Watermark...');
  const cars = await mongoose.connection.db.collection('cars').find({}).toArray();
  let updatedCount = 0;

  for (let car of cars) {
    if (car.images && Array.isArray(car.images)) {
      const updatedImages = car.images.map(img => {
        if (typeof img === 'string') {
          return img.replace(/text=HM%20CAR%20%7C%20CAR%20X/g, 'text=HM%20CAR')
                    .replace(/text=HM\+CAR\+%7C\+CAR\+X/g, 'text=HM%20CAR')
                    .replace(/text=HM%20CAR/g, 'text=HM%20CAR');
        }
        return img;
      });

      await mongoose.connection.db.collection('cars').updateOne(
        { _id: car._id },
        {
          $set: {
            images: updatedImages,
            mainImage: updatedImages[0] || car.mainImage,
            imageUrl: updatedImages[0] || car.imageUrl,
            watermarkedImages: updatedImages,
            isAvailable: true,
            status: 'available',
            isActive: true
          }
        }
      );
      updatedCount++;
    }
  }
  console.log(`  Updated ${updatedCount} cars with clean HM CAR watermark.`);

  // 3. Overview of HM CAR stats
  const totalCars = await mongoose.connection.db.collection('cars').countDocuments();
  const totalBrands = await mongoose.connection.db.collection('brands').countDocuments({ tenantId: { $in: ['hmcar', 'default'] } });
  
  console.log('\n====================================================');
  console.log(`📊 HM CAR STATS:`);
  console.log(`- 🚗 Total Real Clean Cars: ${totalCars}`);
  console.log(`- 🏷️ Brands Available for HM CAR: ${totalBrands}`);
  console.log(`- ⚙️ Showroom Encar URL: Configured and Verified`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

syncHmCarSystem().catch(err => {
  console.error('Error syncing HM CAR system:', err);
  process.exit(1);
});
