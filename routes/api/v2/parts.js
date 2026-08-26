// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/parts.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/parts.js) مسؤول عن إدارة قطع الغيار، وهو يحتوي على نظام جلب القطع (Scraping) من المواقع الخارجية.
const express = require('express');
const router = express.Router();
const { getModel, addTenantFilter } = require('../../../tenants/tenant-model-helper');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');
const { cacheResponse, invalidateCache } = require('../../../middleware/cache');

function normalizeExternalImage(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('http')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    
    // [[ARABIC_COMMENT]] إذا كان المسار يبدأ بـ /storage أو /media فمن المرجح أنه تابع للموقع الأصلي
    if (trimmed.startsWith('/')) return `https://autospare.com.eg${trimmed}`;
    
    // [[ARABIC_COMMENT]] إذا كان المسار محلياً لنظامنا (مرفوع مسبقاً)
    if (trimmed.startsWith('/uploads')) return trimmed;
    
    return `https://autospare.com.eg/${trimmed}`;
}

function toArabicCategory(value = '') {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('engine')) return 'محرك';
    if (normalized.includes('brake')) return 'فرامل';
    if (normalized.includes('suspension')) return 'تعليق';
    if (normalized.includes('filter')) return 'فلاتر';
    if (normalized.includes('electrical')) return 'كهرباء';
    if (normalized.includes('body')) return 'هيكل';
    if (normalized.includes('accessories')) return 'إكسسوارات';
    return value || 'عام';
}

function translatePartNameToArabic(value = '') {
    if (!value || typeof value !== 'string') return '';
    return value
        .replace(/engine/gi, 'محرك')
        .replace(/transmission/gi, 'ناقل الحركة')
        .replace(/gearbox/gi, 'جير')
        .replace(/brake/gi, 'فرامل')
        .replace(/pad(s)?/gi, 'فحمات')
        .replace(/disc/gi, 'دسك')
        .replace(/filter/gi, 'فلتر')
        .replace(/air\s*filter/gi, 'فلتر هواء')
        .replace(/oil\s*filter/gi, 'فلتر زيت')
        .replace(/fuel\s*filter/gi, 'فلتر وقود')
        .replace(/spark\s*plug/gi, 'بوجي')
        .replace(/battery/gi, 'بطارية')
        .replace(/radiator/gi, 'رديتر')
        .replace(/pump/gi, 'مضخة')
        .replace(/suspension/gi, 'نظام التعليق')
        .replace(/shock/gi, 'مساعد')
        .replace(/arm/gi, 'ذراع')
        .replace(/sensor/gi, 'حساس')
        .replace(/head\s*lamp|headlight/gi, 'شمعة أمامية')
        .replace(/tail\s*lamp|taillight/gi, 'شمعة خلفية')
        .replace(/bumper/gi, 'صدام')
        .replace(/door/gi, 'باب')
        .replace(/mirror/gi, 'مرآة')
        .replace(/wheel/gi, 'جنط')
        .replace(/tire|tyre/gi, 'إطار')
        .replace(/kit/gi, 'طقم')
        .trim();
}

function cleanModelName(value = '') {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
}

