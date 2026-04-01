// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/index.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * @file routes/api/v2/index.js
 * @description الموجه الرئيسي لإصدار API الثاني (V2).
 * يقوم بتجميع كافة المسارات الفرعية (المستخدمين، السيارات، المزادات، إلخ) مع تفعيل سياسة تقييد الطلبات (Rate Limiting).
 */

const express = require('express');
const router = express.Router();
const { apiRateLimiter } = require('../../../middleware/securityEnhanced');
const { autoCacheMiddleware } = require('../../../middleware/autoCache');
const { tenantMiddleware } = require('../../../middleware/tenantMiddleware');
const { 
  generalLimiter, 
  authLimiter, 
  strictLimiter, 
  publicLimiter,
  searchLimiter,
  uploadLimiter 
} = require('../../../middleware/rateLimiter');

/**
 * إعداد طبقة تقييد الطلبات (Rate Limiter)
 * لحماية الخادم من الهجمات وزيادة عدد الطلبات من نفس العنوان.
 */
router.use(generalLimiter);
router.use(tenantMiddleware({ required: true, connectDb: true }));

/**
 * معلومات الإصدار الحالي للـ API
 */
router.get('/', (req, res) => {
  res.json({
    name: 'واجهة برمجة تطبيقات HM CAR',
    version: '2.0.0',
    description: 'نظام متطور لإدارة مزادات السيارات وبيع القطع',
    endpoints: {
      auth: 'نظام المصادقة والدخول',
      users: 'إدارة حسابات المستخدمين',
      cars: 'إدارة بيانات السيارات المعروضة',
      auctions: 'إدارة المزادات والمزايدات الفورية',
      analytics: 'نظام الإحصائيات والتقارير'
    },
    status: 'Active',
    serverTime: new Date().toISOString()
  });
});

/**
 * نقطة فحص الحالة الصحية المتقدمة (Advanced Health Check)
 * تقوم بفحص حالة الاتصال بقاعدة البيانات واستهلاك الذاكرة.
 */
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'متصل' : 'غير متصل';

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name
      },
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// --- ربط المسارات الفرعية (Sub-Routes) ---

router.use('/tenant', publicLimiter, require('./tenant'));              // نظام المعارض المتعددة (Multi-Tenant)
router.use('/auth', authLimiter, require('./auth'));                    // المصادقة - حماية مشددة
router.use('/users', strictLimiter, require('./users'));                // المستخدمين - حماية متوسطة
router.use('/cars', publicLimiter, autoCacheMiddleware({ ttl: 300 }), require('./cars'));    // [[ARABIC_COMMENT]] كاش للسيارات لمدة 5 دقائق
router.use('/auctions', strictLimiter, require('./auctions'));          // المزادات - حماية متوسطة
router.use('/parts', publicLimiter, autoCacheMiddleware({ ttl: 300 }), require('./parts'));  // [[ARABIC_COMMENT]] كاش لقطع الغيار لمدة 5 دقائق
router.use('/dashboard', strictLimiter, require('./dashboard'));        // لوحة التحكم - حماية متوسطة
router.use('/orders', strictLimiter, require('./orders'));              // الطلبات - حماية متوسطة
router.use('/notifications', publicLimiter, require('./notifications')); // التنبيهات
router.use('/analytics', strictLimiter, require('./analytics'));        // التحليلات - حماية متوسطة
router.use('/upload', uploadLimiter, require('./upload.js'));           // رفع الملفات - حد صارم
router.use('/search', searchLimiter);                                   // البحث - حد متوسط
router.use('/settings', autoCacheMiddleware({ ttl: 600 }), require('./settings')); // [[ARABIC_COMMENT]] كاش للإعدادات لمدة 10 دقائق
router.use('/messages', publicLimiter, require('./messages'));          // الرسائل
router.use('/reviews', publicLimiter, require('./reviews'));            // التقييمات
router.use('/comparisons', publicLimiter, require('./comparisons'));    // المقارنات
router.use('/brands', publicLimiter, require('./brands'));              // الماركات
router.use('/contact', strictLimiter, require('./contact'));            // الاتصال - حماية متوسطة
router.use('/leads', strictLimiter, require('./leads'));                // العملاء المحتملون (Leads)
router.use('/favorites', publicLimiter, require('./favorites'));        // المفضلة
router.use('/bids', strictLimiter, require('./bids'));                  // المزايدات - حماية متوسطة
router.use('/live-auctions', publicLimiter, require('./live-auctions'));// المزادات المباشرة
router.use('/live-auction-requests', strictLimiter, require('./live-auction-requests')); // طلبات الشراء للمزاد المباشر
router.use('/smart-alerts', publicLimiter, require('./smart-alerts')); // التنبيهات الذكية
router.use('/security', strictLimiter, require('./security'));         // قسم الأمان والأجهزة المحظورة
router.use('/backup', strictLimiter, require('./backup'));             // [[ARABIC_COMMENT]] النسخ الاحتياطي التلقائي
router.use('/concierge', strictLimiter, require('./concierge'));       // الطلبات الخاصة (طلب سيارة / قطع غيار)
router.use('/showroom', publicLimiter, require('./showroom'));          // المعرض الكوري (Encar)
router.use('/invoices', strictLimiter, require('./invoices'));          // نظام الفواتير المخصص (Invoices)
router.use('/system', strictLimiter, require('./system'));            // الفحص الشامل للنظام

/**
 * معالج الأخطاء المركزي لمسارات API
 * يقوم بتحليل نوع الخطأ وإرجاع رسالة واضحة للمبرمج/العميل.
 */
router.use((error, req, res, next) => {
  console.error('⚠️ خطأ في API:', error);

  // أخطاء التحقق من البيانات (Mongoose Validation)
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'خطأ في صحة البيانات',
      message: error.message,
      details: error.errors
    });
  }

  // أخطاء المعرفات غير الصحيحة (Invalid IDs)
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'معرف غير صالح',
      message: 'المعرف الممرر غير موجود أو بتنسيق خاطئ'
    });
  }

  // أخطاء تكرار البيانات الفريدة (Duplicate Key)
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'بيانات مكررة',
      message: 'هذا السجل موجود بالفعل في النظام'
    });
  }

  // خطأ عام غير متوقع
  res.status(error.status || 500).json({
    error: error.name || 'خطأ داخلي',
    message: error.message || 'حدث خطأ غير متوقع في الخادم',
    path: req.path
  });
});

/**
 * معالجة الروابط غير المعروفة لـ API
 */
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'غير موجود',
    message: `المسار ${req.method} ${req.originalUrl} غير متاح في النظام.`
  });
});

module.exports = router;
