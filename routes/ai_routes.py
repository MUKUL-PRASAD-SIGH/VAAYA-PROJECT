"""
AI-powered routes using Gemini API
Heatmap generation, quest verification, and chatbot
"""
from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from services.gemini_service import (
    generate_heatmap_data,
    verify_quest_image,
    chatbot_response,
    generate_trip_itinerary
)
from config import Config
import json

def format_itinerary_to_text(itinerary_dict, destination, days):
    """
    Convert itinerary JSON to readable text format
    """
    if not itinerary_dict:
        return f"Unable to generate itinerary for {destination}"
    
    text_parts = []
    text_parts.append(f"🗺️ {days}-Day Itinerary for {destination}\n")
    text_parts.append("=" * 60 + "\n\n")
    
    # Add days
    for day_info in itinerary_dict.get('days', []):
        day_num = day_info.get('day', 1)
        title = day_info.get('title', f'Day {day_num}')
        text_parts.append(f"DAY {day_num}: {title}\n")
        text_parts.append("-" * 40 + "\n")
        
        # Activities
        for activity in day_info.get('activities', []):
            time = activity.get('time', '')
            name = activity.get('activity', '')
            location = activity.get('location', '')
            desc = activity.get('description', '')
            text_parts.append(f"  • {time} - {name}")
            if location:
                text_parts.append(f" @ {location}")
            text_parts.append("\n")
            if desc:
                text_parts.append(f"    {desc}\n")
        
        # Meals
        text_parts.append("\n  🍽️ Meals:\n")
        for meal in day_info.get('meals', []):
            meal_type = meal.get('type', '').title()
            suggestion = meal.get('suggestion', '')
            cuisine = meal.get('cuisine', '')
            text_parts.append(f"    {meal_type}: {suggestion}")
            if cuisine:
                text_parts.append(f" ({cuisine})")
            text_parts.append("\n")
        
        text_parts.append("\n")
    
    # Add tips
    if itinerary_dict.get('tips'):
        text_parts.append("\n✨ Travel Tips:\n")
        text_parts.append("-" * 40 + "\n")
        for tip in itinerary_dict['tips']:
            text_parts.append(f"  • {tip}\n")
    
    # Add budget and timing info
    if itinerary_dict.get('budget_estimate'):
        text_parts.append(f"\n💰 Budget Estimate: {itinerary_dict['budget_estimate']}\n")
    if itinerary_dict.get('best_time_to_visit'):
        text_parts.append(f"⏰ Best Time: {itinerary_dict['best_time_to_visit']}\n")
    
    return ''.join(text_parts)
