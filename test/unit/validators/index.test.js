/**
 * @license Discord Manager
 * validators.test.js - Tests for validators
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect } from 'chai';
import { validators } from '../../../src/validators/index.js';

describe('Validators', () => {
    describe('discordToken()', () => {
        it('should accept valid token format', () => {
            const token = 'a'.repeat(100); // Simulated token
            expect(validators.discordToken(token)).to.be.true;
        });

        it('should reject empty token', () => {
            expect(validators.discordToken('')).to.be.false;
        });

        it('should reject null token', () => {
            expect(validators.discordToken(null)).to.be.false;
        });

        it('should reject too short token', () => {
            expect(validators.discordToken('short')).to.be.false;
        });

        it('should reject too long token', () => {
            const token = 'a'.repeat(300);
            expect(validators.discordToken(token)).to.be.false;
        });
    });

    describe('channelId()', () => {
        it('should accept valid channel ID', () => {
            expect(validators.channelId('123456789012345678')).to.be.true;
        });

        it('should accept 19-digit ID', () => {
            expect(validators.channelId('1234567890123456789')).to.be.true;
        });

        it('should reject non-numeric ID', () => {
            expect(validators.channelId('abc123def456ghi789')).to.be.false;
        });

        it('should reject too short ID', () => {
            expect(validators.channelId('12345')).to.be.false;
        });

        it('should reject too long ID', () => {
            expect(validators.channelId('12345678901234567890')).to.be.false;
        });

        it('should reject empty ID', () => {
            expect(validators.channelId('')).to.be.false;
        });
    });

    describe('delay()', () => {
        it('should accept valid delay', () => {
            expect(validators.delay(5000)).to.be.true;
        });

        it('should accept minimum delay', () => {
            expect(validators.delay(1000)).to.be.true;
        });

        it('should accept maximum delay', () => {
            expect(validators.delay(3600000)).to.be.true;
        });

        it('should reject too small delay', () => {
            expect(validators.delay(500)).to.be.false;
        });

        it('should reject too large delay', () => {
            expect(validators.delay(4000000)).to.be.false;
        });

        it('should reject NaN', () => {
            expect(validators.delay(NaN)).to.be.false;
        });

        it('should reject non-number', () => {
            expect(validators.delay('1000')).to.be.false;
        });
    });

    describe('messageContent()', () => {
        it('should accept valid message', () => {
            expect(validators.messageContent('Hello, world!')).to.be.true;
        });

        it('should accept message at max length', () => {
            const message = 'a'.repeat(2000);
            expect(validators.messageContent(message)).to.be.true;
        });

        it('should reject too long message', () => {
            const message = 'a'.repeat(2001);
            expect(validators.messageContent(message)).to.be.false;
        });

        it('should reject empty message', () => {
            expect(validators.messageContent('')).to.be.false;
        });

        it('should reject whitespace-only message', () => {
            expect(validators.messageContent('   ')).to.be.false;
        });
    });

    describe('sanitizeMessage()', () => {
        it('should remove code blocks', () => {
            const input = '```javascript\nconsole.log("test");\n```';
            const output = validators.sanitizeMessage(input);
            expect(output).to.not.include('```');
        });

        it('should prevent @everyone mentions', () => {
            const input = 'Hey @everyone look at this!';
            const output = validators.sanitizeMessage(input);
            expect(output).to.not.include('@everyone');
            expect(output).to.include('everyone');
        });

        it('should prevent @here mentions', () => {
            const input = 'Hey @here look at this!';
            const output = validators.sanitizeMessage(input);
            expect(output).to.not.include('@here');
            expect(output).to.include('here');
        });

        it('should trim whitespace', () => {
            const input = '  hello  ';
            const output = validators.sanitizeMessage(input);
            expect(output).to.equal('hello');
        });

        it('should handle null input', () => {
            const output = validators.sanitizeMessage(null);
            expect(output).to.equal('');
        });
    });

    describe('numberInRange()', () => {
        it('should accept number in range', () => {
            expect(validators.numberInRange(5, 1, 10)).to.be.true;
        });

        it('should accept minimum value', () => {
            expect(validators.numberInRange(1, 1, 10)).to.be.true;
        });

        it('should accept maximum value', () => {
            expect(validators.numberInRange(10, 1, 10)).to.be.true;
        });

        it('should reject number below range', () => {
            expect(validators.numberInRange(0, 1, 10)).to.be.false;
        });

        it('should reject number above range', () => {
            expect(validators.numberInRange(11, 1, 10)).to.be.false;
        });

        it('should reject NaN', () => {
            expect(validators.numberInRange(NaN, 1, 10)).to.be.false;
        });
    });
});
