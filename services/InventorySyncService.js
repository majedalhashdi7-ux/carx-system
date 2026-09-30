// [[ARABIC_HEADER]] خدمة المزامنة التلقائية للمخزون — InventorySyncService
// تقوم بـ: فحص السيارات المباعة في Encar وإزالتها/إخفائها تلقائياً
// + تحديث الأسعار + إحصائيات صحة المخزون

'use strict';

const CurrencyService = require('./CurrencyService');

// ─── إعدادات ───────────────────────────────────────────────────────────────────
const ENCAR_CHECK_URL = 'https://api.encar.com/search/car/list/mobile?count=true&q=(Id:{carId})';
const REQUEST_TIMEOUT = 10000;

/**
 * جلب JSON بسيط
 */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? require('https') : require('http');
        const req = lib.get(url, {
            timeout: REQUEST_TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0 HMCar/2.0',
                'Accept': 'application/json',
                'Referer': 'https://car.encar.com/',
            }
        }, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(null); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

class InventorySyncService {

    // ─── 1. فحص إذا كانت سيارة Encar لا تزال معروضة ───────────────────────────
    static async isEncarCarStillActive(encarId) {
        if (!encarId) return true; // الاحتياط — لا نحذف بدون تأكيد
        try {
            const url = `https://api.encar.com/search/car/list/mobile?count=true&q=(Id:${encarId})&sr=%7CModifiedDate%7C0%7C1`;
            const data = await fetchJson(url);
            // إذا كان Count > 0 فالسيارة لا تزال معروضة
            return (data?.Count || data?.count || 0) > 0;
        } catch {
            return true; // في حالة الخطأ نفترض أنها نشطة (لا نحذف)
        }
    }

