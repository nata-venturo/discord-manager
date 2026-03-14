/**
 * @license Discord Manager
 * ModerationCommand.js - Content moderation command
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import { logger } from '../utils/logger.js';
import { promptDiscordToken, promptChannelId } from '../utils/prompts.js';
import { DiscordService } from '../services/DiscordService.js';
import { ModerationService } from '../services/ModerationService.js';
import { ConfigRepository } from '../repositories/ConfigRepository.js';
import { WarningRepository } from '../repositories/WarningRepository.js';
import { MessageContext } from '../models/MessageContext.js';
import { handleError } from '../errors/index.js';

/**
 * Moderation Command - Automated content moderation
 */
export class ModerationCommand {
    constructor() {
        this.discordService = new DiscordService();
        this.moderationService = new ModerationService();
        this.configRepo = new ConfigRepository();
        this.warningRepo = new WarningRepository();
        this.allowedUsers = ['natarizkie']; // TODO: Move to config
    }

    /**
     * Executes moderation command
     */
    async execute() {
        try {
            logger.info('Starting Content Moderation Command');

            // Get user input
            const token = await promptDiscordToken();
            const channelId = await promptChannelId();

            // Load bad words configuration
            const badWordsConfig = await this.configRepo.getBadWords();
            this.moderationService.setBadWordsConfig(badWordsConfig);

            // Load warnings
            await this.warningRepo.load();

            // Initialize Discord
            await this.discordService.initialize(token);
            await this.discordService.getChannel(channelId);

            logger.success('Moderation bot initialized successfully');

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
     * Handles incoming message for moderation
     * @private
     */
    async handleMessage(message, channelId) {
        // Ignore bots, wrong channel, and allowed users
        if (
            message.author.bot ||
            message.channel.id !== channelId ||
            this.allowedUsers.includes(message.author.tag)
        ) {
            return;
        }

        const context = new MessageContext(message);

        // Check for bad words
        if (this.moderationService.containsBadWords(context.content)) {
            await this.moderateMessage(message);
        }
    }

    /**
     * Moderates a message containing bad words
     * @private
     */
    async moderateMessage(message) {
        try {
            // Delete message
            await this.discordService.deleteMessage(message);

            // Get detected bad words
            const badWords = this.moderationService.getDetectedBadWords(message.content);

            // Increment warnings
            const warnings = await this.warningRepo.incrementWarning(message.author.id);

            logger.warn('Bad words detected', {
                user: message.author.tag,
                words: badWords,
                warnings,
            });

            // Get moderation action
            const action = this.moderationService.getModerationAction(warnings);

            // Send warning message
            if (action.type === 'warning') {
                await this.discordService.sendMessage(
                    message.channel.id,
                    `${message.author} using the word ||**${badWords.join(', ')}**|| is inappropriate and prohibited here, ${action.message}.`
                );
                await this.discordService.sendMessage(message.channel.id, action.gif);
            }

            // Apply moderation action
            if (action.type === 'timeout' || action.type === 'kick') {
                const applied = await this.moderationService.applyModerationAction(message.member, action);

                if (applied) {
                    const actionText =
                        action.type === 'timeout'
                            ? `has been given a ${action.message}`
                            : `has been ${action.message}`;

                    await this.discordService.sendMessage(
                        message.channel.id,
                        `${message.author} ${actionText}.`
                    );
                    await this.discordService.sendMessage(message.channel.id, action.gif);

                    // Clear warnings if kicked
                    if (action.type === 'kick') {
                        await this.warningRepo.clearWarnings(message.author.id);
                    }
                }
            }

            logger.info('Moderation action completed', {
                user: message.author.tag,
                action: action.type,
                warnings,
            });
        } catch (error) {
            logger.error('Error moderating message', { error: error.message });
        }
    }

    /**
     * Stops the command
     */
    stop() {
        logger.info('Stopping moderation command...');
        this.discordService.destroy();
    }
}

export default ModerationCommand;
