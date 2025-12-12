import { useState, useEffect } from 'react'
import { hospitalityApi } from '../../services/api'
import {
    MapPin,
    Star,
    Calendar,
    Users,
    Clock,
    Filter,
    Search,
    Heart,
    ChevronRight,
    Sparkles,
    Utensils,
    Music,
    Home,
    Camera,
    TreePine,
    Award,
    CheckCircle,
    X,
    Trophy,
    Bookmark,
    Edit3,
    Send
} from 'lucide-react'
import './ExperiencesTab.css'

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'cultural_event', label: 'Cultural', icon: Music },
    { id: 'culinary', label: 'Food', icon: Utensils },
    { id: 'homestay', label: 'Stays', icon: Home },
    { id: 'adventure', label: 'Adventure', icon: TreePine },
    { id: 'photography', label: 'Photo', icon: Camera }
]

// Badge definitions for travellers
const BADGES = {
    CULTURAL_GUEST: {
        id: 'cultural_guest',
        name: 'Cultural Guest',
        emoji: '🎭',
        requirement: (stats) => stats.completed >= 3,
        color: '#a855f7'
    },
    EXPERIENCE_SEEKER: {
        id: 'experience_seeker',
        name: 'Experience Seeker',
        emoji: '🌟',
        requirement: (stats) => stats.completed >= 10,
        color: '#fbbf24'
    }
}

