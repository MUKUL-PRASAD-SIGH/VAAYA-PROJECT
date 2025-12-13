import { useState, useEffect } from 'react'
import { localGuideApi } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import './QuestCreator.css'

function QuestCreator() {
    const { t } = useLanguage()

    // Quest types with translations
    const QUEST_TYPES = [
        { id: 'photo', label: t('photoQuestLabel'), description: t('photoQuestDesc') },
        { id: 'visit', label: t('visitQuestLabel'), description: t('explorationQuestDesc') },
        { id: 'food', label: t('foodQuestLabel'), description: t('culturalQuestDesc') },
        { id: 'culture', label: t('cultureQuestLabel'), description: t('culturalQuestDesc') },
        { id: 'adventure', label: t('adventureQuestLabel'), description: t('explorationQuestDesc') }
    ]

    // Difficulty levels with translations
    const DIFFICULTY_LEVELS = [
        { id: 'easy', label: t('easy'), color: '#4ade80', points: '50-100' },
        { id: 'medium', label: t('medium'), color: '#fbbf24', points: '100-200' },
        { id: 'hard', label: t('hard'), color: '#f97316', points: '200-500' },
        { id: 'expert', label: t('expert'), color: '#ef4444', points: '500+' }
    ]

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [quest, setQuest] = useState({
        type: '',
        title: '',
        description: '',
        location: '',
        difficulty: '',
        points: 100,
        timeLimit: '',
        requirements: [],
        tips: '',
        coverImage: null
    })
    const [myQuests, setMyQuests] = useState([])

    useEffect(() => {
        loadMyQuests()
    }, [])

    const loadMyQuests = async () => {
        try {
            setLoading(true)
            const response = await localGuideApi.getMyQuests()
            setMyQuests(response.data.quests || [])
        } catch (error) {
            console.error('Failed to load quests:', error)
            setMessage({ type: 'error', text: 'Failed to load your quests' })
        } finally {
            setLoading(false)
        }
    }

    const handleTypeSelect = (typeId) => {
        setQuest({ ...quest, type: typeId })
        setStep(2)
    }

    const handleInputChange = (field, value) => {
        setQuest({ ...quest, [field]: value })
    }

    const handleSubmit = async () => {
        try {
            setSaving(true)
            setMessage({ type: '', text: '' })

            const questData = {
                title: quest.title,
                description: quest.description,
                category: quest.type,
                location: {
                    name: quest.location,
                    coordinates: { lat: 12.9716, lng: 77.5946 }
                },
                reward_points: quest.points,
                difficulty: quest.difficulty || 'medium',
                estimated_time: quest.timeLimit === '1h' ? 60 : quest.timeLimit === '3h' ? 180 : 120,
                verification_type: 'photo',
                verification_instructions: quest.tips
            }

            const response = await localGuideApi.createQuest(questData)

            setMyQuests([response.data.quest, ...myQuests])
            setMessage({ type: 'success', text: 'Quest created successfully!' })

            setQuest({
                type: '',
                title: '',
                description: '',
                location: '',
                difficulty: '',
                points: 100,
                timeLimit: '',
                requirements: [],
                tips: '',
                coverImage: null
            })
            setStep(1)
        } catch (error) {
            console.error('Failed to create quest:', error)
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create quest' })
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

    return (
        <div className="quest-creator">
            {/* Quest Creation Form */}
            <div className="creator-section">
                <div className="section-header">
                    <h2>{t('createNewQuest')}</h2>
                    <div className="step-indicator">
                        <span className={`step ${step >= 1 ? 'active' : ''}`}>1. {t('selectType')}</span>
                        <span className={`step ${step >= 2 ? 'active' : ''}`}>2. {t('details')}</span>
                        <span className={`step ${step >= 3 ? 'active' : ''}`}>3. {t('review')}</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="quest-types-grid">
                        {QUEST_TYPES.map(type => (
                            <button
                                key={type.id}
                                className={`quest-type-card ${quest.type === type.id ? 'selected' : ''}`}
                                onClick={() => handleTypeSelect(type.id)}
                            >
                                <h3>{type.label}</h3>
                                <p>{type.description}</p>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="quest-form">
                        <div className="form-group">
                            <label>{t('questTitleLabel')}</label>
                            <input
                                type="text"
                                placeholder={t('enterEngagingTitle')}
                                value={quest.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('description')}</label>
                            <textarea
                                placeholder={t('describeQuestToDo')}
                                rows={4}
                                value={quest.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Mysore, Karnataka"
                                    value={quest.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Time Limit</label>
                                <select
                                    value={quest.timeLimit}
                                    onChange={(e) => handleInputChange('timeLimit', e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    <option value="1h">1 Hour</option>
                                    <option value="3h">3 Hours</option>
                                    <option value="1d">1 Day</option>
                                    <option value="3d">3 Days</option>
                                    <option value="1w">1 Week</option>
                                    <option value="none">No Limit</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Difficulty Level</label>
                            <div className="difficulty-options">
                                {DIFFICULTY_LEVELS.map(level => (
                                    <button
                                        key={level.id}
                                        className={`difficulty-btn ${quest.difficulty === level.id ? 'selected' : ''}`}
                                        style={{ '--level-color': level.color }}
                                        onClick={() => handleInputChange('difficulty', level.id)}
                                    >
                                        <span className="level-label">{level.label}</span>
                                        <span className="level-points">{level.points} pts</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Points Reward</label>
                            <div className="points-slider">
                                <input
                                    type="range"
                                    min="50"
                                    max="500"
                                    step="25"
                                    value={quest.points}
                                    onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
                                />
                                <span className="points-value">{quest.points} points</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Tips for Travelers</label>
                            <textarea
                                placeholder="Share helpful tips for completing this quest..."
                                rows={3}
                                value={quest.tips}
                                onChange={(e) => handleInputChange('tips', e.target.value)}
                            />
                        </div>

                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setStep(1)}>
                                ← Back
                            </button>
                            <button className="btn-primary" onClick={() => setStep(3)}>
                                Review Quest →
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="quest-review">
                        <div className="review-card">
                            <div className="review-header">
                                <span className="quest-type-badge">
                                    {QUEST_TYPES.find(t => t.id === quest.type)?.label}
                                </span>
                                <span className="quest-difficulty" style={{
                                    background: DIFFICULTY_LEVELS.find(l => l.id === quest.difficulty)?.color
                                }}>
                                    {quest.difficulty}
                                </span>
                            </div>
                            <h3>{quest.title || 'Untitled Quest'}</h3>
                            <p className="review-description">{quest.description || 'No description provided'}</p>
                            <div className="review-details">
                                <div className="detail-item">
                                    <span className="detail-label">Location:</span>
                                    <span>{quest.location || 'Not set'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Time:</span>
                                    <span>{quest.timeLimit || 'No limit'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Points:</span>
                                    <span>{quest.points}</span>
                                </div>
                            </div>
                            {quest.tips && (
                                <div className="review-tips">
                                    <h4>Tips</h4>
                                    <p>{quest.tips}</p>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setStep(2)}>
                                ← Edit Details
                            </button>
                            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                                {saving ? 'Creating...' : 'Create Quest'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className={`message-toast ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* My Quests List */}
            <div className="my-quests-section">
                <div className="section-header-row">
                    <h2>My Quests</h2>
                    <button className="refresh-btn" onClick={loadMyQuests} disabled={loading}>
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">Loading your quests...</div>
                ) : myQuests.length === 0 ? (
                    <div className="empty-state">
                        <p>No quests yet. Create your first quest above!</p>
                    </div>
                ) : (
                    <div className="quests-list">
                        {myQuests.map(q => (
                            <div key={q._id} className={`quest-item ${q.active ? 'active' : 'inactive'}`}>
                                <div className="quest-info">
                                    <h4>{q.title}</h4>
                                    <div className="quest-meta">
                                        <span>{q.location?.name || 'Unknown'}</span>
                                        <span>{q.reward_points} pts</span>
                                    </div>
                                    <div className="quest-stats">
                                        <span>{q.completions || 0} completions</span>
                                    </div>
                                </div>
                                <div className="quest-actions">
                                    <button
                                        className={`status-btn ${q.active ? 'active' : ''}`}
                                        onClick={() => handleToggleActive(q._id, q.active)}
                                        title={q.active ? 'Deactivate' : 'Activate'}
                                    >
                                        {q.active ? 'Active' : 'Inactive'}
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDeleteQuest(q._id)}
                                        title="Delete quest"
                                    >
                                        Delete
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

