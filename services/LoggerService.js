// [[ARABIC_HEADER]] هذا الملف (services/LoggerService.js) جزء من مشروع HM CAR

/**
 * Advanced Logging Service - مُحسَّن لـ Vercel Serverless
 * يستخدم console في Vercel (لأن filesystem محدود للقراءة فقط)
 * ويستخدم Winston مع ملفات في بيئة التطوير
 */

const IS_VERCEL = !!(process.env.VERCEL || process.env.NOW_REGION);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

let logger;

if (IS_VERCEL) {
  // ── بيئة Vercel: console فقط (لا ملفات) ──
  logger = {
    info:  (msg, meta = {}) => console.log(`[INFO] ${msg}`, Object.keys(meta).length ? meta : ''),
    warn:  (msg, meta = {}) => console.warn(`[WARN] ${msg}`, Object.keys(meta).length ? meta : ''),
    error: (msg, meta = {}) => console.error(`[ERROR] ${msg}`, Object.keys(meta).length ? meta : ''),
    debug: (msg, meta = {}) => process.env.DEBUG && console.debug(`[DEBUG] ${msg}`, meta),
    log:   (level, msg, meta = {}) => console.log(`[${level.toUpperCase()}] ${msg}`, meta),
    child: () => logger,
  };
} else {
  // ── بيئة محلية / Railway: Winston مع ملفات ──
  try {
    const winston = require('winston');
    const path = require('path');
    const fs = require('fs');

    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
        silent: IS_PRODUCTION,
      }),
    ];

    // إضافة file logging فقط إذا كان الـ DailyRotateFile متاحاً
    try {
      const DailyRotateFile = require('winston-daily-rotate-file');
      transports.push(
        new DailyRotateFile({
          filename: path.join(logsDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
        }),
        new DailyRotateFile({
          filename: path.join(logsDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        })
      );
    } catch (e) {
      // DailyRotateFile غير مثبت - استمر بدونه
    }

    logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      defaultMeta: { service: 'hm-car' },
      transports,
    });
  } catch (e) {
    // Winston غير متاح - fallback للـ console
    logger = {
      info:  (msg) => console.log(`[INFO] ${msg}`),
      warn:  (msg) => console.warn(`[WARN] ${msg}`),
      error: (msg) => console.error(`[ERROR] ${msg}`),
      debug: (msg) => console.debug(`[DEBUG] ${msg}`),
      log:   (level, msg) => console.log(`[${level}] ${msg}`),
      child: () => logger,
    };
  }
}

// ── Wrapper Class ──
class LoggerService {
  constructor() {
    this.logger = logger;
  }

  info(message, meta = {}) {
    try { this.logger.info(message, this._safe(meta)); } catch (e) { console.log('[INFO]', message); }
  }

  warn(message, meta = {}) {
    try { this.logger.warn(message, this._safe(meta)); } catch (e) { console.warn('[WARN]', message); }
  }

  error(message, error = null, meta = {}) {
    try {
      const errorMeta = {
        ...this._safe(meta),
        ...(error && { error: { message: error.message, stack: error.stack } }),
      };
      this.logger.error(message, errorMeta);
    } catch (e) { console.error('[ERROR]', message, error?.message); }
  }

  debug(message, meta = {}) {
    try { this.logger.debug(message, this._safe(meta)); } catch (e) {}
  }

  http(message, meta = {}) {
    try { this.logger.log('http', message, this._safe(meta)); } catch (e) {}
  }

  database(operation, meta = {}) {
    this.info(`DB: ${operation}`, { ...meta, category: 'database' });
  }

  audit(action, userId, meta = {}) {
    this.info(`AUDIT: ${action}`, { ...meta, userId, category: 'audit' });
  }

  security(event, meta = {}) {
    this.warn(`SECURITY: ${event}`, { ...meta, category: 'security' });
  }

  performance(metric, value, meta = {}) {
    this.info(`PERFORMANCE: ${metric}`, { ...meta, value, category: 'performance' });
  }

  log(level, message, meta = {}) {
    try { this.logger.log(level, message, this._safe(meta)); } catch (e) {}
  }

  _safe(meta) {
    try {
      return {
        ...meta,
        env: process.env.NODE_ENV || 'development',
        pid: process.pid,
      };
    } catch (e) { return {}; }
  }

  child(metadata) {
    try { return this.logger.child(metadata); } catch (e) { return this; }
  }

  get stream() {
    return { write: (message) => { this.http(message.trim()); } };
  }
}

module.exports = new LoggerService();
