"""
Input validation utilities
"""
import re
from bson.objectid import ObjectId

def validate_email(email):
    """
    Validate email format
    
    Args:
        email: Email string
    
    Returns:
        bool: True if valid
    """
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone):
    """
    Validate phone number (E.164 format)
    
    Args:
        phone: Phone number string
    
    Returns:
        bool: True if valid
    """
    if not phone:
        return False
    
    # E.164 format: +[1-15 digits]
    pattern = r'^\+[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone))

def validate_password(password):
    """
    Validate password strength
    Minimum 8 characters, at least one letter and one number
    
    Args:
        password: Password string
    
    Returns:
        tuple: (bool, str) - (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, ""

def validate_objectid(id_string):
    """
    Validate MongoDB ObjectId
    
    Args:
        id_string: String to validate
    
    Returns:
        bool: True if valid ObjectId
    """
    if not id_string:
        return False
    
    try:
        ObjectId(id_string)
        return True
    except:
        return False

def validate_coordinates(latitude, longitude):
    """
    Validate geographic coordinates
    
    Args:
        latitude: Latitude value
        longitude: Longitude value
    
    Returns:
        bool: True if valid
    """
    try:
        lat = float(latitude)
        lng = float(longitude)
        
        if -90 <= lat <= 90 and -180 <= lng <= 180:
            return True
    except (TypeError, ValueError):
        pass
    
    return False

def sanitize_string(text, max_length=None):
    """
    Sanitize user input string
    
    Args:
        text: Input string
        max_length: Maximum allowed length
    
    Returns:
        str: Sanitized string
    """
    if not text:
        return ""
    
    # Remove leading/trailing whitespace
    sanitized = str(text).strip()
    
    # Limit length if specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

def validate_otp(otp):
    """
    Validate OTP format (6 digits)
    
    Args:
        otp: OTP string
    
    Returns:
        bool: True if valid
    """
    if not otp:
        return False
    
    return bool(re.match(r'^\d{6}$', str(otp)))
