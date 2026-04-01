# خارطة الطريق - HM CAR System
آخر تحديث: 28 مارس 2026

---

## 🔴 المتبقي الحرج (يجب تنفيذه فوراً)

### 1. الأمان - تغيير المفاتيح المكشوفة
**الأولوية:** 🔴 حرجة جداً  
**الوقت:** 10 دقائق

**المطلوب:**
```bash
# 1. توليد مفاتيح جديدة
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # SESSION_SECRET

# 2. غير في .env:
JWT_SECRET=<المفتاح الجديد>
SESSION_SECRET=<المفتاح الجديد>
PROD_ADMIN_PASSWORD=<كلمة سر قوية جديدة>

# 3. حدث Vercel Environment Variables
```

**السبب:** المفاتيح الحالية مكشوفة في Git history

---

### 2. النشر - Push وتحديث Vercel
**الأولوية:** 🔴 حرجة  
**الوقت:** 5 دقائق

```bash
git push origin main
```

**ثم في Vercel Dashboard:**
- أضف جميع Environment Variables
- انتظر اكتمال النشر
- اختبر `/health` endpoint

---

### 3. البيانات - إصلاح سنة السيارات والمزادات
**الأولوية:** 🔴 حرجة  
**الوقت:** 2 دقيقة

```bash
npm run fix:live
```

**يصلح:**
- سنة السيارات (202111 → 2021)
- المزادات المنتهية
- رابط الواتساب

---

## 🟡 التحسينات ذات الأولوية العالية

### 4. الأمان - Rate Limiting
**الأولوية:** 🟡 عالية  
**الوقت:** 30 دقيقة  
**التأثير:** حماية من brute force attacks

**التنفيذ:**
```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

// Rate limiter عام
const generalLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب
  message: 'طلبات كثيرة جداً، حاول لاحقاً'
});

// Rate limiter للـ Auth (أكثر صرامة)
const authLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 محاولات فقط
  message: 'محاولات تسجيل دخول كثيرة، حاول بعد 15 دقيقة'
});

module.exports = { generalLimiter, authLimiter };
```

**الاستخدام:**
```javascript
// في vercel-server.js
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

app.use('/api', generalLimiter);
app.use('/api/v2/auth/login', authLimiter);
```

---

### 5. Error Handling - Error Boundaries
**الأولوية:** 🟡 عالية  
**الوقت:** 45 دقيقة  
**التأثير:** تحسين تجربة المستخدم عند الأخطاء

**التنفيذ:**
```typescript
// client-app/src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // إرسال للـ Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              حدث خطأ غير متوقع
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-amber-500 text-black rounded-lg"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**الاستخدام:**
```typescript
// في layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

### 6. Monitoring - تفعيل Sentry
**الأولوية:** 🟡 عالية  
**الوقت:** 20 دقيقة  
**التأثير:** تتبع الأخطاء في Production

**التنفيذ:**
```bash
# 1. احصل على Sentry DSN من sentry.io
# 2. أضف في .env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

---

### 7. TypeScript - إضافة Interfaces
**الأولوية:** 🟡 عالية  
**الوقت:** 1 ساعة  
**التأثير:** تقليل الأخطاء، تحسين IntelliSense

**التنفيذ:**
```typescript
// client-app/src/types/index.ts

