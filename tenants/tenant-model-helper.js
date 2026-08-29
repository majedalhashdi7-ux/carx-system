// [[ARABIC_HEADER]] هذا الملف (tenants/tenant-model-helper.js) جزء من مشروع HM CAR - نظام Multi-Tenant
// مساعد للحصول على Models مع دعم التوافق العكسي

/**
 * @file tenants/tenant-model-helper.js
 * @description مساعد للانتقال التدريجي من النظام القديم (Model مباشر من mongoose)
 *              إلى النظام الجديد (Model من اتصال المعرض).
 * 
 * الفكرة:
 * - إذا كان الطلب يحتوي على req.tenantModels → نستخدم Model المعرض
 * - إذا لم يكن → نستخدم Model الافتراضي (النظام القديم)
 * 
 * هذا يسمح بالتحويل التدريجي للـ Routes بدون كسر النظام الحالي.
 * 
 * الاستخدام في Route:
 *   const { getModel } = require('../../../tenants/tenant-model-helper');
 *   
 *   router.get('/', async (req, res) => {
 *     const Car = getModel(req, 'Car');  // يعمل مع وبدون multi-tenant
 *     const cars = await Car.find();
 *   });
 */

/**
 * الحصول على Model مع التوافق العكسي
 * @param {import('express').Request} req - الطلب
 * @param {string} modelName - اسم الـ Model (مثل 'Car', 'User', 'Brand')
 * @returns {mongoose.Model} الـ Model المناسب
 */
function getModel(req, modelName) {
  // إذا كان Multi-Tenant مفعل ويوجد Models للمعرض
  if (req.tenantModels && req.tenantModels[modelName]) {
    return req.tenantModels[modelName];
  }

  // التوافق العكسي: استخدم Model الافتراضي من mongoose
  // (يعمل في الإنتاج وفي التطوير إذا لم تكن tenantModels متوفرة)
  try {
    return require(`../models/${modelName}`);
  } catch (err) {
    throw new Error(`Model "${modelName}" غير موجود. تأكد من صحة الاسم. (tenant models missing for req: ${req.originalUrl})`);
  }
}

/**
 * الحصول على عدة Models دفعة واحدة
 * @param {import('express').Request} req - الطلب
 * @param {string[]} modelNames - أسماء الـ Models
 * @returns {Object} كائن يحتوي على الـ Models
 * 
 * مثال:
 *   const { Car, Brand, User } = getModels(req, ['Car', 'Brand', 'User']);
 */
function getModels(req, modelNames) {
  const models = {};
  for (const name of modelNames) {
    models[name] = getModel(req, name);
  }
  return models;
}

/**
 * التحقق من أن الطلب في وضع Multi-Tenant
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isMultiTenant(req) {
  return !!(req.tenant && req.tenantModels);
}

/**
 * الحصول على معرف المعرض الحالي
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getCurrentTenantId(req) {
  return req.tenant ? req.tenant.id : null;
}

/**
 * Add tenantId to a query filter for defense-in-depth protection.
 * Backward-compatible: for the primary 'hmcar' tenant, also matches
 * documents with tenantId:'default' or missing tenantId (legacy seed data).
 * For all other tenants: STRICT isolation — no cross-tenant leakage.
 * @param {import('express').Request} req - Express request object
 * @param {Object} filter - Query filter object
 * @returns {Object} Filter with tenantId added
 */
function addTenantFilter(req, filter = {}) {
  if (!req.tenant?.id) return filter;

  const tid = req.tenant.id;

  // [[ARABIC_COMMENT]] كل معرض يرى بياناته الخاصة + البيانات المشتركة القديمة (default/null)
  // لكن لا يرى بيانات المعارض الأخرى أبداً — عزل كامل بين hmcar و carx
  let tenantCondition;
  
  if (tid === 'hmcar') {
    // HM CAR يرى: hmcar + default (بيانات قديمة مشتركة) + بدون tenantId
    tenantCondition = {
      $or: [
        { tenantId: 'hmcar' },
        { tenantId: 'default' },
        { tenantId: { $exists: false } },
        { tenantId: null },
      ],
    };
  } else if (tid === 'carx') {
    // CAR X يرى: carx فقط — لا يرى hmcar أبداً
    tenantCondition = {
      $or: [
        { tenantId: 'carx' },
      ],
    };
  } else {
    // أي معرض آخر مخصص يرى بياناته الخاصة فقط
    tenantCondition = { tenantId: tid };
  }

  // [[ARABIC_COMMENT]] إذا كان الفلتر يحتوي على $or نستخدم $and لتجنب الكتابة فوقه
  // مثال: { $or: [{email:x},{phone:y}] } مع شرط tenantId → يجب $and وليس overwrite
  if (filter.$or) {
    return { $and: [filter, tenantCondition] };
  }

  return { ...filter, ...tenantCondition };
}

/**
 * Get tenantId for creating new documents
 * Always returns 'hmcar' as fallback — NEVER 'default' to avoid cross-tenant contamination.
 * @param {import('express').Request} req - Express request object
 * @returns {String} tenantId
 */
function getTenantId(req) {
  return req.tenant?.id || 'hmcar';
}

module.exports = {
  getModel,
  getModels,
  isMultiTenant,
  getCurrentTenantId,
  addTenantFilter,
  getTenantId,
};

