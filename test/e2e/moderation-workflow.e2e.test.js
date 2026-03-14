/**
 * @license Discord Manager
 * moderation-workflow.e2e.test.js - End-to-end tests for moderation workflow
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import prompts from 'prompts';
import { ModerationCommand } from '../../src/commands/ModerationCommand.js';
import {
    createMockDiscordClient,
    createMockChannel,
    createMockMessage,
    createMockMember,
} from '../helpers/mockDiscordClient.js';
import { mockBadWords, mockDiscordTokens } from '../helpers/fixtures.js';

describe('Moderation Workflow E2E', () => {
    let sandbox;
    let moderationCommand;
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

    describe('Complete moderation workflow', () => {
        it('should handle full moderation cycle: warning → timeout → kick', async () => {
            const mockChannel = createMockChannel({ id: '123456789012345678' });
            mockClient._addMockChannel(mockChannel);

            // Mock user inputs
            sandbox
                .stub(prompts, 'prompt')
                .onFirstCall()
                .resolves({ tokenId: mockDiscordTokens.valid })
                .onSecondCall()
                .resolves({ channelId: '123456789012345678' });

            // Stub config repository
            sandbox.stub(moderationCommand.configRepo, 'getBadWords').resolves(mockBadWords);

            // Setup warning repository with tracking
            const warnings = { user999: 0 };
            sandbox.stub(moderationCommand.warningRepo, 'load').resolves();
            sandbox.stub(moderationCommand.warningRepo, 'incrementWarning').callsFake((userId) => {
                warnings[userId] = (warnings[userId] || 0) + 1;
                return Promise.resolve(warnings[userId]);
            });
            sandbox.stub(moderationCommand.warningRepo, 'clearWarnings').callsFake((userId) => {
                delete warnings[userId];
                return Promise.resolve();
            });

            // Stub Discord service
            sandbox.stub(moderationCommand.discordService, 'client').value(mockClient);
            sandbox.stub(moderationCommand.discordService, 'initialize').resolves();
            sandbox.stub(moderationCommand.discordService, 'getChannel').resolves(mockChannel);
            sandbox.stub(moderationCommand.discordService, 'deleteMessage').resolves();
            sandbox.stub(moderationCommand.discordService, 'sendMessage').resolves();

            // Load bad words config
            const badWordsConfig = await moderationCommand.configRepo.getBadWords();
            moderationCommand.moderationService.setBadWordsConfig(badWordsConfig);

            const mockMember = createMockMember({ id: '999' });
            sandbox.stub(moderationCommand.moderationService, 'applyModerationAction').resolves(true);

            // First violation - warning
            const message1 = createMockMessage({
                content: 'This has badword1',
                author: { id: '999', tag: 'BadUser#1234', bot: false },
                member: mockMember,
            });

            await moderationCommand.moderateMessage(message1);
            expect(warnings['user999']).to.equal(1);

            // Violations 2-3 - more warnings
            await moderationCommand.moderateMessage(
                createMockMessage({
                    content: 'Another badword1',
                    author: { id: '999', tag: 'BadUser#1234', bot: false },
                    member: mockMember,
                }),
            );
            expect(warnings['user999']).to.equal(2);

            await moderationCommand.moderateMessage(
                createMockMessage({
                    content: 'More badword1',
                    author: { id: '999', tag: 'BadUser#1234', bot: false },
                    member: mockMember,
                }),
            );
            expect(warnings['user999']).to.equal(3);

            // Continue to timeout threshold (7 warnings)
            for (let i = 0; i < 4; i++) {
                await moderationCommand.moderateMessage(
                    createMockMessage({
                        content: 'badword1',
                        author: { id: '999', tag: 'BadUser#1234', bot: false },
                        member: mockMember,
                    }),
                );
            }
            expect(warnings['user999']).to.equal(7);

            // Continue to kick threshold (15 warnings)
            for (let i = 0; i < 8; i++) {
                await moderationCommand.moderateMessage(
                    createMockMessage({
                        content: 'badword1',
                        author: { id: '999', tag: 'BadUser#1234', bot: false },
                        member: mockMember,
                    }),
                );
            }
            expect(warnings['user999']).to.equal(15);

            // Verify warnings were cleared after kick
            expect(moderationCommand.warningRepo.clearWarnings.called).to.be.true;
        });

        it('should ignore messages from allowed users', async () => {
            const mockChannel = createMockChannel({ id: '123' });

            sandbox.stub(moderationCommand.configRepo, 'getBadWords').resolves(mockBadWords);
            sandbox.stub(moderationCommand.warningRepo, 'load').resolves();

            sandbox.stub(moderationCommand.discordService, 'deleteMessage').resolves();

            const badWordsConfig = await moderationCommand.configRepo.getBadWords();
            moderationCommand.moderationService.setBadWordsConfig(badWordsConfig);

            // Message from allowed user
            const message = createMockMessage({
                content: 'badword1 from allowed user',
                author: { id: '123', tag: 'natarizkie', bot: false },
            });

            await moderationCommand.handleMessage(message, mockChannel.id);

            expect(moderationCommand.discordService.deleteMessage.called).to.be.false;
        });

        it('should handle multiple users independently', async () => {
            sandbox.stub(moderationCommand.configRepo, 'getBadWords').resolves(mockBadWords);

            const warnings = {};
            sandbox.stub(moderationCommand.warningRepo, 'load').resolves();
            sandbox.stub(moderationCommand.warningRepo, 'incrementWarning').callsFake((userId) => {
                warnings[userId] = (warnings[userId] || 0) + 1;
                return Promise.resolve(warnings[userId]);
            });

            sandbox.stub(moderationCommand.discordService, 'deleteMessage').resolves();
            sandbox.stub(moderationCommand.discordService, 'sendMessage').resolves();

            const badWordsConfig = await moderationCommand.configRepo.getBadWords();
            moderationCommand.moderationService.setBadWordsConfig(badWordsConfig);

            sandbox.stub(moderationCommand.moderationService, 'applyModerationAction').resolves(true);

            // User 1 violation
            await moderationCommand.moderateMessage(
                createMockMessage({
                    content: 'badword1',
                    author: { id: '111', tag: 'User1#1234', bot: false },
                    member: createMockMember({ id: '111' }),
                }),
            );

            // User 2 violations
            await moderationCommand.moderateMessage(
                createMockMessage({
                    content: 'badword1',
                    author: { id: '222', tag: 'User2#5678', bot: false },
                    member: createMockMember({ id: '222' }),
                }),
            );

            await moderationCommand.moderateMessage(
                createMockMessage({
                    content: 'badword1',
                    author: { id: '222', tag: 'User2#5678', bot: false },
                    member: createMockMember({ id: '222' }),
                }),
            );

            // Verify separate tracking
            expect(warnings['111']).to.equal(1);
            expect(warnings['222']).to.equal(2);
        });
    });

    describe('Error recovery', () => {
        it('should continue moderation even if action fails', async () => {
            sandbox.stub(moderationCommand.configRepo, 'getBadWords').resolves(mockBadWords);
            sandbox.stub(moderationCommand.warningRepo, 'load').resolves();
            sandbox.stub(moderationCommand.warningRepo, 'incrementWarning').resolves(5);

            sandbox.stub(moderationCommand.discordService, 'deleteMessage').resolves();
            sandbox.stub(moderationCommand.discordService, 'sendMessage').resolves();

            const badWordsConfig = await moderationCommand.configRepo.getBadWords();
            moderationCommand.moderationService.setBadWordsConfig(badWordsConfig);

            // Stub apply action to fail
            sandbox.stub(moderationCommand.moderationService, 'applyModerationAction').resolves(false);

            const message = createMockMessage({
                content: 'badword1',
                author: { id: '999', tag: 'User#1234', bot: false },
                member: createMockMember({ id: '999' }),
            });

            // Should not throw
            await moderationCommand.moderateMessage(message);

            expect(moderationCommand.discordService.deleteMessage.called).to.be.true;
        });
    });
});
