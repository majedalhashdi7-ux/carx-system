#!/usr/bin/env node
/**
 * استيراد مباشر من Encar إلى MongoDB Atlas Production
 * اتصال مباشر بقاعدة البيانات - يتجاوز جميع مشاكل API والـ Rate Limiting
 */
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

// الاتصال بقاعدة بيانات hmcar production مباشرة
const MONGO_URI = process.env.MONGO_URI_HMCAR || process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ لم يتم العثور على MONGO_URI_HMCAR في .env');
    process.exit(1);
}

// قاموس الترجمة
const MANUFACTURERS = {
    '현대': 'هيونداي', '기아': 'كيا', '제네시스': 'جينيسيس',
    'BMW': 'بي إم دبليو', '벤츠': 'مرسيدس', '아우디': 'أودي',
    '폭스바겐': 'فولكس فاجن', '볼보': 'فولفو', '렉서스': 'لكزس',
    '토요타': 'تويوتا', '혼다': 'هوندا', '쉐보레': 'شيفروليه',
    '포드': 'فورد', '지프': 'جيب', '랜드로버': 'لاند روفر',
    '포르쉐': 'بورش', '미니': 'ميني', '링컨': 'لينكولن',
    '르노코리아': 'رينو كوريا', 'KG모빌리티': 'KG موبيليتي',
    '닛산': 'نيسان', '인피니티': 'إنفينيتي', '마세라티': 'مازيراتي',
    '롤스로이스': 'رولز رويس', '벤틀리': 'بنتلي', '람보르기니': 'لامبورغيني',
    '페라리': 'فيراري', '캐딜락': 'كاديلاك', '지엠': 'GM',
    '쌍용': 'سانغ يونغ'
};
const FUEL = { '가솔린': 'بنزين', '디젤': 'ديزل', '전기': 'كهربائي', '하이브리드': 'هايبرد', 'LPG': 'غاز', '수소': 'هيدروجين' };
const TRANS = { '오토': 'أوتوماتيك', '수동': 'يدوي', 'A/T': 'أوتوماتيك', 'M/T': 'يدوي', '자동': 'أوتوماتيك', 'CVT': 'CVT' };

function tr(obj, val) {
    if (!val) return val;
    return obj[val] || val;
}

function normalizeImg(p) {
    if (!p) return null;
    p = String(p).trim();
    if (!p) return null;
    if (p.startsWith('http')) return p;
    if (p.startsWith('/carpicture')) return `https://ci.encar.com${p}`;
    if (p.startsWith('/')) return `https://ci.encar.com/carpicture${p}`;
    return `https://ci.encar.com/carpicture/${p}`;
}

async function fetchEncarPage(page = 1) {
    const offset = (page - 1) * 20;
    const query = '(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))';
    const url = `https://api.encar.com/search/car/list/general?count=true&q=${encodeURIComponent(query)}&sr=%7CMobileModifiedDate%7C${offset}%7C20`;
    const res = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
            'Referer': 'https://car.encar.com/',
            'Origin': 'https://car.encar.com',
        },
        timeout: 25000
    });
    return res.data;
}

// Car Schema بسيط للاستيراد
const CarSchema = new mongoose.Schema({
    tenantId: { type: String, default: 'hmcar' },
    title: String,
    make: String,
    model: String,
    year: Number,
    price: Number,
    priceSar: Number,
    priceUsd: Number,
    priceKrw: Number,
    mileage: Number,
    fuelType: String,
    transmission: String,
    color: String,
    category: { type: String, default: 'sedan' },
    listingType: { type: String, default: 'showroom' },
    source: { type: String, default: 'encar_korea' },
    externalUrl: String,
    images: [String],
    isActive: { type: Boolean, default: true },
    isSold: { type: Boolean, default: false },
    displayCurrency: { type: String, default: 'SAR' },
    description: String,
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: false });

