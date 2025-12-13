"""
Posts API Routes for geo-fenced posts/reels
Handles creating, reading, and interacting with location-based posts
"""
from flask import Blueprint, request, jsonify, Response
from functools import wraps
import jwt
from config import Config
from models.post import (
    create_post, get_nearby_posts, get_post_by_id, get_user_posts,
    like_post, record_view, delete_post, get_media_file,
    add_comment, get_comments, delete_comment, like_comment,
    get_trending_posts, search_by_hashtag, get_trending_hashtags,
    get_nearby_stories, increment_shares
)
from models.user import find_user_by_firebase_uid

posts_bp = Blueprint('posts', __name__)


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            current_user_id = data.get('firebase_uid') or data.get('user_id')
            if not current_user_id:
                return jsonify({'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated


@posts_bp.route('', methods=['POST'])
@token_required
def create_new_post(current_user_id):
    """
    Create a new geo-fenced post
    
    Accepts multipart/form-data with:
    - post_type: 'post', 'story', 'tip', 'event'
    - caption: Text content
    - latitude: Location latitude
    - longitude: Location longitude
    - location_name: Human-readable location
    - visibility_radius_km: Optional, default 10km
    - media: File(s) to upload
    """
    try:
        # Get form data
        post_type = request.form.get('post_type', 'post')
        caption = request.form.get('caption', '')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        location_name = request.form.get('location_name', 'Unknown Location')
        visibility_radius_km = float(request.form.get('visibility_radius_km', 10))
        
        # Validate required fields
        if not latitude or not longitude:
            return jsonify({'error': 'Location coordinates are required'}), 400
        
        try:
            lat = float(latitude)
            lng = float(longitude)
        except ValueError:
            return jsonify({'error': 'Invalid coordinates'}), 400
        
        # Validate coordinates
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            return jsonify({'error': 'Coordinates out of range'}), 400
        
        # Process uploaded files
        media_files = []
        files = request.files.getlist('media')
        
        for file in files:
            if file and file.filename:
                # Read file data
                file_data = file.read()
                
                # Validate file type
                allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
                               'video/mp4', 'video/webm', 'video/quicktime']
                
                if file.content_type not in allowed_types:
                    return jsonify({'error': f'File type {file.content_type} not allowed'}), 400
                
                # Check file size (max 50MB for videos, 10MB for images)
                max_size = 50 * 1024 * 1024 if 'video' in file.content_type else 10 * 1024 * 1024
                if len(file_data) > max_size:
                    return jsonify({'error': 'File too large'}), 400
                
                media_files.append({
                    'filename': file.filename,
                    'content_type': file.content_type,
                    'data': file_data
                })
        
        # Validate visibility radius
        if visibility_radius_km < 1 or visibility_radius_km > 50:
            visibility_radius_km = 10  # Default to 10km if out of range
        
        # Create the post
        post = create_post(
            user_id=current_user_id,
            post_type=post_type,
            caption=caption,
            location_coords=[lng, lat],  # GeoJSON uses [longitude, latitude]
            location_name=location_name,
            media_files=media_files,
            visibility_radius_km=visibility_radius_km
        )
        
        # Get user info for response
        user = find_user_by_firebase_uid(current_user_id)
        user_info = {
            'name': user.get('name', 'Anonymous') if user else 'Anonymous',
            'profile_image': user.get('profile_image') if user else None
        }
        
        return jsonify({
            'success': True,
            'message': 'Post created successfully',
            'post': {
                '_id': str(post['_id']),
                'post_type': post['post_type'],
                'caption': post['caption'],
                'location_name': post['location_name'],
                'media': post['media'],
                'created_at': post['created_at'].isoformat(),
                'user': user_info
            }
        }), 201
        
    except Exception as e:
        print(f"Error creating post: {e}")
        return jsonify({'error': 'Failed to create post'}), 500


@posts_bp.route('/nearby', methods=['GET'])
@token_required
def get_posts_nearby(current_user_id):
    """
    Get posts within user's geographic radius
    
    Query params:
    - lat: User's latitude (required)
    - lng: User's longitude (required)
    - radius: Search radius in km (optional, default 10)
    - limit: Max posts to return (optional, default 50)
    - skip: Pagination offset (optional, default 0)
    - type: Filter by post type (optional)
    """
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 10, type=float)
        limit = request.args.get('limit', 50, type=int)
        skip = request.args.get('skip', 0, type=int)
        post_type = request.args.get('type')
        
        if lat is None or lng is None:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        # Get nearby posts
        posts = get_nearby_posts(
            longitude=lng,
            latitude=lat,
            radius_km=radius,
            limit=min(limit, 100),  # Cap at 100
            skip=skip,
            post_type=post_type
        )
        
        # Enrich posts with user info
        for post in posts:
            user = find_user_by_firebase_uid(post.get('user_id'))
            post['user'] = {
                'user_id': post.get('user_id'),
                'name': user.get('name', 'Anonymous') if user else 'Anonymous',
                'profile_image': user.get('profile_image') if user else None
            }
            # Check if current user liked this post
            post['is_liked'] = current_user_id in post.get('likes', [])
            # Remove likes array (just send count)
            post.pop('likes', None)
            # Format dates
            if post.get('created_at'):
                post['created_at'] = post['created_at'].isoformat()
            if post.get('expires_at'):
                post['expires_at'] = post['expires_at'].isoformat()
        
        return jsonify({
            'success': True,
            'posts': posts,
            'count': len(posts)
        })
        
    except Exception as e:
        print(f"Error getting nearby posts: {e}")
        return jsonify({'error': 'Failed to get posts'}), 500


