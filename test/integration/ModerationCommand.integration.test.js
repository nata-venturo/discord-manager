/**
 * @license Discord Manager
 * ModerationCommand.integration.test.js - Integration tests for ModerationCommand
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { ModerationCommand } from '../../src/commands/ModerationCommand.js';
import { createMockDiscordClient, createMockChannel, createMockMessage, createMockMember } from '../helpers/mockDiscordClient.js';
import { mockBadWords } from '../helpers/fixtures.js';

describe('ModerationCommand Integration', () => {
    let moderationCommand;
    let sandbox;
    let mockClient;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        moderationCommand = new ModerationCommand();
        mockClient = createMockDiscordClient();
    });

    afterEach(() => {
        if (moderationCommand) {
            moderationCommand.stop();
        }
        sandbox.restore();
    });

    describe('Message moderation flow', () => {
        it('should detect, delete, warn, and timeout user for bad words', async () => {
            const mockChannel = createMockChannel({ id: '123' });
            mockClient._addMockChannel(mockChannel);

            // Setup bad words
            sandbox.stub(moderationCommand.configRepo, 'getBadWords').resolves(mockBadWords);
            await moderationCommand.configRepo.getBadWords().then(config => {
                moderationCommand.moderationService.setBadWordsConfig(config);
            });

            // Setup warning repository
            sandbox.stub(moderationCommand.warningRepo, 'load').resolves();
            sandbox.stub(moderationCommand.warningRepo, 'incrementWarning').resolves(3);
            sandbox.stub(moderationCommand.warningRepo, 'clearWarnings').resolves();

            // Setup Discord service
            sandbox.stub(moderationCommand.discordService, 'client').value(mockClient);
            sandbox.stub(moderationCommand.discordService, 'initialize').resolves();
            sandbox.stub(moderationCommand.discordService, 'getChannel').resolves(mockChannel);
            const deleteStub = sandbox.stub(moderationCommand.discordService, 'deleteMessage').resolves();
            const sendStub = sandbox.stub(moderationCommand.discordService, 'sendMessage').resolves();

            // Setup moderation service
            const containsStub = sandbox.stub(moderationCommand.moderationService, 'containsBadWords').returns(true);
            sandbox.stub(moderationCommand.moderationService, 'getDetectedBadWords').returns(['badword1']);
            sandbox.stub(moderationCommand.moderationService, 'getModerationAction').returns({
                type: 'timeout',
                duration: 300000,
                message: '5 minute timeout',
                gif: 'https://example.com/timeout.gif'
            });

            const mockMember = createMockMember({ id: '999' });
            const applyStub = sandbox.stub(moderationCommand.moderationService, 'applyModerationAction').resolves(true);

            // Create message with bad word
            const message = createMockMessage({
                content: 'This contains badword1',
                author: { id: '999', tag: 'BadUser#1234', bot: false },
                member: mockMember
            });

            await moderationCommand.moderateMessage(message);

            expect(deleteStub.called).to.be.true;
            expect(moderationCommand.warningRepo.incrementWarning.called).to.be.true;
            expect(applyStub.called).to.be.true;
            expect(sendStub.called).to.be.true;
        });

        it('should kick user after reaching kick threshold', async () => {
            sandbox.stub(moderationCommand.configRepo, 'getBadWords').resolves(mockBadWords);
            await moderationCommand.configRepo.getBadWords().then(config => {
                moderationCommand.moderationService.setBadWordsConfig(config);
            });

            sandbox.stub(moderationCommand.warningRepo, 'load').resolves();
            sandbox.stub(moderationCommand.warningRepo, 'incrementWarning').resolves(15); // Kick threshold
            const clearStub = sandbox.stub(moderationCommand.warningRepo, 'clearWarnings').resolves();

            sandbox.stub(moderationCommand.discordService, 'deleteMessage').resolves();
            sandbox.stub(moderationCommand.discordService, 'sendMessage').resolves();

            sandbox.stub(moderationCommand.moderationService, 'containsBadWords').returns(true);
            sandbox.stub(moderationCommand.moderationService, 'getDetectedBadWords').returns(['badword1']);
            sandbox.stub(moderationCommand.moderationService, 'getModerationAction').returns({
                type: 'kick',
                message: 'kicked from server',
                gif: 'https://example.com/kick.gif'
            });

            const mockMember = createMockMember({ id: '999' });
            sandbox.stub(moderationCommand.moderationService, 'applyModerationAction').resolves(true);

            const message = createMockMessage({
                content: 'badword1',
                author: { id: '999', tag: 'BadUser#1234', bot: false },
                member: mockMember
            });

            await moderationCommand.moderateMessage(message);

            expect(clearStub.called).to.be.true;
        });
    });

    describe('Warning system integration', () => {
        it('should track warnings across multiple violations', async () => {
            sandbox.stub(moderationCommand.configRepo, 'getBadWords').resolves(mockBadWords);
            await moderationCommand.configRepo.getBadWords().then(config => {
                moderationCommand.moderationService.setBadWordsConfig(config);
            });

            const warnings = { 'user999': 0 };
            sandbox.stub(moderationCommand.warningRepo, 'load').resolves();
            sandbox.stub(moderationCommand.warningRepo, 'incrementWarning').callsFake((userId) => {
                warnings[userId] = (warnings[userId] || 0) + 1;
                return Promise.resolve(warnings[userId]);
            });

            sandbox.stub(moderationCommand.discordService, 'deleteMessage').resolves();
            sandbox.stub(moderationCommand.discordService, 'sendMessage').resolves();

            sandbox.stub(moderationCommand.moderationService, 'containsBadWords').returns(true);
            sandbox.stub(moderationCommand.moderationService, 'getDetectedBadWords').returns(['badword']);
            const getActionStub = sandbox.stub(moderationCommand.moderationService, 'getModerationAction');
            getActionStub.onCall(0).returns({ type: 'warning', message: 'warning 1', gif: 'url' });
            getActionStub.onCall(1).returns({ type: 'warning', message: 'warning 2', gif: 'url' });
            getActionStub.onCall(2).returns({ type: 'timeout', duration: 300000, message: 'timeout', gif: 'url' });

            sandbox.stub(moderationCommand.moderationService, 'applyModerationAction').resolves(true);

            const mockMember = createMockMember({ id: '999' });

            // First violation
            await moderationCommand.moderateMessage(createMockMessage({
                content: 'badword',
                author: { id: '999', tag: 'User#1234', bot: false },
                member: mockMember
            }));

            expect(warnings['user999']).to.equal(1);

            // Second violation
            await moderationCommand.moderateMessage(createMockMessage({
                content: 'badword',
                author: { id: '999', tag: 'User#1234', bot: false },
                member: mockMember
            }));

            expect(warnings['user999']).to.equal(2);

            // Third violation
            await moderationCommand.moderateMessage(createMockMessage({
                content: 'badword',
                author: { id: '999', tag: 'User#1234', bot: false },
                member: mockMember
            }));

            expect(warnings['user999']).to.equal(3);
        });
    });
});
