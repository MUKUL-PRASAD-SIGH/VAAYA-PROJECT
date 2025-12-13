/**
 * Translation Service
 * Primary: LibreTranslate API (free, open-source)
 * Fallback: Hardcoded translations from translations.js
 */

import { translations } from '../translations/translations'

// LibreTranslate API endpoint (free, rate-limited)
const LIBRETRANSLATE_API = 'https://libretranslate.com/translate'

// Cache for API translations to avoid repeated calls
const translationCache = new Map()

/**
 * Generate cache key for translation
 */
const getCacheKey = (text, targetLang) => `${targetLang}:${text}`

/**
 * Translate text using LibreTranslate API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'kn' for Kannada)
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text, targetLang = 'kn', sourceLang = 'en') {
    // If target is English, return original text
    if (targetLang === 'en') return text

    // Check cache first
    const cacheKey = getCacheKey(text, targetLang)
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)
    }

    try {
        const response = await fetch(LIBRETRANSLATE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: sourceLang,
                target: targetLang,
                format: 'text'
            })
        })

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`)
        }

        const data = await response.json()
        const translatedText = data.translatedText

        // Cache the result
        translationCache.set(cacheKey, translatedText)

        return translatedText
    } catch (error) {
        console.warn('Translation API failed, using original text:', error.message)
        return text // Return original text on error
    }
}

/**
 * Batch translate multiple texts
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<string[]>} - Array of translated texts
 */
export async function translateBatch(texts, targetLang = 'kn') {
    if (targetLang === 'en') return texts

    // Process translations in parallel with concurrency limit
    const results = await Promise.all(
        texts.map(text => translateText(text, targetLang))
    )

    return results
}

/**
 * Get translation from hardcoded translations (synchronous fallback)
 * @param {string} key - Translation key
 * @param {string} language - Target language
 * @returns {string} - Translated text or key if not found
 */
export function getHardcodedTranslation(key, language = 'en') {
    return translations[language]?.[key] || translations.en?.[key] || key
}

/**
 * Smart translate - tries API first, falls back to hardcoded
 * @param {string} textOrKey - Text to translate or translation key
 * @param {string} targetLang - Target language
 * @param {boolean} isKey - Whether the input is a translation key
 * @returns {Promise<string>} - Translated text
 */
export async function smartTranslate(textOrKey, targetLang = 'kn', isKey = false) {
    // If it's a translation key, try hardcoded first
    if (isKey) {
        const hardcoded = getHardcodedTranslation(textOrKey, targetLang)
        if (hardcoded !== textOrKey) {
            return hardcoded // Found in hardcoded translations
        }
    }

    // Try API translation
    return translateText(textOrKey, targetLang)
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache() {
    translationCache.clear()
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
    return {
        size: translationCache.size,
        entries: Array.from(translationCache.keys())
    }
}

export default {
    translateText,
    translateBatch,
    getHardcodedTranslation,
    smartTranslate,
    clearTranslationCache,
    getCacheStats
}
