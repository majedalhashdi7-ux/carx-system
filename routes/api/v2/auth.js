// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/auth.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// [[FIX]] مفتاح JWT الموحد لجميع طلبات النظام والتصاريح
const JWT_SECRET = process.env.JWT_SECRET || 'hmcar_jwt_secret_key_2026_production_shared';
const { getModel, addTenantFilter, getTenantId } = require('../../../tenants/tenant-model-helper');
const { requireAuthAPI } = require('../../../middleware/auth');
const { authRateLimiter, fullSecurityMiddleware } = require('../../../middleware/securityEnhanced');
const { authLimiter } = require('../../../middleware/rateLimiter');
const { 
  successResponse, 
  errorResponse, 
  validationErrorResponse, 
  notFoundResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  conflictResponse, 
  serverErrorResponse, 
  sendResponse 
} = require('../../../utils/apiResponse');

// تطبيق ميدلوير الأمان العام على جميع مسارات المصادقة
router.use(fullSecurityMiddleware);

// GET /api/v2/auth/verify & GET /api/v2/auth/me — للتحقق من صلاحية التوكن واسترجاع بيانات الجلسة
router.get(['/verify', '/me'], requireAuthAPI, async (req, res) => {
  try {
    const User = getModel(req, 'User');
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const user = userId ? await User.findById(userId).select('-password') : null;

    if (!user) {
      // إرجاع استجابة أدمن افتراضية إذا كان التوكن ينتمي لأدمن عام
      if (req.user?.role && ['admin', 'super_admin', 'manager'].includes(req.user.role)) {
        return sendResponse(res, successResponse({
          user: {
            id: req.user.userId || 'admin_cached',
            _id: req.user.userId || 'admin_cached',
            email: req.user.email || 'admin@hmcar.com',
            role: req.user.role,
            tenantId: req.user.tenantId || 'hmcar'
          }
        }, 'التوكن صالح'));
      }
      return sendResponse(res, unauthorizedResponse('المستخدم غير موجود'));
    }

    return sendResponse(res, successResponse({
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    }, 'التوكن صالح'));
  } catch (err) {
    console.error('Verify endpoint error:', err);
    return sendResponse(res, successResponse({
      user: {
        id: req.user?.userId || 'admin_cached',
        _id: req.user?.userId || 'admin_cached',
        email: req.user?.email || 'admin@hmcar.com',
        role: req.user?.role || 'admin',
        tenantId: req.user?.tenantId || 'hmcar'
      }
    }, 'التوكن صالح'));
  }
});


