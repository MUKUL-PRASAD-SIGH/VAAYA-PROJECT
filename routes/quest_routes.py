"""
Quest routes - Quest management and discovery
Quests are generated based on planned trips and verified by AI
"""
from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from bson.objectid import ObjectId
from datetime import datetime
from models import db

quest_bp = Blueprint('quests', __name__)

def generate_sustainable_quests(destination):
    """
    Generate sustainable and hospitable quests for a destination
    These should promote:
    - Local culture and heritage
    - Environmental sustainability
    - Supporting local businesses
    - Respectful tourism
    """
    # Base quest templates focused on sustainability and hospitality
    quest_templates = {
        'Delhi': [
            {
                'title': 'Support Local Artisans',
                'description': 'Visit a local craft market and purchase from artisans directly',
                'category': 'culture',
                'difficulty': 'easy',
                'points': 50,
                'requirements': ['Photo with the artisan', 'Share their story'],
                'icon': '🎨',
                'sustainability_focus': 'Supporting local livelihoods'
            },
            {
                'title': 'Plastic-Free Day Challenge',
                'description': 'Spend a day without using single-use plastics',
                'category': 'environment',
                'difficulty': 'medium',
                'points': 75,
                'requirements': ['Document alternatives used', 'Photo of reusable items'],
                'icon': '♻️',
                'sustainability_focus': 'Reducing waste'
            },
            {
                'title': 'Heritage Walk with Local Guide',
                'description': 'Hire a local guide for a walking tour of heritage sites',
                'category': 'culture',
                'difficulty': 'easy',
                'points': 60,
                'requirements': ['Photo at heritage site', 'Guide recommendation'],
                'icon': '🚶',
                'sustainability_focus': 'Supporting local guides'
            }
        ],
        'Goa': [
            {
                'title': 'Beach Clean-Up',
                'description': 'Participate in or organize a beach clean-up activity',
                'category': 'environment',
                'difficulty': 'medium',
                'points': 100,
                'requirements': ['Photo of collected waste', 'Proper disposal proof'],
                'icon': '🏖️',
                'sustainability_focus': 'Environmental conservation'
            },
            {
                'title': 'Local Cuisine Experience',
                'description': 'Dine at a family-run local restaurant',
                'category': 'food',
                'difficulty': 'easy',
                'points': 40,
                'requirements': ['Photo of meal', 'Restaurant review'],
                'icon': '🍛',
                'sustainability_focus': 'Supporting local businesses'
            }
        ],
        'Jaipur': [
            {
                'title': 'Traditional Craft Workshop',
                'description': 'Learn block printing or pottery from local craftspeople',
                'category': 'culture',
                'difficulty': 'medium',
                'points': 80,
                'requirements': ['Photo of your creation', 'Artisan appreciation note'],
                'icon': '🏺',
                'sustainability_focus': 'Preserving traditional skills'
            },
            {
                'title': 'Water Conservation Awareness',
                'description': 'Visit stepwells and learn about traditional water conservation',
                'category': 'environment',
                'difficulty': 'easy',
                'points': 50,
                'requirements': ['Photo at stepwell', 'Share conservation learnings'],
                'icon': '💧',
                'sustainability_focus': 'Water conservation'
            }
        ],
        'Agra': [
            {
                'title': 'Eco-Friendly Transport',
                'description': 'Use cycle rickshaws or walk instead of motor vehicles',
                'category': 'environment',
                'difficulty': 'easy',
                'points': 45,
                'requirements': ['Photo of eco-transport', 'Distance covered'],
                'icon': '🚲',
                'sustainability_focus': 'Reducing carbon footprint'
            }
        ]
    }
    
    # Find matching quests for the destination
    for city in quest_templates.keys():
        if city.lower() in destination.lower():
            return quest_templates[city]
    
    # Default sustainable quests for any location
    return [
        {
            'title': 'Eat at Local Restaurants',
            'description': f'Support local economy by dining at family-owned restaurants in {destination}',
            'category': 'food',
            'difficulty': 'easy',
            'points': 40,
            'requirements': ['Photo of meal', 'Restaurant name'],
            'icon': '🍽️',
            'sustainability_focus': 'Supporting local businesses'
        },
        {
            'title': 'Public Transport Champion',
            'description': 'Use public transportation for your journey',
            'category': 'environment',
            'difficulty': 'easy',
            'points': 35,
            'requirements': ['Photo of public transport', 'Route details'],
            'icon': '🚌',
            'sustainability_focus': 'Eco-friendly travel'
        },
        {
            'title': 'Interact with Locals',
            'description': 'Have a meaningful conversation with a local resident',
            'category': 'culture',
            'difficulty': 'medium',
            'points': 55,
            'requirements': ['Share what you learned', 'Respectful photo (with permission)'],
            'icon': '🤝',
            'sustainability_focus': 'Cultural exchange'
        }
    ]

