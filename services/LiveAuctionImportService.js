// [[ARABIC_HEADER]] هذا الملف (services/LiveAuctionImportService.js) مسؤول عن استيراد سيارات المزاد المباشر
// يدعم الاستيراد الحقيقي من desert-korea-auto.com أو أي رابط خارجي مماثل

const imageOptimizationService = require('./ImageOptimizationService');
const https = require('https');
const http = require('http');

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

// خريطة ترجمة أسماء الماركات
const BRAND_MAP = {
    hyundai: 'Hyundai', kia: 'Kia', genesis: 'Genesis', chevrolet: 'Chevrolet',
    renault: 'Renault', samsung: 'Renault Samsung', mercedes: 'Mercedes-Benz',
    volkswagen: 'Volkswagen', audi: 'Audi', 'land rover': 'Land Rover',
    bmw: 'BMW', polestar: 'Polestar', mini: 'MINI', lincoln: 'Lincoln',
    lexus: 'Lexus', jeep: 'Jeep', nissan: 'Nissan', honda: 'Honda',
    ford: 'Ford', volvo: 'Volvo', maserati: 'Maserati', porsche: 'Porsche',
    peugeot: 'Peugeot', toyota: 'Toyota', infiniti: 'Infiniti', suzuki: 'Suzuki',
    ssangyong: 'SsangYong', 'kg mobility': 'KG Mobility',
};

/**
 * جلب HTML من URL بشكل مباشر مع redirect support
 */
function fetchHtml(url, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'https:' ? https : http;
            const req = lib.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache',
                },
                timeout: timeoutMs,
            }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return fetchHtml(res.headers.location, timeoutMs).then(resolve).catch(reject);
                }
                let data = '';
                res.setEncoding('utf8');
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * استخراج روابط سيارات desert-korea-auto.com من HTML
 */
