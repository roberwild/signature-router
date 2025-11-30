import { db, platformEmailSettingsTable } from '@workspace/database';
import { eq } from 'drizzle-orm';
import { EmailProviderFactory } from '@workspace/email/services/email-provider-factory';
import type { DatabaseEmailConfig, EmailFeatures } from '@workspace/email/provider/enhanced-types';
import type { PlatformEmailSettings } from '@workspace/database';
import { EncryptionService, type EncryptedData } from '../security/encryption';

export interface EmailPayload {
  recipient: string;
  subject: string;
  html: string;
  text: string;
}

export class DatabaseEmailService {
  private static instance: DatabaseEmailService | null = null;
  private cachedSettings: PlatformEmailSettings | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  private constructor() {}

  static getInstance(): DatabaseEmailService {
    if (!DatabaseEmailService.instance) {
      DatabaseEmailService.instance = new DatabaseEmailService();
    }
    return DatabaseEmailService.instance;
  }

  private async getSettings(): Promise<PlatformEmailSettings> {
    const now = Date.now();

    // Return cached settings if still valid
    if (this.cachedSettings && now < this.cacheExpiry) {
      return this.cachedSettings;
    }

    // Fetch fresh settings from database
    const settings = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);

    if (!settings || settings.length === 0) {
      throw new Error('No active email settings configured');
    }

    this.cachedSettings = settings[0];
    this.cacheExpiry = now + this.CACHE_TTL;

    return this.cachedSettings;
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    console.log('[DatabaseEmailService] Starting sendEmail with payload:', {
      recipient: payload.recipient,
      subject: payload.subject,
      hasHtml: !!payload.html,
      hasText: !!payload.text
    });

    try {
      const settings = await this.getSettings();

      if (!settings.provider || !settings.providerConfig) {
        throw new Error('Email provider not configured');
      }

      // Decrypt the provider configuration using EncryptionService for consistency
      let decryptedConfig;
      try {
        // Check if providerConfig is a valid EncryptedData object
        if (!settings.providerConfig ||
            typeof settings.providerConfig !== 'object' ||
            !('ciphertext' in settings.providerConfig) ||
            !('iv' in settings.providerConfig) ||
            !('tag' in settings.providerConfig)) {
          throw new Error('Invalid encrypted configuration format');
        }

        // Decrypt using the same service as test emails
        const decryptedString = await EncryptionService.decrypt(settings.providerConfig as EncryptedData);
        decryptedConfig = JSON.parse(decryptedString);
        
        // Validate that we have the required fields for each provider
        if (!decryptedConfig) {
          throw new Error('Decrypted configuration is empty');
        }
        
        // Check for required fields based on provider type
        switch (settings.provider) {
          case 'postmark':
            if (!decryptedConfig.serverApiToken) {
              throw new Error('Postmark configuration missing serverApiToken');
            }
            break;
          case 'resend':
            if (!decryptedConfig.apiKey) {
              throw new Error('Resend configuration missing apiKey');
            }
            break;
          case 'sendgrid':
            if (!decryptedConfig.apiKey) {
              throw new Error('SendGrid configuration missing apiKey');
            }
            break;
          case 'nodemailer':
            if (!decryptedConfig.host || !decryptedConfig.port) {
              throw new Error('Nodemailer configuration missing host or port');
            }
            break;
        }
      } catch (error) {
        console.error('Configuration decryption/validation error:', error);
        console.error('Provider:', settings.provider);
        console.error('Raw providerConfig:', settings.providerConfig);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to decrypt or validate email configuration: ${errorMessage}`);
      }

      // Create a configuration object for the EmailProviderFactory
      const emailConfig: DatabaseEmailConfig = {
        id: settings.id,
        emailFrom: settings.emailFrom,
        emailFromName: settings.emailFromName || undefined,
        provider: settings.provider,
        providerConfig: decryptedConfig,
        features: (settings.features as EmailFeatures) || {
          welcomeEmails: true,
          passwordResetEmails: true,
          invitationEmails: true,
          feedbackEmails: true,
          leadQualificationEmails: true
        },
        isActive: settings.isActive
      };

      // Create provider instance using factory
      const provider = EmailProviderFactory.create(emailConfig);

      // Send the email using the sendEmailEnhanced method
      const _result = await provider.sendEmailEnhanced({
        to: payload.recipient,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        from: settings.emailFrom,
        fromName: settings.emailFromName || undefined,
        recipient: payload.recipient // This is for backward compatibility
      });

      console.log(`[DatabaseEmailService] Email sent successfully to ${payload.recipient}`);
    } catch (error) {
      console.error('[DatabaseEmailService] Failed to send email:', error);
      console.error('[DatabaseEmailService] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payload: {
          recipient: payload.recipient,
          subject: payload.subject
        }
      });
      throw error;
    }
  }

  // Clear cache when settings are updated
  clearCache() {
    this.cachedSettings = null;
    this.cacheExpiry = 0;
  }
}

// Export singleton instance
export const databaseEmailService = DatabaseEmailService.getInstance();