"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionService = exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Encryption utility for securely storing API keys and secrets
 * Uses AES-256-GCM for authenticated encryption
 */
class EncryptionService {
    algorithm = 'aes-256-gcm';
    key;
    ivLength = 16;
    authTagLength = 16;
    constructor() {
        // In production, use a proper key management system (KMS, HashiCorp Vault, etc.)
        const encryptionKey = process.env.ENCRYPTION_KEY;
        if (!encryptionKey) {
            throw new Error('ENCRYPTION_KEY environment variable is required');
        }
        // Ensure key is exactly 32 bytes for AES-256
        this.key = crypto_1.default.scryptSync(encryptionKey, 'salt', 32);
    }
    /**
     * Encrypt sensitive data
     */
    encrypt(plaintext) {
        const iv = crypto_1.default.randomBytes(this.ivLength);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        // Combine IV, auth tag, and encrypted data
        return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64');
    }
    /**
     * Decrypt sensitive data
     */
    decrypt(ciphertext) {
        const data = Buffer.from(ciphertext, 'base64');
        // Extract components
        const iv = data.subarray(0, this.ivLength);
        const authTag = data.subarray(this.ivLength, this.ivLength + this.authTagLength);
        const encrypted = data.subarray(this.ivLength + this.authTagLength);
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Hash data (one-way, for verification)
     */
    hash(data) {
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    /**
     * Generate a secure random string
     */
    generateRandomString(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
}
exports.EncryptionService = EncryptionService;
// Singleton instance
exports.encryptionService = new EncryptionService();
