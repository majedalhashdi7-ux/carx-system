# 🚗 HM CAR - Multi-Tenant Car Auction Platform

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

منصة متعددة العملاء لإدارة مزادات السيارات مع دعم كامل للعملاء المتعددين (Multi-Tenant).

---

## ✨ الميزات الرئيسية

### Multi-Tenant Architecture:
- 🏢 دعم عملاء متعددين في نفس النظام
- 🎨 تخصيص كامل لكل عميل (ألوان، شعار، محتوى)
- 🌐 دومين فرعي لكل عميل
- 💾 قاعدة بيانات منفصلة لكل عميل
- 🔒 عزل كامل بين البيانات

### للعملاء:
- 🚗 معرض سيارات تفاعلي
- 🎯 مزادات مباشرة
- 💰 نظام مزايدة متقدم
- 📱 تطبيق موبايل (iOS & Android)
- 🌍 دعم متعدد اللغات
- 💱 محول عملات

### للأدمن:
- 📊 لوحة تحكم شاملة
- 👥 إدارة العملاء
- 🚗 إدارة السيارات والمزادات
- 📈 تقارير وإحصائيات
- ⚙️ إعدادات متقدمة

---

## 🚀 التشغيل السريع

### المتطلبات:
- Node.js 20+
- npm أو yarn
- MongoDB

### التثبيت:
```bash
# استنساخ المشروع
git clone https://github.com/majedalhashdi7-ux/client-app.git

# الدخول للمجلد
cd client-app

# تثبيت الحزم
npm install

# إعداد البيئة
cp .env.example .env.local
# عدل .env.local بالإعدادات الخاصة بك

# تشغيل النظام
npm run dev
```

### الوصول:
```
http://localhost:3001
```

---

## 📁 هيكل المشروع

```
client-app/
├── src/
│   ├── app/                    # صفحات Next.js
│   │   ├── page.tsx           # الصفحة الرئيسية
│   │   ├── showroom/          # معرض السيارات
│   │   ├── auctions/          # المزادات
│   │   ├── admin/             # لوحة التحكم
│   │   └── api/               # APIs
│   ├── components/            # المكونات
│   │   ├── ModernCarXHome.tsx
│   │   ├── UltraModernCarCard.tsx
│   │   ├── AuthModals.tsx
│   │   └── ...
│   ├── lib/                   # المكتبات
│   │   ├── TenantContext.tsx
│   │   ├── api.ts
│   │   └── ...
│   └── types/                 # TypeScript Types
├── public/                    # الملفات العامة
├── tenants/                   # إعدادات العملاء
│   └── tenants.json
└── scripts/                   # سكريبتات مساعدة
```

---

## 🎨 التقنيات المستخدمة

### Frontend:
- **Next.js 16** - إطار React
- **React 19** - مكتبة UI
- **TypeScript** - لغة البرمجة
- **Tailwind CSS 4** - تصميم الواجهة
- **Framer Motion** - التأثيرات الحركية
- **Three.js** - رسومات 3D
- **GSAP** - تأثيرات متقدمة

### Backend:
- **Next.js API Routes** - APIs
- **MongoDB** - قاعدة البيانات
- **Socket.io** - اتصال مباشر

### Mobile:
- **Capacitor** - تطبيقات موبايل
- **iOS & Android** - دعم كامل

### الميزات:
- **Multi-Tenant** - عملاء متعددين
- **Real-time** - تحديثات فورية
- **Responsive** - تصميم متجاوب
- **SEO Optimized** - محسن لمحركات البحث

---

## 🏢 Multi-Tenant System

### كيف يعمل:

#### 1. إضافة عميل جديد:
```bash
npm run add-tenant
```

#### 2. إعداد العميل:
```json
{
  "id": "client1",
  "name": "اسم العميل",
  "domain": "client1.example.com",
  "database": "client1_db",
  "theme": {
    "primaryColor": "#000000",
    "secondaryColor": "#ff0000"
  }
}
```

#### 3. النشر:
- كل عميل له دومين فرعي خاص
- كل عميل له قاعدة بيانات منفصلة
- كل عميل له تخصيص كامل

---

## 📱 تطبيق الموبايل

### البناء:

#### Android:
```bash
npm run cap:android
```

#### iOS:
```bash
npm run cap:ios
```

### الميزات:
- ✅ Push Notifications
- ✅ Splash Screen
- ✅ Status Bar
- ✅ Haptics
- ✅ Keyboard

---

## 🔧 الإعدادات

### ملف .env.local:
```env
# API
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=HM CAR
NEXT_PUBLIC_APP_URL=https://example.com

# Database
MONGO_URI=mongodb://localhost:27017/hmcar

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://example.com

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password

# Environment
NODE_ENV=production
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
3. اختر repository: `client-app`
4. أضف متغيرات البيئة
5. اضغط Deploy

### متغيرات البيئة المطلوبة:
- `NEXT_PUBLIC_API_URL`
- `MONGO_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

---

## 📊 الإحصائيات

- ✅ **Multi-Tenant** - دعم عملاء غير محدود
- ✅ **Real-time** - تحديثات فورية
- ✅ **Mobile Apps** - iOS & Android
- ✅ **3D Graphics** - Three.js
- ✅ **Responsive** - جميع الأجهزة
- ✅ **SEO** - محسن بالكامل

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

### الأنظمة:
- ✅ iOS (تطبيق أصلي)
- ✅ Android (تطبيق أصلي)
- ✅ Web (جميع المتصفحات)

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
- Repository: [client-app](https://github.com/majedalhashdi7-ux/client-app)

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع التوثيق
2. افتح [Issue](https://github.com/majedalhashdi7-ux/client-app/issues)
3. تواصل عبر WhatsApp: +967781007805

---

## 🎉 شكراً لاستخدام HM CAR!

**النظام جاهز 100% للاستخدام والنشر!** 🚀

---

**آخر تحديث:** 2026-03-31  
**الإصدار:** 2.0.0  
**الحالة:** ✅ جاهز للإنتاج
