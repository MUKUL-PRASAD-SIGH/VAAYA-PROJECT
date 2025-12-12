"""
OTP verification module
Phone verification for local guides
"""
from models.local_verification import (
    create_verification_request,
    get_active_verification,
    verify_otp,
    is_phone_verified
)
from services.sms_service import send_otp, validate_phone_number, format_phone_number
from modules.auth import verify_local_account
from bson.objectid import ObjectId

def request_verification(user_id, phone):
    """
    Request OTP for phone verification
    
    Args:
        user_id: User ID requesting verification
        phone: Phone number to verify
    
    Returns:
        dict: Response with status
    """
    # Validate phone number format
    if not validate_phone_number(phone):
        formatted_phone = format_phone_number(phone)
        if not validate_phone_number(formatted_phone):
            return {'error': 'Invalid phone number format. Use E.164 format: +[country][number]'}, 400
        phone = formatted_phone
    
    # Check if already verified
    if is_phone_verified(user_id, phone):
        return {'error': 'Phone number already verified'}, 400
    
    # Check for active verification
    existing = get_active_verification(user_id, phone)
    if existing:
        return {
            'message': 'OTP already sent. Please check your phone.',
            'expires_at': existing['expires_at'].isoformat()
        }, 200
    
    # Create verification request
    try:
        verification = create_verification_request(user_id, phone)
        
        # Send OTP via SMS
        success = send_otp(phone, verification['otp'])
        
        if not success:
            return {'error': 'Failed to send OTP. Please try again.'}, 500
        
        return {
            'message': 'OTP sent successfully',
            'phone': phone,
            'expires_at': verification['expires_at'].isoformat()
        }, 200
        
    except Exception as e:
        return {'error': f'Verification request failed: {str(e)}'}, 500

def verify_phone(user_id, phone, otp_code):
    """
    Verify OTP code
    
    Args:
        user_id: User ID
        phone: Phone number
        otp_code: OTP code from SMS
    
    Returns:
        dict: Verification result
    """
    # Validate phone format
    if not validate_phone_number(phone):
        formatted_phone = format_phone_number(phone)
        if not validate_phone_number(formatted_phone):
            return {'error': 'Invalid phone number format'}, 400
        phone = formatted_phone
    
    try:
        success, message = verify_otp(user_id, phone, otp_code)
        
        if success:
            # Mark user account as verified
            verify_local_account(user_id)
            
            return {
                'message': message,
                'verified': True
            }, 200
        else:
            return {
                'error': message,
                'verified': False
            }, 400
            
    except Exception as e:
        return {'error': f'Verification failed: {str(e)}'}, 500

def check_verification_status(user_id, phone):
    """
    Check if phone is verified for user
    
    Args:
        user_id: User ID
        phone: Phone number
    
    Returns:
        dict: Verification status
    """
    verified = is_phone_verified(user_id, phone)
    
    return {
        'verified': verified,
        'phone': phone
    }, 200
