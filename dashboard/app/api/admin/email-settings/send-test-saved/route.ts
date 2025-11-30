import { NextRequest, NextResponse } from 'next/server';
import { db } from '@workspace/database';
import { platformEmailSettingsTable, emailSettingsAuditTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { withPlatformAdmin, AccessControlContext } from '~/lib/security/access-control';
import { EncryptionService, EncryptedData } from '~/lib/security/encryption';
import { EmailProviderFactory } from '@workspace/email/services/email-provider-factory';
import type { DatabaseEmailConfig } from '@workspace/email/provider/enhanced-types';
// Removed react-email dependencies - using inline HTML instead
import { applySecurityHeaders } from '~/lib/security/middleware';

// Interfaces for email operations
interface EmailSendResult {
  messageId: string;
  timestamp: string | Date;
}

interface EmailError extends Error {
  name: string;
  message: string;
  errors?: unknown;
}

// Schema for sending test email with saved config
const sendTestSavedSchema = z.object({
  recipient: z.string().email('Invalid recipient email address')
});

// Rate limiting for test emails
const emailTestAttempts = new Map<string, { count: number; resetAt: number }>();
const EMAIL_RATE_LIMIT = 5; // 5 test emails per minute
const EMAIL_RATE_WINDOW = 60 * 1000; // 1 minute

function checkEmailRateLimit(userId: string): boolean {
  const now = Date.now();
  const userAttempts = emailTestAttempts.get(userId);
  
  if (!userAttempts || now > userAttempts.resetAt) {
    emailTestAttempts.set(userId, { count: 1, resetAt: now + EMAIL_RATE_WINDOW });
    return true;
  }
  
  if (userAttempts.count >= EMAIL_RATE_LIMIT) {
    return false;
  }
  
  userAttempts.count++;
  return true;
}

// POST /api/admin/email-settings/send-test-saved
export const POST = withPlatformAdmin(async (request: NextRequest, context: AccessControlContext) => {
  try {
    // Check rate limit
    if (!checkEmailRateLimit(context.user.id)) {
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. You can send up to 5 test emails per minute.',
          retryAfter: 60
        },
        { status: 429 }
      );
      return applySecurityHeaders(response);
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = sendTestSavedSchema.parse(body);
    
    // Get saved email settings
    const [savedSettings] = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);

    if (!savedSettings) {
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'No active email configuration found. Please save your email settings first.'
        },
        { status: 404 }
      );
      return applySecurityHeaders(response);
    }

    // Decrypt provider config
    let decryptedConfig;
    try {
      decryptedConfig = await EncryptionService.decrypt(savedSettings.providerConfig as EncryptedData);
      decryptedConfig = JSON.parse(decryptedConfig);
    } catch (error) {
      console.error('Failed to decrypt provider config:', error);
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Failed to decrypt email configuration. Please re-save your settings.'
        },
        { status: 500 }
      );
      return applySecurityHeaders(response);
    }

    // Create configuration from saved settings
    const testConfig: DatabaseEmailConfig = {
      id: savedSettings.id,
      emailFrom: savedSettings.emailFrom,
      emailFromName: savedSettings.emailFromName ?? undefined,
      replyTo: savedSettings.replyTo ?? undefined,
      feedbackInbox: savedSettings.feedbackInbox ?? undefined,
      provider: savedSettings.provider,
      providerConfig: decryptedConfig,
      features: savedSettings.features as unknown || {},
      isActive: true
    };

    console.log('[Test Email] Using provider:', savedSettings.provider);
    console.log('[Test Email] Config keys:', Object.keys(decryptedConfig));

    // Create the test email content
    const _timestamp = new Date().toISOString();
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Test Email from Minery
      </h1>
      
      <p style="color: #71717a; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
        This is a test email to verify your email configuration is working correctly.
      </p>
      
      <div style="background-color: #f4f4f5; border-radius: 6px; padding: 16px; margin: 0 0 24px 0;">
        <h2 style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Configuration Details
        </h2>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="color: #71717a; padding: 4px 0;">Provider:</td>
            <td style="color: #18181b; font-weight: 500; padding: 4px 0;">${savedSettings.provider.charAt(0).toUpperCase() + savedSettings.provider.slice(1)}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 4px 0;">From:</td>
            <td style="color: #18181b; font-weight: 500; padding: 4px 0;">${savedSettings.emailFrom}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 4px 0;">Sent to:</td>
            <td style="color: #18181b; font-weight: 500; padding: 4px 0;">${validatedData.recipient}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 4px 0;">Timestamp:</td>
            <td style="color: #18181b; font-weight: 500; padding: 4px 0;">${new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 4px 0;">Environment:</td>
            <td style="color: #18181b; font-weight: 500; padding: 4px 0;">${process.env.NODE_ENV || 'development'}</td>
          </tr>
        </table>
      </div>
      
      <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; margin-top: 32px;">
        <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 0;">
          This is an automated test email. No action is required.
        </p>
        <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 8px 0 0 0;">
          If you received this email, your email configuration is working correctly.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const emailText = `
Test Email from Minery

This is a test email from your Minery email configuration.

Configuration Details:
- Provider: ${savedSettings.provider}
- From: ${savedSettings.emailFrom}
- Timestamp: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV || 'development'}

This is an automated test email. No action required.
    `.trim();

    // Set timeout for email sending
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout')), 10000)
    );

    try {
      console.log('[Test Email] Creating provider with config:', {
        provider: testConfig.provider,
        configKeys: Object.keys(testConfig.providerConfig),
        configValues: testConfig.providerConfig
      });
      
      const provider = EmailProviderFactory.create(testConfig);
      
      // Send the test email with timeout
      const sendPromise = provider.sendEmailEnhanced({
        recipient: validatedData.recipient,
        to: validatedData.recipient,
        from: savedSettings.emailFrom,
        fromName: savedSettings.emailFromName || undefined,
        replyTo: savedSettings.replyTo || undefined,
        subject: `Correo de Prueba - ${new Date().toLocaleString()}`,
        html: emailHtml,
        text: emailText,
        headers: {
          'X-Test-Email': 'true',
          'X-Provider': savedSettings.provider,
          'X-Environment': process.env.NODE_ENV || 'development'
        }
      });
      
      const result = await Promise.race([sendPromise, timeoutPromise]) as EmailSendResult;
      
      // Log successful test
      await db.insert(emailSettingsAuditTable).values({
        settingsId: savedSettings.id,
        action: 'send_test_email',
        changes: {
          provider: savedSettings.provider,
          recipient: validatedData.recipient,
          success: true,
          messageId: result.messageId
        },
        userId: context.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      
      const response = NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${validatedData.recipient}`,
        messageId: result.messageId,
        provider: savedSettings.provider,
        timestamp: result.timestamp,
        details: {
          recipient: validatedData.recipient,
          from: savedSettings.emailFrom,
          subject: `Correo de Prueba - ${new Date().toLocaleString()}`
        }
      });
      return applySecurityHeaders(response);
    } catch (error: unknown) {
      // Log failed test
      const emailError = error as EmailError;
      await db.insert(emailSettingsAuditTable).values({
        settingsId: savedSettings.id,
        action: 'send_test_email',
        changes: {
          provider: savedSettings.provider,
          recipient: validatedData.recipient,
          success: false,
          error: emailError.message
        },
        userId: context.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      
      throw error;
    }
  } catch (error: unknown) {
    console.error('Test email failed:', error);
    const emailError = error as EmailError;

    if (emailError.name === 'ZodError') {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid email address format',
          details: emailError.errors
        },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }
    
    if (emailError.message === 'Email send timeout') {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Email send timed out after 10 seconds',
          suggestion: 'The email provider is taking too long to respond. Check your configuration.'
        },
        { status: 408 }
      );
      return applySecurityHeaders(response);
    }
    
    // Provide helpful error message based on error type
    const suggestion = getEmailErrorSuggestion(emailError);
    
    const response = NextResponse.json(
      {
        success: false,
        error: emailError.message || 'Failed to send test email',
        suggestion,
        details: 'details' in emailError ? (emailError as { details: unknown }).details : undefined
      },
      { status: 400 }
    );
    return applySecurityHeaders(response);
  }
});

function getEmailErrorSuggestion(error: EmailError): string {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('domain') || message.includes('verification')) {
    return 'Your sender domain may not be verified. Check your Postmark dashboard to verify mineryreport.com.';
  }
  
  if (message.includes('spam') || message.includes('blocked')) {
    return 'The email was blocked by spam filters. Ensure your domain has proper SPF, DKIM, and DMARC records.';
  }
  
  if (message.includes('quota') || message.includes('limit')) {
    return 'You may have exceeded your provider\'s sending limits. Check your account quota.';
  }
  
  if (message.includes('recipient') || message.includes('bounce')) {
    return 'The recipient address may be invalid or the mailbox may be full.';
  }
  
  if (message.includes('auth') || message.includes('permission')) {
    return 'Authentication failed. Verify your API key or SMTP credentials.';
  }
  
  return 'Please verify your email configuration and ensure your sender domain is properly configured.';
}