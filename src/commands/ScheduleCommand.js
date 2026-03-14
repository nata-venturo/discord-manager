/**
 * @license Discord Manager
 * ScheduleCommand.js - Scheduled GM/GN messages command
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import schedule from 'node-schedule';
import { logger } from '../utils/logger.js';
import { promptDiscordToken, promptChannelId, promptSelect, promptText } from '../utils/prompts.js';
import { DiscordService } from '../services/DiscordService.js';
import { SCHEDULE, DEFAULT_MESSAGES, MODES } from '../config/constants.js';
import { handleError } from '../errors/index.js';

/**
 * Schedule Command - Automated GM/GN messages
 */
export class ScheduleCommand {
    constructor() {
        this.discordService = new DiscordService();
        this.config = {
            useCustom: false,
            gmText: DEFAULT_MESSAGES.GM,
            gnText: DEFAULT_MESSAGES.GN,
        };
    }

    /**
     * Executes schedule command
     */
    async execute() {
        try {
            logger.info('Starting Scheduled Messages Command');

            // Get user input
            const token = await promptDiscordToken();
            const channelId = await promptChannelId();

            // Ask if custom messages
            const customChoices = [
                { id: MODES.CUSTOM.DEFAULT, name: 'Default Messages (gm/gn)' },
                { id: MODES.CUSTOM.CUSTOM, name: 'Custom Messages' },
            ];

            const customMode = await promptSelect('Choose message type', customChoices);
            this.config.useCustom = customMode === MODES.CUSTOM.CUSTOM;

            if (this.config.useCustom) {
                this.config.gmText = await promptText(
                    'Enter custom GM message',
                    (value) => (value.trim() ? true : 'GM message is required')
                );

                this.config.gnText = await promptText(
                    'Enter custom GN message',
                    (value) => (value.trim() ? true : 'GN message is required')
                );
            }

            // Initialize Discord
            await this.discordService.initialize(token);
            const channel = await this.discordService.getChannel(channelId);

            logger.success('Schedule bot initialized successfully');
            logger.info('Schedule configuration', {
                gmTime: '08:00 UTC',
                gnTime: '22:00 UTC',
                useCustom: this.config.useCustom,
            });

            // Schedule GM message (08:00 UTC)
            schedule.scheduleJob(SCHEDULE.GOOD_MORNING, async () => {
                await this.sendScheduledMessage(channel.id, this.config.gmText, 'GM');
            });

            // Schedule GN message (22:00 UTC)
            schedule.scheduleJob(SCHEDULE.GOOD_NIGHT, async () => {
                await this.sendScheduledMessage(channel.id, this.config.gnText, 'GN');
            });

            logger.info('Scheduled jobs created successfully');
        } catch (error) {
            handleError(error, logger);
            process.exit(1);
        }
    }

    /**
     * Sends scheduled message
     * @private
     */
    async sendScheduledMessage(channelId, text, type) {
        try {
            await this.discordService.sendMessage(channelId, text);

            logger.success('Scheduled message sent', {
                type,
                message: text,
                time: new Date().toISOString(),
            });
        } catch (error) {
            logger.error('Failed to send scheduled message', {
                type,
                error: error.message,
            });
        }
    }

    /**
     * Stops the command
     */
    stop() {
        logger.info('Stopping schedule command...');
        schedule.gracefulShutdown();
        this.discordService.destroy();
    }
}

export default ScheduleCommand;
