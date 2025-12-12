"""
AI Chat History model - stores user chatbot conversations
Each user has their own chat history document with up to 20 messages
"""
from models import db
from datetime import datetime

ai_chat_collection = db.ai_chat_history

def get_user_chat_history(user_id):
    """
    Get chat history for a user
    
    Args:
        user_id: User's Firebase UID or MongoDB ObjectId string
    
    Returns:
        dict: Chat history document with messages
    """
    history = ai_chat_collection.find_one({'user_id': user_id})
    if history:
        return history
    return {'user_id': user_id, 'messages': []}

def add_chat_message(user_id, role, text):
    """
    Add a message to user's chat history (max 20 messages)
    
    Args:
        user_id: User's Firebase UID or MongoDB ObjectId string
        role: 'user' or 'assistant'
        text: Message content
    
    Returns:
        dict: The added message
    """
    message = {
        'role': role,
        'text': text,
        'timestamp': datetime.utcnow()
    }
    
    # Upsert: create if not exists, update if exists
    result = ai_chat_collection.update_one(
        {'user_id': user_id},
        {
            '$push': {
                'messages': {
                    '$each': [message],
                    '$slice': -20  # Keep only last 20 messages
                }
            },
            '$setOnInsert': {
                'user_id': user_id,
                'created_at': datetime.utcnow()
            },
            '$set': {
                'updated_at': datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return message

def get_chat_messages(user_id, limit=20):
    """
    Get last N messages for a user
    
    Args:
        user_id: User ID
        limit: Maximum messages to return (default 20)
    
    Returns:
        list: List of message dicts
    """
    history = get_user_chat_history(user_id)
    messages = history.get('messages', [])
    return messages[-limit:] if len(messages) > limit else messages

def clear_chat_history(user_id):
    """Clear all chat history for a user"""
    return ai_chat_collection.update_one(
        {'user_id': user_id},
        {'$set': {'messages': [], 'updated_at': datetime.utcnow()}}
    )

def get_chat_context(user_id):
    """
    Get chat history formatted for AI context
    
    Returns:
        list: Messages formatted as [{'role': 'user', 'content': '...'}, ...]
    """
    messages = get_chat_messages(user_id)
    return [
        {'role': msg['role'], 'content': msg['text']}
        for msg in messages
    ]
