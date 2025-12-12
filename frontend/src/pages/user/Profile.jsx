import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../services/api'

export default function Profile() {
    const { getThemeStyles, themeColors, isDarkMode } = useTheme()
    const { currentUser, setupRecaptcha, linkPhone, reloadUser } = useAuth()

    // Form state
    const [formData, setFormData] = useState({
        displayName: currentUser?.displayName || '',
        bio: '',
        location: '',
        phoneNumber: currentUser?.phoneNumber || ''
    })

    // UI state
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')

    // Phone Verification State
    const [showPhoneModal, setShowPhoneModal] = useState(false)
    const [phoneStep, setPhoneStep] = useState('input') // input, otp
    const [verificationId, setVerificationId] = useState(null)
    const [otp, setOtp] = useState('')
    const [newPhone, setNewPhone] = useState('+91 ')

    useEffect(() => {
        // Reset phone to +91 when modal opens
        if (showPhoneModal) {
            setNewPhone('+91 ')
        }
    }, [showPhoneModal])

    useEffect(() => {
        // Cleanup Recaptcha on unmount
        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear()
                } catch (e) {
                    console.error('Failed to clear recaptcha', e)
                }
                window.recaptchaVerifier = null
            }
        }
    }, [])

    useEffect(() => {
        // Load extra profile data from localStorage
        const savedProfile = localStorage.getItem('userProfile')
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile)
            setFormData(prev => ({
                ...prev,
                bio: parsed.bio || '',
                location: parsed.location || ''
            }))
        }
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            // Update Firebase Profile for Display Name
            if (currentUser && formData.displayName !== currentUser.displayName) {
                // We'd need to import updateProfile from context or auth
                // For now, assuming AuthContext might need an updateProfile method exposed
                // But let's just save the local parts
            }

            // Save extra fields to localStorage
            const profileData = {
                bio: formData.bio,
                location: formData.location
            }
            localStorage.setItem('userProfile', JSON.stringify(profileData))

            setMessage('Profile updated successfully!')
            setIsEditing(false)
        } catch (error) {
            console.error(error)
            setMessage('Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    // Phone Verification Logic
    const handleSendOtp = async () => {
        if (!newPhone) return

        // Remove spaces from phone number
        const formattedPhone = newPhone.replace(/\s+/g, '')

        try {
            // Reuse existing verifier if possible (Singleton pattern)
            // Only clear/reset if strictly necessary (e.g. in cleanup)

            // Safety measure: if window.recaptchaVerifier is null but the container is populated,
            // the new verifier might crash. Let's ensure container is clean-ish.
            if (!window.recaptchaVerifier) {
                const container = document.getElementById('recaptcha-container')
                if (container && container.hasChildNodes()) {
                    container.innerHTML = ''
                }
            }

            const verifier = setupRecaptcha('recaptcha-container')
            const confirmationResult = await linkPhone(formattedPhone, verifier)
            setVerificationId(confirmationResult)
            setPhoneStep('otp')
            setMessage('OTP sent to ' + formattedPhone)
        } catch (error) {
            console.error(error)
            setMessage('Error: ' + error.message)
        }
    }

    const handleVerifyOtp = async () => {
        if (!otp || !verificationId) return

        try {
            await verificationId.confirm(otp)
            await reloadUser()
            setMessage('Phone number verified successfully!')
            setShowPhoneModal(false)
            setNewPhone('')
            setOtp('')
            setPhoneStep('input')
        } catch (error) {
            console.error(error)
            setMessage('Invalid OTP. Please try again.')
        }
    }

    const containerStyle = {
        ...getThemeStyles.card,
        color: themeColors.text
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div id="recaptcha-container"></div>

            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2" style={getThemeStyles.textPrimary}>Profile</h2>
                <p style={getThemeStyles.textSecondary}>Manage your personal information</p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Card */}
                <div className="rounded-lg shadow-lg p-6 text-center border" style={containerStyle}>
                    <img
                        src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&background=random`}
                        className="w-32 h-32 rounded-full mx-auto mb-4 border-4"
                        style={{ borderColor: themeColors.primary }}
                        alt="Profile"
                    />
                    <h3 className="text-xl font-bold mb-1">{currentUser?.displayName || 'User'}</h3>
                    <p className="text-sm opacity-70 mb-4">{currentUser?.email}</p>

                    {/* Stats (Mock) */}
                    <div className="flex justify-center space-x-6 mb-6">
                        <div>
                            <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>0</p>
                            <p className="text-xs opacity-70">Points</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>0</p>
                            <p className="text-xs opacity-70">Quests</p>
                        </div>
                    </div>

                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full py-2 rounded-lg font-semibold transition"
                            style={getThemeStyles.primaryButton}
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full py-2 rounded-lg font-semibold transition"
                            style={getThemeStyles.primaryButton}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>

                {/* Details Section */}
                <div className="lg:col-span-2 rounded-lg shadow-lg p-6 border" style={containerStyle}>
                    <h3 className="text-xl font-bold mb-6">Contact Information</h3>

                    <div className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-1 opacity-70">Email</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="email"
                                    value={currentUser?.email}
                                    disabled
                                    className="w-full px-4 py-2 rounded-lg border bg-opacity-50 opacity-70"
                                    style={getThemeStyles.input}
                                />
                                {currentUser?.emailVerified ? (
                                    <span className="text-green-500 font-medium whitespace-nowrap">✓ Verified</span>
                                ) : (
                                    <span className="text-yellow-500 font-medium whitespace-nowrap">⚠ Unverified</span>
                                )}
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium mb-1 opacity-70">Phone Number</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={currentUser?.phoneNumber || 'Not linked'}
                                    disabled
                                    className="w-full px-4 py-2 rounded-lg border bg-opacity-50 opacity-70"
                                    style={getThemeStyles.input}
                                />
                                {currentUser?.phoneNumber ? (
                                    <span className="text-green-500 font-medium whitespace-nowrap">✓ Verified</span>
                                ) : (
                                    <button
                                        onClick={() => setShowPhoneModal(true)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition"
                                        style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                                    >
                                        Add Phone
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Custom Fields (Bio/Location) */}
                        {isEditing && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-70">Full Name</label>
                                    <input
                                        type="text"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border"
                                        style={getThemeStyles.input}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-70">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border"
                                        rows="3"
                                        style={getThemeStyles.input}
                                        placeholder="Tell us about yourself"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {message && (
                        <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-700 text-sm">
                            {message}
                        </div>
                    )}
                </div>
            </div>

            {/* Phone Verification Modal */}
            {showPhoneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md p-6 rounded-lg shadow-2xl relative" style={getThemeStyles.card}>
                        <button
                            onClick={() => setShowPhoneModal(false)}
                            className="absolute top-4 right-4 hover:opacity-70"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold mb-4">Verify Phone Number</h3>

                        {phoneStep === 'input' ? (
                            <div className="space-y-4">
                                <p className="text-sm opacity-80">Enter your phone number (keep +91 for India)</p>
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-2 rounded-lg border"
                                    style={getThemeStyles.input}
                                />
                                <button
                                    onClick={handleSendOtp}
                                    className="w-full py-2 rounded-lg font-bold text-white transition hover:opacity-90"
                                    style={{ backgroundColor: themeColors.primary }}
                                >
                                    Send Code
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm opacity-80">Enter the 6-digit code sent to {newPhone}</p>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="123456"
                                    className="w-full px-4 py-2 rounded-lg border tracking-widest text-center text-xl"
                                    style={getThemeStyles.input}
                                />
                                <button
                                    onClick={handleVerifyOtp}
                                    className="w-full py-2 rounded-lg font-bold text-white transition hover:opacity-90"
                                    style={{ backgroundColor: themeColors.green || '#10B981' }}
                                >
                                    Verify Code
                                </button>
                                <button
                                    onClick={() => setPhoneStep('input')}
                                    className="w-full text-sm hover:underline opacity-70"
                                >
                                    Change Phone Number
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
