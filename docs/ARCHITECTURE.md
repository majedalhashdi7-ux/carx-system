# معمارية النظام - HM CAR

**System Architecture Documentation**

---

## 📐 نظرة عامة

HM CAR مبني على معمارية Multi-Tier مع فصل كامل بين Frontend و Backend، ويدعم Multi-Tenancy على مستوى قاعدة البيانات.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Web Browser │  │ Mobile App   │  │  Admin Panel │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Frontend Layer (Next.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  client-app  │  │ carx-system  │  │  Other Tenants│ │
│  │  (Main App)  │  │  (Tenant 1)  │  │               │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼ REST API / WebSocket
┌─────────────────────────────────────────────────────────┐
│              Backend Layer (Node.js/Express)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API Gateway (Express)                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │   Auth     │  │   Cars     │  │  Auctions  │ │   │
│  │  │ Middleware │  │   Routes   │  │   Routes   │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Tenant Middleware Layer                 │   │
│  │  (Resolves tenant & connects to correct DB)      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Business Logic Layer                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │  Services  │  │   Models   │  │   Utils    │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  MongoDB     │  │    Redis     │  │  File Storage│  │
│  │  (Per Tenant)│  │   (Cache)    │  │  (Cloudinary)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Multi-Tenant Architecture

### Tenant Isolation Strategy:

**Database Per Tenant:**
```
Tenant A → MongoDB Database A
Tenant B → MongoDB Database B
Tenant C → MongoDB Database C
```

### Tenant Resolution Flow:

```
1. Request arrives → Extract tenant identifier
   ├─ From subdomain (tenant.hmcar.com)
   ├─ From custom domain (carx.com)
   └─ From header (X-Tenant-ID)

2. Tenant Middleware → Resolve tenant
   ├─ Load tenant config from tenants.json
   ├─ Validate tenant exists
   └─ Check tenant status (active/suspended)

3. Database Connection → Connect to tenant DB
   ├─ Get connection string from tenant config
   ├─ Create/reuse connection
   └─ Attach connection to request

4. Request Processing → Use tenant-specific data
   ├─ All queries use tenant connection
   ├─ Models scoped to tenant
   └─ Data isolation guaranteed

5. Response → Return tenant-specific data
```

### Tenant Configuration:

```json
{
  "tenants": [
    {
      "id": "hmcar",
      "name": "HM CAR",
      "domain": "hmcar.com",
      "subdomain": "hmcar",
      "database": {
        "uri": "mongodb://...",
        "name": "hmcar_db"
      },
      "features": {
        "auctions": true,
        "store": true,
        "showroom": true
      },
      "theme": {
        "primaryColor": "#1a73e8",
        "logo": "/logos/hmcar.png"
      }
    }
  ]
}
```

---

## 🔄 Request Flow

### 1. Authentication Flow:

```
Client Request
    │
    ▼
┌─────────────────┐
│ Tenant Middleware│ → Resolve tenant
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Auth Middleware │ → Verify JWT token
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Rate Limiter    │ → Check rate limits
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Route Handler   │ → Process request
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Service Layer   │ → Business logic
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Model Layer     │ → Database operations
└─────────────────┘
    │
    ▼
Response to Client
```

### 2. Auction Bidding Flow:

```
User places bid
    │
    ▼
┌─────────────────┐
│ Validate bid    │ → Check amount, auction status
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Update auction  │ → Save new bid to DB
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Emit Socket.io  │ → Notify all connected clients
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Send notification│ → Email/Push to outbid users
└─────────────────┘
```

---

## 💾 Database Design

### Collections Structure:

```
users
├─ _id
├─ name
├─ email (unique)
├─ password (hashed)
├─ role (buyer/seller/admin)
└─ tenant_id (implicit via connection)

cars
├─ _id
├─ title
├─ make
├─ model
├─ year
├─ price
├─ images[]
├─ status (available/sold/auction)
└─ listingType (store/auction/showroom)

auctions
├─ _id
├─ car (ref: cars)
├─ startingPrice
├─ currentPrice
├─ bids[]
│   ├─ user (ref: users)
│   ├─ amount
│   └─ timestamp
├─ startsAt
├─ endsAt
└─ status (scheduled/running/ended)

orders
├─ _id
├─ buyer (ref: users)
├─ items[]
│   ├─ itemType (car/part)
│   ├─ refId
│   ├─ quantity
│   └─ price
├─ totalAmount
├─ status (pending/paid/shipped/completed)
└─ orderNumber (unique)

spare_parts
├─ _id
├─ name
├─ partNumber
├─ price
├─ stockQty
├─ compatibleCars[]
└─ images[]
```

### Indexes:

```javascript
// Users
users.createIndex({ email: 1 }, { unique: true })
users.createIndex({ role: 1 })

// Cars
cars.createIndex({ make: 1, model: 1 })
cars.createIndex({ price: 1 })
cars.createIndex({ status: 1 })

// Auctions
auctions.createIndex({ status: 1 })
auctions.createIndex({ endsAt: 1 })

// Orders
orders.createIndex({ buyer: 1 })
orders.createIndex({ orderNumber: 1 }, { unique: true })
```

---

## 🔐 Security Architecture

### Authentication:

```
1. User Login
   ├─ Validate credentials
   ├─ Hash password comparison (bcrypt)
   └─ Generate JWT token

2. JWT Token Structure:
   {
     userId: "...",
     role: "buyer",
     tenant: "hmcar",
     iat: 1234567890,
     exp: 1234567890
   }

3. Token Verification:
   ├─ Extract from Authorization header
   ├─ Verify signature
   ├─ Check expiration
   └─ Attach user to request
```

### Authorization:

```
Role-Based Access Control (RBAC):

Roles:
├─ buyer      → Can browse, bid, purchase
├─ seller     → Can list cars, manage listings
├─ admin      → Full access to tenant
└─ super_admin → Full system access

Permissions checked via middleware:
- requireAuth()
- requireRole(['admin'])
- requirePermission('cars:create')
```

### Rate Limiting:

```
General:     100 requests / 15 minutes
Auth:        5 requests / 15 minutes
Public:      200 requests / 15 minutes
Search:      50 requests / 15 minutes
Upload:      10 requests / 15 minutes
```

---

## ⚡ Performance Optimization

### Caching Strategy:

```
Redis Cache Layers:

1. API Response Cache
   ├─ GET /api/v2/cars → Cache 5 minutes
   ├─ GET /api/v2/parts → Cache 10 minutes
   └─ GET /api/v2/auctions → Cache 1 minute

2. Database Query Cache
   ├─ Frequently accessed data
   └─ Computed aggregations

3. Session Cache
   └─ User sessions and tokens
```

### Database Optimization:

```
1. Indexes on frequently queried fields
2. Pagination for large datasets
3. Projection to limit returned fields
4. Aggregation pipelines for complex queries
```

---

## 🔄 Real-time Features

### Socket.io Architecture:

```
Client connects → Socket.io server
    │
    ▼
Join tenant room → socket.join(`tenant:${tenantId}`)
    │
    ▼
Subscribe to events:
├─ auction:bid → New bid placed
├─ auction:end → Auction ended
├─ notification → New notification
└─ chat:message → Chat message

Emit events:
└─ io.to(`tenant:${tenantId}`).emit('event', data)
```

---

## 📦 Deployment Architecture

### Vercel Deployment:

```
Frontend (Next.js):
├─ Static pages → CDN
├─ API routes → Serverless functions
└─ ISR pages → Regenerated on-demand

Backend (Express):
└─ Serverless function (vercel-server.js)
    ├─ Single entry point
    ├─ Handles all API routes
    └─ Stateless (no sessions)
```

### Environment Separation:

```
Development:
├─ Local MongoDB
├─ Local Redis (optional)
└─ Hot reload enabled

Production:
├─ MongoDB Atlas
├─ Redis Cloud
└─ Vercel CDN
```

---

## 🔧 Scalability Considerations

### Horizontal Scaling:

```
1. Stateless Backend
   └─ No server-side sessions
   └─ JWT for authentication

2. Database Sharding
   └─ Tenant-based sharding
   └─ Each tenant = separate DB

3. CDN for Static Assets
   └─ Images on Cloudinary
   └─ Static files on Vercel CDN

4. Load Balancing
   └─ Vercel handles automatically
```

### Vertical Scaling:

```
1. Database Optimization
   ├─ Indexes
   ├─ Query optimization
   └─ Connection pooling

2. Caching
   ├─ Redis for hot data
   └─ In-memory cache fallback

3. Code Optimization
   ├─ Lazy loading
   └─ Code splitting
```

---

## 📊 Monitoring & Logging

### Logging Strategy:

```
Winston Logger:
├─ Error logs → errors.log
├─ Combined logs → combined.log
└─ Console logs → Development only

Log Levels:
├─ error → Critical errors
├─ warn → Warnings
├─ info → General info
└─ debug → Debug info
```

### Monitoring:

```
Metrics to track:
├─ API response times
├─ Database query times
├─ Error rates
├─ Active users
└─ Auction activity
```

---

**Last Updated:** March 31, 2026  
**Version:** 2.0
