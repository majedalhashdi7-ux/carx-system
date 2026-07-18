// scripts/seed/check-db-counts.js
require('dotenv').config();

const { getConnection } = require('../../tenants/tenant-db-manager');
const tenantsData = require('../../tenants/tenants.json');

async function checkCounts() {
    console.log('🧐 Checking database counts for HM CAR...');
    const tenantsMap = tenantsData.tenants || tenantsData;
    const hmcar = tenantsMap['hmcar'];

    let mongoUri = hmcar.mongoUri;
    if (mongoUri && mongoUri.startsWith('ENV:')) {
        mongoUri = process.env[mongoUri.replace('ENV:', '')];
    }

    try {
        const { models } = await getConnection(hmcar.id, mongoUri);
        const { Car, Auction, Brand, User, SparePart } = models;

        const usersCount = await User.countDocuments({ tenantId: 'hmcar' });
        const carsCount = await Car.countDocuments({ tenantId: 'hmcar' });
        const auctionsCount = await Auction.countDocuments({ tenantId: 'hmcar' });
        const brandsCount = await Brand.countDocuments({ tenantId: 'hmcar' });
        const partsCount = SparePart ? await SparePart.countDocuments({ tenantId: 'hmcar' }) : 0;

        console.log('\n📊 HM CAR CURRENT DB STATS:');
        console.log(`👤 Users count: ${usersCount}`);
        console.log(`🚗 Cars count: ${carsCount}`);
        console.log(`🔨 Auctions count: ${auctionsCount}`);
        console.log(`🏷️ Brands count: ${brandsCount}`);
        console.log(`📦 Spare parts count: ${partsCount}`);

        const sampleCars = await Car.find({ tenantId: 'hmcar' }).limit(3);
        console.log('\n🚘 Sample Premium Cars in Store:');
        sampleCars.forEach(c => {
            console.log(`- ${c.title} (${c.priceSar} SAR, ${c.fuelType}, ${c.transmission})`);
        });

        const sampleUsers = await User.find({ tenantId: 'hmcar' }).limit(3);
        console.log('\n👥 Sample Users:');
        sampleUsers.forEach(u => {
            console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
        process.exit(1);
    }
}

checkCounts();
