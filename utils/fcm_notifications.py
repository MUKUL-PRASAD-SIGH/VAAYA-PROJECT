"""
Firebase Cloud Messaging (FCM) Push Notifications
Send push notifications to users via Firebase Cloud Messaging
"""
import requests
import json
from config import Config

# FCM API endpoint
FCM_URL = "https://fcm.googleapis.com/fcm/send"

def send_notification_to_user(token, title, body, data=None):
    """
    Send push notification to a specific user device
    
    Args:
        token (str): FCM device token
        title (str): Notification title
        body (str): Notification body text
        data (dict): Optional additional data payload
    
    Returns:
        dict: Response from FCM API or error info
    
    Example:
        send_notification_to_user(
            token="device_fcm_token_here",
            title="New Quest Available!",
            body="Check out the latest quest near you",
            data={'quest_id': '12345', 'type': 'new_quest'}
        )
    """
    if not Config.FCM_SERVER_KEY:
        return {'success': False, 'error': 'FCM_SERVER_KEY not configured'}
    
    if not token:
        return {'success': False, 'error': 'No device token provided'}
    
    headers = {
        'Authorization': f'Key={Config.FCM_SERVER_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'to': token,
        'notification': {
            'title': title,
            'body': body,
            'sound': 'default',
            'badge': '1'
        },
        'priority': 'high'
    }
    
    # Add custom data if provided
    if data:
        payload['data'] = data
    
    try:
        response = requests.post(FCM_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        return {
            'success': result.get('success', 0) > 0,
            'message_id': result.get('results', [{}])[0].get('message_id'),
            'response': result
        }
    
    except requests.exceptions.RequestException as e:
        print(f"FCM notification error: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def send_notification_to_topic(topic, title, body, data=None):
    """
    Send push notification to all users subscribed to a topic
    
    Args:
        topic (str): FCM topic name (e.g., 'all_users', 'quest_updates')
        title (str): Notification title
        body (str): Notification body text
        data (dict): Optional additional data payload
    
    Returns:
        dict: Response from FCM API or error info
    
    Example:
        send_notification_to_topic(
            topic="quest_updates",
            title="New Quest Available!",
            body="Explore the city with our latest quest"
        )
    """
    if not Config.FCM_SERVER_KEY:
        return {'success': False, 'error': 'FCM_SERVER_KEY not configured'}
    
    headers = {
        'Authorization': f'Key={Config.FCM_SERVER_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'to': f'/topics/{topic}',
        'notification': {
            'title': title,
            'body': body,
            'sound': 'default',
            'badge': '1'
        },
        'priority': 'high'
    }
    
    # Add custom data if provided
    if data:
        payload['data'] = data
    
    try:
        response = requests.post(FCM_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        return {
            'success': result.get('success', 0) > 0 or result.get('message_id') is not None,
            'message_id': result.get('message_id'),
            'response': result
        }
    
    except requests.exceptions.RequestException as e:
        print(f"FCM topic notification error: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def send_notification_to_multiple(tokens, title, body, data=None):
    """
    Send push notification to multiple users at once
    
    Args:
        tokens (list): List of FCM device tokens
        title (str): Notification title
        body (str): Notification body text
        data (dict): Optional additional data payload
    
    Returns:
        dict: Response from FCM API or error info
    """
    if not Config.FCM_SERVER_KEY:
        return {'success': False, 'error': 'FCM_SERVER_KEY not configured'}
    
    if not tokens or len(tokens) == 0:
        return {'success': False, 'error': 'No device tokens provided'}
    
    # FCM supports max 1000 tokens per request
    if len(tokens) > 1000:
        tokens = tokens[:1000]
    
    headers = {
        'Authorization': f'Key={Config.FCM_SERVER_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'registration_ids': tokens,
        'notification': {
            'title': title,
            'body': body,
            'sound': 'default',
            'badge': '1'
        },
        'priority': 'high'
    }
    
    # Add custom data if provided
    if data:
        payload['data'] = data
    
    try:
        response = requests.post(FCM_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        return {
            'success': result.get('success', 0) > 0,
            'success_count': result.get('success', 0),
            'failure_count': result.get('failure', 0),
            'response': result
        }
    
    except requests.exceptions.RequestException as e:
        print(f"FCM multiple notification error: {e}")
        return {
            'success': False,
            'error': str(e)
        }

# ============================================================================
# High-Level Notification Functions for Common Use Cases
# ============================================================================

def notify_new_quest(user, quest_data):
    """
    Notify user about a new quest available near them
    
    Args:
        user (dict): User document with 'fcm_token' field
        quest_data (dict): Quest details (name, location, points)
    
    Returns:
        dict: Notification result
    """
    if not user.get('fcm_token'):
        return {'success': False, 'error': 'User has no FCM token registered'}
    
    quest_name = quest_data.get('name', 'New Quest')
    location = quest_data.get('location', 'your area')
    points = quest_data.get('points', 0)
    
    return send_notification_to_user(
        token=user['fcm_token'],
        title=f"🎯 New Quest: {quest_name}",
        body=f"Earn {points} points! Quest available in {location}",
        data={
            'type': 'new_quest',
            'quest_id': str(quest_data.get('_id', '')),
            'quest_name': quest_name,
            'points': points
        }
    )

def notify_verification_complete(user, quest_name, points_earned):
    """
    Notify user that their quest verification is complete
    
    Args:
        user (dict): User document with 'fcm_token' field
        quest_name (str): Name of the quest
        points_earned (int): Points earned from quest
    
    Returns:
        dict: Notification result
    """
    if not user.get('fcm_token'):
        return {'success': False, 'error': 'User has no FCM token registered'}
    
    return send_notification_to_user(
        token=user['fcm_token'],
        title="✅ Quest Verified!",
        body=f"You earned {points_earned} points for completing '{quest_name}'",
        data={
            'type': 'verification_complete',
            'quest_name': quest_name,
            'points': points_earned
        }
    )

def notify_quest_reminder(user, quest_name, days_remaining):
    """
    Remind user about an ongoing quest
    
    Args:
        user (dict): User document with 'fcm_token' field
        quest_name (str): Name of the quest
        days_remaining (int): Days until quest expires
    
    Returns:
        dict: Notification result
    """
    if not user.get('fcm_token'):
        return {'success': False, 'error': 'User has no FCM token registered'}
    
    if days_remaining <= 1:
        body = f"⏰ Last chance! '{quest_name}' expires in {days_remaining} day"
    else:
        body = f"⏰ '{quest_name}' expires in {days_remaining} days. Complete it now!"
    
    return send_notification_to_user(
        token=user['fcm_token'],
        title="Quest Reminder",
        body=body,
        data={
            'type': 'quest_reminder',
            'quest_name': quest_name,
            'days_remaining': days_remaining
        }
    )

def notify_verification_failed(user, quest_name, reason):
    """
    Notify user that their quest verification failed
    
    Args:
        user (dict): User document with 'fcm_token' field
        quest_name (str): Name of the quest
        reason (str): Reason for verification failure
    
    Returns:
        dict: Notification result
    """
    if not user.get('fcm_token'):
        return {'success': False, 'error': 'User has no FCM token registered'}
    
    return send_notification_to_user(
        token=user['fcm_token'],
        title="❌ Verification Failed",
        body=f"'{quest_name}' could not be verified. {reason}",
        data={
            'type': 'verification_failed',
            'quest_name': quest_name,
            'reason': reason
        }
    )

def notify_leaderboard_update(user, new_rank, total_users):
    """
    Notify user about leaderboard rank change
    
    Args:
        user (dict): User document with 'fcm_token' field
        new_rank (int): User's new rank
        total_users (int): Total users on leaderboard
    
    Returns:
        dict: Notification result
    """
    if not user.get('fcm_token'):
        return {'success': False, 'error': 'User has no FCM token registered'}
    
    if new_rank <= 3:
        emoji = "🏆"
        message = f"Amazing! You're now #{new_rank} on the leaderboard!"
    elif new_rank <= 10:
        emoji = "⭐"
        message = f"Great job! You climbed to #{new_rank}!"
    else:
        emoji = "📈"
        message = f"You're now #{new_rank} out of {total_users} users!"
    
    return send_notification_to_user(
        token=user['fcm_token'],
        title=f"{emoji} Leaderboard Update",
        body=message,
        data={
            'type': 'leaderboard_update',
            'rank': new_rank,
            'total_users': total_users
        }
    )

def notify_friend_request(user, from_username):
    """
    Notify user about a new friend request
    
    Args:
        user (dict): User document with 'fcm_token' field
        from_username (str): Username who sent the request
    
    Returns:
        dict: Notification result
    """
    if not user.get('fcm_token'):
        return {'success': False, 'error': 'User has no FCM token registered'}
    
    return send_notification_to_user(
        token=user['fcm_token'],
        title="👥 New Friend Request",
        body=f"{from_username} wants to be your friend!",
        data={
            'type': 'friend_request',
            'from_username': from_username
        }
    )

def notify_trip_reminder(user, destination, days_until):
    """
    Remind user about an upcoming trip
    
    Args:
        user (dict): User document with 'fcm_token' field
        destination (str): Trip destination
        days_until (int): Days until trip starts
    
    Returns:
        dict: Notification result
    """
    if not user.get('fcm_token'):
        return {'success': False, 'error': 'User has no FCM token registered'}
    
    if days_until == 0:
        body = f"🎉 Your trip to {destination} is today! Safe travels!"
    elif days_until == 1:
        body = f"🧳 Your trip to {destination} is tomorrow! Ready to explore?"
    else:
        body = f"📅 {days_until} days until your trip to {destination}!"
    
    return send_notification_to_user(
        token=user['fcm_token'],
        title="Trip Reminder",
        body=body,
        data={
            'type': 'trip_reminder',
            'destination': destination,
            'days_until': days_until
        }
    )

def notify_crowd_alert(user, destination, crowd_level):
    """
    Alert user about crowd levels at their destination
    
    Args:
        user (dict): User document with 'fcm_token' field
        destination (str): Location name
        crowd_level (str): Crowd level (low, medium, high, very_high)
    
    Returns:
        dict: Notification result
    """
    if not user.get('fcm_token'):
        return {'success': False, 'error': 'User has no FCM token registered'}
    
    crowd_messages = {
        'very_high': f"🚨 {destination} is extremely crowded today! Consider visiting later.",
        'high': f"⚠️ {destination} is quite busy right now.",
        'medium': f"👥 {destination} has moderate crowds today.",
        'low': f"✅ {destination} is relatively quiet now - great time to visit!",
        'very_low': f"🎯 {destination} is very quiet now - perfect for exploring!"
    }
    
    body = crowd_messages.get(crowd_level, f"Current crowd level at {destination}: {crowd_level}")
    
    return send_notification_to_user(
        token=user['fcm_token'],
        title="Crowd Alert",
        body=body,
        data={
            'type': 'crowd_alert',
            'destination': destination,
            'crowd_level': crowd_level
        }
    )

# ============================================================================
# Topic Broadcasts
# ============================================================================

def broadcast_system_announcement(title, message):
    """
    Broadcast announcement to all users
    
    Args:
        title (str): Announcement title
        message (str): Announcement message
    
    Returns:
        dict: Notification result
    """
    return send_notification_to_topic(
        topic='all_users',
        title=title,
        body=message,
        data={
            'type': 'system_announcement'
        }
    )

def broadcast_new_feature(feature_name, description):
    """
    Announce new features to all users
    
    Args:
        feature_name (str): Name of the new feature
        description (str): Brief description
    
    Returns:
        dict: Notification result
    """
    return send_notification_to_topic(
        topic='all_users',
        title=f"🎉 New Feature: {feature_name}",
        body=description,
        data={
            'type': 'new_feature',
            'feature_name': feature_name
        }
    )

def subscribe_to_topic(token, topic):
    """
    Subscribe a device to a topic
    
    Args:
        token (str): FCM device token
        topic (str): Topic name to subscribe to
    
    Returns:
        bool: True if successful, False otherwise
    """
    if not Config.FCM_SERVER_KEY:
        print("FCM_SERVER_KEY not configured")
        return False
    
    url = "https://iid.googleapis.com/iid/v1/{}/rel/topics/{}".format(token, topic)
    
    headers = {
        'Authorization': f'Key={Config.FCM_SERVER_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, headers=headers)
        
        if response.status_code == 200:
            print(f"Successfully subscribed to topic: {topic}")
            return True
        else:
            print(f"Failed to subscribe to topic: {response.text}")
            return False
    except Exception as e:
        print(f"Error subscribing to topic: {e}")
        return False

def unsubscribe_from_topic(token, topic):
    """
    Unsubscribe a device from a topic
    
    Args:
        token (str): FCM device token
        topic (str): Topic name to unsubscribe from
    
    Returns:
        bool: True if successful, False otherwise
    """
    if not Config.FCM_SERVER_KEY:
        print("FCM_SERVER_KEY not configured")
        return False
    
    url = "https://iid.googleapis.com/iid/v1:batchRemove"
    
    headers = {
        'Authorization': f'Key={Config.FCM_SERVER_KEY}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'to': f'/topics/{topic}',
        'registration_tokens': [token]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            print(f"Successfully unsubscribed from topic: {topic}")
            return True
        else:
            print(f"Failed to unsubscribe from topic: {response.text}")
            return False
    except Exception as e:
        print(f"Error unsubscribing from topic: {e}")
        return False
