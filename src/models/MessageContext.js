/**
 * @license Discord Manager
 * MessageContext.js - Message context model
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Message Context Model - Represents a message context for processing
 */
export class MessageContext {
    constructor(message, config = {}) {
        this.message = message;
        this.author = message.author;
        this.channel = message.channel;
        this.content = message.content;
        this.config = config;
        this.timestamp = new Date();
    }

    /**
     * Gets cleaned message content (removes mentions)
     *
     * @returns {string} Cleaned content
     */
    getCleanedContent() {
        return this.content.replace(/<@\d+>/g, '').trim();
    }

    /**
     * Checks if message contains links
     *
     * @returns {boolean} True if contains links
     */
    containsLinks() {
        return /(https?:\/\/[^\s]+)/g.test(this.content);
    }

    /**
     * Checks if message has attachments
     *
     * @returns {boolean} True if has attachments
     */
    hasAttachments() {
        return this.message.attachments.size > 0;
    }

    /**
     * Checks if message is empty
     *
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.content.trim() === '';
    }

    /**
     * Checks if message mentions user
     *
     * @param {User} user - User to check
     * @returns {boolean} True if mentions user
     */
    mentionsUser(user) {
        return this.message.mentions.has(user);
    }

    /**
     * Counts words in message
     *
     * @returns {number} Word count
     */
    getWordCount() {
        return this.content.trim().split(/\s+/).filter(Boolean).length;
    }

    /**
     * Converts to plain object
     *
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            authorId: this.author.id,
            authorTag: this.author.tag,
            channelId: this.channel.id,
            content: this.content,
            timestamp: this.timestamp,
            config: this.config,
        };
    }
}

export default MessageContext;
