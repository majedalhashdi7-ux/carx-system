// [[ARABIC_HEADER]] هذا الملف (tenants/tenant-resolver.js) جزء من مشروع HM CAR - نظام Multi-Tenant
// مسؤول عن تحديد المعرض (Tenant) من الطلب الوارد

/**
 * @file tenants/tenant-resolver.js
 * @description يحدد المعرض المطلوب بناءً على الدومين أو الـ Header أو المسار.
 * 
 * طرق التحديد (بالترتيب):
 * 1. Header مخصص: X-Tenant-ID
 * 2. Query parameter: ?tenant=hmcar
 * 3. الدومين/Host من الطلب
 * 4. المعرض الافتراضي (defaultTenant)
 */

const fs = require('fs');
const path = require('path');

const TENANTS_FILE = path.join(__dirname, 'tenants.json');

// كاش لإعدادات المعارض (يُحدَّث عند تعديل الملف)
let tenantsCache = null;
let lastModified = 0;

/**
 * تحميل إعدادات المعارض من الملف مع كاش ذكي
 */
function loadTenants() {
  try {
    const stat = fs.statSync(TENANTS_FILE);
    const mtime = stat.mtimeMs;

    // أعد التحميل فقط إذا تغير الملف
    if (tenantsCache && mtime === lastModified) {
      return tenantsCache;
    }

    const raw = fs.readFileSync(TENANTS_FILE, 'utf8');
    tenantsCache = JSON.parse(raw);
    lastModified = mtime;

    console.log(`📋 تم تحميل ${Object.keys(tenantsCache.tenants).length} معرض`);
    return tenantsCache;
  } catch (error) {
    console.error('❌ فشل تحميل ملف المعارض:', error.message);
    return null;
  }
}

/**
 * حل قيمة MONGO_URI من متغيرات البيئة أو كقيمة مباشرة
 * @param {string} value - القيمة: "ENV:VARIABLE_NAME" أو URI مباشر
 * @returns {string} URI قاعدة البيانات
 */
function resolveMongoUri(value) {
  if (!value) return null;

  // إذا كانت القيمة تشير لمتغير بيئة
  if (value.startsWith('ENV:')) {
    const envVar = value.substring(4);
    const rawVal = process.env[envVar] || null;
    return rawVal ? String(rawVal).replace(/^"|"$/g, '').trim() : null;
  }

  // قيمة مباشرة
  return String(value).replace(/^"|"$/g, '').trim();
}

/**
 * Construct a fallback MongoDB URI using the main MONGO_URI and the tenant id
 * @param {string} baseUri
 * @param {string} dbName
 * @returns {string}
 */
function constructFallbackUri(baseUri, dbName) {
  if (!baseUri) return null;
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
    return baseUri;
  }
}

/**
 * تحديد المعرض من الطلب الوارد
 * @param {import('express').Request} req - الطلب
 * @returns {object|null} بيانات المعرض
 */