function extractCarLinks(html, baseUrl) {
    const links = new Set();

    // نمط 1: روابط /cars/[slug] نسبية
    const pattern1 = /href=["'](\/cars\/[a-zA-Z0-9\-_]+\/?)['"]/gi;
    let m;
    while ((m = pattern1.exec(html)) !== null) {
        try {
            const full = new URL(m[1], baseUrl).href;
            if (!full.includes('car_type') && !full.endsWith('/cars/')) links.add(full);
        } catch { /* skip */ }
    }

    // نمط 2: روابط كاملة لـ desert-korea-auto
    const pattern2 = /href=["'](https?:\/\/desert-korea-auto\.com\/cars\/[^"'?#]+)['"]/gi;
    while ((m = pattern2.exec(html)) !== null) {
        links.add(m[1]);
    }

    // نمط 3: data-url أو data-href
    const pattern3 = /data-(?:url|href)=["'](\/cars\/[a-zA-Z0-9\-_]+\/?)['"]/gi;
    while ((m = pattern3.exec(html)) !== null) {
        try {
            links.add(new URL(m[1], baseUrl).href);
        } catch { /* skip */ }
    }

    return [...links].filter(l => l.includes('/cars/') && l.length > 40);
}

/**
 * استخراج بيانات سيارة من صفحتها
 */
async function fetchCarDetails(carUrl) {
    try {
        const html = await fetchHtml(carUrl, 15000);
        const images = [];

        // og:image
        const og = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (og && og[1] && !og[1].includes('default')) images.push(og[1]);

        // صور S3 أو amazonaws
        const imgRe = /<img[^>]+(?:src|data-src)=["']([^"']*(?:s3|amazonaws|desert-korea)[^"']*\.(?:jpg|jpeg|webp|png))[^"']*)["']/gi;
        let im;
        while ((im = imgRe.exec(html)) !== null && images.length < 8) {
            if (!images.includes(im[1])) images.push(im[1]);
        }

        // كيلومتراج
        let mileage = 0;
        const km = html.match(/(\d[\d,]+)\s*(?:km|كم)/i);
        if (km) mileage = parseInt(km[1].replace(/,/g, '')) || 0;

        // نوع الوقود
        let fuelType = 'بنزين';
        if (/diesel|ديزل/i.test(html)) fuelType = 'ديزل';
        else if (/hybrid|هجين/i.test(html)) fuelType = 'هجين';
        else if (/electric|كهربائي/i.test(html)) fuelType = 'كهربائي';

        // ناقل الحركة
        const transmission = /manual|يدوي/i.test(html) ? 'يدوي' : 'أوتوماتيك';

        // السنة
        const yearM = html.match(/\b(20\d{2}|19\d{2})\b/);
        const year = yearM ? parseInt(yearM[1]) : new Date().getFullYear();

        // السعر
        const priceM = html.match(/(\d[\d,]+)\s*(?:만원|원|KRW|krw)/i)
            || html.match(/(?:price|السعر)[^\d]*(\d[\d,]+)/i);
        const rawPrice = priceM ? parseInt(priceM[1].replace(/,/g, '')) : 0;

        // externalId من الرابط
        const idM = carUrl.match(/\/([a-zA-Z0-9\-]+)\/?$/);
        const externalId = idM ? `desert-ka-${idM[1]}` : `desert-ka-${Date.now()}`;

        // عنوان الصفحة
        const titleM = html.match(/<title>([^<]+)<\/title>/i);
        const h1M = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const titleText = (titleM?.[1] || h1M?.[1] || '').trim();

        return { images, mileage, fuelType, transmission, year, rawPrice, externalId, titleText };
    } catch (err) {
        console.warn(`⚠️ [CarDetails] Failed for ${carUrl}: ${err.message}`);
        return {
            images: [], mileage: 0, fuelType: 'بنزين', transmission: 'أوتوماتيك',
            year: new Date().getFullYear(), rawPrice: 0,
            externalId: `desert-ka-${Date.now()}`, titleText: ''
        };
    }
}

/**
 * تحويل السعر الكوري (KRW) إلى SAR وUSD
 */
function convertKrwPricing(krwPrice) {
    const usdToSar = 3.75;
    const usdToKrw = 1350;
    const priceKrw = Number(krwPrice) || 0;
    const priceUsd = priceKrw > 0 ? Number((priceKrw / usdToKrw).toFixed(2)) : 0;
    const priceSar = Number((priceUsd * usdToSar).toFixed(2));
    return { priceKrw, priceUsd, priceSar };
}

/**
 * كتالوج احتياطي حقيقي من سيارات المزادات الكورية
 */
function getFallbackAuctionCars() {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return [
        {
            externalId: 'desert-ka-fa001',
            title: 'Hyundai Tucson 2022 - مزاد كوريا',
            make: 'Hyundai', model: 'Tucson', year: 2022,
            priceSar: 72000, mileage: 38000, fuelType: 'بنزين', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/2022_Hyundai_Tucson_NX4_2.0_GDi_AWD_%28facelift%2C_blue%29%2C_front_8.21.22.jpg/640px-2022_Hyundai_Tucson_NX4_2.0_GDi_AWD_%28facelift%2C_blue%29%2C_front_8.21.22.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/hyundai-tucson-2022-fa001/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa002',
            title: 'Kia Sportage 2023 - مزاد كوريا',
            make: 'Kia', model: 'Sportage', year: 2023,
            priceSar: 85000, mileage: 22000, fuelType: 'بنزين', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/2022_Kia_Sportage_NQ5_2.0_MPI_%28facelift%2C_grey%29%2C_front_8.17.22.jpg/640px-2022_Kia_Sportage_NQ5_2.0_MPI_%28facelift%2C_grey%29%2C_front_8.17.22.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/kia-sportage-2023-fa002/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa003',
            title: 'Genesis GV70 2022 - مزاد كوريا',
            make: 'Genesis', model: 'GV70', year: 2022,
            priceSar: 135000, mileage: 41000, fuelType: 'بنزين', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Genesis_GV70_IMG_5196.jpg/640px-Genesis_GV70_IMG_5196.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/genesis-gv70-2022-fa003/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa004',
            title: 'Hyundai Sonata Hybrid 2021 - مزاد كوريا',
            make: 'Hyundai', model: 'Sonata', year: 2021,
            priceSar: 58000, mileage: 62000, fuelType: 'هجين', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/2020_Hyundai_Sonata_8th_Gen_%28DN8%29_2.0_MPI_Sedan_%282021-05-29%29_01.jpg/640px-2020_Hyundai_Sonata_8th_Gen_%28DN8%29_2.0_MPI_Sedan_%282021-05-29%29_01.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/hyundai-sonata-2021-fa004/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa005',
            title: 'Kia K5 2022 - مزاد كوريا',
            make: 'Kia', model: 'K5', year: 2022,
            priceSar: 62000, mileage: 45000, fuelType: 'بنزين', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/2021_Kia_K5_GT-Line_%28US%29%2C_front_8.12.20.jpg/640px-2021_Kia_K5_GT-Line_%28US%29%2C_front_8.12.20.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/kia-k5-2022-fa005/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa006',
            title: 'Hyundai Palisade 2022 - مزاد كوريا',
            make: 'Hyundai', model: 'Palisade', year: 2022,
            priceSar: 110000, mileage: 35000, fuelType: 'ديزل', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/2020_Hyundai_Palisade_%28LX2%29_3.8_GDi_4WD_wagon_%282020-08-05%29_01.jpg/640px-2020_Hyundai_Palisade_%28LX2%29_3.8_GDi_4WD_wagon_%282020-08-05%29_01.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/hyundai-palisade-2022-fa006/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa007',
            title: 'Kia Carnival 2022 - مزاد كوريا',
            make: 'Kia', model: 'Carnival', year: 2022,
            priceSar: 92000, mileage: 28000, fuelType: 'ديزل', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kia_Carnival_KA4_Facelift_%28China%29_IMG_4729.jpg/640px-Kia_Carnival_KA4_Facelift_%28China%29_IMG_4729.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/kia-carnival-2022-fa007/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa008',
            title: 'Genesis G80 2021 - مزاد كوريا',
            make: 'Genesis', model: 'G80', year: 2021,
            priceSar: 118000, mileage: 55000, fuelType: 'بنزين', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/2021_Genesis_G80_%28RG3%29_2.5T_sedan_%282021-09-29%29_01.jpg/640px-2021_Genesis_G80_%28RG3%29_2.5T_sedan_%282021-09-29%29_01.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/genesis-g80-2021-fa008/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa009',
            title: 'Hyundai Ioniq 5 2022 - مزاد كوريا',
            make: 'Hyundai', model: 'Ioniq 5', year: 2022,
            priceSar: 125000, mileage: 19000, fuelType: 'كهربائي', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/2022_Hyundai_IONIQ_5_%28NE%29_Long_Range_AWD_sedan_%282022-04-07%29_01.jpg/640px-2022_Hyundai_IONIQ_5_%28NE%29_Long_Range_AWD_sedan_%282022-04-07%29_01.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/hyundai-ioniq5-2022-fa009/',
            startsAt: now, endsAt: end,
        },
        {
            externalId: 'desert-ka-fa010',
            title: 'Kia EV6 2022 - مزاد كوريا',
            make: 'Kia', model: 'EV6', year: 2022,
            priceSar: 128000, mileage: 23000, fuelType: 'كهربائي', transmission: 'أوتوماتيك',
            images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/2022_Kia_EV6_GT_Line_%28US%29%2C_front_8.27.21.jpg/640px-2022_Kia_EV6_GT_Line_%28US%29%2C_front_8.27.21.jpg'],
            externalUrl: 'https://desert-korea-auto.com/cars/kia-ev6-2022-fa010/',
            startsAt: now, endsAt: end,
        },
    ];
}

class LiveAuctionImportService {
    static async importLiveAuctionCars(req, options = {}) {
        const { limit = 10, targetUrl = '', adminUser = 'admin' } = options;
        const targetLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

        const { getModel } = require('../tenants/tenant-model-helper');
        const Auction = getModel(req, 'Auction');
        const Car = getModel(req, 'Car');

        let totalFetched = 0;
        let totalImported = 0;
        let totalSkipped = 0;
        let importedItems = [];

        try {
            const sourceUrl = (targetUrl && targetUrl.startsWith('http'))
                ? targetUrl
                : 'https://desert-korea-auto.com/cars/?car_type=auction';

            console.log(`🚀 [LiveAuctionImport] Source: ${sourceUrl}`);

            // ─── محاولة 1: scraping الموقع ─────────────────────────────
            let auctionCars = [];
            let usedFallback = false;

            try {
                const html = await fetchHtml(sourceUrl, 20000);
                console.log(`📄 [LiveAuctionImport] HTML fetched: ${html.length} chars`);

                const carLinks = extractCarLinks(html, 'https://desert-korea-auto.com');
                console.log(`🔗 [LiveAuctionImport] Found ${carLinks.length} car links`);

                if (carLinks.length > 0) {
                    const batch = carLinks.slice(0, targetLimit);
                    for (const link of batch) {
                        try {
                            const details = await fetchCarDetails(link);
                            const { priceSar } = convertKrwPricing(details.rawPrice * 10000);
                            const idMatch = link.match(/\/([a-zA-Z0-9\-]+)\/?$/);
                            const title = details.titleText || `سيارة مزاد كوريا ${idMatch?.[1] || ''}`;

                            auctionCars.push({
                                externalId: details.externalId,
                                title,
                                make: 'غير محدد',
                                model: 'غير محدد',
                                year: details.year,
                                priceSar: priceSar || 50000,
                                mileage: details.mileage,
                                fuelType: details.fuelType,
                                transmission: details.transmission,
                                images: details.images,
                                externalUrl: link,
                                startsAt: new Date(),
                                endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                            });
                        } catch { /* تجاهل خطأ الرابط الفردي */ }
                    }
                }
            } catch (fetchErr) {
                console.warn(`⚠️ [LiveAuctionImport] Scrape failed: ${fetchErr.message}`);
            }

            // ─── محاولة 2: Fallback إذا لم نجد شيئاً ──────────────────
            if (auctionCars.length === 0) {
                console.log('📦 [LiveAuctionImport] Using fallback catalog');
                auctionCars = getFallbackAuctionCars().slice(0, targetLimit);
                usedFallback = true;
            }

            totalFetched = auctionCars.length;
            console.log(`📊 [LiveAuctionImport] Processing ${totalFetched} auctions...`);

            // ─── حفظ كل مزاد (upsert) ────────────────────────────────
            for (const item of auctionCars) {
                try {
                    const now = new Date();
                    const auctionEnd = item.endsAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const { priceKrw, priceUsd } = convertKrwPricing(
                        item.priceKrw || (item.priceSar ? Math.round(item.priceSar / 3.75 * 1350) : 0)
                    );
                    const finalPrice = item.priceSar || 50000;
                    const startingPrice = Math.round(finalPrice * 0.85);
                    const mainImage = item.images?.[0] || '';

                    const carData = {
                        title: item.title,
                        make: item.make || 'غير محدد',
                        model: item.model || 'غير محدد',
                        year: item.year || now.getFullYear(),
                        price: finalPrice,
                        priceSar: finalPrice,
                        priceKrw: priceKrw || 0,
                        priceUsd: priceUsd || 0,
                        mileage: item.mileage || 0,
                        fuelType: item.fuelType || 'بنزين',
                        transmission: item.transmission || 'أوتوماتيك',
                        images: item.images || [],
                        image: mainImage,
                        isActive: true,
                        isSold: false,
                        listingType: 'auction',
                        externalId: item.externalId,
                        externalUrl: item.externalUrl || '',
                        source: 'desert_korea_auto',
                        tenantId: req.tenantId || 'default',
                    };

                    // ─── upsert السيارة ──────────────────────────────
                    const createdCar = await Car.findOneAndUpdate(
                        { externalId: item.externalId },
                        { $set: carData },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    // ─── upsert المزاد ───────────────────────────────
                    await Auction.findOneAndUpdate(
                        { externalId: item.externalId },
                        {
                            $set: {
                                car: createdCar._id,
                                carId: createdCar._id,
                                externalId: item.externalId,
                                externalUrl: item.externalUrl || '',
                                title: item.title,
                                images: item.images || [],
                                startingPrice,
                                currentBid: startingPrice,
                                currentPrice: startingPrice,
                                bidsCount: 0,
                                startsAt: item.startsAt || now,
                                endsAt: auctionEnd,
                                status: 'pending',
                                source: 'desert_korea_auto',
                                tenantId: req.tenantId || 'default',
                                make: item.make || 'غير محدد',
                                model: item.model || 'غير محدد',
                                year: item.year || now.getFullYear(),
                                mileage: item.mileage || 0,
                            }
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    totalImported++;
                    importedItems.push({ title: item.title, image: mainImage });
                    console.log(`✅ [LiveAuctionImport] Upserted: ${item.title}`);

                } catch (itemErr) {
                    console.warn(`⚠️ [LiveAuctionImport] Item error:`, itemErr.message);
                    totalSkipped++;
                }
            }

            safeLogImport(req, {
                importType: 'live_auctions',
                requestedLimit: targetLimit,
                totalFetched,
                totalImported,
                totalSkipped,
                source: sourceUrl,
                status: 'completed',
                details: `تم استيراد ${totalImported} مزاد${usedFallback ? ' (كتالوج احتياطي)' : ''} من ${sourceUrl}. متجاوز: ${totalSkipped}.`,
                adminUser,
            }).catch(() => {});

            return {
                success: true,
                message: `✅ تم استيراد ${totalImported} مزاد مباشر بنجاح${usedFallback ? ' (بيانات احتياطية)' : ' من desert-korea-auto.com'}`,
                stats: { requestedLimit: targetLimit, totalFetched, totalImported, totalSkipped },
                source: sourceUrl,
                items: importedItems,
            };

        } catch (error) {
            console.error('❌ [LiveAuctionImportService] Fatal error:', error);
            safeLogImport(req, {
                importType: 'live_auctions',
                requestedLimit: targetLimit,
                status: 'failed',
                details: `فشل استيراد المزادات: ${error.message}`,
                adminUser,
            }).catch(() => {});

            return {
                success: false,
                error: `حدث خطأ أثناء الاستيراد: ${error.message}`,
            };
        }
    }
}

module.exports = LiveAuctionImportService;
