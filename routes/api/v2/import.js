// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/import.js) جزء من مشروع HM CAR

/**
 * @file routes/api/v2/import.js
 * @description نظام الاستيراد المتقدم - استيراد سيارات وقطع غيار من روابط خارجية
 * 
 * يدعم:
 * - استخراج البيانات من أي رابط (scraping)
 * - معاينة البيانات قبل الحفظ
 * - حفظ البيانات في قاعدة البيانات
 * - كشف التكرار عبر رابط المصدر
 */

const express = require('express');
const router = express.Router();
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');
const ScraperService = require('../../../services/ScraperService');
const { processMany } = require('../../../services/externalImageService');

/**
 * @route POST /api/v2/import/preview
 * @description معاينة البيانات من رابط قبل الحفظ
 * @access Admin
 */
router.post('/preview', requireAuthAPI, requireAdmin, async (req, res, next) => {
  try {
    const { url, type } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'الرابط مطلوب' });
    }

    // استخدام ScraperService لجلب البيانات والصور
    const scrapeResult = await ScraperService.scrapeUrl(url);
    
    if (!scrapeResult.success) {
      return res.status(400).json({ success: false, error: scrapeResult.error });
    }

    // فحص التكرار عبر رابط المصدر
    let isDuplicate = false;
    if (req.tenantModels) {
      const Model = type === 'car' ? req.tenantModels.Car : req.tenantModels.SparePart;
      if (Model) {
        const existing = await Model.findOne({ externalUrl: url });
        isDuplicate = !!existing;
      }
    }

    // تهيئة البيانات بما يتناسب مع نظامنا
    const formattedData = {
      title: scrapeResult.data.title || 'عنصر مستورد بدون عنوان',
      description: scrapeResult.data.description,
      images: scrapeResult.data.images,
      sourceUrl: url,
    };

    if (type === 'car') {
      formattedData.make = 'غير محدد';
      formattedData.model = 'غير محدد';
      formattedData.year = new Date().getFullYear();
      formattedData.price = 0;
      formattedData.fuelType = 'Petrol';
      formattedData.transmission = 'Automatic';
    } else {
      formattedData.name = scrapeResult.data.title || 'قطعة مستوردة';
      formattedData.partNumber = 'IMP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      formattedData.category = 'استيراد جديد';
      formattedData.price = 0;
      formattedData.stock = 1;
    }

    res.json({
      success: true,
      message: 'تم استخراج البيانات بنجاح - جاهزة للمراجعة',
      data: formattedData,
      images: scrapeResult.data.images,
      duplicate: isDuplicate
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v2/import/save
 * @description حفظ البيانات المستوردة بعد المراجعة
 * @access Admin
 */
router.post('/save', requireAuthAPI, requireAdmin, async (req, res, next) => {
  try {
    const { data, type } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: 'البيانات مطلوبة' });
    }

    if (!req.tenantModels) {
      return res.status(503).json({ success: false, error: 'قاعدة البيانات غير متاحة' });
    }

    // [[ARABIC_COMMENT]] تحميل ومعالجة الصور لضمان بقائها في النظام (Local/Cloudinary)
    let processedImages = data.images || [];
    try {
      if (processedImages.length > 0) {
        processedImages = await processMany(processedImages, type === 'car' ? 'cars' : 'parts');
      }
    } catch (imgErr) {
      console.warn('⚠️ [Import] Image processing failed:', imgErr.message);
      // نستمر حتى لو فشلت معالجة الصور، سنستخدم الروابط الأصلية
    }

    let saved;
    if (type === 'car') {
      const Car = req.tenantModels.Car;
      if (!Car) {
        return res.status(500).json({ success: false, error: 'نموذج السيارات غير متاح' });
      }
      saved = await Car.create({
        title: data.title,
        make: data.make || 'غير محدد',
        model: data.model || 'غير محدد',
        year: data.year || new Date().getFullYear(),
        price: data.price || 0,
        description: data.description,
        images: processedImages,
        fuelType: data.fuelType || 'Petrol',
        transmission: data.transmission || 'Automatic',
        externalUrl: data.sourceUrl,
        status: 'draft', // يبدأ كمسودة حتى يراجعه الأدمن
      });
    } else {
      const SparePart = req.tenantModels.SparePart;
      if (!SparePart) {
        return res.status(500).json({ success: false, error: 'نموذج قطع الغيار غير متاح' });
      }
      saved = await SparePart.create({
        name: data.name || data.title,
        partNumber: data.partNumber,
        category: data.category || 'استيراد',
        price: data.price || 0,
        stockQty: data.stock || 1,
        description: data.description,
        images: processedImages,
        externalUrl: data.sourceUrl, // Model uses externalUrl
        status: 'draft',
      });
    }

    res.json({
      success: true,
      message: `تم حفظ ${type === 'car' ? 'السيارة' : 'قطعة الغيار'} بنجاح`,
      data: saved
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v2/import
 * @description استيراد مباشر (معاينة + حفظ في خطوة واحدة) - للتوافقية
 * @access Admin
 */
router.post('/', requireAuthAPI, requireAdmin, async (req, res, next) => {
  try {
    const { url, type } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'الرابط مطلوب' });
    }

    const scrapeResult = await ScraperService.scrapeUrl(url);
    
    if (!scrapeResult.success) {
      return res.status(400).json({ success: false, error: scrapeResult.error });
    }

    const formattedData = {
      title: scrapeResult.data.title || 'عنصر مستورد',
      description: scrapeResult.data.description,
      images: scrapeResult.data.images,
      sourceUrl: url,
    };

    if (type === 'car') {
      formattedData.make = 'غير محدد';
      formattedData.model = 'غير محدد';
      formattedData.year = new Date().getFullYear();
      formattedData.price = 0;
      formattedData.fuelType = 'Petrol';
      formattedData.transmission = 'Automatic';
    } else {
      formattedData.name = scrapeResult.data.title || 'قطعة مستوردة';
      formattedData.partNumber = 'IMP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      formattedData.category = 'استيراد جديد';
      formattedData.price = 0;
      formattedData.stock = 1;
    }

    res.json({
      success: true,
      message: 'تم استخراج البيانات بنجاح',
      data: formattedData,
      images: scrapeResult.data.images,
      duplicate: false
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
