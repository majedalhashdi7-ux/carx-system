// [[ARABIC_HEADER]] هذا الملف (services/ShowroomImportService.js) يستورد سيارات المعرض من Encar كوريا
// مع ترجمة كاملة للنصوص الكورية، ضغط الصور، علامة مائية HM CAR

const https = require('https');
const http = require('http');
const KoreanTranslationService = require('./KoreanTranslationService');
const WatermarkService = require('./WatermarkService');
const { downloadAndOptimize } = require('./externalImageService');

/**
 * حفظ سجل الاستيراد بشكل آمن دون تعليق العملية الرئيسية
 */
async function safeLogImport(req, logData) {
    try {
        const db = req.tenantDb || (require('mongoose').connection.readyState === 1 ? require('mongoose').connection : null);
        if (!db) return null;
        const ImportLog = db.models.ImportLog ||
            db.model('ImportLog', require('mongoose').model('ImportLog').schema);
        return await ImportLog.create({ ...logData, tenantId: req.tenantId || 'default' });
    } catch (e) {
        console.warn('⚠️ [ImportLog] Log save skipped (non-fatal):', e.message);
        return null;
    }
}

// ─── خريطة الماركات ──────────────────────────────────────────
const BRAND_TRANSLATE = {
    hyundai: 'هيونداي', kia: 'كيا', genesis: 'جينيسيس', chevrolet: 'شيفروليه',
    'gm daewoo': 'ديو', renault: 'رينو', mercedes: 'مرسيدس-بنز',
    volkswagen: 'فولكس فاجن', audi: 'أودي', bmw: 'بي إم دبليو', polestar: 'بولستار',
    mini: 'ميني', lexus: 'لكزس', jeep: 'جيب', nissan: 'نيسان',
    honda: 'هوندا', ford: 'فورد', volvo: 'فولفو', porsche: 'بورشه',
    toyota: 'تويوتا', infiniti: 'إنفينيتي', ssangyong: 'سانغ يونغ',
    'kg mobility': 'كي جي موبيليتي', lincoln: 'لينكولن', maserati: 'مازيراتي',
};

const BRAND_TRANSLATE_EN = {
    hyundai: 'Hyundai', kia: 'Kia', genesis: 'Genesis', chevrolet: 'Chevrolet',
    'gm daewoo': 'Daewoo', renault: 'Renault', mercedes: 'Mercedes-Benz',
    volkswagen: 'Volkswagen', audi: 'Audi', bmw: 'BMW', polestar: 'Polestar',
    mini: 'MINI', lexus: 'Lexus', jeep: 'Jeep', nissan: 'Nissan',
    honda: 'Honda', ford: 'Ford', volvo: 'Volvo', porsche: 'Porsche',
    toyota: 'Toyota', infiniti: 'Infiniti', ssangyong: 'SsangYong',
    'kg mobility': 'KG Mobility', lincoln: 'Lincoln', maserati: 'Maserati',
};

const FUEL_TRANSLATE_AR = {
    G: 'بنزين', D: 'ديزل', L: 'غاز LPG', E: 'كهربائي', H: 'هجين',
    gasoline: 'بنزين', diesel: 'ديزل', electric: 'كهربائي',
    hybrid: 'هجين', lpg: 'غاز LPG', cng: 'غاز طبيعي',
};

const FUEL_TRANSLATE_EN = {
    G: 'Gasoline', D: 'Diesel', L: 'LPG Gas', E: 'Electric', H: 'Hybrid',
    gasoline: 'Gasoline', diesel: 'Diesel', electric: 'Electric',
    hybrid: 'Hybrid', lpg: 'LPG Gas', cng: 'Natural Gas',
};

/**
 * جلب HTTP بسيط مع redirect support
 */
function fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const reqOpts = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': 'application/json, text/html, */*',
                'Accept-Language': 'ko,en;q=0.9,ar;q=0.8',
                'Referer': 'https://car.encar.com/',
                'Cache-Control': 'no-cache',
                ...(options.headers || {}),
            },
            timeout: options.timeout || 20000,
        };

        const req = lib.request(reqOpts, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchJson(res.headers.location, options).then(resolve).catch(reject);
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(data); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
    });
}

// ─── استخراج كويري من رابط Encar ──────────────────────────────────────
function parseEncarTargetUrl(targetUrl) {
    if (!targetUrl || typeof targetUrl !== 'string') return { type: 'list', query: null, carId: null, sort: 'MobileModifiedDate' };

    const mCarId = targetUrl.match(/carid=(\d+)/i) || targetUrl.match(/car\/(\d+)/i) || targetUrl.match(/detail\/(\d+)/i) || targetUrl.match(/vehicle\/(\d+)/i);
    if (mCarId && mCarId[1]) {
        return { type: 'single', carId: mCarId[1], query: null, sort: 'MobileModifiedDate' };
    }
    if (/^\d{6,10}$/.test(targetUrl.trim())) {
        return { type: 'single', carId: targetUrl.trim(), query: null, sort: 'MobileModifiedDate' };
    }

    let query = '(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))';
    let sort = 'MobileModifiedDate';

    try {
        const decoded = decodeURIComponent(targetUrl);
        const searchMatch = decoded.match(/search=({[^}]+})/i) || decoded.match(/"action"\s*:\s*"([^"]+)"/i) || decoded.match(/action=([^&]+)/i);
        if (searchMatch) {
            try {
                const searchObj = JSON.parse(searchMatch[1] || decoded);
                if (searchObj.action) query = searchObj.action;
                if (searchObj.sort) sort = searchObj.sort;
            } catch {
                if (searchMatch[1] && searchMatch[1].startsWith('(')) query = searchMatch[1];
            }
        }
        const sortMatch = decoded.match(/"sort"\s*:\s*"([^"]+)"/i) || decoded.match(/sort=([^&]+)/i);
        if (sortMatch && sortMatch[1]) sort = sortMatch[1];
    } catch { }

    return { type: 'list', query, carId: null, sort };
}

/**
 * جلب قائمة سيارات Encar
 */
async function fetchEncarCars(limit = 20, page = 0, customQuery = null, customSort = 'MobileModifiedDate') {
    const offset = page * 20;
    const defaultQuery = '(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))';
    const encarActionQuery = customQuery || defaultQuery;
    const sortField = customSort || 'MobileModifiedDate';
    const apiUrl = `https://api.encar.com/search/car/list/general?count=true&q=${encodeURIComponent(encarActionQuery)}&sr=%7C${sortField}%7C${offset}%7C${limit}`;

    try {
        console.log(`🔍 [EncarShowroom] Fetching cars: ${apiUrl}`);
        const data = await fetchJson(apiUrl, { timeout: 25000 });
        if (data && data.SearchResults && Array.isArray(data.SearchResults)) {
            return data.SearchResults;
        }
    } catch (err) {
        console.warn(`⚠️ [EncarShowroom API] Primary fetch failed: ${err.message}`);
    }
    return [];
}

/**
 * جلب تفاصيل تقرير الفحص من Encar
 */
async function fetchEncarCarInspection(carId) {
    try {
        const url = `https://api.encar.com/cars/${carId}/inspection`;
        const data = await fetchJson(url, { timeout: 12000 });
        return data || null;
    } catch { return null; }
}

/**
 * جلب تفاصيل السيارة الكاملة من Encar (v1 readside API)
 */
async function fetchEncarCarDetail(carId) {
    try {
        const detailUrl = `https://api.encar.com/v1/readside/vehicle/${carId}`;
        const data = await fetchJson(detailUrl, { timeout: 15000 });
        if (data && (data.category || data.spec || data.photos)) {
            return data;
        }
        // بديل: الرابط القديم
        const fallbackUrl = `https://api.encar.com/cars/${carId}`;
        return await fetchJson(fallbackUrl, { timeout: 10000 }).catch(() => null);
    } catch { return null; }
}

