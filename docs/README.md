# HM CAR - Multi-Tenant Car Auction System

**نظام مزادات السيارات متعدد المستأجرين**

[![Test Coverage](https://img.shields.io/badge/coverage-60%25-yellow.svg)](test/README.md)
[![Tests](https://img.shields.io/badge/tests-198%20passing-brightgreen.svg)](test/README.md)
[![Node](https://img.shields.io/badge/node-22.x-brightgreen.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 نظرة عامة

HM CAR هو نظام مزادات سيارات احترافي متعدد المستأجرين (Multi-Tenant) مبني بتقنيات حديثة. يدعم النظام عدة عملاء (tenants) بقواعد بيانات منفصلة وميزات مخصصة لكل عميل.

### الميزات الرئيسية:
- 🏢 **Multi-Tenant Architecture** - دعم عملاء متعددين بقواعد بيانات منفصلة
- 🚗 **Car Auctions** - نظام مزادات متقدم مع مزايدة فورية
- 🛒 **E-Commerce** - متجر قطع غيار متكامل
- 🔐 **Authentication** - نظام مصادقة آمن مع JWT
- 💱 **Multi-Currency** - دعم عملات متعددة
- 🌐 **Bilingual** - دعم العربية والإنجليزية
- 📱 **Responsive** - تصميم متجاوب لجميع الأجهزة
- ⚡ **Real-time** - تحديثات فورية مع Socket.io

---

## 🏗️ المعمارية

### Stack التقني:

**Backend:**
- Node.js 22.x
- Express.js
- MongoDB (Multi-tenant)
- Socket.io (Real-time)
- Redis (Caching)
- JWT (Authentication)

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Context API

**Testing:**
- Mocha + Chai
- Supertest
- MongoDB Memory Server
- 198 tests (60% coverage)

**Deployment:**
- Vercel (Frontend & Serverless)
- MongoDB Atlas (Database)
- Redis Cloud (Caching)

---

## 📚 التوثيق

### للمطورين:
- [دليل التطوير](DEVELOPMENT_GUIDE.md) - إعداد البيئة والتطوير
- [معمارية النظام](ARCHITECTURE.md) - تفاصيل المعمارية
- [دليل API](API_DOCUMENTATION.md) - توثيق API كامل
- [دليل الاختبارات](../test/README.md) - كيفية كتابة وتشغيل الاختبارات

### للنشر:
- [دليل النشر](DEPLOYMENT_GUIDE.md) - خطوات النشر على Vercel
- [المتغيرات البيئية](ENVIRONMENT_VARIABLES.md) - شرح جميع المتغيرات

### Multi-Tenant:
- [دليل Multi-Tenant](MULTI_TENANT_GUIDE.md) - إدارة العملاء المتعددين
- [إضافة Tenant جديد](ADDING_TENANT.md) - خطوات إضافة عميل جديد

### حل المشاكل:
- [دليل حل المشاكل](TROUBLESHOOTING.md) - حلول للمشاكل الشائعة
- [FAQ](FAQ.md) - الأسئلة الشائعة

---

## 🚀 البدء السريع

### المتطلبات:
```bash
Node.js 22.x
MongoDB 6.x
Redis (optional)
```

### التثبيت:
```bash
# Clone repository
git clone <repository-url>
cd car-auction

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

### الوصول:
```
Backend:  http://localhost:5000
Frontend: http://localhost:3000
```

---

## 📁 هيكل المشروع

```
car-auction/
├── modules/              # Backend core modules
│   ├── app.js           # Express app
│   ├── core/            # Core functionality
│   └── socket.js        # Socket.io setup
├── routes/              # API routes
│   └── api/v2/          # API v2 endpoints
├── models/              # MongoDB models
├── middleware/          # Express middleware
├── services/            # Business logic
├── utils/               # Utility functions
├── client-app/          # Next.js frontend (main)
├── carx-system/         # Next.js frontend (tenant example)
├── scripts/             # Utility scripts
├── test/                # Test suite
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # E2E tests
└── docs/                # Documentation
```

---

## 🧪 الاختبارات

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

**النتائج الحالية:**
- ✅ 179 unit tests passing
- ✅ 19 integration tests passing
- 📊 60% test coverage

---

## 🔧 Scripts المتاحة

### Development:
```bash
npm run dev              # Start development server
npm run dev:full         # Dev server + auto-deploy
```

### Testing:
```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests
npm run test:coverage    # Coverage report
```

### Database:
```bash
npm run seed             # Seed database
npm run clean:db         # Reset database
```

### Deployment:
```bash
npm run build            # Build for production
npm run deploy           # Deploy to Vercel
```

---

## 🌐 Multi-Tenant

النظام يدعم عملاء متعددين (tenants) بقواعد بيانات منفصلة:

### إضافة Tenant جديد:
```bash
npm run add:tenant
```

### إدارة Tenants:
```bash
npm run list:tenants     # List all tenants
```

**للمزيد:** راجع [دليل Multi-Tenant](MULTI_TENANT_GUIDE.md)

---

## 🔐 الأمان

- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ MongoDB injection prevention

---

## 📊 الأداء

- ⚡ Redis caching
- ⚡ Database indexing
- ⚡ Image optimization
- ⚡ Code splitting
- ⚡ Lazy loading
- ⚡ Compression

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى قراءة [دليل المساهمة](CONTRIBUTING.md) قبل البدء.

### خطوات المساهمة:
1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## 📝 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

## 📞 الدعم

- 📧 Email: support@hmcar.com
- 📱 Phone: +966 XX XXX XXXX
- 💬 Discord: [Join our server](https://discord.gg/hmcar)
- 📖 Docs: [docs.hmcar.com](https://docs.hmcar.com)

---

## 🙏 شكر وتقدير

شكراً لجميع المساهمين في هذا المشروع!

---

**Built with ❤️ by HM CAR Team**
