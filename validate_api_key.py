"""
Quick Gemini API Key Validator
Tests your API key with a simple REST API call
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("🔑 VAAYA - API Key Validator")
print("=" * 60)

api_key = os.getenv('GEMINI_API_KEY')

print(f"\n1️⃣ Checking .env file...")
if not api_key:
    print("❌ GEMINI_API_KEY not found in .env")
    exit(1)

print(f"✅ Found key: {api_key[:15]}...{api_key[-10:]}")
print(f"📏 Length: {len(api_key)} characters")

# Check format
if api_key.startswith('AIza'):
    print("✅ Format looks correct (starts with 'AIza')")
else:
    print("⚠️ Key format unusual (should start with 'AIza')")

# Test with direct REST API call
print(f"\n2️⃣ Testing API key with Google servers...")
url = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={api_key}"

payload = {
    "contents": [{
        "parts": [{"text": "Say 'Hello' in one word"}]
    }]
}

try:
    response = requests.post(url, json=payload, timeout=10)
    
    print(f"\n📡 Response Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ API KEY IS VALID!")
        print(f"📝 Test response: {result['candidates'][0]['content']['parts'][0]['text']}")
        print(f"\n🎉 Your Gemini API is working perfectly!")
        print(f"🚀 You can now run: python app.py")
        
    elif response.status_code == 400:
        print(f"❌ API KEY IS INVALID!")
        error_data = response.json()
        print(f"📛 Error: {error_data.get('error', {}).get('message', 'Unknown error')}")
        print(f"\n💡 Solutions:")
        print(f"   1. Get a NEW key from: https://aistudio.google.com/app/apikey")
        print(f"   2. Make sure you're signed in with Google")
        print(f"   3. Click 'Create API Key' → 'Create API key in new project'")
        print(f"   4. Copy the ENTIRE key (starts with 'AIza')")
        print(f"   5. Paste it in .env file (no quotes, no spaces)")
        
    elif response.status_code == 403:
        print(f"❌ API ACCESS DENIED!")
        print(f"📛 Possible reasons:")
        print(f"   - Generative Language API not enabled")
        print(f"   - Key has IP/domain restrictions")
        print(f"   - Project billing issue")
        print(f"\n💡 Fix:")
        print(f"   Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com")
        print(f"   Click 'ENABLE' button")
        
    elif response.status_code == 429:
        print(f"⚠️ QUOTA EXCEEDED!")
        print(f"   Free tier: 60 requests/min")
        print(f"   Wait a few minutes and try again")
    
    else:
        print(f"⚠️ Unexpected response")
        print(f"Response: {response.text[:200]}")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Network error: {e}")
    print(f"💡 Check your internet connection")

print("\n" + "=" * 60)
