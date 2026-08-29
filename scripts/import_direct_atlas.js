#!/usr/bin/env node
/**
 * استيراد ذكي وجذري - يستخدم /api/v2/system/import-batch
 * يستورد جميع صور السيارة بالكامل (10 إلى 20 صورة لكل سيارة)
 */
require('dotenv').config();
const axios = require('axios');

const PROD_BASE = 'https://hmcar-system-two.vercel.app';
const IMPORT_SECRET = 'hmcar-import-2026';

const ENCAR_QUERY = '(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))';

const MANUFACTURERS = {
    '현대': 'هيونداي', '기아': 'كيا', '제네시스': 'جينيسيس',
    'BMW': 'بي إم دبليو', '벤츠': 'مرسيدس', '아우디': 'أودي',
    '폭스바겐': 'فولكس فاجن', '볼보': 'فولفو', '렉서스': 'لكزس',
    '토요타': 'تويوتا', '혼دا': 'هوندا', '쉐보레': 'شيفروليه',
    '포드': 'فورد', '지프': 'جيب', '랜드로버': 'لاند روفر',
    '포르쉐': 'بورش', '미니': 'ميني', '링컨': 'لينكولن',
    '르노코리아': 'رينو', '르노코리아(삼성)': 'رينو سامسونج',
    'KG모빌리티': 'KG موبيليتي', '닛산': 'نيسان', '인피니티': 'إنفينيتي',
    '마세라티': 'مازيراتي', '롤스로이스': 'رولز رويس', '벤틀리': 'بنتلي',
    '람보르기니': 'لامبورغيني', '페라리': 'فيراري', '캐딜락': 'كاديلاك',
    '쌍용': 'سانغ يونغ', '재규어': 'جاكوار', '볼보': 'فولفو'
};

const FUEL = { '가솔린': 'بنزين', '디젤': 'ديزل', '전기': 'كهربائي', '하이브리드': 'هايبرد', 'LPG': 'غاز', '수소': 'هيدروجين' };
const TRANS = { '오토': 'أوتوماتيك', '수동': 'يدوي', 'A/T': 'أوتوماتيك', 'M/T': 'يدوي', '자동': 'أوتوماتيك', 'CVT': 'CVT' };

function trMfr(val) {
    if (!val) return 'غير معروف';
    for (const [k, v] of Object.entries(MANUFACTURERS)) {
        if (val.includes(k)) return v;
    }
    return val;
}

function trFuel(val) { return FUEL[val] || val || 'بنزين'; }
function trTrans(val) { return TRANS[val] || val || 'أوتوماتيك'; }

function cleanKorean(str = '') {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/하이브리드/g, 'هايبرد').replace(/가솔린/g, 'بنزين').replace(/디젤/g, 'ديزل')
        .replace(/전기/g, 'كهربائي').replace(/오토/g, 'أوتوماتيك').replace(/수동/g, 'يدوي')
        .replace(/신형/g, 'جديد').replace(/풀옵션/g, 'فل كامل').replace(/프리미엄/g, 'بريميوم')
        .replace(/익스클루시브/g, 'إكسكلوسيف').replace(/노블레스/g, 'نوبلس').replace(/시그니처/g, 'سيجنتشر')
        .replace(/터보/g, 'تيربو').replace(/쿠페/g, 'كوبيه').replace(/세단/g, 'سيدان')
        .replace(/스포츠/g, 'سبورت').replace(/투어링/g, 'تورينج').replace(/콰트로/g, 'كواترو')
        .replace(/아방가르드/g, 'أفانت جارد').replace(/스마트/g, 'سمارت').replace(/리미티드/g, 'ليمتد')
        .replace(/클래식/g, 'كلاسيك').replace(/이그제큐티브/g, 'إكزيكتيف').replace(/울트라/g, 'أولترا')
        .replace(/브라이트/g, 'برايت').replace(/인승/g, ' مقاعد').replace(/세대/g, 'الجيل')
        .replace(/더 뉴/g, 'نيو').replace(/올 뉴/g, 'أول نيو').replace(/트림/g, '')
        .replace(/AWD/g, 'AWD').replace(/4WD/g, '4WD').replace(/2WD/g, '2WD')
        .replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u3040-\u309F\u30A0-\u30FF]/g, '')
        .replace(/\s+/g, ' ').trim();
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

