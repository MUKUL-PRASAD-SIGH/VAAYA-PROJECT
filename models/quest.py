"""
Quest model - Tasks created by local guides
"""
from models import db
from datetime import datetime

quests_collection = db.quests
quest_completions_collection = db.quest_completions

def create_quest(local_id, title, description, location, reward, verification_type='photo'):
    """Create a new quest"""
    quest = {
        'local_id': local_id,
        'title': title,
        'description': description,
        'location': location,  # {'type': 'Point', 'coordinates': [lng, lat], 'name': 'Location Name'}
        'reward': reward,  # Points or currency
        'verification_type': verification_type,  # 'photo', 'checkin', 'code'
        'verification_prompt': None,  # What AI should look for in photo
        'difficulty': 'medium',  # easy, medium, hard
        'estimated_time': 30,  # minutes
        'category': None,  # food, culture, adventure, etc.
        'active': True,
        'created_at': datetime.utcnow(),
        'completions': 0,
        'rating': 0.0
    }
    
    result = quests_collection.insert_one(quest)
    quest['_id'] = result.inserted_id
    return quest

def find_quests_nearby(latitude, longitude, max_distance_km=20, limit=50):
    """Find active quests near a location"""
    return list(quests_collection.find({
        'active': True,
        'location.coordinates': {
            '$near': {
                '$geometry': {
                    'type': 'Point',
                    'coordinates': [longitude, latitude]
                },
                '$maxDistance': max_distance_km * 1000
            }
        }
    }).limit(limit))

def get_quest_by_id(quest_id):
    """Get quest by ID"""
    from bson.objectid import ObjectId
    return quests_collection.find_one({'_id': ObjectId(quest_id)})

def submit_quest_completion(quest_id, user_id, proof_image_url, location=None):
    """Submit quest completion for verification"""
    completion = {
        'quest_id': quest_id,
        'user_id': user_id,
        'proof_image_url': proof_image_url,
        'location': location,
        'submitted_at': datetime.utcnow(),
        'verified': False,
        'verification_result': None,
        'reward_claimed': False
    }
    
    result = quest_completions_collection.insert_one(completion)
    completion['_id'] = result.inserted_id
    return completion

def verify_quest_completion(completion_id, verified, verification_result):
    """Update quest completion verification status"""
    from bson.objectid import ObjectId
    return quest_completions_collection.update_one(
        {'_id': ObjectId(completion_id)},
        {'$set': {
            'verified': verified,
            'verification_result': verification_result,
            'verified_at': datetime.utcnow()
        }}
    )

def get_user_completions(user_id):
    """Get all quest completions for a user"""
    from bson.objectid import ObjectId
    return list(quest_completions_collection.find({'user_id': ObjectId(user_id)}))
