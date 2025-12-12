# VAAYA - Gamified Tourism Platform

**VAAYA is a travel platform that combines Google Maps + TikTok Reels + Pokémon GO–style quests to help travelers explore smarter and help locals earn.**

## 🚨 Problem

Tourism today feels transactional — travellers visit places but rarely connect with local culture or help preserve it. Heritage sites face neglect, and locals remain uninvolved. Despite growing interest in sustainable travel, there's no engaging platform that empowers visitors to explore responsibly, collaborate with communities, and leave a positive impact.

## 💡 Solution

VAAYA is a gamified tourism platform that connects travellers with locals through interactive quests. It transforms traditional travel into a meaningful experience where visitors explore responsibly, help maintain tourist spots, and engage with local culture while earning rewards and recognition.

---

## ✨ Core Features Overview

### 1. 🎯 AI-Verified Clean-up Quests
Reward real responsible actions using camera + location proof with TensorFlow Lite, MobileNet, OpenCV, and GPS APIs.

**Status:** ⚠️ **Planned - Not Yet Implemented**

### 2. 🤝 Local-Generated Micro-Quests
Turn locals into active partners instead of passive service providers using Flask, MongoDB, Flask-SocketIO.

**Status:** ✅ **Partially Implemented** - Quest templates and API endpoints exist

### 3. 📊 Predictive Crowd Heatmaps
Use weather, festivals, and seasonal patterns to guide smart trip planning with Leaflet.js, OpenCV, MongoDB Analytics, OpenWeatherMap API.

**Status:** ✅ **Implemented** - Canvas-based heatmap generation with Gemini AI

### 4. 📖 Cultural Storytelling Layer
Visitors unlock geo-tagged local folklore tied to the places they explore using Geolocation APIs, MongoDB, Google Gemini API.

**Status:** ⚠️ **Planned - Not Yet Implemented**

### 5. 💬 Real-Time Chat with Locals
For guidance, folklore sharing, and personalized recommendations using Flask-SocketIO, MongoDB.

**Status:** ✅ **Partially Implemented** - Basic chat routes and UI exist

### 6. 🏆 Gamification System
XP points, badges, streaks, and global leaderboards using Flask, MongoDB, JavaScript.

**Status:** ⚠️ **Partially Implemented** - Data models exist, full UI/logic pending

### 7. 🗺️ Trash Density Heatmaps (Optional)
Show areas that need attention and maintenance using Leaflet.js, TensorFlow Lite, GPS Integration.

**Status:** ⚠️ **Planned - Not Yet Implemented**

### 8. 🌱 Daily Cleanliness Motivation & Awareness
Daily motivation quotes, cleanliness facts, and awareness content.

**Status:** ⚠️ **Planned - Not Yet Implemented**

### 9. 🎬 Real-Time Journey Planner with Location-Based Video Reels
Context-aware travel companion combining real-time data with crowdsourced video content.

**Status:** ⚠️ **Planned - Not Yet Implemented**

---

## 🛠️ Tech Stack

### Backend (✅ Implemented)
- **Flask** – Lightweight Python web framework
- **Flask-Login** – User authentication and session management
- **Flask-SocketIO** – Real-time chat functionality
- **MongoDB Atlas** – Fast, scalable NoSQL database
- **JWT** – JSON Web Token for secure authentication

### Frontend (✅ Implemented)
- **HTML, CSS, JavaScript** – Core web technologies
- **Tailwind CSS** – Modern, responsive UI framework
- **Canvas API** – Heatmap visualization (instead of Leaflet.js currently)

### AI & Computer Vision (⚠️ Partially Configured)
- **TensorFlow Lite** – ⚠️ Not installed - Lightweight trash detection model
- **MobileNet** – ⚠️ Not installed - Pretrained image classifier
- **OpenCV** – ⚠️ Not installed - People counting and object detection
- **Google Gemini API** – ⚠️ Model version issue - AI content generation

### External APIs & Services
| Service | Status | Notes |
|---------|--------|-------|
| MongoDB Atlas | ✅ Connected | Database working |
| JWT | ✅ Configured | 24h expiration |
| Gmail SMTP | ✅ Working | Email notifications configured |
| OpenWeatherMap API | ✅ Working | Weather data integrated |
| Google OAuth | ✅ Configured | Social login ready |
| Firebase Cloud Messaging | ✅ Configured | Push notifications ready |
| Twilio | ⚠️ Skipped | SMS OTP - installation issue |
| Holiday API | ❌ Failed | API connection failed |
| Google Gemini API | ❌ Failed | Model version error |
| TensorFlow Lite | ⚠️ Not installed | Needs setup |
| OpenCV | ⚠️ Not installed | Needs setup |

