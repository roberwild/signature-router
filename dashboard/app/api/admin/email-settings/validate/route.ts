import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { z } from 'zod';

// Interface for error handling
interface EmailError extends Error {
  name: string;
  message: string;
  errors?: unknown;
}

// Interface for validation errors
interface ValidationError {
  path: string[];
  message: string;
  code: string;
}

// Interface for validation results
interface ValidationResults {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  suggestions: string[];
}

// Interface for additional validation checks
interface AdditionalValidationResult {
  warnings: string[];
  suggestions: string[];
}

// Interface for provider configs
interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  tls?: { rejectUnauthorized?: boolean };
}

interface ApiBasedConfig {
  apiKey: string;
  fromDomain?: string;
}

interface PostmarkConfig extends ApiBasedConfig {
  serverApiToken: string;
  messageStream: string;
}

interface EmailConfig {
  from: string;
  fromName?: string;
  replyTo?: string;
  feedbackInbox?: string;
}

// Enhanced validation schemas with specific rules
const emailValidationSchema = z.string()
  .email('Invalid email format')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be properly formatted')
  .refine(email => {
    // Check for common typos
    const domain = email.split('@')[1];
    const commonTypos = ['gmial.com', 'gmai.com', 'yahooo.com', 'homtail.com'];
    return !commonTypos.includes(domain);
  }, 'Possible typo detected in email domain');

const providerConfigSchemas = {
  nodemailer: z.object({
    host: z.string()
      .min(1, 'SMTP host is required')
      .refine(host => {
        // Validate hostname format
        const hostRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return hostRegex.test(host) || ipRegex.test(host);
      }, 'Invalid hostname format'),
    port: z.number()
      .int('Port must be an integer')
      .min(1, 'Port must be between 1 and 65535')
      .max(65535, 'Port must be between 1 and 65535'),
    secure: z.boolean(),
    auth: z.object({
      user: z.string().min(1, 'Username is required'),
      pass: z.string().min(1, 'Password is required')
    }).optional(),
    tls: z.object({
      rejectUnauthorized: z.boolean().optional(),
      minVersion: z.enum(['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3']).optional()
    }).optional()
  }),
  
  resend: z.object({
    apiKey: z.string()
      .min(1, 'API key is required')
      .regex(/^re_[A-Za-z0-9_-]+$/, 'Invalid Resend API key format (should start with "re_")'),
    fromDomain: z.string()
      .optional()
      .refine(domain => {
        if (!domain) return true;
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
        return domainRegex.test(domain);
      }, 'Invalid domain format')
  }),
  
  sendgrid: z.object({
    apiKey: z.string()
      .min(1, 'API key is required')
      .regex(/^SG\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, 'Invalid SendGrid API key format (should start with "SG.")'),
    fromDomain: z.string().optional(),
    ipPoolName: z.string()
      .max(64, 'IP pool name too long')
      .optional()
  }),
  
  postmark: z.object({
    serverApiToken: z.string()
      .min(32, 'Server token must be at least 32 characters')
      .regex(/^[A-Za-z0-9-]+$/, 'Invalid Postmark server token format'),
    messageStream: z.string()
      .default('outbound')
      .refine(stream => {
        const validStreams = ['outbound', 'inbound', 'broadcasts'];
        return validStreams.includes(stream) || /^[a-z0-9-]+$/.test(stream);
      }, 'Invalid message stream format')
  })
};

const validateRequestSchema = z.object({
  provider: z.enum(['nodemailer', 'resend', 'sendgrid', 'postmark']),
  config: z.record(z.unknown()),
  emailConfig: z.object({
    from: emailValidationSchema,
    fromName: z.string()
      .max(100, 'From name too long')
      .optional(),
    replyTo: emailValidationSchema.optional(),
    feedbackInbox: emailValidationSchema.optional()
  })
});

// POST /api/admin/email-settings/validate
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePlatformAdmin();

    const body = await request.json();
    
    // Perform comprehensive validation
    const validationResults: ValidationResults = {
      valid: true,
      errors: [] as ValidationError[],
      warnings: [] as string[],
      suggestions: [] as string[]
    };

    try {
      // Validate overall structure
      const validatedData = validateRequestSchema.parse(body);
      
      // Validate provider-specific config
      const providerSchema = providerConfigSchemas[validatedData.provider];
      const providerConfig = providerSchema.parse(validatedData.config);
      
      // Additional validation checks
      const additionalChecks = performAdditionalValidation(
        validatedData.provider,
        providerConfig as NodemailerConfig | ApiBasedConfig | PostmarkConfig,
        validatedData.emailConfig
      );
      
      validationResults.warnings.push(...additionalChecks.warnings);
      validationResults.suggestions.push(...additionalChecks.suggestions);
      
      // DNS validation suggestions
      if (validatedData.emailConfig.from) {
        const domain = validatedData.emailConfig.from.split('@')[1];
        validationResults.suggestions.push(
          `Ensure SPF record is configured for ${domain}`,
          `Set up DKIM signing for ${domain}`,
          `Configure DMARC policy for ${domain}`
        );
      }
      
      return NextResponse.json({
        success: true,
        valid: true,
        message: 'Configuration is valid',
        warnings: validationResults.warnings,
        suggestions: validationResults.suggestions,
        details: {
          provider: validatedData.provider,
          emailFrom: validatedData.emailConfig.from,
          features: {
            hasAuthentication: hasAuthentication(validatedData.provider, providerConfig as NodemailerConfig | ApiBasedConfig | PostmarkConfig),
            hasSecureConnection: hasSecureConnection(validatedData.provider, providerConfig as NodemailerConfig | ApiBasedConfig | PostmarkConfig),
            hasDomainVerification: needsDomainVerification(validatedData.provider)
          }
        }
      });
    } catch (error: unknown) {
      const typedError = error as EmailError;
      if (typedError.name === 'ZodError') {
        // Format validation errors
        const zodErrors = (typedError as z.ZodError).errors;
        const validationErrors: ValidationError[] = zodErrors.map((err) => ({
          path: err.path as string[],
          message: err.message,
          code: err.code
        }));

        const formattedErrors = zodErrors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return NextResponse.json({
          success: false,
          valid: false,
          errors: formattedErrors,
          suggestions: getValidationSuggestions(validationErrors)
        }, { status: 400 });
      }

      throw error;
    }
  } catch (error: unknown) {
    console.error('Validation failed:', error);
    const typedError = error as EmailError;

    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: typedError.message || 'Validation failed',
        suggestions: ['Please check your configuration and try again']
      },
      { status: 500 }
    );
  }
}

