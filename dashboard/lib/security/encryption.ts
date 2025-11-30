import * as crypto from 'node:crypto';
import { KeyManager } from './key-management';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt: string;
  algorithm: 'AES-256-GCM';
  version: number;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16;
  private static readonly VERSION = 1;

  /**
   * Encrypt a plaintext string using AES-256-GCM
   */
  static async encrypt(plaintext: string): Promise<EncryptedData> {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Plaintext must be a non-empty string');
    }

    try {
      // Get the master key
      const masterKey = await KeyManager.getEncryptionKey();
      
      // Generate random IV and salt
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      
      // Derive key using PBKDF2
      const derivedKey = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
      
      // Encrypt the data
      let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
      ciphertext += cipher.final('base64');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      return {
        ciphertext,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        salt: salt.toString('base64'),
        algorithm: 'AES-256-GCM',
        version: this.VERSION
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt encrypted data
   */
  static async decrypt(encryptedData: EncryptedData): Promise<string> {
    if (!encryptedData || typeof encryptedData !== 'object') {
      throw new Error('Invalid encrypted data');
    }

    const { ciphertext, iv, tag, salt, algorithm, version } = encryptedData;

    if (algorithm !== 'AES-256-GCM') {
      throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }

    if (version !== this.VERSION) {
      throw new Error(`Unsupported encryption version: ${version}`);
    }

    try {
      // Get the master key
      const masterKey = await KeyManager.getEncryptionKey();
      
      // Parse components
      const ivBuffer = Buffer.from(iv, 'base64');
      const tagBuffer = Buffer.from(tag, 'base64');
      const saltBuffer = Buffer.from(salt, 'base64');
      
      // Derive the same key using the stored salt
      const derivedKey = crypto.pbkdf2Sync(masterKey, saltBuffer, 100000, 32, 'sha256');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, ivBuffer);
      decipher.setAuthTag(tagBuffer);
      
      // Decrypt the data
      let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
      plaintext += decipher.final('utf8');
      
      return plaintext;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Re-encrypt data with a new key (for key rotation)
   */
  static async reencrypt(
    encryptedData: EncryptedData, 
    oldKey: Buffer, 
    newKey: Buffer
  ): Promise<EncryptedData> {
    // Temporarily override the key manager's cached key to decrypt with old key
    const originalKey = KeyManager['encryptionKey'];
    KeyManager['encryptionKey'] = oldKey;
    
    try {
      // Decrypt with old key
      const plaintext = await this.decrypt(encryptedData);
      
      // Set new key and encrypt
      KeyManager['encryptionKey'] = newKey;
      const reencrypted = await this.encrypt(plaintext);
      
      return reencrypted;
    } finally {
      // Restore original key
      KeyManager['encryptionKey'] = originalKey;
    }
  }

  /**
   * Bulk re-encryption for key rotation
   */
  static async bulkReencrypt(
    encryptedDataArray: EncryptedData[],
    oldKey: Buffer,
    newKey: Buffer
  ): Promise<EncryptedData[]> {
    const results: EncryptedData[] = [];
    
    for (const data of encryptedDataArray) {
      try {
        const reencrypted = await this.reencrypt(data, oldKey, newKey);
        results.push(reencrypted);
      } catch (error) {
        console.error('Failed to re-encrypt data item:', error);
        throw new Error('Bulk re-encryption failed');
      }
    }
    
    return results;
  }

  /**
   * Validate that encrypted data can be decrypted
   */
  static async validate(encryptedData: EncryptedData): Promise<boolean> {
    try {
      await this.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get encryption metadata without decrypting
   */
  static getMetadata(encryptedData: EncryptedData): {
    algorithm: string;
    version: number;
    ivLength: number;
    saltLength: number;
    tagLength: number;
  } {
    return {
      algorithm: encryptedData.algorithm,
      version: encryptedData.version,
      ivLength: Buffer.from(encryptedData.iv, 'base64').length,
      saltLength: Buffer.from(encryptedData.salt, 'base64').length,
      tagLength: Buffer.from(encryptedData.tag, 'base64').length,
    };
  }
}