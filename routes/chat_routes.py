"""
💬 Chat Routes - Messaging, Conversations, and AI Chat History
--------------------------------------------------------------
Handles:
1️⃣ Real-time & community chat endpoints
2️⃣ AI conversation logging and retrieval
3️⃣ Nearby traveler discovery
"""
from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from bson.objectid import ObjectId
from datetime import datetime

chat_bp = Blueprint('chat', __name__)

# ===========================
# Conversations
# ===========================

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
                    'avatar': '👨‍🌾',
                    'last_message': 'Welcome to Paris!',
                    'timestamp': datetime.utcnow().isoformat()
                },
                {
                    'id': 'local-2',
                    'name': 'Marie Laurent',
                    'type': 'local',
                    'avatar': '👩‍🎨',
                    'last_message': 'Let me know if you need help!',
                    'timestamp': datetime.utcnow().isoformat()
                }
            ]
        elif conv_type == 'tourists':
            conversations = [
                {
                    'id': 'tourist-1',
                    'name': 'Sarah Johnson',
                    'type': 'tourist',
                    'avatar': '🧳',
                    'last_message': 'Great trip so far!',
                    'timestamp': datetime.utcnow().isoformat()
                }
            ]

        return jsonify({
            'success': True,
            'conversations': conversations,
            'count': len(conversations)
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

        # Mock conversation
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
# Messages
# ===========================

@chat_bp.route('/messages/<conversation_id>', methods=['GET'])
@token_required
def get_messages(current_user, conversation_id):
    """
    Get messages from a conversation
    """
    try:
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
            'success': True,
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
    
    Body: {
        "conversation_id": "ai-chatbot",
        "message": "Hello"
    }
    """
    try:
        data = request.get_json()

        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400

        return jsonify({
            'message': 'Message sent successfully',
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Community Chat - Nearby Travelers
# ===========================

@chat_bp.route('/travelers/nearby', methods=['GET'])
@token_required
def get_nearby_travelers(current_user):
    """
    Get nearby travelers for community connections
    
    GET /chat/travelers/nearby
    """
    try:
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
            'success': True,
            'travelers': travelers,
            'count': len(travelers)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# AI Chat History
# ===========================

DEMO_USER_ID = 'demo_user'

@chat_bp.route('/ai-history', methods=['GET'])
def get_ai_chat_history():
    """
    Get AI chat history (up to 20 messages)
    """
    try:
        from models.ai_chat import get_chat_messages

        messages = get_chat_messages(DEMO_USER_ID, limit=20)

        formatted = [{
            'role': msg['role'],
            'text': msg['text'],
            'timestamp': msg['timestamp'].isoformat() if hasattr(msg['timestamp'], 'isoformat') else str(msg['timestamp'])
        } for msg in messages]

        return jsonify({
            'success': True,
            'messages': formatted,
            'count': len(formatted)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/ai-history', methods=['POST'])
def add_ai_chat_message():
    """
    Add a message to AI chat history
    """
    try:
        from models.ai_chat import add_chat_message

        data = request.get_json()
        role = data.get('role')
        text = data.get('text')

        if not role or not text:
            return jsonify({'error': 'role and text are required'}), 400

        message = add_chat_message(DEMO_USER_ID, role, text)

        return jsonify({
            'success': True,
            'data': {
                'role': message['role'],
                'text': message['text'],
                'timestamp': message['timestamp'].isoformat()
            }
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/ai-history', methods=['DELETE'])
def clear_ai_chat_history():
    """
    Clear AI chat history
    """
    try:
        from models.ai_chat import clear_chat_history
        clear_chat_history(DEMO_USER_ID)
        return jsonify({'success': True, 'message': 'Chat history cleared'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
