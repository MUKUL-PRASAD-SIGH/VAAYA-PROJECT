import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { Globe, MapPin } from 'lucide-react'

export default function RoleSelection() {
    const navigate = useNavigate()
    const { getThemeStyles } = useTheme()

    const handleRoleSelect = (role) => {
        // You can save role to local storage or context here if needed
        // For now, redirect to dashboard
        navigate('/dashboard')
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={getThemeStyles.pageBackground}
        >
            <div className="max-w-4xl w-full">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-12" style={getThemeStyles.textPrimary}>
                    How would you like to explore?
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Traveller Option */}
                    <button
                        onClick={() => handleRoleSelect('traveller')}
                        className="group relative overflow-hidden rounded-2xl p-8 transition-all hover:scale-105"
                        style={getThemeStyles.card}
                    >
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="p-6 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                                <Globe className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2" style={getThemeStyles.textPrimary}>I'm a Traveller</h2>
                                <p style={getThemeStyles.textSecondary}>
                                    Discover new places, plan trips, and explore the world.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Local Option */}
                    <button
                        onClick={() => handleRoleSelect('local')}
                        className="group relative overflow-hidden rounded-2xl p-8 transition-all hover:scale-105"
                        style={getThemeStyles.card}
                    >
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="p-6 rounded-full bg-green-100 dark:bg-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                                <MapPin className="w-16 h-16 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-2" style={getThemeStyles.textPrimary}>I'm a Local</h2>
                                <p style={getThemeStyles.textSecondary}>
                                    Share your knowledge, guide others, and represent your community.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
