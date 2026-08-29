#!/usr/bin/env node
/**
 * سكريبت الاستيراد الذكي الشامل من Encar إلى Production Atlas
 * يقوم بجلب سيارات حقيقية مع الصور والترجمة الكاملة ورفعها كـ Batch دفعة واحدة
 */
require('dotenv').config();
const axios = require('axios');

const PROD_BASE = 'https://hmcar-system-two.vercel.app';
const SECRET = 'hmcar_emergency_reset_2026_X9kP';

const ENCAR_QUERY = '(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))';

const MANUFACTURERS = {
    '현대': 'هيونداي', '기아': 'كيا', '제네시스': 'جينيسيس',
    'BMW': 'بي إم دبليو', '벤츠': 'مرسيدس', '아우디': 'أودي',
    '폭스바겐': 'فولكس فاجن', '볼보': 'فولفو', '렉서스': 'لكزس',
    '토요타': 'تويوتا', '혼دا': 'هوندا', '쉐보레': 'شيفروليه',
    '포드': 'فورد', '지프': 'جيب', '랜드로버': 'لاند روفر',
    '포르쉐': 'بورش', '미니': 'ميني', '링كن': 'لينكولن', '링컨': 'لينكولن',
    '르노코리아': 'رينو', '르노코리아(삼성)': 'رينو سامسونج', 'KG모빌리티': 'KG موبيليتي',
    '닛산': 'نيسان', '인피니티': 'إنفينيتي', '마세라티': 'مازيراتي',
    '롤스로이스': 'رولز رويس', '벤틀리': 'بنتلي', '람보르기니': 'لامبورغيني',
    '페라리': 'فيراري', '캐딜락': 'كاديلاك', '지엠': 'GM',
    '쌍용': 'سانغ يونغ', '재규어': 'جاكوار'
};

const FUEL = { 
    '가솔린': 'بنزين', '디젤': 'ديزل', '전기': 'كهربائي', 
    '하이브리드': 'هايبرد', 'LPG': 'غاز', '수소': 'هيدروجين' 
};

const TRANS = { 
    '오토': 'أوتوماتيك', '수동': 'يدوي', 'A/T': 'أوتوماتيك', 
    'M/T': 'يدوي', '자동': 'أوتوماتيك', 'CVT': 'CVT' 
};

function tr(obj, val) {
    if (!val) return val;
    for (const [k, v] of Object.entries(obj)) {
        if (val.includes(k)) return v;
    }
    return obj[val] || val;
}

function cleanKoreanTokens(str = '') {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/하이브리드/g, 'هايبرد')
        .replace(/가솔린/g, 'بنزين')
        .replace(/디젤/g, 'ديزل')
        .replace(/전기/g, 'كهربائي')
        .replace(/오토/g, 'أوتوماتيك')
        .replace(/수동/g, 'يدوي')
        .replace(/신형/g, 'موديل جديد')
        .replace(/풀옵션/g, 'فل كامل')
        .replace(/프리미엄/g, 'بريميوم')
        .replace(/익스클루시브/g, 'إكسكلوسيف')
        .replace(/노블레스/g, 'نوبلس')
        .replace(/시그니처/g, 'سيجنتشر')
        .replace(/터보/g, 'تيربو')
        .replace(/쿠페/g, 'كوبيه')
        .replace(/세단/g, 'سيدان')
        .replace(/스포츠/g, 'سبورت')
        .replace(/투어링/g, 'تورينج')
        .replace(/콰트로/g, 'كواترو')
        .replace(/아방가르드/g, 'أفانت جارد')
        .replace(/스마트/g, 'سمارت')
        .replace(/리미티드/g, 'ليمتد')
        .replace(/클래식/g, 'كلاسيك')
        .replace(/이그제큐티브/g, 'إكزيكتيف')
        .replace(/울트라/g, 'أولترا')
        .replace(/브라이트/g, 'برايت')
        .replace(/인승/g, ' مقاعد')
        .replace(/세대/g, ' الجيل')
        .replace(/더 뉴/g, 'نيو')
        .replace(/올 뉴/g, 'أول نيو')
        .replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g, '') // إزالة أي حروف كورية متبقية
        .replace(/\s+/g, ' ')
        .trim();
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
    const url = `https://api.encar.com/search/car/list/general?count=true&q=${encodeURIComponent(ENCAR_QUERY)}&sr=%7CMobileModifiedDate%7C${offset}%7C20`;
    const res = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://car.encar.com/',
            'Cache-Control': 'no-cache'
        },
        timeout: 25000
    });
    return res.data;
}

