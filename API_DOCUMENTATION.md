# Vaaya API - Flask Backend Documentation

## ✅ COMPLETED IMPLEMENTATION

### Overview
Complete Flask + MongoDB backend for Vaaya tourism platform with:
- JWT authentication
- Local verification via OTP
- Trip planning with crowd prediction (weather + holidays + seasonal factors)
- MongoDB storage
- Protected routes

---

## 📁 Project Structure

```
whackiest-25/
├── app.py                          # Main Flask application
├── config.py                       # Configuration
├── requirements.txt                # Dependencies
│
├── models/                         # MongoDB models
│   ├── user.py                     # User CRUD operations
│   ├── trip.py                     # Trip/itinerary management
│   ├── quest.py                    # Quest models
│   ├── chat.py                     # Chat messages
│   └── local_verification.py      # OTP verification
│
├── modules/                        # Business logic
│   ├── auth.py                     # ✓ Registration & login
│   ├── otp.py                      # ✓ Phone OTP verification
│   └── trips.py                    # ✓ Trip planning & crowd prediction
│
├── services/                       # External integrations
│   ├── gemini_service.py           # Google Gemini AI
│   ├── weather_service.py          # ✓ OpenWeather API
│   ├── holiday_service.py          # ✓ Holiday/events API
│   ├── sms_service.py              # ✓ Twilio OTP
│   └── firebase_service.py         # Push notifications
│
├── utils/                          # Utilities
│   ├── jwt_utils.py                # ✓ JWT generation & validation
│   └── crowd_predictor.py          # ✓ Crowd prediction algorithm
│
└── routes/                         # API endpoints
    ├── auth_routes.py              # ✓ Authentication endpoints
    ├── trip_routes.py              # ✓ Trip planning endpoints
    └── user_routes.py              # User profile endpoints
```

---

## 🔐 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "tourist",  // or "local"
  "name": "John Doe",
  "phone": "+1234567890"  // required for locals
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "tourist",
    "verified": true,
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requires_verification": false
}
```

### 2. Login
**POST** `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Request OTP (Locals Only)
**POST** `/auth/verify/request`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "phone": "+1234567890",
  "expires_at": "2024-01-15T10:30:00"
}
```

### 4. Verify OTP
**POST** `/auth/verify/confirm`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Phone verified successfully",
  "verified": true
}
```

---

## 🗺️ Trip Planning Endpoints

### 1. Create Trip with Crowd Prediction
**POST** `/trips/`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "destination": "Paris, France",
  "start_date": "2024-07-15",
  "end_date": "2024-07-20",
  "location": {
    "lat": 48.8566,
    "lng": 2.3522
  },
  "country_code": "FR",
  "preferences": {
    "budget": "medium",
    "interests": ["culture", "food"]
  }
}
```

**Response:**
```json
{
  "message": "Trip created successfully",
  "trip": {
    "_id": "507f1f77bcf86cd799439011",
    "user_id": "507f191e810c19729de860ea",
    "destination": "Paris, France",
    "start_date": "2024-07-15T00:00:00",
    "end_date": "2024-07-20T00:00:00",
    "crowd_predictions": [
      {
        "date": "2024-07-15",
        "crowd_score": 0.75,
        "crowd_level": "high",
        "weather_factor": 0.7,
        "holiday_factor": 0.8,
        "seasonal_factor": 0.9,
        "festival_factor": 0.2,
        "weather": {
          "date": "2024-07-15",
          "temp": {"min": 18, "max": 28, "avg": 23},
          "weather": "Clear",
          "description": "clear sky",
          "precipitation_probability": 5,
          "humidity": 60,
          "wind_speed": 12
        },
        "festivals": []
      }
    ],
    "itinerary": [],
    "status": "planning"
  }
}
```

### 2. Get User Trips
**GET** `/trips/`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "trips": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "destination": "Paris, France",
      "start_date": "2024-07-15T00:00:00",
      "status": "planning"
    }
  ],
  "count": 1
}
```

### 3. Get Specific Trip
**GET** `/trips/<trip_id>`

**Headers:** `Authorization: Bearer <token>`

**Response:** Same as create trip response

### 4. Predict Crowd for Date/Location
**POST** `/trips/predict`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "destination": "Tokyo",
  "date": "2024-08-01",
  "location": {
    "lat": 35.6762,
    "lng": 139.6503
  },
  "country_code": "JP"
}
```

**Response:**
```json
{
  "destination": "Tokyo",
  "date": "2024-08-01",
  "prediction": {
    "crowd_score": 0.85,
    "crowd_level": "very_high",
    "weather_factor": 0.8,
    "holiday_factor": 0.9,
    "seasonal_factor": 1.0,
    "festival_factor": 0.1,
    "weather": {...},
    "festivals": ["Tanabata Festival"]
  }
}
```

### 5. Update Trip Status
**PUT** `/trips/<trip_id>/status`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "confirmed"  // planning, confirmed, or completed
}
```

