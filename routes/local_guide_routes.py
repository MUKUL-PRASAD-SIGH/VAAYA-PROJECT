"""
Local Guide Routes - API endpoints for local guide features
Quest creation, content management, analytics, and earnings
"""
from flask import Blueprint, request, jsonify
from utils.firebase_utils import firebase_required
from models import find_user_by_firebase_uid
from bson.objectid import ObjectId
from datetime import datetime
from models import db

local_guide_bp = Blueprint('local_guide', __name__)

# Collections
quests_collection = db.quests
content_collection = db.local_content
folklore_collection = db.folklore
earnings_collection = db.earnings
analytics_collection = db.guide_analytics


# ===========================
# Helper Functions
# ===========================

def get_user_id_from_firebase(current_user):
    """
    Get MongoDB user _id from Firebase UID
    Creates user if doesn't exist
    """
    firebase_uid = current_user.get('uid')
    if not firebase_uid:
        return None
    
    user = find_user_by_firebase_uid(firebase_uid)
    if user:
        return str(user.get('_id'))
    
    # User doesn't exist in MongoDB yet - create them
    from models.user import create_user_from_firebase
    new_user = create_user_from_firebase(
        firebase_uid=firebase_uid,
        email=current_user.get('email', ''),
        preference='local',  # Default to local for local-guide routes
        name=current_user.get('name', '')
    )
    return str(new_user.get('_id'))


# ===========================
# Quest Management
# ===========================

