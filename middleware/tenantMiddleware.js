// [[ARABIC_HEADER]] هذا الملف (middleware/tenantMiddleware.js) جزء من مشروع HM CAR - نظام Multi-Tenant
// الوسيط الرئيسي لتحديد المعرض في كل طلب

/**
 * @file middleware/tenantMiddleware.js
 * @description وسيط Express يحدد المعرض (Tenant) لكل طلب وارد.
 * 
 * يقوم بـ:
 * 1. تحديد المعرض من الطلب (دومين، header، query)
 * 2. إنشاء/استرجاع اتصال قاعدة البيانات الخاص بالمعرض
 * 3. تخزين بيانات المعرض و Models في req لتكون متاحة لكل الـ routes
 * 
 * الاستخدام في الـ Routes:
 *   req.tenant       → معلومات المعرض (الاسم، الثيم، الاتصال، إلخ)
 *   req.tenantModels  → النماذج المرتبطة بقاعدة بيانات هذا المعرض
 *   req.getModel('Car') → اختصار للحصول على Model محدد
 */

const { resolveTenant } = require('../tenants/tenant-resolver');
const { getConnection } = require('../tenants/tenant-db-manager');

/**
 * الوسيط الرئيسي: يُضاف قبل كل المسارات
 * 
 * @param {Object} options - خيارات اختيارية
 * @param {boolean} options.required - هل المعرض إلزامي؟ (افتراضي: true)
 * @param {boolean} options.connectDb - هل يتم الاتصال بقاعدة البيانات؟ (افتراضي: true)
 */
function tenantMiddleware(options = {}) {
  const { required = true, connectDb = true } = options;

  return async (req, res, next) => {
    // Skip tenant middleware in test environment
    if (process.env.NODE_ENV === 'test' || process.env.TESTING === 'true') {
      return next();
    }

    try {
      // ── تحديد المعرض ──
      let tenant = resolveTenant(req);

      // ── Fallback ذكي: إذا لم يُحدَّد tenant يستخدم الافتراضي ──
      // هذا يحل مشكلة Vercel Preview URLs التي لم تُضاف للـ domains list
      if (!tenant) {
        const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
        const headerTenant = req.headers['x-tenant-id'];
        const isVercelPreview = host.endsWith('.vercel.app');
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

        // استخدام الـ default tenant إذا كان من vercel أو localhost أو يحمل header صريح
        if (isVercelPreview || isLocalhost || headerTenant) {
          const { resolveTenant: rt } = require('../tenants/tenant-resolver');
          // نعيد المحاولة مع tenant صريح
          const { loadTenants } = require('../tenants/tenant-resolver');
          console.warn(`⚠️ [TenantMiddleware] Host "${host}" not in domains list. Using default tenant: hmcar`);
          // نُنشئ tenant مباشرة من ملف tenants.json
          const fs = require('fs');
          const path = require('path');
          try {
            const tenantsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../tenants/tenants.json'), 'utf8'));
            const defaultId = tenantsData.defaultTenant || 'hmcar';
            const tenantData = tenantsData.tenants[headerTenant] || tenantsData.tenants[defaultId];
            if (tenantData && tenantData.enabled) {
              let mongoUri = tenantData.mongoUri;
              if (mongoUri && mongoUri.startsWith('ENV:')) {
                mongoUri = process.env[mongoUri.substring(4)] || process.env.MONGO_URI || null;
              }
              tenant = { ...tenantData, mongoUri };
            }
          } catch(e) {
            console.error('[TenantMiddleware] Failed to load fallback tenant:', e.message);
          }
        }
      }

      if (!tenant) {
        if (required) {
          return res.status(400).json({
            success: false,
            message: 'Tenant is required for this API request',
            code: 'TENANT_REQUIRED',
          });
        }
        // إذا لم يكن إلزامياً، تابع بدون معرض
        return next();
      }



      // ── تخزين بيانات المعرض في الطلب ──
      req.tenant = {
        id: tenant.id,
        name: tenant.name,
        nameEn: tenant.nameEn,
        description: tenant.description,
        logo: tenant.logo,
        favicon: tenant.favicon,
        theme: tenant.theme,
        contact: tenant.contact,
        settings: tenant.settings,
      };

      // ── الاتصال بقاعدة البيانات إذا مطلوب ──
      if (connectDb && tenant.mongoUri) {
        const { connection, models } = await getConnection(tenant.id, tenant.mongoUri);

        req.tenantDb = connection;
        req.tenantModels = models;

        // اختصار مفيد للحصول على Model
        req.getModel = (modelName) => {
          if (!models[modelName]) {
            throw new Error(`Model "${modelName}" غير متاح للمعرض "${tenant.id}"`);
          }
          return models[modelName];
        };
      }

      next();
    } catch (error) {
      console.error('❌ خطأ في tenant middleware:', error.message);

      // إذا كان خطأ اتصال بقاعدة البيانات
      if (error.message.includes('MONGO_URI') || error.message.includes('connect')) {
        return res.status(503).json({
          success: false,
          message: 'خدمة قاعدة البيانات غير متاحة حالياً',
          code: 'DB_UNAVAILABLE',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'خطأ في تحديد المعرض',
        code: 'TENANT_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };
}

/**
 * وسيط خفيف: يحدد المعرض بدون اتصال بقاعدة البيانات
 * مفيد لمسارات لا تحتاج DB مثل الثيم والمعلومات العامة
 */
function tenantInfoOnly() {
  return tenantMiddleware({ required: true, connectDb: false });
}

/**
 * وسيط اختياري: يحاول تحديد المعرض لكن لا يفشل إذا لم يجده
 */
function tenantOptional() {
  return tenantMiddleware({ required: false, connectDb: true });
}

module.exports = {
  tenantMiddleware,
  tenantInfoOnly,
  tenantOptional,
};
