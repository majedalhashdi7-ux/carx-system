// [[ARABIC_HEADER]] هذا الملف (services/LiveAuctionImportService.js) مسؤول عن استيراد سيارات المزاد المباشر
// يدعم الاستيراد المباشر من Encar API الرسمي (أكبر منصة سيارات مستعملة في كوريا)

const https = require('https');
const http = require('http');

// ─── ثوابت Encar ─────────────────────────────────────────────────────────────
const ENCAR_API_BASE    = 'https://api.encar.com';
const ENCAR_IMAGE_BASE  = 'https://ci.encar.com';
const ENCAR_CAR_URL     = 'https://www.encar.com/dc/dc/dcCarDetlView.do?carid=';

// ─── أسعار الصرف (يمكن تحديثها لاحقاً من API خارجي) ────────────────────────
const EXCHANGE_RATES = {
    KRW_TO_SAR: 0.002778,   // 1 KRW = 0.002778 SAR  (تقريبي: 1 SAR = 360 KRW)
    KRW_TO_USD: 0.000741,   // 1 KRW = 0.000741 USD  (تقريبي: 1 USD = 1350 KRW)
};

// ─── ترجمة الماركات الكورية → إنجليزي/عربي ───────────────────────────────────
const MANUFACTURER_MAP = {
    '현대': { en: 'Hyundai',        ar: 'هيونداي'      },
    '기아': { en: 'Kia',            ar: 'كيا'          },
    '제네시스': { en: 'Genesis',    ar: 'جينيسيس'      },
    '쉐보레': { en: 'Chevrolet',    ar: 'شيفروليه'     },
    '르노코리아': { en: 'Renault Korea', ar: 'رينو كوريا' },
    'BMW':   { en: 'BMW',           ar: 'بي إم دبليو'  },
    '벤츠':  { en: 'Mercedes-Benz', ar: 'مرسيدس بنز'   },
    '아우디': { en: 'Audi',         ar: 'أودي'         },
    '폭스바겐': { en: 'Volkswagen', ar: 'فولكس واجن'   },
    '볼보': { en: 'Volvo',          ar: 'فولفو'        },
    '포르쉐': { en: 'Porsche',      ar: 'بورشه'        },
    '랜드로버': { en: 'Land Rover', ar: 'لاند روفر'    },
    '렉서스': { en: 'Lexus',        ar: 'لكزس'         },
    '토요타': { en: 'Toyota',       ar: 'تويوتا'       },
    '닛산': { en: 'Nissan',         ar: 'نيسان'        },
    '혼다': { en: 'Honda',          ar: 'هوندا'        },
    '테슬라': { en: 'Tesla',        ar: 'تسلا'         },
    '미니': { en: 'MINI',           ar: 'ميني'         },
    '인피니티': { en: 'Infiniti',   ar: 'إنفينيتي'     },
    '캐딜락': { en: 'Cadillac',     ar: 'كاديلاك'      },
    '링컨': { en: 'Lincoln',        ar: 'لينكولن'      },
    '마세라티': { en: 'Maserati',   ar: 'مازيراتي'     },
    '재규어': { en: 'Jaguar',       ar: 'جاكوار'       },
    '쌍용': { en: 'SsangYong',      ar: 'سانغ يونغ'    },
    'KG모빌리티': { en: 'KG Mobility', ar: 'كي جي موبيليتي' },
};

// ─── ترجمة نوع الوقود ─────────────────────────────────────────────────────────
const FUEL_MAP = {
    '가솔린': { en: 'Gasoline',      ar: 'بنزين'        },
    '디젤':   { en: 'Diesel',        ar: 'ديزل'         },
    '가솔린+전기': { en: 'Hybrid',   ar: 'هجين'         },
    '전기':   { en: 'Electric',      ar: 'كهربائي'      },
    '수소':   { en: 'Hydrogen',      ar: 'هيدروجين'     },
    '가솔린+LPG': { en: 'LPG',      ar: 'غاز'          },
    'LPG':    { en: 'LPG',           ar: 'غاز'          },
};

