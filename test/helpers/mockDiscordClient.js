/**
 * @license Discord Manager
 * mockDiscordClient.js - Mock Discord client for testing
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

import { EventEmitter } from 'events';

/**
 * Creates a mock Discord client for testing
 */
export function createMockDiscordClient() {
    const mockClient = new EventEmitter();

    // Mock user
    mockClient.user = {
        id: '123456789',
        tag: 'TestBot#1234',
        username: 'TestBot',
        discriminator: '1234',
        bot: false,
    };

    // Mock channels
    const mockChannels = new Map();

    mockClient.channels = {
        cache: mockChannels,
        fetch: async (channelId) => {
            if (mockChannels.has(channelId)) {
                return mockChannels.get(channelId);
            }
            throw new Error('Unknown Channel');
        },
    };

    // Mock login
    mockClient.login = async (token) => {
        if (!token || token.length < 50) {
            throw new Error('Incorrect login credentials');
        }
        mockClient.emit('ready');
        return token;
    };

    // Mock destroy
    mockClient.destroy = () => {
        mockClient.emit('disconnect');
        mockClient.removeAllListeners();
    };

    // Helper methods for testing
    mockClient._addMockChannel = (channel) => {
        mockChannels.set(channel.id, channel);
    };

    mockClient._clearChannels = () => {
        mockChannels.clear();
    };

    mockClient._triggerMessage = (message) => {
        mockClient.emit('messageCreate', message);
    };

    return mockClient;
}

/**
 * Creates a mock Discord channel
 */
export function createMockChannel(options = {}) {
    return {
        id: options.id || '987654321',
        name: options.name || 'test-channel',
        type: options.type || 0,
        guildId: options.guildId || '111222333',
        send: async (content) => {
            return createMockMessage({
                content,
                channelId: options.id || '987654321',
                author: { id: '123456789', tag: 'TestBot#1234', bot: false },
            });
        },
        sendTyping: async () => {
            return Promise.resolve();
        },
        ...options,
    };
}

/**
 * Creates a mock Discord message
 */
export function createMockMessage(options = {}) {
    const message = {
        id: options.id || Math.random().toString(36).substring(7),
        content: options.content || '',
        author: options.author || {
            id: '999888777',
            tag: 'TestUser#5678',
            username: 'TestUser',
            discriminator: '5678',
            bot: false,
        },
        channel: options.channel || createMockChannel(),
        channelId: options.channelId || '987654321',
        guildId: options.guildId || '111222333',
        createdTimestamp: options.createdTimestamp || Date.now(),
        attachments: options.attachments || new Map(),
        mentions: options.mentions || {
            users: new Map(),
            has: (user) => {
                return Array.from(message.mentions.users.values()).some((u) => u.id === user.id);
            },
        },
        reply: async (content) => {
            return createMockMessage({
                content,
                author: { id: '123456789', tag: 'TestBot#1234', bot: false },
            });
        },
        delete: async () => {
            return Promise.resolve();
        },
        react: async () => {
            return Promise.resolve();
        },
        ...options,
    };

    return message;
}

/**
 * Creates a mock Discord guild
 */
export function createMockGuild(options = {}) {
    const emojis = new Map();

    // Add some default emojis
    if (options.withEmojis) {
        emojis.set('emoji1', {
            id: 'emoji1',
            name: 'custom_emoji',
            requiresColons: true,
            animated: false,
            toString: () => '<:custom_emoji:emoji1>',
        });
    }

    return {
        id: options.id || '111222333',
        name: options.name || 'Test Guild',
        emojis: {
            cache: emojis,
        },
        members: {
            fetch: async (userId) => {
                return createMockMember({ id: userId });
            },
        },
        ...options,
    };
}

/**
 * Creates a mock Discord member
 */
export function createMockMember(options = {}) {
    return {
        id: options.id || '999888777',
        user: options.user || {
            id: '999888777',
            tag: 'TestUser#5678',
            username: 'TestUser',
            discriminator: '5678',
            bot: false,
        },
        timeout: async () => {
            return Promise.resolve();
        },
        kick: async () => {
            return Promise.resolve();
        },
        ...options,
    };
}
