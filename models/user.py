"""
User model for both tourists and local guides
"""
from models import db
from datetime import datetime
import bcrypt

users_collection = db.users

def create_user(email, password, role='tourist', phone=None, name=None):
    """Create a new user"""
    print(f"DEBUG: Creating user with email: {email}, role: {role}")
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    print(f"DEBUG: Password hashed successfully")
    
    user = {
        'email': email,
        'password_hash': password_hash,
        'role': role,  # 'tourist' or 'local'
        'phone': phone,
        'name': name,
        'verified': False if role == 'local' else True,  # Locals need OTP verification
        'created_at': datetime.utcnow(),
        'fcm_token': None,  # For push notifications
        'profile_image': None,
        'bio': None,
        'rating': 0.0,
        'completed_quests': 0,
        'points': 0,
        'location': None  # {'type': 'Point', 'coordinates': [lng, lat]}
    }
    
    result = users_collection.insert_one(user)
    user['_id'] = result.inserted_id
    print(f"DEBUG: User created with ID: {user['_id']}")
    return user

def find_user_by_email(email):
    """Find user by email"""
    return users_collection.find_one({'email': email})

def find_user_by_id(user_id):
    """Find user by ID"""
    from bson.objectid import ObjectId
    return users_collection.find_one({'_id': ObjectId(user_id)})

def verify_password(user, password):
    """Verify user password"""
    try:
        print(f"DEBUG: Verifying password for user: {user.get('email')}")
        print(f"DEBUG: Password hash exists: {bool(user.get('password_hash'))}")
        result = bcrypt.checkpw(password.encode('utf-8'), user['password_hash'])
        print(f"DEBUG: Password verification result: {result}")
        return result
    except Exception as e:
        print(f"DEBUG: Password verification error: {e}")
        return False

def update_user(user_id, updates):
    """Update user information"""
    from bson.objectid import ObjectId
    return users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': updates}
    )

def find_locals_nearby(latitude, longitude, max_distance_km=50):
    """Find verified local guides near a location"""
    return users_collection.find({
        'role': 'local',
        'verified': True,
        'location': {
            '$near': {
                '$geometry': {
                    'type': 'Point',
                    'coordinates': [longitude, latitude]
                },
                '$maxDistance': max_distance_km * 1000  # Convert to meters
            }
        }
    })

# ===========================
# Firebase Integration
# ===========================

def find_user_by_firebase_uid(firebase_uid):
    """Find user by Firebase UID"""
    return users_collection.find_one({'firebase_uid': firebase_uid})

def create_user_from_firebase(firebase_uid, email, password=None, preference='user', name=None):
    """
    Create a new user from Firebase authentication
    
    Args:
        firebase_uid: Firebase user UID
        email: User email
        password: Optional password (will be bcrypt hashed)
        preference: 'local' or 'user' (traveller)
        name: Display name
    
    Returns:
        dict: Created user document
    """
    print(f"DEBUG: Creating Firebase user with uid: {firebase_uid}, email: {email}")
    
    # Check if user already exists
    existing = find_user_by_firebase_uid(firebase_uid)
    if existing:
        print(f"DEBUG: User already exists with Firebase UID: {firebase_uid}")
        return existing
    
    # Hash password if provided
    password_hash = None
    if password:
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Map preference to role
    role = 'local' if preference == 'local' else 'tourist'
    
    user = {
        'firebase_uid': firebase_uid,
        'email': email,
        'password_hash': password_hash,
        'role': role,
        'preference': preference,  # 'local' or 'user'
        'name': name,
        'verified': True,  # Firebase already verified
        'created_at': datetime.utcnow(),
        'fcm_token': None,
        'profile_image': None,
        'bio': None,
        'rating': 0.0,
        'completed_quests': 0,
        'points': 0,
        'location': None,
        'preferences': {},  # Onboarding preferences
        'ai_messages': []   # AI chat history (up to 20)
    }
    
    result = users_collection.insert_one(user)
    user['_id'] = result.inserted_id
    print(f"DEBUG: Firebase user created with ID: {user['_id']}")
    return user

def update_user_by_firebase_uid(firebase_uid, updates):
    """Update user by Firebase UID"""
    return users_collection.update_one(
        {'firebase_uid': firebase_uid},
        {'$set': updates}
    )

def add_ai_message(firebase_uid, role, text):
    """
    Add an AI chat message to user's history (max 20 messages)
    
    Args:
        firebase_uid: Firebase user UID
        role: 'user' or 'assistant'
        text: Message text
    """
    message = {
        'role': role,
        'text': text,
        'timestamp': datetime.utcnow()
    }
    
    # Push message and keep only last 20
    users_collection.update_one(
        {'firebase_uid': firebase_uid},
        {
            '$push': {
                'ai_messages': {
                    '$each': [message],
                    '$slice': -20  # Keep only last 20 messages
                }
            }
        }
    )
    return message

def get_user_ai_messages(firebase_uid, limit=20):
    """Get user's AI chat messages"""
    user = find_user_by_firebase_uid(firebase_uid)
    if user:
        messages = user.get('ai_messages', [])
        return messages[-limit:] if len(messages) > limit else messages
    return []
