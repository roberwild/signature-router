import crypto from 'crypto';
import { KeyManager } from '~/lib/security/key-management';

// Interface for error handling
interface EmailError extends Error {
  name: string;
  message: string;
  errors?: unknown;
}

const algorithm = 'aes-256-gcm';
const ivLength = 12; // 96 bits for GCM, matching EncryptionService
const saltLength = 32;

interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt: string;
  algorithm: string;
  version: number;
}

export async function encryptProviderConfig(config: unknown): Promise<EncryptedData> {
  try {
    // Use the same key manager as EncryptionService for consistency
    const masterKey = await KeyManager.getEncryptionKey();
    
    // Generate random IV and salt
    const iv = crypto.randomBytes(ivLength);
    const salt = crypto.randomBytes(saltLength);
    
    // Derive key using PBKDF2 with same parameters as EncryptionService
    const derivedKey = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
    
    // Create cipher
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    
    // Encrypt the data
    const configString = JSON.stringify(config);
    let ciphertext = cipher.update(configString, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return in the same format as EncryptionService
    return {
      ciphertext,
      iv: iv.toString('base64'),
      tag: authTag.toString('base64'),
      salt: salt.toString('base64'),
      algorithm: 'AES-256-GCM',
      version: 1
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt provider configuration');
  }
}

export async function decryptProviderConfig(encryptedData: unknown): Promise<unknown> {
  try {
    // Handle unencrypted data (for development/migration)
    if (!encryptedData || typeof encryptedData !== 'object') {
      return encryptedData;
    }
    
    // Type cast to check for encrypted fields
    const dataCheck = encryptedData as Partial<EncryptedData> & { encrypted?: string };

    // Check if it's already decrypted (plain object without encryption fields)
    if (!dataCheck.ciphertext && !dataCheck.encrypted && !dataCheck.algorithm) {
      return encryptedData;
    }

    // Handle the standard format with separate fields (from EncryptionService)
    if (dataCheck.ciphertext && dataCheck.iv && dataCheck.tag && dataCheck.salt) {
      // Use the same key manager as EncryptionService
      const masterKey = await KeyManager.getEncryptionKey();

      // Parse components
      const iv = Buffer.from(dataCheck.iv, 'base64');
      const authTag = Buffer.from(dataCheck.tag, 'base64');
      const salt = Buffer.from(dataCheck.salt, 'base64');
      const ciphertext = dataCheck.ciphertext;
      
      // Derive key using PBKDF2 with same parameters as EncryptionService
      const derivedKey = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    }
    
    // If we have an unexpected format, log it and throw error
    const unexpectedData = encryptedData as Partial<EncryptedData> & { encrypted?: string };
    console.error('Unexpected encrypted data format:', {
      hasEncrypted: !!unexpectedData.encrypted,
      hasCiphertext: !!unexpectedData.ciphertext,
      hasIv: !!unexpectedData.iv,
      hasTag: !!unexpectedData.tag,
      hasSalt: !!unexpectedData.salt,
      algorithm: unexpectedData.algorithm,
      version: unexpectedData.version
    });
    
    throw new Error('Invalid encrypted data format. Please re-save your email settings.');
  } catch (error) {
    console.error('Decryption error:', error);
    const typedError = error as EmailError;
    throw new Error(`Failed to decrypt provider configuration: ${typedError.message}`);
  }
}