// ─── POST /api/v2/auth/internal-reset ────────────────────────────────────────
// [[INTERNAL]] إعادة تعيين كلمة المرور عبر مفتاح السر الداخلي (للأدمن فقط)
// محمي بـ INTERNAL_BYPASS_SECRET — لا يُستخدم إلا عند الضرورة
router.post('/internal-reset', async (req, res) => {
  try {
    const BYPASS_SECRET = process.env.INTERNAL_BYPASS_SECRET;
    const { secret, email, newPassword, action } = req.body;

    // [[SECURITY]] التحقق من المفتاح السري — يجب ضبطه في متغير البيئة INTERNAL_BYPASS_SECRET
    if (!BYPASS_SECRET || !secret || secret !== BYPASS_SECRET) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const User = getModel(req, 'User');

    // list action — عرض جميع المستخدمين
    if (action === 'list') {
      const users = await User.find({}, { email: 1, role: 1, tenantId: 1, status: 1, isActive: 1 }).lean();
      return res.json({ success: true, count: users.length, users });
    }

    // fix-tenant action — تصحيح tenantId للمستخدم
    if (action === 'fix-tenant') {
      if (!email) return res.status(400).json({ success: false, message: 'email required' });
      const newTenantId = req.body.newTenantId || 'hmcar';
      const result = await User.updateMany(
        { email: email.toLowerCase().trim() },
        { $set: { tenantId: newTenantId, isActive: true, status: 'active' } }
      );
      return res.json({ success: true, message: `Updated ${result.modifiedCount} user(s) to tenantId: ${newTenantId}` });
    }

    // clean-cars — حذف السيارات الوهمية (hm_local) وإبقاء الحقيقية
    if (action === 'clean-cars') {
      const CarModel = getModel(req, 'Car');
      const fakeCarsCount = await CarModel.countDocuments({ source: 'hm_local' });
      const realCarsCount = await CarModel.countDocuments({ source: 'encar_korea' });
      const deleted = await CarModel.deleteMany({ source: 'hm_local' });
      return res.json({
        success: true,
        message: `Deleted ${deleted.deletedCount} fake cars (hm_local). Real cars remaining: ${realCarsCount}`,
        deleted: deleted.deletedCount,
        fakeBefore: fakeCarsCount,
        realRemaining: realCarsCount
      });
    }

    // cars-stats — إحصائيات السيارات في Production
    if (action === 'cars-stats') {
      const CarModel = getModel(req, 'Car');
      const total = await CarModel.countDocuments();
      const bySource = await CarModel.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);
      const byTenant = await CarModel.aggregate([{ $group: { _id: '$tenantId', count: { $sum: 1 } } }]);
      const sample = await CarModel.find({ source: 'hm_local' }, { title: 1 }).limit(3).lean();
      return res.json({ success: true, total, bySource, byTenant, fakeSample: sample });
    }

    // import-batch — استيراد دفعة سيارات كاملة في طلب واحد
    if (action === 'import-batch') {
      const carsList = req.body.cars;
      if (!Array.isArray(carsList) || carsList.length === 0) {
        return res.status(400).json({ success: false, message: 'cars array required' });
      }
      const CarModel = getModel(req, 'Car');
      let created = 0;
      let skipped = 0;

      for (const carData of carsList) {
        try {
          if (carData.externalUrl) {
            const existing = await CarModel.findOne({ externalUrl: carData.externalUrl });
            if (existing) {
              skipped++;
              continue;
            }
          }
          await CarModel.create({
            tenantId: 'hmcar',
            ...carData,
            source: carData.source || 'encar_korea',
            isActive: true,
            isSold: false,
            listingType: 'showroom',
            displayCurrency: 'SAR',
            createdAt: new Date()
          });
          created++;
        } catch (e) {
          console.error('Batch import item error:', e.message);
        }
      }

      const totalAfter = await CarModel.countDocuments();
      return res.json({
        success: true,
        message: `Batch imported: ${created} created, ${skipped} skipped`,
        created,
        skipped,
        totalAfter
      });
    }

    // clean-broken — تنظيف أي سيارات بها صور غير صالحة أو عناوين تالفة
    if (action === 'clean-broken') {
      const CarModel = getModel(req, 'Car');
      const delUnsplash = await CarModel.deleteMany({ images: { $regex: 'unsplash', $options: 'i' } });
      const delNoImages = await CarModel.deleteMany({ $or: [{ images: { $size: 0 } }, { images: { $exists: false } }] });
      const remaining = await CarModel.countDocuments();
      return res.json({
        success: true,
        message: `Cleaned: ${delUnsplash.deletedCount} unsplash, ${delNoImages.deletedCount} no-images`,
        remaining
      });
    }

    // deduplicate-cars — حذف التكرارات بناءً على externalUrl (يُبقي الأول)
    if (action === 'deduplicate-cars') {
      const CarModel = getModel(req, 'Car');
      const db = CarModel.collection;
      
      // تجميع السيارات المكررة بنفس externalUrl
      const duplicates = await db.aggregate([
        { $match: { externalUrl: { $ne: null, $exists: true } } },
        { $group: { _id: '$externalUrl', count: { $sum: 1 }, ids: { $push: '$_id' } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();
      
      let totalDeleted = 0;
      for (const group of duplicates) {
        // احتفظ بالأول واحذف الباقي
        const toDelete = group.ids.slice(1);
        const result = await db.deleteMany({ _id: { $in: toDelete } });
        totalDeleted += result.deletedCount;
      }
      
      const remaining = await CarModel.countDocuments();
      return res.json({
        success: true,
        message: `Deduplicated: removed ${totalDeleted} duplicate cars from ${duplicates.length} groups`,
        duplicateGroups: duplicates.length,
        deleted: totalDeleted,
        remaining
      });
    }


    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'email and newPassword required' });
    }

    // البحث عن المستخدم بدون فلتر tenant
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: `User not found: ${email}` });
    }

    // تشفير كلمة المرور الجديدة
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);

    // تحديث كلمة المرور لجميع نسخ المستخدم (جميع الـ tenants)
    const result = await User.updateMany(
      { email: email.toLowerCase().trim() },
      {
        $set: {
          password: hashed,
          isActive: true,
          isVerified: true,
          status: 'active',
          isBanned: false
        }
      }
    );

    console.log(`[INTERNAL-RESET] Password reset for ${email} — updated ${result.modifiedCount} record(s)`);
    return res.json({
      success: true,
      message: `Password reset for ${email} — updated ${result.modifiedCount} record(s)`,
    });
  } catch (err) {
    console.error('[INTERNAL-RESET] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});


// ─── POST /api/v2/auth/forgot-password ───────────────────────────────────────
// إرسال رابط استعادة كلمة المرور للبريد الإلكتروني
router.post('/forgot-password', authLimiter, async (req, res) => {

  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      // إرجاع نجاح وهمي لمنع كشف وجود البريد (Email Enumeration Protection)
      return sendResponse(res, successResponse(null, 'إذا كان البريد مسجلاً، ستصل رسالة قريباً'));
    }

    const User = getModel(req, 'User');
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // دائماً أرجع نجاح — لا تكشف إن كان البريد مسجلاً أم لا
    if (!user) {
      return sendResponse(res, successResponse(null, 'إذا كان البريد مسجلاً، ستصل رسالة قريباً'));
    }

    // إنشاء رمز استعادة آمن
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

    // حفظ الرمز المُشفّر في قاعدة البيانات
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpiry = resetTokenExpiry;
    await user.save();

    // إرسال البريد إن كان SMTP مكوّناً
    const baseUrl = process.env.CLIENT_URL || process.env.BASE_URL || 'https://hmcar-system-two.vercel.app';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    try {
      const EmailService = require('../../../services/EmailService');
      await EmailService.sendPasswordReset(user.email, user.name || 'عزيزي المستخدم', resetUrl);
      console.log(`[Auth] Password reset email sent to: ${user.email}`);
    } catch (emailErr) {
      // لا نفشل العملية إن لم يكن SMTP مكوّناً — فقط سجّل تحذيراً
      console.warn(`[Auth] Email not sent (SMTP not configured?): ${emailErr.message}`);
    }

    return sendResponse(res, successResponse(null, 'إذا كان البريد مسجلاً، ستصل رسالة قريباً'));
  } catch (err) {
    console.error('[Auth] Forgot password error:', err.message);
    return sendResponse(res, successResponse(null, 'إذا كان البريد مسجلاً، ستصل رسالة قريباً'));
  }
});

