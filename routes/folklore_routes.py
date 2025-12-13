"""
Folklore Routes - Traveler-facing endpoints for cultural content
Handles story browsing, unlocking, and discovery
"""
from flask import Blueprint, jsonify, request
from bson import ObjectId
from datetime import datetime
from functools import wraps
import jwt
from config import Config
from db import folklore_collection, story_unlocks_collection, users_collection
from geopy.distance import geodesic

folklore_bp = Blueprint('folklore', __name__)

def token_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authentication token required'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'error': 'User not found'}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': str(e)}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated


@folklore_bp.route('/', methods=['GET'])
def get_folklore_stories():
    """
    Get published folklore stories for travelers
    
    GET /api/folklore?lat=12.3052&lng=76.6552&radius=50&type=story
    
    Query Parameters:
    - lat: Latitude (optional)
    - lng: Longitude (optional)
    - radius: Search radius in km (default: 50)
    - type: Content type filter (story, place, tip, event)
    - tags: Comma-separated tags
    """
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 50, type=float)
        content_type = request.args.get('type')
        tags = request.args.get('tags', '').split(',') if request.args.get('tags') else []
        
        query = {'status': 'published'}
        
        if content_type:
            query['type'] = content_type
        
        if tags:
            query['tags'] = {'$in': tags}
        
        # Location-based filtering
        if lat and lng:
            query['location'] = {
                '$near': {
                    '$geometry': {
                        'type': 'Point',
                        'coordinates': [lng, lat]
                    },
                    '$maxDistance': radius * 1000  # Convert km to meters
                }
            }
        
        stories = list(folklore_collection.find(query).limit(50))
        
        for story in stories:
            story['_id'] = str(story['_id'])
            story['author_id'] = str(story['author_id'])
            if 'source_local_id' in story:
                story['source_local_id'] = str(story['source_local_id'])
        
        return jsonify({
            'stories': stories,
            'count': len(stories)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@folklore_bp.route('/<story_id>', methods=['GET'])
@token_required
def get_folklore_story(current_user, story_id):
    """
    Get a specific folklore story (requires unlock if locked)
    
    GET /api/folklore/<story_id>
    """
    try:
        story = folklore_collection.find_one({'_id': ObjectId(story_id)})
        
        if not story:
            return jsonify({'error': 'Story not found'}), 404
        
        user_id = str(current_user['_id'])
        
        # Check if story is unlocked for this user
        unlock = story_unlocks_collection.find_one({
            'user_id': ObjectId(user_id),
            'story_id': ObjectId(story_id)
        })
        
        story['_id'] = str(story['_id'])
        story['author_id'] = str(story['author_id'])
        story['is_unlocked'] = unlock is not None
        
        if unlock:
            story['unlocked_at'] = unlock.get('unlocked_at').isoformat()
        
        return jsonify({'story': story}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@folklore_bp.route('/unlock/<story_id>', methods=['POST'])
@token_required
def unlock_folklore_story(current_user, story_id):
    """
    Unlock a folklore story if user meets criteria
    
    POST /api/folklore/unlock/<story_id>
    Body: {
        "user_location": {
            "lat": 12.3052,
            "lng": 76.6552
        }
    }
    
    Criteria:
    - User must have sufficient XP (if xp_required set)
    - User must be within geofence radius (if geofence set)
    """
    try:
        story = folklore_collection.find_one({'_id': ObjectId(story_id)})
        
        if not story:
            return jsonify({'error': 'Story not found'}), 404
        
        user_id = str(current_user['_id'])
        user_xp = current_user.get('xp', 0)
        
        # Check if already unlocked
        existing_unlock = story_unlocks_collection.find_one({
            'user_id': ObjectId(user_id),
            'story_id': ObjectId(story_id)
        })
        
        if existing_unlock:
            return jsonify({
                'message': 'Story already unlocked',
                'unlocked_at': existing_unlock.get('unlocked_at').isoformat()
            }), 200
        
        # Check XP requirement
        xp_required = story.get('xp_required', 0)
        if xp_required > user_xp:
            return jsonify({
                'error': 'Insufficient XP',
                'required': xp_required,
                'current': user_xp
            }), 403
        
        # Check location requirement (geofence)
        geofence = story.get('geofence')
        if geofence:
            data = request.get_json()
            user_location = data.get('user_location')
            
            if not user_location:
                return jsonify({
                    'error': 'Location required',
                    'message': 'This story requires you to be at the location to unlock'
                }), 400
            
            story_coords = story['location']['coordinates']
            story_lat, story_lng = story_coords[1], story_coords[0]
            user_lat, user_lng = user_location['lat'], user_location['lng']
            
            distance = geodesic((story_lat, story_lng), (user_lat, user_lng)).km
            
            if distance > geofence.get('radius_km', 1):
                return jsonify({
                    'error': 'Too far away',
                    'message': f'You need to be within {geofence.get("radius_km")} km to unlock this story',
                    'distance': round(distance, 2)
                }), 403
        
        # Unlock the story
        unlock_record = {
            'user_id': ObjectId(user_id),
            'story_id': ObjectId(story_id),
            'unlocked_at': datetime.utcnow()
        }
        
        story_unlocks_collection.insert_one(unlock_record)
        
        # Increment unlock count
        folklore_collection.update_one(
            {'_id': ObjectId(story_id)},
            {'$inc': {'unlocks': 1}}
        )
        
        return jsonify({
            'message': 'Story unlocked successfully',
            'story_id': story_id,
            'unlocked_at': unlock_record['unlocked_at'].isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@folklore_bp.route('/my-unlocks', methods=['GET'])
@token_required
def get_my_unlocked_stories(current_user):
    """
    Get all stories unlocked by the current user
    
    GET /api/folklore/my-unlocks
    """
    try:
        user_id = str(current_user['_id'])
        
        unlocks = list(story_unlocks_collection.find({
            'user_id': ObjectId(user_id)
        }).sort('unlocked_at', -1))
        
        # Get full story details
        story_ids = [unlock['story_id'] for unlock in unlocks]
        stories = list(folklore_collection.find({
            '_id': {'$in': story_ids}
        }))
        
        # Create a map for quick lookup
        story_map = {str(s['_id']): s for s in stories}
        
        unlocked_stories = []
        for unlock in unlocks:
            story_id = str(unlock['story_id'])
            if story_id in story_map:
                story = story_map[story_id]
                story['_id'] = story_id
                story['author_id'] = str(story['author_id'])
                story['unlocked_at'] = unlock['unlocked_at'].isoformat()
                unlocked_stories.append(story)
        
        return jsonify({
            'unlocked_stories': unlocked_stories,
            'count': len(unlocked_stories)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@folklore_bp.route('/nearby', methods=['GET'])
def get_nearby_folklore():
    """
    Get nearby folklore stories based on user location
    
    GET /api/folklore/nearby?lat=12.3052&lng=76.6552&radius=10
    """
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 10, type=float)
        
        if not lat or not lng:
            return jsonify({'error': 'Location (lat, lng) required'}), 400
        
        stories = list(folklore_collection.find({
            'status': 'published',
            'location': {
                '$near': {
                    '$geometry': {
                        'type': 'Point',
                        'coordinates': [lng, lat]
                    },
                    '$maxDistance': radius * 1000
                }
            }
        }).limit(20))
        
        for story in stories:
            story['_id'] = str(story['_id'])
            story['author_id'] = str(story['author_id'])
            
            # Calculate distance
            story_coords = story['location']['coordinates']
            story_lat, story_lng = story_coords[1], story_coords[0]
            distance = geodesic((lat, lng), (story_lat, story_lng)).km
            story['distance_km'] = round(distance, 2)
        
        return jsonify({
            'nearby_stories': stories,
            'count': len(stories)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
