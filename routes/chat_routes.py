"""
Chat routes - Messaging and conversations
"""
from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from models import db

# Collections
users_collection = db.users
user_locations_collection = db.user_locations
conversations_collection = db.conversations
messages_collection = db.chat_messages

# Constants
ONLINE_TIMEOUT_MINUTES = 5
PREMIUM_CHAT_COST = 50

# Create 2dsphere index for geospatial queries
try:
    user_locations_collection.create_index([("location", "2dsphere")])
    print("[OK] Created 2dsphere index on user_locations.location")
except Exception as e:
    print(f"[INFO] 2dsphere index: {e}")

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    """
    Get user's conversations
    
    Query Parameters:
    - type: Filter by type (ai, locals, tourists)
    
    Headers:
    Authorization: Bearer <token>
    """
    try:
        conv_type = request.args.get('type', 'ai')
        
        # Sample conversations
        conversations = []
        if conv_type == 'ai':
            conversations = [{
                'id': 'ai-chatbot',
                'name': 'Vaaya Assistant',
                'type': 'ai',
                'avatar': '🤖',
                'last_message': 'How can I help you today?',
                'timestamp': datetime.utcnow().isoformat()
            }]
        elif conv_type == 'locals':
            conversations = [
                {
                    'id': 'local-1',
                    'name': 'Pierre Dubois',
                    'type': 'local',
                    'avatar': '👨',
                    'last_message': 'Welcome to Paris!',
                    'timestamp': datetime.utcnow().isoformat()
                },
                {
                    'id': 'local-2',
                    'name': 'Marie Laurent',
                    'type': 'local',
                    'avatar': '👩',
                    'last_message': 'Let me know if you need help',
                    'timestamp': datetime.utcnow().isoformat()
                }
            ]
        elif conv_type == 'tourists':
            conversations = [
                {
                    'id': 'tourist-1',
                    'name': 'Sarah Johnson',
                    'type': 'tourist',
                    'avatar': '👤',
                    'last_message': 'Great trip so far!',
                    'timestamp': datetime.utcnow().isoformat()
                }
            ]
        
        return jsonify({
            'conversations': conversations,
            'count': len(conversations)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/messages/<conversation_id>', methods=['GET'])
@token_required
def get_messages(current_user, conversation_id):
    """
    Get messages from a conversation
    
    GET /chat/messages/<conversation_id>
    """
    try:
        # Sample messages
        messages = [
            {
                'id': '1',
                'sender_id': conversation_id,
                'sender_name': 'Vaaya Assistant',
                'message': 'Hello! How can I help you today?',
                'timestamp': datetime.utcnow().isoformat(),
                'is_own': False
            }
        ]
        
        return jsonify({
            'messages': messages,
            'count': len(messages)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/send', methods=['POST'])
@token_required
def send_message(current_user):
    """
    Send a message
    
    POST /chat/send
    Body: {
        "conversation_id": "ai-chatbot",
        "message": "Hello"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        # In production, save to database
        # For now, return success
        
        return jsonify({
            'message': 'Message sent successfully',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



# ===========================
# Community Chat - User to User
# ===========================

@chat_bp.route('/travelers/nearby', methods=['GET'])
@token_required
def get_nearby_travelers(current_user):
    """
    Get nearby travelers for community connections
    
    GET /chat/travelers/nearby
    Query: lat, lng (optional - uses user's location)
    """
    try:
        # Sample nearby travelers
        travelers = [
            {
                '_id': 'n1',
                'name': 'Alex Thompson',
                'location': 'Nearby',
                'distance': '0.5 km',
                'badge': 'FELLOW_TRAVELER',
                'role': 'traveler'
            },
            {
                '_id': 'n2',
                'name': 'Lisa Park',
                'location': 'Nearby',
                'distance': '1.2 km',
                'badge': 'CULTURAL_GUEST',
                'role': 'traveler'
            },
            {
                '_id': 'n3',
                'name': 'James Wilson',
                'location': 'Nearby',
                'distance': '2 km',
                'badge': 'FELLOW_TRAVELER',
                'role': 'traveler'
            }
        ]
        
        return jsonify({
            'travelers': travelers,
            'count': len(travelers)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


<<<<<<< HEAD

=======
>>>>>>> 903cb9fbccf072c57bd74e7579de5fa03aa0a744
# ===========================
# AI Chat History Endpoints
# ===========================

DEMO_USER_ID = 'demo_user'

@chat_bp.route('/ai-history/', methods=['GET'])
def get_ai_chat_history():
    """
    Get AI chat history (up to 20 messages)
    Uses demo user for no-auth mode
    
    GET /chat/ai-history/
    """
    try:
        from models.ai_chat import get_chat_messages
        
        # Use demo user ID (in production, get from auth)
        messages = get_chat_messages(DEMO_USER_ID, limit=20)
        
        # Format for frontend
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
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/ai-history/', methods=['POST'])
def add_ai_chat_message():
    """
    Add a message to AI chat history
    
    POST /chat/ai-history/
    Body: {
        "role": "user" or "assistant",
        "text": "message content"
    }
    """
    try:
        from models.ai_chat import add_chat_message
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        role = data.get('role')
        text = data.get('text')
        
        if not role or role not in ['user', 'assistant']:
            return jsonify({'error': 'Invalid role. Must be "user" or "assistant"'}), 400
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Use demo user ID (in production, get from auth)
        message = add_chat_message(DEMO_USER_ID, role, text)
        
        return jsonify({
            'message': 'Message added',
            'data': {
                'role': message['role'],
                'text': message['text'],
                'timestamp': message['timestamp'].isoformat()
            }
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/ai-history/', methods=['DELETE'])
def clear_ai_chat_history():
    """
    Clear AI chat history
    
    DELETE /chat/ai-history/
    """
    try:
        from models.ai_chat import clear_chat_history
        
        clear_chat_history(DEMO_USER_ID)
        
        return jsonify({
            'message': 'Chat history cleared'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@chat_bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation(current_user):
    """
    Start a new conversation with another user
    
    POST /chat/conversations
    Body: { "user_id": "<target_user_id>" }
    """
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({'error': 'user_id is required'}), 400
        
        target_user_id = data['user_id']
        
        # In production, create conversation in database
        # For now, return mock conversation
        conversation = {
            '_id': f'conv_{target_user_id}',
            'participant': {
                '_id': target_user_id,
                'name': 'New Connection',
                'role': 'traveler',
                'location': 'Nearby'
            },
            'lastMessage': {
                'text': 'Say hello!',
                'timestamp': datetime.utcnow().isoformat(),
                'read': True
            },
            'unreadCount': 0,
            'created_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'message': 'Conversation created',
            'conversation': conversation
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Location & Nearby Discovery (Demo - no auth)
# ===========================

@chat_bp.route('/location/update', methods=['POST'])
def update_user_location():
    """
    Update user's current location
    
    POST /api/chat/location/update
    Body: { "user_id": "demo_user", "lat": 12.9716, "lng": 77.5946, "name": "John" }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'demo_user')
        lat = data.get('lat')
        lng = data.get('lng')
        name = data.get('name', 'Anonymous')
        role = data.get('role', 'tourist')
        
        if lat is None or lng is None:
            return jsonify({'error': 'lat and lng are required'}), 400
        
        # Upsert user location
        user_locations_collection.update_one(
            {'user_id': user_id},
            {
                '$set': {
                    'user_id': user_id,
                    'name': name,
                    'role': role,
                    'location': {
                        'type': 'Point',
                        'coordinates': [float(lng), float(lat)]
                    },
                    'last_seen': datetime.utcnow(),
                    'is_online': True
                }
            },
            upsert=True
        )
        
        return jsonify({
            'message': 'Location updated',
            'location': {'lat': lat, 'lng': lng}
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/users/nearby', methods=['GET'])
def get_nearby_users():
    """
    Get nearby users within range
    
    GET /api/chat/users/nearby?lat=12.9716&lng=77.5946&range=10&role=all
    """
    try:
        lat = float(request.args.get('lat', 12.9716))
        lng = float(request.args.get('lng', 77.5946))
        range_km = float(request.args.get('range', 10))
        role_filter = request.args.get('role', 'all')  # 'all', 'tourist', 'local'
        current_user_id = request.args.get('user_id', '')
        
        # Build query
        query = {
            'location': {
                '$nearSphere': {
                    '$geometry': {
                        'type': 'Point',
                        'coordinates': [lng, lat]
                    },
                    '$maxDistance': range_km * 1000  # Convert km to meters
                }
            }
        }
        
        if role_filter != 'all':
            query['role'] = role_filter
            
        if current_user_id:
            query['user_id'] = {'$ne': current_user_id}  # Exclude self
        
        # Check online status (within last 5 minutes)
        online_threshold = datetime.utcnow() - timedelta(minutes=ONLINE_TIMEOUT_MINUTES)
        
        users = list(user_locations_collection.find(query).limit(50))
        
        result = []
        for user in users:
            # Calculate distance
            user_coords = user.get('location', {}).get('coordinates', [0, 0])
            dist_km = calculate_distance(lat, lng, user_coords[1], user_coords[0])
            
            result.append({
                '_id': user.get('user_id', str(user.get('_id', ''))),
                'name': user.get('name', 'Anonymous'),
                'role': user.get('role', 'tourist'),
                'distance': f"{dist_km:.1f} km",
                'distance_km': dist_km,
                'is_online': user.get('last_seen', datetime.min) > online_threshold,
                'last_seen': user.get('last_seen', datetime.utcnow()).isoformat()
            })
        
        # Sort by distance
        result.sort(key=lambda x: x['distance_km'])
        
        return jsonify({
            'users': result,
            'count': len(result),
            'range_km': range_km
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/locals/nearby', methods=['GET'])
def get_nearby_locals():
    """
    Get nearby local guides
    
    GET /api/chat/locals/nearby?lat=12.9716&lng=77.5946&range=20
    """
    try:
        lat = float(request.args.get('lat', 12.9716))
        lng = float(request.args.get('lng', 77.5946))
        range_km = float(request.args.get('range', 20))
        
        query = {
            'role': 'local',
            'location': {
                '$nearSphere': {
                    '$geometry': {
                        'type': 'Point',
                        'coordinates': [lng, lat]
                    },
                    '$maxDistance': range_km * 1000
                }
            }
        }
        
        online_threshold = datetime.utcnow() - timedelta(minutes=ONLINE_TIMEOUT_MINUTES)
        locals_list = list(user_locations_collection.find(query).limit(30))
        
        result = []
        for local in locals_list:
            coords = local.get('location', {}).get('coordinates', [0, 0])
            dist_km = calculate_distance(lat, lng, coords[1], coords[0])
            
            result.append({
                '_id': local.get('user_id', str(local.get('_id', ''))),
                'name': local.get('name', 'Local Guide'),
                'role': 'local',
                'distance': f"{dist_km:.1f} km",
                'distance_km': dist_km,
                'is_online': local.get('last_seen', datetime.min) > online_threshold,
                'rating': local.get('rating', 4.5),
                'quests_count': local.get('quests_count', 0),
                'premium_available': True
            })
        
        result.sort(key=lambda x: x['distance_km'])
        
        return jsonify({
            'locals': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/premium/start', methods=['POST'])
def start_premium_chat():
    """
    Start premium chat with a local guide (costs 50 XP)
    
    POST /api/chat/premium/start
    Body: { "user_id": "tourist_id", "local_id": "local_guide_id" }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        local_id = data.get('local_id')
        
        if not user_id or not local_id:
            return jsonify({'error': 'user_id and local_id required'}), 400
        
        # Check user points (using users collection)
        user = users_collection.find_one({'_id': ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
        
        # For demo, create conversation without point check
        if user:
            current_points = user.get('points', 0)
            if current_points < PREMIUM_CHAT_COST:
                return jsonify({
                    'error': f'Not enough points. Need {PREMIUM_CHAT_COST} XP, have {current_points} XP'
                }), 400
            
            # Deduct points
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$inc': {'points': -PREMIUM_CHAT_COST}}
            )
        
        # Create conversation
        conversation = {
            'participants': [user_id, local_id],
            'type': 'premium',
            'points_cost': PREMIUM_CHAT_COST,
            'messages': [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = conversations_collection.insert_one(conversation)
        
        return jsonify({
            'message': 'Premium chat started',
            'conversation_id': str(result.inserted_id),
            'points_deducted': PREMIUM_CHAT_COST
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two points in km using Haversine formula"""
    import math
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


# ===========================
# Chat Request System
# ===========================

chat_requests_collection = db.chat_requests

@chat_bp.route('/request/send', methods=['POST'])
def send_chat_request():
    """
    Send chat request from tourist to local
    
    POST /api/chat/request/send
    Body: { "from_user_id": "tourist_id", "from_name": "Tourist Name", "to_local_id": "local_id", "message": "Hi!" }
    """
    try:
        data = request.get_json()
        from_user_id = data.get('from_user_id')
        from_name = data.get('from_name', 'Traveler')
        to_local_id = data.get('to_local_id')
        message = data.get('message', 'Hi! I would like to chat with you.')
        
        if not from_user_id or not to_local_id:
            return jsonify({'error': 'from_user_id and to_local_id required'}), 400
        
        # Check if request already exists
        existing = chat_requests_collection.find_one({
            'from_user_id': from_user_id,
            'to_local_id': to_local_id,
            'status': 'pending'
        })
        
        if existing:
            return jsonify({'error': 'Request already pending'}), 400
        
        chat_request = {
            'from_user_id': from_user_id,
            'from_name': from_name,
            'to_local_id': to_local_id,
            'message': message,
            'status': 'pending',  # pending, approved, rejected
            'created_at': datetime.utcnow()
        }
        
        result = chat_requests_collection.insert_one(chat_request)
        
        return jsonify({
            'message': 'Chat request sent',
            'request_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/request/pending', methods=['GET'])
def get_pending_requests():
    """
    Get pending chat requests for a local guide
    
    GET /api/chat/request/pending?local_id=xyz
    """
    try:
        local_id = request.args.get('local_id')
        
        if not local_id:
            return jsonify({'error': 'local_id required'}), 400
        
        requests = list(chat_requests_collection.find({
            'to_local_id': local_id,
            'status': 'pending'
        }).sort('created_at', -1))
        
        for req in requests:
            req['_id'] = str(req['_id'])
            req['created_at'] = req['created_at'].isoformat()
        
        return jsonify({
            'requests': requests,
            'count': len(requests)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/request/<request_id>/respond', methods=['POST'])
def respond_to_request(request_id):
    """
    Approve or reject a chat request
    
    POST /api/chat/request/<request_id>/respond
    Body: { "action": "approve" | "reject" }
    """
    try:
        data = request.get_json()
        action = data.get('action')
        
        if action not in ['approve', 'reject']:
            return jsonify({'error': 'action must be approve or reject'}), 400
        
        # Update request status
        result = chat_requests_collection.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {'status': 'approved' if action == 'approve' else 'rejected'}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Request not found'}), 404
        
        # If approved, create a conversation
        if action == 'approve':
            req = chat_requests_collection.find_one({'_id': ObjectId(request_id)})
            if req:
                conversation = {
                    'participants': [req['from_user_id'], req['to_local_id']],
                    'type': 'approved_request',
                    'messages': [{
                        'sender_id': req['from_user_id'],
                        'text': req['message'],
                        'timestamp': req['created_at']
                    }],
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                conversations_collection.insert_one(conversation)
        
        return jsonify({
            'message': f'Request {action}d successfully'
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/travelers/nearby/for-local', methods=['GET'])
def get_nearby_travelers_for_local():
    """
    Get nearby travelers for local guides
    
    GET /api/chat/travelers/nearby/for-local?lat=12.9716&lng=77.5946&range=20
    """
    try:
        lat = float(request.args.get('lat', 12.9716))
        lng = float(request.args.get('lng', 77.5946))
        range_km = float(request.args.get('range', 20))
        local_id = request.args.get('local_id', '')
        
        query = {
            'role': 'tourist',
            'location': {
                '$nearSphere': {
                    '$geometry': {
                        'type': 'Point',
                        'coordinates': [lng, lat]
                    },
                    '$maxDistance': range_km * 1000
                }
            }
        }
        
        online_threshold = datetime.utcnow() - timedelta(minutes=ONLINE_TIMEOUT_MINUTES)
        travelers = list(user_locations_collection.find(query).limit(30))
        
        result = []
        for traveler in travelers:
            coords = traveler.get('location', {}).get('coordinates', [0, 0])
            dist_km = calculate_distance(lat, lng, coords[1], coords[0])
            
            result.append({
                '_id': traveler.get('user_id', str(traveler.get('_id', ''))),
                'name': traveler.get('name', 'Traveler'),
                'role': 'tourist',
                'distance': f"{dist_km:.1f} km",
                'distance_km': dist_km,
                'is_online': traveler.get('last_seen', datetime.min) > online_threshold
            })
        
        result.sort(key=lambda x: x['distance_km'])
        
        return jsonify({
            'travelers': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