---

## 📊 Implementation Status Summary

### ✅ FULLY IMPLEMENTED (Production Ready)

#### 1. User Authentication System
- ✅ User registration with email/password
- ✅ Login system with JWT tokens
- ✅ User roles (tourist/local)
- ✅ Password hashing with bcrypt
- ✅ Profile management
- ⚠️ OTP verification for locals (Twilio not installed)

**Files:**
- `routes/auth_routes.py` - Registration, login, OTP endpoints
- `models/user.py` - User model with bcrypt
- `modules/auth.py` - Authentication logic
- `modules/otp.py` - OTP verification logic

#### 2. Trip Planning System
- ✅ Create trips with destination and dates
- ✅ Location coordinates integration
- ✅ Trip preferences and budgets
- ✅ List all user trips
- ✅ Update trip status
- ✅ Add itinerary items
- ✅ Crowd prediction for dates

**Files:**
- `routes/trip_routes.py` - Trip API endpoints
- `models/trip.py` - Trip data model
- `modules/trips.py` - Trip planning logic
- `templates/trips.html` - Trip planning UI
- `static/js/trips.js` - Trip frontend logic

#### 3. AI-Powered Heatmap Generation
- ✅ Gemini AI integration for heatmap generation
- ✅ 10x10 grid crowd density predictions
- ✅ Hotspot identification
- ✅ Peak times analysis
- ✅ Canvas-based visualization
- ✅ Fallback system when API fails
- ✅ India-specific context awareness

**Files:**
- `routes/ai_routes.py` - AI heatmap endpoints
- `services/gemini_service.py` - Gemini API integration
- `templates/heatmap.html` - Heatmap UI
- `static/js/heatmap.js` - Heatmap rendering

#### 4. Quest System (Backend)
- ✅ Quest data models
- ✅ Sustainable quest templates (Delhi, Goa, Jaipur, Agra, etc.)
- ✅ Quest categories (culture, environment, food, heritage)
- ✅ Difficulty levels and point systems
- ✅ Quest discovery by location
- ✅ Quest completion tracking
- ⚠️ AI verification not implemented yet

**Files:**
- `routes/quest_routes.py` - Quest API endpoints
- `models/quest.py` - Quest data model
- `templates/quests.html` - Quest UI
- `static/js/quests.js` - Quest frontend

#### 5. Chat System (Basic)
- ✅ Conversation management
- ✅ Message retrieval
- ✅ Message sending
- ✅ AI chatbot integration
- ✅ Tourist-Local conversations
- ⚠️ Real-time WebSocket not fully configured

**Files:**
- `routes/chat_routes.py` - Chat API endpoints
- `models/chat.py` - Chat message model
- `templates/chat.html` - Chat UI
- `static/js/chat.js` - Chat frontend

#### 6. Notification System
- ✅ Firebase Cloud Messaging configuration
- ✅ FCM token management
- ✅ Push notification sending
- ✅ Topic subscription (all_users, tourists, locals)
- ✅ Service worker for background notifications

**Files:**
- `routes/notification_routes.py` - Notification endpoints
- `services/firebase_service.py` - FCM integration
- `utils/fcm_notifications.py` - Notification utilities
- `static/firebase-messaging-sw.js` - Service worker
- `static/js/notifications.js` - Frontend notification handling

#### 7. Weather Integration
- ✅ OpenWeatherMap API integration
- ✅ Current weather fetching
- ✅ 5-day forecast
- ✅ City name to coordinates conversion

**Files:**
- `services/weather_service.py` - Weather API wrapper

#### 8. User Interface
- ✅ Dashboard page
- ✅ Trip planning page
- ✅ Quest browsing page
- ✅ Heatmap visualization page
- ✅ Chat interface page
- ✅ Test page for features
- ✅ Responsive Tailwind CSS design

**Files:**
- `templates/*.html` - All HTML templates
- `static/css/styles.css` - Custom styles
- `static/js/*.js` - Frontend JavaScript

---

### ⚠️ PARTIALLY IMPLEMENTED (Needs Work)

#### 1. AI Quest Verification
- ✅ API endpoint exists (`/ai/verify-quest`)
- ✅ Gemini API integration for verification
- ❌ Image preprocessing not implemented
- ❌ TensorFlow Lite model not trained
- ❌ OpenCV not installed
- ❌ GPS coordinate verification incomplete

**What's Needed:**
- Install TensorFlow Lite and OpenCV
- Train trash detection model (30-50 images)
- Implement image quality checks
- Add GPS radius verification (50-100m)
- Add human fallback system

