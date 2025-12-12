"""
JWT utilities for token generation and verification
"""
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from config import Config

def generate_token(user_id, role='tourist'):
    """
    Generate JWT token for user
    
    Args:
        user_id: User ID (string or ObjectId)
        role: User role ('tourist' or 'local')
    
    Returns:
        str: JWT token
    """
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')
    return token

def decode_token(token):
    """
    Decode and verify JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        dict: Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """
    Decorator to protect routes with JWT authentication
    Usage: @token_required
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Format: "Bearer <token>"
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        # Decode token
        payload = decode_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to kwargs
        kwargs['current_user'] = payload
        
        return f(*args, **kwargs)
    
    return decorated

def local_required(f):
    """
    Decorator to restrict route to verified local guides only
    Usage: @token_required @local_required
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = kwargs.get('current_user')
        
        if not current_user:
            return jsonify({'error': 'Authentication required'}), 401
        
        if current_user.get('role') != 'local':
            return jsonify({'error': 'Local guide access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated

def tourist_required(f):
    """
    Decorator to restrict route to tourists only
    Usage: @token_required @tourist_required
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = kwargs.get('current_user')
        
        if not current_user:
            return jsonify({'error': 'Authentication required'}), 401
        
        if current_user.get('role') != 'tourist':
            return jsonify({'error': 'Tourist access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated
