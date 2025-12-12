"""
Test Gemini API Configuration
Verifies that the Gemini API key works and finds the correct model
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

def test_gemini_api():
    """Test Gemini API connection and model availability"""
    
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env file")
        print("📝 Please add your Gemini API key to the .env file")
        print("🔗 Get your key from: https://makersuite.google.com/app/apikey")
        return False
    
    print(f"✅ Found Gemini API key: {api_key[:10]}...{api_key[-5:]}")
    
    try:
        genai.configure(api_key=api_key)
        print("✅ Gemini API configured successfully")
    except Exception as e:
        print(f"❌ Failed to configure Gemini API: {e}")
        return False
    
    # Test available models
    print("\n🔍 Testing available Gemini models...\n")
    
    models_to_try = [
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-pro',
        'gemini-pro-latest'
    ]
    
    working_models = []
    
    for model_name in models_to_try:
        try:
            print(f"Testing {model_name}...", end=" ")
            model = genai.GenerativeModel(model_name)
            
            # Try a simple generation
            response = model.generate_content("Say 'Hello from Vaaya!' in one sentence.")
            
            if response and response.text:
                print(f"✅ WORKS")
                print(f"   Response: {response.text.strip()}")
                working_models.append(model_name)
            else:
                print(f"⚠️ No response")
                
        except Exception as e:
            print(f"❌ Failed: {str(e)[:50]}")
    
    print(f"\n{'='*60}")
    if working_models:
        print(f"✅ {len(working_models)} working model(s) found:")
        for model in working_models:
            print(f"   - {model}")
        print(f"\n🎉 Gemini API is ready to use!")
        print(f"📌 Recommended model: {working_models[0]}")
        return True
    else:
        print("❌ No working models found")
        print("⚠️ Possible issues:")
        print("   1. API key is invalid or expired")
        print("   2. API quota exceeded")
        print("   3. Models not available in your region")
        print("   4. Network connectivity issues")
        return False

if __name__ == "__main__":
    print("="*60)
    print("🧪 VAAYA - Gemini API Test")
    print("="*60 + "\n")
    
    success = test_gemini_api()
    
    print("\n" + "="*60)
    if success:
        print("✅ Test completed successfully!")
        print("🚀 You can now run the Vaaya server: python app.py")
    else:
        print("❌ Test failed. Please fix the issues above.")
    print("="*60)