// ─── ترجمة دليل الفحص ────────────────────────────────────────────────────────
const INSPECTION_GRADE_MAP = {
    'A':  { en: 'New / Not Repaired',          ar: 'جديد / غير مُصلح'           },
    'B':  { en: 'Normal Wear',                 ar: 'تآكل طبيعي'                 },
    'C':  { en: 'Minor Scratch/Dent',          ar: 'خدش أو طرشة خفيفة'          },
    'W':  { en: 'Wave / Paint Ripple',         ar: 'موجة طلاء'                  },
    'P':  { en: 'Replacement (Panel)',         ar: 'استبدال'                     },
    'PP': { en: 'Partial Replacement',         ar: 'استبدال جزئي'               },
    'Q':  { en: 'Repair Needed',               ar: 'تصليح'                      },
    'X':  { en: 'Major Repair',                ar: 'تصليح كبير'                  },
    'X1': { en: 'Weld/Fusion Repair',          ar: 'لحام أو مسح'                },
    'WR': { en: 'Wave + Repair Required',      ar: 'موجة + تصليح مطلوب'         },
    'WU': { en: 'Wave + Unknown',              ar: 'موجة + غير محدد'            },
    'XXP':{ en: 'Deformation (Front Replace)', ar: 'تشوّه (استبدال أمامي)'      },
    'R':  { en: 'Rust / Corrosion',            ar: 'صدأ'                        },
    'U':  { en: 'Unknown',                     ar: 'غير معروف'                  },
};

// ─── قطع الفحص الرئيسية (مُترجمة) ────────────────────────────────────────────
const PART_NAME_MAP = {
    'Hood': { ar: 'غطاء المحرك' },
    'Hood_Front': { ar: 'مقدمة الغطاء' },
    'Trunk_Lid': { ar: 'غطاء الصندوق' },
    'Front_Bumper': { ar: 'الصدام الأمامي' },
    'Rear_Bumper': { ar: 'الصدام الخلفي' },
    'Right_Front_Fender': { ar: 'الجناح الأمامي الأيمن' },
    'Left_Front_Fender': { ar: 'الجناح الأمامي الأيسر' },
    'Right_Rear_Door': { ar: 'الباب الخلفي الأيمن' },
    'Left_Rear_Door': { ar: 'الباب الخلفي الأيسر' },
    'Right_Rear_Quarter': { ar: 'الجانب الخلفي الأيمن' },
    'Left_Rear_Quarter': { ar: 'الجانب الخلفي الأيسر' },
    'Right_Front_Door': { ar: 'الباب الأمامي الأيمن' },
    'Left_Front_Door': { ar: 'الباب الأمامي الأيسر' },
    'Roof': { ar: 'السقف' },
    'Front_Panel': { ar: 'اللوحة الأمامية' },
    'Rear_Panel': { ar: 'اللوحة الخلفية' },
    'Pillar_A_Right': { ar: 'العمود A الأيمن' },
    'Pillar_A_Left': { ar: 'العمود A الأيسر' },
    'Pillar_B_Right': { ar: 'العمود B الأيمن' },
    'Pillar_B_Left': { ar: 'العمود B الأيسر' },
    'Pillar_C_Right': { ar: 'العمود C الأيمن' },
    'Pillar_C_Left': { ar: 'العمود C الأيسر' },
    'Side_Sill_Right': { ar: 'عتبة الباب الأيمن' },
    'Side_Sill_Left': { ar: 'عتبة الباب الأيسر' },
};

// ─── سجل الاستيراد الآمن ─────────────────────────────────────────────────────
async function safeLogImport(req, logData) {
    try {
        const db = req.tenantDb || (require('mongoose').connection.readyState === 1
            ? require('mongoose').connection : null);
        if (!db) return null;
        const ImportLog = db.models.ImportLog ||
            db.model('ImportLog', require('mongoose').model('ImportLog').schema);
        return await ImportLog.create({ ...logData, tenantId: req.tenantId || 'default' });
    } catch (e) {
        console.warn('⚠️ [ImportLog] Log save skipped:', e.message);
        return null;
    }
}

// ─── HTTP helper مع دعم Redirect ──────────────────────────────────────────────
function fetchJson(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'https:' ? https : http;
            const req = lib.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                    'Referer': 'https://www.encar.com/',
                    'Origin': 'https://www.encar.com',
                },
                timeout: timeoutMs,
            }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return fetchJson(res.headers.location, timeoutMs).then(resolve).catch(reject);
                }
                let data = '';
                res.setEncoding('utf8');
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(null);
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
        } catch (e) {
            reject(e);
        }
    });
}

