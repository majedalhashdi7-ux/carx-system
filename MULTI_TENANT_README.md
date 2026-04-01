# 🎯 نظام Multi-Tenant - دليل كامل

## ✅ ما لديك الآن

مشروعك يحتوي على **نظام Multi-Tenant كامل ومتكامل** يسمح لك ببيع النظام لعملاء متعددين!

### المميزات:

✅ **قاعدة بيانات منفصلة** لكل عميل  
✅ **دومين خاص** لكل عميل  
✅ **ألوان وشعار مخصص** لكل عميل  
✅ **بيانات معزولة 100%** - لا يرى عميل بيانات عميل آخر  
✅ **كود واحد** لكل العملاء  
✅ **ميزات جديدة تلقائية** - عند إضافة ميزة، تظهر لكل العملاء

---

## 🚀 إضافة عميل جديد (5 دقائق)

### الطريقة 1: السكريبت التفاعلي (الأسهل)

```bash
npm run add:tenant
```

سيسألك عن:
- معرف المعرض
- الاسم بالعربي والإنجليزي
- الدومين
- MongoDB URI
- رقم الواتساب
- البريد الإلكتروني
- اللون الأساسي

### الطريقة 2: يدوياً

1. افتح `tenants/tenants.json`
2. أضف معرض جديد (انظر `tenants/tenants.example.json`)
3. احفظ الملف

---

## 📋 مثال عملي

### لديك 3 عملاء:

```
العميل 1: معرض الواحة
- الدومين: alwaha-cars.com
- القاعدة: alwaha_db
- الألوان: أخضر (#2ecc71)

العميل 2: معرض الفخامة
- الدومين: luxury-motors.com
- القاعدة: luxury_db
- الألوان: أسود وذهبي (#000000, #FFD700)

العميل 3: معرض النجوم
- الدومين: stars-auto.com
- القاعدة: stars_db
- الألوان: أزرق (#3498db)
```

### كل عميل يرى:
- شعاره الخاص
- ألوانه الخاصة
- سياراته فقط (من قاعدة بياناته)
- معلومات تواصله

---

## 🎨 كيف يعمل النظام؟

### Backend (Express):

```javascript
// في أي Route:
router.get('/cars', async (req, res) => {
  // معلومات المعرض متاحة في req.tenant
  console.log(req.tenant.name);  // "معرض الواحة"
  console.log(req.tenant.theme.primaryColor);  // "#2ecc71"
  
  // Models مرتبطة بقاعدة بيانات هذا المعرض فقط
  const Car = req.getModel('Car');
  const cars = await Car.find();  // من alwaha_db فقط!
  
  res.json({ cars });
});
```

### Frontend (Next.js):

```typescript
'use client';
import { useTenant } from '@/lib/TenantContext';

export default function Page() {
  const { tenant } = useTenant();
  
  return (
    <div style={{ backgroundColor: tenant.theme.backgroundColor }}>
      <img src={tenant.logo} alt={tenant.name} />
      <h1>{tenant.name}</h1>
      <a href={`https://wa.me/${tenant.contact.whatsapp}`}>
        تواصل معنا
      </a>
    </div>
  );
}
```

---

## 🔒 الأمان والعزل

### كل عميل معزول تماماً:

```javascript
// عميل الواحة يطلب:
GET https://alwaha-cars.com/api/v2/cars
→ يجلب من alwaha_db فقط

// عميل الفخامة يطلب:
GET https://luxury-motors.com/api/v2/cars
→ يجلب من luxury_db فقط

// ❌ لا يمكن لعميل الواحة رؤية سيارات الفخامة!
```

---

## 📊 إدارة العملاء

### عرض قائمة العملاء:

```bash
npm run list:tenants
```

### إضافة عميل:

```bash
npm run add:tenant
```

### تعطيل عميل:

```json
{
  "tenants": {
    "alwaha": {
      "enabled": false  // ← غيرها إلى false
    }
  }
}
```

---

## 🌐 النشر

### نشر واحد لكل العملاء:

```bash
git push origin main
# Vercel ينشر تلقائياً
# كل الدومينات تعمل من نفس النشر!
```

### إضافة دومين في Vercel:

1. Vercel Dashboard > Settings > Domains
2. Add Domain: `alwaha-cars.com`
3. أضف DNS records في مزود الدومين
4. انتظر 5-30 دقيقة

---

## 💰 نموذج الأعمال

### خيارات التسعير المقترحة:

#### الخيار 1: اشتراك شهري
```
باقة أساسية: 500 ريال/شهر
- دومين خاص
- قاعدة بيانات 5GB
- 1000 سيارة