@posts_bp.route('/my', methods=['GET'])
@token_required
def get_my_posts(current_user_id):
    """Get current user's posts"""
    try:
        limit = request.args.get('limit', 50, type=int)
        skip = request.args.get('skip', 0, type=int)
        
        posts = get_user_posts(current_user_id, limit=limit, skip=skip)
        
        # Format dates
        for post in posts:
            if post.get('created_at'):
                post['created_at'] = post['created_at'].isoformat()
            if post.get('expires_at'):
                post['expires_at'] = post['expires_at'].isoformat()
        
        return jsonify({
            'success': True,
            'posts': posts,
            'count': len(posts)
        })
        
    except Exception as e:
        print(f"Error getting user posts: {e}")
        return jsonify({'error': 'Failed to get posts'}), 500


@posts_bp.route('/<post_id>', methods=['GET'])
@token_required
def get_single_post(current_user_id, post_id):
    """Get a single post by ID"""
    try:
        post = get_post_by_id(post_id)
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Enrich with user info
        user = find_user_by_firebase_uid(post.get('user_id'))
        post['user'] = {
            'user_id': post.get('user_id'),
            'name': user.get('name', 'Anonymous') if user else 'Anonymous',
            'profile_image': user.get('profile_image') if user else None
        }
        post['is_liked'] = current_user_id in post.get('likes', [])
        post.pop('likes', None)
        
        # Format dates
        if post.get('created_at'):
            post['created_at'] = post['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'post': post
        })
        
    except Exception as e:
        print(f"Error getting post: {e}")
        return jsonify({'error': 'Failed to get post'}), 500


@posts_bp.route('/<post_id>/like', methods=['POST'])
@token_required
def toggle_like(current_user_id, post_id):
    """Toggle like on a post"""
    try:
        result = like_post(post_id, current_user_id)
        
        if result is None:
            return jsonify({'error': 'Post not found'}), 404
        
        return jsonify({
            'success': True,
            'liked': result['liked'],
            'likes_count': result['likes_count']
        })
        
    except Exception as e:
        print(f"Error liking post: {e}")
        return jsonify({'error': 'Failed to like post'}), 500


@posts_bp.route('/<post_id>/view', methods=['POST'])
@token_required
def record_post_view(current_user_id, post_id):
    """Record a view on a post"""
    try:
        success = record_view(post_id, current_user_id)
        
        if not success:
            return jsonify({'error': 'Post not found'}), 404
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error recording view: {e}")
        return jsonify({'error': 'Failed to record view'}), 500


