// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/import.js) جزء من مشروع HM CAR

/**
 * @file routes/api/v2/import.js
 * @description نظام الاستيراد المتقدم - استيراد سيارات وقطع غيار من روابط خارجية
 *
 * يدعم:
 * - استخراج البيانات من أي رابط (scraping)
 * - معاينة البيانات قبل الحفظ
 * - حفظ البيانات في قاعدة البيانات مع الحفاظ عليها
 * - ضغط الصور محلياً قبل الحفظ
 * - كشف التكرار عبر رابط المصدر
 */

const express = require('express');
const router = express.Router();
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');
const { invalidateCache } = require('../../../middleware/cache');
const ScraperService = require('../../../services/ScraperService');
const { downloadAndOptimize } = require('../../../services/externalImageService');
const { getTenantId, getModel, addTenantFilter } = require('../../../tenants/tenant-model-helper');

// ─── دوال مساعدة ────────────────────────────────────────

function normalizeImportPricing(payload, isKorean) {
    // [[FIX]] قراءة أسعار الصرف من متغيرات البيئة بدلاً من القيم الثابتة
    const usdToSar = Number(process.env.USD_TO_SAR) || 3.75;
    const usdToKrw = Number(process.env.USD_TO_KRW) || 1350;
    const rawPrice = Number(payload.price) || 0;
    let priceSar = 0, priceUsd = 0, priceKrw = 0;

    if (isKorean) {
        priceKrw = rawPrice;
        priceUsd = Number((priceKrw / usdToKrw).toFixed(2));
        priceSar = Number((priceUsd * usdToSar).toFixed(2));
    } else {
        priceSar = rawPrice;
        priceUsd = Number((priceSar / usdToSar).toFixed(2));
        priceKrw = Math.round(priceUsd * usdToKrw);
    }

    return { priceSar, priceUsd, priceKrw, price: priceSar, basePriceUsd: priceUsd };
}

/**
 * ضغط وتحسين مجموعة صور
 */
async function compressImages(images = [], folder = 'imported') {
    if (!images?.length) return [];
    const results = [];
    for (const url of images) {
        if (!url || typeof url !== 'string') continue;
        try {
            const optimized = await downloadAndOptimize(url, folder, {
                width: 900,
                height: 600,
                quality: 72
            });
            results.push(optimized || url);
        } catch {
            results.push(url); // الاحتفاظ بالرابط الأصلي عند الفشل
        }
    }
    return results.filter(Boolean);
}

// ─── POST /api/v2/import/preview ────────────────────────
/**
 * معاينة البيانات من رابط قبل الحفظ
 */
router.post('/preview', requireAuthAPI, requireAdmin, async (req, res, next) => {
    try {
        const { url, type } = req.body;

        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ success: false, error: 'الرابط غير صالح أو فارغ' });
        }

        const scrapeResult = await ScraperService.scrapeUrl(url);

        if (!scrapeResult.success) {
            return res.status(400).json({ success: false, error: scrapeResult.error || 'فشل استخراج البيانات' });
        }

        // فحص التكرار عبر رابط المصدر
        let isDuplicate = false;
        if (req.tenantModels) {
            const Model = type === 'car' ? req.tenantModels.Car : req.tenantModels.SparePart;
            if (Model) {
                const existing = await Model.findOne({ externalUrl: url });
                isDuplicate = !!existing;
            }
        }

        const formattedData = {
            title: scrapeResult.data.title || 'عنصر مستورد بدون عنوان',
            description: scrapeResult.data.description || '',
            images: scrapeResult.data.images || [],
            sourceUrl: url,
        };

        if (type === 'car') {
            formattedData.make = 'غير محدد';
            formattedData.model = 'غير محدد';
            formattedData.year = new Date().getFullYear();
            formattedData.price = scrapeResult.data.price || 0;
            formattedData.fuelType = 'Petrol';
            formattedData.transmission = 'Automatic';
        } else {
            formattedData.name = scrapeResult.data.title || 'قطعة مستوردة';
            formattedData.partNumber = 'IMP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            formattedData.category = 'استيراد جديد';
            formattedData.price = scrapeResult.data.price || 0;
            formattedData.stock = 1;
        }

        res.json({
            success: true,
            message: 'تم استخراج البيانات بنجاح - جاهزة للمراجعة',
            data: formattedData,
            images: scrapeResult.data.images || [],
            duplicate: isDuplicate
        });

    } catch (error) {
        next(error);
    }
});

// ─── POST /api/v2/import/save ────────────────────────────
/**
 * حفظ البيانات المستوردة بعد المراجعة
 * - يضغط الصور محلياً قبل الحفظ
 * - يحفظ جميع البيانات المُرسلة كما هي بدون فقدان
 */