// ─── استخراج carId من رابط Encar ─────────────────────────────────────────────
function extractEncarId(url) {
    if (!url) return null;
    // رابط مباشر: ...dcCarDetlView.do?carid=42157084
    const m1 = url.match(/carid=(\d+)/i);
    if (m1) return m1[1];
    // رقم فقط
    if (/^\d{6,10}$/.test(url.trim())) return url.trim();
    return null;
}

// ─── ترجمة الشركة المصنعة ────────────────────────────────────────────────────
function translateManufacturer(korean) {
    if (!korean) return { en: 'Unknown', ar: 'غير محدد' };
    const found = MANUFACTURER_MAP[korean];
    if (found) return found;
    // إذا كانت بالإنجليزي مسبقاً
    const lower = korean.toLowerCase();
    for (const [k, v] of Object.entries(MANUFACTURER_MAP)) {
        if (v.en.toLowerCase() === lower) return v;
    }
    return { en: korean, ar: korean };
}

// ─── ترجمة نوع الوقود ─────────────────────────────────────────────────────────
function translateFuel(korean) {
    if (!korean) return { en: 'Gasoline', ar: 'بنزين' };
    return FUEL_MAP[korean] || { en: korean, ar: korean };
}

// ─── تحويل السعر (KRW مُعبَّر عنه بوحدة 만원=10000) ──────────────────────────
function convertPrice(encarPrice) {
    const priceKrw = Math.round((Number(encarPrice) || 0) * 10000);
    const priceSar = Math.round(priceKrw * EXCHANGE_RATES.KRW_TO_SAR);
    const priceUsd = Math.round(priceKrw * EXCHANGE_RATES.KRW_TO_USD);
    return { priceKrw, priceSar, priceUsd };
}

// ─── بناء روابط الصور من Encar ───────────────────────────────────────────────
function buildImageUrls(photos) {
    if (!photos || !Array.isArray(photos)) return [];
    return photos
        .sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
        .map(p => {
            const loc = p.location || '';
            return loc.startsWith('http') ? loc : `${ENCAR_IMAGE_BASE}${loc}`;
        })
        .filter(Boolean);
}

// ─── جلب قائمة سيارات من Encar API ──────────────────────────────────────────
async function fetchEncarList(limit = 20, searchQuery = '') {
    try {
        const q = searchQuery
            ? `(And.Hidden.N._.${searchQuery}_.CarType.A.)`
            : '(And.Hidden.N._.CarType.A.)';
        const url = `${ENCAR_API_BASE}/search/car/list/general?count=true&q=${encodeURIComponent(q)}&sr=%7CModifiedDate%7C0%7C${limit}`;
        console.log(`🔍 [Encar] Fetching list: ${url}`);
        const data = await fetchJson(url);
        if (!data || !data.SearchResults) return [];
        return data.SearchResults;
    } catch (err) {
        console.warn(`⚠️ [Encar] List fetch failed: ${err.message}`);
        return [];
    }
}

// ─── جلب تفاصيل سيارة واحدة ──────────────────────────────────────────────────
async function fetchEncarCarDetail(carId) {
    try {
        const url = `${ENCAR_API_BASE}/cars/${carId}`;
        console.log(`📋 [Encar] Fetching car detail: ${carId}`);
        const data = await fetchJson(url, 12000);
        return data || null;
    } catch (err) {
        console.warn(`⚠️ [Encar] Detail fetch failed for ${carId}: ${err.message}`);
        return null;
    }
}

