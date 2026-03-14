/**
 * @license Discord Manager
 * newAutoSchedule.js - Scheduled Messages Entry Point
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import { ScheduleCommand } from './commands/ScheduleCommand.js';
import { logger } from './utils/logger.js';

/**
 * Main entry point for scheduled GM/GN messages
 */
async function main() {
    const scheduleCommand = new ScheduleCommand();

    // Graceful shutdown handler
    const shutdown = async (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        scheduleCommand.stop();
        process.exit(0);
    };

    // Register shutdown handlers
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (error) => {
        logger.error('Unhandled rejection', { error: error.message });
        scheduleCommand.stop();
        process.exit(1);
    });

    // Execute command
    await scheduleCommand.execute();
}

// Start application
main().catch((error) => {
    logger.error('Fatal error', { error: error.message });
    process.exit(1);
});
