// Web Crypto API based AES-256-CBC implementation for the browser
// This mirrors the backend's crypto.js utility for E2EE context.

const ENCRYPTION_KEY = import.meta.env.VITE_CHAT_ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars

const getCrypto = () => {
    return window.crypto.subtle;
};

const getKey = async () => {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ENCRYPTION_KEY);
    return await getCrypto().importKey(
        'raw',
        keyData,
        { name: 'AES-CBC' },
        false,
        ['encrypt', 'decrypt']
    );
};

// Returns format: ivHex:encryptedHex
export const encrypt = async (text) => {
    if (!text) return text;
    try {
        const iv = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await getKey();
        const encoder = new TextEncoder();
        
        const encrypted = await getCrypto().encrypt(
            { name: 'AES-CBC', iv: iv },
            key,
            encoder.encode(text)
        );
        
        const encryptedBuffer = new Uint8Array(encrypted);
        
        // Convert to hex
        const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
        const encryptedHex = Array.from(encryptedBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
        
        return `${ivHex}:${encryptedHex}`;
    } catch (e) {
        console.error('Encryption failing fallback to plaintext:', e);
        return text;
    }
};

export const decrypt = async (hash) => {
    if (!hash || typeof hash !== 'string' || !hash.includes(':')) return hash;
    
    try {
        const textParts = hash.split(':');
        const ivHex = textParts.shift();
        const encryptedHex = textParts.join(':');
        
        const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const encryptedData = new Uint8Array(encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        
        const key = await getKey();
        
        const decrypted = await getCrypto().decrypt(
            { name: 'AES-CBC', iv: iv },
            key,
            encryptedData
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        // If decryption fails, it might be an older plaintext message
        return hash;
    }
};
