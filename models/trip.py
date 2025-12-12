"""
Trip/Itinerary model
"""
from models import db
from datetime import datetime

trips_collection = db.trips

def create_trip(user_id, destination, start_date, end_date, preferences=None):
    """Create a new trip"""
    trip = {
        'user_id': user_id,
        'destination': destination,
        'start_date': start_date,
        'end_date': end_date,
        'preferences': preferences or {},  # dietary, budget, interests, etc.
        'itinerary': [],
        'crowd_predictions': {},
        'created_at': datetime.utcnow(),
        'status': 'planning'  # planning, confirmed, completed
    }
    
    result = trips_collection.insert_one(trip)
    trip['_id'] = result.inserted_id
    return trip

def get_user_trips(user_id):
    """Get all trips for a user"""
    from bson.objectid import ObjectId
    return list(trips_collection.find({'user_id': ObjectId(user_id)}))

def get_trip_by_id(trip_id):
    """Get trip by ID"""
    from bson.objectid import ObjectId
    return trips_collection.find_one({'_id': ObjectId(trip_id)})

def update_trip(trip_id, updates):
    """Update trip information"""
    from bson.objectid import ObjectId
    return trips_collection.update_one(
        {'_id': ObjectId(trip_id)},
        {'$set': updates}
    )

def add_crowd_prediction(trip_id, location, date, prediction_data):
    """Add crowd prediction for a specific location and date"""
    from bson.objectid import ObjectId
    key = f"{location}_{date}"
    return trips_collection.update_one(
        {'_id': ObjectId(trip_id)},
        {'$set': {f'crowd_predictions.{key}': prediction_data}}
    )
