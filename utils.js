const fs = require('fs-extra');
const path = require('path');

/**
 * Converts a string to a proper snake case filename
 * @param {string} str - The string to convert
 * @returns {string} - The snake case filename
 */
function toSnakeCase(str) {
    return str
        // Replace special characters and spaces with underscores
        .replace(/[^a-zA-Z0-9]/g, '_')
        // Convert camelCase to snake_case
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        // Convert multiple underscores to single underscore
        .replace(/_+/g, '_')
        // Remove leading/trailing underscores
        .replace(/^_+|_+$/g, '')
        // Convert to lowercase
        .toLowerCase();
}

/**
 * Creates necessary directories if they don't exist
 */
async function ensureDirectories() {
    await fs.ensureDir('output');
    await fs.ensureDir('cache');
}

/**
 * Saves data to a JSON file with pretty formatting
 * @param {string} filename - The name of the file to save
 * @param {Object} data - The data to save
 */
async function saveJsonFile(filename, data) {
    const sanitizedFilename = toSnakeCase(filename);
    const filePath = path.join('output', `${sanitizedFilename}.json`);
    await fs.writeJson(filePath, data, { spaces: 2 });
}

/**
 * Checks if the cached blob needs to be refreshed based on nextUpdate value
 * @param {Object} metadata - The metadata object containing nextUpdate
 * @returns {boolean} - True if the cache needs to be refreshed
 */
function needsRefresh(metadata) {
    if (!metadata.nextUpdate) return true;

    const nextUpdate = new Date(metadata.nextUpdate);
    const now = new Date();
    return now >= nextUpdate;
}

/**
 * Saves the MDS blob to cache
 * @param {Object} blob - The MDS blob to cache
 */
async function cacheBlob(blob) {
    await fs.writeJson('cache/mds-blob.json', blob, { spaces: 2 });
}

/**
 * Reads the cached MDS blob
 * @returns {Object|null} - The cached blob or null if not found
 */
async function readCachedBlob() {
    try {
        return await fs.readJson('cache/mds-blob.json');
    } catch (error) {
        return null;
    }
}

module.exports = {
    ensureDirectories,
    saveJsonFile,
    needsRefresh,
    cacheBlob,
    readCachedBlob,
    toSnakeCase
};