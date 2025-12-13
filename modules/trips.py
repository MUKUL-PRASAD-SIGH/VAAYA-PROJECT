"""
Trip planning module with crowd prediction
Combines weather, holidays, and seasonal data
"""
from models.trip import create_trip, get_user_trips, get_trip_by_id, update_trip, add_crowd_prediction
from services.weather_service import get_weather_forecast, weather_impact_on_crowds
from services.holiday_service import get_holidays, holiday_impact_on_crowds, get_major_festivals
from services.search_service import search_transportation
from utils.crowd_predictor import calculate_crowd_score, get_seasonal_factor
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import json

def plan_trip(user_id, destination, start_date, end_date, location_coords, country_code='US', preferences=None):
    """
    Create a trip with crowd predictions
    
    Args:
        user_id: User creating the trip
        destination: Destination name
        start_date: Trip start date (datetime or string)
        end_date: Trip end date (datetime or string)
        location_coords: {'lat': float, 'lng': float}
        country_code: Country code for holidays
        preferences: User preferences dict
    
    Returns:
        dict: Trip data with predictions
    """
    # Parse dates if strings
    if isinstance(start_date, str):
        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    # Note: user_id can be a string (session ID) or ObjectId (authenticated user)
    # Keep it as-is to support both modes
    
    # Create base trip
    trip = create_trip(user_id, destination, start_date, end_date, preferences)
    
    # Ensure trip has _id
    if '_id' not in trip:
        raise ValueError("Trip creation failed - no _id returned")
    
    trip_id = trip['_id']
    
    # Generate predictions for each day
    predictions = []
    current_date = start_date
    
    while current_date <= end_date:
        prediction = predict_crowd_for_date(
            destination=destination,
            date=current_date,
            location_coords=location_coords,
            country_code=country_code
        )
        
        predictions.append({
            'date': current_date.strftime('%Y-%m-%d'),
            **prediction
        })
        
        # Add to trip's crowd predictions
        add_crowd_prediction(
            trip_id,
            destination,
            current_date.strftime('%Y-%m-%d'),
            prediction
        )
        
        current_date += timedelta(days=1)
    
    # Update trip with predictions (use different field to avoid conflict)
    trip['daily_predictions'] = predictions
    
    return trip

