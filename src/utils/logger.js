/**
 * @license Discord Manager
 * logger.js - Logging utility
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import chalk from 'chalk';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

/**
 * Log levels
 */
export const LogLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
};

/**
 * Logger class for application-wide logging
 */
export class Logger {
    constructor(options = {}) {
        this.logLevel = options.logLevel || LogLevel.INFO;
        this.logToFile = options.logToFile !== false;
        this.logDir = options.logDir || './logs';
        this.logFileName = options.logFileName || 'discord-manager.log';

        if (this.logToFile) {
            this._ensureLogDirectory();
        }
    }

    /**
     * Ensures log directory exists
     * @private
     */
    _ensureLogDirectory() {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Gets current timestamp
     * @private
     */
    _getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Formats log message
     * @private
     */
    _formatMessage(level, message, meta = {}) {
        const timestamp = this._getTimestamp();
        const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
    }

    /**
     * Writes log to file
     * @private
     */
    async _writeToFile(message) {
        if (!this.logToFile) return;

        try {
            const logPath = path.join(this.logDir, this.logFileName);
            await fs.appendFile(logPath, message + '\n', 'utf-8');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Checks if level should be logged
     * @private
     */
    _shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentIndex = levels.indexOf(this.logLevel);
        const messageIndex = levels.indexOf(level);
        return messageIndex >= currentIndex;
    }

    /**
     * Logs debug message
     *
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    debug(message, meta = {}) {
        if (!this._shouldLog(LogLevel.DEBUG)) return;

        const formatted = this._formatMessage(LogLevel.DEBUG, message, meta);
        console.log(chalk.gray(formatted));
        this._writeToFile(formatted);
    }

    /**
     * Logs info message
     *
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    info(message, meta = {}) {
        if (!this._shouldLog(LogLevel.INFO)) return;

        const formatted = this._formatMessage(LogLevel.INFO, message, meta);
        console.log(chalk.blue(formatted));
        this._writeToFile(formatted);
    }

    /**
     * Logs warning message
     *
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    warn(message, meta = {}) {
        if (!this._shouldLog(LogLevel.WARN)) return;

        const formatted = this._formatMessage(LogLevel.WARN, message, meta);
        console.log(chalk.yellow(formatted));
        this._writeToFile(formatted);
    }

    /**
     * Logs error message
     *
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    error(message, meta = {}) {
        if (!this._shouldLog(LogLevel.ERROR)) return;

        const formatted = this._formatMessage(LogLevel.ERROR, message, meta);
        console.log(chalk.red(formatted));
        this._writeToFile(formatted);
    }

    /**
     * Logs success message (info level with green color)
     *
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    success(message, meta = {}) {
        if (!this._shouldLog(LogLevel.INFO)) return;

        const formatted = this._formatMessage(LogLevel.INFO, message, meta);
        console.log(chalk.green(formatted));
        this._writeToFile(formatted);
    }
}

// Export singleton instance
export const logger = new Logger({
    logLevel: process.env.LOG_LEVEL || LogLevel.INFO,
    logToFile: process.env.LOG_TO_FILE !== 'false',
});
