import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { localGuideApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import './QuestCreator.css'

// Quest Types - 5 types: photo, video, food, culture, adventure
const QUEST_TYPES = [
    {
        id: 'photo',
        label: 'Photo Quest',
        icon: '📸',
        description: 'Capture stunning photos at specific locations',
        color: '#667eea'
    },
    {
        id: 'video',
        label: 'Video Quest',
        icon: '🎬',
        description: 'Record memorable video moments and experiences',
        color: '#f97316'
    },
    {
        id: 'food',
        label: 'Food Quest',
        icon: '🍜',
        description: 'Discover and taste authentic local cuisine',
        color: '#10b981'
    },
    {
        id: 'culture',
        label: 'Culture Quest',
        icon: '🎭',
        description: 'Immerse in local traditions and heritage',
        color: '#8b5cf6'
    },
    {
        id: 'adventure',
        label: 'Adventure Quest',
        icon: '🏔️',
        description: 'Thrilling outdoor activities and explorations',
        color: '#ef4444'
    }
]

// Difficulty levels
const DIFFICULTY_LEVELS = [
    { id: 'easy', label: 'Easy', color: '#4ade80', description: 'Beginner friendly' },
    { id: 'medium', label: 'Medium', color: '#fbbf24', description: 'Some challenge' },
    { id: 'hard', label: 'Hard', color: '#f97316', description: 'Experienced travelers' },
    { id: 'expert', label: 'Expert', color: '#ef4444', description: 'Maximum difficulty' }
]

// Time limit options
const TIME_LIMITS = [
    { id: '30min', label: '30 Minutes', minutes: 30 },
    { id: '1hr', label: '1 Hour', minutes: 60 },
    { id: '2hr', label: '2 Hours', minutes: 120 },
    { id: '4hr', label: '4 Hours', minutes: 240 },
    { id: '1day', label: '1 Day', minutes: 1440 },
    { id: 'unlimited', label: 'No Limit', minutes: 0 }
]

function QuestCreator() {
    const navigate = useNavigate()
    const { currentUser, loading: authLoading } = useAuth()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [gettingLocation, setGettingLocation] = useState(false)
    const [myQuests, setMyQuests] = useState([])

    // Quest state - persists across all stages
    const [quest, setQuest] = useState({
        // Stage 1
        type: '',
        // Stage 2
        title: '',
        description: '',
        locationName: '',
        coordinates: null,
        timeLimit: '',
        difficulty: '',
        points: 50,
        tips: ''
    })

    useEffect(() => {
        if (authLoading) return

        if (!currentUser) {
            setMessage({ type: 'error', text: 'Please log in to create quests' })
            setLoading(false)
            return
        }
        loadMyQuests()
    }, [currentUser, authLoading])

    const loadMyQuests = async () => {
        try {
            setLoading(true)
            const response = await localGuideApi.getMyQuests()
            setMyQuests(response.data.quests || [])
            setMessage({ type: '', text: '' })
        } catch (error) {
            console.error('Failed to load quests:', error)
            const errorMsg = error.response?.data?.error || 'Failed to load your quests'
            setMessage({ type: 'error', text: `${errorMsg}. Please ensure you're logged in.` })
            setMyQuests([])
        } finally {
            setLoading(false)
        }
    }

    // Handle input changes - state persists when navigating between stages
    const handleInputChange = (field, value) => {
        setQuest(prev => ({ ...prev, [field]: value }))
    }

    // Get current location via GPS
    const getCurrentLocation = () => {
        setGettingLocation(true)
        setMessage({ type: 'info', text: '📍 Getting your location...' })

        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' })
            setGettingLocation(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                setQuest(prev => ({
                    ...prev,
                    coordinates: coords
                }))
                setMessage({ type: 'success', text: '✅ Location captured successfully!' })
                setGettingLocation(false)
            },
            (error) => {
                console.error('Geolocation error:', error)
                let errorMsg = 'Failed to get location. '
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg += 'Please enable location access in your browser settings.'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMsg += 'Location information is unavailable.'
                        break
                    case error.TIMEOUT:
                        errorMsg += 'Location request timed out. Please try again.'
                        break
                    default:
                        errorMsg += 'An unknown error occurred.'
                }
                setMessage({ type: 'error', text: errorMsg })
                setGettingLocation(false)
            },
            {
                enableHighAccuracy: false, // Changed to false for better compatibility
                timeout: 30000, // Increased to 30s
                maximumAge: 0
            }
        )
    }

    // Navigate between stages with validation
    const goToStage = (newStage) => {
        // Validation for moving forward
        if (newStage > step) {
            if (step === 1 && !quest.type) {
                setMessage({ type: 'error', text: 'Please select a quest type first' })
                return
            }
            if (step === 2 && newStage === 3) {
                if (!quest.title.trim()) {
                    setMessage({ type: 'error', text: 'Please enter a quest title' })
                    return
                }
                if (!quest.coordinates) {
                    setMessage({ type: 'error', text: 'Please capture your location (coordinate-based)' })
                    return
                }
                if (!quest.difficulty) {
                    setMessage({ type: 'error', text: 'Please select a difficulty level' })
                    return
                }
            }
        }
        setMessage({ type: '', text: '' })
        setStep(newStage)
    }

    // Submit quest
    const handleSubmit = async () => {
        try {
            setSaving(true)
            setMessage({ type: 'info', text: 'Creating your quest...' })

            const timeMinutes = TIME_LIMITS.find(t => t.id === quest.timeLimit)?.minutes || 60

            const questData = {
                title: quest.title,
                description: quest.description,
                category: quest.type,
                location: {
                    name: quest.locationName || 'Custom Location',
                    coordinates: [quest.coordinates.lng, quest.coordinates.lat]
                },
                reward_points: quest.points,
                difficulty: quest.difficulty,
                estimated_time: timeMinutes,
                verification_type: quest.type === 'video' ? 'video' : 'photo',
                verification_instructions: quest.tips
            }

            const response = await localGuideApi.createQuest(questData)
            setMyQuests([response.data.quest, ...myQuests])
            setMessage({ type: 'success', text: '🎉 Quest created successfully!' })

            // Reset after success
            setTimeout(() => {
                setQuest({
                    type: '',
                    title: '',
                    description: '',
                    locationName: '',
                    coordinates: null,
                    timeLimit: '',
                    difficulty: '',
                    points: 50,
                    tips: ''
                })
                setStep(1)
                setMessage({ type: '', text: '' })
            }, 2000)

        } catch (error) {
            console.error('Failed to create quest:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to create quest. Please try again.'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteQuest = async (questId) => {
        if (!confirm('Are you sure you want to delete this quest?')) return

        try {
            await localGuideApi.deleteQuest(questId)
            setMyQuests(myQuests.filter(q => q._id !== questId))
            setMessage({ type: 'success', text: 'Quest deleted' })
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete quest' })
        }
    }

    const handleToggleActive = async (questId, currentActive) => {
        try {
            await localGuideApi.updateQuest(questId, { active: !currentActive })
            setMyQuests(myQuests.map(q =>
                q._id === questId ? { ...q, active: !currentActive } : q
            ))
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update quest' })
        }
    }

    // Helper functions
    const getQuestType = (typeId) => QUEST_TYPES.find(t => t.id === typeId)
    const getDifficulty = (diffId) => DIFFICULTY_LEVELS.find(d => d.id === diffId)
    const getTimeLimit = (timeId) => TIME_LIMITS.find(t => t.id === timeId)

    // Show loading while auth is initializing
    if (authLoading) {
        return (
            <div className="quest-creator" style={{ display: 'block' }}>
                <div className="creator-section" style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading...</p>
                </div>
            </div>
        )
    }

    // Auth required screen
    if (!currentUser) {
        return (
            <div className="quest-creator" style={{ display: 'block' }}>
                <div className="creator-section" style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒 Authentication Required</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        You need to be logged in as a Local Guide to create quests.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                        style={{ padding: '14px 40px', fontSize: '1.1rem' }}
                    >
                        Go to Login →
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="quest-creator">
            {/* Main Creation Section */}
            <div className="creator-section">
                {/* Message Banner */}
                {message.text && (
                    <div
                        style={{
                            padding: '14px 20px',
                            marginBottom: '24px',
                            borderRadius: '12px',
                            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)'
                                : message.type === 'success' ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(59, 130, 246, 0.15)',
                            color: message.type === 'error' ? '#fca5a5'
                                : message.type === 'success' ? '#6ee7b7'
                                    : '#93c5fd',
                            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)'
                                : message.type === 'success' ? 'rgba(16, 185, 129, 0.3)'
                                    : 'rgba(59, 130, 246, 0.3)'}`,
                            fontSize: '0.95rem',
                            fontWeight: '500'
                        }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Header with Step Navigation */}
                <div className="section-header">
                    <h2>✨ Create New Quest</h2>
                    <div className="step-indicator">
                        <span
                            className={`step ${step >= 1 ? 'active' : ''}`}
                            onClick={() => goToStage(1)}
                            style={{ cursor: 'pointer' }}
                        >
                            1. Type
                        </span>
                        <span
                            className={`step ${step >= 2 ? 'active' : ''}`}
                            onClick={() => quest.type && goToStage(2)}
                            style={{ cursor: quest.type ? 'pointer' : 'not-allowed', opacity: quest.type ? 1 : 0.5 }}
                        >
                            2. Details
                        </span>
                        <span
                            className={`step ${step >= 3 ? 'active' : ''}`}
                            onClick={() => quest.title && quest.coordinates && quest.difficulty && goToStage(3)}
                            style={{ cursor: quest.title && quest.coordinates && quest.difficulty ? 'pointer' : 'not-allowed', opacity: quest.title && quest.coordinates && quest.difficulty ? 1 : 0.5 }}
                        >
                            3. Overview
                        </span>
                    </div>
                </div>

                {/* ===== STAGE 1: Quest Type Selection ===== */}
                {step === 1 && (
                    <>
                        <h3 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                            Choose Quest Type
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
                            Select the type of experience you want travelers to have
                        </p>

                        <div className="quest-types-grid">
                            {QUEST_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    className={`quest-type-card ${quest.type === type.id ? 'selected' : ''}`}
                                    onClick={() => handleInputChange('type', type.id)}
                                    style={{
                                        borderColor: quest.type === type.id ? type.color : undefined,
                                        background: quest.type === type.id ? `${type.color}20` : undefined
                                    }}
                                >
                                    <span className="type-icon">{type.icon}</span>
                                    <h3>{type.label}</h3>
                                    <p>{type.description}</p>
                                </button>
                            ))}
                        </div>

                        <div className="form-actions" style={{ marginTop: '2rem' }}>
                            <div></div>
                            <button
                                className="btn-primary"
                                onClick={() => goToStage(2)}
                                disabled={!quest.type}
                                style={{ opacity: quest.type ? 1 : 0.5 }}
                            >
                                Continue to Details →
                            </button>
                        </div>
                    </>
                )}

                {/* ===== STAGE 2: Quest Details ===== */}
                {step === 2 && (
                    <div className="quest-form">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '2rem' }}>{getQuestType(quest.type)?.icon}</span>
                            <div>
                                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>Quest Details</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.9rem' }}>
                                    {getQuestType(quest.type)?.label}
                                </p>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="form-group">
                            <label>Quest Title *</label>
                            <input
                                type="text"
                                placeholder="Enter an exciting title for your quest..."
                                value={quest.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                maxLength={100}
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                placeholder="Describe what travelers will experience..."
                                rows={3}
                                value={quest.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                maxLength={500}
                            />
                        </div>

                        {/* Location - Coordinate Based */}
                        <div className="form-group">
                            <label>📍 Quest Location (Coordinate Based) *</label>
                            <input
                                type="text"
                                placeholder="Location name (e.g., Mysore Palace)"
                                value={quest.locationName}
                                onChange={(e) => handleInputChange('locationName', e.target.value)}
                                style={{ marginBottom: '10px' }}
                            />
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Coordinates will appear here"
                                    value={
                                        quest.coordinates
                                            ? `${quest.coordinates.lat.toFixed(6)}, ${quest.coordinates.lng.toFixed(6)}`
                                            : ''
                                    }
                                    readOnly
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.03)' }}
                                />
                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    disabled={gettingLocation}
                                    style={{
                                        padding: '12px 20px',
                                        background: quest.coordinates
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: gettingLocation ? 'wait' : 'pointer',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {gettingLocation ? '📍 Getting...' : quest.coordinates ? '✅ Captured' : '📍 Capture Location'}
                                </button>
                            </div>
                            <small style={{ color: 'rgba(255,255,255,0.4)', marginTop: '6px', display: 'block' }}>
                                Stand at the quest location and capture GPS coordinates
                            </small>
                        </div>

                        {/* Time Limit */}
                        <div className="form-group">
                            <label>⏱️ Time Limit to Finish</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {TIME_LIMITS.map((time) => (
                                    <button
                                        key={time.id}
                                        type="button"
                                        onClick={() => handleInputChange('timeLimit', time.id)}
                                        style={{
                                            padding: '10px 18px',
                                            background: quest.timeLimit === time.id
                                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                : 'rgba(255,255,255,0.05)',
                                            border: quest.timeLimit === time.id
                                                ? '2px solid #667eea'
                                                : '2px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontWeight: quest.timeLimit === time.id ? '600' : '400',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {time.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div className="form-group">
                            <label>🎯 Difficulty Level *</label>
                            <div className="difficulty-options">
                                {DIFFICULTY_LEVELS.map((level) => (
                                    <button
                                        key={level.id}
                                        type="button"
                                        className={`difficulty-btn ${quest.difficulty === level.id ? 'selected' : ''}`}
                                        onClick={() => handleInputChange('difficulty', level.id)}
                                        style={{
                                            '--level-color': level.color,
                                            borderColor: quest.difficulty === level.id ? level.color : undefined
                                        }}
                                    >
                                        <span className="level-label" style={{ color: level.color }}>{level.label}</span>
                                        <span className="level-points">{level.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Points Slider - 1 to 100 */}
                        <div className="form-group">
                            <label>🏆 Reward Points: <span style={{ color: '#92fe9d', fontWeight: '700' }}>{quest.points}</span></label>
                            <div className="points-slider">
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>1</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={quest.points}
                                    onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>100</span>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="form-group">
                            <label>💡 Tips for Travelers (Optional)</label>
                            <textarea
                                placeholder="Any helpful tips for completing this quest..."
                                rows={2}
                                value={quest.tips}
                                onChange={(e) => handleInputChange('tips', e.target.value)}
                                maxLength={300}
                            />
                        </div>

                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => goToStage(1)}>
                                ← Back to Types
                            </button>
                            <button className="btn-primary" onClick={() => goToStage(3)}>
                                Review Quest →
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== STAGE 3: Overview ===== */}
                {step === 3 && (
                    <div className="quest-review">
                        <h3 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                            📋 Quest Overview
                        </h3>

                        <div className="review-card">
                            {/* Header */}
                            <div className="review-header">
                                <div className="quest-type-badge" style={{ background: `${getQuestType(quest.type)?.color}30` }}>
                                    <span>{getQuestType(quest.type)?.icon}</span>
                                    <span>{getQuestType(quest.type)?.label}</span>
                                </div>
                                <span
                                    className="quest-difficulty"
                                    style={{ background: getDifficulty(quest.difficulty)?.color }}
                                >
                                    {getDifficulty(quest.difficulty)?.label}
                                </span>
                            </div>

                            {/* Title & Description */}
                            <h3>{quest.title || 'Untitled Quest'}</h3>
                            <p className="review-description">
                                {quest.description || 'No description provided.'}
                            </p>

                            {/* Details Grid */}
                            <div className="review-details">
                                <div className="detail-item">
                                    <span className="detail-icon">📍</span>
                                    <span>{quest.locationName || 'Custom Location'}</span>
                                </div>
                                {quest.coordinates && (
                                    <div className="detail-item">
                                        <span className="detail-icon">🗺️</span>
                                        <span>{quest.coordinates.lat.toFixed(4)}, {quest.coordinates.lng.toFixed(4)}</span>
                                    </div>
                                )}
                                <div className="detail-item">
                                    <span className="detail-icon">⏱️</span>
                                    <span>{getTimeLimit(quest.timeLimit)?.label || 'No time limit'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">🏆</span>
                                    <span style={{ color: '#92fe9d', fontWeight: '600' }}>{quest.points} Points</span>
                                </div>
                            </div>

                            {/* Tips */}
                            {quest.tips && (
                                <div className="review-tips">
                                    <h4>💡 Tips for Travelers</h4>
                                    <p>{quest.tips}</p>
                                </div>
                            )}
                        </div>

                        {/* Summary Table */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            marginTop: '1.5rem'
                        }}>
                            <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>📊 Quest Summary</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Quest Type</span>
                                    <span style={{ color: '#fff', fontWeight: '500' }}>{getQuestType(quest.type)?.label}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Difficulty</span>
                                    <span style={{ color: getDifficulty(quest.difficulty)?.color, fontWeight: '500' }}>{getDifficulty(quest.difficulty)?.label}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Time Limit</span>
                                    <span style={{ color: '#fff', fontWeight: '500' }}>{getTimeLimit(quest.timeLimit)?.label || 'Unlimited'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Reward</span>
                                    <span style={{ color: '#92fe9d', fontWeight: '600' }}>{quest.points} pts</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '2rem' }}>
                            <button className="btn-secondary" onClick={() => goToStage(2)}>
                                ← Edit Details
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSubmit}
                                disabled={saving}
                                style={{
                                    minWidth: '180px',
                                    background: saving ? 'rgba(102, 126, 234, 0.5)' : undefined
                                }}
                            >
                                {saving ? 'Creating...' : '🚀 Create Quest'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* My Quests Sidebar */}
            <div className="my-quests-section">
                <h2>My Quests</h2>
                <button
                    className="btn-secondary"
                    onClick={loadMyQuests}
                    disabled={loading}
                    style={{ marginBottom: '1rem', width: '100%', padding: '8px' }}
                >
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>
                        Loading your quests...
                    </div>
                ) : myQuests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>
                        No quests yet. Create your first quest!
                    </div>
                ) : (
                    <div className="quests-list">
                        {myQuests.map(q => (
                            <div key={q._id} className={`quest-item ${q.active ? 'active' : 'inactive'}`}>
                                <div className="quest-icon">
                                    {QUEST_TYPES.find(t => t.id === q.category)?.icon || '📌'}
                                </div>
                                <div className="quest-info">
                                    <h4>{q.title}</h4>
                                    <div className="quest-stats">
                                        <span>{q.reward_points} pts</span>
                                        <span>{q.completions || 0} done</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        className={`quest-status ${q.active ? 'active' : 'draft'}`}
                                        onClick={() => handleToggleActive(q._id, q.active)}
                                    >
                                        {q.active ? 'Active' : 'Off'}
                                    </button>
                                    <button
                                        style={{
                                            padding: '4px 8px',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            color: '#fca5a5',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                        onClick={() => handleDeleteQuest(q._id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default QuestCreator
