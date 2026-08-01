// [[ARABIC_HEADER]] خدمة مزامنة جذرية - تصلح كل البيانات القديمة والحالية
// تُطبّق: ترجمة الكوري، علامة مائية HM CAR، حذف الروابط الخارجية، تحديث الصور المحلية

const KoreanTranslationService = require('./KoreanTranslationService');
const WatermarkService = require('./WatermarkService');
const { downloadAndOptimize } = require('./externalImageService');

/**
 * تحديد نوع رابط الصورة
 */
function isExternalImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const external = [
        'encar.com', 'ci.encar.com', 'carpicture', 'autospare',
        'auction.co.kr', '.kr/', 'korean', 'naver.net', 'kakao.com'
    ];
    return url.startsWith('http') && external.some(d => url.includes(d));
}

function isInternalOrCloudUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('/uploads/') ||
        url.startsWith('/api/') ||
        url.includes('res.cloudinary.com') ||
        url.includes('vercel.app') ||
        url.includes('hmcar');
}

function alreadyHasWatermark(url) {
    if (!url || typeof url !== 'string') return false;
    return url.includes('watermark=true') ||
        url.includes('l_text:') ||
        url.includes('image-proxy');
}

/**
 * معالجة صورة واحدة - تحميل إذا خارجية + علامة مائية
 */
async function processOneImage(url, folder = 'showroom') {
    if (!url || typeof url !== 'string') return null;

    // الصورة داخلية أو Cloudinary - فقط أضف علامة مائية إذا لم تكن موجودة
    if (isInternalOrCloudUrl(url)) {
        return alreadyHasWatermark(url) ? url : WatermarkService.applyWatermark(url);
    }

    // رابط خارجي (Encar وغيره) - حمّل وضغط واختم
    if (url.startsWith('http')) {
        try {
            const local = await downloadAndOptimize(url, folder, {
                width: 1200, height: 800, quality: 80
            });
            if (local && local !== url) {
                return alreadyHasWatermark(local) ? local : WatermarkService.applyWatermark(local);
            }
        } catch (e) {
            console.warn(`⚠️ [RetroSync] Image download failed: ${e.message}`);
        }
        // احتياط: استخدم proxy مع علامة مائية
        return WatermarkService.applyWatermark(url);
    }

    return url;
}

/**
 * معالجة قائمة صور
 */
async function processImages(images = [], folder = 'showroom') {
    if (!Array.isArray(images) || images.length === 0) return [];
    const results = await Promise.allSettled(
        images.slice(0, 20).map(img => processOneImage(img, folder))
    );
    return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
}

/**
 * تحديث سيارة واحدة - تنظيف + علامة مائية + تصحيح الروابط
 */
async function fixOneCar(car) {
    const updates = {};
    let needsUpdate = false;

    // ─── تنظيف النصوص الكورية ──────────────────────────────────────────
    const fields = [
        ['title', 'titleAr'],
        ['make', 'makeAr'],
        ['model', 'modelAr'],
        ['fuelType', 'fuelType'],
        ['color', 'color'],
        ['description', 'description'],
    ];

    for (const [field, arField] of fields) {
        const val = car[field] || car[arField];
        if (val && KoreanTranslationService.hasKoreanText(val)) {
            updates[arField] = KoreanTranslationService.cleanAndTranslate(val);
            if (field !== arField) updates[field] = updates[arField];
            needsUpdate = true;
        }
    }

    // تنظيف الحقول الإنجليزية
    const enFields = ['titleEn', 'makeEn', 'modelEn', 'descriptionEn'];
    for (const field of enFields) {
        const val = car[field];
        if (val && KoreanTranslationService.hasKoreanText(val)) {
            updates[field] = KoreanTranslationService.translateToEnglish(val);
            needsUpdate = true;
        }
    }

    // ─── إزالة externalUrl من السيارات (المشكلة الرئيسية!) ─────────────
    if (car.externalUrl && (
        car.externalUrl.includes('encar.com') ||
        car.externalUrl.includes('.co.kr') ||
        car.externalUrl.includes('autospare')
    )) {
        // تحويل إلى مرجع داخلي فقط (لا رابط قابل للنقر)
        updates.externalRef = car.externalUrl;
        updates.externalUrl = ''; // مسح الرابط الخارجي
        needsUpdate = true;
    }

    // ─── معالجة الصور ──────────────────────────────────────────────────
    const allImages = [...(car.images || []), car.image, car.mainImage, car.imageUrl]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i); // إزالة التكرار

    const hasExternalImages = allImages.some(isExternalImageUrl);
    const hasUnwatermarked = allImages.some(img => !alreadyHasWatermark(img) && isInternalOrCloudUrl(img));

    if (hasExternalImages || hasUnwatermarked) {
        const processed = await processImages(allImages, 'showroom');
        if (processed.length > 0) {
            updates.images = processed;
            updates.image = processed[0];
            updates.mainImage = processed[0];
            updates.imageUrl = processed[0];
            needsUpdate = true;
        }
    }

    // ─── تأكيد listingType صحيح للسيارات المستوردة ───────────────────
    if (!car.listingType && (car.source === 'korean_import' || car.source === 'encar_korea')) {
        updates.listingType = 'showroom';
        needsUpdate = true;
    }

    // ─── إنشاء specs إذا لم يكن موجوداً ──────────────────────────────
    if (!car.specs || Object.keys(car.specs).length === 0) {
        updates.specs = {
            manufacturer_ar: updates.makeAr || car.makeAr || car.make || 'غير محدد',
            manufacturer_en: updates.makeEn || car.makeEn || car.make || 'Unknown',
            model_ar: updates.modelAr || car.modelAr || car.model || 'غير محدد',
            model_en: updates.modelEn || car.modelEn || car.model || 'Unknown',
            year: car.year || new Date().getFullYear(),
            mileage: car.mileage || 0,
            fuelType_ar: updates.fuelType || car.fuelType || 'بنزين',
            fuelType_en: car.fuelTypeEn || 'Gasoline',
            source: car.source || 'encar_korea',
            importedAt: car.createdAt || new Date(),
        };
        needsUpdate = true;
    }

    return { needsUpdate, updates };
}

