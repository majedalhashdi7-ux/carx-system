const cacheService = require('../services/CacheService');

// كاش المحلي فائق السرعة بالذاكرة المؤقتة (Node.js Memory Cache)
const localMemoryCache = new Map();
const MAX_LOCAL_CACHE_ITEMS = 500;

function setLocalCache(key, value, ttlSeconds) {
    if (localMemoryCache.size > MAX_LOCAL_CACHE_ITEMS) {
        const firstKey = localMemoryCache.keys().next().value;
        if (firstKey) localMemoryCache.delete(firstKey);
    }
    localMemoryCache.set(key, {
        data: value,
        expiresAt: Date.now() + (ttlSeconds * 1000)
    });
}

function getLocalCache(key) {
    const item = localMemoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        localMemoryCache.delete(key);
        return null;
    }
    return item.data;
}

function clearLocalCache() {
    localMemoryCache.clear();
}

/**
 * Generates a cache key based on the request URL and query parameters.
 */
const generateCacheKey = (req) => {
    const url = req.originalUrl.split('?')[0];
    const query = Object.keys(req.query)
        .sort()
        .map(key => `${key}=${req.query[key]}`)
        .join('&');
    const tenantId = req.tenant?.id || 'default';
    return `route:${tenantId}:${req.method}:${url}${query ? '?' + query : ''}`;
};

/**
 * Middleware to cache responses for GET requests with 0ms in-memory delivery & CDN caching.
 */
const cacheResponse = (ttlInSeconds = 60) => {
    return async (req, res, next) => {
        if (req.method !== 'GET' || req.query.nocache === 'true' || req.query.status === 'all') {
            return next();
        }

        // إضافة ترويسات Vercel CDN Cache لسرعة التحميل من أقرب سيرفر للمستخدم
        res.setHeader('Cache-Control', `public, s-maxage=${ttlInSeconds}, stale-while-revalidate=${ttlInSeconds * 2}`);

        const key = generateCacheKey(req);

        // 1. التحقق من كاش الذاكرة المحلية أولاً (أسرع من السيرفر - أقل من 1ms)
        const localHit = getLocalCache(key);
        if (localHit) {
            res.set('X-Cache', 'MEMORY-HIT');
            return res.status(localHit.status || 200).json(localHit.body);
        }

        // 2. التحقق من Redis إن كان مفعلاً
        if (cacheService.isRedisEnabled) {
            try {
                const cachedData = await cacheService.get(key);
                if (cachedData) {
                    setLocalCache(key, cachedData, ttlInSeconds);
                    res.set('X-Cache', 'REDIS-HIT');
                    return res.status(cachedData.status).json(cachedData.body);
                }
            } catch (err) {
                console.error('Redis cache lookup error:', err);
            }
        }

        // 3. التقاط استجابة JSON وحفظها في الكاش تلقائياً
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300 && body) {
                const cachePayload = { status: res.statusCode, body };
                setLocalCache(key, cachePayload, ttlInSeconds);
                if (cacheService.isRedisEnabled) {
                    cacheService.set(key, cachePayload, ttlInSeconds).catch(() => {});
                }
            }
            return originalJson(body);
        };

        res.set('X-Cache', 'MISS');
        next();
    };
};

/**
 * Middleware to automatically invalidate cache based on request method.
 * @param {string|string[]} patterns - A glob pattern or array of patterns to invalidate.
 *                                     Example: '/api/cars*' or ['/api/cars/:id', '/api/auctions*']
 * @returns {Function} The middleware function.
 */
const invalidateCache = (patterns) => {
    return async (req, res, next) => {
        const methodsToInvalidate = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!methodsToInvalidate.includes(req.method) || !cacheService.isRedisEnabled) {
            return next();
        }

        // Invalidate after the request is successfully handled
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                clearLocalCache(); // Instant local memory cache wipe
                const patternsToClear = Array.isArray(patterns) ? patterns : [patterns];
                // إضافة معرف المعرض للـ pattern لضمان حذف الكاش الخاص بهذا المعرض فقط
                const tenantId = req.tenant?.id || 'default';
                patternsToClear.forEach(pattern => {
                    // Construct a pattern that matches the route cache format with tenant scope
                    const searchPattern = `route:${tenantId}:GET:${pattern}`;
                    cacheService.delWithPattern(searchPattern).catch(err => {
                        console.error(`Cache invalidation error for pattern [${searchPattern}]:`, err);
                    });
                });
            }
        });

        next();
    };
};

module.exports = {
    cacheResponse,
    invalidateCache,
    generateCacheKey
};
