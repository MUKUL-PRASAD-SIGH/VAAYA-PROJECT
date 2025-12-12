import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { localGuideApi } from '../../services/api'
import {
    LayoutDashboard,
    Map,
    Users,
    Camera,
    MessageSquare,
    TrendingUp,
    User,
    Bell,
    CheckCircle,
    Info,
    Target,
    Grid,
    Star,
    PlusCircle,
    Edit3,
    RefreshCw,
    MapPin,
    DollarSign,
    Home,
    Award
} from 'lucide-react'
import QuestCreator from './QuestCreator'
import TravelerMonitor from './TravelerMonitor'
import ContentStudio from './ContentStudio'
import ChatCenter from './ChatCenter'
import AnalyticsDashboard from './AnalyticsDashboard'
import Profile from './Profile'
import HospitalityTab from './HospitalityTab'
import './LocalGuideDashboard.css'

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'quests', label: 'Quest Creator', icon: Map },
    { id: 'travelers', label: 'Travellers', icon: Users },
    { id: 'content', label: 'Content Studio', icon: Camera },
    { id: 'hospitality', label: 'Hospitality', icon: Home },
    { id: 'chat', label: 'Chat Center', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User }
]

function LocalGuideDashboard() {
    const [activeTab, setActiveTab] = useState('overview')
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const { themeColors } = useTheme()

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const response = await localGuideApi.getDashboard()
            setDashboardData(response.data)
        } catch (error) {
            console.error('Failed to load dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab data={dashboardData} loading={loading} onRefresh={loadDashboardData} setActiveTab={setActiveTab} />
            case 'quests':
                return <QuestCreator />
            case 'travelers':
                return <TravelerMonitor />
            case 'content':
                return <ContentStudio />
            case 'hospitality':
                return <HospitalityTab />
            case 'chat':
                return <ChatCenter />
            case 'analytics':
                return <AnalyticsDashboard />
            case 'profile':
                return <Profile />
            default:
                return <OverviewTab data={dashboardData} loading={loading} />
        }
    }

    const earnings = dashboardData?.earnings?.this_month || 0

    return (
        <div className="local-guide-dashboard">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="guide-avatar">
                        <User className="avatar-icon" size={32} />
                    </div>
                    <h2>{dashboardData?.guide?.name || 'Local Guide'}</h2>
                    <span className="guide-badge">
                        {dashboardData?.guide?.verified ? (
                            <><CheckCircle size={14} /> Verified</>
                        ) : (
                            <><Info size={14} /> Pending</>
                        )}
                    </span>
                </div>

                <nav className="sidebar-nav">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={20} />
                            <span className="nav-label">{tab.label}</span>
                            {tab.id === 'travelers' && dashboardData?.stats?.pending_verifications > 0 && (
                                <span className="nav-badge">{dashboardData.stats.pending_verifications}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="earnings-preview">
                        <span className="earnings-label">This Month</span>
                        <span className="earnings-amount">₹{earnings.toLocaleString()}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>{TABS.find(t => t.id === activeTab)?.label}</h1>
                        <p className="header-subtitle">
                            {activeTab === 'overview' && 'Welcome back! Here\'s your guide activity summary.'}
                            {activeTab === 'quests' && 'Create and manage quests for travelers.'}
                            {activeTab === 'travelers' && 'Monitor and assist your connected travelers.'}
                            {activeTab === 'content' && 'Share your local knowledge and experiences.'}
                            {activeTab === 'chat' && 'Communicate with travelers and support.'}
                            {activeTab === 'analytics' && 'Track your performance and earnings.'}
                            {activeTab === 'profile' && 'Manage your guide profile and settings.'}
                        </p>
                    </div>
                    <div className="header-right">
                        <button className="notification-btn">
                            <Bell size={24} />
                            {dashboardData?.stats?.pending_verifications > 0 && (
                                <span className="notification-badge">
                                    {dashboardData?.stats?.pending_verifications}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    )
}



function OverviewTab({ data, loading, onRefresh, setActiveTab }) {
    const stats = data ? [
        {
            label: 'Active Quests',
            value: data.stats?.active_quests || 0,
            trend: 'Your created quests',
            color: '#667eea',
            icon: Target
        },
        {
            label: 'Travelers Helped',
            value: data.stats?.total_completions || 0,
            trend: 'Quest completions',
            color: '#22d3ee',
            icon: Users
        },
        {
            label: 'Content Posts',
            value: data.stats?.content_posts || 0,
            trend: 'Stories & tips',
            color: '#c084fc',
            icon: Grid
        },
        {
            label: 'Rating',
            value: data.guide?.rating?.toFixed(1) || '0.0',
            trend: 'Your reputation',
            color: '#fbbf24',
            icon: Star
        }
    ] : []

    const recentActivity = [
        { type: 'quest', message: 'New traveler joined your quest', time: '2 hours ago', icon: MapPin },
        { type: 'chat', message: 'Message from a traveler', time: '3 hours ago', icon: MessageSquare },
        { type: 'content', message: 'Your post got engagement', time: '5 hours ago', icon: Camera },
        { type: 'earnings', message: 'Earned points for completed quest', time: '1 day ago', icon: DollarSign }
    ]

    // Quick action handlers with navigation
    const handleCreateQuest = () => {
        setActiveTab('quests')
    }

    const handleNewPost = () => {
        setActiveTab('content')
    }

    const handleReplyMessages = () => {
        setActiveTab('chat')
    }

    if (loading) {
        return (
            <div className="overview-tab loading">
                <div className="loading-spinner">
                    <RefreshCw className="animate-spin" size={32} />
                    <span>Loading...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="overview-tab">
            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ '--accent-color': stat.color }}>
                        <div className="stat-icon-wrapper">
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                            <span className="stat-trend">{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Verifications Alert */}
            {data?.stats?.pending_verifications > 0 && (
                <div className="pending-alert">
                    <Info size={20} />
                    <span>You have {data.stats.pending_verifications} pending quest verifications</span>
                </div>
            )}

            {/* Quick Actions with Animated Hot Icons */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                    <button className="action-card action-quest" onClick={handleCreateQuest}>
                        <div className="action-icon-wrapper pulse">
                            <PlusCircle size={24} />
                        </div>
                        <span>Create Quest</span>
                    </button>
                    <button className="action-card action-post hot" onClick={handleNewPost}>
                        <div className="action-icon-wrapper bounce">
                            <Edit3 size={24} />
                            <span className="hot-badge">🔥</span>
                        </div>
                        <span>New Post</span>
                    </button>
                    <button className="action-card action-chat" onClick={handleReplyMessages}>
                        <div className="action-icon-wrapper shake">
                            <MessageSquare size={24} />
                            {data?.stats?.unread_messages > 0 && (
                                <span className="unread-count">{data.stats.unread_messages}</span>
                            )}
                        </div>
                        <span>Reply to Messages</span>
                    </button>
                    <button className="action-card" onClick={onRefresh}>
                        <div className="action-icon-wrapper">
                            <RefreshCw size={24} />
                        </div>
                        <span>Refresh Data</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                    {recentActivity.map((activity, index) => (
                        <div key={index} className="activity-item">
                            <div className="activity-icon">
                                <activity.icon size={16} />
                            </div>
                            <div className="activity-content">
                                <p>{activity.message}</p>
                                <span className="activity-time">{activity.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LocalGuideDashboard

