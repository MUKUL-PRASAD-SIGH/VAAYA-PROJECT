"""
Local verification model - OTP verification for local guides
"""
from models import db
from datetime import datetime, timedelta
import random

verifications_collection = db.otp_verifications

def create_verification_request(user_id, phone):
    """Create OTP verification request"""
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    verification = {
        'user_id': user_id,
        'phone': phone,
        'otp': otp,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(minutes=10),
        'verified': False,
        'attempts': 0,
        'max_attempts': 3
    }
    
    result = verifications_collection.insert_one(verification)
    verification['_id'] = result.inserted_id
    return verification

def get_active_verification(user_id, phone):
    """Get active (non-expired, non-verified) verification request"""
    from bson.objectid import ObjectId
    return verifications_collection.find_one({
        'user_id': ObjectId(user_id),
        'phone': phone,
        'verified': False,
        'expires_at': {'$gt': datetime.utcnow()},
        'attempts': {'$lt': 3}
    })

def verify_otp(user_id, phone, otp):
    """Verify OTP code"""
    from bson.objectid import ObjectId
    
    verification = get_active_verification(user_id, phone)
    
    if not verification:
        return False, "No active verification found or OTP expired"
    
    # Increment attempts
    verifications_collection.update_one(
        {'_id': verification['_id']},
        {'$inc': {'attempts': 1}}
    )
    
    if verification['otp'] != otp:
        return False, "Invalid OTP"
    
    # Mark as verified
    verifications_collection.update_one(
        {'_id': verification['_id']},
        {'$set': {'verified': True, 'verified_at': datetime.utcnow()}}
    )
    
    return True, "Phone verified successfully"

def is_phone_verified(user_id, phone):
    """Check if phone is already verified for user"""
    from bson.objectid import ObjectId
    verified = verifications_collection.find_one({
        'user_id': ObjectId(user_id),
        'phone': phone,
        'verified': True
    })
    return verified is not None
