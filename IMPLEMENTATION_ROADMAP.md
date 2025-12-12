# VAAYA - Complete Feature Implementation Roadmap

## 📊 Feature Coverage Analysis

Based on your specifications, here are the **9 core features** mapped to implementation phases:

| # | Feature | Phase Coverage | Status | Requires Manual Input? |
|---|---------|---------------|--------|----------------------|
| **1** | Interactive Map with Location Pins | Phase 1.2, Phase 2.2 | ❌ Not Started | Yes - Location data |
| **2** | TikTok-Style Reels Feed | Phase 1.3, Phase 3.1, Phase 3.2 | ❌ Not Started | Yes - Video uploads |
| **3** | Quest System | Phase 1.4, Phase 4.1 | ✅ 60% Done | Yes - Quest creation |
| **4** | AI Verification | Phase 4.2 | ⚠️ 20% Done | No - Automated |
| **5** | Real-time Chat | Phase 5.1 | ✅ 40% Done | Yes - Messages |
| **6** | Heatmaps/Weather | Phase 5.2 | ✅ 80% Done | No - API-driven |
| **7** | Leaderboards/XP | Phase 1.4, Phase 4.3 | ⚠️ 30% Done | No - Auto-calculated |
| **8** | User Auth | Phase 1.1, Phase 2.1 | ✅ 90% Done | Yes - Registration |
| **9** | "Should You Go?" AI | Phase 2.3 (NEW) | ❌ Not Started | No - API-driven |

---

## 🗺️ Master Implementation Roadmap

### **Phase 1: The Visual Shell (Pure Frontend & Mock Data)**

**Goal:** Build complete UI/UX using HTML/CSS/JS with hardcoded data. No backend yet.

---

#### **Sub-phase 1.1: Landing & Auth UI** ✅ DONE

**Status:** ✅ **COMPLETED** - Authentication system fully functional

**What Was Built:**
- ✅ Login/Register forms in `routes/auth_routes.py`
- ✅ JWT token generation in `utils/jwt_utils.py`
- ✅ User model with bcrypt in `models/user.py`
- ✅ Password hashing and verification
- ✅ Role-based access (tourist/local)

**🧪 Test Results:**
- **What's Working:** Users can register, login, logout. JWT tokens generated. Sessions maintained.
- **What Users Can Do:** Create account, login with email/password, access protected routes.

**What's Missing:**
- ❌ Dedicated landing page HTML (currently redirects to dashboard)
- ❌ Signup/Login UI components (using API only)
- ❌ Responsive navigation bar on auth pages

**Next Steps to Complete:**
1. Create `templates/landing.html` with hero section
2. Create `templates/login.html` and `templates/signup.html`
3. Add navigation bar component

---

#### **Sub-phase 1.2: The Map Interface (Leaflet.js)** ❌ NOT STARTED

**Status:** ❌ **NOT IMPLEMENTED** - Using canvas heatmap instead

**Current State:**
- ❌ No Leaflet.js library included
- ❌ No map initialization code
- ❌ No location pins/markers
- ✅ Have heatmap canvas in `templates/heatmap.html`

**What's Needed:**
```html
<!-- Add to heatmap.html -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

```javascript
// Add to heatmap.js
const map = L.map('map-container').setView([28.6139, 77.2090], 12); // Delhi
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Add quest markers
const mockLocations = [
    {name: 'Taj Mahal', coords: [27.1751, 78.0421], quests: 5},
    {name: 'Red Fort', coords: [28.6562, 77.2410], quests: 3}
];

mockLocations.forEach(loc => {
    L.marker(loc.coords)
        .addTo(map)
        .bindPopup(`<b>${loc.name}</b><br>${loc.quests} Quests Available`);
});
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Map loads, pans, zooms. Pins appear based on JS array.
- **What Users Could Do:** Drag map around. Click pin to see "Taj Mahal - 5 Quests Available".

**Manual Input Required:** ✅ YES
- Add location coordinates for quests manually to database
- Create quest locations in `models/quest.py`

---

#### **Sub-phase 1.3: The "TikTok" Reel Viewer** ❌ NOT STARTED

**Status:** ❌ **NOT IMPLEMENTED** - No video functionality

**Current State:**
- ❌ No video upload system
- ❌ No video storage configured
- ❌ No reel feed UI
- ❌ No video player

**What's Needed:**

