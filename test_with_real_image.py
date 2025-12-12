"""
Test image verification with user-provided image
Upload your own image to test
"""
import os
from dotenv import load_dotenv
from services.gemini_service import verify_quest_image
from PIL import Image, ImageDraw, ImageFont
import io
import base64

load_dotenv()

def create_realistic_test_image():
    """Create a more realistic test image with text/landmarks"""
    # Create a sky-like gradient image
    width, height = 800, 600
    img = Image.new('RGB', (width, height))
    pixels = img.load()
    
    # Create blue sky gradient
    for y in range(height):
        # Sky gets lighter towards horizon
        blue_value = int(135 + (y / height) * 100)  # 135-235 range
        for x in range(width):
            pixels[x, y] = (100, 150, blue_value)
    
    # Add some white "clouds"
    draw = ImageDraw.Draw(img)
    draw.ellipse([100, 100, 250, 180], fill=(255, 255, 255))
    draw.ellipse([200, 120, 320, 190], fill=(255, 255, 255))
    draw.ellipse([500, 150, 650, 220], fill=(255, 255, 255))
    draw.ellipse([600, 180, 720, 240], fill=(255, 255, 255))
    
    # Convert to base64
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    return base64.b64encode(img_byte_arr.read()).decode('utf-8')

def test_from_file(image_path):
    """Test with an image file from disk"""
    print(f"📂 Loading image from: {image_path}")
    
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    print("✅ Image loaded and encoded")
    return image_data

def main():
    print("=" * 60)
    print("🖼️  VAAYA - Real Image Verification Test")
    print("=" * 60)
    
    # Check API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found")
        return
    
    print(f"✅ API Key found: {api_key[:10]}...{api_key[-5:]}\n")
    
    # Check if user provided an image file
    print("📝 Options:")
    print("   1. Test with realistic generated sky image")
    print("   2. Test with your own image file")
    
    choice = input("\nEnter choice (1 or 2, or press Enter for option 1): ").strip()
    
    if choice == "2":
        image_path = input("Enter full path to image file: ").strip()
        if not os.path.exists(image_path):
            print(f"❌ File not found: {image_path}")
            return
        image_base64 = test_from_file(image_path)
        description = input("Enter quest description (e.g., 'Take a photo of a monument'): ").strip()
        quest_type = input("Enter quest type (culture/heritage/food/environment): ").strip() or "culture"
        location = input("Enter location: ").strip() or "Unknown"
    else:
        print("\n📸 Creating realistic sky image with clouds...")
        image_base64 = create_realistic_test_image()
        print("✅ Realistic sky image created\n")
        description = "Take a photo of a blue sky with clouds"
        quest_type = "environment"
        location = "Outdoor location"
    
    # Test verification
    print(f"\n🔍 Verifying quest: '{description}'")
    print(f"📍 Location: {location}")
    print(f"🏷️  Type: {quest_type}")
    print("-" * 60)
    
    try:
        result = verify_quest_image(
            image_data=image_base64,
            quest_type=quest_type,
            location=location,
            description=description
        )
        
        print("\n📊 Verification Result:")
        print(f"   ✓ Verified: {'✅ YES' if result.get('verified') else '❌ NO'}")
        print(f"   ✓ Confidence: {result.get('confidence', 0)}%")
        print(f"   ✓ Feedback: {result.get('feedback', 'N/A')}")
        
        if result.get('ai_response'):
            print(f"\n🤖 AI Analysis:\n{result['ai_response']}")
        
        print("\n" + "=" * 60)
        if result.get('verified'):
            print("🎉 Quest Verification PASSED!")
        else:
            print("⚠️  Quest Verification FAILED")
        print("✅ Image verification system is working!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during verification: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
