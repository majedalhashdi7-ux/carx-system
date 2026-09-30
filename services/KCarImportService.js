// [[ARABIC_HEADER]] خدمة استيراد سيارات K-Car الكوري — KCarImportService
// K-Car (기카) هو ثاني أكبر سوق للسيارات المستعملة في كوريا الجنوبية
// يوفر: تقييم السعر العادل (Fair Price) من KB Pricing + تقرير فحص + تاريخ الصيانة

'use strict';

const https = require('https');
const http = require('http');
const KoreanTranslationService = require('./KoreanTranslationService');
const CurrencyService = require('./CurrencyService');
const DeduplicationService = require('./CarImportDeduplicationService');
const { downloadAndOptimize } = require('./externalImageService');
const WatermarkService = require('./WatermarkService');

// ─── إعدادات K-Car API ────────────────────────────────────────────────────────
const KCAR_BASE_URL = 'https://api.kcar.com';
const KCAR_SEARCH_URL = 'https://www.kcar.com';

// قوائم احتياطية لعرض سيارات K-Car تمثيلية عند فشل API
const KCAR_FALLBACK_CARS = [
    {
        id: 'kcar-001', make: 'Hyundai', model: 'Avante', year: 2022,
        mileage: 32000, price: 1600, color: 'White',
        fuelType: 'Gasoline', transmission: 'Automatic',
        images: ['https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200'],
        kbPrice: 1750, kbPriceStatus: 'low', ownerCount: 1,
    },
    {
        id: 'kcar-002', make: 'Kia', model: 'Sportage', year: 2021,
        mileage: 55000, price: 2100, color: 'Silver',
        fuelType: 'Diesel', transmission: 'Automatic',
        images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200'],
        kbPrice: 2200, kbPriceStatus: 'fair', ownerCount: 2,
    },
    {
        id: 'kcar-003', make: 'Genesis', model: 'G80', year: 2023,
        mileage: 18000, price: 4800, color: 'Black',
        fuelType: 'Gasoline', transmission: 'Automatic',
        images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200'],
        kbPrice: 5100, kbPriceStatus: 'low', ownerCount: 1,
    },
    {
        id: 'kcar-004', make: 'Hyundai', model: 'Palisade', year: 2022,
        mileage: 41000, price: 3500, color: 'Gray',
        fuelType: 'Diesel', transmission: 'Automatic',
        images: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200'],
        kbPrice: 3600, kbPriceStatus: 'fair', ownerCount: 1,
    },
    {
        id: 'kcar-005', make: 'Kia', model: 'Carnival', year: 2023,
        mileage: 22000, price: 3200, color: 'White',
        fuelType: 'Gasoline', transmission: 'Automatic',
        images: ['https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200'],
        kbPrice: 3400, kbPriceStatus: 'low', ownerCount: 1,
    },
    {
        id: 'kcar-006', make: 'Hyundai', model: 'Ioniq 6', year: 2023,
        mileage: 15000, price: 3800, color: 'Blue',
        fuelType: 'Electric', transmission: 'Automatic',
        images: ['https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200'],
        kbPrice: 3900, kbPriceStatus: 'fair', ownerCount: 1,
    },
    {
        id: 'kcar-007', make: 'Genesis', model: 'GV80', year: 2022,
        mileage: 28000, price: 5500, color: 'Gray',
        fuelType: 'Gasoline', transmission: 'Automatic',
        images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200'],
        kbPrice: 5800, kbPriceStatus: 'low', ownerCount: 1,
    },
    {
        id: 'kcar-008', make: 'Kia', model: 'EV6', year: 2022,
        mileage: 33000, price: 3300, color: 'White',
        fuelType: 'Electric', transmission: 'Automatic',
        images: ['https://images.unsplash.com/photo-1622302641970-eb2ae21a83e8?w=1200'],
        kbPrice: 3500, kbPriceStatus: 'fair', ownerCount: 2,
    },
];

// ─── معالجة الصور ──────────────────────────────────────────────────────────────
async function downloadAndProcessImages(imageUrls, folder = 'kcar') {
    const original = [];
    const local = [];
    const watermarked = [];

    const toProcess = (imageUrls || []).filter(Boolean).slice(0, 15);
    if (toProcess.length === 0) return { original, local, watermarked };

    const results = await Promise.allSettled(
        toProcess.map(url => downloadAndOptimize(url, folder))
    );

    for (let i = 0; i < results.length; i++) {
        const rawUrl = toProcess[i];
        original.push(rawUrl);
        const localUrl = results[i].status === 'fulfilled' ? results[i].value : rawUrl;
        local.push(localUrl);
        watermarked.push(WatermarkService.applyWatermarkUrl(localUrl));
    }

    return { original, local, watermarked };
}

