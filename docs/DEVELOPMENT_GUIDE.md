# دليل التطوير - HM CAR

**Development Guide**

---

## 🚀 البدء السريع

### المتطلبات الأساسية:

```bash
Node.js: 22.x or higher
MongoDB: 6.x or higher
Redis: 7.x (optional but recommended)
Git: Latest version
```

### التثبيت:

```bash
# 1. Clone repository
git clone <repository-url>
cd car-auction

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Edit .env file
nano .env  # or use your preferred editor

# 5. Start MongoDB (if local)
mongod

# 6. Start Redis (optional)
redis-server

# 7. Run development server
npm run dev
```

### الوصول للتطبيق:

```
Backend API:  http://localhost:5000
Frontend:     http://localhost:3000
Admin Panel:  http://localhost:3000/admin
```

---

## 📁 هيكل المشروع

```
car-auction/
├── modules/                 # Backend core
│   ├── app.js              # Express app setup
│   ├── core/               # Core functionality
│   │   ├── config.js       # Configuration
│   │   ├── database.js     # Database connection
│   │   └── logger.js       # Winston logger
│   └── socket.js           # Socket.io setup
│
├── routes/                 # API routes
│   └── api/v2/            # API version 2
│       ├── index.js       # Main router
│       ├── auth.js        # Auth routes
│       ├── cars.js        # Cars routes
│       ├── auctions.js    # Auctions routes
│       └── ...
│
├── models/                # MongoDB models
│   ├── User.js
│   ├── Car.js
│   ├── Auction.js
│   └── ...
│
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication
│   ├── rateLimiter.js    # Rate limiting
│   └── tenantMiddleware.js # Multi-tenant
│
├── services/             # Business logic
│   ├── AuthService.js
│   ├── EmailService.js
│   └── ...
│
├── utils/                # Utility functions
│   ├── validators.js
│   ├── encryption.js
│   └── ...
│
├── client-app/           # Next.js frontend
│   ├── src/
│   │   ├── app/         # App router
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   └── public/          # Static files
│
├── test/                # Test suite
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # E2E tests
│
└── scripts/            # Utility scripts
    ├── setup/
    ├── database/
    └── ...
```

---

## ⚙️ Configuration

### Environment Variables:

```bash
# Server
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/hmcar
MONGODB_URI_TEST=mongodb://localhost:27017/hmcar_test

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v2
```

---

## 🔧 Development Workflow

### 1. Create Feature Branch:

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes:

```bash
# Edit files
# Add tests
# Update documentation
```

### 3. Run Tests:

```bash
# Run all tests
npm test

# Run specific tests
npm run test:unit
npm run test:integration

# Watch mode
npm run test:watch
```

### 4. Check Code Quality:

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### 5. Commit Changes:

```bash
git add .
git commit -m "feat: add new feature"
```

**Commit Message Format:**
```
type(scope): subject

feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: adding tests
chore: maintenance
```

### 6. Push & Create PR:

```bash
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

---

## 🧪 Testing

### Running Tests:

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests:

**Unit Test Example:**
```javascript
// test/unit/models/car.test.js
const { expect } = require('chai');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
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

    it('should create a car', async () => {
        const car = await Car.create({
            title: 'Test Car',
            make: 'Toyota',
            model: 'Camry',
            year: 2023,
            price: 25000
        });

        expect(car).to.have.property('_id');
        expect(car.make).to.equal('Toyota');
    });
});
```

**Integration Test Example:**
```javascript
// test/integration/api/cars.api.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../../modules/app');

describe('Cars API', () => {
    it('should get list of cars', async () => {
        const res = await request(app)
            .get('/api/v2/cars')
            .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data).to.be.an('array');
    });
});
```

---

## 🗄️ Database

### MongoDB Setup:

```bash
# Start MongoDB
mongod

# Connect to MongoDB
mongosh

# Create database
use hmcar

# Create user
db.createUser({
  user: "hmcar_user",
  pwd: "password",
  roles: ["readWrite"]
})
```

### Seeding Data:

```bash
# Seed all data
npm run seed

# Seed specific data
npm run seed:users
npm run seed:cars
npm run seed:auctions
```

### Database Migrations:

```bash
# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:rollback
```

---

## 🎨 Frontend Development

### Client-App (Main Frontend):

```bash
cd client-app

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Component Structure:

