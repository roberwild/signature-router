import { eq } from '@workspace/database';
import { db } from '@workspace/database/client';
import { platformEmailSettingsTable } from '@workspace/database/schema';
import { emailService } from '@workspace/email/services/email-service';

interface NotificationData {
  subject: string;
  html: string;
  text: string;
}

interface NotificationSettings {
  [key: string]: string | undefined;
}

interface Features {
  [key: string]: boolean | undefined;
}

class AdminNotificationService {
  private async getNotificationEmail(type: string): Promise<string | null> {
    const settings = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);
    
    if (!settings[0]?.notificationSettings) return null;
    
    const notificationSettings = settings[0].notificationSettings as NotificationSettings;
    return notificationSettings[`${type}NotificationEmail`] || null;
  }

  private async getFromEmail(): Promise<string | null> {
    const settings = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);
    
    return settings[0]?.emailFrom || null;
  }

  private async isFeatureEnabled(featureName: string): Promise<boolean> {
    const settings = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);
    
    if (!settings[0]?.features) return false;
    
    const features = settings[0].features as Features;
    return features[featureName] === true;
  }

  private async sendNotification(type: string, data: NotificationData, featureName?: string): Promise<void> {
    try {
      // Check if the feature is enabled
      if (featureName && !(await this.isFeatureEnabled(featureName))) {
        console.log(`Feature ${featureName} is disabled, skipping ${type} notification`);
        return;
      }

      const notificationEmail = await this.getNotificationEmail(type);
      const fromEmail = await this.getFromEmail();
      
      if (!notificationEmail || !fromEmail) {
        console.log(`No notification email configured for ${type}`);
        return;
      }

      await emailService.sendEmail({
        from: fromEmail,
        to: notificationEmail,
        recipient: notificationEmail,
        subject: data.subject,
        html: data.html,
        text: data.text,
      });
    } catch (error) {
      console.error(`Failed to send ${type} notification:`, error);
    }
  }

  async sendUserRegistrationNotification(userData: {
    name: string;
    email: string;
    registrationDate: Date;
  }): Promise<void> {
    const data: NotificationData = {
      subject: `Nuevo Registro de Usuario - ${userData.name}`,
      html: `
        <h2>New User Registration</h2>
        <p>A new user has registered on the platform:</p>
        <ul>
          <li><strong>Name:</strong> ${userData.name}</li>
          <li><strong>Email:</strong> ${userData.email}</li>
          <li><strong>Registration Date:</strong> ${userData.registrationDate.toLocaleString()}</li>
        </ul>
        <p>You can view the user details in the admin panel.</p>
      `,
      text: `
        New User Registration
        
        A new user has registered on the platform:
        - Name: ${userData.name}
        - Email: ${userData.email}
        - Registration Date: ${userData.registrationDate.toLocaleString()}
        
        You can view the user details in the admin panel.
      `,
    };

    await this.sendNotification('userRegistration', data, 'userRegistrationNotifications');
  }

  async sendSurveyCompletionNotification(surveyData: {
    userEmail: string;
    userName?: string;
    surveyType: string;
    completionDate: Date;
    score?: number;
  }): Promise<void> {
    const data: NotificationData = {
      subject: `Encuesta Completada - ${surveyData.surveyType}`,
      html: `
        <h2>Survey Completed</h2>
        <p>A user has completed a survey:</p>
        <ul>
          <li><strong>User:</strong> ${surveyData.userName || 'Anonymous'} (${surveyData.userEmail})</li>
          <li><strong>Survey Type:</strong> ${surveyData.surveyType}</li>
          <li><strong>Completion Date:</strong> ${surveyData.completionDate.toLocaleString()}</li>
          ${surveyData.score ? `<li><strong>Score:</strong> ${surveyData.score}%</li>` : ''}
        </ul>
        <p>You can view the full results in the admin panel.</p>
      `,
      text: `
        Survey Completed
        
        A user has completed a survey:
        - User: ${surveyData.userName || 'Anonymous'} (${surveyData.userEmail})
        - Survey Type: ${surveyData.surveyType}
        - Completion Date: ${surveyData.completionDate.toLocaleString()}
        ${surveyData.score ? `- Score: ${surveyData.score}%` : ''}
        
        You can view the full results in the admin panel.
      `,
    };

    await this.sendNotification('surveyCompletion', data, 'surveyCompletionNotifications');
  }

  async sendFailedLoginNotification(loginData: {
    email: string;
    ipAddress: string;
    attemptCount: number;
    timestamp: Date;
  }): Promise<void> {
    const data: NotificationData = {
      subject: `Alerta de Seguridad: Múltiples Intentos de Inicio de Sesión Fallidos`,
      html: `
        <h2>Security Alert: Failed Login Attempts</h2>
        <p>Multiple failed login attempts detected:</p>
        <ul>
          <li><strong>Email:</strong> ${loginData.email}</li>
          <li><strong>IP Address:</strong> ${loginData.ipAddress}</li>
          <li><strong>Attempt Count:</strong> ${loginData.attemptCount}</li>
          <li><strong>Last Attempt:</strong> ${loginData.timestamp.toLocaleString()}</li>
        </ul>
        <p>Please review this activity and consider implementing additional security measures if necessary.</p>
      `,
      text: `
        Security Alert: Failed Login Attempts
        
        Multiple failed login attempts detected:
        - Email: ${loginData.email}
        - IP Address: ${loginData.ipAddress}
        - Attempt Count: ${loginData.attemptCount}
        - Last Attempt: ${loginData.timestamp.toLocaleString()}
        
        Please review this activity and consider implementing additional security measures if necessary.
      `,
    };

    await this.sendNotification('failedLogin', data, 'failedLoginNotifications');
  }

  async sendSystemErrorNotification(errorData: {
    errorMessage: string;
    errorStack?: string;
    userEmail?: string;
    endpoint?: string;
    timestamp: Date;
  }): Promise<void> {
    const data: NotificationData = {
      subject: `Alerta de Error del Sistema`,
      html: `
        <h2>System Error Alert</h2>
        <p>A system error has occurred:</p>
        <ul>
          <li><strong>Error Message:</strong> ${errorData.errorMessage}</li>
          ${errorData.endpoint ? `<li><strong>Endpoint:</strong> ${errorData.endpoint}</li>` : ''}
          ${errorData.userEmail ? `<li><strong>User:</strong> ${errorData.userEmail}</li>` : ''}
          <li><strong>Timestamp:</strong> ${errorData.timestamp.toLocaleString()}</li>
        </ul>
        ${errorData.errorStack ? `
          <h3>Stack Trace:</h3>
          <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 12px;">
${errorData.errorStack}
          </pre>
        ` : ''}
        <p>Please review and address this error as soon as possible.</p>
      `,
      text: `
        System Error Alert
        
        A system error has occurred:
        - Error Message: ${errorData.errorMessage}
        ${errorData.endpoint ? `- Endpoint: ${errorData.endpoint}` : ''}
        ${errorData.userEmail ? `- User: ${errorData.userEmail}` : ''}
        - Timestamp: ${errorData.timestamp.toLocaleString()}
        
        ${errorData.errorStack ? `Stack Trace:\n${errorData.errorStack}` : ''}
        
        Please review and address this error as soon as possible.
      `,
    };

    await this.sendNotification('systemError', data, 'systemErrorNotifications');
  }
}

export const adminNotificationService = new AdminNotificationService();