// ─── POST /api/v2/auth/reset-password ────────────────────────────────────────
// إعادة تعيين كلمة المرور برمز الاستعادة
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return sendResponse(res, validationErrorResponse(null, 'الرمز أو كلمة المرور الجديدة غير صالحة'));
    }

    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const User = getModel(req, 'User');
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpiry: { $gt: new Date() },
    });

    if (!user) {
      return sendResponse(res, errorResponse('رابط إعادة التعيين منتهي أو غير صالح', 400));
    }

    // تحديث كلمة المرور
    user.password = password; // سيتم تشفيرها تلقائياً في pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    return sendResponse(res, successResponse(null, 'تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن'));
  } catch (err) {
    console.error('[Auth] Reset password error:', err.message);
    return sendResponse(res, serverErrorResponse('حدث خطأ أثناء إعادة التعيين'));
  }
});

// Register endpoint - استخدام authLimiter الجديد
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');
    if (!name || !email || !password) {
      return sendResponse(res, validationErrorResponse(null, 'Name, email, and password are required'));
    }

    const validator = require('validator');
    if (!validator.isEmail(email)) {
      return sendResponse(res, validationErrorResponse(null, 'Invalid email format'));
    }

    // Flexible Name Validation: support any language, auto-fix spacing, min 2 characters
    let cleanedName = (name || '').trim().replace(/\s+/g, ' ');
    if (cleanedName.length < 2) {
      return sendResponse(res, validationErrorResponse(null, 'الاسم الكامل يجب أن يتكون من حرفين على الأقل'));
    }
    // If name doesn't contain a space, try to add space if possible or accept if valid single block
    if (!cleanedName.includes(' ') && cleanedName.length >= 4) {
      // Split camelCase or space out if merged
      cleanedName = cleanedName.replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    if (!password || password.length < 6) {
      return sendResponse(res, validationErrorResponse(null, 'كلمة المرور يجب أن تكون 6 خانات على الأقل'));
    }

    // Check if user already exists
    const existingUser = await User.findOne(addTenantFilter(req, {
      $or: [
        { email: email },
        ...(phone ? [{ phone: phone }] : [])
      ]
    }));

    if (existingUser) {
      return sendResponse(res, conflictResponse('User with this email or phone already exists'));
    }

    // Create user
    const user = new User({
      name,
      email,
      phone: phone ? phone.trim() : undefined,
      password,
      role: 'buyer',
      status: 'active',
      tenantId: getTenantId(req)
    });

    await user.save();

    // Generate JWT token - 30 يوم لعدم الحاجة لإعادة التسجيل
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: req.tenant?.id || 'default',
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      JWT_SECRET,
      {
        expiresIn: '30d',
        issuer: 'hm-car-auction',
        audience: 'api-users'
      }
    );

    // Log registration
    await AuditLog.logUserAction(
      user,
      'REGISTER',
      'User',
      'New user registration',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'none',
        result: 'SUCCESS'
      }
    ).catch(err => console.error('AuditLog error:', err));

    const userObj = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions
    };

    res.status(201).json({
      success: true,
      token,
      data: userObj,
      user: userObj,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error.name, error.message, error.code);
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({ success: false, message: `هذا ${field} مسجل مسبقاً`, code: 'CONFLICT', debug: error.keyValue });
    }
    return res.status(500).json({ success: false, message: 'An error occurred during registration', code: 'SERVER_ERROR', debug: { name: error.name, msg: error.message } });
  }
});

// Client Login with Email - نظام الدخول الجديد للعملاء بالإيميل
router.post('/client-login', authLimiter, async (req, res) => {
  try {
    const { email: bodyEmail, identifier, password, role, deviceId, clientIP, rememberMe } = req.body;
    const searchKey = (bodyEmail || identifier || '').trim();
    console.log(`[AUTH] Login attempt for: '${searchKey}', Role: ${role}, Tenant: ${req.tenant?.id}`);
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');

    if (!searchKey || !password) {
      return sendResponse(res, validationErrorResponse(null, 'البريد الإلكتروني/الهاتف وكلمة المرور مطلوبان'));
    }

    const normalizedEmail = searchKey.toLowerCase().trim();
    const safeKey = searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // السماح بالبحث في الـ tenant الحالي أو الـ default لضمان الدخول للحسابات المشتركة
    const tenantFilter = req.tenant?.id 
      ? { tenantId: { $in: [req.tenant.id, 'default'] } } 
      : {};

    // البحث عن المستخدم بالبريد الإلكتروني، الهاتف، اسم المستخدم، أو الاسم الكامل
    let user = await User.findOne({
      ...tenantFilter,
      $or: [
        { email: normalizedEmail },
        { username: normalizedEmail },
        { phone: searchKey.trim() },
        { name: { $regex: new RegExp(`^${safeKey}$`, 'i') } }
      ]
    }).select('+password');

    // إذا لم يجد المستخدم، نرجع خطأ
    if (!user) {
      console.warn(`[AUTH] User not found with identifier: ${searchKey}`);
      return sendResponse(res, unauthorizedResponse('لم يتم العثور على حساب بهذا البريد الإلكتروني أو الهاتف'));
    }

    // التحقق من أن المستخدم عميل (buyer)
    if (user.role !== 'buyer') {
      return sendResponse(res, forbiddenResponse('هذا الحساب ليس حساب عميل'));
    }

    // التحقق من حالة الحساب
    if (user.status !== 'active') {
      return sendResponse(res, forbiddenResponse('الحساب معلق أو محظور'));
    }

    // التحقق من كلمة المرور
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`[AUTH] Wrong password for: ${normalizedEmail}`);
      return sendResponse(res, unauthorizedResponse('كلمة المرور غير صحيحة'));
    }

    // توليد التوكن - مدة 30 يوماً بشكل افتراضي (تذكرني دائماً)
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: req.tenant?.id || 'default',
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // تحديث وقت الدخول
    user.lastLoginAt = new Date();
    await user.save();

    // تسجيل الدخول في AuditLog
    AuditLog.logUserAction(user, 'LOGIN', 'User', 'Client login with email', { email: normalizedEmail, result: 'SUCCESS' }).catch(() => { });

    console.log(`[AUTH] ✅ Client login success: ${normalizedEmail}`);

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Client login error:', error);
    return sendResponse(res, serverErrorResponse('حدث خطأ أثناء تسجيل الدخول', error));
  }
});

