/**
 * @license Discord Manager
 * ChatCommand.js - AI chat automation command
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
import { promptDiscordToken, promptChannelId, promptSelect, promptDelay } from '../utils/prompts.js';
import { DiscordService } from '../services/DiscordService.js';
import { AIService } from '../services/AIService.js';
import { TranslationService } from '../services/TranslationService.js';
import { MessageQueueService } from '../services/MessageQueueService.js';
import { ConfigRepository } from '../repositories/ConfigRepository.js';
import { MessageContext } from '../models/MessageContext.js';
import { MODES, TIMING } from '../config/constants.js';
import { handleError } from '../errors/index.js';

/**
 * Chat Command - AI-powered chat automation
 */
export class ChatCommand {
    constructor() {
        this.discordService = new DiscordService();
        this.aiService = new AIService();
        this.translationService = new TranslationService();
        this.messageQueue = new MessageQueueService();
        this.configRepo = new ConfigRepository();

        this.config = {
            mode: null,
            modelId: null,
            modelName: null,
            language: 'Auto',
            languageId: 'auto',
            typeId: MODES.MESSAGE_TYPE.SEND_CHANNEL,
            typeName: MODES.MESSAGE_TYPE.SEND_CHANNEL,
            delay: TIMING.DEFAULT_DELAY,
        };

        this.lastMessage = null;
        this.isSpinner = false;
    }

    /**
     * Executes chat command
     */
    async execute() {
        try {
            logger.info('Starting AI Chat Command');

            // Get user input
            const token = await promptDiscordToken();
            const channelId = await promptChannelId();

            // Load configuration
            const models = await this.configRepo.getAIModels();
            const languages = await this.configRepo.getLanguages();
            const quotes = await this.configRepo.getQuotes();

            // Get mode selection
            const modeChoices = [
                { id: MODES.CHAT.TALK_WITH_AI, name: MODES.CHAT.TALK_WITH_AI },
                { id: MODES.CHAT.QUOTE, name: MODES.CHAT.QUOTE },
            ];

            this.config.mode = await promptSelect('Choose auto chat mode', modeChoices);

            if (this.config.mode === MODES.CHAT.TALK_WITH_AI) {
                await this.setupTalkWithAI(models, languages);
            } else {
                await this.setupQuoteMode(languages);
            }

            // Initialize Discord
            await this.discordService.initialize(token);
            const channel = await this.discordService.getChannel(channelId);

            logger.success('Bot initialized successfully');

            if (this.config.mode === MODES.CHAT.TALK_WITH_AI) {
                await this.startTalkWithAI(channel, models, languages);
            } else {
                await this.startQuoteMode(channel, quotes);
            }
        } catch (error) {
            handleError(error, logger);
            process.exit(1);
        }
    }

    /**
     * Setup Talk With AI mode
     * @private
     */
    async setupTalkWithAI(models, languages) {
        // Select AI model
        const modelChoices = models.map((m) => ({ id: m.id, name: m.name }));
        this.config.modelId = await promptSelect('Choose AI model', modelChoices);

        const selectedModel = models.find((m) => m.id === this.config.modelId);
        this.config.modelName = selectedModel.name;

        // Select language
        const langChoices = languages.map((l) => ({ id: l.id, name: l.name }));
        this.config.languageId = await promptSelect('Choose language', langChoices);

        const selectedLang = languages.find((l) => l.id === this.config.languageId);
        this.config.language = selectedLang.name;

        // Select message type
        const typeChoices = [
            { id: MODES.MESSAGE_TYPE.SEND_CHANNEL, name: MODES.MESSAGE_TYPE.SEND_CHANNEL },
            { id: MODES.MESSAGE_TYPE.REPLY, name: MODES.MESSAGE_TYPE.REPLY },
        ];
        this.config.typeId = await promptSelect('Choose message type', typeChoices);
        this.config.typeName = this.config.typeId;

        // Get delay
        this.config.delay = await promptDelay('Enter message delay', TIMING.MESSAGE_DELAY);
    }

    /**
     * Setup Quote mode
     * @private
     */
    async setupQuoteMode(languages) {
        // Select language
        const langChoices = languages.map((l) => ({ id: l.id, name: l.name }));
        this.config.languageId = await promptSelect('Choose language for quotes', langChoices);

        const selectedLang = languages.find((l) => l.id === this.config.languageId);
        this.config.language = selectedLang.name;

        // Get delays
        this.config.delay = await promptDelay('Enter message delay', TIMING.DEFAULT_DELAY);
        this.config.deleteDelay = await promptDelay('Enter delete delay', 60000);
    }

