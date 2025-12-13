import { useState, useRef, useEffect } from 'react'
import { postsApi } from '../services/api'
import {
    X,
    Upload,
    MapPin,
    Image,
    Video,
    FileText,
    Calendar,
    Lightbulb,
    Loader,
    Check,
    AlertCircle,
    Navigation
} from 'lucide-react'
import './CreatePost.css'

const POST_TYPES = [
    { id: 'post', label: 'Post', icon: '📝', description: 'Share a moment' },
    { id: 'story', label: 'Story', icon: '📖', description: 'Expires in 24h' },
    { id: 'tip', label: 'Local Tip', icon: '💡', description: 'Help travelers' },
    { id: 'event', label: 'Event', icon: '🎉', description: 'Happening nearby' }
]

function CreatePost({ onClose, onPostCreated, userLocation }) {
    const [postType, setPostType] = useState('post')
    const [caption, setCaption] = useState('')
    const [mediaFiles, setMediaFiles] = useState([])
    const [mediaPreviews, setMediaPreviews] = useState([])
    const [location, setLocation] = useState(userLocation)
    const [locationName, setLocationName] = useState('')
    const [visibilityRadius, setVisibilityRadius] = useState(10)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [fetchingLocation, setFetchingLocation] = useState(false)

    const fileInputRef = useRef(null)

    // Get location name on mount
    useEffect(() => {
        if (location) {
            getLocationName(location.latitude, location.longitude)
        }
    }, [])

    const getLocationName = async (lat, lng) => {
        setFetchingLocation(true)
        try {
            // Use OpenStreetMap Nominatim for reverse geocoding (free)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            )
            const data = await response.json()

            if (data.address) {
                const parts = []
                if (data.address.suburb) parts.push(data.address.suburb)
                else if (data.address.neighbourhood) parts.push(data.address.neighbourhood)
                if (data.address.city) parts.push(data.address.city)
                else if (data.address.town) parts.push(data.address.town)

                setLocationName(parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(','))
            }
        } catch (err) {
            console.error('Failed to get location name:', err)
            setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        } finally {
            setFetchingLocation(false)
        }
    }

    const refreshLocation = () => {
        if ('geolocation' in navigator) {
            setFetchingLocation(true)
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                    setLocation(newLocation)
                    getLocationName(newLocation.latitude, newLocation.longitude)
                },
                (error) => {
                    console.error('Location error:', error)
                    setFetchingLocation(false)
                }
            )
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files))
        }
    }

    const handleFiles = (files) => {
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/')
            const isVideo = file.type.startsWith('video/')
            const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB max
            return (isImage || isVideo) && isValidSize
        })

        if (validFiles.length === 0) {
            setError('Please select valid image or video files (max 50MB)')
            return
        }

        // Create previews
        const newPreviews = validFiles.map(file => ({
            file,
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image'
        }))

        setMediaFiles([...mediaFiles, ...validFiles])
        setMediaPreviews([...mediaPreviews, ...newPreviews])
        setError(null)
    }

    const removeMedia = (index) => {
        URL.revokeObjectURL(mediaPreviews[index].url)
        setMediaFiles(mediaFiles.filter((_, i) => i !== index))
        setMediaPreviews(mediaPreviews.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!caption.trim() && mediaFiles.length === 0) {
            setError('Please add a caption or media')
            return
        }

        if (!location) {
            setError('Location is required')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('post_type', postType)
            formData.append('caption', caption)
            formData.append('latitude', location.latitude)
            formData.append('longitude', location.longitude)
            formData.append('location_name', locationName || 'Unknown Location')
            formData.append('visibility_radius_km', visibilityRadius)

            mediaFiles.forEach(file => {
                formData.append('media', file)
            })

            const response = await postsApi.createPost(formData)

            setSuccess(true)
            setTimeout(() => {
                if (onPostCreated) {
                    onPostCreated(response.data.post)
                }
            }, 1000)
        } catch (err) {
            console.error('Failed to create post:', err)
            setError(err.response?.data?.error || 'Failed to create post')
        } finally {
            setLoading(false)
        }
    }

    // Cleanup previews on unmount
    useEffect(() => {
        return () => {
            mediaPreviews.forEach(preview => URL.revokeObjectURL(preview.url))
        }
    }, [])

    if (success) {
        return (
            <div className="create-post-overlay" onClick={onClose}>
                <div className="create-post-modal success-modal" onClick={e => e.stopPropagation()}>
                    <div className="success-content">
                        <div className="success-icon">
                            <Check size={48} />
                        </div>
                        <h2>Post Created!</h2>
                        <p>Your post is now visible to people nearby</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="create-post-overlay" onClick={onClose}>
            <div className="create-post-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Post</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Post Type Selector */}
                    <div className="post-type-selector">
                        {POST_TYPES.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                className={`type-option ${postType === type.id ? 'active' : ''}`}
                                onClick={() => setPostType(type.id)}
                            >
                                <span className="type-icon">{type.icon}</span>
                                <span className="type-label">{type.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Media Upload */}
                    <div
                        className={`media-upload-area ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {mediaPreviews.length === 0 ? (
                            <div className="upload-placeholder">
                                <div className="upload-icon">
                                    <Upload size={40} />
                                </div>
                                <p>Drag & drop images or videos</p>
                                <button
                                    type="button"
                                    className="browse-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Browse Files
                                </button>
                                <span className="upload-hint">Max 50MB per file</span>
                            </div>
                        ) : (
                            <div className="media-previews">
                                {mediaPreviews.map((preview, index) => (
                                    <div key={index} className="preview-item">
                                        {preview.type === 'video' ? (
                                            <video src={preview.url} />
                                        ) : (
                                            <img src={preview.url} alt="" />
                                        )}
                                        <button
                                            type="button"
                                            className="remove-preview"
                                            onClick={() => removeMedia(index)}
                                        >
                                            <X size={16} />
                                        </button>
                                        <span className="media-type-badge">
                                            {preview.type === 'video' ? <Video size={12} /> : <Image size={12} />}
                                        </span>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="add-more-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={24} />
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileSelect}
                            hidden
                        />
                    </div>

                    {/* Caption */}
                    <div className="caption-section">
                        <textarea
                            placeholder="Share your local knowledge, tips, or story..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows={4}
                            maxLength={2000}
                        />
                        <div className="caption-footer">
                            <span className="char-count">{caption.length}/2000</span>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="location-section">
                        <div className="location-header">
                            <MapPin size={18} />
                            <span>Location</span>
                            <button
                                type="button"
                                className="refresh-location-btn"
                                onClick={refreshLocation}
                                disabled={fetchingLocation}
                            >
                                {fetchingLocation ? (
                                    <Loader size={14} className="spin" />
                                ) : (
                                    <Navigation size={14} />
                                )}
                                Refresh
                            </button>
                        </div>
                        <div className="location-display">
                            {fetchingLocation ? (
                                <span className="loading">Getting location...</span>
                            ) : locationName ? (
                                <span>{locationName}</span>
                            ) : location ? (
                                <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                            ) : (
                                <span className="error">Location unavailable</span>
                            )}
                        </div>
                    </div>

                    {/* Visibility Radius */}
                    <div className="radius-section">
                        <div className="radius-header">
                            <span>Visibility Radius</span>
                            <span className="radius-value">{visibilityRadius} km</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={visibilityRadius}
                            onChange={(e) => setVisibilityRadius(Number(e.target.value))}
                            className="radius-slider"
                        />
                        <div className="radius-labels">
                            <span>1 km</span>
                            <span>50 km</span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading || (!caption.trim() && mediaFiles.length === 0)}
                    >
                        {loading ? (
                            <>
                                <Loader size={20} className="spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Post to Nearby
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreatePost
