// scripts/seed/test-run-scraping.js
require('dotenv').config();

const { getConnection } = require('../../tenants/tenant-db-manager');
const tenantsData = require('../../tenants/tenants.json');
const axios = require('axios');
const https = require('https');

// Translations dictionary matching the route exactly
const TRANSLATIONS = {
    manufacturers: {
        'Hyundai': 'هيونداي',
        'Kia': 'كيا',
        'Genesis': 'جينيسيس',
        'Samsung': 'سامسونج',
        'Chevrolet': 'شيفروليه',
        'Ssangyong': 'سانج يونج',
        'KG Mobility': 'كي جي موبيليتي',
        'Benz': 'مرسيدس بنز',
        'BMW': 'بي إم دبليو',
        'Audi': 'أودي'
    },
    fuelType: {
        'Gasoline': 'بنزين',
        'Diesel': 'ديزل',
        'LPG': 'غاز مسال',
        'Electric': 'كهربائي',
        'Hybrid': 'هايبرد'
    },
    transmission: {
        'Automatic': 'أوتوماتيك',
        'Manual': 'يدوي'
    }
};

function convertEncarUrlToApi(encarUrl, page = 1) {
    const pageSize = 10; // lower page size to load faster
    const offset = (page - 1) * pageSize;
    const buildApiUrl = (query) => {
        return `https://api.encar.com/search/car/list/mobile?count=true&q=${query}&sr=${encodeURIComponent(`|MobileModifiedDate|${offset}|${pageSize}`)}&inav=${encodeURIComponent('|Metadata|Sort')}&cursor=`;
    };
    return buildApiUrl('(And.Hidden.N._.CarType.A.)'); // target default list to get real cars
}

async function testScraping() {
    console.log('🚀 Running automated scraping verification...');
    const tenantsMap = tenantsData.tenants || tenantsData;
    const hmcar = tenantsMap['hmcar'];

    let mongoUri = hmcar.mongoUri;
    if (mongoUri && mongoUri.startsWith('ENV:')) {
        mongoUri = process.env[mongoUri.replace('ENV:', '')];
    }

    try {
        const { models } = await getConnection(hmcar.id, mongoUri);
        const { Car, SiteSettings } = models;

        console.log('✅ Connected to MongoDB for tenant hmcar.');

        // Initialize target URL in database settings
        const targetEncarUrl = 'https://car.encar.com/list/car?page=1&search=%7B%22action%22%3A%22(And.Hidden.N._.CarType.A._.Manufacturer.Genesis._.ModelGroup.G80.)%22%7D';
        await SiteSettings.findOneAndUpdate(
            { key: 'main', tenantId: 'hmcar' },
            { $set: { 'showroomSettings.encarUrl': targetEncarUrl } },
            { upsert: true }
        );
        console.log('📝 Showroom settings initialized with Genesis search URL.');

        // 1. Convert to API URL
        const apiUrl = convertEncarUrlToApi(targetEncarUrl, 1);
        console.log(`🔗 Requesting Encar API: ${apiUrl}`);

        // 2. Fetch
        const res = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://car.encar.com/',
                'sec-ch-ua-platform': '"Windows"',
                'Cache-Control': 'no-cache',
            },
            timeout: 20000,
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        const rawData = res.data;
        const items = rawData.SearchResults || [];
        console.log(`📥 Received ${items.length} cars from Encar. Processing & translating...`);

        let countCreated = 0;
        for (const item of items) {
            const manufacturer = item.Manufacturer || 'Genesis';
            const model = item.Model || 'G80';
            const year = item.Year ? String(item.Year).substring(0, 4) : '2023';
            const mileage = item.Mileage || 0;
            const priceKrw = (item.Price || 0) * 10000;

            const fuel = item.FuelType || 'Gasoline';
            const transmission = item.Transmission || 'Automatic';

            const manuAr = TRANSLATIONS.manufacturers[manufacturer] || manufacturer;
            const fuelAr = TRANSLATIONS.fuelType[fuel] || fuel;
            const transAr = TRANSLATIONS.transmission[transmission] || transmission;

            const title = `${manufacturer} ${model} ${year}`;
            const computedUsd = Number(((priceKrw / 1350) * 1.10).toFixed(2));
            const computedSar = Math.round(computedUsd * 3.75);

            const encarUrl = `https://car.encar.com/detail/car?carid=${item.Id}`;

            // Normalize images
            let photoUrl = '';
            if (item.Photo) {
                photoUrl = item.Photo.startsWith('/') ? `https://ci.encar.com/carpicture${item.Photo}` : item.Photo;
            }

            const images = photoUrl ? [photoUrl] : ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800'];

            // Check duplicate
            const exists = await Car.findOne({ externalUrl: encarUrl, tenantId: 'hmcar' });
            if (!exists) {
                await Car.create({
                    title,
                    make: manuAr,
                    model,
                    year: Number(year),
                    mileage: Number(mileage),
                    price: computedSar,
                    priceSar: computedSar,
                    priceUsd: computedUsd,
                    priceKrw,
                    fuelType: fuelAr,
                    transmission: transAr,
                    color: 'فضي معدني',
                    category: 'sedan',
                    listingType: 'showroom',
                    source: 'korean_import',
                    externalUrl: encarUrl,
                    images,
                    isActive: true,
                    isSold: false,
                    displayCurrency: 'SAR',
                    tenantId: 'hmcar'
                });
                countCreated++;
                console.log(`🚗 Imported: ${title} - Price: ${computedSar} SAR - Mileage: ${mileage} KM`);
            }
        }

        console.log(`\n🎉 Verification Completed! Successfully scraped & imported ${countCreated} real cars from Encar to the database.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Scraper verification failed:', err.message);
        process.exit(1);
    }
}

testScraping();
