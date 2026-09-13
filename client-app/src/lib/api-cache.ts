/**
 * نظام ذاكرة التخزين المؤقت للعميل (Client-side API Cache)
 * يدعم TTL ذكي حسب نوع البيانات، stale-while-revalidate، وإبطال الأنماط
 */

type CacheEntry = { data: unknown; timestamp: number; tags: string[] };

const memoryCache = new Map<string, CacheEntry>();

/** مستويات TTL حسب نوع البيانات */
export const CACHE_TTL = {
    STATIC:   60 * 60 * 1000,  // 1 ساعة  — brands, settings, public
    MEDIUM:    5 * 60 * 1000,  // 5 دقائق — cars, parts, catalog
    SHORT:     1 * 60 * 1000,  // 1 دقيقة — orders, comparisons
    REALTIME:     15 * 1000,   // 15 ثانية — live auctions, bids
} as const;

const DEFAULT_TTL = CACHE_TTL.MEDIUM;

/** يختار TTL تلقائياً بناءً على المسار */
export function getTTLForEndpoint(endpoint: string): number {
    if (/\/live-auctions|\/live\/|\/bids/.test(endpoint)) return CACHE_TTL.REALTIME;
    if (/\/orders|\/comparisons|\/notifications|\/messages/.test(endpoint)) return CACHE_TTL.SHORT;
    if (/\/settings|\/brands|\/public/.test(endpoint)) return CACHE_TTL.STATIC;
    return CACHE_TTL.MEDIUM;
}

export const apiCache = {
    set: (key: string, data: unknown, { ttl, tags = [] as string[] }: { ttl?: number; tags?: string[] } = {}) => {
        const resolvedTTL = ttl ?? getTTLForEndpoint(key);
        const expiresAt = Date.now() + resolvedTTL;
        const entry: CacheEntry = { data, timestamp: expiresAt, tags };
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
    },

    /** حجم الكاش الحالي */
    size: () => memoryCache.size,
};
