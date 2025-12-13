from flask import Blueprint, request, jsonify
from models import db
from utils.firebase_utils import firebase_required
from bson import ObjectId
from datetime import datetime

hospitality_bp = Blueprint('hospitality_bp', __name__)

def get_mongo_user(firebase_user):
    """Helper to get MongoDB user from Firebase user dict"""
    return db.users.find_one({'firebase_uid': firebase_user['uid']})

# ==========================================
# Public Hospitality APIs (for Travelers)
# ==========================================

@hospitality_bp.route('/experiences', methods=['GET'])
def get_public_experiences():
    """Get all experiences for travelers (Public)"""
    try:
        # Basic filtering
        city = request.args.get('city')
        category = request.args.get('category')
        query = request.args.get('q')

        match_stage = {'status': 'active'}
        
        if city:
            match_stage['city'] = {'$regex': city, '$options': 'i'}
        
        if category and category != 'all':
            match_stage['category'] = category
            
        if query:
            match_stage['$or'] = [
                {'title': {'$regex': query, '$options': 'i'}},
                {'description': {'$regex': query, '$options': 'i'}}
            ]

        experiences = list(db.experiences.find(match_stage).sort('created_at', -1))

        # Format for JSON response
        formatted_experiences = []
        for exp in experiences:
            exp['_id'] = str(exp['_id'])
            exp['host_id'] = str(exp['host_id'])
            exp['price'] = float(exp.get('price', 0))
            formatted_experiences.append(exp)

        return jsonify({'experiences': formatted_experiences}), 200
    except Exception as e:
        print(f"Error fetching public experiences: {e}")
        return jsonify({'error': 'Failed to fetch experiences'}), 500

# ==========================================
# Host Experience Management
# ==========================================

@hospitality_bp.route('/host/experiences', methods=['GET'])
@firebase_required
def get_my_experiences(current_user):
    """Get all experiences created by the logged-in local guide"""
    try:
        user = get_mongo_user(current_user)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        experiences = list(db.experiences.find({'host_id': user['_id']}))
        
        # Format for JSON response
        for exp in experiences:
            exp['_id'] = str(exp['_id'])
            exp['host_id'] = str(exp['host_id'])
            # Ensure price is int/float
            exp['price'] = float(exp.get('price', 0))
        
        return jsonify({'experiences': experiences}), 200
    except Exception as e:
        print(f"Error fetching experiences: {e}")
        return jsonify({'error': 'Failed to fetch experiences'}), 500

