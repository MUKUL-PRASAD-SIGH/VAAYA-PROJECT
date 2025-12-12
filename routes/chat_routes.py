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
