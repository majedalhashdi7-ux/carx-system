// [[ARABIC_HEADER]] نظام بصمة الجهاز المتطور - HM CAR Multi-Tenant Security

/**
 * @file models/DeviceFingerprint.js
 * @description نموذج بصمة الجهاز المتطور
 * 
 * التحسينات عن النظام القديم:
 * 1. بصمة مركبة (IP + Browser + OS + Screen + Timezone) بدلاً من IP فقط
 * 2. نظام مستوى ثقة (Trust Score) ذكي يتحسن مع الوقت
 * 3. تتبع الجهاز مع تسامح (IP يتغير لكن البصمة تبقى)
 * 4. دعم أجهزة متعددة على نفس الشبكة (WiFi مشترك)
 * 5. نظام أحداث أمنية مفصل (Security Events Timeline)
 * 6. كشف الأنماط المشبوهة (Anomaly Detection)
 */

const mongoose = require('mongoose');

// ── حدث أمني (Security Event) ──
const securityEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'login_success',        // دخول ناجح
      'login_failed',         // دخول فاشل
      'account_switch',       // محاولة تغيير الحساب
      'ip_changed',           // تغيير IP
      'device_changed',       // تغيير في معلومات الجهاز
      'banned_manually',      // حظر يدوي من الأدمن
      'unbanned_manually',    // فك حظر يدوي
      'auto_banned',          // حظر تلقائي
      'suspicious_activity',  // نشاط مشبوه
      'brute_force',          // هجوم القوة الغاشمة
      'geo_anomaly',          // تغيير موقع جغرافي مفاجئ
      'trusted',              // تم الوثوق بالجهاز
      'untrusted',            // إلغاء الثقة
    ],
    required: true
  },
  detail: { type: String, default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  username: { type: String, default: '' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const deviceFingerprintSchema = new mongoose.Schema({
  // ══════════════════════════════════════
  // معرّفات الجهاز (المركبة)
  // ══════════════════════════════════════
  
  // البصمة الفريدة المركبة (hash من عدة عناصر)
  fingerprintHash: { type: String, index: true, default: '' },
  
  // عناصر البصمة المنفصلة
  ip: { type: String, required: true, index: true },
  deviceId: { type: String, default: '', index: true },
  
  // معلومات المتصفح والنظام
  browser: { type: String, default: 'unknown' },
  browserVersion: { type: String, default: '' },
  os: { type: String, default: 'unknown' },
  osVersion: { type: String, default: '' },
  platform: { type: String, default: 'unknown' }, // desktop, mobile, tablet
  
  // معلومات الشاشة (للتمييز بين أجهزة على نفس الشبكة)
  screenResolution: { type: String, default: '' },
  timezone: { type: String, default: '' },
  language: { type: String, default: '' },
  
  // ══════════════════════════════════════
  // ربط الحساب
  // ══════════════════════════════════════
  
  // الحساب المرتبط الرئيسي
  linkedUsername: { type: String, default: '' },
  linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // الحسابات الأخرى التي حاولت الدخول من هذا الجهاز
  attemptedUsernames: [{ 
    username: String, 
    attempts: { type: Number, default: 1 },
    lastAttempt: { type: Date, default: Date.now },
    blocked: { type: Boolean, default: false }
  }],
  
  // ══════════════════════════════════════
  // نظام مستوى الثقة (Trust Score)
  // ══════════════════════════════════════
  
  // مستوى الثقة (0-100): كلما زاد كلما كان الجهاز أكثر ثقة
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  
  // حالة الثقة
  trustLevel: { 
    type: String, 
    enum: ['unknown', 'low', 'medium', 'high', 'trusted', 'blocked'], 
    default: 'unknown' 
  },
  
  // عوامل الثقة (لماذا أعطيناه هذا المستوى)
  trustFactors: {
    // إيجابية
    successfulLogins: { type: Number, default: 0 },    // عدد الدخول الناجح
    daysActive: { type: Number, default: 0 },          // عدد الأيام الفعلية
    consistentUsage: { type: Boolean, default: false }, // استخدام منتظم
    adminApproved: { type: Boolean, default: false },   // موافقة أدمن
    
    // سلبية
    failedAttempts: { type: Number, default: 0 },       // محاولات فاشلة
    accountSwitchAttempts: { type: Number, default: 0 }, // محاولات تغيير حساب
    suspiciousActions: { type: Number, default: 0 },     // تصرفات مشبوهة
    ipChanges: { type: Number, default: 0 },            // عدد تغييرات الـ IP
  },
  
  // ══════════════════════════════════════
  // الحظر والأمان
  // ══════════════════════════════════════
  
  banned: { type: Boolean, default: false },
  banCode: { type: String, default: '' },
  banReason: { type: String, default: '' },
  bannedAt: { type: Date, default: null },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  banExpiresAt: { type: Date, default: null }, // حظر مؤقت
  
  unbannedAt: { type: Date, default: null },
  unbannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // معفى من القيود الأمنية
  exemptFromSecurity: { type: Boolean, default: false },
  exemptReason: { type: String, default: '' },
  exemptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // عدد المحاولات الفاشلة المتتالية (Legacy + جديد)
  failedAttempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date, default: Date.now },
  
  // ══════════════════════════════════════
  // سجل الأحداث الأمنية (Timeline)
  // ══════════════════════════════════════
  securityEvents: {
    type: [securityEventSchema],
    default: [],
    // نحتفظ بآخر 50 حدث فقط لتوفير المساحة
    validate: [arr => arr.length <= 100, 'الحد الأقصى 100 حدث أمني']
  },
  
  // ══════════════════════════════════════
  // تاريخ الـ IPs (لتتبع تغيرات الشبكة)
  // ══════════════════════════════════════
  ipHistory: [{
    ip: String,
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    hitCount: { type: Number, default: 1 },
  }],
  
  // ══════════════════════════════════════
  // معلومات إضافية
  // ══════════════════════════════════════
  
  // الموقع الجغرافي التقريبي (من الـ IP)
  geoLocation: {
    country: { type: String, default: '' },
    city: { type: String, default: '' },
    region: { type: String, default: '' },
  },
  
  // ملاحظات الأدمن
  adminNotes: { type: String, default: '' },
  
  // رابط المعرض (Multi-Tenant)
  tenantId: { type: String, default: '' },

}, { timestamps: true });

// ══════════════════════════════════════
// الفهارس
// ══════════════════════════════════════
deviceFingerprintSchema.index({ ip: 1, deviceId: 1 });
deviceFingerprintSchema.index({ linkedUsername: 1 });
deviceFingerprintSchema.index({ banned: 1 });
deviceFingerprintSchema.index({ trustLevel: 1 });
deviceFingerprintSchema.index({ tenantId: 1 });
deviceFingerprintSchema.index({ 'trustFactors.failedAttempts': 1 });

// ══════════════════════════════════════
// Methods
// ══════════════════════════════════════

/**
 * إضافة حدث أمني
 */
deviceFingerprintSchema.methods.addSecurityEvent = function(type, detail, extra = {}) {
  const event = {
    type,
    detail,
    ip: extra.ip || this.ip,
    userAgent: extra.userAgent || '',
    username: extra.username || this.linkedUsername,
    adminId: extra.adminId || null,
    timestamp: new Date(),
  };
  
  this.securityEvents.push(event);
  
  // احتفظ بآخر 50 حدث فقط
  if (this.securityEvents.length > 50) {
    this.securityEvents = this.securityEvents.slice(-50);
  }
  
  return this;
};

/**
 * حساب مستوى الثقة
 */
deviceFingerprintSchema.methods.calculateTrustScore = function() {
  let score = 50; // نبدأ من الوسط
  
  const factors = this.trustFactors;
  
  // إيجابيات
  score += Math.min(factors.successfulLogins * 2, 20);    // +2 لكل دخول ناجح (حد 20)
  score += Math.min(factors.daysActive * 1, 15);          // +1 لكل يوم (حد 15)
  score += factors.consistentUsage ? 5 : 0;               // +5 لاستخدام منتظم
  score += factors.adminApproved ? 15 : 0;                 // +15 لموافقة أدمن
  
  // سلبيات
  score -= Math.min(factors.failedAttempts * 3, 30);       // -3 لكل فشل (حد 30)
  score -= Math.min(factors.accountSwitchAttempts * 10, 40);// -10 لكل محاولة تغيير (حد 40)
  score -= Math.min(factors.suspiciousActions * 5, 25);    // -5 لكل تصرف مشبوه (حد 25)
  
  // تطبيق الحدود
  score = Math.max(0, Math.min(100, score));
  
  this.trustScore = score;
  
  // تحديد مستوى الثقة
  if (this.banned) {
    this.trustLevel = 'blocked';
  } else if (score >= 80) {
    this.trustLevel = 'trusted';
  } else if (score >= 60) {
    this.trustLevel = 'high';
  } else if (score >= 40) {
    this.trustLevel = 'medium';
  } else if (score >= 20) {
    this.trustLevel = 'low';
  } else {
    this.trustLevel = 'unknown';
  }
  
  return score;
};

/**
 * تسجيل دخول ناجح
 */
deviceFingerprintSchema.methods.recordSuccessfulLogin = function(username, ip, userAgent) {
  this.trustFactors.successfulLogins += 1;
  this.failedAttempts = 0;
  this.linkedUsername = username;
  this.lastAttemptAt = new Date();
  
  // تحديث IP history
  this.updateIpHistory(ip);
  
  this.addSecurityEvent('login_success', `دخول ناجح: ${username}`, { ip, userAgent, username });
  this.calculateTrustScore();
  
  return this;
};

/**
 * تسجيل محاولة فاشلة
 */
deviceFingerprintSchema.methods.recordFailedLogin = function(username, ip, reason) {
  this.trustFactors.failedAttempts += 1;
  this.failedAttempts += 1;
  this.lastAttemptAt = new Date();
  
  this.addSecurityEvent('login_failed', `محاولة فاشلة: ${reason}`, { ip, username });
  this.calculateTrustScore();
  
  return this;
};

/**
 * تسجيل محاولة تغيير حساب
 */
deviceFingerprintSchema.methods.recordAccountSwitchAttempt = function(newUsername, ip) {
  this.trustFactors.accountSwitchAttempts += 1;
  
  // تسجيل في قائمة الأسماء المحاولة
  const existing = this.attemptedUsernames.find(
    a => a.username.toLowerCase() === newUsername.toLowerCase()
  );
  if (existing) {
    existing.attempts += 1;
    existing.lastAttempt = new Date();
  } else {
    this.attemptedUsernames.push({ username: newUsername, attempts: 1 });
  }
  
  this.addSecurityEvent('account_switch', `محاولة دخول بحساب مختلف: ${newUsername} (الأصلي: ${this.linkedUsername})`, { ip, username: newUsername });
  this.calculateTrustScore();
  
  return this;
};

/**
 * تحديث سجل IPs
 */
deviceFingerprintSchema.methods.updateIpHistory = function(ip) {
  const existing = this.ipHistory.find(h => h.ip === ip);
  if (existing) {
    existing.lastSeen = new Date();
    existing.hitCount += 1;
  } else {
    this.ipHistory.push({ ip, firstSeen: new Date(), lastSeen: new Date(), hitCount: 1 });
    this.trustFactors.ipChanges += 1;
  }
  
  // احتفظ بآخر 20 IP فقط
  if (this.ipHistory.length > 20) {
    this.ipHistory = this.ipHistory.slice(-20);
  }
};

/**
 * حظر تلقائي
 */
deviceFingerprintSchema.methods.autoBan = function(reason) {
  this.banned = true;
  this.banReason = reason;
  this.bannedAt = new Date();
  if (!this.banCode) {
    this.banCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  this.trustLevel = 'blocked';
  this.addSecurityEvent('auto_banned', reason);
  return this;
};

/**
 * التحقق مما إذا كان يجب حظر الجهاز تلقائياً
 */
deviceFingerprintSchema.methods.shouldAutoBan = function() {
  // حظر بعد 5 محاولات تغيير حساب
  if (this.trustFactors.accountSwitchAttempts >= 5) return 'محاولات تغيير حساب متكررة';
  // حظر بعد 10 محاولات فاشلة متتالية
  if (this.failedAttempts >= 10) return 'محاولات دخول فاشلة متكررة';
  // حظر إذا مستوى الثقة صفر
  if (this.trustScore <= 5) return 'مستوى ثقة منخفض جداً';
  return null;
};

// ══════════════════════════════════════
// Statics
// ══════════════════════════════════════

/**
 * البحث عن جهاز بعدة طرق (IP + DeviceId أو IP فقط)
 */
deviceFingerprintSchema.statics.findDevice = async function(ip, deviceId) {
  // أولاً: بحث بالبصمة الكاملة (IP + DeviceId)
  if (deviceId) {
    const exactMatch = await this.findOne({ ip, deviceId });
    if (exactMatch) return exactMatch;
  }
  
  // ثانياً: بحث بالـ IP فقط
  return this.findOne({ ip });
};

/**
 * الحصول على إحصائيات الأمان
 */
deviceFingerprintSchema.statics.getSecurityStats = async function() {
  const [total, banned, trusted, suspicious] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ banned: true }),
    this.countDocuments({ trustLevel: { $in: ['trusted', 'high'] } }),
    this.countDocuments({ trustLevel: { $in: ['low', 'unknown'] }, 'trustFactors.failedAttempts': { $gte: 3 } }),
  ]);
  
  return { total, banned, trusted, suspicious };
};

module.exports = mongoose.model('DeviceFingerprint', deviceFingerprintSchema);