class RetroactiveSyncService {
    /**
     * مزامنة جذرية شاملة لجميع البيانات في قاعدة البيانات
     * - إزالة الروابط الخارجية
     * - تنظيف النصوص الكورية
     * - تطبيق علامة مائية HM CAR على كل الصور
     * - تصحيح الحقول المفقودة
     */
    static async runFullRetroactiveSync(req, options = {}) {
        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');
        const batchSize = options.batchSize || 20;

        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalErrors = 0;

        console.log('🔄 [RetroSync] Starting full retroactive sync...');

        try {
            const totalCars = await Car.countDocuments({ tenantId: req.tenantId || 'default' });
            console.log(`📊 [RetroSync] Total cars to process: ${totalCars}`);

            // معالجة على دفعات لتفادي timeout
            let skip = 0;
            while (skip < totalCars) {
                const batch = await Car.find({ tenantId: req.tenantId || 'default' })
                    .skip(skip)
                    .limit(batchSize)
                    .lean();

                if (batch.length === 0) break;

                for (const car of batch) {
                    totalProcessed++;
                    try {
                        const { needsUpdate, updates } = await fixOneCar(car);
                        if (needsUpdate && Object.keys(updates).length > 0) {
                            await Car.findByIdAndUpdate(car._id, {
                                $set: { ...updates, retroSyncedAt: new Date() }
                            });
                            totalUpdated++;
                            console.log(`✅ [RetroSync] Updated car: ${car.title || car._id}`);
                        }
                    } catch (err) {
                        totalErrors++;
                        console.warn(`⚠️ [RetroSync] Car ${car._id} failed: ${err.message}`);
                    }
                }

                skip += batchSize;
                // استراحة قصيرة بين الدفعات
                await new Promise(r => setTimeout(r, 100));
            }

            console.log(`🏁 [RetroSync] Done: ${totalProcessed} processed, ${totalUpdated} updated, ${totalErrors} errors`);

            return {
                success: true,
                message: `✅ تمت المزامنة الجذرية: عولجت ${totalProcessed} سيارة، حُدِّثت ${totalUpdated}، أخطاء: ${totalErrors}`,
                stats: { totalProcessed, totalUpdated, totalErrors }
            };

        } catch (error) {
            console.error('❌ [RetroSync] Fatal error:', error);
            return {
                success: false,
                error: `فشل التزامن الجذري: ${error.message}`,
                stats: { totalProcessed, totalUpdated, totalErrors }
            };
        }
    }

    /**
     * إصلاح الصور فقط (بدون إعادة الترجمة) - أسرع
     */
    static async fixImagesOnly(req) {
        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');
        let fixed = 0;

        // البحث عن السيارات التي تحتوي على صور خارجية
        const carsWithExternalImages = await Car.find({
            tenantId: req.tenantId || 'default',
            $or: [
                { images: { $regex: 'encar.com', $options: 'i' } },
                { image: { $regex: 'encar.com', $options: 'i' } },
                { images: { $regex: '\\.co\\.kr', $options: 'i' } },
                { externalUrl: { $regex: 'encar.com', $options: 'i' } },
            ]
        }).lean();

        console.log(`🖼️ [RetroSync-Images] Found ${carsWithExternalImages.length} cars with external images`);

        for (const car of carsWithExternalImages) {
            try {
                const allImgs = [...(car.images || []), car.image, car.mainImage]
                    .filter(Boolean)
                    .filter((v, i, a) => a.indexOf(v) === i);

                const processed = await processImages(allImgs, 'showroom');
                if (processed.length > 0) {
                    await Car.findByIdAndUpdate(car._id, {
                        $set: {
                            images: processed,
                            image: processed[0],
                            mainImage: processed[0],
                            imageUrl: processed[0],
                            externalRef: car.externalUrl || '',
                            externalUrl: '',
                            retroSyncedAt: new Date()
                        }
                    });
                    fixed++;
                }
            } catch (e) {
                console.warn(`⚠️ [RetroSync-Images] ${car._id}: ${e.message}`);
            }
        }

        return {
            success: true,
            message: `🖼️ تم إصلاح صور ${fixed} سيارة`,
            fixed
        };
    }
}

module.exports = RetroactiveSyncService;
