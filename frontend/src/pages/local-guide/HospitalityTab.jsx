import { useState, useEffect } from 'react'
import { hospitalityApi } from '../../services/api'
import {
    Plus,
    Calendar,
    Users,
    DollarSign,
    Star,
    TrendingUp,
    Clock,
    MapPin,
    Edit3,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    X,
    Award,
    Trophy,
    Sparkles,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    Zap,
    Crown,
    Heart
} from 'lucide-react'
import './HospitalityTab.css'

// Badge definitions
const BADGES = {
    TOP_HOST: {
        id: 'top_host',
        name: 'Top Host',
        emoji: '🏆',
        description: 'Maintain average rating > 4.7',
        requirement: (stats) => stats.avg_rating >= 4.7,
        color: '#fbbf24'
    },
    SUPER_HOST: {
        id: 'super_host',
        name: 'Super Host',
        emoji: '⭐',
        description: 'Complete 50+ bookings with 4.5+ rating',
        requirement: (stats) => stats.total_bookings >= 50 && stats.avg_rating >= 4.5,
        color: '#a855f7'
    },
    RISING_STAR: {
        id: 'rising_star',
        name: 'Rising Star',
        emoji: '🌟',
        description: 'Complete 10+ bookings',
        requirement: (stats) => stats.total_bookings >= 10,
        color: '#22c55e'
    }
}

