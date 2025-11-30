import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { EmailProviderFactory } from '@workspace/email/services/email-provider-factory';
import type { DatabaseEmailConfig } from '@workspace/email/provider/enhanced-types';
import { z } from 'zod';
import { db } from '@workspace/database';
import { emailSettingsAuditTable } from '@workspace/database/schema';
// Removed react-email dependencies - using inline HTML instead

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

// Send test email schema
const sendTestSchema = z.object({
  provider: z.enum(['nodemailer', 'resend', 'sendgrid', 'postmark']),
  config: z.record(z.unknown()),
  recipient: z.string().email('Invalid recipient email address'),
  emailConfig: z.object({
    from: z.string().email('Invalid from email address'),
    fromName: z.string().optional(),
    replyTo: z.string().email().optional()
  })
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

// POST /api/admin/email-settings/send-test
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePlatformAdmin();
    
    // Check rate limit
    if (!checkEmailRateLimit(session.user?.id || '')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. You can send up to 5 test emails per minute.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = sendTestSchema.parse(body);
    
    // Create test configuration
    const testConfig: DatabaseEmailConfig = {
      id: `test-${Date.now()}`,
      emailFrom: validatedData.emailConfig.from,
      emailFromName: validatedData.emailConfig.fromName,
      replyTo: validatedData.emailConfig.replyTo,
      provider: validatedData.provider,
      providerConfig: validatedData.config,
      features: {},
      isActive: false
    };

    // Create the test email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Configuration Test</title>
</head>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #ffffff;">
  <div style="max-width: 580px; margin: 0 auto; padding: 20px 0 48px;">
    <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 40px 0; padding: 0;">
      Email Configuration Test
    </h1>

    <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 16px 0;">
      Hello ${validatedData.recipient},
    </p>

    <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 16px 0;">
      This is a test email to verify your email configuration is working correctly.
    </p>

    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <h2 style="color: #333; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
        Configuration Details
      </h2>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="color: #666; padding: 4px 0;">Provider:</td>
          <td style="color: #333; font-weight: 500; padding: 4px 0;">${validatedData.provider.charAt(0).toUpperCase() + validatedData.provider.slice(1)}</td>
        </tr>
        <tr>
          <td style="color: #666; padding: 4px 0;">From:</td>
          <td style="color: #333; font-weight: 500; padding: 4px 0;">${validatedData.emailConfig.from}</td>
        </tr>
        <tr>
          <td style="color: #666; padding: 4px 0;">Timestamp:</td>
          <td style="color: #333; font-weight: 500; padding: 4px 0;">${new Date().toLocaleString()}</td>
        </tr>
        <tr>
          <td style="color: #666; padding: 4px 0;">Environment:</td>
          <td style="color: #333; font-weight: 500; padding: 4px 0;">${process.env.NODE_ENV || 'development'}</td>
        </tr>
      </table>
    </div>

    <p style="color: #333; font-size: 16px; line-height: 26px; margin: 0 0 16px 0;">
      If you received this email, your email configuration is working correctly.
    </p>

    <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 24px 0 0 0;">
      This is an automated test email.
    </p>
  </div>
</body>
</html>
    `.trim();

    const emailText = `
Test Email from Minery Guard

This is a test email from your Minery Guard email configuration.

Configuration Details:
- Provider: ${validatedData.provider}
- From: ${validatedData.emailConfig.from}
- Timestamp: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV || 'development'}

This is an automated test email. No action required.
    `.trim();

    // Set timeout for email sending
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout')), 10000)
    );

    try {
      const provider = EmailProviderFactory.create(testConfig);
      
      // Send the test email with timeout
      const sendPromise = provider.sendEmailEnhanced({
        recipient: validatedData.recipient,
        to: validatedData.recipient,
        from: validatedData.emailConfig.from,
        fromName: validatedData.emailConfig.fromName,
        replyTo: validatedData.emailConfig.replyTo,
        subject: `Correo de Prueba - ${new Date().toLocaleString()}`,
        html: emailHtml,
        text: emailText,
        headers: {
          'X-Test-Email': 'true',
          'X-Provider': validatedData.provider,
          'X-Environment': process.env.NODE_ENV || 'development'
        }
      });
      
      const result = await Promise.race([sendPromise, timeoutPromise]) as EmailSendResult;
      
      // Log successful test
      await db.insert(emailSettingsAuditTable).values({
        settingsId: 'test',
        action: 'send_test_email',
        changes: {
          provider: validatedData.provider,
          recipient: validatedData.recipient,
          success: true,
          messageId: result.messageId
        },
        userId: session.user?.id || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });
      
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${validatedData.recipient}`,
        messageId: result.messageId,
        provider: validatedData.provider,
        timestamp: result.timestamp,
        details: {
          recipient: validatedData.recipient,
          from: validatedData.emailConfig.from,
          subject: `Correo de Prueba - ${new Date().toLocaleString()}`
        }
      });
    } catch (error: unknown) {
      // Log failed test
      const emailError = error as EmailError;
      await db.insert(emailSettingsAuditTable).values({
        settingsId: 'test',
        action: 'send_test_email',
        changes: {
          provider: validatedData.provider,
          recipient: validatedData.recipient,
          success: false,
          error: emailError.message
        },
        userId: session.user?.id || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });
      
      throw error;
    }
  } catch (error: unknown) {
    console.error('Test email failed:', error);
    const emailError = error as EmailError;

    if (emailError.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          details: emailError.errors
        },
        { status: 400 }
      );
    }
    
    if (emailError.message === 'Email send timeout') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email send timed out after 10 seconds',
          suggestion: 'The email provider is taking too long to respond. Check your configuration.'
        },
        { status: 408 }
      );
    }
    
    // Provide helpful error message based on error type
    const suggestion = getEmailErrorSuggestion(emailError);
    
    return NextResponse.json(
      {
        success: false,
        error: emailError.message || 'Failed to send test email',
        suggestion,
        details: 'details' in emailError ? (emailError as Record<string, unknown>).details : undefined
      },
      { status: 400 }
    );
  }
}

function getEmailErrorSuggestion(error: EmailError): string {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('domain') || message.includes('verification')) {
    return 'Your sender domain may not be verified. Check your provider dashboard to verify your domain.';
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