@local_guide_bp.route('/quests', methods=['GET'])
@firebase_required
def get_my_quests(current_user):
    """
    Get all quests created by the local guide
    
    GET /api/local-guide/quests
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        quests = list(quests_collection.find({
            'local_id': ObjectId(user_id)
        }).sort('created_at', -1))
        
        # Convert ObjectIds to strings
        for quest in quests:
            quest['_id'] = str(quest['_id'])
            quest['local_id'] = str(quest['local_id'])
        
        return jsonify({
            'quests': quests,
            'count': len(quests)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/quests', methods=['POST'])
@firebase_required
def create_quest(current_user):
    """
    Create a new quest
    
    POST /api/local-guide/quests
    Body: {
        "title": "Beach Cleanup Quest",
        "description": "Help clean the beach",
        "category": "environmental",
        "location": {
            "name": "Gokarna Beach",
            "coordinates": { "lat": 14.5479, "lng": 74.3188 }
        },
        "reward_points": 100,
        "difficulty": "medium",
        "estimated_time": 60,
        "verification_type": "photo",
        "verification_instructions": "Take before and after photos"
    }
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        # Validate required fields
        required_fields = ['title', 'description', 'category', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get location name
        location_data = data['location']
        location_name = location_data.get('name', '')
        
        # Parse coordinates (handle both dict and list formats)
        coords_input = location_data.get('coordinates')
        lat, lng = 0, 0
        
        if isinstance(coords_input, list) and len(coords_input) >= 2:
            lng, lat = coords_input[0], coords_input[1]
        elif isinstance(coords_input, dict):
            lat = coords_input.get('lat', 0)
            lng = coords_input.get('lng', 0)
            
        if not location_name:
            location_name = f"{lat:.4f}, {lng:.4f}"
        
        quest = {
            'local_id': ObjectId(user_id),
            'title': data['title'],
            'description': data['description'],
            'category': data['category'],
            'location': {
                'name': location_name,
                'type': 'Point',
                'coordinates': [lng, lat]
            },
            'radius_meters': data.get('radius_meters', 100),
            'reward_points': data.get('reward_points', 50),
            'difficulty': data.get('difficulty', 'medium'),
            'estimated_time': data.get('estimated_time', 30),
            'verification_type': data.get('verification_type', 'photo'),
            'verification_instructions': data.get('verification_instructions', ''),
            'tags': data.get('tags', []),
            'active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'completions': 0,
            'pending_verifications': 0,
            'rating': 0.0,
            'total_ratings': 0
        }
        
        result = quests_collection.insert_one(quest)
        quest['_id'] = str(result.inserted_id)
        quest['local_id'] = str(quest['local_id'])
        
        return jsonify({
            'message': 'Quest created successfully',
            'quest': quest
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/quests/<quest_id>', methods=['PUT'])
@firebase_required
def update_quest(current_user, quest_id):
    """
    Update a quest
    
    PUT /api/local-guide/quests/<quest_id>
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        # Verify ownership
        quest = quests_collection.find_one({
            '_id': ObjectId(quest_id),
            'local_id': ObjectId(user_id)
        })
        
        if not quest:
            return jsonify({'error': 'Quest not found or not authorized'}), 404
        
        # Allowed update fields
        update_fields = {}
        allowed = ['title', 'description', 'category', 'reward_points', 
                   'difficulty', 'estimated_time', 'verification_instructions', 
                   'tags', 'active']
        
        for field in allowed:
            if field in data:
                update_fields[field] = data[field]
        
        if update_fields:
            update_fields['updated_at'] = datetime.utcnow()
            quests_collection.update_one(
                {'_id': ObjectId(quest_id)},
                {'$set': update_fields}
            )
        
        return jsonify({'message': 'Quest updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/quests/<quest_id>', methods=['DELETE'])
@firebase_required
def delete_quest(current_user, quest_id):
    """
    Delete a quest (soft delete by setting active=False)
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        result = quests_collection.update_one(
            {'_id': ObjectId(quest_id), 'local_id': ObjectId(user_id)},
            {'$set': {'active': False, 'deleted_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Quest not found or not authorized'}), 404
        
        return jsonify({'message': 'Quest deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/quests/stats', methods=['GET'])
@firebase_required
def get_quest_stats(current_user):
    """
    Get quest statistics for local guide dashboard
    
    GET /api/local-guide/quests/stats
    
    Returns:
    {
        "total_quests": 5,
        "active_quests": 3,
        "completed_quests": 12,
        "pending_verifications": 2,
        "total_earnings": 600,
        "top_quest": {
            "title": "Temple Clean-Up",
            "completions": 10
        }
    }
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        # Get all quests by this guide
        all_quests = list(quests_collection.find({'local_id': ObjectId(user_id)}))
        active_quests = [q for q in all_quests if q.get('active', True)]
        
        # Calculate total completions
        total_completions = sum(q.get('completions', 0) for q in all_quests)
        total_pending = sum(q.get('pending_verifications', 0) for q in all_quests)
        
        # Get top performing quest
        top_quest = max(all_quests, key=lambda q: q.get('completions', 0)) if all_quests else None
        
        # Calculate total earnings (from completions)
        total_earnings = 0
        for quest in all_quests:
            earnings_per_completion = quest.get('reward_points', 0) * 0.1  # 10% commission
            total_earnings += earnings_per_completion * quest.get('completions', 0)
        
        return jsonify({
            'total_quests': len(all_quests),
            'active_quests': len(active_quests),
            'completed_quests': total_completions,
            'pending_verifications': total_pending,
            'total_earnings': int(total_earnings),
            'top_quest': {
                'title': top_quest.get('title', 'N/A'),
                'completions': top_quest.get('completions', 0)
            } if top_quest else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Traveler Submissions (Verification)
# ===========================

@local_guide_bp.route('/submissions', methods=['GET'])
@firebase_required
def get_pending_submissions(current_user):
    """
    Get pending quest submissions for verification
    
    GET /api/local-guide/submissions?status=pending
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        status = request.args.get('status', 'pending')
        
        # Get quests created by this guide
        my_quests = list(quests_collection.find(
            {'local_id': ObjectId(user_id)},
            {'_id': 1}
        ))
        quest_ids = [q['_id'] for q in my_quests]
        
        # Get submissions for these quests
        submissions_collection = db.quest_completions
        submissions = list(submissions_collection.find({
            'quest_id': {'$in': quest_ids},
            'verified': False if status == 'pending' else True
        }).sort('submitted_at', -1))
        
        # Enrich with quest and user data
        for sub in submissions:
            sub['_id'] = str(sub['_id'])
            sub['quest_id'] = str(sub['quest_id'])
            sub['user_id'] = str(sub['user_id'])
            
            # Get quest info
            quest = quests_collection.find_one({'_id': ObjectId(sub['quest_id'])})
            if quest:
                sub['quest_name'] = quest.get('title', 'Unknown Quest')
            
            # Get traveler info
            user = db.users.find_one({'_id': ObjectId(sub['user_id'])})
            if user:
                sub['traveler_name'] = user.get('name', 'Anonymous')
        
        return jsonify({
            'submissions': submissions,
            'count': len(submissions)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/submissions/<submission_id>/verify', methods=['POST'])
@firebase_required
def verify_submission(current_user, submission_id):
    """
    Approve or reject a quest submission
    
    POST /api/local-guide/submissions/<submission_id>/verify
    Body: {
        "approved": true,
        "feedback": "Great job cleaning up!"
    }
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        approved = data.get('approved', False)
        feedback = data.get('feedback', '')
        
        submissions_collection = db.quest_completions
        
        # Get submission
        submission = submissions_collection.find_one({'_id': ObjectId(submission_id)})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404
        
        # Verify ownership of quest
        quest = quests_collection.find_one({
            '_id': submission['quest_id'],
            'local_id': ObjectId(user_id)
        })
        
        if not quest:
            return jsonify({'error': 'Not authorized to verify this submission'}), 403
        
        # Update submission
        submissions_collection.update_one(
            {'_id': ObjectId(submission_id)},
            {'$set': {
                'verified': True,
                'approved': approved,
                'feedback': feedback,
                'verified_by': ObjectId(user_id),
                'verified_at': datetime.utcnow()
            }}
        )
        
        # If approved, award points to traveler and update quest stats
        if approved:
            db.users.update_one(
                {'_id': submission['user_id']},
                {
                    '$inc': {
                        'points': quest.get('reward_points', 50),
                        'completed_quests': 1
                    }
                }
            )
            quests_collection.update_one(
                {'_id': quest['_id']},
                {'$inc': {'completions': 1}}
            )
        
        return jsonify({
            'message': 'Submission verified successfully',
            'approved': approved
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Content Management (Stories, Tips, etc.)
# ===========================

@local_guide_bp.route('/content', methods=['GET'])
@firebase_required
def get_my_content(current_user):
    """
    Get all content created by the local guide
    
    GET /api/local-guide/content?type=story
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        content_type = request.args.get('type')
        
        query = {'author_id': ObjectId(user_id)}
        if content_type:
            query['type'] = content_type
        
        content = list(content_collection.find(query).sort('created_at', -1))
        
        for item in content:
            item['_id'] = str(item['_id'])
            item['author_id'] = str(item['author_id'])
        
        return jsonify({
            'content': content,
            'count': len(content)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/content', methods=['POST'])
@firebase_required
def create_content(current_user):
    """
    Create new content (story, tip, hidden gem, event)
    
    POST /api/local-guide/content
    Body: {
        "type": "story",
        "title": "The Legend of Mysore Palace",
        "content": "Long ago...",
        "location": {
            "name": "Mysore Palace",
            "coordinates": { "lat": 12.3052, "lng": 76.6552 }
        },
        "tags": ["history", "palace", "royalty"],
        "media": ["url1", "url2"]
    }
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        content_item = {
            'author_id': ObjectId(user_id),
            'type': data.get('type', 'story'),  # story, place, tip, event
            'title': data.get('title', ''),
            'content': data.get('content', ''),
            'location': {
                'name': data.get('location', {}).get('name', ''),
                'type': 'Point',
                'coordinates': [
                    data.get('location', {}).get('coordinates', {}).get('lng', 0),
                    data.get('location', {}).get('coordinates', {}).get('lat', 0)
                ]
            },
            'tags': data.get('tags', []),
            'media': data.get('media', []),
            'status': data.get('status', 'draft'),  # draft, published
            'likes': 0,
            'unlocks': 0,
            'views': 0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = content_collection.insert_one(content_item)
        content_item['_id'] = str(result.inserted_id)
        content_item['author_id'] = str(content_item['author_id'])
        
        return jsonify({
            'message': 'Content created successfully',
            'content': content_item
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/content/<content_id>', methods=['PUT'])
@firebase_required
def update_content(current_user, content_id):
    """
    Update content (auto-syncs to folklore collection when published)
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        # Verify ownership
        content = content_collection.find_one({
            '_id': ObjectId(content_id),
            'author_id': ObjectId(user_id)
        })
        
        if not content:
            return jsonify({'error': 'Content not found or not authorized'}), 404
        
        old_status = content.get('status')
        update_fields = {}
        allowed = ['title', 'content', 'tags', 'media', 'status', 'xp_required', 'geofence']
        
        for field in allowed:
            if field in data:
                update_fields[field] = data[field]
        
        if update_fields:
            update_fields['updated_at'] = datetime.utcnow()
            content_collection.update_one(
                {'_id': ObjectId(content_id)},
                {'$set': update_fields}
            )
            
            # 🔄 Auto-sync to folklore collection when status changes to 'published'
            new_status = data.get('status')
            if new_status == 'published' and old_status != 'published':
                # Get updated content
                updated_content = content_collection.find_one({'_id': ObjectId(content_id)})
                
                # Check if already exists in folklore
                existing_folklore = folklore_collection.find_one({'source_local_id': ObjectId(content_id)})
                
                if existing_folklore:
                    # Update existing folklore entry
                    folklore_collection.update_one(
                        {'source_local_id': ObjectId(content_id)},
                        {'$set': {
                            'title': updated_content.get('title'),
                            'content': updated_content.get('content'),
                            'tags': updated_content.get('tags', []),
                            'media': updated_content.get('media', []),
                            'status': 'published',
                            'xp_required': updated_content.get('xp_required', 0),
                            'geofence': updated_content.get('geofence'),
                            'updated_at': datetime.utcnow()
                        }}
                    )
                else:
                    # Create new folklore entry
                    folklore_item = {
                        'source_local_id': ObjectId(content_id),
                        'author_id': updated_content['author_id'],
                        'type': updated_content.get('type', 'story'),
                        'title': updated_content.get('title', ''),
                        'content': updated_content.get('content', ''),
                        'location': updated_content.get('location'),
                        'tags': updated_content.get('tags', []),
                        'media': updated_content.get('media', []),
                        'status': 'published',
                        'xp_required': updated_content.get('xp_required', 0),
                        'geofence': updated_content.get('geofence'),
                        'likes': 0,
                        'unlocks': 0,
                        'views': 0,
                        'created_at': updated_content.get('created_at', datetime.utcnow()),
                        'updated_at': datetime.utcnow()
                    }
                    folklore_collection.insert_one(folklore_item)
        
        return jsonify({'message': 'Content updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/content/<content_id>', methods=['DELETE'])
@firebase_required
def delete_content(current_user, content_id):
    """
    Delete content (soft delete by setting active=False)
    
    DELETE /api/local-guide/content/<content_id>
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        # Verify ownership
        content = content_collection.find_one({
            '_id': ObjectId(content_id),
            'author_id': ObjectId(user_id)
        })
        
        if not content:
            return jsonify({'error': 'Content not found or not authorized'}), 404
        
        # Soft delete
        content_collection.update_one(
            {'_id': ObjectId(content_id)},
            {'$set': {'active': False, 'deleted_at': datetime.utcnow()}}
        )
        
        # Also remove from folklore if it was published
        if content.get('status') == 'published':
            folklore_collection.update_one(
                {'source_local_id': ObjectId(content_id)},
                {'$set': {'status': 'deleted', 'deleted_at': datetime.utcnow()}}
            )
        
        return jsonify({'message': 'Content deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===========================
# 🏨 Hospitality Management
# ===========================

@local_guide_bp.route('/hospitality', methods=['GET'])
@firebase_required
def get_my_hospitality_services(current_user):
    """
    Get all hospitality services added by this local guide

    GET /api/local-guide/hospitality
    Query: ?type=restaurant/stay/experience/event
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        service_type = request.args.get('type')

        services_collection = db.hospitality

        query = {'guide_id': ObjectId(user_id)}
        if service_type:
            query['type'] = service_type

        services = list(services_collection.find(query).sort('created_at', -1))

        for s in services:
            s['_id'] = str(s['_id'])
            s['guide_id'] = str(s['guide_id'])

        return jsonify({
            'services': services,
            'count': len(services)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/hospitality', methods=['POST'])
@firebase_required
def add_hospitality_service(current_user):
    """
    Add a new hospitality service (restaurant, stay, cultural event, local experience)
    
    POST /api/local-guide/hospitality
    Body: {
        "name": "Sunset Cafe",
        "type": "restaurant",
        "description": "Eco-friendly local cafe serving traditional meals",
        "location": {
            "name": "Mysore Main Street",
            "coordinates": { "lat": 12.3052, "lng": 76.6552 }
        },
        "pricing": "₹200-500 per person",
        "contact": "+91 9876543210",
        "media": ["url1", "url2"]
    }
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401

        required = ["name", "type", "description", "location"]
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        service = {
            "guide_id": ObjectId(user_id),
            "name": data["name"],
            "type": data["type"],  # restaurant / stay / experience / event
            "description": data["description"],
            "location": {
                "name": data["location"].get("name", ""),
                "type": "Point",
                "coordinates": [
                    data["location"].get("coordinates", {}).get("lng", 0),
                    data["location"].get("coordinates", {}).get("lat", 0)
                ]
            },
            "pricing": data.get("pricing", ""),
            "contact": data.get("contact", ""),
            "media": data.get("media", []),
            "rating": 0.0,
            "reviews": [],
            "verified": False,
            "active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = db.hospitality.insert_one(service)
        service["_id"] = str(result.inserted_id)
        service["guide_id"] = str(service["guide_id"])

        return jsonify({
            "message": "Hospitality service added successfully",
            "service": service
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/hospitality/<service_id>', methods=['PUT'])
@firebase_required
def update_hospitality_service(current_user, service_id):
    """
    Update hospitality service details
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401

        service = db.hospitality.find_one({
            "_id": ObjectId(service_id),
            "guide_id": ObjectId(user_id)
        })

        if not service:
            return jsonify({'error': 'Service not found or unauthorized'}), 404

        update_fields = {}
        allowed = ["name", "description", "pricing", "contact", "media", "active"]
        for field in allowed:
            if field in data:
                update_fields[field] = data[field]

        if update_fields:
            update_fields["updated_at"] = datetime.utcnow()
            db.hospitality.update_one(
                {"_id": ObjectId(service_id)},
                {"$set": update_fields}
            )

        return jsonify({'message': 'Service updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/hospitality/<service_id>', methods=['DELETE'])
@firebase_required
def delete_hospitality_service(current_user, service_id):
    """
    Soft delete hospitality service
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        result = db.hospitality.update_one(
            {"_id": ObjectId(service_id), "guide_id": ObjectId(user_id)},
            {"$set": {"active": False, "deleted_at": datetime.utcnow()}}
        )

        if result.modified_count == 0:
            return jsonify({'error': 'Service not found or unauthorized'}), 404

        return jsonify({'message': 'Service deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Hospitality Reviews
# ===========================

@local_guide_bp.route('/hospitality/reviews/<hospitality_id>', methods=['GET'])
def get_hospitality_reviews(hospitality_id):
    """
    Get all reviews for a specific hospitality listing
    
    GET /api/local-guide/hospitality/reviews/<hospitality_id>
    
    Public endpoint - no authentication required for viewing reviews
    """
    try:
        reviews_collection = db.hospitality_reviews
        
        # Get all reviews for this hospitality listing
        reviews = list(reviews_collection.find({
            'hospitality_id': ObjectId(hospitality_id)
        }).sort('created_at', -1))
        
        # Enrich reviews with user data
        for review in reviews:
            review['_id'] = str(review['_id'])
            review['hospitality_id'] = str(review['hospitality_id'])
            review['user_id'] = str(review['user_id'])
            
            # Get reviewer info
            user = db.users.find_one({'_id': ObjectId(review['user_id'])})
            if user:
                review['reviewer_name'] = user.get('name', 'Anonymous')
                review['reviewer_avatar'] = user.get('avatar', '')
            else:
                review['reviewer_name'] = 'Anonymous'
                review['reviewer_avatar'] = ''
        
        # Get hospitality service info
        service = db.hospitality.find_one({'_id': ObjectId(hospitality_id)})
        
        return jsonify({
            'reviews': reviews,
            'count': len(reviews),
            'average_rating': service.get('rating', 0) if service else 0,
            'total_ratings': service.get('reviews_count', 0) if service else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/hospitality/reviews', methods=['POST'])
@firebase_required
def add_hospitality_review(current_user):
    """
    Add a review for a hospitality listing
    
    POST /api/local-guide/hospitality/reviews
    Body: {
        "hospitality_id": "...",
        "rating": 5,
        "review": "Amazing experience!"
    }
    
    Auto-updates the hospitality listing's average rating and review count
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        # Validate required fields
        hospitality_id = data.get('hospitality_id')
        rating = data.get('rating')
        review_text = data.get('review', '')
        
        if not hospitality_id or not rating:
            return jsonify({'error': 'hospitality_id and rating are required'}), 400
        
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Check if hospitality service exists
        service = db.hospitality.find_one({'_id': ObjectId(hospitality_id)})
        if not service:
            return jsonify({'error': 'Hospitality service not found'}), 404
        
        # Check if user already reviewed this service
        reviews_collection = db.hospitality_reviews
        existing_review = reviews_collection.find_one({
            'hospitality_id': ObjectId(hospitality_id),
            'user_id': ObjectId(user_id)
        })
        
        if existing_review:
            return jsonify({'error': 'You have already reviewed this service'}), 400
        
        # Create review
        review = {
            'hospitality_id': ObjectId(hospitality_id),
            'user_id': ObjectId(user_id),
            'rating': rating,
            'review': review_text,
            'created_at': datetime.utcnow()
        }
        
        result = reviews_collection.insert_one(review)
        
        # ===========================
        # Auto-Update Rating Logic
        # ===========================
        
        # Get all reviews for this service
        all_reviews = list(reviews_collection.find({
            'hospitality_id': ObjectId(hospitality_id)
        }))
        
        # Calculate new average rating
        total_ratings = len(all_reviews)
        average_rating = sum(r['rating'] for r in all_reviews) / total_ratings if total_ratings > 0 else 0
        average_rating = round(average_rating, 1)
        
        # Update hospitality service
        db.hospitality.update_one(
            {'_id': ObjectId(hospitality_id)},
            {
                '$set': {
                    'rating': average_rating,
                    'reviews_count': total_ratings,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            'message': 'Review added successfully',
            'review_id': str(result.inserted_id),
            'new_average_rating': average_rating,
            'total_reviews': total_ratings
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Analytics & Earnings
# ===========================

@local_guide_bp.route('/analytics', methods=['GET'])
@firebase_required
def get_analytics(current_user):
    """
    Get guide analytics and performance metrics
    
    GET /api/local-guide/analytics?period=month
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        period = request.args.get('period', 'month')
        
        # Get guide's quests
        my_quests = list(quests_collection.find({'local_id': ObjectId(user_id)}))
        quest_ids = [q['_id'] for q in my_quests]
        
        # Calculate stats
        total_quests = len(my_quests)
        total_completions = sum(q.get('completions', 0) for q in my_quests)
        active_quests = len([q for q in my_quests if q.get('active', True)])
        
        # Get content stats
        my_content = list(content_collection.find({'author_id': ObjectId(user_id)}))
        total_content = len(my_content)
        total_likes = sum(c.get('likes', 0) for c in my_content)
        total_unlocks = sum(c.get('unlocks', 0) for c in my_content)
        
        # Get user rating
        user = db.users.find_one({'_id': ObjectId(user_id)})
        rating = user.get('rating', 0) if user else 0
        
        # Calculate earnings (simplified)
        earnings_per_completion = 100  # ₹100 per quest completion
        total_earnings = total_completions * earnings_per_completion
        
        analytics = {
            'overview': {
                'total_quests': total_quests,
                'active_quests': active_quests,
                'total_completions': total_completions,
                'total_content': total_content,
                'total_likes': total_likes,
                'total_unlocks': total_unlocks,
                'rating': rating
            },
            'earnings': {
                'total': total_earnings,
                'this_month': total_earnings * 0.3,  # Placeholder
                'pending_payout': total_earnings * 0.1
            },
            'top_quests': sorted(my_quests, key=lambda x: x.get('completions', 0), reverse=True)[:5],
            'period': period
        }
        
        # Convert ObjectIds
        for q in analytics['top_quests']:
            q['_id'] = str(q['_id'])
            q['local_id'] = str(q['local_id'])
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/earnings', methods=['GET'])
@firebase_required
def get_earnings(current_user):
    """
    Get earnings history and payout status
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        earnings = list(earnings_collection.find({
            'guide_id': ObjectId(user_id)
        }).sort('date', -1).limit(20))
        
        for e in earnings:
            e['_id'] = str(e['_id'])
            e['guide_id'] = str(e['guide_id'])
        
        # Calculate totals
        total = sum(e.get('amount', 0) for e in earnings)
        pending = sum(e.get('amount', 0) for e in earnings if e.get('status') == 'pending')
        
        return jsonify({
            'earnings': earnings,
            'total': total,
            'pending': pending,
            'available_for_withdrawal': total - pending
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@local_guide_bp.route('/earnings/withdraw', methods=['POST'])
@firebase_required
def request_withdrawal(current_user):
    """
    Request earnings withdrawal
    """
    try:
        data = request.get_json()
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        amount = data.get('amount', 0)
        method = data.get('method', 'upi')  # upi, bank_transfer
        
        if amount < 500:
            return jsonify({'error': 'Minimum withdrawal amount is ₹500'}), 400
        
        withdrawal = {
            'guide_id': ObjectId(user_id),
            'amount': amount,
            'method': method,
            'status': 'pending',
            'requested_at': datetime.utcnow()
        }
        
        result = earnings_collection.insert_one(withdrawal)
        
        return jsonify({
            'message': 'Withdrawal request submitted',
            'withdrawal_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Dashboard Overview
# ===========================

@local_guide_bp.route('/dashboard', methods=['GET'])
@firebase_required
def get_dashboard(current_user):
    """
    Get dashboard overview data
    """
    try:
        user_id = get_user_id_from_firebase(current_user)
        if not user_id:
            return jsonify({'error': 'User not found'}), 401
        
        # Get user info
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        # Get quest stats
        my_quests = list(quests_collection.find({'local_id': ObjectId(user_id)}))
        
        # Get content stats
        my_content = list(content_collection.find({'author_id': ObjectId(user_id)}))
        
        # Get pending submissions
        quest_ids = [q['_id'] for q in my_quests]
        pending_count = db.quest_completions.count_documents({
            'quest_id': {'$in': quest_ids},
            'verified': False
        })
        
        dashboard = {
            'guide': {
                'name': user.get('name', 'Local Guide') if user else 'Local Guide',
                'rating': user.get('rating', 0) if user else 0,
                'verified': user.get('verified', False) if user else False
            },
            'stats': {
                'active_quests': len([q for q in my_quests if q.get('active', True)]),
                'total_completions': sum(q.get('completions', 0) for q in my_quests),
                'content_posts': len(my_content),
                'pending_verifications': pending_count
            },
            'recent_activity': []  # To be populated with actual activity
        }
        
        return jsonify(dashboard), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
