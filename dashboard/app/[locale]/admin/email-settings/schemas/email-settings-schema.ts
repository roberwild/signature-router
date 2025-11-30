import { z } from 'zod';

// Provider-specific schemas
export const nodeMailerConfigSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean().default(false),
  auth: z.object({
    user: z.string().min(1, 'Username is required'),
    pass: z.string().min(1, 'Password is required'),
  }).optional(),
  tls: z.object({
    rejectUnauthorized: z.boolean().optional(),
  }).optional(),
});

export const resendConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  fromDomain: z.string().optional(),
});

export const sendGridConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  fromDomain: z.string().optional(),
  ipPoolName: z.string().optional(),
});

export const postmarkConfigSchema = z.object({
  serverApiToken: z.string().min(1, 'Server token is required'),
  messageStream: z.string().default('outbound'),
});

// Email features schema
export const emailFeaturesSchema = z.object({
  welcomeEmails: z.boolean().default(true),
  passwordResetEmails: z.boolean().default(true),
  invitationEmails: z.boolean().default(true),
  feedbackEmails: z.boolean().default(true),
  leadQualificationEmails: z.boolean().default(true),
  contactFormEmails: z.boolean().default(false),
  serviceRequestEmails: z.boolean().default(false),
});

// Notification settings schema
export const notificationSettingsSchema = z.object({
  contactFormNotificationEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  serviceRequestNotificationEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
});

// Main email settings schema
export const emailSettingsSchema = z.object({
  provider: z.enum(['nodemailer', 'resend', 'sendgrid', 'postmark']),
  emailFrom: z.string().email('Invalid email address'),
  emailFromName: z.string().optional(),
  feedbackInbox: z.string().email('Invalid email address').optional().or(z.literal('')),
  replyTo: z.string().email('Invalid email address').optional().or(z.literal('')),
  providerConfig: z.union([
    nodeMailerConfigSchema,
    resendConfigSchema,
    sendGridConfigSchema,
    postmarkConfigSchema,
  ]),
  features: emailFeaturesSchema,
  notificationSettings: notificationSettingsSchema,
});