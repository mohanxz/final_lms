import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_CHAT_ENCRYPTION_KEY || 'default-secret-key-123';

/**
 * Encrypts a string using AES.
 * @param {string} text - The plain text to encrypt.
 * @returns {string} - The encrypted ciphertext as a string.
 */
export const encryptMessage = (text) => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

/**
 * Decrypts an AES encrypted ciphertext.
 * @param {string} ciphertext - The encrypted string.
 * @returns {string} - The decrypted plain text.
 */
export const decryptMessage = (ciphertext) => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) {
      // If decryption fails or returns empty, might be old unencrypted message
      return ciphertext;
    }
    return originalText;
  } catch (err) {
    // If an error occurs, it's likely an unencrypted message
    return ciphertext;
  }
};