(async () => {
    console.log('🔌 الاتصال بـ MongoDB Atlas Production...');
    
    try {
        await mongoose.connect(MONGO_URI, { 
            serverSelectionTimeoutMS: 15000,
            dbName: 'car-auction'
        });
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');
    } catch (err) {
        console.error('❌ فشل الاتصال:', err.message);
        process.exit(1);
    }

    // الحصول على model للـ tenant hmcar
    const Car = mongoose.model('Car', CarSchema);

    const countBefore = await Car.countDocuments({ tenantId: 'hmcar' });
    console.log(`📊 السيارات الحالية لـ hmcar: ${countBefore}`);

    // حذف السيارات القديمة ذات العناوين المكسورة (صور Unsplash)
    const unsplashCount = await Car.countDocuments({ 
        tenantId: 'hmcar',
        images: { $regex: 'unsplash', $options: 'i' }
    });
    if (unsplashCount > 0) {
        const deleted = await Car.deleteMany({ 
            tenantId: 'hmcar',
            images: { $regex: 'unsplash', $options: 'i' }
        });
        console.log(`🗑️  حذف ${deleted.deletedCount} سيارة بصور Unsplash وهمية\n`);
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    // استيراد 5 صفحات = 100 سيارة
    for (let page = 1; page <= 5; page++) {
        console.log(`📄 جلب الصفحة ${page} من Encar...`);
        
        let data;
        try {
            data = await fetchEncarPage(page);
        } catch (err) {
            console.error(`  ❌ فشل جلب الصفحة ${page}: ${err.message}`);
            continue;
        }
        
        const cars = data.SearchResults || [];
        console.log(`  ✅ وجدنا ${cars.length} سيارة`);
        
        for (const car of cars) {
            try {
                const makeAr = tr(MANUFACTURERS, car.Manufacturer) || car.Manufacturer || 'غير معروف';
                const model = car.Model || '';
                const badge = car.Badge || '';
                const year = car.Year > 9999 ? Math.floor(car.Year / 100) : (car.Year || 2020);
                const priceKrw = (car.Price || 0) * 10000;
                const priceUsd = Math.round((priceKrw / 1350) * 1.10 * 100) / 100;
                const priceSar = Math.round(priceUsd * 3.75);
                const externalUrl = `https://car.encar.com/detail/car?carid=${car.Id}`;
                
                // تحقق من التكرار
                const exists = await Car.findOne({ externalUrl, tenantId: 'hmcar' });
                if (exists) {
                    totalSkipped++;
                    continue;
                }
                
                // استخراج الصور
                const imgs = [];
                if (car.Photo) {
                    const url = normalizeImg(car.Photo);
                    if (url) imgs.push(url);
                }
                if (car.Photos) {
                    const list = Array.isArray(car.Photos) ? car.Photos : [car.Photos];
                    list.forEach(p => {
                        const url = normalizeImg(typeof p === 'string' ? p : (p?.path || p?.Path || p?.url));
                        if (url && !imgs.includes(url)) imgs.push(url);
                    });
                }
                if (car.PhotoList) {
                    car.PhotoList.slice(0, 8).forEach(p => {
                        const url = normalizeImg(typeof p === 'string' ? p : (p?.path || p?.Path));
                        if (url && !imgs.includes(url)) imgs.push(url);
                    });
                }
                const images = imgs.filter(Boolean).slice(0, 10);

                const title = [makeAr, model, badge, year].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
                
                await Car.create({
                    tenantId: 'hmcar',
                    title,
                    make: makeAr,
                    model,
                    year,
                    price: priceSar,
                    priceSar,
                    priceUsd,
                    priceKrw,
                    mileage: car.Mileage || 0,
                    fuelType: tr(FUEL, car.FuelType) || 'بنزين',
                    transmission: tr(TRANS, car.Transmission) || 'أوتوماتيك',
                    color: '',
                    category: 'sedan',
                    listingType: 'showroom',
                    source: 'encar_korea',
                    externalUrl,
                    images,
                    isActive: true,
                    isSold: false,
                    displayCurrency: 'SAR'
                });
                
                totalCreated++;
                process.stdout.write(`  ✅ ${title.padEnd(50).substring(0, 50)} | ${priceSar.toLocaleString()} ر.س\n`);

            } catch (err) {
                if (err.code === 11000) {
                    totalSkipped++;
                } else {
                    totalFailed++;
                    console.error(`  ❌ فشل: ${err.message.substring(0, 80)}`);
                }
            }
        }
        
        // تأخير بين الصفحات
        await new Promise(r => setTimeout(r, 1500));
    }

    const countAfter = await Car.countDocuments({ tenantId: 'hmcar' });
    
    console.log('\n════════════════════════════════════════');
    console.log('🎉 انتهى الاستيراد!');
    console.log(`  ✅ مُنشأ:   ${totalCreated}`);
    console.log(`  ⏭️  مكرر:   ${totalSkipped}`);
    console.log(`  ❌ فشل:    ${totalFailed}`);
    console.log(`  📊 قبل:    ${countBefore}`);
    console.log(`  📊 بعد:    ${countAfter}`);
    console.log('════════════════════════════════════════');

    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
})();
