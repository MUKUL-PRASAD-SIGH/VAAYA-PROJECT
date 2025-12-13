# 🌍 VAAYA - Gamified Tourism Platform

> **Google Maps + TikTok Reels + Pokémon GO–style quests** — Explore smarter, connect with locals, earn rewards.

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.x-000000?logo=flask)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

---

## ✨ Features

### 🎯 Core Features
| Feature | Description |
|---------|-------------|
| **🗺️ AI Crowd Heatmaps** | Predictive crowd density maps powered by Gemini AI, weather & holiday data |
| **🎮 Quest System** | Location-based challenges with AI photo verification & XP rewards |
| **💬 Tourist-Local Chat** | Real-time messaging with local guides via Socket.IO |
| **🤖 AI Travel Assistant** | Gemini-powered chatbot for personalized travel recommendations |
| **📍 Geo-Posts & Stories** | Share location-tagged content visible to nearby travelers |
| **🔔 Push Notifications** | Firebase Cloud Messaging for real-time alerts |

### 👤 User Roles
| Tourist | Local Guide |
|---------|-------------|
| Discover nearby places | Create quests & earn money |
| Complete quests for XP | Share local knowledge |
| Chat with local guides | Get chat requests from tourists |
| View crowd heatmaps | Post stories & tips |

### 🏆 Gamification
- **XP & Levels** — Earn points from quests and engagement
- **Badges** — Unlock achievements (Explorer, Eco Warrior, Culture Keeper)
- **Leaderboards** — Compete globally and locally
- **Streaks** — Daily activity rewards

---

## 🛠️ Tech Stack

```
Frontend          Backend           AI & Services
─────────────     ─────────────     ─────────────
React 18          Flask             Google Gemini AI
Vite              Flask-SocketIO    OpenWeatherMap API
MapLibre GL       MongoDB Atlas     Firebase (Auth + FCM)
Lucide Icons      JWT Auth          Phone OTP Verification
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & Python 3.8+
- MongoDB Atlas account
- API Keys: Gemini, OpenWeather, Firebase

### Installation

```bash
# Clone & Install
git clone https://github.com/your-repo/vaaya.git
cd vaaya

# Backend
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### Environment Variables
Create `.env` in root:
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_key
OPENWEATHER_API_KEY=your_weather_key
```

### Run Development

```bash
# Terminal 1: Backend
python app.py

# Terminal 2: Frontend
cd frontend && npm run dev
```

**Backend:** `http://localhost:5000` | **Frontend:** `http://localhost:5173`

---

## 📁 Project Structure

```
vaaya/
├── frontend/              # React + Vite app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages (Dashboard, Chat, Quests)
│   │   ├── context/       # Auth, Theme, Language contexts
│   │   └── services/      # API service layer
│   └── public/
│
├── routes/                # Flask API blueprints
├── models/                # MongoDB data models
├── services/              # External API integrations
├── utils/                 # Helper functions
└── app.py                 # Flask entry point
```

---

## 📱 Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Main hub with map, posts, weather |
| Chat | `/chat` | AI assistant + nearby users chat |
| Heatmap | `/heatmap` | Crowd prediction visualization |
| Quests | `/quests` | Discover & complete challenges |
| Local Dashboard | `/local-guide/*` | Quest creator, chat center, analytics |

---

## 🔗 API Endpoints

```
Auth          POST /auth/register, /auth/login, /auth/verify-otp
Trips         GET/POST /trips, /trips/:id
Quests        GET /quests/nearby, POST /quests/complete
Chat          GET/POST /chat/messages, /chat/nearby-locals
AI            POST /ai/chat, /ai/heatmap, /ai/verify-quest
Notifications POST /notifications/send, /notifications/subscribe
```

---

## 🎯 Roadmap

- [x] User Auth & Roles
- [x] AI Heatmaps
- [x] Quest System
- [x] Real-time Chat
- [x] Push Notifications
- [ ] Video Reels Feed
- [ ] Offline Mode
- [ ] Payment Integration

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push & open PR

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for sustainable tourism</strong><br>
  <sub>Last Updated: December 2024</sub>
</p>
