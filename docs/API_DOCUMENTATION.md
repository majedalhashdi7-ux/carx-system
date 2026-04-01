# API Documentation - HM CAR

**Complete API Reference**

Base URL: `https://api.hmcar.com/api/v2`

---

## 🔐 Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### POST /auth/register
Register new user

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+966501234567",
  "role": "buyer"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

### POST /auth/login
Login user

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

### GET /auth/verify
Verify JWT token

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

---

## 🚗 Cars

### GET /cars
Get list of cars

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `make` (string): Filter by make
- `model` (string): Filter by model
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `year` (number): Filter by year
- `status` (string): available | sold | auction
- `search` (string): Search in title/description
- `sortBy` (string): price | year | createdAt
- `order` (string): asc | desc

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Toyota Camry 2023",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "price": 25000,
      "mileage": 15000,
      "condition": "excellent",
      "images": ["https://..."],
      "status": "available",
      "listingType": "store"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

### GET /cars/:id
Get car details

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Toyota Camry 2023",
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "price": 25000,
    "mileage": 15000,
    "condition": "excellent",
    "description": "Excellent condition...",
    "images": ["https://..."],
    "features": ["ABS", "Airbags"],
    "status": "available",
    "listingType": "store",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /cars
Create new car (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**
```json
{
  "title": "Toyota Camry 2023",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "price": 25000,
  "mileage": 15000,
  "condition": "excellent",
  "description": "Excellent condition...",
  "images": ["https://..."],
  "features": ["ABS", "Airbags"],
  "listingType": "store"
}
```

**Response:** `201 Created`

### PUT /cars/:id
Update car (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Request:** (partial update)
```json
{
  "price": 24000,
  "status": "sold"
}
```

**Response:** `200 OK`

### DELETE /cars/:id
Delete car (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`

---

## 🏆 Auctions

### GET /auctions
Get list of auctions

**Query Parameters:**
- `status` (string): scheduled | running | ended
- `page`, `limit`, `sortBy`, `order`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "car": {
        "_id": "...",
        "title": "Toyota Camry 2023",
        "images": ["https://..."]
      },
      "startingPrice": 20000,
      "currentPrice": 23000,
      "bids": [
        {
          "user": "...",
          "amount": 23000,
          "timestamp": "2024-01-01T12:00:00.000Z"
        }
      ],
      "startsAt": "2024-01-01T00:00:00.000Z",
      "endsAt": "2024-01-08T00:00:00.000Z",
      "status": "running"
    }
  ]
}
```

### GET /auctions/:id
Get auction details

**Response:** `200 OK`

### POST /auctions/:id/bid
Place bid on auction

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "amount": 24000
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Bid placed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "currentPrice": 24000,
    "bids": [...]
  }
}
```

**Errors:**
- `400` - Bid amount too low
- `400` - Auction not active
- `401` - Not authenticated
- `404` - Auction not found

### GET /auctions/:id/bids
Get auction bid history

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "_id": "...",
        "name": "John Doe"
      },
      "amount": 24000,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## 🛒 Spare Parts

### GET /parts
Get list of spare parts

**Query Parameters:**
- `partType` (string): engine | brake | suspension | etc
- `search` (string): Search in name/description
- `minPrice`, `maxPrice`
- `inStock` (boolean): true | false

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Brake Pad Set",
      "partNumber": "BP-12345",
      "partType": "brake",
      "price": 150,
      "stockQty": 25,
      "compatibleCars": [
        {
          "make": "Toyota",
          "model": "Camry",
          "years": [2020, 2021, 2022, 2023]
        }
      ],
      "images": ["https://..."]
    }
  ]
}
```

### GET /parts/:id
Get part details

**Response:** `200 OK`

---

## 📦 Orders

### GET /orders
Get user orders

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "HM-2026-000001",
      "buyer": "...",
      "items": [
        {
          "itemType": "part",
          "refId": "...",
          "titleSnapshot": "Brake Pad Set",
          "quantity": 2,
          "price": 150
        }
      ],
      "totalAmount": 300,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /orders
Create new order

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "items": [
    {
      "itemType": "part",
      "refId": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Riyadh",
    "country": "Saudi Arabia",
    "postalCode": "12345"
  }
}
```

**Response:** `201 Created`

### GET /orders/:id
Get order details

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## ❤️ Favorites

### GET /favorites
Get user favorites

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "car": {
        "_id": "...",
        "title": "Toyota Camry 2023",
        "price": 25000,
        "images": ["https://..."]
      },
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /favorites
Add to favorites

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "carId": "507f1f77bcf86cd799439011"
}
```

**Response:** `201 Created`

### DELETE /favorites/:id
Remove from favorites

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## 🔔 Notifications

### GET /notifications
Get user notifications

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "auction_outbid",
      "title": "You've been outbid!",
      "message": "Someone placed a higher bid on Toyota Camry 2023",
      "read": false,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### PUT /notifications/:id/read
Mark notification as read

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## 📊 Error Responses

### Standard Error Format:
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Common Error Codes:
- `INVALID_CREDENTIALS` - Wrong email/password
- `TOKEN_EXPIRED` - JWT token expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `VALIDATION_ERROR` - Input validation failed
- `DUPLICATE_ENTRY` - Unique constraint violation

---

## 🔄 Rate Limiting

Rate limits per IP address:

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests / 15 min |
| Authentication | 5 requests / 15 min |
| Public endpoints | 200 requests / 15 min |
| Search | 50 requests / 15 min |
| File upload | 10 requests / 15 min |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## 🌐 Internationalization

Set language via header:
```
Accept-Language: ar
Accept-Language: en
```

Supported languages:
- `ar` - Arabic
- `en` - English

---

**Last Updated:** March 31, 2026  
**API Version:** 2.0
