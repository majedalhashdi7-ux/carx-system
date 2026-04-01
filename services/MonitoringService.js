// [[ARABIC_HEADER]] هذا الملف (services/MonitoringService.js) جزء من مشروع HM CAR
// مُحسَّن لـ Vercel Serverless - لا يشغل setInterval

const os = require('os');

// آمن من الـ Circular dependency
let loggerInstance = null;
function getLogger() {
  if (!loggerInstance) {
    try { loggerInstance = require('./LoggerService'); } catch (e) {}
  }
  return loggerInstance;
}

const IS_SERVERLESS = !!(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0 },
      responseTime: [],
      errors: [],
      lastHealthCheck: null
    };
    this.sentryEnabled = false;

    // تهيئة Sentry إذا كان مفعلاً
    this.initSentry();

    // بدء الفحوصات الدورية فقط في بيئة non-serverless
    if (!IS_SERVERLESS) {
      this.startHealthChecks();
    }
  }

  initSentry() {
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = require('@sentry/node');
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: 0.5,
        });
        this.sentryEnabled = true;
        const logger = getLogger();
        if (logger) logger.info('✅ تم تفعيل Sentry');
      } catch (err) {
        console.warn('⚠️ Sentry غير متاح:', err.message);
      }
    }
  }

  recordRequest(statusCode, duration) {
    this.metrics.requests.total++;
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }
    this.metrics.responseTime.push(duration);
    if (this.metrics.responseTime.length > 500) this.metrics.responseTime.shift();
  }

  recordError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message,
      context,
      timestamp: new Date()
    });
    if (this.metrics.errors.length > 50) this.metrics.errors.shift();

    if (this.sentryEnabled) {
      try {
        const Sentry = require('@sentry/node');
        Sentry.captureException(error, { extra: context });
      } catch (e) {}
    }

    const logger = getLogger();
    if (logger) logger.error('Error recorded', error, context);
  }

  getHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      system: this.getSystemMetrics(),
      application: this.getApplicationMetrics(),
      database: { connected: true }
    };

    const errorRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.failed / this.metrics.requests.total) * 100
      : 0;

    if (errorRate > 10) health.status = 'unhealthy';
    else if (errorRate > 5) health.status = 'degraded';

    this.metrics.lastHealthCheck = health;
    return health;
  }

  getSystemMetrics() {
    try {
      return {
        platform: os.platform(),
        cpus: os.cpus().length,
        memory: {
          total: this.formatBytes(os.totalmem()),
          free: this.formatBytes(os.freemem()),
          usagePercent: ((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2)
        }
      };
    } catch (e) {
      return { platform: 'unknown', cpus: 1, memory: {} };
    }
  }

  getApplicationMetrics() {
    return {
      nodeVersion: process.version,
      uptime: process.uptime(),
      requests: {
        ...this.metrics.requests,
        errorRate: this.metrics.requests.total > 0
          ? ((this.metrics.requests.failed / this.metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  getResponseTimeStats() {
    if (this.metrics.responseTime.length === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }
    const sorted = [...this.metrics.responseTime].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      avg: (sum / sorted.length).toFixed(2),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getRecentErrors(limit = 10) {
    return this.metrics.errors.slice(-limit).reverse();
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // فقط في non-serverless
  startHealthChecks() {
    if (IS_SERVERLESS) return;
    setInterval(() => {
      const health = this.getHealth();
      if (health.status === 'unhealthy') {
        const logger = getLogger();
        if (logger) logger.error('🚨 النظام غير مستقر!', null, { health });
      }
    }, 5 * 60 * 1000);
  }

  async checkDatabase() {
    try {
      const mongoose = require('mongoose');
      return {
        connected: mongoose.connection.readyState === 1,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  async checkRedis() {
    try {
      const cacheService = require('./CacheService');
      const testKey = 'health:check';
      await cacheService.set(testKey, 'ok', 10);
      const value = await cacheService.get(testKey);
      await cacheService.del(testKey);
      return { connected: value === 'ok', status: 'healthy' };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  async getDetailedReport() {
    return {
      health: this.getHealth(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      recentErrors: this.getRecentErrors(20)
    };
  }

  resetMetrics() {
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0 },
      responseTime: [],
      errors: [],
      lastHealthCheck: null
    };
  }
}

module.exports = new MonitoringService();
