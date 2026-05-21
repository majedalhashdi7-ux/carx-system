// [[ARABIC_HEADER]] هذا الملف (modules/app.js) جزء من مشروع HM CAR

/**
 * @file modules/app.js
 * @description المكون الأساسي لتطبيق Express.
 * مُحسَّن لـ Vercel Serverless - لا يستخدم session middleware هنا
 * (الـ vercel-server.js يبني التطبيق مباشرة بدون app.js في Vercel)
 */

const express = require('express');
const path = require('path');
const config = require('./core/config');
const database = require('./core/database');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');
const { generalLimiter, authLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const Sentry = require('@sentry/node');

// تهيئة Sentry فوراً لالتقاط كل الأخطاء
if (config.sentry && config.sentry.enabled) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    tracesSampleRate: config.sentry.tracesSampleRate,
  });
  console.log('🛡️ Sentry initialized (Backend)');
}

// آمن من crash في Monitoring
let monitoring = null;
try {
  monitoring = require('../services/MonitoringService');
} catch (e) {
  monitoring = { recordRequest: () => {} };
}

// آمن من crash في Logger
let logger = null;
try {
  logger = require('./core/logger');
} catch (e) {
  logger = {
    info: (msg) => console.log('[INFO]', msg),
    error: (msg, err) => console.error('[ERROR]', msg, err?.message || ''),
    warn: (msg) => console.warn('[WARN]', msg),
  };
}

/**
 * فئة التطبيق (App Class)
 */
class App {
  constructor(options = {}) {
    this.app = express();
    
    // Vercel requires trust proxy to be enabled for rate limiting to work correctly
    if (options.isServerless || process.env.VERCEL) {
      this.app.set('trust proxy', 1);
    }

    this.isServerless = options.isServerless || false;
    this.corsConfig = options.corsConfig || null;
    this.setupApp();
  }

  /**
   * الحصول على Express app بدون تشغيل السيرفر
   * مفيد للـ serverless environments
   */
  getExpressApp() {
    return this.app;
  }

  /**
   * Register error handlers (Must be called after all routes)
   */
  registerErrorHandlers() {
    this.setupErrorHandling();
  }

  setupApp() {
    this.setupMiddleware();
    this.setupRoutes();
    // No automatic setupErrorHandling here to allow custom routes in serverless
  }

