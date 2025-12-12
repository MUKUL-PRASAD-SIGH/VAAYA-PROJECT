"""
Notification routes - Push notification management
"""
from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from utils.fcm_notifications import subscribe_to_topic, unsubscribe_from_topic
from models.user import find_user_by_id

notification_bp = Blueprint('notifications', __name__)

@notification_bp.route('/subscribe', methods=['POST'])
@token_required
def subscribe_topic(current_user):
    """
    Subscribe user to a notification topic
    
    Request Body:
    {
        "topic": "topic_name"
    }
    
    Headers:
    Authorization: Bearer <token>
    """
    data = request.get_json()
    
    if not data or 'topic' not in data:
        return jsonify({'error': 'Topic is required'}), 400
    
    topic = data['topic']
    user_id = current_user['user_id']
    
    try:
        # Get user's FCM token
        user = find_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        fcm_token = user.get('fcm_token')
        
        if not fcm_token:
            return jsonify({'error': 'No FCM token found. Please register device first.'}), 400
        
        # Subscribe to topic
        result = subscribe_to_topic(fcm_token, topic)
        
        if result:
            return jsonify({
                'message': f'Successfully subscribed to {topic}',
                'topic': topic
            }), 200
        else:
            return jsonify({'error': 'Failed to subscribe to topic'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/unsubscribe', methods=['POST'])
@token_required
def unsubscribe_topic(current_user):
    """
    Unsubscribe user from a notification topic
    
    Request Body:
    {
        "topic": "topic_name"
    }
    
    Headers:
    Authorization: Bearer <token>
    """
    data = request.get_json()
    
    if not data or 'topic' not in data:
        return jsonify({'error': 'Topic is required'}), 400
    
    topic = data['topic']
    user_id = current_user['user_id']
    
    try:
        # Get user's FCM token
        user = find_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        fcm_token = user.get('fcm_token')
        
        if not fcm_token:
            return jsonify({'error': 'No FCM token found'}), 400
        
        # Unsubscribe from topic
        result = unsubscribe_from_topic(fcm_token, topic)
        
        if result:
            return jsonify({
                'message': f'Successfully unsubscribed from {topic}',
                'topic': topic
            }), 200
        else:
            return jsonify({'error': 'Failed to unsubscribe from topic'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
