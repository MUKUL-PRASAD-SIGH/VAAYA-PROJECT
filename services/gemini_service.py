"""
Google Gemini API integration
For AI heatmap generation, image verification, and chatbot
"""
import google.generativeai as genai
from config import Config
import json
import base64
from PIL import Image
import io
import os

# Configure Gemini
if Config.GEMINI_API_KEY:
    genai.configure(api_key=Config.GEMINI_API_KEY)

# Model configuration with fallback
def _get_gemini_model():
    """
    Get Gemini model with fallback options
    Tries models in order of preference
    """
    models_to_try = [
        'models/gemini-2.5-flash',        # Latest 2.5 flash - CONFIRMED WORKING
        'models/gemini-2.0-flash',        # 2.0 flash model
        'models/gemini-1.5-flash',        # Stable flash model
        'gemini-pro'                      # Legacy stable (short name)
    ]
    
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            # Test the model with a simple call
            test_response = model.generate_content("Say hello")
            print(f"✅ Using Gemini model: {model_name}")
            return model
        except Exception as e:
            error_msg = str(e)
            if '429' in error_msg or 'quota' in error_msg.lower():
                print(f"⚠️ Model {model_name} quota exceeded, trying next...")
            else:
                print(f"⚠️ Model {model_name} failed: {error_msg[:100]}")
            continue
    
    # Final fallback
    return genai.GenerativeModel('gemini-1.5-flash')