  setupMiddleware() {
    // Sentry Request Handler - يجب أن يكون أول Middleware
    if (config.sentry && config.sentry.enabled) {
      this.app.use(Sentry.Handlers.requestHandler());
      this.app.use(Sentry.Handlers.tracingHandler());
    }

    // CORS - مخصص للـ serverless أو عادي
    if (this.isServerless && this.corsConfig) {
      this.app.use(this.corsConfig);
    } else {
      // CORS عادي للـ local development
      this.app.use(cors(config.security.cors));
    }

    // Helmet بإعدادات مرنة
    this.app.use(helmet({
      contentSecurityPolicy: false,
    }));

    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
    this.app.use('/public', express.static(path.join(__dirname, '..', 'public')));

    // Rate Limiting
    this.app.use('/api', generalLimiter);

    // ملاحظة: tenantMiddleware يُطبَّق داخل routes/api/v2/index.js بشكل مباشر
    // لتجنب ازدواجية تحديد المعرض

    // Request tracking (آمن من crash)
    this.app.use((req, res, next) => {
      try {
        const start = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - start;
          if (monitoring && monitoring.recordRequest) {
            monitoring.recordRequest(res.statusCode, duration);
          }
        });
      } catch (e) {}
      next();
    });

    logger.info('✅ تم إعداد الوسطاء وطبقات الأمان بنجاح');
  }

  setupRoutes() {
    // Health Check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date(), engine: 'HM-CAR-V2' });
    });

    this.app.get('/api/v2/ping-status', (req, res) => {
      res.json({
        success: true,
        message: 'API is Live',
        time: new Date().toISOString(),
        tenant: req.tenant?.id,
        serverless: this.isServerless
      });
    });

    // مسار حقن البيانات الحقيقية (محمي بمفتاح سري)
    this.app.post('/api/v2/admin/force-seed', async (req, res) => {
      try {
        const { secret } = req.body;
        const expectedSecret = process.env.SEED_SECRET;
        if (!expectedSecret) {
          return res.status(500).json({ success: false, message: 'SEED_SECRET not configured' });
        }
        if (secret !== expectedSecret) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const tenantId = req.tenant?.id || 'hmcar';
        const { getConnection } = require('../tenants/tenant-db-manager');
        const { resolveTenant } = require('../tenants/tenant-resolver');
        const SeedService = require('../services/SeedService');

        const tenant = resolveTenant(req);
        if (!tenant) return res.status(400).json({ error: 'Tenant not resolved' });

        const { models } = await getConnection(tenant.id, tenant.mongoUri);

        // حذف البيانات القديمة
        await models.Car.deleteMany({ tenantId: tenant.id });
        if (models.Auction) await models.Auction.deleteMany({ tenantId: tenant.id });
        if (models.Brand) await models.Brand.deleteMany({ tenantId: tenant.id });

        // زرع البيانات الجديدة
        await SeedService.seedRealData(models, tenant.id);

        res.json({ success: true, message: `✅ Real data seeded for ${tenant.id}` });
      } catch (e) {
        console.error('[force-seed]', e.message);
        res.status(500).json({ success: false, error: e.message });
      }
    });

    this.setupApiRoutes();

    this.app.get('/', (req, res) => {
      res.json({
        message: 'مرحباً بك في واجهة برمجة تطبيقات HM CAR V2',
        status: 'Online',
        documentation: '/api/v2/docs'
      });
    });

    logger.info('✅ تم إعداد المسارات الأساسية');
  }

  setupApiRoutes() {
    try {
      const apiV2Router = require('../routes/api/v2/index');
      // Auth rate limiting (أكثر صرامة)
      this.app.use(['/api/v2/auth/login', '/api/auth/login', '/v2/auth/login'], authLimiter);
      this.app.use(['/api/v2/auth/register', '/api/auth/register', '/v2/auth/register'], authLimiter);
      // Upload rate limiting
      this.app.use(['/api/v2/upload', '/api/upload', '/v2/upload'], uploadLimiter);
      // Log all requests for debugging (optional, can be noisy)
      this.app.use((req, res, next) => {
        if (req.url.startsWith('/api')) {
          console.log(`[API REQUEST] ${req.method} ${req.url}`);
        }
        next();
      });

      // We prioritize /api/v2
      this.app.use('/api/v2', apiV2Router);
      this.app.use('/api', apiV2Router);
      this.app.use('/v2', apiV2Router);

      logger.info('✅ API routes registered');
    } catch (error) {
      logger.error('❌ خطأ في تحميل مسارات API v2:', error);
      console.error('API routes load error:', error.message, error.stack);
    }
  }

  setupErrorHandling() {
    // Sentry Error Handler - يجب أن يكون قبل أي Middleware آخر لمعالجة الأخطاء
    if (config.sentry && config.sentry.enabled) {
      this.app.use(Sentry.Handlers.errorHandler());
    }

    // 404
    this.app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        message: 'عذراً، المسار المطلوب غير موجود في النظام',
        debug: {
          method: req.method,
          url: req.url,
          path: req.path,
          timestamp: new Date().toISOString()
        },
        code: 'NOT_FOUND'
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      const errorDetail = {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
      };
      
      logger.error('⚠️ خطأ غير متوقع:', errorDetail);
      console.error('[FATAL ERROR]', errorDetail);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'حدث خطأ تقني داخلي في الخادم',
          debug: process.env.NODE_ENV === 'production' ? { message: err.message } : errorDetail,
          error: err.message
        });
      }
    });

    logger.info('✅ تم تفعيل نظام معالجة الأخطاء');
  }

  /**
   * تشغيل الخادم (للبيئة المحلية فقط - غير مستخدم في Vercel)
   */
  async start() {
    try {
      await database.connect();
      logger.info('✅ تم الاتصال بقاعدة البيانات بنجاح');

      try {
        const SeedService = require('../services/SeedService');
        await SeedService.runAll();
      } catch (e) {
        console.warn('⚠️ SeedService error (non-fatal):', e.message);
      }

      const socketModule = require('./socket');
      const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : config.server.host;
      const port = process.env.PORT || config.server.port;

      const server = this.app.listen(port, host, () => {
        logger.info(`🚀 الخادم يعمل حالياً على http://${host}:${port}`);
      });

      this.io = socketModule.init(server);
      this.app.set('io', this.io);

      const shutdown = async () => {
        logger.info('⏳ جاري إغلاق النظام بأمان...');
        server.close(() => { logger.info('🛑 تم إيقاف استقبال الطلبات'); });
        await database.disconnect();
        process.exit(0);
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);

    } catch (error) {
      logger.error('❌ فشل تشغيل التطبيق:', error);
      process.exit(1);
    }
  }
}

module.exports = App;
