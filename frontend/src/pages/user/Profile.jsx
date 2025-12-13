import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../services/api'

// Preferences Card Component
function PreferencesCard() {
    const [prefs, setPrefs] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchPreferences() {
            try {
                const response = await userApi.getPreferences()
                if (response.data?.preferences) setPrefs(response.data.preferences)
            } catch {
                const localPrefs = localStorage.getItem('userPreferences')
                if (localPrefs) setPrefs(JSON.parse(localPrefs))
            } finally { setLoading(false) }
        }
        fetchPreferences()
    }, [])

    if (loading || !prefs) return null

    return (
        <div className="glass-card p-6 mt-8">
            <p className="luxury-subheading mb-2">YOUR PREFERENCES</p>
            <h3 className="luxury-heading-gold text-xl mb-6">Travel Style</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="luxury-stat-card">
                    <div className="luxury-stat-value text-xl">{prefs.role || '—'}</div>
                    <div className="luxury-stat-label">Role</div>
                </div>
                <div className="luxury-stat-card">
                    <div className="luxury-stat-value text-xl">{prefs.budget || '—'}</div>
                    <div className="luxury-stat-label">Budget</div>
                </div>
                <div className="luxury-stat-card">
                    <div className="text-sm luxury-text-muted text-center">
                        {prefs.interests?.length > 0 ? prefs.interests.join(', ') : 'Not set'}
                    </div>
                    <div className="luxury-stat-label mt-2">Interests</div>
                </div>
            </div>
        </div>
    )
}