**1. Create `templates/reels.html`:**
```html
<div class="reel-container h-screen overflow-y-scroll snap-y snap-mandatory">
    <div class="reel-item h-screen snap-start relative" data-video-id="1">
        <video class="w-full h-full object-cover" src="/static/videos/video1.mp4" 
               preload="metadata" loop></video>
        
        <!-- Overlay UI -->
        <div class="absolute bottom-20 left-4 text-white">
            <p class="font-bold">@username</p>
            <p class="text-sm">📍 Taj Mahal, Agra</p>
            <p class="text-xs text-gray-300">Posted 2 hours ago</p>
        </div>
        
        <!-- Action buttons -->
        <div class="absolute right-4 bottom-32 space-y-4">
            <button class="like-btn text-white text-3xl">❤️</button>
            <button class="share-btn text-white text-3xl">📤</button>
        </div>
    </div>
</div>
```

**2. Create `static/js/reels.js`:**
```javascript
// Intersection Observer for autoplay
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (entry.isIntersecting) {
            video.play();
        } else {
            video.pause();
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.reel-item').forEach(reel => {
    observer.observe(reel);
});
```

**3. Add video upload API in `routes/video_routes.py`:**
```python
@video_bp.route('/upload', methods=['POST'])
@token_required
def upload_reel(current_user):
    video = request.files['video']
    location = request.form.get('location')
    lat = request.form.get('lat')
    lng = request.form.get('lng')
    
    # Save to Firebase Storage or local
    # Store metadata in MongoDB
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Smooth vertical scrolling with snap. Videos autoplay/pause.
- **What Users Could Do:** Scroll through feed. Click "Like" (toggles state). Share button works.

**Manual Input Required:** ✅ YES
- Record/upload sample videos for testing
- Tag videos with GPS coordinates
- Add captions and user info

---

#### **Sub-phase 1.4: Dashboard & Quest UI** ✅ PARTIALLY DONE

**Status:** ✅ **60% COMPLETE** - UI exists, logic incomplete

**What Was Built:**
- ✅ `templates/dashboard.html` - User dashboard page
- ✅ `templates/quests.html` - Quest browsing page
- ✅ `static/js/dashboard.js` - Dashboard frontend
- ✅ `static/js/quests.js` - Quest browsing
- ✅ Quest templates in `routes/quest_routes.py`

**What's Working:**
- ✅ Dashboard layout with stats cards
- ✅ Quest listing with categories
- ✅ Quest details modal
- ✅ Quest search and filters

**What's Missing:**
- ❌ Real XP calculation and display
- ❌ Badge awarding system
- ❌ Leaderboard table with real data
- ❌ Progress bars for badges
- ❌ Streak counter

**🧪 Current Test Results:**
- **What's Working:** All layouts final. CSS animations for progress bars (static).
- **What Users Can Do:** View "fake" profile. See list of predefined quests.

**What's Needed to Complete:**

**1. Add XP calculation in `models/user.py`:**
```python
def award_xp(user_id, quest_type, amount):
    """Award XP and check for badge unlocks"""
    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {
            '$inc': {'points': amount},
            '$push': {'xp_history': {
                'amount': amount,
                'quest_type': quest_type,
                'timestamp': datetime.utcnow()
            }}
        }
    )
    # Check for badge unlocks
    check_badges(user_id)
```

**2. Create `routes/leaderboard_routes.py`:**
```python
@leaderboard_bp.route('/global', methods=['GET'])
def get_global_leaderboard():
    users = users_collection.find().sort('points', -1).limit(50)
    return jsonify({'leaderboard': list(users)})
