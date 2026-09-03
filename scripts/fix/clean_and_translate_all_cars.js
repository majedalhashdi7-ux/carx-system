/**
 * @file clean_and_translate_all_cars.js
 * @description تنظيف وتعريب شامل لجميع بيانات السيارات الكورية في قاعدة البيانات
 * يستبدل النصوص الكورية باللغتين العربية والإنجليزية، ويملأ الحقول المفقودة (titleAr, makeAr, features, specs)
 */

require('dotenv').config({ path: 'c:/car-auction/.env' });
const mongoose = require('mongoose');
const path = require('path');

// تحميل محرك الترجمة الكورية
const KoreanTranslationService = require('../../services/KoreanTranslationService');

const KOREAN_REGEX = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;

// خريطة الماركات المعتمدة
const CANONICAL_BRANDS = {
    'hyundai': { ar: 'هيونداي', en: 'Hyundai' },
    '현대': { ar: 'هيونداي', en: 'Hyundai' },
    'هيونداي': { ar: 'هيونداي', en: 'Hyundai' },

    'kia': { ar: 'كيا', en: 'Kia' },
    '기아': { ar: 'كيا', en: 'Kia' },
    'كيا': { ar: 'كيا', en: 'Kia' },

    'genesis': { ar: 'جينيسيس', en: 'Genesis' },
    '제네시스': { ar: 'جينيسيس', en: 'Genesis' },
    'جينيسيس': { ar: 'جينيسيس', en: 'Genesis' },

    'ssangyong': { ar: 'سانغ يونغ', en: 'SsangYong' },
    '쌍용': { ar: 'سانغ يونغ', en: 'SsangYong' },
    'kg mobility': { ar: 'كي جي موبيليتي', en: 'KG Mobility' },
    'kg모빌리티': { ar: 'كي جي موبيليتي', en: 'KG Mobility' },

    'renault': { ar: 'رينو الكورية', en: 'Renault Korea' },
    '르노코리아': { ar: 'رينو الكورية', en: 'Renault Korea' },
    '르노삼성': { ar: 'رينو سامسونج', en: 'Renault Samsung' },

    'chevrolet': { ar: 'شيفروليه', en: 'Chevrolet' },
    '쉐보레': { ar: 'شيفروليه', en: 'Chevrolet' },

    'mercedes': { ar: 'مرسيدس بنز', en: 'Mercedes-Benz' },
    '벤츠': { ar: 'مرسيدس بنز', en: 'Mercedes-Benz' },

    'bmw': { ar: 'بي إم دبليو', en: 'BMW' },

    'audi': { ar: 'أودي', en: 'Audi' },
    '아우디': { ar: 'أودي', en: 'Audi' },

    'volkswagen': { ar: 'فولكس واجن', en: 'Volkswagen' },
    '폭스바겐': { ar: 'فولكس واجن', en: 'Volkswagen' },

    'porsche': { ar: 'بورشه', en: 'Porsche' },
    '포르쉐': { ar: 'بورشه', en: 'Porsche' },

    'toyota': { ar: 'تويوتا', en: 'Toyota' },
    'lexus': { ar: 'لكزس', en: 'Lexus' },
    'land rover': { ar: 'لاند روفر', en: 'Land Rover' },
    'jeep': { ar: 'جيب', en: 'Jeep' },
    'ford': { ar: 'فورد', en: 'Ford' }
};

function resolveBrand(makeStr = '') {
    if (!makeStr) return { ar: '', en: '' };
    const clean = makeStr.trim().toLowerCase();
    for (const [k, v] of Object.entries(CANONICAL_BRANDS)) {
        if (clean === k || clean.includes(k) || makeStr.includes(k)) {
            return v;
        }
    }
    const ar = KoreanTranslationService.cleanAndTranslate(makeStr);
    const en = KoreanTranslationService.translateToEnglish(makeStr);
    return { ar: ar || makeStr, en: en || makeStr };
}

