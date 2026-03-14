/**
 * @license Discord Manager
 * prompts.js - Prompt utilities
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prompts from 'prompts';
import { onCancel } from './common.js';
import { validators } from '../validators/index.js';

/**
 * Prompts for Discord token with validation
 *
 * @returns {Promise<string>} Discord token
 */
export const promptDiscordToken = async () => {
    const { tokenId } = await prompts(
        {
            type: 'password', // Changed from 'text' for security
            name: 'tokenId',
            message: 'Enter Discord token',
            validate: (value) => validators.discordToken(value) || 'Invalid Discord token format',
        },
        { onCancel },
    );

    return tokenId;
};

/**
 * Prompts for Discord channel ID with validation
 *
 * @returns {Promise<string>} Channel ID
 */
export const promptChannelId = async () => {
    const { channelId } = await prompts(
        {
            type: 'text',
            name: 'channelId',
            message: 'Enter Discord channel ID',
            validate: (value) => validators.channelId(value) || 'Invalid channel ID format',
        },
        { onCancel },
    );

    return channelId;
};

/**
 * Prompts for delay/interval in milliseconds
 *
 * @param {string} message - Prompt message
 * @param {number} defaultValue - Default value in ms
 * @returns {Promise<number>} Delay in milliseconds
 */
export const promptDelay = async (message = 'Enter delay in milliseconds (1000 = 1 second)', defaultValue = 1000) => {
    const { delay } = await prompts(
        {
            type: 'number',
            name: 'delay',
            message,
            initial: defaultValue,
            validate: (value) => {
                if (value < 1000) return 'Delay must be at least 1 second (1000ms)';
                if (value > 3600000) return 'Delay cannot exceed 1 hour (3600000ms)';
                return true;
            },
        },
        { onCancel },
    );

    return delay;
};

/**
 * Prompts for selecting from a list
 *
 * @param {string} message - Prompt message
 * @param {Array<{id: string, name: string}>} choices - Choice list
 * @returns {Promise<string>} Selected choice ID
 */
export const promptSelect = async (message, choices) => {
    const formattedChoices = choices.map((choice) => ({
        title: choice.name,
        value: choice.id,
    }));

    const { selected } = await prompts(
        {
            type: 'select',
            name: 'selected',
            message,
            choices: formattedChoices,
        },
        { onCancel },
    );

    return selected;
};

/**
 * Prompts for text input with validation
 *
 * @param {string} message - Prompt message
 * @param {Function} validateFn - Validation function
 * @param {string} defaultValue - Default value
 * @returns {Promise<string>} User input
 */
export const promptText = async (message, validateFn = null, defaultValue = '') => {
    const config = {
        type: 'text',
        name: 'text',
        message,
    };

    if (defaultValue) {
        config.initial = defaultValue;
    }

    if (validateFn) {
        config.validate = validateFn;
    }

    const { text } = await prompts(config, { onCancel });
    return text;
};

/**
 * Prompts for confirmation (yes/no)
 *
 * @param {string} message - Prompt message
 * @param {boolean} initial - Initial value
 * @returns {Promise<boolean>} User confirmation
 */
export const promptConfirm = async (message, initial = false) => {
    const { confirmed } = await prompts(
        {
            type: 'confirm',
            name: 'confirmed',
            message,
            initial,
        },
        { onCancel },
    );

    return confirmed;
};