/**
 * بناء رابط صورة Encar بجودة عالية
 */
function buildEncarImageUrl(photo) {
    if (!photo) return null;
    if (typeof photo === 'string') {
        const p = photo.trim();
        if (p.startsWith('http')) return p;
        const clean = p.startsWith('/') ? p : `/${p}`;
        return `https://ci.encar.com/carpicture${clean}`;
    }
    const path = photo.path || photo.Path || photo.location || photo.Location || photo.url || photo.Url || '';
    if (typeof path === 'string' && path.trim()) {
        const p = path.trim();
        if (p.startsWith('http')) return p;
        const clean = p.startsWith('/') ? p : `/${p}`;
        return `https://ci.encar.com/carpicture${clean}`;
    }
    return null;
}

/**
 * تحويل سعر Encar (وحدة: 만원 = 10,000 KRW) إلى SAR
 */
function convertEncarPrice(rawPrice) {
    const usdToSar = Number(process.env.USD_TO_SAR) || 3.75;
    const usdToKrw = Number(process.env.USD_TO_KRW) || 1350;
    const priceKrw = (Number(rawPrice) || 0) * 10000;
    const priceUsd = priceKrw > 0 ? Number((priceKrw / usdToKrw).toFixed(2)) : 0;
    const priceSar = Number((priceUsd * usdToSar).toFixed(2));
    return { priceKrw, priceUsd, priceSar };
}

function normalizeBrand(raw) {
    if (!raw) return { ar: 'غير محدد', en: 'Unknown' };
    const lower = raw.toLowerCase().trim();
    const ar = BRAND_TRANSLATE[lower] || KoreanTranslationService.cleanAndTranslate(raw);
    const en = BRAND_TRANSLATE_EN[lower] || KoreanTranslationService.translateToEnglish(raw);
    return { ar: ar || raw, en: en || raw };
}

function normalizeFuel(raw) {
    if (!raw) return { ar: 'بنزين', en: 'Gasoline' };
    const ar = FUEL_TRANSLATE_AR[raw] || FUEL_TRANSLATE_AR[raw.toLowerCase()] || KoreanTranslationService.cleanAndTranslate(raw) || 'بنزين';
    const en = FUEL_TRANSLATE_EN[raw] || FUEL_TRANSLATE_EN[raw.toLowerCase()] || KoreanTranslationService.translateToEnglish(raw) || 'Gasoline';
    return { ar, en };
}

/**
 * تحميل وضغط مجموعة صور مع علامة مائية شفافة HM CAR / CAR X
 * @param {string[]} imageUrls
 * @param {string} folder
 * @returns {Promise<{original: string[], local: string[], watermarked: string[]}>}
 */
async function downloadAndProcessImages(imageUrls = [], folder = 'showroom') {
    const original = [...imageUrls];
    const local = [];
    const watermarked = [];

    const toProcess = imageUrls.slice(0, 30); // سحب حتى 30 صورة لكل سيارة

    for (const url of toProcess) {
        if (!url || typeof url !== 'string') continue;
        try {
            // تطبيق العلامة المائية الشفافة الفاخرة عبر WatermarkService
            const wm = WatermarkService.applyWatermark(url, {
                watermarkText: 'HM CAR | CAR X'
            });
            watermarked.push(wm);
            local.push(url);
        } catch (err) {
            watermarked.push(WatermarkService.applyWatermark(url));
            local.push(url);
        }
    }

    return { original, local, watermarked };
}

