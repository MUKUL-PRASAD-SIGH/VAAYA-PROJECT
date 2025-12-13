import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { userApi, localGuideApi } from '../../services/api'
import './Profile.css'

function Profile() {
    const { t } = useLanguage()
    const { currentUser, logout } = useAuth()
    const { themeColors } = useTheme()
    const [isEditing, setIsEditing] = useState(false)
    const [showAchievements, setShowAchievements] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const [profileData, setProfileData] = useState({
        name: currentUser?.displayName || 'Local Guide',
        email: currentUser?.email || 'guide@example.com',
        phone: '',
        bio: '',
        languages: ['English', 'Kannada'],
        specialties: ['Heritage Tours', 'Cultural Experiences'],
        location: 'Karnataka',
        experience: '1+ years',
        responseTime: '< 1 hour',
        verified: false,
        rating: 0,
        totalReviews: 0,
        joinedDate: 'December 2025'
    })

    const [stats, setStats] = useState({
        totalEarnings: 0,
        questsCreated: 0,
        questsCompleted: 0,
        travelersHelped: 0,
        storiesShared: 0,
        cleanupKg: 0
    })

    useEffect(() => {
        loadProfile()
        loadStats()
    }, [])

    const loadProfile = async () => {
        try {
            setLoading(true)
            const userId = localStorage.getItem('userId')
            if (userId) {
                const response = await userApi.getProfile(userId)
                const userData = response.data
                setProfileData(prev => ({
                    ...prev,
                    name: userData.name || prev.name,
                    email: userData.email || prev.email,
                    phone: userData.phone || '',
                    bio: userData.bio || '',
                    languages: userData.languages || prev.languages,
                    specialties: userData.specialties || prev.specialties,
                    location: userData.location?.name || prev.location,
                    verified: userData.verified || false,
                    rating: userData.rating || 0,
                    totalReviews: userData.reviews_count || 0
                }))
            }
        } catch (error) {
            console.error('Failed to load profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const response = await localGuideApi.getAnalytics('all')
            const data = response.data.overview || {}
            setStats({
                totalEarnings: response.data.earnings?.total || 0,
                questsCreated: data.total_quests || 0,
                questsCompleted: data.total_completions || 0,
                travelersHelped: data.total_completions || 0,
                storiesShared: data.content_posts || 0,
                cleanupKg: Math.floor(data.total_completions * 0.5) || 0
            })
        } catch (error) {
            console.error('Failed to load stats:', error)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setProfileData(prev => ({ ...prev, [name]: value }))
    }

    const handleSaveProfile = async () => {
        try {
            setSaving(true)
            await userApi.updateProfile({
                name: profileData.name,
                phone: profileData.phone,
                bio: profileData.bio,
                languages: profileData.languages,
                specialties: profileData.specialties,
                location: { name: profileData.location }
            })
            setMessage({ type: 'success', text: 'Profile saved successfully!' })
            setIsEditing(false)
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save profile' })
        } finally {
            setSaving(false)
        }
    }

    const achievements = [
        { icon: '🌟', name: 'Cultural Ambassador', desc: 'Shared 25+ stories', earned: stats.storiesShared >= 25 },
        { icon: '♻️', name: 'Eco Warrior', desc: '200kg+ trash collected', earned: stats.cleanupKg >= 200 },
        { icon: '💬', name: 'Super Helper', desc: '100+ travelers helped', earned: stats.travelersHelped >= 100 },
        { icon: '🏆', name: 'Top Guide', desc: 'Top 10 in region', earned: profileData.rating >= 4.5 },
        { icon: '⭐', name: '5-Star Guide', desc: 'Maintain 4.9+ rating', earned: profileData.rating >= 4.9 },
        { icon: '🎯', name: 'Quest Master', desc: 'Create 50 quests', earned: stats.questsCreated >= 50 }
    ]

    const recentReviews = [
        { id: 1, traveler: 'Traveler', rating: 5, comment: 'Great experience!', date: 'Recently' }
    ]

    return (
        <div className="profile-page">
            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-cover">
                    <div className="cover-gradient"></div>
                </div>
                <div className="profile-info-section">
                    <div className="profile-avatar">
                        <span className="avatar-emoji">🧭</span>
                        {profileData.verified && (
                            <span className="verified-badge" title="Verified Guide">✓</span>
                        )}
                    </div>
                    <div className="profile-details">
                        <h1>{profileData.name}</h1>
                        <p className="profile-location">📍 {profileData.location}</p>
                        <div className="profile-badges">
                            <span className="badge verified">✓ Verified Guide</span>
                            <span className="badge experience">🎖️ {profileData.experience}</span>
                            <span className="badge rating">⭐ {profileData.rating} ({profileData.totalReviews} reviews)</span>
                        </div>
                    </div>
                    <div className="profile-actions">
                        <button
                            className="edit-profile-btn"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? '✕ Cancel' : `✏️ ${t('editProfile')}`}
                        </button>
                        <button className="share-profile-btn">🔗 Share</button>
                    </div>
                </div>
            </div>

            <div className="profile-content">
                {/* Left Column */}
                <div className="profile-main">
                    {/* Bio Section */}
                    <div className="profile-card bio-card">
                        <h3>About Me</h3>
                        {isEditing ? (
                            <textarea
                                name="bio"
                                value={profileData.bio}
                                onChange={handleInputChange}
                                className="bio-textarea"
                                rows={4}
                            />
                        ) : (
                            <p>{profileData.bio}</p>
                        )}
                    </div>

                    {/* Specialties */}
                    <div className="profile-card">
                        <h3>Specialties</h3>
                        <div className="specialty-tags">
                            {profileData.specialties.map((specialty, index) => (
                                <span key={index} className="specialty-tag">{specialty}</span>
                            ))}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="profile-card">
                        <h3>{t('languages')}</h3>
                        <div className="language-tags">
                            {profileData.languages.map((lang, index) => (
                                <span key={index} className="language-tag">🗣️ {lang}</span>
                            ))}
                        </div>
                    </div>

                    {/* Recent Reviews */}
                    <div className="profile-card reviews-card">
                        <h3>Recent Reviews</h3>
                        <div className="reviews-list">
                            {recentReviews.map(review => (
                                <div key={review.id} className="review-item">
                                    <div className="review-header">
                                        <span className="reviewer-name">{review.traveler}</span>
                                        <span className="review-rating">
                                            {'⭐'.repeat(review.rating)}
                                        </span>
                                    </div>
                                    <p className="review-comment">{review.comment}</p>
                                    <span className="review-date">{review.date}</span>
                                </div>
                            ))}
                        </div>
                        <button className="view-all-btn">View All Reviews →</button>
                    </div>
                </div>

                {/* Right Column */}
                <div className="profile-sidebar">
                    {/* Contact Info */}
                    <div className="profile-card contact-card">
                        <h3>{t('personalInfo')}</h3>
                        <div className="contact-item">
                            <span className="contact-icon">📧</span>
                            {isEditing ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    className="contact-input"
                                />
                            ) : (
                                <span>{profileData.email}</span>
                            )}
                        </div>
                        <div className="contact-item">
                            <span className="contact-icon">📱</span>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleInputChange}
                                    className="contact-input"
                                />
                            ) : (
                                <span>{profileData.phone}</span>
                            )}
                        </div>
                        <div className="contact-item">
                            <span className="contact-icon">⏱️</span>
                            <span>Responds in {profileData.responseTime}</span>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="profile-card stats-card">
                        <h3>Your Impact</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-value">₹{(stats.totalEarnings / 1000).toFixed(0)}k</span>
                                <span className="stat-label">Earned</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.travelersHelped}</span>
                                <span className="stat-label">Travelers</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.questsCompleted}</span>
                                <span className="stat-label">Quests</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.cleanupKg}kg</span>
                                <span className="stat-label">Cleanup</span>
                            </div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="profile-card achievements-card">
                        <h3>Achievements</h3>
                        <div className="achievements-grid">
                            {achievements.slice(0, 4).map((achievement, index) => (
                                <div
                                    key={index}
                                    className={`achievement-item ${achievement.earned ? 'earned' : 'locked'}`}
                                >
                                    <span className="achievement-icon">{achievement.icon}</span>
                                    <span className="achievement-name">{achievement.name}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            className="view-all-btn"
                            onClick={() => setShowAchievements(true)}
                        >
                            View All Achievements →
                        </button>
                    </div>

                    {/* Member Since */}
                    <div className="profile-card member-card">
                        <span className="member-icon">📅</span>
                        <span>Member since {profileData.joinedDate}</span>
                    </div>

                    {/* Danger Zone */}
                    <div className="profile-card danger-zone">
                        <h3>Account</h3>
                        <button className="logout-btn" onClick={logout}>
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button (when editing) */}
            {isEditing && (
                <div className="save-profile-bar">
                    <span>You have unsaved changes</span>
                    <div className="save-actions">
                        <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                            Cancel
                        </button>
                        <button className="save-btn" onClick={handleSaveProfile}>
                            {t('saveChanges')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile
