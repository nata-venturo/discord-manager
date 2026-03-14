/**
 * @license Discord Manager
 * TranslationService.js - Translation and language detection service
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import LanguageDetect from 'languagedetect';
import translate from 'translate-google';
import { logger } from '../utils/logger.js';
import { capitalizeWords } from '../utils/common.js';

/**
 * Translation Service - Handles language detection and translation
 */
export class TranslationService {
    constructor() {
        this.detector = new LanguageDetect();
    }

    /**
     * Detects language from text
     *
     * @param {string} text - Text to detect language from
     * @param {Array} supportedLanguages - List of supported languages
     * @returns {string} Detected language name
     */
    detectLanguage(text, supportedLanguages = []) {
        try {
            const detectedLanguages = this.detector.detect(text, 20);

            // Try to find supported language
            for (const [language] of detectedLanguages) {
                const capitalizedLang = capitalizeWords(language);
                const found = supportedLanguages.find((l) => l.name === capitalizedLang);
                if (found) {
                    return found.name;
                }
            }

            // Default to English
            return 'English';
        } catch (error) {
            logger.warn('Language detection failed, defaulting to English', { error: error.message });
            return 'English';
        }
    }

    /**
     * Translates text to target language
     *
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code (e.g., 'id', 'en')
     * @returns {Promise<string>} Translated text
     */
    async translateText(text, targetLang) {
        try {
            if (!targetLang || targetLang.toLowerCase() === 'en' || targetLang.toLowerCase() === 'auto') {
                return text;
            }

            logger.debug('Translating text', { targetLang, textLength: text.length });
            const translated = await translate(text, { to: targetLang });
            return translated;
        } catch (error) {
            logger.error('Translation failed', { error: error.message, targetLang });
            return text; // Return original text on error
        }
    }

    /**
     * Gets random quote and translates it
     *
     * @param {Array} quotes - List of quotes
     * @param {string} targetLang - Target language code
     * @returns {Promise<Object>} Quote object with original and translated text
     */
    async getRandomQuote(quotes, targetLang = 'auto') {
        try {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            const quote = quotes[randomIndex];
            const originalText = quote.text || quote;

            const translatedText = await this.translateText(originalText, targetLang);

            return {
                original: originalText,
                translated: translatedText,
                error: null,
            };
        } catch (error) {
            logger.error('Failed to get random quote', { error: error.message });
            return {
                original: '',
                translated: '',
                error: error.message,
            };
        }
    }
}

export default TranslationService;
