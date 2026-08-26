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
const { generalLimiter, authLimiter, strictLimiter } = require('./middleware/rateLimiter');

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
    'https://hmcar-system-two.vercel.app',
    'https://www.hmcar-system-two.vercel.app',
    'https://hmcar.xyz',
    'https://www.hmcar.xyz',
    'https://hmcar.okigo.net',
    'https://www.hmcar.okigo.net',
    'https://carx-system-five.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
  ];

  // إضافة مشاريع Vercel المصرح بها من المتغير البيئي VERCEL_ALLOWED_PROJECTS
  const vercelProjects = (process.env.VERCEL_ALLOWED_PROJECTS || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  for (const proj of vercelProjects) {
    staticOrigins.push(`https://${proj}.vercel.app`);
    staticOrigins.push(`https://www.${proj}.vercel.app`);
  }

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
  // دعم نطاقات Vercel preview بشكل مرن
  if (origin.endsWith('.vercel.app')) {
    // Allow all .vercel.app if explicitly enabled (use with caution)
    const allowAny = String(process.env.ALLOW_ANY_VERCEL_PREVIEW || '').toLowerCase() === 'true';
    if (allowAny) return true;

    // Allow if origin includes any project listed in VERCEL_ALLOWED_PROJECTS
    const vercelProjects = (process.env.VERCEL_ALLOWED_PROJECTS || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    for (const proj of vercelProjects) {
      if (proj && origin.includes(proj)) return true;
    }

    // Fallback: allow common internal project slugs for backward-compatibility
    const allowedVercelPatterns = [
      'car-auction',
      'client-app',
      'hmcar-client-app',
      'hmcar-system',
      'carx-system',
    ];
    for (const pattern of allowedVercelPatterns) {
      if (origin.includes(pattern)) return true;
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

  // If a global MONGO_URI is present, normalize and use it
  if (mongoUri) {
    mongoUri = String(mongoUri).replace(/^"|"$/g, '').trim();
    process.env.MONGO_URI = mongoUri;
    process.env.MONGODB_URI = mongoUri;
    return mongoUri.startsWith('mongodb');
  }

  // No global URI: check tenants for per-tenant URIs
  try {
    const tenants = getAllTenants();
    for (const t of tenants) {
      if (t.mongoUri && String(t.mongoUri).trim().startsWith('mongodb')) {
        console.warn(`⚠️ [Vercel] No global MONGO_URI but found tenant-specific URI for tenant ${t.id}`);
        // do not override process.env.MONGO_URI here; tenant resolver will provide URIs per-tenant
        return true;
      }
    }
  } catch (e) {
    console.warn('[Vercel] could not inspect tenant URIs:', e.message);
  }

  console.error('❌ No usable MongoDB URI found (global MONGO_URI or tenant-specific).');
  return false;
}

// ── App Instance Cache (مهم لأداء Vercel Serverless) ──
// نحتفظ بنسخة واحدة من التطبيق بدل إنشاء نسخة جديدة لكل طلب
let _cachedAppInstance = null;

function getOrCreateApp() {
  if (_cachedAppInstance) return _cachedAppInstance;
  const App = require('./modules/app');
  const appInstance = new App({
    isServerless: true,
    corsConfig: createCorsMiddleware()
  });
  appInstance.registerErrorHandlers();
  _cachedAppInstance = appInstance;
  return appInstance;
}

// ── Handler الرئيسي ──
module.exports = async (req, res) => {
  // CORS على مستوى الـ handler - قبل أي شيء
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── Import Real Batch Data Endpoint (لنقل البيانات الحقيقية كاملة إلى Atlas) ──
  if (req.url && req.url.includes('/api/v2/system/import-batch')) {
    if (req.method === 'POST') {
      let rawBody = '';
      req.on('data', chunk => rawBody += chunk);
      return req.on('end', async () => {
        try {
          const body = JSON.parse(rawBody || '{}');
          if (body.secret !== 'hmcar-import-2026') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
          }
          const { collection, documents, clearFirst } = body;
          if (!collection || !Array.isArray(documents)) {
            return res.status(400).json({ success: false, error: 'Invalid payload' });
          }
          const mongoose = require('mongoose');
          const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
          if (!mongoose.connection || mongoose.connection.readyState < 1) {
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
          }
          const db = mongoose.connection.db;
          const col = db.collection(collection);

          if (clearFirst) {
            await col.deleteMany({ tenantId: 'hmcar' });
            // Drop problematic indexes if necessary
            if (collection === 'brands') {
              try { await col.dropIndex('key_1'); } catch(e) {}
            }
          }

          let insertedCount = 0;
          if (documents.length > 0) {
            // Ensure tenantId is set
            const docs = documents.map(d => {
              const doc = { ...d };
              doc.tenantId = 'hmcar';
              // Convert date strings back to Date objects if needed
              if (doc.createdAt && typeof doc.createdAt === 'string') doc.createdAt = new Date(doc.createdAt);
              if (doc.updatedAt && typeof doc.updatedAt === 'string') doc.updatedAt = new Date(doc.updatedAt);
              if (doc.startsAt && typeof doc.startsAt === 'string') doc.startsAt = new Date(doc.startsAt);
              if (doc.endsAt && typeof doc.endsAt === 'string') doc.endsAt = new Date(doc.endsAt);
              // Clean ObjectId fields if _id is string, leave as string or remove if invalid
              return doc;
            });
            const r = await col.insertMany(docs, { ordered: false }).catch(e => ({ insertedCount: e.result?.insertedCount || 0 }));
            insertedCount = r.insertedCount || docs.length;
          }

          const totalCount = await col.countDocuments({ tenantId: 'hmcar' });
          return res.status(200).json({
            success: true,
            collection,
            inserted: insertedCount,
            total: totalCount
          });
        } catch(e) {
          return res.status(500).json({ success: false, error: e.message });
        }
      });
    }
  }


  try {
    // التحقق من وجود متغيرات البيئة الأساسية
    if (!hasValidMongoUri()) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database configuration error', 
        code: 'MISSING_ENV'
      });
    }

    // تهيئة اتصال MongoDB العام السريع لبيئة Serverless
    const mongoose = require('mongoose');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (mongoUri && (!mongoose.connection || mongoose.connection.readyState < 1)) {
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          maxPoolSize: 10,
          bufferCommands: false
        });
      } catch (connErr) {
        console.warn('⚠️ [Vercel] Mongoose connect warning:', connErr.message);
      }
    }

    // Use cached App instance for performance
    const appInstance = getOrCreateApp();
    const expressApp = appInstance.getExpressApp();

    return expressApp(req, res);

  } catch (fatalError) {
    console.error('[Vercel] FATAL:', fatalError.message, fatalError.stack);
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Server initialization failed',
        code: 'SERVER_ERROR',
        error: fatalError.message, // [[ARABIC_COMMENT]] إظهار رسالة الخطأ للتشخيص
        stack: process.env.NODE_ENV === 'development' ? fatalError.stack : undefined
      });
    }
  }
};

/**
 * Endpoint لمراقبة حالة الاتصالات (للتشخيص)
 * يمكن استدعاؤه عبر /api/connections-status إذا تمت إضافته في routes
 */
module.exports.getConnectionsStatus = getConnectionsStatus;
