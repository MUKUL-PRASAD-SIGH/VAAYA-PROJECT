# 🌍 VAAYA - Gamified Tourism Platform

> **Google Maps + TikTok Reels + Pokémon GO–style quests** — Explore smarter, connect with locals, earn rewards.

**VAAYA is a travel platform that combines Google Maps + TikTok Reels + Pokémon GO–style quests to help travelers explore smarter and help locals earn.**

## 🚨 Problem

Tourism today feels transactional — travellers visit places but rarely connect with local culture or help preserve it. Heritage sites face neglect, and locals remain uninvolved. Despite growing interest in sustainable travel, there's no engaging platform that empowers visitors to explore responsibly, collaborate with communities, and leave a positive impact.

## 💡 Solution

VAAYA is a gamified tourism platform that connects travellers with locals through interactive quests. It transforms traditional travel into a meaningful experience where visitors explore responsibly, help maintain tourist spots, and engage with local culture while earning rewards and recognition.

---

## ✨ Core Features Overview

### 1. 🎯 AI-Verified Clean-up Quests
Reward real responsible actions using camera + location proof with TensorFlow Lite, MobileNet, OpenCV, and GPS APIs.


### 2. 🤝 Local-Generated Micro-Quests
Turn locals into active partners instead of passive service providers using Flask, MongoDB, Flask-SocketIO.


### 3. 📊 Predictive Crowd Heatmaps
Use weather, festivals, and seasonal patterns to guide smart trip planning with Leaflet.js, OpenCV, MongoDB Analytics, OpenWeatherMap API.

### 4. 📖 Cultural Storytelling Layer
Visitors unlock geo-tagged local folklore tied to the places they explore using Geolocation APIs, MongoDB, Google Gemini API.

### 5. 💬 Real-Time Chat with Locals
For guidance, folklore sharing, and personalized recommendations using Flask-SocketIO, MongoDB.

### 6. 🏆 Gamification System
XP points, badges, streaks, and global leaderboards using Flask, MongoDB, JavaScript.

### 7. 🗺️ Trash Density Heatmaps (Optional)
Show areas that need attention and maintenance using Leaflet.js, TensorFlow Lite, GPS Integration.

### 8. 🌱 Daily Cleanliness Motivation & Awareness
Daily motivation quotes, cleanliness facts, and awareness content.

### 9. 🎬 Real-Time Journey Planner with Location-Based Video Reels
Context-aware travel companion combining real-time data with crowdsourced video content.

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

### AI & Computer Vision (✅ Implemented)
- **TensorFlow Lite** –  - Lightweight trash detection model
- **MobileNet** –  - Pretrained image classifier
- **OpenCV** –  - People counting and object detection
- **Google Gemini API** –  - AI content generation

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
│   ├── gemini_service.py          #  Gemini API 
│   ├── weather_service.py         # ✅ OpenWeather API
│   ├── holiday_service.py         # 
│   ├── sms_service.py             # Twilio 
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

## 🤝 Contributing

This is a hackathon/MVP project. Core features are functional but many advanced features are planned. See implementation status above for what needs work.

## 📞 Contact

1ms24ci076@msrit.edu
mukulprasad958@gmail.com
---

**Last Updated:** December 15, 2025