export default function Profile() {
    const { currentUser, setupRecaptcha, linkPhone, reloadUser } = useAuth()

    const [formData, setFormData] = useState({
        displayName: currentUser?.displayName || '',
        bio: '',
        location: '',
        phoneNumber: currentUser?.phoneNumber || ''
    })
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [showPhoneModal, setShowPhoneModal] = useState(false)
    const [phoneStep, setPhoneStep] = useState('input')
    const [verificationId, setVerificationId] = useState(null)
    const [otp, setOtp] = useState('')
    const [newPhone, setNewPhone] = useState('+91 ')

    useEffect(() => {
        if (showPhoneModal) setNewPhone('+91 ')
    }, [showPhoneModal])

    useEffect(() => {
        return () => {
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear() } catch (e) { }
                window.recaptchaVerifier = null
            }
        }
    }, [])

    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile')
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile)
            setFormData(prev => ({ ...prev, bio: parsed.bio || '', location: parsed.location || '' }))
        }
    }, [])

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const handleSave = async () => {
        setIsLoading(true)
        try {
            localStorage.setItem('userProfile', JSON.stringify({ bio: formData.bio, location: formData.location }))
            setMessage('Profile updated successfully!')
            setIsEditing(false)
        } catch { setMessage('Failed to update profile') }
        finally { setIsLoading(false) }
    }

    const handleSendOtp = async () => {
        if (!newPhone) return
        const formattedPhone = newPhone.replace(/\s+/g, '')
        try {
            if (!window.recaptchaVerifier) {
                const container = document.getElementById('recaptcha-container')
                if (container?.hasChildNodes()) container.innerHTML = ''
            }
            const verifier = setupRecaptcha('recaptcha-container')
            const confirmationResult = await linkPhone(formattedPhone, verifier)
            setVerificationId(confirmationResult)
            setPhoneStep('otp')
            setMessage('OTP sent to ' + formattedPhone)
        } catch (error) { setMessage('Error: ' + error.message) }
    }

    const handleVerifyOtp = async () => {
        if (!otp || !verificationId) return
        try {
            await verificationId.confirm(otp)
            await reloadUser()
            setMessage('Phone number verified!')
            setShowPhoneModal(false)
            setNewPhone('')
            setOtp('')
            setPhoneStep('input')
        } catch { setMessage('Invalid OTP. Please try again.') }
    }

    return (
        <div className="min-h-screen luxury-bg-aurora luxury-scrollbar">
            <div className="container mx-auto px-6 py-12 relative z-10">
                <div id="recaptcha-container"></div>

                {/* Header */}
                <div className="text-center mb-12">
                    <p className="luxury-subheading mb-4">YOUR ACCOUNT</p>
                    <h1 className="luxury-heading text-5xl md:text-6xl mb-4">
                        <span className="luxury-heading-gold">Profile</span>
                    </h1>
                    <p className="luxury-text-muted">Manage your personal information</p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Profile Card */}
                    <div className="glass-card p-8 text-center">
                        <img
                            src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&background=1a4a5c&color=c4a35a`}
                            className="w-32 h-32 rounded-full mx-auto mb-6 border-4"
                            style={{ borderColor: '#c4a35a' }}
                            alt="Profile"
                        />
                        <h3 className="luxury-heading-gold text-2xl mb-1">{currentUser?.displayName || 'User'}</h3>
                        <p className="luxury-text-muted text-sm mb-6">{currentUser?.email}</p>

                        {/* Stats */}
                        <div className="flex justify-center gap-8 mb-6">
                            <div className="luxury-stat-card p-4">
                                <div className="luxury-stat-value text-2xl">0</div>
                                <div className="luxury-stat-label">Points</div>
                            </div>
                            <div className="luxury-stat-card p-4">
                                <div className="luxury-stat-value text-2xl">0</div>
                                <div className="luxury-stat-label">Quests</div>
                            </div>
                        </div>

                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="w-full gold-button">
                                Edit Profile
                            </button>
                        ) : (
                            <button onClick={handleSave} disabled={isLoading} className="w-full gold-button disabled:opacity-50">
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>

                    {/* Details Card */}
                    <div className="lg:col-span-2 glass-card p-8">
                        <p className="luxury-subheading mb-2">CONTACT INFORMATION</p>
                        <h3 className="luxury-heading-gold text-xl mb-6">Your Details</h3>

                        <div className="space-y-6">
                            {/* Email */}
                            <div>
                                <label className="luxury-subheading block mb-2">EMAIL</label>
                                <div className="flex items-center gap-3">
                                    <input type="email" value={currentUser?.email} disabled className="flex-1 luxury-input opacity-70" />
                                    {currentUser?.emailVerified ? (
                                        <span className="text-sm whitespace-nowrap" style={{ color: '#22c55e' }}>✓ Verified</span>
                                    ) : (
                                        <span className="text-sm whitespace-nowrap" style={{ color: '#eab308' }}>⚠ Unverified</span>
                                    )}
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="luxury-subheading block mb-2">PHONE NUMBER</label>
                                <div className="flex items-center gap-3">
                                    <input type="text" value={currentUser?.phoneNumber || 'Not linked'} disabled className="flex-1 luxury-input opacity-70" />
                                    {currentUser?.phoneNumber ? (
                                        <span className="text-sm whitespace-nowrap" style={{ color: '#22c55e' }}>✓ Verified</span>
                                    ) : (
                                        <button onClick={() => setShowPhoneModal(true)} className="gold-button text-sm">Add Phone</button>
                                    )}
                                </div>
                            </div>

                            {/* Edit Fields */}
                            {isEditing && (
                                <>
                                    <div>
                                        <label className="luxury-subheading block mb-2">FULL NAME</label>
                                        <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} className="w-full luxury-input" />
                                    </div>
                                    <div>
                                        <label className="luxury-subheading block mb-2">BIO</label>
                                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" placeholder="Tell us about yourself" className="w-full luxury-input" />
                                    </div>
                                </>
                            )}
                        </div>

                        {message && (
                            <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preferences */}
                <PreferencesCard />

                {/* Phone Modal */}
                {showPhoneModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                        <div className="glass-card w-full max-w-md p-6 relative">
                            <button onClick={() => setShowPhoneModal(false)} className="absolute top-4 right-4 luxury-text-muted hover:text-white text-xl">✕</button>
                            <h3 className="luxury-heading-gold text-xl mb-4">Verify Phone</h3>

                            {phoneStep === 'input' ? (
                                <div className="space-y-4">
                                    <p className="luxury-text-muted text-sm">Enter your phone number</p>
                                    <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full luxury-input" />
                                    <button onClick={handleSendOtp} className="w-full gold-button">Send Code</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="luxury-text-muted text-sm">Enter 6-digit code sent to {newPhone}</p>
                                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="w-full luxury-input text-center tracking-widest text-xl" />
                                    <button onClick={handleVerifyOtp} className="w-full gold-button">Verify</button>
                                    <button onClick={() => setPhoneStep('input')} className="w-full luxury-text-muted text-sm hover:underline">Change Number</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
