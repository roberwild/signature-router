import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EncryptionService } from '../encryption';
import { CredentialMasker } from '../credential-masking';
import { KeyManager } from '../key-management';
import { SecurityAuditLogger, SecurityEventType } from '../audit-logger';

describe('Security Implementation Tests', () => {
  beforeEach(() => {
    // Clear any cached keys
    KeyManager.clearCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('EncryptionService', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const testData = 'sensitive-api-key-12345';
      
      const encrypted = await EncryptionService.encrypt(testData);
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted).toHaveProperty('algorithm', 'AES-256-GCM');
      
      const decrypted = await EncryptionService.decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });

    it('should fail decryption with tampered data', async () => {
      const testData = 'sensitive-api-key-12345';
      const encrypted = await EncryptionService.encrypt(testData);
      
      // Tamper with the ciphertext
      const tamperedEncrypted = {
        ...encrypted,
        ciphertext: 'tampered' + encrypted.ciphertext.slice(8)
      };
      
      await expect(EncryptionService.decrypt(tamperedEncrypted))
        .rejects.toThrow('Decryption failed');
    });

    it('should handle different data types', async () => {
      const testCases = [
        'simple string',
        JSON.stringify({ apiKey: 'test', host: 'smtp.example.com' }),
        '{"complex":"object","with":{"nested":"values"}}',
        'special-chars-!@#$%^&*()'
      ];

      for (const testData of testCases) {
        const encrypted = await EncryptionService.encrypt(testData);
        const decrypted = await EncryptionService.decrypt(encrypted);
        expect(decrypted).toBe(testData);
      }
    });
  });

  describe('CredentialMasker', () => {
    it('should mask API keys correctly', () => {
      const apiKey = 're_abcdefghijklmnopqrstuvwxyz123456';
      const masked = CredentialMasker.mask(apiKey, 4);
      
      expect(masked).toBe('re_a****3456');
      expect(masked.length).toBeLessThan(apiKey.length);
    });

    it('should mask short values completely', () => {
      const shortValue = 'abc';
      const masked = CredentialMasker.mask(shortValue, 4);
      
      expect(masked).toBe('***');
    });

    it('should mask email addresses', () => {
      const email = 'user@example.com';
      const masked = CredentialMasker.maskEmail(email);
      
      expect(masked).toBe('u***@example.com');
      expect(masked).toContain('@example.com');
    });

    it('should mask provider configurations', () => {
      const configs = {
        resend: { apiKey: 're_12345678901234567890', fromDomain: 'test.com' },
        sendgrid: { apiKey: 'SG.12345678901234567890', ipPoolName: 'pool1' },
        postmark: { serverApiToken: 'abcdef-12345-67890-ghijk', messageStream: 'outbound' },
        nodemailer: { 
          host: 'smtp.gmail.com', 
          port: 587, 
          auth: { user: 'user@gmail.com', pass: 'secretpassword123' } 
        }
      };

      for (const [provider, config] of Object.entries(configs)) {
        const masked = CredentialMasker.maskProviderConfig(provider as string, config as Record<string, unknown>) as Record<string, unknown>;

        if ('apiKey' in config) {
          expect(masked.apiKey).not.toBe(config.apiKey);
          expect(masked.apiKey).toContain('*');
        }

        if ('serverApiToken' in config) {
          expect(masked.serverApiToken).not.toBe(config.serverApiToken);
          expect(masked.serverApiToken).toContain('*');
        }

        if ('auth' in config && config.auth) {
          expect((masked.auth as { user: string; pass: string })?.pass).toBe('********');
        }
      }
    });
  });

  describe('KeyManager', () => {
    it('should generate a valid encryption key', async () => {
      const key = await KeyManager.getEncryptionKey();
      
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256 bits
    });

    it('should return the same key on subsequent calls', async () => {
      const key1 = await KeyManager.getEncryptionKey();
      const key2 = await KeyManager.getEncryptionKey();
      
      expect(key1.equals(key2)).toBe(true);
    });

    it('should validate keys correctly', async () => {
      const isValid = await KeyManager.validateKey();
      expect(isValid).toBe(true);
    });

    it('should provide key information', async () => {
      const keyInfo = await KeyManager.getKeyInfo();
      
      expect(keyInfo).toHaveProperty('keySource');
      expect(keyInfo).toHaveProperty('keyExists', true);
      expect(keyInfo).toHaveProperty('keyLength', 32);
      expect(keyInfo).toHaveProperty('keyFingerprint');
      expect(keyInfo.keyFingerprint).toHaveLength(16);
    });
  });

  describe('SecurityAuditLogger', () => {
    let auditLogger: SecurityAuditLogger;
    let consoleSpy: jest.SpiedFunction<typeof console.info>;

    beforeEach(() => {
      auditLogger = SecurityAuditLogger.getInstance();
      consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(async () => {
      await auditLogger.stop();
      consoleSpy.mockRestore();
    });

    it('should log authentication events', async () => {
      const context = {
        userId: 'user-123',
        userEmail: 'test@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Test-Agent/1.0'
      };

      await auditLogger.logAuthenticationEvent(
        SecurityEventType.LOGIN_SUCCESS,
        context,
        true
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Security Event:',
        expect.objectContaining({
          type: SecurityEventType.LOGIN_SUCCESS,
          user: 'test@example.com',
          ip: '192.168.1.1',
          success: true,
          risk: 'low'
        })
      );
    });

    it('should log encryption events', async () => {
      const context = {
        userId: 'user-123',
        userEmail: 'test@example.com'
      };

      await auditLogger.logEncryptionEvent(
        SecurityEventType.ENCRYPTION_KEY_GENERATED,
        context,
        'key-generation',
        true
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Security Event:',
        expect.objectContaining({
          type: SecurityEventType.ENCRYPTION_KEY_GENERATED,
          success: true,
          risk: 'medium'
        })
      );
    });

    it('should handle high-risk events appropriately', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const context = {
        userId: 'user-123',
        userEmail: 'test@example.com'
      };

      await auditLogger.logEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        context,
        {
          success: false,
          riskLevel: 'critical',
          errorMessage: 'Multiple failed login attempts detected'
        }
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'CRITICAL SECURITY EVENT:',
        expect.objectContaining({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          user: 'test@example.com'
        })
      );

      errorSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete email settings encryption workflow', async () => {
      // Simulate saving email settings with encryption
      const emailConfig = {
        provider: 'resend',
        emailFrom: 'test@example.com',
        providerConfig: {
          apiKey: 're_1234567890abcdefghijklmnopqrstuv',
          fromDomain: 'example.com'
        }
      };

      // Encrypt the provider config
      const encryptedConfig = await EncryptionService.encrypt(
        JSON.stringify(emailConfig.providerConfig)
      );

      // Verify it's encrypted
      expect(encryptedConfig).toHaveProperty('ciphertext');
      expect(encryptedConfig.ciphertext).not.toContain(emailConfig.providerConfig.apiKey);

      // Decrypt and verify
      const decryptedConfigStr = await EncryptionService.decrypt(encryptedConfig);
      const decryptedConfig = JSON.parse(decryptedConfigStr);
      
      expect(decryptedConfig).toEqual(emailConfig.providerConfig);

      // Test masking for UI display
      const maskedConfig = CredentialMasker.maskProviderConfig('resend', decryptedConfig) as Record<string, unknown>;
      expect(maskedConfig.apiKey).not.toBe(emailConfig.providerConfig.apiKey);
      expect(maskedConfig.apiKey).toContain('*');
      expect(maskedConfig.fromDomain).toBe(emailConfig.providerConfig.fromDomain);
    });

    it('should maintain data integrity through multiple encrypt/decrypt cycles', async () => {
      const originalData = {
        apiKey: 'very-secret-key-12345',
        host: 'smtp.example.com',
        port: 587,
        auth: {
          user: 'test@example.com',
          pass: 'secretpassword'
        }
      };

      let currentData = JSON.stringify(originalData);

      // Perform multiple encrypt/decrypt cycles
      for (let i = 0; i < 5; i++) {
        const encrypted = await EncryptionService.encrypt(currentData);
        currentData = await EncryptionService.decrypt(encrypted);
      }

      const finalData = JSON.parse(currentData);
      expect(finalData).toEqual(originalData);
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption failures gracefully', async () => {
      // Test with invalid input
      await expect(EncryptionService.encrypt(null as unknown as string))
        .rejects.toThrow();
    });

    it('should handle decryption of invalid data', async () => {
      const invalidEncrypted = {
        ciphertext: 'invalid',
        iv: 'invalid',
        tag: 'invalid',
        algorithm: 'AES-256-GCM' as const,
        version: 1,
        salt: 'invalid'
      };

      await expect(EncryptionService.decrypt(invalidEncrypted))
        .rejects.toThrow('Decryption failed');
    });

    it('should handle malformed encrypted data', async () => {
      const malformedData = {
        ciphertext: '',
        iv: '',
        tag: '',
        algorithm: 'AES-256-GCM' as const,
        version: 1,
        salt: ''
      };

      await expect(EncryptionService.decrypt(malformedData))
        .rejects.toThrow();
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  it('should encrypt/decrypt within acceptable time limits', async () => {
    const testData = 'a'.repeat(10000); // 10KB of data
    
    const startTime = Date.now();
    const encrypted = await EncryptionService.encrypt(testData);
    const encryptTime = Date.now() - startTime;
    
    const decryptStartTime = Date.now();
    const decrypted = await EncryptionService.decrypt(encrypted);
    const decryptTime = Date.now() - decryptStartTime;
    
    expect(encryptTime).toBeLessThan(100); // Should take less than 100ms
    expect(decryptTime).toBeLessThan(100); // Should take less than 100ms
    expect(decrypted).toBe(testData);
  });

  it('should handle concurrent encryption operations', async () => {
    const testData = ['data1', 'data2', 'data3', 'data4', 'data5'];
    
    const startTime = Date.now();
    
    const encryptionPromises = testData.map(data => 
      EncryptionService.encrypt(data)
    );
    
    const encrypted = await Promise.all(encryptionPromises);
    
    const decryptionPromises = encrypted.map(enc => 
      EncryptionService.decrypt(enc)
    );
    
    const decrypted = await Promise.all(decryptionPromises);
    
    const totalTime = Date.now() - startTime;
    
    expect(totalTime).toBeLessThan(500); // Should handle 10 operations in under 500ms
    expect(decrypted).toEqual(testData);
  });
});