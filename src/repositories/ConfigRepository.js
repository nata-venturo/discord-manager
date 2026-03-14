/**
 * @license Discord Manager
 * ConfigRepository.js - Configuration data repository
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { loadFileJson } from '../utils/common.js';
import { PATHS } from '../config/constants.js';
import { FileIOError } from '../errors/index.js';
import { logger } from '../utils/logger.js';

/**
 * Configuration Repository - Handles loading configuration data
 */
export class ConfigRepository {
    constructor() {
        this.cache = {
            models: null,
            languages: null,
            badWords: null,
            quotes: null,
        };
    }

    /**
     * Loads AI models from JSON file
     *
     * @returns {Promise<Array>} AI models list
     * @throws {FileIOError} If file cannot be loaded
     */
    async getAIModels() {
        if (this.cache.models) {
            return this.cache.models;
        }

        try {
            logger.debug('Loading AI models from file');
            this.cache.models = await loadFileJson(PATHS.MODEL_AI, 'array');
            logger.info(`Loaded ${this.cache.models.length} AI models`);
            return this.cache.models;
        } catch (error) {
            throw new FileIOError(`Failed to load AI models: ${error.message}`);
        }
    }

    /**
     * Gets AI model by ID
     *
     * @param {string} modelId - Model ID
     * @returns {Promise<Object|null>} Model configuration
     */
    async getAIModelById(modelId) {
        const models = await this.getAIModels();
        return models.find((m) => m.id === modelId) || null;
    }

    /**
     * Loads languages from JSON file
     *
     * @returns {Promise<Array>} Languages list
     * @throws {FileIOError} If file cannot be loaded
     */
    async getLanguages() {
        if (this.cache.languages) {
            return this.cache.languages;
        }

        try {
            logger.debug('Loading languages from file');
            this.cache.languages = await loadFileJson(PATHS.LANGUAGES, 'array');
            logger.info(`Loaded ${this.cache.languages.length} languages`);
            return this.cache.languages;
        } catch (error) {
            throw new FileIOError(`Failed to load languages: ${error.message}`);
        }
    }

    /**
     * Gets language by ID
     *
     * @param {string} langId - Language ID
     * @returns {Promise<Object|null>} Language configuration
     */
    async getLanguageById(langId) {
        const languages = await this.getLanguages();
        return languages.find((l) => l.id === langId) || null;
    }

    /**
     * Gets language by name
     *
     * @param {string} langName - Language name
     * @returns {Promise<Object|null>} Language configuration
     */
    async getLanguageByName(langName) {
        const languages = await this.getLanguages();
        return languages.find((l) => l.name.toLowerCase() === langName.toLowerCase()) || null;
    }

    /**
     * Loads bad words from JSON file
     *
     * @returns {Promise<Object>} Bad words configuration
     * @throws {FileIOError} If file cannot be loaded
     */
    async getBadWords() {
        if (this.cache.badWords) {
            return this.cache.badWords;
        }

        try {
            logger.debug('Loading bad words from file');
            const data = await loadFileJson(PATHS.BAD_WORDS, 'array');
            // Assuming the file is an object with words array
            this.cache.badWords = Array.isArray(data) ? { words: data } : data;
            logger.info('Loaded bad words configuration');
            return this.cache.badWords;
        } catch (error) {
            throw new FileIOError(`Failed to load bad words: ${error.message}`);
        }
    }

    /**
     * Loads quotes from JSON file
     *
     * @returns {Promise<Array>} Quotes list
     * @throws {FileIOError} If file cannot be loaded
     */
    async getQuotes() {
        if (this.cache.quotes) {
            return this.cache.quotes;
        }

        try {
            logger.debug('Loading quotes from file');
            this.cache.quotes = await loadFileJson(PATHS.QUOTES_EN, 'array');
            logger.info(`Loaded ${this.cache.quotes.length} quotes`);
            return this.cache.quotes;
        } catch (error) {
            throw new FileIOError(`Failed to load quotes: ${error.message}`);
        }
    }

    /**
     * Clears cache
     */
    clearCache() {
        this.cache = {
            models: null,
            languages: null,
            badWords: null,
            quotes: null,
        };
        logger.debug('Configuration cache cleared');
    }
}

export default ConfigRepository;