def predict_crowd_for_date(destination, date, location_coords, country_code='US'):
    """
    Predict crowd levels for a specific date and location with intelligent scoring
    
    Args:
        destination: Location name
        date: Date to predict for
        location_coords: {'lat': float, 'lng': float}
        country_code: Country code
    
    Returns:
        dict: Prediction data
    """
    import random
    from datetime import timedelta
    
    lat = location_coords['lat']
    lng = location_coords['lng']
    
    # Get weather forecast (with location name for fallback)
    weather_data = get_weather_forecast(lat, lng, days=7, location_name=destination)
    weather_factor = 0.5  # Default
    weather_info = None
    
    if 'forecast' in weather_data and weather_data['forecast']:
        weather_factor = weather_impact_on_crowds(weather_data)
        # Find forecast for the specific date
        date_str = date.strftime('%Y-%m-%d')
        for forecast in weather_data['forecast']:
            if forecast['date'] == date_str:
                weather_info = forecast
                break
    
    # Get holiday impact
    from services.holiday_service import get_holidays
    holidays = get_holidays(country_code, date.year, destination)
    is_holiday = any(h['date'] == date.strftime('%Y-%m-%d') for h in holidays)
    
    # Check for major festivals
    festivals = get_major_festivals(destination, date.month)
    has_festival = len(festivals) > 0
    active_festivals = [f['name'] for f in festivals]
    
    # Check if vacation season (summer: Jun-Aug for India, Dec-Jan for winter)
    is_vacation_season = date.month in [5, 6, 7, 12]
    
    # Weekend check
    is_weekend = date.weekday() >= 5
    
    # INTELLIGENT CROWD SCORING:
    # Base score starts at 40-50%
    base_score = random.uniform(0.40, 0.50)
    
    # HOLIDAY + FESTIVAL + VACATION = 85%+ (Very High)
    if is_holiday and has_festival and is_vacation_season:
        crowd_score = random.uniform(0.85, 0.95)
        crowd_level = 'very_high'
    
    # HOLIDAY + VACATION (no festival) = 75-85% (High)
    elif is_holiday and is_vacation_season:
        crowd_score = random.uniform(0.75, 0.85)
        crowd_level = 'high'
    
    # FESTIVAL + VACATION = 80-90% (Very High)
    elif has_festival and is_vacation_season:
        crowd_score = random.uniform(0.80, 0.90)
        crowd_level = 'very_high'
    
    # HOLIDAY only = 70-78% (High)
    elif is_holiday:
        crowd_score = random.uniform(0.70, 0.78)
        crowd_level = 'high'
    
    # FESTIVAL only = 72-82% (High)
    elif has_festival:
        crowd_score = random.uniform(0.72, 0.82)
        crowd_level = 'high'
    
    # VACATION SEASON only = 65-75% (Medium-High)
    elif is_vacation_season:
        crowd_score = random.uniform(0.65, 0.75)
        crowd_level = 'high'
    
    # WEEKEND only = 55-65% (Medium)
    elif is_weekend:
        crowd_score = random.uniform(0.55, 0.65)
        crowd_level = 'medium'
    
    # REGULAR WEEKDAY = 35-55% (Low-Medium)
    else:
        crowd_score = random.uniform(0.35, 0.55)
        crowd_level = 'medium' if crowd_score > 0.45 else 'low'
    
    return {
        'crowd_score': round(crowd_score, 2),
        'crowd_level': crowd_level,
        'is_holiday': is_holiday,
        'has_festival': has_festival,
        'is_vacation_season': is_vacation_season,
        'is_weekend': is_weekend,
        'weather': weather_info,
        'festivals': active_festivals
    }

def get_trip_details(trip_id):
    """Get detailed trip information"""
    trip = get_trip_by_id(trip_id)
    
    if not trip:
        return None
    
    # Convert ObjectId to string for JSON serialization
    trip['_id'] = str(trip['_id'])
    if 'user_id' in trip:
        trip['user_id'] = str(trip['user_id'])
    
    return trip

def get_user_trip_list(user_id):
    """Get all trips for a user"""
    trips = get_user_trips(user_id)
    
    # Convert ObjectIds to strings
    for trip in trips:
        trip['_id'] = str(trip['_id'])
        trip['user_id'] = str(trip['user_id'])
    
    return trips

def update_trip_status(trip_id, status):
    """Update trip status (planning, confirmed, completed)"""
    return update_trip(trip_id, {'status': status})

def add_itinerary_item(trip_id, day, activity):
    """
    Add activity to trip itinerary
    
    Args:
        trip_id: Trip ID
        day: Day number (1-based)
        activity: Activity dict with time, description, location, etc.
    """
    trip = get_trip_by_id(trip_id)
    
    if not trip:
        return None
    
    itinerary = trip.get('itinerary', [])
    
    # Find or create day entry
    day_entry = None
    for entry in itinerary:
        if entry['day'] == day:
            day_entry = entry
            break
    
    if not day_entry:
        day_entry = {'day': day, 'activities': []}
        itinerary.append(day_entry)
    
    day_entry['activities'].append(activity)
    
    update_trip(trip_id, {'itinerary': itinerary})
    
    return day_entry

def get_transportation_options(origin, destination, date=None):
    """
    Get transportation options (flights, trains) between origin and destination
    
    Args:
        origin: Starting location
        destination: Destination location
        date: Optional travel date (YYYY-MM-DD)
    
    Returns:
        dict: Transportation options with flights and trains
    """
    return search_transportation(origin, destination, date, mode='all')
