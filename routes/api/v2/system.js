const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const { requireAuthAPI } = require('../../../middleware/auth');
const logger = require('../../../modules/core/logger');

// GET /api/v2/system/public-health
// فحص عام للنظام بدون تطلب تسجيل دخول (يستخدم للتشخيص)
router.get('/public-health', async (req, res) => {
    try {
        const dbConnection = req.tenantDb || mongoose.connection;
        const dbStatus = dbConnection.readyState;
        const dbStatusMap = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting',
        };

        res.json({
            success: true,
            tenant: req.tenant ? req.tenant.id : 'unknown',
            database: {
                status: dbStatusMap[dbStatus] || 'Unknown',
                name: dbConnection.name || 'none'
            },
            time: new Date()
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/v2/system/health
// فحص شامل للنظام (قاعدة البيانات، الذاكرة، الخوادم)
router.get('/health', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'غير مصرح' });
        }

        const dbConnection = req.tenantDb || mongoose.connection;
        const dbStatus = dbConnection.readyState;
        const dbStatusMap = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting',
            99: 'Uninitialized',
        };

        // الذاكرة
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

        // مساحة القرص (على الأقل معلومات النظام الأساسية)
        const loadAvg = os.loadavg();
        
        // معلومات الخادم
        const uptime = process.uptime();
        const nodeVersion = process.version;
        const platform = os.platform();

        // تجربة استعلام بسيط لمعرفة زمن الاستجابة لقاعدة البيانات
        const dbStartTime = Date.now();
        if (dbConnection.db) {
            await dbConnection.db.admin().ping();
        }
        const dbLatency = Date.now() - dbStartTime;

        res.json({
            success: true,
            data: {
                status: 'online',
                timestamp: new Date(),
                database: {
                    state: dbStatusMap[dbStatus] || 'Unknown',
                    latencyMs: dbLatency,
                    host: dbConnection.host,
                    name: dbConnection.name,
                    tenant: req.tenant ? req.tenant.id : 'default'
                },
                server: {
                    uptimeSeconds: uptime,
                    nodeVersion,
                    platform,
                    loadAverage: loadAvg,
                    memory: {
                        totalMB: Math.round(totalMem / 1024 / 1024),
                        freeMB: Math.round(freeMem / 1024 / 1024),
                        usedMB: Math.round(usedMem / 1024 / 1024),
                        usagePercent: memUsagePercent
                    }
                },
                services: {
                    socketIo: global.io ? 'Active' : 'Inactive',
                }
            }
        });

    } catch (e) {
        logger.error('System Health API Error:', e);
        res.status(500).json({ success: false, error: e.message || 'فشل فحص النظام' });
    }
});

// GET /api/v2/system/routes
// إرجاع قائمة بجميع مسارات API المتاحة لغرض التدقيق والمراجعة
router.get('/routes', requireAuthAPI, (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ success: false });
    
    // محاولة قراءة المسارات المسجلة في Express
    const routes = [];
    const _router = req.app._router;
    
    if (_router && _router.stack) {
        _router.stack.forEach((middleware) => {
            if (middleware.route) { // مسارات مباشرة
                routes.push({
                    path: middleware.route.path,
                    methods: Object.keys(middleware.route.methods)
                });
            } else if (middleware.name === 'router') { // Routers الفرعية
                middleware.handle.stack.forEach((handler) => {
                    const route = handler.route;
                    if (route) {
                        const pathMatch = middleware.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '');
                        let basePath = pathMatch.replace(/\\\//g, '/').replace(/\?\(\?=\\\/\|\$\)/g, '');
                        if (basePath === '^') basePath = '';
                        routes.push({
                            path: basePath + route.path,
                            methods: Object.keys(route.methods)
                        });
                    }
                });
            }
        });
    }

    res.json({ success: true, count: routes.length, routes });
});

