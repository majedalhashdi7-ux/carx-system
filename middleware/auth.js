// [[ARABIC_HEADER]] هذا الملف (middleware/auth.js) جزء من مشروع HM CAR
// ملف موحد للمصادقة والصلاحيات - يجمع: auth, jwt, roles, adminAuth

const jwt = require('jsonwebtoken');

// ── JWT Helpers ──

function generateToken(user, tenantId = 'default') {
  const payload = {
    id: user._id,
    tenantId: tenantId,
    email: user.email,
    phone: user.phone,
    role: user.role,
    permissions: user.permissions || []
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
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
const requireAuthAPI = (req, res, next) => {
  // التحقق من JWT في Authorization header (الأولوية)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ error: 'Server configuration error', code: 'MISSING_JWT_SECRET' });
      }
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      
      // [[ARABIC_COMMENT]] التحقق من تطابق المعرض بعد فك التوكن مباشرة
      // Validate tenant match before proceeding
      if (process.env.NODE_ENV !== 'test' && process.env.TESTING !== 'true') {
        if (req.tenant && req.user.tenantId && req.user.tenantId !== req.tenant.id) {
          return res.status(403).json({
            success: false,
            error: 'Token tenant mismatch — access denied',
            code: 'TENANT_MISMATCH'
          });
        }
      }
      
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Token invalid or expired', details: err.message });
    }
  }

  // Fallback إلى session (آمن من undefined)
  const session = req.session || {};
  if (!session.user) {
    return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول', code: 'UNAUTHORIZED' });
  }
  req.user = session.user;
  next();
};

// Simple auth middleware (aliased to requireAuthAPI to avoid duplication)
const auth = requireAuthAPI;

const requirePermissionAPI = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول' });
    }

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
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
  if (process.env.NODE_ENV === 'test' || process.env.TESTING === 'true') {
    return next();
  }

  // If no user or no tenant, skip (other middleware handles these)
  if (!req.user || !req.tenant) {
    return next();
  }

  // Validate tenant match
  // Old tokens without tenantId are allowed (graceful handling)
  if (req.user.tenantId && req.user.tenantId !== req.tenant.id) {
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