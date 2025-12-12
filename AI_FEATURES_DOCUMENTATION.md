# Vaaya AI Features API Documentation

## Overview
This document describes the Gemini AI-powered endpoints in the Vaaya API.

## Base URL
```
http://127.0.0.1:5000/ai
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Generate Crowd Heatmap

Generate a 2D heatmap showing predicted crowd density for a destination.

**Endpoint:** `POST /ai/heatmap`

**Authentication:** Not required

**Request Body:**
```json
{
  "destination": "Eiffel Tower, Paris",
  "date": "2025-07-14",
  "location_coords": {
    "lat": 48.8584,
    "lng": 2.2945
  }
}
```

**Parameters:**
- `destination` (string, required): Location name
- `date` (string, required): Date in YYYY-MM-DD format
- `location_coords` (object, optional): Latitude and longitude

**Response:** `200 OK`
```json
{
  "message": "Heatmap generated successfully",
  "heatmap": {
    "destination": "Eiffel Tower, Paris",
    "date": "2025-07-14",
    "grid_size": 10,
    "heatmap": [
      [0.5, 0.6, 0.7, ...],
      [0.4, 0.8, 0.6, ...],
      ...
    ],
    "hotspots": [
      {
        "area": "Tower Entrance",
        "coords": {"x": 5, "y": 5},
        "density": 0.95,
        "description": "Main entrance, peak crowd area"
      }
    ],
    "peak_times": ["10:00-12:00", "15:00-18:00"],
    "summary": "High tourist activity expected due to Bastille Day celebrations"
  }
}
```

**Heatmap Grid:**
- 10x10 grid of float values (0.0 to 1.0)
- 0.0 = No crowd
- 0.3-0.5 = Low crowd
- 0.5-0.7 = Medium crowd
- 0.7-0.9 = High crowd
- 0.9-1.0 = Very high crowd

**Example Usage:**
```bash
curl -X POST http://127.0.0.1:5000/ai/heatmap \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Times Square, New York",
    "date": "2025-12-31",
    "location_coords": {"lat": 40.7580, "lng": -73.9855}
  }'
```

---

### 2. Verify Quest Image

Use Gemini Vision AI to verify quest completion through image analysis.

**Endpoint:** `POST /ai/verify-quest`

**Authentication:** Required (JWT token)

**Request Body (JSON):**
```json
{
  "quest_id": "optional_quest_id",
  "quest_type": "trash_cleanup",
  "location": "Central Park",
  "description": "Clean up 5kg of trash from park",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}
```

**Request Body (Multipart Form-Data):**
```
quest_type: trash_cleanup
location: Central Park
description: Clean up trash
image: <file upload>
```

**Parameters:**
- `quest_type` (string, required): One of:
  - `trash_cleanup` - Environmental cleanup verification
  - `cultural_visit` - Cultural site visit verification
  - `local_food` - Local cuisine experience verification
- `location` (string, optional): Expected location
- `description` (string, optional): Quest description
- `image` (string/file, required): Base64 encoded image or file upload
- `quest_id` (string, optional): Quest ID to update in database

**Quest Types & Verification Criteria:**

**Trash Cleanup:**
- Trash bags, cleaning equipment visible
- Evidence of cleaning activity
- Outdoor/public setting
- Authentic photo (not stock)

**Cultural Visit:**
- Recognizable cultural landmark
- User presence evidence
- Recent photo quality
- Location match

**Local Food:**
- Local/traditional food visible
- Restaurant or street food setting
- Authentic presentation

**Response:** `200 OK`
```json
{
  "message": "Quest verification complete",
  "verification": {
    "verified": true,
    "authenticity_score": 0.87,
    "location_match": true,
    "quest_completed": true,
    "details": {
      "evidence_found": true,
      "quality_check": true,
      "appears_genuine": true,
      "setting_appropriate": true
    },
    "confidence": 0.92,
    "reason": "Image shows clear evidence of trash cleanup activity with visible trash bags and outdoor setting. Photo appears authentic and recent.",
    "suggestions": []
  },
  "quest_id": "quest_123"
}
```

**Verification Fields:**
- `verified` (boolean): Overall verification result
- `authenticity_score` (float 0-1): How authentic the image appears
- `location_match` (boolean/null): If location matches expectation
- `quest_completed` (boolean): Whether quest requirements met
- `confidence` (float 0-1): AI confidence in verification
- `reason` (string): Explanation of decision
- `suggestions` (array): Improvement suggestions if not verified

**Example Usage:**
```python
import requests
import base64