@quest_bp.route('/for-trip/<trip_id>', methods=['GET'])
@token_required
def get_quests_for_trip(current_user, trip_id):
    """
    Get sustainable quests for a specific trip
    Only returns quests after trip is planned
    """
    try:
        # Get the trip
        trips_collection = db.trips
        trip = trips_collection.find_one({
            '_id': ObjectId(trip_id),
            'user_id': current_user['user_id']
        })
        
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
        
        destination = trip.get('destination', '')
        
        # Generate sustainable quests for this destination
        quests = generate_sustainable_quests(destination)
        
        # Add trip_id and unique id to each quest
        for i, quest in enumerate(quests):
            quest['id'] = f"{trip_id}_{i}"
            quest['trip_id'] = trip_id
            quest['location'] = destination
            quest['ai_verified'] = True  # Will be verified by AI when completed
        
        return jsonify({
            'trip': {
                'id': str(trip['_id']),
                'destination': destination,
                'start_date': trip.get('start_date'),
                'end_date': trip.get('end_date')
            },
            'quests': quests,
            'count': len(quests),
            'message': 'Complete these sustainable quests during your trip!'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quest_bp.route('/', methods=['GET'])
@quest_bp.route('', methods=['GET'])
def get_quests():
    """
    Get all available quests
    Note: Quests are now trip-specific. Use /quests/for-trip/<trip_id> instead
    """
    try:
        return jsonify({
            'message': 'Plan a trip first to see sustainable quests for your destination!',
            'quests': [],
            'count': 0,
            'info': 'Use /api/quests/for-trip/<trip_id> to get quests for a specific trip'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quest_bp.route('/<quest_id>', methods=['GET'])
def get_quest(quest_id):
    """
    Get specific quest details
    """
    try:
        # Parse trip_id and quest index from quest_id
        if '_' in quest_id:
            trip_id, quest_index = quest_id.split('_')
            
            # Get trip destination
            trips_collection = db.trips
            trip = trips_collection.find_one({'_id': ObjectId(trip_id)})
            
            if trip:
                destination = trip.get('destination', '')
                quests = generate_sustainable_quests(destination)
                
                quest_idx = int(quest_index)
                if 0 <= quest_idx < len(quests):
                    quest = quests[quest_idx]
                    quest['id'] = quest_id
                    quest['trip_id'] = trip_id
                    quest['location'] = destination
                    return jsonify({'quest': quest}), 200
        
        return jsonify({'error': 'Quest not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quest_bp.route('/locations', methods=['GET'])
def get_quest_locations():
    """
    Get quest locations for map display
    
    GET /quests/locations?destination=Delhi
    
    Query Parameters:
    - destination: Filter by destination (optional)
    """
    try:
        destination = request.args.get('destination', 'Delhi')
        
        # Sample quest locations with coordinates
        quest_locations = [
            {
                'id': 'quest-1',
                'title': 'Visit India Gate',
                'description': 'Take a photo at the iconic India Gate monument',
                'location': {
                    'name': 'India Gate, Delhi',
                    'lat': 28.6129,
                    'lng': 77.2295
                },
                'category': 'heritage',
                'points': 50,
                'difficulty': 'easy',
                'icon': '🏛️'
            },
            {
                'id': 'quest-2',
                'title': 'Red Fort Heritage Quest',
                'description': 'Explore the Red Fort and learn about Mughal architecture',
                'location': {
                    'name': 'Red Fort, Delhi',
                    'lat': 28.6562,
                    'lng': 77.2410
                },
                'category': 'heritage',
                'points': 75,
                'difficulty': 'medium',
                'icon': '🏰'
            },
            {
                'id': 'quest-3',
                'title': 'Lotus Temple Visit',
                'description': 'Visit the Bahá\'í House of Worship and meditate',
                'location': {
                    'name': 'Lotus Temple, Delhi',
                    'lat': 28.5535,
                    'lng': 77.2588
                },
                'category': 'culture',
                'points': 60,
                'difficulty': 'easy',
                'icon': '🏛️'
            },
            {
                'id': 'quest-4',
                'title': 'Qutub Minar Quest',
                'description': 'Explore the tallest brick minaret in the world',
                'location': {
                    'name': 'Qutub Minar, Delhi',
                    'lat': 28.5244,
                    'lng': 77.1855
                },
                'category': 'heritage',
                'points': 80,
                'difficulty': 'medium',
                'icon': '🗼'
            },
            {
                'id': 'quest-5',
                'title': 'Street Food Adventure',
                'description': 'Try 3 different local street foods at Chandni Chowk',
                'location': {
                    'name': 'Chandni Chowk, Delhi',
                    'lat': 28.6506,
                    'lng': 77.2303
                },
                'category': 'food',
                'points': 65,
                'difficulty': 'easy',
                'icon': '🍛'
            }
        ]
        
        return jsonify({
            'success': True,
            'destination': destination,
            'quests': quest_locations,
            'count': len(quest_locations)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quest_bp.route('/<quest_id>/complete', methods=['POST'])
@token_required
def complete_quest(current_user, quest_id):
    """
    Mark quest as completed
    
    POST /quests/<quest_id>/complete
    """
    try:
        from models import users_collection
        
        quest = next((q for q in SAMPLE_QUESTS if q['id'] == quest_id), None)
        
        if not quest:
            return jsonify({'error': 'Quest not found'}), 404
        
        user_id = current_user['user_id']
        
        # Update user's completed quests and points
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$inc': {
                    'completed_quests': 1,
                    'points': quest['points']
                },
                '$push': {
                    'quest_history': {
                        'quest_id': quest_id,
                        'quest_title': quest['title'],
                        'points_earned': quest['points'],
                        'completed_at': datetime.utcnow()
                    }
                }
            }
        )
        
        return jsonify({
            'message': 'Quest completed successfully',
            'points_earned': quest['points']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
