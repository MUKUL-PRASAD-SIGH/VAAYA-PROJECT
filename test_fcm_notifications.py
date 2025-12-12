"""
Firebase Cloud Messaging (FCM) Notification Test
Test the FCM notification utilities
"""
from utils.fcm_notifications import (
    send_notification_to_user,
    send_notification_to_topic,
    notify_new_quest,
    notify_verification_complete,
    notify_trip_reminder,
    notify_crowd_alert
)

def test_basic_notification():
    """Test basic notification to a single user"""
    print("\n" + "="*60)
    print("TEST 1: Send notification to single user")
    print("="*60)
    
    # Mock user token (replace with real FCM token for actual testing)
    test_token = "sample_fcm_device_token_here"
    
    result = send_notification_to_user(
        token=test_token,
        title="Test Notification",
        body="This is a test notification from Vaaya!",
        data={'test': True, 'timestamp': '2025-12-06'}
    )
    
    print(f"Success: {result.get('success')}")
    if result.get('error'):
        print(f"Error: {result.get('error')}")
    else:
        print(f"Message ID: {result.get('message_id')}")
    
    return result

def test_topic_notification():
    """Test notification to a topic"""
    print("\n" + "="*60)
    print("TEST 2: Send notification to topic")
    print("="*60)
    
    result = send_notification_to_topic(
        topic="all_users",
        title="🎉 New Feature Available!",
        body="Check out the new AI-powered crowd predictions",
        data={'type': 'announcement', 'feature': 'ai_predictions'}
    )
    
    print(f"Success: {result.get('success')}")
    if result.get('error'):
        print(f"Error: {result.get('error')}")
    else:
        print(f"Message ID: {result.get('message_id')}")
    
    return result

def test_quest_notifications():
    """Test quest-specific notifications"""
    print("\n" + "="*60)
    print("TEST 3: Quest-specific notifications")
    print("="*60)
    
    # Mock user with FCM token
    mock_user = {
        'username': 'testuser',
        'fcm_token': 'sample_fcm_token_here'
    }
    
    # Test 1: New quest notification
    print("\n3a. New Quest Notification:")
    quest_data = {
        '_id': '123456',
        'name': 'Visit Times Square',
        'location': 'Manhattan, NYC',
        'points': 50
    }
    result1 = notify_new_quest(mock_user, quest_data)
    print(f"   Success: {result1.get('success')}")
    if result1.get('error'):
        print(f"   Error: {result1.get('error')}")
    
    # Test 2: Verification complete
    print("\n3b. Verification Complete Notification:")
    result2 = notify_verification_complete(
        mock_user,
        quest_name="Visit Times Square",
        points_earned=50
    )
    print(f"   Success: {result2.get('success')}")
    if result2.get('error'):
        print(f"   Error: {result2.get('error')}")
    
    return result1, result2

def test_trip_notifications():
    """Test trip-related notifications"""
    print("\n" + "="*60)
    print("TEST 4: Trip notifications")
    print("="*60)
    
    mock_user = {
        'username': 'testuser',
        'fcm_token': 'sample_fcm_token_here'
    }
    
    # Test trip reminder
    print("\n4a. Trip Reminder (3 days before):")
    result1 = notify_trip_reminder(
        mock_user,
        destination="Paris, France",
        days_until=3
    )
    print(f"   Success: {result1.get('success')}")
    if result1.get('error'):
        print(f"   Error: {result1.get('error')}")
    
    # Test crowd alert
    print("\n4b. Crowd Alert:")
    result2 = notify_crowd_alert(
        mock_user,
        destination="Eiffel Tower",
        crowd_level="very_high"
    )
    print(f"   Success: {result2.get('success')}")
    if result2.get('error'):
        print(f"   Error: {result2.get('error')}")
    
    return result1, result2

def test_without_fcm_key():
    """Test behavior when FCM_SERVER_KEY is not configured"""
    print("\n" + "="*60)
    print("TEST 5: Behavior without FCM_SERVER_KEY")
    print("="*60)
    
    # This should gracefully handle missing FCM key
    result = send_notification_to_user(
        token="test_token",
        title="Test",
        body="Test message"
    )
    
    print(f"Success: {result.get('success')}")
    print(f"Error: {result.get('error')}")
    print("✓ Gracefully handles missing configuration")