# Read and encode image
with open('cleanup_photo.jpg', 'rb') as f:
    img_base64 = base64.b64encode(f.read()).decode('utf-8')

response = requests.post(
    'http://127.0.0.1:5000/ai/verify-quest',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'quest_type': 'trash_cleanup',
        'location': 'Beach Park',
        'image': f'data:image/jpeg;base64,{img_base64}'
    }
)
```

---

### 3. Tourism Chatbot

AI-powered tourism assistant with context awareness.

**Endpoint:** `POST /ai/chat`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "message": "What are the best places to visit in Paris?",
  "trip_id": "trip_id_here",
  "include_stories": true
}
```

**Parameters:**
- `message` (string, required): User's question or message
- `trip_id` (string, optional): Include trip context in response
- `include_stories` (boolean, optional): Include local stories from database

**Context Features:**
- User's planned trips
- Location-specific information
- Local stories and cultural insights
- Crowd predictions
- User preferences and interests

**Response:** `200 OK`
```json
{
  "message": "Paris has so many amazing places! 🗼 For authentic experiences away from crowds:\n\n1. **Le Marais** - Historic district with charming cafes and boutiques. Best visited early morning.\n\n2. **Canal Saint-Martin** - Local favorite for picnics and walks, especially weekends.\n\n3. **Musée Rodin** - Beautiful gardens, less crowded than Louvre.\n\nBased on your trip (July 1-5), I'd recommend visiting Versailles on a weekday morning to avoid peak crowds. July 14 is Bastille Day - expect very high crowds at major landmarks!\n\nWant specific recommendations for your interests? 😊",
  "context_used": true,
  "success": true
}
```

**Example Conversations:**

**Simple Question:**
```json
{
  "message": "Is it safe to drink tap water in Paris?"
}
// Response: "Yes! Tap water in Paris is perfectly safe..."
```

**With Trip Context:**
```json
{
  "message": "What should I do on my first day?",
  "trip_id": "abc123"
}
// Response: Uses trip destination, dates, preferences
```

**Example Usage:**
```bash
curl -X POST http://127.0.0.1:5000/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Recommend vegetarian restaurants in Tokyo",
    "trip_id": "trip_xyz"
  }'
```

---

### 4. Generate AI Itinerary

Generate a complete trip itinerary based on preferences.

**Endpoint:** `POST /ai/generate-itinerary`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "destination": "Kyoto, Japan",
  "duration_days": 5,
  "preferences": {
    "interests": ["culture", "temples", "food", "nature"],
    "budget": "medium",
    "pace": "relaxed"
  }
}
```

**Parameters:**
- `destination` (string, required): Destination name
- `duration_days` (integer, required): 1-30 days
- `preferences` (object, optional):
  - `interests` (array): e.g., culture, food, nature, adventure
  - `budget` (string): low, medium, high
  - `pace` (string): relaxed, moderate, fast

**Response:** `200 OK`
```json
{
  "message": "Itinerary generated successfully",
  "itinerary": {
    "destination": "Kyoto, Japan",
    "duration_days": 5,
    "itinerary": [
      {
        "day": 1,
        "title": "Arrival & Eastern Kyoto",
        "morning": "Visit Kiyomizu-dera Temple, explore traditional streets",
        "afternoon": "Walk through Gion district, possible geisha spotting",
        "evening": "Dinner at Pontocho Alley, traditional kaiseki",
        "dining": "Pontocho Alley for authentic Japanese cuisine",
        "crowd_level": "medium",
        "insider_tip": "Visit Kiyomizu-dera before 8 AM to avoid crowds"
      },
      {
        "day": 2,
        "title": "Arashiyama Bamboo & Temples",
        "morning": "Arashiyama Bamboo Grove at sunrise",
        "afternoon": "Tenryu-ji Temple and gardens, monkey park",
        "evening": "Togetsu-kyo Bridge sunset viewing",
        "dining": "Yoshikawa for traditional tempura",
        "crowd_level": "high",
        "insider_tip": "Take the scenic train to Arashiyama"
      }
    ],
    "general_tips": [
      "Purchase a Japan Rail Pass before arrival",
      "Respect temple etiquette - remove shoes, no photos inside",
      "Learn basic Japanese phrases - locals appreciate the effort"
    ]
  }
}
```

**Example Usage:**
```bash
curl -X POST http://127.0.0.1:5000/ai/generate-itinerary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Barcelona, Spain",
    "duration_days": 4,
    "preferences": {
      "interests": ["architecture", "food", "beaches"],
      "budget": "medium",
      "pace": "moderate"
    }
  }'