from models import db
import base64
from datetime import datetime

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/heatmap', methods=['POST'])
def generate_heatmap():
    """
    Generate crowd heatmap for a destination
    
    POST /ai/heatmap
    Body: {
        "destination": "Paris, France",
        "date": "2025-07-14",
        "location_coords": {"lat": 48.8566, "lng": 2.3522}  // optional
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('destination') or not data.get('date'):
            return jsonify({'error': 'destination and date are required'}), 400
        
        destination = data['destination']
        date = data['date']
        location_coords = data.get('location_coords')
        
        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Generate heatmap using Gemini
        result = generate_heatmap_data(destination, date, location_coords)
        
        if result['success']:
            return jsonify({
                'message': 'Heatmap generated successfully',
                'heatmap': result['data']
            }), 200
        else:
            return jsonify({
                'message': 'Heatmap generated with fallback data',
                'heatmap': result['data'],
                'warning': result.get('error')
            }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate heatmap: {str(e)}'}), 500

# Demo user for no-auth mode (using valid ObjectId format)
DEMO_USER = {'user_id': '507f1f77bcf86cd799439011', 'email': 'demo@vayaa.in', 'name': 'Demo User'}

@ai_bp.route('/verify-quest', methods=['POST'])
def verify_quest():
    """
    Verify quest completion using image analysis
    
    POST /ai/verify-quest
    Body: {
        "quest_id": "quest_id_here",
        "quest_type": "trash_cleanup",  // trash_cleanup, cultural_visit, local_food
        "location": "Paris City Center",  // optional
        "description": "Clean up 5kg of trash",  // optional
        "image": "base64_encoded_image_or_url"
    }
    
    Or multipart/form-data with image file
    """
    try:
        current_user = DEMO_USER
        
        # Handle JSON with base64 image
        if request.is_json:
            data = request.get_json()
            image_data = data.get('image')
            quest_type = data.get('quest_type', 'trash_cleanup')
            location = data.get('location')
            description = data.get('description')
            quest_id = data.get('quest_id')
            
        # Handle multipart form data
        else:
            if 'image' not in request.files:
                return jsonify({'error': 'No image provided'}), 400
            
            image_file = request.files['image']
            image_data = image_file.read()
            quest_type = request.form.get('quest_type', 'trash_cleanup')
            location = request.form.get('location')
            description = request.form.get('description')
            quest_id = request.form.get('quest_id')
        
        if not image_data:
            return jsonify({'error': 'Image data is required'}), 400
        
        # Verify using Gemini Vision
        result = verify_quest_image(
            image_data=image_data,
            quest_type=quest_type,
            location=location,
            description=description
        )
        
        if result['success']:
            verification = result['verification']
            
            # If quest_id provided, update quest status in database
            if quest_id and verification.get('verified'):
                quests_collection = db.quests
                quests_collection.update_one(
                    {'_id': quest_id, 'user_id': current_user['user_id']},
                    {
                        '$set': {
                            'status': 'verified',
                            'verification_data': verification,
                            'verified_at': datetime.utcnow()
                        }
                    }
                )
            
            return jsonify({
                'message': 'Quest verification complete',
                'verification': verification,
                'quest_id': quest_id
            }), 200
        else:
            return jsonify({
                'message': 'Verification failed',
                'verification': result['verification'],
                'error': result.get('error')
            }), 200
        
    except Exception as e:
        return jsonify({'error': f'Quest verification failed: {str(e)}'}), 500

@ai_bp.route('/chat', methods=['POST'])
def chat():
    """
    Tourism chatbot endpoint
    
    POST /ai/chat
    Body: {
        "message": "What are the best places to visit in Paris?",
        "trip_id": "optional_trip_id",  // Include trip context
        "include_stories": true  // Include local stories from DB
    }
    """
    try:
        current_user = DEMO_USER
        data = request.get_json()
        
        if not data.get('message'):
            return jsonify({'error': 'message is required'}), 400
        
        user_message = data['message']
        trip_id = data.get('trip_id')
        include_stories = data.get('include_stories', False)
        
        # Build context
        context = {
            'user_preferences': {}
        }
        
        # Add trip context if trip_id provided
        if trip_id:
            trip = get_trip_by_id(trip_id)
            if trip and str(trip.get('user_id')) == current_user['user_id']:
                context['trip_plan'] = {
                    'destination': trip.get('destination'),
                    'start_date': trip.get('start_date').strftime('%Y-%m-%d') if trip.get('start_date') else None,
                    'end_date': trip.get('end_date').strftime('%Y-%m-%d') if trip.get('end_date') else None,
                    'preferences': trip.get('preferences', {})
                }
                context['location'] = trip.get('destination')
        
        # Add local stories if requested
        if include_stories and context.get('location'):
            stories_collection = db.local_stories
            stories = list(stories_collection.find(
                {'location': {'$regex': context['location'], '$options': 'i'}},
                {'title': 1, 'summary': 1, 'content': 1}
            ).limit(2))
            
            if stories:
                context['local_stories'] = [
                    {
                        'title': s.get('title', ''),
                        'summary': s.get('summary', s.get('content', '')[:150])
                    }
                    for s in stories
                ]
        
        # Get chatbot response
        result = chatbot_response(user_message, context)
        
        # Handle response
        response_message = result.get('message') or result.get('response', 'Sorry, I encountered an error.')
        
        # Store conversation in database (optional)
        conversations_collection = db.conversations
        conversations_collection.insert_one({
            'user_id': current_user['user_id'],
            'message': user_message,
            'response': response_message,
            'context_used': result.get('context_used'),
            'trip_id': trip_id,
            'timestamp': datetime.utcnow()
        })
        
        return jsonify({
            'message': response_message,
            'context_used': result.get('context_used', False),
            'success': result.get('success', True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Chat failed: {str(e)}'}), 500

@ai_bp.route('/generate-itinerary', methods=['POST'])
def generate_itinerary():
    """
    Generate AI-powered trip itinerary
    
    POST /ai/generate-itinerary
    Body: {
        "destination": "Tokyo, Japan",
        "duration_days": 5,  // OR provide start_date and end_date
        "start_date": "2025-12-15",
        "end_date": "2025-12-20",
        "origin": "Mumbai",  // Optional for transportation
        "preferences": {
            "interests": ["culture", "food", "nature"],
            "budget": "medium",
            "pace": "relaxed"
        }
    }
    """
    try:
        current_user = DEMO_USER
        data = request.get_json()
        
        if not data.get('destination'):
            return jsonify({'error': 'destination is required'}), 400
        
        destination = data['destination']
        preferences = data.get('preferences', {})
        
        # Calculate duration from dates or use provided duration_days
        if data.get('start_date') and data.get('end_date'):
            from datetime import datetime
            from email.utils import parsedate_to_datetime
            
            # Try multiple date formats
            try:
                # Try ISO format first
                start = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
                end = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            except ValueError:
                try:
                    # Try GMT/HTTP date format
                    start = parsedate_to_datetime(data['start_date'])
                    end = parsedate_to_datetime(data['end_date'])
                except Exception:
                    # Try parsing as string
                    from dateutil import parser
                    start = parser.parse(data['start_date'])
                    end = parser.parse(data['end_date'])
            
            duration_days = (end - start).days + 1
        elif data.get('duration_days'):
            duration_days = int(data['duration_days'])
        else:
            return jsonify({'error': 'Either duration_days or (start_date and end_date) required'}), 400
        
        if duration_days < 1 or duration_days > 30:
            return jsonify({'error': 'duration must be between 1 and 30 days'}), 400
        
        # Generate itinerary using Gemini
        try:
            result = generate_trip_itinerary(destination, duration_days, preferences)
            
            # Format itinerary as readable text
            if result.get('success') and result.get('itinerary'):
                itinerary_data = result['itinerary']
                itinerary_text = f"**{duration_days}-Day Itinerary for {destination}**\n\n"
                
                # Format each day
                for day_info in itinerary_data.get('days', []):
                    day_num = day_info.get('day', 1)
                    day_title = day_info.get('title', f'Day {day_num}')
                    itinerary_text += f"**Day {day_num}: {day_title}**\n\n"
                    
                    # Activities
                    for activity in day_info.get('activities', []):
                        time = activity.get('time', '')
                        name = activity.get('activity', '')
                        location = activity.get('location', '')
                        desc = activity.get('description', '')
                        itinerary_text += f"  {time} - **{name}** at {location}\n"
                        if desc:
                            itinerary_text += f"    {desc}\n"
                    
                    # Meals
                    itinerary_text += "\n  **Meals:**\n"
                    for meal in day_info.get('meals', []):
                        meal_type = meal.get('type', '').capitalize()
                        suggestion = meal.get('suggestion', '')
                        cuisine = meal.get('cuisine', '')
                        itinerary_text += f"    • {meal_type}: {suggestion}"
                        if cuisine:
                            itinerary_text += f" ({cuisine})"
                        itinerary_text += "\n"
                    
                    itinerary_text += "\n"
                
                # Tips
                if itinerary_data.get('tips'):
                    itinerary_text += "\n**Travel Tips:**\n"
                    for tip in itinerary_data['tips']:
                        itinerary_text += f"  • {tip}\n"
                
                # Budget
                if itinerary_data.get('budget_estimate'):
                    itinerary_text += f"\n**Budget Estimate:** {itinerary_data['budget_estimate']}\n"
                
                itinerary_formatted = itinerary_text
            else:
                # Fallback
                itinerary_formatted = f"**{duration_days}-Day Trip to {destination}**\n\n"
                for i in range(duration_days):
                    itinerary_formatted += f"**Day {i+1}:**\n"
                    itinerary_formatted += f"  9:00 AM - Explore {destination}\n"
                    itinerary_formatted += f"  2:00 PM - Local cuisine tasting\n"
                    itinerary_formatted += f"  5:00 PM - Visit popular attractions\n\n"
        except Exception as e:
            print(f"Gemini itinerary error: {e}")
            itinerary_formatted = f"**{duration_days}-Day Trip to {destination}**\n\nItinerary generation in progress..."
        
        # Get transportation options if origin provided
        transportation = None
        origin = data.get('origin')
        if origin:
            try:
                from services.search_service import search_transportation
                start_date = data.get('start_date')
                transportation = search_transportation(origin, destination, start_date, mode='all')
            except Exception as e:
                print(f"Transportation search error: {e}")
                transportation = None
        
        # Get hotels using Google Search (Karnataka focus)
        hotels = []
        try:
            from services.search_service import search_general_info
            import re
            # Add Karnataka context to hotel search
            hotels_search = search_general_info(f"hotels in {destination} Karnataka booking price")
            if hotels_search and hotels_search.get('organic_results'):
                for result in hotels_search['organic_results'][:8]:
                    title = result['title']
                    snippet = result['snippet']
                    
                    # Extract price if present - look for actual nightly rates
                    fare = 'Check website'
                    text = snippet + ' ' + title
                    
                    # Look for patterns like "₹5,000", "Rs. 5000", "₹3000/night"
                    rupee_matches = re.findall(r'(?:₹|Rs\.?\s*)([0-9,]+)', text)
                    
                    if rupee_matches:
                        # Convert to numbers and find reasonable hotel prices
                        amounts = [int(m.replace(',', '')) for m in rupee_matches]
                        # Filter for typical hotel rates (₹500 - ₹50,000 per night)
                        hotel_prices = [a for a in amounts if 500 <= a <= 50000]
                        if hotel_prices:
                            # Use the most common price or average if multiple
                            avg_price = sum(hotel_prices) // len(hotel_prices) if len(hotel_prices) > 1 else hotel_prices[0]
                            fare = f"₹{avg_price:,}/night"
                    
                    # Try dollar conversion as fallback
                    if fare == 'Check website':
                        dollar_matches = re.findall(r'\$\s*([0-9,]+)', text)
                        if dollar_matches:
                            dollar_amounts = [int(m.replace(',', '')) for m in dollar_matches]
                            hotel_dollar_prices = [a for a in dollar_amounts if 10 <= a <= 1000]
                            if hotel_dollar_prices:
                                avg_dollar = sum(hotel_dollar_prices) // len(hotel_dollar_prices) if len(hotel_dollar_prices) > 1 else hotel_dollar_prices[0]
                                fare = f"₹{int(avg_dollar * 83):,}/night"
                    
                    hotels.append({
                        'name': title,
                        'fare': fare,
                        'description': snippet[:150],
                        'link': result['link'],
                        'source': 'Google Search'
                    })
            
            # Filter to only show hotels with actual prices
            hotels = [h for h in hotels if h['fare'] != 'Check website']
        except Exception as e:
            print(f"Hotels search error: {e}")
            hotels = []
        
        # Return formatted response
        return jsonify({
            'message': 'Itinerary generated successfully',
            'itinerary': itinerary_formatted,
            'transportation': transportation,
            'hotels': hotels
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Itinerary generation failed: {str(e)}'}), 500

@ai_bp.route('/health', methods=['GET'])
def ai_health():
    """Check if Gemini API is configured"""
    from config import Config
    
    return jsonify({
        'gemini_configured': bool(Config.GEMINI_API_KEY),
        'endpoints': [
            'POST /ai/heatmap - Generate crowd heatmap',
            'POST /ai/verify-quest - Verify quest with image',
            'POST /ai/chat - Tourism chatbot',
            'POST /ai/generate-itinerary - AI itinerary generator'
        ]
    }), 200
