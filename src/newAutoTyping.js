#!/usr/bin/env node
/**
 * @license Discord Manager
 * newAutoTyping.js - New refactored typing automation entry point
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import { TypingCommand } from './commands/TypingCommand.js';
import { logger } from './utils/logger.js';

/**
 * Main entry point
 */
async function main() {
    console.log('');
    console.log('=======================================================');
    console.log('');
    console.log('Welcome to Discord Manager - Typing Simulation');
    console.log('Copyright (c) 2025 - Present Natarizkie');
    console.log('Web: https://natarizkie.com/ - E-mail: natarizkie@gmail.com');
    console.log('');
    console.log('⚠️  WARNING: This uses Discord self-bots which violate');
    console.log('Discord Terms of Service. Use at your own risk!');
    console.log('');
    console.log('=======================================================');
    console.log('');

    const command = new TypingCommand();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        logger.info('Received SIGINT signal');
        command.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        logger.info('Received SIGTERM signal');
        command.stop();
        process.exit(0);
    });

    // Execute command
    await command.execute();
}

main().catch((error) => {
    logger.error('Fatal error in main', { error: error.message });
    process.exit(1);
});