function resolveTenant(req) {
  const config = loadTenants();
  if (!config || !config.tenants) return null;

  const tenants = config.tenants;
  let tenantId = null;
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
  const host = rawHost.toLowerCase();
  const requestedHeaderTenant = req.headers['x-tenant-id'];
  const requestedQueryTenant = req.query.tenant;

  const findTenantByHost = () => {
    if (!host) return null;
    for (const [id, tenant] of Object.entries(tenants)) {
      if (!tenant.enabled) continue;
      if (!Array.isArray(tenant.domains)) continue;
      const matched = tenant.domains.some(domain => {
        const d = String(domain || '').toLowerCase().trim();
        const reqHost = host.split(':')[0].trim();

        // دعم wildcard مثل *.vercel.app
        if (d.startsWith('*.')) {
          const suffix = d.substring(2); // أزل النجمة والنقطة
          return reqHost.endsWith('.' + suffix) || reqHost === suffix;
        }

        // مطابقة عادية
        const dHost = d.split(':')[0].trim();
        return reqHost === dHost || reqHost.endsWith('.' + dHost);
      });
      if (matched) return id;
    }
    return null;
  };


  const hostTenantId = findTenantByHost();

  // ──────────────────────────────────────────────
  // الطريقة 1: X-Tenant-ID header (الأولوية العليا إذا كانت قيمة صحيحة)
  // ──────────────────────────────────────────────
  // في الإنتاج: نقبل X-Tenant-ID إذا أرسله frontend موثوق (مثل carx-system)
  // ويكون المعرّف موجودًا في tenants.json ومفعّلاً.
  if (requestedHeaderTenant && tenants[requestedHeaderTenant] && tenants[requestedHeaderTenant].enabled) {
    tenantId = requestedHeaderTenant;
  }

  // ──────────────────────────────────────────────
  // الطريقة 2: القيمة من الدومين (Host / x-forwarded-host)
  // ──────────────────────────────────────────────
  if (!tenantId && hostTenantId) {
    tenantId = hostTenantId;
  }

  // ──────────────────────────────────────────────
  // الطريقة 3: Query parameter
  // ──────────────────────────────────────────────
  if (!tenantId && requestedQueryTenant && tenants[requestedQueryTenant]) {
    tenantId = requestedQueryTenant;
  }

  // ──────────────────────────────────────────────
  // الطريقة 4: المعرض الافتراضي
  // ──────────────────────────────────────────────
  if (!tenantId) {
    tenantId = config.defaultTenant || Object.keys(tenants)[0];
  }

  // التحقق من وجود المعرض وأنه مفعّل
  const tenant = tenants[tenantId];
  if (!tenant || !tenant.enabled) {
    return null;
  }

  // حل URI قاعدة البيانات
  let mongoUri = resolveMongoUri(tenant.mongoUri);

  // إذا لم يتم حل متغير الـ ENV المحدد للمعرض، نحاول بناء URI افتراضي من MONGO_URI العام
  if (!mongoUri) {
    const baseUri = process.env.MONGO_URI || process.env.MONGODB_URI || null;
    if (baseUri) {
      try {
        console.warn(`⚠️ [TenantResolver] tenant "${tenantId}" has no specific mongoUri, using fallback from main MONGO_URI`);
        mongoUri = constructFallbackUri(baseUri, tenantId);
      } catch (e) {
        // ignore and leave mongoUri null
      }
    }
  }

  return {
    id: tenantId,
    ...tenant,
    mongoUri: mongoUri,
  };
}

/**
 * الحصول على قائمة كل المعارض المفعّلة
 * @returns {Array} قائمة المعارض
 */
function getAllTenants() {
  const config = loadTenants();
  if (!config || !config.tenants) return [];

  return Object.entries(config.tenants)
    .filter(([, t]) => t.enabled)
    .map(([id, t]) => ({
      id,
      name: t.name,
      nameEn: t.nameEn,
      domains: t.domains,
      theme: t.theme,
      mongoUri: resolveMongoUri(t.mongoUri),
      enabled: t.enabled,
    }));
}

/**
 * الحصول على معرض بمعرفه
 * @param {string} tenantId - معرف المعرض
 * @returns {object|null} بيانات المعرض
 */
function getTenantById(tenantId) {
  const config = loadTenants();
  if (!config || !config.tenants || !config.tenants[tenantId]) return null;

  const tenant = config.tenants[tenantId];
  return {
    id: tenantId,
    ...tenant,
    mongoUri: resolveMongoUri(tenant.mongoUri),
  };
}

/**
 * إضافة معرض جديد
 * @param {string} tenantId - معرف المعرض
 * @param {object} tenantData - بيانات المعرض
 */
function addTenant(tenantId, tenantData) {
  const config = loadTenants();
  if (!config) throw new Error('فشل تحميل إعدادات المعارض');

  if (config.tenants[tenantId]) {
    throw new Error(`المعرض "${tenantId}" موجود بالفعل`);
  }

  config.tenants[tenantId] = {
    id: tenantId,
    enabled: true,
    ...tenantData,
  };

  fs.writeFileSync(TENANTS_FILE, JSON.stringify(config, null, 2), 'utf8');
  tenantsCache = null; // مسح الكاش لإعادة التحميل
  console.log(`✅ تم إضافة المعرض: ${tenantId}`);
}

/**
 * تحديث بيانات معرض
 * @param {string} tenantId - معرف المعرض
 * @param {object} updates - التحديثات
 */
function updateTenant(tenantId, updates) {
  const config = loadTenants();
  if (!config || !config.tenants[tenantId]) {
    throw new Error(`المعرض "${tenantId}" غير موجود`);
  }

  config.tenants[tenantId] = {
    ...config.tenants[tenantId],
    ...updates,
  };

  fs.writeFileSync(TENANTS_FILE, JSON.stringify(config, null, 2), 'utf8');
  tenantsCache = null;
  console.log(`✅ تم تحديث المعرض: ${tenantId}`);
}

/**
 * مسح كاش المعارض (يُستخدم عند التحديث من لوحة التحكم)
 */
function clearTenantsCache() {
  tenantsCache = null;
  lastModified = 0;
}

module.exports = {
  resolveTenant,
  getAllTenants,
  getTenantById,
  addTenant,
  updateTenant,
  clearTenantsCache,
  resolveMongoUri,
};