@posts_bp.route('/<post_id>', methods=['DELETE'])
@token_required
def delete_user_post(current_user_id, post_id):
    """Delete a post (only by owner)"""
    try:
        success = delete_post(post_id, current_user_id)
        
        if not success:
            return jsonify({'error': 'Post not found or not authorized'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Post deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting post: {e}")
        return jsonify({'error': 'Failed to delete post'}), 500


@posts_bp.route('/media/<file_id>', methods=['GET'])
def serve_media(file_id):
    """Serve media file from GridFS"""
    try:
        media = get_media_file(file_id)
        
        if not media:
            return jsonify({'error': 'Media not found'}), 404
        
        return Response(
            media['data'],
            mimetype=media['content_type'],
            headers={
                'Content-Disposition': f'inline; filename="{media["filename"]}"',
                'Cache-Control': 'public, max-age=31536000'  # Cache for 1 year
            }
        )
        
    except Exception as e:
        print(f"Error serving media: {e}")
        return jsonify({'error': 'Failed to serve media'}), 500


# ===========================
# Comments Endpoints
# ===========================

@posts_bp.route('/<post_id>/comments', methods=['GET'])
@token_required
def get_post_comments(current_user_id, post_id):
    """Get comments for a post"""
    try:
        limit = request.args.get('limit', 50, type=int)
        skip = request.args.get('skip', 0, type=int)
        
        comments = get_comments(post_id, limit=limit, skip=skip)
        
        # Enrich with user info
        for comment in comments:
            user = find_user_by_firebase_uid(comment.get('user_id'))
            comment['user'] = {
                'user_id': comment.get('user_id'),
                'name': user.get('name', 'Anonymous') if user else 'Anonymous',
                'profile_image': user.get('profile_image') if user else None
            }
            comment['is_liked'] = current_user_id in comment.get('likes', [])
            comment.pop('likes', None)
            if comment.get('created_at'):
                comment['created_at'] = comment['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'comments': comments,
            'count': len(comments)
        })
        
    except Exception as e:
        print(f"Error getting comments: {e}")
        return jsonify({'error': 'Failed to get comments'}), 500


@posts_bp.route('/<post_id>/comments', methods=['POST'])
@token_required
def create_comment(current_user_id, post_id):
    """Add a comment to a post"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'Comment text is required'}), 400
        
        if len(text) > 1000:
            return jsonify({'error': 'Comment too long (max 1000 chars)'}), 400
        
        comment = add_comment(post_id, current_user_id, text)
        
        if not comment:
            return jsonify({'error': 'Failed to add comment'}), 500
        
        # Get user info
        user = find_user_by_firebase_uid(current_user_id)
        comment['user'] = {
            'user_id': current_user_id,
            'name': user.get('name', 'Anonymous') if user else 'Anonymous',
            'profile_image': user.get('profile_image') if user else None
        }
        comment['is_liked'] = False
        comment['created_at'] = comment['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'comment': comment
        }), 201
        
    except Exception as e:
        print(f"Error adding comment: {e}")
        return jsonify({'error': 'Failed to add comment'}), 500


@posts_bp.route('/<post_id>/comments/<comment_id>', methods=['DELETE'])
@token_required
def remove_comment(current_user_id, post_id, comment_id):
    """Delete a comment"""
    try:
        success = delete_comment(post_id, comment_id, current_user_id)
        
        if not success:
            return jsonify({'error': 'Comment not found or not authorized'}), 404
        
        return jsonify({'success': True, 'message': 'Comment deleted'})
        
    except Exception as e:
        print(f"Error deleting comment: {e}")
        return jsonify({'error': 'Failed to delete comment'}), 500


@posts_bp.route('/<post_id>/comments/<comment_id>/like', methods=['POST'])
@token_required
def toggle_comment_like(current_user_id, post_id, comment_id):
    """Toggle like on a comment"""
    try:
        result = like_comment(post_id, comment_id, current_user_id)
        
        if result is None:
            return jsonify({'error': 'Comment not found'}), 404
        
        return jsonify({
            'success': True,
            'liked': result['liked']
        })
        
    except Exception as e:
        print(f"Error liking comment: {e}")
        return jsonify({'error': 'Failed to like comment'}), 500


# ===========================
# Trending & Discovery
# ===========================

@posts_bp.route('/trending', methods=['GET'])
@token_required
def get_trending(current_user_id):
    """Get trending posts nearby"""
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 25, type=float)
        limit = request.args.get('limit', 20, type=int)
        
        if lat is None or lng is None:
            return jsonify({'error': 'Location required'}), 400
        
        posts = get_trending_posts(lng, lat, radius_km=radius, limit=limit)
        
        # Enrich with user info
        for post in posts:
            user = find_user_by_firebase_uid(post.get('user_id'))
            post['user'] = {
                'user_id': post.get('user_id'),
                'name': user.get('name', 'Anonymous') if user else 'Anonymous',
                'profile_image': user.get('profile_image') if user else None
            }
            post['is_liked'] = current_user_id in post.get('likes', [])
            post.pop('likes', None)
            if post.get('created_at'):
                post['created_at'] = post['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'posts': posts,
            'count': len(posts)
        })
        
    except Exception as e:
        print(f"Error getting trending: {e}")
        return jsonify({'error': 'Failed to get trending posts'}), 500


@posts_bp.route('/hashtag/<hashtag>', methods=['GET'])
@token_required
def search_hashtag(current_user_id, hashtag):
    """Search posts by hashtag"""
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 50, type=float)
        limit = request.args.get('limit', 50, type=int)
        
        posts = search_by_hashtag(
            hashtag, 
            longitude=lng, 
            latitude=lat, 
            radius_km=radius if lat and lng else 50,
            limit=limit
        )
        
        # Enrich with user info
        for post in posts:
            user = find_user_by_firebase_uid(post.get('user_id'))
            post['user'] = {
                'user_id': post.get('user_id'),
                'name': user.get('name', 'Anonymous') if user else 'Anonymous',
                'profile_image': user.get('profile_image') if user else None
            }
            post['is_liked'] = current_user_id in post.get('likes', [])
            post.pop('likes', None)
            if post.get('created_at'):
                post['created_at'] = post['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'hashtag': hashtag,
            'posts': posts,
            'count': len(posts)
        })
        
    except Exception as e:
        print(f"Error searching hashtag: {e}")
        return jsonify({'error': 'Failed to search hashtag'}), 500


@posts_bp.route('/hashtags/trending', methods=['GET'])
@token_required
def get_trending_tags(current_user_id):
    """Get trending hashtags nearby"""
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 25, type=float)
        limit = request.args.get('limit', 10, type=int)
        
        if lat is None or lng is None:
            return jsonify({'error': 'Location required'}), 400
        
        hashtags = get_trending_hashtags(lng, lat, radius_km=radius, limit=limit)
        
        return jsonify({
            'success': True,
            'hashtags': hashtags
        })
        
    except Exception as e:
        print(f"Error getting trending hashtags: {e}")
        return jsonify({'error': 'Failed to get hashtags'}), 500


# ===========================
# Stories
# ===========================

@posts_bp.route('/stories', methods=['GET'])
@token_required
def get_stories(current_user_id):
    """Get nearby stories"""
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 10, type=float)
        limit = request.args.get('limit', 50, type=int)
        
        if lat is None or lng is None:
            return jsonify({'error': 'Location required'}), 400
        
        stories = get_nearby_stories(lng, lat, radius_km=radius, limit=limit)
        
        # Enrich with user info
        for story in stories:
            user = find_user_by_firebase_uid(story.get('user_id'))
            story['user'] = {
                'user_id': story.get('user_id'),
                'name': user.get('name', 'Anonymous') if user else 'Anonymous',
                'profile_image': user.get('profile_image') if user else None
            }
            story['is_liked'] = current_user_id in story.get('likes', [])
            story.pop('likes', None)
            if story.get('created_at'):
                story['created_at'] = story['created_at'].isoformat()
            if story.get('expires_at'):
                story['expires_at'] = story['expires_at'].isoformat()
        
        return jsonify({
            'success': True,
            'stories': stories,
            'count': len(stories)
        })
        
    except Exception as e:
        print(f"Error getting stories: {e}")
        return jsonify({'error': 'Failed to get stories'}), 500


# ===========================
# Share
# ===========================

@posts_bp.route('/<post_id>/share', methods=['POST'])
@token_required
def share_post(current_user_id, post_id):
    """Record a share on a post"""
    try:
        success = increment_shares(post_id)
        
        if not success:
            return jsonify({'error': 'Post not found'}), 404
        
        return jsonify({'success': True, 'message': 'Share recorded'})
        
    except Exception as e:
        print(f"Error recording share: {e}")
        return jsonify({'error': 'Failed to record share'}), 500

