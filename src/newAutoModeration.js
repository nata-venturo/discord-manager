/**
 * @license Discord Manager
 * newAutoModeration.js - Content Moderation Entry Point
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import { ModerationCommand } from './commands/ModerationCommand.js';
import { logger } from './utils/logger.js';

/**
 * Main entry point for content moderation
 */
async function main() {
    const moderationCommand = new ModerationCommand();

    // Graceful shutdown handler
    const shutdown = async (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        moderationCommand.stop();
        process.exit(0);
    };

    // Register shutdown handlers
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (error) => {
        logger.error('Unhandled rejection', { error: error.message });
        moderationCommand.stop();
        process.exit(1);
    });

    // Execute command
    await moderationCommand.execute();
}

// Start application
main().catch((error) => {
    logger.error('Fatal error', { error: error.message });
    process.exit(1);
});