router.post('/save', requireAuthAPI, requireAdmin, invalidateCache(['/api/v2/cars*', '/api/v2/parts*', '/api/v2/brands*']), async (req, res, next) => {
    try {
        const { data, type } = req.body;

        if (!data) {
            return res.status(400).json({ success: false, error: 'البيانات مطلوبة' });
        }

        if (!req.tenantModels) {
            return res.status(503).json({ success: false, error: 'قاعدة البيانات غير متاحة' });
        }

        // ضغط وتحسين الصور قبل الحفظ
        let processedImages = data.images || [];
        if (processedImages.length > 0) {
            try {
                const folder = type === 'car' ? 'cars' : 'parts';
                processedImages = await compressImages(processedImages, folder);
                console.log(`[Import] Compressed ${processedImages.length} images for ${type}`);
            } catch (imgErr) {
                console.warn('⚠️ [Import] Image compression failed:', imgErr.message);
                // نستمر بالروابط الأصلية
            }
        }

        let saved;
        if (type === 'car') {
            const Car = req.tenantModels.Car;
            const Brand = req.tenantModels.Brand;
            if (!Car) return res.status(500).json({ success: false, error: 'نموذج السيارات غير متاح' });

            const isEncar = data.sourceUrl && (data.sourceUrl.includes('encar.com') || data.sourceUrl.includes('encar.co.kr'));
            const pricing = normalizeImportPricing(data, isEncar);

            // جلب أو إنشاء الوكالة (Brand)
            let agencyId = null;
            if (Brand && data.make) {
                const makeName = String(data.make).trim();
                const makeKey = makeName.toLowerCase();
                let brandDoc = await Brand.findOne({ key: makeKey });
                if (!brandDoc) {
                    const clearbitLogo = `https://logo.clearbit.com/${makeKey.replace(/\s+/g, '')}.com`;
                    brandDoc = await Brand.create({
                        tenantId: getTenantId(req),
                        name: makeName,
                        key: makeKey,
                        logoUrl: clearbitLogo,
                        forCars: true,
                        forSpareParts: false,
                        isActive: true
                    });
                } else {
                    if (!brandDoc.forCars) {
                        brandDoc.forCars = true;
                        await brandDoc.save();
                    }
                }
                agencyId = brandDoc._id;
            }

            // تحقق من التكرار (منع إضافة نفس الرابط مرتين)
            if (data.sourceUrl) {
                const existingCar = await Car.findOne({ externalUrl: data.sourceUrl });
                if (existingCar) {
                    // تحديث بدلاً من الإضافة إذا كان موجوداً بالفعل
                    const updatedCar = await Car.findByIdAndUpdate(
                        existingCar._id,
                        {
                            $set: {
                                title: data.title || existingCar.title,
                                images: processedImages.length > 0 ? processedImages : existingCar.images,
                                description: data.description || existingCar.description,
                                make: data.make || existingCar.make,
                                model: data.model || existingCar.model,
                                year: data.year || existingCar.year,
                                agency: agencyId || existingCar.agency,
                                source: data.source || (isEncar ? 'korean_import' : existingCar.source || 'hm_local'),
                                listingType: data.listingType || (isEncar ? 'showroom' : existingCar.listingType || 'store'),
                                isActive: true,
                                isSold: false,
                                ...pricing,
                                updatedAt: new Date()
                            }
                        },
                        { new: true }
                    );
                    return res.json({
                        success: true,
                        message: '✅ تم تحديث السيارة الموجودة بنجاح (تم الكشف عن تكرار)',
                        data: updatedCar,
                        isDuplicate: true
                    });
                }
            }

            saved = await Car.create({
                tenantId: getTenantId(req),
                title: data.title,
                make: data.make || 'غير محدد',
                model: data.model || 'غير محدد',
                year: data.year || new Date().getFullYear(),
                price: pricing.price,
                priceSar: pricing.priceSar,
                priceUsd: pricing.priceUsd,
                priceKrw: pricing.priceKrw,
                basePriceUsd: pricing.basePriceUsd,
                description: data.description || '',
                images: processedImages,
                fuelType: data.fuelType || 'Petrol',
                transmission: data.transmission || 'Automatic',
                color: data.color || '',
                mileage: data.mileage || 0,
                category: data.category || 'sedan',
                externalUrl: data.sourceUrl || '',
                source: data.source || (isEncar ? 'korean_import' : 'hm_local'),
                listingType: data.listingType || (isEncar ? 'showroom' : 'store'),
                agency: agencyId,
                isActive: true,
                isSold: false,
            });
        } else {
            const SparePart = req.tenantModels.SparePart;
            const Brand = req.tenantModels.Brand;
            if (!SparePart) return res.status(500).json({ success: false, error: 'نموذج قطع الغيار غير متاح' });

            const pricing = normalizeImportPricing(data, false);

            // جلب أو إنشاء الوكالة لقطع الغيار
            let brandId = null;
            let brandLogoUrl = '';
            const rawBrandName = String(data.brand || data.carMake || data.make || '').trim();

            if (Brand && rawBrandName) {
                const brandKey = rawBrandName.toLowerCase();
                let brandDoc = await Brand.findOne({ 
                    $or: [
                        { key: brandKey },
                        { name: rawBrandName }
                    ]
                });
                
                // جلب الشعار المناسب للماركة (Clearbit CDN أو الشعار الممرر)
                const logo = data.brandLogoUrl || data.carMakeLogoUrl || data.logoUrl || (brandDoc ? brandDoc.logoUrl : '') || `https://logo.clearbit.com/${brandKey.replace(/\s+/g, '')}.com`;

                if (!brandDoc) {
                    brandDoc = await Brand.create({
                        tenantId: getTenantId(req),
                        name: rawBrandName,
                        key: brandKey,
                        logoUrl: logo,
                        forSpareParts: true,
                        forCars: false,
                        isActive: true
                    });
                } else {
                    let updated = false;
                    if (!brandDoc.forSpareParts) {
                        brandDoc.forSpareParts = true;
                        updated = true;
                    }
                    if ((!brandDoc.logoUrl || brandDoc.logoUrl.includes('placeholder')) && logo) {
                        brandDoc.logoUrl = logo;
                        updated = true;
                    }
                    if (updated) await brandDoc.save();
                }
                brandId = brandDoc._id;
                brandLogoUrl = brandDoc.logoUrl || logo;
            }

            // فحص التكرار لقطع الغيار
            if (data.sourceUrl) {
                const existingPart = await SparePart.findOne({ externalUrl: data.sourceUrl });
                if (existingPart) {
                    const updatedPart = await SparePart.findByIdAndUpdate(
                        existingPart._id,
                        {
                            $set: {
                                name: data.name || data.title || existingPart.name,
                                nameAr: data.name || data.title || existingPart.nameAr,
                                images: processedImages.length > 0 ? processedImages : existingPart.images,
                                img: processedImages[0] || existingPart.img,
                                image: processedImages[0] || existingPart.image,
                                description: data.description || existingPart.description,
                                brand: brandId || existingPart.brand,
                                carMake: rawBrandName || existingPart.carMake,
                                carMakeLogoUrl: brandLogoUrl || existingPart.carMakeLogoUrl,
                                carModel: data.model || data.carModel || existingPart.carModel,
                                ...pricing,
                                updatedAt: new Date()
                            }
                        },
                        { new: true }
                    );
                    return res.json({
                        success: true,
                        message: '✅ تم تحديث قطعة الغيار الموجودة بنجاح (تم الكشف عن تكرار)',
                        data: updatedPart,
                        isDuplicate: true
                    });
                }
            }

            const mainImage = processedImages[0] || data.imageUrl || (Array.isArray(data.images) ? data.images[0] : '') || '';

            saved = await SparePart.create({
                tenantId: getTenantId(req),
                name: data.name || data.title || 'قطعة مستوردة',
                nameAr: data.name || data.title || 'قطعة مستوردة',
                partNumber: data.partNumber || 'IMP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                partType: data.category || data.partType || 'Engine',
                partTypeAr: data.categoryAr || data.category || 'Engine',
                brand: brandId,
                carMake: rawBrandName || 'غير محدد',
                carMakeLogoUrl: brandLogoUrl || (rawBrandName ? `https://logo.clearbit.com/${rawBrandName.toLowerCase().replace(/\s+/g, '')}.com` : ''),
                carModel: data.model || data.carModel || '',
                carYear: Number(data.year || data.carYear) || new Date().getFullYear(),
                price: pricing.price,
                priceSar: pricing.priceSar,
                priceUsd: pricing.priceUsd,
                priceKrw: pricing.priceKrw,
                basePriceUsd: pricing.basePriceUsd,
                stockQty: data.stock || data.stockQty || 1,
                description: data.description || '',
                images: processedImages,
                img: mainImage,
                image: mainImage,
                externalUrl: data.sourceUrl || data.externalUrl || '',
                condition: data.condition || 'New',
                source: data.source || 'autospare',
                inStock: true,
            });
        }

        // تسجيل في AuditLog
        try {
            const AuditLog = req.tenantModels.AuditLog;
            if (AuditLog && req.user) {
                await AuditLog.logUserAction(
                    req.user.userId,
                    'CREATE',
                    type === 'car' ? 'Car' : 'SparePart',
                    `Imported new ${type}: ${saved.title || saved.name}`,
                    { targetId: saved._id, after: saved.toObject(), ipAddress: req.ip }
                );
            }
        } catch (logErr) {
            console.warn('⚠️ [Import] AuditLog failed:', logErr.message);
        }

        res.json({
            success: true,
            message: `✅ تم حفظ ${type === 'car' ? 'السيارة' : 'قطعة الغيار'} بنجاح مع ضغط ${processedImages.length} صورة`,
            data: saved
        });

    } catch (error) {
        next(error);
    }
});

