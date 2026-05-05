// vercel-server.js - Vercel Serverless Entry Point with Multi-Tenant Support

/**
 * @file vercel-server.js
 * @description المدخل الرئيسي لبيئة Vercel Serverless مع دعم Multi-Tenant
 * 
 * كل طلب يُحلّل لتحديد المعرض (Tenant) ثم يتصل بقاعدة البيانات الخاصة به.
 * يستخدم tenant-db-manager لإدارة اتصالات مستقلة لكل معرض.
 */

const { getAllTenants } = require('./tenants/tenant-resolver');
const { getConnectionsStatus } = require('./tenants/tenant-db-manager');

// ── ثوابت ──
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV);

/**
 * تحميل قائمة الـ origins المسموح بها من tenants.json
 * يجمع كل دومينات كل المعارض المفعّلة
 */
function getAllowedOrigins() {
  const origins = [];
  
  try {
    const tenants = getAllTenants();
    
    for (const tenant of tenants) {
      if (tenant.domains && Array.isArray(tenant.domains)) {
        for (const domain of tenant.domains) {
          // إضافة الدومين بصيغتيه (مع وبدون https)
          origins.push(`https://${domain}`);
          origins.push(`http://${domain}`);
        }
      }
    }
  } catch (err) {
    console.warn('[Vercel] Could not load tenant domains:', err.message);
  }
  
  // إضافة الدومينات الثابتة للتوافقية
  const staticOrigins = [
    'https://daood.okigo.net',
    'https://www.daood.okigo.net',
    'https://hmcar.xyz',
    'https://www.hmcar.xyz',
    'https://hmcar.okigo.net',
    'https://www.hmcar.okigo.net',
    'https://car-auction-sand.vercel.app',
    'https://client-app-iota-eight.vercel.app',
    'https://hmcar-client-app.vercel.app',
    'https://carx-system.vercel.app',
    'https://carx-system-psi.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
  ];
  
  return [...new Set([...origins, ...staticOrigins])];
}

/**
 * التحقق من أن الـ origin مسموح به
 */
function isOriginAllowed(origin) {
  if (!origin) return true;
  
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) return true;
  
  // السماح للدومينات الموثوقة
  if (origin.endsWith('.okigo.net')) return true;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  
  // Vercel domains للمشاريع الحالية
  const allowedVercelPatterns = [
    'car-auction',
    'client-app',
    'hmcar-client-app',
    'carx-system',
  ];
  
  for (const pattern of allowedVercelPatterns) {
    if (origin.includes(pattern) && origin.endsWith('.vercel.app')) {
      return true;
    }
  }
  
  return false;
}

/**
 * تعيين headers الـ CORS
 */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-Tenant-ID');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * CORS middleware للـ serverless
 */
function createCorsMiddleware() {
  return (req, res, next) => {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  };
}

/**
 * التحقق من وجود MONGO_URI للمعرض الافتراضي وتصحيح التنسيق العشوائي
 */
function hasValidMongoUri() {
  let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not defined in environment');
    return false;
  }
  
  // تنظيف الرابط من الأقواس المزدوجة والمسافات الناتجة عن سطر الأوامر في ويندوز
  mongoUri = mongoUri.replace(/^"|"$/g, '').trim();
  
  // تحديث المتغير في بيئة التشغيل لتعمل باقي المكاتب بشكل صحيح
  process.env.MONGO_URI = mongoUri;
  
  if (!mongoUri.startsWith('mongodb')) {
    console.error('❌ MONGO_URI is invalid:', mongoUri.substring(0, 20));
    return false;
  }
  
  return true;
}

// ── Handler الرئيسي ──
module.exports = async (req, res) => {
  // CORS على مستوى الـ handler - قبل أي شيء
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // التحقق من وجود متغيرات البيئة الأساسية
    if (!hasValidMongoUri()) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database configuration error', 
        code: 'MISSING_ENV'
      });
    }

    // استخدام App class من modules/app.js
    // ملاحظة: tenantMiddleware داخل setupMiddleware() سيتولى:
    // 1. resolveTenant(req) لتحديد المعرض
    // 2. getConnection(tenant.id, tenant.mongoUri) للاتصال بقاعدة البيانات
    // 3. تخزين req.tenant و req.tenantModels
    const App = require('./modules/app');
    const appInstance = new App({
      isServerless: true,
      corsConfig: createCorsMiddleware()
    });
    const expressApp = appInstance.getExpressApp();
    
    return expressApp(req, res);

  } catch (fatalError) {
    console.error('[Vercel] FATAL:', fatalError.message);
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Server initialization failed',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? fatalError.message : undefined
      });
    }
  }
};

/**
 * Endpoint لمراقبة حالة الاتصالات (للتشخيص)
 * يمكن استدعاؤه عبر /api/connections-status إذا تمت إضافته في routes
 */
module.exports.getConnectionsStatus = getConnectionsStatus;