async function run() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI غير موجود في ملف .env');
        process.exit(1);
    }

    console.log('🔌 جاري الاتصال بقاعدة البيانات MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ تم الاتصال بنجاح!\n');

    const Car = mongoose.model('Car', new mongoose.Schema({}, { strict: false }));

    const cars = await Car.find({}).lean();
    console.log(`📊 إجمالي عدد السيارات في قاعدة البيانات: ${cars.length}`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const car of cars) {
        const updates = {};
        let changed = false;

        const currentMake = car.make || '';
        const currentModel = car.model || '';
        const currentTitle = car.title || '';
        const currentTitleAr = car.titleAr || '';
        const currentYear = car.year || '';

        // 1. تحديد الماركة المعربة والإنجليزية
        const brandInfo = resolveBrand(currentMake || car.makeAr);
        if (brandInfo.ar && (!car.makeAr || car.makeAr !== brandInfo.ar || KOREAN_REGEX.test(car.makeAr))) {
            updates.makeAr = brandInfo.ar;
            changed = true;
        }
        if (brandInfo.en && (!car.make || car.make !== brandInfo.en || KOREAN_REGEX.test(car.make))) {
            updates.make = brandInfo.en;
            changed = true;
        }

        // 2. تنظيف الموديل
        const cleanModelAr = KoreanTranslationService.cleanAndTranslate(currentModel);
        const cleanModelEn = KoreanTranslationService.translateToEnglish(currentModel);
        if (cleanModelEn && (cleanModelEn !== currentModel || KOREAN_REGEX.test(currentModel))) {
            updates.model = cleanModelEn;
            changed = true;
        }

        // 3. صياغة العنوان العربي النظيف (TitleAr)
        const makeNameAr = brandInfo.ar || car.makeAr || 'سيارة';
        const modelNameEn = cleanModelEn || currentModel || '';
        
        let newTitleAr = currentTitleAr;
        if (!newTitleAr || KOREAN_REGEX.test(newTitleAr)) {
            // ترجمة العنوان الحالي أو صياغته
            const translatedAr = KoreanTranslationService.cleanAndTranslate(currentTitle || currentTitleAr);
            newTitleAr = translatedAr || `${makeNameAr} ${modelNameEn} ${currentYear}`.trim();
            // إزالة أي نصوص كورية باقية
            newTitleAr = newTitleAr.replace(KOREAN_REGEX, '').replace(/\s+/g, ' ').trim();
            if (!newTitleAr || newTitleAr.length < 3) {
                newTitleAr = `${makeNameAr} ${modelNameEn} ${currentYear}`.trim();
            }
            updates.titleAr = newTitleAr;
            changed = true;
        }

        // 4. صياغة العنوان الإنجليزي النظيف (Title)
        let newTitleEn = currentTitle;
        if (!newTitleEn || KOREAN_REGEX.test(newTitleEn)) {
            const translatedEn = KoreanTranslationService.translateToEnglish(currentTitle);
            newTitleEn = translatedEn || `${brandInfo.en || 'Car'} ${modelNameEn} ${currentYear}`.trim();
            newTitleEn = newTitleEn.replace(KOREAN_REGEX, '').replace(/\s+/g, ' ').trim();
            if (!newTitleEn || newTitleEn.length < 3) {
                newTitleEn = `${brandInfo.en || 'Car'} ${modelNameEn} ${currentYear}`.trim();
            }
            updates.title = newTitleEn;
            changed = true;
        }

        // 5. تصنيف السيارات الكورية
        const isKoreanCar = car.source === 'encar_korea' ||
                            car.source === 'korean_import' ||
                            (car.externalUrl && car.externalUrl.includes('encar.com')) ||
                            (car.priceKrw && Number(car.priceKrw) > 0);

        if (isKoreanCar) {
            if (car.source !== 'korean_import') {
                updates.source = 'korean_import';
                changed = true;
            }
            if (car.listingType !== 'showroom') {
                updates.listingType = 'showroom';
                changed = true;
            }
        }

        // 6. التحقق من المميزات ثنائية اللغة
        if (!car.featuresAr || car.featuresAr.length === 0 || !car.featuresEn || car.featuresEn.length === 0) {
            const features = KoreanTranslationService.extractBilingualFeatures(car.description || car.descriptionAr || '');
            updates.featuresAr = features.featuresAr;
            updates.featuresEn = features.featuresEn;
            changed = true;
        }

        // 7. تقرير الفحص
        if (!car.inspectionReport) {
            updates.inspectionReport = KoreanTranslationService.generateBilingualInspectionReport(car.description || '');
            changed = true;
        }

        if (changed) {
            await Car.updateOne({ _id: car._id }, { $set: updates });
            updatedCount++;
            if (updatedCount <= 10 || updatedCount % 20 === 0) {
                console.log(`[${updatedCount}] تم تحديث: ${updates.titleAr || currentTitleAr} | ${updates.title || currentTitle}`);
            }
        } else {
            skippedCount++;
        }
    }

    console.log('\n=============================================');
    console.log(`🎉 اكتمل التنظيف والتعريب الشامل!`);
    console.log(`   - تم تحديث وتعريب: ${updatedCount} سيارة`);
    console.log(`   - سيارات كانت معربة وسليمة: ${skippedCount} سيارة`);
    console.log('=============================================\n');

    await mongoose.disconnect();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات.');
}

run().catch(err => {
    console.error('❌ خطأ أثناء تشغيل السكربت:', err);
    process.exit(1);
});
