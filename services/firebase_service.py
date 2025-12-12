"""
Firebase Cloud Messaging service
For push notifications
"""
import firebase_admin
from firebase_admin import credentials, messaging
from config import Config
import os

# Initialize Firebase Admin SDK
_firebase_initialized = False

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    if not os.path.exists(Config.FIREBASE_CREDENTIALS_PATH):
        print(f"Firebase credentials not found at {Config.FIREBASE_CREDENTIALS_PATH}")
        return
    
    try:
        cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        print("Firebase initialized successfully")
    except Exception as e:
        print(f"Firebase initialization error: {e}")

def send_notification(fcm_token, title, body, data=None):
    """
    Send push notification to a device
    
    Args:
        fcm_token: Device FCM token
        title: Notification title
        body: Notification body
        data: Optional data payload
    
    Returns:
        bool: Success status
    """
    initialize_firebase()
    
    if not _firebase_initialized:
        print("Firebase not initialized, skipping notification")
        return False
    
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            token=fcm_token
        )
        
        response = messaging.send(message)
        print(f"Notification sent: {response}")
        return True
        
    except Exception as e:
        print(f"FCM error: {e}")
        return False

def send_notification_to_multiple(fcm_tokens, title, body, data=None):
    """
    Send notification to multiple devices
    
    Args:
        fcm_tokens: List of FCM tokens
        title: Notification title
        body: Notification body
        data: Optional data payload
    
    Returns:
        dict: Success/failure counts
    """
    initialize_firebase()
    
    if not _firebase_initialized or not fcm_tokens:
        return {"success": 0, "failure": 0}
    
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            tokens=fcm_tokens
        )
        
        response = messaging.send_multicast(message)
        
        return {
            "success": response.success_count,
            "failure": response.failure_count
        }
        
    except Exception as e:
        print(f"FCM multicast error: {e}")
        return {"success": 0, "failure": len(fcm_tokens)}

def notify_new_quest(user_fcm_token, quest_title, location):
    """Send notification about new quest"""
    return send_notification(
        fcm_token=user_fcm_token,
        title="New Quest Available!",
        body=f"{quest_title} in {location}",
        data={"type": "new_quest"}
    )

def notify_new_message(user_fcm_token, sender_name):
    """Send notification about new chat message"""
    return send_notification(
        fcm_token=user_fcm_token,
        title=f"Message from {sender_name}",
        body="You have a new message",
        data={"type": "new_message"}
    )

def notify_quest_verified(user_fcm_token, quest_title, verified):
    """Send notification about quest verification result"""
    status = "verified" if verified else "rejected"
    return send_notification(
        fcm_token=user_fcm_token,
        title=f"Quest {status.capitalize()}",
        body=f"Your submission for '{quest_title}' has been {status}",
        data={"type": "quest_verification", "verified": str(verified)}
    )