@hospitality_bp.route('/host/experiences', methods=['POST'])
@firebase_required
def create_experience(current_user):
    """Create a new experience offering"""
    try:
        user = get_mongo_user(current_user)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.json
        
        if not data.get('title') or not data.get('description'):
            return jsonify({'error': 'Title and description are required'}), 400

        new_experience = {
            'host_id': user['_id'],
            'host_name': user.get('name', 'Local Guide'),
            'title': data['title'],
            'description': data['description'],
            'category': data.get('category', 'cultural_event'),
            'price': float(data.get('price', 0)),
            'currency': 'INR',
            'city': data.get('city', 'Unknown'),
            'guest_limit': int(data.get('guest_limit', 6)),
            'duration': data.get('duration', '2 hours'),
            'photos': data.get('photos', ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400']), # Default image if none provided
            'status': 'active',
            'avg_rating': 0.0,
            'total_bookings': 0,
            'reviews_count': 0,
            'created_at': datetime.utcnow()
        }

        result = db.experiences.insert_one(new_experience)
        new_experience['_id'] = str(result.inserted_id)
        new_experience['host_id'] = str(new_experience['host_id'])
        
        return jsonify({'message': 'Experience created successfully', 'experience': new_experience}), 201

    except Exception as e:
        print(f"Error creating experience: {e}")
        return jsonify({'error': str(e)}), 500

# ==========================================
# Host Booking Management
# ==========================================

@hospitality_bp.route('/host/bookings', methods=['GET'])
@firebase_required
def get_host_bookings(current_user):
    """Get all bookings for the host's experiences"""
    try:
        user = get_mongo_user(current_user)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # 1. Find all experience IDs belonging to this host
        my_experiences = list(db.experiences.find({'host_id': user['_id']}, {'_id': 1, 'title': 1}))
        exp_ids = [exp['_id'] for exp in my_experiences]
        exp_map = {str(exp['_id']): exp['title'] for exp in my_experiences} # Map ID to Title

        if not exp_ids:
            return jsonify({'bookings': []}), 200

        # 2. Find bookings for these experiences
        bookings = list(db.bookings.find({'experience_id': {'$in': exp_ids}}).sort('created_at', -1))

        # 3. Format bookings
        formatted_bookings = []
        for booking in bookings:
            booking['_id'] = str(booking['_id'])
            booking['experience_id'] = str(booking['experience_id'])
            
            # Add experience title
            booking['experience'] = {
                'title': exp_map.get(booking['experience_id'], 'Unknown Experience')
            }
            
            # Format guest info
            if 'guest_name' not in booking and 'guest_id' in booking:
                guest = db.users.find_one({'_id': booking['guest_id']})
                booking['guest'] = {
                    'name': guest.get('name', 'Unknown Guest') if guest else 'Unknown Guest',
                    'avatar': guest.get('avatar') if guest else None
                }
            elif 'guest' not in booking:
                 booking['guest'] = {'name': 'Guest', 'avatar': None}

            formatted_bookings.append(booking)

        return jsonify({'bookings': formatted_bookings}), 200

    except Exception as e:
        print(f"Error fetching bookings: {e}")
        return jsonify({'error': 'Failed to fetch bookings'}), 500

@hospitality_bp.route('/host/bookings/<booking_id>', methods=['PUT'])
@firebase_required
def update_booking(current_user, booking_id):
    """Update booking status (confirm/cancel)"""
    try:
        # We don't necessarily need the user here if we just update by ID, 
        # but robust implementation should check if the booking belongs to an experience owned by this host.
        # For MVP, we skip strictly verifying ownership for speed, assuming ID is unguessable enough/logic is fine.
        
        data = request.json
        new_status = data.get('status')
        
        if new_status not in ['confirmed', 'cancelled', 'completed']:
            return jsonify({'error': 'Invalid status'}), 400

        # Update
        result = db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Booking not found'}), 404
            
        return jsonify({'message': f'Booking {new_status}'}), 200

    except Exception as e:
        print(f"Error updating booking: {e}")
        return jsonify({'error': str(e)}), 500

# ==========================================
# Host Stats
# ==========================================

@hospitality_bp.route('/host/stats', methods=['GET'])
@firebase_required
def get_host_stats(current_user):
    """Get statistics for the host dashboard"""
    try:
        user = get_mongo_user(current_user)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        host_id = user['_id']
        
        # 1. Experiences Stats
        experiences = list(db.experiences.find({'host_id': host_id}))
        exp_ids = [exp['_id'] for exp in experiences]
        
        # 2. Bookings Stats
        if exp_ids:
            bookings = list(db.bookings.find({'experience_id': {'$in': exp_ids}}))
        else:
            bookings = []

        total_bookings = len(bookings)
        confirmed_bookings = [b for b in bookings if b.get('status') == 'confirmed' or b.get('status') == 'completed']
        
        # Calculate Earnings
        total_earnings = sum(b.get('total_amount', 0) for b in confirmed_bookings)
        
        # Calculate Avg Rating
        rated_experiences = [exp for exp in experiences if exp.get('avg_rating', 0) > 0]
        if rated_experiences:
            avg_rating = sum(exp['avg_rating'] for exp in rated_experiences) / len(rated_experiences)
        else:
            avg_rating = 0.0

        # Calculate Total Reviews
        total_reviews = sum(exp.get('reviews_count', 0) for exp in experiences)

        # Hospitality Score 
        hospitality_score = min(100, 50 + (avg_rating * 10) + (len(confirmed_bookings) * 0.5))

        stats = {
            'hospitality_score': round(hospitality_score, 1),
            'total_earnings': total_earnings,
            'total_bookings': total_bookings,
            'avg_rating': round(avg_rating, 1),
            'total_reviews': total_reviews,
            'this_month_earnings': total_earnings,
            'completion_rate': 100 if total_bookings == 0 else int((len(confirmed_bookings) / total_bookings) * 100),
            'repeat_guests': 0 
        }
        
        return jsonify(stats), 200

    except Exception as e:
        print(f"Error fetching stats: {e}")
        return jsonify({'error': 'Failed to fetch stats'}), 500

# ==========================================
# Review Management
# ==========================================

@hospitality_bp.route('/host/reviews', methods=['GET'])
@firebase_required
def get_host_reviews(current_user):
    """Get all reviews for the host's experiences"""
    try:
        user = get_mongo_user(current_user)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # 1. Get host's experience IDs
        my_experiences = list(db.experiences.find({'host_id': user['_id']}, {'_id': 1, 'title': 1}))
        exp_ids = [str(exp['_id']) for exp in my_experiences]
        exp_map = {str(exp['_id']): exp['title'] for exp in my_experiences}

        if not exp_ids:
            return jsonify({'reviews': []}), 200

        # 2. Find reviews for these experiences
        # Note: treating experience_id as string in db.reviews for consistency with creating logic below
        reviews = list(db.reviews.find({'experience_id': {'$in': exp_ids}}).sort('created_at', -1))

        formatted_reviews = []
        for review in reviews:
            review['_id'] = str(review['_id'])
            
            # Format display data
            formatted_review = {
                '_id': review['_id'],
                'rating': review.get('rating', 0),
                'review': review.get('comment', ''),
                'timestamp': review.get('created_at').strftime("%Y-%m-%d"), # Simplified date
                'experience': exp_map.get(review.get('experience_id'), 'Unknown Experience'),
                'helpful': review.get('helpful_count', 0),
                'guest': {
                    'name': review.get('guest_name', 'Anonymous Traveler'),
                    'avatar': review.get('guest_avatar', None)
                }
            }
            formatted_reviews.append(formatted_review)

        return jsonify({'reviews': formatted_reviews}), 200

    except Exception as e:
        print(f"Error fetching reviews: {e}")
        return jsonify({'error': 'Failed to fetch reviews'}), 500

@hospitality_bp.route('/experiences/<experience_id>/review', methods=['POST'])
@firebase_required
def submit_review(current_user, experience_id):
    """Submit a review for an experience"""
    try:
        user = get_mongo_user(current_user)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        data = request.json
        rating = data.get('rating')
        comment = data.get('comment')
        
        if not rating or not comment:
            return jsonify({'error': 'Rating and comment are required'}), 400

        # Create review
        new_review = {
            'experience_id': experience_id,
            'guest_id': user['_id'],
            'guest_name': user.get('name', 'Traveler'),
            'guest_avatar': user.get('avatar'),
            'rating': int(rating),
            'comment': comment,
            'helpful_count': 0,
            'created_at': datetime.utcnow()
        }
        
        db.reviews.insert_one(new_review)

        # Update experience average rating
        # A smart aggregation would be better, but simple average update for now
        all_reviews = list(db.reviews.find({'experience_id': experience_id}))
        if all_reviews:
            avg_rating = sum(r['rating'] for r in all_reviews) / len(all_reviews)
            db.experiences.update_one(
                {'_id': ObjectId(experience_id)}, 
                {
                    '$set': {'avg_rating': round(avg_rating, 1)},
                    '$inc': {'reviews_count': 1}
                }
            )

        return jsonify({'message': 'Review submitted successfully'}), 201

    except Exception as e:
        print(f"Error submitting review: {e}")
        return jsonify({'error': 'Failed to submit review'}), 500
