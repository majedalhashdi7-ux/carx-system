/**
 * نظام ذاكرة التخزين المؤقت للعميل (Client-side API Cache)
 * يجعل فتح وتصفح جميع الصفحات لحظياً (0ms) بحفظ واسترجاع البيانات الفوري.
 */

const memoryCache = new Map<string, { data: unknown; timestamp: number }>();
const DEFAULT_TTL = 60000; // 60 ثانية كاش بالذاكرة

export const apiCache = {
    set: (key: string, data: unknown, ttl = DEFAULT_TTL) => {
        const expiresAt = Date.now() + ttl;
        memoryCache.set(key, { data, timestamp: expiresAt });

        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem(`api_cache_${key}`, JSON.stringify({ data, timestamp: expiresAt }));
            } catch {}
        }
    },

    get: (key: string) => {
        // 1. فحص ذاكرة الرام السريعة
        const memEntry = memoryCache.get(key);
        if (memEntry) {
            if (Date.now() <= memEntry.timestamp) return memEntry.data;
            memoryCache.delete(key);
        }

        // 2. فحص sessionStorage للاسترجاع الفوري عند تحديث الصفحة
        if (typeof window !== 'undefined') {
            try {
                const stored = sessionStorage.getItem(`api_cache_${key}`);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Date.now() <= parsed.timestamp) {
                        memoryCache.set(key, parsed);
                        return parsed.data;
                    } else {
                        sessionStorage.removeItem(`api_cache_${key}`);
                    }
                }
            } catch {}
        }

        return null;
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
