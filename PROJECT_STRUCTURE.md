# Vaaya - Complete Project Structure

```
whackiest-25/
│
├── app.py                          # Main Flask application entry point
├── config.py                       # Configuration settings (DB, APIs, JWT secret)
├── requirements.txt                # Python dependencies
├── .env                           # Environment variables (API keys, secrets)
├── .gitignore                     # Git ignore file
│
├── models/                        # Database models
│   ├── __init__.py
│   ├── user.py                    # User model (tourists & locals)
│   ├── trip.py                    # Trip/itinerary model
│   ├── quest.py                   # Quest model (tasks from locals)
│   ├── chat.py                    # Chat message model
│   └── local_verification.py     # Local verification status model
│
├── modules/                       # Core business logic modules
│   ├── __init__.py
│   ├── auth.py                    # JWT authentication & registration
│   ├── otp.py                     # Phone OTP verification for locals
│   ├── trips.py                   # Trip planning & crowd prediction
│   ├── heatmap.py                 # Heatmap generation with Gemini
│   ├── quests.py                  # Quest creation & management
│   ├── ai_verification.py         # AI camera verification for quest completion
│   ├── chat.py                    # Real-time chat via Socket.IO
│   ├── notifications.py           # Firebase push notifications
│   └── chatbot.py                 # Tourism chatbot assistant
│
├── services/                      # External service integrations
│   ├── __init__.py
│   ├── gemini_service.py          # Google Gemini API integration
│   ├── weather_service.py         # OpenWeather API integration
│   ├── holiday_service.py         # Holiday/events API integration
│   ├── sms_service.py             # SMS/OTP provider (Twilio/etc)
│   └── firebase_service.py        # Firebase Cloud Messaging
│
├── utils/                         # Utility functions
│   ├── __init__.py
│   ├── jwt_utils.py               # JWT encoding/decoding helpers
│   ├── validators.py              # Input validation functions
│   ├── crowd_predictor.py         # Crowd prediction algorithms
│   └── image_processor.py         # Image preprocessing for AI verification
│
├── routes/                        # API route blueprints
│   ├── __init__.py
│   ├── auth_routes.py             # /auth/* endpoints
│   ├── trip_routes.py             # /trips/* endpoints
│   ├── quest_routes.py            # /quests/* endpoints
│   ├── chat_routes.py             # /chat/* endpoints
│   ├── user_routes.py             # /users/* endpoints
│   └── heatmap_routes.py          # /heatmap/* endpoints
│
├── static/                        # Frontend static files
│   ├── css/
│   │   └── style.css              # Main stylesheet
│   ├── js/
│   │   ├── app.js                 # Main frontend JavaScript
│   │   ├── socket.js              # Socket.IO client logic
│   │   ├── map.js                 # Map/heatmap rendering (Leaflet/Google Maps)
│   │   └── chat.js                # Chat UI logic
│   └── images/
│       └── logo.png               # Vaaya logo
│
├── templates/                     # HTML templates (Jinja2)
│   ├── base.html                  # Base template
│   ├── index.html                 # Landing page
│   ├── dashboard.html             # User dashboard
│   ├── trip_planner.html          # Trip planning interface
│   ├── quests.html                # Quest browsing/management
│   ├── chat.html                  # Chat interface
│   └── heatmap.html               # Heatmap visualization
│
├── migrations/                    # Database migrations (if using Flask-Migrate)
│   └── versions/
│
├── tests/                         # Unit and integration tests
│   ├── __init__.py
│   ├── test_auth.py               # Authentication tests
│   ├── test_trips.py              # Trip planner tests
│   ├── test_quests.py             # Quest tests
│   ├── test_ai_verification.py    # AI verification tests
│   └── test_chatbot.py            # Chatbot tests
│
├── firebase-credentials.json      # Firebase service account key (gitignored)
└── logs/                          # Application logs
    ├── app.log
    └── error.log
```

## File Purposes Explained

### Root Files
- **app.py**: Flask app initialization, route registration, Socket.IO setup
- **config.py**: Centralized configuration (MongoDB URI, API keys from .env, JWT settings)
- **requirements.txt**: All Python packages (Flask, PyMongo, google-generativeai, twilio, firebase-admin, etc.)
- **.env**: Sensitive data (MONGO_URI, GEMINI_API_KEY, JWT_SECRET, TWILIO credentials, etc.)

