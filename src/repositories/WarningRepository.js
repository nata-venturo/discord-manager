/**
 * @license Discord Manager
 * WarningRepository.js - User warnings data repository
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { loadFileJson, saveFileJson } from '../utils/common.js';
import { PATHS } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { FileIOError } from '../errors/index.js';

/**
 * Warning Repository - Handles user warning data persistence
 */
export class WarningRepository {
    constructor(filePath = PATHS.USER_WARNINGS) {
        this.filePath = filePath;
        this.warnings = new Map();
        this.loaded = false;
    }

    /**
     * Loads warnings from file
     *
     * @returns {Promise<void>}
     */
    async load() {
        try {
            this.warnings = await loadFileJson(this.filePath, 'map');
            this.loaded = true;
            logger.debug('Warnings loaded from file', {
                count: this.warnings.size,
            });
        } catch (error) {
            throw new FileIOError(`Failed to load warnings: ${error.message}`);
        }
    }

    /**
     * Saves warnings to file
     *
     * @returns {Promise<void>}
     */
    async save() {
        try {
            const data = Object.fromEntries(this.warnings);
            await saveFileJson(this.filePath, data);
            logger.debug('Warnings saved to file');
        } catch (error) {
            throw new FileIOError(`Failed to save warnings: ${error.message}`);
        }
    }

    /**
     * Gets warning count for user
     *
     * @param {string} userId - User ID
     * @returns {Promise<number>} Warning count
     */
    async getWarnings(userId) {
        if (!this.loaded) {
            await this.load();
        }
        return this.warnings.get(userId) || 0;
    }

    /**
     * Increments warning count for user
     *
     * @param {string} userId - User ID
     * @returns {Promise<number>} New warning count
     */
    async incrementWarning(userId) {
        if (!this.loaded) {
            await this.load();
        }

        const current = this.warnings.get(userId) || 0;
        const newCount = current + 1;
        this.warnings.set(userId, newCount);

        await this.save();

        logger.info('User warning incremented', { userId, warnings: newCount });
        return newCount;
    }

    /**
     * Clears warnings for user
     *
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async clearWarnings(userId) {
        if (!this.loaded) {
            await this.load();
        }

        this.warnings.delete(userId);
        await this.save();

        logger.info('User warnings cleared', { userId });
    }

    /**
     * Gets all warnings
     *
     * @returns {Promise<Map>} All warnings
     */
    async getAllWarnings() {
        if (!this.loaded) {
            await this.load();
        }
        return this.warnings;
    }
}

export default WarningRepository;