#### 2. AI Itinerary Generation
- ✅ API endpoint exists (`/ai/generate-itinerary`)
- ✅ Gemini API integration
- ❌ Not connected to trip planning UI
- ❌ Weather integration incomplete
- ❌ Activity recommendations basic

**What's Needed:**
- Connect to trips.html
- Add weather-aware suggestions
- Integrate with quest system
- Add crowd data to recommendations

#### 3. Gamification System
- ✅ User points and XP in data model
- ✅ Badge concepts defined
- ❌ XP calculation logic not implemented
- ❌ Badge awarding system not built
- ❌ Leaderboard API not created
- ❌ Streak tracking not implemented

**What's Needed:**
- Create leaderboard API endpoint
- Implement XP award logic on quest completion
- Build badge checking system
- Add streak tracking
- Create leaderboard UI

#### 4. Real-Time Features
- ✅ Flask-SocketIO imported
- ✅ Basic chat routes exist
- ❌ Socket events not fully configured
- ❌ Real-time notifications not tested
- ❌ Online user tracking not implemented

**What's Needed:**
- Configure Socket.IO events
- Test real-time messaging
- Add typing indicators
- Add online/offline status
- Test push notifications

---

### ❌ NOT IMPLEMENTED (Future Features)

#### 1. Interactive Map with Pins (Leaflet.js/Google Maps)
**Current State:** Using canvas for heatmaps only
**What's Needed:**
- Add Leaflet.js library
- Create map initialization
- Add location markers for quests
- Add click events for quest details
- Integrate with trip planning

#### 2. TikTok-Style Video Reels
**Current State:** Not started
**What's Needed:**
- Video upload API endpoint
- Video storage (Firebase Storage/AWS S3)
- Geo-tagging for videos
- Vertical scroll feed UI
- Video player with autoplay
- Like/comment system
- Timeline view by time of day

#### 3. "Should You Go?" AI Recommendations
**Current State:** Not started
**What's Needed:**
- Location detail page
- Aggregate weather + crowd + hours data
- Gemini API recommendation generation
- Display with supporting data
- Best time to visit suggestions

#### 4. Cultural Storytelling Layer
**Current State:** Not started
**What's Needed:**
- Folklore submission system
- Geo-fencing logic
- Story unlock on proximity
- XP rewards for discoveries
- Gemini API for content analysis

#### 5. Trash Density Heatmap
**Current State:** Not started
**What's Needed:**
- Separate from crowd heatmap
- Track cleanup quest locations
- AI verification results as data source
- Color-coded zones
- Authority notification system

#### 6. Daily Motivation Feature
**Current State:** Not started
**What's Needed:**
- Daily quote/fact database
- Push notification scheduling
- Engagement tracking
- Social sharing buttons

#### 7. Point Economy for Chat
**Current State:** Basic chat exists
**What's Needed:**
- Point deduction for questions
- Point earning for answers
- "Helpful" rating system
- Point to currency conversion
- Cash-out system for locals

#### 8. Advanced AI Models
**Current State:** Not started
**What's Needed:**
- TensorFlow Lite trash detection model
- Training data collection (30-50 images)
- OpenCV crowd counting
- Model deployment on server
- Real-time inference

---

## 📁 Project Structure

