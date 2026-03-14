/**
 * @license Discord Manager
 * ReactionCommand.js - Automated emoji reactions command
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import ora from 'ora';
import delay from 'delay';
import { logger } from '../utils/logger.js';
import { randomInRange } from '../utils/common.js';
import { promptDiscordToken, promptChannelId, promptSelect, promptDelay } from '../utils/prompts.js';
import { DiscordService } from '../services/DiscordService.js';
import { MessageQueueService } from '../services/MessageQueueService.js';
import { MessageContext } from '../models/MessageContext.js';
import { MODES, REACTION, TIMING } from '../config/constants.js';
import { handleError } from '../errors/index.js';

/**
 * Reaction Command - Automated emoji reactions
 */
export class ReactionCommand {
    constructor() {
        this.discordService = new DiscordService();
        this.messageQueue = new MessageQueueService();
        this.config = {
            mode: MODES.REACTION.ALL_WITHOUT_DELAY,
            delayType: MODES.DELAY_TYPE.AUTOMATIC,
            delay: 0,
        };
        this.processCount = 1;
    }

    /**
     * Executes reaction command
     */
    async execute() {
        try {
            logger.info('Starting Automated Reactions Command');

            // Get user input
            const token = await promptDiscordToken();
            const channelId = await promptChannelId();

            // Get reaction mode
            const modeChoices = [
                { id: MODES.REACTION.ALL_WITHOUT_DELAY, name: MODES.REACTION.ALL_WITHOUT_DELAY },
                { id: MODES.REACTION.ALL_WITH_DELAY, name: MODES.REACTION.ALL_WITH_DELAY },
                { id: MODES.REACTION.RANDOM, name: MODES.REACTION.RANDOM },
            ];

            this.config.mode = await promptSelect('Choose reaction mode', modeChoices);

            // Get delay configuration if needed
            if (this.config.mode === MODES.REACTION.ALL_WITH_DELAY) {
                const delayChoices = [
                    { id: MODES.DELAY_TYPE.MANUAL, name: MODES.DELAY_TYPE.MANUAL },
                    { id: MODES.DELAY_TYPE.AUTOMATIC, name: MODES.DELAY_TYPE.AUTOMATIC },
                ];

                this.config.delayType = await promptSelect('Choose delay type', delayChoices);

                if (this.config.delayType === MODES.DELAY_TYPE.MANUAL) {
                    this.config.delay = await promptDelay('Enter reaction delay', TIMING.DEFAULT_DELAY);
                }
            }

            // Initialize Discord
            await this.discordService.initialize(token);
            await this.discordService.getChannel(channelId);

            logger.success('Reaction bot initialized successfully');
            logger.info('Configuration', {
                mode: this.config.mode,
                delayType: this.config.delayType,
                delay: this.config.delay,
            });

            // Setup message queue processor
            this.messageQueue.setProcessor(async (messageData) => {
                await this.processReaction(messageData);
            });

            // Setup message listener
            this.discordService.on('messageCreate', async (message) => {
                await this.handleMessage(message, channelId);
            });
        } catch (error) {
            handleError(error, logger);
            process.exit(1);
        }
    }

    /**
     * Handles incoming message
     * @private
     */
    async handleMessage(message, channelId) {
        // Ignore bots, wrong channel, and own messages
        if (
            message.author.bot ||
            message.channel.id !== channelId ||
            message.author.tag === this.discordService.getCurrentUser().tag
        ) {
            return;
        }

        const context = new MessageContext(message);

        // Ignore links and attachments
        if (context.containsLinks() || context.hasAttachments() || context.isEmpty()) {
            logger.debug('Message ignored (link/attachment/empty)', {
                author: message.author.tag,
            });
            return;
        }

        // Random mode - 40% chance to react
        if (this.config.mode === MODES.REACTION.RANDOM) {
            if (Math.random() > REACTION.RANDOM_PROBABILITY) {
                logger.debug('Message randomly ignored', { author: message.author.tag });
                return;
            }
        }

        // Add to queue
        this.messageQueue.enqueue({ message, context });

        // Start processing if not already processing
        if (!this.messageQueue.isCurrentlyProcessing()) {
            await this.messageQueue.processNext();
        }
    }

    /**
     * Processes reaction for message
     * @private
     */
    async processReaction(messageData) {
        const { message } = messageData;

        try {
            // Get emojis
            const emoji = await this.getRandomEmoji(message.guild);

            logger.info(`Processing reaction #${this.processCount}`, {
                author: message.author.tag,
                mode: this.config.mode,
            });

            // Add reaction
            await this.discordService.addReaction(message, emoji);

            logger.success('Reaction added', {
                processCount: this.processCount,
                emoji,
            });

            // Handle delay
            if (this.config.mode === MODES.REACTION.ALL_WITH_DELAY) {
                let reactionDelay = this.config.delay;

                if (this.config.delayType === MODES.DELAY_TYPE.AUTOMATIC) {
                    reactionDelay = randomInRange(REACTION.AUTO_DELAY_MIN, REACTION.AUTO_DELAY_MAX);
                }

                await this.showCountdown(reactionDelay);
            }

            this.processCount++;
        } catch (error) {
            logger.error('Error processing reaction', { error: error.message });
        }
    }

    /**
     * Gets random emoji from server or defaults
     * @private
     */
    async getRandomEmoji(guild) {
        try {
            const serverEmojis = guild.emojis.cache.filter((emoji) => emoji.requiresColons && !emoji.animated);
            const serverEmojiList = serverEmojis.map((emoji) => emoji.toString());

            const allEmojis =
                serverEmojiList.length > 0
                    ? [...serverEmojiList, ...REACTION.DEFAULT_EMOJIS]
                    : REACTION.DEFAULT_EMOJIS;

            return allEmojis[Math.floor(Math.random() * allEmojis.length)];
        } catch (error) {
            logger.warn('Error getting server emojis, using defaults', { error: error.message });
            return REACTION.DEFAULT_EMOJIS[Math.floor(Math.random() * REACTION.DEFAULT_EMOJIS.length)];
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
        logger.info('Stopping reaction command...');
        this.messageQueue.clear();
        this.discordService.destroy();
    }
}

export default ReactionCommand;
