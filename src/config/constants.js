/**
 * @license Discord Manager
 * constants.js - Application constants
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * AI Configuration Constants
 */
export const AI_CONFIG = {
    MODEL: 'gemini-1.5-flash',
    TEMPERATURE: 0.7,
    TOP_P: 0.95,
    TOP_K: 64,
    MAX_TOKENS: 50,
};

/**
 * Moderation Configuration
 */
export const MODERATION = {
    TIMEOUT_DURATIONS: {
        FIRST: 5 * 60 * 1000, // 5 minutes
        SECOND: 15 * 60 * 1000, // 15 minutes
        THIRD: 30 * 60 * 1000, // 30 minutes
    },
    WARNING_THRESHOLDS: {
        TIMEOUT_1: 3,
        TIMEOUT_2: 7,
        TIMEOUT_3: 10,
        KICK: 15,
    },
};

/**
 * Schedule Configuration
 */
export const SCHEDULE = {
    GOOD_MORNING: '0 8 * * *', // 08:00 UTC
    GOOD_NIGHT: '0 22 * * *', // 22:00 UTC
    CLEANUP: '0 22 * * *', // 22:00 UTC
};

/**
 * Timing Configuration
 */
export const TIMING = {
    TYPING_INTERVAL: 9000, // 9 seconds
    MESSAGE_DELAY: 2000, // 2 seconds
    QUEUE_CHECK_INTERVAL: 5000, // 5 seconds
    DEFAULT_DELAY: 1000, // 1 second
};

/**
 * Reaction Configuration
 */
export const REACTION = {
    RANDOM_PROBABILITY: 0.4, // 40% chance for random mode
    DEFAULT_EMOJIS: ['✅', '😅', '🔥', '❤️', '💯', '💛', '👍', '🤝', '😊', '🤩', '❤️‍🔥'],
    AUTO_DELAY_MIN: 1000, // 1 second
    AUTO_DELAY_MAX: 7000, // 7 seconds
};

/**
 * File Paths
 */
export const PATHS = {
    ASSETS: './assets',
    LOGS: './logs',
    CONFIG: './config',
    MODEL_AI: './assets/listModelAI.json',
    LANGUAGES: './assets/listLanguage.json',
    BAD_WORDS: './assets/listBadWord.json',
    QUOTES_EN: './assets/listQuotesEn.json',
    USER_WARNINGS: './assets/listUserWarning.json',
};

/**
 * Discord Configuration
 */
export const DISCORD = {
    MAX_MESSAGE_LENGTH: 2000,
    SNOWFLAKE_MIN_LENGTH: 17,
    SNOWFLAKE_MAX_LENGTH: 19,
};

/**
 * Rate Limiting
 */
export const RATE_LIMIT = {
    MAX_REQUESTS_PER_MINUTE: 50,
    COOLDOWN_DURATION: 60000, // 1 minute
    BACKOFF_MULTIPLIER: 2,
    MAX_RETRIES: 3,
};

/**
 * Default Messages
 */
export const DEFAULT_MESSAGES = {
    GM: 'gm',
    GN: 'gn',
    NO_RESPONSE_EN: 'Not sure what to say back',
    NO_RESPONSE_ID: 'Tidak yakin apa yang harus dikatakan kembali',
};

/**
 * GIF URLs for Moderation
 */
export const MODERATION_GIFS = {
    WARNING: [
        'https://tenor.com/view/travis-fran-healy-you-said-a-bad-word-bad-word-swearing-gif-27378431',
        'https://tenor.com/view/andy-dunlop-travis-do-not-use-that-word-bad-words-bad-word-gif-18253273661304946283',
        'https://tenor.com/view/mlp-mlp-g5-mlp-a-new-generation-my-little-pony-bad-word-gif-26042557',
        'https://tenor.com/view/ok-no-more-forbidden-words-forbidden-words-slurs-ifunny-caption-scam1992-gif-21242345',
    ],
    TIMEOUT: [
        'https://tenor.com/view/timeout-gif-24036567',
        'https://tenor.com/view/sm-mrs-fitzpatrick-time-out-that-is-it-timeout-mister-youre-going-in-a-timeout-gif-6130045413312493042',
        'https://tenor.com/view/stranger-things-hellfire-club-the-hellfire-club-grant-goodman-stranger-things-season4-gif-25917902',
    ],
    BANNED: [
        'https://tenor.com/view/bane-no-banned-and-you-are-explode-gif-16047504',
        'https://tenor.com/view/spongebob-ban-pubg-lite-banned-rainbow-gif-16212382',
    ],
};

/**
 * Feature Modes
 */
export const MODES = {
    CHAT: {
        TALK_WITH_AI: 'Talk With AI',
        QUOTE: 'Quote',
    },
    MESSAGE_TYPE: {
        SEND_CHANNEL: 'Send Channel',
        REPLY: 'Reply',
    },
    REACTION: {
        ALL_WITHOUT_DELAY: 'All Without Delay',
        ALL_WITH_DELAY: 'All With Delay',
        RANDOM: 'Random',
    },
    DELAY_TYPE: {
        MANUAL: 'Manual',
        AUTOMATIC: 'Automatic',
    },
    CUSTOM: {
        DEFAULT: 'Default',
        CUSTOM: 'Custom',
    },
};

/**
 * Error Codes
 */
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DISCORD_API_ERROR: 'DISCORD_API_ERROR',
    AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
    FILE_IO_ERROR: 'FILE_IO_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
};

/**
 * Log Levels
 */
export const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
};