```

**Manual Input Required:** ❌ NO - Automated after quest completion

---

### **Phase 2: The Core Backend (Flask & MongoDB)** ✅ MOSTLY DONE

**Goal:** Replace hardcoded data with dynamic templates and database.

---

#### **Sub-phase 2.1: Flask Setup & Auth** ✅ COMPLETE

**Status:** ✅ **95% COMPLETE** - Fully functional

**What Was Built:**
- ✅ `app.py` - Flask app with all blueprints
- ✅ `config.py` - Configuration management
- ✅ `models/user.py` - User model with MongoDB
- ✅ `routes/auth_routes.py` - Login/register routes
- ✅ JWT token generation and validation
- ✅ Password hashing with bcrypt

**🧪 Test Results:**
- **What's Working:** Users created in MongoDB. Passwords hashed. Sessions work.
- **What Users Can Do:** Create real account. Logout and login. Dashboard shows their name.

**What's Missing:**
- ⚠️ OTP verification (Twilio not installed)
- ⚠️ Email verification (optional)

---

#### **Sub-phase 2.2: Location API & Map Data** ⚠️ PARTIAL

**Status:** ⚠️ **40% COMPLETE** - Quest locations exist, map integration missing

**Current State:**
- ✅ Quest model has location coordinates
- ✅ Quests can be queried by location
- ❌ No `/api/locations` endpoint
- ❌ Leaflet.js not pulling from database

**What's Needed:**

**1. Create `/api/locations` endpoint in `routes/quest_routes.py`:**
```python
@quest_bp.route('/locations', methods=['GET'])
def get_quest_locations():
    """Get all quest locations for map display"""
    quests = quests_collection.find({'status': 'active'})
    
    locations = []
    for quest in quests:
        if quest.get('location'):
            locations.append({
                'name': quest['title'],
                'coords': quest['location']['coordinates'],
                'quests_count': 1,
                'category': quest['category']
            })
    
    return jsonify({'locations': locations})
```

**2. Update Leaflet JS to fetch from API:**
```javascript
// In heatmap.js
async function loadQuestMarkers() {
    const response = await axios.get(`${API_BASE_URL}/api/quests/locations`);
    const locations = response.data.locations;
    
    locations.forEach(loc => {
        L.marker([loc.coords[1], loc.coords[0]])
            .addTo(map)
            .bindPopup(`<b>${loc.name}</b><br>${loc.quests_count} Quests`);
    });
}
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Pins on map coming from database.
- **What Users Could Do:** Add location in MongoDB manually, refresh page makes it appear.

**Manual Input Required:** ✅ YES
- Add quest locations to database with coordinates

---

#### **Sub-phase 2.3: "Should You Go?" Dashboard** ❌ NOT STARTED (NEW)

**Status:** ❌ **NOT IMPLEMENTED** - Missing from original roadmap

**What's Needed:**

**1. Create location detail page `templates/location_detail.html`:**
```html
<div class="location-detail">
    <h1 id="location-name"></h1>
    
    <!-- Weather Card -->
    <div class="weather-card">
        <p id="current-weather"></p>
        <p id="temperature"></p>
    </div>
    
    <!-- Crowd Level -->
    <div class="crowd-meter">
        <div class="meter-bar" id="crowd-bar"></div>
        <p id="crowd-text"></p>
    </div>
    
    <!-- AI Recommendation -->
    <div class="ai-recommendation">
        <h3>Should You Go?</h3>
        <p id="ai-recommendation"></p>
    </div>
    
    <!-- Related Reels -->
    <div class="related-reels">
        <h3>Recent Videos from Here</h3>
        <div id="reel-thumbnails"></div>
    </div>
</div>
```

**2. Create API endpoint in `routes/ai_routes.py`:**
```python
@ai_bp.route('/should-you-go', methods=['POST'])
def should_you_go():
    data = request.get_json()
    location = data['location']
    coords = data['coords']
    
    # Fetch weather
    weather = get_current_weather(coords['lat'], coords['lng'])
    
    # Fetch crowd data
    crowd = get_crowd_level(location)
    
    # Fetch opening hours
    hours = get_place_hours(location)
    
    # Generate AI recommendation
    prompt = f"""
    Location: {location}
    Current weather: {weather['description']}, {weather['temp']}°C
    Crowd level: {crowd['density']} ({crowd['percentage']}% full)
    Status: {hours['status']}
    
    Should the traveler visit now? Give a clear YES/NO with brief reasoning.
    """
    
    recommendation = generate_gemini_recommendation(prompt)
    
    return jsonify({
        'weather': weather,
        'crowd': crowd,
        'hours': hours,
        'recommendation': recommendation
    })
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Location page loads with real-time data. AI generates recommendation.
- **What Users Could Do:** Click "Taj Mahal" pin → See "Should You Go? ✅ Yes! Clear weather, low crowds".

**Manual Input Required:** ❌ NO - Fully API-driven

---

### **Phase 3: The Video Engine (Reels Integration)** ❌ NOT STARTED

**Goal:** Enable users to upload content and view geo-tagged videos.

---

#### **Sub-phase 3.1: Video Upload & Storage** ❌ NOT STARTED

**Status:** ❌ **0% COMPLETE**

**What's Needed:**

**1. Set up Firebase Storage or AWS S3:**
```python
# In services/video_service.py
from firebase_admin import storage

