require('dotenv').config({ path: 'c:/car-auction/.env' });
const mongoose = require('mongoose');

async function runMasterControl() {
  console.log('====================================================');
  console.log('🚀 SYSTEM MASTER CONTROL & AUDIT SCRIPT');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB Atlas:', mongoose.connection.name);

  // 1. Fix Legacy Indexes
  console.log('\n[1] Fixing Legacy Single-Tenant Indexes...');
  try {
    const brandIndexes = await mongoose.connection.db.collection('brands').indexes();
    const hasLegacyKey1 = brandIndexes.some(idx => idx.name === 'key_1');
    if (hasLegacyKey1) {
      await mongoose.connection.db.collection('brands').dropIndex('key_1');
      console.log('  Dropped legacy unique key_1 index from brands.');
    }
  } catch (err) {
    console.log('  Note on brands index:', err.message);
  }

  // 2. SiteSettings Configuration
  console.log('\n[2] Verifying & Updating SiteSettings...');
  const defaultEncarUrl = 'https://car.encar.com/list/car?page=1&search=%7B%22type%22%3A%22car%22%2C%22action%22%3A%22(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))%22%2C%22title%22%3A%22%22%2C%22toggle%22%3A%7B%7D%2C%22layer%22%3A%22%22%2C%22sort%22%3A%22MobileModifiedDate%22%7D';
  
  await mongoose.connection.db.collection('sitesettings').updateMany(
    {},
    {
      $set: {
        'showroomSettings.encarUrl': defaultEncarUrl,
        'advertisingSettings.showroomSource': 'both',
        'advertisingSettings.showLiveAuction': true,
      }
    }
  );

  await mongoose.connection.db.collection('sitesettings').updateOne(
    { tenantId: 'carx' },
    {
      $set: {
        tenantId: 'carx',
        key: 'main',
        'siteInfo.siteName': 'CAR X',
        'siteInfo.siteDescription': 'نظام المزادات واستيراد السيارات الفاخرة',
        'socialLinks.whatsapp': '+967781007805',
        'contactInfo.phone': '+967781007805',
        'showroomSettings.encarUrl': defaultEncarUrl,
        'advertisingSettings.showroomSource': 'both',
        'currencySettings.usdToSar': 3.75,
        'currencySettings.usdToKrw': 1350,
        'currencySettings.activeCurrency': 'SAR'
      }
    },
    { upsert: true }
  );

  await mongoose.connection.db.collection('sitesettings').updateOne(
    { tenantId: 'hmcar' },
    {
      $set: {
        tenantId: 'hmcar',
        key: 'main',
        'siteInfo.siteName': 'HM CAR',
        'siteInfo.siteDescription': 'بوابة استيراد ومزادات السيارات المباشرة من كوريا',
        'socialLinks.whatsapp': '+967781007805',
        'contactInfo.phone': '+967781007805',
        'showroomSettings.encarUrl': defaultEncarUrl,
        'advertisingSettings.showroomSource': 'both',
        'currencySettings.usdToSar': 3.75,
        'currencySettings.usdToKrw': 1350,
        'currencySettings.activeCurrency': 'SAR'
      }
    },
    { upsert: true }
  );

  console.log('  SiteSettings updated for hmcar & carx.');

  // 3. Audit & Sync Cars across tenants
  console.log('\n[3] Auditing & Synchronizing Cars...');
  const totalCars = await mongoose.connection.db.collection('cars').countDocuments();
  console.log(`  Total cars in DB: ${totalCars}`);

  await mongoose.connection.db.collection('cars').updateMany(
    {},
    {
      $set: {
        isAvailable: true,
        status: 'available',
        isActive: true
      }
    }
  );

  // Sync cars to carx tenant if not present
  const sourceCars = await mongoose.connection.db.collection('cars').find({ source: 'encar_korea', tenantId: 'hmcar' }).toArray();
  console.log(`  Found ${sourceCars.length} source Encar cars in hmcar tenant.`);

  let carxAdded = 0;
  for (let sc of sourceCars) {
    const targetExternalId = `carx-${sc.externalId || sc._id}`;
    const exists = await mongoose.connection.db.collection('cars').findOne({
      tenantId: 'carx',
      $or: [{ externalId: targetExternalId }, { title: sc.title }]
    });
    if (!exists) {
      const carCopy = { ...sc };
      delete carCopy._id;
      carCopy.tenantId = 'carx';
      carCopy.externalId = targetExternalId;
      carCopy.createdAt = new Date();
      carCopy.updatedAt = new Date();
      await mongoose.connection.db.collection('cars').insertOne(carCopy);
      carxAdded++;
    }
  }
  console.log(`  Added ${carxAdded} synchronized luxury cars directly to CAR X tenant.`);

  // 4. Audit Brands
  console.log('\n[4] Auditing Brands...');
  const keyBrands = [
    { key: 'genesis', name: 'جينيسيس', nameAr: 'جينيسيس', nameEn: 'Genesis', country: 'South Korea', logoUrl: 'https://www.carlogos.org/car-logos/genesis-logo.png' },
    { key: 'hyundai', name: 'هيونداي', nameAr: 'هيونداي', nameEn: 'Hyundai', country: 'South Korea', logoUrl: 'https://www.carlogos.org/car-logos/hyundai-logo.png' },
    { key: 'kia', name: 'كيا', nameAr: 'كيا', nameEn: 'Kia', country: 'South Korea', logoUrl: 'https://www.carlogos.org/car-logos/kia-logo.png' },
    { key: 'bmw', name: 'بي إم دبليو', nameAr: 'بي إم دبليو', nameEn: 'BMW', country: 'Germany', logoUrl: 'https://www.carlogos.org/car-logos/bmw-logo.png' },
    { key: 'mercedes-benz', name: 'مرسيدس-بنز', nameAr: 'مرسيدس-بنز', nameEn: 'Mercedes-Benz', country: 'Germany', logoUrl: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png' },
    { key: 'land-rover', name: 'لاند روفر', nameAr: 'لاند روفر', nameEn: 'Land Rover', country: 'UK', logoUrl: 'https://www.carlogos.org/car-logos/land-rover-logo.png' },
    { key: 'audi', name: 'أودي', nameAr: 'أودي', nameEn: 'Audi', country: 'Germany', logoUrl: 'https://www.carlogos.org/car-logos/audi-logo.png' },
    { key: 'porsche', name: 'بورشه', nameAr: 'بورشه', nameEn: 'Porsche', country: 'Germany', logoUrl: 'https://www.carlogos.org/car-logos/porsche-logo.png' },
    { key: 'toyota', name: 'تويوتا', nameAr: 'تويوتا', nameEn: 'Toyota', country: 'Japan', logoUrl: 'https://www.carlogos.org/car-logos/toyota-logo.png' },
    { key: 'lexus', name: 'لكزس', nameAr: 'لكزس', nameEn: 'Lexus', country: 'Japan', logoUrl: 'https://www.carlogos.org/car-logos/lexus-logo.png' }
  ];

  for (let b of keyBrands) {
    for (let tid of ['hmcar', 'carx', 'default']) {
      await mongoose.connection.db.collection('brands').updateOne(
        { tenantId: tid, key: b.key },
        {
          $set: {
            name: b.nameAr,
            nameAr: b.nameAr,
            nameEn: b.nameEn,
            key: b.key,
            country: b.country,
            logoUrl: b.logoUrl,
            isActive: true,
            forCars: true,
            tenantId: tid,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
    }
  }
  console.log('  Brands synced for hmcar, carx, and default.');

  // 5. Final Statistics
  console.log('\n====================================================');
  console.log('📊 FINAL SYSTEM STATUS OVERVIEW');
  console.log('====================================================');
  const finalCars = await mongoose.connection.db.collection('cars').countDocuments();
  const hmcarCars = await mongoose.connection.db.collection('cars').countDocuments({ tenantId: 'hmcar' });
  const carxCars = await mongoose.connection.db.collection('cars').countDocuments({ tenantId: 'carx' });
  const defaultCars = await mongoose.connection.db.collection('cars').countDocuments({ tenantId: 'default' });
  const finalBrands = await mongoose.connection.db.collection('brands').countDocuments();
  const finalUsers = await mongoose.connection.db.collection('users').countDocuments();
  const finalOrders = await mongoose.connection.db.collection('orders').countDocuments();
  const finalInvoices = await mongoose.connection.db.collection('invoices').countDocuments();

  console.log(`- 🚗 Total Real Cars in DB: ${finalCars}`);
  console.log(`    • HM CAR Cars: ${hmcarCars}`);
  console.log(`    • CAR X Cars: ${carxCars}`);
  console.log(`    • Default/Shared Cars: ${defaultCars}`);
  console.log(`- 🏷️ Total Brands: ${finalBrands}`);
  console.log(`- 👤 Total Users / Admins: ${finalUsers}`);
  console.log(`- 📦 Total Orders: ${finalOrders}`);
  console.log(`- 🧾 Total Invoices: ${finalInvoices}`);
  console.log('====================================================');

  await mongoose.disconnect();
}

runMasterControl().catch(err => {
  console.error('Error in master control:', err);
  process.exit(1);
});