function extractAllCarPhotos(car) {
    const photos = [];
    const addUrl = (p) => {
        if (!p) return;
        const u = normalizeImg(typeof p === 'string' ? p : (p?.path || p?.Path || p?.url));
        if (u && !photos.includes(u)) photos.push(u);
    };

    if (Array.isArray(car.Photos)) car.Photos.forEach(addUrl);
    if (Array.isArray(car.PhotoList)) car.PhotoList.forEach(addUrl);
    if (car.Photo) addUrl(car.Photo);

    // Expand Encar standard image sequence (_001.jpg -> _016.jpg)
    const firstImg = photos[0] || (car.Photo ? normalizeImg(car.Photo) : null);
    if (firstImg) {
        const match = firstImg.match(/^(.*_)(\d{3})\.jpg$/i);
        if (match) {
            const prefix = match[1];
            for (let i = 1; i <= 16; i++) {
                const numStr = String(i).padStart(3, '0');
                const nextUrl = `${prefix}${numStr}.jpg`;
                if (!photos.includes(nextUrl)) photos.push(nextUrl);
            }
        } else if (firstImg.endsWith('_')) {
            for (let i = 1; i <= 16; i++) {
                const numStr = String(i).padStart(3, '0');
                const nextUrl = `${firstImg}${numStr}.jpg`;
                if (!photos.includes(nextUrl)) photos.push(nextUrl);
            }
        }
    }

    return photos.filter(Boolean).slice(0, 20);
}

async function fetchEncarPage(page = 1) {
    const offset = (page - 1) * 20;
    const url = `https://api.encar.com/search/car/list/general?count=true&q=${encodeURIComponent(ENCAR_QUERY)}&sr=%7CMobileModifiedDate%7C${offset}%7C20`;
    const res = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://car.encar.com/',
        },
        timeout: 25000
    });
    return res.data;
}

(async () => {
    console.log('🚀 بدء الاستيراد الجذري مع جلب ألبوم الصور الكامل لكل سيارة...');

    const allCars = [];
    const seenUrls = new Set();

    // جلب 5 صفحات = 100 سيارة مع كل صورها
    for (let page = 1; page <= 5; page++) {
        console.log(`📄 جلب الصفحة ${page} من Encar...`);
        try {
            const data = await fetchEncarPage(page);
            const rawCars = data.SearchResults || [];
            console.log(`   ✅ وجدنا ${rawCars.length} سيارة`);

            for (const car of rawCars) {
                const externalUrl = `https://car.encar.com/detail/car?carid=${car.Id}`;
                if (seenUrls.has(externalUrl)) continue;
                seenUrls.add(externalUrl);

                const makeAr = trMfr(car.Manufacturer);
                const modelClean = cleanKorean(car.Model || '');
                const badgeClean = cleanKorean(car.Badge || '');
                const year = car.Year > 9999 ? Math.floor(car.Year / 100) : (car.Year || 2022);
                const priceKrw = (car.Price || 0) * 10000;
                const priceUsd = Math.round((priceKrw / 1350) * 1.10 * 100) / 100;
                const priceSar = Math.round(priceUsd * 3.75);

                const images = extractAllCarPhotos(car);
                if (images.length === 0) continue;

                const titleParts = [makeAr, modelClean, badgeClean].filter(Boolean).join(' ').trim() + ` ${year}`;
                const title = titleParts.replace(/\s+/g, ' ').trim();

                allCars.push({
                    tenantId: 'hmcar',
                    title,
                    make: makeAr,
                    model: modelClean || car.Model || '',
                    year,
                    price: priceSar,
                    priceSar,
                    priceUsd,
                    priceKrw,
                    mileage: car.Mileage || 0,
                    fuelType: trFuel(car.FuelType),
                    transmission: trTrans(car.Transmission),
                    color: '',
                    category: 'sedan',
                    listingType: 'showroom',
                    source: 'encar_korea',
                    externalUrl,
                    images, // 10 to 20 images
                    isActive: true,
                    isSold: false,
                    displayCurrency: 'SAR',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error(`❌ خطأ في جلب صفحة ${page}: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 1200));
    }

    console.log(`\n📦 تم تجهيز ${allCars.length} سيارة مع ألبومات صور كاملة (متوسط ${Math.round(allCars.reduce((a,c)=>a+c.images.length,0)/allCars.length)} صورة لكل سيارة)`);

    if (allCars.length === 0) {
        console.error('❌ لا توجد سيارات للاستيراد');
        process.exit(1);
    }

    // رفع مباشر إلى MongoDB عبر vercel-server.js endpoint
    try {
        console.log('📡 رفع وتحديث السيارات في MongoDB Atlas...');
        const res = await axios.post(`${PROD_BASE}/api/v2/system/import-batch`, {
            secret: IMPORT_SECRET,
            collection: 'cars',
            documents: allCars,
            clearFirst: false
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('\n════════════════════════════════════════');
        console.log('✅ نتيجة تحديث واستيراد ألبومات الصور:');
        console.log(JSON.stringify(res.data, null, 2));
        console.log('════════════════════════════════════════');
    } catch (err) {
        if (err.response) {
            console.error('❌ خطأ من الخادم:', err.response.status, err.response.data);
        } else {
            console.error('❌ خطأ في الاتصال:', err.message);
        }
        process.exit(1);
    }
})();
