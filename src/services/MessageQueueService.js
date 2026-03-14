/**
 * @license Discord Manager
 * MessageQueueService.js - Message queue processing service
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { logger } from '../utils/logger.js';

/**
 * Message Queue Service - Handles message queue processing
 */
export class MessageQueueService {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.processor = null;
    }

    /**
     * Sets the message processor function
     *
     * @param {Function} processor - Function to process messages
     */
    setProcessor(processor) {
        this.processor = processor;
    }

    /**
     * Adds message to queue
     *
     * @param {any} message - Message to enqueue
     */
    enqueue(message) {
        this.queue.push(message);
        logger.debug('Message enqueued', { queueLength: this.queue.length });
    }

    /**
     * Gets queue length
     *
     * @returns {number} Queue length
     */
    getQueueLength() {
        return this.queue.length;
    }

    /**
     * Checks if currently processing
     *
     * @returns {boolean} True if processing
     */
    isCurrentlyProcessing() {
        return this.isProcessing;
    }

    /**
     * Processes next message in queue
     *
     * @returns {Promise<void>}
     */
    async processNext() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        if (!this.processor) {
            logger.error('No processor set for message queue');
            return;
        }

        this.isProcessing = true;
        const message = this.queue.shift();

        try {
            await this.processor(message);
        } catch (error) {
            logger.error('Error processing message from queue', {
                error: error.message,
            });
        }

        // Continue processing if more messages
        if (this.queue.length > 0) {
            await this.processNext();
        } else {
            this.isProcessing = false;
        }
    }

    /**
     * Starts processing queue automatically
     *
     * @param {number} interval - Check interval in ms
     */
    startAutoProcessing(interval = 5000) {
        setInterval(async () => {
            if (!this.isProcessing && this.queue.length > 0) {
                await this.processNext();
            }
        }, interval);
    }

    /**
     * Clears the queue
     */
    clear() {
        this.queue = [];
        this.isProcessing = false;
        logger.debug('Message queue cleared');
    }
}

export default MessageQueueService;
