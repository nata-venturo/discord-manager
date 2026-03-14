/**
 * @license Discord Manager
 * validators/index.js - Input validation utilities
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Validates Discord token format
 *
 * @param {string} token - Discord token to validate
 * @returns {boolean} True if valid
 */
export const discordToken = (token) => {
    if (!token || typeof token !== 'string') return false;
    if (token.trim() === '') return false;
    // Discord tokens are typically base64 strings with dots
    return token.length > 50 && token.length < 200;
};

/**
 * Validates Discord channel ID format
 *
 * @param {string} channelId - Channel ID to validate
 * @returns {boolean} True if valid
 */
export const channelId = (channelId) => {
    if (!channelId || typeof channelId !== 'string') return false;
    // Discord snowflake IDs are 17-19 digit numbers
    return /^\d{17,19}$/.test(channelId);
};

/**
 * Validates user ID format
 *
 * @param {string} userId - User ID to validate
 * @returns {boolean} True if valid
 */
export const userId = (userId) => {
    if (!userId || typeof userId !== 'string') return false;
    return /^\d{17,19}$/.test(userId);
};

/**
 * Validates delay/interval value
 *
 * @param {number} delay - Delay in milliseconds
 * @param {number} min - Minimum value (default 1000ms)
 * @param {number} max - Maximum value (default 1 hour)
 * @returns {boolean} True if valid
 */
export const delay = (delay, min = 1000, max = 3600000) => {
    if (typeof delay !== 'number') return false;
    if (isNaN(delay)) return false;
    return delay >= min && delay <= max;
};

/**
 * Validates language code
 *
 * @param {string} langCode - Language code to validate
 * @returns {boolean} True if valid
 */
export const languageCode = (langCode) => {
    if (!langCode || typeof langCode !== 'string') return false;
    // ISO 639-1 codes (2-3 chars) or special codes like 'zh-cn'
    return /^[a-z]{2,3}(-[a-z]{2})?$/.test(langCode.toLowerCase());
};

/**
 * Validates message content
 *
 * @param {string} content - Message content
 * @param {number} maxLength - Maximum length (default 2000, Discord limit)
 * @returns {boolean} True if valid
 */
export const messageContent = (content, maxLength = 2000) => {
    if (!content || typeof content !== 'string') return false;
    if (content.trim() === '') return false;
    return content.length <= maxLength;
};

/**
 * Sanitizes message content to prevent injection
 *
 * @param {string} content - Content to sanitize
 * @returns {string} Sanitized content
 */
export const sanitizeMessage = (content) => {
    if (!content) return '';

    // Remove potential command injections
    let sanitized = content.replace(/`{3}/g, ''); // Remove code blocks
    sanitized = sanitized.replace(/@(everyone|here)/gi, '@\u200b$1'); // Prevent mass mentions
    sanitized = sanitized.trim();

    return sanitized;
};

/**
 * Validates cron expression
 *
 * @param {string} cron - Cron expression
 * @returns {boolean} True if valid
 */
export const cronExpression = (cron) => {
    if (!cron || typeof cron !== 'string') return false;
    // Basic cron validation (5 or 6 fields)
    const parts = cron.split(' ');
    return parts.length === 5 || parts.length === 6;
};

/**
 * Validates blockchain address (generic)
 *
 * @param {string} address - Blockchain address
 * @returns {boolean} True if valid
 */
export const blockchainAddress = (address) => {
    if (!address || typeof address !== 'string') return false;
    // Basic validation: 32-44 alphanumeric characters
    return /^[A-Za-z0-9]{32,44}$/.test(address);
};

/**
 * Validates number range
 *
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
export const numberInRange = (value, min, max) => {
    if (typeof value !== 'number') return false;
    if (isNaN(value)) return false;
    return value >= min && value <= max;
};

/**
 * Exports all validators
 */
export const validators = {
    discordToken,
    channelId,
    userId,
    delay,
    languageCode,
    messageContent,
    sanitizeMessage,
    cronExpression,
    blockchainAddress,
    numberInRange,
};

export default validators;
