"""
Vaaya - Main Flask Application
Entry point for the AI-powered tourism platform
"""
from flask import Flask, jsonify, render_template, redirect, url_for, request, make_response
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from config import Config
from datetime import datetime
import os

# Initialize Flask app to serve React frontend
app = Flask(__name__, static_folder='frontend/dist', static_url_path='/')
app.config.from_object(Config)
app.config['SECRET_KEY'] = Config.SECRET_KEY
CORS(app)

# Initialize Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Import and register blueprints
from routes.user_routes import user_bp
from routes.trip_routes import trip_bp
from routes.ai_routes import ai_bp
from routes.notification_routes import notification_bp
from routes.quest_routes import quest_bp
from routes.chat_routes import chat_bp
from routes.local_guide_routes import local_guide_bp
from routes.posts_routes import posts_bp

# Register API blueprints first (they are more specific)
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(trip_bp, url_prefix='/api/trips')
app.register_blueprint(ai_bp, url_prefix='/ai')
app.register_blueprint(notification_bp, url_prefix='/api/notifications')
app.register_blueprint(quest_bp, url_prefix='/api/quests')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(local_guide_bp, url_prefix='/api/local-guide')
app.register_blueprint(posts_bp, url_prefix='/api/posts')

# ===========================
# React Frontend Routes
# ===========================

@app.route('/')
def serve_index():
    """Serve the React app"""
    if not os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return """
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>Vaaya API Server Running</h1>
            <p>The backend is running successfully.</p>
            <p>To view the application, please visit the frontend development server:</p>
            <a href="http://localhost:5173" style="font-size: 1.2em; color: #0066cc;">http://localhost:5173</a>
            <br><br>
            <small>Note: This message appears because the frontend static files (frontend/dist/index.html) were not found.</small>
        </div>
        """
    return app.send_static_file('index.html')

@app.errorhandler(404)
def not_found(e):
    """
    Catch-all for client-side routing.
    If it's an API 404, return JSON.
    Otherwise, serve index.html for React router to handle.
    """
    if request.path.startswith('/api/') or request.path.startswith('/ai/'):
        return jsonify({"error": "Not found"}), 404
    return app.send_static_file('index.html')

# ===========================
# API Documentation Route
# ===========================

@app.route('/api')
def index():
    return jsonify({
        "service": "Vayaa API - Discover India",
        "version": "1.0",
        "status": "running",
        "country": "India",
        "endpoints": {
            "trips": {
                "create_trip": "POST /trips/",
                "get_trips": "GET /trips/",
                "get_trip": "GET /trips/<trip_id>",
                "update_status": "PUT /trips/<trip_id>/status",
                "add_activity": "POST /trips/<trip_id>/itinerary",
                "predict_crowd": "POST /trips/predict"
            },
            "ai": {
                "heatmap": "POST /ai/heatmap",
                "verify_quest": "POST /ai/verify-quest",
                "chat": "POST /ai/chat",
                "generate_itinerary": "POST /ai/generate-itinerary",
                "health": "GET /ai/health"
            },
            "users": {
                "get_user": "GET /users/profile/<user_id>",
                "update_profile": "PUT /users/profile",
                "nearby_locals": "GET /users/locals/nearby",
                "update_fcm_token": "POST /users/fcm-token"
            }
        }
    })

# Health check
@app.route('/health')
def health():
    from models import db
    try:
        # Test MongoDB connection
        db.command('ping')
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    return jsonify({
        "status": "healthy",
        "service": "Vayaa API - Discover India 🇮🇳",
        "database": db_status
    })

# ===========================
# Socket.IO Event Handlers
# ===========================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to Vaaya chat server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")

@socketio.on('join_chat')
def handle_join_chat(data):
    """Join a chat room"""
    room = data.get('room', 'general')
    username = data.get('username', 'Anonymous')
    join_room(room)
    print(f"{username} joined room: {room}")
    emit('user_joined', {'username': username, 'room': room}, room=room)

@socketio.on('leave_chat')
def handle_leave_chat(data):
    """Leave a chat room"""
    room = data.get('room', 'general')
    username = data.get('username', 'Anonymous')
    leave_room(room)
    print(f"{username} left room: {room}")
    emit('user_left', {'username': username, 'room': room}, room=room)

@socketio.on('send_message')
def handle_send_message(data):
    """Handle chat message"""
    room = data.get('room', 'general')
    message = data.get('message', '')
    username = data.get('username', 'Anonymous')
    message_type = data.get('type', 'text')  # text, image, location
    
    if not message:
        return
    
    print(f"[{room}] {username}: {message[:50]}...")
    
    # Broadcast message to room
    emit('new_message', {
        'username': username,
        'message': message,
        'type': message_type,
        'timestamp': datetime.now().isoformat(),
        'room': room
    }, room=room)

@socketio.on('ai_chat')
def handle_ai_chat(data):
    """Handle AI chatbot messages"""
    from services.gemini_service import chatbot_response
    from datetime import datetime
    
    user_message = data.get('message', '')
    context = data.get('context', {})
    
    if not user_message:
        emit('ai_response', {'error': 'Empty message'})
        return
    
    print(f"AI Chat: {user_message[:50]}...")
    
    try:
        # Get AI response
        result = chatbot_response(user_message, context)
        
        if result.get('success'):
            emit('ai_response', {
                'message': result['response'],
                'timestamp': datetime.now().isoformat(),
                'metadata': result.get('metadata', {})
            })
        else:
            emit('ai_response', {
                'error': result.get('error', 'AI response failed'),
                'timestamp': datetime.now().isoformat()
            })
    except Exception as e:
        print(f"AI Chat error: {e}")
        emit('ai_response', {
            'error': 'Failed to get AI response',
            'timestamp': datetime.now().isoformat()
        })

@socketio.on('typing')
def handle_typing(data):
    """Handle typing indicator"""
    room = data.get('room', 'general')
    username = data.get('username', 'Anonymous')
    is_typing = data.get('is_typing', False)
    
    emit('user_typing', {
        'username': username,
        'is_typing': is_typing
    }, room=room, skip_sid=request.sid)

if __name__ == '__main__':
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    print("=" * 60)
    print("Vaaya API Server Starting - Discover India!")
    print(f"MongoDB: {Config.MONGO_URI[:50]}...")
    print(f"JWT Expiration: {Config.JWT_EXPIRATION_HOURS} hours")
    print(f"Socket.IO: Enabled for real-time chat")
    print("=" * 60)
    
    # Try Socket.IO first, fall back to Flask if it fails
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True, use_reloader=False)
    except Exception as e:
        print(f"⚠️ Socket.IO failed: {e}")
        print("🔄 Falling back to standard Flask server...")
        app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
