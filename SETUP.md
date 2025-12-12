# Vaaya - AI-Powered Tourism Platform

A full-stack web application that gamifies tourism with AI-powered features, crowd predictions, and real-time push notifications.

## 🚀 Features

### Backend (Flask)
- **AI Features** (Google Gemini):
  - Trip itinerary generation
  - Crowd heatmap predictions
  - Quest photo verification
  - Intelligent chatbot
- **Fallback System**: 3-tier fallback (Primary API → Google Search → Default data)
- **Push Notifications**: Firebase Cloud Messaging
- **Authentication**: JWT-based auth with phone verification
- **MongoDB**: User profiles, trips, quests

### Frontend
- **Pages**:
  - Login/Register
  - Dashboard with stats
  - Trip planner with AI itinerary
  - Quest browser with camera capture
  - Crowd heatmap visualization
  - AI chatbot interface
- **Stack**: HTML5, Tailwind CSS, Vanilla JavaScript, Axios
- **Features**: Real-time push notifications, camera access, canvas rendering

## 📦 Installation

### Prerequisites
- Python 3.8+
- MongoDB Atlas account
- Google Gemini API key
- Firebase project (for FCM)

### Setup

1. **Clone the repository**
```bash
cd whackiest-25
```

2. **Install Python dependencies**
```bash
pip install flask flask-cors pymongo python-dotenv pyjwt requests google-generativeai
```

3. **Configure environment variables**

Edit `.env` file:
```env
# MongoDB
MONGO_URI=your_mongodb_atlas_connection_string

# JWT
JWT_SECRET_KEY=your_secret_key_here
JWT_EXPIRATION_HOURS=24

# Google Gemini AI
GEMINI_API_KEY=AIzaSyDLcptu5067jbnN5hdOwDl4p4-4RfmPm94

# APIs
OPENWEATHER_API_KEY=your_openweather_key
NAGER_API_URL=https://date.nager.at/api/v3
SERPER_API_KEY=your_serper_api_key

# Firebase Cloud Messaging
FCM_SERVER_KEY=your_fcm_server_key
```

4. **Configure Firebase** (for push notifications)

Update these files with your Firebase config:
- `static/js/notifications.js` - Firebase config object
- `static/firebase-messaging-sw.js` - Firebase config object

Get your config from Firebase Console → Project Settings → General → Your apps

5. **Run the application**
```bash
python app.py
```

The server will start at `http://localhost:5000`

## 🌐 Routes

### Frontend Pages
- `/` - Home (redirects to login)
- `/login` - Login page
- `/dashboard` - Main dashboard
- `/trips` - Trip planner
- `/quests` - Quest browser
- `/heatmap` - Crowd heatmap
- `/chat` - AI chatbot

### API Endpoints

#### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/verify/request` - Request OTP
- `POST /auth/verify/confirm` - Verify OTP
- `GET /auth/verify/status` - Check verification status

#### Trips (`/trips`)
- `POST /trips/create` - Create trip with crowd predictions
- `GET /trips/` - Get user trips
- `DELETE /trips/<id>` - Delete trip

#### AI Features (`/ai`)
- `POST /ai/generate-itinerary` - Generate trip itinerary
- `POST /ai/heatmap` - Generate crowd heatmap
- `POST /ai/verify-quest` - Verify quest photo with AI
- `POST /ai/chat` - Chat with AI assistant
- `GET /ai/health` - Check AI service health

#### Users (`/users`)
- `GET /users/profile/<id>` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /users/locals/nearby` - Find nearby locals
- `POST /users/fcm-token` - Update FCM token

#### Notifications (`/notifications`)
- `POST /notifications/subscribe` - Subscribe to topic
- `POST /notifications/unsubscribe` - Unsubscribe from topic

## 🔧 Testing

### Test AI Features
```bash
python test_ai_features.py
```

### Test Fallback System
```bash
python test_fallback_system.py
```

### Test FCM Notifications
```bash
python test_fcm_notifications.py
```

## 📱 Firebase Push Notifications Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Go to Project Settings → Cloud Messaging
3. Get your **Server Key** (Legacy) and add to `.env`
4. Generate a **Web Push Certificate** (VAPID key)
5. Update `notifications.js` with your VAPID key
6. Update Firebase config in:
   - `static/js/notifications.js`
   - `static/firebase-messaging-sw.js`

## 🎯 How It Works

### Trip Planning
1. User enters destination and dates
2. System fetches weather, holidays, and events
3. AI generates crowd predictions for each day
4. User can request AI-generated itinerary
5. Push notification sent for trip reminders

### Quest Verification
1. User selects a quest
2. Opens camera to capture photo
3. Photo sent to Google Gemini AI
4. AI verifies if photo matches quest requirements
5. Points awarded if verified

### Crowd Heatmap
1. User selects location and time
2. AI generates 10x10 grid of crowd density
3. Canvas renders heatmap with color gradient
4. Shows peak areas and best times to visit

### Push Notifications
1. User logs in → FCM token registered
2. User subscribes to topics (e.g., "all_users")
3. Backend sends notifications via FCM
4. Service worker handles background notifications
5. Foreground notifications show as toast

## 🔑 API Keys Required

1. **Google Gemini API** - https://makersuite.google.com/app/apikey
2. **Serper API** (Google Search) - https://serper.dev
3. **OpenWeather API** - https://openweathermap.org/api
4. **MongoDB Atlas** - https://www.mongodb.com/cloud/atlas
5. **Firebase FCM** - https://console.firebase.google.com

## 📝 Notes

- All API calls from frontend use Axios
- JWT tokens stored in localStorage
- Camera access requires HTTPS in production
- Service worker must be in root or static folder
- Firebase config needs to be updated before deployment

## 🐛 Troubleshooting

**Push notifications not working?**
- Check FCM_SERVER_KEY is set in `.env`
- Verify Firebase config in `notifications.js`
- Ensure service worker is registered
- Check browser console for errors

**Camera not working?**
- Use HTTPS (required for getUserMedia)
- Allow camera permissions in browser
- Check console for MediaDevices errors

**AI features failing?**
- Verify GEMINI_API_KEY is correct
- Check `test_ai_features.py` output
- Ensure Serper API key is valid (fallback)

## 📄 License

MIT License - feel free to use for your projects!

## 🤝 Contributing

Pull requests welcome! Please test thoroughly before submitting.

---

Built with ❤️ for Whackiest Hacks 2025
