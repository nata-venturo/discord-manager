/**
 * @license Discord Manager
 * assertions.js - Custom assertions for testing
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { expect } from 'chai';

/**
 * Asserts that a function throws a specific error type
 */
export async function assertThrows(fn, errorType, messageIncludes) {
    let error;

    try {
        await fn();
    } catch (err) {
        error = err;
    }

    expect(error, 'Expected function to throw an error').to.exist;
    expect(error).to.be.instanceOf(errorType);

    if (messageIncludes) {
        expect(error.message).to.include(messageIncludes);
    }

    return error;
}

/**
 * Asserts that a value is a valid Discord snowflake ID
 */
export function assertIsSnowflake(value) {
    expect(value).to.be.a('string');
    expect(value).to.match(/^\d{17,19}$/);
}

/**
 * Asserts that a value is a valid Discord token format
 */
export function assertIsDiscordToken(token) {
    expect(token).to.be.a('string');
    expect(token.length).to.be.greaterThan(50);
    expect(token.length).to.be.lessThan(200);
}

/**
 * Asserts that an object has specific properties
 */
export function assertHasProperties(obj, properties) {
    properties.forEach((prop) => {
        expect(obj).to.have.property(prop);
    });
}

/**
 * Asserts that a message was sent with specific content
 */
export function assertMessageSent(stub, content) {
    expect(stub.called).to.be.true;

    const calls = stub.getCalls();
    const sentMessages = calls.map((call) => call.args[0]);

    const found = sentMessages.some((msg) => {
        if (typeof msg === 'string') {
            return msg.includes(content);
        }
        return false;
    });

    expect(found, `Expected message containing "${content}" to be sent`).to.be.true;
}

/**
 * Asserts that a value is within a range
 */
export function assertInRange(value, min, max) {
    expect(value).to.be.a('number');
    expect(value).to.be.at.least(min);
    expect(value).to.be.at.most(max);
}

/**
 * Asserts that a function is called with specific arguments
 */
export function assertCalledWith(stub, ...expectedArgs) {
    expect(stub.called).to.be.true;

    const calls = stub.getCalls();
    const found = calls.some((call) => {
        return expectedArgs.every((arg, index) => {
            if (typeof arg === 'object' && arg !== null) {
                return JSON.stringify(call.args[index]) === JSON.stringify(arg);
            }
            return call.args[index] === arg;
        });
    });

    expect(found, `Expected function to be called with ${JSON.stringify(expectedArgs)}`).to.be.true;
}

/**
 * Asserts that an array contains specific items
 */
export function assertContains(array, items) {
    expect(array).to.be.an('array');

    items.forEach((item) => {
        const found = array.some((arrayItem) => {
            if (typeof item === 'object' && item !== null) {
                return JSON.stringify(arrayItem) === JSON.stringify(item);
            }
            return arrayItem === item;
        });

        expect(found, `Expected array to contain ${JSON.stringify(item)}`).to.be.true;
    });
}

/**
 * Asserts that a promise resolves within a specific time
 */
export async function assertResolvesWithin(promise, milliseconds) {
    const start = Date.now();
    await promise;
    const elapsed = Date.now() - start;

    expect(elapsed).to.be.at.most(milliseconds);
}

/**
 * Asserts that a value is a valid URL
 */
export function assertIsURL(value) {
    expect(value).to.be.a('string');

    try {
        new URL(value);
    } catch {
        expect.fail(`Expected "${value}" to be a valid URL`);
    }
}

/**
 * Asserts that a value is a valid timestamp
 */
export function assertIsTimestamp(value) {
    expect(value).to.be.a('number');
    expect(value).to.be.greaterThan(0);

    // Check if it's a reasonable timestamp (between 2020 and 2030)
    const date = new Date(value);
    expect(date.getFullYear()).to.be.at.least(2020);
    expect(date.getFullYear()).to.be.at.most(2030);
}
