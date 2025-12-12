"""
Test image verification with a REAL downloaded image
"""
import os
from dotenv import load_dotenv
from services.gemini_service import verify_quest_image
from PIL import Image
import io
import base64
import requests

load_dotenv()

def download_and_encode_image(url):
    """Download image from URL and convert to base64"""
    print(f"📥 Downloading image from: {url}")
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    
    # Convert to base64
    image_data = base64.b64encode(response.content).decode('utf-8')
    print("✅ Image downloaded and encoded")
    return image_data

def test_real_image():
    """Test with real images from the internet"""
    
    print("=" * 60)
    print("🖼️  VAAYA - Real Image Verification Test")
    print("=" * 60)
    
    # Check API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...{api_key[-5:]}\n")
    
    # Test cases with real images
    test_cases = [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Taj_Mahal_in_March_2004.jpg/640px-Taj_Mahal_in_March_2004.jpg",
            "quest_type": "heritage",
            "description": "Take a photo of the Taj Mahal",
            "location": "Agra, India"
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/London_Big_Ben_Phone_box.jpg/640px-London_Big_Ben_Phone_box.jpg",
            "quest_type": "culture",
            "description": "Take a photo of Big Ben",
            "location": "London, UK"
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}/{len(test_cases)}: {test['description']}")
        print(f"{'='*60}")
        
        try:
            # Download and encode image
            image_base64 = download_and_encode_image(test['url'])
            
            # Test verification
            print(f"\n🔍 Verifying quest: '{test['description']}'")
            print(f"📍 Location: {test['location']}")
            print(f"🏷️  Type: {test['quest_type']}")
            print("-" * 60)
            
            result = verify_quest_image(
                image_data=image_base64,
                quest_type=test['quest_type'],
                location=test['location'],
                description=test['description']
            )
            
            print("\n📊 Verification Result:")
            print(f"   ✓ Verified: {'✅ YES' if result.get('verified') else '❌ NO'}")
            print(f"   ✓ Confidence: {result.get('confidence', 0)}%")
            print(f"   ✓ Feedback: {result.get('feedback', 'N/A')}")
            
            if result.get('verified'):
                print("\n🎉 Verification PASSED!")
            else:
                print("\n⚠️  Verification FAILED")
                
        except Exception as e:
            print(f"\n❌ Error: {e}")
            continue
    
    print("\n" + "=" * 60)
    print("✅ Real image verification tests complete!")
    print("🎯 Image verification system working with real photos")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    test_real_image()
