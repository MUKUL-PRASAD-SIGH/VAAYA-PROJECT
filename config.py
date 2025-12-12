"""
Configuration settings for QuestLoop
Loads environment variables and provides centralized config
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    
    # MongoDB settings
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/vaaya')
    
    # JWT settings
    JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    
    # Google Gemini API (legacy/fallback)
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # xAI Grok API (primary AI provider)
    GROK_API_KEY = os.getenv('GROK_API_KEY')
    
    # Serper API (Google Search)
    SERPER_API_KEY = os.getenv('SERPER_API_KEY')
    
    # OpenWeather API
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
    
    # Twilio (for OTP)
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
    
    # Firebase Cloud Messaging
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', './firebase-credentials.json')
    FCM_SERVER_KEY = os.getenv('FCM_SERVER_KEY')
    
    # Upload settings
    MAX_IMAGE_SIZE_MB = 5
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    UPLOAD_FOLDER = 'uploads'
    
    # Crowd prediction settings
    CROWD_PREDICTION_DAYS_AHEAD = 7
    
    # Quest settings
    MIN_QUEST_REWARD = 10
    MAX_QUEST_REWARD = 1000
