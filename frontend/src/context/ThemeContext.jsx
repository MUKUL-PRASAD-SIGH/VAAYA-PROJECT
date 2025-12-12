import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const ThemeContext = createContext()

// Default colors for light/dark mode when no custom theme is selected
const defaultColors = {
    light: {
        background: '#f3f4f6',
        surface: '#ffffff',
        surfaceAlt: '#f9fafb',
        primary: '#9333ea',
        secondary: '#ec4899',
        accent: '#7c3aed',
        text: '#1f2937',
        textSecondary: '#4b5563',
        textMuted: '#6b7280',
        border: '#e5e7eb',
        highlight: '#9333ea',
    },
    dark: {
        background: '#111827',
        surface: '#1f2937',
        surfaceAlt: '#374151',
        primary: '#a855f7',
        secondary: '#ec4899',
        accent: '#8b5cf6',
        text: '#f9fafb',
        textSecondary: '#d1d5db',
        textMuted: '#9ca3af',
        border: '#374151',
        highlight: '#a855f7',
    }
}

// Theme palettes based on user's color schemes
export const themePalettes = {
    // Light Themes
    cream_blue: {
        name: 'Cream & Blue',
        type: 'light',
        colors: {
            background: '#EFECE3',
            surface: '#FFFFFF',
            surfaceAlt: '#F5F2EA',
            primary: '#4A7BA7',
            secondary: '#8FB4D4',
            accent: '#2C5784',
            text: '#1A1A1A',
            textSecondary: '#4A4A4A',
            textMuted: '#6B6B6B',
            border: '#D4D1C8',
            highlight: '#000000',
        }
    },
    lavender: {
        name: 'Lavender Dream',
        type: 'light',
        colors: {
            background: '#F5F0E6',
            surface: '#FFFFFF',
            surfaceAlt: '#E8E0D4',
            primary: '#6B5B7A',
            secondary: '#8B7B9A',
            accent: '#483D5B',
            text: '#2D2438',
            textSecondary: '#5A4D66',
            textMuted: '#7A6D86',
            border: '#C3B8D8',
            highlight: '#483D5B',
        }
    },
    // Dark Themes
    navy_cyan: {
        name: 'Navy & Cyan',
        type: 'dark',
        colors: {
            background: '#222831',
            surface: '#2D3440',
            surfaceAlt: '#394867',
            primary: '#00ADB5',
            secondary: '#00D9E3',
            accent: '#00FFF5',
            text: '#EEEEEE',
            textSecondary: '#B8B8B8',
            textMuted: '#888888',
            border: '#394867',
            highlight: '#00FFF5',
        }
    },
    charcoal_teal: {
        name: 'Charcoal & Teal',
        type: 'dark',
        colors: {
            background: '#1A1A2E',
            surface: '#252540',
            surfaceAlt: '#393E46',
            primary: '#00ADB5',
            secondary: '#16C5CF',
            accent: '#00FFF5',
            text: '#EAEAEA',
            textSecondary: '#A0A0A0',
            textMuted: '#707070',
            border: '#393E46',
            highlight: '#00FFF5',
        }
    },
}

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode')
        if (saved !== null) {
            return JSON.parse(saved)
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('currentTheme')
        return saved || 'default'
    })

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
        if (isDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDarkMode])

    useEffect(() => {
        localStorage.setItem('currentTheme', currentTheme)

        // Apply theme colors as CSS custom properties
        const root = document.documentElement
        let colors

        if (currentTheme !== 'default' && themePalettes[currentTheme]) {
            const theme = themePalettes[currentTheme]
            colors = theme.colors

            // Also update dark mode based on theme type
            if (theme.type === 'dark' && !isDarkMode) {
                setIsDarkMode(true)
            } else if (theme.type === 'light' && isDarkMode) {
                setIsDarkMode(false)
            }
        } else {
            colors = isDarkMode ? defaultColors.dark : defaultColors.light
        }

        // Apply all colors as CSS custom properties
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value)
        })
    }, [currentTheme, isDarkMode])

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev)
        // Reset to default theme when manually toggling
        if (currentTheme !== 'default') {
            setCurrentTheme('default')
        }
    }

    const selectTheme = (themeKey) => {
        setCurrentTheme(themeKey)
    }

    // Get current theme colors
    const themeColors = useMemo(() => {
        if (currentTheme !== 'default' && themePalettes[currentTheme]) {
            return themePalettes[currentTheme].colors
        }
        return isDarkMode ? defaultColors.dark : defaultColors.light
    }, [currentTheme, isDarkMode])

    // Helper function to get inline styles for components
    const getThemeStyles = useMemo(() => ({
        // Page background
        pageBackground: { backgroundColor: themeColors.background },

        // Card styles
        card: {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
        },
        cardAlt: {
            backgroundColor: themeColors.surfaceAlt,
            borderColor: themeColors.border,
        },

        // Text styles
        textPrimary: { color: themeColors.text },
        textSecondary: { color: themeColors.textSecondary },
        textMuted: { color: themeColors.textMuted },

        // Border
        border: { borderColor: themeColors.border },

        // Primary button/accent
        primaryButton: {
            backgroundColor: themeColors.primary,
            color: '#ffffff',
        },

        // Input styles
        input: {
            backgroundColor: themeColors.surfaceAlt,
            borderColor: themeColors.border,
            color: themeColors.text,
        },

        // Gradient (for special elements)
        gradient: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
    }), [themeColors])

    return (
        <ThemeContext.Provider value={{
            isDarkMode,
            toggleDarkMode,
            currentTheme,
            selectTheme,
            themeColors,
            themePalettes,
            getThemeStyles
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