export interface Car {
  id: string;
  _id?: string;
  make: string;
  makeAr?: string;
  model: string;
  modelAr?: string;
  year: number;
  price: number;
  priceSar?: number;
  mileage?: number;
  images: string[];
  thumbnail?: string;
  condition: 'new' | 'used' | 'certified';
  stockQty?: number;
  stock?: number;
  description?: string;
  descriptionAr?: string;
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Part {
  id: string;
  _id?: string;
  name: string;
  nameAr?: string;
  brand?: string;
  brandName?: string;
  category?: string;
  categoryAr?: string;
  price: number;
  priceSar?: number;
  img?: string;
  images?: string[];
  stockQty?: number;
  stock?: number;
  condition?: string;
  description?: string;
  descriptionAr?: string;
}

export interface Auction {
  id: string;
  _id?: string;
  carId: string;
  car?: Car;
  startingPrice: number;
  currentBid: number;
  status: 'scheduled' | 'running' | 'ended' | 'cancelled';
  startsAt: Date;
  endsAt: Date;
  bids: Bid[];
  winnerId?: string;
}

export interface Bid {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  nameAr?: string;
  role: 'buyer' | 'admin' | 'seller';
  phone?: string;
  avatar?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

**الاستخدام:**
```typescript
// في PartCard.tsx
import { Part } from '@/types';

interface PartCardProps {
  part: Part;
  index?: number;
  onClick?: () => void;
  onLoginRequired?: () => void;
}
```

---

## 🟢 التحسينات المتوسطة الأولوية

### 8. Performance - Redis Caching
**الأولوية:** 🟢 متوسطة  
**الوقت:** 1 ساعة  
**التأثير:** تسريع API responses

**التنفيذ:**
```javascript
// middleware/cache.js (تحسين الموجود)
const redis = require('../config/redis');

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Override res.json
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (err) {
      next();
    }
  };
};

module.exports = cacheMiddleware;
```

**الاستخدام:**
```javascript
// في routes
const cache = require('../../middleware/cache');

router.get('/cars', cache(300), async (req, res) => {
  // ... الكود الحالي
});
```

---

### 9. Performance - Code Splitting
**الأولوية:** 🟢 متوسطة  
**الوقت:** 30 دقيقة  
**التأثير:** تقليل bundle size

**التنفيذ:**
```typescript
// استخدام dynamic imports
import dynamic from 'next/dynamic';

// Lazy load المكونات الثقيلة
const ThreeScene = dynamic(() => import('@/components/ThreeScene'), {
  ssr: false,
  loading: () => <div>جاري التحميل...</div>
});

const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  ssr: false
});
```

---

### 10. UX - Loading States
**الأولوية:** 🟢 متوسطة  
**الوقت:** 45 دقيقة  
**التأثير:** تحسين تجربة المستخدم

**التنفيذ:**
```typescript
// client-app/src/components/LoadingSkeleton.tsx
export function CarCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-white/10 rounded-2xl mb-4" />
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-4 bg-white/10 rounded w-1/2" />
    </div>
  );
}

// الاستخدام
import { Suspense } from 'react';

<Suspense fallback={<CarCardSkeleton />}>
  <CarCard car={car} />
</Suspense>
```

---

### 11. SEO - Sitemap Dynamic
**الأولوية:** 🟢 متوسطة  
**الوقت:** 30 دقيقة  
**التأثير:** تحسين SEO

**التنفيذ:**
```typescript
// client-app/src/app/sitemap.ts (تحسين الموجود)
import { fetchAPI } from '@/lib/api';

export default async function sitemap() {
  const baseUrl = 'https://hmcar.okigo.net';

  // جلب السيارات من API
  const carsRes = await fetchAPI('/api/v2/cars?limit=1000');
  const cars = carsRes.data?.cars || [];

  const carUrls = cars.map((car: any) => ({
    url: `${baseUrl}/cars/${car.id}`,
    lastModified: new Date(car.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // جلب قطع الغيار
  const partsRes = await fetchAPI('/api/v2/parts?limit=1000');
  const parts = partsRes.data?.parts || [];

  const partUrls = parts.map((part: any) => ({
    url: `${baseUrl}/parts/${part.id}`,
    lastModified: new Date(part.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...carUrls,
    ...partUrls,
  ];
}
```

---

## 🔵 الميزات الجديدة المقترحة

### 12. ميزة: مقارنة السيارات
**الأولوية:** 🔵 منخفضة  
**الوقت:** 3 ساعات  
**القيمة:** تحسين تجربة المستخدم

**الوصف:**
- السماح للمستخدم بمقارنة حتى 3 سيارات
- عرض المواصفات جنباً إلى جنب
- تخزين المقارنات في localStorage

**التنفيذ:**
```typescript
// client-app/src/lib/compare.ts
export function addToCompare(carId: string) {
  const compare = getCompareList();
  if (compare.length >= 3) {
    throw new Error('يمكنك مقارنة 3 سيارات فقط');
  }
  if (!compare.includes(carId)) {
    compare.push(carId);
    localStorage.setItem('hm_compare', JSON.stringify(compare));
  }
}

export function getCompareList(): string[] {
  try {
    return JSON.parse(localStorage.getItem('hm_compare') || '[]');
  } catch {
    return [];
  }
}
```

---

### 13. ميزة: تنبيهات الأسعار
**الأولوية:** 🔵 منخفضة  
**الوقت:** 4 ساعات  
**القيمة:** زيادة engagement

**الوصف:**
- المستخدم يحدد سعر مستهدف لسيارة
- إرسال إشعار عندما ينخفض السعر
- استخدام WebSockets للتنبيهات الفورية

**التنفيذ:**
```javascript
// Backend: models/PriceAlert.js
const priceAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  targetPrice: Number,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Cron job للتحقق من الأسعار
// scripts/check-price-alerts.js
```

---

### 14. ميزة: تقييمات ومراجعات
**الأولوية:** 🔵 منخفضة  
**الوقت:** 5 ساعات  
**القيمة:** بناء الثقة

**الوصف:**
- السماح للمشترين بتقييم السيارات
- عرض متوسط التقييمات
- إمكانية كتابة مراجعة نصية

**التنفيذ:**
```javascript
// models/Review.js
const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  commentAr: String,
  verified: { type: Boolean, default: false }, // اشترى فعلاً
  createdAt: { type: Date, default: Date.now }
});
```

---

### 15. ميزة: تمويل السيارات
**الأولوية:** 🔵 منخفضة  
**الوقت:** 8 ساعات  
**القيمة:** زيادة المبيعات

**الوصف:**
- حاسبة التمويل
- عرض الأقساط الشهرية
- التكامل مع بنوك (مستقبلاً)

**التنفيذ:**
```typescript
// client-app/src/components/FinanceCalculator.tsx
export function FinanceCalculator({ price }: { price: number }) {
  const [downPayment, setDownPayment] = useState(price * 0.2);
  const [months, setMonths] = useState(48);
  const [interestRate] = useState(0.05); // 5%

  const monthlyPayment = calculateMonthly(
    price - downPayment,
    interestRate,
    months
  );

  return (
    <div className="bg-white/5 p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-4">حاسبة التمويل</h3>
      {/* ... UI */}
    </div>
  );
}
```

---

### 16. ميزة: Live Chat Support
**الأولوية:** 🔵 منخفضة  
**الوقت:** 6 ساعات  
**القيمة:** تحسين خدمة العملاء

**الوصف:**
- دردشة مباشرة مع الدعم
- استخدام Socket.io الموجود
- تخزين المحادثات في MongoDB

**التنفيذ:**
```javascript
// Backend: routes/api/v2/chat.js
router.post('/messages', auth, async (req, res) => {
  const { message } = req.body;
  
  const chatMessage = await ChatMessage.create({
    userId: req.user.id,
    message,
    timestamp: new Date()
  });

  // إرسال للأدمن عبر Socket.io
  io.to('admin_room').emit('new_message', chatMessage);

  res.json({ success: true, data: chatMessage });
});
```

---

### 17. ميزة: تصدير البيانات (للمستخدم)
**الأولوية:** 🔵 منخفضة  
**الوقت:** 2 ساعات  
**القيمة:** GDPR compliance

**الوصف:**
- المستخدم يطلب تصدير بياناته
- تحميل ملف JSON أو PDF
- يشمل: الطلبات، المفضلة، المزايدات

**التنفيذ:**
```javascript
// routes/api/v2/users.js
router.get('/me/export', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const orders = await Order.find({ userId: req.user.id });
  const bids = await Bid.find({ userId: req.user.id });

  const data = {
    user: user.toObject(),
    orders,
    bids,
    exportedAt: new Date()
  };

  res.json({ success: true, data });
});
```

---

## 📊 ملخص الأولويات

### فوراً (اليوم)
1. ✅ تغيير المفاتيح السرية (10 دقائق)
2. ✅ Push ونشر (5 دقائق)
3. ✅ إصلاح البيانات (2 دقيقة)

### هذا الأسبوع
4. Rate Limiting (30 دقيقة)
5. Error Boundaries (45 دقيقة)
6. تفعيل Sentry (20 دقيقة)
7. TypeScript Interfaces (1 ساعة)

### هذا الشهر
8. Redis Caching (1 ساعة)
9. Code Splitting (30 دقيقة)
10. Loading States (45 دقيقة)
11. Dynamic Sitemap (30 دقيقة)

### المستقبل (حسب الأولوية)
12. مقارنة السيارات (3 ساعات)
13. تنبيهات الأسعار (4 ساعات)
14. تقييمات ومراجعات (5 ساعات)
15. تمويل السيارات (8 ساعات)
16. Live Chat (6 ساعات)
17. تصدير البيانات (2 ساعات)

---

## 💰 تقدير التكلفة (إذا كنت تستأجر مطور)

| المهمة | الوقت | التكلفة (تقديرية) |
|--------|------|-------------------|
| الحرجة (1-3) | 17 دقيقة | $0 (أنت) |
| عالية (4-7) | 3 ساعات | $150-300 |
| متوسطة (8-11) | 3 ساعات | $150-300 |
| ميزات جديدة (12-17) | 28 ساعة | $1,400-2,800 |

**المجموع:** $1,700-3,400 (إذا استأجرت مطور)

---

## 🎯 التوصية

**ابدأ بهذا الترتيب:**
1. ✅ الحرجة (اليوم)
2. Rate Limiting + Sentry (هذا الأسبوع)
3. TypeScript Interfaces (نهاية الأسبوع)
4. Redis Caching (الأسبوع القادم)
5. ثم الميزات الجديدة حسب feedback المستخدمين

---

تم إنشاء هذه الخارطة: 28 مارس 2026