def upload_video(video_file, user_id):
    bucket = storage.bucket()
    blob = bucket.blob(f'videos/{user_id}/{video_file.filename}')
    blob.upload_from_file(video_file)
    return blob.public_url
```

**2. Create video model in `models/video.py`:**
```python
videos_collection = db.videos

def create_video(user_id, video_url, caption, location):
    video = {
        'user_id': ObjectId(user_id),
        'video_url': video_url,
        'caption': caption,
        'location': {
            'type': 'Point',
            'coordinates': [location['lng'], location['lat']]
        },
        'likes': 0,
        'views': 0,
        'created_at': datetime.utcnow()
    }
    return videos_collection.insert_one(video)
```

**3. Create upload route in `routes/video_routes.py`:**
```python
@video_bp.route('/upload', methods=['POST'])
@token_required
def upload_reel(current_user):
    video = request.files['video']
    caption = request.form.get('caption')
    lat = float(request.form.get('lat'))
    lng = float(request.form.get('lng'))
    
    # Upload to storage
    video_url = upload_video(video, current_user['_id'])
    
    # Save metadata
    create_video(
        user_id=current_user['_id'],
        video_url=video_url,
        caption=caption,
        location={'lat': lat, 'lng': lng}
    )
    
    # Award XP
    award_xp(current_user['_id'], 'video_upload', 20)
    
    return jsonify({'message': 'Video uploaded', 'xp': 20})
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Files saved to Firebase/S3. Database records the path.
- **What Users Could Do:** Click "+", select video file, add caption, hit upload.

**Manual Input Required:** ✅ YES
- Users upload their own videos
- System auto-detects GPS from device

---

#### **Sub-phase 3.2: Geo-Reel Feed** ❌ NOT STARTED

**Status:** ❌ **0% COMPLETE**

**What's Needed:**

**1. Create API endpoint to fetch videos by location:**
```python
@video_bp.route('/nearby', methods=['GET'])
def get_nearby_videos():
    lat = float(request.args.get('lat'))
    lng = float(request.args.get('lng'))
    radius = int(request.args.get('radius', 500))  # meters
    
    # MongoDB geospatial query
    videos = videos_collection.find({
        'location': {
            '$near': {
                '$geometry': {
                    'type': 'Point',
                    'coordinates': [lng, lat]
                },
                '$maxDistance': radius
            }
        }
    }).sort('created_at', -1).limit(20)
    
    return jsonify({'videos': list(videos)})
```

**2. Update Reel UI to load from API:**
```javascript
// In reels.js
async function loadReels(lat, lng) {
    const response = await axios.get(
        `${API_BASE_URL}/api/videos/nearby?lat=${lat}&lng=${lng}`
    );
    
    const reelsContainer = document.querySelector('.reel-container');
    response.data.videos.forEach(video => {
        const reelHTML = `
            <div class="reel-item h-screen snap-start">
                <video src="${video.video_url}" loop></video>
                <p>${video.caption}</p>
            </div>
        `;
        reelsContainer.innerHTML += reelHTML;
    });
}
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Reel feed is dynamic. Shows only nearby videos.
- **What Users Could Do:** Click on "Jaipur" on map. See only videos tagged in Jaipur.

**Manual Input Required:** ✅ YES
- Users upload videos with GPS tags

---

### **Phase 4: Gamification & AI Verification** ⚠️ PARTIAL

**Goal:** Implement "Play to Earn" mechanics and automated verification.

---

#### **Sub-phase 4.1: Quest System & Evidence Upload** ✅ 70% DONE

**Status:** ✅ **70% COMPLETE** - Quest creation done, submission partial

**What Was Built:**
- ✅ Quest templates in `routes/quest_routes.py`
- ✅ Quest model in `models/quest.py`
- ✅ Quest listing API
- ✅ Quest details API

**What's Missing:**
- ⚠️ Photo upload for quest completion
- ⚠️ "Submit Proof" UI component
- ⚠️ Quest status tracking (pending/approved/rejected)

**What's Needed:**

**1. Add submission endpoint in `routes/quest_routes.py`:**
```python
@quest_bp.route('/<quest_id>/submit', methods=['POST'])
@token_required
def submit_quest_completion(current_user, quest_id):
    photo = request.files['photo']
    lat = float(request.form.get('lat'))
    lng = float(request.form.get('lng'))
    
    # Save photo temporarily
    photo_path = f'uploads/{current_user["_id"]}/{quest_id}.jpg'
    photo.save(photo_path)
    
    # Create submission record
    submission = {
        'quest_id': ObjectId(quest_id),
        'user_id': ObjectId(current_user['_id']),
        'photo_url': photo_path,
        'location': {'lat': lat, 'lng': lng},
        'status': 'pending',
        'created_at': datetime.utcnow()
    }
    
    db.quest_submissions.insert_one(submission)
    
    # Trigger AI verification
    verify_quest_image(photo_path, quest_id)
    
    return jsonify({'message': 'Submitted for verification'})
