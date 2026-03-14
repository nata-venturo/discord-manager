/**
 * @license Discord Manager
 * ModerationService.js - Content moderation service
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import BadWordsNext from 'bad-words-next';
import { logger } from '../utils/logger.js';
import { getRandomItem } from '../utils/common.js';
import { MODERATION, MODERATION_GIFS } from '../config/constants.js';

/**
 * Moderation Service - Handles content moderation and user warnings
 */
export class ModerationService {
    constructor(badWordsConfig = null) {
        this.badWords = null;
        if (badWordsConfig) {
            this.setBadWordsConfig(badWordsConfig);
        }
    }

    /**
     * Sets bad words configuration
     *
     * @param {Object} config - Bad words configuration
     */
    setBadWordsConfig(config) {
        this.badWords = new BadWordsNext({ data: config });
        logger.debug('Bad words filter initialized');
    }

    /**
     * Checks if message contains bad words
     *
     * @param {string} content - Message content
     * @returns {boolean} True if bad words detected
     */
    containsBadWords(content) {
        if (!this.badWords) {
            logger.warn('Bad words filter not initialized');
            return false;
        }

        return this.badWords.check(content);
    }

    /**
     * Gets list of detected bad words in content
     *
     * @param {string} content - Message content
     * @returns {Array<string>} List of detected bad words
     */
    getDetectedBadWords(content) {
        if (!this.badWords) {
            return [];
        }

        const detected = [];
        this.badWords.filter(content, (badWord) => {
            detected.push(badWord);
        });

        return detected;
    }

    /**
     * Determines moderation action based on warning count
     *
     * @param {number} warnings - Current warning count
     * @returns {Object} Moderation action details
     */
    getModerationAction(warnings) {
        const thresholds = MODERATION.WARNING_THRESHOLDS;
        const durations = MODERATION.TIMEOUT_DURATIONS;

        if (warnings === thresholds.KICK) {
            return {
                type: 'kick',
                duration: null,
                message: `kicked after receiving ${thresholds.KICK}x warnings`,
                gif: getRandomItem(MODERATION_GIFS.BANNED),
            };
        }

        if (warnings === thresholds.TIMEOUT_3) {
            return {
                type: 'timeout',
                duration: durations.THIRD,
                message: `timeout of 30 minutes because it has received ${thresholds.TIMEOUT_3}x warnings`,
                gif: getRandomItem(MODERATION_GIFS.TIMEOUT),
            };
        }

        if (warnings === thresholds.TIMEOUT_2) {
            return {
                type: 'timeout',
                duration: durations.SECOND,
                message: `timeout of 15 minutes because it has received ${thresholds.TIMEOUT_2}x warnings`,
                gif: getRandomItem(MODERATION_GIFS.TIMEOUT),
            };
        }

        if (warnings === thresholds.TIMEOUT_1) {
            return {
                type: 'timeout',
                duration: durations.FIRST,
                message: `timeout of 5 minutes because it has received ${thresholds.TIMEOUT_1}x warnings`,
                gif: getRandomItem(MODERATION_GIFS.TIMEOUT),
            };
        }

        return {
            type: 'warning',
            duration: null,
            message: `${warnings}x warning`,
            gif: getRandomItem(MODERATION_GIFS.WARNING),
        };
    }

    /**
     * Applies moderation action to user
     *
     * @param {GuildMember} member - Discord guild member
     * @param {Object} action - Moderation action
     * @returns {Promise<boolean>} True if action applied successfully
     */
    async applyModerationAction(member, action) {
        try {
            if (!member.moderatable) {
                logger.warn('Member not moderatable', { userId: member.id });
                return false;
            }

            if (action.type === 'timeout') {
                await member.timeout(action.duration, `Have received ${action.message}`);
                logger.info('User timed out', {
                    userId: member.id,
                    duration: action.duration,
                });
                return true;
            }

            if (action.type === 'kick') {
                await member.kick(`Have received 15 warnings`);
                logger.info('User kicked', { userId: member.id });
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Failed to apply moderation action', {
                userId: member.id,
                action: action.type,
                error: error.message,
            });
            return false;
        }
    }
}

export default ModerationService;
