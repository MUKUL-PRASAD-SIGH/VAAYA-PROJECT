"""Database models package"""
from pymongo import MongoClient
from config import Config

# Initialize MongoDB client
client = MongoClient(Config.MONGO_URI)
db = client.get_database()

# Export db instance
__all__ = ['db']
