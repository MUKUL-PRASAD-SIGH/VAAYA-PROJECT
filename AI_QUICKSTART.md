# Vaaya - AI Features Quick Start Guide

## 🚀 What's New: Gemini AI Integration

Your Vaaya API now includes powerful AI features powered by Google Gemini:

1. **🗺️ Crowd Heatmap Generator** - Predict crowd density for any destination
2. **✅ Quest Image Verification** - AI validates trash cleanup and quest photos
3. **💬 Tourism Chatbot** - Context-aware travel assistant
4. **📅 AI Itinerary Generator** - Create personalized trip plans

---

## 📦 Installation

### 1. Install New Dependencies

```bash
pip install google-generativeai pillow
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### 2. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key" → "Create API key"
3. Copy your API key

### 3. Configure Environment

Add to your `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## ✅ Verify Installation

Run the test script:
```bash
python test_ai_features.py
```

Expected output:
```
TESTING GEMINI AI FEATURES
1. Checking AI service health... ✓
2. Testing Heatmap Generation... ✓
3. Testing Quest Verification... ✓
4. Testing Chatbot... ✓
5. Testing Itinerary Generator... ✓
```

---

## 🎯 Quick Examples

### 1. Generate Crowd Heatmap

```bash
curl -X POST http://127.0.0.1:5000/ai/heatmap \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Eiffel Tower, Paris",
    "date": "2025-07-14",
    "location_coords": {"lat": 48.8584, "lng": 2.2945}
  }'
```

**Returns:**
- 10x10 grid of crowd density values (0.0 - 1.0)
- Hotspot locations with descriptions
- Peak time recommendations
- AI-generated crowd summary

**Use Cases:**
- Show heatmap overlay on maps
- Recommend best times to visit
- Route planning around crowds
- Event crowd management

---

### 2. Verify Quest Completion

```python
import requests
import base64

# Read image file
with open('cleanup_photo.jpg', 'rb') as f:
    img_base64 = base64.b64encode(f.read()).decode('utf-8')

# Verify quest
response = requests.post(
    'http://127.0.0.1:5000/ai/verify-quest',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'quest_type': 'trash_cleanup',
        'location': 'Beach Park',
        'description': 'Clean up beach area',
        'image': f'data:image/jpeg;base64,{img_base64}'
    }
)

result = response.json()
print(f"Verified: {result['verification']['verified']}")
print(f"Authenticity: {result['verification']['authenticity_score']}")
print(f"Reason: {result['verification']['reason']}")
```

**Quest Types:**
- `trash_cleanup` - Environmental cleanup validation
- `cultural_visit` - Cultural site visit proof
- `local_food` - Local cuisine experience

**Returns:**
- Verified: true/false
- Authenticity score (0-1)
- Confidence level
- Detailed explanation
- Improvement suggestions

---

### 3. Tourism Chatbot

```bash
curl -X POST http://127.0.0.1:5000/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the best places to visit in Paris?",
    "trip_id": "optional_trip_id",
    "include_stories": true
  }'
```

**Features:**
- Context-aware responses based on user's trip
- Incorporates local stories from database
- Crowd prediction integration
- Personalized recommendations
- Conversation history support

**Example Conversation:**
```
User: "Best time to visit Louvre?"
Bot: "The Louvre is least crowded Tuesday-Thursday mornings 
      (9-11 AM). Based on your July 5th trip, I'd recommend 
      arriving right at opening. Book tickets online to skip 
      the line! 🎨"
```

---

### 4. Generate AI Itinerary

```python
response = requests.post(
    'http://127.0.0.1:5000/ai/generate-itinerary',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'destination': 'Kyoto, Japan',
        'duration_days': 3,
        'preferences': {
            'interests': ['culture', 'temples', 'food'],
            'budget': 'medium',
            'pace': 'relaxed'
        }
    }
)

itinerary = response.json()['itinerary']
```

**Returns Complete Day-by-Day Plan:**
- Morning/afternoon/evening activities
- Restaurant recommendations
- Crowd level predictions
- Insider tips
- Transportation suggestions

---

## 🏗️ Architecture

### New Files Added

```
whackiest-25/
├── services/
│   └── gemini_service.py          # Gemini AI integration
├── routes/
│   └── ai_routes.py                # AI endpoints
├── test_ai_features.py             # AI feature tests
└── AI_FEATURES_DOCUMENTATION.md    # Complete API docs
```

### Updated Files

```
app.py                  # Registered AI blueprint
config.py              # Added GEMINI_API_KEY
.env                   # Added GEMINI_API_KEY
requirements.txt       # Already had google-generativeai
```

---

## 🔧 Configuration

### Environment Variables

```env
# Required for AI features
GEMINI_API_KEY=your_key_here

# Existing settings (still needed)
MONGO_URI=mongodb+srv://...
JWT_SECRET_KEY=your_secret
```

### Gemini Models Used

- **gemini-pro** - Text generation (heatmap, chatbot, itinerary)
- **gemini-1.5-flash** - Vision API (quest verification)

---

## 📊 API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/ai/heatmap` | POST | No | Generate crowd heatmap |
| `/ai/verify-quest` | POST | Yes | Verify quest image |
| `/ai/chat` | POST | Yes | Tourism chatbot |
| `/ai/generate-itinerary` | POST | Yes | Create trip plan |
| `/ai/health` | GET | No | Check AI status |

---

## 🎨 Frontend Integration Examples

### Display Heatmap

```javascript
// Fetch heatmap data
const response = await fetch('http://127.0.0.1:5000/ai/heatmap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination: 'Eiffel Tower',
    date: '2025-07-14'
  })
});

const { heatmap } = await response.json();

// Render heatmap on canvas
const canvas = document.getElementById('heatmapCanvas');
const ctx = canvas.getContext('2d');
const cellSize = canvas.width / heatmap.grid_size;

heatmap.heatmap.forEach((row, y) => {
  row.forEach((value, x) => {
    // Color based on density (0.0 = green, 1.0 = red)
    const red = Math.floor(value * 255);
    const green = Math.floor((1 - value) * 255);
    ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  });
});
```

### Quest Verification UI

```javascript
// Handle image upload
const fileInput = document.getElementById('questImage');
const file = fileInput.files[0];

// Convert to base64
const reader = new FileReader();
reader.onload = async (e) => {
  const base64Image = e.target.result;
  
  // Verify quest
  const response = await fetch('http://127.0.0.1:5000/ai/verify-quest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      quest_type: 'trash_cleanup',
      image: base64Image
    })
  });
  
  const result = await response.json();
  
  if (result.verification.verified) {
    showSuccess('Quest verified! ✓');
    updatePoints(result.verification.authenticity_score * 100);
  } else {
    showError(result.verification.reason);
  }
};
reader.readAsDataURL(file);
```

### Chatbot Widget

```javascript
// Simple chat implementation
async function sendMessage(message, tripId = null) {
  const response = await fetch('http://127.0.0.1:5000/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      trip_id: tripId,
      include_stories: true
    })
  });
  
  const data = await response.json();
  return data.message;
}

// Usage
const reply = await sendMessage('Best restaurants in Paris?', userTripId);
displayChatMessage(reply);
```

---

## 🐛 Troubleshooting

### "Gemini API error: 401 Unauthorized"
- Check API key is correct in `.env`
- Verify key is active in Google AI Studio
- Ensure no extra spaces in `.env` file

### "Verification failed: Invalid image format"
- Ensure image is base64 encoded
- Include proper data URL prefix: `data:image/jpeg;base64,`
- Check image size (max 5MB recommended)

### Heatmap returns fallback data
- Normal if Gemini quota exceeded
- Fallback provides reasonable estimates
- Consider implementing caching

### Chatbot gives generic responses
- Include `trip_id` for personalized answers
- Enable `include_stories` for local context
- Ensure trip exists and belongs to user

---

## 🚀 Performance Tips

### Caching
```python
from functools import lru_cache
from datetime import datetime

@lru_cache(maxsize=100)
def get_cached_heatmap(destination, date):
    return generate_heatmap_data(destination, date)
```

### Rate Limiting
- Gemini free tier: 60 requests/minute
- Implement request queuing for high traffic
- Cache common queries (popular destinations)

### Image Optimization
```python
from PIL import Image

# Resize large images before verification
def optimize_image(image_path, max_size=(1024, 1024)):
    img = Image.open(image_path)
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    return img
```

---

## 📈 Usage Monitoring

Track AI feature usage:
```python
from models import db

# Log AI requests
db.ai_logs.insert_one({
    'user_id': user_id,
    'feature': 'heatmap',
    'destination': destination,
    'timestamp': datetime.utcnow(),
    'success': True
})

# Analytics queries
total_requests = db.ai_logs.count_documents({})
popular_destinations = db.ai_logs.aggregate([
    {'$group': {'_id': '$destination', 'count': {'$sum': 1}}},
    {'$sort': {'count': -1}},
    {'$limit': 10}
])
```

---

## 🔐 Security Best Practices

1. **API Key Protection**
   - Never commit `.env` to git
   - Use environment variables in production
   - Rotate keys periodically

2. **Image Upload Validation**
   - Check file size (max 5MB)
   - Verify file type (JPEG, PNG only)
   - Scan for malicious content

3. **Rate Limiting**
   - Implement per-user limits
   - Prevent API abuse
   - Monitor unusual patterns

---

## 📚 Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [API Rate Limits](https://ai.google.dev/pricing)
- [Vision API Guide](https://ai.google.dev/tutorials/python_quickstart)
- [Full API Documentation](./AI_FEATURES_DOCUMENTATION.md)

---

## ✅ Next Steps

1. **Get your Gemini API key** from Google AI Studio
2. **Add to `.env` file** and restart server
3. **Run tests** with `python test_ai_features.py`
4. **Integrate into frontend** using examples above
5. **Monitor usage** and implement caching

---

## 🎉 You're Ready!

Your Vaaya API now has cutting-edge AI capabilities. Start building amazing tourism experiences! 🌍✨

For questions or issues, check the logs or refer to `AI_FEATURES_DOCUMENTATION.md` for detailed API reference.
