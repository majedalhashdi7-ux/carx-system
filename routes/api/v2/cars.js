// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/cars.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
// [[ARABIC_COMMENT]] تم إضافة دعم العلامة المائية التلقائية لصور Encar عبر /api/v2/image-proxy

const express = require('express');
const router = express.Router();
const { getModel, addTenantFilter, getTenantId } = require('../../../tenants/tenant-model-helper');
const { requireAuthAPI, requirePermissionAPI } = require('../../../middleware/auth');
const SmartAlertService = require('../../../services/SmartAlertService');
const { cacheResponse, invalidateCache } = require('../../../middleware/cache');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  sendResponse
} = require('../../../utils/apiResponse');

function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function normalizeCarPricing(payload, rates) {
    const usdToSar = Number(rates?.usdToSar || 3.75);
    const usdToKrw = Number(rates?.usdToKrw || 1350);

    const krwPrice = toFiniteNumber(payload.priceKrw || payload.krwPrice || 0);

    const candidateUsd = toFiniteNumber(payload.basePriceUsd || payload.priceUsd || payload.usdPrice);
    const candidateSar = toFiniteNumber(payload.priceSar || payload.price);
    const candidateKrw = krwPrice;

    let basePriceUsd = candidateUsd;
    if (!basePriceUsd && candidateKrw > 0) basePriceUsd = candidateKrw / usdToKrw;
    if (!basePriceUsd && candidateSar > 0) basePriceUsd = candidateSar / usdToSar;

    const normalizedUsd = Number(basePriceUsd.toFixed(2));
    const normalizedSar = Number((normalizedUsd * usdToSar).toFixed(2));
    const normalizedKrw = candidateKrw > 0 ? candidateKrw : Math.round(normalizedUsd * usdToKrw);

    const isKorean = payload?.source === 'korean_import' ||
                     payload?.listingType === 'showroom' ||
                     (payload?.externalUrl && payload.externalUrl.includes('encar.com')) ||
                     (normalizedKrw > 0 && payload?.displayCurrency === 'KRW' && payload?.listingType !== 'store');

    const source = isKorean ? 'korean_import' : 'hm_local';
    const listingType = payload?.listingType || (isKorean ? 'showroom' : 'store');

    return {
        ...payload,
        source,
        listingType,
        basePriceUsd: normalizedUsd,
        priceUsd: normalizedUsd,
        priceSar: normalizedSar,
        priceKrw: normalizedKrw,
        price: normalizedSar,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// [[FIX]] دالة العلامة المائية الشاملة — تغطي جميع الصور الخارجية بدون استثناء
function applyWatermarkToImages(images = [], source = '') {
    if (!Array.isArray(images) || images.length === 0) return images;
    return images.map(img => {
        if (!img || typeof img !== 'string') return img;
        const trimmed = img.trim();
        if (!trimmed) return img;
        // تخطّى الصور المعالجة مسبقاً
        if (trimmed.includes('image-proxy') || trimmed.includes('watermark=true')) return img;
        // تخطّى الصور المرفوعة داخلياً (uploads/) — لا تحتاج proxy
        if (trimmed.startsWith('/uploads/') || trimmed.includes('/uploads/')) return img;
        // تطبيق البروكسي على كل رابط خارجي (http/https)
        if (trimmed.startsWith('http')) {
            return `/api/v2/image-proxy?url=${encodeURIComponent(trimmed)}&watermark=true&text=${encodeURIComponent('HM CAR')}`;
        }
        return img;
    });
}

// GET /api/v2/cars — جلب قائمة السيارات (مفلترة حسب المعرض دائماً)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', cacheResponse(300), async (req, res, next) => {
    try {
        const Car = getModel(req, 'Car');
        const SiteSettings = getModel(req, 'SiteSettings');
        const {
            page = 1,
            limit = 12,
            category,
            make,
            minPrice,
            maxPrice,
            search,
            status = 'active',
            listingType,
            source
        } = req.query;

        // بناء الفلتر
        const conditions = [];

        if (status === 'active') {
            conditions.push({ isActive: { $ne: false }, isSold: { $ne: true } });
        } else if (status === 'sold') {
            conditions.push({ isSold: true });
        } else if (status === 'inactive') {
            conditions.push({ isActive: false });
        }
        // status === 'all' → لا فلتر، يُعيد كل السيارات (للأدمن)

        if (category) conditions.push({ category });
        
        // خريطة شاملة للترجمة والبحث الثنائي للماركات (عربي ↔ إنجليزي)
        const BRAND_BILINGUAL_MAP = {
            'toyota': ['تويوتا', 'Toyota'],
            'hyundai': ['هيونداي', 'Hyundai'],
            'kia': ['كيا', 'Kia'],
            'genesis': ['جينيسيس', 'Genesis'],
            'nissan': ['نيسان', 'Nissan'],
            'honda': ['هوندا', 'Honda'],
            'suzuki': ['سوزوكي', 'Suzuki'],
            'mercedes': ['مرسيدس', 'مرسيدس بنز', 'Mercedes', 'Mercedes-Benz'],
            'mercedes-benz': ['مرسيدس', 'مرسيدس بنز', 'Mercedes', 'Mercedes-Benz'],
            'bmw': ['بي ام دبليو', 'بي إم دبليو', 'BMW'],
            'audi': ['أودي', 'Audi'],
            'volkswagen': ['فولكسواجن', 'فولكس واجن', 'Volkswagen', 'VW'],
            'porsche': ['بورش', 'Porsche'],
            'ford': ['فورد', 'Ford'],
            'chevrolet': ['شيفروليه', 'Chevrolet', 'Chevy'],
            'lexus': ['لكزس', 'Lexus'],
            'infiniti': ['إنفينيتي', 'انفينيتي', 'Infiniti'],
            'land rover': ['لاند روفر', 'Land Rover', 'Range Rover'],
            'land-rover': ['لاند روفر', 'Land Rover', 'Range Rover'],
            'jeep': ['جيب', 'Jeep'],
            'mazda': ['مازدا', 'Mazda'],
            'mitsubishi': ['ميتسوبيشي', 'Mitsubishi'],
            'subaru': ['سوبارو', 'Subaru'],
            'volvo': ['فولفو', 'Volvo'],
            'renault': ['رينو', 'Renault'],
            'peugeot': ['بيجو', 'Peugeot'],
            'tesla': ['تسلا', 'Tesla'],
            'mg': ['ام جي', 'إم جي', 'MG'],
            'cadillac': ['كاديلاك', 'Cadillac'],
            'dodge': ['دودج', 'Dodge'],
            'gmc': ['جي ام سي', 'GMC'],

            'تويوتا': ['Toyota', 'تويوتا'],
            'هيونداي': ['Hyundai', 'هيونداي'],
            'كيا': ['Kia', 'كيا'],
            'جينيسيس': ['Genesis', 'جينيسيس'],
            'نيسان': ['Nissan', 'نيسان'],
            'هوندا': ['Honda', 'هوندا'],
            'سوزوكي': ['Suzuki', 'سوزوكي'],
            'مرسيدس': ['Mercedes', 'مرسيدس', 'مرسيدس بنز'],
            'مرسيدس بنز': ['Mercedes-Benz', 'Mercedes', 'مرسيدس', 'مرسيدس بنز'],
            'بي ام دبليو': ['BMW', 'بي ام دبليو', 'بي إم دبليو'],
            'بي إم دبليو': ['BMW', 'بي ام دبليو', 'بي إم دبليو'],
            'أودي': ['Audi', 'أودي'],
            'فولكسواجن': ['Volkswagen', 'فولكسواجن'],
            'فولكس واجن': ['Volkswagen', 'فولكس واجن'],
            'بورش': ['Porsche', 'بورش'],
            'فورد': ['Ford', 'فورد'],
            'شيفروليه': ['Chevrolet', 'شيفروليه'],
            'لكزس': ['Lexus', 'لكزس'],
            'إنفينيتي': ['Infiniti', 'إنفينيتي', 'انفينيتي'],
            'انفينيتي': ['Infiniti', 'إنفينيتي', 'انفينيتي'],
            'لاند روفر': ['Land Rover', 'Range Rover', 'لاند روفر'],
            'جيب': ['Jeep', 'جيب'],
            'مازدا': ['Mazda', 'مازدا'],
            'ميتسوبيشي': ['Mitsubishi', 'ميتسوبيشي'],
            'سوبارو': ['Subaru', 'سوبارو'],
            'فولفو': ['Volvo', 'فولفو'],
            'رينو': ['Renault', 'رينو'],
            'بيجو': ['Peugeot', 'بيجو'],
            'تسلا': ['Tesla', 'تسلا'],
            'ام جي': ['MG', 'ام جي'],
            'إم جي': ['MG', 'إم جي'],
            'كاديلاك': ['Cadillac', 'كاديلاك'],
            'دودج': ['Dodge', 'دودج'],
            'جي ام سي': ['GMC', 'جي ام سي']
        };

        if (make) {
            const makeKey = make.trim().toLowerCase();
            const equivalents = BRAND_BILINGUAL_MAP[makeKey] || BRAND_BILINGUAL_MAP[make.trim()] || [make];
            const makeOr = [];
            equivalents.forEach(eq => {
                const escaped = eq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                makeOr.push({ make: { $regex: `^${escaped}$`, $options: 'i' } });
                makeOr.push({ makeAr: { $regex: `^${escaped}$`, $options: 'i' } });
            });
            conditions.push({ $or: makeOr });
        }

        if (listingType) {
            if (listingType === 'store') {
                conditions.push({
                    $or: [
                        { listingType: 'store' },
                        { listingType: { $exists: false } },
                        { listingType: null },
                        { listingType: '' }
                    ]
                });
            } else {
                conditions.push({ listingType });
            }
        }

        if (source) conditions.push({ source });

        if (minPrice || maxPrice) {
            const priceFilter = {};
            if (minPrice) priceFilter.$gte = Number(minPrice);
            if (maxPrice) priceFilter.$lte = Number(maxPrice);
            conditions.push({ $or: [{ priceSar: priceFilter }, { price: priceFilter }] });
        }

        if (search) {
            const s = search.trim();
            const lowerS = s.toLowerCase();
            const equivalents = BRAND_BILINGUAL_MAP[lowerS] || BRAND_BILINGUAL_MAP[s] || [];
            const fuzzyTokens = s.split(/\s+/).filter(t => t.length > 1);
            const safeKey = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const searchConditions = [
                { title: { $regex: safeKey, $options: 'i' } },
                { titleAr: { $regex: safeKey, $options: 'i' } },
                { make: { $regex: safeKey, $options: 'i' } },
                { makeAr: { $regex: safeKey, $options: 'i' } },
                { model: { $regex: safeKey, $options: 'i' } },
                { description: { $regex: safeKey, $options: 'i' } },
                { descriptionAr: { $regex: safeKey, $options: 'i' } },
            ];

            equivalents.forEach(eq => {
                const safeEq = eq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                searchConditions.push({ make: { $regex: safeEq, $options: 'i' } });
                searchConditions.push({ makeAr: { $regex: safeEq, $options: 'i' } });
                searchConditions.push({ title: { $regex: safeEq, $options: 'i' } });
                searchConditions.push({ titleAr: { $regex: safeEq, $options: 'i' } });
            });

            fuzzyTokens.forEach(token => {
                if (token !== s) {
                    const safeToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    searchConditions.push({ make: { $regex: safeToken, $options: 'i' } });
                    searchConditions.push({ makeAr: { $regex: safeToken, $options: 'i' } });
                    searchConditions.push({ title: { $regex: safeToken, $options: 'i' } });
                    searchConditions.push({ titleAr: { $regex: safeToken, $options: 'i' } });
                    searchConditions.push({ model: { $regex: safeToken, $options: 'i' } });
                }
            });

            conditions.push({ $or: searchConditions });
        }

        const filter = conditions.length > 0 ? { $and: conditions } : {};

        // [[ARABIC_COMMENT]] addTenantFilter يضمن عزل كامل بين المعارض — إلزامي
        const tenantFilter = addTenantFilter(req, filter);

        const skip = (page - 1) * limit;

        const [cars, total] = await Promise.all([
            Car.find(tenantFilter)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Car.countDocuments(tenantFilter)
        ]);

        // جلب سعر الصرف
        let usdToSar = 3.75;
        try {
            const settings = await SiteSettings.getSettings();
            usdToSar = Number(settings?.currencySettings?.usdToSar) || 3.75;
        } catch (e) { /* fallback to default */ }

        res.json({
            success: true,
            data: cars.map(car => ({
                _id: car._id,
                id: car._id,
                title: car.title,
                titleAr: car.titleAr || car.title,
                make: car.make,
                model: car.model,
                year: car.year,
                price: car.price || car.priceSar || (car.priceUsd ? car.priceUsd * usdToSar : 0) || 0,
                priceSar: car.priceSar || car.price || (car.priceUsd ? car.priceUsd * usdToSar : 0) || 0,
                priceUsd: car.priceUsd || (car.priceSar ? car.priceSar / usdToSar : 0) || 0,
                basePriceUsd: car.basePriceUsd || car.priceUsd || (car.priceSar ? car.priceSar / usdToSar : 0) || 0,
                priceKrw: car.priceKrw || 0,
                displayCurrency: car.displayCurrency || 'SAR',
                images: applyWatermarkToImages(car.images || [], car.source),
                imageUrl: applyWatermarkToImages([car.imageUrl || (car.images && car.images[0]) || ''], car.source)[0] || '',
                category: car.category,
                isActive: car.isActive,
                isSold: car.isSold,
                createdAt: car.createdAt,
                updatedAt: car.updatedAt,
                color: car.color,
                fuelType: car.fuelType,
                fuelAr: car.fuelAr || car.fuelType,
                transmission: car.transmission,
                transmissionAr: car.transmissionAr || car.transmission,
                mileage: car.mileage,
                description: car.description,
                descriptionAr: car.descriptionAr || car.description,
                listingType: car.listingType || 'store',
                source: car.source || 'hm_local',
                makeAr: car.makeAr || car.make,
                badge: car.badge || '',
                agency: car.agency || null,
                specs: car.specs || null,
                inspectionReport: car.inspectionReport || null,
                featuresAr: car.featuresAr || [],
                featuresEn: car.featuresEn || [],
                tenantId: car.tenantId
            })),
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v2/cars/makes — جلب قائمة الماركات (مفلترة بالمعرض)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/makes', cacheResponse(1800), async (req, res, next) => {
    try {
        const Car = getModel(req, 'Car');
        const includeInactive = String(req.query.includeInactive || 'false') === 'true';
        const filter = includeInactive ? {} : { isActive: true, isSold: false };

        const makes = await Car.distinct('make', addTenantFilter(req, filter));

        // [[FIX]] إزالة تكرار الماركات (case-insensitive dedup)
        // مثلاً: 'Kia' و 'kia' و 'كيا' — نُبقي الأكثر شيوعاً
        const seen = new Map();
        const cleaned = makes
            .map(m => (typeof m === 'string' ? m.trim() : String(m || '').trim()))
            .filter(Boolean)
            .reduce((acc, make) => {
                const key = make.toLowerCase().replace(/\s+/g, '');
                if (!seen.has(key)) {
                    seen.set(key, make);
                    acc.push(make);
                } else {
                    // إذا النسخة الحالية أطول أو عربية — نستبدل
                    const existing = seen.get(key);
                    const isCurrentArabic = /[\u0600-\u06FF]/.test(make);
                    const isExistingArabic = /[\u0600-\u06FF]/.test(existing);
                    if (!isExistingArabic && isCurrentArabic) {
                        seen.set(key, make);
                        const idx = acc.indexOf(existing);
                        if (idx !== -1) acc[idx] = make;
                    }
                }
                return acc;
            }, [])
            .sort((a, b) => String(a).localeCompare(String(b), 'ar'));

        res.json({ success: true, data: cleaned });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v2/cars/fix-tenant-id — إصلاح tenantId للسيارات بدون معرف (أدمن)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/fix-tenant-id', requireAuthAPI, async (req, res, next) => {
    try {
        if (!req.user.role || !['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Forbidden', message: 'Admin access required' });
        }
        const Car = getModel(req, 'Car');
        const tenantId = getTenantId(req);

        const result = await Car.updateMany(
            {
                $or: [
                    { tenantId: { $exists: false } },
                    { tenantId: 'default' },
                    { tenantId: null }
                ]
            },
            { $set: { tenantId } }
        );

        res.json({
            success: true,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            tenantId,
            message: `تم تحديث ${result.modifiedCount} سيارة بنجاح إلى المعرض: ${tenantId}`
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v2/cars/:id — جلب تفاصيل سيارة محددة (مع فلتر المعرض)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', cacheResponse(600), async (req, res, next) => {
    try {
        const Car = getModel(req, 'Car');
        const idParam = req.params.id;
        const mongoose = require('mongoose');

        const idConditions = [{ _id: idParam }, { id: idParam }];
        if (mongoose.Types.ObjectId.isValid(idParam)) {
            idConditions.push({ _id: new mongoose.Types.ObjectId(idParam) });
        }

        let car = null;
        try {
            car = await Car.findOne(addTenantFilter(req, { $or: idConditions }))
                .populate('agency')
                .lean();
        } catch (popErr) {
            car = await Car.findOne(addTenantFilter(req, { $or: idConditions })).lean();
        }

        if (!car && Car.collection) {
            const tenantId = req.tenant?.id || 'hmcar';
            // [[FIX]] إضافة فلتر tenant لمنع إرجاع سيارة من معرض آخر
            car = await Car.collection.findOne({
                $and: [
                    { $or: [{ tenantId }, { tenantId: 'default' }, { tenantId: null }, { tenantId: { $exists: false } }] },
                    { $or: [
                        { _id: idParam },
                        { id: idParam },
                        ...(mongoose.Types.ObjectId.isValid(idParam) ? [{ _id: new mongoose.Types.ObjectId(idParam) }] : [])
                    ]}
                ]
            });
        }

        if (!car) {
            return sendResponse(res, notFoundResponse('Car'));
        }

        // حذف الحقول الداخلية الحساسة قبل إرسالها للعميل
        const {
            externalUrl,
            externalRef,
            encarUrl,
            originalImages,
            ...publicCarData
        } = car;

        // [[ARABIC_COMMENT]] تطبيق العلامة المائية على صور السيارة الكورية في صفحة التفاصيل
        const watermarkedImages = applyWatermarkToImages(publicCarData.images || [], publicCarData.source);
        const watermarkedImageUrl = applyWatermarkToImages(
            [publicCarData.imageUrl || (publicCarData.images && publicCarData.images[0]) || ''],
            publicCarData.source
        )[0] || '';

        res.json({
            success: true,
            data: {
                ...publicCarData,
                images: watermarkedImages,
                imageUrl: watermarkedImageUrl,
                makeAr: car.makeAr || car.make,
                badge: car.badge || '',
                fuelAr: car.fuelAr || car.fuelType,
                transmissionAr: car.transmissionAr || car.transmission,
            }
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v2/cars — إضافة سيارة جديدة (أدمن فقط — مرتبطة بالمعرض)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireAuthAPI, requirePermissionAPI('manage_cars'), invalidateCache('/api/v2/cars*'), async (req, res, next) => {
    try {
        const Car = getModel(req, 'Car');
        const AuditLog = getModel(req, 'AuditLog');
        const SiteSettings = getModel(req, 'SiteSettings');

        const tenantId = getTenantId(req);
        let settings;
        try { settings = await SiteSettings.getSettings(); } catch (e) { settings = {}; }

        const payload = normalizeCarPricing(req.body, settings?.currencySettings);

        // [[FIX]] تطبيق العلامة المائية تلقائياً على الصور عند الإنشاء
        if (payload.images && Array.isArray(payload.images)) {
            payload.images = applyWatermarkToImages(payload.images, payload.source);
        }
        if (payload.imageUrl) {
            const wmArr = applyWatermarkToImages([payload.imageUrl], payload.source);
            payload.imageUrl = wmArr[0] || payload.imageUrl;
        }

        // [[ARABIC_COMMENT]] ربط السيارة الجديدة بمعرف المعرض الحالي دائماً — لا تخلط
        const car = new Car({
            ...payload,
            tenantId,
            seller: req.user?.userId || req.user?.id || null
        });
        await car.save();

        // تسجيل في سجل الأحداث
        AuditLog.logUserAction(
            req.user.userId || req.user.id,
            'CREATE',
            'Car',
            `Created new car: ${car.title}`,
            {
                targetId: car._id,
                after: car.toObject(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api',
                tenantId
            }
        ).catch(err => console.error('[AuditLog] Error:', err.message));

        // تفعيل التنبيهات الذكية بشكل غير متزامن
        SmartAlertService.checkNewCar(car).catch(err =>
            console.error('[SmartAlert] خطأ في checkNewCar:', err.message)
        );

        res.status(201).json({
            success: true,
            data: car,
            message: 'تم إضافة السيارة بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v2/cars/:id — تحديث سيارة (أدمن فقط — مع فلتر المعرض الإلزامي)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', requireAuthAPI, requirePermissionAPI('manage_cars'), invalidateCache('/api/v2/cars*'), async (req, res, next) => {
    try {
        const Car = getModel(req, 'Car');
        const AuditLog = getModel(req, 'AuditLog');
        const SiteSettings = getModel(req, 'SiteSettings');
        const tenantId = getTenantId(req);

        const mongoose = require('mongoose');
        const idParam = req.params.id;
        const idFilter = {
            $or: [
                { _id: idParam },
                { id: idParam },
                ...(mongoose.Types.ObjectId.isValid(idParam) ? [{ _id: new mongoose.Types.ObjectId(idParam) }] : [])
            ]
        };

        // [[ARABIC_COMMENT]] addTenantFilter ضروري: يمنع تعديل سيارة من معرض آخر
        const oldCar = await Car.findOne(addTenantFilter(req, idFilter));
        if (!oldCar) {
            return sendResponse(res, notFoundResponse('Car'));
        }

        let settings;
        try { settings = await SiteSettings.getSettings(); } catch (e) { settings = {}; }

        // دمج البيانات القديمة مع الجديدة
        const mergedPayload = { ...oldCar.toObject(), ...req.body };
        const normalizedPayload = normalizeCarPricing(mergedPayload, settings?.currencySettings);

        // [[FIX]] تطبيق العلامة المائية تلقائياً على الصور عند التحديث
        if (normalizedPayload.images && Array.isArray(normalizedPayload.images)) {
            normalizedPayload.images = applyWatermarkToImages(normalizedPayload.images, normalizedPayload.source);
        }
        if (normalizedPayload.imageUrl) {
            const wmArr = applyWatermarkToImages([normalizedPayload.imageUrl], normalizedPayload.source);
            normalizedPayload.imageUrl = wmArr[0] || normalizedPayload.imageUrl;
        }

        // حقول لا يجوز تعديلها
        delete normalizedPayload._id;
        delete normalizedPayload.__v;
        delete normalizedPayload.createdAt;
        delete normalizedPayload.updatedAt;

        // [[ARABIC_COMMENT]] الـ tenantId لا يتغير عند التحديث — يبقى ثابتاً
        normalizedPayload.tenantId = tenantId;

        // [[FIX]] تنظيف حقل condition من القيم غير الإنجليزية (السيارات الكورية)
        const validConditions = ['excellent', 'good', 'fair', 'needs work'];
        if (normalizedPayload.condition && !validConditions.includes(normalizedPayload.condition)) {
            normalizedPayload.condition = 'good';
        }

        const car = await Car.findOneAndUpdate(
            addTenantFilter(req, idFilter),
            normalizedPayload,
            { new: true, runValidators: false }
        );

        if (!car) {
            return sendResponse(res, notFoundResponse('Car'));
        }

        AuditLog.logUserAction(
            req.user.userId || req.user.id,
            'UPDATE',
            'Car',
            `Updated car: ${car.title}`,
            {
                targetId: car._id,
                before: oldCar.toObject(),
                after: car.toObject(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api',
                tenantId
            }
        ).catch(err => console.error('[AuditLog] Error:', err.message));

        res.json({
            success: true,
            data: car,
            message: 'تم تحديث السيارة بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v2/cars/:id — حذف سيارة (أدمن فقط — فلتر المعرض إلزامي)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAuthAPI, requirePermissionAPI('manage_cars'), invalidateCache('/api/v2/cars*'), async (req, res, next) => {
    try {
        const Car = getModel(req, 'Car');
        const AuditLog = getModel(req, 'AuditLog');
        const tenantId = getTenantId(req);
        const mongoose = require('mongoose');
        const idParam = req.params.id;
        const idFilter = {
            $or: [
                { _id: idParam },
                { id: idParam },
                ...(mongoose.Types.ObjectId.isValid(idParam) ? [{ _id: new mongoose.Types.ObjectId(idParam) }] : [])
            ]
        };

        // [[ARABIC_COMMENT]] addTenantFilter إلزامي هنا: يمنع حذف سيارة من معرض آخر
        const car = await Car.findOneAndDelete(addTenantFilter(req, idFilter));

        if (!car) {
            return sendResponse(res, notFoundResponse('Car'));
        }

        console.log(`🗑️ [CarAPI] Car deleted: ${car._id} (${car.title}) from tenant: ${tenantId}`);

        AuditLog.logUserAction(
            req.user.userId || req.user.id,
            'DELETE',
            'Car',
            `Deleted car: ${car.title}`,
            {
                targetId: car._id,
                before: car.toObject(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api',
                tenantId
            }
        ).catch(err => console.error('[AuditLog] Error:', err.message));

        res.json({
            success: true,
            message: 'تم حذف السيارة بنجاح من المعرض'
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v2/cars/:id/sold — تعليم السيارة كـ "مباعة" (أدمن فقط)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/sold', requireAuthAPI, requirePermissionAPI('manage_cars'), invalidateCache('/api/v2/cars*'), async (req, res, next) => {
    try {
        const Car = getModel(req, 'Car');
        const AuditLog = getModel(req, 'AuditLog');
        const tenantId = getTenantId(req);
        const { soldPrice, buyerNote } = req.body;

        const car = await Car.findOneAndUpdate(
            addTenantFilter(req, { _id: req.params.id }),
            {
                isSold: true,
                isActive: false,
                soldAt: new Date(),
                ...(soldPrice && { soldPrice }),
                ...(buyerNote && { buyerNote }),
            },
            { new: true }
        );

        if (!car) {
            return sendResponse(res, notFoundResponse('Car'));
        }

        AuditLog.logUserAction(
            req.user.userId || req.user.id,
            'SOLD',
            'Car',
            `تم بيع السيارة: ${car.title}`,
            {
                targetId: car._id,
                after: { isSold: true, soldAt: car.soldAt, soldPrice: car.soldPrice },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api',
                tenantId
            }
        ).catch(err => console.error('[AuditLog] Error:', err.message));

        res.json({
            success: true,
            data: car,
            message: 'تم تحديث السيارة كـ "مباعة" بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
