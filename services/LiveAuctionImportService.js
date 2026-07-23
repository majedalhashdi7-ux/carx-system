// [[ARABIC_HEADER]] هذا الملف (services/LiveAuctionImportService.js) مسؤول عن استيراد سيارات المزاد المباشر
// يدعم الاستيراد الحقيقي من desert-korea-auto.com أو أي رابط خارجي مماثل

const imageOptimizationService = require('./ImageOptimizationService');
const ImportLog = require('../models/ImportLog');
const https = require('https');
const http = require('http');

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

// خريطة ترجمة أسماء الموديلات الكورية الشائعة إلى إنجليزية
const MODEL_MAP = {
    tucson: 'Tucson', 'santa fe': 'Santa Fe', palisade: 'Palisade', sonata: 'Sonata',
    elantra: 'Elantra', avante: 'Avante', grandeur: 'Grandeur', staria: 'Staria',
    'ioniq 5': 'Ioniq 5', 'ioniq 6': 'Ioniq 6', casper: 'Casper',
    azera: 'Azera', veloster: 'Veloster', kona: 'Kona', venue: 'Venue',
    sportage: 'Sportage', carnival: 'Carnival', sorento: 'Sorento',
    telluride: 'Telluride', stinger: 'Stinger', mohave: 'Mohave',
    seltos: 'Seltos', niro: 'Niro', ev6: 'EV6', k5: 'K5', k7: 'K7',
    k8: 'K8', k9: 'K9', k3: 'K3',
    gv70: 'GV70', gv80: 'GV80', g70: 'G70', g80: 'G80', g90: 'G90',
    eq900: 'EQ900', 'avante ad': 'Avante AD', 'avante cn7': 'Avante CN7',
};

/**
 * جلب HTML من URL بشكل مباشر
 */
function fetchHtml(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const req = lib.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ar,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            timeout: timeoutMs,
        }, (res) => {
            // تتبع redirects
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
    });
}

/**
 * استخراج بيانات JSON-LD من HTML الصفحة
 */
function extractJsonLd(html) {
    const results = [];
    const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim());
            results.push(parsed);
        } catch { /* skip invalid */ }
    }
    return results;
}

/**
 * استخراج بيانات السيارة من صفحة تفاصيل desert-korea-auto.com
 * يُرجع { images, mileage, fuelType, transmission, color, description, externalId }
 */
async function fetchCarDetails(carUrl) {
    try {
        const html = await fetchHtml(carUrl, 12000);

        // استخرج الصور من og:image أو data-src أو src
        const images = [];

        // og:image
        const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (ogImgMatch && ogImgMatch[1] && !ogImgMatch[1].includes('og-car-default')) {
            images.push(ogImgMatch[1]);
        }

        // صور من src أو data-src في img tags
        const imgRegex = /<img[^>]+(?:src|data-src)=["']([^"']+(?:kokars-aws\.s3|amazonaws\.com|desert-korea-auto)[^"']+)["']/gi;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(html)) !== null) {
            const imgUrl = imgMatch[1];
            if (!imgUrl.includes('og-car-default') && !imgUrl.includes('logo') && !images.includes(imgUrl)) {
                images.push(imgUrl);
                if (images.length >= 8) break;
            }
        }

        // استخرج الكيلومتراج
        let mileage = 0;
        const kmMatch = html.match(/([0-9,]+)\s*(?:km|كم|كيلومتر)/i);
        if (kmMatch) mileage = parseInt(kmMatch[1].replace(/,/g, '')) || 0;

        // استخرج نوع الوقود
        let fuelType = 'بنزين';
        if (html.match(/(?:diesel|ديزل|디젤)/i)) fuelType = 'ديزل';
        else if (html.match(/(?:hybrid|هجين|하이브리드)/i)) fuelType = 'هجين';
        else if (html.match(/(?:electric|كهربائي|전기)/i)) fuelType = 'كهربائي';
        else if (html.match(/(?:lpg|غاز)/i)) fuelType = 'غاز';

        // استخرج ناقل الحركة
        let transmission = 'أوتوماتيك';
        if (html.match(/(?:manual|يدوي|수동)/i)) transmission = 'يدوي';

        // استخرج رقم الإعلان (externalId) من الـ URL
        const idMatch = carUrl.match(/-(\d+)\/?$/);
        const externalId = idMatch ? `desert-ka-${idMatch[1]}` : `desert-ka-${Date.now()}`;

        // استخرج اللون
        let color = '';
        const colorMatch = html.match(/(?:color|اللون|색상)[^\w]*([^\s<]{3,20})/i);
        if (colorMatch) color = colorMatch[1];

        return { images, mileage, fuelType, transmission, color, externalId };
    } catch (err) {
        console.warn(`⚠️ [CarDetails] Failed for ${carUrl}: ${err.message}`);
        return { images: [], mileage: 0, fuelType: 'بنزين', transmission: 'أوتوماتيك', color: '', externalId: `desert-ka-${Date.now()}` };
    }
}