```

**2. Add "Submit Proof" UI in `templates/quests.html`:**
```html
<div id="submit-modal" class="modal hidden">
    <h3>Complete Quest</h3>
    <form id="submit-form">
        <input type="file" accept="image/*" capture="camera" required>
        <button type="submit">Submit Photo</button>
    </form>
</div>
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Submission flow works. Image saved.
- **What Users Could Do:** Submit photo of clean beach. See it in "Pending" history.

**Manual Input Required:** ✅ YES
- Users take photos of completed quests

---

#### **Sub-phase 4.2: AI Integration (Trash Detection)** ⚠️ 20% DONE

**Status:** ⚠️ **20% COMPLETE** - API endpoint exists, model not trained

**Current State:**
- ✅ `/ai/verify-quest` endpoint exists in `routes/ai_routes.py`
- ✅ Gemini API integration in `services/gemini_service.py`
- ❌ TensorFlow Lite not installed
- ❌ MobileNet model not trained
- ❌ OpenCV not installed
- ❌ Image preprocessing not implemented

**What's Needed:**

**1. Install required libraries:**
```bash
pip install tensorflow opencv-python pillow
```

**2. Train trash detection model:**
```python
# In utils/ai_model.py
import tensorflow as tf
from tensorflow import keras

def train_trash_detector():
    # Load MobileNet base
    base_model = keras.applications.MobileNetV2(
        weights='imagenet',
        include_top=False
    )
    
    # Add custom classification head
    model = keras.Sequential([
        base_model,
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.Dense(1, activation='sigmoid')  # Binary: trash/clean
    ])
    
    # Train on 30-50 images
    # ...
    
    model.save('models/trash_detector.h5')
```

**3. Implement verification function:**
```python
# In services/gemini_service.py
import cv2
import tensorflow as tf

def verify_quest_image(image_path, quest_id):
    # Load image
    img = cv2.imread(image_path)
    
    # Preprocess
    img = cv2.resize(img, (224, 224))
    img = img / 255.0
    
    # Load model
    model = tf.keras.models.load_model('models/trash_detector.h5')
    
    # Predict
    prediction = model.predict(img[None, ...])[0][0]
    
    is_clean = prediction > 0.7  # 70% threshold
    
    if is_clean:
        # Award XP
        award_xp(user_id, 'cleanup_quest', 50)
        return {'verified': True, 'xp': 50}
    else:
        return {'verified': False, 'reason': 'Not enough evidence'}
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Backend automatically approves/rejects photos.
- **What Users Could Do:** Upload photo of trash. System says "Verified! +50 XP". Dashboard XP updates.

**Manual Input Required:** ❌ NO - Fully automated
- **But:** Need 30-50 training images initially (one-time setup)

---

#### **Sub-phase 4.3: Leaderboards & Badges** ⚠️ 30% DONE

**Status:** ⚠️ **30% COMPLETE** - Data model exists, logic incomplete

**Current State:**
- ✅ User model has `points` field
- ✅ User model has `completed_quests` counter
- ❌ No badge checking logic
- ❌ No leaderboard API
- ❌ No badge UI display

**What's Needed:**

**1. Create badge checking function in `models/user.py`:**
```python
BADGES = {
    'clean_champion': {'name': 'Clean Champion', 'requirement': 5, 'type': 'cleanup'},
    'culture_keeper': {'name': 'Culture Keeper', 'requirement': 3, 'type': 'folklore'},
    'heritage_hero': {'name': 'Heritage Hero', 'requirement': 5, 'type': 'heritage'},
    'streak_master': {'name': 'Streak Master', 'requirement': 7, 'type': 'streak'}
}

