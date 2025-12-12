import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [localError, setLocalError] = useState('')

    const { resetPassword, error, clearError } = useAuth()
    const { getThemeStyles, themeColors } = useTheme()

    async function handleSubmit(e) {
        e.preventDefault()

        if (!email) {
            setLocalError('Please enter your email')
            return
        }

        setIsLoading(true)
        setLocalError('')
        clearError()
        setSuccess(false)

        try {
            await resetPassword(email)
            setSuccess(true)
        } catch (err) {
            console.error('Password reset failed:', err)
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
                        Reset your password
                    </p>
                </div>

                {/* Reset Card */}
                <div className="rounded-2xl p-8 shadow-xl" style={{
                    background: themeColors.cardBg,
                    border: `1px solid ${themeColors.border}`
                }}>
                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 rounded-lg text-sm" style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#22c55e'
                        }}>
                            <p className="font-medium">Check your email!</p>
                            <p className="mt-1 opacity-90">We've sent a password reset link to {email}</p>
                        </div>
                    )}

                    {/* Error Display */}
                    {displayError && !success && (
                        <div className="mb-6 p-4 rounded-lg text-sm" style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444'
                        }}>
                            {displayError}
                        </div>
                    )}

                    {!success ? (
                        <>
                            <p className="mb-6" style={{ color: themeColors.textSecondary }}>
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

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

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                                    style={{
                                        background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accentSecondary || themeColors.accent})`,
                                        color: '#fff'
                                    }}
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                setSuccess(false)
                                setEmail('')
                            }}
                            className="w-full py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                            style={{
                                background: themeColors.background,
                                border: `1px solid ${themeColors.border}`,
                                color: themeColors.text
                            }}
                        >
                            Send to another email
                        </button>
                    )}

                    {/* Back to Login */}
                    <p className="text-center mt-6" style={{ color: themeColors.textSecondary }}>
                        Remember your password?{' '}
                        <Link to="/login" className="font-medium hover:underline" style={{ color: themeColors.accent }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
