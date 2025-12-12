import { useState, useEffect, useRef } from 'react'
import { questsApi, aiApi } from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function Quests() {
    const { isDarkMode } = useTheme()
    const [quests, setQuests] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedQuest, setSelectedQuest] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showCameraModal, setShowCameraModal] = useState(false)
    const [capturedPhoto, setCapturedPhoto] = useState(null)
    const [verifying, setVerifying] = useState(false)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    const [filters, setFilters] = useState({
        category: 'all',
        difficulty: 'all',
        distance: 'all',
        sort: 'points',
    })

    // Dark mode classes
    const cardClass = isDarkMode ? 'bg-gray-800' : 'bg-white'
    const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-800'
    const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600'
    const textMuted = isDarkMode ? 'text-gray-500' : 'text-gray-500'
    const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-300'
    const inputClass = isDarkMode
        ? 'bg-gray-700 text-gray-100 border-gray-600'
        : 'bg-white text-gray-800 border-gray-300'
    const modalBg = isDarkMode ? 'bg-gray-800' : 'bg-white'

    useEffect(() => {
        loadQuests()
    }, [])

    const loadQuests = async () => {
        try {
            const response = await questsApi.getAll()
            setQuests(response.data.quests || [])
        } catch (error) {
            console.error('Error loading quests:', error)
            setQuests([
                {
                    id: 1,
                    name: 'Clean Cups Outside CSE Lab 3',
                    description: 'Help keep our campus clean by collecting disposable cups scattered outside CSE Lab 3. Take before and after photos to verify your cleanup effort!',
                    location: 'CSE Lab 3, MSRIT',
                    points: 50,
                    difficulty: 'Easy',
                    category: 'environment',
                    requirements: ['Take a "before" photo showing cups/trash', 'Collect all disposable cups and trash', 'Take an "after" photo showing clean area', 'Dispose trash in designated bins'],
                },
                {
                    id: 2,
                    name: 'Clean Beach Quest',
                    description: 'Help clean up the beach and earn rewards!',
                    location: 'Malpe Beach, Udupi',
                    points: 100,
                    difficulty: 'Easy',
                    category: 'environment',
                    requirements: ['Take a photo of collected trash', 'Upload proof of disposal'],
                },
                {
                    id: 3,
                    name: 'Heritage Walk',
                    description: 'Explore historical monuments and learn about local culture.',
                    location: 'Mysore Palace',
                    points: 150,
                    difficulty: 'Medium',
                    category: 'culture',
                    requirements: ['Visit 3 monuments', 'Take photos at each location'],
                },
                {
                    id: 4,
                    name: 'Local Food Trail',
                    description: 'Discover authentic local cuisine from street vendors.',
                    location: 'VV Puram Food Street, Bangalore',
                    points: 75,
                    difficulty: 'Easy',
                    category: 'food',
                    requirements: ['Try 3 different foods', 'Share reviews'],
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (e) => {
        const { id, value } = e.target
        setFilters((prev) => ({
            ...prev,
            [id.replace('-filter', '')]: value,
        }))
    }

    const filteredQuests = quests.filter((quest) => {
        if (filters.category !== 'all' && quest.category !== filters.category) return false
        if (filters.difficulty !== 'all' && quest.difficulty?.toLowerCase() !== filters.difficulty) return false
        return true
    })

    const openQuestModal = (quest) => {
        setSelectedQuest(quest)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedQuest(null)
    }

    const startQuest = () => {
        setShowModal(false)
        setShowCameraModal(true)
        startCamera()
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (error) {
            console.error('Camera error:', error)
        }
    }

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks()
            tracks.forEach((track) => track.stop())
        }
    }

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current
            const video = videoRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d').drawImage(video, 0, 0)
            setCapturedPhoto(canvas.toDataURL('image/jpeg'))
        }
    }

    const retakePhoto = () => {
        setCapturedPhoto(null)
    }

    const closeCameraModal = () => {
        stopCamera()
        setShowCameraModal(false)
        setCapturedPhoto(null)
    }

    const submitVerification = async () => {
        setVerifying(true)
        try {
            const response = await aiApi.verifyQuest({
                quest_id: selectedQuest?.id,
                image: capturedPhoto,
            })

            if (response.data.success) {
                alert('Quest verified successfully! Points awarded.')
            } else {
                alert('Verification pending. Our team will review your submission.')
            }
        } catch (error) {
            console.error('Verification error:', error)
            alert('Verification submitted. Our team will review and award points soon!')
        } finally {
            setVerifying(false)
            closeCameraModal()
        }
    }

    const getDifficultyColor = (difficulty) => {
        if (isDarkMode) {
            const colors = {
                Easy: 'bg-green-900 text-green-200',
                Medium: 'bg-yellow-900 text-yellow-200',
                Hard: 'bg-red-900 text-red-200',
            }
            return colors[difficulty] || 'bg-gray-700 text-gray-200'
        }
        const colors = {
            Easy: 'bg-green-100 text-green-800',
            Medium: 'bg-yellow-100 text-yellow-800',
            Hard: 'bg-red-100 text-red-800',
        }
        return colors[difficulty] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className={`text-3xl font-bold ${textPrimary} mb-2`}>Available Quests</h2>
                <p className={textSecondary}>Complete quests to earn points and unlock rewards</p>
            </div>

            {/* Filters */}
            <div className={`${cardClass} rounded-lg shadow-lg p-6 mb-8`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className={`block ${textSecondary} font-semibold mb-2`}>Category</label>
                        <select
                            id="category-filter"
                            value={filters.category}
                            onChange={handleFilterChange}
                            className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:border-purple-500`}
                        >
                            <option value="all">All Categories</option>
                            <option value="tourism">Tourism</option>
                            <option value="culture">Culture</option>
                            <option value="food">Food & Dining</option>
                            <option value="adventure">Adventure</option>
                            <option value="environment">Environment</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block ${textSecondary} font-semibold mb-2`}>Difficulty</label>
                        <select
                            id="difficulty-filter"
                            value={filters.difficulty}
                            onChange={handleFilterChange}
                            className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:border-purple-500`}
                        >
                            <option value="all">All Levels</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block ${textSecondary} font-semibold mb-2`}>Distance</label>
                        <select
                            id="distance-filter"
                            value={filters.distance}
                            onChange={handleFilterChange}
                            className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:border-purple-500`}
                        >
                            <option value="all">Any Distance</option>
                            <option value="1">Within 1 km</option>
                            <option value="5">Within 5 km</option>
                            <option value="10">Within 10 km</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block ${textSecondary} font-semibold mb-2`}>Sort By</label>
                        <select
                            id="sort-filter"
                            value={filters.sort}
                            onChange={handleFilterChange}
                            className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:border-purple-500`}
                        >
                            <option value="points">Points (High to Low)</option>
                            <option value="distance">Distance (Near to Far)</option>
                            <option value="difficulty">Difficulty</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Quests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {loading ? (
                    <div className={`col-span-full text-center py-8 ${textMuted}`}>
                        <p>Loading quests...</p>
                    </div>
                ) : filteredQuests.length === 0 ? (
                    <div className={`col-span-full text-center py-8 ${textMuted}`}>
                        <p>No quests found matching your filters.</p>
                    </div>
                ) : (
                    filteredQuests.map((quest) => (
                        <div
                            key={quest.id || quest._id}
                            className={`quest-card ${cardClass} rounded-lg shadow-lg overflow-hidden`}
                            onClick={() => openQuestModal(quest)}
                        >
                            <div className="h-40 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-6xl">
                                Q
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className={`font-bold ${textPrimary} text-lg`}>{quest.name}</h4>
                                    <span className={`${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'} px-3 py-1 rounded-full font-semibold text-sm`}>
                                        {quest.points} pts
                                    </span>
                                </div>
                                <p className={`${textSecondary} text-sm mb-4 line-clamp-2`}>{quest.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${textMuted}`}>Location: {quest.location}</span>
                                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(quest.difficulty)}`}>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`${modalBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className={`text-3xl font-bold ${textPrimary} mb-2`}>{selectedQuest.name}</h3>
                                    <div className="flex items-center space-x-4">
                                        <span className={`${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'} px-3 py-1 rounded-full font-semibold`}>
                                            {selectedQuest.points} pts
                                        </span>
                                        <span className={`${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full`}>
                                            {selectedQuest.difficulty}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={closeModal} className={`${textMuted} hover:${textPrimary}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-8xl">
                                    Q
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className={`font-semibold ${textPrimary} mb-2`}>Description</h4>
                                <p className={textSecondary}>{selectedQuest.description}</p>
                            </div>

                            <div className="mb-6">
                                <h4 className={`font-semibold ${textPrimary} mb-2`}>Location</h4>
                                <p className={textSecondary}>Location: {selectedQuest.location}</p>
                            </div>

                            <div className="mb-6">
                                <h4 className={`font-semibold ${textPrimary} mb-2`}>Requirements</h4>
                                <ul className={`list-disc list-inside ${textSecondary} space-y-1`}>
                                    {(selectedQuest.requirements || ['Complete the quest task', 'Submit photo proof']).map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={startQuest}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
                                >
                                    Start Quest
                                </button>
                                <button
                                    onClick={() => window.location.href = '/heatmap'}
                                    className={`${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} font-bold py-3 px-6 rounded-lg transition`}
                                >
                                    View on Map
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Verification Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`${modalBg} rounded-2xl max-w-2xl w-full`}>
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-2xl font-bold ${textPrimary}`}>Verify Quest Completion</h3>
                                <button onClick={closeCameraModal} className={`${textMuted} hover:${textPrimary}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {!capturedPhoto ? (
                                <div className="mb-6 relative">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-96 bg-gray-900 rounded-lg object-cover"
                                        autoPlay
                                        playsInline
                                    />
                                    <canvas ref={canvasRef} className="hidden" />

                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                        <button
                                            onClick={capturePhoto}
                                            className="bg-white text-purple-600 p-4 rounded-full shadow-lg hover:bg-gray-100 transition"
                                        >
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <img src={capturedPhoto} alt="Captured" className="w-full h-96 object-cover rounded-lg" />
                                    <div className="mt-4 flex space-x-4">
                                        <button
                                            onClick={retakePhoto}
                                            className={`flex-1 ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} font-bold py-3 px-6 rounded-lg transition`}
                                        >
                                            Retake Photo
                                        </button>
                                        <button
                                            onClick={submitVerification}
                                            disabled={verifying}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
                                        >
                                            {verifying ? 'Submitting...' : 'Submit for Verification'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!capturedPhoto && (
                                <div className={`border-2 border-dashed ${borderColor} rounded-lg p-8 text-center`}>
                                    <input
                                        type="file"
                                        id="photo-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                const reader = new FileReader()
                                                reader.onload = (e) => setCapturedPhoto(e.target?.result)
                                                reader.readAsDataURL(file)
                                            }
                                        }}
                                    />
                                    <label htmlFor="photo-upload" className="cursor-pointer">
                                        <svg className={`w-12 h-12 mx-auto ${textMuted} mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className={`${textSecondary} font-semibold`}>Click to upload a photo</p>
                                        <p className={`${textMuted} text-sm mt-2`}>or drag and drop</p>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
