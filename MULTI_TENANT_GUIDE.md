# 🏢 دليل نظام Multi-Tenant الكامل

## 📋 نظرة عامة

مشروعك الآن يدعم **نظام SaaS متعدد العملاء** حيث:
- ✅ كل عميل له قاعدة بيانات منفصلة
- ✅ كل عميل له ثيم وألوان مختلفة
- ✅ كل عميل له شعار واسم مختلف
- ✅ كل عميل له دومين خاص
- ✅ نفس الكود لجميع العملاء
- ✅ عند إضافة صفحة جديدة، تظهر لجميع العملاء تلقائياً

---

## 🚀 كيف تضيف عميل جديد؟

### الخطوة 1: إنشاء قاعدة بيانات MongoDB

```bash
# في MongoDB Atlas:
1. اذهب إلى https://cloud.mongodb.com
2. اضغط "Create Database"
3. اسم Database: alwaha-cars (مثال)
4. انسخ Connection String:
   mongodb+srv://user:password@cluster.mongodb.net/alwaha-cars
```

### الخطوة 2: إضافة العميل في `tenants/tenants.json`

```json
{
  "defaultTenant": "hmcar",
  "tenants": {
    "hmcar": {
      // العميل الحالي
    },
    
    "alwaha": {
      "id": "alwaha",
      "name": "معرض الواحة",
      "nameEn": "Al Waha Cars",
      "description": "معرض الواحة للسيارات المستعملة",
      "descriptionEn": "Al Waha Used Cars Showroom",
      "domains": [
        "alwaha-cars.com",
        "www.alwaha-cars.com",
        "alwaha.vercel.app"
      ],
      "mongoUri": "mongodb+srv://user:password@cluster.mongodb.net/alwaha-cars",
      "logo": "/uploads/tenants/alwaha/logo.png",
      "favicon": "/uploads/tenants/alwaha/favicon.ico",
      "theme": {
        "primaryColor": "#2ecc71",
        "secondaryColor": "#27ae60",
        "accentColor": "#3498db",
        "backgroundColor": "#ecf0f1",
        "textColor": "#2c3e50"
      },
      "contact": {
        "whatsapp": "+966501234567",
        "email": "info@alwaha-cars.com",
        "phone": "+966501234567"
      },
      "settings": {
        "currency": "SAR",
        "language": "ar",
        "direction": "rtl"
      },
      "enabled": true
    }
  }
}
```

### الخطوة 3: رفع الشعار والأيقونة

```bash
# أنشئ المجلد:
mkdir -p uploads/tenants/alwaha

# ضع الملفات:
uploads/tenants/alwaha/logo.png      (الشعار - 400x120px مثلاً)
uploads/tenants/alwaha/favicon.ico   (الأيقونة - 32x32px)
```

### الخطوة 4: ربط الدومين

#### أ. في مزود الدومين (GoDaddy, Namecheap, إلخ):
```
Type: A
Name: @
Value: [IP السيرفر]
TTL: 3600

Type: CNAME
Name: www
Value: [الدومين الرئيسي]
TTL: 3600
```

#### ب. في Vercel (إذا كنت تستخدمه):
```bash
1. اذهب إلى Vercel Dashboard
2. Settings > Domains
3. أضف: alwaha-cars.com
4. اتبع التعليمات
```

### الخطوة 5: اختبار العميل الجديد

```bash
# الطريقة 1: عبر الدومين
https://alwaha-cars.com

# الطريقة 2: عبر Query Parameter (للاختبار)
https://hmcar.com?tenant=alwaha

# الطريقة 3: عبر Header (للـ API)
curl -H "X-Tenant-ID: alwaha" https://hmcar.com/api/v2/cars
```

---

## 🎨 كيف يعمل النظام؟

### 1. عند دخول المستخدم:

```
المستخدم يفتح → alwaha-cars.com
         ↓
tenant-resolver.js يحدد العميل من الدومين
         ↓
tenant-db-manager.js يفتح اتصال قاعدة البيانات الخاصة
         ↓
tenantMiddleware.js يضيف البيانات للطلب
         ↓
TenantContext (Frontend) يحمل الثيم والشعار
         ↓
الصفحة تعرض بيانات معرض الواحة فقط
```

### 2. في الكود (Backend):

```javascript
// في أي Route:
router.get('/cars', async (req, res) => {
  // req.tenant يحتوي على معلومات العميل
  console.log(req.tenant.name); // "معرض الواحة"
  console.log(req.tenant.theme.primaryColor); // "#2ecc71"
  
  // req.tenantModels يحتوي على Models المرتبطة بقاعدة بيانات هذا العميل
  const Car = req.getModel('Car');
  const cars = await Car.find(); // يجلب من قاعدة بيانات الواحة فقط!
  
  res.json({ cars });
});
```

### 3. في الكود (Frontend):

