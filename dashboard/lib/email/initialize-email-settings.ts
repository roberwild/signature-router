import { db, platformEmailSettingsTable } from '@workspace/database';
import { EncryptionService } from '../security/encryption';

/**
 * Initialize email settings from environment variables
 * This runs on first deployment to populate settings from Vercel env vars
 */
export async function initializeEmailSettingsFromEnv() {
  try {
    // Check if settings already exist
    const existingSettings = await db
      .select()
      .from(platformEmailSettingsTable)
      .limit(1);

    // If settings already exist, don't override them
    if (existingSettings && existingSettings.length > 0) {
      console.log('Email settings already configured, skipping initialization');
      return { initialized: false, reason: 'Settings already exist' };
    }

    // Check for Postmark environment variables
    const postmarkToken = process.env.POSTMARK_SERVER_TOKEN || process.env.POSTMARK_API_TOKEN;
    const messageStream = process.env.POSTMARK_MESSAGE_STREAM || 'outbound';
    const emailFrom = process.env.EMAIL_FROM || process.env.POSTMARK_FROM_EMAIL;
    const emailFromName = process.env.EMAIL_FROM_NAME || process.env.POSTMARK_FROM_NAME;

    // Check for other provider environment variables as fallback
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME;
    const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

    let provider: 'postmark' | 'resend' | 'sendgrid' | 'nodemailer' | null = null;
    let providerConfig: Record<string, unknown> | null = null;

    // Determine which provider to use based on available env vars
    if (postmarkToken) {
      provider = 'postmark';
      providerConfig = {
        serverApiToken: postmarkToken,
        messageStream: messageStream
      };
      console.log('Initializing Postmark email provider from environment variables');
    } else if (resendApiKey) {
      provider = 'resend';
      providerConfig = {
        apiKey: resendApiKey
      };
      console.log('Initializing Resend email provider from environment variables');
    } else if (sendgridApiKey) {
      provider = 'sendgrid';
      providerConfig = {
        apiKey: sendgridApiKey
      };
      console.log('Initializing SendGrid email provider from environment variables');
    } else if (smtpHost && smtpPort) {
      provider = 'nodemailer';
      providerConfig = {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: smtpUser && smtpPass ? {
          user: smtpUser,
          pass: smtpPass
        } : undefined
      };
      console.log('Initializing SMTP email provider from environment variables');
    }

    // If no provider configuration found, skip initialization
    if (!provider || !providerConfig) {
      console.log('No email provider environment variables found, skipping initialization');
      return { initialized: false, reason: 'No provider configuration in environment' };
    }

    // Validate required email from address
    if (!emailFrom) {
      console.error('EMAIL_FROM or POSTMARK_FROM_EMAIL environment variable is required');
      return { initialized: false, reason: 'Missing FROM email address' };
    }

    // Encrypt the provider configuration
    const encryptedConfig = await EncryptionService.encrypt(JSON.stringify(providerConfig));

    // Create initial email settings
    const created = await db
      .insert(platformEmailSettingsTable)
      .values({
        provider,
        providerConfig: encryptedConfig,
        emailFrom,
        emailFromName: emailFromName || null,
        isActive: true,
        features: {
          welcomeEmails: true,
          passwordResetEmails: true,
          invitationEmails: true,
          feedbackEmails: true,
          leadQualificationEmails: true,
          contactFormEmails: true,
          serviceRequestEmails: true,
        },
        notificationSettings: {
          newUserRegistration: true,
          newLeadQualification: true,
          newFeedback: true,
          newContactMessage: true,
          newServiceRequest: true,
          systemErrors: true,
        }
      })
      .returning();

    console.log('✅ Email settings initialized successfully from environment variables');
    console.log(`   Provider: ${provider}`);
    console.log(`   From: ${emailFrom}`);
    console.log(`   ID: ${created[0]?.id}`);

    return {
      initialized: true,
      provider,
      id: created[0]?.id
    };

  } catch (error) {
    console.error('Failed to initialize email settings from environment:', error);
    return {
      initialized: false,
      reason: 'Error during initialization',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if email settings need initialization
 * Returns true if no settings exist in database
 */
export async function needsEmailSettingsInitialization(): Promise<boolean> {
  try {
    const settings = await db
      .select({ id: platformEmailSettingsTable.id })
      .from(platformEmailSettingsTable)
      .limit(1);

    return !settings || settings.length === 0;
  } catch (error) {
    console.error('Error checking email settings:', error);
    return false;
  }
}