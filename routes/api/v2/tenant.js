// routes/api/v2/tenant.js - API للحصول على معلومات المعرض الحالي

const express = require('express');
const router = express.Router();
const { tenantInfoOnly } = require('../../../middleware/tenantMiddleware');

/**
 * GET /api/v2/tenant/info
 * الحصول على معلومات المعرض الحالي (بدون اتصال DB)
 */
router.get('/info', tenantInfoOnly(), (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        message: 'المعرض غير موجود',
      });
    }

    // إرجاع بيانات المعرض (بدون معلومات حساسة)
    res.json({
      success: true,
      data: {
        id: req.tenant.id,
        name: req.tenant.name,
        nameEn: req.tenant.nameEn,
        description: req.tenant.description,
        descriptionEn: req.tenant.descriptionEn,
        logo: req.tenant.logo,
        favicon: req.tenant.favicon,
        theme: req.tenant.theme,
        contact: req.tenant.contact,
        settings: req.tenant.settings,
      },
    });
  } catch (error) {
    console.error('خطأ في /tenant/info:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الحصول على معلومات المعرض',
    });
  }
});

/**
 * GET /api/v2/tenant/theme
 * الحصول على الثيم فقط (أخف وأسرع)
 */
router.get('/theme', tenantInfoOnly(), (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        message: 'المعرض غير موجود',
      });
    }

    res.json({
      success: true,
      data: {
        id: req.tenant.id,
        name: req.tenant.name,
        theme: req.tenant.theme,
        logo: req.tenant.logo,
      },
    });
  } catch (error) {
    console.error('خطأ في /tenant/theme:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الحصول على الثيم',
    });
  }
});

module.exports = router;
