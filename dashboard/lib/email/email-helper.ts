import { emailService } from '@workspace/email/services/email-service';
import { featureToggleService, EmailFeatureKey } from './feature-toggle-service';
import type { EmailOptions, EmailResult } from '@workspace/email/provider/enhanced-types';

/**
 * Enhanced email options with feature toggle support
 */
export interface EnhancedEmailOptions extends EmailOptions {
  emailType?: EmailFeatureKey | string;
  bypassToggle?: boolean; // For system-critical emails
  fallbackAction?: 'log' | 'throw' | 'silent'; // What to do if feature is disabled
}

/**
 * Email helper with feature toggle integration
 */
export class EmailHelper {
  /**
   * Send an email with feature toggle checking
   */
  static async sendEmail(options: EnhancedEmailOptions): Promise<EmailResult> {
    const { emailType, bypassToggle = false, fallbackAction = 'log', ...emailOptions } = options;

    // Check feature toggle if emailType is specified
    if (emailType && !bypassToggle) {
      const isEnabled = await featureToggleService.isEnabled(emailType as EmailFeatureKey);
      
      if (!isEnabled) {
        const message = `Email type ${emailType} is disabled by feature toggle`;
        
        switch (fallbackAction) {
          case 'throw':
            throw new Error(message);
          case 'log':
            console.info(message, {
              recipient: options.recipient,
              to: options.to,
              subject: options.subject,
              emailType
            });
            break;
          case 'silent':
            // Do nothing
            break;
        }

        return {
          success: false,
          error: message,
          provider: 'feature-toggle',
          timestamp: new Date(),
          metadata: {
            feature: emailType,
            disabled: true,
            reason: 'Feature toggle disabled',
            fallbackAction
          }
        };
      }
    }

    // Add emailType to options for the email service to use
    const enhancedOptions = {
      ...emailOptions,
      emailType
    };

    return emailService.sendEmail(enhancedOptions);
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(options: Omit<EmailOptions, 'emailType'>): Promise<EmailResult> {
    return this.sendEmail({
      ...options,
      emailType: 'welcomeEmails'
    });
  }

  /**
   * Send password reset email (critical - cannot be disabled)
   */
  static async sendPasswordResetEmail(options: Omit<EmailOptions, 'emailType'>): Promise<EmailResult> {
    return this.sendEmail({
      ...options,
      emailType: 'passwordResetEmails',
      bypassToggle: false, // Still check the toggle, but warn if disabled
      fallbackAction: 'log'
    });
  }

  /**
   * Send invitation email
   */
  static async sendInvitationEmail(options: Omit<EmailOptions, 'emailType'>): Promise<EmailResult> {
    return this.sendEmail({
      ...options,
      emailType: 'invitationEmails'
    });
  }

  /**
   * Send feedback email
   */
  static async sendFeedbackEmail(options: Omit<EmailOptions, 'emailType'>): Promise<EmailResult> {
    return this.sendEmail({
      ...options,
      emailType: 'feedbackEmails'
    });
  }

  /**
   * Send lead qualification email
   */
  static async sendLeadQualificationEmail(options: Omit<EmailOptions, 'emailType'>): Promise<EmailResult> {
    return this.sendEmail({
      ...options,
      emailType: 'leadQualificationEmails'
    });
  }

  /**
   * Send organization notification
   */
  static async sendOrganizationNotification(options: Omit<EmailOptions, 'emailType'>): Promise<EmailResult> {
    return this.sendEmail({
      ...options,
      emailType: 'organizationNotifications'
    });
  }

  /**
   * Send admin alert (critical - bypass toggle if truly critical)
   */
  static async sendAdminAlert(options: Omit<EmailOptions, 'emailType'> & { critical?: boolean }): Promise<EmailResult> {
    const { critical = false, ...emailOptions } = options;
    
    return this.sendEmail({
      ...emailOptions,
      emailType: 'adminAlerts',
      bypassToggle: critical,
      fallbackAction: critical ? 'throw' : 'log'
    });
  }

  /**
   * Check if a feature is enabled before attempting to send
   */
  static async isFeatureEnabled(feature: EmailFeatureKey): Promise<boolean> {
    return featureToggleService.isEnabled(feature);
  }

  /**
   * Get all current feature states
   */
  static async getFeatureStates(): Promise<Record<EmailFeatureKey, boolean>> {
    return featureToggleService.getAllToggles();
  }

  /**
   * Send a test email for a specific feature
   */
  static async sendTestEmail(
    feature: EmailFeatureKey,
    testOptions: {
      to: string;
      subject?: string;
      content?: string;
    }
  ): Promise<EmailResult> {
    const isEnabled = await featureToggleService.isEnabled(feature);
    
    if (!isEnabled) {
      return {
        success: false,
        error: `Cannot send test email: ${feature} is disabled`,
        provider: 'feature-toggle',
        timestamp: new Date(),
        metadata: {
          feature,
          disabled: true,
          reason: 'Feature toggle disabled'
        }
      };
    }

    const htmlContent = testOptions.content || `
        <h2>Feature Toggle Test Email</h2>
        <p>This is a test email for the <strong>${feature}</strong> feature.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>If you received this email, the feature is working correctly.</p>
      `;

    return this.sendEmail({
      recipient: testOptions.to,
      subject: testOptions.subject || `Correo de Prueba para ${feature}`,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      to: testOptions.to,
      emailType: feature,
      bypassToggle: false
    });
  }

  /**
   * Batch send emails with feature toggle checking
   */
  static async batchSendEmails(
    emailRequests: Array<{
      options: EnhancedEmailOptions;
      id?: string;
    }>
  ): Promise<Array<{
    id?: string;
    result: EmailResult;
    skipped?: boolean;
    reason?: string;
  }>> {
    const results = [];
    
    // Get all feature states once to optimize performance
    const featureStates = await featureToggleService.getAllToggles();
    
    for (const request of emailRequests) {
      const { options, id } = request;
      
      try {
        // Quick feature check without additional async calls
        if (options.emailType && !options.bypassToggle) {
          const isEnabled = featureStates[options.emailType as EmailFeatureKey];
          
          if (isEnabled === false) {
            results.push({
              id,
              result: {
                success: false,
                error: `Feature ${options.emailType} is disabled`,
                provider: 'feature-toggle',
                timestamp: new Date()
              },
              skipped: true,
              reason: 'Feature toggle disabled'
            });
            continue;
          }
        }
        
        const result = await this.sendEmail(options);
        results.push({ id, result });
      } catch (error: unknown) {
        results.push({
          id,
          result: {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            provider: 'unknown',
            timestamp: new Date()
          }
        });
      }
    }
    
    return results;
  }
}

// Export convenience functions
export const sendWelcomeEmail = EmailHelper.sendWelcomeEmail.bind(EmailHelper);
export const sendPasswordResetEmail = EmailHelper.sendPasswordResetEmail.bind(EmailHelper);
export const sendInvitationEmail = EmailHelper.sendInvitationEmail.bind(EmailHelper);
export const sendFeedbackEmail = EmailHelper.sendFeedbackEmail.bind(EmailHelper);
export const sendLeadQualificationEmail = EmailHelper.sendLeadQualificationEmail.bind(EmailHelper);
export const sendOrganizationNotification = EmailHelper.sendOrganizationNotification.bind(EmailHelper);
export const sendAdminAlert = EmailHelper.sendAdminAlert.bind(EmailHelper);
export const isEmailFeatureEnabled = EmailHelper.isFeatureEnabled.bind(EmailHelper);
export const getEmailFeatureStates = EmailHelper.getFeatureStates.bind(EmailHelper);
export const sendTestEmail = EmailHelper.sendTestEmail.bind(EmailHelper);
export const batchSendEmails = EmailHelper.batchSendEmails.bind(EmailHelper);