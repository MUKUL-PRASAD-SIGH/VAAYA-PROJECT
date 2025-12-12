"""
🌍 Vaaya MongoDB Database Connection
------------------------------------
Centralized database setup for all Vaaya features:
1️⃣ Auth & Users
2️⃣ Trips & Itineraries
3️⃣ AI Clean-Up Quests (Feature #1)
4️⃣ Folklore Cultural Stories (Feature #4)
5️⃣ Real-Time Chat + Gamification (Feature #5)
6️⃣ Hospitality Experiences System (Feature #6)
7️⃣ Notifications, Leaderboard, and Analytics
"""

from pymongo import MongoClient, ASCENDING
from config import Config

# ==========================================================
# 🔗 CONNECT TO MONGO
# ==========================================================
try:
    client = MongoClient(Config.MONGO_URI)
    db = client.get_database()
except Exception as e:
    # Guarantee module exports a `db` symbol even if connection fails
    client = None
    db = None
    print(f"[DB] Failed to connect to MongoDB: {e}")

# ==========================================================
# 👥 USER & AUTH MODULE
# ==========================================================
users_collection = db["users"]
sessions_collection = db["sessions"]
fcm_tokens_collection = db["fcm_tokens"]

# ==========================================================
# ✈️ TRIPS & ITINERARIES
# ==========================================================
trips_collection = db["trips"]
itineraries_collection = db["itineraries"]
activities_collection = db["activities"]

# ==========================================================
# 🌱 FEATURE #1 — AI-VERIFIED CLEAN-UP QUEST SYSTEM
# ==========================================================
quests_collection = db["quests"]
quest_submissions_collection = db["quest_submissions"]
pending_verifications_collection = db["pending_verifications"]
impact_metrics_collection = db["impact_metrics"]

# ==========================================================
# 🎭 FEATURE #4 — CULTURAL STORYTELLING (FOLKLORE)
# ==========================================================
folklore_collection = db["folklore"]
story_unlocks_collection = db["story_unlocks"]

# ==========================================================
# 💬 FEATURE #5 — REAL-TIME CHAT + AI CONVERSATIONS
# ==========================================================
chat_messages_collection = db["chat_messages"]
chat_rooms_collection = db["chat_rooms"]

# ==========================================================
# 🏨 FEATURE #6 — HOSPITALITY EXPERIENCES SYSTEM
# ==========================================================
hospitality_experiences_collection = db["hospitality_experiences"]
hospitality_bookings_collection = db["hospitality_bookings"]
hospitality_reviews_collection = db["hospitality_reviews"]
hospitality_index_collection = db["hospitality_index"]  # For aggregated host ratings and scores

# ==========================================================
# 🏅 GAMIFICATION + XP + LEADERBOARD
# ==========================================================
notifications_collection = db["notifications"]
leaderboard_collection = db["leaderboard"]

# ==========================================================
# 📊 ANALYTICS & ADMIN MONITORING
# ==========================================================
impact_analytics_collection = db["impact_analytics"]
activity_logs_collection = db["activity_logs"]
moderation_queue_collection = db["moderation_queue"]

# ==========================================================
# ⚙️ INDEXES & DATA INTEGRITY
# ==========================================================
def ensure_indexes():
    """Create indexes for faster lookups and geo queries"""

    # ===== USERS =====
    users_collection.create_index([("email", ASCENDING)], unique=True)
    users_collection.create_index([("xp", ASCENDING)])
    users_collection.create_index([("role", ASCENDING)])

    # ===== TRIPS =====
    trips_collection.create_index([("user_id", ASCENDING)])
    itineraries_collection.create_index([("trip_id", ASCENDING)])

    # ===== CLEAN-UP QUESTS =====
    quests_collection.create_index([("location", "2dsphere")])
    quest_submissions_collection.create_index(
        [("quest_id", ASCENDING), ("user_id", ASCENDING)], unique=True
    )

    # ===== FOLKLORE =====
    folklore_collection.create_index([("location", "2dsphere")])
    story_unlocks_collection.create_index(
        [("user_id", ASCENDING), ("story_id", ASCENDING)], unique=True
    )

    # ===== CHAT =====
    chat_messages_collection.create_index([("room", ASCENDING)])
    chat_messages_collection.create_index([("timestamp", ASCENDING)])
    chat_rooms_collection.create_index([("participants", ASCENDING)])

    # ===== HOSPITALITY =====
    hospitality_experiences_collection.create_index([("location", "2dsphere")])
    hospitality_bookings_collection.create_index(
        [("experience_id", ASCENDING), ("guest_id", ASCENDING)], unique=True
    )
    hospitality_reviews_collection.create_index([("experience_id", ASCENDING)])
    hospitality_index_collection.create_index([("host_id", ASCENDING)], unique=True)

    # ===== GAMIFICATION =====
    notifications_collection.create_index([("user_id", ASCENDING)])
    leaderboard_collection.create_index([("xp", -1)])

    # ===== ANALYTICS =====
    impact_metrics_collection.create_index([("gps", "2dsphere")])
    impact_analytics_collection.create_index([("timestamp", ASCENDING)])

# Initialize indexes once
ensure_indexes()

print("✅ MongoDB initialized with all Vaaya collections and indexes!")
