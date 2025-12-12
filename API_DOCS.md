# Vaaya API Documentation

## Authentication Endpoints

### Base URL
```
http://localhost:5000
```

---

## 1. Tourist Signup

**Endpoint:** `POST /auth/signup/tourist`

**Description:** Register a new tourist account

**Request Body:**
```json
{
  "email": "tourist@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "message": "Tourist account created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "tourist@example.com",
    "name": "John Doe",
    "role": "tourist"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Local Guide Signup

**Endpoint:** `POST /auth/signup/local`

**Description:** Register a new local guide (requires phone verification)

**Request Body:**
```json
{
  "email": "local@example.com",
  "password": "password123",
  "name": "Jane Smith",
  "phone": "+1234567890",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (201 Created):**
```json
{
  "message": "Local guide account created. Please verify your phone number.",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "email": "local@example.com",
    "name": "Jane Smith",
    "phone": "+1234567890",
    "role": "local",
    "verified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requires_verification": true
}
```

---

## 3. Login

**Endpoint:** `POST /auth/login`

**Description:** Login with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "tourist",
    "verified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 4. Request OTP

**Endpoint:** `POST /auth/otp/request`

**Description:** Send OTP to local guide's phone number

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP sent successfully",
  "phone": "+1234567890",
  "expires_in_minutes": 10
}
```

---

## 5. Verify OTP

**Endpoint:** `POST /auth/otp/verify`

**Description:** Verify OTP and activate local guide account

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "Phone verified successfully",
  "verified": true
}
```

---

## 6. Check Verification Status

**Endpoint:** `GET /auth/verification/status`

**Description:** Check if current user is verified

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "verified": true,
  "role": "local",
  "phone": "+1234567890"
}
```

---

## 7. Get Profile

**Endpoint:** `GET /auth/profile`

**Description:** Get current user's profile

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "tourist",
    "verified": true,
    "bio": null,
    "rating": 0,
    "completed_quests": 0,
    "created_at": "2024-01-15T10:30:00"
  }
}
```

---

## 8. Update Profile

**Endpoint:** `PUT /users/profile`

**Description:** Update current user's profile

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Name",
  "bio": "My updated bio"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "updated_fields": ["name", "bio"]
}
```

---

## 9. Find Nearby Locals

**Endpoint:** `GET /users/locals/nearby`

**Description:** Find verified local guides near a location

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `latitude` (required): Location latitude
- `longitude` (required): Location longitude
- `max_distance` (optional): Maximum distance in km (default: 50)

**Example:**
```
GET /users/locals/nearby?latitude=40.7128&longitude=-74.0060&max_distance=20
```

**Response (200 OK):**
```json
{
  "locals": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "bio": "Local guide in NYC",
      "rating": 4.8,
      "completed_quests": 45,
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    }
  ],
  "count": 1
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid email format"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication token is missing"
}
```

**403 Forbidden:**
```json
{
  "error": "Local guide access required"
}
```

**404 Not Found:**
```json
{
  "error": "User not found"
}
```

**409 Conflict:**
```json
{
  "error": "Email already registered"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Registration failed: <error details>"
}
```

---

## Authentication

Protected endpoints require JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token is received after successful signup or login.

---

## Phone Number Format

Phone numbers must be in E.164 format:
- Start with `+`
- Followed by country code
- No spaces or special characters

Examples:
- US: `+12025551234`
- India: `+919876543210`
- UK: `+447911123456`

---

## Testing with curl

### Tourist Signup
```bash
curl -X POST http://localhost:5000/auth/signup/tourist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tourist@test.com",
    "password": "test1234",
    "name": "Test Tourist"
  }'
```

### Local Signup
```bash
curl -X POST http://localhost:5000/auth/signup/local \
  -H "Content-Type: application/json" \
  -d '{
    "email": "local@test.com",
    "password": "test1234",
    "name": "Test Local",
    "phone": "+1234567890",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tourist@test.com",
    "password": "test1234"
  }'
```

### Protected Route (replace TOKEN with actual token)
```bash
curl -X GET http://localhost:5000/auth/profile \
  -H "Authorization: Bearer TOKEN"
```
