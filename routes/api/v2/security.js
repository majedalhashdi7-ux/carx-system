// [[ARABIC_HEADER]] نظام الأمان المتطور - HM CAR Security Dashboard API

/**
 * @file routes/api/v2/security.js
 * @description نظام أمان متطور يتجاوز الحلول التقليدية
 * 
 * الميزات الجديدة:
 * 1. لوحة أمان شاملة بإحصائيات لحظية
 * 2. نظام مستوى الثقة (Trust Score) لكل جهاز
 * 3. سجل أحداث أمنية مفصل (Security Timeline)
 * 4. فلترة ذكية (محظور، مشبوه، موثوق)
 * 5. حظر مؤقت ودائم مع أسباب
 * 6. إدارة الأجهزة النشطة لكل مستخدم
 * 7. كشف الأنماط المشبوهة
 * 8. تصدير تقارير الأمان
 */

const express = require('express');
const router = express.Router();
const DeviceFingerprint = require('../../../models/DeviceFingerprint');
const User = require('../../../models/User');
const ClientSession = require('../../../models/ClientSession');
const { requireAuthAPI, requireAdmin } = require('../../../middleware/auth');
const { blockedIPs } = require('../../../middleware/securityEnhanced');

// ══════════════════════════════════════════════
// 📊 لوحة الأمان الرئيسية (Security Dashboard)
// ══════════════════════════════════════════════

/**
 * GET /api/v2/security/dashboard
 * إحصائيات شاملة للأمان
 */
router.get('/dashboard', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const [
      totalDevices,
      bannedDevices,
      trustedDevices,
      suspiciousDevices,
      exemptDevices,
      recentEvents,
      totalUsers,
      activeUsers,
      activeSessions,
      topThreats,
    ] = await Promise.all([
      DeviceFingerprint.countDocuments(),
      DeviceFingerprint.countDocuments({ banned: true }),
      DeviceFingerprint.countDocuments({ trustLevel: { $in: ['trusted', 'high'] } }),
      DeviceFingerprint.countDocuments({
        banned: false,
        $or: [
          { trustLevel: { $in: ['low', 'unknown'] } },
          { 'trustFactors.accountSwitchAttempts': { $gte: 2 } },
          { 'trustFactors.failedAttempts': { $gte: 3 } },
        ]
      }),
      DeviceFingerprint.countDocuments({ exemptFromSecurity: true }),
      
      // آخر 10 أحداث أمنية عبر كل الأجهزة
      DeviceFingerprint.aggregate([
        { $unwind: '$securityEvents' },
        { $sort: { 'securityEvents.timestamp': -1 } },
        { $limit: 10 },
        { $project: {
          ip: 1,
          linkedUsername: 1,
          trustLevel: 1,
          event: '$securityEvents'
        }}
      ]),
      
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      ClientSession.countDocuments({ isActive: true }),
      
      // أكثر الأجهزة تهديداً (بناءً على trust score)
      DeviceFingerprint.find({ banned: false, trustScore: { $lte: 30 } })
        .sort({ trustScore: 1 })
        .limit(5)
        .select('ip linkedUsername trustScore trustLevel trustFactors'),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalDevices,
          bannedDevices,
          trustedDevices,
          suspiciousDevices,
          exemptDevices,
          totalUsers,
          activeUsers,
          activeSessions,
          threatLevel: bannedDevices > 5 ? 'high' : suspiciousDevices > 10 ? 'medium' : 'low',
        },
        recentEvents,
        topThreats,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحميل لوحة الأمان' });
  }
});

// ══════════════════════════════════════════════
// 📱 إدارة الأجهزة (Device Management)
// ══════════════════════════════════════════════

/**
 * GET /api/v2/security/devices
 * قائمة الأجهزة مع فلترة متقدمة
 */
