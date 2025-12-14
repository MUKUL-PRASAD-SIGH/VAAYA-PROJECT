import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../services/api'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [localError, setLocalError] = useState('')

    const { login, loginWithGoogle, error, clearError, currentUser } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Hardcoded email routing
    const USER_EMAILS = ['mukulprasad957@gmail.com', 'vol670668@gmail.com']
    const LOCAL_EMAILS = ['mukulprasad958@gmail.com', '1ms24ci076@msrit.edu']

    const getRedirectRoute = (userEmail = '') => {
        // Check hardcoded email routing first
        if (userEmail) {
            if (USER_EMAILS.includes(userEmail.toLowerCase())) {
                localStorage.setItem('userRole', 'tourist')
                return '/dashboard'
            }
            if (LOCAL_EMAILS.includes(userEmail.toLowerCase())) {
                localStorage.setItem('userRole', 'local')
                return '/local-guide'
            }
        }
        // Fall back to localStorage
        const userRole = localStorage.getItem('userRole')
        return userRole === 'local' ? '/local-guide' : '/dashboard'
    }

    // Check if user has completed onboarding
    const checkOnboardingAndRedirect = async (user) => {
        // First check backend
        try {
            const response = await userApi.getMe()
            const userData = response.data?.user
            if (userData?.preferences?.onboarding_completed) {
                // Use hardcoded email routing instead of backend role
                const userEmail = user?.email || email
                navigate(getRedirectRoute(userEmail), { replace: true })
                return
            }
        } catch (e) {
            console.log('Backend check failed, using local check')
        }

        // Check localStorage
        const prefs = localStorage.getItem('userPreferences')
        if (prefs) {
            try {
                const parsed = JSON.parse(prefs)
                if (parsed.onboardingCompleted) {
                    const userEmail = user?.email || email
                    navigate(getRedirectRoute(userEmail), { replace: true })
                    return
                }
            } catch (e) { }
        }

        // Check if user is truly new (created within last 5 minutes)
        const creationTime = user?.metadata?.creationTime
        if (creationTime) {
            const created = new Date(creationTime)
            const now = new Date()
            const diffMinutes = (now - created) / 60000
            if (diffMinutes < 5) {
                // New user - go to onboarding
                navigate('/onboarding', { replace: true })
                return
            }
        }

        // Default: if no onboarding completed flag, go to onboarding
        navigate('/onboarding', { replace: true })
    }

    if (currentUser) {
        return <Navigate to={getRedirectRoute(currentUser?.email)} replace />
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!email || !password) { setLocalError('Please fill in all fields'); return }

        setIsLoading(true)
        setLocalError('')
        clearError()

        try {
            const user = await login(email, password)
            await checkOnboardingAndRedirect(user)
        } catch (err) {
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
            const user = await loginWithGoogle()

            // Check if this is a brand new Google user (created just now)
            const creationTime = user?.metadata?.creationTime
            const lastSignIn = user?.metadata?.lastSignInTime

            if (creationTime && lastSignIn) {
                const created = new Date(creationTime)
                const lastLogin = new Date(lastSignIn)
                const diffMs = Math.abs(lastLogin - created)

                // If creation time and last sign in are within 10 seconds, this is first signup
                if (diffMs < 10000) {
                    localStorage.removeItem('userPreferences') // Clear any old prefs
                    navigate('/onboarding', { replace: true })
                    return
                }
            }

            await checkOnboardingAndRedirect(user)
        } catch (err) {
            console.error('Google sign-in failed:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const displayError = localError || error

    return (
        <div className="min-h-screen luxury-bg-aurora flex items-center justify-center px-4">
            <div className="w-full max-w-sm relative z-10" style={{ minWidth: 320, maxWidth: 380 }}>
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="luxury-heading-gold text-5xl mb-3">Vaaya</h1>
                    <p className="luxury-text-muted">Welcome back! Sign in to continue</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-6" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>
                    {displayError && (
                        <div className="mb-6 p-4 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                            {displayError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="luxury-subheading block mb-2">EMAIL</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-full luxury-input" disabled={isLoading} />
                        </div>

                        <div>
                            <label className="luxury-subheading block mb-2">PASSWORD</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="w-full luxury-input" disabled={isLoading} />
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm" style={{ color: '#c4a35a' }}>Forgot password?</Link>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full gold-button py-2 text-base" style={{ fontWeight: 600, fontSize: '1rem' }}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}></div>
                        <span className="px-4 luxury-text-muted text-sm">or</span>
                        <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}></div>
                    </div>

                    <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-2 rounded gold-button-outline text-base" style={{ fontWeight: 500, fontSize: '0.95rem', minHeight: 0, marginTop: 0 }}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="mt-6 text-center luxury-text-muted text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: '#c4a35a' }}>Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
