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
        name: 'Stranger Things',
        type: 'dark',
        colors: {
            background: '#3b0b04',
            surface: '#9b1906',
            surfaceAlt: '#6d0d03',
            primary: '#641104',
            secondary: '#9d3903',
            accent: '#28429b',
            text: '#fdfaf9',
            textSecondary: '#d1d5db',
            textMuted: '#dae8ff',
            border: '#092e68',
            highlight: '#5558f7',
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
    // Premium Luxury Theme - Panorama Glass Lodge Style
    luxury_panorama: {
        name: 'Luxury Panorama',
        type: 'dark',
        colors: {
            background: '#0a1f2e',
            surface: 'rgba(255, 255, 255, 0.05)',
            surfaceAlt: 'rgba(255, 255, 255, 0.08)',
            primary: '#c4a35a',
            secondary: '#d4b86a',
            accent: '#2d6a7c',
            text: '#f5f5f5',
            textSecondary: '#c8d4dc',
            textMuted: '#8a9aa6',
            border: 'rgba(255, 255, 255, 0.1)',
            highlight: '#c4a35a',
            // Extra luxury colors
            gold: '#c4a35a',
            teal: '#1a4a5c',
            tealLight: '#2d6a7c',
            navy: '#0d1b2a',
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

    // Get current theme colors, but only force text to be pure black for main text, not for cards
    const themeColors = useMemo(() => {
        let colors
        if (currentTheme !== 'default' && themePalettes[currentTheme]) {
            colors = { ...themePalettes[currentTheme].colors }
        } else {
            colors = { ...(isDarkMode ? defaultColors.dark : defaultColors.light) }
        }
        // Only force text color for main text, not for cards
        return colors
    }, [currentTheme, isDarkMode])

    // Helper function to get inline styles for components
    const getThemeStyles = useMemo(() => {
        // Helper to convert hex to rgba
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16)
            const g = parseInt(hex.slice(3, 5), 16)
            const b = parseInt(hex.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        return {
            // Page background with image support
            pageBackground: {
                backgroundColor: 'transparent',
                position: 'relative'
            },

            // Card styles - now with transparency and theme color
            card: {
                backgroundColor: hexToRgba(themeColors.surface, 0.25), // 25% opacity for better transparency
                borderColor: hexToRgba(themeColors.border, 0.3),
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: themeColors.text,
            },
            cardAlt: {
                backgroundColor: hexToRgba(themeColors.surfaceAlt, 0.25), // 25% opacity
                borderColor: hexToRgba(themeColors.border, 0.3),
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: themeColors.text,
            },

            // Text styles
            textPrimary: { color: '#000000' },
            textSecondary: { color: '#181818' },
            textMuted: { color: '#222222' },

            // Border
            border: { borderColor: themeColors.border },

            // Primary button/accent
            primaryButton: {
                backgroundColor: themeColors.primary,
                color: '#ffffff',
            },

            // Input styles
            input: {
                backgroundColor: hexToRgba(themeColors.surfaceAlt, 0.3),
                borderColor: hexToRgba(themeColors.border, 0.4),
                color: '#000000',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
            },

            // Gradient (for special elements)
            gradient: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
        }
    }, [themeColors])

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

