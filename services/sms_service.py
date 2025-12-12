"""
SMS/OTP service using Twilio
For local guide phone verification
"""
from twilio.rest import Client
from config import Config
import os

def send_otp(phone_number, otp_code):
    """
    Send OTP code via SMS
    
    Args:
        phone_number: Recipient phone number (E.164 format)
        otp_code: 6-digit OTP code
    
    Returns:
        bool: Success status
    """
    twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
    twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
    twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')
    
    if not all([twilio_sid, twilio_token, twilio_phone]):
        print("Twilio not configured")
        # For development, just print the OTP
        print(f"[DEV] OTP for {phone_number}: {otp_code}")
        return True
    
    try:
        client = Client(twilio_sid, twilio_token)
        
        message = client.messages.create(
            body=f"Your Vaaya verification code is: {otp_code}\n\nValid for 10 minutes.",
            from_=twilio_phone,
            to=phone_number
        )
        
        print(f"OTP sent to {phone_number}: {message.sid}")
        return True
        
    except Exception as e:
        print(f"Twilio error: {e}")
        return False

def validate_phone_number(phone_number):
    """
    Validate phone number format
    Should be in E.164 format: +[country code][number]
    
    Args:
        phone_number: Phone number to validate
    
    Returns:
        bool: Whether number is valid
    """
    import re
    
    # E.164 format: +[1-15 digits]
    pattern = r'^\+[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone_number))

def format_phone_number(phone_number, country_code='1'):
    """
    Format phone number to E.164 format
    
    Args:
        phone_number: Phone number (can be various formats)
        country_code: Default country code if not provided
    
    Returns:
        str: Formatted phone number
    """
    import re
    
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone_number)
    
    # Add country code if not present
    if not phone_number.startswith('+'):
        digits = country_code + digits
    
    return '+' + digits
