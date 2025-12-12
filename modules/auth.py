"""
Authentication module
User registration, login, and JWT token management
"""
from models.user import create_user, find_user_by_email, verify_password, update_user
from utils.jwt_utils import generate_token
from bson.objectid import ObjectId

def register_user(email, password, role='tourist', phone=None, name=None):
    """
    Register a new user
    
    Args:
        email: User email
        password: User password (will be hashed)
        role: User role (tourist/local)
        phone: Phone number (required for locals)
        name: User name
    
    Returns:
        dict: User data or error
    """
    # Check if user already exists
    existing_user = find_user_by_email(email)
    if existing_user:
        return {'error': 'Email already registered'}, 400
    
    # Validate local requirements
    if role == 'local' and not phone:
        return {'error': 'Phone number required for local guides'}, 400
    
    # Create user
    try:
        user = create_user(email, password, role, phone, name)
        
        # Generate token (locals need to verify phone first)
        token = generate_token(user['_id'], role)
        
        return {
            'message': 'User registered successfully',
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'role': user['role'],
                'verified': user.get('verified', False),
                'name': user.get('name')
            },
            'token': token,
            'requires_verification': role == 'local'
        }, 201
        
    except Exception as e:
        return {'error': f'Registration failed: {str(e)}'}, 500

def login_user(email, password):
    """
    Login user and generate JWT token
    
    Args:
        email: User email
        password: User password
    
    Returns:
        dict: Token and user data or error
    """
    # Find user
    user = find_user_by_email(email)
    
    if not user:
        return {'error': 'Invalid email or password'}, 401
    
    # Verify password
    if not verify_password(user, password):
        return {'error': 'Invalid email or password'}, 401
    
    # Generate token
    token = generate_token(user['_id'], user['role'])
    
    return {
        'message': 'Login successful',
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'verified': user.get('verified', False),
            'name': user.get('name')
        },
        'token': token
    }, 200

def update_user_profile(user_id, updates):
    """
    Update user profile information
    
    Args:
        user_id: User ID
        updates: Dict of fields to update
    
    Returns:
        dict: Updated user data
    """
    # Remove sensitive fields that shouldn't be updated this way
    protected_fields = ['password_hash', '_id', 'role', 'verified']
    for field in protected_fields:
        if field in updates:
            del updates[field]
    
    try:
        result = update_user(user_id, updates)
        
        if result.modified_count > 0:
            return {'message': 'Profile updated successfully'}, 200
        else:
            return {'message': 'No changes made'}, 200
            
    except Exception as e:
        return {'error': f'Update failed: {str(e)}'}, 500

def verify_local_account(user_id):
    """
    Mark local guide account as verified
    
    Args:
        user_id: User ID
    
    Returns:
        dict: Success message
    """
    try:
        update_user(user_id, {'verified': True})
        return {'message': 'Account verified successfully'}, 200
        
    except Exception as e:
        return {'error': f'Verification failed: {str(e)}'}, 500
