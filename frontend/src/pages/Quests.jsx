import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { questsApi, aiApi } from '../services/api'

export default function Quests() {
    const navigate = useNavigate()
    const [quests, setQuests] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedQuest, setSelectedQuest] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showQuestModal, setShowQuestModal] = useState(false)

    // Quest flow states
    const [questPhase, setQuestPhase] = useState('before') // 'before', 'cleanup', 'after', 'verify'
    const [beforeImage, setBeforeImage] = useState(null)
    const [afterImage, setAfterImage] = useState(null)
    const [verifying, setVerifying] = useState(false)
    const [verificationResult, setVerificationResult] = useState(null)

    // Stopwatch
    const [elapsedTime, setElapsedTime] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const timerRef = useRef(null)

    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    const [filters, setFilters] = useState({
        category: 'all',
        difficulty: 'all',
        distance: 'all',
        sort: 'points',
    })

    useEffect(() => {
        loadQuests()
    }, [])

    // Stopwatch effect
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1)
            }, 1000)
        } else {
            clearInterval(timerRef.current)
        }
        return () => clearInterval(timerRef.current)
    }, [isRunning])

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const loadQuests = async () => {
        try {
            const response = await questsApi.getAll()
            setQuests(response.data.quests || [])
        } catch (error) {
            console.error('Error loading quests:', error)
            setQuests([
                { id: 1, name: 'Clean Cups Outside CSE Lab', description: 'Help keep campus clean', location: 'MSRIT', points: 50, difficulty: 'Easy', category: 'environment' },
                { id: 2, name: 'Clean Beach Quest', description: 'Help clean up the beach', location: 'Malpe Beach', points: 100, difficulty: 'Easy', category: 'environment' },
                { id: 3, name: 'Heritage Walk', description: 'Explore historical monuments', location: 'Mysore Palace', points: 150, difficulty: 'Medium', category: 'culture' },
                { id: 4, name: 'Local Food Trail', description: 'Discover authentic local cuisine', location: 'VV Puram', points: 75, difficulty: 'Easy', category: 'food' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (e) => {
        const { id, value } = e.target
        setFilters((prev) => ({ ...prev, [id.replace('-filter', '')]: value }))
    }

    const filteredQuests = quests.filter((quest) => {
        if (filters.category !== 'all' && quest.category !== filters.category) return false
        if (filters.difficulty !== 'all' && quest.difficulty?.toLowerCase() !== filters.difficulty) return false
        return true
    })

    const openQuestModal = (quest) => { setSelectedQuest(quest); setShowModal(true) }
    const closeModal = () => { setShowModal(false); setSelectedQuest(null) }

    const startQuest = () => {
        setShowModal(false)
        setShowQuestModal(true)
        setQuestPhase('before')
        setBeforeImage(null)
        setAfterImage(null)
        setElapsedTime(0)
        setIsRunning(false)
        setVerificationResult(null)
        startCamera()
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            if (videoRef.current) videoRef.current.srcObject = stream
        } catch (error) {
            console.error('Camera error:', error)
            // Fallback to any camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                if (videoRef.current) videoRef.current.srcObject = stream
            } catch (e) {
                console.error('Camera fallback error:', e)
            }
        }
    }

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop())
        }
    }

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current
            const video = videoRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d').drawImage(video, 0, 0)
            return canvas.toDataURL('image/jpeg')
        }
        return null
    }

    const captureBeforePhoto = () => {
        const photo = capturePhoto()
        if (photo) {
            setBeforeImage(photo)
            stopCamera()
            setQuestPhase('cleanup')
            setIsRunning(true) // Start stopwatch
        }
    }

    const captureAfterPhoto = () => {
        const photo = capturePhoto()
        if (photo) {
            setAfterImage(photo)
            stopCamera()
            setIsRunning(false) // Stop stopwatch
            setQuestPhase('verify')
        }
    }

    const startAfterCapture = () => {
        setQuestPhase('after')
        startCamera()
    }

    const closeQuestModal = () => {
        stopCamera()
        setIsRunning(false)
        clearInterval(timerRef.current)
        setShowQuestModal(false)
        setQuestPhase('before')
        setBeforeImage(null)
        setAfterImage(null)
        setElapsedTime(0)
        setVerificationResult(null)
    }

    const submitVerification = async () => {
        setVerifying(true)
        try {
            // Send both images to the verifier
            const response = await aiApi.verifyQuest({
                quest_id: selectedQuest?.id || selectedQuest?._id,
                quest_type: selectedQuest?.category === 'environment' ? 'trash_cleanup' : selectedQuest?.category,
                before_image: beforeImage,
                after_image: afterImage,
                elapsed_time: elapsedTime,
                location: selectedQuest?.location
            })

            if (response.data.verification?.verified) {
                setVerificationResult({
                    success: true,
                    message: `🎉 Quest Verified! +${selectedQuest?.points || 50} points earned!`,
                    confidence: response.data.verification.confidence || response.data.verification.authenticity_score
                })
            } else {
                setVerificationResult({
                    success: false,
                    message: response.data.verification?.reason || 'Verification needs review. Our AI detected minimal improvement.',
                    confidence: response.data.verification?.confidence || 0
                })
            }
        } catch (error) {
            console.error('Verification error:', error)
            setVerificationResult({
                success: true,
                message: '✅ Quest submitted! Our team will review and award points soon.',
                confidence: null
            })
        } finally {
            setVerifying(false)
        }
    }

    const getDifficultyStyle = (difficulty) => {
        const styles = {
            Easy: { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
            Medium: { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#eab308' },
            Hard: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
        }
        return styles[difficulty] || { backgroundColor: 'rgba(196, 163, 90, 0.2)', color: '#c4a35a' }
    }

    return (
        <div className="min-h-screen luxury-bg-aurora luxury-scrollbar">
            <div className="container mx-auto px-6 py-12 relative z-10">

                {/* Header */}
                <div className="text-center mb-12">
                    <p className="luxury-subheading mb-4">SUSTAINABLE ADVENTURES</p>
                    <h1 className="luxury-heading text-5xl md:text-6xl mb-4">
                        <span className="luxury-heading-gold">Available Quests</span>
                    </h1>
                    <p className="luxury-text-muted max-w-2xl mx-auto">
                        Complete quests to earn points, unlock rewards, and make a positive impact
                    </p>
                </div>

                {/* Filters */}
                <div className="glass-card p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="luxury-subheading block mb-2">CATEGORY</label>
                            <select id="category-filter" value={filters.category} onChange={handleFilterChange} className="w-full luxury-input">
                                <option value="all">All Categories</option>
                                <option value="tourism">Tourism</option>
                                <option value="culture">Culture</option>
                                <option value="food">Food & Dining</option>
                                <option value="adventure">Adventure</option>
                                <option value="environment">Environment</option>
                            </select>
                        </div>
                        <div>
                            <label className="luxury-subheading block mb-2">DIFFICULTY</label>
                            <select id="difficulty-filter" value={filters.difficulty} onChange={handleFilterChange} className="w-full luxury-input">
                                <option value="all">All Levels</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="luxury-subheading block mb-2">DISTANCE</label>
                            <select id="distance-filter" value={filters.distance} onChange={handleFilterChange} className="w-full luxury-input">
                                <option value="all">Any Distance</option>
                                <option value="1">Within 1 km</option>
                                <option value="5">Within 5 km</option>
                                <option value="10">Within 10 km</option>
                            </select>
                        </div>
                        <div>
                            <label className="luxury-subheading block mb-2">SORT BY</label>
                            <select id="sort-filter" value={filters.sort} onChange={handleFilterChange} className="w-full luxury-input">
                                <option value="points">Points (High to Low)</option>
                                <option value="distance">Distance (Near)</option>
                                <option value="difficulty">Difficulty</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Quests Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {loading ? (
                        <div className="col-span-full text-center py-12">
                            <p className="luxury-text-muted">Loading quests...</p>
                        </div>
                    ) : filteredQuests.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="luxury-text-muted">No quests found matching your filters.</p>
                        </div>
                    ) : (
                        filteredQuests.map((quest) => (
                            <div
                                key={quest.id || quest._id}
                                className="glass-card overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform"
                                onClick={() => openQuestModal(quest)}
                            >
                                <div className="h-40 flex items-center justify-center text-6xl"
                                    style={{ background: 'linear-gradient(135deg, #1a4a5c, #2d6a7c)' }}>
                                    🎯
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="luxury-text font-bold text-lg">{quest.name}</h4>
                                        <span className="px-3 py-1 rounded-full font-semibold text-sm"
                                            style={{ backgroundColor: 'rgba(196, 163, 90, 0.2)', color: '#c4a35a' }}>
                                            {quest.points} pts
                                        </span>
                                    </div>
                                    <p className="luxury-text-muted text-sm mb-4 line-clamp-2">{quest.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="luxury-text-muted text-xs">📍 {quest.location}</span>
                                        <span className="px-2 py-1 rounded text-xs" style={getDifficultyStyle(quest.difficulty)}>
                                            {quest.difficulty}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Quest Detail Modal */}
                {showModal && selectedQuest && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                        <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="luxury-heading-gold text-3xl mb-2">{selectedQuest.name}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 rounded-full font-semibold"
                                                style={{ backgroundColor: 'rgba(196, 163, 90, 0.2)', color: '#c4a35a' }}>
                                                {selectedQuest.points} pts
                                            </span>
                                            <span className="px-3 py-1 rounded-full" style={getDifficultyStyle(selectedQuest.difficulty)}>
                                                {selectedQuest.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={closeModal} className="luxury-text-muted hover:text-white text-xl">✕</button>
                                </div>

                                <div className="h-48 rounded-lg flex items-center justify-center text-8xl mb-6"
                                    style={{ background: 'linear-gradient(135deg, #1a4a5c, #2d6a7c)' }}>
                                    🎯
                                </div>

                                <div className="mb-6">
                                    <p className="luxury-subheading mb-2">DESCRIPTION</p>
                                    <p className="luxury-text">{selectedQuest.description}</p>
                                </div>

                                <div className="mb-6">
                                    <p className="luxury-subheading mb-2">LOCATION</p>
                                    <p className="luxury-text">📍 {selectedQuest.location}</p>
                                </div>

                                <div className="mb-8">
                                    <p className="luxury-subheading mb-2">REQUIREMENTS</p>
                                    <ul className="luxury-text-muted space-y-1 list-disc list-inside">
                                        {(selectedQuest.requirements || ['Complete the quest task', 'Submit photo proof']).map((req, i) => (
                                            <li key={i}>{req}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={startQuest} className="flex-1 gold-button">
                                        Start Quest
                                    </button>
                                    <button
                                        onClick={() => navigate('/heatmap', {
                                            state: {
                                                quest: {
                                                    id: selectedQuest.id || selectedQuest._id,
                                                    name: selectedQuest.name,
                                                    location: selectedQuest.location,
                                                    points: selectedQuest.points,
                                                    category: selectedQuest.category,
                                                    coordinates: selectedQuest.coordinates || selectedQuest.location?.coordinates
                                                }
                                            }
                                        })}
                                        className="flex-1 gold-button-outline"
                                    >
                                        View on Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quest Flow Modal */}
                {showQuestModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="glass-card max-w-2xl w-full max-h-[95vh] overflow-y-auto">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="luxury-heading-gold text-2xl">{selectedQuest?.name}</h3>
                                        <p className="luxury-text-muted text-sm">📍 {selectedQuest?.location}</p>
                                    </div>
                                    <button onClick={closeQuestModal} className="luxury-text-muted hover:text-white text-2xl">✕</button>
                                </div>

                                {/* Progress Steps */}
                                <div className="flex items-center justify-between mb-6 px-4">
                                    <div className={`flex flex-col items-center ${questPhase === 'before' ? 'text-[#c4a35a]' : beforeImage ? 'text-green-500' : 'text-gray-500'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${questPhase === 'before' ? 'bg-[#c4a35a] text-black' : beforeImage ? 'bg-green-500 text-white' : 'bg-gray-700'}`}>
                                            {beforeImage ? '✓' : '1'}
                                        </div>
                                        <span className="text-xs mt-1">Before</span>
                                    </div>
                                    <div className="flex-1 h-1 mx-2 bg-gray-700 rounded">
                                        <div className={`h-full rounded transition-all ${beforeImage ? 'bg-green-500 w-full' : 'w-0'}`}></div>
                                    </div>
                                    <div className={`flex flex-col items-center ${questPhase === 'cleanup' ? 'text-[#c4a35a]' : afterImage ? 'text-green-500' : 'text-gray-500'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${questPhase === 'cleanup' ? 'bg-[#c4a35a] text-black' : afterImage ? 'bg-green-500 text-white' : 'bg-gray-700'}`}>
                                            {questPhase === 'cleanup' ? '⏱️' : afterImage ? '✓' : '2'}
                                        </div>
                                        <span className="text-xs mt-1">Cleanup</span>
                                    </div>
                                    <div className="flex-1 h-1 mx-2 bg-gray-700 rounded">
                                        <div className={`h-full rounded transition-all ${afterImage ? 'bg-green-500 w-full' : 'w-0'}`}></div>
                                    </div>
                                    <div className={`flex flex-col items-center ${questPhase === 'after' || questPhase === 'verify' ? 'text-[#c4a35a]' : 'text-gray-500'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${questPhase === 'verify' && verificationResult?.success ? 'bg-green-500 text-white' : questPhase === 'after' || questPhase === 'verify' ? 'bg-[#c4a35a] text-black' : 'bg-gray-700'}`}>
                                            {verificationResult?.success ? '🎉' : '3'}
                                        </div>
                                        <span className="text-xs mt-1">Verify</span>
                                    </div>
                                </div>

                                <canvas ref={canvasRef} className="hidden" />

                                {/* Phase 1: Capture BEFORE photo */}
                                {questPhase === 'before' && (
                                    <div>
                                        <div className="text-center mb-4">
                                            <p className="luxury-text font-semibold text-lg">📸 Take BEFORE Photo</p>
                                            <p className="luxury-text-muted text-sm">Capture the area before you start cleaning</p>
                                        </div>
                                        <div className="relative rounded-lg overflow-hidden mb-4">
                                            <video ref={videoRef} className="w-full h-64 bg-black object-cover" autoPlay playsInline />
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                                <button onClick={captureBeforePhoto} className="gold-button rounded-full w-16 h-16 text-2xl shadow-lg">
                                                    📷
                                                </button>
                                            </div>
                                        </div>
                                        {/* Upload option for testing */}
                                        <div className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-lg p-4 text-center">
                                            <input type="file" id="before-upload" accept="image/*" className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        const reader = new FileReader()
                                                        reader.onload = (ev) => {
                                                            setBeforeImage(ev.target?.result)
                                                            stopCamera()
                                                            setQuestPhase('cleanup')
                                                            setIsRunning(true)
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }
                                                }}
                                            />
                                            <label htmlFor="before-upload" className="cursor-pointer">
                                                <p className="luxury-text-muted text-sm">Or <span className="text-[#c4a35a] underline">upload from device</span></p>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Phase 2: Cleanup in progress - Stopwatch */}
                                {questPhase === 'cleanup' && (
                                    <div className="text-center py-8">
                                        <div className="mb-4">
                                            <img src={beforeImage} alt="Before" className="w-32 h-32 object-cover rounded-lg mx-auto opacity-60" />
                                            <p className="luxury-text-muted text-xs mt-2">Before Photo ✓</p>
                                        </div>

                                        <div className="mb-8">
                                            <p className="luxury-subheading mb-2">TIME ELAPSED</p>
                                            <div className="text-6xl font-mono luxury-heading-gold mb-2">
                                                {formatTime(elapsedTime)}
                                            </div>
                                            <div className="w-16 h-1 bg-[#c4a35a] mx-auto rounded animate-pulse"></div>
                                        </div>

                                        <p className="luxury-text mb-6">🧹 Complete your cleanup task...</p>

                                        <button onClick={startAfterCapture} className="gold-button text-lg px-8 py-4">
                                            ✅ Finish Quest - Take After Photo
                                        </button>
                                    </div>
                                )}

                                {/* Phase 3: Capture AFTER photo */}
                                {questPhase === 'after' && (
                                    <div>
                                        <div className="text-center mb-4">
                                            <p className="luxury-text font-semibold text-lg">📸 Take AFTER Photo</p>
                                            <p className="luxury-text-muted text-sm">Show the cleaned area</p>
                                            <p className="text-[#c4a35a] text-sm mt-1">⏱️ Time: {formatTime(elapsedTime)}</p>
                                        </div>
                                        <div className="relative rounded-lg overflow-hidden mb-4">
                                            <video ref={videoRef} className="w-full h-64 bg-black object-cover" autoPlay playsInline />
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                                <button onClick={captureAfterPhoto} className="gold-button rounded-full w-16 h-16 text-2xl shadow-lg">
                                                    📷
                                                </button>
                                            </div>
                                        </div>
                                        {/* Upload option for testing */}
                                        <div className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-lg p-4 text-center">
                                            <input type="file" id="after-upload" accept="image/*" className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        const reader = new FileReader()
                                                        reader.onload = (ev) => {
                                                            setAfterImage(ev.target?.result)
                                                            stopCamera()
                                                            setIsRunning(false)
                                                            setQuestPhase('verify')
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }
                                                }}
                                            />
                                            <label htmlFor="after-upload" className="cursor-pointer">
                                                <p className="luxury-text-muted text-sm">Or <span className="text-[#c4a35a] underline">upload from device</span></p>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Phase 4: Verification */}
                                {questPhase === 'verify' && (
                                    <div>
                                        {!verificationResult ? (
                                            <>
                                                <div className="text-center mb-4">
                                                    <p className="luxury-text font-semibold text-lg">🔍 Review & Submit</p>
                                                    <p className="luxury-text-muted text-sm">Time spent: {formatTime(elapsedTime)}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="text-center">
                                                        <p className="luxury-subheading mb-2">BEFORE</p>
                                                        <img src={beforeImage} alt="Before" className="w-full h-40 object-cover rounded-lg border-2 border-gray-600" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="luxury-subheading mb-2">AFTER</p>
                                                        <img src={afterImage} alt="After" className="w-full h-40 object-cover rounded-lg border-2 border-[#c4a35a]" />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={submitVerification}
                                                    disabled={verifying}
                                                    className="w-full gold-button text-lg py-4 disabled:opacity-50"
                                                >
                                                    {verifying ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <span className="animate-spin">⏳</span> AI Analyzing...
                                                        </span>
                                                    ) : (
                                                        '🚀 Submit for Verification'
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center py-6">
                                                <div className={`text-6xl mb-4 ${verificationResult.success ? 'animate-bounce' : ''}`}>
                                                    {verificationResult.success ? '🎉' : '🔄'}
                                                </div>
                                                <p className={`text-xl font-semibold mb-2 ${verificationResult.success ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {verificationResult.success ? 'Quest Complete!' : 'Under Review'}
                                                </p>
                                                <p className="luxury-text mb-4">{verificationResult.message}</p>
                                                {verificationResult.confidence !== null && (
                                                    <p className="luxury-text-muted text-sm mb-4">
                                                        AI Confidence: {Math.round(verificationResult.confidence * 100)}%
                                                    </p>
                                                )}
                                                <button onClick={closeQuestModal} className="gold-button-outline px-8 py-3">
                                                    Close
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
