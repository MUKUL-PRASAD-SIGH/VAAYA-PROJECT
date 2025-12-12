"""
Test AI Features - Gemini Integration
Tests heatmap generation, quest verification, and chatbot
"""
from app import app
import random
import base64
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_image():
    """Create a simple test image for quest verification"""
    # Create a 800x600 image
    img = Image.new('RGB', (800, 600), color='lightblue')
    draw = ImageDraw.Draw(img)
    
    # Draw some trash bags (simple rectangles)
    draw.rectangle([100, 200, 200, 400], fill='black')
    draw.rectangle([250, 220, 350, 420], fill='darkgray')
    draw.rectangle([400, 210, 500, 410], fill='black')
    
    # Add text
    try:
        draw.text((300, 50), "Trash Cleanup - Community Service", fill='black')
        draw.text((250, 500), "Beach Cleanup Day 2025", fill='black')
    except:
        pass  # Font not available
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{img_base64}"

def test_ai_features():
    """Test all AI endpoints"""
    
    with app.test_client() as client:
        print("="*60)
        print("TESTING GEMINI AI FEATURES")
        print("="*60)
        
        # Step 1: Check AI health
        print("\n1. Checking AI service health...")
        health = client.get('/ai/health')
        print(f"   Status: {health.status_code}")
        health_data = health.json
        print(f"   Gemini Configured: {health_data.get('gemini_configured')}")
        
        # Step 2: Register user for auth
        print("\n2. Registering test user...")
        email = f'aitest{random.randint(10000,99999)}@test.com'
        reg = client.post('/auth/register', json={
            'email': email,
            'password': 'Test1234!',
            'role': 'tourist'
        })
        print(f"   Status: {reg.status_code}")
        token = reg.json.get('token', '')
        
        # Step 3: Test Heatmap Generation
        print("\n3. Testing Heatmap Generation...")
        heatmap_resp = client.post('/ai/heatmap', json={
            'destination': 'Eiffel Tower, Paris',
            'date': '2025-07-14',
            'location_coords': {'lat': 48.8584, 'lng': 2.2945}
        })
        print(f"   Status: {heatmap_resp.status_code}")
        
        if heatmap_resp.status_code == 200:
            heatmap_data = heatmap_resp.json
            heatmap = heatmap_data.get('heatmap', {})
            print(f"   OK Heatmap generated!")
            print(f"   Destination: {heatmap.get('destination')}")
            print(f"   Date: {heatmap.get('date')}")
            print(f"   Grid size: {heatmap.get('grid_size')}x{heatmap.get('grid_size')}")
            
            hotspots = heatmap.get('hotspots', [])
            if hotspots:
                print(f"   Hotspots identified: {len(hotspots)}")
                for spot in hotspots[:2]:
                    print(f"     - {spot.get('area')}: density {spot.get('density')}")
        else:
            print(f"   FAILED: {heatmap_resp.json}")
        
        # Step 4: Test Quest Verification
        print("\n4. Testing Quest Image Verification...")
        test_image = create_test_image()
        
        verify_resp = client.post('/ai/verify-quest',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'quest_type': 'trash_cleanup',
                'location': 'Beach Park',
                'description': 'Clean up beach area',
                'image': test_image
            }
        )
        print(f"   Status: {verify_resp.status_code}")
        
        if verify_resp.status_code == 200:
            verify_data = verify_resp.json
            verification = verify_data.get('verification', {})
            print(f"   OK Verification complete!")
            print(f"   Verified: {verification.get('verified')}")
            print(f"   Authenticity Score: {verification.get('authenticity_score')}")
            print(f"   Confidence: {verification.get('confidence')}")
            print(f"   Reason: {verification.get('reason', '')[:100]}...")
        else:
            print(f"   X Failed: {verify_resp.json}")
        
        # Step 5: Test Chatbot
        print("\n5. Testing Tourism Chatbot...")
        chat_resp = client.post('/ai/chat',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'message': 'What are the best times to visit the Eiffel Tower to avoid crowds?'
            }
        )
        print(f"   Status: {chat_resp.status_code}")
        
        if chat_resp.status_code == 200:
            chat_data = chat_resp.json
            print(f"   OK Chatbot responded!")
            response = chat_data.get('message', '')
            print(f"   Response: {response[:200]}...")
            print(f"   Context used: {chat_data.get('context_used')}")
        else:
            print(f"   X Failed: {chat_resp.json}")
        
        # Step 6: Test Itinerary Generation
        print("\n6. Testing AI Itinerary Generator...")
        itinerary_resp = client.post('/ai/generate-itinerary',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'destination': 'Kyoto, Japan',
                'duration_days': 3,
                'preferences': {
                    'interests': ['culture', 'temples', 'food'],
                    'budget': 'medium',
                    'pace': 'relaxed'
                }
            }
        )
        print(f"   Status: {itinerary_resp.status_code}")
        
        if itinerary_resp.status_code == 200:
            itinerary_data = itinerary_resp.json
            print(f"   OK Itinerary generated!")
            itinerary = itinerary_data.get('itinerary', {})
            days = itinerary.get('itinerary', [])
            if days:
                print(f"   Days planned: {len(days)}")
                print(f"   Day 1: {days[0].get('title', 'N/A')}")
        else:
            print(f"   X Failed: {itinerary_resp.json}")
        
        print("\n" + "="*60)
        print("AI FEATURES TEST COMPLETE")
        print("="*60)
        print("\nSummary:")
        print(f"  - Health Check: {'OK' if health.status_code == 200 else 'X'}")
        print(f"  - Heatmap Generation: {'OK' if heatmap_resp.status_code == 200 else 'X'}")
        print(f"  - Quest Verification: {'OK' if verify_resp.status_code == 200 else 'X'}")
        print(f"  - Chatbot: {'OK' if chat_resp.status_code == 200 else 'X'}")
        print(f"  - Itinerary Generation: {'OK' if itinerary_resp.status_code == 200 else 'X'}")
        print()

if __name__ == '__main__':
    test_ai_features()
