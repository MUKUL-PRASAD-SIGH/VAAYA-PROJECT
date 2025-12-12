"""
Holiday and events API integration with Google Search fallback
For crowd prediction based on local holidays and events
"""
import requests
from datetime import datetime, timedelta

def get_holidays(country_code, year=None, location_name=None):
    """
    Get public holidays for a country with Google Search fallback
    
    Args:
        country_code: ISO country code (e.g., 'US', 'IN', 'FR')
        year: Year (defaults to current year)
        location_name: Optional location name for fallback search
    
    Returns:
        list: Holiday data
    """
    if year is None:
        year = datetime.now().year
    
    try:
        # Try primary API first
        url = f"https://date.nager.at/api/v3/PublicHolidays/{year}/{country_code}"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        holidays = []
        for holiday in response.json():
            holidays.append({
                'date': holiday['date'],
                'name': holiday['localName'],
                'type': holiday.get('type', 'public'),
                'global': holiday.get('global', True),
                'source': 'nager_api'
            })
        
        return holidays
        
    except requests.exceptions.RequestException as e:
        print(f"Holiday API error: {e}, trying Google Search fallback...")
        return _get_holidays_fallback(country_code, year, location_name)

def _get_holidays_fallback(country_code, year, location_name=None):
    """
    Fallback holiday data using Google Search
    """
    try:
        from services.search_service import search_holidays
        
        search_location = location_name or country_code
        search_result = search_holidays(search_location, country_code=country_code)
        
        if search_result and search_result.get('holidays'):
            holidays = []
            for holiday in search_result['holidays']:
                holidays.append({
                    'date': f"{year}-01-01",  # Default date
                    'name': holiday.get('name', 'Holiday'),
                    'type': 'public',
                    'global': True,
                    'source': 'google_search',
                    'description': holiday.get('snippet', holiday.get('description', ''))
                })
            return holidays
    except Exception as e:
        print(f"Google Search holiday fallback error: {e}")
    
    # Final fallback: common holidays
    return _get_default_holidays(country_code, year)

def _get_default_holidays(country_code, year):
    """
    Default holiday data for common countries when APIs fail
    """
    # Common holidays by country (major ones only)
    common_holidays = {
        'US': [
            {'date': f'{year}-01-01', 'name': 'New Year\'s Day'},
            {'date': f'{year}-07-04', 'name': 'Independence Day'},
            {'date': f'{year}-12-25', 'name': 'Christmas Day'},
        ],
        'IN': [
            {'date': f'{year}-01-26', 'name': 'Republic Day'},
            {'date': f'{year}-08-15', 'name': 'Independence Day'},
            {'date': f'{year}-10-02', 'name': 'Gandhi Jayanti'},
        ],
        'GB': [
            {'date': f'{year}-01-01', 'name': 'New Year\'s Day'},
            {'date': f'{year}-12-25', 'name': 'Christmas Day'},
            {'date': f'{year}-12-26', 'name': 'Boxing Day'},
        ],
        'FR': [
            {'date': f'{year}-01-01', 'name': 'New Year\'s Day'},
            {'date': f'{year}-07-14', 'name': 'Bastille Day'},
            {'date': f'{year}-12-25', 'name': 'Christmas Day'},
        ],
        'JP': [
            {'date': f'{year}-01-01', 'name': 'New Year\'s Day'},
            {'date': f'{year}-02-11', 'name': 'National Foundation Day'},
            {'date': f'{year}-12-23', 'name': 'Emperor\'s Birthday'},
        ],
    }
    
    holidays = common_holidays.get(country_code, [
        {'date': f'{year}-01-01', 'name': 'New Year\'s Day'},
        {'date': f'{year}-12-25', 'name': 'Christmas Day'},
    ])
    
    return [
        {
            **holiday,
            'type': 'public',
            'global': True,
            'source': 'default'
        }
        for holiday in holidays
    ]

def get_local_events(location, start_date, end_date):
    """
    Get local events for a location and date range
    
    Note: You'd integrate with services like:
    - Eventbrite API
    - Meetup API
    - Local tourism board APIs
    
    Args:
        location: Location name or coordinates
        start_date: Start date
        end_date: End date
    
    Returns:
        list: Event data
    """
    # Placeholder - integrate with actual events API
    events = []
    
    # Example structure:
    # events.append({
    #     'name': 'Music Festival',
    #     'date': '2024-07-15',
    #     'location': location,
    #     'attendance_estimate': 10000,
    #     'category': 'music'
    # })
    
    return events

def is_holiday(date, country_code):
    """Check if a date is a public holiday"""
    year = date.year
    holidays = get_holidays(country_code, year)
    
    date_str = date.strftime('%Y-%m-%d')
    return any(h['date'] == date_str for h in holidays)

def holiday_impact_on_crowds(date, country_code):
    """
    Calculate holiday impact on tourist crowds
    
    Returns: float between 0 and 1 (higher = more crowded)
    """
    impact = 0.5  # Base
    
    # Check if it's a holiday
    if is_holiday(date, country_code):
        impact += 0.3  # Holidays increase crowds
    
    # Check if it's a weekend
    if date.weekday() >= 5:  # Saturday or Sunday
        impact += 0.2
    
    # Check if it's during typical vacation season (summer)
    if date.month in [6, 7, 8]:
        impact += 0.1
    
    # Check for long weekends
    tomorrow = date + timedelta(days=1)
    yesterday = date - timedelta(days=1)
    
    if is_holiday(tomorrow, country_code) or is_holiday(yesterday, country_code):
        if date.weekday() in [4, 0]:  # Friday or Monday adjacent to holiday
            impact += 0.15
    
    return min(1, impact)  # Cap at 1

def get_major_festivals(location, month=None):
    """
    Get major festivals/events for a location
    
    This would ideally use a curated database of major
    festivals by location
    """
    # Placeholder - would use actual database
    festivals = {
        'india': [
            {'name': 'Diwali', 'month': 10, 'impact': 'very_high'},
            {'name': 'Holi', 'month': 3, 'impact': 'very_high'},
        ],
        'spain': [
            {'name': 'La Tomatina', 'month': 8, 'impact': 'high'},
            {'name': 'Running of the Bulls', 'month': 7, 'impact': 'very_high'},
        ],
        # Add more locations...
    }
    
    location_lower = location.lower()
    location_festivals = festivals.get(location_lower, [])
    
    if month:
        location_festivals = [f for f in location_festivals if f['month'] == month]
    
    return location_festivals