// ─── POST /api/v2/import ─────────────────────────────────
/**
 * استيراد مباشر (معاينة + حفظ في خطوة واحدة) - للتوافقية
 */
router.post('/', requireAuthAPI, requireAdmin, async (req, res, next) => {
    try {
        const { url, type } = req.body;

        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ success: false, error: 'الرابط غير صالح أو فارغ' });
        }

        const scrapeResult = await ScraperService.scrapeUrl(url);

        if (!scrapeResult.success) {
            return res.status(400).json({ success: false, error: scrapeResult.error || 'فشل استخراج البيانات' });
        }

        const formattedData = {
            title: scrapeResult.data.title || 'عنصر مستورد',
            description: scrapeResult.data.description || '',
            images: scrapeResult.data.images || [],
            sourceUrl: url,
        };

        if (type === 'car') {
            formattedData.make = 'غير محدد';
            formattedData.model = 'غير محدد';
            formattedData.year = new Date().getFullYear();
            formattedData.price = scrapeResult.data.price || 0;
            formattedData.fuelType = 'Petrol';
            formattedData.transmission = 'Automatic';
        } else {
            formattedData.name = scrapeResult.data.title || 'قطعة مستوردة';
            formattedData.partNumber = 'IMP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            formattedData.category = 'استيراد جديد';
            formattedData.price = scrapeResult.data.price || 0;
            formattedData.stock = 1;
        }

        res.json({
            success: true,
            message: 'تم استخراج البيانات بنجاح',
            data: formattedData,
            images: scrapeResult.data.images || [],
            duplicate: false
        });
    } catch (error) {
        next(error);
    }
});

