// [[ARABIC_HEADER]] خدمة أسعار الصرف التلقائية - تحديث كل 6 ساعات من exchangerate-api.com
// تدعم USD/SAR/KRW/AED مع كاش في الذاكرة وقيم احتياطية من .env

'use strict';

const https = require('https');

// ─── الكاش في الذاكرة ────────────────────────────────────────────────────────
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 ساعات

// القيم الاحتياطية (من .env أو ثابتة)
function getEnvRates() {
    return {
        USD_TO_SAR: Number(process.env.USD_TO_SAR) || 3.75,
        USD_TO_KRW: Number(process.env.USD_TO_KRW) || 1350,
        USD_TO_AED: Number(process.env.USD_TO_AED) || 3.67,
        USD_TO_EUR: Number(process.env.USD_TO_EUR) || 0.92,
        USD_TO_GBP: Number(process.env.USD_TO_GBP) || 0.79,
        KRW_TO_SAR: (Number(process.env.USD_TO_SAR) || 3.75) / (Number(process.env.USD_TO_KRW) || 1350),
        KRW_TO_USD: 1 / (Number(process.env.USD_TO_KRW) || 1350),
        updatedAt: null,
        source: 'env_fallback',
    };
}

/**
 * جلب أسعار الصرف من exchangerate-api.com (مجاني، بدون مفتاح)
 */
function fetchFromAPI() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.exchangerate-api.com',
            path: '/v4/latest/USD',
            method: 'GET',
            headers: { 'Accept': 'application/json', 'User-Agent': 'HMCarSystem/2.0' },
            timeout: 8000,
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed?.rates) {
                        resolve(parsed.rates);
                    } else {
                        reject(new Error('Invalid API response'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Currency API timeout')); });
        req.end();
    });
}

class CurrencyService {
    /**
     * الحصول على أسعار الصرف (مع كاش 6 ساعات)
     */
    static async getRates() {
        const now = Date.now();

        // إرجاع الكاش إذا كان حديثاً
        if (_cache && (now - _cacheTime) < CACHE_TTL_MS) {
            return _cache;
        }

        try {
            console.log('💱 [CurrencyService] Fetching live exchange rates...');
            const rates = await fetchFromAPI();

            const usdToSar = rates.SAR || 3.75;
            const usdToKrw = rates.KRW || 1350;
            const usdToAed = rates.AED || 3.67;
            const usdToEur = rates.EUR || 0.92;
            const usdToGbp = rates.GBP || 0.79;

            _cache = {
                USD_TO_SAR: usdToSar,
                USD_TO_KRW: usdToKrw,
                USD_TO_AED: usdToAed,
                USD_TO_EUR: usdToEur,
                USD_TO_GBP: usdToGbp,
                KRW_TO_SAR: usdToSar / usdToKrw,
                KRW_TO_USD: 1 / usdToKrw,
                updatedAt: new Date().toISOString(),
                source: 'exchangerate-api.com',
            };
            _cacheTime = now;

            console.log(`✅ [CurrencyService] Rates updated: 1 USD = ${usdToSar} SAR | ${usdToKrw} KRW`);
            return _cache;

        } catch (err) {
            console.warn(`⚠️ [CurrencyService] API failed: ${err.message}. Using env/fallback rates.`);
            // استخدام قيم .env كاحتياط
            const fallback = getEnvRates();
            _cache = fallback;
            _cacheTime = now;
            return fallback;
        }
    }

    /**
     * تحويل من KRW إلى SAR
     */
    static async krwToSar(krwAmount) {
        const rates = await this.getRates();
        return Math.round((krwAmount / rates.USD_TO_KRW) * rates.USD_TO_SAR * 100) / 100;
    }

    /**
     * تحويل من SAR إلى KRW
     */
    static async sarToKrw(sarAmount) {
        const rates = await this.getRates();
        return Math.round((sarAmount / rates.USD_TO_SAR) * rates.USD_TO_KRW);
    }

    /**
     * تحويل من USD إلى SAR
     */
    static async usdToSar(usdAmount) {
        const rates = await this.getRates();
        return Math.round(usdAmount * rates.USD_TO_SAR * 100) / 100;
    }

    /**
     * تحويل سعر Encar (بوحدة 만원 = 10,000 KRW) إلى SAR و USD و KRW
     */
    static async convertEncarPrice(rawManUnit) {
        const rates = await this.getRates();
        const priceKrw = (Number(rawManUnit) || 0) * 10000;
        const priceUsd = priceKrw > 0 ? Number((priceKrw / rates.USD_TO_KRW).toFixed(2)) : 0;
        const priceSar = Number((priceUsd * rates.USD_TO_SAR).toFixed(2));
        return { priceKrw, priceUsd, priceSar };
    }

    /**
     * إبطال الكاش وإجبار تحديث فوري في المرة القادمة
     */
    static invalidateCache() {
        _cache = null;
        _cacheTime = 0;
        console.log('🔄 [CurrencyService] Cache invalidated.');
    }

    /**
     * الحصول على الكاش الحالي بدون جلب (لأغراض المراقبة)
     */
    static getCachedRates() {
        return _cache;
    }

    /**
     * تحديث متغيرات البيئة بأسعار الصرف الحالية (اختياري)
     */
    static async syncToEnv() {
        try {
            const rates = await this.getRates();
            process.env.USD_TO_SAR = String(rates.USD_TO_SAR);
            process.env.USD_TO_KRW = String(Math.round(rates.USD_TO_KRW));
            process.env.USD_TO_AED = String(rates.USD_TO_AED);
            console.log(`✅ [CurrencyService] ENV updated: USD_TO_SAR=${rates.USD_TO_SAR}, USD_TO_KRW=${rates.USD_TO_KRW}`);
        } catch (e) {
            console.warn('[CurrencyService] syncToEnv failed:', e.message);
        }
    }
}

module.exports = CurrencyService;
