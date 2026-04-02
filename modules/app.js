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

  setupApp() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
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

    // Multi-Tenant Middleware
    this.app.use(tenantMiddleware({ required: false, connectDb: true }));

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

    this.setupApiRoutes();

    this.app.get('/', (req, res) => {
      res.json({
        name: 'HM CAR Multi-Tenant API',
        version: '2.0.0',
        status: 'Online',
        message: 'مرحباً بك في واجهة برمجة تطبيقات HM CAR',
        clients: [
          {
            id: 'hmcar',
            name: 'HM CAR',
            url: 'https://hmcar-client-app.vercel.app',
            description: 'منصة مزادات ومبيعات السيارات الفاخرة'
          },
          {
            id: 'carx',
            name: 'CAR X',
            url: 'https://carx-system.vercel.app',
            description: 'معرض وأمزاد CAR X'
          }
        ],
        endpoints: {
          api: '/api/v2',
          health: '/health',
          docs: '/api/v2/docs'
        },
        timestamp: new Date().toISOString()
      });
    });

    logger.info('✅ تم إعداد المسارات الأساسية');
  }

  setupApiRoutes() {
    try {
      const apiV2Router = require('../routes/api/v2/index');
      // المسار الرئيسي v2
      this.app.use('/api/v2', apiV2Router);
      // مسار مختصر للتطوير المحلي
      this.app.use('/v2', apiV2Router);
      // /api هنا يعمل كـ alias لـ /api/v2 لأن الـ client يستدعي /api/v2/...
      // وـ Vercel يوجه /api/* كله لهذا السيرفر
      this.app.use('/api', apiV2Router);
      logger.info('✅ تم تحميل جميع مسارات API v2 بنجاح');
    } catch (error) {
      logger.error('❌ خطأ في تحميل مسارات API v2:', error);
      console.error('API routes load error:', error.message, error.stack);
    }
  }

  setupErrorHandling() {
    // 404
    this.app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        message: 'عذراً، المسار المطلوب غير موجود',
        code: 'NOT_FOUND'
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('⚠️ خطأ غير متوقع:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'حدث خطأ تقني داخلي في الخادم',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
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