router.get('/devices', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const {
      search = '',
      filter = 'all',      // all, banned, suspicious, trusted, exempt
      sortBy = 'updatedAt', // updatedAt, trustScore, failedAttempts
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    // بناء الفلتر
    const query = {};

    // فلتر حسب الحالة
    switch (filter) {
      case 'banned':
        query.banned = true;
        break;
      case 'suspicious':
        query.banned = false;
        query.$or = [
          { trustLevel: { $in: ['low', 'unknown'] } },
          { 'trustFactors.accountSwitchAttempts': { $gte: 2 } },
          { 'trustFactors.failedAttempts': { $gte: 3 } },
        ];
        break;
      case 'trusted':
        query.trustLevel = { $in: ['trusted', 'high'] };
        query.banned = false;
        break;
      case 'exempt':
        query.exemptFromSecurity = true;
        break;
      case 'active':
        query.banned = false;
        query.trustLevel = { $nin: ['blocked'] };
        break;
    }

    // البحث
    if (search) {
      const searchQuery = {
        $or: [
          { ip: { $regex: new RegExp(search, 'i') } },
          { linkedUsername: { $regex: new RegExp(search, 'i') } },
          { banCode: { $regex: new RegExp(`^${search}$`, 'i') } },
          { browser: { $regex: new RegExp(search, 'i') } },
          { os: { $regex: new RegExp(search, 'i') } },
        ]
      };
      
      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchQuery];
        delete query.$or;
      } else {
        Object.assign(query, searchQuery);
      }
    }

    // الترتيب
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // الاستعلام
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [devices, total] = await Promise.all([
      DeviceFingerprint.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-securityEvents'), // لا نحمّل الأحداث في القائمة
      DeviceFingerprint.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: devices,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      }
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الأجهزة' });
  }
});

/**
 * GET /api/v2/security/devices/:id
 * تفاصيل جهاز محدد مع السجل الأمني الكامل
 */