### Models (`models/`)
Database schemas using PyMongo/MongoEngine:
- **user.py**: User schema (email, password hash, role: tourist/local, phone, verified status)
- **trip.py**: Trip schema (destination, dates, predicted crowd levels, itinerary)
- **quest.py**: Quest schema (title, description, location, rewards, verification status)
- **chat.py**: Chat message schema (sender, recipient, message, timestamp)
- **local_verification.py**: Verification requests (user_id, phone, OTP, status)

### Modules (`modules/`)
Core business logic:
- **auth.py**: User registration, login, JWT token generation/validation
- **otp.py**: Generate & verify OTP for local guides
- **trips.py**: Create trips, predict crowds using weather/holiday/event data
- **heatmap.py**: Generate tourist heatmaps using Gemini API based on historical data
- **quests.py**: CRUD operations for quests, quest assignment
- **ai_verification.py**: Use Gemini Vision API to verify quest completion photos
- **chat.py**: Socket.IO event handlers for real-time messaging
- **notifications.py**: Send push notifications via FCM (new quests, chat messages)
- **chatbot.py**: Natural language chatbot using Gemini for tourism Q&A

### Services (`services/`)
External API integrations:
- **gemini_service.py**: Wrapper for Google Gemini API (text & vision models)
- **weather_service.py**: Fetch weather forecasts from OpenWeather
- **holiday_service.py**: Get holiday/event calendars
- **sms_service.py**: Send OTP via Twilio/similar
- **firebase_service.py**: Initialize Firebase Admin SDK, send FCM notifications

### Utils (`utils/`)
Helper functions:
- **jwt_utils.py**: encode_token(), decode_token()
- **validators.py**: Validate emails, phone numbers, inputs
- **crowd_predictor.py**: Algorithm combining weather, holidays, events to predict crowd density
- **image_processor.py**: Resize/normalize images before AI verification

### Routes (`routes/`)
API endpoints organized by feature:
- **auth_routes.py**: POST /auth/register, /auth/login, /auth/verify-otp
- **trip_routes.py**: GET/POST /trips, GET /trips/:id/predict-crowd
- **quest_routes.py**: GET/POST /quests, POST /quests/:id/verify
- **chat_routes.py**: GET /chat/history, Socket.IO events handled in modules/chat.py
- **user_routes.py**: GET/PUT /users/:id, GET /users/locals (find locals nearby)
- **heatmap_routes.py**: GET /heatmap?location=X&date=Y

### Frontend (`static/` & `templates/`)
- **templates/**: Jinja2 HTML templates for server-side rendering
- **static/js/app.js**: Main frontend logic, API calls
- **static/js/socket.js**: Real-time chat & notification handling
- **static/js/map.js**: Render maps/heatmaps using Leaflet or Google Maps
- **static/css/style.css**: Styling

### Tests (`tests/`)
Pytest-based tests for all modules

## Database Collections (MongoDB)

1. **users**: User accounts (tourists & locals)
2. **trips**: Saved trip plans
3. **quests**: Available quests from locals
4. **quest_completions**: Verified quest submissions
5. **chat_messages**: Chat history
6. **otp_verifications**: OTP verification records
7. **notifications**: Notification log
8. **chatbot_sessions**: Chatbot conversation history

## API Endpoints Overview

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login & get JWT
- `POST /auth/verify-otp` - Verify local guide phone

### Trips
- `GET /trips` - Get user's trips
- `POST /trips` - Create new trip
- `GET /trips/:id` - Get trip details
- `POST /trips/:id/predict` - Get crowd predictions

### Quests
- `GET /quests?location=X` - Browse quests
- `POST /quests` - Create quest (locals only)
- `POST /quests/:id/accept` - Accept quest
- `POST /quests/:id/verify` - Submit photo for AI verification

### Chat
- `GET /chat/conversations` - Get chat list
- `GET /chat/:id/messages` - Get message history
- Socket.IO events: `send_message`, `receive_message`

### Heatmap
- `GET /heatmap?location=X&date=Y` - Get tourist density heatmap

### Chatbot
- `POST /chatbot` - Send message to AI assistant

### Users
- `GET /users/profile` - Get current user
- `PUT /users/profile` - Update profile
- `GET /users/locals?lat=X&lng=Y` - Find nearby locals

## Environment Variables (.env)

```
MONGO_URI=mongodb://localhost:27017/vaaya
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
OPENWEATHER_API_KEY=your-weather-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FLASK_SECRET_KEY=your-flask-secret
```

## Getting Started

1. Install dependencies: `pip install -r requirements.txt`
2. Set up MongoDB
3. Configure `.env` with API keys
4. Run: `python app.py`
5. Access: `http://localhost:5000`