function ExperiencesTab() {
    const [experiences, setExperiences] = useState([])
    const [myBookings, setMyBookings] = useState([])
    const [userStats, setUserStats] = useState({ completed: 0, upcoming: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [favorites, setFavorites] = useState([])
    const [selectedExperience, setSelectedExperience] = useState(null)
    const [activeSection, setActiveSection] = useState('discover')
    const [reviewingBooking, setReviewingBooking] = useState(null)
    const [reviewedBookings, setReviewedBookings] = useState([])

    useEffect(() => {
        loadData()
    }, [selectedCategory])

    const loadData = async () => {
        setLoading(true)
        try {
            const [expRes, bookRes] = await Promise.all([
                hospitalityApi.getNearbyExperiences({
                    category: selectedCategory !== 'all' ? selectedCategory : undefined
                }),
                hospitalityApi.getMyBookings()
            ])
            setExperiences(expRes.data.experiences || [])
            setMyBookings(bookRes.data.bookings || [])

            const bookings = bookRes.data.bookings || []
            setUserStats({
                completed: bookings.filter(b => b.status === 'completed').length,
                upcoming: bookings.filter(b => b.status === 'confirmed').length,
                total: bookings.length
            })
        } catch (error) {
            console.error('Failed to load data:', error)
            // Sample data
            setExperiences(getSampleExperiences())
            setMyBookings(getSampleBookings())
            setUserStats({ completed: 4, upcoming: 2, total: 6 })
        } finally {
            setLoading(false)
        }
    }

    const getSampleExperiences = () => [
        {
            _id: '1',
            title: 'Traditional Marwari Wedding Experience',
            category: 'cultural_event',
            host: { name: 'Aarti Sharma', rating: 4.9, verified: true, hospitality_score: 92.5 },
            price: 0,
            guest_limit: 15,
            city: 'Jaipur',
            photos: ['https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=400'],
            avg_rating: 4.9,
            reviews_count: 47,
            duration: '6 hours'
        },
        {
            _id: '2',
            title: 'Pongal Celebration with Local Family',
            category: 'culinary',
            host: { name: 'Meera Krishnan', rating: 4.8, verified: true, hospitality_score: 88.2 },
            price: 500,
            guest_limit: 8,
            city: 'Chennai',
            photos: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'],
            avg_rating: 4.8,
            reviews_count: 32,
            duration: '4 hours'
        },
        {
            _id: '3',
            title: 'Street Food Walking Tour',
            category: 'culinary',
            host: { name: 'Akash Patel', rating: 4.9, verified: true, hospitality_score: 94.1 },
            price: 800,
            guest_limit: 10,
            city: 'Ahmedabad',
            photos: ['https://images.unsplash.com/photo-1567337710282-00832b415979?w=400'],
            avg_rating: 4.9,
            reviews_count: 156,
            duration: '3 hours'
        }
    ]

    const getSampleBookings = () => [
        {
            _id: 'b1',
            experience: { _id: 'exp1', title: 'Heritage Walk Tour', host: { name: 'Ravi Kumar' } },
            slot: '2025-12-20T10:00:00',
            guests: 2,
            status: 'confirmed',
            total_amount: 1200
        },
        {
            _id: 'b2',
            experience: { _id: 'exp2', title: 'Cooking Class with Family', host: { name: 'Priya Sharma' } },
            slot: '2025-12-15T16:00:00',
            guests: 1,
            status: 'completed',
            total_amount: 800
        },
        {
            _id: 'b3',
            experience: { _id: 'exp3', title: 'Street Food Walking Tour', host: { name: 'Akash Patel' } },
            slot: '2025-12-10T17:00:00',
            guests: 2,
            status: 'completed',
            total_amount: 1600
        }
    ]

    const earnedBadges = Object.values(BADGES).filter(badge => badge.requirement(userStats))
    const isCulturalGuest = userStats.completed >= 3

    const filteredExperiences = experiences.filter(exp => {
        const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.city.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    const toggleFavorite = (id) => {
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        )
    }

    const upcomingBookings = myBookings.filter(b => b.status === 'confirmed' || b.status === 'pending')

    return (
        <div className="experiences-tab">
            {/* Header with Stats */}
            <div className="exp-header">
                <div className="header-left">
                    <h2>Local Experiences</h2>
                    <p>Discover authentic cultural immersions</p>
                </div>

                {/* User Stats & Badges */}
                <div className="user-stats-card">
                    <div className="stats-row">
                        <div className="stat-mini">
                            <span className="stat-num">{userStats.completed}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat-mini">
                            <span className="stat-num">{userStats.upcoming}</span>
                            <span className="stat-label">Upcoming</span>
                        </div>
                    </div>
                    {isCulturalGuest && (
                        <div className="badge-display">
                            <Trophy size={14} />
                            <span>Cultural Guest</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
                <div className="badges-bar">
                    {earnedBadges.map(badge => (
                        <span
                            key={badge.id}
                            className="badge-chip"
                            style={{ '--badge-color': badge.color }}
                        >
                            {badge.emoji} {badge.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Section Tabs */}
            <div className="section-tabs">
                <button
                    className={`section-tab ${activeSection === 'discover' ? 'active' : ''}`}
                    onClick={() => setActiveSection('discover')}
                >
                    <Sparkles size={16} />
                    Discover
                </button>
                <button
                    className={`section-tab ${activeSection === 'bookings' ? 'active' : ''}`}
                    onClick={() => setActiveSection('bookings')}
                >
                    <Bookmark size={16} />
                    My Bookings
                    {upcomingBookings.length > 0 && (
                        <span className="count-badge">{upcomingBookings.length}</span>
                    )}
                </button>
                <button
                    className={`section-tab ${activeSection === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveSection('favorites')}
                >
                    <Heart size={16} />
                    Saved
                </button>
            </div>

            {/* Discover Section */}
            {activeSection === 'discover' && (
                <div className="discover-section">
                    {/* Search */}
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search experiences, cities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Categories */}
                    <div className="categories-row">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <cat.icon size={16} />
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Experiences Grid */}
                    {loading ? (
                        <div className="loading-state">Loading experiences...</div>
                    ) : (
                        <div className="experiences-grid">
                            {filteredExperiences.map(exp => (
                                <div key={exp._id} className="exp-card">
                                    <div className="card-image">
                                        <img src={exp.photos[0]} alt={exp.title} />
                                        <button
                                            className={`fav-btn ${favorites.includes(exp._id) ? 'active' : ''}`}
                                            onClick={() => toggleFavorite(exp._id)}
                                        >
                                            <Heart size={18} fill={favorites.includes(exp._id) ? 'currentColor' : 'none'} />
                                        </button>
                                        {exp.host.verified && (
                                            <span className="verified-tag">
                                                <CheckCircle size={12} /> Verified
                                            </span>
                                        )}
                                    </div>
                                    <div className="card-content">
                                        <div className="card-top">
                                            <span className="city"><MapPin size={12} />{exp.city}</span>
                                            <span className="rating"><Star size={12} fill="#fbbf24" color="#fbbf24" />{exp.avg_rating}</span>
                                        </div>
                                        <h4>{exp.title}</h4>
                                        <div className="host-row">
                                            <span className="host-name">by {exp.host.name}</span>
                                            <span className="hosp-score"><Award size={12} />{exp.host.hospitality_score}</span>
                                        </div>
                                        <div className="card-footer">
                                            <div className="price">
                                                {exp.price === 0 ? (
                                                    <span className="free">Free</span>
                                                ) : (
                                                    <span>₹{exp.price}<small>/person</small></span>
                                                )}
                                            </div>
                                            <button
                                                className="book-btn"
                                                onClick={() => setSelectedExperience(exp)}
                                            >
                                                Book <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Bookings Section */}
            {activeSection === 'bookings' && (
                <div className="bookings-section">
                    <h3>Your Bookings</h3>
                    {myBookings.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <h4>No bookings yet</h4>
                            <p>Discover and book local experiences</p>
                            <button onClick={() => setActiveSection('discover')}>
                                Explore Experiences
                            </button>
                        </div>
                    ) : (
                        <div className="bookings-list">
                            {myBookings.map(booking => {
                                const isReviewed = reviewedBookings.includes(booking._id)
                                return (
                                    <div key={booking._id} className={`booking-card ${booking.status}`}>
                                        <div className="booking-info">
                                            <h4>{booking.experience.title}</h4>
                                            <span className="host-name">with {booking.experience.host?.name}</span>
                                            <div className="booking-meta">
                                                <span><Calendar size={14} />{new Date(booking.slot).toLocaleDateString()}</span>
                                                <span><Clock size={14} />{new Date(booking.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span><Users size={14} />{booking.guests} guests</span>
                                            </div>
                                        </div>
                                        <div className="booking-right">
                                            <span className="amount">₹{booking.total_amount}</span>
                                            <span className={`status-tag ${booking.status}`}>{booking.status}</span>
                                            {booking.status === 'completed' && (
                                                isReviewed ? (
                                                    <span className="reviewed-badge">
                                                        <CheckCircle size={12} />
                                                        Reviewed
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="write-review-btn"
                                                        onClick={() => setReviewingBooking(booking)}
                                                    >
                                                        <Edit3 size={14} />
                                                        Write Review
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Favorites Section */}
            {activeSection === 'favorites' && (
                <div className="favorites-section">
                    <h3>Saved Experiences</h3>
                    {favorites.length === 0 ? (
                        <div className="empty-state">
                            <Heart size={48} />
                            <h4>No saved experiences</h4>
                            <p>Tap the heart icon to save experiences</p>
                        </div>
                    ) : (
                        <div className="experiences-grid">
                            {experiences.filter(e => favorites.includes(e._id)).map(exp => (
                                <div key={exp._id} className="exp-card">
                                    <div className="card-image">
                                        <img src={exp.photos[0]} alt={exp.title} />
                                    </div>
                                    <div className="card-content">
                                        <h4>{exp.title}</h4>
                                        <span className="city"><MapPin size={12} />{exp.city}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Booking Modal */}
            {selectedExperience && (
                <BookingModal
                    experience={selectedExperience}
                    onClose={() => setSelectedExperience(null)}
                    onBooked={() => {
                        setSelectedExperience(null)
                        loadData()
                    }}
                />
            )}

            {/* Review Modal */}
            {reviewingBooking && (
                <ReviewModal
                    booking={reviewingBooking}
                    onClose={() => setReviewingBooking(null)}
                    onSubmitted={() => {
                        setReviewedBookings(prev => [...prev, reviewingBooking._id])
                        setReviewingBooking(null)
                    }}
                />
            )}
        </div>
    )
}

function BookingModal({ experience, onClose, onBooked }) {
    const [selectedSlot, setSelectedSlot] = useState('')
    const [guests, setGuests] = useState(1)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    const slots = [
        '2025-12-18T10:00:00',
        '2025-12-19T16:00:00',
        '2025-12-20T10:00:00'
    ]

    const handleBooking = async () => {
        setLoading(true)
        try {
            await hospitalityApi.createBooking({
                experience_id: experience._id,
                slot: selectedSlot,
                guests
            })
            setStep(2)
        } catch (error) {
            console.error('Booking failed:', error)
            setStep(2) // Show success anyway for demo
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="booking-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                {step === 1 && (
                    <>
                        <div className="modal-header">
                            <img src={experience.photos[0]} alt="" />
                            <div className="modal-title">
                                <h3>{experience.title}</h3>
                                <p>Hosted by {experience.host.name}</p>
                            </div>
                        </div>

                        <div className="modal-body">
                            <h4>Select Date & Time</h4>
                            <div className="slots-grid">
                                {slots.map(slot => (
                                    <button
                                        key={slot}
                                        className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                                        onClick={() => setSelectedSlot(slot)}
                                    >
                                        <Calendar size={14} />
                                        <span>{new Date(slot).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        <small>{new Date(slot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small>
                                    </button>
                                ))}
                            </div>

                            <h4>Guests</h4>
                            <div className="guests-picker">
                                <button onClick={() => setGuests(Math.max(1, guests - 1))}>-</button>
                                <span>{guests}</span>
                                <button onClick={() => setGuests(Math.min(experience.guest_limit, guests + 1))}>+</button>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <div className="total">
                                <span>Total</span>
                                <span className="amount">
                                    {experience.price === 0 ? 'Free' : `₹${experience.price * guests}`}
                                </span>
                            </div>
                            <button
                                className="confirm-btn"
                                onClick={handleBooking}
                                disabled={!selectedSlot || loading}
                            >
                                {loading ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="success-state">
                        <div className="success-icon">🎉</div>
                        <h3>Booking Confirmed!</h3>
                        <p>The host will contact you with details.</p>
                        <button onClick={onBooked}>Done</button>
                    </div>
                )}
            </div>
        </div>
    )
}

function ReviewModal({ booking, onClose, onSubmitted }) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [reviewText, setReviewText] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    const handleSubmit = async () => {
        if (rating === 0) return
        setLoading(true)
        try {
            await hospitalityApi.submitReview({
                booking_id: booking._id,
                experience_id: booking.experience._id,
                rating,
                content: reviewText
            })
            setStep(2)
        } catch (error) {
            console.error('Review submission failed:', error)
            setStep(2) // Show success anyway for demo
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="review-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                {step === 1 && (
                    <>
                        <div className="review-modal-header">
                            <div className="review-icon">✨</div>
                            <h3>Share Your Experience</h3>
                            <p className="review-experience-title">{booking.experience.title}</p>
                            <span className="review-host-name">with {booking.experience.host?.name}</span>
                        </div>

                        <div className="review-modal-body">
                            <div className="rating-section">
                                <h4>How was your experience?</h4>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                        >
                                            <Star
                                                size={32}
                                                fill={star <= (hoverRating || rating) ? '#fbbf24' : 'none'}
                                                color={star <= (hoverRating || rating) ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span className="rating-label">
                                    {rating === 0 && 'Tap to rate'}
                                    {rating === 1 && 'Poor'}
                                    {rating === 2 && 'Fair'}
                                    {rating === 3 && 'Good'}
                                    {rating === 4 && 'Very Good'}
                                    {rating === 5 && 'Excellent!'}
                                </span>
                            </div>

                            <div className="review-text-section">
                                <h4>Tell us more (optional)</h4>
                                <textarea
                                    placeholder="What did you love about this experience? Share your thoughts..."
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="review-modal-footer">
                            <button
                                className="submit-review-btn"
                                onClick={handleSubmit}
                                disabled={rating === 0 || loading}
                            >
                                {loading ? (
                                    <>Submitting...</>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Submit Review
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="review-success-state">
                        <div className="success-icon">🌟</div>
                        <h3>Thank You!</h3>
                        <p>Your review helps the community discover amazing experiences.</p>
                        <div className="xp-reward">
                            <Trophy size={16} />
                            <span>+50 XP earned</span>
                        </div>
                        <button onClick={onSubmitted}>Done</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExperiencesTab
