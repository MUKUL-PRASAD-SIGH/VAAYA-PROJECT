"""
Authentication routes
User registration, login, and OTP verification endpoints
"""
from flask import Blueprint, request, jsonify
from modules.auth import register_user, login_user, update_user_profile
from modules.otp import request_verification, verify_phone, check_verification_status
from utils.jwt_utils import token_required
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    POST /auth/register
    Body: {
        "email": "user@example.com",
        "password": "password123",
        "role": "tourist",  // or "local"
        "name": "John Doe",
        "phone": "+1234567890"  // required for locals
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        role = data.get('role', 'tourist')
        
        # Register user
        result, status = register_user(
            email=data['email'],
            password=data['password'],
            role=role,
            phone=data.get('phone'),
            name=data.get('name')
        )
        
        return jsonify(result), status
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user
    
    POST /auth/login
    Body: {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Login user
        result, status = login_user(data['email'], data['password'])
        
        return jsonify(result), status
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/verify/request', methods=['POST'])
@token_required
def request_otp(current_user):
    """
    Request OTP for phone verification (local guides only)
    
    POST /auth/verify/request
    Body: {
        "phone": "+1234567890"
    }
    """
    try:
        # Check if user is a local
        if current_user.get('role') != 'local':
            return jsonify({'error': 'Verification only available for local guides'}), 403
        
        data = request.get_json()
        
        if not data.get('phone'):
            return jsonify({'error': 'Phone number is required'}), 400
        
        # Request OTP
        result, status = request_verification(
            ObjectId(current_user['_id']),
            data['phone']
        )
        
        return jsonify(result), status
        
    except Exception as e:
        return jsonify({'error': f'OTP request failed: {str(e)}'}), 500

@auth_bp.route('/verify/confirm', methods=['POST'])
@token_required
def confirm_otp(current_user):
    """
    Verify OTP code
    
    POST /auth/verify/confirm
    Body: {
        "phone": "+1234567890",
        "otp": "123456"
    }
    """
    try:
        # Check if user is a local
        if current_user.get('role') != 'local':
            return jsonify({'error': 'Verification only available for local guides'}), 403
        
        data = request.get_json()
        
        if not data.get('phone') or not data.get('otp'):
            return jsonify({'error': 'Phone number and OTP are required'}), 400
        
        # Verify OTP
        result, status = verify_phone(
            ObjectId(current_user['_id']),
            data['phone'],
            data['otp']
        )
        
        return jsonify(result), status
        
    except Exception as e:
        return jsonify({'error': f'OTP verification failed: {str(e)}'}), 500

@auth_bp.route('/verify/status', methods=['GET'])
@token_required
def verification_status(current_user):
    """
    Check verification status
    
    GET /auth/verify/status?phone=+1234567890
    """
    try:
        phone = request.args.get('phone')
        
        if not phone:
            return jsonify({'error': 'Phone number is required'}), 400
        
        result, status = check_verification_status(
            ObjectId(current_user['_id']),
            phone
        )
        
        return jsonify(result), status
        
    except Exception as e:
        return jsonify({'error': f'Status check failed: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """
    Get current user profile
    
    GET /auth/profile
    """
    try:
        # Remove sensitive data
        if 'password_hash' in current_user:
            del current_user['password_hash']
        
        return jsonify({'user': current_user}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch profile: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """
    Update user profile
    
    PUT /auth/profile
    Body: {
        "name": "New Name",
        "bio": "My bio",
        "location": {"type": "Point", "coordinates": [lng, lat]}
    }
    """
    try:
        data = request.get_json()
        
        result, status = update_user_profile(current_user['_id'], data)
        
        return jsonify(result), status
        
    except Exception as e:
        return jsonify({'error': f'Update failed: {str(e)}'}), 500

@auth_bp.route('/google', methods=['GET'])
def google_auth():
    """
    Redirect to Google OAuth
    For now, returns info message
    """
    return jsonify({
        'message': 'Google OAuth not configured yet',
        'info': 'Please use email/password registration',
        'redirect': '/register'
    }), 501

@auth_bp.route('/github', methods=['GET'])
def github_auth():
    """
    Redirect to GitHub OAuth
    For now, returns info message
    """
    return jsonify({
        'message': 'GitHub OAuth not configured yet',
        'info': 'Please use email/password registration',
        'redirect': '/register'
    }), 501
