import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '../translations/translations'
import { translateText, smartTranslate } from '../services/translationService'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
    // Dashboard language - only applies within Local Guide Dashboard
    // Starts as 'en' by default, changed only via toggle in dashboard
    const [dashboardLanguage, setDashboardLanguage] = useState(() => {
        const saved = localStorage.getItem('vaaya-dashboard-language')
        return saved || 'en'
    })

    // Whether we're currently in the Local Guide Dashboard scope
    const [isDashboardScope, setIsDashboardScope] = useState(false)

    // State for tracking async translations in progress
    const [translating, setTranslating] = useState(false)

    useEffect(() => {
        // Persist dashboard language preference
        localStorage.setItem('vaaya-dashboard-language', dashboardLanguage)
    }, [dashboardLanguage])

    // The effective language - only uses dashboardLanguage if in dashboard scope
    const language = isDashboardScope ? dashboardLanguage : 'en'

    /**
     * Synchronous translation function (uses hardcoded fallback)
     * Only translates if in dashboard scope and language is not English
     */
    const t = useCallback((key) => {
        const effectiveLang = isDashboardScope ? dashboardLanguage : 'en'
        return translations[effectiveLang]?.[key] || translations.en[key] || key
    }, [isDashboardScope, dashboardLanguage])

    /**
     * Async translation function using LibreTranslate API
     * Only translates if in dashboard scope
     */
    const translateAsync = useCallback(async (text) => {
        if (!isDashboardScope || dashboardLanguage === 'en' || !text) return text

        setTranslating(true)
        try {
            const translated = await translateText(text, dashboardLanguage)
            return translated
        } catch (error) {
            console.warn('Async translation failed:', error)
            return text
        } finally {
            setTranslating(false)
        }
    }, [isDashboardScope, dashboardLanguage])

    /**
     * Smart translation - checks hardcoded first, then API
     */
    const translateSmart = useCallback(async (textOrKey, isKey = false) => {
        if (!isDashboardScope || dashboardLanguage === 'en') {
            return isKey ? t(textOrKey) : textOrKey
        }

        setTranslating(true)
        try {
            return await smartTranslate(textOrKey, dashboardLanguage, isKey)
        } catch (error) {
            console.warn('Smart translation failed:', error)
            return isKey ? t(textOrKey) : textOrKey
        } finally {
            setTranslating(false)
        }
    }, [isDashboardScope, dashboardLanguage, t])

    // Toggle dashboard language between English and Kannada
    const toggleLanguage = useCallback(() => {
        setDashboardLanguage(prev => prev === 'en' ? 'kn' : 'en')
    }, [])

    // Enter dashboard scope (call when entering Local Guide Dashboard)
    const enterDashboardScope = useCallback(() => {
        setIsDashboardScope(true)
    }, [])

    // Exit dashboard scope (call when leaving Local Guide Dashboard)
    const exitDashboardScope = useCallback(() => {
        setIsDashboardScope(false)
    }, [])

    return (
        <LanguageContext.Provider value={{
            language,           // Current effective language
            dashboardLanguage,  // Dashboard-specific language
            isDashboardScope,   // Whether in dashboard scope
            toggleLanguage,     // Toggle dashboard language
            enterDashboardScope, // Enter dashboard scope
            exitDashboardScope, // Exit dashboard scope
            t,                  // Sync translation (hardcoded)
            translateAsync,     // Async API translation
            translateSmart,     // Smart fallback translation
            translating         // Loading state
        }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export default LanguageContext