باقة متقدمة: 1000 ريال/شهر
- دومين خاص
- قاعدة بيانات 20GB
- سيارات غير محدودة
- دعم فني
```

#### الخيار 2: رسوم إعداد + اشتراك
```
رسوم إعداد: 2000 ريال (مرة واحدة)
اشتراك شهري: 300 ريال/شهر
```

---

## 📈 إضافة ميزات جديدة

### الميزة تُضاف مرة واحدة وتظهر لكل العملاء:

```bash
# مثال: إضافة ميزة "المقارنة بين السيارات"

1. أضف الكود في المشروع
2. git push
3. الميزة تظهر تلقائياً لـ:
   ✅ معرض الواحة
   ✅ معرض الفخامة
   ✅ معرض النجوم
   ✅ كل العملاء الآخرين!
```

---

## 🛠️ الملفات المهمة

```
tenants/
├── tenants.json              ← إعدادات كل العملاء
├── tenants.example.json      ← أمثلة
├── tenant-resolver.js        ← تحديد المعرض من الطلب
└── tenant-db-manager.js      ← إدارة قواعد البيانات

middleware/
└── tenantMiddleware.js       ← Middleware الرئيسي

client-app/src/lib/
└── TenantContext.tsx         ← Context للـ Frontend

scripts/
├── add-tenant.js             ← إضافة عميل جديد
└── list-tenants.js           ← عرض قائمة العملاء
```

---

## 📚 الأدلة المتاحة

1. **MULTI_TENANT_SAAS_GUIDE.md** - دليل شامل ومفصل
2. **QUICK_TENANT_GUIDE.md** - دليل سريع
3. **tenants/tenants.example.json** - أمثلة عملية
4. **هذا الملف** - نظرة عامة

---

## 🎯 الخطوات التالية

### للبدء:

1. ✅ جرب إضافة عميل تجريبي:
   ```bash
   npm run add:tenant
   ```

2. ✅ اختبر العزل:
   ```bash
   # اختبر عميل 1
   curl https://hmcar.xyz/api/v2/cars?tenant=alwaha
   
   # اختبر عميل 2
   curl https://hmcar.xyz/api/v2/cars?tenant=luxury
   ```

3. ✅ ابدأ التسويق للعملاء!

---

## 💡 نصائح مهمة

### للأداء:
- استخدم Redis للكاش (موجود في المشروع)
- راقب حجم قواعد البيانات
- استخدم CDN للصور (Cloudinary موجود)

### للأمان:
- غيّر المفاتيح السرية بانتظام
- استخدم HTTPS دائماً
- راقب محاولات الوصول غير المصرح

### للصيانة:
- نسخ احتياطي يومي لكل قاعدة بيانات
- راقب استخدام الموارد
- حدّث Dependencies بانتظام

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. راجع الأدلة المفصلة
2. تحقق من logs:
   ```bash
   # Backend logs
   npm start
   
   # Vercel logs
   vercel logs
   ```
3. تحقق من اتصال قاعدة البيانات

---

## ✅ الخلاصة

### ما لديك:

✅ نظام Multi-Tenant كامل  
✅ عزل تام بين العملاء  
✅ قاعدة بيانات منفصلة لكل عميل  
✅ ثيم مخصص لكل عميل  
✅ دومين خاص لكل عميل  
✅ كود واحد لكل العملاء  
✅ سكريبتات جاهزة للإدارة

### لإضافة عميل جديد:

```bash
npm run add:tenant
# اتبع التعليمات
# 5 دقائق فقط!
```

---

**مشروعك جاهز للاستخدام كـ SaaS Platform! 🎉**

تم إنشاء هذا الدليل: 29 مارس 2026
