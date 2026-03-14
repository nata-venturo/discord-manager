/**
 * @license Discord Manager
 * chat-workflow.e2e.test.js - End-to-end tests for chat workflow
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import prompts from 'prompts';
import { ChatCommand } from '../../src/commands/ChatCommand.js';
import { createMockDiscordClient, createMockChannel, createMockMessage } from '../helpers/mockDiscordClient.js';
import { mockAIModels, mockLanguages, mockQuotes, mockDiscordTokens } from '../helpers/fixtures.js';

describe('Chat Workflow E2E', () => {
    let sandbox;
    let chatCommand;
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

    describe('Complete Talk With AI workflow', () => {
        it('should complete full user flow from input to AI response', async () => {
            const mockChannel = createMockChannel({ id: '123456789012345678' });
            mockClient._addMockChannel(mockChannel);

            // Mock user inputs
            sandbox.stub(prompts, 'prompt')
                .onFirstCall().resolves({ tokenId: mockDiscordTokens.valid })
                .onSecondCall().resolves({ channelId: '123456789012345678' })
                .onThirdCall().resolves({ selected: 'Talk With AI' })
                .onCall(3).resolves({ selected: 'gemini-1.5-flash' })
                .onCall(4).resolves({ selected: 'en' })
                .onCall(5).resolves({ selected: 'Send to Channel' })
                .onCall(6).resolves({ delay: '60000' });

            // Stub config repository
            sandbox.stub(chatCommand.configRepo, 'getAIModels').resolves(mockAIModels);
            sandbox.stub(chatCommand.configRepo, 'getLanguages').resolves(mockLanguages);
            sandbox.stub(chatCommand.configRepo, 'getQuotes').resolves(mockQuotes);
            sandbox.stub(chatCommand.configRepo, 'getAIModelById').resolves(mockAIModels[0]);

            // Stub AI service
            sandbox.stub(chatCommand.aiService, 'generateResponse').resolves('Hello! How can I help you?');

            // Stub Discord service
            sandbox.stub(chatCommand.discordService, 'client').value(mockClient);
            sandbox.stub(chatCommand.discordService, 'initialize').resolves();
            sandbox.stub(chatCommand.discordService, 'getChannel').resolves(mockChannel);
            sandbox.stub(chatCommand.discordService, 'getCurrentUser').returns(mockClient.user);
            const sendMessageStub = sandbox.stub(chatCommand.discordService, 'sendMessage').resolves();
            sandbox.stub(chatCommand.discordService, 'sendTyping').resolves();

            // Mock countdown to resolve immediately
            sandbox.stub(chatCommand, 'showCountdown').resolves();

            // Setup and run (will be stopped by test)
            const executePromise = chatCommand.execute();

            // Give it time to setup
            await new Promise(resolve => setTimeout(resolve, 100));

            // Simulate incoming message
            const message = createMockMessage({
                content: 'Hello AI, how are you?',
                author: { id: '999', tag: 'User#1234', bot: false }
            });

            chatCommand.messageQueue.setProcessor(async (messageData) => {
                await chatCommand.processAIMessage(messageData, mockAIModels, mockLanguages);
            });

            await chatCommand.handleIncomingMessage(message, mockChannel.id);
            await chatCommand.messageQueue.processNext();

            // Verify AI was called and response was sent
            expect(chatCommand.aiService.generateResponse.called).to.be.true;
            expect(sendMessageStub.called).to.be.true;

            // Cleanup
            chatCommand.stop();
        });
    });

    describe('Complete Quote workflow', () => {
        it('should complete full quote workflow from setup to sending quotes', async () => {
            const mockChannel = createMockChannel({ id: '123456789012345678' });
            mockClient._addMockChannel(mockChannel);

            // Mock user inputs
            sandbox.stub(prompts, 'prompt')
                .onFirstCall().resolves({ tokenId: mockDiscordTokens.valid })
                .onSecondCall().resolves({ channelId: '123456789012345678' })
                .onThirdCall().resolves({ selected: 'Quote' })
                .onCall(3).resolves({ selected: 'en' })
                .onCall(4).resolves({ delay: '5000' })
                .onCall(5).resolves({ delay: '3000' });

            // Stub config repository
            sandbox.stub(chatCommand.configRepo, 'getLanguages').resolves(mockLanguages);
            sandbox.stub(chatCommand.configRepo, 'getQuotes').resolves(mockQuotes);

            // Stub Discord service
            sandbox.stub(chatCommand.discordService, 'client').value(mockClient);
            sandbox.stub(chatCommand.discordService, 'initialize').resolves();
            sandbox.stub(chatCommand.discordService, 'getChannel').resolves(mockChannel);

            const sentMessage = createMockMessage({ content: 'Quote text' });
            const sendMessageStub = sandbox.stub(chatCommand.discordService, 'sendMessage').resolves(sentMessage);
            const deleteMessageStub = sandbox.stub(chatCommand.discordService, 'deleteMessage').resolves();

            // Stub translation service
            sandbox.stub(chatCommand.translationService, 'getRandomQuote').resolves({
                original: 'To be or not to be',
                translated: 'To be or not to be',
                author: 'Shakespeare'
            });

            // Mock countdown to resolve immediately
            sandbox.stub(chatCommand, 'showCountdown').resolves();

            // Setup config
            chatCommand.config = {
                mode: 'Quote',
                languageId: 'en',
                language: 'English',
                delay: 100,
                deleteDelay: 100
            };

            // Run one iteration
            const promise = chatCommand.startQuoteMode(mockChannel, mockQuotes);

            // Give it time to run
            await new Promise(resolve => setTimeout(resolve, 50));

            // Stop
            chatCommand.stop();

            try {
                await promise;
            } catch (error) {
                // Expected
            }

            expect(sendMessageStub.called).to.be.true;
            expect(chatCommand.translationService.getRandomQuote.called).to.be.true;
        });
    });

    describe('Error handling workflow', () => {
        it('should handle invalid token gracefully', async () => {
            sandbox.stub(prompts, 'prompt')
                .onFirstCall().resolves({ tokenId: 'invalid' });

            sandbox.stub(chatCommand.discordService, 'initialize').rejects(new Error('Invalid token'));

            try {
                await chatCommand.execute();
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.exist;
            }
        });

        it('should handle AI service errors gracefully', async () => {
            const mockChannel = createMockChannel({ id: '123' });

            sandbox.stub(chatCommand.configRepo, 'getAIModels').resolves(mockAIModels);
            sandbox.stub(chatCommand.configRepo, 'getLanguages').resolves(mockLanguages);
            sandbox.stub(chatCommand.configRepo, 'getAIModelById').resolves(mockAIModels[0]);

            sandbox.stub(chatCommand.aiService, 'generateResponse').rejects(new Error('API quota exceeded'));

            sandbox.stub(chatCommand.discordService, 'getCurrentUser').returns(mockClient.user);
            sandbox.stub(chatCommand.discordService, 'sendMessage').resolves();
            sandbox.stub(chatCommand.discordService, 'sendTyping').resolves();
            sandbox.stub(chatCommand, 'showCountdown').resolves();

            chatCommand.config = {
                mode: 'Talk With AI',
                modelId: 'gemini-1.5-flash',
                languageId: 'en',
                language: 'English',
                typeId: 'Send to Channel',
                delay: 1000
            };

            const message = createMockMessage({ content: 'Hello' });
            const context = { message, context: { getCleanedContent: () => 'Hello' } };

            // Should not throw
            await chatCommand.processAIMessage(context, mockAIModels, mockLanguages);

            expect(chatCommand.discordService.sendMessage.called).to.be.false;
        });
    });
});
