"""
Test script for API fallback system
Tests that weather and holiday services fall back to Google Search when primary APIs fail
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_weather_fallback():
    """Test weather service fallback chain"""
    from services.weather_service import get_weather_forecast, _get_weather_fallback, _get_default_weather
    
    print("\n" + "="*60)
    print("TESTING WEATHER SERVICE FALLBACK")
    print("="*60)
    
    # Test 1: Normal API call (will likely fail with 401 if API key is invalid)
    print("\n1. Testing weather with potentially invalid OpenWeather API key...")
    try:
        result = get_weather_forecast(40.7128, -74.0060, days=3, location_name="New York")
        print(f"   Result source: {result.get('source', 'unknown')}")
        print(f"   Forecast count: {len(result.get('forecast', []))}")
        if result.get('source') == 'google_search':
            print("   ✅ Successfully fell back to Google Search!")
        elif result.get('source') == 'openweather':
            print("   ✅ Primary OpenWeather API working")
        elif result.get('source') == 'default':
            print("   ⚠️  Using default weather data (both APIs failed)")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Direct fallback test
    print("\n2. Testing Google Search weather fallback directly...")
    try:
        result = _get_weather_fallback(40.7128, -74.0060, "New York", days=3)
        print(f"   Result source: {result.get('source', 'unknown')}")
        print(f"   Forecast count: {len(result.get('forecast', []))}")
        if result.get('forecast'):
            print(f"   Sample forecast: {result['forecast'][0]}")
            print("   ✅ Google Search fallback working!")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Default weather
    print("\n3. Testing default weather data...")
    try:
        result = _get_default_weather(40.7128, -74.0060, days=3)
        print(f"   Result source: {result.get('source', 'unknown')}")
        print(f"   Forecast count: {len(result.get('forecast', []))}")
        if result.get('forecast'):
            print(f"   Sample forecast: {result['forecast'][0]}")
            print("   ✅ Default weather working!")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def test_holiday_fallback():
    """Test holiday service fallback chain"""
    from services.holiday_service import get_holidays, _get_holidays_fallback, _get_default_holidays
    
    print("\n" + "="*60)
    print("TESTING HOLIDAY SERVICE FALLBACK")
    print("="*60)
    
    # Test 1: Normal API call
    print("\n1. Testing holidays with primary API...")
    try:
        result = get_holidays('US', 2025, location_name='United States')
        if result:
            print(f"   Found {len(result)} holidays")
            print(f"   Source: {result[0].get('source', 'unknown')}")
            print(f"   Sample: {result[0]['name']} on {result[0]['date']}")
            if result[0].get('source') == 'google_search':
                print("   ✅ Successfully fell back to Google Search!")
            elif result[0].get('source') == 'nager_api':
                print("   ✅ Primary Nager API working")
            elif result[0].get('source') == 'default':
                print("   ⚠️  Using default holiday data")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Direct fallback test
    print("\n2. Testing Google Search holiday fallback directly...")
    try:
        result = _get_holidays_fallback('US', 2025, 'United States')
        if result:
            print(f"   Found {len(result)} holidays")
            print(f"   Source: {result[0].get('source', 'unknown')}")
            print(f"   Sample: {result[0]['name']}")
            print("   ✅ Google Search holiday fallback working!")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Default holidays
    print("\n3. Testing default holiday data...")
    try:
        result = _get_default_holidays('US', 2025)
        print(f"   Found {len(result)} holidays")
        print(f"   Source: {result[0].get('source', 'unknown')}")
        print(f"   Sample: {result[0]['name']} on {result[0]['date']}")
        print("   ✅ Default holidays working!")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def test_search_service():
    """Test Google Search service functions"""
    from services.search_service import search_weather, search_holidays, search_crowd_info
    
    print("\n" + "="*60)
    print("TESTING GOOGLE SEARCH SERVICE")
    print("="*60)
    
    # Check if Serper API key is configured
    serper_key = os.getenv('SERPER_API_KEY')
    if not serper_key or serper_key == 'your_serper_api_key_here':
        print("\n⚠️  SERPER_API_KEY not configured - Google Search fallback will not work")
        print("   Get your API key from: https://serper.dev")
        return
    
    print(f"\n✅ SERPER_API_KEY configured: {serper_key[:10]}...")
    
    # Test 1: Weather search
    print("\n1. Testing weather search...")
    try:
        from datetime import datetime
        result = search_weather("Paris", datetime(2025, 6, 15))
        if result.get('weather'):
            print(f"   Found weather data: {result['weather'][0].get('snippet', 'N/A')[:100]}")
            print("   ✅ Weather search working!")
        else:
            print("   ⚠️  No weather data found")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Holiday search
    print("\n2. Testing holiday search...")
    try:
        result = search_holidays("France", country_code='FR')
        if result.get('holidays'):
            print(f"   Found {len(result['holidays'])} holiday results")
            print(f"   Sample: {result['holidays'][0].get('name', 'N/A')}")
            print("   ✅ Holiday search working!")
        else:
            print("   ⚠️  No holiday data found")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Crowd info search
    print("\n3. Testing crowd info search...")
    try:
        from datetime import datetime
        result = search_crowd_info("Tokyo", datetime(2025, 8, 1))
        if result.get('info'):
            print(f"   Found {len(result['info'])} crowd insights")
            print(f"   Sample: {result['info'][0].get('snippet', 'N/A')[:100]}")
            print("   ✅ Crowd info search working!")
        else:
            print("   ⚠️  No crowd data found")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def main():
    """Run all fallback tests"""
    print("\n" + "="*60)
    print("API FALLBACK SYSTEM TEST SUITE")
    print("="*60)
    print("\nThis test verifies that the system gracefully falls back to")
    print("Google Search when primary APIs (OpenWeather, Nager) fail.")
    print("\nFallback chain: Primary API → Google Search → Default Data")
    
    # Test search service first
    test_search_service()
    
    # Test weather fallback
    test_weather_fallback()
    
    # Test holiday fallback
    test_holiday_fallback()
    
    print("\n" + "="*60)
    print("FALLBACK SYSTEM TEST COMPLETE")
    print("="*60)
    print("\nIf you see 'google_search' or 'default' as source, the fallback")
    print("system is working! Update .env with valid API keys for full functionality:")
    print("  - OPENWEATHER_API_KEY from https://openweathermap.org/api")
    print("  - SERPER_API_KEY from https://serper.dev (for Google Search)")
    print()

if __name__ == "__main__":
    main()
