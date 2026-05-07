// scripts/seed/force-seed-hmcar.js
// سكريبت لحقن بيانات حقيقية في قاعدة بيانات المعرض
require('dotenv').config();

const { getConnection } = require('../../tenants/tenant-db-manager');
const SeedService = require('../../services/SeedService');
const tenantsData = require('../../tenants/tenants.json');

async function forceSeed() {
  console.log('🚀 Starting Force Seed for HM CAR...');

  // الهيكل: { tenants: { hmcar: {...}, carx: {...} } }
  const tenantsMap = tenantsData.tenants || tenantsData;
  const hmcar = tenantsMap['hmcar'];

  if (!hmcar) {
    console.error('❌ Tenant hmcar not found in tenants.json');
    process.exit(1);
  }

  // تحليل الـ mongoUri
  let mongoUri = hmcar.mongoUri;
  if (mongoUri && mongoUri.startsWith('ENV:')) {
    const envKey = mongoUri.replace('ENV:', '');
    mongoUri = process.env[envKey];
  }

  if (!mongoUri) {
    console.error('❌ MONGO_URI is not set in environment');
    process.exit(1);
  }

  try {
    console.log(`🔗 Connecting to database for tenant: ${hmcar.id}...`);
    const { models } = await getConnection(hmcar.id, mongoUri);

    // حذف البيانات القديمة للبدء من جديد
    console.log('🧹 Clearing old cars, auctions, brands...');
    await models.Car.deleteMany({ tenantId: hmcar.id });
    if (models.Auction) await models.Auction.deleteMany({ tenantId: hmcar.id });
    if (models.Brand) await models.Brand.deleteMany({ tenantId: hmcar.id });

    // زرع البيانات الحقيقية
    console.log('🌱 Seeding real data for hmcar...');
    await SeedService.seedRealData(models, hmcar.id);

    console.log('✅ Done! Your site now has real data.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

forceSeed();