function performAdditionalValidation(
  provider: string,
  config: NodemailerConfig | ApiBasedConfig | PostmarkConfig,
  emailConfig: EmailConfig
): AdditionalValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Provider-specific checks
  switch (provider) {
    case 'nodemailer': {
      const nodemailerConfig = config as NodemailerConfig;
      if (nodemailerConfig.port === 25) {
        warnings.push('Port 25 is often blocked by ISPs. Consider using 587 (TLS) or 465 (SSL).');
      }
      if (!nodemailerConfig.secure && nodemailerConfig.port === 465) {
        warnings.push('Port 465 typically requires SSL. Set secure: true.');
      }
      if (nodemailerConfig.secure && nodemailerConfig.port === 587) {
        warnings.push('Port 587 typically uses STARTTLS. Set secure: false.');
      }
      if (!nodemailerConfig.auth) {
        warnings.push('No authentication configured. Most SMTP servers require authentication.');
      }
      if (nodemailerConfig.tls?.rejectUnauthorized === false) {
        warnings.push('Certificate validation is disabled. This reduces security.');
      }
      break;
    }

    case 'resend': {
      const resendConfig = config as ApiBasedConfig;
      if (!emailConfig.from.endsWith(resendConfig.fromDomain || '')) {
        suggestions.push('Consider using an email address from your verified domain.');
      }
      break;
    }

    case 'sendgrid': {
      suggestions.push('Ensure your sender identity is verified in SendGrid.');
      suggestions.push('Consider setting up IP warming for better deliverability.');
      break;
    }

    case 'postmark': {
      const postmarkConfig = config as PostmarkConfig;
      if (postmarkConfig.messageStream === 'broadcasts') {
        warnings.push('Broadcast stream is for marketing emails. Use "outbound" for transactional emails.');
      }
      suggestions.push('Configure bounce and spam complaint webhooks in Postmark.');
      break;
    }
  }
  
  // General email checks
  if (emailConfig.from.includes('noreply')) {
    suggestions.push('Consider using a monitored email address instead of "noreply" for better engagement.');
  }
  
  if (!emailConfig.replyTo) {
    suggestions.push('Set a reply-to address to handle user responses.');
  }
  
  if (!emailConfig.feedbackInbox) {
    suggestions.push('Configure a feedback inbox to receive user feedback.');
  }
  
  return { warnings, suggestions };
}

function hasAuthentication(provider: string, config: NodemailerConfig | ApiBasedConfig | PostmarkConfig): boolean {
  switch (provider) {
    case 'nodemailer': {
      const nodemailerConfig = config as NodemailerConfig;
      return !!nodemailerConfig.auth?.user && !!nodemailerConfig.auth?.pass;
    }
    case 'resend':
    case 'sendgrid': {
      const apiConfig = config as ApiBasedConfig;
      return !!apiConfig.apiKey;
    }
    case 'postmark': {
      const postmarkConfig = config as PostmarkConfig;
      return !!postmarkConfig.serverApiToken;
    }
    default:
      return false;
  }
}

function hasSecureConnection(provider: string, config: NodemailerConfig | ApiBasedConfig | PostmarkConfig): boolean {
  switch (provider) {
    case 'nodemailer': {
      const nodemailerConfig = config as NodemailerConfig;
      return nodemailerConfig.secure || nodemailerConfig.port === 587; // STARTTLS on 587
    }
    case 'resend':
    case 'sendgrid':
    case 'postmark':
      return true; // API providers always use HTTPS
    default:
      return false;
  }
}

function needsDomainVerification(provider: string): boolean {
  return ['resend', 'sendgrid', 'postmark'].includes(provider);
}

function getValidationSuggestions(errors: ValidationError[]): string[] {
  const suggestions: string[] = [];

  for (const error of errors) {
    const fieldPath = error.path.join('.');
    if (fieldPath.includes('apiKey')) {
      suggestions.push('Check your API key in your provider\'s dashboard.');
    }
    if (fieldPath.includes('host')) {
      suggestions.push('Verify the SMTP server hostname with your email provider.');
    }
    if (fieldPath.includes('port')) {
      suggestions.push('Common SMTP ports: 587 (TLS), 465 (SSL), 25 (unencrypted).');
    }
    if (fieldPath.includes('email')) {
      suggestions.push('Ensure email addresses are properly formatted (user@domain.com).');
    }
  }

  return [...new Set(suggestions)]; // Remove duplicates
}