def generate_heatmap_data(destination, date, location_coords=None):
    """
    DISABLED - Heatmap generation will be provided by custom logic
    Gemini no longer used for heatmap generation
    
    Args:
        destination: Location name
        date: Date string (YYYY-MM-DD)
        location_coords: Optional dict with lat/lng
    
    Returns:
        dict: Fallback heatmap data
    """
    try:
        # Heatmap generation disabled - use fallback
        print("Heatmap generation: Using fallback (Gemini disabled)")
        return {
            'success': False,
            'error': 'Heatmap generation via Gemini disabled - custom logic will be added',
            'data': _generate_fallback_heatmap(destination, date)
        }
        
        # OLD CODE - DISABLED
        # model = _get_gemini_model()
        
        coords_info = f" (coordinates: {location_coords})" if location_coords else ""
        
        # Add India-specific context
        india_context = ""
        if "india" in destination.lower() or any(city in destination.lower() for city in ['delhi', 'mumbai', 'bangalore', 'goa', 'jaipur', 'kerala', 'varanasi', 'agra', 'chennai', 'kolkata']):
            india_context = """
            This is an Indian destination. Consider:
            - Indian festivals and holidays
            - Monsoon season patterns
            - Weekend vs weekday tourism in India
            - Popular pilgrimage seasons if applicable
            """
        
        prompt = f"""
        Generate a crowd density heatmap prediction for {destination}{coords_info} on {date}.
        {india_context}
        
        Create a 10x10 grid representing different areas of this location.
        For each grid cell, provide a crowd density value from 0.0 (empty) to 1.0 (very crowded).
        
        Consider:
        - Tourist hotspots vs residential areas
        - Time of year and typical tourism patterns
        - Known attractions and their typical crowd levels
        - Transportation hubs and commercial areas
        - Day of week (weekday vs weekend)
        
        Return ONLY valid JSON in this exact format:
        {{
            "destination": "{destination}",
            "date": "{date}",
            "grid_size": 10,
            "heatmap": [[0.5, 0.6, 0.7, ...], [...], ...],
            "hotspots": [
                {{"area": "Area Name", "coords": {{"x": 2, "y": 3}}, "density": 0.9, "description": "Why it's crowded"}}
            ],
            "peak_times": ["10:00-12:00", "14:00-16:00"],
            "summary": "Brief description of overall crowd patterns for this day"
        }}
        
        The heatmap MUST be a 10x10 array (10 rows, 10 columns) of float values between 0.0 and 1.0.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith('```json'):
            text = text.split('```json')[1].split('```')[0].strip()
        elif text.startswith('```'):
            text = text.split('```')[1].split('```')[0].strip()
        
        heatmap_data = json.loads(text)
        
        # Validate structure
        if 'heatmap' not in heatmap_data or len(heatmap_data['heatmap']) != 10:
            raise ValueError("Invalid heatmap data structure")
        
        return {
            'success': True,
            'data': heatmap_data
        }
        
    except Exception as e:
        print(f"Gemini heatmap error: {e}")
        return {
            'success': False,
            'error': str(e),
            'data': _generate_fallback_heatmap(destination, date)
        }

def _generate_fallback_heatmap(destination, date):
    """Generate a simple fallback heatmap when Gemini fails"""
    import random
    random.seed(hash(f"{destination}{date}"))
    
    grid = [[round(random.uniform(0.3, 0.8), 2) for _ in range(10)] for _ in range(10)]
    
    # Add some hotspots
    grid[5][5] = 0.95  # City center
    grid[3][7] = 0.85  # Tourist area
    grid[8][2] = 0.75  # Commercial district
    
    return {
        'destination': destination,
        'date': date,
        'grid_size': 10,
        'heatmap': grid,
        'hotspots': [
            {'area': 'City Center', 'coords': {'x': 5, 'y': 5}, 'density': 0.95, 'description': 'Main tourist hub'},
            {'area': 'Tourist District', 'coords': {'x': 7, 'y': 3}, 'density': 0.85, 'description': 'Popular attractions'},
            {'area': 'Commercial Area', 'coords': {'x': 2, 'y': 8}, 'density': 0.75, 'description': 'Shopping and dining'}
        ],
        'peak_times': ['10:00-12:00', '15:00-18:00'],
        'summary': 'Fallback heatmap - Gemini API unavailable'
    }

def verify_quest_image(image_data, quest_type, location=None, description=None):
    """
    Use Gemini Vision to verify quest completion (e.g., trash cleanup)
    
    Args:
        image_data: Image file path, bytes, PIL Image, or base64 string
        quest_type: Type of quest ('trash_cleanup', 'cultural_visit', 'local_food', etc.)
        location: Expected location name
        description: Quest description
    
    Returns:
        dict: Verification results with authenticity score
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Handle different image input formats
        image = None
        if isinstance(image_data, str):
            if os.path.exists(image_data):
                # File path
                image = Image.open(image_data)
            elif image_data.startswith('data:image'):
                # Base64 data URL
                base64_str = image_data.split(',')[1]
                image_bytes = base64.b64decode(base64_str)
                image = Image.open(io.BytesIO(image_bytes))
            else:
                # Assume plain base64
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
        elif isinstance(image_data, bytes):
            image = Image.open(io.BytesIO(image_data))
        else:
            image = image_data
        
        # Build verification prompt based on quest type
        verification_prompts = {
            'trash_cleanup': """
            Analyze this image to verify a TRASH CLEANUP quest completion.
            
            Verification criteria:
            1. Trash bags, cleaning equipment, or collected waste visible
            2. Evidence of actual cleaning activity (before/after comparison ideal)
            3. Outdoor/public location setting
            4. Image appears authentic (not stock photo or staged)
            5. Photo quality is clear and recent
            
            Check for RED FLAGS:
            - Stock photography
            - Indoor/private setting
            - No visible trash or cleaning evidence
            - Suspicious editing or manipulation
            """,
            'cultural_visit': """
            Analyze this image to verify a CULTURAL SITE VISIT quest.
            
            Verification criteria:
            1. Recognizable cultural landmark or site
            2. User appears to be physically present
            3. Image quality indicates recent photo
            4. Matches expected location if specified
            """,
            'local_food': """
            Analyze this image to verify a LOCAL FOOD EXPERIENCE quest.
            
            Verification criteria:
            1. Local/traditional food visible
            2. Restaurant or street food setting
            3. Authentic presentation
            4. Recent photo quality
            """
        }
        
        base_prompt = verification_prompts.get(quest_type, f"Verify quest completion for: {quest_type}")
        
        location_text = f"\nExpected location: {location}" if location else ""
        description_text = f"\nQuest description: {description}" if description else ""
        
        prompt = f"""{base_prompt}
        {location_text}
        {description_text}
        
        Return ONLY valid JSON in this exact format:
        {{
            "verified": true or false,
            "authenticity_score": 0.0 to 1.0,
            "location_match": true or false or null,
            "quest_completed": true or false,
            "details": {{
                "evidence_found": true or false,
                "quality_check": true or false,
                "appears_genuine": true or false,
                "setting_appropriate": true or false
            }},
            "confidence": 0.0 to 1.0,
            "reason": "Clear explanation of verification decision",
            "suggestions": ["improvement1", "improvement2"] or []
        }}
        """
        
        response = model.generate_content([prompt, image])
        text = response.text.strip()
        
        # Parse JSON
        if text.startswith('```json'):
            text = text.split('```json')[1].split('```')[0].strip()
        elif text.startswith('```'):
            text = text.split('```')[1].split('```')[0].strip()
        
        verification_data = json.loads(text)
        
        return {
            'success': True,
            'verification': verification_data
        }
        
    except Exception as e:
        print(f"Gemini vision verification error: {e}")
        return {
            'success': False,
            'error': str(e),
            'verification': {
                'verified': False,
                'authenticity_score': 0.0,
                'quest_completed': False,
                'confidence': 0.0,
                'reason': f'Verification failed: {str(e)}',
                'suggestions': ['Please try uploading the image again']
            }
        }