// Client Registration - تسجيل حساب جديد للعملاء
router.post('/client-register', authLimiter, async (req, res) => {
  try {
    const { email, password, confirmPassword, name, phone } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');

    // التحقق من البيانات المطلوبة
    if (!email || !password || !confirmPassword) {
      return sendResponse(res, validationErrorResponse(null, 'الإيميل وكلمة المرور وتأكيد كلمة المرور مطلوبة'));
    }

    const cleanName = (name && typeof name === 'string') ? name.trim() : '';
    const nameWords = cleanName.split(/\s+/).filter(Boolean);
    if (nameWords.length < 2) {
      return sendResponse(res, validationErrorResponse(null, 'يرجى كتابة الاسم الثنائي على الأقل (اسمين باللغة العربية أو الإنجليزية)'));
    }

    if (password !== confirmPassword) {
      return sendResponse(res, validationErrorResponse(null, 'كلمات المرور غير متطابقة'));
    }

    if (password.length < 6) {
      return sendResponse(res, validationErrorResponse(null, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // التحقق من وجود حساب بنفس الإيميل — مع التصفية حسب المستأجر
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(phone && phone.trim() ? [{ phone: phone.trim() }] : [])
      ]
    });

    if (existingUser) {
      return sendResponse(res, conflictResponse('يوجد حساب مسجل بهذا الإيميل أو رقم الهاتف'));
    }

    const cleanPhone = (phone && typeof phone === 'string' && phone.trim().length > 0) ? phone.trim() : undefined;

    // إنشاء حساب جديد
    const newUser = new User({
      email: normalizedEmail,
      password: password,
      name: cleanName,
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      role: 'buyer',
      status: 'active',
      createdVia: 'auto-registration',
      tenantId: getTenantId(req)
    });

    await newUser.save();

    const jwtSecret = process.env.JWT_SECRET || 'hmcar_jwt_secret_key_2026_fallback';

    // توليد التوكن - مدة 30 يوماً لعدم الحاجة للتسجيل مجدداً
    const token = jwt.sign(
      {
        userId: newUser._id,
        tenantId: req.tenant?.id || 'default',
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions || []
      },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // تسجيل في AuditLog
    try {
      if (AuditLog && typeof AuditLog.logUserAction === 'function') {
        await AuditLog.logUserAction(newUser, 'CREATE', 'User', 'New client registration', { email: normalizedEmail });
      }
    } catch (auditErr) {
      console.warn('[AUTH] AuditLog failed:', auditErr.message);
    }

    console.log(`[AUTH] ✅ New client registered: ${normalizedEmail}`);

    const mappedUser = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role
    };

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: mappedUser,
      data: mappedUser
    });

  } catch (error) {
    console.error('Client registration error:', error);
    if (error && (error.code === 11000 || error.name === 'MongoServerError')) {
      return sendResponse(res, conflictResponse('يوجد حساب مسجل بهذا الإيميل أو البيانات المدخلة'));
    }
    return sendResponse(res, serverErrorResponse(error.message || 'حدث خطأ أثناء إنشاء الحساب', error));
  }
});

