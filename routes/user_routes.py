"""
User routes - Profile management, find locals
"""
from flask import Blueprint, request, jsonify
from models.user import find_user_by_id, update_user, find_locals_nearby
from utils.jwt_utils import token_required
from utils.validators import validate_coordinates, sanitize_string
from bson.objectid import ObjectId

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
