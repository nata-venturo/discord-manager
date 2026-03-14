/**
 * @license Discord Manager
 * ReactionCommand.integration.test.js - Integration tests for ReactionCommand
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { ReactionCommand } from '../../src/commands/ReactionCommand.js';
import { createMockDiscordClient, createMockChannel, createMockMessage, createMockGuild } from '../helpers/mockDiscordClient.js';

describe('ReactionCommand Integration', () => {
    let reactionCommand;
    let sandbox;
    let mockClient;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        reactionCommand = new ReactionCommand();
        mockClient = createMockDiscordClient();
    });

    afterEach(() => {
        if (reactionCommand) {
            reactionCommand.stop();
        }
        sandbox.restore();
    });

    describe('Reaction flow', () => {
        it('should handle incoming message and add reaction', async () => {
            const mockGuild = createMockGuild({ withEmojis: true });
            const mockChannel = createMockChannel({ id: '123', guild: mockGuild });
            mockClient._addMockChannel(mockChannel);

            sandbox.stub(reactionCommand.discordService, 'client').value(mockClient);
            sandbox.stub(reactionCommand.discordService, 'getCurrentUser').returns(mockClient.user);
            const addReactionStub = sandbox.stub(reactionCommand.discordService, 'addReaction').resolves();

            reactionCommand.config = {
                mode: 'All Without Delay',
                delayType: 'Automatic',
                delay: 0
            };

            // Setup queue processor
            reactionCommand.messageQueue.setProcessor(async (messageData) => {
                await reactionCommand.processReaction(messageData);
            });

            const message = createMockMessage({
                content: 'Hello, this is a test message',
                author: { id: '999', tag: 'User#1234', bot: false },
                guild: mockGuild,
                channel: mockChannel
            });

            await reactionCommand.handleMessage(message, mockChannel.id);
            await reactionCommand.messageQueue.processNext();

            expect(addReactionStub.called).to.be.true;
        });

        it('should ignore messages with links', async () => {
            sandbox.stub(reactionCommand.discordService, 'getCurrentUser').returns(mockClient.user);
            const addReactionStub = sandbox.stub(reactionCommand.discordService, 'addReaction').resolves();

            const message = createMockMessage({
                content: 'Check out https://example.com',
                author: { id: '999', tag: 'User#1234', bot: false }
            });

            await reactionCommand.handleMessage(message, '123');

            expect(reactionCommand.messageQueue.getQueueLength()).to.equal(0);
            expect(addReactionStub.called).to.be.false;
        });

        it('should process reactions with delay in "All With Delay" mode', async () => {
            const mockGuild = createMockGuild({ withEmojis: true });
            const mockChannel = createMockChannel({ guild: mockGuild });

            sandbox.stub(reactionCommand.discordService, 'addReaction').resolves();
            sandbox.stub(reactionCommand, 'showCountdown').resolves();

            reactionCommand.config = {
                mode: 'All With Delay',
                delayType: 'Manual',
                delay: 5000
            };

            const message = createMockMessage({
                content: 'Test message',
                guild: mockGuild
            });

            await reactionCommand.processReaction({ message });

            expect(reactionCommand.showCountdown.called).to.be.true;
            expect(reactionCommand.showCountdown.calledWith(5000)).to.be.true;
        });
    });

    describe('Random mode', () => {
        it('should randomly skip messages in random mode', async () => {
            sandbox.stub(reactionCommand.discordService, 'getCurrentUser').returns(mockClient.user);

            reactionCommand.config = {
                mode: 'Random',
                delayType: 'Automatic',
                delay: 0
            };

            const processed = [];
            for (let i = 0; i < 100; i++) {
                const message = createMockMessage({
                    content: `Test message ${i}`,
                    author: { id: '999', tag: 'User#1234', bot: false }
                });

                await reactionCommand.handleMessage(message, '123');

                if (reactionCommand.messageQueue.getQueueLength() > 0) {
                    processed.push(i);
                    reactionCommand.messageQueue.clear();
                }
            }

            // In random mode, should process some but not all (around 40%)
            expect(processed.length).to.be.greaterThan(20);
            expect(processed.length).to.be.lessThan(60);
        });
    });

    describe('Emoji selection', () => {
        it('should use server emojis when available', async () => {
            const mockGuild = createMockGuild({ withEmojis: true });

            const emoji = await reactionCommand.getRandomEmoji(mockGuild);

            expect(emoji).to.exist;
            expect(emoji).to.be.a('string');
        });

        it('should fall back to default emojis if no server emojis', async () => {
            const mockGuild = createMockGuild({ withEmojis: false });

            const emoji = await reactionCommand.getRandomEmoji(mockGuild);

            expect(emoji).to.exist;
            expect(emoji).to.be.a('string');
        });
    });
});
