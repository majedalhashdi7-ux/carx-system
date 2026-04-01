// [[ARABIC_HEADER]] هذا الملف (services/CacheService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * services/CacheService.js
 * خدمة التخزين المؤقت باستخدام Redis أو الذاكرة المؤقتة (In-Memory)
 */
const Redis = require('ioredis');

class CacheService {
    constructor() {
        if (CacheService.instance) {
            return CacheService.instance;
        }

        // Cache map for Fallback In-Memory caching (for serverless environments)
        this.memoryCache = new Map();
        this.isMemoryCacheEnabled = true;

        const redisUrl = process.env.REDIS_URL || process.env.KV_URL
            || (process.env.REDIS_HOST
                ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
                : null);

        if (!redisUrl) {
            this.redis = null;
            this.isRedisEnabled = false;
            console.log('Redis/KV is not configured. Falling back to High-Speed In-Memory Cache.');
            CacheService.instance = this;
            return;
        }

        let redisErrorLogged = false;

        try {
            this.redis = new Redis(redisUrl, {
                enableOfflineQueue: false,
                maxRetriesPerRequest: 1,
                retryStrategy: () => null,
                reconnectOnError: () => false
            });

            this.redis.on('error', (err) => {
                if (!redisErrorLogged) {
                    redisErrorLogged = true;
                    console.warn(`Redis disabled due to error, falling back to Memory Cache: ${err?.message}`);
                }
                this.isRedisEnabled = false;
                this.redis = null;
            });

            this.redis.on('connect', () => {
                console.log('Successfully connected to Redis/KV.');
                this.isRedisEnabled = true;
                this.isMemoryCacheEnabled = false; // Disable memory cache if Redis works
            });

        } catch (error) {
            console.warn(`Redis initialization failed. Using Memory Cache.`);
            this.redis = null;
            this.isRedisEnabled = false;
        }

        CacheService.instance = this;
    }

    // Helper to get from fallback memory cache
    _memoryGet(key) {
        const item = this.memoryCache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.memoryCache.delete(key);
            return null;
        }
        return item.value;
    }

    async get(key) {
        if (this.isRedisEnabled && this.redis) {
            try {
                const value = await this.redis.get(key);
                return value ? JSON.parse(value) : null;
            } catch (e) { return this._memoryGet(key); }
        } else if (this.isMemoryCacheEnabled) {
            return this._memoryGet(key);
        }
        return null;
    }

    async set(key, value, ttlInSeconds = 3600) {
        if (this.isRedisEnabled && this.redis) {
            try {
                await this.redis.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
            } catch (e) {
                // Fallback to memory
                this.memoryCache.set(key, { value, expiry: Date.now() + ttlInSeconds * 1000 });
            }
        } else if (this.isMemoryCacheEnabled) {
            this.memoryCache.set(key, { value, expiry: Date.now() + ttlInSeconds * 1000 });
        }
    }

    async del(key) {
        if (this.isRedisEnabled && this.redis) {
            try { await this.redis.del(key); } catch (e) {}
        }
        this.memoryCache.delete(key);
    }

    async delWithPattern(pattern) {
        if (this.isRedisEnabled && this.redis) {
            try {
                const stream = this.redis.scanStream({ match: pattern, count: 100 });
                stream.on('data', (keys) => {
                    if (keys.length) {
                        const pipeline = this.redis.pipeline();
                        keys.forEach((key) => pipeline.del(key));
                        pipeline.exec();
                    }
                });
                await new Promise((resolve) => stream.on('end', resolve));
            } catch (e) {}
        }
        
        if (this.isMemoryCacheEnabled) {
            // Convert Redis wildcard pattern `*` to regex for memory matching
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            for (const key of this.memoryCache.keys()) {
                if (regex.test(key)) this.memoryCache.delete(key);
            }
        }
    }

    async flushAll() {
        if (this.isRedisEnabled && this.redis) {
            try { await this.redis.flushall(); } catch (e) {}
        }
        this.memoryCache.clear();
        console.log('Cache flushed.');
    }

    async remember(key, fn, ttlInSeconds = 3600) {
        let cached = await this.get(key);
        if (cached) return cached;
        const result = await fn();
        if (result !== null && result !== undefined) await this.set(key, result, ttlInSeconds);
        return result;
    }

    async staleWhileRevalidate(key, fn, ttlInSeconds = 3600) {
        const cached = await this.get(key);
        if (cached) {
            fn().then(freshData => {
                if (freshData !== null && freshData !== undefined) this.set(key, freshData, ttlInSeconds);
            }).catch(() => {});
            return cached;
        }
        const result = await fn();
        if (result !== null && result !== undefined) await this.set(key, result, ttlInSeconds);
        return result;
    }

    async disconnect() {
        if (this.isRedisEnabled && this.redis) {
            await this.redis.quit();
            this.isRedisEnabled = false;
        }
        this.memoryCache.clear();
    }
}

module.exports = new CacheService();

