/**
 * Unit Tests for api-cache.ts
 * اختبارات وحدة لنظام الكاش الذكي
 */

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, val: string) => { store[key] = val; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i: number) => Object.keys(store)[i] || null,
    };
})();

Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });
Object.defineProperty(global, 'window', { value: global });

// Import after mocks
const { apiCache } = require('../../../client-app/src/lib/api-cache');

describe('apiCache — set & get', () => {
    beforeEach(() => {
        apiCache.clear();
    });

    test('تخزين واسترجاع القيمة قبل انتهاء TTL', () => {
        apiCache.set('/api/v2/cars', { cars: [{ id: '1' }] }, { ttl: 60000 });
        const result = apiCache.get('/api/v2/cars');
        expect(result).toEqual({ cars: [{ id: '1' }] });
    });

    test('إرجاع null بعد انتهاء TTL', () => {
        apiCache.set('/api/v2/cars', { cars: [] }, { ttl: -1 }); // انتهى فوراً
        const result = apiCache.get('/api/v2/cars');
        expect(result).toBeNull();
    });

    test('إرجاع null إذا لم يوجد مفتاح', () => {
        const result = apiCache.get('/api/v2/nonexistent');
        expect(result).toBeNull();
    });
});

describe('apiCache — invalidate', () => {
    beforeEach(() => {
        apiCache.clear();
        apiCache.set('/api/v2/cars', { cars: [] }, { ttl: 60000 });
        apiCache.set('/api/v2/cars/123', { car: {} }, { ttl: 60000 });
        apiCache.set('/api/v2/parts', { parts: [] }, { ttl: 60000 });
    });

    test('invalidate بنمط يمسح المفاتيح المطابقة فقط', () => {
        apiCache.invalidate('/api/v2/cars');
        expect(apiCache.get('/api/v2/cars')).toBeNull();
        expect(apiCache.get('/api/v2/cars/123')).toBeNull();
        // لا يمسح المسارات غير المطابقة
        expect(apiCache.get('/api/v2/parts')).not.toBeNull();
    });

    test('invalidate بـ RegExp', () => {
        apiCache.invalidate(/\/api\/v2\/cars/);
        expect(apiCache.get('/api/v2/cars')).toBeNull();
        expect(apiCache.get('/api/v2/parts')).not.toBeNull();
    });
});

describe('apiCache — invalidateByTag', () => {
    beforeEach(() => {
        apiCache.clear();
        apiCache.set('/api/v2/cars', { cars: [] }, { ttl: 60000, tags: ['cars', 'listings'] });
        apiCache.set('/api/v2/parts', { parts: [] }, { ttl: 60000, tags: ['parts'] });
    });

    test('يمسح المدخلات ذات التاغ المحدد فقط', () => {
        apiCache.invalidateByTag('cars');
        expect(apiCache.get('/api/v2/cars')).toBeNull();
        expect(apiCache.get('/api/v2/parts')).not.toBeNull();
    });
});

describe('apiCache — clear', () => {
    test('يمسح جميع المدخلات', () => {
        apiCache.set('/api/v2/cars', { cars: [] }, { ttl: 60000 });
        apiCache.set('/api/v2/parts', { parts: [] }, { ttl: 60000 });
        apiCache.clear();
        expect(apiCache.get('/api/v2/cars')).toBeNull();
        expect(apiCache.get('/api/v2/parts')).toBeNull();
    });
});