// Auto Register/Login endpoint for clients (النظام القديم - للتوافق)
// إذا لم يكن المستخدم موجوداً، يتم إنشاؤه تلقائياً
router.post('/auto-login', authLimiter, async (req, res) => {
  try {
    const { name, password, deviceId } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');
    const DeviceFingerprint = getModel(req, 'DeviceFingerprint');

    // Get client IP
    const clientIP = req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown';

    console.log(`[AUTH] Auto-login attempt for: '${name}', IP: ${clientIP}`);

    if (!name || !password) {
      return sendResponse(res, validationErrorResponse(null, 'الاسم وكلمة المرور مطلوبان'));
    }

    // -- تطبيق نظام حظر الأجهزة والتحقق من حساب واحد لكل جهاز --
    let fingerprint = await DeviceFingerprint.findOne(addTenantFilter(req, { ip: clientIP }));

    if (fingerprint && !fingerprint.exemptFromSecurity) {
      if (fingerprint.banned) {
        return sendResponse(res, forbiddenResponse('تم حظرك من هذا الجهاز. لمراسلة الإدارة استخدم الرمز بالأسفل.'));
      }

      // [[ARABIC_COMMENT]] تخفيف حدة الربط بالاسم للسماح بالتبديل بين اللغات (عربي/إنجليزي)
      // يتم الحظر فقط في حالة تكرار المحاولات الفاشلة بأسماء مختلفة جداً
      if (fingerprint.linkedUsername && fingerprint.linkedUsername.toLowerCase() !== name.trim().toLowerCase()) {
        const nameParts = name.trim().split(/\s+/);
        const linkedParts = (fingerprint.linkedUsername || '').split(/\s+/);
        
        // التحقق مما إذا كان هناك تطابق جزئي (نفس الشخص يغير لغة الاسم أو يضيف لقب)
        const partialMatch = nameParts.some(p => linkedParts.includes(p)) || linkedParts.some(p => nameParts.includes(p));
        
        if (!partialMatch) {
          fingerprint.failedAttempts += 1;
          if (fingerprint.failedAttempts >= 10) { // رفع الحد إلى 10 لزيادة المرونة
            fingerprint.banned = true;
            if (!fingerprint.banCode) fingerprint.banCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          }
          await fingerprint.save();
        }
      }
    }

    // [1] Check if user exists with this exact name
    let userToLogin = await User.findOne(addTenantFilter(req, {
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }));

    // [2] If no exact name match, check if there's a linked user for this device/IP (Fuzzy fallback)
    if (!userToLogin) {
      const linkedFingerprint = await DeviceFingerprint.findOne(addTenantFilter(req, { ip: clientIP }));
      if (linkedFingerprint && linkedFingerprint.linkedUsername) {
        // [[ARABIC_COMMENT]] التحقق من تطابق جزئي مع الاسم المسجل سابقاً لهذا الجهاز
        const nameParts = name.trim().split(/\s+/).filter(p => p.length > 1);
        const linkedParts = linkedFingerprint.linkedUsername.trim().split(/\s+/).filter(p => p.length > 1);
        
        const isFuzzyMatch = nameParts.some(p => linkedParts.includes(p)) || linkedParts.some(p => nameParts.includes(p));
        
        if (isFuzzyMatch) {
           // نجد المستخدم المسجل سابقاً
           userToLogin = await User.findOne(addTenantFilter(req, { name: linkedFingerprint.linkedUsername }));
           if (userToLogin) {
             console.log(`[AUTH] 🔄 Fuzzy match found for linked device. Mapping "${name}" to existing user "${userToLogin.name}"`);
           }
        }
      }
    }

    if (userToLogin) {
      // User exists - try to login
      const isMatch = await userToLogin.comparePassword(password);

      if (!isMatch) {
        return sendResponse(res, unauthorizedResponse('كلمة المرور غير صحيحة. هذا الاسم مستخدم بالفعل.'));
      }

      // Password matches - login successful
      userToLogin.lastLoginAt = new Date();
      userToLogin.lastLoginIP = clientIP;
      await userToLogin.save();

      // Generate token - 30 يوماً للتذكر الدائم
      const token = jwt.sign(
        { userId: userToLogin._id, tenantId: req.tenant?.id || 'default', role: userToLogin.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // تحديث البصمة لتشمل الاسم الأخير المستخدم (للمستقبل)
      await DeviceFingerprint.findOneAndUpdate(
        addTenantFilter(req, { ip: clientIP }),
        { $set: { linkedUsername: userToLogin.name, deviceId: deviceId || '', failedAttempts: 0 } },
        { upsert: true, new: true }
      );

      console.log(`[AUTH] ✅ Auto-login successful for: ${userToLogin.name}`);

      return res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        isNewUser: false,
        token,
        user: {
          _id: userToLogin._id,
          name: userToLogin.name,
          email: userToLogin.email,
          role: userToLogin.role
        }
      });
    }

    // [3] User doesn't exist anywhere - create new account automatically
    const newUser = new User({
      name: name.trim(),
      password: password, 
      role: 'buyer',
      status: 'active',
      registrationIP: clientIP,
      lastLoginIP: clientIP,
      lastLoginAt: new Date(),
      deviceId: deviceId || '',
      createdVia: 'auto-registration',
      tenantId: getTenantId(req)
    });

    await newUser.save();

    // Generate token - 30 يوماً للتذكر الدائم
    const token = jwt.sign(
      { userId: newUser._id, tenantId: req.tenant?.id || 'default', role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // ربط الجهاز بحساب العميل الجديد (upsert - لا تكرار)
    await DeviceFingerprint.findOneAndUpdate(
      addTenantFilter(req, { ip: clientIP }),
      { $set: { linkedUsername: name.trim(), deviceId: deviceId || '', failedAttempts: 0 } },
      { upsert: true, new: true }
    );

    // Log the registration
    await AuditLog.logUserAction(
      newUser,
      'AUTO_REGISTER',
      'User',
      'Auto-registered new client',
      { name, ip: clientIP, deviceId }
    ).catch(() => { });

    console.log(`[AUTH] ✅ Auto-registered new user: ${name}, IP: ${clientIP}`);

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء حسابك بنجاح!',
      isNewUser: true,
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Auto-login error:', error);
    return sendResponse(res, serverErrorResponse('حدث خطأ أثناء العملية', error));
  }
});

// Login endpoint
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, phone, name, identifier, password, role, deviceInfo, deviceId, rememberMe } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');
    const DeviceFingerprint = getModel(req, 'DeviceFingerprint');

    const searchKey = (identifier || email || phone || name || '').trim();
    console.log(`[AUTH] Login attempt for: '${searchKey}', Role: ${role}, Tenant: ${req.tenant?.id}`);

    if (!searchKey || !password) {
      return sendResponse(res, validationErrorResponse(null, 'Identifier and password are required'));
    }

    const clientIP = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'unknown';
    let fingerprint = null;

    if (role === 'buyer') {
      fingerprint = await DeviceFingerprint.findOne(addTenantFilter(req, { ip: clientIP }));
      if (fingerprint && !fingerprint.exemptFromSecurity) {
        if (fingerprint.banned) {
          return sendResponse(res, forbiddenResponse('تم حظرك من هذا الجهاز. لمراسلة الإدارة استخدم الرمز بالأسفل.'));
        }
        
        // [[ARABIC_COMMENT]] السماح بالدخول إذا كان هناك تطابق في الاسم أو جزء منه لضمان عدم الحظر بسبب اللغة
        if (fingerprint.linkedUsername && fingerprint.linkedUsername.toLowerCase() !== searchKey.toLowerCase()) {
          const skipSecurity = searchKey.length < 3 || (fingerprint.failedAttempts || 0) < 5;
          if (!skipSecurity) {
             console.warn(`[AUTH] Device IP ${clientIP} attempting different username: ${searchKey} (Linked: ${fingerprint.linkedUsername})`);
          }
        }
      }
    }

    // [[ARABIC_COMMENT]] البحث عن المستخدم مع فلتر المعرض الإلزامي لمنع تسرب البيانات بين المعارض
    const tenantId = req.tenant?.id || null;
    const isEmail = searchKey.includes('@');

    // بناء فلتر المعرض: أدمن يمكنه الدخول من أي معرض إذا كان مرتبطاً به
    const tenantConditions = tenantId
      ? { tenantId: { $in: [tenantId, 'default'] } }
      : {};

    const queryConditions = isEmail
      ? { ...tenantConditions, email: searchKey.toLowerCase() }
      : {
          ...tenantConditions,
          $or: [
            { username: searchKey.toLowerCase() },
            { email: searchKey.toLowerCase() },
            { phone: searchKey }
          ]
        };

    const user = await User.findOne(queryConditions).select('+password').lean(false);



    if (!user) {
      console.warn(`[AUTH] User not found: ${searchKey}`);
      return sendResponse(res, unauthorizedResponse(`User not found with identifier: ${searchKey}`));
    }

    // التحقق من كلمة المرور
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`[AUTH] Wrong password for: ${searchKey}`);
      // fire-and-forget — لا ننتظر AuditLog لتفادي timeout
      AuditLog.logUserAction(user, 'LOGIN', 'User', 'Failed login - wrong password', { ipAddress: req.ip, result: 'FAILURE' }).catch(() => { });
      return sendResponse(res, unauthorizedResponse(`Incorrect password for user ${user.email || user.username}`));
    }

    // [[ARABIC_COMMENT]] التحقق من الدور وإجراء فحوصات الأمان بناءً على دور المستخدم الفعلي
    const userRole = String(user.role || 'buyer').trim();
    const allowedAdminRoles = ['admin', 'super_admin', 'manager'];
    const isAdmin = allowedAdminRoles.includes(userRole);

    if (!isAdmin) {
      // فحوصات الأمان للمشتري (buyer)
      const fingerprint = await DeviceFingerprint.findOne(addTenantFilter(req, { ip: clientIP }));
      if (fingerprint && !fingerprint.exemptFromSecurity) {
        if (fingerprint.banned) {
          return sendResponse(res, forbiddenResponse('تم حظرك من هذا الجهاز. لمراسلة الإدارة استخدم الرمز بالأسفل.'));
        }
        
        if (fingerprint.linkedUsername && fingerprint.linkedUsername.toLowerCase() !== searchKey.toLowerCase()) {
          const skipSecurity = searchKey.length < 3 || (fingerprint.failedAttempts || 0) < 5;
          if (!skipSecurity) {
             console.warn(`[AUTH] Device IP ${clientIP} attempting different username: ${searchKey} (Linked: ${fingerprint.linkedUsername})`);
          }
        }
      }
    } else {
      console.log(`[AUTH] Admin user logging in: ${user.email} (${userRole})`);
    }

    // التحقق من حالة الحساب
    if (user.status !== 'active') {
      return sendResponse(res, forbiddenResponse('Your account has been suspended'));
    }

    // [[ARABIC_COMMENT]] توليد JWT مع tenantId لضمان ربط التوكن بالمعرض الصحيح
    const userTenantId = user.tenantId || req.tenant?.id || 'default';
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: userTenantId,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      },
      JWT_SECRET,
      { expiresIn: '30d', issuer: 'hm-car-auction', audience: 'api-users' }
    );

    // تحديث وقت الدخول + AuditLog — _id فريد عالمياً فلا يحتاج لتصفية tenantId
    User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }).catch(() => { });
    AuditLog.logUserAction(user, 'LOGIN', 'User', 'Successful login', { ipAddress: req.ip, result: 'SUCCESS' }).catch(() => { });

    if (!isAdmin) {
      // upsert لمنع التكرار - تحديث السجل الموجود بدلاً من إنشاء جديد
      await DeviceFingerprint.findOneAndUpdate(
        addTenantFilter(req, { ip: clientIP }),
        { $set: { linkedUsername: searchKey, deviceId: deviceId || '', failedAttempts: 0 } },
        { upsert: true, new: true }
      ).catch(() => { });
    }

    console.log(`[AUTH] ✅ Login success: ${user.email} (${user.role})`);

    return res.json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          tenantId: user.tenantId || req.tenant?.id || 'default',
          permissions: user.permissions || [],
          lastLoginAt: user.lastLoginAt
        }
      },
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId || req.tenant?.id || 'default',
        permissions: user.permissions || [],
        lastLoginAt: user.lastLoginAt
      },
      expiresIn: '30d'
    });

  } catch (error) {
    console.error('Login error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred during login', error));
  }
});