router.get('/devices/:id', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const device = await DeviceFingerprint.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
    }

    // جلب المستخدم المرتبط إن وجد
    let linkedUser = null;
    if (device.linkedUserId) {
      linkedUser = await User.findById(device.linkedUserId).select('name email role status lastLoginAt');
    } else if (device.linkedUsername) {
      linkedUser = await User.findOne({
        name: { $regex: new RegExp(`^${device.linkedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }).select('name email role status lastLoginAt');
    }

    // جلب الجلسات النشطة من هذا الـ IP
    const activeSessions = await ClientSession.find({
      ip: device.ip,
      isActive: true,
    }).sort({ lastActivity: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        device,
        linkedUser,
        activeSessions,
      }
    });
  } catch (error) {
    console.error('Error fetching device details:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب تفاصيل الجهاز' });
  }
});

// ══════════════════════════════════════════════
// 🔒 إجراءات الأمان (Security Actions)
// ══════════════════════════════════════════════

/**
 * POST /api/v2/security/toggle-ban/:id
 * حظر/فك حظر جهاز مع سبب ومدة
 */
router.post('/toggle-ban/:id', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const device = await DeviceFingerprint.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
    }

    const { reason = '', duration = 'permanent' } = req.body;

    if (device.banned) {
      // ── فك الحظر ──
      device.banned = false;
      device.banCode = '';
      device.banReason = '';
      device.bannedAt = null;
      device.banExpiresAt = null;
      device.unbannedAt = new Date();
      device.unbannedBy = req.user.userId;
      device.failedAttempts = 0;
      device.trustFactors.failedAttempts = 0;
      device.trustFactors.accountSwitchAttempts = 0;
      
      // مسح أسماء المستخدمين المحاولة لمنح فرصة جديدة
      device.attemptedUsernames = [];
      device.linkedUsername = '';
      device.linkedUserId = null;

      // إزالة من قائمة IP المحظورة في الذاكرة
      if (device.ip) blockedIPs.delete(device.ip);

      device.addSecurityEvent('unbanned_manually', `فك حظر بواسطة الأدمن. السبب: ${reason || 'غير محدد'}`, {
        adminId: req.user.userId
      });

      device.calculateTrustScore();
    } else {
      // ── حظر ──
      device.banned = true;
      device.banCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      device.banReason = reason || 'حظر يدوي من الأدمن';
      device.bannedAt = new Date();
      device.bannedBy = req.user.userId;
      device.exemptFromSecurity = false;

      // حظر مؤقت
      if (duration !== 'permanent') {
        const hours = parseInt(duration) || 24;
        device.banExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      }

      device.trustLevel = 'blocked';
      device.addSecurityEvent('banned_manually', `حظر بواسطة الأدمن. السبب: ${reason || 'غير محدد'}. المدة: ${duration}`, {
        adminId: req.user.userId
      });
    }

    await device.save();

    res.json({
      success: true,
      message: device.banned ? `تم حظر الجهاز بنجاح (رمز: ${device.banCode})` : 'تم فك الحظر بنجاح',
      data: {
        banned: device.banned,
        banCode: device.banCode,
        trustLevel: device.trustLevel,
        trustScore: device.trustScore,
      }
    });
  } catch (error) {
    console.error('Error toggling device ban:', error);
    res.status(500).json({ success: false, message: 'خطأ أثناء معالجة الحظر' });
  }
});

/**
 * POST /api/v2/security/toggle-exempt/:id
 * تفعيل/تعطيل إعفاء الجهاز من القيود
 */
router.post('/toggle-exempt/:id', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const device = await DeviceFingerprint.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
    }

    const { reason = '' } = req.body;

    device.exemptFromSecurity = !device.exemptFromSecurity;
    
    if (device.exemptFromSecurity) {
      device.exemptReason = reason || 'إعفاء يدوي';
      device.exemptedBy = req.user.userId;
      
      // فك الحظر تلقائياً عند الإعفاء
      if (device.banned) {
        device.banned = false;
        device.banCode = '';
        device.failedAttempts = 0;
        device.unbannedAt = new Date();
        device.unbannedBy = req.user.userId;
        if (device.ip) blockedIPs.delete(device.ip);
      }

      device.trustFactors.adminApproved = true;
      device.addSecurityEvent('trusted', `تم إعفاء الجهاز: ${reason}`, { adminId: req.user.userId });
    } else {
      device.exemptReason = '';
      device.exemptedBy = null;
      device.trustFactors.adminApproved = false;
      device.addSecurityEvent('untrusted', 'تم إلغاء إعفاء الجهاز', { adminId: req.user.userId });
    }

    device.calculateTrustScore();
    await device.save();

    res.json({
      success: true,
      message: device.exemptFromSecurity ? 'تم إعفاء الجهاز من القيود' : 'تم تفعيل القيود على الجهاز',
      data: {
        exemptFromSecurity: device.exemptFromSecurity,
        trustScore: device.trustScore,
        trustLevel: device.trustLevel,
      }
    });
  } catch (error) {
    console.error('Error toggling device exemption:', error);
    res.status(500).json({ success: false, message: 'خطأ أثناء تحديث الإعفاء' });
  }
});

/**
 * POST /api/v2/security/trust/:id
 * رفع/خفض مستوى الثقة يدوياً
 */
router.post('/trust/:id', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const device = await DeviceFingerprint.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
    }

    const { action = 'boost' } = req.body; // boost, reduce, reset

    switch (action) {
      case 'boost':
        device.trustFactors.adminApproved = true;
        device.trustFactors.failedAttempts = 0;
        device.trustFactors.accountSwitchAttempts = 0;
        device.addSecurityEvent('trusted', 'رفع مستوى الثقة بواسطة الأدمن', { adminId: req.user.userId });
        break;
      case 'reduce':
        device.trustFactors.adminApproved = false;
        device.trustFactors.suspiciousActions += 3;
        device.addSecurityEvent('suspicious_activity', 'خفض مستوى الثقة بواسطة الأدمن', { adminId: req.user.userId });
        break;
      case 'reset':
        device.trustFactors = {
          successfulLogins: 0,
          daysActive: 0,
          consistentUsage: false,
          adminApproved: false,
          failedAttempts: 0,
          accountSwitchAttempts: 0,
          suspiciousActions: 0,
          ipChanges: 0,
        };
        device.failedAttempts = 0;
        device.attemptedUsernames = [];
        device.addSecurityEvent('trusted', 'إعادة تعيين حالة الجهاز بالكامل', { adminId: req.user.userId });
        break;
    }

    device.calculateTrustScore();
    await device.save();

    res.json({
      success: true,
      message: `تم ${action === 'boost' ? 'رفع' : action === 'reduce' ? 'خفض' : 'إعادة تعيين'} مستوى الثقة`,
      data: {
        trustScore: device.trustScore,
        trustLevel: device.trustLevel,
      }
    });
  } catch (error) {
    console.error('Error updating trust:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث مستوى الثقة' });
  }
});

/**
 * POST /api/v2/security/add-note/:id
 * إضافة ملاحظة أدمن للجهاز
 */
router.post('/add-note/:id', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const device = await DeviceFingerprint.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'الجهاز غير موجود' });
    }

    const { note } = req.body;
    device.adminNotes = note || '';
    await device.save();

    res.json({ success: true, message: 'تم حفظ الملاحظة' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, message: 'خطأ في حفظ الملاحظة' });
  }
});

// ══════════════════════════════════════════════
// 👥 الجلسات النشطة (Active Sessions)
// ══════════════════════════════════════════════

/**
 * GET /api/v2/security/sessions
 * الجلسات النشطة حالياً
 */
router.get('/sessions', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const { search, userId } = req.query;

    const query = { isActive: true };
    if (userId) query.userId = userId;

    const sessions = await ClientSession.find(query)
      .sort({ lastActivity: -1 })
      .limit(50)
      .populate('userId', 'name email role');

    res.json({
      success: true,
      data: sessions,
      total: sessions.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب الجلسات' });
  }
});

/**
 * POST /api/v2/security/sessions/:id/terminate
 * إنهاء جلسة محددة
 */
router.post('/sessions/:id/terminate', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const session = await ClientSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'الجلسة غير موجودة' });
    }

    session.isActive = false;
    session.terminatedAt = new Date();
    session.terminatedBy = req.user.userId;
    session.logoutTime = new Date();
    await session.save();

    res.json({ success: true, message: 'تم إنهاء الجلسة بنجاح' });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({ success: false, message: 'خطأ في إنهاء الجلسة' });
  }
});

/**
 * POST /api/v2/security/sessions/terminate-all/:userId
 * إنهاء كل جلسات مستخدم محدد
 */
router.post('/sessions/terminate-all/:userId', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const result = await ClientSession.updateMany(
      { userId: req.params.userId, isActive: true },
      {
        $set: {
          isActive: false,
          terminatedAt: new Date(),
          terminatedBy: req.user.userId,
          logoutTime: new Date(),
        }
      }
    );

    res.json({
      success: true,
      message: `تم إنهاء ${result.modifiedCount} جلسة`,
      terminated: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error terminating all sessions:', error);
    res.status(500).json({ success: false, message: 'خطأ في إنهاء الجلسات' });
  }
});

// ══════════════════════════════════════════════
// 📊 التقارير والتحليلات الأمنية
// ══════════════════════════════════════════════

/**
 * GET /api/v2/security/report
 * تقرير أمني شامل
 */
router.get('/report', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const [
      trustDistribution,
      topAttackers,
      recentBans,
      loginPatterns,
      deviceTypes,
    ] = await Promise.all([
      // توزيع مستويات الثقة
      DeviceFingerprint.aggregate([
        { $group: { _id: '$trustLevel', count: { $sum: 1 }, avgScore: { $avg: '$trustScore' } } },
        { $sort: { count: -1 } }
      ]),
      
      // أكثر الأجهزة محاولة للهجوم
      DeviceFingerprint.find({ 'trustFactors.failedAttempts': { $gte: 3 } })
        .sort({ 'trustFactors.failedAttempts': -1 })
        .limit(10)
        .select('ip linkedUsername trustScore trustFactors.failedAttempts trustFactors.accountSwitchAttempts'),
      
      // آخر عمليات الحظر
      DeviceFingerprint.find({ banned: true })
        .sort({ bannedAt: -1 })
        .limit(10)
        .select('ip linkedUsername banCode banReason bannedAt'),
      
      // أنماط الدخول (آخر 7 أيام)
      DeviceFingerprint.aggregate([
        { $unwind: '$securityEvents' },
        { $match: {
          'securityEvents.type': { $in: ['login_success', 'login_failed'] },
          'securityEvents.timestamp': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }},
        { $group: {
          _id: {
            type: '$securityEvents.type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$securityEvents.timestamp' } }
          },
          count: { $sum: 1 }
        }},
        { $sort: { '_id.date': 1 } }
      ]),
      
      // توزيع أنواع الأجهزة
      DeviceFingerprint.aggregate([
        { $group: { _id: { platform: '$platform', browser: '$browser' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
    ]);

    res.json({
      success: true,
      data: {
        trustDistribution,
        topAttackers,
        recentBans,
        loginPatterns,
        deviceTypes,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Security report error:', error);
    res.status(500).json({ success: false, message: 'خطأ في إنشاء التقرير' });
  }
});

/**
 * POST /api/v2/security/cleanup
 * تنظيف البيانات القديمة
 */
router.post('/cleanup', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    // حذف أجهزة قديمة غير محظورة وبدون اسم مرتبط
    const deviceResult = await DeviceFingerprint.deleteMany({
      banned: false,
      linkedUsername: '',
      updatedAt: { $lt: cutoffDate },
    });

    // تنظيف الجلسات القديمة
    const sessionResult = await ClientSession.deleteMany({
      isActive: false,
      updatedAt: { $lt: cutoffDate },
    });

    res.json({
      success: true,
      message: 'تم التنظيف بنجاح',
      deletedDevices: deviceResult.deletedCount,
      deletedSessions: sessionResult.deletedCount,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, message: 'خطأ في التنظيف' });
  }
});

/**
 * POST /api/v2/security/bulk-action
 * إجراءات جماعية على أجهزة متعددة
 */
router.post('/bulk-action', requireAuthAPI, requireAdmin, async (req, res) => {
  try {
    const { ids, action } = req.body; // action: 'ban', 'unban', 'exempt', 'remove-exempt', 'delete'

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'يجب تحديد أجهزة' });
    }

    let result;

    switch (action) {
      case 'ban':
        result = await DeviceFingerprint.updateMany(
          { _id: { $in: ids } },
          {
            $set: {
              banned: true,
              banReason: 'حظر جماعي',
              bannedAt: new Date(),
              bannedBy: req.user.userId,
              trustLevel: 'blocked',
            }
          }
        );
        break;

      case 'unban':
        result = await DeviceFingerprint.updateMany(
          { _id: { $in: ids } },
          {
            $set: {
              banned: false,
              banCode: '',
              banReason: '',
              unbannedAt: new Date(),
              unbannedBy: req.user.userId,
              failedAttempts: 0,
              linkedUsername: '',
            }
          }
        );
        break;

      case 'delete':
        result = await DeviceFingerprint.deleteMany({ _id: { $in: ids } });
        break;

      default:
        return res.status(400).json({ success: false, message: 'إجراء غير صالح' });
    }

    res.json({
      success: true,
      message: `تم تنفيذ الإجراء "${action}" على ${result.modifiedCount || result.deletedCount || 0} جهاز`,
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ success: false, message: 'خطأ في تنفيذ الإجراء الجماعي' });
  }
});

module.exports = router;
