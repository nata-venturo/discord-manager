/**
 * @license Discord Manager
 * newAutoChat.js - AI Chat Automation Entry Point
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import { ChatCommand } from './commands/ChatCommand.js';
import { logger } from './utils/logger.js';

/**
 * Main entry point for AI chat automation
 */
async function main() {
    const chatCommand = new ChatCommand();

    // Graceful shutdown handler
    const shutdown = async (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        chatCommand.stop();
        process.exit(0);
    };

    // Register shutdown handlers
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (error) => {
        logger.error('Unhandled rejection', { error: error.message });
        chatCommand.stop();
        process.exit(1);
    });

    // Execute command
    await chatCommand.execute();
}

// Start application
main().catch((error) => {
    logger.error('Fatal error', { error: error.message });
    process.exit(1);
});
