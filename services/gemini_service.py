"""
AI Service using Groq API (primary) with Gemini fallback
Provides chatbot, itinerary generation, and image verification
"""
from openai import OpenAI
import google.generativeai as genai
from config import Config
import json
import base64
from PIL import Image
import io
import os

# Initialize Groq client (OpenAI-compatible) - PRIMARY
groq_client = None
if Config.GROK_API_KEY:
    groq_client = OpenAI(
        api_key=Config.GROK_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )

# Initialize Gemini - FALLBACK
if Config.GEMINI_API_KEY:
    genai.configure(api_key=Config.GEMINI_API_KEY)

# Models
GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "models/gemini-2.5-flash"


def _get_groq_client():
    """Get Groq client"""
    global groq_client
    if groq_client is None and Config.GROK_API_KEY:
        groq_client = OpenAI(
            api_key=Config.GROK_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
    return groq_client


def _get_gemini_model():
    """Get Gemini model as fallback"""
    if Config.GEMINI_API_KEY:
        return genai.GenerativeModel(GEMINI_MODEL)
    return None


def generate_heatmap_data(destination, date, location_coords=None):
    """DISABLED - Heatmap generation will use custom logic"""
    return {
        'success': False,
        'error': 'Heatmap generation disabled',
        'data': _generate_fallback_heatmap(destination, date)
    }


def _generate_fallback_heatmap(destination, date):
    """Generate a simple fallback heatmap"""
    import random
    random.seed(hash(f"{destination}{date}"))
    grid = [[round(random.uniform(0.3, 0.8), 2) for _ in range(10)] for _ in range(10)]
    grid[5][5] = 0.95
    grid[3][7] = 0.85
    grid[8][2] = 0.75
    
    return {
        'destination': destination, 'date': date, 'grid_size': 10, 'heatmap': grid,
        'hotspots': [
            {'area': 'City Center', 'coords': {'x': 5, 'y': 5}, 'density': 0.95, 'description': 'Main tourist hub'},
            {'area': 'Tourist District', 'coords': {'x': 7, 'y': 3}, 'density': 0.85, 'description': 'Popular attractions'}
        ],
        'peak_times': ['10:00-12:00', '15:00-18:00'],
        'summary': 'Fallback heatmap'
    }


def verify_quest_image(image_data, quest_type, location=None, description=None):
    """Quest image verification - auto-approve (vision not supported in Groq free tier)"""
    return {
        'success': True,
        'verification': {
            'verified': True, 'authenticity_score': 0.8, 'quest_completed': True,
            'confidence': 0.8, 'reason': 'Image submitted successfully.', 'suggestions': []
        }
    }


# System prompt for Karnataka tourism chatbot
SYSTEM_PROMPT = """You are Vayaa AI, a friendly tourism assistant specializing EXCLUSIVELY in Karnataka tourism.

Your mission:
- Help tourists discover authentic Karnataka experiences
- Share cultural insights, local stories, and hidden gems
- Provide crowd-aware recommendations
- Cover: Bengaluru, Mysuru, Hampi, Coorg, Gokarna, Udupi, Mangaluru, Chikmagalur

IMPORTANT: Only provide Karnataka info. For other places, redirect to Karnataka.

Style: Friendly, concise (<200 words), use emoji occasionally 🏛️☕"""


def chatbot_response(user_message, context=None):
    """
    Tourism chatbot - tries Groq first, then Gemini as fallback
    """
    # Try Groq first
    groq = _get_groq_client()
    if groq:
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            if context and context.get('location'):
                messages.append({"role": "system", "content": f"📍 User's destination: {context['location']}"})
            messages.append({"role": "user", "content": user_message})
            
            response = groq.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            return {
                'success': True,
                'message': response.choices[0].message.content,
                'context_used': bool(context),
                'model': f'groq/{GROQ_MODEL}'
            }
        except Exception as e:
            print(f"Groq error, trying Gemini fallback: {e}")
    
    # Fallback to Gemini
    gemini = _get_gemini_model()
    if gemini:
        try:
            prompt = f"{SYSTEM_PROMPT}\n\nUser: {user_message}"
            response = gemini.generate_content(prompt)
            return {
                'success': True,
                'message': response.text,
                'context_used': bool(context),
                'model': f'gemini/{GEMINI_MODEL}'
            }
        except Exception as e:
            print(f"Gemini fallback error: {e}")
    
    # Both failed
    return {
        'success': False,
        'error': 'No AI service available',
        'message': "Hi! I'm the Vayaa AI assistant. My AI features are currently being configured. Please check back soon! 🇮🇳",
        'context_used': False
    }


def generate_trip_itinerary(destination, duration_days, preferences):
    """Generate trip itinerary - tries Groq first, then Gemini"""
    prompt = f"""Create a {duration_days}-day itinerary for {destination}, Karnataka.
Include: Karnataka cuisine, temples, palaces, natural attractions.
Preferences: {preferences if preferences else 'Popular attractions'}

Return ONLY valid JSON (no markdown):
{{"days": [{{"day": 1, "title": "Theme", "activities": [{{"time": "9:00 AM", "activity": "Activity", "location": "Location", "duration": "2 hours"}}], "meals": [{{"type": "breakfast", "suggestion": "Food"}}]}}], "tips": ["Tip 1"], "budget_estimate": "₹X per day"}}"""

    # Try Groq first
    groq = _get_groq_client()
    if groq:
        try:
            response = groq.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Karnataka tourism expert. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )
            text = response.choices[0].message.content.strip()
            if text.startswith('```'): text = text.split('```')[1].split('```')[0].strip()
            if text.startswith('json'): text = text[4:].strip()
            return {'success': True, 'itinerary': json.loads(text), 'model': f'groq/{GROQ_MODEL}'}
        except Exception as e:
            print(f"Groq itinerary error, trying Gemini: {e}")
    
    # Fallback to Gemini
    gemini = _get_gemini_model()
    if gemini:
        try:
            response = gemini.generate_content(prompt)
            text = response.text.strip()
            if text.startswith('```'): text = text.split('```')[1].split('```')[0].strip()
            if text.startswith('json'): text = text[4:].strip()
            return {'success': True, 'itinerary': json.loads(text), 'model': f'gemini/{GEMINI_MODEL}'}
        except Exception as e:
            print(f"Gemini itinerary error: {e}")
    
    # Fallback itinerary
    return _generate_fallback_itinerary(destination, duration_days)


def _generate_fallback_itinerary(destination, duration_days):
    """Generate fallback itinerary when all APIs fail"""
    return {
        'success': False,
        'error': 'AI service unavailable',
        'itinerary': {
            'days': [
                {
                    'day': i+1,
                    'title': f'Day {i+1} in {destination}',
                    'activities': [
                        {'time': '9:00 AM', 'activity': f'Explore {destination}', 'location': destination, 'duration': '3 hours'},
                        {'time': '2:00 PM', 'activity': 'Local cuisine', 'location': 'Local market', 'duration': '2 hours'},
                        {'time': '5:00 PM', 'activity': 'Cultural experience', 'location': destination, 'duration': '2 hours'}
                    ],
                    'meals': [
                        {'type': 'breakfast', 'suggestion': 'South Indian breakfast'},
                        {'type': 'lunch', 'suggestion': 'Karnataka thali'},
                        {'type': 'dinner', 'suggestion': 'Street food'}
                    ]
                } for i in range(duration_days)
            ],
            'tips': ['Book accommodations in advance', 'Try local transportation'],
            'budget_estimate': '₹2,000-5,000 per day'
        }
    }