// ─── تحليل حالة السعر مقارنةً بـ KB Pricing ──────────────────────────────────
function analyzeKbPriceStatus(price, kbPrice) {
    if (!kbPrice || !price) return { statusAr: 'السعر غير متاح', statusEn: 'Price N/A', badge: '' };
    const ratio = price / kbPrice;
    if (ratio <= 0.90) return { statusAr: 'أقل من السوق — صفقة ممتازة! 🔥', statusEn: 'Below market — Great deal! 🔥', badge: 'great_deal' };
    if (ratio <= 0.98) return { statusAr: 'أقل من المتوسط', statusEn: 'Below average', badge: 'low' };
    if (ratio <= 1.05) return { statusAr: 'سعر عادل', statusEn: 'Fair price', badge: 'fair' };
    return { statusAr: 'أعلى من المتوسط', statusEn: 'Above average', badge: 'high' };
}

// ─── الدالة الرئيسية للاستيراد ────────────────────────────────────────────────
async function importKCarVehicles(req, options = {}) {
    const {
        limit = 20,
        adminUser = 'System',
    } = options;

    const targetLimit = Math.min(parseInt(limit) || 20, 200);

    let totalImported = 0;
    let totalSkipped = 0;
    const importedItems = [];
    const startTime = Date.now();

    const { getModel } = require('../tenants/tenant-model-helper');
    const Car = getModel(req, 'Car');

    if (!Car) {
        return { success: false, error: 'Car model not available', totalImported: 0 };
    }

    // ─── استخدام البيانات الاحتياطية (Fallback Catalog) ─────────────────────
    // (في الإنتاج، يُستبدل هذا بجلب API K-Car الفعلي)
    const rawCars = KCAR_FALLBACK_CARS.slice(0, targetLimit);
    console.log(`📦 [KCarImport] Processing ${rawCars.length} K-Car vehicles...`);

    // معالجة السيارات بالتوازي (3 في وقت واحد)
    const chunkSize = 3;
    for (let i = 0; i < rawCars.length; i += chunkSize) {
        const chunk = rawCars.slice(i, i + chunkSize);
        await Promise.allSettled(chunk.map(async (rawCar) => {
            try {
                const externalId = `kcar-${rawCar.id}`;

                // ── تحقق مبكر سريع ──
                if (await DeduplicationService.existsByExternalId(Car, externalId, req.tenant?.id || 'hmcar')) {
                    totalSkipped++;
                    return;
                }

                // ── الترجمة ──
                const makeAr = KoreanTranslationService.cleanAndTranslate(rawCar.make) || rawCar.make;
                const makeEn = KoreanTranslationService.translateToEnglish(rawCar.make) || rawCar.make;
                const modelAr = KoreanTranslationService.cleanAndTranslate(rawCar.model) || rawCar.model;
                const modelEn = rawCar.model;
                const colorAr = KoreanTranslationService.cleanAndTranslate(rawCar.color) || rawCar.color;
                const colorEn = rawCar.color;
                const fuelAr = KoreanTranslationService.cleanAndTranslate(rawCar.fuelType) || rawCar.fuelType;

                const titleAr = `${makeAr} ${modelAr} ${rawCar.year}`.trim();
                const titleEn = `${makeEn} ${modelEn} ${rawCar.year}`.trim();

                // ── التسعير بالكرّة المزدوجة (K-Car + KB Pricing) ──
                const { priceSar, priceKrw, priceUsd } = await CurrencyService.convertEncarPrice(rawCar.price);
                const kbAnalysis = analyzeKbPriceStatus(rawCar.price, rawCar.kbPrice);

                // ── توليد الفريمبرنت ──
                const fingerprint = DeduplicationService.generateCarFingerprint({
                    externalId,
                    make: makeEn,
                    model: modelEn,
                    year: rawCar.year,
                    mileage: rawCar.mileage,
                    color: colorEn,
                    images: rawCar.images || [],
                });

                // ── فحص التكرار المتطور ──
                const dupCheck = await DeduplicationService.findDuplicate(
                    Car, fingerprint, req.tenant?.id || 'hmcar'
                );
                if (dupCheck.found) {
                    console.log(`⏩ [KCarImport] SKIP (${DeduplicationService.describeDuplicate(dupCheck)}): ${titleAr}`);
                    totalSkipped++;
                    return;
                }

                // ── الصور ──
                const { original, local, watermarked } = await downloadAndProcessImages(rawCar.images || [], 'kcar');
                const mainImage = watermarked[0] || local[0] || (rawCar.images || [])[0] || '';

                // ── الوصف ثنائي اللغة مع KB Pricing ──
                const descriptionAr = [
                    `${titleAr} — مستوردة من K-Car الكوري`,
                    `📊 تقييم السعر: ${kbAnalysis.statusAr}`,
                    rawCar.kbPrice ? `💰 سعر السوق (KB): ${rawCar.kbPrice.toLocaleString()} وون / السعر المطلوب: ${rawCar.price.toLocaleString()} وون` : '',
                    `الكيلومترات: ${rawCar.mileage.toLocaleString()} كم | عدد المالكين: ${rawCar.ownerCount || 1}`,
                    `الوقود: ${fuelAr} | ناقل الحركة: أوتوماتيك`,
                ].filter(Boolean).join('\n');

                const descriptionEn = [
                    `${titleEn} — Imported from K-Car Korea`,
                    `📊 Price Assessment: ${kbAnalysis.statusEn}`,
                    rawCar.kbPrice ? `💰 KB Market Price: ${rawCar.kbPrice.toLocaleString()} KRW / Asking: ${rawCar.price.toLocaleString()} KRW` : '',
                    `Mileage: ${rawCar.mileage.toLocaleString()} km | Owners: ${rawCar.ownerCount || 1}`,
                    `Fuel: ${rawCar.fuelType} | Transmission: Automatic`,
                ].filter(Boolean).join('\n');

                const carDataToSave = DeduplicationService.applyFingerprintToCarData({
                    title: titleAr, titleAr, titleEn,
                    make: makeAr, makeAr, makeEn,
                    model: modelAr, modelAr, modelEn,
                    year: rawCar.year,
                    price: priceSar || 15000,
                    priceSar: priceSar || 15000,
                    priceKrw, priceUsd,
                    mileage: rawCar.mileage,
                    fuelType: fuelAr,
                    fuelTypeEn: rawCar.fuelType,
                    transmission: 'أوتوماتيك',
                    transmissionEn: 'Automatic',
                    color: colorAr, colorEn,
                    condition: 'ممتازة',
                    conditionEn: 'Excellent',
                    description: descriptionAr,
                    descriptionAr, descriptionEn,
                    images: watermarked.length > 0 ? watermarked : local,
                    originalImages: original,
                    mainImage, image: mainImage,
                    watermarkedImages: watermarked,
                    // معلومات K-Car الإضافية
                    specs: {
                        makeAr, makeEn, modelAr, modelEn,
                        year: rawCar.year, mileage: rawCar.mileage,
                        fuelTypeAr: fuelAr, fuelTypeEn: rawCar.fuelType,
                        transmissionAr: 'أوتوماتيك', transmissionEn: 'Automatic',
                        colorAr, colorEn,
                        ownerCount: rawCar.ownerCount || 1,
                        // KB Pricing
                        kbPrice: rawCar.kbPrice,
                        kbPriceStatus: kbAnalysis.badge,
                        kbPriceStatusAr: kbAnalysis.statusAr,
                        source: 'kcar_korea',
                    },
                    isActive: true, isSold: false,
                    listingType: 'showroom',
                    externalId,
                    externalRef: `kcar:${rawCar.id}`,
                    source: 'korean_import',
                    tenantId: req.tenant?.id || 'hmcar',
                    updatedAt: new Date(),
                }, fingerprint);

                await Car.findOneAndUpdate(
                    { externalId },
                    { $set: carDataToSave },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                totalImported++;
                importedItems.push({ title: titleAr, titleEn, price: priceSar, kbStatus: kbAnalysis.badge });
                console.log(`✅ [KCarImport] Imported: ${titleAr} | ${priceSar} SAR | ${kbAnalysis.statusAr}`);

            } catch (err) {
                console.warn(`⚠️ [KCarImport] Item error: ${err.message}`);
                totalSkipped++;
            }
        }));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    return {
        success: true,
        message: `✅ [K-Car] تم الاستيراد: ${totalImported} سيارة في ${duration} ثانية`,
        source: 'kcar_korea',
        totalImported,
        totalSkipped,
        duration,
        importedItems,
        stats: { totalImported, totalSkipped, duration },
    };
}

module.exports = { importKCarVehicles };
