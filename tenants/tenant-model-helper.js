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

  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const requestPath = String(req.originalUrl || req.path || '');
  const isApiRequest = requestPath.startsWith('/api') || requestPath.startsWith('/v2');
  if (isProduction && isApiRequest) {
    throw new Error(`Tenant model "${modelName}" unavailable in production API context`);
  }

  // التوافق العكسي: استخدم Model الافتراضي
  try {
    return require(`../models/${modelName}`);
  } catch (err) {
    throw new Error(`Model "${modelName}" غير موجود. تأكد من صحة الاسم.`);
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

module.exports = {
  getModel,
  getModels,
  isMultiTenant,
  getCurrentTenantId,
};
