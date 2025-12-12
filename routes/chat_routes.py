"""
Chat routes - Messaging and conversations
"""
from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from bson.objectid import ObjectId
from datetime import datetime

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

<<<<<<< HEAD

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
=======
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
>>>>>>> b3f4028c3b560f71e29a3e6dc58b3fea0ea11000
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
<<<<<<< HEAD


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

=======
>>>>>>> b3f4028c3b560f71e29a3e6dc58b3fea0ea11000
