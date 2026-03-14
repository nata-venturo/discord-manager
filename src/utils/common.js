/**
 * @license Discord Manager
 * common.js - Shared utility functions
 *
 * Copyright (c) 2025 - Present Natarizkie
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import process from 'node:process';
import fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Handles prompt cancellation
 * Displays cancellation message and exits process
 *
 * @returns {never}
 */
export const onCancel = () => {
    console.log(' ');
    console.log('=======================================================');
    console.log(' ');
    console.log('Ongoing process has been canceled');
    console.log(' ');
    console.log('=======================================================');
    console.log(' ');
    process.exit(1);
};

/**
 * Formats milliseconds to human-readable time string
 *
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string (e.g., "1 minutes 30 seconds")
 *
 * @example
 * formatTime(90000); // "1 minutes 30 seconds"
 * formatTime(45000); // "0 minutes 45 seconds"
 */
export const formatTime = (ms) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes} minutes ${seconds} seconds`;
};

/**
 * Capitalizes first letter of each word in a string
 *
 * @param {string} words - String to capitalize
 * @returns {string} Capitalized string
 *
 * @example
 * capitalizeWords('hello world'); // "Hello World"
 */
export const capitalizeWords = (words = '') => {
    return words
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Loads and parses JSON file
 *
 * @param {string} path - Path to JSON file
 * @param {'array'|'map'} type - Return type (array or Map)
 * @returns {Promise<Array|Map>} Parsed JSON data
 * @throws {Error} If file cannot be read or parsed
 *
 * @example
 * const data = await loadFileJson('./data.json', 'array');
 * const mapData = await loadFileJson('./config.json', 'map');
 */
export const loadFileJson = async (path = '', type = 'array') => {
    try {
        if (!existsSync(path)) {
            return type === 'array' ? [] : new Map();
        }

        const rawData = await fs.readFile(path, 'utf-8');
        const jsonData = JSON.parse(rawData);

        if (type === 'map') {
            return new Map(Object.entries(jsonData));
        }

        return jsonData || [];
    } catch (error) {
        throw new Error(`Failed to load JSON file ${path}: ${error.message}`);
    }
};

/**
 * Saves data to JSON file
 *
 * @param {string} path - Path to save file
 * @param {any} data - Data to save
 * @returns {Promise<void>}
 * @throws {Error} If file cannot be written
 */
export const saveFileJson = async (path, data) => {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        await fs.writeFile(path, jsonString, 'utf-8');
    } catch (error) {
        throw new Error(`Failed to save JSON file ${path}: ${error.message}`);
    }
};

/**
 * Delays execution for specified milliseconds
 *
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 *
 * @example
 * await sleep(2000); // Wait 2 seconds
 */
export const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Gets random item from array
 *
 * @template T
 * @param {T[]} array - Source array
 * @returns {T} Random item
 *
 * @example
 * const item = getRandomItem([1, 2, 3, 4, 5]);
 */
export const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generates random number between min and max (inclusive)
 *
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 *
 * @example
 * const num = randomInRange(1, 10); // Random number between 1-10
 */
export const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