def check_badges(user_id):
    user = find_user_by_id(user_id)
    
    # Check cleanup quests
    cleanup_count = db.quest_submissions.count_documents({
        'user_id': ObjectId(user_id),
        'status': 'approved',
        'quest_type': 'cleanup'
    })
    
    if cleanup_count >= 5 and 'clean_champion' not in user.get('badges', []):
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$push': {'badges': 'clean_champion'}}
        )
        # Send notification
        send_badge_notification(user_id, 'clean_champion')
```

**2. Create leaderboard routes in `routes/leaderboard_routes.py`:**
```python
leaderboard_bp = Blueprint('leaderboard', __name__)

@leaderboard_bp.route('/global', methods=['GET'])
def get_global_leaderboard():
    limit = int(request.args.get('limit', 50))
    
    users = users_collection.find(
        {},
        {'name': 1, 'points': 1, 'badges': 1, 'profile_image': 1}
    ).sort('points', -1).limit(limit)
    
    leaderboard = []
    for rank, user in enumerate(users, 1):
        leaderboard.append({
            'rank': rank,
            'name': user['name'],
            'points': user['points'],
            'badges': len(user.get('badges', []))
        })
    
    return jsonify({'leaderboard': leaderboard})

@leaderboard_bp.route('/destination/<destination>', methods=['GET'])
def get_destination_leaderboard(destination):
    # Filter by destination
    # ...
```

**3. Update dashboard to show badges:**
```javascript
// In dashboard.js
async function loadBadges() {
    const response = await axios.get(`${API_BASE_URL}/api/users/profile/${userId}`);
    const badges = response.data.badges || [];
    
    const badgeContainer = document.getElementById('badges');
    badges.forEach(badgeId => {
        const badgeHTML = `
            <div class="badge">
                <img src="/static/images/badges/${badgeId}.png">
                <p>${BADGES[badgeId].name}</p>
            </div>
        `;
        badgeContainer.innerHTML += badgeHTML;
    });
}
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Real-time sorting of users by XP.
- **What Users Could Do:** Complete quest, watch name move up leaderboard table.

**Manual Input Required:** ❌ NO - Automated after quest completion

---

### **Phase 5: Real-Time Intelligence & Chat** ⚠️ PARTIAL

**Goal:** Add "Live" feel to the application.

---

#### **Sub-phase 5.1: Real-Time Chat** ✅ 40% DONE

**Status:** ✅ **40% COMPLETE** - Routes exist, Socket.IO not configured

**Current State:**
- ✅ Chat routes in `routes/chat_routes.py`
- ✅ Chat message model in `models/chat.py`
- ✅ Chat UI in `templates/chat.html`
- ✅ Flask-SocketIO imported in `app.py`
- ❌ Socket events not configured
- ❌ Real-time messaging not working

**What's Needed:**

**1. Configure Socket.IO in `app.py`:**
```python
from flask_socketio import SocketIO, emit, join_room

socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    emit('message', {
        'user': 'System',
        'message': f"{data['username']} joined the room"
    }, room=room)

@socketio.on('send_message')
def handle_message(data):
    room = data['room']
    
    # Save to database
    save_chat_message(data['user_id'], room, data['message'])
    
    # Broadcast to room
    emit('message', {
        'user': data['username'],
        'message': data['message'],
        'timestamp': datetime.utcnow().isoformat()
    }, room=room)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

**2. Update chat.js to use Socket.IO:**
```javascript
// In chat.js
const socket = io('http://localhost:5000');

socket.emit('join', {
    room: conversationId,
    username: currentUser.name
});

socket.on('message', (data) => {
    appendMessage(data);
});

