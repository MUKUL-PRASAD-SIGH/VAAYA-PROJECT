import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
    const { currentUser, logout, sendVerificationEmail } = useAuth()
    const navigate = useNavigate()
    const [settings, setSettings] = useState({
        notifications: true,
        emailUpdates: true,
        locationSharing: false,
        publicProfile: true,
    })
    const [message, setMessage] = useState('')

    useEffect(() => {
        const saved = localStorage.getItem('appSettings')
        if (saved) setSettings(JSON.parse(saved))
    }, [])

    const handleToggle = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] }
        setSettings(newSettings)
        localStorage.setItem('appSettings', JSON.stringify(newSettings))
    }

    const handleSave = () => {
        localStorage.setItem('appSettings', JSON.stringify(settings))
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
    }

    const handleChangePassword = () => {
        // Firebase password reset email
        if (currentUser?.email) {
            import('firebase/auth').then(({ sendPasswordResetEmail, getAuth }) => {
                sendPasswordResetEmail(getAuth(), currentUser.email)
                    .then(() => setMessage('Password reset email sent!'))
                    .catch(err => setMessage('Error: ' + err.message))
            })
        }
    }

    const handleDownloadData = () => {
        const userData = {
            email: currentUser?.email,
            displayName: currentUser?.displayName,
            settings: settings,
            preferences: JSON.parse(localStorage.getItem('userPreferences') || '{}'),
            profile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
            exportedAt: new Date().toISOString()
        }
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'vaaya-my-data.json'
        a.click()
        setMessage('Data downloaded!')
    }

    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            localStorage.clear()
            logout()
            navigate('/login')
        }
    }

    const handleTerms = () => window.open('/terms', '_blank')
    const handlePrivacy = () => window.open('/privacy', '_blank')

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? 'bg-[#c4a35a]' : 'bg-[rgba(255,255,255,0.2)]'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    )

    return (
        <div className="min-h-screen luxury-bg-aurora luxury-scrollbar">
            <div className="container mx-auto px-6 py-12 relative z-10">

                {/* Header */}
                <div className="text-center mb-12">
                    <p className="luxury-subheading mb-4">CONFIGURATION</p>
                    <h1 className="luxury-heading text-5xl md:text-6xl mb-4">
                        <span className="luxury-heading-gold">Settings</span>
                    </h1>
                    <p className="luxury-text-muted">Configure your app preferences</p>
                </div>

                {message && (
                    <div className="max-w-5xl mx-auto mb-6 p-4 rounded-lg text-center" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Notifications */}
                    <div className="glass-card p-6">
                        <p className="luxury-subheading mb-2">ALERTS</p>
                        <h3 className="luxury-heading-gold text-xl mb-6">Notifications</h3>

                        <div className="flex items-center justify-between py-4 border-b border-[rgba(255,255,255,0.1)]">
                            <div>
                                <p className="luxury-text font-semibold">Push Notifications</p>
                                <p className="luxury-text-muted text-sm">Receive alerts for quests</p>
                            </div>
                            <ToggleSwitch enabled={settings.notifications} onChange={() => handleToggle('notifications')} />
                        </div>

                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="luxury-text font-semibold">Email Updates</p>
                                <p className="luxury-text-muted text-sm">Weekly newsletter</p>
                            </div>
                            <ToggleSwitch enabled={settings.emailUpdates} onChange={() => handleToggle('emailUpdates')} />
                        </div>
                    </div>

                    {/* Privacy */}
                    <div className="glass-card p-6">
                        <p className="luxury-subheading mb-2">SECURITY</p>
                        <h3 className="luxury-heading-gold text-xl mb-6">Privacy</h3>

                        <div className="flex items-center justify-between py-4 border-b border-[rgba(255,255,255,0.1)]">
                            <div>
                                <p className="luxury-text font-semibold">Location Sharing</p>
                                <p className="luxury-text-muted text-sm">Share for nearby quests</p>
                            </div>
                            <ToggleSwitch enabled={settings.locationSharing} onChange={() => handleToggle('locationSharing')} />
                        </div>

                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="luxury-text font-semibold">Public Profile</p>
                                <p className="luxury-text-muted text-sm">Allow others to see you</p>
                            </div>
                            <ToggleSwitch enabled={settings.publicProfile} onChange={() => handleToggle('publicProfile')} />
                        </div>
                    </div>

                    {/* Account */}
                    <div className="glass-card p-6">
                        <p className="luxury-subheading mb-2">MANAGEMENT</p>
                        <h3 className="luxury-heading-gold text-xl mb-6">Account</h3>

                        <div className="space-y-3">
                            <button onClick={handleChangePassword} className="w-full text-left glass-card px-4 py-3 luxury-text hover:bg-[rgba(255,255,255,0.08)] transition">
                                🔐 Change Password
                            </button>
                            <button onClick={handleDownloadData} className="w-full text-left glass-card px-4 py-3 luxury-text hover:bg-[rgba(255,255,255,0.08)] transition">
                                📥 Download My Data
                            </button>
                            <button onClick={handleDeleteAccount} className="w-full text-left px-4 py-3 rounded-lg transition" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                                🗑️ Delete Account
                            </button>
                        </div>
                    </div>

                    {/* About */}
                    <div className="glass-card p-6">
                        <p className="luxury-subheading mb-2">INFORMATION</p>
                        <h3 className="luxury-heading-gold text-xl mb-6">About</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="luxury-stat-card">
                                <div className="luxury-stat-value text-xl">1.0.0</div>
                                <div className="luxury-stat-label">Version</div>
                            </div>
                            <div className="luxury-stat-card">
                                <div className="luxury-stat-value text-xl">2024.12</div>
                                <div className="luxury-stat-label">Build</div>
                            </div>
                            <button onClick={handleTerms} className="glass-card p-4 text-center luxury-text hover:bg-[rgba(255,255,255,0.08)] transition">
                                📄 Terms of Service
                            </button>
                            <button onClick={handlePrivacy} className="glass-card p-4 text-center luxury-text hover:bg-[rgba(255,255,255,0.08)] transition">
                                🔒 Privacy Policy
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-center">
                    <button onClick={handleSave} className="gold-button px-12">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    )
}
