# دليل حل المشاكل - HM CAR

**Troubleshooting Guide**

---

## 🔧 مشاكل شائعة وحلولها

### 1. Database Connection Issues

**المشكلة:** `MongoServerError: connection refused`

**الحلول:**
```bash
# تحقق من MongoDB يعمل
mongod --version

# ابدأ MongoDB
mongod

# تحقق من connection string
echo $MONGODB_URI

# اختبر الاتصال
mongosh $MONGODB_URI
```

**المشكلة:** `Authentication failed`

**الحلول:**
```bash
# تحقق من username/password
# تحقق من database permissions
# أعد إنشاء user في MongoDB
```

---

### 2. Authentication Issues

**المشكلة:** `Token expired` أو `Invalid token`

**الحلول:**
```bash
# تحقق من JWT_SECRET في .env
# تأكد من JWT_EXPIRES_IN صحيح
# امسح tokens القديمة وسجل دخول جديد
```

**المشكلة:** `Unauthorized` على endpoints محمية

**الحلول:**
```bash
# تأكد من إرسال token في header:
Authorization: Bearer <token>

# تحقق من token صالح
# تحقق من user له permissions مطلوبة
```

---

### 3. Test Failures

**المشكلة:** Tests تفشل بسبب tenant middleware

**الحل:**
```javascript
// في test environment، عطل tenant middleware
if (process.env.NODE_ENV === 'test') {
  // Skip tenant middleware
}
```

**المشكلة:** `MongoMemoryServer` بطيء

**الحل:**
```bash
# استخدم MongoDB محلي للاختبارات
MONGODB_URI_TEST=mongodb://localhost:27017/test npm test
```

---

### 4. Performance Issues

**المشكلة:** API بطيء

**الحلول:**
```bash
# 1. أضف indexes للـ database
npm run optimize:db

# 2. فعّل Redis caching
REDIS_URL=redis://localhost:6379

# 3. تحقق من slow queries
db.setProfilingLevel(2)
```

---

### 5. Deployment Issues

**المشكلة:** Vercel deployment فشل

**الحلول:**
```bash
# تحقق من logs
vercel logs

# تحقق من build locally
npm run build

# تحقق من environment variables
vercel env ls
```

---

## 📞 الحصول على المساعدة

- 📧 support@hmcar.com
- 💬 Discord: https://discord.gg/hmcar
- 📖 Docs: https://docs.hmcar.com

---

**Last Updated:** March 31, 2026