function sendMessage() {
    const message = document.getElementById('message-input').value;
    socket.emit('send_message', {
        room: conversationId,
        user_id: currentUser.id,
        username: currentUser.name,
        message: message
    });
}
```

**🧪 Test Step (After Implementation):**
- **What Would Work:** Instant messaging without page refresh.
- **What Users Could Do:** User A sends "Is it raining?", User B sees instantly.

**Manual Input Required:** ✅ YES
- Users send messages to test

---

#### **Sub-phase 5.2: Heatmaps & Weather API** ✅ 80% DONE

**Status:** ✅ **80% COMPLETE** - Working with minor improvements needed

**Current State:**
- ✅ OpenWeatherMap API integrated in `services/weather_service.py`
- ✅ Heatmap generation via Gemini in `services/gemini_service.py`
- ✅ Canvas visualization in `static/js/heatmap.js`
- ✅ Heatmap UI in `templates/heatmap.html`
- ⚠️ Gemini API model version issue
- ⚠️ Holiday API failed

**What's Working:**
- ✅ User enters location and date
- ✅ Gemini generates 10x10 crowd density grid
- ✅ Canvas renders color-coded heatmap
- ✅ Weather data fetched (when API works)

**What's Missing:**
- ❌ Fix Gemini API model version (use `gemini-1.5-flash` or `gemini-pro`)
- ❌ Fix or replace Holiday API
- ❌ Overlay heatmap on Leaflet map instead of canvas
- ❌ Real-time updates based on user check-ins

**What's Needed to Complete:**

**1. Fix Gemini model in `services/gemini_service.py`:**
```python
# Change this line:
model = genai.GenerativeModel('gemini-1.5-flash')  # Currently working model
# Instead of:
model = genai.GenerativeModel('gemini-1.5-flash')  # Old model causing error
```

**2. Add Leaflet heatmap overlay:**
```javascript
// In heatmap.js
import 'leaflet-heatmap';

const heatmapLayer = L.heatLayer(heatmapData, {
    radius: 25,
    blur: 35,
    maxZoom: 17,
}).addTo(map);
```

**🧪 Test Step (Current):**
- **What Works:** Map shows red/green zones on canvas.
- **What Users Can Do:** See "Taj Mahal" is "Crowded" (Red), choose elsewhere.

**Manual Input Required:** ❌ NO - API-driven

---

### **Phase 6: Final Integration & Polish** ❌ NOT STARTED

**Goal:** Tying it all together for demo.

**Checklist:**
- ❌ Fix all API keys and model versions
- ❌ Test complete user flow end-to-end
- ❌ Add loading states and error handling
- ❌ Optimize images and assets
- ❌ Add analytics tracking
- ❌ Create demo data seed script
- ❌ Deploy to Heroku/Vercel/Render
- ❌ Create video demo
- ❌ Write final documentation

---

## 📝 Summary: What Users Can Do by Phase

| Phase | User Experience | Implementation Status |
|-------|----------------|----------------------|
| **Phase 1** | Clickable prototype with static data | ⚠️ **60% Done** |
| **Phase 2** | Account creation, personalized dashboard | ✅ **90% Done** |
| **Phase 3** | Watch/upload location videos | ❌ **0% Done** |
| **Phase 4** | Complete quests, earn XP, see ranks | ⚠️ **50% Done** |
| **Phase 5** | Real-time chat, live heatmaps | ⚠️ **60% Done** |
| **Phase 6** | Polished, production-ready app | ❌ **0% Done** |

---

## 🎯 Priority Action Plan

### 🔴 CRITICAL (Fix Before Demo)
1. ✅ Fix Gemini API model version
2. ✅ Install TensorFlow Lite and OpenCV
3. ✅ Complete quest submission flow
4. ✅ Implement XP awarding on completion
5. ✅ Add Leaflet.js interactive map

### 🟡 HIGH PRIORITY (Core MVP)
6. ✅ Build leaderboard API and UI
7. ✅ Implement badge checking system
8. ✅ Configure Socket.IO for real-time chat
9. ✅ Train basic trash detection model
10. ✅ Add "Should You Go?" feature

### 🟢 MEDIUM PRIORITY (Polish)
11. ❌ Video reel upload system
12. ❌ Geo-tagged video feed
13. ❌ Cultural storytelling layer
14. ❌ Trash density heatmap
15. ❌ Point economy for chat

### 🔵 LOW PRIORITY (Future)
16. ❌ Daily motivation feature
17. ❌ Advanced AI recommendations
18. ❌ Blockchain rewards
19. ❌ AR features
20. ❌ Mobile apps

---

## ✅ Quick Deployment Checklist

Before launching for demo:

```bash
# 1. Install missing dependencies
pip install tensorflow opencv-python pillow flask-socketio

# 2. Fix API keys in .env
GEMINI_API_KEY=your_new_key
OPENWEATHER_API_KEY=verify_key_works

# 3. Test critical endpoints
curl http://localhost:5000/health
curl http://localhost:5000/ai/heatmap -X POST -d '{"destination":"Delhi","date":"2025-12-10"}'

# 4. Seed demo data
python seed_demo_data.py

# 5. Run server
python app.py
```

---

**Last Updated:** December 7, 2025
**Overall Completion:** ~55% MVP Complete
