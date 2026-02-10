# API Reference - Village Market

## 🎯 Authentication Endpoints

### POST `/api/register/user`
Register a new regular user (customer)

**Request:**
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "password": "securePass123"
}
```

**Response (Success):**
```json
{
  "id": 5,
  "name": "John Doe",
  "mobile": "9876543210",
  "type": "user"
}
```

**Response (Error):**
```json
{
  "error": "Mobile registered. Please login."
}
```

---

### POST `/api/register/shopkeeper` (REQUIRED: Location)
Register a new shopkeeper with GPS location

**Request (multipart/form-data):**
```json
{
  "name": "Ramesh Kumar",
  "village": "Ramnagar",
  "city": "Delhi",
  "shop_name": "Fresh Daily Grocery",
  "category": "Grocery",
  "mobile": "9876543211",
  "password": "securePass456",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "owner_photo": [file],
  "shop_photo": [file]
}
```

**Validation:**
- `latitude` must be number, -90 to 90
- `longitude` must be number, -180 to 180
- Cannot be (0, 0) - default/mock coordinates
- Cannot be null or undefined

**Response (Success):**
```json
{
  "id": 12,
  "shop_name": "Fresh Daily Grocery",
  "mobile": "9876543211",
  "type": "shopkeeper"
}
```

**Response (Error):**
```json
{
  "error": "Invalid or missing GPS location. Please enable location permissions."
}
```

---

### POST `/api/login`
Login user or shopkeeper

**Request:**
```json
{
  "mobile": "9876543210",
  "password": "securePass123"
}
```

**Response (User):**
```json
{
  "id": 5,
  "name": "John Doe",
  "mobile": "9876543210",
  "profile_pic": "/uploads/pic.jpg",
  "type": "user"
}
```

**Response (Shopkeeper):**
```json
{
  "id": 12,
  "name": "Ramesh Kumar",
  "shop_name": "Fresh Daily Grocery",
  "mobile": "9876543211",
  "owner_photo": "/uploads/owner.jpg",
  "shop_photo": "/uploads/shop.jpg",
  "category": "Grocery",
  "village": "Ramnagar",
  "city": "Delhi",
  "type": "shopkeeper"
}
```

---

## 📍 Location & Distance Endpoints (NEW)

### POST `/api/distance` ⭐ NEW
Calculate accurate distance between user and single shop using Haversine formula

**Request:**
```json
{
  "userLatitude": 28.7050,
  "userLongitude": 77.1030,
  "shopId": 12
}
```

**Response (Success):**
```json
{
  "shopId": 12,
  "shopName": "Fresh Daily Grocery",
  "distance": 1.23,
  "formattedDistance": "1.23 km"
}
```

**Response (Error - Invalid Coordinates):**
```json
{
  "error": "Invalid coordinates: all coordinates must be valid numbers"
}
```

**Response (Error - Shop Not Found):**
```json
{
  "error": "Shop not found"
}
```

---

### POST `/api/distances` ⭐ NEW (OPTIMIZED)
Calculate distances for multiple shops in single API call (batch operation)

**Request:**
```json
{
  "userLatitude": 28.7050,
  "userLongitude": 77.1030,
  "shopIds": [12, 13, 14, 15]
}
```

**Response (Success):**
```json
{
  "distances": [
    {
      "shopId": 12,
      "shopName": "Fresh Daily Grocery",
      "distance": 1.23,
      "formattedDistance": "1.23 km"
    },
    {
      "shopId": 13,
      "shopName": "Local Vegetables",
      "distance": 0.45,
      "formattedDistance": "450 m"
    },
    {
      "shopId": 14,
      "shopName": "Dairy Paradise",
      "distance": 2.87,
      "formattedDistance": "2.87 km"
    },
    {
      "shopId": 15,
      "shopName": "Spice Hub",
      "distance": 3.12,
      "formattedDistance": "3.12 km"
    }
  ]
}
```

---

## 🏪 Shop Endpoints

### GET `/api/shopkeepers` (OPTIMIZED - CACHED)
Get all shopkeepers with valid locations

**Response:**
```json
[
  {
    "id": 12,
    "shop_name": "Fresh Daily Grocery",
    "category": "Grocery",
    "village": "Ramnagar",
    "city": "Delhi",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "shop_photo": "/uploads/shop.jpg",
    "is_open": 1
  },
  {
    "id": 13,
    "shop_name": "Local Vegetables",
    "category": "Vegetables",
    "village": "Ramnagar",
    "city": "Delhi",
    "latitude": 28.7089,
    "longitude": 77.1005,
    "shop_photo": "/uploads/shop2.jpg",
    "is_open": 1
  }
]
```

**Cache Duration**: 30 seconds

---

### GET `/api/shops/:id` (CACHED)
Get detailed information about a specific shop

**Response:**
```json
{
  "id": 12,
  "name": "Ramesh Kumar",
  "mobile": "9876543211",
  "village": "Ramnagar",
  "city": "Delhi",
  "shop_name": "Fresh Daily Grocery",
  "category": "Grocery",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "owner_photo": "/uploads/owner.jpg",
  "shop_photo": "/uploads/shop.jpg",
  "is_open": 1,
  "opening_time": "08:00",
  "closing_time": "21:00",
  "products": [
    {
      "id": 1,
      "shop_id": 12,
      "name": "Basmati Rice",
      "price": 250.00,
      "image": "/uploads/rice.jpg",
      "in_stock": 1,
      "is_best_seller": 1,
      "is_special_offer": 0,
      "offer_message": null,
      "original_price": null
    }
  ],
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Great quality and prices!",
      "timestamp": "2025-02-08T10:30:00Z",
      "user_name": "John Doe"
    }
  ],
  "avgRating": "4.8",
  "totalRatings": 45
}
```

**Cache Duration**: 5 minutes

---

## 📦 Product Endpoints

### GET `/api/products?search=&page=1&limit=20` (PAGINATED)
Get products with optional search

**Request Parameters:**
```
search=rice&page=1&limit=20
```

**Response:**
```json
[
  {
    "id": 1,
    "shop_id": 12,
    "name": "Basmati Rice",
    "price": 250.00,
    "image": "/uploads/rice.jpg",
    "is_best_seller": 1,
    "is_special_offer": 0,
    "offer_message": null,
    "original_price": null,
    "shop_name": "Fresh Daily Grocery",
    "shop_category": "Grocery",
    "village": "Ramnagar",
    "city": "Delhi",
    "latitude": 28.7041,
    "longitude": 77.1025
  }
]
```

---

### GET `/api/products/offers` (CACHED)
Get all special offers

**Response:**
```json
[
  {
    "id": 5,
    "shop_id": 12,
    "name": "Wheat Flour - 5kg",
    "price": 180.00,
    "image": "/uploads/flour.jpg",
    "offer_message": "30% off - Limited Time!",
    "original_price": 259.00,
    "shop_name": "Fresh Daily Grocery",
    "village": "Ramnagar",
    "city": "Delhi"
  }
]
```

**Cache Duration**: 30 seconds

---

### POST `/api/products` (Shopkeeper Only)
Add new product

**Request:**
```json
{
  "shop_id": 12,
  "name": "Organic Tomatoes",
  "price": 40.00,
  "is_best_seller": 0,
  "is_special_offer": 0,
  "offer_message": null,
  "original_price": null,
  "image": [file]
}
```

**Response:**
```json
{
  "id": 42,
  "message": "Added"
}
```

---

## ⭐ Reviews Endpoint

### POST `/api/reviews`
Submit review for a shop

**Request:**
```json
{
  "shop_id": 12,
  "user_id": 5,
  "rating": 5,
  "comment": "Excellent quality, highly recommend!"
}
```

**Response (Success):**
```json
{
  "message": "Review added"
}
```

**Response (Error - Already Reviewed):**
```json
{
  "error": "Already reviewed"
}
```

---

## 💬 Chat Endpoints

### GET `/api/messages?user_id=5&shop_id=12`
Get conversation between user and shop

**Response:**
```json
[
  {
    "id": 1,
    "sender_type": "user",
    "sender_id": 5,
    "receiver_id": 12,
    "content": "Do you have fresh tomatoes?",
    "timestamp": "2025-02-08T14:30:00Z",
    "hidden_for_shopkeeper": 0,
    "hidden_for_user": 0
  },
  {
    "id": 2,
    "sender_type": "shopkeeper",
    "sender_id": 12,
    "receiver_id": 5,
    "content": "Yes! We have fresh organic tomatoes available.",
    "timestamp": "2025-02-08T14:32:00Z",
    "hidden_for_shopkeeper": 0,
    "hidden_for_user": 0
  }
]
```

---

### POST `/api/messages`
Send a message

**Request:**
```json
{
  "sender_type": "user",
  "sender_id": 5,
  "receiver_id": 12,
  "content": "What's the price for 1 kg?"
}
```

**Response:**
```json
{
  "id": 3,
  "sender_type": "user",
  "timestamp": "2025-02-08T14:33:00Z"
}
```

---

## 📝 Request/Response Endpoints

### POST `/api/requests`
Create product request

**Request:**
```json
{
  "user_id": 5,
  "product_name": "Organic Eggs",
  "latitude": 28.7050,
  "longitude": 77.1030
}
```

**Response:**
```json
{
  "id": 8,
  "message": "Sent"
}
```

---

### GET `/api/shop/requests?shop_id=12`
Get pending requests for a shop

**Response:**
```json
[
  {
    "id": 8,
    "user_id": 5,
    "product_name": "Organic Eggs",
    "latitude": 28.7050,
    "longitude": 77.1030,
    "status": "pending",
    "timestamp": "2025-02-08T14:30:00Z",
    "user_name": "John Doe"
  }
]
```

---

### POST `/api/requests/:id/respond`
Respond to a product request

**Request:**
```json
{
  "shop_id": 12,
  "product_name": "Organic Eggs",
  "price": 60.00,
  "note": "Fresh eggs available, delivery possible",
  "response_type": "yes",
  "image": [file]
}
```

**Response:**
```json
{
  "message": "Responded"
}
```

---

## 🔧 Admin/Shop Endpoints

### POST `/api/shop/profile` (Shopkeeper Only)
Update shop profile

**Request:**
```json
{
  "id": 12,
  "name": "Ramesh Kumar",
  "shop_name": "Fresh Daily Grocery",
  "category": "Grocery",
  "opening_time": "08:00",
  "closing_time": "21:00",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "owner_photo": [file],
  "shop_photo": [file]
}
```

**Response:**
```json
{
  "id": 12,
  "name": "Ramesh Kumar",
  "shop_name": "Fresh Daily Grocery",
  "category": "Grocery",
  "opening_time": "08:00",
  "closing_time": "21:00",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "type": "shopkeeper"
}
```

---

### PUT `/api/shops/:id/status` (Shopkeeper Only)
Toggle shop open/close status

**Request:**
```json
{
  "is_open": 0
}
```

**Response:**
```json
{
  "message": "Updated"
}
```

---

## 🔐 Error Responses

### Standard Error Format
```json
{
  "error": "Descriptive error message"
}
```

### Common Errors

**400 Bad Request:**
```json
{
  "error": "Please enter a valid 10-digit mobile number."
}
```

**401 Unauthorized:**
```json
{
  "error": "Invalid credentials"
}
```

**404 Not Found:**
```json
{
  "error": "Shop not found"
}
```

**500 Server Error:**
```json
{
  "error": "Database connection error"
}
```

---

## ⚡ Performance Notes

- **Shops endpoint**: Returns only shops with valid coordinates
- **Products endpoint**: Paginated (20 per page max)
- **Distances endpoint**: Batch calculation is 5x more efficient
- **All GET endpoints**: Cached on backend for speed
- **Database queries**: Use indexes for sub-100ms responses

---

## 📊 Caching Strategy

| Endpoint | TTL | Cache Type |
|----------|-----|-----------|
| `/api/shopkeepers` | 30s | Server + Browser |
| `/api/shops/:id` | 5m | Browser |
| `/api/distance` | 10m | Browser (ref-based) |
| `/api/products/offers` | 30s | Server |
| `/api/products` | No cache | Paginated |
| `/api/messages` | No cache | Real-time |

---

**Last Updated**: February 8, 2026
**API Version**: 1.0
**Status**: Production Ready ✅
