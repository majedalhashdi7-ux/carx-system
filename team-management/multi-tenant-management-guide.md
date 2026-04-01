# 🏢 دليل إدارة النظام متعدد العملاء (Multi-Tenant)

## 📋 فهم النظام الحالي

### ما لديك الآن:
- **hmcar**: العميل الأول (الأساسي)
- **carx**: العميل الثاني (تم إنشاؤه بواسطة الذكاء الاصطناعي)
- **نظام Multi-Tenant**: يسمح بإضافة عملاء جدد بسهولة

### كيف يعمل النظام:

```
مستخدم يدخل على hmcar.xyz
         ↓
النظام يحدد العميل من الدومين
         ↓
يفتح قاعدة بيانات hmcar
         ↓
يعرض شعار وألوان hmcar
         ↓
يعرض بيانات hmcar فقط
```

```
مستخدم يدخل على carx-motors.com
         ↓
النظام يحدد العميل من الدومين
         ↓
يفتح قاعدة بيانات carx
         ↓
يعرض شعار وألوان carx
         ↓
يعرض بيانات carx فقط
```

## 🎯 إدارة العملاء الحاليين

### العميل الأول: HMCAR
```json
{
  "id": "hmcar",
  "name": "HM CAR",
  "domains": ["hmcar.xyz", "www.hmcar.xyz"],
  "mongoUri": "ENV:MONGO_URI",
  "theme": {
    "primaryColor": "#D4AF37",  // ذهبي
    "backgroundColor": "#0f0f23"  // أسود
  }
}
```

### العميل الثاني: CARX
```json
{
  "id": "carx",
  "name": "CAR X",
  "domains": ["carx-motors.com", "carx-system.vercel.app"],
  "mongoUri": "ENV:MONGO_URI_CARX",
  "theme": {
    "primaryColor": "#000000",  // أسود
    "secondaryColor": "#ff0000"  // أحمر
  }
}
```

## 🔧 كيفية إدارة النظام

### 1. إضافة عميل جديد

#### الطريقة السهلة (باستخدام السكريبت):
```bash
node scripts/add-tenant.js
```

#### الطريقة اليدوية:

**الخطوة 1: إنشاء قاعدة بيانات MongoDB**
```bash
# في MongoDB Atlas:
1. إنشاء Database جديدة: alwaha_cars
2. إنشاء مستخدم جديد: alwaha_user
3. نسخ Connection String
```

**الخطوة 2: تعديل tenants.json**
```json
{
  "tenants": {
    "alwaha": {
      "id": "alwaha",
      "name": "معرض الواحة",
      "nameEn": "Al Waha Cars",
      "domains": ["alwaha-cars.com", "www.alwaha-cars.com"],
      "mongoUri": "mongodb+srv://alwaha_user:pass@cluster.mongodb.net/alwaha_cars",
      "logo": "/uploads/tenants/alwaha/logo.png",
      "theme": {
        "primaryColor": "#2ecc71",
        "secondaryColor": "#27ae60",
        "backgroundColor": "#ffffff",
        "textColor": "#2c3e50"
      },
      "contact": {
        "whatsapp": "+966501234567",
        "email": "info@alwaha-cars.com"
      },
      "enabled": true
    }
  }
}
```

**الخطوة 3: رفع الشعار**
```bash
mkdir -p uploads/tenants/alwaha
# ضع logo.png و favicon.ico في المجلد
```

**الخطوة 4: ربط الدومين**
```bash
# في مزود الدومين:
Type: A, Name: @, Value: [IP السيرفر]
Type: A, Name: www, Value: [IP السيرفر]

# في Vercel:
Settings > Domains > Add Domain
```

### 2. تعديل عميل موجود

```bash
# عدّل في tenants/tenants.json
# مثال: تغيير لون العميل
{
  "carx": {
    "theme": {
      "primaryColor": "#0066cc",  // أزرق جديد
      "secondaryColor": "#004499"
    }
  }
}

# أعد تشغيل السيرفر
npm run dev
```

### 3. تعطيل عميل مؤقتاً

```json
{
  "carx": {
    "enabled": false  // ← هنا
  }
}
```

### 4. حذف عميل نهائياً

```bash
# 1. احذف من tenants.json
# 2. احذف قاعدة البيانات من MongoDB
# 3. احذف مجلد الشعار
rm -rf uploads/tenants/carx/
```

## 🎨 إدارة الثيمات والألوان

