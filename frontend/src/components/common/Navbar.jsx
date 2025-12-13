import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAccentColor } from '../../context/AccentColorContext'
import { useAuth } from '../../context/AuthContext'
import StarBorder from './StarBorder'

export default function Navbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const [showDropdown, setShowDropdown] = useState(false)
    const { isDarkMode, themeColors, getThemeStyles } = useTheme()
    const { colors, accentColor } = useAccentColor()
    const { currentUser, logout } = useAuth()

    // Get user role
    const userRole = localStorage.getItem('userRole')

    // Links for travelers
    const travelerLinks = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/reels', label: 'Reels' },
        { path: '/quests', label: 'Quests' },
        { path: '/trips', label: 'Trips' },
        { path: '/heatmap', label: 'Heatmap' },
        { path: '/chat', label: 'Chat' },
    ]

    // Links for local guides - minimal since LocalGuideDashboard has its own sidebar
    const localGuideLinks = [
        { path: '/local-guide', label: 'Guide Dashboard' },
    ]

    // Choose links based on role
    const navLinks = userRole === 'local' ? localGuideLinks : travelerLinks

    const isActive = (path) => location.pathname === path

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login')
        } catch (error) {
            console.error('Failed to logout', error)
        }
    }

    // Get display name or email part
    const getDisplayName = () => {
        if (currentUser?.displayName) return currentUser.displayName
        if (currentUser?.email) return currentUser.email.split('@')[0]
        return 'User'
    }

    return (
        <nav className="shadow-lg relative z-50" style={{
            ...getThemeStyles.card,
            backgroundColor: `rgba(${isDarkMode ? '31, 41, 55' : '255, 255, 255'}, 0.7)`,
            color: '#181818', // Force dark text for visibility
        }}>
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/dashboard"
                            className="text-2xl font-bold tracking-wider"
                            style={{
                                color: themeColors.primary,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                fontWeight: '700'
                            }}
                        >
                            VAYAA
                        </Link>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex items-center space-x-3">
                        {currentUser && navLinks.map((link) => (
                            isDarkMode ? (
                                <Link key={link.path} to={link.path}>
                                    <StarBorder
                                        as="span"
                                        color={accentColor}
                                        speed={4}
                                        className={isActive(link.path) ? 'active' : ''}
                                    >
                                        {link.label}
                                    </StarBorder>
                                </Link>
                            ) : (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-lg font-semibold transition`}
                                    style={isActive(link.path)
                                        ? { backgroundColor: colors.primary, color: 'white' }
                                        : { color: '#4b5563' }
                                    }
                                    onMouseEnter={(e) => {
                                        if (!isActive(link.path)) {
                                            e.target.style.color = colors.primary
                                            e.target.style.backgroundColor = `${colors.primary}15`
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive(link.path)) {
                                            e.target.style.color = '#4b5563'
                                            e.target.style.backgroundColor = 'transparent'
                                        }
                                    }}
                                >
                                    {link.label}
                                </Link>
                            )
                        ))}

                        {currentUser ? (
                            <div className="relative ml-4">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center space-x-2 focus:outline-none"
                                >
                                    <img
                                        src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=9333ea&color=fff`}
                                        className="w-9 h-9 rounded-full border-2"
                                        style={{ borderColor: themeColors.border }}
                                        alt="User avatar"
                                    />
                                    <span className="font-medium max-w-[100px] truncate" style={{ color: themeColors.textSecondary }}>
                                        {getDisplayName()}
                                    </span>
                                </button>
                                {showDropdown && (
                                    <div
                                        className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-2 animate-fadeIn"
                                        style={{
                                            background: 'rgba(15, 32, 39, 0.95)',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(196, 163, 90, 0.2)'
                                        }}
                                    >
                                        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                            <p className="text-sm truncate" style={{ color: '#c4a35a', fontWeight: 500 }}>{getDisplayName()}</p>
                                            <p className="text-xs truncate" style={{ color: 'rgba(245,245,245,0.5)' }}>{currentUser.email}</p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-3 transition-all"
                                            style={{ color: '#f5f5f5' }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(196, 163, 90, 0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            👤 Profile
                                        </Link>
                                        <Link
                                            to="/settings"
                                            className="block px-4 py-3 transition-all"
                                            style={{ color: '#f5f5f5' }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(196, 163, 90, 0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            ⚙️ Settings
                                        </Link>
                                        <Link
                                            to="/personalisation"
                                            className="block px-4 py-3 transition-all"
                                            style={{ color: '#f5f5f5' }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(196, 163, 90, 0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            🎨 Personalisation
                                        </Link>
                                        <hr className="my-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                                        <button
                                            onClick={() => {
                                                handleLogout()
                                                setShowDropdown(false)
                                            }}
                                            className="block w-full text-left px-4 py-3 transition-all"
                                            style={{ color: '#ef4444' }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            🚪 Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3 ml-4">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                                    style={{ color: themeColors.text }}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 rounded-lg font-medium transition-transform hover:scale-105"
                                    style={{
                                        background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accentSecondary || themeColors.accent})`,
                                        color: '#fff'
                                    }}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

