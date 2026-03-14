/**
 * @license Discord Manager
 * common.test.js - Tests for common utilities
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect } from 'chai';
import { formatTime, capitalizeWords, getRandomItem, randomInRange, sleep } from '../../../src/utils/common.js';

describe('Utils: common', () => {
    describe('formatTime()', () => {
        it('should format milliseconds to minutes and seconds', () => {
            expect(formatTime(90000)).to.equal('1 minutes 30 seconds');
        });

        it('should handle zero seconds', () => {
            expect(formatTime(120000)).to.equal('2 minutes 0 seconds');
        });

        it('should handle values under 1 minute', () => {
            expect(formatTime(45000)).to.equal('0 minutes 45 seconds');
        });

        it('should round down partial seconds', () => {
            expect(formatTime(1500)).to.equal('0 minutes 1 seconds');
        });

        it('should handle zero time', () => {
            expect(formatTime(0)).to.equal('0 minutes 0 seconds');
        });

        it('should handle large values', () => {
            expect(formatTime(3665000)).to.equal('61 minutes 5 seconds');
        });
    });

    describe('capitalizeWords()', () => {
        it('should capitalize first letter of each word', () => {
            expect(capitalizeWords('hello world')).to.equal('Hello World');
        });

        it('should handle single word', () => {
            expect(capitalizeWords('hello')).to.equal('Hello');
        });

        it('should handle empty string', () => {
            expect(capitalizeWords('')).to.equal('');
        });

        it('should handle already capitalized words', () => {
            expect(capitalizeWords('Hello World')).to.equal('Hello World');
        });

        it('should handle mixed case', () => {
            expect(capitalizeWords('hELLo WoRLD')).to.equal('HELLO WORLD');
        });
    });

    describe('getRandomItem()', () => {
        it('should return an item from the array', () => {
            const arr = [1, 2, 3, 4, 5];
            const item = getRandomItem(arr);
            expect(arr).to.include(item);
        });

        it('should return the only item in single-item array', () => {
            const arr = [42];
            expect(getRandomItem(arr)).to.equal(42);
        });

        it('should handle array of strings', () => {
            const arr = ['a', 'b', 'c'];
            const item = getRandomItem(arr);
            expect(arr).to.include(item);
        });
    });

    describe('randomInRange()', () => {
        it('should return number within range', () => {
            const num = randomInRange(1, 10);
            expect(num).to.be.at.least(1);
            expect(num).to.be.at.most(10);
        });

        it('should handle same min and max', () => {
            const num = randomInRange(5, 5);
            expect(num).to.equal(5);
        });

        it('should handle negative numbers', () => {
            const num = randomInRange(-10, -1);
            expect(num).to.be.at.least(-10);
            expect(num).to.be.at.most(-1);
        });

        it('should return integer', () => {
            const num = randomInRange(1, 10);
            expect(Number.isInteger(num)).to.be.true;
        });
    });

    describe('sleep()', () => {
        it('should delay for specified milliseconds', async () => {
            const start = Date.now();
            await sleep(100);
            const end = Date.now();
            const elapsed = end - start;

            expect(elapsed).to.be.at.least(90); // Allow 10ms margin
            expect(elapsed).to.be.at.most(150);
        });

        it('should resolve promise', async () => {
            const result = await sleep(10);
            expect(result).to.be.undefined;
        });
    });
});
