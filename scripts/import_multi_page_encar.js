require('dotenv').config({ path: 'c:/car-auction/.env' });
const mongoose = require('mongoose');

const BASE_ENCAR_QUERY = '(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))';

async function importMultiPage() {
  console.log('====================================================');
  console.log('🚀 MULTI-PAGE ENCAR SHOWROOM IMPORTER');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB Atlas:', mongoose.connection.name);

  require('../models/Car');
  require('../models/SiteSettings');
  require('../models/ImportLog');
  const Car = mongoose.model('Car');
  const SiteSettings = mongoose.model('SiteSettings');
  const ShowroomImportService = require('../services/ShowroomImportService');

  // Let's import pages 1, 2, 3 for hmcar, carx, and default
  const pages = [1, 2, 3];
  
  for (let page of pages) {
    const targetUrl = `https://car.encar.com/list/car?page=${page}&search=%7B%22type%22%3A%22car%22%2C%22action%22%3A%22${encodeURIComponent(BASE_ENCAR_QUERY)}%22%2C%22title%22%3A%22%22%2C%22toggle%22%3A%7B%7D%2C%22layer%22%3A%22%22%2C%22sort%22%3A%22MobileModifiedDate%22%7D`;
    
    console.log(`\n📄 --- Processing Page ${page} ---`);
    for (let tenantId of ['hmcar', 'carx', 'default']) {
      console.log(`  Importing for tenant [${tenantId}]...`);
      const fakeReq = {
        tenantId,
        tenantDb: mongoose.connection,
        tenantModels: { Car, SiteSettings }
      };

      try {
        const res = await ShowroomImportService.importShowroomCars(fakeReq, {
          limit: 15,
          targetUrl,
          adminUser: 'multi_page_importer'
        });
        console.log(`  Tenant [${tenantId}] Page ${page}: Imported=${res.totalImported}, TotalFetched=${res.totalFetched}`);
      } catch (err) {
        console.error(`  Error importing page ${page} for ${tenantId}:`, err.message);
      }
    }
  }

  const finalTotal = await mongoose.connection.db.collection('cars').countDocuments();
  console.log(`\n====================================================`);
  console.log(`🎉 MULTI-PAGE IMPORT COMPLETE! Total Real Cars in DB: ${finalTotal}`);
  console.log(`====================================================\n`);

  await mongoose.disconnect();
}

importMultiPage().catch(err => {
  console.error('Fatal error in multi-page import:', err);
  process.exit(1);
});
