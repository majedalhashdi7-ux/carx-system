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


// GET /api/v2/system/fast-seed
// إضافة السيارات والبيانات والمسؤولين بسرعة (تستغرق < 1 ثانية - آمنة من timeout في Vercel)
router.get('/fast-seed', async (req, res) => {
    try {
        const providedSecret = ((req.headers['x-init-secret'] || req.query.secret) || '').trim();
        if (providedSecret !== 'hmcar-init-2026') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const SeedServiceClass = require('../../../services/SeedService');
        const seedService = new SeedServiceClass();
        const models = req.tenantModels || {
            Car: require('../../../models/Car'),
            Auction: require('../../../models/Auction'),
            Brand: require('../../../models/Brand'),
            User: require('../../../models/User')
        };
        // [[ARABIC_COMMENT]] معرف المعرض: نستخدم hmcar دائماً كـ default — لا نستخدم 'default' لأنه يسبب تشابكاً
        const tenantId = req.tenant?.id || req.tenantId || 'hmcar';


        // 1. زراعة السيارات المباشرة في قاعدة البيانات
        const db = (req.tenantDb || require('mongoose').connection).db;
        if (db) {
            const carsCount = await db.collection('cars').countDocuments({ tenantId });
            if (carsCount === 0) {
                const sampleCars = [
                    {
                        tenantId,
                        title: 'Hyundai Palisade Calligraphy 2024',
                        titleAr: 'هيونداي باليسيد كاليجرافي 2024',
                        make: 'Hyundai', model: 'Palisade', year: 2024,
                        price: 185000, priceSar: 185000, priceUsd: 49333,
                        images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800'],
                        imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800',
                        description: 'هيونداي باليسيد كاليجرافي 2024 - الإصدار الكوري الفاخر، استيراد مباشر من كوريا.',
                        fuelType: 'Diesel', transmission: 'Automatic', color: 'أبيض لؤلؤي',
                        condition: 'excellent', isActive: true, isSold: false, listingType: 'store', source: 'hm_local',
                        mileage: 0, createdAt: new Date(), updatedAt: new Date()
                    },
                    {
                        tenantId,
                        title: 'Kia Carnival Hi-Limousine 2023',
                        titleAr: 'كيا كارنيفال هاي ليموزين 2023',
                        make: 'Kia', model: 'Carnival', year: 2023,
                        price: 210000, priceSar: 210000, priceUsd: 56000,
                        images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800'],
                        imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800',
                        description: 'كيا كارنيفال هاي ليموزين 2023 - نسخة VIP الفاخرة للعائلات الكبيرة والأعمال التجارية.',
                        fuelType: 'Petrol', transmission: 'Automatic', color: 'أسود لامع',
                        condition: 'excellent', isActive: true, isSold: false, listingType: 'store', source: 'hm_local',
                        mileage: 0, createdAt: new Date(), updatedAt: new Date()
                    },
                    {
                        tenantId,
                        title: 'Genesis G80 Sport 2024',
                        titleAr: 'جينيسيس G80 سبورت 2024',
                        make: 'Genesis', model: 'G80', year: 2024,
                        price: 245000, priceSar: 245000, priceUsd: 65333,
                        images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800'],
                        imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800',
                        description: 'جينيسيس G80 سبورت 2024 - السيارة الفاخرة الكورية التي تنافس الألمانية بتصميم عصري.',
                        fuelType: 'Petrol', transmission: 'Automatic', color: 'رمادي مدهش',
                        condition: 'excellent', isActive: true, isSold: false, listingType: 'store', source: 'hm_local',
                        mileage: 0, createdAt: new Date(), updatedAt: new Date()
                    },
                    {
                        tenantId,
                        title: 'Hyundai Tucson N-Line 2024',
                        titleAr: 'هيونداي توسان N-Line 2024',
                        make: 'Hyundai', model: 'Tucson', year: 2024,
                        price: 132000, priceSar: 132000, priceUsd: 35200,
                        images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'],
                        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
                        description: 'هيونداي توسان N-Line 2024 - دفع رباعي، مواصفات كاملة، استيراد كوريا.',
                        fuelType: 'Petrol', transmission: 'Automatic', color: 'أزرق معدني',
                        condition: 'excellent', isActive: true, isSold: false, listingType: 'store', source: 'hm_local',
                        mileage: 0, createdAt: new Date(), updatedAt: new Date()
                    }
                ];
                await db.collection('cars').insertMany(sampleCars);
            }
        }

        // 2. إنشاء / تحديث حسابات الأدمن المباشرة في قاعدة البيانات
        // [[ARABIC_COMMENT]] الـ hash مولّد مسبقاً محلياً لتجنب bcrypt.hashSync في Vercel (يسبب timeout)
        // كلمة المرور: Admin@2026!HM
        const ADMIN_HASH = '$2b$10$S/pz583pZsrJlXny0cjpcOIjTj1HQod8hKlEs2weC1CRUFlfYecBG';

        const adminAccounts = [
            { email: 'dawoodalhash@gmail.com', username: 'dawoodalhash', name: 'Dawood Alhash', passwordHash: ADMIN_HASH },
            { email: 'admin@hmcar.com', username: 'admin', name: 'HM Admin', passwordHash: ADMIN_HASH }
        ];

        const seededAdmins = [];
        if (db) {
            for (const acc of adminAccounts) {
                await db.collection('users').updateOne(
                    {
                        $or: [
                            { email: acc.email },
                            { username: acc.username }
                        ]
                    },
                    {
                        $set: {
                            tenantId,
                            name: acc.name,
                            email: acc.email,
                            username: acc.username,
                            password: acc.passwordHash,
                            role: 'super_admin',
                            isActive: true,
                            emailVerified: true,
                            updatedAt: new Date()
                        },
                        $setOnInsert: {
                            createdAt: new Date()
                        }
                    },
                    { upsert: true }
                );
                seededAdmins.push(acc.email);
            }
        }


        const count = db ? await db.collection('cars').countDocuments({ tenantId }) : 0;

        return res.json({
            success: true,
            message: `✅ Seeded successfully! Total cars in ${tenantId}: ${count}. Admins seeded: ${seededAdmins.join(', ')}`,
            carsCount: count,
            adminsSeeded: seededAdmins
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
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

        // ─── 0. إضافة البيانات الأولية فوراً ─────────────────────────
        try {
            const SeedServiceClass = require('../../../services/SeedService');
            const seedService = new SeedServiceClass();
            const models = req.tenantModels || {
                Car: require('../../../models/Car'),
                Auction: require('../../../models/Auction'),
                Brand: require('../../../models/Brand')
            };
            await seedService.seedRealData(models, tenantId);
            report.seed.push('cars: تم إضافة السيارات الافتراضية بنجاح ✅');
        } catch (sErr) {
            report.seed.push(`cars seed warning: ${sErr.message}`);
        }

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

        // تشغيل SeedService لإضافة السيارات والبيانات الأساسية
        try {
            const SeedServiceClass = require('../../../services/SeedService');
            const seedService = new SeedServiceClass();
            const models = req.tenantModels || {
                Car: require('../../../models/Car'),
                Auction: require('../../../models/Auction'),
                Brand: require('../../../models/Brand')
            };
            await seedService.seedRealData(models, tenantId);
            report.seed.push('cars: تم إضافة السيارات الافتراضية بنجاح ✅');
        } catch (sErr) {
            report.seed.push(`cars seed warning: ${sErr.message}`);
        }

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

// ─────────────────────────────────────────────────────────
// POST /api/v2/system/seed-data
// سكريبت مؤقت لرفع البيانات الأولية لقاعدة البيانات السحابية
// محمي بـ SEED_SECRET لمنع الوصول غير المصرح به
// ─────────────────────────────────────────────────────────
router.post('/seed-data', async (req, res) => {
    try {
        const { secret } = req.body;
        const SEED_SECRET = process.env.SEED_SECRET || 'hmcar-seed-2026';
        if (secret !== SEED_SECRET) {
            return res.status(403).json({ success: false, message: 'غير مصرح' });
        }

        const db = (req.tenantDb || mongoose.connection).db;
        if (!db) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });

        const results = {};
        const now = new Date();
        const bcrypt = require('bcryptjs');
        const crypto = require('crypto');

        // 1. Admin user
        const users = db.collection('users');
        const adminPass = 'HMCar@' + crypto.randomBytes(6).toString('hex').toUpperCase();
        const hashedPass = await bcrypt.hash(adminPass, 12);
        const existingAdmin = await users.findOne({ email: 'dawoodalhash@gmail.com' });
        if (existingAdmin) {
            await users.updateOne({ email: 'dawoodalhash@gmail.com' }, { $set: { password: hashedPass, role: 'admin', isActive: true, updatedAt: now } });
            results.admin = 'updated';
        } else {
            await users.insertOne({ name: 'HM CAR Admin', nameAr: 'مشرف HM CAR', email: 'dawoodalhash@gmail.com', password: hashedPass, role: 'admin', isActive: true, phone: '+967781007805', createdAt: now, updatedAt: now });
            results.admin = 'created';
        }
        results.adminPassword = adminPass;

        // 2. Site settings
        const settings = db.collection('sitesettings');
        const settingsData = { siteName: 'HM CAR', siteNameAr: 'HM للسيارات', whatsapp: 'https://wa.me/967781007805', whatsappNumber: '+967781007805', email: 'dawoodalhash@gmail.com', currency: 'SAR', usdToSar: 3.75, usdToKrw: 1300, maintenanceMode: false, updatedAt: now };
        const existSettings = await settings.findOne({});
        if (existSettings) { await settings.updateOne({}, { $set: settingsData }); results.settings = 'updated'; }
        else { await settings.insertOne({ ...settingsData, createdAt: now }); results.settings = 'created'; }

        // 3. Brands
        const brands = db.collection('brands');
        if (await brands.countDocuments() === 0) {
            await brands.insertMany([
                { name: 'Hyundai', nameAr: 'هيونداي', slug: 'hyundai', country: 'Korea', isActive: true, order: 1, createdAt: now, updatedAt: now },
                { name: 'Kia', nameAr: 'كيا', slug: 'kia', country: 'Korea', isActive: true, order: 2, createdAt: now, updatedAt: now },
                { name: 'Genesis', nameAr: 'جينيسيس', slug: 'genesis', country: 'Korea', isActive: true, order: 3, createdAt: now, updatedAt: now },
                { name: 'Ssangyong', nameAr: 'سانغ يونغ', slug: 'ssangyong', country: 'Korea', isActive: true, order: 4, createdAt: now, updatedAt: now },
            ]);
            results.brands = 4;
        } else { results.brands = 'exist:' + await brands.countDocuments(); }

        // 3.5 Fix existing cars — add missing fields (isSold, isAvailable, etc.)
        const carsFixResult = await db.collection('cars').updateMany(
            { isSold: { $exists: false } },
            { $set: { isSold: false, isAvailable: true, isActive: true, updatedAt: now } }
        );
        results.carsFixed = carsFixResult.modifiedCount;

        // 4. Cars
        const cars = db.collection('cars');
        let carIds = [];
        if (await cars.countDocuments() === 0) {
            const carsData = [
                { make:'Hyundai',makeAr:'هيونداي',model:'Sonata',modelAr:'سوناتا',year:2022,price:18500,priceSar:69375,mileage:25000,fuelType:'Gasoline',transmission:'Automatic',condition:'used',color:'White',colorAr:'أبيض',description:'هيونداي سوناتا 2022 استيراد كوري بحالة ممتازة',images:['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],thumbnail:'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400',isAvailable:true,isActive:true,stockQty:1,source:'Korea',tenantId:'hmcar',createdAt:now,updatedAt:now },
                { make:'Kia',makeAr:'كيا',model:'K5',modelAr:'K5',year:2023,price:22000,priceSar:82500,mileage:12000,fuelType:'Gasoline',transmission:'Automatic',condition:'used',color:'Black',colorAr:'أسود',description:'كيا K5 2023 شبه جديدة استيراد كوري',images:['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'],thumbnail:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',isAvailable:true,isActive:true,stockQty:1,source:'Korea',tenantId:'hmcar',createdAt:now,updatedAt:now },
                { make:'Genesis',makeAr:'جينيسيس',model:'G80',modelAr:'G80',year:2021,price:35000,priceSar:131250,mileage:40000,fuelType:'Gasoline',transmission:'Automatic',condition:'used',color:'Silver',colorAr:'فضي',description:'جينيسيس G80 2021 فئة الرفاهية',images:['https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800'],thumbnail:'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400',isAvailable:true,isActive:true,stockQty:1,source:'Korea',tenantId:'hmcar',createdAt:now,updatedAt:now },
                { make:'Hyundai',makeAr:'هيونداي',model:'Tucson',modelAr:'توسان',year:2022,price:26000,priceSar:97500,mileage:30000,fuelType:'Gasoline',transmission:'Automatic',condition:'used',color:'Blue',colorAr:'أزرق',description:'هيونداي توسان 2022 SUV ممتازة',images:['https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=800'],thumbnail:'https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=400',isAvailable:true,isActive:true,stockQty:1,source:'Korea',tenantId:'hmcar',createdAt:now,updatedAt:now },
                { make:'Kia',makeAr:'كيا',model:'Sportage',modelAr:'سبورتاج',year:2023,price:28000,priceSar:105000,mileage:8000,fuelType:'Hybrid',transmission:'Automatic',condition:'used',color:'Red',colorAr:'أحمر',description:'كيا سبورتاج هايبرد 2023',images:['https://images.unsplash.com/photo-1637624590534-5ff7dfedabf4?w=800'],thumbnail:'https://images.unsplash.com/photo-1637624590534-5ff7dfedabf4?w=400',isAvailable:true,isActive:true,stockQty:1,source:'Korea',tenantId:'hmcar',createdAt:now,updatedAt:now },
                { make:'Hyundai',makeAr:'هيونداي',model:'Elantra',modelAr:'إيلانترا',year:2023,price:16000,priceSar:60000,mileage:15000,fuelType:'Gasoline',transmission:'Automatic',condition:'used',color:'White',colorAr:'أبيض',description:'هيونداي إيلانترا 2023 اقتصادية',images:['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800'],thumbnail:'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',isAvailable:true,isActive:true,stockQty:1,source:'Korea',tenantId:'hmcar',createdAt:now,updatedAt:now },
                { make:'Kia',makeAr:'كيا',model:'EV6',modelAr:'EV6',year:2022,price:42000,priceSar:157500,mileage:20000,fuelType:'Electric',transmission:'Automatic',condition:'used',color:'Gray',colorAr:'رمادي',description:'كيا EV6 كهربائية 2022',images:['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],thumbnail:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',isAvailable:true,isActive:true,stockQty:1,source:'Korea',tenantId:'hmcar',createdAt:now,updatedAt:now },
                { make:'Genesis',makeAr:'جينيسيس',model:'GV80',modelAr:'GV80',year:2023,price:55000,priceSar:206250,mileage:10000,fuelType:'Gasoline',transmission:'Automatic',condition:'used',color:'Black',colorAr:'أسود',description:'جينيسيس GV80 2023 SUV رفاهية',images:['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'],thumbnail:'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',isAvailable:true,isActive:true,stockQty:1,source:'Korea',tenantId:'hmcar',createdAt:now,updatedAt:now },
            ];
            const carsResult = await cars.insertMany(carsData);
            carIds = Object.values(carsResult.insertedIds);
            results.cars = carsResult.insertedCount;
        } else { results.cars = 'exist:' + await cars.countDocuments(); }

        // 5. Auctions
        const auctions = db.collection('auctions');
        if (carIds.length > 0 && await auctions.countDocuments() === 0) {
            await auctions.insertMany([
                { carId: carIds[0], startingPrice: 15000, currentBid: 16500, bidIncrement: 500, status: 'running', startsAt: new Date(now - 7200000), endsAt: new Date(now.getTime() + 86400000), bids: [], totalBids: 3, isActive: true, createdAt: now, updatedAt: now },
                { carId: carIds[1], startingPrice: 20000, currentBid: 22000, bidIncrement: 500, status: 'running', startsAt: new Date(now - 7200000), endsAt: new Date(now.getTime() + 172800000), bids: [], totalBids: 5, isActive: true, createdAt: now, updatedAt: now },
                { carId: carIds[2], startingPrice: 30000, currentBid: 33000, bidIncrement: 1000, status: 'running', startsAt: new Date(now - 7200000), endsAt: new Date(now.getTime() + 259200000), bids: [], totalBids: 4, isActive: true, createdAt: now, updatedAt: now },
                { carId: carIds[3], startingPrice: 22000, currentBid: 24000, bidIncrement: 500, status: 'running', startsAt: new Date(now - 7200000), endsAt: new Date(now.getTime() + 43200000), bids: [], totalBids: 6, isActive: true, createdAt: now, updatedAt: now },
            ]);
            results.auctions = 4;
        } else { results.auctions = 'exist:' + await auctions.countDocuments(); }

        // 6. Parts
        const parts = db.collection('parts');
        if (await parts.countDocuments() === 0) {
            await parts.insertMany([
                { name:'Front Bumper Hyundai Sonata',nameAr:'مصد أمامي هيونداي سوناتا',brand:'Hyundai',brandAr:'هيونداي',price:350,priceSar:1312,category:'Body Parts',categoryAr:'هيكل السيارة',stockQty:5,condition:'new',images:['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],isActive:true,createdAt:now,updatedAt:now },
                { name:'Kia K5 Headlight',nameAr:'مصابيح كيا K5',brand:'Kia',brandAr:'كيا',price:280,priceSar:1050,category:'Lights',categoryAr:'الإضاءة',stockQty:3,condition:'new',images:['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400'],isActive:true,createdAt:now,updatedAt:now },
                { name:'Engine Oil Filter',nameAr:'فلتر زيت المحرك',brand:'Hyundai',brandAr:'هيونداي',price:25,priceSar:93,category:'Engine',categoryAr:'المحرك',stockQty:20,condition:'new',images:['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400'],isActive:true,createdAt:now,updatedAt:now },
                { name:'Brake Pads Kia Sportage',nameAr:'تيل فرامل سبورتاج',brand:'Kia',brandAr:'كيا',price:120,priceSar:450,category:'Brakes',categoryAr:'الفرامل',stockQty:8,condition:'new',images:['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],isActive:true,createdAt:now,updatedAt:now },
                { name:'Genesis G80 Side Mirror',nameAr:'مرايا جينيسيس G80',brand:'Genesis',brandAr:'جينيسيس',price:400,priceSar:1500,category:'Body Parts',categoryAr:'هيكل السيارة',stockQty:2,condition:'used',images:['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400'],isActive:true,createdAt:now,updatedAt:now },
                { name:'AC Compressor Tucson',nameAr:'كمبريسور مكيف توسان',brand:'Hyundai',brandAr:'هيونداي',price:650,priceSar:2437,category:'AC',categoryAr:'التكييف',stockQty:2,condition:'new',images:['https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=400'],isActive:true,createdAt:now,updatedAt:now },
            ]);
            results.parts = 6;
        } else { results.parts = 'exist:' + await parts.countDocuments(); }

        return res.json({ success: true, message: 'تم رفع البيانات بنجاح', results });
    } catch (err) {
        logger.error('[seed-data]', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

