
from config import Config
from openai import OpenAI
import google.generativeai as genai
import sys

def check_groq():
    print("\n--- Testing Groq API (Primary) ---")
    if not Config.GROK_API_KEY:
        print("❌ Groq API Key is MISSING in environment variables.")
        return

    try:
        client = OpenAI(
            api_key=Config.GROK_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        # Try a minimal request
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Test"
                }
            ],
            model="llama-3.3-70b-versatile",
            max_tokens=10
        )
        print("✅ Groq API is WORKING.")
    except Exception as e:
        error_str = str(e)
        if "429" in error_str:
            print("⚠️ Groq API Rate Limit Reached (429).")
        else:
            print(f"❌ Groq API Failed: {error_str}")

def check_gemini():
    print("\n--- Testing Gemini API (Fallback) ---")
    if not Config.GEMINI_API_KEY:
        print("❌ Gemini API Key is MISSING in environment variables.")
        return

    try:
        genai.configure(api_key=Config.GEMINI_API_KEY)
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        response = model.generate_content("Test", generation_config={"max_output_tokens": 10})
        if response and response.text:
            print("✅ Gemini API is WORKING.")
        else:
            print("❌ Gemini API returned empty response.")
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            print("⚠️ Gemini API Rate Limit/Quota Reached.")
        else:
            print(f"❌ Gemini API Failed: {error_str}")

if __name__ == "__main__":
    check_groq()
    check_gemini()
