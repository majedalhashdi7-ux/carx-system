# Test Suite - HM CAR Project

دليل شامل لاختبارات المشروع.

---

## 📁 الهيكل

```
test/
├── unit/              (اختبارات الوحدات)
│   ├── models/        - اختبارات Models
│   ├── services/      - اختبارات Services
│   ├── middleware/    - اختبارات Middleware
│   └── utils/         - اختبارات Utilities
├── integration/       (اختبارات التكامل)
│   ├── api/           - اختبارات API endpoints
│   ├── database/      - اختبارات Database
│   └── auth/          - اختبارات Authentication
├── e2e/              (اختبارات شاملة)
│   └── *.e2e.test.js - User flows كاملة
├── fixtures/         (بيانات اختبار)
│   ├── users.json
│   ├── cars.json
│   └── parts.json
└── helpers/          (أدوات مساعدة)
    ├── setup.js       - إعداد قاعدة البيانات
    ├── factories.js   - إنشاء بيانات اختبار
    └── auth.js        - مساعدات المصادقة
```

---

## 🚀 تشغيل الاختبارات

### جميع الاختبارات:
```bash
npm test
```

### Unit Tests:
```bash
npm run test:unit                  # جميع unit tests
npm run test:unit:models           # Models فقط
npm run test:unit:services         # Services فقط
npm run test:unit:middleware       # Middleware فقط
```

### Integration Tests:
```bash
npm run test:integration           # جميع integration tests
npm run test:integration:api       # API tests فقط
```

### E2E Tests:
```bash
npm run test:e2e
```

### Test Coverage:
```bash
npm run test:coverage
```

### Watch Mode:
```bash
npm run test:watch
```

---

## 📝 كتابة اختبار جديد

### 1. Unit Test Example:

```javascript
// test/unit/models/car.test.js
const { expect } = require('chai');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createCarData } = require('../../helpers/factories');
const Car = require('../../../models/Car');

describe('Car Model', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    it('should create a car successfully', async () => {
        const carData = createCarData();
        const car = await Car.create(carData);
        
        expect(car).to.have.property('_id');
        expect(car.make).to.equal(carData.make);
    });
});
```

### 2. API Test Example:

```javascript
// test/integration/api/cars.api.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../../server');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { generateAdminToken } = require('../../helpers/auth');

describe('Cars API', () => {
    let adminToken;

    before(async () => {
        await setupTestDB();
        adminToken = generateAdminToken('test-admin-id');
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('GET /api/v2/cars', () => {
        it('should return list of cars', async () => {
            const res = await request(app)
                .get('/api/v2/cars')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.be.an('array');
        });
    });
});
```

### 3. E2E Test Example:

```javascript
// test/e2e/auth.e2e.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../server');
const { setupTestDB, clearDatabase, closeDatabase } = require('../helpers/setup');
const { createUserData } = require('../helpers/factories');

describe('Authentication Flow (E2E)', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    it('should complete full auth flow', async () => {
        const userData = createUserData();

        // 1. Register
        const registerRes = await request(app)
            .post('/api/v2/auth/register')
            .send(userData)
            .expect(201);

        expect(registerRes.body).to.have.property('success', true);

        // 2. Login
        const loginRes = await request(app)
            .post('/api/v2/auth/login')
            .send({
                email: userData.email,
                password: userData.password,
            })
            .expect(200);

        expect(loginRes.body).to.have.property('token');
        const token = loginRes.body.token;

        // 3. Verify
        const verifyRes = await request(app)
            .get('/api/v2/auth/verify')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(verifyRes.body.data.email).to.equal(userData.email);
    });
});
```

---

## 🛠️ Test Helpers

### Setup Helper:
```javascript
const { setupTestDB, clearDatabase, closeDatabase } = require('./helpers/setup');

// إعداد قاعدة بيانات اختبار
await setupTestDB();

// مسح البيانات
await clearDatabase();

// إغلاق الاتصال
await closeDatabase();
```

### Factories:
```javascript
const { 
    createUserData,
    createAdminData,
    createCarData,
    createAuctionData,
    createPartData,
} = require('./helpers/factories');

// إنشاء بيانات اختبار
const user = createUserData({ name: 'Custom Name' });
const car = createCarData({ price: 30000 });
```

### Auth Helper:
```javascript
const { 
    generateToken,
    generateAdminToken,
    createAuthHeader,
} = require('./helpers/auth');

// إنشاء token
const token = generateToken(userId);
const adminToken = generateAdminToken(adminId);

// إنشاء header
const headers = createAuthHeader(token);
```

---

## 📊 Test Coverage

### الهدف:
- Models: 85%+
- Services: 70%+
- Middleware: 65%+
- API Routes: 75%+
- Utils: 80%+
- **الإجمالي: 70%+**

### عرض Coverage:
```bash
npm run test:coverage
```

سيتم إنشاء تقرير في `coverage/index.html`

---

## ✅ Best Practices

### 1. تسمية الاختبارات:
- استخدم أسماء واضحة ووصفية
- ابدأ بـ `should` للوضوح
- مثال: `should create a car successfully`

### 2. تنظيم الاختبارات:
- استخدم `describe` للتجميع
- استخدم `before/after` للإعداد والتنظيف
- اختبار واحد لكل `it`

### 3. البيانات:
- استخدم Factories لإنشاء بيانات متسقة
- استخدم Fixtures للبيانات الثابتة
- نظف البيانات بعد كل اختبار

### 4. Assertions:
- استخدم Chai assertions
- كن محدداً في التوقعات
- اختبر الحالات الإيجابية والسلبية

### 5. Async/Await:
- استخدم async/await بدلاً من callbacks
- تعامل مع الأخطاء بشكل صحيح
- استخدم try/catch عند الحاجة

---

## 🐛 Debugging

### تشغيل اختبار واحد:
```bash
mocha test/unit/models/car.test.js
```

### إضافة console.log:
```javascript
it('should do something', async () => {
    console.log('Debug info:', someVariable);
    // ... test code
});
```

### استخدام debugger:
```bash
node --inspect-brk node_modules/.bin/mocha test/unit/models/car.test.js
```

---

## 📚 المراجع

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertions](https://www.chaijs.com/)
- [Supertest](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

**آخر تحديث:** 31 مارس 2026  
**Test Coverage:** 40% → 70% (هدف)
