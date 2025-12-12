"""
Chat message model
"""
from models import db
from datetime import datetime

messages_collection = db.chat_messages
conversations_collection = db.conversations

def create_conversation(user1_id, user2_id):
    """Create or get existing conversation between two users"""
    from bson.objectid import ObjectId
    
    # Check if conversation already exists
    existing = conversations_collection.find_one({
        'participants': {
            '$all': [ObjectId(user1_id), ObjectId(user2_id)]
        }
    })
    
    if existing:
        return existing
    
    conversation = {
        'participants': [ObjectId(user1_id), ObjectId(user2_id)],
        'created_at': datetime.utcnow(),
        'last_message_at': datetime.utcnow(),
        'last_message': None
    }
    
    result = conversations_collection.insert_one(conversation)
    conversation['_id'] = result.inserted_id
    return conversation

def send_message(conversation_id, sender_id, message_text, message_type='text'):
    """Send a chat message"""
    from bson.objectid import ObjectId
    
    message = {
        'conversation_id': ObjectId(conversation_id),
        'sender_id': ObjectId(sender_id),
        'message': message_text,
        'type': message_type,  # text, image, location
        'sent_at': datetime.utcnow(),
        'read': False
    }
    
    result = messages_collection.insert_one(message)
    message['_id'] = result.inserted_id
    
    # Update conversation last message
    conversations_collection.update_one(
        {'_id': ObjectId(conversation_id)},
        {'$set': {
            'last_message': message_text,
            'last_message_at': datetime.utcnow()
        }}
    )
    
    return message

def get_conversation_messages(conversation_id, limit=100):
    """Get messages from a conversation"""
    from bson.objectid import ObjectId
    return list(messages_collection.find({
        'conversation_id': ObjectId(conversation_id)
    }).sort('sent_at', -1).limit(limit))

def get_user_conversations(user_id):
    """Get all conversations for a user"""
    from bson.objectid import ObjectId
    return list(conversations_collection.find({
        'participants': ObjectId(user_id)
    }).sort('last_message_at', -1))

def mark_messages_read(conversation_id, user_id):
    """Mark all messages in a conversation as read for a user"""
    from bson.objectid import ObjectId
    return messages_collection.update_many(
        {
            'conversation_id': ObjectId(conversation_id),
            'sender_id': {'$ne': ObjectId(user_id)},
            'read': False
        },
        {'$set': {'read': True}}
    )
