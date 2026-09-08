/**
 * نظام ذاكرة التخزين المؤقت للعميل (Client-side API Cache)
 * يدعم التخزين المؤقت، إبطال المسارات بناءً على الأنماط، وتحديث البيانات
 */

type CacheEntry = { data: unknown; timestamp: number; tags: string[] };

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 60000;

export const apiCache = {
    set: (key: string, data: unknown, { ttl = DEFAULT_TTL, tags = [] as string[] } = {}) => {
        const expiresAt = Date.now() + ttl;
        const entry = { data, timestamp: expiresAt, tags };
        memoryCache.set(key, entry);

        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem(`api_cache_${key}`, JSON.stringify(entry));
            } catch {}
        }
    },

    get: (key: string) => {
        const memEntry = memoryCache.get(key);
        if (memEntry) {
            if (Date.now() <= memEntry.timestamp) return memEntry.data;
            memoryCache.delete(key);
        }

        if (typeof window !== 'undefined') {
            try {
                const stored = sessionStorage.getItem(`api_cache_${key}`);
                if (stored) {
                    const parsed: CacheEntry = JSON.parse(stored);
                    if (Date.now() <= parsed.timestamp) {
                        memoryCache.set(key, parsed);
                        return parsed.data;
                    }
                    sessionStorage.removeItem(`api_cache_${key}`);
                }
            } catch {}
        }
        return null;
    },

    invalidate: (pattern: string | RegExp) => {
        const isRegex = pattern instanceof RegExp;
        for (const key of memoryCache.keys()) {
            if (isRegex ? (pattern as RegExp).test(key) : key.startsWith(pattern as string)) {
                memoryCache.delete(key);
            }
        }
        if (typeof window !== 'undefined') {
            try {
                Object.keys(sessionStorage).forEach(k => {
                    if (k.startsWith('api_cache_')) {
                        const key = k.replace('api_cache_', '');
                        if (isRegex ? (pattern as RegExp).test(key) : key.startsWith(pattern as string)) {
                            sessionStorage.removeItem(k);
                        }
                    }
                });
            } catch {}
        }
    },

    invalidateByTag: (tag: string) => {
        for (const [key, entry] of memoryCache.entries()) {
            if (entry.tags.includes(tag)) {
                memoryCache.delete(key);
                if (typeof window !== 'undefined') sessionStorage.removeItem(`api_cache_${key}`);
            }
        }
    },

    clear: () => {
        memoryCache.clear();
        if (typeof window !== 'undefined') {
            try {
                Object.keys(sessionStorage).forEach(k => {
                    if (k.startsWith('api_cache_')) sessionStorage.removeItem(k);
                });
            } catch {}
        }
    }
};