    /**
     * Starts Talk With AI mode
     * @private
     */
    async startTalkWithAI(channel, models, languages) {
        logger.info('Starting Talk With AI mode');

        // Setup message queue processor
        this.messageQueue.setProcessor(async (messageData) => {
            await this.processAIMessage(messageData, models, languages);
        });

        // Start auto processing
        this.messageQueue.startAutoProcessing(TIMING.QUEUE_CHECK_INTERVAL);

        // Setup message listener
        this.discordService.on('messageCreate', async (message) => {
            await this.handleIncomingMessage(message, channel.id);
        });
    }

    /**
     * Handles incoming message
     * @private
     */
    async handleIncomingMessage(message, channelId) {
        // Ignore bots, wrong channel, and own messages
        if (message.author.bot || message.channel.id !== channelId || message.author.tag === this.discordService.getCurrentUser().tag) {
            return;
        }

        const context = new MessageContext(message, this.config);

        // Ignore links, attachments, and empty messages
        if (context.containsLinks() || context.hasAttachments() || context.isEmpty()) {
            if (this.isSpinner) return;
            logger.debug('Message ignored (link/attachment/empty)', {
                author: message.author.tag,
            });
            return;
        }

        const isMentioning = context.mentionsUser(this.discordService.getCurrentUser());
        this.lastMessage = message;

        if (isMentioning) {
            // Priority queue for mentions
            this.messageQueue.enqueue({
                message,
                context,
                priority: true,
            });
        } else {
            // Regular queue
            if (this.messageQueue.getQueueLength() === 0 && !this.messageQueue.isCurrentlyProcessing()) {
                await this.processAIMessage({ message, context }, await this.configRepo.getAIModels(), await this.configRepo.getLanguages());
            }
        }
    }

    /**
     * Processes AI message
     * @private
     */
    async processAIMessage(messageData, models, languages) {
        const { message, context } = messageData;

        try {
            const cleanedContent = context.getCleanedContent();

            // Detect language
            let targetLanguage = this.config.language;
            if (this.config.languageId === 'auto') {
                targetLanguage = this.translationService.detectLanguage(cleanedContent, languages);
            }

            logger.info('Processing message', {
                author: message.author.tag,
                language: targetLanguage,
                model: this.config.modelName,
            });

            // Get AI model
            const model = await this.configRepo.getAIModelById(this.config.modelId);

            // Generate AI response
            const response = await this.aiService.generateResponse(model, cleanedContent, targetLanguage);

            if (response) {
                // Send typing indicator
                await this.discordService.sendTyping(message.channel.id);
                await delay(TIMING.MESSAGE_DELAY);

                // Send response
                if (this.config.typeId === MODES.MESSAGE_TYPE.REPLY) {
                    await this.discordService.replyToMessage(message, response);
                } else {
                    await this.discordService.sendMessage(message.channel.id, response);
                }

                logger.success('AI response sent', { length: response.length });
            }

            // Show countdown
            await this.showCountdown(this.config.delay);

            if (this.lastMessage === message) {
                this.lastMessage = null;
            }
        } catch (error) {
            logger.error('Error processing AI message', { error: error.message });
        }
    }

    /**
     * Starts Quote mode
     * @private
     */
    async startQuoteMode(channel, quotes) {
        logger.info('Starting Quote mode');

        while (true) {
            try {
                const quote = await this.translationService.getRandomQuote(quotes, this.config.languageId);

                logger.info('Sending quote', { language: this.config.language });

                // Send quote
                const sentMessage = await this.discordService.sendMessage(channel.id, quote.translated);

                // Delete after delay
                if (this.config.deleteDelay) {
                    await delay(this.config.deleteDelay);
                    await this.discordService.deleteMessage(sentMessage);
                    logger.debug('Quote deleted');
                }

                // Wait before next quote
                await this.showCountdown(this.config.delay);
            } catch (error) {
                logger.error('Error in quote mode', { error: error.message });
            }
        }
    }

    /**
     * Shows countdown with spinner
     * @private
     */
    async showCountdown(duration) {
        let timeLeft = duration / 1000;
        this.isSpinner = true;
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
        this.isSpinner = false;
    }

    /**
     * Stops the command
     */
    stop() {
        logger.info('Stopping chat command...');
        this.messageQueue.clear();
        this.discordService.destroy();
    }
}

export default ChatCommand;
