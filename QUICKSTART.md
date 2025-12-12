# Vaaya Backend - Setup Complete! 🎉

## ✅ What's Been Created

### Core Authentication System
- **JWT Authentication** - Secure token-based authentication
- **User Signup/Login** - Separate flows for tourists and local guides
- **OTP Verification** - Phone verification for local guides via Twilio
- **Protected Routes** - JWT middleware for route protection
- **MongoDB Integration** - User data stored in MongoDB Atlas

### Files Created

**Utils:**
- ✅ `utils/jwt_utils.py` - JWT token generation, verification, and decorators
- ✅ `utils/validators.py` - Input validation (email, phone, password, coordinates)

**Modules (Business Logic):**
- ✅ `modules/auth.py` - Registration and login logic
- ✅ `modules/otp.py` - OTP request and verification logic

**Routes (API Endpoints):**
- ✅ `routes/auth_routes.py` - Authentication endpoints
- ✅ `routes/user_routes.py` - User profile and nearby locals endpoints

**Services:**
- ✅ `services/sms_service.py` - Twilio SMS integration (updated)

**Core:**
- ✅ `app.py` - Main Flask application (updated)
- ✅ `config.py` - Configuration (updated)

**Documentation:**
- ✅ `API_DOCS.md` - Complete API documentation
- ✅ `test_api.py` - API test script

---

## 📋 API Endpoints

### Authentication
- `POST /auth/signup/tourist` - Register tourist
- `POST /auth/signup/local` - Register local guide
- `POST /auth/login` - Login
- `POST /auth/otp/request` - Request OTP (protected)
- `POST /auth/otp/verify` - Verify OTP (protected)
- `GET /auth/verification/status` - Check verification status (protected)
- `GET /auth/profile` - Get current user profile (protected)
- `GET /auth/protected/test` - Test protected route (protected)

### Users
- `GET /users/profile/<user_id>` - Get user by ID (protected)
- `PUT /users/profile` - Update profile (protected)
- `GET /users/locals/nearby` - Find nearby locals (protected)
- `POST /users/fcm-token` - Update FCM token (protected)

### System
- `GET /` - API info
- `GET /health` - Health check

---

## 🚀 How to Run

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Verify .env Configuration
Your `.env` file is already set up with:
- MongoDB Atlas URI ✅
- JWT Secret ✅
- Twilio credentials ✅
- Other API keys ✅

### 3. Start the Server
```bash
python app.py
```

Server will start on: `http://localhost:5000`

### 4. Test the API
```bash
python test_api.py
```

Or test manually:
```bash
# Health check
curl http://localhost:5000/health

# Tourist signup
curl -X POST http://localhost:5000/auth/signup/tourist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

---

## 🔑 Key Features

### 1. JWT Authentication
- Tokens expire in 24 hours (configurable)
- Includes user ID and role in payload
- Automatic token verification on protected routes

### 2. Role-Based Access
- **Tourist**: Can browse quests, plan trips
- **Local**: Can create quests (requires phone verification)

### 3. Phone Verification (Locals Only)
- Twilio SMS integration
- 6-digit OTP code
- 10-minute expiration
- Max 3 attempts

### 4. Protected Routes
Three decorator options:
```python
@token_required  # Requires valid JWT
@local_required  # Requires local role
@tourist_required  # Requires tourist role
```

### 5. MongoDB Storage
- Users stored in `users` collection
- OTP verifications in `otp_verifications` collection
- GeoJSON format for local guide locations

---

## 📖 Usage Examples

### Tourist Registration
```python
import requests

response = requests.post('http://localhost:5000/auth/signup/tourist', json={
    "email": "tourist@example.com",
    "password": "secure123",
    "name": "John Doe"
})

data = response.json()
token = data['token']  # Use this for protected routes
```

### Local Guide Registration + Verification
```python
# 1. Signup
response = requests.post('http://localhost:5000/auth/signup/local', json={
    "email": "local@example.com",
    "password": "secure123",
    "name": "Jane Smith",
    "phone": "+1234567890",
    "latitude": 40.7128,
    "longitude": -74.0060
})

token = response.json()['token']

# 2. Request OTP
requests.post('http://localhost:5000/auth/otp/request', 
    json={"phone": "+1234567890"},
    headers={"Authorization": f"Bearer {token}"})

# 3. Check console for OTP (development mode)
# In production, user receives SMS

# 4. Verify OTP
requests.post('http://localhost:5000/auth/otp/verify',
    json={"phone": "+1234567890", "otp": "123456"},
    headers={"Authorization": f"Bearer {token}"})
```

### Using Protected Routes
```python
headers = {"Authorization": f"Bearer {token}"}

# Get profile
response = requests.get('http://localhost:5000/auth/profile', headers=headers)

# Find nearby locals
response = requests.get(
    'http://localhost:5000/users/locals/nearby?latitude=40.7128&longitude=-74.0060',
    headers=headers
)
```

---

## 🔒 Security Features

1. **Password Hashing**: bcrypt with salt
2. **JWT Tokens**: HS256 algorithm
3. **Input Validation**: Email, phone, coordinates
4. **SQL Injection Protection**: MongoDB (NoSQL)
5. **CORS Enabled**: For frontend integration
6. **OTP Expiration**: 10 minutes
7. **Attempt Limiting**: Max 3 OTP attempts

---

## 🧪 Testing

### Run Test Script
```bash
python test_api.py
```

### Manual Testing with Postman/Insomnia
Import the API endpoints from `API_DOCS.md`

### Test OTP in Development
When Twilio is not configured, OTP is printed to console:
```
[DEV] OTP for +1234567890: 123456
```

---

## 📱 Phone Number Format

All phone numbers must be in **E.164 format**:
- Start with `+`
- Country code (1-3 digits)
- Phone number (no spaces/dashes)

Examples:
- US: `+12025551234`
- India: `+919876543210`
- UK: `+447911123456`

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check `MONGO_URI` in `.env`
- Verify MongoDB Atlas IP whitelist
- Test connection: `python -c "from models import db; print(db.command('ping'))"`

### Twilio SMS Not Sending
- Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in `.env`
- Check Twilio console for errors
- In development, OTP is printed to console

### JWT Token Invalid
- Check `JWT_SECRET_KEY` in `.env`
- Verify token hasn't expired (24 hours)
- Ensure correct format: `Authorization: Bearer <token>`

---

## 🎯 Next Steps

You now have a complete authentication system! You can add:
1. Trip planning endpoints (already scaffolded)
2. Quest management (models ready)
3. Chat functionality (Socket.IO ready)
4. Heatmap generation (Gemini service ready)
5. Frontend integration

All the foundational models and services are already created - just need to add the route handlers!

---

## 📚 Additional Documentation

- Full API docs: `API_DOCS.md`
- Project structure: `PROJECT_STRUCTURE.md`
- Setup status: `SETUP_STATUS.md`

Enjoy building with Vaaya! 🚀
