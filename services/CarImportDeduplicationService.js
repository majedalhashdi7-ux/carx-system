// [[ARABIC_HEADER]] خدمة كشف التكرار المتطور (Fingerprint) — CarImportDeduplicationService
// تستخدم بصمة متعددة المعايير لمنع الاستيراد المكرر للسيارات
// المعايير: encarId + make_model_year_mileage_color + VIN + imageHash

'use strict';

const crypto = require('crypto');

/**
 * توليد بصمة (Fingerprint) فريدة لسيارة من بياناتها الخام
 * @param {object} carData بيانات السيارة الخام
 * @returns {object} كائن الفريمبرنت
 */
function generateCarFingerprint(carData) {
    const make  = String(carData.make  || carData.makeEn  || carData.manufacturer || '').toLowerCase().trim();
    const model = String(carData.model || carData.modelEn || '').toLowerCase().trim().replace(/\s+/g, '_');
    const year  = parseInt(carData.year)  || 0;
    const mileageRounded = Math.round((parseInt(carData.mileage) || 0) / 500) * 500; // تقريب لـ 500 كم
    const color = String(carData.color || carData.colorEn || '').toLowerCase().trim().split(' ')[0]; // أول كلمة فقط

    // ─── بصمة المركبة (Vehicle Signature) ────────────────────────────────────
    const vehicleSignature = `${make}::${model}::${year}::${mileageRounded}`;

    // ─── هاش MD5 للبصمة ──────────────────────────────────────────────────────
    const fingerprintHash = crypto.createHash('md5').update(vehicleSignature).digest('hex');

    // ─── هاش البصمة الكاملة (مع اللون والمصدر) ───────────────────────────────
    const fullSignature = `${vehicleSignature}::${color}`;
    const fullFingerprintHash = crypto.createHash('md5').update(fullSignature).digest('hex');

    // ─── هاش الصورة الأولى (إن وُجدت) ───────────────────────────────────────
    let imageHash = null;
    const firstImage = (carData.images || [])[0] || carData.imageUrl || carData.mainImage || '';
    if (firstImage && typeof firstImage === 'string') {
        // نستخدم آخر جزء من المسار كـ fingerprint (رقم/اسم فريد)
        const imgPart = firstImage.split('/').pop()?.split('?')[0] || '';
        if (imgPart.length > 4) {
            imageHash = crypto.createHash('md5').update(imgPart).digest('hex');
        }
    }

    return {
        // المعرّفات الخارجية
        externalId: carData.externalId || carData.encarId || null,
        vin: (carData.vin || carData.specs?.vin || '').trim().toUpperCase() || null,

        // البصمة الأساسية (make + model + year + mileage مقرّب)
        vehicleFingerprint: fingerprintHash,

        // البصمة الكاملة (مع اللون)
        fullFingerprint: fullFingerprintHash,

        // هاش الصورة
        imageHash,

        // البيانات الخام للتشخيص
        _debug: { make, model, year, mileageRounded, color, vehicleSignature },
    };
}

/**
 * البحث عن سيارة مكررة في قاعدة البيانات
 * @param {Model} CarModel نموذج Mongoose للسيارات
 * @param {object} fingerprint البصمة المُولَّدة من generateCarFingerprint
 * @param {string} tenantId معرّف المستأجر
 * @returns {Promise<{found: boolean, car: object|null, matchedBy: string|null}>}
 */
async function findDuplicate(CarModel, fingerprint, tenantId) {
    if (!CarModel) return { found: false, car: null, matchedBy: null };

    const conditions = [];

    // 1. مطابقة بالمعرّف الخارجي (أقوى مطابقة)
    if (fingerprint.externalId) {
        conditions.push({ externalId: fingerprint.externalId, tenantId });
    }

    // 2. مطابقة بـ VIN (رقم الهيكل — دقيق جداً)
    if (fingerprint.vin && fingerprint.vin.length >= 8) {
        conditions.push({
            $or: [
                { 'specs.vin': fingerprint.vin },
                { vin: fingerprint.vin },
            ],
            tenantId,
        });
    }

    // 3. مطابقة بالبصمة الأساسية (make + model + year + mileage مقرّب)
    if (fingerprint.vehicleFingerprint) {
        conditions.push({ vehicleFingerprint: fingerprint.vehicleFingerprint, tenantId });
    }

    // 4. مطابقة بالبصمة الكاملة (مع اللون)
    if (fingerprint.fullFingerprint) {
        conditions.push({ fullFingerprint: fingerprint.fullFingerprint, tenantId });
    }

    // 5. مطابقة بهاش الصورة الأولى
    if (fingerprint.imageHash) {
        conditions.push({ imageHash: fingerprint.imageHash, tenantId });
    }

    if (conditions.length === 0) return { found: false, car: null, matchedBy: null };

    // البحث بأي معيار
    for (const cond of conditions) {
        try {
            const car = await CarModel.findOne(cond).lean();
            if (car) {
                // تحديد السبب
                let matchedBy = 'unknown';
                if (cond.externalId)             matchedBy = 'externalId';
                else if (cond['specs.vin'])       matchedBy = 'VIN';
                else if (cond.vehicleFingerprint) matchedBy = 'vehicleFingerprint';
                else if (cond.fullFingerprint)    matchedBy = 'fullFingerprint';
                else if (cond.imageHash)          matchedBy = 'imageHash';

                return { found: true, car, matchedBy };
            }
        } catch {}
    }

    return { found: false, car: null, matchedBy: null };
}

/**
 * حفظ البصمة على كائن السيارة قبل الحفظ في DB
 * @param {object} carData كائن البيانات (للـ $set)
 * @param {object} fingerprint البصمة
 * @returns {object} carData مُحدَّثة
 */
function applyFingerprintToCarData(carData, fingerprint) {
    return {
        ...carData,
        vehicleFingerprint: fingerprint.vehicleFingerprint,
        fullFingerprint:    fingerprint.fullFingerprint,
        imageHash:          fingerprint.imageHash || undefined,
        // VIN إذا كان موجوداً في البيانات
        ...(fingerprint.vin ? { vin: fingerprint.vin } : {}),
    };
}

/**
 * فحص سريع بـ externalId فقط (للأداء العالي)
 * @returns {Promise<boolean>}
 */
async function existsByExternalId(CarModel, externalId, tenantId) {
    if (!externalId || !CarModel) return false;
    try {
        const doc = await CarModel.findOne({ externalId, tenantId }).select('_id').lean();
        return !!doc;
    } catch {
        return false;
    }
}

/**
 * دمج نتائج الكشف عن التكرار في رسالة قابلة للقراءة
 */
function describeDuplicate(result) {
    if (!result.found) return 'لا يوجد تكرار';
    const names = {
        externalId:          'المعرّف الخارجي (Encar ID)',
        VIN:                 'رقم الهيكل (VIN)',
        vehicleFingerprint:  'بصمة المركبة (ماركة + موديل + سنة + مسافة)',
        fullFingerprint:     'البصمة الكاملة (مع اللون)',
        imageHash:           'بصمة الصورة',
        unknown:             'معيار غير محدد',
    };
    return `سيارة مكررة — تم الكشف بـ: ${names[result.matchedBy] || result.matchedBy}`;
}

module.exports = {
    generateCarFingerprint,
    findDuplicate,
    applyFingerprintToCarData,
    existsByExternalId,
    describeDuplicate,
};
