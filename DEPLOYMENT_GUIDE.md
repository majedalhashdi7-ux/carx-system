# دليل نشر نظام CAR X 🚀

## 📋 خطوات النشر

### 1️⃣ إنشاء مستودع GitHub

```bash
# إنشاء مستودع جديد على GitHub
# الاسم: carx-system
# الوصف: CAR X - نظام معارض ومزادات السيارات المستقل
```

### 2️⃣ ربط المستودع المحلي

```bash
# في مجلد carx-system
git remote add origin https://github.com/majedalhashdi7-ux/carx-system.git
git branch -M main
git push -u origin main
```

### 3️⃣ إعداد Vercel

#### إنشاء مشروع جديد:
1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط "New Project"
3. اختر مستودع `carx-system`
4. اضبط الإعدادات:
   - **Framework**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### متغيرات البيئة:
```env
MONGO_URI=mongodb://your-carx-database-url
NEXTAUTH_SECRET=your-carx-secret-key
NEXTAUTH_URL=https://daood.okigo.net
WHATSAPP_NUMBER=+967781007805
ADMIN_EMAIL=dawoodalhash@gmail.com
ADMIN_PASSWORD=daood@112233
USD_TO_SAR=3.75
USD_TO_KRW=1300
```

### 4️⃣ ربط الدومين

#### في Vercel:
1. اذهب إلى Project Settings
2. اختر "Domains"
3. أضف `daood.okigo.net`
4. اتبع تعليمات DNS

#### إعدادات DNS:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### 5️⃣ إعداد قاعدة البيانات

#### إنشاء قاعدة بيانات منفصلة:
```javascript
// اتصال MongoDB منفصل
const MONGO_URI = "mongodb://carx-database-url/carx_db"

// المجموعات المطلوبة:
- cars (السيارات)
- parts (قطع الغيار) 
- brands (الوكالات)
- users (المستخدمين)
- orders (الطلبات)
```

### 6️⃣ نسخ البيانات

```bash
# نسخ البيانات من النظام القديم
mongodump --uri="old-database-uri" --collection=cars
mongorestore --uri="new-carx-uri" --collection=cars

# تكرار للمجموعات الأخرى
```

### 7️⃣ اختبار النظام

#### الروابط للاختبار:
- **المحلي**: http://localhost:3001
- **Vercel**: https://carx-system.vercel.app
- **الإنتاج**: https://daood.okigo.net

#### قائمة الاختبار:
- ✅ الصفحة الرئيسية تعمل
- ✅ البطاقات الإبداعية تظهر
- ✅ تسجيل الدخول يعمل
- ✅ المعرض الكوري يعمل
- ✅ قطع الغيار تعمل
- ✅ الوكالات الدائرية تعمل
- ✅ الواتساب يعمل

## 🔧 إعدادات إضافية

### SSL Certificate
- Vercel يوفر SSL تلقائياً
- تأكد من إعادة التوجيه من HTTP إلى HTTPS

### CDN و Performance
- Vercel Edge Network تلقائي
- تحسين الصور تلقائي
- Gzip compression مفعل

### Analytics
```javascript
// Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

// Vercel Analytics (اختياري)
```

### Security Headers
```javascript
// في next.config.js
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options', 
    value: 'nosniff',
  }
]
```

## 🚀 النشر النهائي

### الأوامر النهائية:
```bash
# رفع الكود
git add .
git commit -m "🎉 نظام CAR X جاهز للنشر"
git push origin main

# Vercel سينشر تلقائياً
```

### التحقق من النشر:
1. ✅ الموقع يعمل على daood.okigo.net
2. ✅ جميع الصفحات تحمل بسرعة
3. ✅ البطاقات الإبداعية تعمل
4. ✅ قاعدة البيانات متصلة
5. ✅ الواتساب يعمل

## 📞 الدعم

إذا واجهت أي مشاكل:
- تحقق من logs في Vercel
- تأكد من متغيرات البيئة
- اختبر الاتصال بقاعدة البيانات
- تحقق من إعدادات DNS

**🎉 نظام CAR X جاهز للعمل!**