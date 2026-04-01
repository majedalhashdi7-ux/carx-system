# 🏢 نظام Multi-Tenant - دليل شامل

## 📊 نظرة عامة

نظامك يدعم **Multi-Tenant SaaS** حيث يمكنك خدمة عملاء متعددين من نفس الكود:
- ✅ كل عميل له قاعدة بيانات منفصلة
- ✅ كل عميل له ثيم وألوان مختلفة
- ✅ كل عميل له شعار ودومين خاص
- ✅ نفس الكود لجميع العملاء

---

## 🎯 البداية السريعة

### إضافة عميل جديد:
```bash
node scripts/add-tenant.js
```

### فحص النظام:
```bash
node scripts/check-system.js
```

---

## 📁 الملفات والأدلة

### الملفات الأساسية:
```
tenants/
├── tenants.json              ← إعدادات جميع العملاء
├── tenant-resolver.js        ← تحديد العميل من الطلب
└── tenant-db-manager.js      ← إدارة قواعد البيانات

scripts/
├── add-tenant.js             ← إضافة عميل جديد
└── check-system.js           ← فحص النظام

uploads/tenants/
└── [tenant-id]/
    ├── logo.png              ← شعار العميل
    └── favicon.ico           ← أيقونة العميل
```

### الأدلة والتوثيق:
```
📖 ابدأ_هنا.md                          ← ابدأ من هنا!
📖 ملخص_النظام_والحل.md                ← ملخص شامل
📖 خطوات_سريعة_لإضافة_عميل.md          ← خطوات سريعة
📖 دليل_إضافة_عميل_جديد.md             ← دليل كامل
📖 تقرير_النظام.md                      ← تقرير الحالة
📖 MULTI_TENANT_GUIDE.md                ← دليل تقني
📖 MULTI_TENANT_QUICK_START.md          ← Quick start (English)
```

---

## 🏢 العملاء الحاليين

