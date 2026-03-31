# 🚗 CAR X - نظام إدارة السيارات المتقدم

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-ready-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

نظام متكامل لإدارة معارض السيارات، المزادات، وقطع الغيار مع تصميم فاخر وتجربة مستخدم استثنائية.

---

## ✨ الميزات الرئيسية

### للعملاء:
- 🎬 شاشة ترحيب سينمائية مذهلة
- 🎥 فيديو خلفية متحرك مع بديل SVG
- 🚗 بطاقات سيارات فاخرة بتصميم ثلاثي الأبعاد
- 🖼️ عرض مسرحي للصور بملء الشاشة
- ⭐ نظام مراجعات وتقييمات كامل
- 🔄 نظام مقارنة بين السيارات
- 🛒 سلة تسوق متقدمة مع كوبونات
- 💱 محول عملات (SAR, USD, KRW, EUR, AED)
- 🧭 أزرار رجوع وتنقل في كل صفحة
- 📱 تصميم متجاوب بالكامل

### للأدمن:
- 📊 لوحة تحكم شاملة
- 📥 نظام استيراد من روابط خارجية
- 🖼️ ضغط الصور تلقائياً (WebP)
- 🔍 فحص التكرار التلقائي
- 📈 إحصائيات مفصلة
- ⚙️ إدارة كاملة للسيارات والقطع

---

## 🚀 التشغيل السريع

### المتطلبات:
- Node.js 18+
- npm أو yarn
- MongoDB (اختياري)

### التثبيت:
```bash
# استنساخ المشروع
git clone https://github.com/majedalhashdi7-ux/carx-system.git

# الدخول للمجلد
cd carx-system

# تثبيت الحزم
npm install

# تشغيل النظام
npm run dev
```

### الوصول:
```
http://localhost:3000
```

---

## 📁 هيكل المشروع

```
carx-system/
├── src/
│   ├── app/                    # صفحات Next.js
│   │   ├── page.tsx           # الصفحة الرئيسية
│   │   ├── showroom/          # معرض السيارات
│   │   ├── parts/             # قطع الغيار
│   │   ├── brands/            # الوكالات
│   │   ├── admin/             # لوحة التحكم
│   │   └── api/               # APIs
│   ├── components/            # المكونات
│   │   ├── BackButton.tsx
│   │   ├── Breadcrumb.tsx
│   │   ├── CinematicSplash.tsx
│   │   ├── TheatricalCarDisplay.tsx
│   │   ├── LuxuryCarCard.tsx
│   │   ├── ReviewSystem.tsx
│   │   ├── ComparisonSystem.tsx
│   │   ├── AdvancedCart.tsx
│   │   └── ...
│   └── lib/                   # المكتبات
│       ├── CartContext.tsx
│       ├── CurrencyContext.tsx
│       ├── AuthContext.tsx
│       └── ...
├── public/                    # الملفات العامة
│   ├── images/
│   └── videos/
├── scripts/                   # سكريبتات مساعدة
└── docs/                      # التوثيق
```

---

## 🎨 التقنيات المستخدمة

### Frontend:
- **Next.js 14** - إطار React
- **TypeScript** - لغة البرمجة
- **Tailwind CSS** - تصميم الواجهة
- **Framer Motion** - التأثيرات الحركية
- **Lucide Icons** - الأيقونات

### Backend:
- **Next.js API Routes** - APIs
- **MongoDB** - قاعدة البيانات (اختياري)
- **Sharp** - معالجة الصور

### الميزات:
- **React Context** - إدارة الحالة
- **localStorage** - التخزين المحلي
- **Responsive Design** - تصميم متجاوب
- **SEO Optimized** - محسن لمحركات البحث

---

## 📊 الإحصائيات

- ✅ **12** مكون رئيسي
- ✅ **4** Contexts
- ✅ **6** صفحات
- ✅ **10+** APIs
- ✅ **20+** تأثير حركي
- ✅ **3** خطوط عربية
- ✅ **5** عملات مدعومة
- ✅ **0** أخطاء

---

## 📱 التوافق

### الأجهزة:
- ✅ الموبايل (< 768px)
- ✅ التابلت (768px - 1024px)
- ✅ الديسكتوب (> 1024px)

### المتصفحات:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

---

## 📖 التوثيق

### الملفات المتاحة:
- [ابدأ من هنا](./ابدأ_من_هنا.md) - دليل البدء السريع
- [دليل الاستخدام](./دليل_الاستخدام_السريع.md) - دليل شامل
- [التقرير النهائي](./التقرير_النهائي_بعد_التحسينات.md) - تقرير التحسينات
- [تقرير الفحص](./تقرير_الفحص_النهائي.md) - نتائج الفحص
- [كيفية إضافة الفيديو](./كيفية_إضافة_الفيديو.md) - إضافة فيديو مخصص

---

## 🔧 الإعدادات

### ملف .env:
```env
# قاعدة البيانات (اختياري)
MONGODB_URI=mongodb://localhost:27017/carx

# واتساب
NEXT_PUBLIC_WHATSAPP=+967781007805

# البيئة
NODE_ENV=development
```

---

## 🚀 النشر

### Vercel (موصى به):
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel
```

### الخطوات:
1. اذهب إلى [Vercel](https://vercel.com)
2. استورد المشروع من GitHub
3. اختر repository: `carx-system`
4. اضغط Deploy

---

## 🧪 الاختبار

### الفحص الشامل:
```bash
node scripts/comprehensive-check.js
```

### النتائج المتوقعة:
- ✅ نجح: 29
- ❌ فشل: 0
- ⚠️ تحذيرات: 1 (فيديو اختياري)

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء branch جديد
3. Commit التغييرات
4. Push إلى Branch
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

## 👨‍💻 المطور

**Majed Alhashdi**
- GitHub: [@majedalhashdi7-ux](https://github.com/majedalhashdi7-ux)
- Repository: [carx-system](https://github.com/majedalhashdi7-ux/carx-system)

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع [التوثيق](./دليل_الاستخدام_السريع.md)
2. افتح [Issue](https://github.com/majedalhashdi7-ux/carx-system/issues)
3. تواصل عبر WhatsApp

---

## 🎉 شكراً لاستخدام CAR X!

**النظام جاهز 100% للاستخدام والنشر!** 🚀

---

**آخر تحديث:** 2026-03-31  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز
