import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { postsApi } from '../services/api'
import {
    MapPin,
    Heart,
    MessageCircle,
    Share2,
    MoreVertical,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Plus,
    ChevronUp,
    ChevronDown,
    Loader,
    Navigation,
    Clock,
    Eye,
    Trash2,
    X,
    TrendingUp,
    Hash
} from 'lucide-react'
import CreatePost from '../components/CreatePost'
import CommentsSheet from '../components/CommentsSheet'
import StoriesBar from '../components/StoriesBar'
import './GeoReels.css'

const API_BASE_URL = 'http://localhost:5000'

function GeoReels() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userLocation, setUserLocation] = useState(null)
    const [locationError, setLocationError] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showComments, setShowComments] = useState(null) // postId or null
    const [trendingHashtags, setTrendingHashtags] = useState([])
    const [createStoryMode, setCreateStoryMode] = useState(false)
    const [muted, setMuted] = useState(true)
    const [playing, setPlaying] = useState(true)
    const [radius, setRadius] = useState(10)
    const videoRefs = useRef({})
    const containerRef = useRef(null)
    const { themeColors } = useTheme()

    // Get user location on mount
    useEffect(() => {
        getUserLocation()
    }, [])

    // Load posts when location is available
    useEffect(() => {
        if (userLocation) {
            loadNearbyPosts()
        }
    }, [userLocation, radius])

    const getUserLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                    setLocationError(null)
                },
                (error) => {
                    console.error('Location error:', error)
                    setLocationError('Unable to get your location. Please enable location services.')
                    // Use default location (Bangalore) for demo
                    setUserLocation({
                        latitude: 12.9716,
                        longitude: 77.5946
                    })
                },
                { enableHighAccuracy: true, timeout: 10000 }
            )
        } else {
            setLocationError('Geolocation not supported by your browser')
            // Use default location
            setUserLocation({
                latitude: 12.9716,
                longitude: 77.5946
            })
        }
    }

    const loadNearbyPosts = async () => {
        setLoading(true)
        setError(null)
        try {
            const [postsResponse, hashtagsResponse] = await Promise.all([
                postsApi.getNearbyPosts(
                    userLocation.latitude,
                    userLocation.longitude,
                    radius
                ),
                postsApi.getTrendingHashtags(
                    userLocation.latitude,
                    userLocation.longitude,
                    radius
                ).catch(() => ({ data: { hashtags: [] } }))
            ])
            setPosts(postsResponse.data.posts || [])
            setTrendingHashtags(hashtagsResponse.data.hashtags || [])
        } catch (err) {
            console.error('Failed to load posts:', err)
            setError('Failed to load nearby posts')
            // Set demo posts for development
            setPosts(getDemoPosts())
            setTrendingHashtags([
                { hashtag: 'bangalore', count: 15 },
                { hashtag: 'travel', count: 12 },
                { hashtag: 'food', count: 8 }
            ])
        } finally {
            setLoading(false)
        }
    }

    const getDemoPosts = () => [
        {
            _id: 'demo1',
            user: { name: 'Priya Kumar', profile_image: null },
            post_type: 'post',
            caption: '🌅 Beautiful sunrise at Cubbon Park this morning! Perfect weather for a morning walk. #Bangalore #Nature',
            location_name: 'Cubbon Park, Bangalore',
            distance_km: 2.3,
            media: [{ type: 'image', file_id: null }],
            likes_count: 47,
            views: 234,
            is_liked: false,
            created_at: new Date().toISOString()
        },
        {
            _id: 'demo2',
            user: { name: 'Rahul Sharma', profile_image: null },
            post_type: 'tip',
            caption: '💡 Pro tip: The best filter coffee in town is at Brahmin\'s Coffee Bar. Only ₹15 for authentic South Indian coffee! Been coming here for years.',
            location_name: 'Basavanagudi, Bangalore',
            distance_km: 4.1,
            media: [],
            likes_count: 89,
            views: 567,
            is_liked: true,
            created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
            _id: 'demo3',
            user: { name: 'Ananya Reddy', profile_image: null },
            post_type: 'event',
            caption: '🎭 Don\'t miss the Yakshagana performance at Ravindra Kalakshetra tonight at 7 PM! It\'s a rare chance to experience this traditional art form.',
            location_name: 'Ravindra Kalakshetra, Bangalore',
            distance_km: 5.8,
            media: [],
            likes_count: 156,
            views: 890,
            is_liked: false,
            created_at: new Date(Date.now() - 7200000).toISOString()
        }
    ]

    const handleLike = async (postId) => {
        try {
            const response = await postsApi.likePost(postId)
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        is_liked: response.data.liked,
                        likes_count: response.data.likes_count
                    }
                }
                return post
            }))
        } catch (err) {
            console.error('Failed to like post:', err)
        }
    }

    const handleScroll = (direction) => {
        if (direction === 'up' && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        } else if (direction === 'down' && currentIndex < posts.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowUp') {
            handleScroll('up')
        } else if (e.key === 'ArrowDown') {
            handleScroll('down')
        } else if (e.key === ' ') {
            e.preventDefault()
            setPlaying(!playing)
        } else if (e.key === 'm') {
            setMuted(!muted)
        }
    }, [currentIndex, posts.length, playing, muted])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const getPostTypeIcon = (type) => {
        switch (type) {
            case 'story': return '📖'
            case 'tip': return '💡'
            case 'event': return '🎉'
            default: return '📝'
        }
    }

    const getMediaUrl = (fileId) => {
        return `${API_BASE_URL}/api/posts/media/${fileId}`
    }

    const handlePostCreated = (newPost) => {
        setPosts([newPost, ...posts])
        setCurrentIndex(0)
        setShowCreateModal(false)
    }

    if (loading && !posts.length) {
        return (
            <div className="geo-reels-loading">
                <Loader className="spin" size={48} />
                <p>Finding posts near you...</p>
                {userLocation && (
                    <span className="location-info">
                        <MapPin size={14} />
                        {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className="geo-reels-container" ref={containerRef}>
            {/* Header */}
            <div className="geo-reels-header">
                <div className="header-left">
                    <h1>Nearby</h1>
                    <span className="radius-badge">
                        <Navigation size={12} />
                        {radius}km
                    </span>
                </div>
                <div className="header-right">
                    <select
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="radius-select"
                    >
                        <option value={1}>1 km</option>
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                    </select>
                </div>
            </div>

            {/* Stories Bar */}
            {userLocation && (
                <StoriesBar
                    userLocation={userLocation}
                    onCreateStory={() => {
                        setCreateStoryMode(true)
                        setShowCreateModal(true)
                    }}
                    onStoryClick={(userStories) => {
                        console.log('View stories:', userStories)
                    }}
                />
            )}

            {/* Trending Hashtags */}
            {trendingHashtags.length > 0 && (
                <div className="trending-hashtags-bar">
                    <TrendingUp size={14} />
                    <div className="hashtags-scroll">
                        {trendingHashtags.map((tag, i) => (
                            <span key={i} className="hashtag-chip">
                                #{tag.hashtag}
                                <span className="hashtag-count">{tag.count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Location Error Banner */}
            {locationError && (
                <div className="location-error-banner">
                    <MapPin size={16} />
                    <span>{locationError}</span>
                    <button onClick={getUserLocation}>Retry</button>
                </div>
            )}

            {/* Main Reels Container */}
            {posts.length === 0 ? (
                <div className="no-posts-container">
                    <div className="no-posts-icon">📍</div>
                    <h2>No posts nearby</h2>
                    <p>Be the first to share something from this area!</p>
                    <button
                        className="create-first-post-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={20} />
                        Create Post
                    </button>
                </div>
            ) : (
                <div className="reels-wrapper">
                    {/* Navigation Arrows */}
                    <button
                        className={`nav-arrow up ${currentIndex === 0 ? 'disabled' : ''}`}
                        onClick={() => handleScroll('up')}
                        disabled={currentIndex === 0}
                    >
                        <ChevronUp size={32} />
                    </button>

                    {/* Current Post */}
                    <div
                        className="reel-item"
                        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
                    >
                        {posts.map((post, index) => (
                            <ReelCard
                                key={post._id}
                                post={post}
                                isActive={index === currentIndex}
                                muted={muted}
                                playing={playing && index === currentIndex}
                                onLike={() => handleLike(post._id)}
                                onComment={() => setShowComments(post._id)}
                                onShare={async () => {
                                    try {
                                        await postsApi.sharePost(post._id)
                                        if (navigator.share) {
                                            navigator.share({
                                                title: `Post by ${post.user?.name}`,
                                                text: post.caption,
                                                url: window.location.href
                                            })
                                        }
                                    } catch (err) {
                                        console.error('Share failed:', err)
                                    }
                                }}
                                onMuteToggle={() => setMuted(!muted)}
                                onPlayToggle={() => setPlaying(!playing)}
                                getMediaUrl={getMediaUrl}
                                formatTimeAgo={formatTimeAgo}
                                getPostTypeIcon={getPostTypeIcon}
                                videoRef={(el) => videoRefs.current[post._id] = el}
                            />
                        ))}
                    </div>

                    <button
                        className={`nav-arrow down ${currentIndex === posts.length - 1 ? 'disabled' : ''}`}
                        onClick={() => handleScroll('down')}
                        disabled={currentIndex === posts.length - 1}
                    >
                        <ChevronDown size={32} />
                    </button>

                    {/* Post Counter */}
                    <div className="post-counter">
                        {currentIndex + 1} / {posts.length}
                    </div>
                </div>
            )}

            {/* Create Post FAB */}
            <button
                className="create-post-fab"
                onClick={() => setShowCreateModal(true)}
            >
                <Plus size={28} />
            </button>

            {/* Create Post Modal */}
            {showCreateModal && (
                <CreatePost
                    onClose={() => {
                        setShowCreateModal(false)
                        setCreateStoryMode(false)
                    }}
                    onPostCreated={handlePostCreated}
                    userLocation={userLocation}
                    defaultPostType={createStoryMode ? 'story' : 'post'}
                />
            )}

            {/* Comments Sheet */}
            {showComments && (
                <CommentsSheet
                    postId={showComments}
                    onClose={() => setShowComments(null)}
                    initialCommentsCount={posts.find(p => p._id === showComments)?.comments_count || 0}
                />
            )}
        </div>
    )
}

function ReelCard({
    post,
    isActive,
    muted,
    playing,
    onLike,
    onComment,
    onShare,
    onMuteToggle,
    onPlayToggle,
    getMediaUrl,
    formatTimeAgo,
    getPostTypeIcon,
    videoRef
}) {
    const hasMedia = post.media && post.media.length > 0
    const isVideo = hasMedia && post.media[0].type === 'video'
    const mediaUrl = hasMedia && post.media[0].file_id
        ? getMediaUrl(post.media[0].file_id)
        : null

    // Placeholder images for demo
    const placeholderImages = [
        'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600'
    ]

    return (
        <div className={`reel-card ${isActive ? 'active' : ''}`}>
            {/* Background Media */}
            <div className="reel-background">
                {isVideo && mediaUrl ? (
                    <video
                        ref={videoRef}
                        src={mediaUrl}
                        loop
                        muted={muted}
                        autoPlay={playing && isActive}
                        playsInline
                        className="reel-video"
                    />
                ) : mediaUrl ? (
                    <img src={mediaUrl} alt="" className="reel-image" />
                ) : (
                    <div
                        className="reel-placeholder"
                        style={{
                            backgroundImage: `url(${placeholderImages[Math.floor(Math.random() * placeholderImages.length)]})`
                        }}
                    />
                )}
                <div className="reel-gradient-overlay" />
            </div>

            {/* Content Overlay */}
            <div className="reel-content">
                {/* Post Type Badge */}
                <div className="post-type-badge">
                    {getPostTypeIcon(post.post_type)}
                    <span>{post.post_type}</span>
                </div>

                {/* User Info */}
                <div className="reel-user-info">
                    <div className="user-avatar">
                        {post.user?.profile_image ? (
                            <img src={post.user.profile_image} alt="" />
                        ) : (
                            <span>{post.user?.name?.charAt(0) || 'A'}</span>
                        )}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{post.user?.name || 'Anonymous'}</span>
                        <span className="post-time">
                            <Clock size={12} />
                            {formatTimeAgo(post.created_at)}
                        </span>
                    </div>
                </div>

                {/* Caption */}
                <div className="reel-caption">
                    <p>{post.caption}</p>
                </div>

                {/* Location */}
                <div className="reel-location">
                    <MapPin size={14} />
                    <span>{post.location_name}</span>
                    <span className="distance-tag">{post.distance_km} km away</span>
                </div>
            </div>

            {/* Side Actions */}
            <div className="reel-actions">
                <button
                    className={`action-btn like-btn ${post.is_liked ? 'liked' : ''}`}
                    onClick={onLike}
                >
                    <Heart size={28} fill={post.is_liked ? '#ef4444' : 'none'} />
                    <span>{post.likes_count}</span>
                </button>

                <button className="action-btn" onClick={onComment}>
                    <MessageCircle size={28} />
                    <span>{post.comments_count || 0}</span>
                </button>

                <button className="action-btn" onClick={onShare}>
                    <Share2 size={28} />
                    {post.shares_count > 0 && <span>{post.shares_count}</span>}
                </button>

                <button className="action-btn">
                    <Eye size={24} />
                    <span>{post.views}</span>
                </button>

                {isVideo && (
                    <>
                        <button className="action-btn" onClick={onMuteToggle}>
                            {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </button>
                        <button className="action-btn" onClick={onPlayToggle}>
                            {playing ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default GeoReels