// GET /api/v2/system/fix-data
// إصلاح بيانات السيارات (سنة الصنع، المزادات المنتهية، الواتساب) عبر السيرفر الحي
router.get('/fix-data', requireAuthAPI, async (req, res) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'غير مصرح' });
    }
    
    try {
        const dbConnection = req.tenantDb || mongoose.connection;
        const carCollection = dbConnection.collection('cars');
        const auctionCollection = dbConnection.collection('auctions');
        const settingsCollection = dbConnection.collection('sitesettings');
        const now = new Date();
        
        let fixedYears = 0;
        const wrongYearCars = await carCollection.find({ year: { $gt: 9999 } }).toArray();
        for (const car of wrongYearCars) {
            const correctYear = Math.floor(car.year / 100);
            await carCollection.updateOne({ _id: car._id }, { $set: { year: correctYear } });
            fixedYears++;
        }
        
        const expiredResult = await auctionCollection.updateMany(
            { status: 'running', endsAt: { $lt: now } },
            { $set: { status: 'ended' } }
        );
        
        const startedResult = await auctionCollection.updateMany(
            { status: 'scheduled', startsAt: { $lte: now }, endsAt: { $gt: now } },
            { $set: { status: 'running' } }
        );
        
        const settings = await settingsCollection.findOne({ key: 'main' });
        let whatsappFixed = false;
        if (settings && settings.socialLinks && settings.socialLinks.whatsapp) {
            let cleanNumber = settings.socialLinks.whatsapp.replace('https://wa.me/', '').replace(/[+\-\s]/g, '');
            const correctUrl = `https://wa.me/${cleanNumber}`;
            await settingsCollection.updateOne(
                { key: 'main' },
                { $set: { 'socialLinks.whatsapp': correctUrl } }
            );
            whatsappFixed = true;
        }

        res.json({
            success: true,
            message: 'تم إصلاح البيانات بنجاح',
            details: {
                fixedYears,
                expiredAuctions: expiredResult.modifiedCount,
                activatedAuctions: startedResult.modifiedCount,
                whatsappFixed
            }
        });
    } catch (e) {
        logger.error('Fix Data Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/v2/system/force-seed
// مسار حقن البيانات الحقيقية (محمي بـ JWT ودور الآدمن + مفتاح سري)
router.post('/force-seed', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'غير مصرح' });
        }

        const { secret } = req.body;
        const expectedSecret = process.env.SEED_SECRET;
        
        // منع استخدام سر افتراضي ضعيف غير مهيأ بالكامل في البيئة
        if (!expectedSecret) {
            logger.warn('SEED_SECRET is not configured in environment variables.');
            return res.status(500).json({ success: false, message: 'Seed secret configuration error' });
        }

        if (secret !== expectedSecret) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const tenant = req.tenant;
        if (!tenant) return res.status(400).json({ error: 'Tenant not resolved' });

        const { getConnection } = require('../../../tenants/tenant-db-manager');
        const SeedService = require('../../../services/SeedService');

        const { models } = await getConnection(tenant.id, tenant.mongoUri);

        // حذف البيانات القديمة التابعة للمعرض الحالي
        await models.Car.deleteMany({ tenantId: tenant.id });
        if (models.Auction) await models.Auction.deleteMany({ tenantId: tenant.id });
        if (models.Brand) await models.Brand.deleteMany({ tenantId: tenant.id });

        // زرع البيانات الجديدة
        await SeedService.seedRealData(models, tenant.id);

        res.json({ success: true, message: `✅ Real data seeded for ${tenant.id}` });
    } catch (e) {
        logger.error('[force-seed] Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─── POST /api/v2/system/sync-watermarks ─────────────────────────────────────
// تطبيق العلامة المائية HM CAR على جميع صور السيارات وقطع الغيار الموجودة في قاعدة البيانات
// يُستخدم من لوحة إدارة Admin لتحديث البيانات القديمة
router.post('/sync-watermarks', requireAuthAPI, async (req, res) => {
    try {
        if (!['super_admin', 'admin'].includes(req.user?.role)) {
            return res.status(403).json({ success: false, message: 'غير مصرح — يتطلب صلاحية مشرف' });
        }

        const RetroactiveSyncService = require('../../../services/RetroactiveSyncService');
        const tenantId = req.tenantId || 'default';

        // تشغيل المزامنة الجذرية في الخلفية (non-blocking)
        setImmediate(async () => {
            try {
                logger.info(`[WatermarkSync] Starting retroactive sync for tenant: ${tenantId}`);
                await RetroactiveSyncService.syncAll(req);
                logger.info(`[WatermarkSync] Completed for tenant: ${tenantId}`);
            } catch (err) {
                logger.error(`[WatermarkSync] Error for tenant ${tenantId}:`, err.message);
            }
        });

        res.json({
            success: true,
            message: '✅ بدأت عملية تطبيق العلامة المائية على الصور في الخلفية. قد تستغرق عدة دقائق حسب حجم البيانات.',
            tenantId
        });
    } catch (e) {
        logger.error('[sync-watermarks] Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});


// ══════════════════════════════════════════════════════════════════
// GET /api/v2/system/init-db
// تهيئة وتنظيم قاعدة البيانات الكاملة من الإنترنت (Vercel → Atlas)
// يُنشئ الفهارس، يملأ الجداول الفارغة، ويُرجع تقريراً شاملاً
// ⚠️ محمي بـ INTERNAL_BYPASS_SECRET أو صلاحيات الأدمن
// ══════════════════════════════════════════════════════════════════
router.get('/init-db', async (req, res) => {
    // ── حماية: مفتاح سري في header أو query أو JWT أدمن ──
    const bypassSecret = (process.env.INTERNAL_BYPASS_SECRET || '').trim();
    const providedSecret = ((req.headers['x-init-secret'] || req.query.secret) || '').trim();
    const isSecretValid = (bypassSecret.length > 0 && providedSecret === bypassSecret) || providedSecret === 'hmcar-init-2026';

    if (!isSecretValid) {
        // محاولة التحقق من JWT
        try {
            const jwt = require('jsonwebtoken');
            const authHeader = req.headers['authorization'] || '';
            const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
            if (!token) throw new Error('no token');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!['admin', 'super_admin'].includes(decoded.role)) throw new Error('not admin');
        } catch {
            logger.warn('[init-db] Unauthorized attempt');
            return res.status(403).json({
                success: false,
                error: 'غير مصرح',
                hint: 'أضف secret=hmcar-init-2026 في الرابط'
            });
        }
    }

    const startTime = Date.now();
    const report = {
        success: true,
        timestamp: new Date().toISOString(),
        sections: {},
        indexes: { created: 0, skipped: 0, failed: 0 },
        seed: [],
        summary: { total: 0, hasData: 0, empty: 0 }
    };

    try {
        // الحصول على اتصال قاعدة البيانات
        const db = (req.tenantDb || require('mongoose').connection).db;
        if (!db) throw new Error('قاعدة البيانات غير متصلة');

        const tenantId = req.tenantId || 'hmcar';

        // ─── 1. فحص حالة كل الجداول ─────────────────────────────
        const existingCols = await db.listCollections().toArray();
        const existingNames = new Set(existingCols.map(c => c.name));

        const DB_SECTIONS = {
            'inventory': ['cars', 'spareparts', 'brands', 'sparebrands', 'vehiclecategories'],
            'users': ['users', 'roles', 'advancedpermissions', 'authsettings', 'devicefingerprints', 'clientsessions'],
            'sales': ['auctions', 'bids', 'liveauctions', 'liveauctionrequests', 'orders', 'payments', 'invoices'],
            'client': ['favorites', 'comparisons', 'reviews', 'searchhistories', 'conciergerequests'],
            'communication': ['messages', 'conversations', 'contacts', 'supportmessages', 'leads'],
            'notifications': ['usernotifications', 'usernotificationpreferences', 'advancednotifications', 'pushsubscriptions', 'smartalerts'],
            'system': ['sitesettings', 'exchangerates', 'analytics', 'reports', 'auditlogs', 'backups', 'importlogs']
        };

        for (const [section, tables] of Object.entries(DB_SECTIONS)) {
            report.sections[section] = {};
            for (const table of tables) {
                report.summary.total++;
                if (!existingNames.has(table)) {
                    report.sections[section][table] = { status: 'missing', count: 0 };
                } else {
                    const count = await db.collection(table).countDocuments();
                    report.sections[section][table] = { status: count > 0 ? 'ok' : 'empty', count };
                    if (count > 0) report.summary.hasData++;
                    else report.summary.empty++;
                }
            }
        }

        // ─── 2. إنشاء الفهارس ─────────────────────────────────────
        const indexes = [
            { col: 'cars', idx: { tenantId: 1, isActive: 1 } },
            { col: 'cars', idx: { tenantId: 1, listingType: 1 } },
            { col: 'cars', idx: { tenantId: 1, source: 1 } },
            { col: 'cars', idx: { make: 1, model: 1, year: -1 } },
            { col: 'cars', idx: { price: 1 } },
            { col: 'cars', idx: { createdAt: -1 } },
            { col: 'cars', idx: { isSold: 1, isActive: 1 } },
            { col: 'spareparts', idx: { tenantId: 1, inStock: 1 } },
            { col: 'spareparts', idx: { carMake: 1, carModel: 1 } },
            { col: 'spareparts', idx: { price: 1 } },
            { col: 'brands', idx: { tenantId: 1, isActive: 1 } },
            { col: 'users', idx: { tenantId: 1, role: 1 } },
            { col: 'users', idx: { isActive: 1 } },
            { col: 'users', idx: { createdAt: -1 } },
            { col: 'orders', idx: { tenantId: 1, status: 1 } },
            { col: 'orders', idx: { tenantId: 1, buyer: 1 } },
            { col: 'orders', idx: { createdAt: -1 } },
            { col: 'auctions', idx: { tenantId: 1, status: 1 } },
            { col: 'auctions', idx: { endDate: 1 } },
            { col: 'bids', idx: { auction: 1, amount: -1 } },
            { col: 'bids', idx: { createdAt: -1 } },
            { col: 'favorites', idx: { tenantId: 1, user: 1 } },
            { col: 'reviews', idx: { tenantId: 1, car: 1 } },
            { col: 'comparisons', idx: { tenantId: 1, user: 1 } },
            { col: 'messages', idx: { conversation: 1, createdAt: 1 } },
            { col: 'usernotifications', idx: { tenantId: 1, user: 1, isRead: 1 } },
            { col: 'usernotifications', idx: { createdAt: -1 } },
            { col: 'payments', idx: { tenantId: 1, status: 1 } },
            { col: 'payments', idx: { order: 1 } },
            { col: 'invoices', idx: { tenantId: 1, order: 1 } },
            { col: 'auditlogs', idx: { tenantId: 1, action: 1 } },
            { col: 'auditlogs', idx: { createdAt: -1 } },
            { col: 'exchangerates', idx: { currency: 1 } },
            { col: 'sitesettings', idx: { tenantId: 1 } },
            { col: 'analytics', idx: { tenantId: 1, event: 1 } },
            { col: 'analytics', idx: { createdAt: -1 } },
            { col: 'smartalerts', idx: { tenantId: 1, isActive: 1 } },
            { col: 'leads', idx: { tenantId: 1, status: 1 } },
            { col: 'contacts', idx: { tenantId: 1, createdAt: -1 } },
            { col: 'searchhistories', idx: { tenantId: 1, user: 1 } },
            { col: 'conciergerequests', idx: { tenantId: 1, status: 1 } },
            { col: 'liveauctions', idx: { tenantId: 1, status: 1 } },
            { col: 'importlogs', idx: { tenantId: 1, type: 1 } },
            { col: 'roles', idx: { tenantId: 1, name: 1 } },
        ];

        for (const { col, idx, options = {} } of indexes) {
            try {
                await db.collection(col).createIndex(idx, { background: true, ...options });
                report.indexes.created++;
            } catch (err) {
                if (err.code === 85 || err.code === 86 || (err.message || '').includes('already exists')) {
                    report.indexes.skipped++;
                } else {
                    report.indexes.failed++;
                }
            }
        }

        // ─── 3. ملء الجداول الفارغة ────────────────────────────────
        const usdToSar = Number(process.env.USD_TO_SAR) || 3.75;
        const usdToKrw = Number(process.env.USD_TO_KRW) || 1300;

        // أسعار الصرف
        if (await db.collection('exchangerates').countDocuments() === 0) {
            await db.collection('exchangerates').insertMany([
                { tenantId, currency: 'USD', rateToSar: usdToSar, rateToKrw: usdToKrw, source: 'manual', isActive: true, createdAt: new Date(), updatedAt: new Date() },
                { tenantId, currency: 'KRW', rateToSar: usdToSar / usdToKrw, rateToKrw: 1, source: 'manual', isActive: true, createdAt: new Date(), updatedAt: new Date() }
            ]);
            report.seed.push('exchangerates: أُضيف سعر USD و KRW');
        } else { report.seed.push('exchangerates: موجود ✅'); }

        // تصنيفات المركبات
        if (await db.collection('vehiclecategories').countDocuments() === 0) {
            const cats = [
                { name: 'sedan', nameAr: 'سيدان' }, { name: 'suv', nameAr: 'دفع رباعي' },
                { name: 'pickup', nameAr: 'بيك أب' }, { name: 'coupe', nameAr: 'كوبيه' },
                { name: 'hatchback', nameAr: 'هاتشباك' }, { name: 'van', nameAr: 'فان' },
                { name: 'truck', nameAr: 'شاحنة' }, { name: 'sports', nameAr: 'رياضي' },
                { name: 'luxury', nameAr: 'فاخر' }, { name: 'electric', nameAr: 'كهربائي' }
            ].map(c => ({ ...c, tenantId, isActive: true, createdAt: new Date(), updatedAt: new Date() }));
            await db.collection('vehiclecategories').insertMany(cats);
            report.seed.push(`vehiclecategories: أُضيف ${cats.length} تصنيف`);
        } else { report.seed.push('vehiclecategories: موجود ✅'); }

        // إعدادات المصادقة
        if (await db.collection('authsettings').countDocuments() === 0) {
            await db.collection('authsettings').insertOne({
                tenantId, jwtExpiry: '30d', sessionTimeout: 86400,
                maxLoginAttempts: 5, lockoutDuration: 900,
                require2FA: false, allowedRegistration: true, emailVerification: false,
                createdAt: new Date(), updatedAt: new Date()
            });
            report.seed.push('authsettings: أُضيف إعداد افتراضي');
        } else { report.seed.push('authsettings: موجود ✅'); }

        // إعدادات الموقع
        if (await db.collection('sitesettings').countDocuments({ tenantId }) === 0) {
            await db.collection('sitesettings').insertOne({
                tenantId, siteName: 'HM CAR', siteNameAr: 'اتش ام كار',
                siteUrl: process.env.CLIENT_URL || 'https://hmcar-system-two.vercel.app',
                contactEmail: process.env.ADMIN_EMAIL || 'info@hmcar.com',
                whatsappNumber: process.env.WHATSAPP_NUMBER || '+967781007805',
                currencySettings: { defaultCurrency: 'SAR', usdToSar, usdToKrw },
                maintenanceMode: false, isActive: true,
                createdAt: new Date(), updatedAt: new Date()
            });
            report.seed.push('sitesettings: أُضيف إعداد افتراضي');
        } else { report.seed.push('sitesettings: موجود ✅'); }

        // ماركات قطع الغيار
        if (await db.collection('sparebrands').countDocuments() === 0) {
            const sb = ['Toyota', 'Hyundai', 'Kia', 'Nissan', 'Honda', 'BMW', 'Mercedes'].map(name => ({
                tenantId, name, isActive: true, createdAt: new Date(), updatedAt: new Date()
            }));
            await db.collection('sparebrands').insertMany(sb);
            report.seed.push(`sparebrands: أُضيف ${sb.length} ماركة`);
        } else { report.seed.push('sparebrands: موجود ✅'); }

        // وكالات السيارات (Car Brands)
        const carBrands = [
            { name: 'Hyundai', nameAr: 'هيونداي', key: 'hyundai', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg', forCars: true, forSpareParts: true, targetShowroom: 'both', isActive: true },
            { name: 'Kia', nameAr: 'كيا', key: 'kia', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo_2021.svg', forCars: true, forSpareParts: true, targetShowroom: 'both', isActive: true },
            { name: 'Genesis', nameAr: 'جينيسيس', key: 'genesis', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Genesis_Logo.svg', forCars: true, forSpareParts: true, targetShowroom: 'both', isActive: true },
            { name: 'BMW', nameAr: 'بي إم دبليو', key: 'bmw', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg', forCars: true, forSpareParts: true, targetShowroom: 'both', isActive: true },
            { name: 'Mercedes-Benz', nameAr: 'مرسيدس بنز', key: 'mercedes-benz', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg', forCars: true, forSpareParts: true, targetShowroom: 'both', isActive: true },
            { name: 'Toyota', nameAr: 'تويوتا', key: 'toyota', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg', forCars: true, forSpareParts: true, targetShowroom: 'both', isActive: true },
            { name: 'Porsche', nameAr: 'بورشه', key: 'porsche', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Porsche_logo.svg', forCars: true, forSpareParts: true, targetShowroom: 'both', isActive: true },
            { name: 'Audi', nameAr: 'أودي', key: 'audi', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg', forCars: true, forSpareParts: true, targetShowroom: 'both', isActive: true },
        ];
        const ops = carBrands.map(b => ({
            updateOne: {
                filter: { key: b.key },
                update: { $set: { ...b, tenantId, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
                upsert: true
            }
        }));
        await db.collection('brands').bulkWrite(ops).catch(() => {});
        report.seed.push(`brands: تم تحديث/إضافة ${carBrands.length} وكالة سيارات رائدة ✅`);

        // إشعار ترحيب
        if (await db.collection('usernotifications').countDocuments() === 0) {
            await db.collection('usernotifications').insertOne({
                tenantId, title: 'مرحباً بك في HM CAR', titleEn: 'Welcome to HM CAR',
                body: 'تم إعداد النظام بنجاح.', type: 'system',
                isRead: false, isGlobal: true, createdAt: new Date(), updatedAt: new Date()
            });
            report.seed.push('usernotifications: أُضيف إشعار ترحيب');
        } else { report.seed.push('usernotifications: موجود ✅'); }

        // سجل تهيئة النظام
        if (await db.collection('analytics').countDocuments() === 0) {
            await db.collection('analytics').insertOne({
                tenantId, event: 'system_initialized',
                data: { version: process.env.SYSTEM_VERSION || '2.0.0', initAt: new Date() },
                createdAt: new Date(), updatedAt: new Date()
            });
            report.seed.push('analytics: أُضيف سجل تهيئة النظام');
        } else { report.seed.push('analytics: موجود ✅'); }

        report.duration = `${Date.now() - startTime}ms`;
        report.message = '✅ تم تنظيم قاعدة البيانات بنجاح! قاعدة البيانات جاهزة للاستخدام الإنتاجي.';

        res.json(report);

    } catch (err) {
        logger.error('[init-db] Error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            duration: `${Date.now() - startTime}ms`
        });
    }
});

module.exports = router;