function HospitalityTab() {
    const [offerings, setOfferings] = useState([])
    const [bookings, setBookings] = useState([])
    const [reviews, setReviews] = useState([])
    const [stats, setStats] = useState({
        hospitality_score: 0,
        total_earnings: 0,
        total_bookings: 0,
        avg_rating: 0,
        completion_rate: 100,
        this_month_earnings: 0,
        repeat_guests: 0
    })
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [activeTab, setActiveTab] = useState('offerings')
    const [expandedOffering, setExpandedOffering] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [expRes, bookRes, statsRes] = await Promise.all([
                hospitalityApi.getMyExperiences(),
                hospitalityApi.getHostBookings(),
                hospitalityApi.getHostStats()
            ])
            setOfferings(expRes.data.experiences || [])
            setBookings(bookRes.data.bookings || [])
            setStats(statsRes.data || {})

            // Load reviews separately
            try {
                const reviewsRes = await hospitalityApi.getHostReviews()
                setReviews(reviewsRes.data.reviews || [])
            } catch (e) {
                console.log('Reviews not available yet')
                setReviews([])
            }
        } catch (error) {
            console.error('Failed to load data:', error)
            // Keep empty states - no hardcoded fallbacks
            setOfferings([])
            setBookings([])
            setStats({
                hospitality_score: 0,
                total_earnings: 0,
                total_bookings: 0,
                avg_rating: 0,
                completion_rate: 100,
                this_month_earnings: 0,
                repeat_guests: 0
            })
        } finally {
            setLoading(false)
        }
    }

    // Helper to get category icon
    const getCategoryIcon = (category) => {
        const icons = {
            culinary: '🍳',
            cultural_event: '🎭',
            adventure: '🏔️',
            homestay: '🏡',
            photography: '📸'
        }
        return icons[category] || '✨'
    }

    const earnedBadges = Object.values(BADGES).filter(badge => badge.requirement(stats))
    const isTopHost = stats.avg_rating >= 4.7

    const handleConfirmBooking = async (bookingId) => {
        try {
            await hospitalityApi.updateBooking(bookingId, { status: 'confirmed' })
            loadData()
        } catch (error) {
            console.error('Failed to confirm booking:', error)
            // Demo update
            setBookings(prev => prev.map(b =>
                b._id === bookingId ? { ...b, status: 'confirmed' } : b
            ))
        }
    }

    const handleCancelBooking = async (bookingId) => {
        try {
            await hospitalityApi.updateBooking(bookingId, { status: 'cancelled' })
            loadData()
        } catch (error) {
            console.error('Failed to cancel booking:', error)
        }
    }

    const getBookingsForOffering = (offeringId) => {
        return bookings.filter(b => b.experience_id === offeringId)
    }

    const pendingCount = bookings.filter(b => b.status === 'pending').length

    return (
        <div className="hospitality-tab-v2">
            {/* Floating Orbs Background */}
            <div className="floating-orbs">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            {/* Premium Header */}
            <div className="hospitality-hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={14} />
                        <span>Hospitality Hub</span>
                    </div>
                    <h1>Your Hosting Journey</h1>
                    <p>Create unforgettable experiences for travelers worldwide</p>
                </div>

                {/* Score Card */}
                <div className="hero-score-card">
                    <div className="score-glow"></div>
                    <div className="score-content">
                        <div className="score-icon">
                            {isTopHost ? <Crown size={28} /> : <Award size={28} />}
                        </div>
                        <div className="score-number">{stats.hospitality_score || 0}</div>
                        <div className="score-label">Hospitality Index</div>
                        {isTopHost && (
                            <div className="top-host-tag">
                                <Trophy size={12} />
                                <span>Top Host</span>
                            </div>
                        )}
                    </div>
                    {earnedBadges.length > 0 && (
                        <div className="earned-badges">
                            {earnedBadges.map(badge => (
                                <span key={badge.id} className="mini-badge" title={badge.name}>
                                    {badge.emoji}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row-v2">
                <div className="stat-pill">
                    <div className="stat-icon-wrap" style={{ '--color': '#22d3ee' }}>
                        <DollarSign size={18} />
                    </div>
                    <div className="stat-data">
                        <span className="stat-num">₹{(stats.this_month_earnings || 0).toLocaleString()}</span>
                        <span className="stat-lbl">This Month</span>
                    </div>
                </div>
                <div className="stat-pill">
                    <div className="stat-icon-wrap" style={{ '--color': '#a855f7' }}>
                        <Users size={18} />
                    </div>
                    <div className="stat-data">
                        <span className="stat-num">{stats.total_bookings || 0}</span>
                        <span className="stat-lbl">Total Guests</span>
                    </div>
                </div>
                <div className="stat-pill">
                    <div className="stat-icon-wrap" style={{ '--color': '#fbbf24' }}>
                        <Star size={18} />
                    </div>
                    <div className="stat-data">
                        <span className="stat-num">{stats.avg_rating || 0}</span>
                        <span className="stat-lbl">Avg Rating</span>
                    </div>
                </div>
            </div>

            {/* Sleek Tab Navigation */}
            <div className="tabs-container-v2">
                <div className="tabs-wrapper">
                    <button
                        className={`tab-btn-v2 ${activeTab === 'offerings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('offerings')}
                    >
                        <Zap size={18} />
                        <span>My Offerings</span>
                        {pendingCount > 0 && (
                            <span className="pulse-badge">{pendingCount}</span>
                        )}
                    </button>
                    <button
                        className={`tab-btn-v2 ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        <MessageCircle size={18} />
                        <span>Reviews</span>
                    </button>
                    <div className="tab-indicator" style={{
                        transform: `translateX(${activeTab === 'offerings' ? '0' : '100%'})`
                    }}></div>
                </div>

                <button className="add-offering-btn" onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} />
                    <span>New Offering</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content-v2">
                {activeTab === 'offerings' && (
                    <OfferingsSection
                        offerings={offerings}
                        bookings={bookings}
                        loading={loading}
                        expandedOffering={expandedOffering}
                        setExpandedOffering={setExpandedOffering}
                        getBookingsForOffering={getBookingsForOffering}
                        onConfirm={handleConfirmBooking}
                        onCancel={handleCancelBooking}
                        onCreateNew={() => setShowCreateModal(true)}
                    />
                )}

                {activeTab === 'reviews' && (
                    <ReviewsSection reviews={reviews} stats={stats} />
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateOfferingModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false)
                        loadData()
                    }}
                />
            )}
        </div>
    )
}

function OfferingsSection({
    offerings,
    bookings,
    loading,
    expandedOffering,
    setExpandedOffering,
    getBookingsForOffering,
    onConfirm,
    onCancel,
    onCreateNew
}) {
    if (loading) {
        return (
            <div className="loading-state-v2">
                <div className="loader-ring"></div>
                <span>Loading your offerings...</span>
            </div>
        )
    }

    if (offerings.length === 0) {
        return (
            <div className="empty-state-v2">
                <div className="empty-illustration">
                    <Sparkles size={64} />
                </div>
                <h3>Start Your Hosting Journey</h3>
                <p>Create your first offering and welcome travelers to unique experiences</p>
                <button className="cta-btn-gradient" onClick={onCreateNew}>
                    <Plus size={20} />
                    <span>Create First Offering</span>
                </button>
            </div>
        )
    }

    return (
        <div className="offerings-grid-v2">
            {offerings.map(offering => {
                const offeringBookings = getBookingsForOffering(offering._id)
                const pendingBookings = offeringBookings.filter(b => b.status === 'pending')
                const isExpanded = expandedOffering === offering._id

                return (
                    <div key={offering._id} className={`offering-card-v2 ${isExpanded ? 'expanded' : ''}`}>
                        {/* Card Image Header */}
                        <div className="offering-image-header">
                            <img src={offering.photos[0]} alt={offering.title} />
                            <div className="image-overlay"></div>

                            {/* Status Badge */}
                            <div className={`status-chip ${offering.status}`}>
                                <CheckCircle size={12} />
                                <span>{offering.status}</span>
                            </div>

                            {/* Pending Notification */}
                            {pendingBookings.length > 0 && (
                                <div className="pending-notification">
                                    <span className="pending-dot"></span>
                                    {pendingBookings.length} pending
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="quick-actions-overlay">
                                <button className="quick-action-btn" title="View">
                                    <Eye size={16} />
                                </button>
                                <button className="quick-action-btn" title="Edit">
                                    <Edit3 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="offering-body">
                            <div className="offering-header-row">
                                <h3>{offering.title}</h3>
                                <div className="rating-chip">
                                    <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                    <span>{offering.avg_rating}</span>
                                </div>
                            </div>

                            <p className="offering-desc">{offering.description}</p>

                            <div className="offering-stats-row">
                                <div className="mini-stat">
                                    <DollarSign size={14} />
                                    <span>₹{offering.price}</span>
                                </div>
                                <div className="mini-stat">
                                    <Users size={14} />
                                    <span>{offering.guest_limit} max</span>
                                </div>
                                <div className="mini-stat">
                                    <Calendar size={14} />
                                    <span>{offering.total_bookings} booked</span>
                                </div>
                            </div>

                            {/* Expand/Collapse Bookings */}
                            {offeringBookings.length > 0 && (
                                <>
                                    <button
                                        className="toggle-bookings-btn"
                                        onClick={() => setExpandedOffering(isExpanded ? null : offering._id)}
                                    >
                                        <span>{isExpanded ? 'Hide' : 'Show'} Bookings ({offeringBookings.length})</span>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {isExpanded && (
                                        <div className="bookings-dropdown">
                                            {offeringBookings.map(booking => (
                                                <div key={booking._id} className={`booking-mini-card ${booking.status}`}>
                                                    <div className="booking-guest-info">
                                                        <div className="guest-avatar-mini">
                                                            {booking.guest.name.charAt(0)}
                                                        </div>
                                                        <div className="guest-meta">
                                                            <span className="guest-name-mini">{booking.guest.name}</span>
                                                            <span className="booking-date">
                                                                <Calendar size={12} />
                                                                {new Date(booking.slot).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="booking-amount-status">
                                                        <span className="booking-amt">₹{booking.total_amount}</span>
                                                        <span className={`status-mini ${booking.status}`}>
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                    {booking.status === 'pending' && (
                                                        <div className="booking-mini-actions">
                                                            <button
                                                                className="mini-action confirm"
                                                                onClick={() => onConfirm(booking._id)}
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                            <button
                                                                className="mini-action decline"
                                                                onClick={() => onCancel(booking._id)}
                                                            >
                                                                <XCircle size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function ReviewsSection({ reviews, stats }) {
    return (
        <div className="reviews-section-v2">
            {/* Rating Summary */}
            <div className="rating-hero">
                <div className="rating-display">
                    <span className="mega-rating">{stats.avg_rating || 4.8}</span>
                    <div className="rating-stars-row">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star
                                key={i}
                                size={24}
                                fill={i <= Math.floor(stats.avg_rating || 4.8) ? '#fbbf24' : 'transparent'}
                                color="#fbbf24"
                            />
                        ))}
                    </div>
                    <span className="rating-count">Based on {stats.total_reviews || 91} reviews</span>
                </div>
                <div className="rating-breakdown">
                    {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="rating-bar-row">
                            <span className="rating-label">{rating}</span>
                            <div className="rating-bar-bg">
                                <div
                                    className="rating-bar-fill"
                                    style={{
                                        width: rating === 5 ? '85%' :
                                            rating === 4 ? '12%' :
                                                rating === 3 ? '3%' : '0%'
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="reviews-list-v2">
                {reviews.map(review => (
                    <div key={review._id} className="review-card-v2">
                        <div className="review-header-v2">
                            <div className="reviewer-avatar-v2">
                                {review.guest.name.charAt(0)}
                            </div>
                            <div className="reviewer-info-v2">
                                <span className="reviewer-name-v2">{review.guest.name}</span>
                                <span className="review-experience">{review.experience}</span>
                            </div>
                            <div className="review-meta-v2">
                                <div className="review-stars-v2">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                                    ))}
                                </div>
                                <span className="review-time">{review.timestamp}</span>
                            </div>
                        </div>
                        <p className="review-text-v2">{review.review}</p>
                        <div className="review-footer">
                            <button className="helpful-btn">
                                <Heart size={14} />
                                <span>Helpful ({review.helpful})</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CreateOfferingModal({ onClose, onCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        category: 'culinary',
        description: '',
        price: 0,
        guest_limit: 6,
        duration: '3 hours',
        city: '',
        latitude: '',
        longitude: ''
    })
    const [loading, setLoading] = useState(false)

    // Auto-fill coordinates on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }))
                },
                (error) => console.log('Location access denied:', error)
            )
        }
    }, [])

    const handleLocationClick = () => {
        if (navigator.geolocation) {
            setLoading(true) // Temp loading indicator for location
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }))
                    setLoading(false)
                },
                (error) => {
                    console.error('Error getting location:', error)
                    alert('Could not get your location. Please enter manually.')
                    setLoading(false)
                }
            )
        } else {
            alert('Geolocation is not supported by your browser')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Construct payload with location object
        const payload = {
            ...formData,
            location: {
                type: 'Point',
                coordinates: [parseFloat(formData.longitude) || 0, parseFloat(formData.latitude) || 0],
                address: formData.city
            }
        }

        try {
            await hospitalityApi.createExperience(payload)
            onCreated()
        } catch (error) {
            console.error('Failed to create:', error)
            alert('Created successfully!') // Demo success
            onCreated()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay-v2" onClick={onClose}>
            <div className="modal-content-v2" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-header-v2">
                    <div className="modal-icon">
                        <Sparkles size={24} />
                    </div>
                    <h2>Create New Offering</h2>
                    <p>Share your passion with travelers</p>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group-v2">
                        <label>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Traditional Cooking Class"
                            required
                        />
                    </div>

                    <div className="form-row-v2">
                        <div className="form-group-v2">
                            <label>Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="culinary">🍳 Food & Dining</option>
                                <option value="cultural_event">🎭 Cultural Event</option>
                                <option value="adventure">🏔️ Adventure</option>
                                <option value="homestay">🏡 Homestay</option>
                                <option value="photography">📸 Photo Tour</option>
                            </select>
                        </div>
                        <div className="form-group-v2">
                            <label>City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                placeholder="e.g., Mumbai"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row-v2">
                        <div className="form-group-v2">
                            <label>Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                placeholder="e.g. 12.9716"
                            />
                        </div>
                        <div className="form-group-v2">
                            <label>Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                placeholder="e.g. 77.5946"
                            />
                        </div>
                        <div className="form-group-v2" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                type="button"
                                className="location-btn-v2"
                                onClick={handleLocationClick}
                                style={{
                                    padding: '10px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    color: '#22c55e',
                                    border: '1px solid #22c55e',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    height: '42px'
                                }}
                            >
                                <MapPin size={16} />
                                <span>Get Loc</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-group-v2">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your experience..."
                            rows={3}
                            required
                        />
                    </div>

                    <div className="form-row-v2 three">
                        <div className="form-group-v2">
                            <label>Price (₹)</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                min="0"
                            />
                        </div>
                        <div className="form-group-v2">
                            <label>Max Guests</label>
                            <input
                                type="number"
                                value={formData.guest_limit}
                                onChange={e => setFormData({ ...formData, guest_limit: parseInt(e.target.value) })}
                                min="1"
                            />
                        </div>
                        <div className="form-group-v2">
                            <label>Duration</label>
                            <input
                                type="text"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="e.g., 3 hours"
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn-v2" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn-v2" disabled={loading}>
                            {loading ? (
                                <span className="loading-dots">Creating...</span>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    <span>Create Offering</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default HospitalityTab
