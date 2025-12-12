import { createContext, useContext, useState, useEffect } from 'react'

const AccentColorContext = createContext()

// Available accent colors with their Tailwind class mappings
export const accentColors = {
    purple: {
        name: 'Purple',
        primary: '#9333ea',
        gradient: 'from-purple-600 to-pink-600',
        gradientHover: 'from-purple-700 to-pink-700',
        bg: 'bg-purple-600',
        bgHover: 'hover:bg-purple-700',
        bgLight: 'bg-purple-100',
        bgDark: 'bg-purple-900',
        text: 'text-purple-600',
        textLight: 'text-purple-400',
        border: 'border-purple-600',
        ring: 'ring-purple-600',
    },
    pink: {
        name: 'Pink',
        primary: '#ec4899',
        gradient: 'from-pink-600 to-rose-600',
        gradientHover: 'from-pink-700 to-rose-700',
        bg: 'bg-pink-600',
        bgHover: 'hover:bg-pink-700',
        bgLight: 'bg-pink-100',
        bgDark: 'bg-pink-900',
        text: 'text-pink-600',
        textLight: 'text-pink-400',
        border: 'border-pink-600',
        ring: 'ring-pink-600',
    },
    blue: {
        name: 'Blue',
        primary: '#3b82f6',
        gradient: 'from-blue-600 to-cyan-600',
        gradientHover: 'from-blue-700 to-cyan-700',
        bg: 'bg-blue-600',
        bgHover: 'hover:bg-blue-700',
        bgLight: 'bg-blue-100',
        bgDark: 'bg-blue-900',
        text: 'text-blue-600',
        textLight: 'text-blue-400',
        border: 'border-blue-600',
        ring: 'ring-blue-600',
    },
    green: {
        name: 'Green',
        primary: '#22c55e',
        gradient: 'from-green-600 to-emerald-600',
        gradientHover: 'from-green-700 to-emerald-700',
        bg: 'bg-green-600',
        bgHover: 'hover:bg-green-700',
        bgLight: 'bg-green-100',
        bgDark: 'bg-green-900',
        text: 'text-green-600',
        textLight: 'text-green-400',
        border: 'border-green-600',
        ring: 'ring-green-600',
    },
    orange: {
        name: 'Orange',
        primary: '#f97316',
        gradient: 'from-orange-600 to-amber-600',
        gradientHover: 'from-orange-700 to-amber-700',
        bg: 'bg-orange-600',
        bgHover: 'hover:bg-orange-700',
        bgLight: 'bg-orange-100',
        bgDark: 'bg-orange-900',
        text: 'text-orange-600',
        textLight: 'text-orange-400',
        border: 'border-orange-600',
        ring: 'ring-orange-600',
    },
}

// Font size mappings
export const fontSizes = {
    small: {
        name: 'Small',
        base: '14px',
        scale: 0.875,
    },
    medium: {
        name: 'Medium',
        base: '16px',
        scale: 1,
    },
    large: {
        name: 'Large',
        base: '18px',
        scale: 1.125,
    },
}

export function AccentColorProvider({ children }) {
    const [accentColor, setAccentColor] = useState(() => {
        const saved = localStorage.getItem('accentColor')
        return saved || 'purple'
    })

    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('fontSize')
        return saved || 'medium'
    })

    useEffect(() => {
        localStorage.setItem('accentColor', accentColor)
        // Update CSS custom property for dynamic styling
        document.documentElement.style.setProperty('--accent-color', accentColors[accentColor].primary)
    }, [accentColor])

    useEffect(() => {
        localStorage.setItem('fontSize', fontSize)
        // Apply font size to document root
        const size = fontSizes[fontSize]
        document.documentElement.style.fontSize = size.base
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large')
        document.documentElement.classList.add(`font-${fontSize}`)
    }, [fontSize])

    const colors = accentColors[accentColor]

    return (
        <AccentColorContext.Provider value={{
            accentColor,
            setAccentColor,
            colors,
            accentColors,
            fontSize,
            setFontSize,
            fontSizes
        }}>
            {children}
        </AccentColorContext.Provider>
    )
}

export function useAccentColor() {
    const context = useContext(AccentColorContext)
    if (!context) {
        throw new Error('useAccentColor must be used within an AccentColorProvider')
    }
    return context
}

