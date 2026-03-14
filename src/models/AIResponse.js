/**
 * @license Discord Manager
 * AIResponse.js - AI response model
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * AI Response Model - Represents an AI-generated response
 */
export class AIResponse {
    constructor(text, metadata = {}) {
        this.text = text;
        this.metadata = {
            model: metadata.model || 'unknown',
            language: metadata.language || 'English',
            timestamp: new Date(),
            ...metadata,
        };
    }

    /**
     * Gets response text
     *
     * @returns {string} Response text
     */
    getText() {
        return this.text;
    }

    /**
     * Gets metadata
     *
     * @returns {Object} Metadata
     */
    getMetadata() {
        return this.metadata;
    }

    /**
     * Checks if response is empty
     *
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return !this.text || this.text.trim() === '';
    }

    /**
     * Gets response length
     *
     * @returns {number} Text length
     */
    getLength() {
        return this.text ? this.text.length : 0;
    }

    /**
     * Converts to plain object
     *
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            text: this.text,
            metadata: this.metadata,
        };
    }
}

export default AIResponse;
