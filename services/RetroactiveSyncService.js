// [[ARABIC_HEADER]] خدمة مزامنة جذرية - تصلح كل البيانات القديمة والحالية
// تُطبّق: ترجمة الكوري، علامة مائية HM CAR، حذف الروابط الخارجية، تحديث الصور المحلية
// [[FIX v2]] تمت إضافة: مزامنة قطع الغيار + حقول mainImage/imageUrl + إصلاح شامل للبيانات القديمة

const KoreanTranslationService = require('./KoreanTranslationService');
const WatermarkService = require('./WatermarkService');
const { downloadAndOptimize } = require('./externalImageService');

// ─── دوال تصنيف روابط الصور ─────────────────────────────────

function isExternalImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const external = [
        'encar.com', 'ci.encar.com', 'carpicture', 'autospare',
        'auction.co.kr', '.kr/', 'korean', 'naver.net', 'kakao.com',
        'desert-korea', 'manheim.com', 'copart.com', 'iaai.com'
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

    // رابط خارجي - حمّل وضغط واختم
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

// ─── إصلاح سيارة واحدة ──────────────────────────────────────────

async function fixOneCar(car) {
    const updates = {};
    let needsUpdate = false;

    // ─── تنظيف النصوص الكورية ─────────────────────────────────────
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

    // ─── [[FIX]] مزامنة حقول الصورة الرئيسية ──────────────────────
    // إذا كانت images موجودة لكن mainImage أو imageUrl غائبة
    const firstImage = (car.images && car.images.length > 0) ? car.images[0] : null;
    if (firstImage) {
        if (!car.mainImage || car.mainImage === '') {
            updates.mainImage = firstImage;
            needsUpdate = true;
        }
        if (!car.imageUrl || car.imageUrl === '') {
            updates.imageUrl = firstImage;
            needsUpdate = true;
        }
        if (!car.image || car.image === '') {
            updates.image = firstImage;
            needsUpdate = true;
        }
    }

    // ─── إزالة externalUrl من السيارات (المشكلة الرئيسية!) ─────────
    if (car.externalUrl && (
        car.externalUrl.includes('encar.com') ||
        car.externalUrl.includes('.co.kr') ||
        car.externalUrl.includes('autospare') ||
        car.externalUrl.includes('desert-korea')
    )) {
        updates.externalRef = car.externalUrl;
        updates.externalUrl = '';
        needsUpdate = true;
    }

    // ─── معالجة الصور الخارجية ───────────────────────────────────
    const allImages = [...(car.images || []), car.image, car.mainImage, car.imageUrl]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);

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

    // ─── تأكيد listingType للسيارات المستوردة ────────────────────
    if (!car.listingType && (car.source === 'korean_import' || car.source === 'encar_korea')) {
        updates.listingType = 'showroom';
        needsUpdate = true;
    }

    // ─── إنشاء specs إذا لم يكن موجوداً ─────────────────────────
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

    // ─── [[NEW]] مزامنة isActive إذا كانت undefined ───────────────
    if (car.isActive === undefined || car.isActive === null) {
        updates.isActive = true;
        needsUpdate = true;
    }

    return { needsUpdate, updates };
}

// ─── إصلاح قطعة غيار واحدة ───────────────────────────────────────

async function fixOnePart(part) {
    const updates = {};
    let needsUpdate = false;

    // ─── [[FIX]] مزامنة حقول الصورة الرئيسية لقطع الغيار ─────────
    const firstImage = (part.images && part.images.length > 0) ? part.images[0] : null;
    if (firstImage) {
        if (!part.img || part.img === '') {
            updates.img = firstImage;
            needsUpdate = true;
        }
        if (!part.image || part.image === '') {
            updates.image = firstImage;
            needsUpdate = true;
        }
    }

    // ─── تنظيف النصوص الكورية في قطع الغيار ──────────────────────
    const fields = ['name', 'nameAr', 'description', 'carMake', 'carModel'];
    for (const field of fields) {
        const val = part[field];
        if (val && KoreanTranslationService.hasKoreanText(val)) {
            updates[field] = KoreanTranslationService.cleanAndTranslate(val);
            needsUpdate = true;
        }
    }

    // ─── معالجة الصور الخارجية لقطع الغيار ──────────────────────
    const allImages = [...(part.images || []), part.img, part.image]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);

    const hasExternalImages = allImages.some(isExternalImageUrl);
    if (hasExternalImages) {
        const processed = await processImages(allImages, 'parts');
        if (processed.length > 0) {
            updates.images = processed;
            updates.img = processed[0];
            updates.image = processed[0];
            needsUpdate = true;
        }
    }

    // ─── مزامنة inStock إذا كانت undefined ───────────────────────
    if (part.inStock === undefined || part.inStock === null) {
        updates.inStock = (part.stockQty || 0) > 0;
        needsUpdate = true;
    }

    return { needsUpdate, updates };
}

class RetroactiveSyncService {

