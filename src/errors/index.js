/**
 * @license Discord Manager
 * errors/index.js - Custom error classes
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ERROR_CODES } from '../config/constants.js';

/**
 * Base error class for Discord Manager
 */
export class DiscordManagerError extends Error {
    constructor(message, code = ERROR_CODES.CONFIGURATION_ERROR, context = {}) {
        super(message);
        this.name = 'DiscordManagerError';
        this.code = code;
        this.context = context;
        this.timestamp = new Date().toISOString();

        // Maintains proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp,
        };
    }
}

/**
 * Validation error
 */
export class ValidationError extends DiscordManagerError {
    constructor(message, context = {}) {
        super(message, ERROR_CODES.VALIDATION_ERROR, context);
        this.name = 'ValidationError';
    }
}

/**
 * Discord API error
 */
export class DiscordAPIError extends DiscordManagerError {
    constructor(message, context = {}) {
        super(message, ERROR_CODES.DISCORD_API_ERROR, context);
        this.name = 'DiscordAPIError';
    }
}

/**
 * AI Service error
 */
export class AIServiceError extends DiscordManagerError {
    constructor(message, context = {}) {
        super(message, ERROR_CODES.AI_SERVICE_ERROR, context);
        this.name = 'AIServiceError';
    }
}

/**
 * File I/O error
 */
export class FileIOError extends DiscordManagerError {
    constructor(message, context = {}) {
        super(message, ERROR_CODES.FILE_IO_ERROR, context);
        this.name = 'FileIOError';
    }
}

/**
 * Network error
 */
export class NetworkError extends DiscordManagerError {
    constructor(message, context = {}) {
        super(message, ERROR_CODES.NETWORK_ERROR, context);
        this.name = 'NetworkError';
    }
}

/**
 * Rate limit error
 */
export class RateLimitError extends DiscordManagerError {
    constructor(message, context = {}) {
        super(message, ERROR_CODES.RATE_LIMIT_ERROR, context);
        this.name = 'RateLimitError';
    }
}

/**
 * Permission error
 */
export class PermissionError extends DiscordManagerError {
    constructor(message, context = {}) {
        super(message, ERROR_CODES.PERMISSION_ERROR, context);
        this.name = 'PermissionError';
    }
}

/**
 * Configuration error
 */
export class ConfigurationError extends DiscordManagerError {
    constructor(message, context = {}) {
        super(message, ERROR_CODES.CONFIGURATION_ERROR, context);
        this.name = 'ConfigurationError';
    }
}

/**
 * Handles errors and logs appropriately
 *
 * @param {Error} error - Error to handle
 * @param {Logger} logger - Logger instance
 * @returns {void}
 */
export const handleError = (error, logger) => {
    if (error instanceof DiscordManagerError) {
        logger.error(`[${error.code}] ${error.message}`, error.context);

        // User-friendly message
        console.log('\n⚠️  An error occurred. Check logs for details.\n');
    } else {
        logger.error('Unexpected error:', { message: error.message, stack: error.stack });
        console.log('\n⚠️  An unexpected error occurred. Check logs for details.\n');
    }
};