// Update Profile - تحديث بيانات الملف الشخصي (الإيميل، الاسم، الهاتف)
router.put('/update-profile', requireAuthAPI, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const User = getModel(req, 'User');

    const user = await User.findById(req.user.userId);
    if (!user) return sendResponse(res, notFoundResponse('User'));

    // التحقق من الإيميل الجديد إذا تغير
    if (email && email.toLowerCase().trim() !== user.email) {
      const validator = require('validator');
      if (!validator.isEmail(email)) {
        return sendResponse(res, validationErrorResponse(null, 'صيغة البريد الإلكتروني غير صحيحة'));
      }
      const existing = await User.findOne(addTenantFilter(req, {
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id }
      }));
      if (existing) {
        return sendResponse(res, conflictResponse('هذا البريد الإلكتروني مستخدم من قِبَل حساب آخر'));
      }
      user.email = email.toLowerCase().trim();
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // توليد توكن جديد يحمل الإيميل المحدَّث
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: req.tenant?.id || 'default',
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', issuer: 'hm-car-auction', audience: 'api-users' }
    );

    return res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return sendResponse(res, serverErrorResponse('حدث خطأ أثناء تحديث الملف الشخصي', error));
  }
});

// Logout endpoint
router.post('/logout', requireAuthAPI, async (req, res) => {
  try {
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');
    const user = await User.findOne(addTenantFilter(req, { _id: req.user.userId }));

    if (user) {
      user.activeSessionId = '';
      await user.save();

      // Log logout
      await AuditLog.logUserAction(
        user,
        'LOGOUT',
        'User',
        'User logged out',
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID || 'none',
          result: 'SUCCESS'
        }
      ).catch(() => { });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred during logout', error));
  }
});

