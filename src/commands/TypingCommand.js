/**
 * @license Discord Manager
 * TypingCommand.js - Typing indicator simulation command
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
import { formatTime } from '../utils/common.js';
import { promptDiscordToken, promptChannelId } from '../utils/prompts.js';
import { DiscordService } from '../services/DiscordService.js';
import { config } from '../config/index.js';
import { handleError } from '../errors/index.js';

/**
 * Typing Command - Simulates typing indicator
 */
export class TypingCommand {
    constructor() {
        this.discordService = new DiscordService();
        this.interval = config.get('timing.TYPING_INTERVAL', 9000);
        this.isRunning = false;
    }

    /**
     * Executes typing simulation
     */
    async execute() {
        try {
            logger.info('Starting Typing Simulation Command');

            // Get user input
            const token = await promptDiscordToken();
            const channelId = await promptChannelId();

            // Initialize Discord
            await this.discordService.initialize(token);

            // Validate channel
            await this.discordService.getChannel(channelId);

            logger.success('Bot initialized successfully');
            logger.info(`Typing simulation will run every ${formatTime(this.interval)}`);

            // Start typing simulation
            await this.startTypingSimulation(channelId);
        } catch (error) {
            handleError(error, logger);
            process.exit(1);
        }
    }

    /**
     * Starts typing simulation loop
     * @private
     */
    async startTypingSimulation(channelId) {
        this.isRunning = true;
        let processCount = 1;

        while (this.isRunning) {
            try {
                logger.info(`Process #${processCount} - Sending typing indicator`);

                // Send typing
                await this.discordService.sendTyping(channelId);

                // Show countdown
                await this.showCountdown(this.interval);

                processCount++;
            } catch (error) {
                logger.error('Error in typing simulation', { error: error.message });
                throw error;
            }
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
     * Stops typing simulation
     */
    stop() {
        logger.info('Stopping typing simulation...');
        this.isRunning = false;
        this.discordService.destroy();
    }
}

export default TypingCommand;
