const crypto = require('crypto');
require('dotenv').config();

// The cipher algorithm
const algorithm = 'aes-256-cbc';

// Use an environment variable for the key, or fallback to a hardcoded key for local dev (32 bytes)
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY 
    ? Buffer.from(process.env.CHAT_ENCRYPTION_KEY, 'hex') 
    : crypto.scryptSync('default_hrms_chat_secret_key_2025', 'salt', 32);

// Initialization vector length for AES
const IV_LENGTH = 16;

/**
 * Encrypt a plain text string
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text in format: iv:encryptedData
 */
const encrypt = (text) => {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        return text; // Fallback to plain text on error to avoid losing message
    }
};

/**
 * Decrypt an encrypted text string
 * @param {string} text - The encrypted text in format: iv:encryptedData
 * @returns {string} - The decrypted plain text
 */
const decrypt = (text) => {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        // If it doesn't have our delimiter, it might be an old plain text message
        if (textParts.length !== 2) return text;

        const iv = Buffer.from(textParts.shift(), 'hex');
        // Validate IV length to ensure it's not a randomly formatted text string
        if (iv.length !== IV_LENGTH) return text;

        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return text; // Fallback to returning the raw string if decryption fails (e.g. key change or old text)
    }
};

module.exports = {
    encrypt,
    decrypt
};