```tsx
'use client';

import { useTenant } from '@/lib/TenantContext';
import { TenantLogo } from '@/components/TenantLogo';
import { TenantThemeButton } from '@/components/TenantThemeButton';

export default function MyPage() {
  const { tenant, loading } = useTenant();

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div>
      {/* عرض الشعار */}
      <TenantLogo width={150} height={50} showName />
      
      {/* عرض الاسم */}
      <h1>{tenant.name}</h1>
      
      {/* زر بألوان العميل */}
      <TenantThemeButton variant="primary">
        اشتري الآن
      </TenantThemeButton>
      
      {/* استخدام الألوان مباشرة */}
      <div style={{ 
        backgroundColor: tenant.theme.primaryColor,
        color: tenant.theme.textColor 
      }}>
        محتوى مخصص
      </div>
      
      {/* معلومات التواصل */}
      <a href={`https://wa.me/${tenant.contact.whatsapp}`}>
        واتساب: {tenant.contact.phone}
      </a>
    </div>
  );
}
```

---

## 📁 هيكل الملفات

```
project/
├── tenants/
│   ├── tenants.json              # إعدادات جميع العملاء
│   ├── tenant-resolver.js        # تحديد العميل من الطلب
│   └── tenant-db-manager.js      # إدارة قواعد البيانات
│
├── middleware/
│   └── tenantMiddleware.js       # Middleware للـ Backend
│
├── routes/api/v2/
│   └── tenant.js                 # API للحصول على بيانات العميل
│
├── client-app/src/
│   ├── lib/
│   │   └── TenantContext.tsx     # Context للـ Frontend
│   │
│   └── components/
│       ├── TenantLogo.tsx        # مكون الشعار الديناميكي
│       └── TenantThemeButton.tsx # مكون الأزرار بألوان العميل
│
└── uploads/tenants/
    ├── hmcar/
    │   ├── logo.png
    │   └── favicon.ico
    │
    └── alwaha/
        ├── logo.png
        └── favicon.ico
```

---

## 🔧 الإعدادات المتقدمة

### 1. استخدام متغيرات البيئة لقواعد البيانات

بدلاً من كتابة Connection String مباشرة:

```json
{
  "mongoUri": "ENV:ALWAHA_MONGO_URI"
}
```

ثم في `.env`:
```bash
ALWAHA_MONGO_URI=mongodb+srv://...
```

### 2. تعطيل عميل مؤقتاً

```json
{
  "alwaha": {
    "enabled": false,  // ← هنا
    ...
  }
}
```

### 3. إضافة دومينات متعددة لنفس العميل

```json
{
  "domains": [
    "alwaha-cars.com",
    "www.alwaha-cars.com",
    "alwaha.sa",
    "www.alwaha.sa",
    "alwaha.vercel.app"
  ]
}
```

---

## 🎨 أمثلة الثيمات

### ثيم فاخر (أسود وذهبي):
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

### ثيم حديث (أزرق وأبيض):
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

### ثيم طبيعي (أخضر):
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

---

## 🔍 استكشاف الأخطاء

### المشكلة: العميل لا يظهر

**الحل:**
```bash
# 1. تحقق من tenants.json
cat tenants/tenants.json

# 2. تحقق من enabled: true
# 3. تحقق من الدومين في domains array
# 4. أعد تشغيل السيرفر
npm run dev
```

### المشكلة: قاعدة البيانات لا تتصل

**الحل:**
```bash
# 1. تحقق من mongoUri صحيح
# 2. تحقق من IP مسموح في MongoDB Atlas
# 3. تحقق من username/password
# 4. اختبر الاتصال:
node -e "require('mongoose').connect('mongodb://...').then(() => console.log('OK'))"
```

### المشكلة: الشعار لا يظهر

**الحل:**
```bash
# 1. تحقق من وجود الملف:
ls -la uploads/tenants/alwaha/logo.png

# 2. تحقق من المسار في tenants.json
# 3. تحقق من صلاحيات الملف:
chmod 644 uploads/tenants/alwaha/logo.png
```

---

## 📊 مراقبة النظام

### API للحصول على حالة جميع العملاء:

```bash
curl https://hmcar.com/api/v2/system/tenants-status
```

### الرد:
```json
{
  "success": true,
  "data": [
    {
      "tenantId": "hmcar",
      "state": "متصل",
      "modelsCount": 60,
      "uptime": "3600s"
    },
    {
      "tenantId": "alwaha",
      "state": "متصل",
      "modelsCount": 60,
      "uptime": "1800s"
    }
  ]
}
```

---

## 🎯 الخلاصة

**نظامك الآن جاهز لخدمة عملاء متعددين!**

لإضافة عميل جديد:
1. ✅ أنشئ قاعدة بيانات MongoDB
2. ✅ أضف العميل في `tenants/tenants.json`
3. ✅ ارفع الشعار والأيقونة
4. ✅ اربط الدومين
5. ✅ اختبر!

**لا حاجة لتعديل أي كود!** 🎉

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع هذا الدليل
2. تحقق من logs السيرفر
3. اختبر API endpoints
4. تحقق من MongoDB Atlas

---

تم إنشاء هذا الدليل: 29 مارس 2026
