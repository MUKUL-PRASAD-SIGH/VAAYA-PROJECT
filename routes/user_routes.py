"""
User routes - Profile management, find locals, Firebase onboarding
"""
from flask import Blueprint, request, jsonify
from models.user import (
    find_user_by_id, update_user, find_locals_nearby,
    find_user_by_firebase_uid, create_user_from_firebase,
    update_user_by_firebase_uid, add_ai_message, get_user_ai_messages
)
from utils.jwt_utils import token_required, generate_token

# ... (omitted)


from utils.firebase_utils import firebase_required
from utils.validators import validate_coordinates, sanitize_string
from bson.objectid import ObjectId
from datetime import datetime

user_bp = Blueprint('users', __name__)

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_current_user_profile(current_user):
    """
    Get current user's profile
    
    Headers:
    Authorization: Bearer <token>
    """
    try:
        user = find_user_by_id(current_user['user_id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = {
            'id': str(user['_id']),
            'name': user.get('name'),
            'email': user['email'],
            'role': user['role'],
            'verified': user.get('verified', True),
            'rating': user.get('rating', 0),
            'completed_quests': user.get('completed_quests', 0),
            'points': user.get('points', 0),
            'bio': user.get('bio'),
            'phone': user.get('phone') if user['role'] == 'local' else None
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/profile/<user_id>', methods=['GET'])
@token_required
def get_user(user_id, current_user):
    """
    Get user profile by ID
    
    Headers:
    Authorization: Bearer <token>
    """
    try:
        user = find_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = {
            'id': str(user['_id']),
            'name': user.get('name'),
            'role': user['role'],
            'verified': user.get('verified', True),
            'rating': user.get('rating', 0),
            'completed_quests': user.get('completed_quests', 0),
            'bio': user.get('bio')
        }
        
        # Only show full details if viewing own profile
        if str(user['_id']) == current_user['user_id']:
            user_data['email'] = user['email']
            if user['role'] == 'local':
                user_data['phone'] = user.get('phone')
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """
    Update current user's profile
    
    Request Body:
    {
        "name": "New Name",
        "bio": "My bio"
    }
    
    Headers:
    Authorization: Bearer <token>
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user_id = current_user['user_id']
    
    # Allowed fields to update
    updates = {}
    
    if 'name' in data:
        updates['name'] = sanitize_string(data['name'], 100)
    
    if 'bio' in data:
        updates['bio'] = sanitize_string(data['bio'], 500)
    
    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    try:
        update_user(user_id, updates)
        
        return jsonify({
            'message': 'Profile updated successfully',
            'updated_fields': list(updates.keys())
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/locals/nearby', methods=['GET'])
@token_required
def get_nearby_locals(current_user):
    """
    Find verified local guides nearby
    
    Query Parameters:
    - latitude: Location latitude
    - longitude: Location longitude
    - max_distance: Maximum distance in km (default: 50)
    
    Headers:
    Authorization: Bearer <token>
    """
    latitude = request.args.get('latitude')
    longitude = request.args.get('longitude')
    max_distance = request.args.get('max_distance', 50)
    
    if not latitude or not longitude:
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    if not validate_coordinates(latitude, longitude):
        return jsonify({'error': 'Invalid coordinates'}), 400
    
    try:
        lat = float(latitude)
        lng = float(longitude)
        max_dist = float(max_distance)
        
        locals_cursor = find_locals_nearby(lat, lng, max_dist)
        
        locals_list = []
        for local in locals_cursor:
            locals_list.append({
                'id': str(local['_id']),
                'name': local.get('name'),
                'bio': local.get('bio'),
                'rating': local.get('rating', 0),
                'completed_quests': local.get('completed_quests', 0),
                'location': {
                    'latitude': local['location']['coordinates'][1],
                    'longitude': local['location']['coordinates'][0]
                } if local.get('location') else None
            })
        
        return jsonify({
            'locals': locals_list,
            'count': len(locals_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/leaderboard', methods=['GET'])
@token_required
def get_leaderboard(current_user):
    """
    Get top users by points
    
    Query Parameters:
    - limit: Maximum number of users to return (default: 10)
    
    Headers:
    Authorization: Bearer <token>
    """
    try:
        from models import users_collection
        
        limit = request.args.get('limit', default=10, type=int)
        
        # Get top users sorted by points
        top_users = list(users_collection.find(
            {},
            {'name': 1, 'points': 1, 'completed_quests': 1, 'role': 1}
        ).sort('points', -1).limit(limit))
        
        leaderboard = []
        for idx, user in enumerate(top_users):
            leaderboard.append({
                'rank': idx + 1,
                'id': str(user['_id']),
                'name': user.get('name', 'Anonymous'),
                'points': user.get('points', 0),
                'completed_quests': user.get('completed_quests', 0),
                'role': user.get('role', 'tourist'),
                'is_current_user': str(user['_id']) == current_user['user_id']
            })
        
        return jsonify({
            'leaderboard': leaderboard,
            'count': len(leaderboard)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/nearby', methods=['GET'])
@token_required
def get_nearby_users(current_user):
    """
    Find nearby users (both locals and tourists)
    
    Query Parameters:
    - latitude: Location latitude
    - longitude: Location longitude
    - limit: Maximum number of users (default: 20)
    
    Headers:
    Authorization: Bearer <token>
    """
    try:
        from models import users_collection
        
        limit = request.args.get('limit', default=20, type=int)
        
        # For now, return sample nearby users
        # In production, use geospatial queries
        nearby_users = list(users_collection.find(
            {'_id': {'$ne': ObjectId(current_user['user_id'])}},
            {'name': 1, 'role': 1, 'rating': 1, 'bio': 1}
        ).limit(limit))
        
        users_list = []
        for user in nearby_users:
            users_list.append({
                'id': str(user['_id']),
                'name': user.get('name', 'Anonymous'),
                'role': user.get('role', 'tourist'),
                'rating': user.get('rating', 0),
                'bio': user.get('bio', '')
            })
        
        return jsonify({
            'users': users_list,
            'count': len(users_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/fcm-token', methods=['POST'])
@token_required
def update_fcm_token(current_user):
    """
    Update user's FCM token for push notifications
    
    Request Body:
    {
        "fcm_token": "device_fcm_token_here"
    }
    
    Headers:
    Authorization: Bearer <token>
    """
    data = request.get_json()
    
    if not data or 'fcm_token' not in data:
        return jsonify({'error': 'FCM token is required'}), 400
    
    user_id = current_user['user_id']
    fcm_token = data['fcm_token']
    
    try:
        update_user(user_id, {'fcm_token': fcm_token})
        
        return jsonify({
            'message': 'FCM token updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/preferences', methods=['GET'])
@token_required
def get_preferences(current_user):
    """
    Get user's onboarding preferences
    
    Headers:
    Authorization: Bearer <token>
    """
    try:
        user = find_user_by_id(current_user['user_id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        preferences = user.get('preferences', {})
        
        return jsonify({
            'preferences': preferences,
            'onboarding_completed': preferences.get('onboarding_completed', False)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/preferences', methods=['PUT', 'POST'])
def update_preferences():
    """
    Update user's onboarding preferences (no auth required for demo mode)
    
    Request Body:
    {
        "role": "Traveller",
        "interests": ["Nature", "Food"],
        "budget": "Moderate",
        "onboarding_completed": true
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Build preferences object
    preferences = {
        'role': data.get('role', ''),
        'interests': data.get('interests', []),
        'budget': data.get('budget', ''),
        'onboarding_completed': data.get('onboarding_completed', True),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    try:
        # Use demo user for no-auth mode
        from models import db
        demo_user_id = 'demo_user'
        
        # Upsert - create user if not exists, update if exists
        result = db.users.update_one(
            {'firebase_uid': demo_user_id},
            {
                '$set': {'preferences': preferences},
                '$setOnInsert': {
                    'firebase_uid': demo_user_id,
                    'email': 'demo@vaaya.com',
                    'role': preferences.get('role', 'tourist'),
                    'created_at': datetime.utcnow()
                }
            },
            upsert=True
        )
        
        print(f"Preferences saved: {preferences}")
        
        return jsonify({
            'message': 'Preferences updated successfully',
            'preferences': preferences
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ===========================
# Firebase Onboarding Endpoints
# ===========================

@user_bp.route('/onboard', methods=['POST'])
@firebase_required
def onboard_user(current_user):
    """
    Onboard a Firebase user to MongoDB
    
    Request Body:
    {
        "preference": "local" or "user",
        "password": "optional_password",
        "name": "Display Name"
    }
    
    Headers:
    Authorization: Bearer <firebase_id_token>
    """
    data = request.get_json() or {}
    
    firebase_uid = current_user['uid']
    email = current_user['email']
    name = data.get('name') or current_user.get('name')
    preference = data.get('preference', 'user')  # 'local' or 'user'
    password = data.get('password')
    
    try:
        user = create_user_from_firebase(
            firebase_uid=firebase_uid,
            email=email,
            password=password,
            preference=preference,
            name=name
        )
        
        # Generate backend token
        token = generate_token(user['_id'], user['role'])
        
        return jsonify({
            'message': 'User onboarded successfully',
            'user': {
                'id': str(user['_id']),
                'firebase_uid': user['firebase_uid'],
                'email': user['email'],
                'role': user['role'],
                'preference': user['preference'],
                'name': user.get('name')
            },
            'token': token
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/me', methods=['GET'])
@firebase_required
def get_firebase_user_profile(current_user):
    """
    Get current Firebase user's MongoDB profile
    
    Headers:
    Authorization: Bearer <firebase_id_token>
    """
    try:
        user = find_user_by_firebase_uid(current_user['uid'])
        
        if not user:
            return jsonify({'error': 'User not onboarded yet'}), 404
        
        # Generate backend token
        token = generate_token(user['_id'], user['role'])
        
        return jsonify({
            'user': {
                'id': str(user['_id']),
                'firebase_uid': user['firebase_uid'],
                'email': user['email'],
                'role': user['role'],
                'preference': user.get('preference'),
                'name': user.get('name'),
                'preferences': user.get('preferences', {}),
                'points': user.get('points', 0),
                'completed_quests': user.get('completed_quests', 0)
            },
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===========================
# AI Chat Message Endpoints
# ===========================

@user_bp.route('/ai-messages', methods=['GET'])
@firebase_required
def get_ai_messages(current_user):
    """
    Get user's AI chat messages (up to 20)
    
    Headers:
    Authorization: Bearer <firebase_id_token>
    """
    try:
        messages = get_user_ai_messages(current_user['uid'])
        
        # Format messages for JSON response
        formatted = []
        for msg in messages:
            formatted.append({
                'role': msg['role'],
                'text': msg['text'],
                'timestamp': msg['timestamp'].isoformat() if hasattr(msg['timestamp'], 'isoformat') else str(msg['timestamp'])
            })
        
        return jsonify({
            'messages': formatted,
            'count': len(formatted)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/ai-messages', methods=['POST'])
@firebase_required
def add_ai_chat_message(current_user):
    """
    Add an AI chat message to user's history
    
    Request Body:
    {
        "role": "user" or "assistant",
        "text": "Message content"
    }
    
    Headers:
    Authorization: Bearer <firebase_id_token>
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    role = data.get('role')
    text = data.get('text')
    
    if not role or role not in ['user', 'assistant']:
        return jsonify({'error': 'Invalid role. Must be "user" or "assistant"'}), 400
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    try:
        message = add_ai_message(current_user['uid'], role, text)
        
        return jsonify({
            'message': 'Message added successfully',
            'data': {
                'role': message['role'],
                'text': message['text'],
                'timestamp': message['timestamp'].isoformat()
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
