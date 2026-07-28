// [[ARABIC_HEADER]] هذا الملف (services/RetroactiveSyncService.js) محرك المزامنة التحريرية لتحديث البيانات القديمة

const KoreanTranslationService = require('./KoreanTranslationService');
const WatermarkService = require('./WatermarkService');

class RetroactiveSyncService {
  /**
   * تشغيل المزامنة التحريرية الشاملة لكافة البيانات القديمة والحديثة في قاعدة البيانات
   * @param {object} req طلب الشبكة الموفر لمعلومات المستأجر
   * @returns {object} ملخص نتائج المزامنة
   */
  static async runFullRetroactiveSync(req) {
    const results = {
      carsProcessed: 0,
      carsUpdated: 0,
      auctionsProcessed: 0,
      auctionsUpdated: 0,
      partsProcessed: 0,
      partsUpdated: 0,
      koreanImportsProcessed: 0,
      koreanImportsUpdated: 0,
      errors: []
    };

    try {
      const { getModel, addTenantFilter } = require('../tenants/tenant-model-helper');

      // ── 1. مزامنة جدول السيارات (Car) ──
      try {
        const Car = getModel(req, 'Car');
        const cars = await Car.find(addTenantFilter(req, {}));
        results.carsProcessed = cars.length;

        for (const car of cars) {
          let updated = false;

          // أ) تنظيف وتعريب العنوان إذا كان كودياً أو يحتوي حروفاً كورية
          if (KoreanTranslationService.hasKoreanText(car.title) || KoreanTranslationService.hasKoreanText(car.description)) {
            car.title = KoreanTranslationService.cleanAndTranslate(car.title);
            if (car.description) {
              car.description = KoreanTranslationService.cleanAndTranslate(car.description);
            }
            updated = true;
          }

          // ب) مزامنة الصورة الرئيسية وحقل imageUrl
          if (car.images && car.images.length > 0 && !car.imageUrl) {
            car.imageUrl = car.images[0];
            updated = true;
          }

          // ج) تطبيق العلامة المائية على الصور غير المختومة
          if (car.images && car.images.length > 0) {
            const watermarked = WatermarkService.processImagesList(car.images);
            if (JSON.stringify(watermarked) !== JSON.stringify(car.watermarkedImages)) {
              car.watermarkedImages = watermarked;
              updated = true;
            }
          }

          if (updated) {
            await car.save();
            results.carsUpdated++;
          }
        }
      } catch (err) {
        results.errors.push(`Car sync error: ${err.message}`);
      }

      // ── 2. مزامنة المزادات المباشرة (LiveAuction) ──
      try {
        const LiveAuction = getModel(req, 'LiveAuction');
        const sessions = await LiveAuction.find(addTenantFilter(req, {}));
        results.auctionsProcessed = sessions.length;

        for (const session of sessions) {
          let updated = false;

          if (session.cars && session.cars.length > 0) {
            for (const item of session.cars) {
              if (KoreanTranslationService.hasKoreanText(item.title)) {
                item.title = KoreanTranslationService.cleanAndTranslate(item.title);
                updated = true;
              }
              if (item.images && item.images.length > 0) {
                item.watermarkedImages = WatermarkService.processImagesList(item.images);
                updated = true;
              }
            }
          }

          if (updated) {
            await session.save();
            results.auctionsUpdated++;
          }
        }
      } catch (err) {
        results.errors.push(`LiveAuction sync error: ${err.message}`);
      }

      // ── 3. مزامنة قطع الغيار (SparePart) ──
      try {
        const SparePart = getModel(req, 'SparePart');
        const parts = await SparePart.find(addTenantFilter(req, {}));
        results.partsProcessed = parts.length;

        for (const part of parts) {
          let updated = false;
          if (KoreanTranslationService.hasKoreanText(part.name)) {
            part.name = KoreanTranslationService.cleanAndTranslate(part.name);
            updated = true;
          }
          if (part.images && part.images.length > 0) {
            part.watermarkedImages = WatermarkService.processImagesList(part.images);
            updated = true;
          }
          if (updated) {
            await part.save();
            results.partsUpdated++;
          }
        }
      } catch (err) {
        results.errors.push(`SparePart sync error: ${err.message}`);
      }

      // ── 4. مزامنة جدول السيارات الكورية المستوردة (KoreanCarImport) ──
      try {
        const KoreanCarImport = getModel(req, 'KoreanCarImport');
        if (KoreanCarImport) {
          const imports = await KoreanCarImport.find(addTenantFilter(req, {}));
          results.koreanImportsProcessed = imports.length;

          for (const item of imports) {
            let updated = false;
            if (KoreanTranslationService.hasKoreanText(item.title)) {
              item.title = KoreanTranslationService.cleanAndTranslate(item.title);
              updated = true;
            }
            if (item.images && item.images.length > 0) {
              item.watermarkedImages = WatermarkService.processImagesList(item.images);
              updated = true;
            }
            if (updated) {
              await item.save();
              results.koreanImportsUpdated++;
            }
          }
        }
      } catch (err) {
        results.errors.push(`KoreanCarImport sync error: ${err.message}`);
      }

      return {
        success: true,
        message: 'تمت المزامنة التحريرية وتحديث البيانات القديمة والجديدة بنجاح',
        results
      };

    } catch (error) {
      console.error('RetroactiveSync error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = RetroactiveSyncService;
