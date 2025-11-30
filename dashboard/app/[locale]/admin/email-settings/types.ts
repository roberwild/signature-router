export type EmailProvider = 'nodemailer' | 'resend' | 'sendgrid' | 'postmark';

export interface EmailFeatures {
  welcomeEmails: boolean;
  passwordResetEmails: boolean;
  invitationEmails: boolean;
  feedbackEmails: boolean;
  leadQualificationEmails: boolean;
  contactFormEmails: boolean;
  serviceRequestEmails: boolean;
}

export interface NotificationSettings {
  contactFormNotificationEmail?: string;
  serviceRequestNotificationEmail?: string;
}

export interface NodeMailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
  [key: string]: unknown;
}

export interface ResendConfig {
  apiKey: string;
  fromDomain?: string;
  [key: string]: unknown;
}

export interface SendGridConfig {
  apiKey: string;
  fromDomain?: string;
  ipPoolName?: string;
  [key: string]: unknown;
}

export interface PostmarkConfig {
  serverApiToken: string;
  messageStream: string;
  [key: string]: unknown;
}

export type ProviderConfig =
  | NodeMailerConfig
  | ResendConfig
  | SendGridConfig
  | PostmarkConfig;

export interface EmailSettings {
  id?: string;
  provider: EmailProvider;
  emailFrom: string;
  emailFromName?: string;
  feedbackInbox?: string;
  replyTo?: string;
  providerConfig: ProviderConfig;
  features: EmailFeatures;
  notificationSettings: NotificationSettings;
  isActive: boolean;
}

// Form data type from schema
export interface EmailSettingsFormData {
  provider: EmailProvider;
  emailFrom: string;
  emailFromName?: string;
  feedbackInbox?: string;
  replyTo?: string;
  providerConfig: ProviderConfig;
  features: EmailFeatures;
  notificationSettings: NotificationSettings;
}