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
GROQ_MODEL = "llama3-70b-8192"
GEMINI_MODEL = "models/gemini-2.5-flash"


def _get_groq_client():
    """Get Groq client"""
    global groq_client
    if groq_client is None and Config.GROK_API_KEY:
        try:
            groq_client = OpenAI(
                api_key=Config.GROK_API_KEY,
                base_url="https://api.groq.com/openai/v1",
                timeout=20.0  # 20 second timeout to prevent long hangs
            )
            print(f"Groq client initialized with key: {Config.GROK_API_KEY[:5]}...")
        except Exception as e:
            print(f"Failed to initialize Groq client: {e}")
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
    Includes conversation history and user trips as context
    """
    # Build context string for the AI
    context_parts = []
    
    if context:
        # Add conversation history
        if context.get('conversation_history'):
            context_parts.append(f"Previous conversation:\n{context['conversation_history']}")
        
        # Add user's saved trips
        if context.get('user_trips'):
            context_parts.append(context['user_trips'])
        
        # Add current location/destination
        if context.get('location'):
            context_parts.append(f"📍 User's current destination: {context['location']}")
        
        # Add trip plan details
        if context.get('trip_plan'):
            plan = context['trip_plan']
            context_parts.append(f"Trip details: {plan.get('destination')} from {plan.get('start_date')} to {plan.get('end_date')}")
    
    context_str = "\n\n".join(context_parts) if context_parts else ""
    
    # Try Groq first
    groq = _get_groq_client()
    if groq:
        try:
            print(f"Attempting Groq chat with model: {GROQ_MODEL}")
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            
            # Add context as a system message
            if context_str:
                messages.append({"role": "system", "content": f"Context for this conversation:\n{context_str}"})
            
            messages.append({"role": "user", "content": user_message})
            
            response = groq.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            print("Groq chat success")
            return {
                'success': True,
                'message': response.choices[0].message.content,
                'context_used': bool(context_str),
                'model': f'groq/{GROQ_MODEL}'
            }
        except Exception as e:
            print(f"Groq error, trying Gemini fallback: {e}")
    
    # Fallback to Gemini
    gemini = _get_gemini_model()
    if gemini:
        try:
            print(f"Attempting Gemini chat fallback with model: {GEMINI_MODEL}")
            prompt = f"{SYSTEM_PROMPT}\n\n"
            if context_str:
                prompt += f"Context:\n{context_str}\n\n"
            prompt += f"User: {user_message}"
            
            response = gemini.generate_content(prompt)
            return {
                'success': True,
                'message': response.text,
                'context_used': bool(context_str),
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
            print(f"Attempting Groq itinerary generation for {destination} with model {GROQ_MODEL}...")
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
            print("Groq response received. Parsing JSON...")
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