```
src/
├── app/                    # App router pages
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   └── [route]/           # Dynamic routes
│
├── components/            # React components
│   ├── Navbar.tsx
│   ├── CarCard.tsx
│   └── ...
│
└── lib/                   # Utilities
    ├── api.ts            # API client
    ├── utils.ts          # Helper functions
    └── contexts/         # React contexts
```

### Creating New Component:

```typescript
// src/components/MyComponent.tsx
'use client';

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);

  return (
    <div className="p-4">
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

---

## 🔌 API Development

### Creating New Endpoint:

**1. Create Route:**
```javascript
// routes/api/v2/myroute.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../../middleware/auth');

router.get('/', async (req, res) => {
    try {
        // Your logic here
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/', requireAuth, async (req, res) => {
    // Protected route
});

module.exports = router;
```

**2. Register Route:**
```javascript
// routes/api/v2/index.js
const myRoute = require('./myroute');
router.use('/myroute', myRoute);
```

**3. Add Tests:**
```javascript
// test/integration/api/myroute.api.test.js
describe('My Route API', () => {
    it('should work', async () => {
        const res = await request(app)
            .get('/api/v2/myroute')
            .expect(200);
    });
});
```

---

## 🐛 Debugging

### Backend Debugging:

```bash
# Enable debug logs
DEBUG=* npm run dev

# Node.js inspector
node --inspect server.js

# VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server.js"
}
```

### Frontend Debugging:

```bash
# Next.js debug mode
NODE_OPTIONS='--inspect' npm run dev

# React DevTools
# Install browser extension
```

### Database Debugging:

```bash
# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Query profiling
db.setProfilingLevel(2)
db.system.profile.find().pretty()
```

---

## 📦 Dependencies

### Adding New Dependency:

```bash
# Production dependency
npm install package-name

# Development dependency
npm install -D package-name

# Update package.json
npm install
```

### Updating Dependencies:

```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm update package-name
```

---

## 🔒 Security Best Practices

### 1. Environment Variables:
- Never commit `.env` files
- Use `.env.example` as template
- Rotate secrets regularly

### 2. Input Validation:
```javascript
const { sanitizeInput, isValidEmail } = require('../utils/validators');

// Sanitize all user input
const cleanInput = sanitizeInput(req.body.input);

// Validate email
if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
}
```

### 3. Authentication:
```javascript
// Always use middleware for protected routes
router.post('/protected', requireAuth, handler);

// Check permissions
router.delete('/admin', requireRole(['admin']), handler);
```

### 4. Rate Limiting:
```javascript
// Apply rate limiting to sensitive endpoints
const { authLimiter } = require('../middleware/rateLimiter');
router.post('/login', authLimiter, loginHandler);
```

---

## 🚀 Performance Tips

### 1. Database Queries:
```javascript
// Use projection to limit fields
const cars = await Car.find({}, 'title make model price');

// Use indexes
Car.createIndex({ make: 1, model: 1 });

// Use pagination
const cars = await Car.find()
    .skip((page - 1) * limit)
    .limit(limit);
```

### 2. Caching:
```javascript
// Cache frequently accessed data
const cachedData = await redis.get(key);
if (cachedData) {
    return JSON.parse(cachedData);
}

const data = await fetchData();
await redis.setex(key, 300, JSON.stringify(data));
```

### 3. Frontend Optimization:
```typescript
// Use dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'));

// Memoize expensive computations
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// Lazy load images
<Image src="..." loading="lazy" />
```

---

## 📝 Code Style

### JavaScript/TypeScript:
- Use ES6+ features
- Prefer `const` over `let`
- Use arrow functions
- Use async/await over promises
- Add JSDoc comments for functions

### React:
- Use functional components
- Use hooks
- Keep components small and focused
- Extract reusable logic to custom hooks

### Naming Conventions:
- Files: `camelCase.js` or `PascalCase.tsx`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Components: `PascalCase`
- Functions: `camelCase`

---

## 🆘 Getting Help

### Resources:
- 📖 [Documentation](../docs/)
- 🐛 [Issue Tracker](https://github.com/hmcar/issues)
- 💬 [Discord Community](https://discord.gg/hmcar)
- 📧 [Email Support](mailto:dev@hmcar.com)

### Common Issues:
See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Last Updated:** March 31, 2026
