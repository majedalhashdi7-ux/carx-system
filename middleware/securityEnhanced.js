// [[ARABIC_HEADER]] هذا الملف (middleware/securityEnhanced.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * middleware/securityEnhanced.js
 * ميدلوير الأمان المحسن
 * 
 * الميزات:
 * - حماية متقدمة من هجمات الـ Brute Force
 * - كشف الأنشطة المشبوهة
 * - تسجيل محاولات الاختراق
 * - حماية من الـ SQL/NoSQL Injection
 */

const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

/**
 * تخزين مؤقت لتتبع المحاولات المشبوهة
 * 
 * ⚠️ تحذير Serverless: في بيئة Vercel Serverless تُعاد تهيئة هذه المتغيرات
 * مع كل invocation جديد. لحماية فعلية في الإنتاج استخدم Redis (Upstash).
 * للبيئة المحلية والـ VPS هذا يعمل بشكل صحيح تماماً.
 */
const suspiciousAttempts = new Map();
const blockedIPs = new Set();

// في بيئة Serverless (Vercel) المتغيرات العالمية لا تُحفظ بين الطلبات
// هذا التحذير يذكّر المطور بالقيود
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
if (IS_SERVERLESS) {
  // يمكن هنا لاحقاً ربط Redis للحماية الحقيقية في الإنتاج
  // const redis = require('ioredis'); const client = new redis(process.env.REDIS_URL);
}

// [[ARABIC_COMMENT]] تنظيف دوري لتجنب تسرب الذاكرة في بيئة Non-Serverless
const CLEANUP_INTERVAL = 60 * 60 * 1000; // ساعة واحدة
const MAX_ENTRY_AGE = 2 * 60 * 60 * 1000; // ساعتان
// لا ننشئ setInterval في Serverless لأنها لن تعمل
if (!IS_SERVERLESS) {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of suspiciousAttempts) {
      if (now - (data.lastAttempt || 0) > MAX_ENTRY_AGE) {
        suspiciousAttempts.delete(ip);
      }
    }
    // الحفاظ على حجم blockedIPs معقول (أقصى 1000 عنوان)
    if (blockedIPs.size > 1000) {
      const toRemove = blockedIPs.size - 500;
      const iterator = blockedIPs.values();
      for (let i = 0; i < toRemove; i++) {
        blockedIPs.delete(iterator.next().value);
      }
    }
  }, CLEANUP_INTERVAL);
}

/**
 * تنظيف IP متعدد (proxy)
 */
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
};

/**
 * تسجيل نشاط مشبوه
 */
const logSuspiciousActivity = (req, reason, severity = 'medium') => {
  const ip = getClientIP(req);
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  const logEntry = {
    timestamp,
    ip,
    method: req.method,
    path: req.path,
    userAgent,
    reason,
    severity,
    body: severity === 'high' ? JSON.stringify(req.body).substring(0, 500) : undefined
  };
  
  console.warn(`⚠️ [SECURITY] ${severity.toUpperCase()}: ${reason}`, logEntry);
  
  // تحديث سجل المحاولات المشبوهة
  const attempts = suspiciousAttempts.get(ip) || { count: 0, firstAttempt: Date.now() };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  attempts.reasons = attempts.reasons || [];
  attempts.reasons.push(reason);
  suspiciousAttempts.set(ip, attempts);
  
  // حظر تلقائي بعد عدد معين من المحاولات
  if (attempts.count >= 10) {
    blockedIPs.add(ip);
    console.error(`🚫 [SECURITY] IP ${ip} has been auto-blocked after ${attempts.count} suspicious attempts`);
  }
};

/**
 * التحقق من IP محظور
 */
const checkBlockedIP = (req, res, next) => {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test' || process.env.TESTING === 'true') {
    return next();
  }
  
  const ip = getClientIP(req);
  
  if (blockedIPs.has(ip)) {
    console.warn(`🚫 [SECURITY] Blocked IP attempted access: ${ip}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Your IP has been temporarily blocked due to suspicious activity'
    });
  }
  
  next();
};

/**
 * كشف محاولات الحقن
 */
const detectInjection = (req, res, next) => {
  const suspicious = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b\s+(FROM|INTO|TABLE|SET|WHERE|DATABASE))/i,
    /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/i,
    /(--\s|#\s|\/\*.*\*\/)/,
    /(\bEXEC(UTE)?\b\s+\w)/i,
    
    // NoSQL Injection patterns
    /\$where/i,
    /\{\s*\$\w+/,
    
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript\s*:/i,
    /on(error|load|click|mouseover|focus|blur)\s*=/i,
    /data:\s*text\/html/i,
    
    // Path traversal
    /\.\.[\/\\]{2,}/,
    
    // Command injection - أكثر دقة: نفحص أوامر شل حقيقية فقط
    // لا نحظر & و $ لأنها تُستخدم في أوصاف السيارات والأسعار
    /[`]/, // backtick فقط - خطير دائماً
    /\b(whoami|wget|chmod|chown|passwd|sudo|su\s)\b/i
  ];
  
  const checkValue = (value, location) => {
    if (typeof value !== 'string') return;
    
    for (const pattern of suspicious) {
      if (pattern.test(value)) {
        logSuspiciousActivity(req, `Potential injection detected in ${location}: ${pattern}`, 'high');
        return true;
      }
    }
    return false;
  };
  
  const checkObject = (obj, location, depth = 0) => {
    // [[ARABIC_COMMENT]] حد أقصى للعمق لتجنب Stack Overflow
    if (!obj || typeof obj !== 'object' || depth > 5) return false;
    
    for (const [key, value] of Object.entries(obj)) {
      // تخطي فحص النصوص المسموح للزوار كتابتها لتجنب حظرهم
      if (['message', 'note', 'notes', 'description', 'details', 'comment', 'content', 'title', 'reason', 'address'].includes(key.toLowerCase())) {
          continue;
      }
      
      // تحقق من اسم المفتاح أيضاً
      if (checkValue(key, `${location}.key`)) return true;
      
      if (typeof value === 'string') {
        if (checkValue(value, `${location}.${key}`)) return true;
      } else if (typeof value === 'object' && value !== null) {
        if (checkObject(value, `${location}.${key}`, depth + 1)) return true;
      }
    }
    return false;
  };
  
  // فحص الـ body
  if (checkObject(req.body, 'body')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }
  
  // فحص الـ query
  if (checkObject(req.query, 'query')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }
  
  // فحص الـ params
  if (checkObject(req.params, 'params')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }
  
  next();
};

