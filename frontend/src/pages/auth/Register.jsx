import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'tourist'
    })
    const [isLoading, setIsLoading] = useState(false)
    const [localError, setLocalError] = useState('')

    const { signup, loginWithGoogle, sendVerificationEmail, error, clearError, currentUser } = useAuth()
    const { getThemeStyles, themeColors } = useTheme()
    const navigate = useNavigate()

    // Redirect if already logged in
    if (currentUser) {
        // If logged in but not verify, go to verify
        if (!currentUser.emailVerified) {
            return <Navigate to="/verify-email" replace />
        }
        return <Navigate to="/dashboard" replace />
    }

    function handleChange(e) {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()

        // Validation
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setLocalError('Please fill in all fields')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setLocalError('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)
        setLocalError('')
        clearError()

        try {
            await signup(formData.email, formData.password, formData.name)
            await sendVerificationEmail()
            navigate('/verify-email', { replace: true })
        } catch (err) {
            console.error('Registration failed:', err)
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
            // Check if onboarding was completed (returning user via Google)
            const prefs = localStorage.getItem('userPreferences')
            const onboardingCompleted = prefs && JSON.parse(prefs).onboardingCompleted
            navigate(onboardingCompleted ? '/dashboard' : '/onboarding', { replace: true })
        } catch (err) {
            console.error('Google sign-in failed:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const displayError = localError || error

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8" style={getThemeStyles.pageBackground}>
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2" style={{ color: themeColors.text }}>
                        Vaaya
                    </h1>
                    <p style={{ color: themeColors.textSecondary }}>
                        Create your account to get started
                    </p>
                </div>

                {/* Register Card */}
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

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.textSecondary }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
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
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
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
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                                style={{
                                    background: themeColors.inputBg || themeColors.background,
                                    border: `1px solid ${themeColors.border}`,
                                    color: themeColors.text
                                }}
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 mt-2"
                            style={{
                                background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accentSecondary || themeColors.accent})`,
                                color: '#fff'
                            }}
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 h-px" style={{ background: themeColors.border }}></div>
                        <span className="px-4 text-sm" style={{ color: themeColors.textSecondary }}>or</span>
                        <div className="flex-1 h-px" style={{ background: themeColors.border }}></div>
                    </div>

                    {/* Google Sign Up */}
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

                    {/* Login Link */}
                    <p className="text-center mt-6" style={{ color: themeColors.textSecondary }}>
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium hover:underline" style={{ color: themeColors.accent }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
