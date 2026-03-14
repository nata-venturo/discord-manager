/**
 * @license Discord Manager
 * DiscordService.js - Discord client service
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Client } from 'discord.js-selfbot-v13';
import { DiscordAPIError, ValidationError } from '../errors/index.js';
import { logger } from '../utils/logger.js';
import { validators } from '../validators/index.js';

/**
 * Discord Service - Handles all Discord client operations
 */
export class DiscordService {
    constructor() {
        this.client = new Client({ checkUpdate: false });
        this.isReady = false;
    }

    /**
     * Initializes and logs in to Discord
     *
     * @param {string} token - Discord token
     * @returns {Promise<Client>} Discord client instance
     * @throws {DiscordAPIError} If login fails
     */
    async initialize(token) {
        try {
            if (!validators.discordToken(token)) {
                throw new ValidationError('Invalid Discord token format');
            }

            logger.info('Initializing Discord client...');

            // Setup ready event
            this.client.once('ready', () => {
                this.isReady = true;
                logger.success(`Logged in as ${this.client.user.tag}`);
            });

            // Login
            await this.client.login(token);

            // Wait for ready
            await this.waitForReady();

            return this.client;
        } catch (error) {
            logger.error('Failed to initialize Discord client', { error: error.message });
            throw new DiscordAPIError(`Discord initialization failed: ${error.message}`);
        }
    }

    /**
     * Waits for client to be ready
     * @private
     */
    async waitForReady(timeout = 30000) {
        const start = Date.now();

        while (!this.isReady) {
            if (Date.now() - start > timeout) {
                throw new DiscordAPIError('Discord client ready timeout');
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    /**
     * Gets and validates a text channel
     *
     * @param {string} channelId - Channel ID
     * @returns {Promise<TextChannel>} Channel instance
     * @throws {ValidationError} If channel is invalid
     */
    async getChannel(channelId) {
        if (!validators.channelId(channelId)) {
            throw new ValidationError('Invalid channel ID format', { channelId });
        }

        const channel = this.client.channels.cache.get(channelId);

        if (!channel) {
            throw new ValidationError('Channel not found', { channelId });
        }

        if (!channel.isText()) {
            throw new ValidationError('Channel is not a text channel', { channelId });
        }

        return channel;
    }

    /**
     * Sends a message to a channel
     *
     * @param {string} channelId - Channel ID
     * @param {string} content - Message content
     * @returns {Promise<Message>} Sent message
     */
    async sendMessage(channelId, content) {
        try {
            const channel = await this.getChannel(channelId);

            if (!validators.messageContent(content)) {
                throw new ValidationError('Invalid message content');
            }

            const sanitized = validators.sanitizeMessage(content);
            return await channel.send(sanitized);
        } catch (error) {
            logger.error('Failed to send message', { channelId, error: error.message });
            throw error;
        }
    }

    /**
     * Sends typing indicator to a channel
     *
     * @param {string} channelId - Channel ID
     * @returns {Promise<void>}
     */
    async sendTyping(channelId) {
        try {
            const channel = await this.getChannel(channelId);
            await channel.sendTyping();
        } catch (error) {
            logger.error('Failed to send typing', { channelId, error: error.message });
            throw error;
        }
    }

    /**
     * Deletes a message
     *
     * @param {Message} message - Message to delete
     * @returns {Promise<void>}
     */
    async deleteMessage(message) {
        try {
            await message.delete();
            logger.debug('Message deleted', { messageId: message.id });
        } catch (error) {
            logger.error('Failed to delete message', { messageId: message.id, error: error.message });
            throw new DiscordAPIError(`Failed to delete message: ${error.message}`);
        }
    }

    /**
     * Reacts to a message
     *
     * @param {Message} message - Message to react to
     * @param {string} emoji - Emoji to react with
     * @returns {Promise<void>}
     */
    async addReaction(message, emoji) {
        try {
            await message.react(emoji);
            logger.debug('Reaction added', { messageId: message.id, emoji });
        } catch (error) {
            logger.warn('Failed to add reaction', { messageId: message.id, emoji, error: error.message });
            // Don't throw, reaction failures are not critical
        }
    }

    /**
     * Replies to a message
     *
     * @param {Message} message - Message to reply to
     * @param {string} content - Reply content
     * @returns {Promise<Message>} Sent reply
     */
    async replyToMessage(message, content) {
        try {
            if (!validators.messageContent(content)) {
                throw new ValidationError('Invalid reply content');
            }

            const sanitized = validators.sanitizeMessage(content);
            return await message.reply(sanitized);
        } catch (error) {
            logger.error('Failed to reply to message', { messageId: message.id, error: error.message });
            throw error;
        }
    }

    /**
     * Gets client instance
     *
     * @returns {Client} Discord client
     */
    getClient() {
        return this.client;
    }

    /**
     * Gets current user
     *
     * @returns {User|null} Current user
     */
    getCurrentUser() {
        return this.client.user;
    }

    /**
     * Registers event handler
     *
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        this.client.on(event, handler);
    }

    /**
     * Registers one-time event handler
     *
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    once(event, handler) {
        this.client.once(event, handler);
    }

    /**
     * Destroys client connection
     */
    async destroy() {
        logger.info('Destroying Discord client...');
        await this.client.destroy();
        this.isReady = false;
    }
}

export default DiscordService;
