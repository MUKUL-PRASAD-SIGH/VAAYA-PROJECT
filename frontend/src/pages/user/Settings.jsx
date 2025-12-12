import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

export default function Settings() {
    const { isDarkMode } = useTheme()
    const [settings, setSettings] = useState({
        notifications: true,
        emailUpdates: true,
        locationSharing: false,
        publicProfile: true,
    })

    // Dark mode classes
    const cardClass = isDarkMode ? 'bg-gray-800' : 'bg-white'
    const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-800'
    const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600'
    const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200'

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSave = () => {
        localStorage.setItem('appSettings', JSON.stringify(settings))
        alert('Settings saved!')
    }

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    )

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className={`text-3xl font-bold ${textPrimary} mb-2`}>Settings</h2>
                <p className={textSecondary}>Configure your app preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Notifications */}
                <div className={`${cardClass} rounded-lg shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-6`}>Notifications</h3>

                    <div className={`flex items-center justify-between py-4 border-b ${borderColor}`}>
                        <div>
                            <p className={`font-semibold ${textPrimary}`}>Push Notifications</p>
                            <p className={`text-sm ${textSecondary}`}>Receive alerts for quests and updates</p>
                        </div>
                        <ToggleSwitch enabled={settings.notifications} onChange={() => handleToggle('notifications')} />
                    </div>

                    <div className={`flex items-center justify-between py-4`}>
                        <div>
                            <p className={`font-semibold ${textPrimary}`}>Email Updates</p>
                            <p className={`text-sm ${textSecondary}`}>Weekly newsletter and trip reminders</p>
                        </div>
                        <ToggleSwitch enabled={settings.emailUpdates} onChange={() => handleToggle('emailUpdates')} />
                    </div>
                </div>

                {/* Privacy */}
                <div className={`${cardClass} rounded-lg shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-6`}>Privacy</h3>

                    <div className={`flex items-center justify-between py-4 border-b ${borderColor}`}>
                        <div>
                            <p className={`font-semibold ${textPrimary}`}>Location Sharing</p>
                            <p className={`text-sm ${textSecondary}`}>Share your location for nearby quests</p>
                        </div>
                        <ToggleSwitch enabled={settings.locationSharing} onChange={() => handleToggle('locationSharing')} />
                    </div>

                    <div className={`flex items-center justify-between py-4`}>
                        <div>
                            <p className={`font-semibold ${textPrimary}`}>Public Profile</p>
                            <p className={`text-sm ${textSecondary}`}>Allow others to see your profile</p>
                        </div>
                        <ToggleSwitch enabled={settings.publicProfile} onChange={() => handleToggle('publicProfile')} />
                    </div>
                </div>

                {/* Account */}
                <div className={`${cardClass} rounded-lg shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-6`}>Account</h3>

                    <div className="space-y-3">
                        <button className={`w-full text-left px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textPrimary} transition`}>
                            Change Password
                        </button>
                        <button className={`w-full text-left px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textPrimary} transition`}>
                            Download My Data
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition">
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* About */}
                <div className={`${cardClass} rounded-lg shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-6`}>About</h3>

                    <div className="space-y-3">
                        <div className={`flex justify-between py-2 border-b ${borderColor}`}>
                            <span className={textSecondary}>Version</span>
                            <span className={`font-semibold ${textPrimary}`}>1.0.0</span>
                        </div>
                        <div className={`flex justify-between py-2 border-b ${borderColor}`}>
                            <span className={textSecondary}>Build</span>
                            <span className={`font-semibold ${textPrimary}`}>2024.12.12</span>
                        </div>
                        <button className={`w-full text-left px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textPrimary} transition`}>
                            Terms of Service
                        </button>
                        <button className={`w-full text-left px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textPrimary} transition`}>
                            Privacy Policy
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
                >
                    Save Settings
                </button>
            </div>
        </div>
    )
}
