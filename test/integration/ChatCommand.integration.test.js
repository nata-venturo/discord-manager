/**
 * @license Discord Manager
 * ChatCommand.integration.test.js - Integration tests for ChatCommand
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { ChatCommand } from '../../src/commands/ChatCommand.js';
import { createMockDiscordClient, createMockChannel, createMockMessage } from '../helpers/mockDiscordClient.js';
import { mockAIModels, mockLanguages, mockQuotes } from '../helpers/fixtures.js';

describe('ChatCommand Integration', () => {
    let chatCommand;
    let sandbox;
    let mockClient;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        chatCommand = new ChatCommand();
        mockClient = createMockDiscordClient();
    });

    afterEach(() => {
        if (chatCommand) {
            chatCommand.stop();
        }
        sandbox.restore();
    });

    describe('Talk With AI mode', () => {
        it('should process incoming messages with AI', async () => {
            const mockChannel = createMockChannel({ id: '123' });
            mockClient._addMockChannel(mockChannel);

            // Stub config loading
            sandbox.stub(chatCommand.configRepo, 'getAIModels').resolves(mockAIModels);
            sandbox.stub(chatCommand.configRepo, 'getLanguages').resolves(mockLanguages);
            sandbox.stub(chatCommand.configRepo, 'getQuotes').resolves(mockQuotes);
            sandbox.stub(chatCommand.configRepo, 'getAIModelById').resolves(mockAIModels[0]);

            // Stub AI service
            sandbox.stub(chatCommand.aiService, 'generateResponse').resolves('AI generated response');

            // Stub Discord service
            sandbox.stub(chatCommand.discordService, 'client').value(mockClient);
            sandbox.stub(chatCommand.discordService, 'initialize').resolves();
            sandbox.stub(chatCommand.discordService, 'getChannel').resolves(mockChannel);
            sandbox.stub(chatCommand.discordService, 'getCurrentUser').returns(mockClient.user);
            sandbox.stub(chatCommand.discordService, 'sendMessage').resolves();
            sandbox.stub(chatCommand.discordService, 'sendTyping').resolves();

            chatCommand.config = {
                mode: 'Talk With AI',
                modelId: 'gemini-1.5-flash',
                modelName: 'Gemini 1.5 Flash',
                language: 'English',
                languageId: 'en',
                typeId: 'Send to Channel',
                typeName: 'Send to Channel',
                delay: 1000,
            };

            // Setup message queue processor
            chatCommand.messageQueue.setProcessor(async (messageData) => {
                await chatCommand.processAIMessage(messageData, mockAIModels, mockLanguages);
            });

            // Simulate incoming message
            const message = createMockMessage({
                content: 'Hello AI!',
                author: { id: '999', tag: 'User#1234', bot: false },
            });

            await chatCommand.handleIncomingMessage(message, mockChannel.id);

            // Process queue
            await chatCommand.messageQueue.processNext();

            expect(chatCommand.aiService.generateResponse.called).to.be.true;
        });

        it('should detect language automatically when set to auto', async () => {
            createMockChannel({ id: '123' });

            sandbox.stub(chatCommand.configRepo, 'getAIModels').resolves(mockAIModels);
            sandbox.stub(chatCommand.configRepo, 'getLanguages').resolves(mockLanguages);
            sandbox.stub(chatCommand.configRepo, 'getAIModelById').resolves(mockAIModels[0]);
            sandbox.stub(chatCommand.aiService, 'generateResponse').resolves('Response');
            sandbox.stub(chatCommand.discordService, 'getCurrentUser').returns(mockClient.user);
            sandbox.stub(chatCommand.discordService, 'sendMessage').resolves();
            sandbox.stub(chatCommand.discordService, 'sendTyping').resolves();

            const detectStub = sandbox.stub(chatCommand.translationService, 'detectLanguage').returns('Indonesian');

            chatCommand.config = {
                mode: 'Talk With AI',
                modelId: 'gemini-1.5-flash',
                languageId: 'auto',
                language: 'Auto',
                typeId: 'Send to Channel',
                delay: 1000,
            };

            const message = createMockMessage({ content: 'Halo, apa kabar?' });
            const context = { message, context: { getCleanedContent: () => 'Halo, apa kabar?' } };

            await chatCommand.processAIMessage(context, mockAIModels, mockLanguages);

            expect(detectStub.called).to.be.true;
        });
    });

    describe('Quote mode', () => {
        it('should send and delete quotes', async () => {
            const mockChannel = createMockChannel({ id: '123' });

            sandbox.stub(chatCommand.configRepo, 'getLanguages').resolves(mockLanguages);
            sandbox.stub(chatCommand.configRepo, 'getQuotes').resolves(mockQuotes);

            const sentMessage = createMockMessage({ content: 'Quote text' });
            sandbox.stub(chatCommand.discordService, 'sendMessage').resolves(sentMessage);
            sandbox.stub(chatCommand.discordService, 'deleteMessage').resolves();

            sandbox.stub(chatCommand.translationService, 'getRandomQuote').resolves({
                original: 'Test quote',
                translated: 'Test quote',
                author: 'Author',
            });

            chatCommand.config = {
                mode: 'Quote',
                languageId: 'en',
                language: 'English',
                delay: 100,
                deleteDelay: 100,
            };

            // Mock showCountdown to resolve immediately
            sandbox.stub(chatCommand, 'showCountdown').resolves();

            // Run one iteration (we'll stop it manually)
            const promise = chatCommand.startQuoteMode(mockChannel, mockQuotes);

            // Give it time to run one iteration
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Stop the loop by rejecting
            chatCommand.stop();

            try {
                await promise;
            } catch {
                // Expected to be stopped
            }

            expect(chatCommand.discordService.sendMessage.called).to.be.true;
        });
    });

    describe('Message queue integration', () => {
        it('should prioritize mention messages', async () => {
            const processedOrder = [];

            chatCommand.messageQueue.setProcessor(async (messageData) => {
                processedOrder.push(messageData.message.id);
            });

            chatCommand.messageQueue.enqueue({
                message: { id: 'msg1' },
                context: {},
                priority: false,
            });

            chatCommand.messageQueue.enqueue({
                message: { id: 'msg2' },
                context: {},
                priority: true,
            });

            chatCommand.messageQueue.enqueue({
                message: { id: 'msg3' },
                context: {},
                priority: false,
            });

            await chatCommand.messageQueue.processNext();
            await chatCommand.messageQueue.processNext();
            await chatCommand.messageQueue.processNext();

            // Priority message should be first
            expect(processedOrder[0]).to.equal('msg2');
        });
    });
});
