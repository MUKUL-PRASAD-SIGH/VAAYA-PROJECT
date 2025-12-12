"""
Crowd prediction algorithm
Combines multiple factors to predict tourist crowd density
"""

def calculate_crowd_score(weather_factor, holiday_factor, seasonal_factor, festival_factor):
    """
    Calculate overall crowd score from individual factors
    
    Args:
        weather_factor: Weather impact (0-1)
        holiday_factor: Holiday impact (0-1)
        seasonal_factor: Seasonal impact (0-1)
        festival_factor: Festival/event impact (0-1)
    
    Returns:
        float: Overall crowd score (0-1)
    """
    # Weighted average of factors
    weights = {
        'weather': 0.25,
        'holiday': 0.30,
        'seasonal': 0.25,
        'festival': 0.20
    }
    
    score = (
        weather_factor * weights['weather'] +
        holiday_factor * weights['holiday'] +
        seasonal_factor * weights['seasonal'] +
        festival_factor * weights['festival']
    )
    
    # Ensure score is between 0 and 1
    return max(0, min(1, score))

def get_seasonal_factor(month, destination=None):
    """
    Get seasonal crowd factor based on month
    
    Args:
        month: Month number (1-12)
        destination: Optional destination name for specific adjustments
    
    Returns:
        float: Seasonal factor (0-1)
    """
    # Base seasonal patterns (Northern Hemisphere)
    seasonal_map = {
        1: 0.4,   # January - Low (winter)
        2: 0.4,   # February - Low
        3: 0.5,   # March - Medium (spring break starts)
        4: 0.6,   # April - Medium-High (spring)
        5: 0.7,   # May - High (pre-summer)
        6: 0.9,   # June - Very High (summer vacation starts)
        7: 1.0,   # July - Peak (summer)
        8: 0.9,   # August - Very High (summer)
        9: 0.6,   # September - Medium-High (early fall)
        10: 0.7,  # October - High (fall colors)
        11: 0.5,  # November - Medium
        12: 0.8   # December - High (holidays)
    }
    
    base_factor = seasonal_map.get(month, 0.5)
    
    # Adjust for specific destinations (example)
    if destination:
        destination_lower = destination.lower()
        
        # Ski resorts peak in winter
        if any(word in destination_lower for word in ['ski', 'snow', 'mountain']):
            if month in [12, 1, 2]:
                base_factor = min(1.0, base_factor + 0.3)
        
        # Beach destinations peak in summer
        if any(word in destination_lower for word in ['beach', 'coast', 'island']):
            if month in [6, 7, 8]:
                base_factor = min(1.0, base_factor + 0.2)
        
        # Southern Hemisphere reversal
        if any(word in destination_lower for word in ['australia', 'new zealand', 'south africa', 'argentina', 'brazil']):
            # Reverse the seasons (approximate)
            reversed_month = ((month + 6) % 12) or 12
            base_factor = seasonal_map.get(reversed_month, 0.5)
    
    return base_factor

def get_time_of_day_factor(hour):
    """
    Get crowd factor based on time of day
    
    Args:
        hour: Hour of day (0-23)
    
    Returns:
        float: Time factor (0-1)
    """
    # Tourist attractions crowd patterns
    time_map = {
        6: 0.1, 7: 0.2, 8: 0.4, 9: 0.7, 10: 0.9,
        11: 1.0, 12: 0.9, 13: 0.8, 14: 0.9, 15: 1.0,
        16: 0.8, 17: 0.6, 18: 0.4, 19: 0.3, 20: 0.2,
        21: 0.1, 22: 0.1, 23: 0.1, 0: 0.1, 1: 0.1,
        2: 0.1, 3: 0.1, 4: 0.1, 5: 0.1
    }
    
    return time_map.get(hour, 0.5)

def get_day_of_week_factor(day_of_week):
    """
    Get crowd factor based on day of week
    
    Args:
        day_of_week: Day of week (0=Monday, 6=Sunday)
    
    Returns:
        float: Day factor (0-1)
    """
    # 0=Monday, 6=Sunday
    day_map = {
        0: 0.5,  # Monday - Medium
        1: 0.5,  # Tuesday - Medium
        2: 0.5,  # Wednesday - Medium
        3: 0.6,  # Thursday - Medium-High
        4: 0.7,  # Friday - High
        5: 0.9,  # Saturday - Very High
        6: 0.8   # Sunday - High
    }
    
    return day_map.get(day_of_week, 0.5)

def predict_peak_hours(date, weather, is_holiday):
    """
    Predict peak visiting hours for a location
    
    Args:
        date: Date to predict for
        weather: Weather conditions
        is_holiday: Whether it's a holiday
    
    Returns:
        list: Peak hours with crowd levels
    """
    base_peaks = [
        {'hour': 10, 'crowd': 0.8},
        {'hour': 11, 'crowd': 0.9},
        {'hour': 14, 'crowd': 0.85},
        {'hour': 15, 'crowd': 0.9}
    ]
    
    # Adjust for weather
    if weather and 'weather' in weather:
        weather_type = weather['weather'].lower()
        if 'rain' in weather_type or 'storm' in weather_type:
            # Rain shifts crowds to indoor hours
            for peak in base_peaks:
                peak['crowd'] *= 0.7
    
    # Adjust for holidays
    if is_holiday:
        for peak in base_peaks:
            peak['crowd'] = min(1.0, peak['crowd'] * 1.3)
    
    # Adjust for day of week
    day_of_week = date.weekday()
    day_factor = get_day_of_week_factor(day_of_week)
    
    for peak in base_peaks:
        peak['crowd'] = min(1.0, peak['crowd'] * (0.7 + day_factor * 0.3))
    
    return base_peaks

def get_crowd_recommendation(crowd_score):
    """
    Get recommendation based on crowd score
    
    Args:
        crowd_score: Crowd score (0-1)
    
    Returns:
        dict: Recommendation with level and advice
    """
    if crowd_score >= 0.8:
        return {
            'level': 'very_high',
            'advice': 'Expect very large crowds. Consider visiting early morning or late evening. Book tickets in advance.',
            'color': '#d32f2f'
        }
    elif crowd_score >= 0.6:
        return {
            'level': 'high',
            'advice': 'Crowds will be significant. Arrive early to avoid long queues.',
            'color': '#f57c00'
        }
    elif crowd_score >= 0.4:
        return {
            'level': 'medium',
            'advice': 'Moderate crowds expected. Normal visiting hours should be fine.',
            'color': '#fbc02d'
        }
    elif crowd_score >= 0.2:
        return {
            'level': 'low',
            'advice': 'Light crowds expected. Good time to visit without rushing.',
            'color': '#388e3c'
        }
    else:
        return {
            'level': 'very_low',
            'advice': 'Minimal crowds expected. Excellent time to visit!',
            'color': '#1976d2'
        }
