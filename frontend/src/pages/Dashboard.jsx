import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../components/common/StatCard'
import { questsApi } from '../services/api'
import { getUserData } from '../services/auth'
import { useTheme } from '../context/ThemeContext'

export default function Dashboard() {
    const { isDarkMode, themeColors, getThemeStyles } = useTheme()
    const [stats, setStats] = useState({
        totalPoints: 0,
        completedQuests: 0,
        activeTrips: 0,
        photosCount: 0,
    })
    const [activeQuests, setActiveQuests] = useState([])
    const [loading, setLoading] = useState(true)
    const user = getUserData()

    // Theme-aware styling
    const cardStyle = { ...getThemeStyles.card, borderRadius: '0.5rem', padding: '1.5rem' }
    const textPrimaryStyle = getThemeStyles.textPrimary
    const textSecondaryStyle = getThemeStyles.textSecondary
    const textMutedStyle = getThemeStyles.textMuted
    const borderStyle = getThemeStyles.border

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const questsResponse = await questsApi.getAll()
            const quests = questsResponse.data.quests || []
            setActiveQuests(quests.slice(0, 3))
            setStats({
                totalPoints: user.points || 0,
                completedQuests: user.completed_quests || 0,
                activeTrips: 0,
                photosCount: 0,
            })
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const recentActivity = [
        { type: 'quest', message: 'Completed "Visit Times Square"', time: '2 hours ago', icon: 'C' },
        { type: 'trip', message: 'Created trip to Paris', time: '5 hours ago', icon: 'T' },
        { type: 'points', message: 'Earned 50 points', time: '1 day ago', icon: 'S' },
    ]

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2" style={textPrimaryStyle}>
                    Welcome back, <span>{user.username || 'User'}</span>!
                </h2>
                <p style={textSecondaryStyle}>Your travel memories and upcoming adventures</p>
            </div>

            {/* Quick Action: Plan Trip */}
            <div className="rounded-lg shadow-xl p-8 mb-8 text-white" style={{ background: getThemeStyles.gradient }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Ready for your next adventure?</h3>
                        <p className="opacity-90">
                            Plan your trip and discover sustainable quests at your destination
                        </p>
                    </div>
                    <Link
                        to="/trips"
                        className="bg-white px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
                        style={{ color: themeColors.primary }}
                    >
                        Plan a Trip
                    </Link>
                </div>
            </div>

            {/* Trip Memories & Photos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="rounded-lg shadow-lg p-6" style={cardStyle}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold" style={textPrimaryStyle}>Trip Memories</h3>
                        <button className="text-sm font-semibold hover:opacity-80" style={{ color: themeColors.primary }}>
                            View All
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="text-center py-8" style={textMutedStyle}>
                            <p>No memories yet. Start your first trip!</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg shadow-lg p-6" style={cardStyle}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold" style={textPrimaryStyle}>Your Travel Photos</h3>
                        <button className="text-sm font-semibold hover:opacity-80" style={{ color: themeColors.primary }}>
                            View Gallery
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3 text-center py-8" style={textMutedStyle}>
                            <p>Upload photos from your quests!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Trips & Completed Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="rounded-lg shadow-lg p-6" style={cardStyle}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold" style={textPrimaryStyle}>Upcoming Trips</h3>
                        <Link to="/trips" className="text-sm font-semibold hover:opacity-80" style={{ color: themeColors.primary }}>
                            Plan New Trip
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div className="text-center py-8" style={textMutedStyle}>
                            <p>No upcoming trips planned</p>
                            <Link
                                to="/trips"
                                className="inline-block mt-3 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                                style={{ backgroundColor: themeColors.primary }}
                            >
                                Plan Your First Trip
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg shadow-lg p-6" style={cardStyle}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold" style={textPrimaryStyle}>Completed Tasks</h3>
                        <span className="text-sm" style={textSecondaryStyle}>
                            <span>{stats.completedQuests}</span> completed
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="text-center py-8" style={textMutedStyle}>
                            <p>Complete quests to see them here!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Points" value={stats.totalPoints} icon="P" borderColor="purple" />
                <StatCard title="Quests Completed" value={stats.completedQuests} icon="Q" borderColor="green" />
                <StatCard title="Trips Planned" value={stats.activeTrips} icon="T" borderColor="blue" />
                <StatCard title="Photos Shared" value={stats.photosCount} icon="C" borderColor="yellow" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="rounded-lg shadow-lg p-6" style={cardStyle}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold" style={textPrimaryStyle}>Active Quests</h3>
                            <Link to="/quests" className="font-semibold hover:opacity-80" style={{ color: themeColors.primary }}>
                                View All
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8" style={textSecondaryStyle}>
                                    <p>Loading quests...</p>
                                </div>
                            ) : activeQuests.length === 0 ? (
                                <div className="text-center py-8" style={textSecondaryStyle}>
                                    <p>Plan a trip to see sustainable quests!</p>
                                    <Link to="/trips" className="mt-2 inline-block hover:opacity-80" style={{ color: themeColors.primary }}>
                                        Plan Trip
                                    </Link>
                                </div>
                            ) : (
                                activeQuests.map((quest) => (
                                    <div
                                        key={quest._id || quest.id}
                                        className="flex items-center space-x-4 p-4 border rounded-lg hover:opacity-90 transition cursor-pointer"
                                        style={{ borderColor: themeColors.border }}
                                        onClick={() => window.location.href = '/quests'}
                                    >
                                        <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl" style={{ background: getThemeStyles.gradient }}>
                                            Q
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold" style={textPrimaryStyle}>{quest.name || 'Quest'}</h4>
                                            <p className="text-sm" style={textSecondaryStyle}>{quest.location || 'Unknown location'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold" style={{ color: themeColors.primary }}>{quest.points || 0} pts</p>
                                            <p className="text-xs" style={textSecondaryStyle}>{quest.difficulty || 'Medium'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg shadow-lg p-6 mt-6" style={cardStyle}>
                        <h3 className="text-xl font-bold mb-6" style={textPrimaryStyle}>Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 border-l-2" style={{ borderColor: themeColors.border }}>
                                    <span className="text-2xl">{activity.icon}</span>
                                    <div>
                                        <p style={textPrimaryStyle}>{activity.message}</p>
                                        <p className="text-xs" style={textSecondaryStyle}>{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="rounded-lg shadow-lg p-6" style={cardStyle}>
                        <h3 className="text-xl font-bold mb-4" style={textPrimaryStyle}>Upcoming Trips</h3>
                        <div className="space-y-4">
                            <div className="text-center py-4" style={textSecondaryStyle}>
                                <p>No upcoming trips</p>
                            </div>
                        </div>
                        <Link
                            to="/trips"
                            className="w-full mt-4 text-white py-2 px-4 rounded-lg hover:opacity-90 transition block text-center"
                            style={{ backgroundColor: themeColors.primary }}
                        >
                            Plan a Trip
                        </Link>
                    </div>

                    <div className="rounded-lg shadow-lg p-6" style={cardStyle}>
                        <h3 className="text-xl font-bold mb-4" style={textPrimaryStyle}>Top Explorers</h3>
                        <div className="space-y-3">
                            <div className="text-center py-4" style={textSecondaryStyle}>
                                <p>Start completing quests to join the leaderboard!</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg shadow-lg p-6 text-white" style={{ background: getThemeStyles.gradient }}>
                        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link to="/quests" className="w-full bg-white/20 hover:bg-white/30 backdrop-blur py-2 px-4 rounded-lg transition block text-center">
                                Find Nearby Quests
                            </Link>
                            <Link to="/heatmap" className="w-full bg-white/20 hover:bg-white/30 backdrop-blur py-2 px-4 rounded-lg transition block text-center">
                                View Crowd Heatmap
                            </Link>
                            <Link to="/chat" className="w-full bg-white/20 hover:bg-white/30 backdrop-blur py-2 px-4 rounded-lg transition block text-center">
                                Chat with Locals
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
