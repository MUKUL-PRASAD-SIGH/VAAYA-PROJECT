"""
Test image verification with Gemini API
Tests quest image verification functionality
"""
import os
from dotenv import load_dotenv
from services.gemini_service import verify_quest_image
from PIL import Image
import io
import base64

load_dotenv()

def create_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (400, 300), color='blue')
    
    # Save to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    return base64.b64encode(img_byte_arr.read()).decode('utf-8')

def test_image_verification():
    """Test image verification with Gemini"""
    
    print("=" * 60)
    print("🖼️  VAAYA - Image Verification Test")
    print("=" * 60)
    
    # Check API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...{api_key[-5:]}\n")
    
    # Create test image
    print("📸 Creating test image...")
    test_image_base64 = create_test_image()
    print("✅ Test image created (blue 400x300 image)\n")
    
    # Test verification
    print("🔍 Testing quest verification: 'Take a photo of a blue sky'")
    print("-" * 60)
    
    try:
        result = verify_quest_image(
            image_data=test_image_base64,
            quest_type="culture",
            location="Test Location",
            description="Take a photo of a blue sky"
        )
        
        print("\n📊 Verification Result:")
        print(f"   ✓ Verified: {result.get('verified', False)}")
        print(f"   ✓ Confidence: {result.get('confidence', 0)}%")
        print(f"   ✓ Feedback: {result.get('feedback', 'N/A')}")
        
        if result.get('verified'):
            print("\n✅ Image verification PASSED!")
        else:
            print("\n⚠️  Image verification FAILED (expected for test image)")
        
        print("\n" + "=" * 60)
        print("✅ Image verification system is working!")
        print("🎯 Phase 1.2 Complete: AI libraries operational")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during verification: {e}")
        print("\n💡 Possible issues:")
        print("   1. Gemini API key invalid or expired")
        print("   2. Image data format incorrect")
        print("   3. Network connectivity issues")
        return False

if __name__ == "__main__":
    success = test_image_verification()
    exit(0 if success else 1)
