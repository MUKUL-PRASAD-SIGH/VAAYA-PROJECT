"""
🌱 AI-Verified Clean-Up Quest System — Updated Flow
----------------------------------------------------
1️⃣ Start Quest (upload before image + verify location)
2️⃣ Complete Quest (upload after image + run AI verification)
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from werkzeug.utils import secure_filename
import os, math

from db import db
from ai.quest_verifier import verify_cleanliness
from utils.jwt_utils import token_required

quest_bp = Blueprint('quests', __name__, url_prefix='/api/quests')

UPLOAD_FOLDER = 'uploads/quests'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# =====================
# Helper Functions
# =====================

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula (meters)"""
    R = 6371000
    phi1, phi2 = map(math.radians, [lat1, lat2])
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# =====================
# STEP 1: Start Quest
# =====================

@quest_bp.route('/start/<quest_id>', methods=['POST'])
@token_required
def start_quest(current_user, quest_id):
    """
    Traveler starts a cleanup quest:
    - Upload BEFORE image
    - Verify proximity
    - Mark quest as 'in_progress'
    """

    try:
        quest = db.quests.find_one({"_id": ObjectId(quest_id)})
        if not quest:
            return jsonify({'error': 'Quest not found'}), 404

        user_lat = float(request.form.get('latitude'))
        user_lng = float(request.form.get('longitude'))

        # Check GPS proximity
        quest_lng, quest_lat = quest['location']['coordinates']
        distance = calculate_distance(user_lat, user_lng, quest_lat, quest_lng)
        if distance > 100:
            return jsonify({'error': 'Too far from quest location', 'distance_m': round(distance, 2)}), 403

        # Handle BEFORE image upload
        if 'before_image' not in request.files:
            return jsonify({'error': 'Before image is required'}), 400

        before_file = request.files['before_image']
        if not allowed_file(before_file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_before_{before_file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        before_file.save(filepath)

        # Save progress in submissions collection
        db.quest_submissions.insert_one({
            'quest_id': ObjectId(quest_id),
            'user_id': ObjectId(current_user['_id']),
            'before_image': filepath,
            'status': 'in_progress',
            'started_at': datetime.utcnow(),
            'location': {'lat': user_lat, 'lng': user_lng}
        })

        return jsonify({
            'success': True,
            'message': 'Quest started! 📸 Before image saved.',
            'next_step': 'Complete quest after cleanup with AFTER image.',
            'quest': {'id': quest_id, 'title': quest['title'], 'distance_m': round(distance, 2)}
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================
# STEP 2: Complete Quest
# =====================

@quest_bp.route('/complete/<quest_id>', methods=['POST'])
@token_required
def complete_quest(current_user, quest_id):
    """
    Traveler completes quest:
    - Upload AFTER image
    - Verify proximity again
    - Run AI cleanliness verification
    - Award XP if verified
    """

    try:
        quest = db.quests.find_one({"_id": ObjectId(quest_id)})
        if not quest:
            return jsonify({'error': 'Quest not found'}), 404

        submission = db.quest_submissions.find_one({
            'quest_id': ObjectId(quest_id),
            'user_id': ObjectId(current_user['_id']),
            'status': 'in_progress'
        })
        if not submission:
            return jsonify({'error': 'No active quest found. Start the quest first!'}), 400

        user_lat = float(request.form.get('latitude'))
        user_lng = float(request.form.get('longitude'))

        # Check proximity again
        quest_lng, quest_lat = quest['location']['coordinates']
        distance = calculate_distance(user_lat, user_lng, quest_lat, quest_lng)
        if distance > 100:
            return jsonify({'error': 'Too far from quest location to complete', 'distance_m': round(distance, 2)}), 403

        # Handle AFTER image
        if 'after_image' not in request.files:
            return jsonify({'error': 'After image is required'}), 400

        after_file = request.files['after_image']
        if not allowed_file(after_file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_after_{after_file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        after_file.save(filepath)

        # Run AI verification
        before_path = submission['before_image']
        result = verify_cleanliness(before_path, filepath, (user_lat, user_lng), (quest_lat, quest_lng))

        # Update submission
        db.quest_submissions.update_one(
            {'_id': submission['_id']},
            {'$set': {
                'after_image': filepath,
                'verified': result.get('verified', False),
                'confidence': result.get('confidence', 0),
                'verified_at': datetime.utcnow(),
                'status': 'verified' if result.get('verified') else 'failed'
            }}
        )

        # Award XP if verified
        if result.get('verified'):
            db.users.update_one(
                {'_id': ObjectId(current_user['_id'])},
                {'$inc': {'xp': quest.get('points', 50)}}
            )

            return jsonify({
                'success': True,
                'message': f"✅ Quest verified successfully! +{quest.get('points', 50)} XP earned.",
                'confidence': result.get('confidence'),
                'quest': {'title': quest['title'], 'id': quest_id}
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': f"❌ Verification failed: {result.get('reason', 'Low improvement detected')}",
                'confidence': result.get('confidence', 0)
            }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

"""
🌱 Fetch All AI Clean-Up Quests
Returns all available quests for display in the frontend
"""

# Removed duplicate blueprint initialization



@quest_bp.route('/all', methods=['GET'])
@quest_bp.route('/', methods=['GET'])
def get_all_quests():
    """
    Fetch all active quests for display in the React frontend.
    Includes quests created by local guides.
    """
    try:
        # Get user location and radius from query params
        user_lat = request.args.get('lat', type=float)
        user_lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', default=10000, type=int) # Default 10km

        # Build query
        query = {'active': True}
        
        # Add geospatial filter if location provided
        if user_lat and user_lng:
            query['location'] = {
                '$near': {
                    '$geometry': {
                        'type': 'Point',
                        'coordinates': [user_lng, user_lat]
                    },
                    '$maxDistance': radius
                }
            }

        # Fetch quests (sorted by distance automatically by $near if used)
        if 'location' in query:
            quests = list(db.quests.find(query))
        else:
            quests = list(db.quests.find(query).sort("created_at", -1))
        result = []

        for q in quests:
            # Extract coordinates (stored as [lng, lat] in MongoDB)
            location_coords = q.get('location', {}).get('coordinates', [0, 0])
            # Handle both list [lng, lat] and dict {lat, lng} legacy formats
            if isinstance(location_coords, dict):
                quest_lat = location_coords.get('lat', 0)
                quest_lng = location_coords.get('lng', 0)
            else:
                quest_lng, quest_lat = location_coords[0], location_coords[1]
            
            quest_data = {
                'id': str(q['_id']),
                'name': q.get('title', 'Unnamed Quest'),
                'description': q.get('description', 'Help improve the environment through this quest!'),
                'location': q.get('location', {}).get('name', 'Unknown Location'),
                'coordinates': {'lat': quest_lat, 'lng': quest_lng},
                'points': q.get('reward_points', 50),
                'difficulty': q.get('difficulty', 'Easy').capitalize(),
                'category': q.get('category', 'environment'),
                'requirements': q.get('verification_instructions', '').split('\n') if q.get('verification_instructions') else [
                    'Take before and after cleanup photos',
                    'Dispose collected trash properly',
                    'Submit proof through the app'
                ],
                'estimated_time': q.get('estimated_time', 30),
                'radius_meters': q.get('radius_meters', 100)
            }
            
            # Calculate distance if user location provided
            if user_lat and user_lng:
                distance = calculate_distance(user_lat, user_lng, quest_lat, quest_lng)
                quest_data['distance_meters'] = round(distance, 2)
            
            result.append(quest_data)

        # Demo data block removed to show only real DB quests

        return jsonify({
            'success': True,
            'count': len(result),
            'quests': result
        }), 200

    except Exception as e:
        print("⚠️ Error fetching quests:", e)
        return jsonify({'error': str(e)}), 500
