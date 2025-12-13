import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
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
    Award,
    Languages
} from 'lucide-react'
import QuestCreator from './QuestCreator'
import TravelerMonitor from './TravelerMonitor'
import ContentStudio from './ContentStudio'
import ChatCenter from './ChatCenter'
import AnalyticsDashboard from './AnalyticsDashboard'
import Profile from './Profile'
import HospitalityTab from './HospitalityTab'
import './LocalGuideDashboard.css'

function LocalGuideDashboard() {
    const [activeTab, setActiveTab] = useState('overview')
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const { themeColors } = useTheme()
    const { t, language, toggleLanguage, enterDashboardScope, exitDashboardScope } = useLanguage()

    // Define TABS inside component to use translations
    const TABS = [
        { id: 'overview', label: t('overview'), icon: LayoutDashboard },
        { id: 'quests', label: t('questCreator'), icon: Map },
        { id: 'travelers', label: t('travelers'), icon: Users },
        { id: 'content', label: t('contentStudio'), icon: Camera },
        { id: 'hospitality', label: t('hospitality'), icon: Home },
        { id: 'chat', label: t('chatCenter'), icon: MessageSquare },
        { id: 'analytics', label: t('analytics'), icon: TrendingUp },
        { id: 'profile', label: t('profile'), icon: User }
    ]

    // Subtitles map for each tab
    const subtitles = {
        overview: t('overviewSubtitle'),
        quests: t('questsSubtitle'),
        travelers: t('travelersSubtitle'),
        content: t('contentSubtitle'),
        hospitality: t('hospitalitySubtitle'),
        chat: t('chatSubtitle'),
        analytics: t('analyticsSubtitle'),
        profile: t('profileSubtitle')
    }

    // Enter dashboard scope when component mounts, exit when unmounts
    useEffect(() => {
        enterDashboardScope()
        return () => exitDashboardScope()
    }, [enterDashboardScope, exitDashboardScope])

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
                    <h2>{dashboardData?.guide?.name || t('localGuide')}</h2>
                    {dashboardData?.guide?.verified && (
                        <span className="guide-badge">
                            <CheckCircle size={14} /> {t('verified')}
                        </span>
                    )}
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
                        <span className="earnings-label">{t('thisMonth')}</span>
                        <span className="earnings-amount">₹{earnings.toLocaleString()}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>{TABS.find(tab => tab.id === activeTab)?.label}</h1>
                        <p className="header-subtitle">{subtitles[activeTab]}</p>
                    </div>
                    <div className="header-right">
                        {/* Language Toggle Switch */}
                        <div
                            className={`language-toggle-btn ${language === 'kn' ? 'kannada-active' : ''}`}
                            onClick={toggleLanguage}
                            title={language === 'en' ? 'Switch to Kannada' : 'Switch to English'}
                        >
                            <span className={`lang-option ${language === 'en' ? 'active' : ''}`}>EN</span>
                            <span className={`lang-option ${language === 'kn' ? 'active' : ''}`}>ಕನ್ನಡ</span>
                        </div>

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
    const { t } = useLanguage()

    const stats = data ? [
        {
            label: t('activeQuests'),
            value: data.stats?.active_quests || 0,
            trend: t('yourCreatedQuests'),
            color: '#667eea',
            icon: Target
        },
        {
            label: t('travelersHelped'),
            value: data.stats?.total_completions || 0,
            trend: t('questCompletions'),
            color: '#22d3ee',
            icon: Users
        },
        {
            label: t('contentPosts'),
            value: data.stats?.content_posts || 0,
            trend: t('storiesAndTips'),
            color: '#c084fc',
            icon: Grid
        },
        {
            label: t('rating'),
            value: data.guide?.rating?.toFixed(1) || '0.0',
            trend: t('yourReputation'),
            color: '#fbbf24',
            icon: Star
        }
    ] : []

    const recentActivity = [
        { type: 'quest', message: t('newTravelerJoined'), time: `2 ${t('hoursAgo')}`, icon: MapPin },
        { type: 'chat', message: t('messageFromTraveler'), time: `3 ${t('hoursAgo')}`, icon: MessageSquare },
        { type: 'content', message: t('postGotEngagement'), time: `5 ${t('hoursAgo')}`, icon: Camera },
        { type: 'earnings', message: t('earnedPoints'), time: `1 ${t('dayAgo')}`, icon: DollarSign }
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
                    <span>{t('loading')}</span>
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
                    <span>{t('youHave')} {data.stats.pending_verifications} {t('pendingVerifications')}</span>
                </div>
            )}

            {/* Quick Actions with Animated Hot Icons */}
            <div className="quick-actions">
                <h3>{t('quickActions')}</h3>
                <div className="actions-grid">
                    <button className="action-card action-quest" onClick={handleCreateQuest}>
                        <div className="action-icon-wrapper pulse">
                            <PlusCircle size={24} />
                        </div>
                        <span>{t('createQuest')}</span>
                    </button>
                    <button className="action-card action-post hot" onClick={handleNewPost}>
                        <div className="action-icon-wrapper bounce">
                            <Edit3 size={24} />
                            <span className="hot-badge">🔥</span>
                        </div>
                        <span>{t('newPost')}</span>
                    </button>
                    <button className="action-card action-chat" onClick={handleReplyMessages}>
                        <div className="action-icon-wrapper shake">
                            <MessageSquare size={24} />
                            {data?.stats?.unread_messages > 0 && (
                                <span className="unread-count">{data.stats.unread_messages}</span>
                            )}
                        </div>
                        <span>{t('replyToMessages')}</span>
                    </button>
                    <button className="action-card" onClick={onRefresh}>
                        <div className="action-icon-wrapper">
                            <RefreshCw size={24} />
                        </div>
                        <span>{t('refreshData')}</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
                <h3>{t('recentActivity')}</h3>
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