// GET /api/v2/parts - قائمة قطع الغيار
router.get('/', cacheResponse(600), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        const SiteSettings = getModel(req, 'SiteSettings');
        const category = req.query.category || req.query.partType;
        const q = req.query.q || req.query.search;
        const { brand, brandId, carModel, limit = 20 } = req.query;
        const filter = {};

        // [[ARABIC_COMMENT]] فلتر الفئة: يدعم الأسماء الإنجليزية والعربية معاً
        if (category && category !== 'ALL' && category !== 'all') {
            // الفئات التي ترد من واجهة المستخدم قد تكون Engine أو Brakes إلخ
            // كما قد تكون البيانات المستوردة General أو قيمة أخرى
            // نبحث في partType بشكل مرن
            const categoryRegex = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.partType = categoryRegex;
        }

        // [[ARABIC_COMMENT]] دعم البحث بالاسم أو الوكالة أو صانع السيارة
        if (q) {
            const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            if (!filter.$and) filter.$and = [];
            filter.$and.push({
                $or: [{ name: re }, { nameAr: re }, { partType: re }, { carMake: re }, { carModel: re }]
            });
        }

        // [[ARABIC_COMMENT]] فلتر مباشر بمعرف الوكالة (MongoDB ObjectId) - الأدق
        if (brandId) {
            const mongoose = require('mongoose');
            try {
                const Brand = getModel(req, 'Brand');
                const brandDoc = await Brand.findById(brandId).lean();
                if (brandDoc) {
                    // Search by carMake matching the brand name OR by brand ObjectId
                    const nameRegex = new RegExp(brandDoc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                    if (!filter.$and) filter.$and = [];
                    filter.$and.push({
                        $or: [
                            { carMake: nameRegex },
                            { brand: new mongoose.Types.ObjectId(brandId) }
                        ]
                    });
                } else {
                    // Brand not found - use the ID directly
                    if (!filter.$and) filter.$and = [];
                    filter.$and.push({ brand: new mongoose.Types.ObjectId(brandId) });
                }
            } catch (err) { }
        } else if (brand) {
            // [[ARABIC_COMMENT]] فلتر مباشر حسب اسم وكالة السيارة - يدعم النص أو المعرف
            const brandRegex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const brandConditions = [{ carMake: brandRegex }];
            
            try {
                const Brand = getModel(req, 'Brand');
                const foundBrands = await Brand.find({ name: brandRegex }).select('_id').lean();
                if (foundBrands.length > 0) {
                    brandConditions.push({ brand: { $in: foundBrands.map(b => b._id) } });
                }
            } catch (err) { }
            
            if (!filter.$and) filter.$and = [];
            filter.$and.push({ $or: brandConditions });
        }

        // [[ARABIC_COMMENT]] فلتر مباشر حسب الموديل
        if (carModel && carModel !== 'ALL') {
            filter.carModel = new RegExp(carModel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }

        const settings = await SiteSettings.getSettings().catch(() => null);
        const usdToSar = Number(settings?.currencySettings?.usdToSar || 3.75);
        const usdToKrw = Number(settings?.currencySettings?.usdToKrw || 1350);
        const partsMultiplier = Number(settings?.currencySettings?.partsMultiplier || 1.0);
        const safeMultiplier = Number.isFinite(partsMultiplier) && partsMultiplier > 0 ? partsMultiplier : 1.0;

        // [[ARABIC_COMMENT]] إخفاء القطع المخفية يدوياً فقط (inStock=false صراحةً)
        // القطع التي ليس لها حقل inStock تعتبر متاحة تلقائياً
        const isAdminView = req.query.adminView === 'true';
        if (!isAdminView) {
            // نُضيف الشرط ضمن $and لتجنب تعارضه مع باقي الفلاتر
            if (!filter.$and) filter.$and = [];
            filter.$and.push({
                $or: [
                    { inStock: true },
                    { inStock: { $exists: false } },
                    { inStock: null }
                ]
            });
        }

        const finalFilter = addTenantFilter(req, filter);
        let parts = [];
        try {
            parts = await SparePart.find(finalFilter)
                .populate('brand', 'name logoUrl')
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .lean();
        } catch (popErr) {
            // Fallback if brand contains a string instead of ObjectId
            parts = await SparePart.find(finalFilter)
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .lean();
        }

        const mappedParts = parts.map(p => {
            const sarPrice = Number(p.priceSar || p.price || 0);
            const baseUsd = Number(p.basePriceUsd || p.priceUsd || (sarPrice > 0 ? (sarPrice / usdToSar) : 0));
            const adjustedUsd = Number((baseUsd * safeMultiplier).toFixed(2));
            const adjustedSar = sarPrice > 0 && !p.basePriceUsd && !p.priceUsd
                ? sarPrice
                : Math.round(adjustedUsd * usdToSar);
            const adjustedKrw = Number(Math.round(adjustedUsd * usdToKrw));

            return ({
                id: p._id,
                name: p.name,
                nameAr: p.nameAr || translatePartNameToArabic(p.name) || p.name,
                brand: p.carMake || (p.brand && typeof p.brand === 'object' ? p.brand.name : p.brand),
                brandId: p.brand && typeof p.brand === 'object' ? p.brand._id : p.brand,
                brandLogo: p.carMakeLogoUrl || (p.brand && typeof p.brand === 'object' ? p.brand.logoUrl : null),
                model: cleanModelName(p.carModel || ''),
                price: adjustedSar,
                priceSar: adjustedSar,
                priceUsd: adjustedUsd,
                priceKrw: adjustedKrw,
                basePriceUsd: Number((p.basePriceUsd || baseUsd).toFixed(2)),
                currency: 'SAR',
                category: p.partType,
                categoryAr: p.partTypeAr || toArabicCategory(p.partType),
                partType: p.partType,
                partTypeAr: p.partTypeAr || toArabicCategory(p.partType),
                condition: String(p.condition || 'NEW').toUpperCase(),
                img: normalizeExternalImage(p.images?.[0]) || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop',
                images: (p.images || []).map(normalizeExternalImage).filter(Boolean),
                carModel: cleanModelName(p.carModel || ''),
                compatibility: [cleanModelName(p.carModel || '') || 'ALL Models'],
                _id: p._id,
                stock: typeof p.stockQty === 'number' ? p.stockQty : 1,
                stockQty: typeof p.stockQty === 'number' ? p.stockQty : 1,
                soldCount: p.soldCount || 0,
                inStock: typeof p.inStock === 'boolean' ? p.inStock : true,
                description: p.description || '',
                rareLevel: 3
            });
        });

        res.json({
            success: true,
            data: mappedParts,
            parts: mappedParts
        });
    } catch (error) {
        console.error('API Parts error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.get('/:id', cacheResponse(600), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        const SiteSettings = getModel(req, 'SiteSettings');
        const idParam = req.params.id;
        const mongoose = require('mongoose');

        const idConditions = [{ _id: idParam }, { id: idParam }];
        if (mongoose.Types.ObjectId.isValid(idParam)) {
            idConditions.push({ _id: new mongoose.Types.ObjectId(idParam) });
        }

        let p = null;
        try {
            p = await SparePart.findOne(addTenantFilter(req, { $or: idConditions }))
                .populate('brand', 'name logoUrl')
                .lean();
        } catch (popErr) {
            p = await SparePart.findOne(addTenantFilter(req, { $or: idConditions })).lean();
        }

        if (!p && SparePart.collection) {
            p = await SparePart.collection.findOne({
                $or: [
                    { _id: idParam },
                    { id: idParam },
                    ...(mongoose.Types.ObjectId.isValid(idParam) ? [{ _id: new mongoose.Types.ObjectId(idParam) }] : [])
                ]
            });
        }

        if (!p) {
            return res.status(404).json({ success: false, error: 'Part not found' });
        }

        const settings = await SiteSettings.getSettings().catch(() => null);
        const usdToSar = Number(settings?.currencySettings?.usdToSar || 3.75);
        const usdToKrw = Number(settings?.currencySettings?.usdToKrw || 1350);
        const partsMultiplier = Number(settings?.currencySettings?.partsMultiplier || 1.0);
        const safeMultiplier = Number.isFinite(partsMultiplier) && partsMultiplier > 0 ? partsMultiplier : 1.0;

        const sarPrice = Number(p.priceSar || p.price || 0);
        const baseUsd = Number(p.basePriceUsd || p.priceUsd || (sarPrice > 0 ? (sarPrice / usdToSar) : 0));
        const adjustedUsd = Number((baseUsd * safeMultiplier).toFixed(2));
        const adjustedSar = sarPrice > 0 && !p.basePriceUsd && !p.priceUsd
            ? sarPrice
            : Math.round(adjustedUsd * usdToSar);
        const adjustedKrw = Number(Math.round(adjustedUsd * usdToKrw));

        const mappedPart = {
            id: p._id,
            name: p.name,
            nameAr: p.nameAr || translatePartNameToArabic(p.name) || p.name,
            brand: p.carMake || (p.brand && typeof p.brand === 'object' ? p.brand.name : p.brand),
            brandId: p.brand && typeof p.brand === 'object' ? p.brand._id : p.brand,
            brandLogo: p.carMakeLogoUrl || (p.brand && typeof p.brand === 'object' ? p.brand.logoUrl : null),
            model: cleanModelName(p.carModel || ''),
            price: adjustedSar,
            priceSar: adjustedSar,
            priceUsd: adjustedUsd,
            priceKrw: adjustedKrw,
            basePriceUsd: Number((p.basePriceUsd || baseUsd).toFixed(2)),
            currency: 'SAR',
            category: p.partType,
            categoryAr: p.partTypeAr || toArabicCategory(p.partType),
            partType: p.partType,
            partTypeAr: p.partTypeAr || toArabicCategory(p.partType),
            condition: String(p.condition || 'NEW').toUpperCase(),
            img: normalizeExternalImage(p.images?.[0]) || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop',
            images: (p.images || []).map(normalizeExternalImage).filter(Boolean),
            carModel: cleanModelName(p.carModel || ''),
            compatibility: [cleanModelName(p.carModel || '') || 'ALL Models'],
            _id: p._id,
            stock: typeof p.stockQty === 'number' ? p.stockQty : 1,
            stockQty: typeof p.stockQty === 'number' ? p.stockQty : 1,
            soldCount: p.soldCount || 0,
            inStock: typeof p.inStock === 'boolean' ? p.inStock : true,
            description: p.description || '',
            rareLevel: 3
        };

        res.json({
            success: true,
            data: mappedPart,
            part: mappedPart
        });
    } catch (error) {
        console.error('API Single Part error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/parts - Add new part
router.post('/', requireAuthAPI, invalidateCache('/api/v2/parts*'), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        const { name, brand, model, year, price, category, images, description, condition, stockQty } = req.body;
        const part = await SparePart.create({
            name,
            carMake: brand,
            carModel: model,
            year: year || new Date().getFullYear(),
            price: price || 0,
            priceSar: price || 0,
            partType: category || 'Engine',
            images: images || [],
            description: description || '',
            condition: condition || 'New',
            stockQty: stockQty || 1,
            inStock: (stockQty || 1) > 0
        });
        res.json({ success: true, part });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// PUT /api/v2/parts/:id - Update part
router.put('/:id', requireAuthAPI, invalidateCache('/api/v2/parts*'), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        const { name, brand, model, year, price, category, images, description, condition, stockQty } = req.body;
        const part = await SparePart.findByIdAndUpdate(req.params.id, {
            name,
            carMake: brand,
            carModel: model,
            year: year || new Date().getFullYear(),
            price: price || 0,
            priceSar: price || 0,
            partType: category || 'Engine',
            images: images || [],
            description: description || '',
            condition: condition || 'New',
            stockQty: stockQty || 1,
            inStock: (stockQty || 1) > 0
        }, { new: true });
        res.json({ success: true, part });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// DELETE /api/v2/parts/:id - Delete part
router.delete('/:id', requireAuthAPI, invalidateCache('/api/v2/parts*'), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        await SparePart.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// [[ARABIC_COMMENT]] PATCH /api/v2/parts/:id/toggle-stock - تبديل حالة الظهور (In Stock / Out of Stock)
router.patch('/:id/toggle-stock', requireAuthAPI, invalidateCache('/api/v2/parts*'), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const part = await SparePart.findById(req.params.id);
        if (!part) {
            return res.status(404).json({ success: false, error: 'Part not found' });
        }

        part.inStock = !part.inStock;
        if (part.inStock && (part.stockQty || 0) <= 0) {
            part.stockQty = 1; // إذا كان مخفياً بسبب نفاذ الكمية وأعدنا إظهاره، نضع كمية افتراضية
        }

        await part.save();

        res.json({
            success: true,
            data: part,
            message: part.inStock ? 'تم إظهار القطعة بنجاح' : 'تم إخفاء القطعة بنجاح'
        });
    } catch (error) {
        console.error('Toggle part stock error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// [[ARABIC_COMMENT]] PATCH /api/v2/parts/:id/sold - تسجيل بيع قطعة غيار
// [[ARABIC_COMMENT]] المنطق الجديد: زيادة عداد "المباع" (soldCount) دون إنقاص الكمية أو الإخفاء التلقائي
router.patch('/:id/sold', requireAuthAPI, invalidateCache('/api/v2/parts*'), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        const { soldQty = 1 } = req.body;

        const part = await SparePart.findById(req.params.id);
        if (!part) {
            return res.status(404).json({ success: false, error: 'Part not found' });
        }

        const currentSoldCount = part.soldCount || 0;
        const newSoldCount = currentSoldCount + Number(soldQty);

        const updatedPart = await SparePart.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    soldCount: newSoldCount,
                    inStock: true // التأكد من بقاء القطعة ظاهرة دائماً
                } 
            },
            { new: true }
        );

        // [[ARABIC_COMMENT]] تسجيل في AuditLog للتقارير التلقائية
        try {
            const AuditLog = getModel(req, 'AuditLog');
            await AuditLog.create({
                action: 'SOLD',
                targetModel: 'SparePart',
                description: `تم تسجيل بيع ${soldQty} قطعة من: ${part.name} — إجمالي المبيعات الآن: ${newSoldCount}`,
                targetId: part._id,
                after: { soldQty, newSoldCount, soldAt: new Date() },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID || 'api'
            });
        } catch (logErr) {
            console.error('AuditLog error:', logErr);
        }

        res.json({
            success: true,
            data: updatedPart,
            soldQty,
            totalSold: newSoldCount,
            message: `تم تسجيل بيع ${soldQty} قطعة بنجاح. إجمالي المبيعات: ${newSoldCount}`
        });
    } catch (error) {
        console.error('Mark part as sold error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

const axios = require('axios');
const cheerio = require('cheerio');

// [[ARABIC_COMMENT]] POST /api/v2/parts/scrape/brands - جلب وكالات وقطع غيار مع الصور من أي موقع (أدمن فقط)
// ==========================================
router.post('/scrape/brands', requireAuthAPI, requireAdmin, invalidateCache('/api/v2/parts*'), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        const SiteSettings = getModel(req, 'SiteSettings');
        const Brand = getModel(req, 'Brand');

        const inputUrl = (req.body?.targetUrl || req.body?.url || 'https://autospare.com.eg/brands').trim();
        let targetUrl = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;

        let parsedUrl;
        try {
            parsedUrl = new URL(targetUrl);
        } catch {
            return res.status(400).json({ success: false, error: 'رابط الموقع غير صالح' });
        }

        const BASE_URL = parsedUrl.origin;
        const maxBrands = Number(req.body?.maxBrands || 30);
        const maxModelsPerBrand = Number(req.body?.maxModelsPerBrand || 6);

        const settings = await SiteSettings.getSettings().catch(() => null);
        const usdToSar = Number(settings?.currencySettings?.usdToSar || 3.75);
        const usdToKrw = Number(settings?.currencySettings?.usdToKrw || 1350);

        const https = require('https');
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });

        console.log(`[PartsScraper] Scraping brands & parts from: ${targetUrl}`);

        const { data: brandsHtml } = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
            },
            timeout: 25000,
            httpsAgent
        });

        const $brands = cheerio.load(brandsHtml);
        const results = { brandsCreated: 0, modelsUpdated: 0, partsCreated: 0 };
        const importedBrandsList = [];
        const importedPartsList = [];

        const { downloadAndOptimize } = require('../../../services/externalImageService');
        const brandsToProcess = [];
        const seenBrandUrls = new Set();

        // 1) البحث عن روابط الوكالات والماركات عبر سيناريوهات متعددة
        $brands('a.brand-card-link, a[href*="/brands/"], a[href*="/brand/"], a[href*="/make/"], a.brand-link, .brand-card a, .brand-item a, .brands-list a').each((i, el) => {
            const name = ($brands(el).find('h3, h4, h5, span, .brand-title, .title').first().text() || $brands(el).text() || $brands(el).attr('title') || '').trim();
            const href = $brands(el).attr('href');
            let logo = $brands(el).find('img').first().attr('data-src') ||
                       $brands(el).find('img').first().attr('data-lazy-src') ||
                       $brands(el).find('img').first().attr('src') || '';

            if (name && name.length >= 2 && href && !href.includes('#') && !href.includes('javascript:')) {
                const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
                if (!seenBrandUrls.has(fullUrl)) {
                    seenBrandUrls.add(fullUrl);
                    brandsToProcess.push({
                        name: name.replace(/\s+/g, ' '),
                        url: fullUrl,
                        logo: logo ? (logo.startsWith('http') ? logo : `${BASE_URL}${logo.startsWith('/') ? '' : '/'}${logo}`) : ''
                    });
                }
            }
        });

        // إذا لم يُعثر على كروت ماركات محددة، يبحث عن الصور التي تملك ALT أسماء ماركات
        if (brandsToProcess.length === 0) {
            $brands('img[alt]').each((i, el) => {
                const alt = $brands(el).attr('alt')?.trim();
                const parentLink = $brands(el).closest('a').attr('href');
                let src = $brands(el).attr('src') || $brands(el).attr('data-src') || '';
                if (alt && alt.length >= 2 && parentLink) {
                    const fullUrl = parentLink.startsWith('http') ? parentLink : `${BASE_URL}${parentLink.startsWith('/') ? '' : '/'}${parentLink}`;
                    if (!seenBrandUrls.has(fullUrl)) {
                        seenBrandUrls.add(fullUrl);
                        brandsToProcess.push({
                            name: alt,
                            url: fullUrl,
                            logo: src ? (src.startsWith('http') ? src : `${BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`) : ''
                        });
                    }
                }
            });
        }

        const limitBrands = brandsToProcess.slice(0, Math.max(1, maxBrands));

        for (const bData of limitBrands) {
            const brandKey = bData.name.toLowerCase().trim();
            let brand = await Brand.findOne({ key: brandKey });

            // جلب الشعار المناسب للماركة (Clearbit CDN أو الشعار الممرر)
            const fallbackLogo = `https://logo.clearbit.com/${brandKey.replace(/\s+/g, '')}.com`;
            let logoToUse = bData.logo || fallbackLogo;

            if (!brand) {
                let localLogo = logoToUse;
                if (bData.logo && bData.logo.startsWith('http')) {
                    try {
                        localLogo = await downloadAndOptimize(bData.logo, 'brands', { width: 250, height: 250, quality: 75 }) || logoToUse;
                    } catch { localLogo = logoToUse; }
                }
                brand = await Brand.create({
                    name: bData.name,
                    key: brandKey,
                    logoUrl: localLogo,
                    forSpareParts: true,
                    forCars: false,
                    targetShowroom: 'both',
                    models: []
                });
                results.brandsCreated++;
            } else {
                let updated = false;
                if (!brand.forSpareParts) {
                    brand.forSpareParts = true;
                    updated = true;
                }
                if (!brand.logoUrl && bData.logo) {
                    try {
                        brand.logoUrl = await downloadAndOptimize(bData.logo, 'brands', { width: 250, height: 250, quality: 75 }) || bData.logo;
                        updated = true;
                    } catch {}
                }
                if (updated) await brand.save();
            }

            importedBrandsList.push({
                id: brand._id,
                name: brand.name,
                logoUrl: brand.logoUrl || logoToUse
            });

            // 2) جلب موديلات وقطع الغيار التابعة للوكالة
            try {
                const { data: modelsHtml } = await axios.get(bData.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                    timeout: 15000,
                    httpsAgent
                });
                const $models = cheerio.load(modelsHtml);
                const modelsFound = [];
                const modelUrls = [];

                $models('a[href*="/brands/"], a[href*="/brand/"], a[href*="/models/"], a[href*="/products/"]').each((i, el) => {
                    const mHref = ($models(el).attr('href') || '').trim();
                    if (!mHref) return;
                    const absoluteHref = mHref.startsWith('http') ? mHref : `${BASE_URL}${mHref.startsWith('/') ? '' : '/'}${mHref}`;
                    const fromText = $models(el).text().trim();
                    const fromUrl = decodeURIComponent(absoluteHref.split('/').pop() || '').trim();
                    const mName = fromText || fromUrl;

                    if (mName && absoluteHref && !modelUrls.includes(absoluteHref)) {
                        modelsFound.push(mName);
                        modelUrls.push(absoluteHref);
                    }
                });

                if (modelsFound.length > 0) {
                    const uniqueModels = [...new Set([...(brand.models || []), ...modelsFound])];
                    if (uniqueModels.length !== (brand.models || []).length) {
                        brand.models = uniqueModels;
                        await brand.save();
                        results.modelsUpdated++;
                    }
                }

                // 3) جلب كروت قطع الغيار
                const urlsToScrape = modelUrls.length > 0 ? modelUrls.slice(0, maxModelsPerBrand) : [bData.url];
                for (let i = 0; i < urlsToScrape.length; i++) {
                    const mUrl = urlsToScrape[i];
                    const modelName = cleanModelName(modelsFound[i] || brand.name);

                    const { data: partsHtml } = await axios.get(mUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                        timeout: 15000,
                        httpsAgent
                    });
                    const $parts = cheerio.load(partsHtml);

                    const cards = [];
                    $parts('div.product-card, div.card, div.col-lg-4, div.col-md-6, div.col-6, .product-item, .product-box').each((j, cardEl) => {
                        const cardRoot = $parts(cardEl);
                        const linkEl = cardRoot.find('a[href*="/products/"], a[href*="/product/"], a[href*="/part/"], a').first();
                        let href = linkEl.attr('href') || '';
                        if (!href || href.includes('#') || href.includes('javascript:')) return;
                        const sourceUrl = href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;

                        const pName = linkEl.text().trim() || cardRoot.find('h3, h4, h5, .product-title, .title').text().trim();
                        if (!pName || pName.length < 3) return;

                        // استخراج الصور (مع الصورة الرئيسية وكل الصور الإضافية)
                        const partImages = [];
                        cardRoot.find('img').each((k, imgEl) => {
                            let src = $parts(imgEl).attr('data-src') || $parts(imgEl).attr('data-lazy-src') || $parts(imgEl).attr('src') || '';
                            if (src) {
                                const norm = normalizeExternalImage(src);
                                if (norm && !norm.includes('brand') && !norm.includes('logo') && !partImages.includes(norm)) {
                                    partImages.push(norm);
                                }
                            }
                        });

                        const mainImg = partImages[0] || '';
                        const cardText = cardRoot.text().replace(/\s+/g, ' ');
                        const pPriceText = cardText.replace(/,/g, '').match(/(\d+)\s*(?:جنيه|ر\.س|\$|EGP|SAR|USD)/i) || cardText.replace(/,/g, '').match(/(\d+)/);
                        const rawPrice = pPriceText ? parseInt(pPriceText[1], 10) : 0;

                        cards.push({
                            pName,
                            pImg: mainImg,
                            images: partImages,
                            pPrice: rawPrice,
                            sourceUrl,
                        });
                    });

                    for (const card of cards) {
                        const existing = await SparePart.findOne({
                            $or: [
                                { externalUrl: card.sourceUrl },
                                { name: card.pName, carMake: brand.name }
                            ]
                        });

                        if (existing) {
                            importedPartsList.push(existing);
                            continue;
                        }

                        const partsMultiplier = Number(settings?.currencySettings?.partsMultiplier || 1.15);
                        const rawEgpOrPrice = card.pPrice > 0 ? card.pPrice : 350;
                        const sarPrice = targetUrl.includes('eg') ? Math.ceil(rawEgpOrPrice * 0.12 * partsMultiplier) : Math.ceil(rawEgpOrPrice * partsMultiplier);
                        const usdPrice = Number((sarPrice / usdToSar).toFixed(2));
                        const krwPrice = Math.round(usdPrice * usdToKrw);

                        let processedImages = card.images;
                        if (processedImages.length > 0) {
                            try {
                                processedImages = await compressImages(processedImages, 'parts');
                            } catch {}
                        }
                        const mainPartImage = processedImages[0] || card.pImg || '';

                        const detectedCategory = toArabicCategory(card.pName);
                        const createdPart = await SparePart.create({
                            name: card.pName,
                            nameAr: translatePartNameToArabic(card.pName) || card.pName,
                            partType: detectedCategory === 'عام' ? 'General' : detectedCategory,
                            partTypeAr: detectedCategory,
                            brand: brand._id,
                            carMake: brand.name,
                            carMakeLogoUrl: brand.logoUrl || '',
                            carModel: modelName,
                            price: sarPrice,
                            basePriceUsd: usdPrice,
                            priceSar: sarPrice,
                            priceUsd: usdPrice,
                            priceKrw: krwPrice,
                            stockQty: 5,
                            inStock: true,
                            images: processedImages.length > 0 ? processedImages : (mainPartImage ? [mainPartImage] : []),
                            img: mainPartImage,
                            image: mainPartImage,
                            externalUrl: card.sourceUrl,
                            source: 'autospare'
                        });
                        results.partsCreated++;
                    }
                }
            } catch (err) {
                console.error(`Error scraping brand ${bData.name}:`, err.message);
            }
        }

        res.json({
            success: true,
            message: '✅ اكتمل جلب قطع الغيار بنجاح مع تحسين الصور والبيانات.',
            stats: results
        });
    } catch (error) {
        console.error('Overall Scrape error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/v2/parts/fix-brand-links - ربط القطع بمعرفات وكالات قطع الغيار تلقائياً
router.post('/fix-brand-links', requireAuthAPI, requireAdmin, invalidateCache('/api/v2/parts*'), async (req, res) => {
    try {
        const SparePart = getModel(req, 'SparePart');
        const Brand = getModel(req, 'Brand');
        
        // جلب كل الوكالات وكل القيم الفريدة لـ carMake
        const allBrands = await Brand.find({ forSpareParts: true }).lean();
        const uniqueMakes = await SparePart.distinct('carMake');
        let fixed = 0;
        let created = 0;

        // أولاً: إنشاء وكالات جديدة لأي carMake ليس له وكالة
        for (const make of uniqueMakes) {
            if (!make || make === 'غير محدد') continue;
            const makeLower = make.toLowerCase().trim();
            // البحث عن وكالة مطابقة (جزئي أو كامل)
            const exists = allBrands.find(b => 
                b.name.toLowerCase() === makeLower ||
                b.key === makeLower ||
                b.name.toLowerCase().includes(makeLower) ||
                makeLower.includes(b.name.toLowerCase())
            );
            if (!exists) {
                try {
                    await Brand.findOneAndUpdate(
                        { key: makeLower },
                        { 
                            $setOnInsert: {
                                name: make,
                                key: makeLower,
                                logoUrl: '',
                                forSpareParts: true,
                                forCars: false,
                                targetShowroom: 'both',
                                models: [],
                                isActive: true
                            }
                        },
                        { upsert: true, new: false }
                    );
                    created++;
                } catch (e) { /* skip dup */ }
            }
        }

        // ثانياً: إعادة جلب كل الوكالات بعد الإنشاء
        const updatedBrands = await Brand.find({ forSpareParts: true }).lean();

        // ثالثاً: ربط القطع بوكالاتها
        for (const brand of updatedBrands) {
            const nameLower = brand.name.toLowerCase();
            // جلب كل القطع التي لها carMake مشابه لاسم الوكالة
            const matchingMakes = uniqueMakes.filter(make => {
                if (!make) return false;
                const ml = make.toLowerCase().trim();
                return ml === nameLower || ml === brand.key ||
                    ml.includes(nameLower) || nameLower.includes(ml);
            });

            if (matchingMakes.length > 0) {
                const result = await SparePart.updateMany(
                    { 
                        carMake: { $in: matchingMakes },
                        $or: [{ brand: null }, { brand: { $exists: false } }] 
                    },
                    { $set: { brand: brand._id } }
                );
                fixed += result.modifiedCount;
            }
        }

        res.json({ 
            success: true, 
            message: `✅ تم ربط ${fixed} قطعة بوكالاتها${created > 0 ? ` وإنشاء ${created} وكالة جديدة` : ''}`, 
            fixed,
            created 
        });
    } catch (error) {
        console.error('Fix brand links error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
