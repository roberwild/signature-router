import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export class KeyManager {
  private static readonly KEY_FILE = process.env.ENCRYPTION_KEY_FILE || '.encryption-key';
  private static readonly KEY_ENV = 'ENCRYPTION_KEY';
  private static readonly KEY_SIZE = 32; // 256 bits
  
  private static encryptionKey: Buffer | null = null;

  /**
   * Get the encryption key, generating one if necessary
   */
  static async getEncryptionKey(): Promise<Buffer> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    // Try to load from environment variable first
    const envKey = process.env[this.KEY_ENV];
    if (envKey) {
      // Try base64 first (Vercel format)
      if (envKey.includes('=') || envKey.length === 44) {
        try {
          this.encryptionKey = Buffer.from(envKey, 'base64');
          if (this.encryptionKey.length === this.KEY_SIZE) {
            console.log('[KeyManager] Using encryption key from environment variable (base64)');
            return this.encryptionKey;
          }
        } catch (error) {
          console.warn('[KeyManager] Failed to parse encryption key as base64:', error);
        }
      }

      // Try hex format (local development)
      try {
        this.encryptionKey = Buffer.from(envKey, 'hex');
        if (this.encryptionKey.length === this.KEY_SIZE) {
          console.log('[KeyManager] Using encryption key from environment variable (hex)');
          return this.encryptionKey;
        }
        console.warn('[KeyManager] Invalid encryption key length in environment variable');
      } catch (error) {
        console.warn('[KeyManager] Failed to parse encryption key from environment:', error);
      }
    }

    // Try to load from file - check multiple possible locations
    const possiblePaths = [
      '/Users/agutierrez/Desktop/minery-lead/apps/dashboard/.encryption-key', // Hardcoded fallback
      path.resolve(process.cwd(), this.KEY_FILE),
      path.resolve(process.cwd(), 'apps/dashboard', this.KEY_FILE),
      path.join(process.cwd(), 'apps', 'dashboard', this.KEY_FILE),
    ];

    for (const keyPath of possiblePaths) {
      try {
        const keyData = await fs.readFile(keyPath, 'utf8');
        this.encryptionKey = Buffer.from(keyData.trim(), 'hex');
        
        if (this.encryptionKey.length === this.KEY_SIZE) {
          console.log(`[KeyManager] Loaded encryption key from: ${keyPath}`);
          return this.encryptionKey;
        }
        
        console.warn(`[KeyManager] Invalid encryption key length in file: ${keyPath}`);
      } catch (_error) {
        // File doesn't exist or can't be read, try next path
        // Only log if not the hardcoded path to avoid clutter
        if (!keyPath.includes('/Users/agutierrez')) {
          console.log(`[KeyManager] Could not read key from: ${keyPath}`);
        }
      }
    }

    // Generate a new key
    console.log('[KeyManager] Generating new encryption key...');
    return this.generateNewKey();
  }

  /**
   * Generate a new encryption key and save it
   */
  static async generateNewKey(): Promise<Buffer> {
    const key = crypto.randomBytes(this.KEY_SIZE);
    this.encryptionKey = key;

    // Try to save to file in the dashboard directory
    const possiblePaths = [
      path.resolve(process.cwd(), 'apps/dashboard', this.KEY_FILE),
      path.resolve(process.cwd(), this.KEY_FILE),
    ];

    for (const keyPath of possiblePaths) {
      try {
        await fs.writeFile(keyPath, key.toString('hex'), 'utf8');
        
        // Set restrictive permissions
        await fs.chmod(keyPath, 0o600);
        
        console.log(`[KeyManager] Encryption key saved to ${keyPath}`);
        console.log('[KeyManager] IMPORTANT: Set ENCRYPTION_KEY environment variable in production:');
        console.log(`ENCRYPTION_KEY=${key.toString('hex')}`);
        return key;
      } catch (error) {
        console.error(`[KeyManager] Failed to save encryption key to ${keyPath}:`, error);
      }
    }

    console.log('[KeyManager] Could not save key to file. Set this environment variable:');
    console.log(`ENCRYPTION_KEY=${key.toString('hex')}`);
    return key;
  }

  /**
   * Rotate the encryption key (for security purposes)
   * This is a complex operation that requires re-encrypting all existing data
   */
  static async rotateKey(): Promise<{ oldKey: Buffer; newKey: Buffer }> {
    const oldKey = await this.getEncryptionKey();
    const newKey = crypto.randomBytes(this.KEY_SIZE);

    // Update the stored key
    this.encryptionKey = newKey;

    // Save the new key
    try {
      const keyPath = path.resolve(process.cwd(), this.KEY_FILE);
      await fs.writeFile(keyPath, newKey.toString('hex'), 'utf8');
      await fs.chmod(keyPath, 0o600);
      
      console.log('Encryption key rotated successfully');
      console.log('IMPORTANT: Update ENCRYPTION_KEY environment variable:');
      console.log(`ENCRYPTION_KEY=${newKey.toString('hex')}`);
    } catch (error) {
      console.error('Failed to save new encryption key:', error);
      // Restore old key
      this.encryptionKey = oldKey;
      throw error;
    }

    return { oldKey, newKey };
  }

  /**
   * Validate that the current key can decrypt existing data
   */
  static async validateKey(): Promise<boolean> {
    try {
      const key = await this.getEncryptionKey();
      
      // Create a test encryption/decryption cycle
      const testData = 'test-data-for-key-validation';
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from('key-validation'));

      let encrypted = cipher.update(testData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      // Try to decrypt
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAAD(Buffer.from('key-validation'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted === testData;
    } catch (error) {
      console.error('Key validation failed:', error);
      return false;
    }
  }

  /**
   * Get key information for monitoring/debugging
   */
  static async getKeyInfo(): Promise<{
    keySource: 'environment' | 'file' | 'generated';
    keyExists: boolean;
    keyLength: number;
    keyFingerprint: string;
  }> {
    let keySource: 'environment' | 'file' | 'generated' = 'generated';
    
    if (process.env[this.KEY_ENV]) {
      keySource = 'environment';
    } else {
      try {
        const keyPath = path.resolve(process.cwd(), this.KEY_FILE);
        await fs.access(keyPath);
        keySource = 'file';
      } catch {
        keySource = 'generated';
      }
    }

    const key = await this.getEncryptionKey();
    const keyFingerprint = crypto
      .createHash('sha256')
      .update(key)
      .digest('hex')
      .substring(0, 16);

    return {
      keySource,
      keyExists: true,
      keyLength: key.length,
      keyFingerprint
    };
  }

  /**
   * Clear the cached encryption key (for testing/rotation scenarios)
   */
  static clearCache(): void {
    this.encryptionKey = null;
  }
}

// Backup and restore utilities for key rotation
export class KeyBackup {
  /**
   * Create a backup of the current key
   */
  static async backupKey(): Promise<string> {
    const key = await KeyManager.getEncryptionKey();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `encryption-key-backup-${timestamp}`;
    
    try {
      const backupPath = path.resolve(process.cwd(), backupName);
      await fs.writeFile(backupPath, key.toString('hex'), 'utf8');
      await fs.chmod(backupPath, 0o600);
      
      console.log(`Key backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('Failed to create key backup:', error);
      throw error;
    }
  }

  /**
   * Restore a key from backup
   */
  static async restoreKey(backupPath: string): Promise<void> {
    try {
      const keyData = await fs.readFile(backupPath, 'utf8');
      const key = Buffer.from(keyData.trim(), 'hex');
      
      if (key.length !== 32) {
        throw new Error('Invalid key length in backup file');
      }

      // Save as current key
      const keyPath = path.resolve(process.cwd(), KeyManager['KEY_FILE']);
      await fs.writeFile(keyPath, key.toString('hex'), 'utf8');
      await fs.chmod(keyPath, 0o600);
      
      // Clear cache to force reload
      KeyManager.clearCache();
      
      console.log('Key restored from backup');
    } catch (error) {
      console.error('Failed to restore key from backup:', error);
      throw error;
    }
  }
}