### ثيمات جاهزة:

#### ثيم فاخر (أسود وذهبي):
```json
{
  "theme": {
    "primaryColor": "#FFD700",
    "secondaryColor": "#000000",
    "accentColor": "#C0C0C0",
    "backgroundColor": "#1a1a1a",
    "textColor": "#ffffff"
  }
}
```

#### ثيم حديث (أزرق وأبيض):
```json
{
  "theme": {
    "primaryColor": "#007AFF",
    "secondaryColor": "#5856D6",
    "accentColor": "#FF3B30",
    "backgroundColor": "#F2F2F7",
    "textColor": "#000000"
  }
}
```

#### ثيم طبيعي (أخضر):
```json
{
  "theme": {
    "primaryColor": "#2ecc71",
    "secondaryColor": "#27ae60",
    "accentColor": "#3498db",
    "backgroundColor": "#ecf0f1",
    "textColor": "#2c3e50"
  }
}
```

## 🔗 إدارة الدومينات

### إضافة دومين جديد لعميل موجود:

```json
{
  "hmcar": {
    "domains": [
      "hmcar.xyz",
      "www.hmcar.xyz",
      "hmcar.com",        // ← جديد
      "www.hmcar.com",    // ← جديد
      "hmcar.sa"          // ← جديد
    ]
  }
}
```

### تغيير الدومين الأساسي:

```bash
# 1. أضف الدومين الجديد في domains
# 2. اختبر أنه يعمل
# 3. احذف الدومين القديم
# 4. حدّث DNS
```

## 📊 مراقبة النظام

### فحص حالة جميع العملاء:

```bash
# API للحصول على حالة النظام
curl https://hmcar.xyz/api/v2/system/tenants-status
```

### فحص عميل محدد:

```bash
# اختبار عميل معين
curl -H "X-Tenant-ID: carx" https://hmcar.xyz/api/v2/tenant/info
```

### مراقبة قواعد البيانات:

```javascript
// سكريبت فحص الاتصال
const mongoose = require('mongoose');

async function checkTenantDB(tenantId, mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log(`✅ ${tenantId}: متصل`);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 ${tenantId}: ${collections.length} مجموعة`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.log(`❌ ${tenantId}: خطأ - ${error.message}`);
  }
}
```

## 🚀 إضافة ميزات جديدة

### الميزة تُضاف مرة واحدة وتظهر لكل العملاء:

```bash
# مثال: إضافة صفحة "المقارنة"
# 1. أضف الصفحة في client-app/src/app/compare/page.tsx
# 2. أضف API في routes/api/v2/compare.js
# 3. git push
# 4. الميزة تظهر لـ hmcar و carx وكل العملاء!
```

### إضافة ميزة خاصة بعميل واحد:

```javascript
// في الكود
if (req.tenant.id === 'carx') {
  // ميزة خاصة بـ CARX فقط
  return res.json({ specialFeature: true });
}
```

## 💾 النسخ الاحتياطي

### نسخ احتياطية منفصلة لكل عميل:

```bash
#!/bin/bash
# backup-all-tenants.sh

# HMCAR
mongodump --uri="$MONGO_URI" --out=backups/hmcar/$(date +%Y%m%d)

# CARX
mongodump --uri="$MONGO_URI_CARX" --out=backups/carx/$(date +%Y%m%d)

# ضغط النسخ
tar -czf backups/hmcar-$(date +%Y%m%d).tar.gz backups/hmcar/$(date +%Y%m%d)
tar -czf backups/carx-$(date +%Y%m%d).tar.gz backups/carx/$(date +%Y%m%d)
```

## 🔒 الأمان

### التأكد من العزل بين العملاء:

```javascript
// اختبار العزل
// 1. ادخل على hmcar.xyz
// 2. افتح Developer Tools > Network
// 3. اطلب /api/v2/cars
// 4. تأكد أن البيانات من hmcar فقط

