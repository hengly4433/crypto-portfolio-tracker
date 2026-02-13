import crypto from 'crypto';

/**
 * Encryption utility for securely storing API keys and secrets
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  private ivLength = 16;
  private authTagLength = 16;

  constructor() {
    // In production, use a proper key management system (KMS, HashiCorp Vault, etc.)
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    // Ensure key is exactly 32 bytes for AES-256
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and encrypted data
    return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64');
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext: string): string {
    const data = Buffer.from(ciphertext, 'base64');
    
    // Extract components
    const iv = data.subarray(0, this.ivLength);
    const authTag = data.subarray(this.ivLength, this.ivLength + this.authTagLength);
    const encrypted = data.subarray(this.ivLength + this.authTagLength);
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Hash data (one-way, for verification)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a secure random string
   */
  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();