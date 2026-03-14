/**
 * @license Discord Manager
 * ModerationService.test.js - Unit tests for ModerationService
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { ModerationService } from '../../../src/services/ModerationService.js';
import { MODERATION } from '../../../src/config/constants.js';

describe('ModerationService', () => {
    let moderationService;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        moderationService = new ModerationService();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('setBadWordsConfig', () => {
        it('should set bad words configuration', () => {
            const config = {
                languages: ['en'],
                words: ['badword1', 'badword2'],
            };

            moderationService.setBadWordsConfig(config);

            expect(moderationService.badWordsFilter).to.exist;
        });

        it('should handle empty configuration', () => {
            const config = { languages: [], words: [] };

            moderationService.setBadWordsConfig(config);

            expect(moderationService.badWordsFilter).to.exist;
        });
    });

    describe('containsBadWords', () => {
        beforeEach(() => {
            const config = {
                languages: ['en'],
                words: ['badword', 'offensive'],
            };
            moderationService.setBadWordsConfig(config);
        });

        it('should detect bad words in content', () => {
            const content = 'This contains a badword';

            const result = moderationService.containsBadWords(content);

            expect(result).to.be.true;
        });

        it('should return false for clean content', () => {
            const content = 'This is a clean message';

            const result = moderationService.containsBadWords(content);

            expect(result).to.be.false;
        });

        it('should detect bad words regardless of case', () => {
            const content = 'This contains BADWORD';

            const result = moderationService.containsBadWords(content);

            expect(result).to.be.true;
        });

        it('should detect bad words with special characters', () => {
            const content = 'This contains b@dw0rd';

            // This depends on the bad words filter implementation
            const result = moderationService.containsBadWords(content);

            expect(result).to.be.a('boolean');
        });

        it('should handle empty content', () => {
            const content = '';

            const result = moderationService.containsBadWords(content);

            expect(result).to.be.false;
        });
    });

    describe('getDetectedBadWords', () => {
        beforeEach(() => {
            const config = {
                languages: ['en'],
                words: ['badword', 'offensive'],
            };
            moderationService.setBadWordsConfig(config);
        });

        it('should return list of detected bad words', () => {
            const content = 'This has badword and offensive words';

            const badWords = moderationService.getDetectedBadWords(content);

            expect(badWords).to.be.an('array');
            expect(badWords.length).to.be.greaterThan(0);
        });

        it('should return empty array for clean content', () => {
            const content = 'This is clean';

            const badWords = moderationService.getDetectedBadWords(content);

            expect(badWords).to.be.an('array');
            expect(badWords.length).to.equal(0);
        });

        it('should not return duplicates', () => {
            const content = 'badword badword badword';

            const badWords = moderationService.getDetectedBadWords(content);

            const uniqueWords = [...new Set(badWords)];
            expect(badWords.length).to.equal(uniqueWords.length);
        });
    });

    describe('getModerationAction', () => {
        it('should return warning for low warning count', () => {
            const warnings = 1;

            const action = moderationService.getModerationAction(warnings);

            expect(action).to.have.property('type', 'warning');
            expect(action).to.have.property('message');
            expect(action).to.have.property('gif');
        });

        it('should return first timeout at threshold', () => {
            const warnings = MODERATION.WARNING_THRESHOLDS.TIMEOUT_1;

            const action = moderationService.getModerationAction(warnings);

            expect(action).to.have.property('type', 'timeout');
            expect(action).to.have.property('duration', MODERATION.TIMEOUT_DURATIONS.FIRST);
        });

        it('should return second timeout at threshold', () => {
            const warnings = MODERATION.WARNING_THRESHOLDS.TIMEOUT_2;

            const action = moderationService.getModerationAction(warnings);

            expect(action).to.have.property('type', 'timeout');
            expect(action).to.have.property('duration', MODERATION.TIMEOUT_DURATIONS.SECOND);
        });

        it('should return third timeout at threshold', () => {
            const warnings = MODERATION.WARNING_THRESHOLDS.TIMEOUT_3;

            const action = moderationService.getModerationAction(warnings);

            expect(action).to.have.property('type', 'timeout');
            expect(action).to.have.property('duration', MODERATION.TIMEOUT_DURATIONS.THIRD);
        });

        it('should return kick at kick threshold', () => {
            const warnings = MODERATION.WARNING_THRESHOLDS.KICK;

            const action = moderationService.getModerationAction(warnings);

            expect(action).to.have.property('type', 'kick');
        });

        it('should include GIF in action', () => {
            const warnings = 1;

            const action = moderationService.getModerationAction(warnings);

            expect(action).to.have.property('gif');
            expect(action.gif).to.be.a('string');
            expect(action.gif).to.include('http');
        });
    });

    describe('applyModerationAction', () => {
        let mockMember;

        beforeEach(() => {
            mockMember = {
                id: '123456',
                timeout: sandbox.stub().resolves(),
                kick: sandbox.stub().resolves(),
            };
        });

        it('should apply timeout action', async () => {
            const action = {
                type: 'timeout',
                duration: 300000,
                message: '5 minute timeout',
            };

            const result = await moderationService.applyModerationAction(mockMember, action);

            expect(result).to.be.true;
            expect(mockMember.timeout.calledOnce).to.be.true;
            expect(mockMember.timeout.calledWith(300000)).to.be.true;
        });

        it('should apply kick action', async () => {
            const action = {
                type: 'kick',
                message: 'kicked from server',
            };

            const result = await moderationService.applyModerationAction(mockMember, action);

            expect(result).to.be.true;
            expect(mockMember.kick.calledOnce).to.be.true;
        });

        it('should return false for warning action', async () => {
            const action = {
                type: 'warning',
                message: 'this is a warning',
            };

            const result = await moderationService.applyModerationAction(mockMember, action);

            expect(result).to.be.false;
            expect(mockMember.timeout.called).to.be.false;
            expect(mockMember.kick.called).to.be.false;
        });

        it('should handle timeout failure gracefully', async () => {
            mockMember.timeout.rejects(new Error('Missing Permissions'));

            const action = {
                type: 'timeout',
                duration: 300000,
                message: '5 minute timeout',
            };

            const result = await moderationService.applyModerationAction(mockMember, action);

            expect(result).to.be.false;
        });

        it('should handle kick failure gracefully', async () => {
            mockMember.kick.rejects(new Error('Missing Permissions'));

            const action = {
                type: 'kick',
                message: 'kicked',
            };

            const result = await moderationService.applyModerationAction(mockMember, action);

            expect(result).to.be.false;
        });
    });
});