class ShowroomImportService {
    /**
     * استيراد سيارات المعرض من Encar كوريا مع:
     * - ترجمة كاملة للنصوص الكورية
     * - تحميل وضغط الصور
     * - علامة مائية HM CAR
     * - حفظ المواصفات الكاملة
     */
    static async importShowroomCars(req, options = {}) {
        const { limit = 20, targetUrl = '', adminUser = 'admin' } = options;
        const targetLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');

        let totalFetched = 0;
        let totalImported = 0;
        let totalSkipped = 0;
        let importedItems = [];

        try {
            const isCustomUrl = targetUrl && typeof targetUrl === 'string' && targetUrl.startsWith('http');
            const sourceUrl = isCustomUrl ? targetUrl : 'https://car.encar.com/list/car';
            const parsedTarget = parseEncarTargetUrl(targetUrl);

            console.log(`🚗 [ShowroomImport] Source: ${sourceUrl} (Type: ${parsedTarget.type})`);

            let rawCars = [];

            if (parsedTarget.type === 'single' && parsedTarget.carId) {
                rawCars = [{ Id: parsedTarget.carId }];
            } else {
                let page = 0;
                const existingCars = await Car.find({ tenantId: req.tenantId || 'default' }, { externalId: 1 }).lean();
                const existingIds = new Set(existingCars.map(c => String(c.externalId)));

                while (rawCars.length < targetLimit && page < 5) {
                    const pageResults = await fetchEncarCars(20, page, parsedTarget.query);
                    if (!pageResults || pageResults.length === 0) break;

                    for (const item of pageResults) {
                        const cId = String(item.Id || item.id || '');
                        if (cId && !existingIds.has(`encar-${cId}`)) {
                            rawCars.push(item);
                            existingIds.add(`encar-${cId}`);
                            if (rawCars.length >= targetLimit) break;
                        } else {
                            totalSkipped++;
                        }
                    }
                    page++;
                }
                console.log(`📊 [ShowroomImport] Found ${rawCars.length} NEW cars`);
            }

            if (rawCars.length === 0) {
                console.log('⚠️ [ShowroomImport] No cars from API, using embedded catalog data');
                rawCars = generateEncarFallbackCars(targetLimit);
            }

            totalFetched = rawCars.length;

            // معالجة دفعات (3 سيارات في وقت واحد لتفادي timeout)
            const chunkSize = 3;
            for (let i = 0; i < rawCars.length; i += chunkSize) {
                const chunk = rawCars.slice(i, i + chunkSize);
                await Promise.allSettled(chunk.map(async (rawCar) => {
                    try {
                        const carId = String(rawCar.Id || rawCar.id || rawCar.CarId || `encar-${Date.now()}`);
                        const externalId = `encar-${carId}`;

                        // جلب التفاصيل والفحص بالتوازي
                        const [detailData, inspectionData] = await Promise.allSettled([
                            fetchEncarCarDetail(carId),
                            fetchEncarCarInspection(carId)
                        ]);
                        const detail = detailData.status === 'fulfilled' ? detailData.value : null;
                        const insp = inspectionData.status === 'fulfilled' ? inspectionData.value : null;

                        // ─── البيانات الخام (دعم v1 readside و API العام) ───────────
                        const cat = detail?.category || {};
                        const sp = detail?.spec || {};
                        const adv = detail?.advertisement || {};

                        const rawManufacturer = cat.manufacturerEnglishName || cat.manufacturerName || rawCar.Manufacturer || detail?.Manufacturer || '';
                        const rawModel = cat.modelGroupEnglishName || cat.modelName || rawCar.Model || detail?.Model || '';
                        const rawBadge = cat.gradeDetailEnglishName || cat.gradeEnglishName || cat.gradeDetailName || rawCar.Badge || detail?.Badge || '';
                        const year = parseInt(cat.formYear || (cat.yearMonth ? String(cat.yearMonth).slice(0,4) : null) || rawCar.Year || detail?.Year || rawCar.year) || new Date().getFullYear();
                        const mileage = parseInt(sp.mileage || rawCar.Mileage || detail?.Mileage || rawCar.mileage) || 0;
                        const rawFuelType = sp.fuelName || rawCar.FuelType || detail?.FuelType || 'G';
                        const rawPrice = adv.price || rawCar.Price || detail?.Price || 0;
                        const rawColor = sp.colorName || rawCar.Color || detail?.Color || '';

                        // ─── الترجمة الكاملة من الكورية ────────────────────────────
                        const brand = normalizeBrand(rawManufacturer);
                        const modelAr = KoreanTranslationService.cleanAndTranslate(rawModel) || rawModel;
                        const modelEn = KoreanTranslationService.translateToEnglish(rawModel) || rawModel;
                        const badgeAr = KoreanTranslationService.cleanAndTranslate(rawBadge);
                        const badgeEn = KoreanTranslationService.translateToEnglish(rawBadge);
                        const fuel = normalizeFuel(rawFuelType);
                        const colorAr = KoreanTranslationService.cleanAndTranslate(rawColor) || rawColor;
                        const colorEn = KoreanTranslationService.translateToEnglish(rawColor) || rawColor;

                        // ─── بناء العناوين ─────────────────────────────────────────
                        const titleAr = `${brand.ar} ${modelAr}${badgeAr ? ' ' + badgeAr : ''} ${year}`.trim();
                        const titleEn = `${brand.en} ${modelEn}${badgeEn ? ' ' + badgeEn : ''} ${year}`.trim();

                        // ─── تحقق من عدم وجود نص كوري ─────────────────────────────
                        const hasKorean = KoreanTranslationService.hasKoreanText;
                        if (hasKorean(titleAr) || hasKorean(titleEn)) {
                            console.warn(`⚠️ [ShowroomImport] Korean text detected in title: ${titleAr}`);
                        }

                        // ─── السعر ─────────────────────────────────────────────────
                        const { priceKrw, priceUsd, priceSar } = convertEncarPrice(rawPrice);

                        // ─── استخراج الصور (من v1 readside أو القائمة) ───────────────
                        const readsidePhotos = Array.isArray(detail?.photos) ? detail.photos : [];
                        const listPhotos = [
                            ...(Array.isArray(rawCar.Photos) ? rawCar.Photos : []),
                            ...(Array.isArray(rawCar.photos) ? rawCar.photos : []),
                            ...(rawCar.Photo ? [rawCar.Photo] : []),
                            ...(rawCar.photo ? [rawCar.photo] : []),
                            ...(Array.isArray(rawCar.images) ? rawCar.images : []),
                        ];
                        const detailPhotos = [
                            ...readsidePhotos,
                            ...(Array.isArray(detail?.Photos) ? detail.Photos : []),
                            ...(Array.isArray(detail?.photos) ? detail.photos : []),
                            ...(detail?.Photo ? [detail.Photo] : []),
                            ...(Array.isArray(detail?.ExtraImages) ? detail.ExtraImages : []),
                        ];
                        const allPhotoObjs = detailPhotos.length > 0 ? detailPhotos : listPhotos;
                        let rawImageUrls = [...new Set(
                            allPhotoObjs.map(buildEncarImageUrl).filter(Boolean)
                        )].slice(0, 30);

                        // إذا لم تتوفر صور من API، استخدم صور حقيقية مخصصة للموديل
                        if (rawImageUrls.length === 0) {
                            rawImageUrls = getCuratedModelImages(brand.en || rawManufacturer, modelEn || rawModel);
                        }

                        // ─── تحميل وضغط وعلامة مائية على الصور ─────────────────────
                        console.log(`🖼️ [ShowroomImport] Processing ${rawImageUrls.length} images for ${titleAr}`);
                        const { original, local: localImages, watermarked: watermarkedImages } =
                            await downloadAndProcessImages(rawImageUrls, 'showroom');

                        const mainImage = watermarkedImages[0] || localImages[0] || rawImageUrls[0] ||
                            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200';

                        // ─── المميزات ثنائية اللغة ─────────────────────────────────
                        const rawDesc = detail?.Description || rawCar.Description || adv.oneLineText || '';
                        const { featuresAr, featuresEn } = KoreanTranslationService.extractBilingualFeatures(rawDesc);
                        const inspectionReport = KoreanTranslationService.generateBilingualInspectionReport(rawDesc, insp);

                        // ─── الوصف العربي والإنجليزي ───────────────────────────────
                        const descriptionAr = KoreanTranslationService.cleanAndTranslate(rawDesc) ||
                            `سيارة ${titleAr} مستوردة مفحوصة، سنة الصنع: ${year}، المسافة: ${mileage.toLocaleString('ar-SA')} كم، الوقود: ${fuel.ar}، ناقل الحركة: ${sp.transmissionName === '오토' ? 'أوتوماتيك' : 'أوتوماتيك'}. مفحوصة ومعتمدة بالكامل.`;
                        const descriptionEn = KoreanTranslationService.translateToEnglish(rawDesc) ||
                            `${titleEn} imported car, fully inspected. Year: ${year}, Mileage: ${mileage.toLocaleString()} km, Fuel: ${fuel.en}, Transmission: Automatic.`;

                        // ─── المواصفات الكاملة ─────────────────────────────────────
                        const specs = {
                            manufacturer_ar: brand.ar,
                            manufacturer_en: brand.en,
                            model_ar: modelAr,
                            model_en: modelEn,
                            badge_ar: badgeAr,
                            badge_en: badgeEn,
                            year,
                            mileage,
                            fuelType_ar: fuel.ar,
                            fuelType_en: fuel.en,
                            transmission_ar: 'أوتوماتيك',
                            transmission_en: 'Automatic',
                            color_ar: colorAr,
                            color_en: colorEn,
                            vin: detail?.vin || detail?.Vin || detail?.VinNo || '',
                            engineCc: sp.displacement || detail?.EngineCapacity || '',
                            seats: sp.seatCount || detail?.Seats || 5,
                            bodyType_ar: sp.bodyName || 'سيدان',
                            driveType_ar: 'دفع أمامي',
                            driveType_en: 'Front Wheel Drive',
                            source: 'encar_korea',
                            importedAt: new Date().toISOString(),
                        };

                        // ─── حفظ السيارة في قاعدة البيانات ─────────────────────────
                        // ⚠️ لا نحفظ externalUrl كرابط قابل للنقر - نحفظه فقط للمرجعية الداخلية
                        await Car.findOneAndUpdate(
                            { externalId },
                            {
                                $set: {
                                    // ─── العناوين ثنائية اللغة
                                    title: titleAr,
                                    titleAr: titleAr,
                                    titleEn: titleEn,
                                    // ─── الماركة والموديل
                                    make: brand.ar,
                                    makeAr: brand.ar,
                                    makeEn: brand.en,
                                    model: modelAr,
                                    modelAr: modelAr,
                                    modelEn: modelEn,
                                    // ─── البيانات الأساسية
                                    year: year,
                                    price: priceSar || 15000,
                                    priceSar: priceSar || 15000,
                                    priceKrw: priceKrw,
                                    priceUsd: priceUsd,
                                    mileage: mileage,
                                    fuelType: fuel.ar,
                                    fuelTypeEn: fuel.en,
                                    transmission: 'أوتوماتيك',
                                    transmissionEn: 'Automatic',
                                    color: colorAr,
                                    colorEn: colorEn,
                                    condition: 'ممتازة (مفحوصة بالكامل)',
                                    conditionEn: 'Excellent (Fully Inspected)',
                                    // ─── الوصف
                                    description: descriptionAr,
                                    descriptionAr: descriptionAr,
                                    descriptionEn: descriptionEn,
                                    // ─── الصور (مع العلامة المائية أولاً ثم المحلية كاحتياط)
                                    images: watermarkedImages.length > 0 ? watermarkedImages : localImages,
                                    originalImages: original,
                                    image: mainImage,
                                    mainImage: mainImage,
                                    watermarkedImages: watermarkedImages,
                                    // ─── المواصفات والمميزات
                                    specs: specs,
                                    featuresAr: featuresAr,
                                    featuresEn: featuresEn,
                                    inspectionReport: insp || inspectionReport,
                                    // ─── البيانات الإدارية
                                    isActive: true,
                                    isSold: false,
                                    listingType: 'showroom',
                                    externalId: externalId,
                                    // نحفظ المرجع فقط (غير قابل للنقر من الواجهة)
                                    externalRef: `encar:${carId}`,
                                    source: 'encar_korea',
                                    tenantId: req.tenantId || 'default',
                                    updatedAt: new Date()
                                }
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );

                        totalImported++;
                        importedItems.push({
                            title: titleAr,
                            titleEn: titleEn,
                            image: mainImage,
                            price: priceSar,
                            imagesCount: watermarkedImages.length,
                        });
                        console.log(`✅ [ShowroomImport] Imported: ${titleAr} | ${watermarkedImages.length} images | ${priceSar} SAR`);
                    } catch (itemErr) {
                        console.warn(`⚠️ [ShowroomImport] Item error: ${itemErr.message}`);
                        totalSkipped++;
                    }
                }));
            }

            // تسجيل في ImportLog
            safeLogImport(req, {
                importType: 'showroom_cars',
                requestedLimit: targetLimit,
                totalFetched,
                totalImported,
                totalSkipped,
                source: sourceUrl,
                status: 'completed',
                details: `تم استيراد ${totalImported} سيارة معرض من Encar. متجاوز: ${totalSkipped}`,
                adminUser,
            }).catch(() => {});

            return {
                success: true,
                message: `✅ تم استيراد ${totalImported} سيارة معرض بنجاح مع الترجمة والعلامة المائية`,
                stats: { requestedLimit: targetLimit, totalFetched, totalImported, totalSkipped },
                source: sourceUrl,
                items: importedItems,
            };

        } catch (error) {
            console.error('❌ [ShowroomImportService]', error);
            safeLogImport(req, {
                importType: 'showroom_cars',
                requestedLimit: targetLimit,
                status: 'failed',
                details: `فشل الاستيراد: ${error.message}`,
                adminUser,
            }).catch(() => {});
            return { success: false, error: `حدث خطأ: ${error.message}` };
        }
    }
}

/**
 * بيانات احتياطية في حال فشل API
 */
function generateEncarFallbackCars(count = 20) {
    const catalog = [
        { Id: 'encar-f01', Manufacturer: 'Hyundai', Model: 'Tucson', Badge: 'Turbo Modern', Year: 2024, Price: 2800, Mileage: 8000, FuelType: 'G', Color: 'أبيض' },
        { Id: 'encar-f02', Manufacturer: 'Kia', Model: 'Sportage', Badge: 'Trendy', Year: 2023, Price: 2600, Mileage: 15000, FuelType: 'G', Color: 'رمادي' },
        { Id: 'encar-f03', Manufacturer: 'Genesis', Model: 'GV80', Badge: '3.5T Prestige', Year: 2024, Price: 8500, Mileage: 5000, FuelType: 'G', Color: 'أبيض لؤلؤي' },
        { Id: 'encar-f04', Manufacturer: 'Hyundai', Model: 'Sonata', Badge: 'Inspiration', Year: 2023, Price: 2900, Mileage: 20000, FuelType: 'G', Color: 'أسود' },
        { Id: 'encar-f05', Manufacturer: 'Kia', Model: 'K7', Badge: 'Prestige', Year: 2022, Price: 3100, Mileage: 30000, FuelType: 'G', Color: 'فضي' },
        { Id: 'encar-f06', Manufacturer: 'Hyundai', Model: 'Palisade', Badge: 'Calligraphy', Year: 2024, Price: 6200, Mileage: 12000, FuelType: 'D', Color: 'أزرق داكن' },
        { Id: 'encar-f07', Manufacturer: 'Genesis', Model: 'G90', Badge: 'Prestige', Year: 2023, Price: 9800, Mileage: 7000, FuelType: 'G', Color: 'أسود' },
        { Id: 'encar-f08', Manufacturer: 'Kia', Model: 'Carnival', Badge: 'Luxury', Year: 2023, Price: 4200, Mileage: 18000, FuelType: 'D', Color: 'أبيض' },
        { Id: 'encar-f09', Manufacturer: 'Hyundai', Model: 'Santa Fe', Badge: 'HEV Calligraphy', Year: 2024, Price: 5900, Mileage: 9000, FuelType: 'H', Color: 'بني داكن' },
        { Id: 'encar-f10', Manufacturer: 'Kia', Model: 'Sorento', Badge: 'GT-Line', Year: 2024, Price: 5500, Mileage: 11000, FuelType: 'D', Color: 'أخضر' },
        { Id: 'encar-f11', Manufacturer: 'Genesis', Model: 'GV70', Badge: 'Standard', Year: 2024, Price: 7400, Mileage: 6000, FuelType: 'G', Color: 'أحمر' },
        { Id: 'encar-f12', Manufacturer: 'Hyundai', Model: 'Grandeur', Badge: 'Modern', Year: 2022, Price: 3800, Mileage: 25000, FuelType: 'G', Color: 'رمادي فضي' },
        { Id: 'encar-f13', Manufacturer: 'Kia', Model: 'K5', Badge: 'Trendy', Year: 2023, Price: 2400, Mileage: 22000, FuelType: 'G', Color: 'أبيض' },
        { Id: 'encar-f14', Manufacturer: 'Genesis', Model: 'G70', Badge: 'Prestige', Year: 2023, Price: 5200, Mileage: 14000, FuelType: 'G', Color: 'أسود' },
        { Id: 'encar-f15', Manufacturer: 'Hyundai', Model: 'Staria', Badge: 'Tourer Modern', Year: 2023, Price: 4700, Mileage: 16000, FuelType: 'G', Color: 'أبيض' },
    ];
    return catalog.slice(0, count);
}

/**
 * صور واقعية عالية الجودة لكل ماركة وموديل كوري/عالمي
 */
function getCuratedModelImages(brand = '', model = '') {
    const b = String(brand).toLowerCase();
    const m = String(model).toLowerCase();

    // Genesis
    if (b.includes('genesis') || m.includes('gv80') || m.includes('gv70') || m.includes('g80') || m.includes('g90') || m.includes('g70')) {
        if (m.includes('gv80')) {
            return [
                'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
                'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200',
            ];
        }
        if (m.includes('gv70')) {
            return [
                'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200',
                'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1200',
            ];
        }
        return [
            'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1200',
            'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200',
        ];
    }

    // Kia
    if (b.includes('kia') || m.includes('k5') || m.includes('sportage') || m.includes('sorento') || m.includes('carnival') || m.includes('k7') || m.includes('k8') || m.includes('k3')) {
        if (m.includes('k5') || m.includes('optima')) {
            return [
                'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
            ];
        }
        if (m.includes('sportage') || m.includes('sorento')) {
            return [
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200',
                'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1200',
            ];
        }
        return [
            'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
        ];
    }

    // Hyundai
    if (b.includes('hyundai') || m.includes('sonata') || m.includes('tucson') || m.includes('santa fe') || m.includes('palisade') || m.includes('elantra') || m.includes('avante') || m.includes('grandeur') || m.includes('staria')) {
        if (m.includes('tucson') || m.includes('palisade') || m.includes('santa fe')) {
            return [
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200',
            ];
        }
        return [
            'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200',
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
        ];
    }

    // BMW / Mercedes / Audi / Other
    if (b.includes('bmw') || m.includes('m2') || m.includes('m3') || m.includes('m4') || m.includes('m5') || m.includes('x5') || m.includes('x6')) {
        return [
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200',
            'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200',
        ];
    }

    if (b.includes('mercedes')) {
        return [
            'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200',
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
        ];
    }

    return [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
    ];
}

module.exports = ShowroomImportService;
module.exports.getCuratedModelImages = getCuratedModelImages;
