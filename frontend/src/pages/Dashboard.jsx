import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { questsApi, tripsApi } from '../services/api'
import { getUserData } from '../services/auth'
import { useTheme } from '../context/ThemeContext'

export default function Dashboard() {
    const { themeColors } = useTheme()
    const [stats, setStats] = useState({
        totalPoints: 0,
        completedQuests: 0,
        activeTrips: 0,
        photosCount: 0,
    })
    const [activeQuests, setActiveQuests] = useState([])
    const [upcomingTrips, setUpcomingTrips] = useState([])
    const [recentActivity, setRecentActivity] = useState([])
    const [loading, setLoading] = useState(true)
    const user = getUserData()

    useEffect(() => {
        loadDashboardData()

        // Request location permission
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    localStorage.setItem('userLocation', JSON.stringify({ lat: latitude, lng: longitude }))
                    console.log('📍 Location updated:', latitude, longitude)
                },
                (error) => {
                    console.log('⚠️ Location permission denied or error:', error)
                }
            )
        }
    }, [])

    const loadDashboardData = async () => {
        try {
            const activities = []
            const questsResponse = await questsApi.getAll()
            const quests = questsResponse.data.quests || []
            setActiveQuests(quests.slice(0, 3))

            quests.forEach(quest => {
                if (quest.status === 'completed' || quest.status === 'verified') {
                    activities.push({
                        type: 'quest',
                        message: `Completed "${quest.name || 'Quest'}"`,
                        time: quest.completed_at ? formatTimeAgo(quest.completed_at) : 'Recently',
                        icon: '🏆',
                        timestamp: new Date(quest.completed_at || quest.created_at)
                    })
                }
            })

            let trips = []
            try {
                const tripsResponse = await tripsApi.getAll()
                trips = tripsResponse.data.trips || []
                trips = trips.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                setUpcomingTrips(trips.slice(0, 3))

                trips.forEach(trip => {
                    activities.push({
                        type: 'trip',
                        message: `Created trip to ${trip.destination}`,
                        time: trip.created_at ? formatTimeAgo(trip.created_at) : 'Recently',
                        icon: '✈️',
                        timestamp: new Date(trip.created_at || Date.now())
                    })
                })
            } catch (tripError) {
                console.error('Error loading trips:', tripError)
            }

            activities.sort((a, b) => b.timestamp - a.timestamp)
            setRecentActivity(activities.slice(0, 5))

            setStats({
                totalPoints: user.points || 0,
                completedQuests: quests.filter(q => q.status === 'completed' || q.status === 'verified').length,
                activeTrips: trips.length,
                photosCount: 0,
            })
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="min-h-screen luxury-bg-aurora luxury-scrollbar">
            <div className="container mx-auto px-6 py-12 relative z-10">

                {/* Hero Welcome Section */}
                <div className="text-center" style={{ marginBottom: '3rem' }}>
                    <p className="luxury-subheading mb-4">YOUR ONCE IN A LIFETIME EXPERIENCE</p>
                    <h1 className="luxury-heading text-5xl md:text-6xl mb-4">
                        Welcome back, <span className="luxury-heading-gold">{user.username || 'Traveler'}</span>
                    </h1>
                    <p className="luxury-text-muted max-w-2xl mx-auto">
                        Discover your next adventure across the beautiful landscapes of Karnataka
                    </p>
                </div>

                {/* Quick Booking Bar */}
                <div className="glass-card p-6 flex flex-wrap items-center justify-between gap-4" style={{ marginBottom: '3rem' }}>
                    <div className="flex flex-wrap gap-4 flex-1">
                        <div className="flex-1 min-w-[150px]">
                            <p className="luxury-subheading mb-1">DESTINATION</p>
                            <p className="luxury-text font-medium">{upcomingTrips[0]?.destination || 'Choose location'}</p>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <p className="luxury-subheading mb-1">FROM</p>
                            <p className="luxury-text font-medium">
                                {upcomingTrips[0]?.start_date ? new Date(upcomingTrips[0].start_date).toLocaleDateString() : 'Select date'}
                            </p>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <p className="luxury-subheading mb-1">TO</p>
                            <p className="luxury-text font-medium">
                                {upcomingTrips[0]?.end_date ? new Date(upcomingTrips[0].end_date).toLocaleDateString() : 'Select date'}
                            </p>
                        </div>
                        <div className="flex-1 min-w-[100px]">
                            <p className="luxury-subheading mb-1">TRIPS</p>
                            <p className="luxury-text font-medium">{stats.activeTrips}</p>
                        </div>
                    </div>
                    <Link to="/trips" className="gold-button">
                        Plan Trip
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8" style={{ marginBottom: '3rem' }}>
                    <div className="luxury-stat-card">
                        <div className="luxury-stat-value">{stats.totalPoints}</div>
                        <div className="luxury-stat-label">Points Earned</div>
                    </div>
                    <div className="luxury-stat-card">
                        <div className="luxury-stat-value">{stats.completedQuests}</div>
                        <div className="luxury-stat-label">Quests Complete</div>
                    </div>
                    <div className="luxury-stat-card">
                        <div className="luxury-stat-value">{stats.activeTrips}</div>
                        <div className="luxury-stat-label">Trips Planned</div>
                    </div>
                    <div className="luxury-stat-card">
                        <div className="luxury-stat-value">{stats.photosCount}</div>
                        <div className="luxury-stat-label">Photos Shared</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Left Column - Featured Content */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Upcoming Trips - Featured Card */}
                        <div className="glass-card p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="luxury-subheading mb-2">UPCOMING ADVENTURES</p>
                                    <h2 className="luxury-heading-gold text-3xl">Your Trips</h2>
                                </div>
                                <Link to="/trips" className="gold-button-outline text-sm">View All</Link>
                            </div>

                            {upcomingTrips.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="luxury-text-muted mb-4">No adventures planned yet</p>
                                    <Link to="/trips" className="gold-button">Plan Your First Trip</Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {upcomingTrips.map((trip) => (
                                        <div
                                            key={trip._id || trip.id}
                                            className="glass-card p-4 flex items-center gap-4 cursor-pointer"
                                            onClick={() => window.location.href = '/trips'}
                                        >
                                            <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                                                style={{ background: 'linear-gradient(135deg, #1a4a5c, #2d6a7c)' }}>
                                                ✈️
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="luxury-text font-semibold text-lg">{trip.destination}</h4>
                                                <p className="luxury-text-muted text-sm">
                                                    {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'TBD'}
                                                    {trip.end_date && ` - ${new Date(trip.end_date).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-xs"
                                                style={{ backgroundColor: 'rgba(196, 163, 90, 0.2)', color: '#c4a35a' }}>
                                                {trip.status || 'Planned'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Quests */}
                        <div className="glass-card p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="luxury-subheading mb-2">SUSTAINABLE ADVENTURES</p>
                                    <h2 className="luxury-heading-gold text-3xl">Active Quests</h2>
                                </div>
                                <Link to="/quests" className="gold-button-outline text-sm">Explore</Link>
                            </div>

                            {loading ? (
                                <div className="text-center py-8">
                                    <p className="luxury-text-muted">Loading quests...</p>
                                </div>
                            ) : activeQuests.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="luxury-text-muted mb-4">Discover sustainable quests at your destination</p>
                                    <Link to="/quests" className="gold-button">Find Quests</Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {activeQuests.map((quest) => (
                                        <div
                                            key={quest._id || quest.id}
                                            className="glass-card p-4 text-center cursor-pointer"
                                            onClick={() => window.location.href = '/quests'}
                                        >
                                            <div className="text-3xl mb-2">🎯</div>
                                            <h4 className="luxury-text font-medium mb-1">{quest.name || 'Quest'}</h4>
                                            <p className="luxury-text-muted text-xs mb-2">{quest.location || 'Location'}</p>
                                            <span style={{ color: '#c4a35a' }} className="font-bold">{quest.points || 0} pts</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">

                        {/* Recent Activity */}
                        <div className="glass-card p-6">
                            <h3 className="luxury-heading-gold text-xl mb-6">Recent Activity</h3>
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="luxury-text-muted text-sm">No recent activity</p>
                                    <p className="luxury-text-muted text-xs mt-2">Create a trip or complete a quest!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-start gap-3 border-l-2 border-[#c4a35a] pl-4">
                                            <span className="text-xl">{activity.icon}</span>
                                            <div>
                                                <p className="luxury-text text-sm">{activity.message}</p>
                                                <p className="luxury-text-muted text-xs">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-card p-6">
                            <h3 className="luxury-heading-gold text-xl mb-6">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link to="/quests" className="block glass-card p-4 text-center hover:bg-[rgba(255,255,255,0.08)]">
                                    <span className="luxury-text">🎯 Find Nearby Quests</span>
                                </Link>
                                <Link to="/heatmap" className="block glass-card p-4 text-center hover:bg-[rgba(255,255,255,0.08)]">
                                    <span className="luxury-text">🗺️ View Crowd Heatmap</span>
                                </Link>
                                <Link to="/chat" className="block glass-card p-4 text-center hover:bg-[rgba(255,255,255,0.08)]">
                                    <span className="luxury-text">💬 AI Travel Assistant</span>
                                </Link>
                            </div>
                        </div>

                        {/* Top Explorers Placeholder */}
                        <div className="glass-card p-6">
                            <h3 className="luxury-heading-gold text-xl mb-4">Top Explorers</h3>
                            <div className="text-center py-4">
                                <p className="luxury-text-muted text-sm">Complete quests to join the leaderboard!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
