import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../services/api'

export default function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'tourist' })
    const [isLoading, setIsLoading] = useState(false)
    const [localError, setLocalError] = useState('')

    const { signup, loginWithGoogle, sendVerificationEmail, error, clearError, currentUser } = useAuth()
    const navigate = useNavigate()

    if (currentUser) {
        if (!currentUser.emailVerified) return <Navigate to="/verify-email" replace />
        const redirectPath = localStorage.getItem('userRole') === 'local' ? '/local-guide' : '/dashboard'
        return <Navigate to={redirectPath} replace />
    }

    function handleChange(e) {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setLocalError('Please fill in all fields'); return
        }
        if (formData.password !== formData.confirmPassword) { setLocalError('Passwords do not match'); return }
        if (formData.password.length < 6) { setLocalError('Password must be at least 6 characters'); return }

        setIsLoading(true)
        setLocalError('')
        clearError()

        try {
            localStorage.removeItem('userPreferences') // Clear any stale prefs for fresh onboarding
            await signup(formData.email, formData.password, formData.name)
            localStorage.setItem('userRole', formData.role)
            await sendVerificationEmail()
            navigate('/verify-email', { replace: true })
        } catch (err) { console.error('Registration failed:', err) }
        finally { setIsLoading(false) }
    }

    async function handleGoogleSignIn() {
        setIsLoading(true)
        setLocalError('')
        clearError()

        try {
            await loginWithGoogle()
            try {
                const response = await userApi.getMe()
                const userData = response.data?.user
                if (userData && userData.preferences?.onboarding_completed) {
                    const isLocal = userData.role === 'local'
                    localStorage.setItem('userRole', isLocal ? 'local' : 'tourist')
                    navigate(isLocal ? '/local-guide' : '/dashboard', { replace: true })
                    return
                }
            } catch (e) { console.log('Backend fetch failed:', e) }

            const prefs = localStorage.getItem('userPreferences')
            if (prefs && JSON.parse(prefs).onboardingCompleted) {
                navigate(localStorage.getItem('userRole') === 'local' ? '/local-guide' : '/dashboard', { replace: true })
            } else {
                navigate('/onboarding', { replace: true })
            }
        } catch (err) { console.error('Google sign-in failed:', err) }
        finally { setIsLoading(false) }
    }

    const displayError = localError || error

    return (
        <div className="min-h-screen luxury-bg-aurora flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm relative z-10" style={{ minWidth: 320, maxWidth: 380 }}>
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="luxury-heading-gold text-5xl mb-3">Vaaya</h1>
                    <p className="luxury-text-muted">Create your account to get started</p>
                </div>

                {/* Register Card */}
                <div className="glass-card p-6" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>
                    {displayError && (
                        <div className="mb-6 p-4 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                            {displayError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="luxury-subheading block mb-2">FULL NAME</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" className="w-full luxury-input" disabled={isLoading} />
                        </div>

                        <div>
                            <label className="luxury-subheading block mb-2">EMAIL</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your email" className="w-full luxury-input" disabled={isLoading} />
                        </div>

                        <div>
                            <label className="luxury-subheading block mb-2">PASSWORD</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" className="w-full luxury-input" disabled={isLoading} />
                        </div>

                        <div>
                            <label className="luxury-subheading block mb-2">CONFIRM PASSWORD</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" className="w-full luxury-input" disabled={isLoading} />
                        </div>



                        <button type="submit" disabled={isLoading} className="w-full gold-button disabled:opacity-50 mt-2 py-2 text-base" style={{ fontWeight: 600, fontSize: '1rem' }}>
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
                        <span className="px-4 luxury-text-muted text-sm">or</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
                    </div>

                    {/* Google Sign Up */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded gold-button-outline text-base"
                        style={{ fontWeight: 500, fontSize: '0.95rem', minHeight: 0, marginTop: 0 }}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="luxury-text">Continue with Google</span>
                    </button>

                    {/* Sign In Link */}
                    <p className="text-center mt-6 luxury-text-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium hover:underline" style={{ color: '#c4a35a' }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