// ─── جلب تقرير الفحص ─────────────────────────────────────────────────────────
async function fetchEncarInspection(carId) {
    try {
        const url = `${ENCAR_API_BASE}/cars/${carId}/inspection`;
        console.log(`🔬 [Encar] Fetching inspection: ${carId}`);
        const data = await fetchJson(url, 10000);
        if (!data) return null;

        // معالجة بيانات الفحص وترجمتها
        const points = [];
        if (data.BodyPoints) {
            for (const [part, grade] of Object.entries(data.BodyPoints)) {
                if (grade && grade !== 'A' && grade !== '') {
                    points.push({
                        part,
                        partAr: PART_NAME_MAP[part]?.ar || part,
                        grade,
                        gradeAr: INSPECTION_GRADE_MAP[grade]?.ar || grade,
                        gradeEn: INSPECTION_GRADE_MAP[grade]?.en || grade,
                    });
                }
            }
        }

        return {
            grade: data.TotalGrade || null,
            specialNote: data.SpecialNote || '',
            points,
            rawData: data,
            gradeGuide: Object.entries(INSPECTION_GRADE_MAP).map(([code, t]) => ({
                code, ...t
            })),
        };
    } catch (err) {
        console.warn(`⚠️ [Encar] Inspection fetch failed for ${carId}: ${err.message}`);
        return null;
    }
}

// ─── تحويل بيانات Encar → تنسيق السيارة في HMCar ─────────────────────────────
function mapEncarCarToHMCar(listItem, detail, inspection) {
    const carId     = String(listItem.Id || listItem.id || '');
    const maker     = translateManufacturer(listItem.Manufacturer || detail?.Manufacturer);
    const fuel      = translateFuel(listItem.FuelType || detail?.FuelType);
    const prices    = convertPrice(listItem.Price || detail?.Price || 0);

    // الموديل: نُبقي الاسم الكوري + نُضيف الإنجليزي إن وُجد
    const modelKo   = listItem.Model || detail?.Model || '';
    const badge     = listItem.Badge || detail?.Badge || '';
    const year      = listItem.FormYear || String(listItem.Year || '').slice(0, 4) || '';
    const mileage   = Math.round(Number(listItem.Mileage || detail?.Mileage || 0));

    // الصور: من القائمة + التفاصيل
    const listPhotos   = listItem.Photos || [];
    const detailPhotos = detail?.Photos || [];
    const allPhotos    = detailPhotos.length > 0 ? detailPhotos : listPhotos;
    const images       = buildImageUrls(allPhotos);

    // إضافة صور إضافية من صور التفاصيل (حتى 40 صورة)
    const extraImages  = detail?.ExtraImages
        ? buildImageUrls(detail.ExtraImages)
        : [];
    const allImages = [...new Set([...images, ...extraImages])].slice(0, 40);

    const titleEn = `${maker.en} ${modelKo} ${badge} ${year}`.replace(/\s+/g, ' ').trim();
    const titleAr = `${maker.ar} ${modelKo} ${badge} ${year}`.replace(/\s+/g, ' ').trim();

    // المواصفات الكاملة
    const specs = {
        manufacturer_en: maker.en,
        manufacturer_ar: maker.ar,
        model: modelKo,
        badge,
        year,
        mileage,
        mileageDisplay: `${mileage.toLocaleString('ar-SA')} كم`,
        fuelType_en: fuel.en,
        fuelType_ar: fuel.ar,
        transmission: (detail?.GearType === '자동' || listItem.GearType === '자동') ? 'أوتوماتيك' : 'يدوي',
        transmission_en: (detail?.GearType === '자동' || listItem.GearType === '자동') ? 'Automatic' : 'Manual',
        color: detail?.Color || '',
        seats: detail?.Seats || '',
        displacement: detail?.Displacement || '',
        driveType: detail?.DriveType || '',
        vin: detail?.Vin || '',
        registrationDate: detail?.RegistrationDate || '',
        importType: detail?.ImportType || 'local',
        inspectionDate: detail?.InspectionDate || '',
        officeCityState: listItem.OfficeCityState || '',
    };

    return {
        encarId:         carId,
        externalId:      `encar-${carId}`,
        externalUrl:     `${ENCAR_CAR_URL}${carId}`,
        source:          'encar',
        title:           titleEn,
        titleAr,
        titleEn,
        make:            maker.en,
        makeAr:          maker.ar,
        model:           modelKo,
        year:            parseInt(year) || new Date().getFullYear(),
        priceKrw:        prices.priceKrw,
        priceSar:        prices.priceSar,
        priceUsd:        prices.priceUsd,
        price:           prices.priceSar,
        mileage,
        fuelType:        fuel.ar,
        fuelType_en:     fuel.en,
        transmission:    specs.transmission,
        images:          allImages,
        image:           allImages[0] || '',
        specs,
        inspectionReport: inspection || null,
        isActive:        true,
        isSold:          false,
        listingType:     'auction',
        tenantId:        'default',
    };
}

