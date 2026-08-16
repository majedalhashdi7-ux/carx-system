// [[ARABIC_HEADER]] هذا الملف (tenants/tenant-db-manager.js) جزء من مشروع HM CAR - نظام Multi-Tenant
// مسؤول عن إدارة اتصالات قواعد البيانات المتعددة (واحدة لكل معرض)

/**
 * @file tenants/tenant-db-manager.js
 * @description مدير اتصالات قواعد البيانات للمعارض المتعددة.
 * 
 * يستخدم mongoose.createConnection() لإنشاء اتصالات مستقلة لكل معرض.
 * يحافظ على كاش للاتصالات لتجنب إعادة الإنشاء في كل طلب.
 * 
 * ⚠️ ملاحظة مهمة:
 * - نستخدم createConnection بدلاً من connect لأن connect ينشئ اتصال عام واحد فقط
 * - كل اتصال له Pool خاص به (maxPoolSize)
 * - في بيئة Vercel/Serverless يتم تخزين الاتصالات في الذاكرة المؤقتة
 */

const mongoose = require('mongoose');
const path = require('path');

// Import SeedService safely (lazy load to avoid circular dependencies if any)
let seedService = null;
function getSeedService() {
  if (!seedService) {
    seedService = require('../services/SeedService');
  }
  return seedService;
}

// ── كاش الاتصالات: { tenantId: { connection, models, lastUsed } } ──
const connectionPool = new Map();

// ── كاش الـ Schemas المُجمّعة ──
let schemasCache = null;

/**
 * تحميل كل الـ Schemas من مجلد models مرة واحدة
 * نحتاج الـ Schema فقط (وليس الـ Model) لأننا سنربطه بالاتصال المناسب
 */
function loadSchemas() {
  if (schemasCache) return schemasCache;

  const modelsDir = path.join(__dirname, '..', 'models');
  const schemas = {};

  // قائمة النماذج المطلوبة مع أسماءها
  const modelFiles = {
    'User': 'User.js',
    'Car': 'Car.js',
    'Auction': 'Auction.js',
    'Bid': 'Bid.js',
    'Brand': 'Brand.js',
    'SparePart': 'SparePart.js',
    'SpareBrand': 'SpareBrand.js',
    'SiteSettings': 'SiteSettings.js',
    'Order': 'Order.js',
    'Invoice': 'Invoice.js',
    'UserNotification': 'UserNotification.js',
    'Favorite': 'Favorite.js',
    'Review': 'Review.js',
    'Contact': 'Contact.js',
    'Lead': 'Lead.js',
    'Conversation': 'Conversation.js',
    'Message': 'Message.js',
    'Comparison': 'Comparison.js',
    'Analytics': 'Analytics.js',
    'Report': 'Report.js',
    'Payment': 'Payment.js',
    'VehicleCategory': 'VehicleCategory.js',
    'SearchHistory': 'SearchHistory.js',
    'ExchangeRate': 'ExchangeRate.js',
    'SmartAlert': 'SmartAlert.js',
    'LiveAuction': 'LiveAuction.js',
    'LiveAuctionRequest': 'LiveAuctionRequest.js',
    'ConciergeRequest': 'ConciergeRequest.js',
    'PushSubscription': 'PushSubscription.js',
    'AuditLog': 'AuditLog.js',
    'Backup': 'Backup.js',
    'Role': 'Role.js',
    'AuthSettings': 'AuthSettings.js',
    'AdvancedNotification': 'AdvancedNotification.js',
    'AdvancedPermission': 'AdvancedPermission.js',
    'ClientSession': 'ClientSession.js',
    'DeviceFingerprint': 'DeviceFingerprint.js',
    'SupportMessage': 'SupportMessage.js',
    'UserNotificationPreference': 'UserNotificationPreference.js',
  };

  for (const [modelName, fileName] of Object.entries(modelFiles)) {
    try {
      const filePath = path.join(modelsDir, fileName);
      // نستورد الـ Model المُسجّل في mongoose الافتراضي
      // لكننا نحتاج فقط الـ Schema منه
      const model = require(filePath);
      if (model && model.schema) {
        schemas[modelName] = model.schema;
      }
    } catch (err) {
      // بعض النماذج قد لا تكون موجودة، نتجاهلها
      // console.warn(`⚠️ تعذر تحميل Schema: ${modelName}`, err.message);
    }
  }

  schemasCache = schemas;
  console.log(`📦 تم تحميل ${Object.keys(schemas).length} Schema`);
  return schemas;
}

/**
 * إنشاء URI بديل للمعرض باستخدام MONGO_URI الرئيسي مع استبدال اسم قاعدة البيانات بـ tenantId.
 * @param {string} baseUri - الـ URI الرئيسي للموقع (مثل MONGO_URI)
 * @param {string} dbName - اسم قاعدة البيانات البديلة (tenantId)
 * @returns {string} الـ URI المعدل
 */
function constructFallbackUri(baseUri, dbName) {
  if (!baseUri) return baseUri;
  try {
    const [mainPart, options] = baseUri.split('?');
    const protoIndex = mainPart.indexOf('://');
    if (protoIndex === -1) return baseUri;
    
    const searchStart = protoIndex + 3;
    const firstSlashIndex = mainPart.indexOf('/', searchStart);
    
    let hostPart;
    if (firstSlashIndex === -1) {
      hostPart = mainPart;
    } else {
      hostPart = mainPart.substring(0, firstSlashIndex);
    }
    
    return hostPart + '/' + dbName + (options ? '?' + options : '');
  } catch (e) {
    console.error('Error constructing fallback URI:', e.message);
    return baseUri;
  }
}

/**
 * إنشاء أو استرجاع اتصال قاعدة بيانات لمعرض معين
 * @param {string} tenantId - معرف المعرض
 * @param {string} mongoUri - URI قاعدة البيانات
 * @returns {Promise<{connection: mongoose.Connection, models: Object}>}
 */
