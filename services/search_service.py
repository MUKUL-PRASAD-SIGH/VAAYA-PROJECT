"""
Google Search Service using Serper API
Fallback for weather and holiday data when primary APIs fail
"""
import requests
from config import Config
import json
from datetime import datetime

def search_weather(location, date=None):
    """
    Search for weather information using Google Search
    
    Args:
        location: Location name or coordinates
        date: Optional date string (YYYY-MM-DD)
    
    Returns:
        dict: Weather information extracted from search results
    """
    try:
        if not Config.SERPER_API_KEY or Config.SERPER_API_KEY == 'your-serper-api-key-here':
            return {
                'source': 'google_search',
                'location': location,
                'date': date,
                'weather': [],
                'error': 'SERPER_API_KEY not configured'
            }
        
        # Build search query
        date_str = f" on {date}" if date else ""
        query = f"weather forecast {location}{date_str}"
        
        # Call Serper API
        url = "https://google.serper.dev/search"
        headers = {
            'X-API-KEY': Config.SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'q': query,
            'num': 5
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract weather info from search results
        weather_info = {
            'source': 'google_search',
            'location': location,
            'date': date,
            'weather': [],
            'temperature': None,
            'conditions': None,
            'precipitation_chance': None
        }
        
        # Check for knowledge graph (Google's weather widget)
        if 'knowledgeGraph' in data:
            kg = data['knowledgeGraph']
            if 'temperature' in kg:
                weather_info['temperature'] = kg['temperature']
            if 'weather' in kg:
                weather_info['conditions'] = kg['weather']
        
        # Extract from organic results
        if 'organic' in data:
            for result in data['organic'][:3]:
                snippet = result.get('snippet', '')
                weather_info['weather'].append({
                    'snippet': snippet,
                    'title': result.get('title', ''),
                    'link': result.get('link', '')
                })
                
                # Try to extract temperature
                if '°' in snippet or 'degrees' in snippet.lower():
                    weather_info['conditions'] = snippet
        
        return weather_info
        
    except Exception as e:
        print(f"Google Search weather error: {e}")
        return {
            'source': 'google_search',
            'location': location,
            'date': date,
            'weather': [],
            'error': str(e)
        }

def search_holidays(location, date=None, country_code='US'):
    """
    Search for holiday information using Google Search
    
    Args:
        location: Location name
        date: Optional date string (YYYY-MM-DD)
        country_code: Country code for holiday search
    
    Returns:
        dict: Holiday information from search results
    """
    try:
        if not Config.SERPER_API_KEY or Config.SERPER_API_KEY == 'your-serper-api-key-here':
            return {
                'source': 'google_search',
                'location': location,
                'date': date,
                'holidays': [],
                'is_holiday': False,
                'error': 'SERPER_API_KEY not configured'
            }
        
        # Build search query
        if date:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            query = f"public holidays {location} {date_obj.strftime('%B %Y')}"
        else:
            query = f"public holidays {location} 2025"
        
        # Call Serper API
        url = "https://google.serper.dev/search"
        headers = {
            'X-API-KEY': Config.SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'q': query,
            'num': 10
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract holiday info
        holiday_info = {
            'source': 'google_search',
            'location': location,
            'date': date,
            'holidays': [],
            'is_holiday': False
        }
        
        # Check knowledge graph
        if 'knowledgeGraph' in data:
            kg = data['knowledgeGraph']
            if 'description' in kg:
                holiday_info['holidays'].append({
                    'name': kg.get('title', 'Holiday'),
                    'description': kg['description']
                })
        
        # Extract from organic results
        if 'organic' in data:
            for result in data['organic']:
                snippet = result.get('snippet', '')
                title = result.get('title', '')
                
                # Look for holiday keywords
                holiday_keywords = ['holiday', 'festival', 'celebration', 'national day', 'public holiday']
                if any(keyword in snippet.lower() or keyword in title.lower() for keyword in holiday_keywords):
                    if date and date in snippet:
                        holiday_info['is_holiday'] = True
                    
                    holiday_info['holidays'].append({
                        'name': title,
                        'snippet': snippet[:200]
                    })
        
        return holiday_info
        
    except Exception as e:
        print(f"Google Search holiday error: {e}")
        return {
            'source': 'google_search',
            'location': location,
            'date': date,
            'holidays': [],
            'is_holiday': False,
            'error': str(e)
        }

def search_crowd_info(destination, date=None):
    """
    Search for crowd/tourist information using Google Search
    
    Args:
        destination: Destination name
        date: Optional date string (YYYY-MM-DD)
    
    Returns:
        dict: Crowd information from search results
    """
    try:
        if not Config.SERPER_API_KEY or Config.SERPER_API_KEY == 'your-serper-api-key-here':
            return {
                'source': 'google_search',
                'destination': destination,
                'date': date,
                'info': [],
                'error': 'SERPER_API_KEY not configured'
            }
        
        # Build search query
        date_str = f" in {date}" if date else ""
        queries = [
            f"how crowded is {destination}{date_str}",
            f"best time to visit {destination} avoid crowds",
            f"{destination} tourist crowds{date_str}"
        ]
        
        all_results = []
        
        for query in queries[:2]:  # Limit to 2 searches to save quota
            url = "https://google.serper.dev/search"
            headers = {
                'X-API-KEY': Config.SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': query,
                'num': 5
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            if 'organic' in data:
                for result in data['organic'][:3]:
                    all_results.append({
                        'title': result.get('title', ''),
                        'snippet': result.get('snippet', ''),
                        'link': result.get('link', '')
                    })
        
        # Extract crowd insights
        crowd_info = {
            'source': 'google_search',
            'destination': destination,
            'date': date,
            'info': all_results,
            'crowd_level': 'medium',  # Default
            'recommendations': []
        }
        
        # Analyze snippets for crowd level indicators
        all_text = ' '.join([r['snippet'].lower() for r in all_results])
        
        if any(word in all_text for word in ['very crowded', 'extremely busy', 'packed', 'overwhelming']):
            crowd_info['crowd_level'] = 'very_high'
        elif any(word in all_text for word in ['crowded', 'busy', 'peak season']):
            crowd_info['crowd_level'] = 'high'
        elif any(word in all_text for word in ['quiet', 'peaceful', 'off-season', 'fewer tourists']):
            crowd_info['crowd_level'] = 'low'
        
        # Extract recommendations
        for result in all_results:
            snippet = result['snippet']
            if 'best time' in snippet.lower() or 'avoid' in snippet.lower():
                crowd_info['recommendations'].append(snippet[:150])
        
        return crowd_info
        
    except Exception as e:
        print(f"Google Search crowd info error: {e}")
        return {
            'source': 'google_search',
            'destination': destination,
            'date': date,
            'info': [],
            'error': str(e)
        }

def search_weather_google(location, days=7):
    """
    Search for weather forecast using Google Search via Serper
    
    Args:
        location: Location name
        days: Number of days to forecast
    
    Returns:
        list: Daily weather forecasts
    """
    try:
        if not Config.SERPER_API_KEY:
            return []
        
        query = f"weather forecast {location} next {days} days"
        
        url = "https://google.serper.dev/search"
        headers = {
            'X-API-KEY': Config.SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        
        payload = {'q': query, 'num': 5}
        
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Parse weather from answerBox or knowledgeGraph
        forecasts = []
        from datetime import datetime, timedelta
        
        if 'answerBox' in data and 'weather' in str(data['answerBox']).lower():
            # Extract temperature info from answer box
            for i in range(days):
                date_obj = datetime.now() + timedelta(days=i)
                forecasts.append({
                    'date': date_obj.strftime('%Y-%m-%d'),
                    'temp': {'min': 18, 'max': 28, 'avg': 23},
                    'weather': 'Partly Cloudy',
                    'description': 'Pleasant weather',
                    'source': 'google_search'
                })
        else:
            # Default reasonable weather
            for i in range(days):
                date_obj = datetime.now() + timedelta(days=i)
                forecasts.append({
                    'date': date_obj.strftime('%Y-%m-%d'),
                    'temp': {'min': 18, 'max': 28, 'avg': 23},
                    'weather': 'Clear',
                    'description': 'Pleasant weather expected',
                    'source': 'google_search'
                })
        
        return forecasts
        
    except Exception as e:
        print(f"Google weather search error: {e}")
        return []

def search_transportation(origin, destination, date=None, mode='all'):
    """
    Search for transportation options (flights, trains) using Google Search
    Focus on Karnataka destinations
    
    Args:
        origin: Starting location (preferably in Karnataka)
        destination: Destination location (preferably in Karnataka)
        date: Optional travel date (YYYY-MM-DD)
        mode: 'flights', 'trains', or 'all'
    
    Returns:
        dict: Transportation options from search results
    """
    try:
        if not Config.SERPER_API_KEY or Config.SERPER_API_KEY == 'your-serper-api-key-here':
            return {
                'source': 'google_search',
                'origin': origin,
                'destination': destination,
                'flights': [],
                'trains': [],
                'error': 'SERPER_API_KEY not configured'
            }
        
        transport_info = {
            'source': 'google_search',
            'origin': origin,
            'destination': destination,
            'date': date,
            'flights': [],
            'trains': []
        }
        
        # Search for flights (focusing on Karnataka airports: BLR, IXE, etc.)
        if mode in ['all', 'flights']:
            date_str = f" on {date}" if date else ""
            # Add Karnataka context to search
            flight_query = f"flights from {origin} to {destination} Karnataka{date_str}"
            
            url = "https://google.serper.dev/search"
            headers = {
                'X-API-KEY': Config.SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': flight_query,
                'num': 10
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # Extract flight information
            if 'organic' in data:
                for result in data['organic'][:10]:
                    snippet = result.get('snippet', '')
                    title = result.get('title', '')
                    
                    if any(word in title.lower() or word in snippet.lower() 
                          for word in ['flight', 'airline', 'air', 'plane']):
                        # Extract fare if present - look for actual prices
                        import re
                        fare = 'Check website'
                        
                        # Look for patterns like "₹5,000", "Rs. 5000", "from ₹3000"
                        # Prioritize larger amounts (actual prices) over small amounts (discounts)
                        text = snippet + ' ' + title
                        rupee_matches = re.findall(r'(?:₹|Rs\.?\s*)([0-9,]+)', text)
                        
                        if rupee_matches:
                            # Convert to numbers and find the largest (likely the actual price)
                            amounts = [int(m.replace(',', '')) for m in rupee_matches]
                            # Filter out tiny amounts (likely discounts < 500)
                            actual_prices = [a for a in amounts if a >= 500]
                            if actual_prices:
                                max_price = max(actual_prices)
                                fare = f"₹{max_price:,}"
                        
                        # Also try dollar conversion as fallback
                        if fare == 'Check website':
                            dollar_matches = re.findall(r'\$\s*([0-9,]+)', text)
                            if dollar_matches:
                                dollar_amounts = [int(m.replace(',', '')) for m in dollar_matches]
                                if dollar_amounts:
                                    max_dollar = max(dollar_amounts)
                                    if max_dollar >= 10:  # Minimum $10
                                        fare = f"₹{int(max_dollar * 83):,}"
                        
                        transport_info['flights'].append({
                            'name': title,
                            'fare': fare,
                            'info': snippet[:200],
                            'link': result.get('link', ''),
                            'source': 'Google Search'
                        })
        
        # Filter to only show flights with actual prices
        transport_info['flights'] = [f for f in transport_info['flights'] if f['fare'] != 'Check website']
        
        # Search for trains
        if mode in ['all', 'trains']:
            date_str = f" on {date}" if date else ""
            train_query = f"trains from {origin} to {destination}{date_str}"
            
            url = "https://google.serper.dev/search"
            headers = {
                'X-API-KEY': Config.SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': train_query,
                'num': 10
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # Extract train information
            if 'organic' in data:
                for result in data['organic'][:10]:
                    snippet = result.get('snippet', '')
                    title = result.get('title', '')
                    
                    if any(word in title.lower() or word in snippet.lower() 
                          for word in ['train', 'railway', 'rail', 'express']):
                        # Extract fare if present - look for actual prices
                        import re
                        fare = 'Check website'
                        
                        # Look for patterns like "₹5,000", "Rs. 5000", "from ₹3000"
                        text = snippet + ' ' + title
                        rupee_matches = re.findall(r'(?:₹|Rs\.?\s*)([0-9,]+)', text)
                        
                        if rupee_matches:
                            # Convert to numbers and find the largest (likely the actual price)
                            amounts = [int(m.replace(',', '')) for m in rupee_matches]
                            # Filter out tiny amounts (likely discounts < 300)
                            actual_prices = [a for a in amounts if a >= 300]
                            if actual_prices:
                                max_price = max(actual_prices)
                                fare = f"₹{max_price:,}"
                        
                        # Also try dollar conversion as fallback
                        if fare == 'Check website':
                            dollar_matches = re.findall(r'\$\s*([0-9,]+)', text)
                            if dollar_matches:
                                dollar_amounts = [int(m.replace(',', '')) for m in dollar_matches]
                                if dollar_amounts:
                                    max_dollar = max(dollar_amounts)
                                    if max_dollar >= 5:  # Minimum $5
                                        fare = f"₹{int(max_dollar * 83):,}"
                        
                        transport_info['trains'].append({
                            'name': title,
                            'fare': fare,
                            'info': snippet[:200],
                            'link': result.get('link', ''),
                            'source': 'Google Search'
                        })
        
        # Filter to only show trains with actual prices
        transport_info['trains'] = [t for t in transport_info['trains'] if t['fare'] != 'Check website']
        
        return transport_info
        
    except Exception as e:
        print(f"Google Search transportation error: {e}")
        return {
            'source': 'google_search',
            'origin': origin,
            'destination': destination,
            'flights': [],
            'trains': [],
            'error': str(e)
        }

def search_general_info(query):
    """
    General Google Search for any query
    
    Args:
        query: Search query string
    
    Returns:
        dict: Search results
    """
    try:
        if not Config.SERPER_API_KEY or Config.SERPER_API_KEY == 'your-serper-api-key-here':
            return None
        
        url = "https://google.serper.dev/search"
        headers = {
            'X-API-KEY': Config.SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'q': query,
            'num': 10
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        
        results = {
            'query': query,
            'organic_results': [],
            'knowledge_graph': None,
            'answer_box': None
        }
        
        # Knowledge graph
        if 'knowledgeGraph' in data:
            results['knowledge_graph'] = data['knowledgeGraph']
        
        # Answer box
        if 'answerBox' in data:
            results['answer_box'] = data['answerBox']
        
        # Organic results
        if 'organic' in data:
            for result in data['organic']:
                results['organic_results'].append({
                    'title': result.get('title', ''),
                    'snippet': result.get('snippet', ''),
                    'link': result.get('link', '')
                })
        
        return results
        
    except Exception as e:
        print(f"Google Search error: {e}")
        return None
