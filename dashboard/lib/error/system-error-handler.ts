import { adminNotificationService } from '~/lib/email/admin-notification-service';

export class SystemErrorHandler {
  // Track recent errors to avoid spam
  private static recentErrors = new Map<string, Date>();
  private static readonly COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  static async handleError(error: Error, context?: {
    userEmail?: string;
    endpoint?: string;
    additionalInfo?: Record<string, unknown>;
  }) {
    console.error('System error:', error);
    
    // Create error signature to avoid duplicate notifications
    const errorSignature = `${error.message}-${context?.endpoint || 'unknown'}`;
    const now = new Date();
    
    // Check if we've already sent a notification for this error recently
    const lastNotification = this.recentErrors.get(errorSignature);
    if (lastNotification && (now.getTime() - lastNotification.getTime()) < this.COOLDOWN_MS) {
      return; // Skip notification to avoid spam
    }
    
    try {
      await adminNotificationService.sendSystemErrorNotification({
        errorMessage: error.message,
        errorStack: error.stack,
        userEmail: context?.userEmail,
        endpoint: context?.endpoint,
        timestamp: now,
      });
      
      // Record that we sent a notification for this error
      this.recentErrors.set(errorSignature, now);
    } catch (notificationError) {
      console.error('Failed to send system error notification:', notificationError);
    }
  }

  // Clean up old entries periodically
  static cleanup() {
    const now = new Date();
    for (const [key, timestamp] of this.recentErrors.entries()) {
      if ((now.getTime() - timestamp.getTime()) > this.COOLDOWN_MS) {
        this.recentErrors.delete(key);
      }
    }
  }
}

// Clean up old entries every 10 minutes
setInterval(() => {
  SystemErrorHandler.cleanup();
}, 10 * 60 * 1000);