/**
 * @license Discord Manager
 * config/index.js - Configuration management
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import 'dotenv/config';
import { AI_CONFIG, MODERATION, SCHEDULE, TIMING, REACTION, PATHS } from './constants.js';
import { ConfigurationError } from '../errors/index.js';

/**
 * Configuration Manager
 */
export class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
        this.validateConfig();
    }

    /**
     * Loads configuration from environment and defaults
     * @private
     */
    loadConfig() {
        return {
            // Environment variables
            env: {
                geminiApiKey: process.env.GEMINI_API_KEY,
                logLevel: process.env.LOG_LEVEL || 'info',
                logToFile: process.env.LOG_TO_FILE !== 'false',
                nodeEnv: process.env.NODE_ENV || 'development',
            },

            // AI configuration
            ai: {
                model: process.env.AI_MODEL || AI_CONFIG.MODEL,
                temperature: parseFloat(process.env.AI_TEMPERATURE) || AI_CONFIG.TEMPERATURE,
                topP: parseFloat(process.env.AI_TOP_P) || AI_CONFIG.TOP_P,
                topK: parseInt(process.env.AI_TOP_K) || AI_CONFIG.TOP_K,
                maxTokens: parseInt(process.env.AI_MAX_TOKENS) || AI_CONFIG.MAX_TOKENS,
            },

            // Moderation configuration
            moderation: MODERATION,

            // Schedule configuration
            schedule: SCHEDULE,

            // Timing configuration
            timing: TIMING,

            // Reaction configuration
            reaction: REACTION,

            // File paths
            paths: PATHS,
        };
    }

    /**
     * Validates required configuration
     * @private
     */
    validateConfig() {
        if (!this.config.env.geminiApiKey) {
            throw new ConfigurationError('GEMINI_API_KEY environment variable is required');
        }

        // Validate AI config ranges
        if (this.config.ai.temperature < 0 || this.config.ai.temperature > 2) {
            throw new ConfigurationError('AI temperature must be between 0 and 2');
        }

        if (this.config.ai.topP < 0 || this.config.ai.topP > 1) {
            throw new ConfigurationError('AI top_p must be between 0 and 1');
        }
    }

    /**
     * Gets configuration value by path
     *
     * @param {string} path - Dot-notation path (e.g., 'ai.temperature')
     * @param {any} defaultValue - Default value if not found
     * @returns {any} Configuration value
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Gets all configuration
     *
     * @returns {Object} Complete configuration
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Checks if running in production
     *
     * @returns {boolean}
     */
    isProduction() {
        return this.config.env.nodeEnv === 'production';
    }

    /**
     * Checks if running in development
     *
     * @returns {boolean}
     */
    isDevelopment() {
        return this.config.env.nodeEnv === 'development';
    }
}

// Export singleton instance
export const config = new ConfigManager();
export default config;
