/**
 * Rate Limiter Middleware
 * حماية API من الطلبات المفرطة والهجمات
 */

const rateLimit = require('express-rate-limit');

// Skip rate limiting in test environment
const skipInTest = (req, res) => {
  return process.env.NODE_ENV === 'test' || process.env.TESTING === 'true';
};

// ─── Rate Limiter عام للـ API ───
const generalLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب لكل IP
  message: {
    success: false,
    message: 'طلبات كثيرة جداً، يرجى المحاولة بعد 15 دقيقة',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// ─── Rate Limiter للـ Auth (أكثر صرامة) ───
const authLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط
  skipSuccessfulRequests: true, // لا تحسب المحاولات الناجحة
  message: {
    success: false,
    message: 'محاولات تسجيل دخول كثيرة، يرجى المحاولة بعد 15 دقيقة',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'محاولات تسجيل دخول كثيرة، يرجى المحاولة بعد 15 دقيقة',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// ─── Rate Limiter للـ API الحساسة (متوسط) ───
const strictLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 30, // 30 طلب فقط
  message: {
    success: false,
    message: 'طلبات كثيرة على هذا المورد، يرجى المحاولة لاحقاً',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'طلبات كثيرة على هذا المورد، يرجى المحاولة لاحقاً',
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// ─── Rate Limiter للـ Public API (أكثر تساهلاً) ───
const publicLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 200, // 200 طلب
  message: {
    success: false,
    message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
    code: 'PUBLIC_RATE_LIMIT_EXCEEDED'
  }
});

// ─── Rate Limiter للـ Search (متوسط) ───
const searchLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 1 * 60 * 1000, // دقيقة واحدة
  max: 20, // 20 بحث في الدقيقة
  message: {
    success: false,
    message: 'عمليات بحث كثيرة، يرجى الانتظار قليلاً',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  }
});

// ─── Rate Limiter للـ File Upload ───
const uploadLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 10, // 10 رفع ملفات في الساعة
  message: {
    success: false,
    message: 'تم تجاوز حد رفع الملفات، يرجى المحاولة لاحقاً',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  strictLimiter,
  publicLimiter,
  searchLimiter,
  uploadLimiter
};
