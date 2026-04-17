// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/auth.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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

// Register endpoint - استخدام authLimiter الجديد
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');
    if (!name || !email || !password) {
      return sendResponse(res, validationErrorResponse(null, 'Name, email, and password are required'));
    }

    // Validate Name (at least 2 words)
    if (name.trim().split(/\s+/).length < 2) {
      return sendResponse(res, validationErrorResponse(null, 'Full name must contain at least two names'));
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
      phone,
      password,
      role: 'buyer',
      status: 'active',
      tenantId: getTenantId(req)
    });

    await user.save();

    // Generate JWT token
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

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred during registration', error));
  }
});

// Client Login with Email - نظام الدخول الجديد للعملاء بالإيميل
router.post('/client-login', authLimiter, async (req, res) => {
  try {
    const { email, password, deviceId, rememberMe } = req.body;
    const User = getModel(req, 'User');
    const AuditLog = getModel(req, 'AuditLog');

    if (!email || !password) {
      return sendResponse(res, validationErrorResponse(null, 'الإيميل وكلمة المرور مطلوبان'));
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[AUTH] Client login attempt for email: '${normalizedEmail}'`);

    // البحث عن المستخدم بالإيميل
    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    // إذا لم يجد المستخدم، نرجع خطأ (لا يتم إنشاء حساب تلقائياً)
    if (!user) {
      console.warn(`[AUTH] User not found with email: ${normalizedEmail}`);
      return sendResponse(res, unauthorizedResponse('لم يتم العثور على حساب بهذا الإيميل'));
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

    // توليد التوكن
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d' }
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

    if (password !== confirmPassword) {
      return sendResponse(res, validationErrorResponse(null, 'كلمات المرور غير متطابقة'));
    }

    if (password.length < 6) {
      return sendResponse(res, validationErrorResponse(null, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // التحقق من وجود حساب بنفس الإيميل
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendResponse(res, conflictResponse('يوجد حساب مسجل بهذا الإيميل'));
    }

    // إنشاء حساب جديد
    const newUser = new User({
      email: normalizedEmail,
      password: password,
      name: name || normalizedEmail.split('@')[0],
      phone: phone || '',
      role: 'buyer',
      status: 'active',
      createdVia: 'client-registration'
    });

    await newUser.save();

    // توليد التوكن
    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // تسجيل في AuditLog
    AuditLog.logUserAction(newUser, 'REGISTER', 'User', 'New client registration', { email: normalizedEmail }).catch(() => { });

    console.log(`[AUTH] ✅ New client registered: ${normalizedEmail}`);

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Client registration error:', error);
    return sendResponse(res, serverErrorResponse('حدث خطأ أثناء إنشاء الحساب', error));
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

      // Generate token
      const token = jwt.sign(
        { userId: userToLogin._id, tenantId: req.tenant?.id || 'default', role: userToLogin.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
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

    // Generate token
    const token = jwt.sign(
      { userId: newUser._id, tenantId: req.tenant?.id || 'default', role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
    console.log(`[AUTH] Login attempt for: '${searchKey}', Role: ${role}`);

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

    // استخدام findOne بدل find لتفادي جلب كل المستخدمين
    const safeKey = searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne(addTenantFilter(req, {
      $or: [
        { email: searchKey.toLowerCase() },
        { username: searchKey.toLowerCase() },
        { phone: searchKey },
        { name: { $regex: new RegExp(`.*${safeKey}.*`, 'i') } }
      ]
    })).select('+password').lean(false);

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

    // [[ARABIC_COMMENT]] التحقق من الدور إذا كان المستخدم يحاول الدخول كمدير
    if (String(role).trim() === 'admin') {
      const allowedAdminRoles = ['admin', 'super_admin', 'manager'];
      const currentRole = String(user.role || '').trim();
      
      if (!allowedAdminRoles.includes(currentRole)) {
        console.warn(`[AUTH] Admin access denied for role: '${currentRole}'`);
        return sendResponse(res, forbiddenResponse('ليس لديك صلاحية الوصول إلى لوحة التحكم بصفتك عميل. تأكد من الدخول بالحساب الصحيح.'));
      }
    }

    // التحقق من حالة الحساب
    if (user.status !== 'active') {
      return sendResponse(res, forbiddenResponse('Your account has been suspended'));
    }

    // توليد التوكن
    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: req.tenant?.id || 'default',
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d', issuer: 'hm-car-auction', audience: 'api-users' }
    );

    // تحديث وقت الدخول + AuditLog — fire-and-forget لا ننتظرهما
    User.updateOne(addTenantFilter(req, { _id: user._id }), { $set: { lastLoginAt: new Date() } }).catch(() => { });
    AuditLog.logUserAction(user, 'LOGIN', 'User', 'Successful login', { ipAddress: req.ip, result: 'SUCCESS' }).catch(() => { });

    if (role === 'buyer') {
      // upsert لمنع التكرار - تحديث السجل الموجود بدلاً من إنشاء جديد
      await DeviceFingerprint.findOneAndUpdate(
        addTenantFilter(req, { ip: clientIP }),
        { $set: { linkedUsername: searchKey, deviceId: deviceId || '', failedAttempts: 0 } },
        { upsert: true, new: true }
      );
    }

    console.log(`[AUTH] ✅ Login success: ${user.email} (${user.role})`);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions || [],
        lastLoginAt: user.lastLoginAt
      },
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Login error:', error);
    return sendResponse(res, serverErrorResponse('An error occurred during login', error));
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

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        lastLoginAt: user.lastLoginAt
      },
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

    const user = await User.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    });

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
    // Never log or persist raw reset tokens.

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

module.exports = router;