// ─── الكتالوج الاحتياطي (fallback عند فشل API) ────────────────────────────────
function getFallbackCars() {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return [
        {
            encarId: 'fb-001', externalId: 'encar-fb-001',
            externalUrl: 'https://www.encar.com', source: 'encar',
            title: 'Hyundai Tucson 2022', titleAr: 'هيونداي توسان 2022', titleEn: 'Hyundai Tucson 2022',
            make: 'Hyundai', makeAr: 'هيونداي', model: 'Tucson', year: 2022,
            priceKrw: 27900000, priceSar: 77500, priceUsd: 20666, price: 77500,
            mileage: 38000, fuelType: 'بنزين', fuelType_en: 'Gasoline',
            transmission: 'أوتوماتيك',
            images: ['https://ci.encar.com/carpicture04/pic4214/42148591_001.jpg'],
            image: 'https://ci.encar.com/carpicture04/pic4214/42148591_001.jpg',
            specs: { manufacturer_en: 'Hyundai', manufacturer_ar: 'هيونداي', model: 'Tucson', year: '2022', mileage: 38000, fuelType_ar: 'بنزين', fuelType_en: 'Gasoline', transmission: 'أوتوماتيك', transmission_en: 'Automatic' },
            inspectionReport: null, isActive: true, isSold: false, listingType: 'auction', tenantId: 'default',
            startsAt: now, endsAt: end,
        },
        {
            encarId: 'fb-002', externalId: 'encar-fb-002',
            externalUrl: 'https://www.encar.com', source: 'encar',
            title: 'Genesis GV70 2023', titleAr: 'جينيسيس GV70 2023', titleEn: 'Genesis GV70 2023',
            make: 'Genesis', makeAr: 'جينيسيس', model: 'GV70', year: 2023,
            priceKrw: 44900000, priceSar: 124722, priceUsd: 33259, price: 124722,
            mileage: 21720, fuelType: 'بنزين', fuelType_en: 'Gasoline',
            transmission: 'أوتوماتيك',
            images: ['https://ci.encar.com/carpicture08/pic4218/42182644_001.jpg'],
            image: 'https://ci.encar.com/carpicture08/pic4218/42182644_001.jpg',
            specs: { manufacturer_en: 'Genesis', manufacturer_ar: 'جينيسيس', model: 'GV70', year: '2023', mileage: 21720, fuelType_ar: 'بنزين', fuelType_en: 'Gasoline', transmission: 'أوتوماتيك', transmission_en: 'Automatic' },
            inspectionReport: null, isActive: true, isSold: false, listingType: 'auction', tenantId: 'default',
            startsAt: now, endsAt: end,
        },
    ];
}

// ─── الخدمة الرئيسية ─────────────────────────────────────────────────────────
class LiveAuctionImportService {

