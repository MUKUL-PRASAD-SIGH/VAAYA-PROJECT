"""
Post model for geo-fenced posts/reels
Stores posts with geospatial location for proximity-based content filtering
"""
from models import db
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import gridfs

# MongoDB collections
posts_collection = db.posts
post_media_collection = db.post_media

# GridFS for storing media files
fs = gridfs.GridFS(db, collection='post_files')

# Ensure geospatial index exists
try:
    posts_collection.create_index([("location", "2dsphere")])
except Exception as e:
    print(f"Note: Geo index may already exist: {e}")


def create_post(user_id, post_type, caption, location_coords, location_name, 
                media_files=None, visibility_radius_km=10):
    """
    Create a new geo-fenced post
    
    Args:
        user_id: Firebase UID of the creator
        post_type: 'post', 'story', 'tip', 'event'
        caption: Text content of the post
        location_coords: [longitude, latitude] array
        location_name: Human-readable location string
        media_files: List of file objects to store in GridFS
        visibility_radius_km: How far the post is visible (default: 10km)
        
    Returns:
        Created post document with _id
    """
    # Store media files in GridFS
    media = []
    if media_files:
        for file_obj in media_files:
            filename = file_obj.get('filename', 'media')
            content_type = file_obj.get('content_type', 'application/octet-stream')
            file_data = file_obj.get('data')
            
            if file_data:
                # Store in GridFS
                file_id = fs.put(
                    file_data,
                    filename=filename,
                    content_type=content_type,
                    user_id=user_id,
                    created_at=datetime.utcnow()
                )
                
                # Determine media type
                media_type = 'video' if 'video' in content_type else 'image'
                
                media.append({
                    'file_id': str(file_id),
                    'filename': filename,
                    'type': media_type,
                    'content_type': content_type
                })
    
    # Calculate expiry for stories (24 hours)
    expires_at = None
    if post_type == 'story':
        expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Extract hashtags from caption
    hashtags = extract_hashtags(caption)
    
    post = {
        'user_id': user_id,
        'post_type': post_type,  # 'post', 'story', 'tip', 'event'
        'caption': caption,
        'hashtags': hashtags,  # Array of hashtags extracted from caption
        'location': {
            'type': 'Point',
            'coordinates': location_coords  # [longitude, latitude]
        },
        'location_name': location_name,
        'visibility_radius_km': visibility_radius_km,
        'media': media,
        'views': 0,
        'likes': [],  # Array of user_ids who liked
        'likes_count': 0,
        'comments': [],  # Array of comment objects
        'comments_count': 0,
        'shares_count': 0,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'expires_at': expires_at,
        'is_active': True
    }
    
    result = posts_collection.insert_one(post)
    post['_id'] = result.inserted_id
    return post


def extract_hashtags(text):
    """Extract hashtags from text"""
    import re
    if not text:
        return []
    hashtags = re.findall(r'#(\w+)', text.lower())
    return list(set(hashtags))  # Remove duplicates


def get_nearby_posts(longitude, latitude, radius_km=10, limit=50, skip=0, post_type=None):
    """
    Get posts within a geographic radius using MongoDB $geoNear
    
    Args:
        longitude: User's longitude
        latitude: User's latitude  
        radius_km: Radius in kilometers to search
        limit: Maximum posts to return
        skip: Number of posts to skip (pagination)
        post_type: Optional filter by post type
        
    Returns:
        List of posts within radius, sorted by distance
    """
    pipeline = [
        {
            '$geoNear': {
                'near': {
                    'type': 'Point',
                    'coordinates': [longitude, latitude]
                },
                'distanceField': 'distance_meters',
                'maxDistance': radius_km * 1000,  # Convert km to meters
                'spherical': True,
                'query': {
                    'is_active': True,
                    '$or': [
                        {'expires_at': None},
                        {'expires_at': {'$gt': datetime.utcnow()}}
                    ]
                }
            }
        },
        {'$sort': {'created_at': -1}},
        {'$skip': skip},
        {'$limit': limit}
    ]
    
    # Add post_type filter if specified
    if post_type:
        pipeline[0]['$geoNear']['query']['post_type'] = post_type
    
    posts = list(posts_collection.aggregate(pipeline))
    
    # Convert ObjectId to string for JSON serialization
    for post in posts:
        post['_id'] = str(post['_id'])
        post['distance_km'] = round(post.get('distance_meters', 0) / 1000, 2)
        
    return posts


def get_post_by_id(post_id):
    """Get a single post by ID"""
    try:
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if post:
            post['_id'] = str(post['_id'])
        return post
    except:
        return None


