"""
List all available Gemini models for your API key
"""
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("❌ No API key found")
    exit(1)

print("🔑 Using API key:", api_key[:10] + "..." + api_key[-5:])
print("\n🔍 Fetching available models...\n")

try:
    genai.configure(api_key=api_key)
    
    print("📋 Available Models:")
    print("=" * 60)
    
    for model in genai.list_models():
        print(f"\n✅ {model.name}")
        print(f"   Display Name: {model.display_name}")
        print(f"   Description: {model.description[:100]}..." if len(model.description) > 100 else f"   Description: {model.description}")
        print(f"   Supported Methods: {', '.join(model.supported_generation_methods)}")
        
    print("\n" + "=" * 60)
    print("✅ Done! Use the model names above (e.g., 'models/gemini-pro')")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\n💡 Possible solutions:")
    print("   1. Check if your API key is valid")
    print("   2. Ensure you have internet connection")
    print("   3. Try generating a new API key from: https://aistudio.google.com/app/apikey")
