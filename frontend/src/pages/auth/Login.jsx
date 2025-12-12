import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { userApi } from '../../services/api'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [localError, setLocalError] = useState('')

    const { login, loginWithGoogle, error, clearError, currentUser } = useAuth()
    const { getThemeStyles, themeColors } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()

    // Get redirect route based on user role
    const getRedirectRoute = () => {
        const userRole = localStorage.getItem('userRole')
        return userRole === 'local' ? '/local-guide' : '/dashboard'
    }
    const from = location.state?.from?.pathname || getRedirectRoute()

    // Redirect if already logged in based on role
    if (currentUser) {
        const redirectPath = getRedirectRoute()
        return <Navigate to={redirectPath} replace />
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!email || !password) {
            setLocalError('Please fill in all fields')
            return
        }

        setIsLoading(true)
        setLocalError('')
        clearError()

        try {
            await login(email, password)

            // Try to fetch user's role from backend (per-account persistence)
            try {
                const response = await userApi.getMe()
                const userData = response.data?.user

                if (userData && userData.preferences?.onboarding_completed) {
                    // User has completed onboarding - use backend-stored role
                    const backendRole = userData.role || userData.preference
                    const isLocal = backendRole === 'local'
                    localStorage.setItem('userRole', isLocal ? 'local' : 'tourist')
                    localStorage.setItem('userPreferences', JSON.stringify({
                        ...userData.preferences,
                        onboardingCompleted: true
                    }))
                    navigate(isLocal ? '/local-guide' : '/dashboard', { replace: true })
                    return
                }
            } catch (apiError) {
                console.log('Backend user fetch failed, using localStorage fallback:', apiError)
            }

            // Fallback to localStorage check
            const prefs = localStorage.getItem('userPreferences')
            const onboardingCompleted = prefs && JSON.parse(prefs).onboardingCompleted
            if (onboardingCompleted) {
                const userRole = localStorage.getItem('userRole')
                navigate(userRole === 'local' ? '/local-guide' : '/dashboard', { replace: true })
            } else {
                navigate('/onboarding', { replace: true })
            }
        } catch (err) {
            // Error is handled by AuthContext
            console.error('Login failed:', err)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGoogleSignIn() {
        setIsLoading(true)
        setLocalError('')
        clearError()

        try {
            await loginWithGoogle()

            // Try to fetch user's role from backend (per-account persistence)
            try {
                const response = await userApi.getMe()
                const userData = response.data?.user

                if (userData && userData.preferences?.onboarding_completed) {
                    // User has completed onboarding - use backend-stored role
                    const backendRole = userData.role || userData.preference
                    const isLocal = backendRole === 'local'
                    localStorage.setItem('userRole', isLocal ? 'local' : 'tourist')
                    localStorage.setItem('userPreferences', JSON.stringify({
                        ...userData.preferences,
                        onboardingCompleted: true
                    }))
                    navigate(isLocal ? '/local-guide' : '/dashboard', { replace: true })
                    return
                }
            } catch (apiError) {
                console.log('Backend user fetch failed, using localStorage fallback:', apiError)
            }

            // Fallback to localStorage check
            const prefs = localStorage.getItem('userPreferences')
            const onboardingCompleted = prefs && JSON.parse(prefs).onboardingCompleted
            if (onboardingCompleted) {
                const userRole = localStorage.getItem('userRole')
                navigate(userRole === 'local' ? '/local-guide' : '/dashboard', { replace: true })
            } else {
                navigate('/onboarding', { replace: true })
            }
        } catch (err) {
            console.error('Google sign-in failed:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const displayError = localError || error

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={getThemeStyles.pageBackground}>
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2" style={{ color: themeColors.text }}>
                        Vaaya
                    </h1>
                    <p style={{ color: themeColors.textSecondary }}>
                        Welcome back! Sign in to continue
                    </p>
                </div>

                {/* Login Card */}
                <div className="rounded-2xl p-8 shadow-xl" style={{
                    background: themeColors.cardBg,
                    border: `1px solid ${themeColors.border}`
                }}>
                    {/* Error Display */}
                    {displayError && (
                        <div className="mb-6 p-4 rounded-lg text-sm" style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444'
                        }}>
                            {displayError}
                        </div>
                    )}

                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.textSecondary }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                                style={{
                                    background: themeColors.inputBg || themeColors.background,
                                    border: `1px solid ${themeColors.border}`,
                                    color: themeColors.text
                                }}
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.textSecondary }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                                style={{
                                    background: themeColors.inputBg || themeColors.background,
                                    border: `1px solid ${themeColors.border}`,
                                    color: themeColors.text
                                }}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm hover:underline"
                                style={{ color: themeColors.accent }}
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                            style={{
                                background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accentSecondary || themeColors.accent})`,
                                color: '#fff'
                            }}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 h-px" style={{ background: themeColors.border }}></div>
                        <span className="px-4 text-sm" style={{ color: themeColors.textSecondary }}>or</span>
                        <div className="flex-1 h-px" style={{ background: themeColors.border }}></div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3"
                        style={{
                            background: themeColors.background,
                            border: `1px solid ${themeColors.border}`,
                            color: themeColors.text
                        }}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center mt-6" style={{ color: themeColors.textSecondary }}>
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium hover:underline" style={{ color: themeColors.accent }}>
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