def get_user_posts(user_id, limit=50, skip=0):
    """Get all posts by a specific user"""
    posts = list(posts_collection.find(
        {'user_id': user_id, 'is_active': True}
    ).sort('created_at', -1).skip(skip).limit(limit))
    
    for post in posts:
        post['_id'] = str(post['_id'])
    
    return posts


def like_post(post_id, user_id):
    """
    Toggle like on a post
    Returns: {'liked': bool, 'likes_count': int}
    """
    try:
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if not post:
            return None
            
        likes = post.get('likes', [])
        
        if user_id in likes:
            # Unlike
            posts_collection.update_one(
                {'_id': ObjectId(post_id)},
                {
                    '$pull': {'likes': user_id},
                    '$inc': {'likes_count': -1}
                }
            )
            return {'liked': False, 'likes_count': post.get('likes_count', 1) - 1}
        else:
            # Like
            posts_collection.update_one(
                {'_id': ObjectId(post_id)},
                {
                    '$push': {'likes': user_id},
                    '$inc': {'likes_count': 1}
                }
            )
            return {'liked': True, 'likes_count': post.get('likes_count', 0) + 1}
    except:
        return None


def record_view(post_id, user_id):
    """Record a view on a post (increments view count)"""
    try:
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$inc': {'views': 1}}
        )
        return True
    except:
        return False


def delete_post(post_id, user_id):
    """
    Delete a post (soft delete - sets is_active to False)
    Only allows deletion by the post owner
    """
    try:
        result = posts_collection.update_one(
            {'_id': ObjectId(post_id), 'user_id': user_id},
            {'$set': {'is_active': False, 'updated_at': datetime.utcnow()}}
        )
        return result.modified_count > 0
    except:
        return False


def get_media_file(file_id):
    """
    Get media file from GridFS by file_id
    Returns: File data and content_type, or None if not found
    """
    try:
        grid_out = fs.get(ObjectId(file_id))
        return {
            'data': grid_out.read(),
            'content_type': grid_out.content_type,
            'filename': grid_out.filename
        }
    except:
        return None


def cleanup_expired_stories():
    """
    Remove expired stories (called periodically)
    Sets is_active to False for expired posts
    """
    result = posts_collection.update_many(
        {
            'post_type': 'story',
            'expires_at': {'$lt': datetime.utcnow()},
            'is_active': True
        },
        {'$set': {'is_active': False}}
    )
    return result.modified_count


# ===========================
# Comments Functions
# ===========================

def add_comment(post_id, user_id, text):
    """Add a comment to a post"""
    try:
        comment = {
            'comment_id': str(ObjectId()),
            'user_id': user_id,
            'text': text,
            'created_at': datetime.utcnow(),
            'likes': [],
            'likes_count': 0
        }
        
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {
                '$push': {'comments': comment},
                '$inc': {'comments_count': 1}
            }
        )
        return comment
    except:
        return None


def get_comments(post_id, limit=50, skip=0):
    """Get comments for a post"""
    try:
        post = posts_collection.find_one(
            {'_id': ObjectId(post_id)},
            {'comments': {'$slice': [skip, limit]}}
        )
        if post:
            return post.get('comments', [])
        return []
    except:
        return []


def delete_comment(post_id, comment_id, user_id):
    """Delete a comment (only by comment author)"""
    try:
        result = posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {
                '$pull': {'comments': {'comment_id': comment_id, 'user_id': user_id}},
                '$inc': {'comments_count': -1}
            }
        )
        return result.modified_count > 0
    except:
        return False


def like_comment(post_id, comment_id, user_id):
    """Toggle like on a comment"""
    try:
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if not post:
            return None
        
        for comment in post.get('comments', []):
            if comment.get('comment_id') == comment_id:
                if user_id in comment.get('likes', []):
                    # Unlike
                    posts_collection.update_one(
                        {'_id': ObjectId(post_id), 'comments.comment_id': comment_id},
                        {
                            '$pull': {'comments.$.likes': user_id},
                            '$inc': {'comments.$.likes_count': -1}
                        }
                    )
                    return {'liked': False}
                else:
                    # Like
                    posts_collection.update_one(
                        {'_id': ObjectId(post_id), 'comments.comment_id': comment_id},
                        {
                            '$push': {'comments.$.likes': user_id},
                            '$inc': {'comments.$.likes_count': 1}
                        }
                    )
                    return {'liked': True}
        return None
    except:
        return None


# ===========================
# Trending Posts
# ===========================