```
vaaya/
├── app.py                          # ✅ Main Flask application
├── config.py                       # ✅ Configuration settings
├── requirements.txt                # ✅ Python dependencies
│
├── models/                         # ✅ Database models
│   ├── user.py                    # ✅ User model (tourist/local)
│   ├── trip.py                    # ✅ Trip/itinerary model
│   ├── quest.py                   # ✅ Quest model
│   ├── chat.py                    # ✅ Chat message model
│   └── local_verification.py     # ✅ Verification status model
│
├── modules/                        # ✅ Business logic
│   ├── auth.py                    # ✅ JWT authentication
│   ├── otp.py                     # ✅ Phone OTP verification
│   └── trips.py                   # ✅ Trip planning logic
│
├── services/                       # ✅ External services
│   ├── gemini_service.py          # ⚠️ Gemini API (model issue)
│   ├── weather_service.py         # ✅ OpenWeather API
│   ├── holiday_service.py         # ❌ Holiday API (failed)
│   ├── sms_service.py             # ⚠️ Twilio (not installed)
│   └── firebase_service.py        # ✅ FCM notifications
│
├── utils/                          # ✅ Utility functions
│   ├── jwt_utils.py               # ✅ JWT helpers
│   ├── validators.py              # ✅ Input validation
│   ├── crowd_predictor.py         # ✅ Crowd algorithms
│   └── fcm_notifications.py       # ✅ FCM utilities
│
├── routes/                         # ✅ API blueprints
│   ├── auth_routes.py             # ✅ Authentication endpoints
│   ├── trip_routes.py             # ✅ Trip endpoints
│   ├── quest_routes.py            # ✅ Quest endpoints
│   ├── chat_routes.py             # ✅ Chat endpoints
│   ├── user_routes.py             # ✅ User profile endpoints
│   ├── ai_routes.py               # ✅ AI endpoints
│   └── notification_routes.py     # ✅ Notification endpoints
│
├── static/                         # ✅ Frontend files
│   ├── css/styles.css             # ✅ Custom styles
│   ├── js/                        # ✅ JavaScript files
│   │   ├── dashboard.js           # ✅ Dashboard logic
│   │   ├── trips.js               # ✅ Trip planner
│   │   ├── quests.js              # ✅ Quest browser
│   │   ├── heatmap.js             # ✅ Heatmap renderer
│   │   ├── chat.js                # ✅ Chat interface
│   │   └── notifications.js       # ✅ Push notifications
│   └── firebase-messaging-sw.js   # ✅ Service worker
│
└── templates/                      # ✅ HTML templates
    ├── dashboard.html             # ✅ User dashboard
    ├── trips.html                 # ✅ Trip planning
    ├── quests.html                # ✅ Quest browsing
    ├── heatmap.html               # ✅ Heatmap view
    ├── chat.html                  # ✅ Chat interface
    └── test.html                  # ✅ Feature tester
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB Atlas account
- API keys (see config)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables (create .env file)
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_key
OPENWEATHER_API_KEY=your_weather_key
# ... other keys
```

### Running the Server

```bash
python app.py
```

Server runs on `http://localhost:5000`

### Available Endpoints

- Dashboard: `http://localhost:5000/dashboard`
- Trips: `http://localhost:5000/trips`
- Quests: `http://localhost:5000/quests`
- Heatmap: `http://localhost:5000/heatmap`
- Chat: `http://localhost:5000/chat`
- API Docs: `http://localhost:5000/api`

---

## 🎯 Feature Implementation Priority

### Phase 1: Core MVP (Current State - 60% Complete)
- ✅ User authentication
- ✅ Trip planning
- ✅ Basic quests
- ✅ Heatmap generation
- ⚠️ Fix Gemini API model issue
- ⚠️ Install missing AI libraries

### Phase 2: Gamification (Next Priority - 20% Complete)
- ❌ XP/Points system
- ❌ Badge awarding
- ❌ Leaderboards
- ❌ Streak tracking
- ⚠️ Complete quest verification

### Phase 3: Interactive Map (0% Complete)
- ❌ Leaflet.js integration
- ❌ Quest markers
- ❌ Click interactions
- ❌ Location search

### Phase 4: Video Reels (0% Complete)
- ❌ Video upload
- ❌ Geo-tagging
- ❌ Vertical feed UI
- ❌ Timeline view

### Phase 5: Advanced Features (0% Complete)
- ❌ Storytelling layer
- ❌ Trash heatmap
- ❌ AI recommendations
- ❌ Point economy

---

## 📋 Next Steps for Development

### Immediate Actions (Fix Broken Features)
1. **Fix Gemini API** - Update to correct model version
2. **Install TensorFlow Lite** - For quest verification
3. **Install OpenCV** - For image processing
4. **Fix Holiday API** - Find alternative or fix connection
5. **Test Twilio SMS** - Fix installation or use alternative

### High Priority (Complete Phase 1)
1. **Complete Quest Verification** - Train AI model, test verification
2. **Test Push Notifications** - Verify FCM works end-to-end
3. **Implement XP Awards** - Award points on quest completion
4. **Create Leaderboard** - Build API and UI

### Medium Priority (Phase 2-3)
1. **Add Leaflet.js Map** - Replace canvas with interactive map
2. **Build Badge System** - Define badges, award logic, display
3. **Implement Streaks** - Track consecutive days
4. **Real-time Chat** - Configure Socket.IO fully

### Future Enhancements (Phase 4-5)
1. **Video Reel System** - Upload, storage, feed
2. **Storytelling Layer** - Geo-fenced folklore
3. **Trash Heatmap** - Separate visualization
4. **Point Economy** - Chat payments system

---

## 🤝 Contributing

This is a hackathon/MVP project. Core features are functional but many advanced features are planned. See implementation status above for what needs work.

---

## 📄 License

[Add your license here]

---

## 📞 Contact

[Add your contact information]

---

**Last Updated:** December 7, 2025
**Version:** 0.6 (60% MVP Complete)