/**
 * Rate Limiter للمصادقة
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // تم الرفع إلى 10 محاولات لتقليل حظر المستخدمين بالخطأ
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logSuspiciousActivity(req, 'Rate limit exceeded for authentication', 'high');
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // استخدام IP + Device ID للتعريف
    return `${getClientIP(req)}_${req.deviceId || 'unknown'}`;
  }
});

/**
 * Rate Limiter للمزايدات
 */
const bidRateLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 10, // 10 مزايدات في الدقيقة
  message: {
    success: false,
    error: 'Too many bids',
    message: 'Please slow down',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter للـ API
 */
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة
  max: 60, // 60 طلب في الدقيقة
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Too many requests',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter للبحث
 */
const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: 'Too many search requests',
    retryAfter: '1 minute'
  }
});

/**
 * التحقق من User Agent
 */
const validateUserAgent = (req, res, next) => {
  const userAgent = req.headers['user-agent'];
  
  // حظر طلبات بدون User Agent
  if (!userAgent) {
    logSuspiciousActivity(req, 'Request without User-Agent', 'low');
    // السماح ولكن مع تسجيل
  }
  
  // كشف البوتات المشبوهة
  const suspiciousBots = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /dirbuster/i,
    /gobuster/i,
    /wpscan/i,
    /burp/i,
    /zap/i,
    /acunetix/i
  ];
  
  if (userAgent && suspiciousBots.some(bot => bot.test(userAgent))) {
    logSuspiciousActivity(req, `Suspicious bot detected: ${userAgent}`, 'high');
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  next();
};

/**
 * حماية CSRF محسنة
 */
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;
  
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        // [[ARABIC_COMMENT]] السماح بالنطاقات التابعة للمشروع (Whitelisting)
        const isWhitelisted = 
          originHost.endsWith('okigo.net') || 
          originHost.endsWith('.vercel.app') || 
          originHost.includes('localhost') ||
          originHost.includes('127.0.0.1');

        if (!isWhitelisted) {
          logSuspiciousActivity(req, `CSRF caution: Origin mismatch (${originHost} vs ${host})`, 'medium');
          // لا نحظر العمليات حالياً لمنع مشاكل الـ Custom Domains، نكتفي بالتسجيل
        }
      }
    } catch (e) {
      console.warn('Invalid origin header:', origin);
    }
  }
  
  next();
};

/**
 * إضافة headers الأمان
 */
const securityHeaders = (req, res, next) => {
  // إضافة Request ID للتتبع
  const requestId = crypto.randomBytes(8).toString('hex');
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Headers أمان إضافية
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // [[ARABIC_COMMENT]] لا نضع no-store على مسارات GET العامة لأن ذلك يبطل كاش المتصفح
  // فقط نضعه على العمليات الحساسة (POST/PUT/PATCH/DELETE) والمسارات الخاصة
  const isPublicGet = req.method === 'GET' && (
    req.path.includes('/public') ||
    req.path.includes('/settings') ||
    req.path.includes('/brands') ||
    req.path.includes('/cars') ||
    req.path.includes('/parts') ||
    req.path.includes('/showroom')
  );
  
  if (isPublicGet) {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  } else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * تنظيف الـ query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // [[ARABIC_COMMENT]] تنظيف المدخلات مع الحفاظ على الأحرف العربية والمسافات والنقاط
        // سمحنا بـ ' و - لاستخدامهما في أسماء الموديلات والقطع
        req.query[key] = value
          .replace(/[<>"\\;]/g, '') // إزالة الأحرف الخطيرة جداً فقط
          .substring(0, 1000); 
      }
    }
  }
  next();
};

/**
 * مجموعة ميدلوير الأمان الكاملة
 */
const fullSecurityMiddleware = [
  checkBlockedIP,
  securityHeaders,
  validateUserAgent,
  sanitizeQuery,
  detectInjection
];

/**
 * تصدير جميع الميدلوير
 */
module.exports = {
  checkBlockedIP,
  detectInjection,
  authRateLimiter,
  bidRateLimiter,
  apiRateLimiter,
  searchRateLimiter,
  validateUserAgent,
  csrfProtection,
  securityHeaders,
  sanitizeQuery,
  fullSecurityMiddleware,
  logSuspiciousActivity,
  getClientIP,
  // للاختبار والإدارة
  blockedIPs,
  suspiciousAttempts
};
