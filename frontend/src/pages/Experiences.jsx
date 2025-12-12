import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { hospitalityApi } from '../services/api'
import {
    MapPin,
    Star,
    Calendar,
    Users,
    Clock,
    Filter,
    Search,
    Heart,
    Share2,
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
    Trophy
} from 'lucide-react'
import './Experiences.css'

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'cultural_event', label: 'Cultural Events', icon: Music },
    { id: 'culinary', label: 'Food & Dining', icon: Utensils },
    { id: 'homestay', label: 'Homestays', icon: Home },
    { id: 'adventure', label: 'Adventures', icon: TreePine },
    { id: 'photography', label: 'Photo Tours', icon: Camera }
]

// Traveller badge definitions
const TRAVELLER_BADGES = {
    CULTURAL_GUEST: {
        id: 'cultural_guest',
        name: 'Cultural Guest',
        emoji: '🎭',
        description: 'Complete 3+ experience bookings',
        requirement: (stats) => stats.completed_bookings >= 3,
        color: '#a855f7'
    },
    EXPERIENCE_SEEKER: {
        id: 'experience_seeker',
        name: 'Experience Seeker',
        emoji: '🌟',
        description: 'Complete 10+ experience bookings',
        requirement: (stats) => stats.completed_bookings >= 10,
        color: '#fbbf24'
    }
}