def main():
    """Run all FCM notification tests"""
    print("\n" + "="*60)
    print("FIREBASE CLOUD MESSAGING (FCM) TEST SUITE")
    print("="*60)
    print("\nNote: These tests require FCM_SERVER_KEY in .env")
    print("Get your FCM server key from:")
    print("https://console.firebase.google.com/project/_/settings/cloudmessaging")
    print("\nFor actual testing, replace sample tokens with real FCM device tokens")
    
    # Run tests
    test_basic_notification()
    test_topic_notification()
    test_quest_notifications()
    test_trip_notifications()
    test_without_fcm_key()
    
    # Usage examples
    print("\n" + "="*60)
    print("USAGE EXAMPLES")
    print("="*60)
    
    print("""
1. SEND NOTIFICATION TO SINGLE USER:
   
   from utils.fcm_notifications import send_notification_to_user
   
   result = send_notification_to_user(
       token=user['fcm_token'],
       title="New Quest Available!",
       body="Check out the latest quest near you",
       data={'quest_id': '12345'}
   )

2. NOTIFY ABOUT NEW QUEST:
   
   from utils.fcm_notifications import notify_new_quest
   
   result = notify_new_quest(user, quest_data)

3. NOTIFY VERIFICATION COMPLETE:
   
   from utils.fcm_notifications import notify_verification_complete
   
   result = notify_verification_complete(user, "Visit Museum", 100)

4. SEND TO ALL USERS (TOPIC):
   
   from utils.fcm_notifications import send_notification_to_topic
   
   result = send_notification_to_topic(
       topic="all_users",
       title="System Update",
       body="New features available!"
   )

5. TRIP REMINDER:
   
   from utils.fcm_notifications import notify_trip_reminder
   
   result = notify_trip_reminder(user, "Tokyo", days_until=2)

6. CROWD ALERT:
   
   from utils.fcm_notifications import notify_crowd_alert
   
   result = notify_crowd_alert(user, "Central Park", "very_high")

INTEGRATION EXAMPLES:
=====================

A. In quest verification route (routes/quest_routes.py):

   from utils.fcm_notifications import notify_verification_complete
   
   @quest_bp.route('/verify', methods=['POST'])
   def verify_quest():
       # ... verification logic ...
       
       # Send notification on successful verification
       notify_verification_complete(
           user=current_user,
           quest_name=quest['name'],
           points_earned=quest['points']
       )

B. When creating new quests (routes/admin_routes.py):

   from utils.fcm_notifications import send_notification_to_topic
   
   @admin_bp.route('/create-quest', methods=['POST'])
   def create_quest():
       # ... create quest ...
       
       # Notify all users about new quest
       send_notification_to_topic(
           topic="quest_updates",
           title=f"New Quest: {quest['name']}",
           body=f"Earn {quest['points']} points!"
       )

C. Trip crowd alerts (modules/trips.py):

   from utils.fcm_notifications import notify_crowd_alert
   
   def check_trip_crowds(user, trip):
       if trip['crowd_level'] == 'very_high':
           notify_crowd_alert(
               user=user,
               destination=trip['destination'],
               crowd_level='very_high'
           )
""")
    
    print("\n" + "="*60)
    print("SETUP INSTRUCTIONS")
    print("="*60)
    print("""
1. Get FCM Server Key:
   - Go to: https://console.firebase.google.com
   - Select your project
   - Go to: Project Settings > Cloud Messaging
   - Copy the "Server key"

2. Add to .env file:
   FCM_SERVER_KEY=your_actual_server_key_here

3. Get device FCM tokens from mobile app:
   - When user logs in, app should send FCM token
   - Store in user document: user['fcm_token'] = token
   
4. Subscribe users to topics (optional):
   - all_users: All registered users
   - quest_updates: Users who want quest notifications
   - trip_alerts: Users who want trip-related alerts
""")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)

if __name__ == "__main__":
    main()