### 1. HM CAR (hmcar)
- **الدومين:** hmcar.xyz, www.hmcar.xyz
- **قاعدة البيانات:** مشتركة مع CAR X
- **اللون:** ذهبي (#D4AF37)
- **الحالة:** ✅ يعمل

### 2. CAR X (carx)
- **الدومين:** carx-motors.com, carx-system.vercel.app
- **قاعدة البيانات:** مشتركة مع HM CAR
- **اللون:** أسود (#000000)
- **الحالة:** ✅ يعمل

### 3. معارض تجريبية
- **alwaha** - معرض الواحة (أخضر)
- **luxury** - معرض الفخامة (أسود وذهبي)
- **stars** - معرض النجوم (أزرق)
- **الحالة:** مفعّلة لكن غير مستخدمة

---

## 🚀 إضافة عميل جديد

### الطريقة 1: السكريبت التلقائي (موصى به)

```bash
node scripts/add-tenant.js
```

سيطلب منك:
1. معرف المعرض (بالإنجليزي)
2. اسم المعرض (بالعربي)
3. اسم المعرض (بالإنجليزي)
4. الدومين
5. MongoDB URI
6. رقم الواتساب
7. البريد الإلكتروني
8. اللون الأساسي

### الطريقة 2: التعديل اليدوي

عدّل `tenants/tenants.json` وأضف:

```json
{
  "newclient": {
    "id": "newclient",
    "name": "معرض العميل الجديد",
    "nameEn": "New Client Motors",
    "domains": ["newclient.com", "www.newclient.com"],
    "mongoUri": "mongodb+srv://user:pass@cluster.mongodb.net/newclient_db",
    "logo": "/uploads/tenants/newclient/logo.png",
    "favicon": "/uploads/tenants/newclient/favicon.ico",
    "theme": {
      "primaryColor": "#3498db",
      "secondaryColor": "#2980b9",
      "accentColor": "#e74c3c",
      "backgroundColor": "#ffffff",
      "textColor": "#2c3e50"
    },
    "contact": {
      "whatsapp": "+966501234567",
      "email": "info@newclient.com",
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
```

---

## 🌐 ربط الدومين

### في Vercel:
1. اذهب إلى https://vercel.com/dashboard
2. Settings > Domains
3. أضف الدومين: `newclient.com`
4. اتبع التعليمات

### في مزود الدومين:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 🧪 الاختبار

### اختبار محلي:
```bash
# عبر Query Parameter
http://localhost:4002?tenant=newclient

# عبر Header
curl -H "X-Tenant-ID: newclient" http://localhost:4002/api/v2/tenant/info
```

### اختبار الإنتاج:
```bash
# عبر الدومين
https://newclient.com

# فحص API
curl https://newclient.com/api/v2/tenant/info
```

---

## 🎨 ألوان جاهزة

### أزرق احترافي:
```json
{
  "primaryColor": "#3498db",
  "secondaryColor": "#2980b9",
  "accentColor": "#e74c3c"
}
```

### أخضر طبيعي:
```json
{
  "primaryColor": "#2ecc71",
  "secondaryColor": "#27ae60",
  "accentColor": "#3498db"
}
```

### أسود فاخر:
```json
{
  "primaryColor": "#FFD700",
  "secondaryColor": "#000000",
  "accentColor": "#C0C0C0"
}
```

### أحمر رياضي:
```json
{
  "primaryColor": "#e74c3c",
  "secondaryColor": "#c0392b",
  "accentColor": "#000000"
}
```

---

## 🔍 فحص النظام

```bash
node scripts/check-system.js
```

النتيجة:
```
✅ المعارض المفعّلة: 5
🌐 إجمالي الدومينات: 17
🏠 دومينات محلية: 4
☁️ دومينات Vercel: 3
🌍 دومينات مخصصة: 10
⚠️ ملفات ناقصة: 10
```

---

## 🛠️ كيف يعمل النظام؟

### 1. المستخدم يفتح الدومين
```
https://newclient.com
```

### 2. النظام يحدد العميل
```javascript
// tenant-resolver.js
const tenant = resolveTenant(req);
// يحدد العميل من الدومين
```

### 3. يفتح قاعدة البيانات الخاصة
```javascript
// tenant-db-manager.js
const { connection, models } = await getConnection(tenant.id, tenant.mongoUri);
```

### 4. يعرض البيانات والثيم
```javascript
// في Backend
req.tenant → معلومات العميل
req.tenantModels → Models قاعدة البيانات
req.getModel('Car') → Model محدد

// في Frontend
const { tenant } = useTenant();
tenant.name → اسم المعرض
tenant.theme.primaryColor → اللون الأساسي
```

---

## 📋 قائمة التحقق

عند إضافة عميل جديد:

- [ ] إضافة في `tenants/tenants.json`
- [ ] إنشاء قاعدة بيانات MongoDB
- [ ] إضافة Connection String
- [ ] إنشاء مجلد `uploads/tenants/[id]/`
- [ ] رفع الشعار `logo.png`
- [ ] رفع الأيقونة `favicon.ico`
- [ ] إضافة الدومينات في `domains` array
- [ ] ضبط DNS للدومين
- [ ] إضافة الدومين في Vercel
- [ ] اختبار الدومين
- [ ] اختبار API
- [ ] اختبار قاعدة البيانات
- [ ] التحقق من الثيم والألوان

---

## 🆘 استكشاف الأخطاء

### المشكلة: العميل لا يظهر
```bash
# تحقق من tenants.json
cat tenants/tenants.json | grep "newclient"

# تحقق من enabled: true
# أعد تشغيل السيرفر
npm run dev
```

### المشكلة: قاعدة البيانات لا تتصل
```bash
# تحقق من mongoUri صحيح
# تحقق من IP مسموح في MongoDB Atlas
# تحقق من username/password
```

### المشكلة: الشعار لا يظهر
```bash
# تحقق من وجود الملف
ls -la uploads/tenants/newclient/logo.png

# تحقق من الصلاحيات
chmod 644 uploads/tenants/newclient/logo.png
```

### المشكلة: الدومين لا يعمل
```bash
# تحقق من DNS
nslookup newclient.com

# انتظر انتشار DNS (24-48 ساعة)
# اختبر بـ Query Parameter
https://hmcar.xyz?tenant=newclient
```

---

## 💡 نصائح مهمة

### 1. استخدام نفس قاعدة البيانات (للاختبار)
```json
"mongoUri": "ENV:MONGO_URI"
```

### 2. قواعد بيانات منفصلة (للإنتاج)
```json
"mongoUri": "mongodb+srv://user:pass@cluster.mongodb.net/client_db"
```

### 3. استخدام متغيرات البيئة
في `.env`:
```bash
NEWCLIENT_MONGO_URI=mongodb+srv://...
```

في `tenants.json`:
```json
"mongoUri": "ENV:NEWCLIENT_MONGO_URI"
```

### 4. تعطيل عميل مؤقتاً
```json
{
  "enabled": false
}
```

---

## 📞 الدعم والروابط

### الروابط المهمة:
- **Vercel Dashboard:** https://vercel.com/dashboard
- **MongoDB Atlas:** https://cloud.mongodb.com
- **HM CAR:** https://hmcar.xyz
- **CAR X:** https://carx-motors.com

### الملفات المرجعية:
- `ابدأ_هنا.md` - نقطة البداية
- `ملخص_النظام_والحل.md` - ملخص شامل
- `دليل_إضافة_عميل_جديد.md` - دليل كامل
- `MULTI_TENANT_GUIDE.md` - دليل تقني

### السكريبتات:
- `scripts/add-tenant.js` - إضافة عميل
- `scripts/check-system.js` - فحص النظام
- `scripts/fix-via-vercel-curl.js` - فحص الإنتاج

---

## ✅ الخلاصة

نظامك جاهز تماماً لخدمة عملاء متعددين!

**لإضافة عميل جديد:**
1. ✅ شغّل `node scripts/add-tenant.js`
2. ✅ أدخل البيانات
3. ✅ ارفع الشعار والأيقونة
4. ✅ اربط الدومين
5. ✅ اختبر!

**لا حاجة لتعديل أي كود!** 🎉

---

**تاريخ الإنشاء:** 29 مارس 2026  
**الحالة:** ✅ جاهز للإنتاج  
**النظام:** Multi-Tenant SaaS Platform  
**الإصدار:** 1.0.0

🚀 **استمتع بنظامك!**