async function getConnection(tenantId, mongoUri) {
  // 1. إعادة استخدام الاتصال الرئيسي لـ hmcar فقط (لتسريع Vercel Serverless)
  // [[ARABIC_COMMENT]] المعارض الأخرى تحصل دائماً على اتصال مستقل — لضمان العزل التام
  const PRIMARY_TENANTS = ['hmcar', 'default'];
  if (
    PRIMARY_TENANTS.includes(tenantId) &&
    mongoose.connection &&
    mongoose.connection.readyState === 1
  ) {
    const schemas = loadSchemas();
    const models = {};
    for (const [modelName, schema] of Object.entries(schemas)) {
      models[modelName] = mongoose.models[modelName] || mongoose.model(modelName, schema);
    }
    return { connection: mongoose.connection, models, lastUsed: Date.now() };
  }

  // 2. تحقق من الكاش الفرعي
  if (connectionPool.has(tenantId)) {
    const cached = connectionPool.get(tenantId);

    // تحقق أن الاتصال لا يزال حياً
    if (cached.connection.readyState === 1) {
      cached.lastUsed = Date.now();
      return cached;
    }

    // الاتصال ميت، أزله من الكاش
    console.log(`🔄 إعادة اتصال المعرض: ${tenantId}`);
    try {
      await cached.connection.close();
    } catch (e) { /* ignore */ }
    connectionPool.delete(tenantId);
  }

  if (!mongoUri) {
    throw new Error(`لم يتم تحديد MONGO_URI للمعرض: ${tenantId}`);
  }


  console.log(`🔗 إنشاء اتصال جديد للمعرض: ${tenantId}`);

  // إنشاء اتصال مستقل لهذا المعرض مع إمكانية التراجع الذاتي (Self-Healing Fallback)
  let connection;
  try {
    connection = await mongoose.createConnection(mongoUri, {
      maxPoolSize: 5, // حجم Pool أصغر لكل معرض (بدلاً من 10 للكل)
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
    }).asPromise();
  } catch (error) {
    console.error(`⚠️ [CONN FAILED] Failed connecting to ${tenantId} using primary URI:`, error.message);
    
    // التحقق من وجود URI بديل (MONGO_URI الرئيسي للمنصة) ومحاولة استخدامه مع تعديل اسم قاعدة البيانات
    const baseUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (baseUri && baseUri !== mongoUri) {
      console.log(`🔄 [FALLBACK] Attempting connection to ${tenantId} using fallback parsed from main MONGO_URI`);
      try {
        const fallbackUri = constructFallbackUri(baseUri, tenantId);
        connection = await mongoose.createConnection(fallbackUri, {
          maxPoolSize: 5,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          bufferCommands: true,
        }).asPromise();
        console.log(`✅ [CONN SUCCESS] Connected to ${tenantId} via fallback URI`);
      } catch (fallbackError) {
        console.error(`❌ [CONN FAILED] Fallback connection also failed for ${tenantId}:`, fallbackError.message);
        throw error; // رمي الخطأ الأصلي إذا فشل الاتصال البديل أيضاً
      }
    } else {
      throw error;
    }
  }

  // تسجيل كل الـ Models على هذا الاتصال
  const schemas = loadSchemas();
  const models = {};

  for (const [modelName, schema] of Object.entries(schemas)) {
    try {
      models[modelName] = connection.model(modelName, schema);
    } catch (err) {
      // قد يكون مسجلاً بالفعل
      try {
        models[modelName] = connection.model(modelName);
      } catch (e) {
        console.warn(`⚠️ تعذر تسجيل Model ${modelName} للمعرض ${tenantId}`);
      }
    }
  }

  // تخزين في الكاش
  const entry = {
    connection,
    models,
    tenantId,
    lastUsed: Date.now(),
    createdAt: Date.now(),
  };

  connectionPool.set(tenantId, entry);

  // ── التعبئة التلقائية (Auto-Seeding) ──
  // إذا كانت قاعدة البيانات فارغة من المستخدمين، نقوم بتجهيز الأدمن والإعدادات
  try {
    // Try to drop old unique indexes that cause multi-tenant collisions (Self-healing)
    try {
      const db = connection.db;
      if (db) {
        const dropIndexes = [
          { coll: 'users', idx: 'username_1' },
          { coll: 'users', idx: 'email_1' },
          { coll: 'users', idx: 'phone_1' },
          { coll: 'sitesettings', idx: 'key_1' },
          { coll: 'roles', idx: 'name_1' },
          { coll: 'advancedpermissions', idx: 'name_1' }
        ];
        
        for (const item of dropIndexes) {
          try {
            await db.collection(item.coll).dropIndex(item.idx);
            console.log(`✅ [DB FIX] Dropped legacy index ${item.idx} on ${item.coll}`);
          } catch (e) {
            // Ignore if index doesn't exist
          }
        }
      }
    } catch (e) {
      console.warn(`⚠️ [DB FIX] Could not drop legacy indexes: ${e.message}`);
    }

    const userCount = await models.User.countDocuments({ tenantId });
    if (userCount === 0) {
      console.log(`🌱 قاعدة بيانات المعرض ${tenantId} فارغة، جاري التهيئة...`);
      const seed = getSeedService();
      await seed.runAll(models, tenantId);
    }
  } catch (seedErr) {
    console.error(`⚠️ فشل التهيئة التلقائية للمعرض ${tenantId}:`, seedErr.message);
  }

  // أحداث الاتصال
  connection.on('error', (err) => {
    console.error(`❌ خطأ في اتصال المعرض ${tenantId}:`, err.message);
  });

  connection.on('disconnected', () => {
    console.log(`📊 اتصال المعرض ${tenantId} انقطع`);
    connectionPool.delete(tenantId);
  });

  console.log(`✅ تم إنشاء اتصال المعرض: ${tenantId} (${Object.keys(models).length} model)`);
  return entry;
}