    /**
     * استيراد سيارات مزاد من Encar
     * @param {Object} req
     * @param {Object} options - { limit, targetUrl, adminUser, searchQuery }
     */
    static async importLiveAuctionCars(req, options = {}) {
        const { limit = 10, targetUrl = '', adminUser = 'admin', searchQuery = '' } = options;
        const targetLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

        const { getModel } = require('../tenants/tenant-model-helper');
        const Auction = getModel(req, 'Auction');
        const Car = getModel(req, 'Car');

        let totalFetched = 0, totalImported = 0, totalSkipped = 0;
        let importedItems = [];
        let usedFallback = false;

        try {
            console.log(`🚀 [EncarImport] Starting import — limit: ${targetLimit}, url: ${targetUrl}`);

            // ─── تحديد ما إذا كان رابط سيارة واحدة أو قائمة ─────────────────
            let carsData = [];
            const specificCarId = extractEncarId(targetUrl);

            if (specificCarId) {
                // ─── استيراد سيارة واحدة بـ ID ──────────────────────────────
                console.log(`🚗 [EncarImport] Single car import: ${specificCarId}`);
                const [detail, inspection] = await Promise.allSettled([
                    fetchEncarCarDetail(specificCarId),
                    fetchEncarInspection(specificCarId),
                ]);
                const detailData    = detail.status === 'fulfilled' ? detail.value : null;
                const inspData      = inspection.status === 'fulfilled' ? inspection.value : null;

                if (detailData) {
                    // بناء listItem من التفاصيل
                    const listItem = {
                        Id: specificCarId,
                        Manufacturer: detailData.Manufacturer,
                        Model: detailData.Model,
                        Badge: detailData.Badge,
                        Year: detailData.Year,
                        FormYear: detailData.FormYear,
                        Mileage: detailData.Mileage,
                        FuelType: detailData.FuelType,
                        Price: detailData.Price,
                        Photos: detailData.Photos || [],
                    };
                    carsData.push({ listItem, detail: detailData, inspection: inspData });
                }
            } else {
                // ─── استيراد قائمة سيارات ────────────────────────────────────
                console.log(`📋 [EncarImport] List import — query: "${searchQuery || 'general'}"`);
                
                // جلب قائمة المعرفات الموجودة مسبقاً في قاعدة البيانات لمنع التكرار وجلب الجديد دائماً
                const existingAuctions = await Auction.find({ tenantId: req.tenantId || 'default' }, { externalId: 1 }).lean();
                const existingIds = new Set(existingAuctions.map(a => String(a.externalId)));

                let page = 0;
                let candidates = [];

                // تكرار الصفحات حتى نجمع العدد المطلوب من السيارات الجديدة غير المستوردة مسبقاً
                while (candidates.length < targetLimit && page < 5) {
                    const offset = page * 20;
                    const q = searchQuery
                        ? `(And.Hidden.N._.${searchQuery}_.CarType.A.)`
                        : '(And.Hidden.N._.CarType.A.)';
                    const listUrl = `${ENCAR_API_BASE}/search/car/list/general?count=true&q=${encodeURIComponent(q)}&sr=%7CModifiedDate%7C${offset}%7C20`;
                    console.log(`🔍 [EncarImport] Fetching page ${page + 1}: ${listUrl}`);
                    const listData = await fetchJson(listUrl);
                    const pageResults = (listData && listData.SearchResults) || [];

                    if (pageResults.length === 0) break;

                    for (const item of pageResults) {
                        const carId = String(item.Id || '');
                        if (carId && !existingIds.has(`encar-${carId}`)) {
                            candidates.push(item);
                            existingIds.add(`encar-${carId}`);
                            if (candidates.length >= targetLimit) break;
                        } else {
                            totalSkipped++;
                        }
                    }
                    page++;
                }

                console.log(`📊 [EncarImport] Found ${candidates.length} NEW unimported cars after scanning ${page} pages`);

                // جلب تفاصيل كل سيارة جديدة تسلسلياً
                for (const item of candidates) {
                    try {
                        const carId = String(item.Id || '');
                        if (!carId) continue;

                        const [detail, inspection] = await Promise.allSettled([
                            fetchEncarCarDetail(carId),
                            fetchEncarInspection(carId),
                        ]);

                        carsData.push({
                            listItem: item,
                            detail: detail.status === 'fulfilled' ? detail.value : null,
                            inspection: inspection.status === 'fulfilled' ? inspection.value : null,
                        });

                        // تأخير 250ms بين الطلبات
                        await new Promise(r => setTimeout(r, 250));
                    } catch { /* تجاهل خطأ سيارة فردية */ }
                }
            }

            // ─── محاولة Fallback إذا فشل كل شيء ──────────────────────────────
            if (carsData.length === 0) {
                console.log('📦 [EncarImport] Using fallback catalog');
                usedFallback = true;
                carsData = getFallbackCars().slice(0, targetLimit).map(c => ({
                    listItem: c, detail: null, inspection: null, _prefetched: c,
                }));
            }

            totalFetched = carsData.length;
            console.log(`⚙️  [EncarImport] Processing ${totalFetched} cars...`);

            // ─── حفظ كل سيارة في قاعدة البيانات ─────────────────────────────
            for (const { listItem, detail, inspection, _prefetched } of carsData) {
                try {
                    const car = _prefetched || mapEncarCarToHMCar(listItem, detail, inspection);
                    const now = new Date();

                    const carDoc = {
                        title:           car.title,
                        titleAr:         car.titleAr || car.title,
                        titleEn:         car.titleEn || car.title,
                        make:            car.make,
                        makeAr:          car.makeAr,
                        model:           car.model,
                        year:            car.year,
                        price:           car.priceSar,
                        priceKrw:        car.priceKrw,
                        priceSar:        car.priceSar,
                        priceUsd:        car.priceUsd,
                        mileage:         car.mileage,
                        fuelType:        car.fuelType,
                        fuelType_en:     car.fuelType_en,
                        transmission:    car.transmission,
                        images:          car.images,
                        image:           car.image,
                        specs:           car.specs,
                        inspectionReport: car.inspectionReport,
                        isActive:        true,
                        isSold:          false,
                        listingType:     'auction',
                        externalId:      car.externalId,
                        externalUrl:     car.externalUrl,
                        source:          'encar',
                        tenantId:        req.tenantId || 'default',
                    };

                    const createdCar = await Car.findOneAndUpdate(
                        { externalId: car.externalId },
                        { $set: carDoc },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    const auctionEnd = car.endsAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const startingPrice = Math.round(car.priceSar * 0.85);

                    await Auction.findOneAndUpdate(
                        { externalId: car.externalId },
                        {
                            $set: {
                                car:          createdCar._id,
                                carId:        createdCar._id,
                                externalId:   car.externalId,
                                externalUrl:  car.externalUrl,
                                title:        car.title,
                                titleAr:      car.titleAr || car.title,
                                titleEn:      car.titleEn || car.title,
                                images:       car.images,
                                startingPrice,
                                currentBid:   startingPrice,
                                currentPrice: startingPrice,
                                priceKrw:     car.priceKrw,
                                priceSar:     car.priceSar,
                                priceUsd:     car.priceUsd,
                                bidsCount:    0,
                                startsAt:     car.startsAt || now,
                                endsAt:       auctionEnd,
                                status:       'running',
                                source:       'encar',
                                tenantId:     req.tenantId || 'default',
                                make:         car.make,
                                makeAr:       car.makeAr,
                                model:        car.model,
                                year:         car.year,
                                mileage:      car.mileage,
                                specs:        car.specs,
                                inspectionReport: car.inspectionReport,
                            }
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    totalImported++;
                    importedItems.push({ title: car.title, image: car.image, priceKrw: car.priceKrw, priceSar: car.priceSar });
                    console.log(`✅ [EncarImport] Saved: ${car.title} — ${car.priceSar.toLocaleString()} SAR`);

                } catch (itemErr) {
                    console.warn(`⚠️ [EncarImport] Item error:`, itemErr.message);
                    totalSkipped++;
                }
            }

            safeLogImport(req, {
                importType: 'live_auctions_encar',
                requestedLimit: targetLimit,
                totalFetched, totalImported, totalSkipped,
                source: targetUrl || 'encar_api_general',
                status: 'completed',
                details: `تم استيراد ${totalImported} سيارة من Encar${usedFallback ? ' (كتالوج احتياطي)' : ''}. متجاوز: ${totalSkipped}.`,
                adminUser,
            }).catch(() => {});

            return {
                success: true,
                message: `✅ تم استيراد ${totalImported} سيارة من Encar بنجاح${usedFallback ? ' (بيانات احتياطية)' : ''}`,
                stats: { requestedLimit: targetLimit, totalFetched, totalImported, totalSkipped },
                source: targetUrl || 'Encar API',
                items: importedItems,
            };

        } catch (error) {
            console.error('❌ [LiveAuctionImportService] Fatal:', error);
            safeLogImport(req, {
                importType: 'live_auctions_encar',
                requestedLimit: targetLimit,
                status: 'failed',
                details: `فشل: ${error.message}`,
                adminUser,
            }).catch(() => {});

            return {
                success: false,
                error: `حدث خطأ أثناء الاستيراد: ${error.message}`,
            };
        }
    }

    /**
     * الحصول على دليل الفحص (للعرض في الواجهة)
     */
    static getInspectionGradeGuide() {
        return Object.entries(INSPECTION_GRADE_MAP).map(([code, t]) => ({ code, ...t }));
    }

    /**
     * الحصول على أسعار الصرف الحالية
     */
    static getExchangeRates() {
        return EXCHANGE_RATES;
    }
}

module.exports = LiveAuctionImportService;