def chatbot_response(user_message, context=None):
    """
    Tourism chatbot powered by Gemini with context awareness
    
    Args:
        user_message: User's question/message
        context: Optional dict with:
            - location: Current/planned destination
            - trip_plan: Trip details (destination, dates, preferences)
            - local_stories: Stories from MongoDB
            - user_preferences: User interests
            - conversation_history: Previous messages
    
    Returns:
        dict: Chat response with message and metadata
    """
    try:
        if not Config.GEMINI_API_KEY:
            return {
                'success': False,
                'error': 'Gemini API key not configured',
                'response': "Hi! I'm the Vayaa AI assistant. I can help you discover amazing places across India! However, my AI features are currently being configured. Please check back soon! 🇮🇳",
                'metadata': {}
            }
            
        model = _get_gemini_model()
        
        system_context = """
        You are Vayaa AI, a friendly and knowledgeable tourism assistant chatbot specializing EXCLUSIVELY in Karnataka tourism.
        
        Your mission:
        - Help tourists discover authentic local experiences across Karnataka ONLY
        - Share cultural insights, local stories, and hidden gems of Karnataka
        - Provide crowd-aware recommendations for Karnataka destinations
        - Promote sustainable and responsible tourism in Karnataka
        - Offer practical travel tips for Karnataka (weather, transport, safety)
        - Share information about Karnataka festivals, cuisine (like dosas, bisi bele bath, Mysore pak), Kannada culture, and traditions
        - Cover all Karnataka regions: Bengaluru, Mysuru, Hampi, Coorg, Gokarna, Udupi, Mangaluru, Chikmagalur, etc.
        
        IMPORTANT: You ONLY provide information about Karnataka. If asked about other Indian states or international destinations, 
        politely redirect: "I specialize in Karnataka tourism! Let me help you discover amazing places in Karnataka instead."
        
        Communication style:
        - Friendly, warm, and engaging
        - Concise (under 200 words unless details requested)
        - Use Karnataka/Kannada context and terminology when appropriate
        - Include emoji occasionally for personality 🏛️☕
        - Always encourage respectful, sustainable travel in Karnataka
        """
        
        # Build context
        context_parts = [system_context]
        
        if context:
            if context.get('location'):
                context_parts.append(f"\n📍 User's destination: {context['location']}")
            
            if context.get('trip_plan'):
                trip = context['trip_plan']
                dates = f"from {trip.get('start_date')} to {trip.get('end_date')}" if trip.get('start_date') else ""
                context_parts.append(f"\n✈️ User's trip: {trip.get('destination')} {dates}")
                
                if trip.get('preferences'):
                    prefs = trip['preferences']
                    if prefs.get('interests'):
                        context_parts.append(f"Interests: {', '.join(prefs['interests'])}")
                    if prefs.get('budget'):
                        context_parts.append(f"Budget: {prefs['budget']}")
            
            if context.get('local_stories'):
                stories = context['local_stories'][:2]  # Max 2 stories
                if stories:
                    stories_text = "\n".join([
                        f"- {s.get('title', 'Untitled')}: {s.get('summary', s.get('content', '')[:100])}"
                        for s in stories
                    ])
                    context_parts.append(f"\n📖 Local stories you can reference:\n{stories_text}")
            
            if context.get('crowd_predictions'):
                pred = context['crowd_predictions']
                context_parts.append(f"\n👥 Crowd prediction: {pred}")
            
            if context.get('conversation_history'):
                history = context['conversation_history'][-3:]  # Last 3 messages
                history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
                context_parts.append(f"\n💬 Recent conversation:\n{history_text}")
        
        full_prompt = "\n".join(context_parts) + f"\n\n👤 User: {user_message}\n\n🤖 QuestLoop AI:"
        
        response = model.generate_content(full_prompt)
        
        return {
            'success': True,
            'message': response.text,
            'context_used': bool(context),
            'model': 'gemini-1.5-flash'
        }
        
    except Exception as e:
        print(f"Gemini chatbot error: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': "I'm having trouble connecting right now. Please try again in a moment! 🔄",
            'context_used': False
        }

