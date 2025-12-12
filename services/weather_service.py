"""
OpenWeather API integration with Google Search fallback
For weather forecasts in crowd prediction
"""
import requests
from config import Config
from datetime import datetime, timedelta

BASE_URL = "https://api.openweathermap.org/data/2.5"

def get_weather_forecast(latitude, longitude, days=7, location_name=None):
    """
    Get weather forecast for a location with Google Search fallback
    
    Args:
        latitude: Location latitude
        longitude: Location longitude
        days: Number of days ahead (max 7 for free tier)
        location_name: Optional location name for fallback search
    
    Returns:
        dict: Weather forecast data
    """
    if not Config.OPENWEATHER_API_KEY or Config.OPENWEATHER_API_KEY == 'your-api-key-here':
        print(f"Weather API key not configured properly, trying Google Search fallback...")
        return _get_weather_fallback(location_name, latitude, longitude, days=days)
    
    try:
        # Use forecast API for multi-day weather
        url = f"{BASE_URL}/forecast"
        params = {
            'lat': latitude,
            'lon': longitude,
            'appid': Config.OPENWEATHER_API_KEY,
            'units': 'metric',
            'cnt': days * 8  # 8 forecasts per day (3-hour intervals)
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Parse forecast - group by day
        from datetime import datetime
        daily_forecasts = {}
        for item in data.get('list', []):
            date_str = datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d')
            if date_str not in daily_forecasts:
                daily_forecasts[date_str] = []
            daily_forecasts[date_str].append(item)
        
        # Create daily summaries
        forecast = []
        for date_str, day_data in list(daily_forecasts.items())[:days]:
            temps = [d['main']['temp'] for d in day_data]
            weathers = [d['weather'][0]['main'] for d in day_data]
            descs = [d['weather'][0]['description'] for d in day_data]
            
            forecast.append({
                'date': date_str,
                'temp': {
                    'min': min(temps),
                    'max': max(temps),
                    'avg': sum(temps) / len(temps)
                },
                'weather': max(set(weathers), key=weathers.count),  # Most common
                'description': max(set(descs), key=descs.count),
                'precipitation_probability': day_data[0].get('pop', 0) * 100 if 'pop' in day_data[0] else 20,
                'humidity': sum(d['main']['humidity'] for d in day_data) / len(day_data),
                'wind_speed': sum(d['wind']['speed'] for d in day_data) / len(day_data),
                'source': 'openweather'
            })
        
        return {
            'location': {'lat': latitude, 'lon': longitude},
            'forecast': forecast,
            'source': 'openweather'
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Weather API error: {e}, trying Google Search fallback...")
        return _get_weather_fallback(latitude, longitude, location_name, days=days)

def _get_weather_fallback(latitude, longitude, location_name=None, days=7):
    """
    Fallback weather data using Google Search
    """
    try:
        from services.search_service import search_weather_google
        
        if location_name:
            forecasts = search_weather_google(location_name, days=days)
            if forecasts:
                return {
                    'location': {'name': location_name, 'lat': latitude, 'lon': longitude},
                    'forecast': forecasts,
                    'source': 'google_search'
                }
    except Exception as e:
        print(f"Google Search weather fallback error: {e}")
    
    # Final fallback: reasonable default data
    return _get_default_weather(latitude, longitude, days=days)

def _get_default_weather(latitude=None, longitude=None, days=7):
    """
    Default weather data when all APIs fail
    """
    forecast = []
    for i in range(days):
        forecast.append({
            'date': (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'),
            'temp': {'min': 15, 'max': 25, 'avg': 20},
            'weather': 'Clear',
            'description': 'Partly cloudy',
            'precipitation_probability': 20,
            'humidity': 60,
            'wind_speed': 10,
            'source': 'default'
        })
    
    return {
        'location': {'lat': latitude, 'lon': longitude},
        'forecast': forecast,
        'source': 'default',
        'note': 'Using default weather data - APIs unavailable'
    }

def get_current_weather(latitude, longitude):
    """Get current weather for a location"""
    if not Config.OPENWEATHER_API_KEY:
        return {"error": "Weather API key not configured"}
    
    try:
        url = f"{BASE_URL}/weather"
        params = {
            'lat': latitude,
            'lon': longitude,
            'appid': Config.OPENWEATHER_API_KEY,
            'units': 'metric'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        return {
            'temp': data['main']['temp'],
            'feels_like': data['main']['feels_like'],
            'weather': data['weather'][0]['main'],
            'description': data['weather'][0]['description'],
            'humidity': data['main']['humidity'],
            'wind_speed': data['wind']['speed']
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Weather API error: {e}")
        return {"error": str(e)}

def weather_impact_on_crowds(weather_data):
    """
    Calculate weather impact on tourist crowds
    
    Returns: float between 0 and 1 (higher = more crowded)
    """
    if 'error' in weather_data:
        return 0.5  # Default neutral impact
    
    impact = 0.5  # Base
    
    forecast = weather_data.get('forecast', [{}])[0]
    
    # Temperature impact (20-28°C is ideal)
    avg_temp = forecast.get('temp', {}).get('avg', 20)
    if 20 <= avg_temp <= 28:
        impact += 0.2  # Good weather increases crowds
    elif avg_temp > 35 or avg_temp < 10:
        impact -= 0.2  # Extreme temps reduce crowds
    
    # Precipitation impact
    precip_prob = forecast.get('precipitation_probability', 0)
    impact -= (precip_prob / 100) * 0.3  # Rain reduces crowds
    
    # Weather condition impact
    weather = forecast.get('weather', '').lower()
    if 'clear' in weather or 'sun' in weather:
        impact += 0.1
    elif 'rain' in weather or 'storm' in weather:
        impact -= 0.2
    
    return max(0, min(1, impact))  # Clamp between 0 and 1
