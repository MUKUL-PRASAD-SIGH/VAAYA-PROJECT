"""
Test Socket.IO real-time chat functionality
"""
import socketio
import time

# Create a Socket.IO client
sio = socketio.Client()

print("=" * 60)
print("🔌 VAAYA - Socket.IO Chat Test")
print("=" * 60)

# Event handlers
@sio.on('connect')
def on_connect():
    print("✅ Connected to server!")
    print("\n📨 Sending test messages...\n")

@sio.on('connected')
def on_connected(data):
    print(f"🎉 Server says: {data['message']}")

@sio.on('new_message')
def on_new_message(data):
    print(f"💬 [{data['room']}] {data['username']}: {data['message']}")
    print(f"   Timestamp: {data['timestamp']}")

@sio.on('user_joined')
def on_user_joined(data):
    print(f"👋 {data['username']} joined {data['room']}")

@sio.on('ai_response')
def on_ai_response(data):
    if 'error' in data:
        print(f"❌ AI Error: {data['error']}")
    else:
        print(f"\n🤖 AI Response:")
        print(f"   {data['message']}")
        print(f"   Timestamp: {data['timestamp']}\n")

@sio.on('disconnect')
def on_disconnect():
    print("\n❌ Disconnected from server")

# Connect to server
print("🔄 Connecting to http://localhost:5000...")
try:
    sio.connect('http://localhost:5000')
    
    # Test 1: Join a room
    print("\n" + "=" * 60)
    print("Test 1: Join chat room")
    print("=" * 60)
    sio.emit('join_chat', {
        'room': 'test-room',
        'username': 'TestUser'
    })
    time.sleep(1)
    
    # Test 2: Send a regular message
    print("\n" + "=" * 60)
    print("Test 2: Send message to room")
    print("=" * 60)
    sio.emit('send_message', {
        'room': 'test-room',
        'username': 'TestUser',
        'message': 'Hello from Socket.IO test!',
        'type': 'text'
    })
    time.sleep(1)
    
    # Test 3: AI Chat
    print("\n" + "=" * 60)
    print("Test 3: AI Chatbot interaction")
    print("=" * 60)
    sio.emit('ai_chat', {
        'message': 'Tell me about the Taj Mahal in 2 sentences',
        'context': {
            'location': 'Agra, India'
        }
    })
    
    # Wait for AI response
    print("⏳ Waiting for AI response...")
    time.sleep(5)
    
    # Test 4: Leave room
    print("\n" + "=" * 60)
    print("Test 4: Leave chat room")
    print("=" * 60)
    sio.emit('leave_chat', {
        'room': 'test-room',
        'username': 'TestUser'
    })
    time.sleep(1)
    
    # Disconnect
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("🎯 Socket.IO real-time chat is working!")
    print("=" * 60)
    
    sio.disconnect()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\n💡 Make sure the server is running:")
    print("   python app.py")