// ─── 3 مسارات استيراد منفصلة ومستقلة ──────────────────────

const showroomImportService = require('../../../services/ShowroomImportService');
const partsImportService = require('../../../services/PartsImportService');
const liveAuctionImportService = require('../../../services/LiveAuctionImportService');
const ImportLog = require('../../../models/ImportLog');

/**
 * POST /api/v2/import/showroom
 * استيراد منفصل لسيارات المعرض بعدد محدد
 */
router.post('/showroom', requireAuthAPI, requireAdmin, async (req, res, next) => {
    try {
        const { limit = 20, targetUrl = '' } = req.body;
        const adminUser = req.user?.name || req.user?.email || 'Admin';

        const result = await showroomImportService.importShowroomCars(req, {
            limit: parseInt(limit) || 20,
            targetUrl,
            adminUser
        });

        invalidateCache('/api/v2/cars');
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v2/import/parts
 * استيراد شامل ومنفصل لكافة أصناف قطع الغيار
 */
router.post('/parts', requireAuthAPI, requireAdmin, async (req, res, next) => {
    try {
        const { targetUrl = '' } = req.body;
        const adminUser = req.user?.name || req.user?.email || 'Admin';

        const result = await partsImportService.importAllParts(req, {
            targetUrl,
            adminUser
        });

        invalidateCache('/api/v2/parts');
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v2/import/live-auctions
 * استيراد منفصل لسيارات المزادات المباشرة الحية بعدد محدد
 */
router.post('/live-auctions', requireAuthAPI, requireAdmin, async (req, res, next) => {
    try {
        const { limit = 10, targetUrl = '' } = req.body;
        const adminUser = req.user?.name || req.user?.email || 'Admin';

        const result = await liveAuctionImportService.importLiveAuctionCars(req, {
            limit: parseInt(limit) || 10,
            targetUrl,
            adminUser
        });

        invalidateCache('/api/v2/auctions');
        invalidateCache('/api/v2/live-auctions');
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v2/import/logs
 * جلب سجلات وتاريخ جميع دفعة الاستيراد المنفذة
 */
router.get('/logs', requireAuthAPI, requireAdmin, async (req, res, next) => {
    try {
        const db = req.tenantDb || (require('mongoose').connection.readyState === 1 ? require('mongoose').connection : null);
        if (!db) {
            return res.json({ success: true, count: 0, logs: [] });
        }
        const ImportLogModel = db.models.ImportLog ||
            db.model('ImportLog', ImportLog.schema);
        const logs = await ImportLogModel.find({ tenantId: req.tenantId || 'default' })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        // إذا فشل جلب السجلات لا نوقف السيرفر — نرجع قائمة فارغة
        console.warn('⚠️ [ImportLogs] Could not fetch logs:', error.message);
        res.json({ success: true, count: 0, logs: [] });
    }
});

module.exports = router;