### 6. Add Activity to Itinerary
**POST** `/trips/<trip_id>/itinerary`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "day": 1,
  "activity": {
    "time": "09:00",
    "description": "Visit Eiffel Tower",
    "location": "Eiffel Tower",
    "duration": "2 hours"
  }
}
```

---

## 🧮 Crowd Prediction Algorithm

### Formula
```
crowd_score = (
    weather_factor × 0.25 +
    holiday_factor × 0.30 +
    seasonal_factor × 0.25 +
    festival_factor × 0.20
)
```

### Factors Explained

**1. Weather Factor (0-1)**
- Good weather (20-28°C, clear skies): Higher crowds
- Extreme temps or rain: Lower crowds
- Based on OpenWeather API forecasts

**2. Holiday Factor (0-1)**
- Public holidays: +0.3
- Weekends: +0.2
- Long weekends: +0.15 additional
- Summer months (June-Aug): +0.1

**3. Seasonal Factor (0-1)**
- Peak season (June-Aug): 0.9-1.0
- Shoulder season (Apr-May, Sep-Oct): 0.6-0.7
- Low season (Nov-Mar): 0.4-0.5
- Adjusted for destination (ski resorts, beaches, etc.)

**4. Festival Factor (0-1)**
- Major festivals: +0.4
- Regional events: +0.2-0.3
- Based on festival database

### Crowd Levels
- **0.0-0.2:** very_low
- **0.2-0.4:** low
- **0.4-0.6:** medium
- **0.6-0.8:** high
- **0.8-1.0:** very_high

---

## 🔒 Route Protection

All trip endpoints and profile endpoints require JWT authentication.

**Usage:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT Payload:**
```json
{
  "user_id": "507f191e810c19729de860ea",
  "role": "tourist",
  "exp": 1642345678,
  "iat": 1642259278
}
```

---

## 📦 MongoDB Collections

### users
```javascript
{
  _id: ObjectId,
  email: String,
  password_hash: Binary,
  role: "tourist" | "local",
  phone: String,
  name: String,
  verified: Boolean,
  created_at: Date,
  fcm_token: String,
  profile_image: String,
  bio: String,
  rating: Number,
  completed_quests: Number,
  location: {
    type: "Point",
    coordinates: [lng, lat]
  }
}
```

### trips
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  destination: String,
  start_date: Date,
  end_date: Date,
  preferences: Object,
  itinerary: Array,
  crowd_predictions: Object,
  created_at: Date,
  status: "planning" | "confirmed" | "completed"
}
```

### otp_verifications
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  phone: String,
  otp: String,
  created_at: Date,
  expires_at: Date,
  verified: Boolean,
  attempts: Number,
  max_attempts: Number
}
```

---

## 🌐 External API Integrations

### 1. OpenWeather API
- **Purpose:** 7-day weather forecasts
- **Endpoint:** `api.openweathermap.org/data/2.5/onecall`
- **Returns:** Temperature, weather conditions, precipitation

### 2. Holiday API
- **Purpose:** Public holidays by country
- **Endpoint:** `date.nager.at/api/v3/PublicHolidays`
- **Returns:** Holiday dates and names

### 3. Twilio SMS
- **Purpose:** Send OTP codes
- **Used for:** Local guide phone verification

---

## ⚙️ Environment Variables

```env
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/vaaya

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION_HOURS=24

# APIs
GEMINI_API_KEY=your-gemini-api-key
OPENWEATHER_API_KEY=your-openweather-key

# Twilio (OTP)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Push Notifications)
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# Flask
FLASK_SECRET_KEY=your-flask-secret
FLASK_DEBUG=True
```

---

## 🚀 Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables (create .env file)
# See .env.example

# Run server
python app.py
```

Server runs on `http://localhost:5000`

---

## ✅ Testing

```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Create trip (replace TOKEN)
curl -X POST http://localhost:5000/trips/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Paris",
    "start_date": "2024-07-15",
    "end_date": "2024-07-20",
    "location": {"lat": 48.8566, "lng": 2.3522},
    "country_code": "FR"
  }'
```

---

## 📊 Features Implemented

### ✅ User Authentication
- [x] JWT-based authentication
- [x] User registration (tourist/local)
- [x] Login with email/password
- [x] Password hashing with bcrypt
- [x] Protected routes with `@token_required` decorator

### ✅ Local Verification
- [x] Phone number validation (E.164 format)
- [x] OTP generation (6-digit codes)
- [x] OTP expiration (10 minutes)
- [x] SMS sending via Twilio
- [x] Verification attempt limits (3 max)
- [x] Account activation on verification

### ✅ Trip Planning
- [x] Create trips with date ranges
- [x] Store user preferences
- [x] Trip status management
- [x] Itinerary building

### ✅ Crowd Prediction
- [x] Multi-factor algorithm
- [x] Weather integration (OpenWeather API)
- [x] Holiday detection
- [x] Seasonal adjustments
- [x] Festival tracking
- [x] Day-by-day predictions
- [x] Crowd level classifications

### ✅ MongoDB Integration
- [x] User storage
- [x] Trip storage
- [x] OTP verification records
- [x] Geospatial indexing for locations
- [x] CRUD operations

---

## 🎯 Key Features

1. **Modular Architecture:** Clean separation of routes, business logic, models, and services
2. **Reusable Functions:** Each module has focused, reusable functions
3. **Type Safety:** Consistent JSON responses with proper status codes
4. **Security:** JWT tokens, password hashing, protected routes
5. **Scalability:** MongoDB for flexible schema, external services for specialized tasks
6. **Error Handling:** Try-catch blocks with meaningful error messages

---

## 📝 Notes

- Server uses `use_reloader=False` to prevent Windows socket errors
- MongoDB connection tested and confirmed working
- All routes return clean JSON responses
- JWT tokens expire after 24 hours (configurable)
- OTP codes expire after 10 minutes
- Crowd predictions calculated for each day of trip
- Weather forecasts support up to 7 days ahead

---

**Created:** December 6, 2025  
**Backend:** Flask 3.0.0 + MongoDB  
**APIs:** OpenWeather, Google Gemini, Twilio, Firebase
