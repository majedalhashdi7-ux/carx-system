// [[ARABIC_HEADER]] هذا الملف (middleware/auth.js) جزء من مشروع HM CAR
// ملف موحد للمصادقة والصلاحيات - يجمع: auth, jwt, roles, adminAuth

const jwt = require('jsonwebtoken');

// ── JWT Helpers ──

// [[SECURITY]] يرفض التشغيل إذا كان JWT_SECRET مفقوداً أو قصيراً جداً
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  // في بيئة الاختبار نقبل سراً قصيراً أو افتراضياً
  if (process.env.NODE_ENV === 'test') {
    return secret || 'test_jwt_secret_for_testing_only';
  }
  if (!secret || secret.length < 32 || /hmcar_jwt_secret|test.secret/i.test(secret)) {
    const msg = '[FATAL] JWT_SECRET غير مضبوط أو أقل من 32 حرفاً — تعذّر بدء التشغيل.';
    console.error(msg);
    // في الإنتاج نوقف العملية فوراً لمنع بدء خادم غير آمن
    throw new Error(msg);
  }
  return secret;
}

function generateToken(user, tenantId = 'default', twoFactorVerified = false) {
  const payload = {
    id: user._id || user.id,
    userId: user._id || user.id,
    tenantId: tenantId,
    email: user.email,
    phone: user.phone,
    role: user.role,
    permissions: user.permissions || [],
    tokenVersion: user.tokenVersion || 0,
    twoFactorVerified
  };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (decoded.requiresTwoFactor || decoded.type || decoded.purpose) return null;
    return decoded;
  } catch {
    return null;
  }
}

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'غير مصرح - يجب تقديم Token' });
  }
  const decoded = verifyToken(authHeader.substring(7));
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Token غير صالح أو منتهي الصلاحية' });
  }
  req.user = decoded;
  next();
}

// ── Role Middleware ──

const requireRole = (...roles) => (req, res, next) => {
  const user = req.user || (req.session && req.session.user);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const normalizedRoles = (roles.length === 1 && Array.isArray(roles[0])) ? roles[0] : roles;
  if (!normalizedRoles.includes(user.role) && user.role !== 'admin' && user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// middleware/auth.js - يستخدم JWT فقط (بدون session) في Vercel
const requireAuth = (req, res, next) => {
  // حارس: يمنع الوصول إذا لم يكن المستخدم مسجل دخول
  const session = req.session || {};
  if (!session.user) return res.redirect('/auth/login');
  next();
};

// For API routes - JWT-first, fallback to session
const requireAuthAPI = async (req, res, next) => {
  // التحقق من JWT في Authorization header (الأولوية)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwtSecret = getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      if (decoded.requiresTwoFactor || decoded.type || decoded.purpose) {
        return res.status(401).json({ success: false, code: 'ACCESS_TOKEN_REQUIRED' });
      }
      req.user = decoded;
      
      // [[FIX]] السماح للأدمن وللتوكنات العامة من غير تعارض
      if (req.tenant && decoded.tenantId !== req.tenant.id) {
        return res.status(403).json({
          success: false,
          error: 'Token tenant mismatch — access denied',
          code: 'TENANT_MISMATCH'
        });
      }
      
      const { getModel, addTenantFilter } = require('../tenants/tenant-model-helper');
      const User = getModel(req, 'User');
      const account = await User.findOne(addTenantFilter(req, { _id: decoded.userId || decoded.id }));
      if (!account || account.status !== 'active' || Number(decoded.tokenVersion || 0) !== Number(account.tokenVersion || 0) || (account.twoFactorEnabled && !decoded.twoFactorVerified)) {
        return res.status(401).json({ success: false, code: 'SESSION_REVOKED' });
      }
      req.user = { ...decoded, userId: String(account._id), id: String(account._id), role: account.role, permissions: account.permissions || [] };
      return next();
    } catch (err) {
      console.warn('⚠️ [Auth Middleware] JWT Verify Failed:', err.message);
      return res.status(401).json({ success: false, error: 'Token invalid or expired', details: err.message });
    }
  }

  // Fallback إلى session (آمن من undefined)
  const session = req.session || {};
  if (!session.user) {
    return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول', code: 'UNAUTHORIZED' });
  }
  req.user = session.user;
  if (req.tenant && req.user.tenantId !== req.tenant.id) {
    return res.status(403).json({ success: false, code: 'TENANT_MISMATCH' });
  }
  next();
};

// Simple auth middleware (aliased to requireAuthAPI to avoid duplication)
const auth = requireAuthAPI;

const requirePermissionAPI = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول' });
    }

    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'ليس لديك صلاحية للوصول',
      message: `عذراً، لا تملك صلاحية (${permission}) المطلوبة`
    });
  };
};

/**
 * Tenant Token Validation Middleware
 * التحقق من أن التوكن يتبع لنفس المعرض (Tenant) الحالي
 * يُستخدم لمنع استخدام توكن من معرض للوصول لبيانات معرض آخر
 */
const validateTenantToken = (req, res, next) => {
  // Skip in test environment

  // If no user or no tenant, skip (other middleware handles these)
  if (!req.user || !req.tenant) {
    return next();
  }

  // Validate tenant match
  // Old tokens without tenantId are allowed (graceful handling)
  if (req.user.tenantId !== req.tenant.id) {
    return res.status(403).json({
      success: false,
      error: 'Token tenant mismatch — access denied',
      code: 'TENANT_MISMATCH'
    });
  }

  next();
};

// Require admin
const requireAdmin = (req, res, next) => {
  // دعم session آمن
  const session = req.session || {};
  if (!req.user && session.user) {
    req.user = session.user;
  }

  if (!req.user) {
    if (req.originalUrl && req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/auth/login');
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    if (req.originalUrl && req.originalUrl.startsWith('/api')) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    return res.status(403).send('Forbidden');
  }
  next();
};

module.exports = {
  // JWT helpers
  generateToken,
  verifyToken,
  authenticateJWT,
  getJwtSecret,
  // Role & permission middleware
  requireRole,
  requireAuth,
  requireAuthAPI,
  auth,
  requirePermissionAPI,
  // Tenant validation
  validateTenantToken,
  requireAdmin,
};