def get_trending_posts(longitude, latitude, radius_km=25, limit=20):
    """
    Get trending posts near a location based on engagement
    Trending score = likes_count * 2 + comments_count * 3 + views * 0.1
    """
    pipeline = [
        {
            '$geoNear': {
                'near': {
                    'type': 'Point',
                    'coordinates': [longitude, latitude]
                },
                'distanceField': 'distance_meters',
                'maxDistance': radius_km * 1000,
                'spherical': True,
                'query': {
                    'is_active': True,
                    'post_type': {'$ne': 'story'},  # Exclude stories
                    'created_at': {'$gte': datetime.utcnow() - timedelta(days=7)},  # Last 7 days
                    '$or': [
                        {'expires_at': None},
                        {'expires_at': {'$gt': datetime.utcnow()}}
                    ]
                }
            }
        },
        {
            '$addFields': {
                'trending_score': {
                    '$add': [
                        {'$multiply': ['$likes_count', 2]},
                        {'$multiply': ['$comments_count', 3]},
                        {'$multiply': ['$views', 0.1]}
                    ]
                }
            }
        },
        {'$sort': {'trending_score': -1}},
        {'$limit': limit}
    ]
    
    posts = list(posts_collection.aggregate(pipeline))
    
    for post in posts:
        post['_id'] = str(post['_id'])
        post['distance_km'] = round(post.get('distance_meters', 0) / 1000, 2)
        
    return posts


# ===========================
# Hashtag Search
# ===========================

def search_by_hashtag(hashtag, longitude=None, latitude=None, radius_km=50, limit=50):
    """Search posts by hashtag, optionally filtered by location"""
    hashtag = hashtag.lower().replace('#', '')
    
    query = {
        'is_active': True,
        'hashtags': hashtag,
        '$or': [
            {'expires_at': None},
            {'expires_at': {'$gt': datetime.utcnow()}}
        ]
    }
    
    if longitude and latitude:
        # Geo-filtered search
        pipeline = [
            {
                '$geoNear': {
                    'near': {
                        'type': 'Point',
                        'coordinates': [longitude, latitude]
                    },
                    'distanceField': 'distance_meters',
                    'maxDistance': radius_km * 1000,
                    'spherical': True,
                    'query': query
                }
            },
            {'$sort': {'created_at': -1}},
            {'$limit': limit}
        ]
        posts = list(posts_collection.aggregate(pipeline))
        for post in posts:
            post['_id'] = str(post['_id'])
            post['distance_km'] = round(post.get('distance_meters', 0) / 1000, 2)
    else:
        # Non-geo search
        posts = list(posts_collection.find(query).sort('created_at', -1).limit(limit))
        for post in posts:
            post['_id'] = str(post['_id'])
    
    return posts


def get_trending_hashtags(longitude, latitude, radius_km=25, limit=10):
    """Get trending hashtags near a location"""
    pipeline = [
        {
            '$geoNear': {
                'near': {
                    'type': 'Point',
                    'coordinates': [longitude, latitude]
                },
                'distanceField': 'distance_meters',
                'maxDistance': radius_km * 1000,
                'spherical': True,
                'query': {
                    'is_active': True,
                    'created_at': {'$gte': datetime.utcnow() - timedelta(days=7)},
                    'hashtags': {'$exists': True, '$ne': []}
                }
            }
        },
        {'$unwind': '$hashtags'},
        {'$group': {'_id': '$hashtags', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': limit}
    ]
    
    result = list(posts_collection.aggregate(pipeline))
    return [{'hashtag': item['_id'], 'count': item['count']} for item in result]


# ===========================
# Stories (Nearby)
# ===========================

def get_nearby_stories(longitude, latitude, radius_km=10, limit=50):
    """Get active stories within a radius"""
    pipeline = [
        {
            '$geoNear': {
                'near': {
                    'type': 'Point',
                    'coordinates': [longitude, latitude]
                },
                'distanceField': 'distance_meters',
                'maxDistance': radius_km * 1000,
                'spherical': True,
                'query': {
                    'is_active': True,
                    'post_type': 'story',
                    'expires_at': {'$gt': datetime.utcnow()}
                }
            }
        },
        {'$sort': {'created_at': -1}},
        {'$limit': limit}
    ]
    
    stories = list(posts_collection.aggregate(pipeline))
    
    for story in stories:
        story['_id'] = str(story['_id'])
        story['distance_km'] = round(story.get('distance_meters', 0) / 1000, 2)
        
    return stories


def increment_shares(post_id):
    """Increment share count on a post"""
    try:
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$inc': {'shares_count': 1}}
        )
        return True
    except:
        return False

