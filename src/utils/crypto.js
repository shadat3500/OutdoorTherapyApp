const crypto = require('crypto');
const config = require('../config/config');

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(config.jwt.secret, 'salt', 32); // Using JWT secret as encryption base
const iv = crypto.randomBytes(16);

/**
 * Encrypt a text
 * @param {string} text
 * @returns {string}
 */
const encrypt = (text) => {
  if (!text) return null;
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a text
 * @param {string} text
 * @returns {string}
 */
const decrypt = (text) => {
  if (!text) return null;
  const [ivHex, encryptedText] = text.split(':');
  const ivBuffer = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};
