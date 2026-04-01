const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const { requireAuthAPI } = require('../../../middleware/auth');
const logger = require('../../../modules/core/logger');

// GET /api/v2/system/health
// فحص شامل للنظام (قاعدة البيانات، الذاكرة، الخوادم)
router.get('/health', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'غير مصرح' });
        }

        const dbStatus = mongoose.connection.readyState;
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
        await mongoose.connection.db.admin().ping();
        const dbLatency = Date.now() - dbStartTime;

        res.json({
            success: true,
            data: {
                status: 'online',
                timestamp: new Date(),
                database: {
                    state: dbStatusMap[dbStatus] || 'Unknown',
                    latencyMs: dbLatency,
                    host: mongoose.connection.host,
                    name: mongoose.connection.name
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

module.exports = router;
