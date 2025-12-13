"""
Firebase Admin SDK utilities for token verification
"""
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps
from flask import request, jsonify
import os

# Initialize Firebase Admin SDK
# Uses GOOGLE_APPLICATION_CREDENTIALS environment variable or explicit path
_firebase_app = None

def init_firebase():
    """Initialize Firebase Admin SDK"""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    
    try:
        # Try to get credentials from environment variable
        cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        
        # If not set, look for Firebase credentials file in project root
        if not cred_path or not os.path.exists(cred_path):
            # Find any firebase-adminsdk JSON file in project root
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            for filename in os.listdir(project_root):
                if 'firebase-adminsdk' in filename and filename.endswith('.json'):
                    cred_path = os.path.join(project_root, filename)
                    print(f"Found Firebase credentials: {filename}")
                    break
        
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
        else:
            print("WARNING: No Firebase credentials found. Firebase auth will not work.")
            _firebase_app = None
        
        return _firebase_app
    except Exception as e:
        print(f"Firebase Admin SDK initialization failed: {e}")
        return None

def verify_firebase_token(id_token):
    """
    Verify Firebase ID token and return user info
    
    Args:
        id_token: Firebase ID token from client
    
    Returns:
        dict: Decoded token with uid, email, etc. or None if invalid
    """
    try:
        init_firebase()
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"Firebase token verification failed: {e}")
        return None

def firebase_required(f):
    """
    Decorator to protect routes with Firebase ID token authentication
    Usage: @firebase_required
    
    Extracts Firebase user info and passes as current_user to the route
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        id_token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            print(f"DEBUG: Auth header found: {auth_header[:50]}...")
            try:
                # Format: "Bearer <token>"
                id_token = auth_header.split(' ')[1]
                print(f"DEBUG: Token extracted, length: {len(id_token)}")
            except IndexError:
                print("DEBUG: Invalid token format - no space separator")
                return jsonify({'error': 'Invalid token format'}), 401
        else:
            print("DEBUG: No Authorization header found in request")
        
        if not id_token:
            print("DEBUG: No token extracted from request")
            return jsonify({'error': 'Authentication token is missing. Please ensure you\'re logged in.'}), 401
        
        # Verify Firebase token
        print("DEBUG: Attempting to verify Firebase token...")
        decoded_token = verify_firebase_token(id_token)
        
        if not decoded_token:
            print("DEBUG: Token verification failed - decoded_token is None")
            return jsonify({'error': 'Invalid or expired Firebase token'}), 401
        
        print(f"DEBUG: Token verified successfully for user: {decoded_token.get('email')}")
        
        # Add Firebase user info to kwargs
        kwargs['current_user'] = {
            'uid': decoded_token.get('uid'),
            'email': decoded_token.get('email'),
            'email_verified': decoded_token.get('email_verified', False),
            'name': decoded_token.get('name'),
            'picture': decoded_token.get('picture')
        }
        
        return f(*args, **kwargs)
    
    return decorated

def get_firebase_user(uid):
    """
    Get Firebase user by UID
    
    Args:
        uid: Firebase user UID
    
    Returns:
        UserRecord or None
    """
    try:
        init_firebase()
        return auth.get_user(uid)
    except Exception as e:
        print(f"Failed to get Firebase user: {e}")
        return None
