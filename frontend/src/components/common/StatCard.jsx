import { useTheme } from '../../context/ThemeContext'

export default function StatCard({ title, value, icon, borderColor = 'purple' }) {
    const { isDarkMode, themeColors, getThemeStyles } = useTheme()

    // Color mappings for accent colors
    const accentColors = {
        purple: { border: '#9333ea', bg: isDarkMode ? '#581c87' : '#f3e8ff', text: '#9333ea' },
        green: { border: '#22c55e', bg: isDarkMode ? '#14532d' : '#dcfce7', text: '#22c55e' },
        blue: { border: '#3b82f6', bg: isDarkMode ? '#1e3a8a' : '#dbeafe', text: '#3b82f6' },
        yellow: { border: '#eab308', bg: isDarkMode ? '#713f12' : '#fef9c3', text: '#eab308' },
    }

    const colors = accentColors[borderColor] || accentColors.purple

    return (
        <div
            className="rounded-lg shadow-lg p-6"
            style={{
                backgroundColor: themeColors.surface,
                borderLeft: `4px solid ${colors.border}`
            }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold" style={{ color: themeColors.textSecondary }}>{title}</p>
                    <p className="text-3xl font-bold" style={{ color: themeColors.text }}>{value}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: colors.bg }}>
                    <div className="w-8 h-8 flex items-center justify-center text-2xl" style={{ color: colors.text }}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    )
}

