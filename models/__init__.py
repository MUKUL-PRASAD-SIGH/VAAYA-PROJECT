"""Database models package"""
from pymongo import MongoClient
from config import Config

# Initialize MongoDB client
client = MongoClient(Config.MONGO_URI)
db = client.get_database()

# Import user functions for convenience
from models.user import find_user_by_firebase_uid, create_user_from_firebase
from pymongo import ASCENDING

# Content Studio Collections
content_items = db["content_items"]          # master records
content_revisions = db["content_revisions"]  # version history
media_assets = db["media_assets"]            # uploaded files (img/audio/video)
ai_moderation_jobs = db["ai_moderation_jobs"]# AI checks + results
content_unlocks = db["content_unlocks"]      # geo unlock logs
users_collection = db["users"]               # users collection

def ensure_content_indexes():
    content_items.create_index([("author_id", ASCENDING)])
    content_items.create_index([("status", ASCENDING)])
    content_items.create_index([("type", ASCENDING)])
    content_items.create_index([("location", "2dsphere")])         # geo queries
    content_unlocks.create_index([("user_id", ASCENDING), ("content_id", ASCENDING)], unique=True)

try:
    ensure_content_indexes()
except Exception as e:
    print(f"Warning: Could not create indexes: {e}")

# Export db instance
__all__ = [
    'db', 
    'find_user_by_firebase_uid', 
    'create_user_from_firebase',
    'content_items',
    'content_revisions',
    'media_assets',
    'ai_moderation_jobs',
    'content_unlocks',
    'users_collection'
]