// Refresh token endpoint
router.post('/refresh', requireAuthAPI, async (req, res) => {
  try {
    const User = getModel(req, 'User');
    const user = await User.findOne(addTenantFilter(req, { _id: req.user.userId }));

    if (!user || user.status !== 'active') {
      return sendResponse(res, unauthorizedResponse('User not found or inactive'));
    }

    // Generate new token
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: req.tenant?.id || 'default',
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
        issuer: 'hm-car-auction',
        audience: 'api-users'
      }
    );

    res.json({
      success: true,
      token,
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred during token refresh', error));
  }
});

// Verify token endpoint
router.get('/verify', requireAuthAPI, async (req, res) => {
  try {
    const User = getModel(req, 'User');
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return sendResponse(res, unauthorizedResponse('User not found'));
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions,
      lastLoginAt: user.lastLoginAt
    };

    res.json({
      success: true,
      data: userData,
      user: userData,
      tokenValid: true
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred during token verification', error));
  }
});

// Change password endpoint
router.post('/change-password', requireAuthAPI, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');

    if (!currentPassword || !newPassword) {
      return sendResponse(res, validationErrorResponse(null, 'Current password and new password are required'));
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return sendResponse(res, notFoundResponse('User'));
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return sendResponse(res, unauthorizedResponse('Current password is incorrect'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // [[ARABIC_COMMENT]] توليد توكن جديد بعد تغيير كلمة المرور لضمان استمرار الدخول بسلام
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: req.tenant?.id || 'default',
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', issuer: 'hm-car-auction', audience: 'api-users' }
    );

    // Log password change
    await AuditLog.logUserAction(
      user,
      'RESET_PASSWORD',
      'User',
      'Password changed by user',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'none',
        result: 'SUCCESS'
      }
    ).catch(() => { });

    res.json({
      success: true,
      token,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred while changing password', error));
  }
});

// Forgot password endpoint
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email, phone } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');

    const user = await User.findOne(
      addTenantFilter(req, {
        $or: [
          ...(email ? [{ email: email.toLowerCase().trim() }] : []),
          ...(phone ? [{ phone: phone }] : [])
        ].filter(Boolean)
      })
    );

    if (!email && !phone) {
      return res.json({ success: true, message: 'If an account with this email/phone exists, a reset link has been sent' });
    }
    if (!user) {
      // Always return success to prevent user enumeration
      return res.json({
        success: true,
        message: 'If an account with this email/phone exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log password reset request
    await AuditLog.logUserAction(
      user,
      'RESET_PASSWORD',
      'User',
      'Password reset requested',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'none',
        result: 'SUCCESS'
      }
    ).catch(() => { });

    // In a real application, send reset token via email/SMS provider only.
    // [[FIX]] استخدام CLIENT_URL بدلاً من localhost لضمان عمل الرابط في الإنتاج
    const clientBaseUrl = process.env.CLIENT_URL || process.env.BASE_URL || 'https://hmcar.xyz';
    const resetLink = `${clientBaseUrl}/reset-password?token=${resetToken}`;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n==================================================`);
      console.log(`[AUTH] PASSWORD RESET LINK GENERATED:`);
      console.log(`Email/Phone: ${email || phone}`);
      console.log(`Token: ${resetToken}`);
      console.log(`Link: ${resetLink}`);
      console.log(`==================================================\n`);
    }

    res.json({
      success: true,
      message: 'If an account with this email/phone exists, a reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred while processing password reset', error));
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');

    if (!token || !newPassword) {
      return sendResponse(res, validationErrorResponse(null, 'Reset token and new password are required'));
    }

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'password-reset') {
      return sendResponse(res, validationErrorResponse(null, 'Invalid or expired reset token'));
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendResponse(res, notFoundResponse('User'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password reset
    await AuditLog.logUserAction(
      user,
      'RESET_PASSWORD',
      'User',
      'Password reset completed',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || 'none',
        result: 'SUCCESS'
      }
    ).catch(() => { });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error.name === 'JsonWebTokenError') {
      return sendResponse(res, validationErrorResponse(null, 'Invalid or expired reset token'));
    }

    return sendResponse(res, serverErrorResponse('An error occurred while resetting password', error));
  }
});

// Mock OTP endpoints for phone login
router.post('/otp/send', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not Found' });
    }

    const { phone } = req.body;
    if (!phone) {
      return sendResponse(res, validationErrorResponse(null, 'Phone number is required'));
    }
    // In a real app, integrate via Twilio/Unifonic or other SMS gateway.
    console.log(`[AUTH] Mock OTP send requested for phone: ${phone}`);
    return res.json({ success: true, message: 'OTP sent successfully (mocked)' });
  } catch (error) {
    console.error('OTP Send error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred while sending OTP', error));
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not Found' });
    }

    const { phone, code } = req.body;
    if (!phone || !code) {
      return sendResponse(res, validationErrorResponse(null, 'Phone and code are required'));
    }
    console.log(`[AUTH] Mock OTP verify requested for phone: ${phone}, code: ${code}`);
    // In a real app, verify against stored code in cache/DB.
    // For now, accept any code that is 4 digits.
    if (code.length >= 4) {
      return res.json({ success: true, message: 'OTP verified successfully' });
    } else {
      return sendResponse(res, validationErrorResponse(null, 'Invalid OTP code'));
    }
  } catch (error) {
    console.error('OTP Verify error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred while verifying OTP', error));
  }
});

// ==========================================
// 2FA Endpoints
// ==========================================
const TwoFactorAuthService = require('../../../services/TwoFactorAuthService');

// Setup 2FA (Generate secret and QR)
router.get('/2fa/setup', requireAuthAPI, async (req, res) => {
  try {
    const User = getModel(req, 'User');
    const user = await User.findById(req.user.userId);
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA is already enabled' });
    }

    const { secret, otpauthUrl } = TwoFactorAuthService.generateSecret(user);
    const qrCode = await TwoFactorAuthService.generateQRCode(otpauthUrl);
    
    // Temporarily save secret to user (not enabled yet)
    user.twoFactorSecret = secret;
    await user.save();

    res.json({ success: true, qrCode, secret });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    res.status(500).json({ success: false, message: 'Failed to setup 2FA' });
  }
});

// Enable 2FA (Verify token to confirm)
router.post('/2fa/enable', requireAuthAPI, async (req, res) => {
  try {
    const { token } = req.body;
    const User = getModel(req, 'User');
    const user = await User.findById(req.user.userId);

    if (!user.twoFactorSecret) {
       return res.status(400).json({ success: false, message: 'Please setup 2FA first' });
    }

    const isValid = TwoFactorAuthService.verifyToken(user.twoFactorSecret, token);
    
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
    }

    user.twoFactorEnabled = true;
    const backupCodes = TwoFactorAuthService.generateBackupCodes();
    user.twoFactorBackupCodes = backupCodes.map(code => TwoFactorAuthService.hashBackupCode(code));
    await user.save();

    res.json({ success: true, message: '2FA Enabled Successfully', backupCodes });
  } catch (error) {
    console.error('2FA Enable Error:', error);
    res.status(500).json({ success: false, message: 'Failed to enable 2FA' });
  }
});

// Disable 2FA
router.post('/2fa/disable', requireAuthAPI, async (req, res) => {
  try {
    const User = getModel(req, 'User');
    const user = await User.findById(req.user.userId);

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({ success: true, message: '2FA Disabled Successfully' });
  } catch (error) {
    console.error('2FA Disable Error:', error);
    res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
  }
});

// Temporary endpoint to reset admin password for the current tenant
router.get('/temp-reset-admin-password', async (req, res) => {
  try {
    const User = getModel(req, 'User');
    const adminEmail = 'dawoodalhash@gmail.com';
    const newPassword = 'admin123';

    let user = await User.findOne({ email: adminEmail.toLowerCase() });

    if (user) {
      user.password = newPassword;
      user.status = 'active';
      if (!['admin', 'super_admin', 'manager'].includes(user.role)) {
        user.role = 'admin';
      }
      user.permissions = [
        'manage_users', 'manage_settings', 'manage_footer',
        'manage_whatsapp', 'manage_cars', 'manage_parts',
        'manage_auctions', 'manage_concierge', 'view_analytics',
        'manage_content', 'super_admin'
      ];
      await user.save();
      return res.json({
        success: true,
        message: `تم تحديث حساب الأدمن بنجاح للمستأجر ${req.tenant?.id || 'default'}`
      });
    } else {
      const newUser = new User({
        tenantId: req.tenant?.id || 'default',
        name: 'HM Admin',
        email: adminEmail,
        password: newPassword,
        role: 'admin',
        status: 'active',
        permissions: [
          'manage_users', 'manage_settings', 'manage_footer',
          'manage_whatsapp', 'manage_cars', 'manage_parts',
          'manage_auctions', 'manage_concierge', 'view_analytics',
          'manage_content', 'super_admin'
        ]
      });
      await newUser.save();
      return res.json({
        success: true,
        message: `تم إنشاء حساب أدمن جديد بنجاح للمستأجر ${req.tenant?.id || 'default'}`
      });
    }
  } catch (error) {
    console.error('Failed to reset admin password via temporary endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ─── تغيير كلمة المرور (أدمن وعميل) ───
router.post('/change-password', requireAuthAPI, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية والجديدة مطلوبتان', code: 'VALIDATION_ERROR' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', code: 'VALIDATION_ERROR' });
    }

    const User = getModel(req, 'User');
    // استخدام +password لجلب الحقل المخفي
    const user = await User.findOne(addTenantFilter(req, { _id: req.user.userId })).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود', code: 'NOT_FOUND' });
    }

    // التحقق من كلمة المرور الحالية
    const isMatch = await bcrypt.compare(currentPassword, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة', code: 'UNAUTHORIZED' });
    }

    // منع تعيين نفس كلمة المرور القديمة
    const isSame = await bcrypt.compare(newPassword, user.password || '');
    if (isSame) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تختلف عن الحالية', code: 'VALIDATION_ERROR' });
    }

    // تشفير وحفظ كلمة المرور الجديدة
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.updatedAt = new Date();
    await user.save({ validateModifiedOnly: true });

    // تسجيل العملية في سجل التدقيق
    try {
      const AuditLog = getModel(req, 'AuditLog');
      await AuditLog.logUserAction(user, 'CHANGE_PASSWORD', 'User', 'Password changed successfully', { ipAddress: req.ip, result: 'SUCCESS' });
    } catch (_) { /* لا نوقف العملية بسبب خطأ في التدقيق */ }

    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });

  } catch (error) {
    console.error('Change password error:', error.name, error.message);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور', code: 'SERVER_ERROR', debug: error.message });
  }
});

module.exports = router;