// 5. ادخل على carx-motors.com
// 6. اطلب /api/v2/cars
// 7. تأكد أن البيانات من carx فقط
```

### منع التداخل:

```javascript
// في كل API Route
router.get('/cars', async (req, res) => {
  // التأكد من وجود tenant
  if (!req.tenant) {
    return res.status(400).json({ error: 'Tenant not found' });
  }
  
  // استخدام Models المرتبطة بهذا العميل فقط
  const Car = req.getModel('Car');
  const cars = await Car.find(); // من قاعدة بيانات هذا العميل فقط
  
  res.json({ cars });
});
```

## 📈 تطوير النظام

### إضافة لوحة تحكم للعملاء:

```bash
# صفحة إدارة للعميل
client-app/src/app/admin/
├── dashboard/
├── settings/
├── users/
└── reports/
```

### إضافة نظام فوترة:

```javascript
// إضافة معلومات الاشتراك
{
  "hmcar": {
    "subscription": {
      "plan": "premium",
      "price": 1000,
      "currency": "SAR",
      "billingCycle": "monthly",
      "nextBilling": "2026-04-30",
      "status": "active"
    }
  }
}
```

## 🎯 أفضل الممارسات

### 1. تسمية العملاء:
```bash
# استخدم أسماء قصيرة وواضحة
✅ hmcar, carx, alwaha
❌ hm-car-showroom-2024
```

### 2. إدارة قواعد البيانات:
```bash
# استخدم متغيرات البيئة
✅ "mongoUri": "ENV:MONGO_URI_CARX"
❌ "mongoUri": "mongodb://user:pass@..."
```

### 3. تنظيم الملفات:
```bash
uploads/tenants/
├── hmcar/
│   ├── logo.png
│   ├── favicon.ico
│   └── banner.jpg
├── carx/
│   ├── logo.png
│   ├── favicon.ico
│   └── banner.jpg
```

### 4. اختبار العملاء:
```bash
# اختبر كل عميل بعد أي تغيير
npm run test:tenants
```

## 🚨 استكشاف الأخطاء

### المشكلة: العميل لا يظهر
```bash
# 1. تحقق من tenants.json
# 2. تحقق من enabled: true
# 3. تحقق من الدومين في domains array
# 4. أعد تشغيل السيرفر
```

### المشكلة: قاعدة البيانات لا تتصل
```bash
# 1. تحقق من mongoUri
# 2. تحقق من IP whitelist في MongoDB Atlas
# 3. تحقق من username/password
```

### المشكلة: الشعار لا يظهر
```bash
# 1. تحقق من وجود الملف
# 2. تحقق من المسار في tenants.json
# 3. تحقق من صلاحيات الملف
```

## 📞 إدارة الفريق

### تقسيم المسؤوليات:

#### المبرمج الأول (Frontend):
- تطوير واجهات المستخدم
- تطبيق الثيمات
- اختبار العملاء المختلفين

#### المبرمج الثاني (Backend):
- إدارة قواعد البيانات
- APIs والأمان
- مراقبة الأداء

#### أنت (Full Stack + Manager):
- إضافة عملاء جدد
- إدارة النظام العام
- حل المشاكل المعقدة
- التواصل مع العملاء

### سير العمل اليومي:

```bash
# الصباح (9:00):
1. فحص حالة جميع العملاء
2. مراجعة logs الأخطاء
3. تحديد مهام اليوم

# أثناء العمل:
1. كل تغيير يُختبر على عميلين على الأقل
2. مراجعة الكود قبل الدمج
3. توثيق أي تغييرات

# المساء (17:00):
1. نسخ احتياطية
2. تقرير حالة النظام
3. تخطيط اليوم التالي
```

## 💰 نموذج الأعمال

### خيارات التسعير:

#### باقة أساسية: 500 ريال/شهر
- دومين خاص
- قاعدة بيانات 5GB
- 1000 سيارة
- دعم فني أساسي

#### باقة متقدمة: 1000 ريال/شهر
- دومين خاص
- قاعدة بيانات 20GB
- سيارات غير محدودة
- ميزات متقدمة
- دعم فني مميز

#### باقة مؤسسية: 2000 ريال/شهر
- عدة دومينات
- قاعدة بيانات غير محدودة
- تخصيص كامل
- دعم فني 24/7

## ✅ الخلاصة

### ما لديك:
✅ نظام Multi-Tenant كامل وجاهز
✅ عميلين يعملان (hmcar + carx)
✅ عزل تام بين العملاء
✅ سهولة إضافة عملاء جدد
✅ إدارة مركزية للنظام

### لإضافة عميل جديد:
1. إنشاء قاعدة بيانات (5 دقائق)
2. تعديل tenants.json (2 دقيقة)
3. رفع الشعار (1 دقيقة)
4. ربط الدومين (10 دقائق)

**المجموع: 18 دقيقة لكل عميل جديد!**