    // ─── 2. مزامنة المخزون الكوري (إخفاء المباع) ──────────────────────────────
    static async syncEncarInventory(req, options = {}) {
        const {
            batchSize = 10,       // عدد السيارات لفحصها في المرة الواحدة
            dryRun = false,       // وضع المعاينة (لا تعديل فعلي)
            maxCars = 100,        // الحد الأقصى للفحص في كل جلسة
        } = options;

        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');

        if (!Car) return { success: false, error: 'Car model not available' };

        const tenantId = req.tenant?.id || 'hmcar';
        const startTime = Date.now();
        let checkedCount = 0;
        let hiddenCount = 0;
        let stillActiveCount = 0;
        let errorCount = 0;

        console.log(`🔄 [InventorySync] Starting Encar inventory sync (dryRun=${dryRun}, max=${maxCars})...`);

        // جلب سيارات Encar النشطة
        const encarCars = await Car.find({
            tenantId,
            source: 'encar_korea',
            isActive: true,
            isSold: false,
            externalRef: { $regex: '^encar:', $options: 'i' },
        })
        .select('_id title externalId externalRef')
        .limit(maxCars)
        .lean();

        console.log(`📊 [InventorySync] Found ${encarCars.length} Encar cars to check`);

        // فحص دُفُعات
        for (let i = 0; i < encarCars.length; i += batchSize) {
            const batch = encarCars.slice(i, i + batchSize);

            await Promise.allSettled(batch.map(async (car) => {
                try {
                    // استخراج Encar ID من externalRef أو externalId
                    const encarId = (car.externalRef || '').replace(/^encar:/i, '')
                        || (car.externalId || '').replace(/^encar-/i, '');

                    if (!encarId || encarId.length < 3) {
                        errorCount++;
                        return;
                    }

                    const isActive = await InventorySyncService.isEncarCarStillActive(encarId);
                    checkedCount++;

                    if (!isActive) {
                        console.log(`🚫 [InventorySync] Car sold/removed: ${car.title} (${encarId})`);
                        if (!dryRun) {
                            await Car.findByIdAndUpdate(car._id, {
                                $set: {
                                    isActive: false,
                                    isSold: true,
                                    soldAt: new Date(),
                                    syncNote: `تم إخفاؤها تلقائياً — غير متوفرة في Encar بتاريخ ${new Date().toLocaleDateString('ar-SA')}`,
                                    updatedAt: new Date(),
                                }
                            });
                        }
                        hiddenCount++;
                    } else {
                        stillActiveCount++;
                    }

                    // تأخير بسيط لتجنب Rate Limiting
                    await new Promise(r => setTimeout(r, 300));

                } catch (err) {
                    console.warn(`⚠️ [InventorySync] Error checking car: ${err.message}`);
                    errorCount++;
                }
            }));
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        const result = {
            success: true,
            message: dryRun
                ? `[معاينة] سيتم إخفاء ${hiddenCount} سيارة`
                : `✅ تم: إخفاء ${hiddenCount} | نشطة ${stillActiveCount} | أخطاء ${errorCount}`,
            stats: { checkedCount, hiddenCount, stillActiveCount, errorCount, duration },
            dryRun,
        };

        console.log(`✅ [InventorySync] Done in ${duration}s:`, result.stats);
        return result;
    }

    // ─── 3. تحديث أسعار المخزون بأسعار الصرف الحالية ──────────────────────────
    static async updateInventoryPrices(req, options = {}) {
        const { batchSize = 50, maxCars = 500 } = options;
        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');

        if (!Car) return { success: false, error: 'Car model not available' };

        const tenantId = req.tenant?.id || 'hmcar';
        const rates = await CurrencyService.getRates();
        const startTime = Date.now();
        let updatedCount = 0;

        console.log(`💱 [PriceSync] Updating prices with rates: 1 USD = ${rates.USD_TO_SAR} SAR | ${Math.round(rates.USD_TO_KRW)} KRW`);

        // جلب السيارات التي لديها priceKrw
        const carsWithKrw = await Car.find({
            tenantId,
            source: { $in: ['encar_korea', 'korean_import'] },
            isActive: true,
            priceKrw: { $gt: 0 },
        })
        .select('_id priceKrw priceSar priceUsd')
        .limit(maxCars)
        .lean();

        console.log(`📊 [PriceSync] Found ${carsWithKrw.length} cars with KRW price to update`);

        // تحديث دُفُعات
        for (let i = 0; i < carsWithKrw.length; i += batchSize) {
            const batch = carsWithKrw.slice(i, i + batchSize);
            const bulkOps = batch.map(car => {
                const priceKrw = car.priceKrw;
                const priceUsd = Number((priceKrw / rates.USD_TO_KRW).toFixed(2));
                const priceSar = Number((priceUsd * rates.USD_TO_SAR).toFixed(2));

                return {
                    updateOne: {
                        filter: { _id: car._id },
                        update: {
                            $set: {
                                priceUsd,
                                priceSar,
                                price: priceSar,
                                priceLastUpdated: new Date(),
                                updatedAt: new Date(),
                            }
                        }
                    }
                };
            });

            if (bulkOps.length > 0) {
                await Car.bulkWrite(bulkOps, { ordered: false });
                updatedCount += bulkOps.length;
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        const result = {
            success: true,
            message: `✅ تم تحديث أسعار ${updatedCount} سيارة بأسعار صرف حديثة`,
            stats: { updatedCount, duration, rates: { USD_TO_SAR: rates.USD_TO_SAR, USD_TO_KRW: Math.round(rates.USD_TO_KRW) } },
        };
        console.log(`✅ [PriceSync] Done in ${duration}s: Updated ${updatedCount} cars`);
        return result;
    }

    // ─── 4. إحصائيات صحة المخزون ───────────────────────────────────────────────
    static async getInventoryHealth(req) {
        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');

        if (!Car) return { success: false, error: 'Car model not available' };

        const tenantId = req.tenant?.id || 'hmcar';

        const [
            totalActive, totalSold, totalKorean, noImages,
            noPrice, duplicateFingerprints, recentlyAdded,
        ] = await Promise.allSettled([
            Car.countDocuments({ tenantId, isActive: true }),
            Car.countDocuments({ tenantId, isSold: true }),
            Car.countDocuments({ tenantId, source: { $in: ['encar_korea', 'korean_import'] }, isActive: true }),
            Car.countDocuments({ tenantId, isActive: true, $or: [{ images: { $size: 0 } }, { images: { $exists: false } }] }),
            Car.countDocuments({ tenantId, isActive: true, $or: [{ price: 0 }, { price: null }, { priceSar: 0 }] }),
            Car.aggregate([
                { $match: { tenantId, vehicleFingerprint: { $exists: true, $ne: null } } },
                { $group: { _id: '$vehicleFingerprint', count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } },
                { $count: 'duplicates' },
            ]),
            Car.countDocuments({ tenantId, isActive: true, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        ]);

        const getValue = (r) => r.status === 'fulfilled' ? (Array.isArray(r.value) ? (r.value[0]?.duplicates || 0) : r.value) : 0;

        return {
            success: true,
            health: {
                totalActive:        getValue(totalActive),
                totalSold:          getValue(totalSold),
                totalKorean:        getValue(totalKorean),
                noImages:           getValue(noImages),
                noPrice:            getValue(noPrice),
                duplicateFPs:       getValue(duplicateFingerprints),
                recentlyAdded24h:   getValue(recentlyAdded),
                checkedAt:          new Date().toISOString(),
            }
        };
    }

    // ─── 5. مزامنة شاملة (الكل في واحد) ───────────────────────────────────────
    static async runFullSync(req, options = {}) {
        const results = {};

        // 1. تحديث أسعار الصرف أولاً
        try {
            CurrencyService.invalidateCache();
            await CurrencyService.getRates();
            await CurrencyService.syncToEnv();
            results.currencyUpdate = { success: true };
            console.log('✅ [FullSync] Currency rates updated');
        } catch (e) {
            results.currencyUpdate = { success: false, error: e.message };
        }

        // 2. تحديث أسعار المخزون
        try {
            results.priceUpdate = await InventorySyncService.updateInventoryPrices(req, {
                maxCars: options.maxPriceCars || 300,
            });
        } catch (e) {
            results.priceUpdate = { success: false, error: e.message };
        }

        // 3. فحص المخزون (اختياري — مُعطَّل افتراضياً لتجنب كثرة الطلبات)
        if (options.checkSoldCars) {
            try {
                results.inventorySync = await InventorySyncService.syncEncarInventory(req, {
                    maxCars: options.maxCheckCars || 50,
                    dryRun: options.dryRun || false,
                });
            } catch (e) {
                results.inventorySync = { success: false, error: e.message };
            }
        }

        // 4. إحصائيات الصحة
        try {
            results.health = await InventorySyncService.getInventoryHealth(req);
        } catch (e) {
            results.health = { success: false, error: e.message };
        }

        return {
            success: true,
            message: '✅ تمت المزامنة الشاملة',
            results,
            syncedAt: new Date().toISOString(),
        };
    }
}

module.exports = InventorySyncService;
