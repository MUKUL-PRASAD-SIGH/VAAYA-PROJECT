import { useState } from 'react'
import { useTheme, themePalettes } from '../../context/ThemeContext'
import { useAccentColor, accentColors, fontSizes } from '../../context/AccentColorContext'

export default function Personalisation() {
    const { isDarkMode, toggleDarkMode, currentTheme, selectTheme, themeColors, getThemeStyles } = useTheme()
    const { accentColor, setAccentColor, colors, fontSize, setFontSize } = useAccentColor()
    const [activeTab, setActiveTab] = useState('appearance')
    const [settings, setSettings] = useState({
        animations: true,
        compactMode: false,
    })

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = () => {
        localStorage.setItem('userSettings', JSON.stringify(settings))
        alert('Settings saved!')
    }

    // Filter themes by type
    const lightThemes = Object.entries(themePalettes).filter(([_, theme]) => theme.type === 'light')
    const darkThemes = Object.entries(themePalettes).filter(([_, theme]) => theme.type === 'dark')

    const tabs = [
        { id: 'appearance', label: 'Appearance' },
        { id: 'themes', label: 'Themes' },
        { id: 'layout', label: 'Layout' },
    ]

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2" style={getThemeStyles.textPrimary}>Personalisation</h2>
                <p style={getThemeStyles.textSecondary}>Customize your Vayaa experience</p>
            </div>

            {/* Tab Navigation */}
            <div className={`flex space-x-1 mb-8 p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ width: 'fit-content' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === tab.id
                            ? 'text-white shadow-md'
                            : isDarkMode
                                ? 'text-gray-400 hover:text-gray-200'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                        style={activeTab === tab.id ? { backgroundColor: colors.primary } : {}}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="rounded-lg shadow-lg p-6 border" style={getThemeStyles.card}>
                        <h3 className="text-xl font-bold mb-6" style={getThemeStyles.textPrimary}>Appearance</h3>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between py-4 border-b" style={getThemeStyles.border}>
                            <div>
                                <p className="font-semibold" style={getThemeStyles.textPrimary}>Dark Mode</p>
                                <p className="text-sm" style={getThemeStyles.textSecondary}>Switch between light and dark themes</p>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                style={{ backgroundColor: isDarkMode ? colors.primary : '#d1d5db' }}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Accent Color */}
                        <div className="py-4 border-b" style={getThemeStyles.border}>
                            <p className="font-semibold mb-3" style={getThemeStyles.textPrimary}>Accent Color</p>
                            <p className="text-sm mb-4" style={getThemeStyles.textSecondary}>Choose your preferred accent color</p>
                            <div className="flex space-x-3">
                                {Object.entries(accentColors).map(([key, color]) => (
                                    <button
                                        key={key}
                                        onClick={() => setAccentColor(key)}
                                        className={`w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${accentColor === key ? 'ring-2 ring-offset-2' : ''}`}
                                        style={{ backgroundColor: color.primary }}
                                        title={color.name}
                                    >
                                        {accentColor === key && (
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className="py-4">
                            <p className="font-semibold mb-3" style={getThemeStyles.textPrimary}>Font Size</p>
                            <p className="text-sm mb-4" style={getThemeStyles.textSecondary}>Adjust text size across the app</p>
                            <div className="flex space-x-2">
                                {Object.entries(fontSizes).map(([key, size]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFontSize(key)}
                                        className="px-4 py-2 rounded-lg capitalize transition"
                                        style={{
                                            backgroundColor: fontSize === key ? colors.primary : (isDarkMode ? '#374151' : '#f3f4f6'),
                                            color: fontSize === key ? 'white' : (isDarkMode ? '#d1d5db' : '#374151')
                                        }}
                                    >
                                        {size.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Animations Card */}
                    <div className="rounded-lg shadow-lg p-6 border" style={getThemeStyles.card}>
                        <h3 className="text-xl font-bold mb-6" style={getThemeStyles.textPrimary}>Effects</h3>

                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="font-semibold" style={getThemeStyles.textPrimary}>Animations</p>
                                <p className="text-sm" style={getThemeStyles.textSecondary}>Enable smooth animations and transitions</p>
                            </div>
                            <button
                                onClick={() => handleChange('animations', !settings.animations)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                style={{ backgroundColor: settings.animations ? colors.primary : '#d1d5db' }}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.animations ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Themes Tab */}
            {activeTab === 'themes' && (
                <div className="space-y-8">
                    {/* Light Themes */}
                    <div className="rounded-lg shadow-lg p-6 border" style={getThemeStyles.card}>
                        <h3 className="text-xl font-bold mb-2" style={getThemeStyles.textPrimary}>Light Themes</h3>
                        <p className="text-sm mb-6" style={getThemeStyles.textSecondary}>Bright and clean color schemes</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Default Light */}
                            <button
                                onClick={() => { selectTheme('default'); if (isDarkMode) toggleDarkMode(); }}
                                className={`p-4 rounded-lg border-2 transition hover:scale-105 ${currentTheme === 'default' && !isDarkMode
                                    ? 'border-purple-500 shadow-lg'
                                    : isDarkMode ? 'border-gray-600' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex space-x-1 mb-3 h-16 rounded-lg overflow-hidden">
                                    <div className="flex-1 bg-gray-100"></div>
                                    <div className="flex-1 bg-purple-100"></div>
                                    <div className="flex-1 bg-purple-500"></div>
                                    <div className="flex-1 bg-purple-700"></div>
                                </div>
                                <p className="font-semibold" style={getThemeStyles.textPrimary}>Default Light</p>
                            </button>

                            {lightThemes.map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => selectTheme(key)}
                                    className={`p-4 rounded-lg border-2 transition hover:scale-105 ${currentTheme === key
                                        ? 'shadow-lg'
                                        : isDarkMode ? 'border-gray-600' : 'border-gray-200'
                                        }`}
                                    style={currentTheme === key ? { borderColor: theme.colors.primary } : {}}
                                >
                                    <div className="flex space-x-1 mb-3 h-16 rounded-lg overflow-hidden">
                                        <div className="flex-1" style={{ backgroundColor: theme.colors.background }}></div>
                                        <div className="flex-1" style={{ backgroundColor: theme.colors.secondary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: theme.colors.primary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: theme.colors.accent }}></div>
                                    </div>
                                    <p className="font-semibold" style={getThemeStyles.textPrimary}>{theme.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dark Themes */}
                    <div className="rounded-lg shadow-lg p-6 border" style={getThemeStyles.card}>
                        <h3 className="text-xl font-bold mb-2" style={getThemeStyles.textPrimary}>Dark Themes</h3>
                        <p className="text-sm mb-6" style={getThemeStyles.textSecondary}>Easy on the eyes, perfect for night</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Default Dark */}
                            <button
                                onClick={() => { selectTheme('default'); if (!isDarkMode) toggleDarkMode(); }}
                                className={`p-4 rounded-lg border-2 transition hover:scale-105 ${currentTheme === 'default' && isDarkMode
                                    ? 'border-purple-500 shadow-lg'
                                    : isDarkMode ? 'border-gray-600' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex space-x-1 mb-3 h-16 rounded-lg overflow-hidden">
                                    <div className="flex-1 bg-gray-900"></div>
                                    <div className="flex-1 bg-gray-700"></div>
                                    <div className="flex-1 bg-purple-600"></div>
                                    <div className="flex-1 bg-pink-500"></div>
                                </div>
                                <p className="font-semibold" style={getThemeStyles.textPrimary}>Default Dark</p>
                            </button>

                            {darkThemes.map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => selectTheme(key)}
                                    className={`p-4 rounded-lg border-2 transition hover:scale-105 ${currentTheme === key
                                        ? 'shadow-lg'
                                        : isDarkMode ? 'border-gray-600' : 'border-gray-200'
                                        }`}
                                    style={currentTheme === key ? { borderColor: theme.colors.accent } : {}}
                                >
                                    <div className="flex space-x-1 mb-3 h-16 rounded-lg overflow-hidden">
                                        <div className="flex-1" style={{ backgroundColor: theme.colors.background }}></div>
                                        <div className="flex-1" style={{ backgroundColor: theme.colors.surfaceAlt }}></div>
                                        <div className="flex-1" style={{ backgroundColor: theme.colors.primary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: theme.colors.accent }}></div>
                                    </div>
                                    <p className="font-semibold" style={getThemeStyles.textPrimary}>{theme.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Layout Tab */}
            {activeTab === 'layout' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="rounded-lg shadow-lg p-6 border" style={getThemeStyles.card}>
                        <h3 className="text-xl font-bold mb-6" style={getThemeStyles.textPrimary}>Layout</h3>

                        {/* Compact Mode */}
                        <div className="flex items-center justify-between py-4 border-b" style={getThemeStyles.border}>
                            <div>
                                <p className="font-semibold" style={getThemeStyles.textPrimary}>Compact Mode</p>
                                <p className="text-sm" style={getThemeStyles.textSecondary}>Show more content with reduced spacing</p>
                            </div>
                            <button
                                onClick={() => handleChange('compactMode', !settings.compactMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                style={{ backgroundColor: settings.compactMode ? colors.primary : '#d1d5db' }}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.compactMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="rounded-lg shadow-lg p-6 border" style={getThemeStyles.card}>
                        <h3 className="text-xl font-bold mb-6" style={getThemeStyles.textPrimary}>Preview</h3>
                        <div className="p-4 rounded-lg border" style={getThemeStyles.border}>
                            <div className="flex items-center space-x-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${accentColors.pink.primary})` }}
                                >
                                    Q
                                </div>
                                <div>
                                    <p className="font-semibold" style={getThemeStyles.textPrimary}>Sample Quest</p>
                                    <p className="text-sm" style={getThemeStyles.textSecondary}>This is how content will look</p>
                                </div>
                            </div>
                            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                    className="h-full w-2/3 rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${colors.primary}, ${accentColors.pink.primary})` }}
                                ></div>
                            </div>
                        </div>

                        {/* Current Theme Info */}
                        <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <p className="text-sm" style={getThemeStyles.textSecondary}>Current theme:</p>
                            <p className="font-bold text-lg" style={{ color: colors.primary }}>
                                {currentTheme === 'default'
                                    ? (isDarkMode ? 'Default Dark' : 'Default Light')
                                    : themePalettes[currentTheme]?.name || 'Custom'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${accentColors.pink.primary})` }}
                >
                    Save Preferences
                </button>
            </div>
        </div>
    )
}
