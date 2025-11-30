import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { EmailProviderFactory } from '@workspace/email/services/email-provider-factory';
import type { DatabaseEmailConfig } from '@workspace/email/provider/enhanced-types';
import { z } from 'zod';
import { db } from '@workspace/database';
import { emailSettingsAuditTable } from '@workspace/database/schema';

// Interfaces for email operations
interface EmailError extends Error {
  name: string;
  message: string;
  errors?: unknown;
}

// Connection test schema
const testConnectionSchema = z.object({
  provider: z.enum(['nodemailer', 'resend', 'sendgrid', 'postmark']),
  config: z.record(z.unknown()),
});

// Rate limiting tracking (in-memory for simplicity, use Redis in production)
const testAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // 10 tests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userAttempts = testAttempts.get(userId);
  
  if (!userAttempts || now > userAttempts.resetAt) {
    testAttempts.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (userAttempts.count >= RATE_LIMIT) {
    return false;
  }
  
  userAttempts.count++;
  return true;
}

// POST /api/admin/email-settings/test-connection
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePlatformAdmin();
    
    // Check rate limit
    if (!checkRateLimit(session.user?.id || '')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait before testing again.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = testConnectionSchema.parse(body);
    
    // Create a test configuration
    const testConfig: DatabaseEmailConfig = {
      id: `test-${Date.now()}`,
      emailFrom: 'test@example.com',
      provider: validatedData.provider,
      providerConfig: validatedData.config,
      features: {},
      isActive: false
    };

    // Set timeout for connection test
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection test timeout')), 5000)
    );

    try {
      // Test the connection with timeout
      const testPromise = testProviderConnection(testConfig);
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      // Log successful test
      await db.insert(emailSettingsAuditTable).values({
        settingsId: 'test',
        action: 'test_connection',
        changes: {
          provider: validatedData.provider,
          success: true
        },
        userId: session.user?.id || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });
      
      return NextResponse.json(result);
    } catch (error: unknown) {
      // Log failed test
      const emailError = error as EmailError;
      await db.insert(emailSettingsAuditTable).values({
        settingsId: 'test',
        action: 'test_connection',
        changes: {
          provider: validatedData.provider,
          success: false,
          error: emailError.message
        },
        userId: session.user?.id || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });
      
      throw error;
    }
  } catch (error: unknown) {
    console.error('Connection test failed:', error);
    
    // Provide helpful error messages
    const errorResponse = getErrorResponse(error);
    
    return NextResponse.json(errorResponse, { status: 400 });
  }
}

async function testProviderConnection(config: DatabaseEmailConfig) {
  const provider = EmailProviderFactory.create(config);
  const startTime = Date.now();
  
  try {
    const isValid = await provider.verify();
    const latency = Date.now() - startTime;
    
    if (isValid) {
      return {
        success: true,
        provider: config.provider,
        message: getSuccessMessage(config.provider),
        latency,
        details: {
          connectionTime: `${latency}ms`,
          providerReady: true
        }
      };
    } else {
      return {
        success: false,
        provider: config.provider,
        error: 'Connection verification failed',
        suggestion: getSuggestion(config.provider, 'invalid_config'),
        documentationUrl: getDocumentationUrl(config.provider)
      };
    }
  } catch (error: unknown) {
    const emailError = error as EmailError;
    const errorType = identifyErrorType(emailError);

    return {
      success: false,
      provider: config.provider,
      error: emailError.message || 'Connection test failed',
      errorType,
      suggestion: getSuggestion(config.provider, errorType),
      documentationUrl: getDocumentationUrl(config.provider),
      details: {
        code: 'code' in emailError ? (emailError as EmailError & { code: string }).code : undefined,
        latency: Date.now() - startTime
      }
    };
  }
}

function identifyErrorType(error: EmailError): string {
  const message = error.message?.toLowerCase() || '';
  const code = 'code' in error ? String((error as EmailError & { code: unknown }).code).toLowerCase() : '';
  
  if (message.includes('auth') || code === '401' || code === 'auth_failed') {
    return 'authentication';
  }
  if (message.includes('network') || code === 'enotfound' || code === 'econnrefused') {
    return 'network';
  }
  if (message.includes('timeout') || code === 'etimedout') {
    return 'timeout';
  }
  if (message.includes('rate') || code === '429') {
    return 'rate_limit';
  }
  if (message.includes('invalid') || message.includes('malformed')) {
    return 'invalid_config';
  }
  
  return 'unknown';
}

function getSuggestion(provider: string, errorType: string): string {
  const suggestions: Record<string, Record<string, string>> = {
    nodemailer: {
      authentication: 'Check your SMTP username and password. For Gmail, use an app-specific password.',
      network: 'Verify the SMTP host and port. Ensure your firewall allows outbound SMTP connections.',
      timeout: 'The SMTP server is not responding. Check the host address and port number.',
      invalid_config: 'Verify all SMTP settings. Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted).',
      unknown: 'Check your SMTP configuration and ensure the server is accessible.'
    },
    resend: {
      authentication: 'Verify your API key starts with "re_" and has not been revoked.',
      network: 'Check your internet connection. Resend API should be accessible.',
      rate_limit: 'You have exceeded Resend API rate limits. Wait a moment before trying again.',
      invalid_config: 'Ensure your API key is correct and your domain is verified in Resend.',
      unknown: 'Verify your Resend API key and account status.'
    },
    sendgrid: {
      authentication: 'Check your SendGrid API key starts with "SG." and has Mail Send permission.',
      network: 'Verify your internet connection. SendGrid API should be accessible.',
      rate_limit: 'SendGrid rate limit reached. Consider upgrading your plan or waiting.',
      invalid_config: 'Ensure your API key is valid and your sender is verified.',
      unknown: 'Verify your SendGrid configuration and sender verification status.'
    },
    postmark: {
      authentication: 'Verify your Postmark Server API Token is correct.',
      network: 'Check your internet connection. Postmark API should be accessible.',
      rate_limit: 'Postmark rate limit reached. Check your account limits.',
      invalid_config: 'Ensure your Server Token is valid and the message stream exists.',
      unknown: 'Verify your Postmark server configuration.'
    }
  };
  
  return suggestions[provider]?.[errorType] || 'Please verify your configuration settings.';
}

function getSuccessMessage(provider: string): string {
  const messages: Record<string, string> = {
    nodemailer: 'SMTP connection established successfully',
    resend: 'Resend API key validated successfully',
    sendgrid: 'SendGrid authentication successful',
    postmark: 'Postmark server token verified'
  };
  
  return messages[provider] || 'Connection successful';
}

function getDocumentationUrl(provider: string): string {
  const urls: Record<string, string> = {
    nodemailer: 'https://nodemailer.com/smtp/',
    resend: 'https://resend.com/docs',
    sendgrid: 'https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs',
    postmark: 'https://postmarkapp.com/developer'
  };
  
  return urls[provider] || '';
}

function getErrorResponse(error: unknown) {
  const emailError = error as EmailError;
  if (emailError.name === 'ZodError') {
    return {
      success: false,
      error: 'Invalid request format',
      details: emailError.errors
    };
  }

  if (emailError.message === 'Connection test timeout') {
    return {
      success: false,
      error: 'Connection test timed out after 5 seconds',
      suggestion: 'The email provider is not responding. Check your configuration and network settings.'
    };
  }
  
  return {
    success: false,
    error: emailError.message || 'Connection test failed',
    suggestion: 'Please check your configuration and try again.'
  };
}