(async () => {
    console.log('🚀 بدء تجميع واستيراد سيارات Encar الحقيقية...');

    const allCars = [];
    const seenUrls = new Set();

    // جلب 4 صفحات = 80 سيارة
    for (let page = 1; page <= 4; page++) {
        console.log(`📄 جلب الصفحة ${page} من Encar...`);
        try {
            const data = await fetchEncarPage(page);
            const rawCars = data.SearchResults || [];
            console.log(`   وجدنا ${rawCars.length} سيارة`);

            for (const car of rawCars) {
                const externalUrl = `https://car.encar.com/detail/car?carid=${car.Id}`;
                if (seenUrls.has(externalUrl)) continue;
                seenUrls.add(externalUrl);

                const makeAr = tr(MANUFACTURERS, car.Manufacturer) || car.Manufacturer || 'غير معروف';
                const modelClean = cleanKoreanTokens(car.Model || '');
                const badgeClean = cleanKoreanTokens(car.Badge || '');
                const year = car.Year > 9999 ? Math.floor(car.Year / 100) : (car.Year || 2022);
                const priceKrw = (car.Price || 0) * 10000;
                const priceUsd = Math.round((priceKrw / 1350) * 1.10 * 100) / 100;
                const priceSar = Math.round(priceUsd * 3.75);

                // استخراج الصور
                const imgs = [];
                if (car.Photo) {
                    const u = normalizeImg(car.Photo);
                    if (u) imgs.push(u);
                }
                if (car.Photos) {
                    const list = Array.isArray(car.Photos) ? car.Photos : [car.Photos];
                    list.forEach(p => {
                        const u = normalizeImg(typeof p === 'string' ? p : (p?.path || p?.Path || p?.url));
                        if (u && !imgs.includes(u)) imgs.push(u);
                    });
                }
                if (car.PhotoList) {
                    car.PhotoList.slice(0, 8).forEach(p => {
                        const u = normalizeImg(typeof p === 'string' ? p : (p?.path || p?.Path));
                        if (u && !imgs.includes(u)) imgs.push(u);
                    });
                }
                const images = imgs.filter(Boolean).slice(0, 10);
                if (images.length === 0) continue; // تخطي السيارات بدون صور

                const titleParts = [makeAr, modelClean, badgeClean, year].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
                const title = titleParts || `${makeAr} ${year}`;

                allCars.push({
                    title,
                    make: makeAr,
                    model: modelClean || car.Model || '',
                    year,
                    price: priceSar,
                    priceSar,
                    priceUsd,
                    priceKrw,
                    mileage: car.Mileage || 0,
                    fuelType: tr(FUEL, car.FuelType) || 'بنزين',
                    transmission: tr(TRANS, car.Transmission) || 'أوتوماتيك',
                    category: 'sedan',
                    listingType: 'showroom',
                    source: 'encar_korea',
                    externalUrl,
                    images,
                    isActive: true,
                    isSold: false,
                    displayCurrency: 'SAR'
                });
            }
        } catch (err) {
            console.error(`❌ خطأ في جلب صفحة ${page}:`, err.message);
        }
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n📦 تم تجهيز ${allCars.length} سيارة حقيقية للرفع...`);

    // إرسال دفعة إلى Production
    try {
        console.log('📡 رفع الدفعة إلى Production API...');
        const res = await axios.post(`${PROD_BASE}/api/v2/auth/internal-reset`, {
            secret: SECRET,
            action: 'import-batch',
            cars: allCars
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
        });

        console.log('✅ نتيجة الرفع:', res.data);

        // تنظيف الصور الوهمية
        console.log('\n🧹 تنظيف أي سيارات بها صور غير صالحة...');
        const cleanRes = await axios.post(`${PROD_BASE}/api/v2/auth/internal-reset`, {
            secret: SECRET,
            action: 'clean-broken'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        console.log('✅ نتيجة التنظيف:', cleanRes.data);

        // إحصائيات نهائية
        const statsRes = await axios.post(`${PROD_BASE}/api/v2/auth/internal-reset`, {
            secret: SECRET,
            action: 'cars-stats'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        console.log('\n📊 إحصائيات السيارات في Production:', statsRes.data);

    } catch (err) {
        console.error('❌ خطأ أثناء الرفع إلى Production:', err.response?.data || err.message);
    }
})();
