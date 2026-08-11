import CryptoJS from 'crypto-js';

// In a production environment, this key would be derived per-conversation 
// and never stored in plain text. For the simulation, we use a tenant-level secret.
const SYSTEM_SECRET = 'hrms-secure-v1-2025-hub-alpha';

export const cryptoUtils = {
  encrypt: (text: string) => {
    try {
      if (!text) return text;
      return CryptoJS.AES.encrypt(text, SYSTEM_SECRET).toString();
    } catch (e) {
      console.warn('Encryption failed - using plain text as fallback', e);
      return text;
    }
  },
  decrypt: (cipherText: string) => {
    try {
      if (!cipherText || cipherText.length < 10) return cipherText; // Probably not a cipher
      const bytes = CryptoJS.AES.decrypt(cipherText, SYSTEM_SECRET);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || cipherText; 
    } catch (e) {
      return cipherText;
    }
  }
};
