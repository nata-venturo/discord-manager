/**
 * @license Discord Manager
 * test/setup.js - Test setup and configuration
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { config } from 'chai';

// Configure Chai
config.includeStack = true;
config.truncateThreshold = 0;

// Suppress console logs during tests (optional)
if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE) {
    global.console = {
        ...console,
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
    };
}

// Set test timeout globally
process.env.MOCHA_TIMEOUT = '10000';
