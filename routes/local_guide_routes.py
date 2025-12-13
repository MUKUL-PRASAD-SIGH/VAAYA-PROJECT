"""
Local Guide Routes - API endpoints for local guide features
Quest creation, content management, analytics, and earnings
"""
from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from bson.objectid import ObjectId
from datetime import datetime
from models import db

local_guide_bp = Blueprint('local_guide', __name__)

# Collections
quests_collection = db.quests
content_collection = db.local_content
earnings_collection = db.earnings
analytics_collection = db.guide_analytics


# ===========================
# Quest Management
# ===========================

@local_guide_bp.route('/quests', methods=['GET'])
@token_required
def get_my_quests(current_user):
    """
    Get all quests created by the local guide
    
    GET /api/local-guide/quests
    """
    try:
        user_id = current_user.get('user_id')
        
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
@token_required
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
        print(f"DEBUG: create_quest received: {data}")
        print(f"DEBUG: current_user: {current_user}")
        user_id = current_user.get('user_id')
        
        # Validate required fields
        required_fields = ['title', 'description', 'category', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        quest = {
            'local_id': ObjectId(user_id),
            'title': data['title'],
            'description': data['description'],
            'category': data['category'],  # environmental, cultural, community, heritage, responsible
            'location': {
                'name': data['location'].get('name', ''),
                'type': 'Point',
                'coordinates': [
                    data['location'].get('coordinates', {}).get('lng', 0),
                    data['location'].get('coordinates', {}).get('lat', 0)
                ]
            },
            'radius_meters': data.get('radius_meters', 100),  # Geo-fence radius
            'reward_points': data.get('reward_points', 50),
            'difficulty': data.get('difficulty', 'medium'),
            'estimated_time': data.get('estimated_time', 30),  # minutes
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
@token_required
def update_quest(current_user, quest_id):
    """
    Update a quest
    
    PUT /api/local-guide/quests/<quest_id>
    """
    try:
        data = request.get_json()
        user_id = current_user.get('user_id')
        
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
@token_required
def delete_quest(current_user, quest_id):
    """
    Delete a quest (soft delete by setting active=False)
    """
    try:
        user_id = current_user.get('user_id')
        
        result = quests_collection.update_one(
            {'_id': ObjectId(quest_id), 'local_id': ObjectId(user_id)},
            {'$set': {'active': False, 'deleted_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Quest not found or not authorized'}), 404
        
        return jsonify({'message': 'Quest deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Traveler Submissions (Verification)
# ===========================

@local_guide_bp.route('/submissions', methods=['GET'])
@token_required
def get_pending_submissions(current_user):
    """
    Get pending quest submissions for verification
    
    GET /api/local-guide/submissions?status=pending
    """
    try:
        user_id = current_user.get('user_id')
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
@token_required
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
        user_id = current_user.get('user_id')
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
@token_required
def get_my_content(current_user):
    """
    Get all content created by the local guide
    
    GET /api/local-guide/content?type=story
    """
    try:
        user_id = current_user.get('user_id')
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
@token_required
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
        user_id = current_user.get('user_id')
        
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
@token_required
def update_content(current_user, content_id):
    """
    Update content
    """
    try:
        data = request.get_json()
        user_id = current_user.get('user_id')
        
        # Verify ownership
        content = content_collection.find_one({
            '_id': ObjectId(content_id),
            'author_id': ObjectId(user_id)
        })
        
        if not content:
            return jsonify({'error': 'Content not found or not authorized'}), 404
        
        update_fields = {}
        allowed = ['title', 'content', 'tags', 'media', 'status']
        
        for field in allowed:
            if field in data:
                update_fields[field] = data[field]
        
        if update_fields:
            update_fields['updated_at'] = datetime.utcnow()
            content_collection.update_one(
                {'_id': ObjectId(content_id)},
                {'$set': update_fields}
            )
        
        return jsonify({'message': 'Content updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# Analytics & Earnings
# ===========================

@local_guide_bp.route('/analytics', methods=['GET'])
@token_required
def get_analytics(current_user):
    """
    Get guide analytics and performance metrics
    
    GET /api/local-guide/analytics?period=month
    """
    try:
        user_id = current_user.get('user_id')
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
@token_required
def get_earnings(current_user):
    """
    Get earnings history and payout status
    """
    try:
        user_id = current_user.get('user_id')
        
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
@token_required
def request_withdrawal(current_user):
    """
    Request earnings withdrawal
    """
    try:
        data = request.get_json()
        user_id = current_user.get('user_id')
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
@token_required
def get_dashboard(current_user):
    """
    Get dashboard overview data
    """
    try:
        user_id = current_user.get('user_id')
        
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
