/**
 * @license Discord Manager
 * AIService.js - AI response generation service
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GoogleGenAI } from '@google/genai';
import { AIServiceError } from '../errors/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { DEFAULT_MESSAGES } from '../config/constants.js';

/**
 * AI Service - Handles AI response generation
 */
export class AIService {
    constructor(apiKey = null) {
        const key = apiKey || config.get('env.geminiApiKey');

        if (!key) {
            throw new AIServiceError('Gemini API key is required');
        }

        this.genAI = new GoogleGenAI({ apiKey: key });
        this.config = config.get('ai');
    }

    /**
     * Generates AI response based on model and content
     *
     * @param {Object} model - AI model configuration
     * @param {string} content - Message content
     * @param {string} language - Target language
     * @returns {Promise<string>} Generated response
     * @throws {AIServiceError} If generation fails
     */
    async generateResponse(model, content, language = 'English') {
        try {
            logger.debug('Generating AI response', { modelId: model.id, language });

            // Build prompt from model template
            const prompt = this.buildPrompt(model.description, content, language);

            // Generate response using new SDK
            const response = await this.genAI.models.generateContent({
                model: this.config.model,
                contents: prompt,
            });

            let text = response.text;

            if (!text || text.trim() === '') {
                return this.getNoResponseMessage(language);
            }

            // Clean up response
            text = this.cleanResponse(text);

            logger.debug('AI response generated', { length: text.length });
            return text;
        } catch (error) {
            logger.error('Failed to generate AI response', { error: error.message });
            return this.getNoResponseMessage(language, error.message);
        }
    }

    /**
     * Builds prompt from template
     * @private
     */
    buildPrompt(template, content, language) {
        return template.replace('{{language}}', language).replace('{{message}}', content);
    }

    /**
     * Cleans AI response
     * @private
     */
    cleanResponse(text) {
        return text.trim().replace(/\n/g, ' ');
    }

    /**
     * Gets fallback message when AI fails
     * @private
     */
    getNoResponseMessage(language, error = '') {
        if (error) {
            logger.warn('Using fallback message due to error', { error });
        }

        return language === 'English' ? DEFAULT_MESSAGES.NO_RESPONSE_EN : DEFAULT_MESSAGES.NO_RESPONSE_ID;
    }

    /**
     * Validates model configuration
     *
     * @param {Object} model - Model to validate
     * @returns {boolean} True if valid
     */
    validateModel(model) {
        return model && model.id && model.name && model.description;
    }
}

export default AIService;
