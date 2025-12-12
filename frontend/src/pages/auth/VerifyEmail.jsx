import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function VerifyEmail() {
    const { currentUser, sendVerificationEmail, reloadUser, logout } = useAuth()
    const { getThemeStyles, themeColors, isDarkMode } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    // Redirect if not logged in or already verified
    if (!currentUser) {
        return <Navigate to="/login" replace />
    }

    if (currentUser.emailVerified) {
        return <Navigate to="/dashboard" replace />
    }

    async function handleResendEmail() {
        setIsLoading(true)
        setMessage('')
        setError('')

        try {
            await sendVerificationEmail()
            setMessage('Verification email sent! Please check your inbox.')
        } catch (err) {
            setError(err.message || 'Failed to send verification email.')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCheckVerification() {
        setIsLoading(true)
        setError('')

        try {
            const user = await reloadUser()
            if (user.emailVerified) {
                navigate('/dashboard', { replace: true })
            } else {
                setError('Email not verified yet. Please click the link in your email.')
            }
        } catch (err) {
            setError('Failed to check status. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={getThemeStyles.pageBackground}>
            <div className="w-full max-w-md">
                <div className="rounded-2xl p-8 shadow-xl text-center" style={getThemeStyles.card}>
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: `${themeColors.primary}20`,
                            color: themeColors.primary
                        }}>
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold mb-2" style={getThemeStyles.textPrimary}>
                        Verify your email
                    </h2>

                    <p className="mb-6 leading-relaxed" style={getThemeStyles.textSecondary}>
                        We've sent a verification email to <span className="font-semibold">{currentUser.email}</span>.<br />
                        Please click the link in the email to verify your account.
                    </p>

                    {/* Feedback Messages */}
                    {message && (
                        <div className="mb-6 p-3 rounded-lg text-sm bg-green-100 text-green-700 border border-green-200">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 rounded-lg text-sm bg-red-100 text-red-700 border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleCheckVerification}
                            disabled={isLoading}
                            className="w-full py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={getThemeStyles.primaryButton}
                        >
                            {isLoading ? 'Checking...' : 'I\'ve Verified My Email'}
                        </button>

                        <button
                            onClick={handleResendEmail}
                            disabled={isLoading}
                            className="w-full py-3 rounded-lg font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            style={{
                                color: themeColors.text,
                                border: '1px solid ' + themeColors.border
                            }}
                        >
                            Resend Verification Email
                        </button>

                        <button
                            onClick={() => logout()}
                            className="text-sm hover:underline mt-4"
                            style={{ color: themeColors.textSecondary }}
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
