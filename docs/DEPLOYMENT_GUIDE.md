# دليل النشر - HM CAR

**Deployment Guide**

---

## 🚀 نظرة عامة

يدعم HM CAR عدة طرق للنشر. هذا الدليل يغطي النشر على Vercel (الموصى به).

---

## 📋 قبل البدء

### المتطلبات:
- ✅ حساب Vercel
- ✅ حساب MongoDB Atlas
- ✅ حساب Redis Cloud (اختياري)
- ✅ حساب Cloudinary (اختياري)
- ✅ Domain name (اختياري)

---

## 🌐 النشر على Vercel

### الخطوة 1: إعداد MongoDB Atlas

```bash
# 1. إنشاء حساب على MongoDB Atlas
https://www.mongodb.com/cloud/atlas

# 2. إنشاء Cluster جديد
- اختر Free Tier (M0)
- اختر المنطقة الأقرب

# 3. إنشاء Database User
- Username: hmcar_user
- Password: <strong-password>
- Role: Read and write to any database

# 4. إضافة IP Address
- Add IP: 0.0.0.0/0 (Allow from anywhere)
- أو إضافة IPs محددة

# 5. الحصول على Connection String
mongodb+srv://hmcar_user:<password>@cluster0.xxxxx.mongodb.net/hmcar?retryWrites=true&w=majority
```

### الخطوة 2: إعداد Vercel Project

```bash
# 1. تثبيت Vercel CLI
npm install -g vercel

# 2. تسجيل الدخول
vercel login

# 3. ربط المشروع
vercel link

# 4. إعداد Environment Variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add NODE_ENV
```

### الخطوة 3: إعداد Environment Variables

في Vercel Dashboard → Settings → Environment Variables:

```bash
# Required
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Optional
REDIS_URL=redis://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api/v2
```

### الخطوة 4: إعداد vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "vercel-server.js",
      "use": "@vercel/node"
    },
    {
      "src": "client-app/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/v2/(.*)",
      "dest": "/vercel-server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client-app/$1"
    }
  ]
}
```

### الخطوة 5: النشر

```bash
# نشر للإنتاج
vercel --prod

# أو استخدام Git integration
git push origin main
# Vercel سينشر تلقائياً
```

---

## 🔧 إعداد Multi-Tenant

### 1. إنشاء قواعد بيانات للـ Tenants:

```bash
# في MongoDB Atlas
# إنشاء database لكل tenant:
- hmcar_db (Main tenant)
- carx_db (Tenant 1)
- tenant2_db (Tenant 2)
```

### 2. تحديث tenants.json:

```json
{
  "tenants": [
    {
      "id": "hmcar",
      "name": "HM CAR",
      "domain": "hmcar.com",
      "subdomain": "hmcar",
      "database": {
        "uri": "mongodb+srv://...@cluster0.xxxxx.mongodb.net/hmcar_db",
        "name": "hmcar_db"
      },
      "features": {
        "auctions": true,
        "store": true,
        "showroom": true
      }
    },
    {
      "id": "carx",
      "name": "CarX",
      "domain": "carx.com",
      "subdomain": "carx",
      "database": {
        "uri": "mongodb+srv://...@cluster0.xxxxx.mongodb.net/carx_db",
        "name": "carx_db"
      },
      "features": {
        "auctions": true,
        "store": true,
        "showroom": false
      }
    }
  ]
}
```

### 3. إضافة Domains في Vercel:

```bash
# في Vercel Dashboard → Domains
1. إضافة hmcar.com
2. إضافة carx.com
3. تحديث DNS records
```

---

## 🗄️ Database Migration

### تشغيل Migrations في Production:

```bash
# 1. الاتصال بـ Production DB
MONGODB_URI=<production-uri> npm run migrate

# 2. Seed initial data
MONGODB_URI=<production-uri> npm run seed

# 3. إنشاء admin user
MONGODB_URI=<production-uri> npm run create:admin
```

---

## 🔐 الأمان في Production

### 1. Environment Variables:
```bash
# استخدام secrets قوية
JWT_SECRET=$(openssl rand -base64 32)

# تدوير الـ secrets بانتظام
# تحديث كل 90 يوم
```

### 2. HTTPS:
```bash
# Vercel يوفر HTTPS تلقائياً
# تأكد من تفعيل Force HTTPS
```

### 3. Rate Limiting:
```bash
# تأكد من تفعيل rate limiting
# في middleware/rateLimiter.js
```

### 4. CORS:
```bash
# تحديد domains المسموحة فقط
CORS_ORIGIN=https://hmcar.com,https://carx.com
```

---

## 📊 Monitoring

### 1. Vercel Analytics:
```bash
# تفعيل في Vercel Dashboard
Settings → Analytics → Enable
```

### 2. Error Tracking:
```bash
# استخدام Sentry (اختياري)
npm install @sentry/node

# في server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### 3. Logging:
```bash
# Winston logs في Production
# تخزين في ملفات أو external service
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🚨 Rollback Strategy

### في حالة وجود مشكلة:

```bash
# 1. Rollback في Vercel
vercel rollback <deployment-url>

# 2. أو من Dashboard
Deployments → Previous deployment → Promote to Production

# 3. Database rollback (إذا لزم)
MONGODB_URI=<production-uri> npm run migrate:rollback
```

---

## 📈 Performance Optimization

### 1. CDN:
```bash
# Vercel CDN تلقائي
# تأكد من cache headers صحيحة
```

### 2. Database Indexes:
```bash
# تشغيل script لإضافة indexes
MONGODB_URI=<production-uri> npm run optimize:db
```

### 3. Redis Caching:
```bash
# إعداد Redis Cloud
https://redis.com/try-free/

# إضافة REDIS_URL في Vercel
```

---

## 🧪 Testing في Production

### Smoke Tests:

```bash
# بعد النشر، اختبار endpoints أساسية
curl https://your-domain.com/health
curl https://your-domain.com/api/v2/cars

# اختبار authentication
curl -X POST https://your-domain.com/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 📝 Checklist قبل النشر

### Pre-Deployment:
- [ ] جميع الاختبارات تعمل
- [ ] Environment variables محدثة
- [ ] Database migrations جاهزة
- [ ] Backup للـ database
- [ ] Documentation محدثة

### Post-Deployment:
- [ ] Smoke tests ناجحة
- [ ] Monitoring يعمل
- [ ] Logs تظهر بشكل صحيح
- [ ] Performance مقبول
- [ ] Error tracking يعمل

---

## 🆘 Troubleshooting

### مشكلة: Deployment فشل

```bash
# تحقق من logs
vercel logs <deployment-url>

# تحقق من build logs
vercel build --debug
```

### مشكلة: Database connection فشل

```bash
# تحقق من:
1. IP whitelist في MongoDB Atlas
2. Connection string صحيح
3. Database user له permissions
4. Network connectivity
```

### مشكلة: Environment variables لا تعمل

```bash
# تحقق من:
1. Variables موجودة في Vercel
2. Scope صحيح (Production/Preview/Development)
3. Redeploy بعد التغيير
```

---

## 📞 الدعم

للمساعدة في النشر:
- 📧 Email: deploy@hmcar.com
- 💬 Discord: #deployment channel
- 📖 Docs: https://docs.hmcar.com/deployment

---

**Last Updated:** March 31, 2026
