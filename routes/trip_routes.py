"""
Trip planning routes
Endpoints for creating trips with crowd predictions
"""
from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from modules.trips import (
    plan_trip, 
    get_trip_details, 
    get_user_trip_list,
    update_trip_status,
    add_itinerary_item,
    predict_crowd_for_date,
    get_transportation_options
)
from datetime import datetime
from bson.objectid import ObjectId

trip_bp = Blueprint('trips', __name__)

# Demo user for no-auth mode (using valid ObjectId format)
DEMO_USER = {
    'user_id': '507f1f77bcf86cd799439011',
    'email': 'demo@vayaa.in',
    'name': 'Demo User'
}

@trip_bp.route('/', methods=['POST'])
@trip_bp.route('/create', methods=['POST'])
def create_trip():
    """
    Create a new trip with crowd predictions
    
    POST /trips/
    Body: {
        "destination": "Paris, France",
        "start_date": "2024-07-15",
        "end_date": "2024-07-20",
        "location_coords": {"lat": 48.8566, "lng": 2.3522},
        "country_code": "FR",
        "preferences": {"budget": "medium", "interests": ["culture", "food"]}
    }
    """
    try:
        data = request.get_json()
        current_user = DEMO_USER  # Use demo user for no-auth mode
        
        # Validate required fields
        required_fields = ['destination', 'start_date', 'end_date', 'location_coords']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate location
        if 'lat' not in data['location_coords'] or 'lng' not in data['location_coords']:
            return jsonify({'error': 'location_coords must have lat and lng'}), 400
        
        # Parse dates
        try:
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'}), 400
        
        # Validate date range
        if end_date < start_date:
            return jsonify({'error': 'End date must be after start date'}), 400
        
        # Create trip with predictions
        trip = plan_trip(
            user_id=current_user['user_id'],  # user_id is already a string in JWT
            destination=data['destination'],
            start_date=start_date,
            end_date=end_date,
            location_coords=data['location_coords'],
            country_code=data.get('country_code', 'US'),
            preferences=data.get('preferences')
        )
        
        # Convert ObjectId to string for JSON serialization
        if '_id' in trip and trip['_id']:
            trip['_id'] = str(trip['_id'])
        if 'user_id' in trip and trip['user_id']:
            trip['user_id'] = str(trip['user_id'])
        
        return jsonify({
            'message': 'Trip created successfully',
            'trip': trip
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to create trip: {str(e)}'}), 500

@trip_bp.route('/', methods=['GET'])
def get_trips():
    """
    Get all trips for current user
    
    GET /trips/
    """
    try:
        current_user = DEMO_USER  # Use demo user for no-auth mode
        trips = get_user_trip_list(current_user['user_id'])
        
        return jsonify({
            'trips': trips,
            'count': len(trips)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch trips: {str(e)}'}), 500

@trip_bp.route('/<trip_id>', methods=['GET'])
def get_trip(trip_id):
    """
    Get specific trip details
    
    GET /trips/<trip_id>
    """
    try:
        current_user = DEMO_USER  # Use demo user for no-auth mode
        trip = get_trip_details(trip_id)
        
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
        
        # Verify ownership
        if str(trip['user_id']) != str(current_user['user_id']):
            return jsonify({'error': 'Unauthorized access'}), 403
        
        return jsonify({'trip': trip}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch trip: {str(e)}'}), 500

@trip_bp.route('/<trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    """
    Delete a trip
    
    DELETE /trips/<trip_id>
    """
    try:
        current_user = DEMO_USER  # Use demo user for no-auth mode
        from models import trips_collection
        
        trip = trips_collection.find_one({'_id': ObjectId(trip_id)})
        
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
        
        # Verify ownership
        if str(trip['user_id']) != str(current_user['user_id']):
            return jsonify({'error': 'Unauthorized access'}), 403
        
        trips_collection.delete_one({'_id': ObjectId(trip_id)})
        
        return jsonify({'message': 'Trip deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete trip: {str(e)}'}), 500

@trip_bp.route('/<trip_id>/status', methods=['PUT'])
def update_status(trip_id):
    """
    Update trip status
    
    PUT /trips/<trip_id>/status
    Body: {"status": "confirmed"}
    """
    try:
        current_user = DEMO_USER  # Use demo user for no-auth mode
        trip = get_trip_details(trip_id)
        
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
        
        # Verify ownership
        if str(trip['user_id']) != str(current_user['user_id']):
            return jsonify({'error': 'Unauthorized access'}), 403
        
        data = request.get_json()
        status = data.get('status')
        
        if status not in ['planning', 'confirmed', 'completed']:
            return jsonify({'error': 'Invalid status. Must be: planning, confirmed, or completed'}), 400
        
        update_trip_status(trip_id, status)
        
        return jsonify({
            'message': 'Trip status updated',
            'status': status
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update status: {str(e)}'}), 500

@trip_bp.route('/<trip_id>/itinerary', methods=['POST'])
def add_activity(trip_id):
    """
    Add activity to trip itinerary
    
    POST /trips/<trip_id>/itinerary
    Body: {
        "day": 1,
        "activity": {
            "time": "09:00",
            "description": "Visit Eiffel Tower",
            "location": "Eiffel Tower",
            "duration": "2 hours"
        }
    }
    """
    try:
        current_user = DEMO_USER  # Use demo user for no-auth mode
        trip = get_trip_details(trip_id)
        
        if not trip:
            return jsonify({'error': 'Trip not found'}), 404
        
        # Verify ownership
        if str(trip['user_id']) != str(current_user['user_id']):
            return jsonify({'error': 'Unauthorized access'}), 403
        
        data = request.get_json()
        
        if 'day' not in data or 'activity' not in data:
            return jsonify({'error': 'Missing day or activity'}), 400
        
        day_entry = add_itinerary_item(trip_id, data['day'], data['activity'])
        
        return jsonify({
            'message': 'Activity added to itinerary',
            'day': day_entry
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to add activity: {str(e)}'}), 500

@trip_bp.route('/predict', methods=['POST'])
def predict_crowd():
    """
    Get crowd prediction for a specific date and location
    
    POST /trips/predict
    Body: {
        "destination": "Paris",
        "date": "2024-07-15",
        "location": {"lat": 48.8566, "lng": 2.3522},
        "country_code": "FR"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['destination', 'date', 'location']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse date
        try:
            date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'}), 400
        
        # Get prediction
        prediction = predict_crowd_for_date(
            destination=data['destination'],
            date=date,
            location_coords=data['location'],
            country_code=data.get('country_code', 'US')
        )
        
        return jsonify({
            'destination': data['destination'],
            'date': data['date'],
            'prediction': prediction
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to predict crowd: {str(e)}'}), 500

@trip_bp.route('/transportation', methods=['POST'])
def get_transport():
    """
    Get transportation options (flights, trains) between locations
    
    POST /trips/transportation
    Body: {
        "origin": "Mumbai",
        "destination": "Delhi", 
        "date": "2025-12-15"  // optional
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('origin') or not data.get('destination'):
            return jsonify({'error': 'origin and destination are required'}), 400
        
        # Get transportation options
        transport_data = get_transportation_options(
            origin=data['origin'],
            destination=data['destination'],
            date=data.get('date')
        )
        
        return jsonify({
            'origin': data['origin'],
            'destination': data['destination'],
            'date': data.get('date'),
            'transportation': transport_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get transportation: {str(e)}'}), 500
