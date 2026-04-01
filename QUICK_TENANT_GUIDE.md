# 🚀 دليل سريع: إضافة عميل جديد

## الطريقة السريعة (5 دقائق)

### 1. استخدم السكريبت التفاعلي

```bash
npm run add:tenant
```

سيسألك عن:
- معرف المعرض (مثال: alwaha)
- الاسم بالعربي والإنجليزي
- الدومين
- MongoDB URI
- رقم الواتساب
- البريد الإلكتروني
- اللون الأساسي

---

### 2. ارفع الشعار

```bash
# ضع الملفات في:
uploads/tenants/[معرف_المعرض]/logo.png
uploads/tenants/[معرف_المعرض]/favicon.ico
```

---

### 3. اضبط DNS

في مزود الدومين (GoDaddy, Namecheap, إلخ):

```
Type: A
Name: @
Value: [IP السيرفر]

Type: A  
Name: www
Value: [IP السيرفر]
```

---

### 4. اختبر

```bash
# قبل DNS:
https://hmcar.xyz?tenant=alwaha

# بعد DNS:
https://alwaha-cars.com
```

---

## الطريقة اليدوية

### 1. افتح `tenants/tenants.json`

### 2. أضف:

```json
{
  "tenants": {
    "معرف_جديد": {
      "id": "معرف_جديد",
      "name": "اسم المعرض",
      "nameEn": "Showroom Name",
      "domains": ["domain.com", "www.domain.com"],
      "mongoUri": "mongodb://...",
      "theme": {
        "primaryColor": "#2ecc71"
      },
      "contact": {
        "whatsapp": "+966xxxxxxxxx",
        "email": "info@domain.com"
      },
      "enabled": true
    }
  }
}
```

---

## أوامر مفيدة

```bash
# عرض قائمة العملاء
npm run list:tenants

# إضافة عميل جديد
npm run add:tenant

# إعادة تشغيل السيرفر
npm start
```

---

## ملاحظات مهمة

✅ كل عميل له قاعدة بيانات منفصلة  
✅ البيانات معزولة تماماً  
✅ نفس الكود لكل العملاء  
✅ الميزات الجديدة تظهر تلقائياً لكل العملاء

---

## مثال كامل

```bash
# 1. إضافة عميل
npm run add:tenant

# 2. رفع الشعار
cp logo.png uploads/tenants/alwaha/logo.png

# 3. اختبار
curl https://hmcar.xyz/api/v2/cars?tenant=alwaha

# 4. بعد DNS
curl https://alwaha-cars.com/api/v2/cars
```

---

## الدعم

للمزيد من التفاصيل، راجع:
- `MULTI_TENANT_SAAS_GUIDE.md` - دليل شامل
- `tenants/tenants.example.json` - أمثلة
