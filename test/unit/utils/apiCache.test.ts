/**
 * Unit Tests for api-cache.ts
 * اختبارات وحدة لنظام الكاش الذكي
 * Runner: Mocha + tsx
 */

import assert from 'assert';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock sessionStorage — supports Object.keys() via Proxy
let _store: Record<string, string> = {};

const sessionStorageMock = new Proxy(
    {
        getItem:    (key: string) => _store[key] ?? null,
        setItem:    (key: string, val: string) => { _store[key] = val; },
        removeItem: (key: string) => { delete _store[key]; },
        clear:      () => { _store = {}; },
        get length() { return Object.keys(_store).length; },
        key:        (i: number) => Object.keys(_store)[i] ?? null,
    },
    {
        ownKeys: () => Object.keys(_store),
        getOwnPropertyDescriptor: (_, key) => ({ value: _store[key as string], writable: true, enumerable: true, configurable: true }),
    }
);

Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });
Object.defineProperty(global, 'window', { value: global });

// Import after mocks
const { apiCache } = require('../../../client-app/src/lib/api-cache');

describe('apiCache — set & get', () => {
    beforeEach(() => {
        apiCache.clear();
    });

    it('تخزين واسترجاع القيمة قبل انتهاء TTL', () => {
        apiCache.set('/api/v2/cars', { cars: [{ id: '1' }] }, { ttl: 60000 });
        const result = apiCache.get('/api/v2/cars');
        assert.deepStrictEqual(result, { cars: [{ id: '1' }] });
    });

    it('إرجاع null بعد انتهاء TTL', () => {
        apiCache.set('/api/v2/cars', { cars: [] }, { ttl: -1 }); // انتهى فوراً
        const result = apiCache.get('/api/v2/cars');
        assert.strictEqual(result, null);
    });

    it('إرجاع null إذا لم يوجد مفتاح', () => {
        const result = apiCache.get('/api/v2/nonexistent');
        assert.strictEqual(result, null);
    });
});

describe('apiCache — invalidate', () => {
    beforeEach(() => {
        apiCache.clear();
        apiCache.set('/api/v2/cars', { cars: [] }, { ttl: 60000 });
        apiCache.set('/api/v2/cars/123', { car: {} }, { ttl: 60000 });
        apiCache.set('/api/v2/parts', { parts: [] }, { ttl: 60000 });
    });

    it('invalidate بنمط يمسح المفاتيح المطابقة فقط', () => {
        apiCache.invalidate('/api/v2/cars');
        assert.strictEqual(apiCache.get('/api/v2/cars'), null);
        assert.strictEqual(apiCache.get('/api/v2/cars/123'), null);
        // لا يمسح المسارات غير المطابقة
        assert.notStrictEqual(apiCache.get('/api/v2/parts'), null);
    });

    it('invalidate بـ RegExp', () => {
        apiCache.invalidate(/\/api\/v2\/cars/);
        assert.strictEqual(apiCache.get('/api/v2/cars'), null);
        assert.notStrictEqual(apiCache.get('/api/v2/parts'), null);
    });
});

describe('apiCache — invalidateByTag', () => {
    beforeEach(() => {
        apiCache.clear();
        apiCache.set('/api/v2/cars', { cars: [] }, { ttl: 60000, tags: ['cars', 'listings'] });
        apiCache.set('/api/v2/parts', { parts: [] }, { ttl: 60000, tags: ['parts'] });
    });

    it('يمسح المدخلات ذات التاغ المحدد فقط', () => {
        apiCache.invalidateByTag('cars');
        assert.strictEqual(apiCache.get('/api/v2/cars'), null);
        assert.notStrictEqual(apiCache.get('/api/v2/parts'), null);
    });
});

describe('apiCache — clear', () => {
    it('يمسح جميع المدخلات', () => {
        apiCache.set('/api/v2/cars', { cars: [] }, { ttl: 60000 });
        apiCache.set('/api/v2/parts', { parts: [] }, { ttl: 60000 });
        apiCache.clear();
        assert.strictEqual(apiCache.get('/api/v2/cars'), null);
        assert.strictEqual(apiCache.get('/api/v2/parts'), null);
    });
});