/**
 * الحصول على Model محدد لمعرض محدد
 * @param {string} tenantId - معرف المعرض
 * @param {string} mongoUri - URI قاعدة البيانات
 * @param {string} modelName - اسم الـ Model
 * @returns {Promise<mongoose.Model>}
 */
async function getModel(tenantId, mongoUri, modelName) {
  const { models } = await getConnection(tenantId, mongoUri);
  if (!models[modelName]) {
    throw new Error(`Model "${modelName}" غير موجود للمعرض "${tenantId}"`);
  }
  return models[modelName];
}

/**
 * إغلاق اتصال معرض محدد
 * @param {string} tenantId - معرف المعرض
 */
async function closeConnection(tenantId) {
  if (connectionPool.has(tenantId)) {
    const { connection } = connectionPool.get(tenantId);
    await connection.close();
    connectionPool.delete(tenantId);
    console.log(`🔌 تم إغلاق اتصال المعرض: ${tenantId}`);
  }
}

/**
 * إغلاق كل الاتصالات (يُستخدم عند إيقاف السيرفر)
 */
async function closeAllConnections() {
  console.log(`⏳ جاري إغلاق ${connectionPool.size} اتصال...`);

  const promises = [];
  for (const [tenantId, { connection }] of connectionPool) {
    promises.push(
      connection.close()
        .then(() => console.log(`🔌 أُغلق: ${tenantId}`))
        .catch(err => console.warn(`⚠️ خطأ إغلاق ${tenantId}:`, err.message))
    );
  }

  await Promise.all(promises);
  connectionPool.clear();
  console.log('✅ تم إغلاق كل اتصالات المعارض');
}

/**
 * حالة كل الاتصالات (للمراقبة)
 * @returns {Array} معلومات الاتصالات
 */
function getConnectionsStatus() {
  const statuses = [];

  for (const [tenantId, entry] of connectionPool) {
    const states = {
      0: 'منقطع',
      1: 'متصل',
      2: 'جاري الاتصال',
      3: 'جاري الإغلاق',
    };

    statuses.push({
      tenantId,
      state: states[entry.connection.readyState] || 'غير معروف',
      readyState: entry.connection.readyState,
      modelsCount: Object.keys(entry.models).length,
      lastUsed: new Date(entry.lastUsed).toISOString(),
      createdAt: new Date(entry.createdAt).toISOString(),
      uptime: Math.round((Date.now() - entry.createdAt) / 1000) + 's',
    });
  }

  return statuses;
}

/**
 * تنظيف الاتصالات غير المستخدمة (Idle Cleanup)
 * يُشغّل بشكل دوري لتقليل استهلاك الذاكرة
 * @param {number} maxIdleMs - الحد الأقصى لعدم الاستخدام (افتراضي: 30 دقيقة)
 */
async function cleanupIdleConnections(maxIdleMs = 30 * 60 * 1000) {
  const now = Date.now();
  const toClose = [];

  for (const [tenantId, entry] of connectionPool) {
    if (now - entry.lastUsed > maxIdleMs) {
      toClose.push(tenantId);
    }
  }

  for (const tenantId of toClose) {
    await closeConnection(tenantId);
    console.log(`🧹 تم تنظيف اتصال خامل: ${tenantId}`);
  }

  if (toClose.length > 0) {
    console.log(`🧹 تم تنظيف ${toClose.length} اتصال خامل`);
  }
}

// تشغيل التنظيف التلقائي كل 15 دقيقة (فقط في بيئات غير serverless)
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  setInterval(() => {
    cleanupIdleConnections().catch(console.error);
  }, 15 * 60 * 1000);
}

// ملاحظة: لا يتم تسجيل SIGINT/SIGTERM هنا لتجنب التعارض مع app.js
// يتم استدعاء closeAllConnections() من دالة shutdown() في modules/app.js

module.exports = {
  getConnection,
  getModel,
  closeConnection,
  closeAllConnections,
  getConnectionsStatus,
  cleanupIdleConnections,
};