function ExperiencesMarketplace() {
    const [experiences, setExperiences] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedExperience, setSelectedExperience] = useState(null)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [favorites, setFavorites] = useState([])
    const [userStats, setUserStats] = useState({ completed_bookings: 0, total_bookings: 0 })
    const { themeColors } = useTheme()

    // Calculate earned badges
    const earnedBadges = Object.values(TRAVELLER_BADGES).filter(badge => badge.requirement(userStats))
    const isCulturalGuest = userStats.completed_bookings >= 3

    useEffect(() => {
        loadExperiences()
        loadUserStats()
    }, [selectedCategory])

    const loadUserStats = async () => {
        try {
            const response = await hospitalityApi.getMyBookings()
            const bookings = response.data.bookings || []
            const completed = bookings.filter(b => b.status === 'completed').length
            setUserStats({ completed_bookings: completed, total_bookings: bookings.length })
        } catch (error) {
            // Demo stats
            setUserStats({ completed_bookings: 4, total_bookings: 6 })
        }
    }

    const loadExperiences = async () => {
        setLoading(true)
        try {
            const response = await hospitalityApi.getNearbyExperiences({
                category: selectedCategory !== 'all' ? selectedCategory : undefined
            })
            setExperiences(response.data.experiences || [])
        } catch (error) {
            console.error('Failed to load experiences:', error)
            // Use sample data for now
            setExperiences(getSampleExperiences())
        } finally {
            setLoading(false)
        }
    }

    const getSampleExperiences = () => [
        {
            _id: '1',
            title: 'Attend a Traditional Marwari Wedding',
            category: 'cultural_event',
            host: { name: 'Aarti Sharma', rating: 4.9, verified: true, hospitality_score: 92.5 },
            price: 0,
            guest_limit: 15,
            city: 'Jaipur',
            description: 'Experience the grandeur of a traditional Rajasthani wedding with authentic rituals, music, and cuisine.',
            photos: ['https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=400'],
            avg_rating: 4.9,
            reviews_count: 47,
            slots: ['2025-12-20T18:00', '2025-12-25T17:00'],
            duration: '6 hours',
            includes: ['Traditional attire rental', 'Dinner', 'Photography']
        },
        {
            _id: '2',
            title: 'Pongal Celebration with Local Family',
            category: 'culinary',
            host: { name: 'Meera Krishnan', rating: 4.8, verified: true, hospitality_score: 88.2 },
            price: 500,
            guest_limit: 8,
            city: 'Chennai',
            description: 'Join a Tamil family for authentic Pongal celebration with cooking session and cultural storytelling.',
            photos: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'],
            avg_rating: 4.8,
            reviews_count: 32,
            slots: ['2025-01-14T08:00', '2025-01-15T08:00'],
            duration: '4 hours',
            includes: ['Breakfast', 'Pongal preparation', 'Photo session']
        },
        {
            _id: '3',
            title: 'Sunrise Trek & Breakfast at Heritage Homestay',
            category: 'adventure',
            host: { name: 'Ravi Kumar', rating: 4.7, verified: true, hospitality_score: 85.0 },
            price: 1200,
            guest_limit: 6,
            city: 'Coorg',
            description: 'Start your day with a guided sunrise trek through coffee plantations, ending with a traditional Kodava breakfast.',
            photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
            avg_rating: 4.7,
            reviews_count: 89,
            slots: ['2025-12-18T05:30', '2025-12-19T05:30', '2025-12-20T05:30'],
            duration: '5 hours',
            includes: ['Guide', 'Breakfast', 'Coffee tasting']
        },
        {
            _id: '4',
            title: 'Street Food Walking Tour with Local Foodie',
            category: 'culinary',
            host: { name: 'Akash Patel', rating: 4.9, verified: true, hospitality_score: 94.1 },
            price: 800,
            guest_limit: 10,
            city: 'Ahmedabad',
            description: 'Explore the hidden gems of Ahmedabad\'s street food scene with a passionate local foodie.',
            photos: ['https://images.unsplash.com/photo-1567337710282-00832b415979?w=400'],
            avg_rating: 4.9,
            reviews_count: 156,
            slots: ['2025-12-15T17:00', '2025-12-16T17:00', '2025-12-17T17:00'],
            duration: '3 hours',
            includes: ['8+ tastings', 'Walking tour', 'Local stories']
        }
    ]

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

    const handleBookExperience = (experience) => {
        setSelectedExperience(experience)
        setShowBookingModal(true)
    }

    return (
        <div className="experiences-marketplace">
            {/* User Badges Section (if earned) */}
            {earnedBadges.length > 0 && (
                <div className="user-badges-bar">
                    <span className="badges-label">Your Badges:</span>
                    {earnedBadges.map(badge => (
                        <span
                            key={badge.id}
                            className="user-badge"
                            style={{ '--badge-color': badge.color }}
                        >
                            {badge.emoji} {badge.name}
                        </span>
                    ))}
                    <span className="bookings-count">
                        {userStats.completed_bookings} experiences completed
                    </span>
                </div>
            )}

            {/* Hero Section */}
            <div className="marketplace-hero">
                <div className="hero-content">
                    <h1>Discover Authentic Experiences</h1>
                    <p>Connect with local hosts for unforgettable cultural immersion</p>

                    {/* Search Bar */}
                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search experiences, cities, or keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <button className="filter-btn">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-value">500+</span>
                        <span className="stat-label">Experiences</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">200+</span>
                        <span className="stat-label">Verified Hosts</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">4.8</span>
                        <span className="stat-label">Avg Rating</span>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="categories-section">
                <div className="categories-scroll">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            <cat.icon size={18} />
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recommended Section */}
            <div className="section-header">
                <h2>✨ Recommended for You</h2>
                <span className="ai-badge">
                    <Sparkles size={14} />
                    AI Matched
                </span>
            </div>

            {/* Experience Grid */}
            {loading ? (
                <div className="loading-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="experience-card skeleton">
                            <div className="skeleton-image"></div>
                            <div className="skeleton-content">
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line short"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="experiences-grid">
                    {filteredExperiences.map(experience => (
                        <div key={experience._id} className="experience-card">
                            <div className="card-image">
                                <img src={experience.photos[0]} alt={experience.title} />
                                <div className="card-badges">
                                    {experience.host.verified && (
                                        <span className="verified-badge">
                                            <CheckCircle size={12} />
                                            Verified Host
                                        </span>
                                    )}
                                </div>
                                <button
                                    className={`favorite-btn ${favorites.includes(experience._id) ? 'active' : ''}`}
                                    onClick={() => toggleFavorite(experience._id)}
                                >
                                    <Heart size={20} fill={favorites.includes(experience._id) ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            <div className="card-content">
                                <div className="card-header">
                                    <span className="category-tag">
                                        {CATEGORIES.find(c => c.id === experience.category)?.label || 'Experience'}
                                    </span>
                                    <span className="city-tag">
                                        <MapPin size={12} />
                                        {experience.city}
                                    </span>
                                </div>

                                <h3 className="card-title">{experience.title}</h3>

                                <div className="host-info">
                                    <div className="host-avatar">
                                        {experience.host.name.charAt(0)}
                                    </div>
                                    <div className="host-details">
                                        <span className="host-name">{experience.host.name}</span>
                                        <div className="host-rating">
                                            <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                            <span>{experience.host.rating}</span>
                                            <span className="hospitality-score">
                                                <Award size={12} />
                                                {experience.host.hospitality_score}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-meta">
                                    <span><Clock size={14} /> {experience.duration}</span>
                                    <span><Users size={14} /> Up to {experience.guest_limit}</span>
                                </div>

                                <div className="card-footer">
                                    <div className="price-info">
                                        {experience.price === 0 ? (
                                            <span className="price free">Free</span>
                                        ) : (
                                            <span className="price">₹{experience.price}</span>
                                        )}
                                        <span className="per-person">per person</span>
                                    </div>
                                    <button
                                        className="book-btn"
                                        onClick={() => handleBookExperience(experience)}
                                    >
                                        Book Now
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedExperience && (
                <BookingModal
                    experience={selectedExperience}
                    onClose={() => {
                        setShowBookingModal(false)
                        setSelectedExperience(null)
                    }}
                />
            )}
        </div>
    )
}

function BookingModal({ experience, onClose }) {
    const [selectedSlot, setSelectedSlot] = useState('')
    const [guests, setGuests] = useState(1)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    const handleBooking = async () => {
        if (!selectedSlot) return

        setLoading(true)
        try {
            await hospitalityApi.createBooking({
                experience_id: experience._id,
                slot: selectedSlot,
                guests: guests
            })
            setStep(3) // Success
        } catch (error) {
            console.error('Booking failed:', error)
            alert('Booking failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="booking-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                {step === 1 && (
                    <>
                        <div className="modal-header">
                            <img src={experience.photos[0]} alt="" className="modal-image" />
                            <div className="modal-title">
                                <h2>{experience.title}</h2>
                                <p>Hosted by {experience.host.name}</p>
                            </div>
                        </div>

                        <div className="modal-body">
                            <h3>Select Date & Time</h3>
                            <div className="slots-grid">
                                {experience.slots.map(slot => {
                                    const date = new Date(slot)
                                    return (
                                        <button
                                            key={slot}
                                            className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            <Calendar size={16} />
                                            <span className="slot-date">
                                                {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <span className="slot-time">
                                                {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            <h3>Number of Guests</h3>
                            <div className="guests-selector">
                                <button
                                    onClick={() => setGuests(Math.max(1, guests - 1))}
                                    disabled={guests <= 1}
                                >-</button>
                                <span>{guests}</span>
                                <button
                                    onClick={() => setGuests(Math.min(experience.guest_limit, guests + 1))}
                                    disabled={guests >= experience.guest_limit}
                                >+</button>
                            </div>

                            <div className="what-included">
                                <h3>What's Included</h3>
                                <ul>
                                    {experience.includes?.map((item, i) => (
                                        <li key={i}>
                                            <CheckCircle size={16} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <div className="total-price">
                                <span>Total</span>
                                <span className="amount">
                                    {experience.price === 0 ? 'Free' : `₹${experience.price * guests}`}
                                </span>
                            </div>
                            <button
                                className="confirm-btn"
                                onClick={() => setStep(2)}
                                disabled={!selectedSlot}
                            >
                                Continue to Payment
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="payment-step">
                        <h2>Confirm Booking</h2>
                        <div className="booking-summary">
                            <p><strong>Experience:</strong> {experience.title}</p>
                            <p><strong>Date:</strong> {new Date(selectedSlot).toLocaleString()}</p>
                            <p><strong>Guests:</strong> {guests}</p>
                            <p><strong>Total:</strong> {experience.price === 0 ? 'Free' : `₹${experience.price * guests}`}</p>
                        </div>
                        <button
                            className="confirm-btn"
                            onClick={handleBooking}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Confirm Booking'}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="success-step">
                        <div className="success-icon">🎉</div>
                        <h2>Booking Confirmed!</h2>
                        <p>You'll receive a confirmation email with details. The host will contact you soon.</p>
                        <button className="done-btn" onClick={onClose}>Done</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExperiencesMarketplace
