import { useState, useEffect } from 'react'
import { localGuideApi } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import './AnalyticsDashboard.css'

function AnalyticsDashboard() {
    const { t } = useLanguage()
    const [timeRange, setTimeRange] = useState('month')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalEarnings: 0,
        thisMonth: 0,
        lastMonth: 0,
        totalTravelers: 0,
        activeQuests: 0,
        completedQuests: 0,
        rating: 0,
        reviews: 0
    })
    const [topQuests, setTopQuests] = useState([])
    const [transactions, setTransactions] = useState([])
    const [message, setMessage] = useState({ type: '', text: '' })
    const [withdrawAmount, setWithdrawAmount] = useState('')

    useEffect(() => {
        loadAnalytics()
        loadEarnings()
    }, [timeRange])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const response = await localGuideApi.getAnalytics(timeRange)
            const data = response.data.overview || {}
            setStats({
                totalEarnings: response.data.earnings?.total || 0,
                thisMonth: response.data.earnings?.this_month || 0,
                lastMonth: (response.data.earnings?.this_month || 0) * 0.8, // Placeholder for last month
                totalTravelers: data.total_completions || 0,
                activeQuests: data.total_quests || 0,
                completedQuests: data.total_completions || 0,
                rating: data.rating || 0,
                reviews: data.total_likes || 0
            })
            setTopQuests(response.data.top_quests || [])
        } catch (error) {
            console.error('Failed to load analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadEarnings = async () => {
        try {
            const response = await localGuideApi.getEarnings()
            setTransactions(response.data.earnings || [])
        } catch (error) {
            console.error('Failed to load earnings:', error)
        }
    }

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawAmount)
        if (!amount || amount < 500) {
            setMessage({ type: 'error', text: 'Minimum withdrawal is ₹500' })
            return
        }
        try {
            await localGuideApi.requestWithdrawal({ amount, method: 'upi' })
            setMessage({ type: 'success', text: 'Withdrawal request submitted!' })
            setWithdrawAmount('')
            loadEarnings()
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Withdrawal failed' })
        }
    }

    const chartData = {
        weekly: [3200, 2800, 4100, 3600, 2900, 5200, 4500],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }

    const maxValue = Math.max(...chartData.weekly, 1)
    const growthPercent = stats.lastMonth > 0
        ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1)
        : 0

    return (
        <div className="analytics-dashboard">
            {/* Time Range Selector */}
            <div className="time-range-selector">
                {['week', 'month', 'year'].map(range => (
                    <button
                        key={range}
                        className={`range-btn ${timeRange === range ? 'active' : ''}`}
                        onClick={() => setTimeRange(range)}
                    >
                        This {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                ))}
            </div>

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="stat-card earnings">
                    <div className="stat-header">
                        <span className="stat-icon">💰</span>
                        <span className={`stat-trend ${Number(growthPercent) >= 0 ? 'up' : 'down'}`}>
                            {Number(growthPercent) >= 0 ? '↑' : '↓'} {Math.abs(growthPercent)}%
                        </span>
                    </div>
                    <div className="stat-value">₹{stats.thisMonth.toLocaleString()}</div>
                    <div className="stat-label">{t('monthlyEarnings')}</div>
                    <div className="stat-comparison">
                        vs ₹{stats.lastMonth.toLocaleString()} {t('lastMonth')}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-icon">👥</span>
                    </div>
                    <div className="stat-value">{stats.totalTravelers}</div>
                    <div className="stat-label">{t('travelersHelped')}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-icon">🎯</span>
                    </div>
                    <div className="stat-value">{stats.completedQuests}</div>
                    <div className="stat-label">{t('completed')}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-icon">⭐</span>
                    </div>
                    <div className="stat-value">{stats.rating}</div>
                    <div className="stat-label">{stats.reviews} {t('reviews')}</div>
                </div>
            </div>

            <div className="analytics-grid">
                {/* Earnings Chart */}
                <div className="chart-section">
                    <div className="section-header">
                        <h3>{t('earningsOverview')}</h3>
                        <div className="chart-legend">
                            <span className="legend-item">
                                <span className="legend-dot"></span>
                                {t('dailyEarnings')}
                            </span>
                        </div>
                    </div>
                    <div className="chart-container">
                        <div className="chart-bars">
                            {chartData.weekly.map((value, index) => (
                                <div key={index} className="chart-bar-wrapper">
                                    <div
                                        className="chart-bar"
                                        style={{ height: `${(value / maxValue) * 100}%` }}
                                    >
                                        <span className="bar-value">₹{value}</span>
                                    </div>
                                    <span className="bar-label">{chartData.labels[index]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Performing Quests */}
                <div className="quests-section">
                    <div className="section-header">
                        <h3>{t('topPerformingQuests')}</h3>
                    </div>
                    <div className="quests-list">
                        {topQuests.map((quest, index) => (
                            <div key={quest.id} className="quest-row">
                                <span className="quest-rank">#{index + 1}</span>
                                <div className="quest-info">
                                    <h4>{quest.title}</h4>
                                    <div className="quest-meta">
                                        <span>✅ {quest.completions} completed</span>
                                        <span>⭐ {quest.rating}</span>
                                    </div>
                                </div>
                                <div className="quest-earnings">
                                    ₹{quest.earnings.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="transactions-section">
                <div className="section-header">
                    <h3>Recent Transactions</h3>
                    <button className="view-all-btn">View All →</button>
                </div>
                <div className="transactions-list">
                    {transactions.map(transaction => (
                        <div key={transaction.id} className="transaction-row">
                            <div className={`transaction-icon ${transaction.type}`}>
                                {transaction.type === 'earning' ? '↓' : '↑'}
                            </div>
                            <div className="transaction-info">
                                <h4>{transaction.description}</h4>
                                <span className="transaction-date">{transaction.date}</span>
                            </div>
                            <div className={`transaction-amount ${transaction.type}`}>
                                {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Withdrawal Section */}
            <div className="withdrawal-section">
                <div className="balance-card">
                    <div className="balance-info">
                        <span className="balance-label">Available Balance</span>
                        <span className="balance-amount">₹{(stats.totalEarnings - 5000).toLocaleString()}</span>
                    </div>
                    <button className="withdraw-btn">
                        💳 Withdraw Funds
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AnalyticsDashboard
