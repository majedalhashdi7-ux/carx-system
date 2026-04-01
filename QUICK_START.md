# دليل البدء السريع - HM CAR System

## 🚀 الخطوات الفورية (يجب تنفيذها الآن)

### 1️⃣ إزالة الملفات الحساسة من Git

```bash
# إزالة .env من Git
git rm --cached .env
git rm --cached client-app/.env.local
git rm --cached client-app/.env.production

# Commit التغييرات
git add .
git commit -m "security: remove sensitive files and fix domain issues"
git push
```

### 2️⃣ تغيير المفاتيح السرية

**افتح ملف `.env` وغير:**

```bash
# توليد مفاتيح جديدة
openssl rand -hex 32  # للـ JWT_SECRET
openssl rand -hex 32  # للـ SESSION_SECRET
```

**المفاتيح المطلوب تغييرها:**
- JWT_SECRET
- SESSION_SECRET
- PROD_ADMIN_PASSWORD (اختر كلمة سر قوية)

### 3️⃣ تحديث Vercel Environment Variables

1. افتح [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر المشروع
3. Settings > Environment Variables
4. أضف/حدث المتغيرات من `.env.example`

**المتغيرات المطلوبة:**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=<المفتاح الجديد>
SESSION_SECRET=<المفتاح الجديد>
BASE_URL=https://hmcar.okigo.net
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 4️⃣ إصلاح البيانات

```bash
# إصلاح سنة السيارات + المزادات + الواتساب
npm run fix:live
```

### 5️⃣ إعادة النشر

```bash
# التحقق من الإعدادات
npm run validate

# إعادة النشر
npm run deploy
```

---

## ✅ التحقق من نجاح الإصلاحات

### اختبار 1: الموقع يفتح
```bash
curl https://hmcar.okigo.net/health
```

**النتيجة المتوقعة:**
```json
{
  "status": "ok",
  "db": "connected",
  "env": "production"
}
```

### اختبار 2: API يعمل
```bash
curl https://hmcar.okigo.net/api/v2/cars?limit=1
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": { ... }
}
```

### اختبار 3: Client App يفتح
افتح المتصفح: https://hmcar.okigo.net

---

## 📋 ملخص المشاكل المصلحة

✅ **تم إصلاحه:**
1. مشكلة الدومين (hmcar.xyz → hmcar.okigo.net)
2. إعدادات CORS المتضاربة
3. Database connection pool للـ Serverless
4. إنشاء ملفات .env.example

⚠️ **يحتاج إجراء منك:**
1. إزالة .env من Git
2. تغيير المفاتيح السرية
3. تحديث Vercel environment variables
4. تشغيل npm run fix:live

---

## 🆘 في حالة المشاكل

### المشكلة: "MONGO_URI is not set"
**الحل:** تأكد من إضافة MONGO_URI في Vercel Environment Variables

### المشكلة: "CORS blocked"
**الحل:** 
1. امسح cache المتصفح
2. تأكد من rebuild client-app
3. تحقق من ALLOWED_ORIGINS في Vercel

### المشكلة: "Database connection timeout"
**الحل:**
1. افتح MongoDB Atlas
2. Network Access > Add IP Address > Allow Access from Anywhere (0.0.0.0/0)
3. أو أضف IP addresses لـ Vercel

---

## 📞 الدعم

راجع الملفات التالية للمزيد من التفاصيل:
- `ISSUES_REPORT.md` - تقرير شامل بجميع المشاكل
- `FIXES_APPLIED.md` - تفاصيل الإصلاحات المطبقة
- `.env.example` - نموذج المتغيرات المطلوبة

---

## ⏱️ الوقت المتوقع

- الخطوات 1-3: 10 دقائق
- الخطوة 4: 2-5 دقائق
- الخطوة 5: 5 دقائق

**المجموع: ~20 دقيقة**

---

تم إنشاء هذا الدليل بواسطة Kiro AI - 28 مارس 2026