def generate_trip_itinerary(destination, duration_days, preferences):
    """
    Generate trip itinerary using Gemini
    
    Args:
        destination: Where to travel
        duration_days: Trip length in days
        preferences: User preferences (interests, budget, etc.)
    
    Returns:
        dict: Suggested itinerary
    """
    try:
        if not Config.GEMINI_API_KEY:
            print("No Gemini API key - returning fallback itinerary")
            return {
                'success': False,
                'error': 'Gemini API not configured',
                'itinerary': {
                    'days': [
                        {
                            'day': i+1,
                            'activities': [
                                {'time': '9:00 AM', 'activity': f'Explore {destination}', 'location': destination, 'duration': '3 hours'},
                                {'time': '2:00 PM', 'activity': 'Local cuisine tasting', 'location': 'Local market', 'duration': '2 hours'},
                                {'time': '5:00 PM', 'activity': 'Visit attractions', 'location': destination, 'duration': '2 hours'}
                            ],
                            'meals': [
                                {'type': 'breakfast', 'suggestion': 'Local breakfast spot'},
                                {'type': 'lunch', 'suggestion': 'Traditional restaurant'},
                                {'type': 'dinner', 'suggestion': 'Street food experience'}
                            ]
                        } for i in range(duration_days)
                    ],
                    'tips': [
                        'Book accommodations in advance',
                        'Try local transportation',
                        'Respect local customs and traditions',
                        'Stay hydrated and carry sunscreen',
                        'Learn a few basic phrases in the local language'
                    ]
                }
            }
            
        model = _get_gemini_model()
        
        # Karnataka-specific context
        karnataka_context = """
            IMPORTANT: This MUST be a Karnataka destination only. Focus exclusively on Karnataka tourism.
            
            Include Karnataka-specific elements:
            - Karnataka cuisine: Dosas, idlis, Mysore pak, Bisi bele bath, Mangalorean seafood, Udupi cuisine, filter coffee
            - Cultural sites: Temples (Hampi, Gokarna, Udupi), palaces (Mysuru), forts, historical sites
            - Natural attractions: Western Ghats, Coorg coffee plantations, Jog Falls, beaches (Gokarna, Karwar)
            - Best times to visit Karnataka (October-March ideal, monsoon June-September)
            - Karnataka-specific travel tips (temple dress codes, language - Kannada, local transport)
            - Karnataka festivals (Dasara in Mysuru, Ugadi, Karaga, etc.)
            - Cities: Bengaluru (tech hub), Mysuru (heritage), Hampi (UNESCO), Coorg (hill station), Mangaluru (coastal)
            """
        
        prompt = f"""
        Create a detailed {duration_days}-day itinerary for {destination}, Karnataka.
        {karnataka_context}
        
        CRITICAL: This itinerary MUST be for a destination in Karnataka only. Do not suggest places outside Karnataka.
        
        User preferences: {preferences if preferences else 'Show popular Karnataka attractions and authentic local experiences'}
        
        Return ONLY valid JSON in this exact format:
        {{
            "days": [
                {{
                    "day": 1,
                    "title": "Brief day theme",
                    "activities": [
                        {{"time": "9:00 AM", "activity": "Activity name", "location": "Specific location", "duration": "2 hours", "description": "Brief description"}}
                    ],
                    "meals": [
                        {{"type": "breakfast", "suggestion": "Specific restaurant or food", "cuisine": "Type of cuisine"}},
                        {{"type": "lunch", "suggestion": "...", "cuisine": "..."}},
                        {{"type": "dinner", "suggestion": "...", "cuisine": "..."}}
                    ]
                }}
            ],
            "tips": ["Practical travel tip 1", "Practical travel tip 2", ...],
            "best_time_to_visit": "Brief note on timing",
            "budget_estimate": "Rough daily budget in INR"
        }}
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith('```json'):
            text = text.split('```json')[1].split('```')[0].strip()
        elif text.startswith('```'):
            text = text.split('```')[1].split('```')[0].strip()
        
        itinerary_data = json.loads(text)
        
        return {
            'success': True,
            'itinerary': itinerary_data
        }
        
    except Exception as e:
        print(f"Gemini itinerary error: {e}")
        # Return fallback itinerary
        return {
            'success': False,
            'error': str(e),
            'itinerary': {
                'days': [
                    {
                        'day': i+1,
                        'title': f'Day {i+1} in {destination}',
                        'activities': [
                            {'time': '9:00 AM', 'activity': f'Explore {destination}', 'location': destination, 'duration': '3 hours', 'description': 'Discover local attractions'},
                            {'time': '2:00 PM', 'activity': 'Local cuisine tasting', 'location': 'Local market', 'duration': '2 hours', 'description': 'Try authentic local food'},
                            {'time': '5:00 PM', 'activity': 'Cultural experience', 'location': destination, 'duration': '2 hours', 'description': 'Immerse in local culture'}
                        ],
                        'meals': [
                            {'type': 'breakfast', 'suggestion': 'Local breakfast spot', 'cuisine': 'Indian'},
                            {'type': 'lunch', 'suggestion': 'Traditional restaurant', 'cuisine': 'Regional'},
                            {'type': 'dinner', 'suggestion': 'Street food experience', 'cuisine': 'Street food'}
                        ]
                    } for i in range(duration_days)
                ],
                'tips': [
                    'Book accommodations in advance',
                    'Try local transportation',
                    'Respect local customs and traditions',
                    'Stay hydrated and carry sunscreen',
                    'Learn a few basic phrases in the local language'
                ],
                'best_time_to_visit': 'October to March (cooler weather)',
                'budget_estimate': '₹2,000-5,000 per day'
            }
        }

