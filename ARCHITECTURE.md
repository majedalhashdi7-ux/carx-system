# 🏗️ مخطط معمارية مشروع HMCar / CarX
> آخر تحديث: 2026

---

## 📐 المخطط الكامل

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                          🌐  USERS / المستخدمون                                ║
╚══════════════════════╦═══════════════════════════╦═══════════════════════════════╝
                       ║                           ║
                       ▼                           ▼
        ┌──────────────────────────┐  ┌──────────────────────────────┐
        │   🖥️  client-app         │  │   🚀  carx-system             │
        │   (hmcar-client-app)     │  │   (الواجهة الجديدة)           │
        │                          │  │                              │
        │  Next.js 15 Frontend     │  │  Next.js 15 Frontend         │
        │  c:\car-auction\         │  │  c:\car-auction\carx-system\ │
        │     client-app\          │  │                              │
        │                          │  │  ┌─────────────────────────┐ │
        │  الصفحات:                │  │  │  /api/* (Next.js Routes)│ │
        │  • / (Home)              │  │  │  • /api/cars            │ │
        │  • /showroom             │  │  │  • /api/parts           │ │
        │  • /admin/dashboard      │  │  │  • /api/brands          │ │
        │  • /admin/cars           │  │  │  • /api/auth/*          │ │
        │  • /admin/users          │  │  │  • /api/admin/*         │ │
        │  • ...                   │  │  └──────────┬──────────────┘ │
        │                          │  │             │                │
        │  🌍 Vercel (مدمج)        │  │  🌍 Netlify                 │
        │  carx-system-psi.vercel  │  │  carx-system-ar.netlify.app │
        └────────────┬─────────────┘  └─────────────┬────────────────┘
                     │                               │
                     │  /api/* requests              │  MongoDB direct
                     ▼                               │
        ┌────────────────────────────┐               │
        │  ⚙️  hmcar-system (API)    │               │
        │                            │               │
        │  Express.js Server         │               │
        │  c:\car-auction\           │               │
        │                            │               │
        │  📁 routes/api/ (30+)      │               │
        │  ├── cars.js               │               │
        │  ├── users.js              │               │
        │  ├── auth.js               │               │
        │  ├── parts.js              │               │
        │  ├── brands.js             │               │
        │  ├── auctions.js           │               │
        │  ├── tenants.js            │               │
        │  └── ...                   │               │
        │                            │               │
        │  📁 middleware/            │               │
        │  ├── auth.js (JWT)         │               │
        │  ├── tenant.js             │               │
        │  └── ...                   │               │
        │                            │               │
        │  📁 services/ (24)         │               │
        │  📁 modules/ (9)           │               │
        │                            │               │
        │  🌍 Vercel                 │               │
        │  vercel-server.js          │               │
        └────────────┬───────────────┘               │
                     │                               │
                     ▼                               ▼
        ╔════════════════════════════════════════════╗
        ║          🗄️  MongoDB Database              ║
        ║                                            ║
        ║  📁 models/ (39 نموذج)                    ║
        ║  ├── Car.js                                ║
        ║  ├── User.js                               ║
        ║  ├── Part.js                               ║
        ║  ├── Brand.js                              ║
        ║  ├── Auction.js                            ║
        ║  ├── Tenant.js                             ║
        ║  └── ... (33 أخرى)                        ║
        ╚════════════════════════════════════════════╝
```

---

## 📦 تفاصيل كل مشروع

### 1️⃣ hmcar-system — الخادم الرئيسي
```
c:\car-auction\
│
├── server.js              ← نقطة دخول Express
├── vercel-server.js       ← نسخة Vercel المحسّنة
├── vercel.json            ← إعدادات Vercel (API + client-app معاً)
│
├── routes/api/            ← 30+ مسار REST API
├── models/                ← 39 نموذج Mongoose
├── middleware/            ← JWT / Tenant / CORS / Rate Limit
├── services/              ← 24 خدمة (email, upload, scraper...)
├── modules/               ← 9 وحدات (بيزنس لوجيك)
├── scripts/               ← 60 سكريبت إدارية
└── uploads/               ← الملفات المرفوعة
```

### 2️⃣ client-app — الواجهة القديمة (hmcar-client-app)
```
c:\car-auction\client-app\
│
├── src/app/               ← صفحات Next.js 15
│   ├── (public pages)     ← عام
│   └── admin/             ← لوحة الإدارة القديمة
│
└── src/components/        ← المكونات
```

### 3️⃣ carx-system — الواجهة الجديدة ✨
```
c:\car-auction\carx-system\
│
├── src/app/               ← صفحات Next.js 15
│   ├── page.tsx           ← الرئيسية
│   ├── showroom/          ← معرض السيارات
│   ├── parts/             ← قطع الغيار
│   ├── brands/            ← الوكالات
│   ├── login/             ← تسجيل الدخول
│   │
│   ├── admin/             ← لوحة الإدارة الجديدة
│   │   ├── page.tsx       ← الإحصائيات
│   │   ├── cars/          ← إدارة السيارات (list/new/edit)
│   │   ├── parts/         ← إدارة قطع الغيار (list/new/edit)
│   │   ├── brands/        ← إدارة الوكالات (list/new/edit)
│   │   ├── users/         ← إدارة المستخدمين
│   │   └── settings/      ← الإعدادات
│   │
│   └── api/               ← Next.js API Routes (تتصل بـ MongoDB مباشرة)
│       ├── cars/
│       ├── parts/
│       ├── brands/
│       ├── auth/
│       └── admin/
│
├── src/components/        ← المكونات (Navbar, Cards, Forms...)
├── src/lib/               ← AuthContext, LanguageContext...
└── netlify.toml           ← إعدادات Netlify
```

---

## 🔐 نظام المصادقة

```
┌─────────────────────────────────────────────────────┐
│                  JWT Authentication                  │
│                                                      │
│  تسجيل الدخول → توليد JWT Token → تخزين في Cookie  │
│                                                      │
│  الصلاحيات:                                         │
│  • admin   ← كامل الصلاحيات                        │
│  • manager ← إدارة السيارات والقطع                 │
│  • user    ← مشاهدة فقط                            │
└─────────────────────────────────────────────────────┘
```

---

## 🌍 النشر (Deployment)

```
┌──────────────────┬──────────────────────────────────────┐
│ المشروع         │ الرابط                                │
├──────────────────┼──────────────────────────────────────┤
│ hmcar-system     │ Vercel (API فقط)                     │
│ + client-app     │ carx-system-psi.vercel.app           │
├──────────────────┼──────────────────────────────────────┤
│ carx-system      │ https://carx-system-ar.netlify.app   │
├──────────────────┼──────────────────────────────────────┤
│ MongoDB          │ MongoDB Atlas (Cloud)                 │
└──────────────────┴──────────────────────────────────────┘
```

---

## 🔄 تدفق البيانات (Data Flow)

```
[المستخدم]
    │
    ├── يفتح carx-system-ar.netlify.app
    │       │
    │       ├── يشاهد السيارات → GET /api/cars → MongoDB
    │       ├── يسجل دخول    → POST /api/auth/login → MongoDB (JWT)
    │       └── يدخل الأدمن  → /admin/* (يتحقق من JWT + role)
    │
    └── يفتح client-app (Vercel)
            │
            ├── يطلب بيانات  → /api/* → Express hmcar-system → MongoDB
            └── يسجل دخول   → /api/auth → JWT → Cookie
```