```

---

### 5. AI Health Check

Check if Gemini API is configured and available.

**Endpoint:** `GET /ai/health`

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "gemini_configured": true,
  "endpoints": [
    "POST /ai/heatmap - Generate crowd heatmap",
    "POST /ai/verify-quest - Verify quest with image",
    "POST /ai/chat - Tourism chatbot",
    "POST /ai/generate-itinerary - AI itinerary generator"
  ]
}
```

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request**
```json
{
  "error": "destination and date are required"
}
```

**401 Unauthorized**
```json
{
  "error": "Authentication token is missing"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to generate heatmap: API quota exceeded"
}
```

---

## Rate Limits

Gemini API has rate limits:
- Free tier: 60 requests per minute
- Paid tier: Higher limits available

Consider implementing caching for heatmap data and common chatbot queries.

---

## Best Practices

### Heatmap Generation
- Cache heatmap results for same destination+date
- Pre-generate heatmaps for popular destinations
- Use fallback data when API fails

### Quest Verification
- Guide users to take clear, well-lit photos
- Encourage before/after photos for cleanup quests
- Provide example photos showing good verification images

### Chatbot
- Store conversation history for context
- Include trip details when available
- Limit message length to avoid token limits

### Itinerary Generation
- Validate duration_days (1-30)
- Combine with crowd predictions for better timing
- Allow users to customize generated itineraries

---

## Setup Requirements

### Install Dependencies
```bash
pip install google-generativeai pillow
```

### Configure Gemini API Key
Add to `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Get API Key
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Add to `.env` file

---

## Example Integration

```python
import requests

BASE_URL = "http://127.0.0.1:5000"

# 1. Get auth token
auth_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "user@example.com",
    "password": "password123"
})
token = auth_response.json()['token']

# 2. Generate heatmap
heatmap = requests.post(f"{BASE_URL}/ai/heatmap", json={
    "destination": "Louvre Museum, Paris",
    "date": "2025-08-15"
})
print("Crowd density:", heatmap.json()['heatmap']['summary'])

# 3. Ask chatbot
chat = requests.post(
    f"{BASE_URL}/ai/chat",
    headers={"Authorization": f"Bearer {token}"},
    json={"message": "Best time to visit Louvre?"}
)
print("AI says:", chat.json()['message'])

# 4. Verify quest
with open('cleanup_photo.jpg', 'rb') as f:
    verification = requests.post(
        f"{BASE_URL}/ai/verify-quest",
        headers={"Authorization": f"Bearer {token}"},
        files={'image': f},
        data={'quest_type': 'trash_cleanup'}
    )
print("Verified:", verification.json()['verification']['verified'])
```

---

## Testing

Run the test suite:
```bash
python test_ai_features.py
```

This tests all AI endpoints with sample data.

---

## Support

For issues or questions:
- Check logs in `logs/` directory
- Verify Gemini API key is valid
- Check API quota limits
- Review error messages for details
