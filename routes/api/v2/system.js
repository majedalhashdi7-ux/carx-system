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

module.exports = router;