    /**
     * مزامنة جذرية شاملة - سيارات + قطع غيار
     * يُصلح: الصور، النصوص الكورية، الحقول الفارغة، الروابط الخارجية
     */
    static async runFullRetroactiveSync(req, options = {}) {
        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');
        const SparePart = getModel(req, 'SparePart');
        const batchSize = options.batchSize || 20;

        let carStats = { processed: 0, updated: 0, errors: 0 };
        let partStats = { processed: 0, updated: 0, errors: 0 };

        console.log('🔄 [RetroSync] Starting full retroactive sync (Cars + SpareParts)...');

        // ─── مزامنة السيارات ────────────────────────────────────────
        try {
            const totalCars = await Car.countDocuments({ tenantId: req.tenantId || 'default' });
            console.log(`📊 [RetroSync] Total cars to process: ${totalCars}`);

            let skip = 0;
            while (skip < totalCars) {
                const batch = await Car.find({ tenantId: req.tenantId || 'default' })
                    .skip(skip).limit(batchSize).lean();

                if (batch.length === 0) break;

                for (const car of batch) {
                    carStats.processed++;
                    try {
                        const { needsUpdate, updates } = await fixOneCar(car);
                        if (needsUpdate && Object.keys(updates).length > 0) {
                            await Car.findByIdAndUpdate(car._id, {
                                $set: { ...updates, retroSyncedAt: new Date() }
                            });
                            carStats.updated++;
                            console.log(`✅ [RetroSync-Car] Updated: ${car.title || car._id}`);
                        }
                    } catch (err) {
                        carStats.errors++;
                        console.warn(`⚠️ [RetroSync-Car] ${car._id} failed: ${err.message}`);
                    }
                }

                skip += batchSize;
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (err) {
            console.error('❌ [RetroSync-Cars] Fatal:', err.message);
        }

        // ─── مزامنة قطع الغيار ────────────────────────────────────
        try {
            const totalParts = await SparePart.countDocuments({ tenantId: req.tenantId || 'default' });
            console.log(`📊 [RetroSync] Total spare parts to process: ${totalParts}`);

            let skip = 0;
            while (skip < totalParts) {
                const batch = await SparePart.find({ tenantId: req.tenantId || 'default' })
                    .skip(skip).limit(batchSize).lean();

                if (batch.length === 0) break;

                for (const part of batch) {
                    partStats.processed++;
                    try {
                        const { needsUpdate, updates } = await fixOnePart(part);
                        if (needsUpdate && Object.keys(updates).length > 0) {
                            await SparePart.findByIdAndUpdate(part._id, {
                                $set: { ...updates, retroSyncedAt: new Date() }
                            });
                            partStats.updated++;
                        }
                    } catch (err) {
                        partStats.errors++;
                        console.warn(`⚠️ [RetroSync-Part] ${part._id} failed: ${err.message}`);
                    }
                }

                skip += batchSize;
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (err) {
            console.error('❌ [RetroSync-Parts] Fatal:', err.message);
        }

        const totalProcessed = carStats.processed + partStats.processed;
        const totalUpdated = carStats.updated + partStats.updated;
        const totalErrors = carStats.errors + partStats.errors;

        console.log(`🏁 [RetroSync] Done: Cars(${carStats.updated}/${carStats.processed}), Parts(${partStats.updated}/${partStats.processed}), Errors: ${totalErrors}`);

        return {
            success: true,
            message: `✅ تمت المزامنة الشاملة: سيارات (${carStats.updated}/${carStats.processed} مُحدَّثة) | قطع غيار (${partStats.updated}/${partStats.processed} مُحدَّثة) | أخطاء: ${totalErrors}`,
            stats: { cars: carStats, parts: partStats, totalProcessed, totalUpdated, totalErrors }
        };
    }

    /**
     * إصلاح الصور فقط (بدون إعادة الترجمة) - أسرع
     */
    static async fixImagesOnly(req) {
        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');
        const SparePart = getModel(req, 'SparePart');
        let carFixed = 0;
        let partFixed = 0;

        // ─── إصلاح صور السيارات ───────────────────────────────────
        const carsWithExternalImages = await Car.find({
            tenantId: req.tenantId || 'default',
            $or: [
                { images: { $regex: 'encar\\.com', $options: 'i' } },
                { image: { $regex: 'encar\\.com', $options: 'i' } },
                { images: { $regex: '\\.co\\.kr', $options: 'i' } },
                { externalUrl: { $regex: 'encar\\.com', $options: 'i' } },
            ]
        }).lean();

        console.log(`🖼️ [RetroSync-Images] Found ${carsWithExternalImages.length} cars with external images`);

        for (const car of carsWithExternalImages) {
            try {
                const allImgs = [...(car.images || []), car.image, car.mainImage]
                    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

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
                    carFixed++;
                }
            } catch (e) {
                console.warn(`⚠️ [RetroSync-Images-Car] ${car._id}: ${e.message}`);
            }
        }

        // ─── إصلاح الحقول المفقودة فقط (بدون تحميل الصور) ─────────
        const carsWithMissingMainImage = await Car.find({
            tenantId: req.tenantId || 'default',
            'images.0': { $exists: true },
            $or: [
                { mainImage: { $in: ['', null, undefined] } },
                { imageUrl: { $in: ['', null, undefined] } }
            ]
        }).lean();

        for (const car of carsWithMissingMainImage) {
            if (car.images && car.images.length > 0) {
                await Car.findByIdAndUpdate(car._id, {
                    $set: {
                        mainImage: car.images[0],
                        imageUrl: car.images[0],
                        image: car.images[0]
                    }
                });
                carFixed++;
            }
        }

        // ─── إصلاح الحقول المفقودة في قطع الغيار ─────────────────
        const partsWithMissingImage = await SparePart.find({
            tenantId: req.tenantId || 'default',
            'images.0': { $exists: true },
            $or: [
                { img: { $in: ['', null, undefined] } },
                { image: { $in: ['', null, undefined] } }
            ]
        }).lean();

        for (const part of partsWithMissingImage) {
            if (part.images && part.images.length > 0) {
                await SparePart.findByIdAndUpdate(part._id, {
                    $set: { img: part.images[0], image: part.images[0] }
                });
                partFixed++;
            }
        }

        return {
            success: true,
            message: `🖼️ تم إصلاح صور ${carFixed} سيارة + ${partFixed} قطعة غيار`,
            carFixed,
            partFixed
        };
    }

    /**
     * [[NEW]] فحص صحة البيانات وإحصاء المشاكل
     * يُعيد إحصائيات تفصيلية بدون تعديل أي بيانات
     */
    static async checkDataHealth(req) {
        const { getModel } = require('../tenants/tenant-model-helper');
        const Car = getModel(req, 'Car');
        const SparePart = getModel(req, 'SparePart');
        const tenantId = req.tenantId || 'default';

        const [
            totalCars, totalParts,
            carsNoImage, partsNoImage,
            carsExternalImages, partsExternalImages,
            carsNoMainImage, partsNoImg,
            carsKoreanText, carsNoSpecs,
            carsWithExternalUrl
        ] = await Promise.all([
            Car.countDocuments({ tenantId }),
            SparePart.countDocuments({ tenantId }),
            Car.countDocuments({ tenantId, images: { $size: 0 } }),
            SparePart.countDocuments({ tenantId, images: { $size: 0 } }),
            Car.countDocuments({
                tenantId,
                $or: [
                    { images: { $regex: 'encar\\.com', $options: 'i' } },
                    { images: { $regex: '\\.co\\.kr', $options: 'i' } }
                ]
            }),
            SparePart.countDocuments({
                tenantId,
                images: { $regex: 'autospare|encar|\.co\.kr', $options: 'i' }
            }),
            Car.countDocuments({
                tenantId,
                'images.0': { $exists: true },
                $or: [
                    { mainImage: { $in: ['', null] } },
                    { imageUrl: { $in: ['', null] } }
                ]
            }),
            SparePart.countDocuments({
                tenantId,
                'images.0': { $exists: true },
                $or: [{ img: { $in: ['', null] } }, { image: { $in: ['', null] } }]
            }),
            Car.countDocuments({ tenantId, title: { $regex: '[\\uAC00-\\uD7A3]' } }),
            Car.countDocuments({ tenantId, $or: [{ specs: null }, { specs: { $exists: false } }] }),
            Car.countDocuments({ tenantId, externalUrl: { $nin: ['', null] } })
        ]);

        const totalIssues = carsNoImage + partsNoImage + carsExternalImages + partsExternalImages +
            carsNoMainImage + partsNoImg + carsKoreanText + carsNoSpecs + carsWithExternalUrl;

        return {
            success: true,
            health: totalIssues === 0 ? 'excellent' : totalIssues < 10 ? 'good' : 'needs_sync',
            summary: {
                totalCars, totalParts,
                totalIssues
            },
            issues: {
                cars: {
                    noImages: carsNoImage,
                    externalImages: carsExternalImages,
                    missingMainImage: carsNoMainImage,
                    koreanText: carsKoreanText,
                    noSpecs: carsNoSpecs,
                    hasExternalUrl: carsWithExternalUrl
                },
                parts: {
                    noImages: partsNoImage,
                    externalImages: partsExternalImages,
                    missingImgField: partsNoImg
                }
            }
        };
    }

    /**
     * [[NEW]] مزامنة حقل معين فقط لكل السجلات (للتحديثات البرمجية الجديدة)
     * مثلاً: إضافة حقل جديد 'retroSyncedAt' لكل السجلات القديمة
     */
    static async syncNewField(req, modelName, fieldName, defaultValue) {
        const { getModel } = require('../tenants/tenant-model-helper');
        const Model = getModel(req, modelName);
        const tenantId = req.tenantId || 'default';

        const result = await Model.updateMany(
            { tenantId, [fieldName]: { $exists: false } },
            { $set: { [fieldName]: defaultValue } }
        );

        return {
            success: true,
            message: `تم تحديث حقل ${fieldName} لـ ${result.modifiedCount} سجل في ${modelName}`,
            modifiedCount: result.modifiedCount
        };
    }
}

module.exports = RetroactiveSyncService;
