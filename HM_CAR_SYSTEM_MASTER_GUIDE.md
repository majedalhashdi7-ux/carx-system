# 🚗 دليل النظام الشامل والتوثيق الموحد | HM CAR SYSTEM V2 (Master Guide)

> **الإصدار:** 2.0.0 (Enterprise Multi-Tenant Edition)  
> **الرابط الحي المباشر:** [https://hmcar-system-two.vercel.app](https://hmcar-system-two.vercel.app)  
> **بيئة الاستضافة:** Vercel Serverless Edge Platform  
> **قاعدة البيانات السحابية:** MongoDB Atlas Cluster  

---

## 📑 فهرس المحتويات
1. [نظرة عامة على النظام (Executive Overview)](#1-نظرة-عامة-على-النظام)
2. [الهيكل المعماري للمشروع (Directory & File Architecture)](#2-الهيكل-المعماري-للمشروع)
3. [قواعد البيانات والنماذج (Database & Data Models)](#3-قواعد-البيانات-والنماذج)
4. [بوابات النظام والخدمات الأساسية (Core Modules)](#4-بوابات-النظام-والخدمات-الأساسية)
5. [بوابة الاستيراد الذكية المنفصلة (Separated Import Pipelines)](#5-بوابة-الاستيراد-الذكية-المنفصلة)
6. [نظام رفع وتخزين الصور السحابي (Multi-Cloud Storage)](#6-نظام-رفع-وتخزين-الصور-السحابي)
7. [مرجع واجهات برمجة التطبيقات (API Reference V2)](#7-مرجع-واجهات-برمجة-التطبيقات-api-v2)
8. [الأداء وسرعة التحميل اللحظية (Performance & Caching)](#8-الأداء-وسرعة-التحميل-اللحظية)
9. [دليل النشر والتشغيل (Deployment & Operations)](#9-دليل-النشر-والتشغيل)

---

## 1. نظرة عامة على النظام

نظام **HM CAR** هو منصة رقمية متكاملة وفائقة السرعة لتجارة واستيراد السيارات الكورية والمحلية، وإدارة مزادات السيارات الحية واللحظية، وسوق قطع الغيار المتخصصة، مبنية وفق أحدث معايير الويب المعاصرة:

* **الواجهة الأمامية (Frontend):** Next.js 15 (App Router)، React 19، TailwindCSS، Framer Motion، Lucide Icons.
* **الخادم والـ API (Backend):** Node.js، Express.js، Serverless Functions المتوافقة مع Vercel.
* **قاعدة البيانات (Database):** MongoDB Atlas السحابية مع نظام Multi-Tenant متقدم يفصل بين المعارض والأنظمة.
* **التخزين السحابي (Storage):** دعم مزدوج لـ Vercel Blob Storage و Cloudinary مع ضغط وتحويل تلقائي لصيغة WebP.
* **المزادات اللحظية:** Smart Background Polling (4 ثوانٍ) لضمان العمل المستمر واللحظي بدون انقطاع على خوادم Serverless.

---

## 2. الهيكل المعماري للمشروع

```
car-auction/
├── client-app/                    # تطبيق الواجهة الأمامية (Next.js 15 App Router)
│   ├── src/
│   │   ├── app/                   # مسارات الصفحات (20+ صفحة عامة + لوحة التحكم)
│   │   │   ├── (public)/          # /, /cars, /parts, /auctions, /showroom, /brands...
│   │   │   ├── admin/             # لوحة تحكم الأدمن (/admin/dashboard, /admin/import...)
│   │   │   └── client/            # لوحة تحكم العميل والحساب الشخصي
│   │   ├── components/            # مكونات الواجهة (Cards, Modals, Navbar, Footer...)
│   │   └── lib/                   # مكتبات الاتصال، السياقات (Auth, Settings, Tenant, API)
│   └── next.config.js             # إعدادات Next.js وضغط الحزم والصور
│
├── routes/api/v2/                 # مسارات الـ Backend API (Node.js/Express)
│   ├── cars.js                    # إدارة وجلب السيارات المحلية
│   ├── showroom.js                # إدارة وعرض سيارات المعرض الكوري
│   ├── auctions.js                # إدارة وجلب المزادات العادية واللحظية
│   ├── live-auctions.js           # جلسات البث الحي ومزايدات الوقت الفعلي
│   ├── parts.js                   # إدارة وعرض سوق قطع الغيار
│   ├── brands.js                  # إدارة وتصنيف الوكالات والمصنعين
│   ├── import.js                  # محرك الاستيراد الذكي المنفصل
│   ├── upload.js                  # محرك رفع وتخزين الصور السحابي
│   ├── auth.js                    # المصادقة، تسجيل الدخول، وحماية الجلسات
│   ├── orders.js & invoices.js    # إدارة الطلبات والفواتير الإلكترونية
│   └── system.js                  # الصيانة، فحص النظام، والمزامنة السحابية
│
├── models/                        # نماذج وقواعد بيانات Mongoose
│   ├── Car.js                     # نموذج السيارات ومواصفاتها التفصيلية
│   ├── Auction.js & Bid.js        # نموذج المزادات وسجل المزايدات
│   ├── SparePart.js               # نموذج قطع الغيار وتوافقيتها
│   ├── Brand.js                   # نموذج الماركات والوكالات
│   ├── User.js & Role.js          # نموذج المستخدمين والصلاحيات
│   ├── Order.js & Invoice.js      # نموذج الطلبات والفواتير
│   └── SiteSettings.js            # إعدادات الموقع، أسعار الصرف، والهوية
│
├── services/                      # محركات الخدمات الخلفية والذكاء الاصطناعي
│   ├── ShowroomImportService.js   # محرك استيراد سيارات المعرض الكوري
│   ├── LiveAuctionImportService.js# محرك استيراد سيارات المزادات الحية
│   ├── PartsImportService.js      # محرك استيراد قطع الغيار
│   ├── KoreanTranslationService.js# محرك التعريب الآلي للنصوص الكورية
│   └── WatermarkService.js        # محرك تطبيق العلامة المائية على الصور
│
├── tenants/                       # محرك إدارة المعارض المتعددة (Multi-Tenant Engine)
│   ├── tenant-resolver.js         # كاشف ومحدد المعرض من الدومين/Header
│   ├── tenant-db-manager.js       # مدير اتصالات قواعد البيانات المتعددة
│   └── tenants.json               # إعدادات المعارض المعرفة (HM CAR, CAR X)
│
├── scripts/                       # سكربتات التشغيل والأتمتة والفحص
│   ├── audit_all_routes.js        # سكريبت الفحص الشامل لجميع مسارات النظام
│   └── push_all_real_data_to_atlas.js # سكريبت مزامنة البيانات الحقيقية
│
├── vercel-server.js               # نقطة الدخول الرئيسية لبيئة Vercel Serverless
└── vercel.json                    # توجيه الروابط وتوزيع المسارات
```

---

## 3. قواعد البيانات والنماذج

قاعدة البيانات السحابية (MongoDB Atlas) تتضمن كافة الجداول الحقيقية المنعزلة:

| النموذج (Model) | المجموعة (Collection) | الوصف | الحقول الأساسية |
| :--- | :--- | :--- | :--- |
| **Car** | `cars` | سيارات المتجر والمعرض الكوري والمزادات | `title`, `make`, `model`, `year`, `priceSar`, `listingType`, `source`, `images`, `specs` |
| **Auction** | `auctions` | جلسات المزادات والمزايدة الحية | `car`, `startingPrice`, `currentBid`, `minBidIncrement`, `startsAt`, `endsAt`, `status` |
| **Bid** | `bids` | المزايدات الفردية المسجلة | `auction`, `bidder`, `amount`, `createdAt` |
| **SparePart** | `spareparts` | قطع الغيار وملحقات السيارات | `name`, `partNumber`, `brand`, `carMake`, `carModel`, `priceSar`, `stockQty`, `images` |
| **Brand** | `brands` | ماركات ووكالات السيارات والقطع | `name`, `key`, `logoUrl`, `forCars`, `forSpareParts`, `isActive` |
| **Order & Invoice** | `orders`, `invoices` | طلبات الشراء والفواتير الصادرة | `orderNumber`, `customer`, `items`, `totalAmount`, `status`, `paymentMethod` |
| **User** | `users` | حسابات العملاء والمدراء | `name`, `email`, `phone`, `role`, `password`, `isVerified` |
| **SiteSettings** | `sitesettings` | إعدادات الموقع وأسعار الصرف | `currencySettings` (usdToSar, usdToKrw), `siteInfo`, `socialLinks` |

---

## 4. بوابات النظام والخدمات الأساسية

### 1. معرض السيارات (Showroom & Cars)
* تصفح وفلترة ذكية حسب الماركة، الموديل، سنة الصنع، السعر، ونوع الوقود.
* عزل كامل بين **سيارات المعرض الكوري المستوردة** و**سيارات متجر HM المحلي**.
* دعم المواصفات التفصيلية، تقرير الفحص الفني، والأسعار المحولة بالريال والدولار والوون.

### 2. مزادات السيارات الحية (Live Auctions)
* تحديث فوري ولحظي للمزايدات (Smart Polling كل 4 ثوانٍ).
* نظام منع المزايدات الوهمية، والتحقق التلقائي من انتهاء وقت المزاد.
* مؤقت عد تنازلي دقيق وشريط تقدم زمني متجاوب.

### 3. سوق قطع الغيار (Spare Parts)
* بحث لحظي مع الإكمال التلقائي وتصفية حسب رقم القطعة (OEM) والماركة والتوافقية.
* نافذة تفاصيل منبثقة سريعة (Product Modal) لإتمام الطلب أو الإضافة للسلة مباشرة.

---

## 5. بوابة الاستيراد الذكية المنفصلة

تم فصل مسارات الاستيراد إلى **4 مسارات مستقلة تماماً** تضمن عدم تداخل البيانات:

```
[بوابة الاستيراد /admin/import]
  ├──► [1. سيارات المعرض الكوري] ──► POST /api/v2/import/showroom ────► Cars (listingType: 'showroom', source: 'encar_korea')
  ├──► [2. مزادات السيارات الحية] ──► POST /api/v2/import/live-auctions ─► Auctions + Cars (listingType: 'auction')
  ├──► [3. سوق قطع الغيار] ────────► POST /api/v2/import/parts ────────► SpareParts + Brands (forSpareParts: true)
  └──► [4. سيارات متجر HM المحلي] ──► POST /api/v2/import/save ─────────► Cars (listingType: 'store', source: 'hm_local')
```

* **التعريب الآلي:** ترجمة تلقائية ذكية للنصوص والمواصفات ودرجات الفحص الكورية.
* **العلامة المائية:** ختم العلامة المائية الرسمية لـ HM CAR على صور السيارات تلقائياً.
* **منع التكرار:** كشف ذكي لروابط ومعرفات المصدر لمنع تكرار إدخال نفس العنصر.

---

## 6. نظام رفع وتخزين الصور السحابي

يدعم الخادم محرك تخزين سحابي مرن ومزدوج عبر مسار موحد `/api/v2/upload`:

* **Vercel Blob Storage:** التخزين السحابي فائق السرعة مع شبكة توزيع عالمية (CDN).
* **Cloudinary Storage:** التخزين السحابي مع ضغط ذكي وتحويل فوري لصيغة WebP.
* **الرفع الجماعي (`POST /api/v2/upload/multiple`):** رفع حتى 10 صور بنقرة واحدة.
* **الرفع عبر Base64 (`POST /api/v2/upload/base64`):** دعم السحب والإفلات واللصق المباشر.
* **الضغط في المتصفح:** تقليص حجم الصور حتى 80% في المتصفح قبل الرفع عبر `browser-image-compression`.

---

## 7. مرجع واجهات برمجة التطبيقات (API V2)

| المسار (Endpoint) | الطريقة (Method) | الوصف | الصلاحية |
| :--- | :---: | :--- | :---: |
| `/api/health` | `GET` | فحص صحة الخادم السحابي وقاعدة البيانات | عام |
| `/api/v2/cars` | `GET` | جلب قائمة السيارات المفلترة مع الترقيم والكاش | عام |
| `/api/v2/cars/:id` | `GET` | جلب تفاصيل سيارة محددة بواسطة ID | عام |
| `/api/v2/showroom/cars` | `GET` | جلب سيارات المعرض الكوري المستوردة | عام |
| `/api/v2/auctions` | `GET` | جلب المزادات النشطة والمجدولة | عام |
| `/api/v2/auctions/:id` | `GET` | جلب تفاصيل جلسة المزاد وأحدث سعر | عام |
| `/api/v2/parts` | `GET` | جلب قائمة قطع الغيار مع خيارات الفلترة | عام |
| `/api/v2/parts/:id` | `GET` | جلب تفاصيل قطعة غيار محددة | عام |
| `/api/v2/brands` | `GET` | جلب قائمة الماركات والوكالات | عام |
| `/api/v2/settings/public` | `GET` | جلب إعدادات الموقع العامة وأسعار الصرف | عام |
| `/api/v2/upload` | `POST` | رفع صورة منفردة إلى التخزين السحابي | مسجل |
| `/api/v2/upload/multiple` | `POST` | رفع حتى 10 صور دفعة واحدة | مسجل |
| `/api/v2/upload/status` | `GET` | فحص حالة وجاهزية مزودي التخزين السحابي | عام |
| `/api/v2/import/showroom` | `POST` | استيراد دفعة سيارات كورية للمعرض | أدمن |
| `/api/v2/import/live-auctions` | `POST` | استيراد سيارات جديدة لجدول المزادات الحية | أدمن |
| `/api/v2/import/parts` | `POST` | استيراد شامل لكافة أصناف قطع الغيار | أدمن |

---

## 8. الأداء وسرعة التحميل اللحظية

تم تطبيق أعلى معايير التسريع والأداء في بيئة الإنتاج:

1. **التحميل اللحظي (0ms Instant Loading):**
   * كاش الذاكرة المؤقتة السريع في المتصفح عبر `apiCache`.
   * التسخين الاستباقي للبيانات في أوقات خمول المتصفح (`requestIdleCallback`).
   * التحميل الفوري بمجرد اقتراب المؤشر أو اللمس (30ms Hover/Touch Prefetch).

2. **كاش الحافة (Vercel Edge CDN Caching):**
   * ترويسات `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` لجميع مسارات الـ API العامة.
   * زمن استجابة الـ API ينخفض من ثوانٍ إلى **120ms - 150ms**.

3. **تحسين اتصال قاعدة البيانات (Serverless Connection Warm-up):**
   * إعادة استخدام اتصال Mongoose النشط في بيئة Serverless دون إعادة فتح اتصالات جديدة مع كل طلب.

---

## 9. دليل النشر والتشغيل

### الأوامر التشغيلية الأساسية:

```bash
# 1. تثبيت الحزم الأساسية
npm install

# 2. تشغيل بيئة التطوير المحلية
npm run dev

# 3. بناء المشروع والتحقق من سلامة الأكواد
npm run build

# 4. النشر المباشر إلى سيرفر Vercel الإنتاجي
npx vercel --prod --yes

# 5. تشغيل الفحص والتدقيق الشامل لجميع مسارات النظام (36 مسار)
node scripts/audit_all_routes.js
```

### متغيرات البيئة الأساسية (`.env`):

```env
# قاعدة البيانات السحابية
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hmcar?retryWrites=true&w=majority

# الأمان والمصادقة
JWT_SECRET=your_super_secret_jwt_key_here
SESSION_SECRET=your_super_secret_session_key_here

# التخزين السحابي للصور (Vercel Blob أو Cloudinary)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# أسعار الصرف الافتراضية
USD_TO_SAR=3.75
USD_TO_KRW=1350
```

---

**تم إنشاء هذا التوثيق الشامل ليكون المرجع التقني والتشغيلي الموحد والنهائي لكافة أجزاء نظام HM CAR V2.**