/**
 * تحويل اسم الماركة الكورية/الإنجليزية إلى شكل مقروء
 */
function normalizeBrand(rawBrand) {
    if (!rawBrand) return 'غير محدد';
    const lower = rawBrand.toLowerCase().trim();
    return BRAND_MAP[lower] || rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
}

/**
 * تحويل اسم الموديل
 */
function normalizeModel(rawModel) {
    if (!rawModel) return 'غير محدد';
    const lower = rawModel.toLowerCase().trim();
    return MODEL_MAP[lower] || rawModel.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

class LiveAuctionImportService {
    /**
     * استيراد دفعة محددة من سيارات المزادات المباشرة
     * @param {Object} req - طلب Express
     * @param {Object} options
     * @param {number} options.limit - عدد السيارات
     * @param {string} options.targetUrl - رابط الموقع الخارجي (اختياري)
     * @param {string} options.adminUser - اسم المشرف
     */
    static async importLiveAuctionCars(req, options = {}) {
        const { limit = 10, targetUrl = '', adminUser = 'admin' } = options;
        const targetLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

        const getModel = require('../modules/core/database').getModel;
        const Auction = getModel(req, 'Auction');
        const Car = getModel(req, 'Car');

        let totalFetched = 0;
        let totalImported = 0;
        let totalSkipped = 0;
        let importedItems = [];

        try {
            // ─── الرابط المستخدم: رابط المستخدم أو الافتراضي ───────────────
            const sourceUrl = (targetUrl && targetUrl.startsWith('http'))
                ? targetUrl
                : 'https://desert-korea-auto.com/cars/?car_type=auction';

            console.log(`🚀 [LiveAuctionImport] Fetching from: ${sourceUrl}`);

            // ─── جلب HTML وتحليل JSON-LD ─────────────────────────────────
            const html = await fetchHtml(sourceUrl);
            const jsonLdBlocks = extractJsonLd(html);

            // ابحث عن قائمة السيارات في JSON-LD
            let carItems = [];
            for (const block of jsonLdBlocks) {
                const itemList = block?.mainEntity?.itemListElement || block?.itemListElement || [];
                if (Array.isArray(itemList) && itemList.length > 0) {
                    carItems = itemList.filter(item => item?.['@type'] === 'Car' || item?.url);
                    break;
                }
            }

            console.log(`📊 [LiveAuctionImport] Found ${carItems.length} cars in JSON-LD`);

            // إذا لم يوجد JSON-LD، ابحث عن روابط السيارات مباشرة
            if (carItems.length === 0) {
                const carLinkRegex = /href=["'](https?:\/\/[^"']+\/cars\/[^"']+\/)["']/gi;
                let linkMatch;
                const seenLinks = new Set();
                while ((linkMatch = carLinkRegex.exec(html)) !== null) {
                    const link = linkMatch[1];
                    if (!seenLinks.has(link)) {
                        seenLinks.add(link);
                        carItems.push({ url: link, '@type': 'Car' });
                    }
                    if (carItems.length >= targetLimit * 2) break;
                }
                console.log(`🔗 [LiveAuctionImport] Fallback: found ${carItems.length} car links`);
            }

            totalFetched = Math.min(carItems.length, targetLimit);
            const batch = carItems.slice(0, targetLimit);

            const now = new Date();
            const auctionEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 أيام

            // ─── معالجة كل سيارة ────────────────────────────────────────
            for (const item of batch) {
                try {
                    const carPageUrl = item?.url || '';
                    const rawBrand = item?.brand || '';
                    const rawModel = item?.model || '';
                    const rawYear = parseInt(item?.year) || new Date().getFullYear();
                    const rawPriceKrw = Number(item?.offers?.price) || 0;

                    const brand = normalizeBrand(rawBrand);
                    const model = normalizeModel(rawModel);
                    const { priceKrw, priceUsd, priceSar } = convertKrwPricing(rawPriceKrw);

                    // استخرج ID من الرابط
                    const idMatch = carPageUrl.match(/-(\d+)\/?$/);
                    const externalId = idMatch ? `desert-ka-${idMatch[1]}` : null;

                    // ─── منع التكرار ─────────────────────────────────────
                    if (externalId) {
                        const existing = await Auction.findOne({ externalId });
                        if (existing) { totalSkipped++; continue; }
                        const existingCar = await Car.findOne({ externalId });
                        if (existingCar) { totalSkipped++; continue; }
                    }

                    // ─── جلب تفاصيل الصفحة الفردية للسيارة ──────────────
                    console.log(`🔍 [LiveAuctionImport] Fetching details: ${carPageUrl}`);
                    const details = carPageUrl
                        ? await fetchCarDetails(carPageUrl)
                        : { images: [], mileage: 0, fuelType: 'بنزين', transmission: 'أوتوماتيك', color: '', externalId: `desert-ka-${Date.now()}` };

                    const finalExternalId = externalId || details.externalId;

                    // ─── توليد الصور ─────────────────────────────────────
                    let images = details.images.length > 0 ? details.images : [];

                    // ضغط الصور
                    let optimizedImages = images;
                    if (images.length > 0) {
                        try {
                            optimizedImages = await imageOptimizationService.optimizeImagesList(images, {
                                folder: 'hmcar-live-auctions'
                            });
                        } catch { optimizedImages = images; }
                    }

                    const mainImage = optimizedImages[0] || '';

                    // ─── إنشاء بيانات العنوان ─────────────────────────────
                    const carTitle = `${brand} ${model} ${rawYear}`;

                    // ─── السعر الافتراضي للمزايدة ──────────────────────────
                    const startingPrice = priceSar > 0 ? Math.round(priceSar * 0.85) : 15000;
                    const currentBid = priceSar > 0 ? priceSar : 20000;

                    // ─── إنشاء السيارة في جدول Car ──────────────────────
                    const createdCar = await Car.create({
                        title: carTitle,
                        make: brand,
                        model: model,
                        year: rawYear,
                        price: currentBid,
                        priceSar: currentBid,
                        priceKrw: priceKrw,
                        priceUsd: priceUsd,
                        mileage: details.mileage || 0,
                        fuelType: details.fuelType || 'بنزين',
                        transmission: details.transmission || 'أوتوماتيك',
                        color: details.color || '',
                        images: optimizedImages,
                        image: mainImage,
                        isActive: true,
                        isSold: false,
                        listingType: 'auction',
                        externalId: finalExternalId,
                        externalUrl: carPageUrl,
                        source: 'desert_korea_auto',
                        tenantId: req.tenantId || 'default',
                        createdAt: now,
                    });

                    // ─── إنشاء المزاد في جدول Auction ───────────────────
                    await Auction.create({
                        car: createdCar._id,
                        carId: createdCar._id,
                        externalId: finalExternalId,
                        externalUrl: carPageUrl,
                        title: carTitle,
                        images: optimizedImages,
                        startingPrice: startingPrice,
                        currentBid: startingPrice,
                        currentPrice: startingPrice,
                        bidsCount: 0,
                        startsAt: now,
                        endsAt: auctionEnd,
                        status: 'pending', // ينتظر تفعيل الأدمن
                        source: 'desert_korea_auto',
                        tenantId: req.tenantId || 'default',
                        createdAt: now,
                        make: brand,
                        model: model,
                        year: rawYear,
                        mileage: details.mileage || 0,
                    });

                    totalImported++;
                    importedItems.push({ title: carTitle, image: mainImage });
                    console.log(`✅ [LiveAuctionImport] Imported: ${carTitle}`);

                } catch (itemErr) {
                    console.warn(`⚠️ [LiveAuctionImport] Item error:`, itemErr.message);
                    totalSkipped++;
                }
            }

            // ─── تسجيل في ImportLog ─────────────────────────────────────
            const logEntry = await ImportLog.create({
                tenantId: req.tenantId || 'default',
                importType: 'live_auctions',
                requestedLimit: targetLimit,
                totalFetched,
                totalImported,
                totalSkipped,
                source: sourceUrl,
                status: 'completed',
                details: `تم استيراد ${totalImported} مزاد من ${sourceUrl}. متجاوز (مكرر): ${totalSkipped}.`,
                adminUser,
            });

            return {
                success: true,
                message: `✅ تم استيراد ${totalImported} مزاد مباشر بنجاح من: ${new URL(sourceUrl).hostname}`,
                stats: { requestedLimit: targetLimit, totalFetched, totalImported, totalSkipped },
                source: sourceUrl,
                items: importedItems,
                log: logEntry,
            };

        } catch (error) {
            console.error('❌ [LiveAuctionImportService] Fatal error:', error);
            await ImportLog.create({
                tenantId: req.tenantId || 'default',
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
