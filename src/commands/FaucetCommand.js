/**
 * @license Discord Manager
 * FaucetCommand.js - Mango Network faucet automation command
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import ora from 'ora';
import delay from 'delay';
import fetch from 'node-fetch';
import schedule from 'node-schedule';
import { logger } from '../utils/logger.js';
import { formatTime } from '../utils/common.js';
import { promptDiscordToken, promptChannelId, promptText, promptDelay } from '../utils/prompts.js';
import { DiscordService } from '../services/DiscordService.js';
import { validators } from '../validators/index.js';
import { SCHEDULE, TIMING } from '../config/constants.js';
import { NetworkError, handleError } from '../errors/index.js';

/**
 * Faucet Command - Automated faucet claiming for Mango Network
 */
export class FaucetCommand {
    constructor() {
        this.discordService = new DiscordService();
        this.config = {
            mangoAddress: null,
            delay: TIMING.DEFAULT_DELAY,
            botMentionId: '1322128247550640130', // TODO: Move to config
        };
        this.processCount = 1;
    }

    /**
     * Executes faucet command
     */
    async execute() {
        try {
            logger.info('Starting Mango Faucet Automation Command');

            // Get user input
            const token = await promptDiscordToken();
            const channelId = await promptChannelId();

            this.config.mangoAddress = await promptText(
                'Enter Mango address',
                (value) => {
                    if (!value.trim()) return 'Mango address is required';
                    if (!validators.blockchainAddress(value)) {
                        return 'Invalid Mango address format';
                    }
                    return true;
                }
            );

            this.config.delay = await promptDelay('Enter claim interval', 60000);

            // Initialize Discord
            await this.discordService.initialize(token);
            const channel = await this.discordService.getChannel(channelId);

            logger.success('Faucet bot initialized successfully');
            logger.info('Configuration', {
                address: this.config.mangoAddress,
                interval: formatTime(this.config.delay),
            });

            // Schedule cleanup job (22:00 UTC)
            schedule.scheduleJob(SCHEDULE.CLEANUP, async () => {
                await this.cleanupMessages(channel.id, token);
            });

            // Start faucet claiming loop
            await this.startFaucetLoop(channel.id);
        } catch (error) {
            handleError(error, logger);
            process.exit(1);
        }
    }

    /**
     * Starts faucet claiming loop
     * @private
     */
    async startFaucetLoop(channelId) {
        while (true) {
            try {
                const message = `<@${this.config.botMentionId}> ${this.config.mangoAddress}`;

                logger.info(`Faucet claim #${this.processCount}`);

                await this.discordService.sendMessage(channelId, message);

                logger.success('Faucet claim sent', {
                    processCount: this.processCount,
                    address: this.config.mangoAddress,
                });

                await this.showCountdown(this.config.delay);

                this.processCount++;
            } catch (error) {
                logger.error('Error in faucet loop', { error: error.message });
                throw error;
            }
        }
    }

    /**
     * Cleans up old faucet messages
     * @private
     */
    async cleanupMessages(channelId, token) {
        logger.info('Starting message cleanup');

        let hasMessagesToDelete = true;

        while (hasMessagesToDelete) {
            try {
                // Search for messages containing the address
                const messages = await this.searchMessages(
                    channelId,
                    this.discordService.getCurrentUser().id,
                    token,
                    this.config.mangoAddress
                );

                if (!messages || messages.length === 0) {
                    logger.info('No more messages to delete');
                    hasMessagesToDelete = false;
                    break;
                }

                // Delete found messages
                for (const msg of messages) {
                    try {
                        const channel = await this.discordService.getChannel(msg.channelId);
                        const message = await channel.messages.fetch(msg.messageId);

                        if (message) {
                            await this.discordService.deleteMessage(message);
                            logger.debug('Message deleted', { messageId: msg.messageId });
                        }
                    } catch (error) {
                        logger.warn('Failed to delete message', {
                            messageId: msg.messageId,
                            error: error.message,
                        });
                    }
                }

                logger.info('Cleanup batch completed', { deleted: messages.length });
            } catch (error) {
                logger.error('Error during cleanup', { error: error.message });
                hasMessagesToDelete = false;
            }
        }

        logger.success('Message cleanup completed');
    }

    /**
     * Searches for messages via Discord API
     * @private
     */
    async searchMessages(channelId, userId, token, content) {
        try {
            const channel = await this.discordService.getChannel(channelId);
            const guildId = channel.guildId;

            const searchUrl = `https://discord.com/api/v9/guilds/${guildId}/messages/search?author_id=${userId}&content=${encodeURIComponent(content)}`;

            const response = await fetch(searchUrl, {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    authorization: token,
                    'cache-control': 'no-cache',
                    pragma: 'no-cache',
                },
                method: 'GET',
            });

            if (!response.ok) {
                throw new NetworkError(`Search API returned ${response.status}`);
            }

            const data = await response.json();
            const messages = [];

            if (data.messages && Array.isArray(data.messages)) {
                data.messages.forEach((messageGroup) => {
                    if (Array.isArray(messageGroup)) {
                        messageGroup.forEach((message) => {
                            messages.push({
                                messageId: message.id,
                                channelId: message.channel_id,
                                content: message.content,
                                timestamp: message.timestamp,
                            });
                        });
                    }
                });
            }

            return messages;
        } catch (error) {
            logger.error('Failed to search messages', { error: error.message });
            throw error;
        }
    }

    /**
     * Shows countdown with spinner
     * @private
     */
    async showCountdown(duration) {
        let timeLeft = duration / 1000;
        const spinner = ora('Starting countdown...').start();

        const countdownInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = Math.floor(timeLeft % 60);
            spinner.text = `Time Left: ${minutes} minutes ${seconds} seconds`;
            timeLeft--;

            if (timeLeft < 0) {
                spinner.stop();
                clearInterval(countdownInterval);
            }
        }, 1000);

        await delay(duration);
        spinner.stop();
    }

    /**
     * Stops the command
     */
    stop() {
        logger.info('Stopping faucet command...');
        schedule.gracefulShutdown();
        this.discordService.destroy();
    }
}

export default FaucetCommand;
