/**
 * @license Discord Manager
 * fixtures.js - Test data fixtures
 *
 * Copyright (c) 2025 - Present Natarizkie
 */

/**
 * Mock AI models
 */
export const mockAIModels = [
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'You are a helpful AI assistant'
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'You are an advanced AI assistant'
    }
];

/**
 * Mock languages
 */
export const mockLanguages = [
    { id: 'auto', name: 'Auto', codes: ['auto'] },
    { id: 'en', name: 'English', codes: ['en'] },
    { id: 'id', name: 'Indonesian', codes: ['id', 'ind'] },
    { id: 'es', name: 'Spanish', codes: ['es'] }
];

/**
 * Mock bad words configuration
 */
export const mockBadWords = {
    languages: ['en', 'id'],
    words: ['badword1', 'badword2', 'offensive', 'inappropriate']
};

/**
 * Mock quotes
 */
export const mockQuotes = [
    { text: 'To be or not to be, that is the question', author: 'William Shakespeare' },
    { text: 'I think, therefore I am', author: 'René Descartes' },
    { text: 'Knowledge is power', author: 'Francis Bacon' },
    { text: 'The only way to do great work is to love what you do', author: 'Steve Jobs' }
];

/**
 * Mock Discord tokens (for testing only)
 */
export const mockDiscordTokens = {
    valid: 'MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GaBcDe.FgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRs',
    invalid: 'short',
    malformed: '!!!invalid!!!token!!!'
};

/**
 * Mock channel IDs
 */
export const mockChannelIds = {
    valid: '987654321098765432',
    invalid: 'abc123',
    nonExistent: '999999999999999999'
};

/**
 * Mock user data
 */
export const mockUsers = {
    normal: {
        id: '111111111111111111',
        tag: 'NormalUser#1234',
        username: 'NormalUser',
        discriminator: '1234',
        bot: false
    },
    bot: {
        id: '222222222222222222',
        tag: 'BotUser#5678',
        username: 'BotUser',
        discriminator: '5678',
        bot: true
    },
    moderator: {
        id: '333333333333333333',
        tag: 'Moderator#9012',
        username: 'Moderator',
        discriminator: '9012',
        bot: false
    }
};

/**
 * Mock messages
 */
export const mockMessages = {
    simple: {
        id: 'msg001',
        content: 'Hello, world!',
        author: mockUsers.normal,
        createdTimestamp: Date.now()
    },
    withLink: {
        id: 'msg002',
        content: 'Check out this link: https://example.com',
        author: mockUsers.normal,
        createdTimestamp: Date.now()
    },
    withMention: {
        id: 'msg003',
        content: '@everyone Hello!',
        author: mockUsers.normal,
        createdTimestamp: Date.now()
    },
    withBadWords: {
        id: 'msg004',
        content: 'This contains badword1 and offensive content',
        author: mockUsers.normal,
        createdTimestamp: Date.now()
    },
    empty: {
        id: 'msg005',
        content: '',
        author: mockUsers.normal,
        createdTimestamp: Date.now()
    }
};

/**
 * Mock warnings data
 */
export const mockWarnings = {
    'user001': 2,
    'user002': 5,
    'user003': 10,
    'user004': 15
};

/**
 * Mock emojis
 */
export const mockEmojis = {
    unicode: ['👍', '❤️', '😊', '🔥', '✅'],
    custom: [
        { id: 'emoji001', name: 'custom1', requiresColons: true, animated: false },
        { id: 'emoji002', name: 'custom2', requiresColons: true, animated: false }
    ]
};

/**
 * Mock configuration data
 */
export const mockConfig = {
    discord: {
        token: mockDiscordTokens.valid,
        channelId: mockChannelIds.valid
    },
    ai: {
        modelId: 'gemini-1.5-flash',
        language: 'English'
    },
    moderation: {
        enabled: true,
        warningThresholds: {
            timeout1: 3,
            timeout2: 7,
            timeout3: 10,
            kick: 15
        }
    },
    timing: {
        messageDelay: 5000,
        defaultDelay: 60000,
        queueCheckInterval: 1000
    }
};

/**
 * Mock API responses
 */
export const mockAPIResponses = {
    geminiSuccess: {
        response: {
            text: () => 'This is a generated AI response'
        }
    },
    geminiError: new Error('API quota exceeded'),
    translationSuccess: 'Hola, mundo!',
    translationError: new Error('Translation service unavailable')
};

/**
 * Mock file paths
 */
export const mockFilePaths = {
    models: './config/models.json',
    languages: './config/languages.json',
    badWords: './config/badWords.json',
    quotes: './config/quotes.json',
    warnings: './data/warnings.json',
    logs: './logs/app.log'
};

/**
 * Helper to create test data
 */
export function createTestMessage(overrides = {}) {
    return {
        id: Math.random().toString(36).substring(7),
        content: 'Test message',
        author: mockUsers.normal,
        channel: { id: mockChannelIds.valid },
        channelId: mockChannelIds.valid,
        guildId: '111222333444555666',
        createdTimestamp: Date.now(),
        attachments: new Map(),
        mentions: { users: new Map() },
        ...overrides
    };
}

/**
 * Helper to create test context
 */
export function createTestContext(overrides = {}) {
    return {
        mode: 'chat',
        modelId: 'gemini-1.5-flash',
        modelName: 'Gemini 1.5 Flash',
        language: 'English',
        languageId: 'en',
        delay: 60000,
        ...overrides
    };
}
