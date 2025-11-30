import { db } from '@workspace/database';
import { emailSettingsAuditTable } from '@workspace/database/schema';

export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  SESSION_EXPIRED = 'auth.session.expired',
  
  // Authorization Events
  ACCESS_DENIED = 'auth.access.denied',
  PERMISSION_ESCALATION = 'auth.permission.escalation',
  ROLE_CHANGED = 'auth.role.changed',
  
  // Encryption Events
  ENCRYPTION_KEY_GENERATED = 'encryption.key.generated',
  ENCRYPTION_KEY_ROTATED = 'encryption.key.rotated',
  ENCRYPTION_FAILED = 'encryption.operation.failed',
  DECRYPTION_FAILED = 'decryption.operation.failed',
  
  // Data Access Events
  SENSITIVE_DATA_ACCESSED = 'data.sensitive.accessed',
  SENSITIVE_DATA_MODIFIED = 'data.sensitive.modified',
  SENSITIVE_DATA_EXPORTED = 'data.sensitive.exported',
  
  // Email Settings Events
  EMAIL_CONFIG_CREATED = 'email.config.created',
  EMAIL_CONFIG_UPDATED = 'email.config.updated',
  EMAIL_CONFIG_DELETED = 'email.config.deleted',
  EMAIL_TEST_PERFORMED = 'email.test.performed',
  
  // Security Configuration Events
  SECURITY_POLICY_CHANGED = 'security.policy.changed',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  
  // System Events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning'
}

export interface SecurityAuditEvent {
  eventType: SecurityEventType;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceId?: string;
  resourceType?: string;
  details?: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityAuditContext {
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger | null = null;
  private logBuffer: SecurityAuditEvent[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startAutoFlush();
  }

  static getInstance(): SecurityAuditLogger {
    if (!this.instance) {
      this.instance = new SecurityAuditLogger();
    }
    return this.instance;
  }

  /**
   * Log a security event
   */
  async logEvent(
    eventType: SecurityEventType,
    context: SecurityAuditContext,
    details: {
      resourceId?: string;
      resourceType?: string;
      success: boolean;
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      details?: Record<string, unknown>;
    }
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      eventType,
      userId: context.userId,
      userEmail: context.userEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      resourceId: details.resourceId,
      resourceType: details.resourceType,
      success: details.success,
      riskLevel: details.riskLevel || this.inferRiskLevel(eventType, details.success),
      errorMessage: details.errorMessage,
      details: details.details,
      metadata: {
        ...details.metadata,
        timestamp: new Date().toISOString(),
        sessionId: context.sessionId
      }
    };

    // Add to buffer
    this.logBuffer.push(event);

    // Log to console for immediate visibility
    this.logToConsole(event);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flush();
    }

    // For critical events, flush immediately and potentially alert
    if (event.riskLevel === 'critical') {
      await this.flush();
      await this.handleCriticalEvent(event);
    }
  }

  /**
   * Convenience methods for common security events
   */
  async logAuthenticationEvent(
    eventType: SecurityEventType,
    context: SecurityAuditContext,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent(eventType, context, {
      success,
      resourceType: 'authentication',
      errorMessage,
      riskLevel: success ? 'low' : 'medium'
    });
  }

  async logAuthorizationEvent(
    eventType: SecurityEventType,
    context: SecurityAuditContext,
    resourceId: string,
    resourceType: string,
    success: boolean,
    requiredPermissions?: string[]
  ): Promise<void> {
    await this.logEvent(eventType, context, {
      resourceId,
      resourceType,
      success,
      riskLevel: success ? 'low' : 'high',
      details: { requiredPermissions }
    });
  }

  async logDataAccessEvent(
    eventType: SecurityEventType,
    context: SecurityAuditContext,
    resourceId: string,
    resourceType: string,
    operation: 'read' | 'write' | 'delete' | 'export',
    sensitivityLevel: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    await this.logEvent(eventType, context, {
      resourceId,
      resourceType,
      success: true,
      riskLevel: sensitivityLevel === 'critical' ? 'critical' : 'medium',
      details: { operation, sensitivityLevel }
    });
  }

  async logEncryptionEvent(
    eventType: SecurityEventType,
    context: SecurityAuditContext,
    operation: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent(eventType, context, {
      resourceType: 'encryption',
      success,
      riskLevel: success ? 'low' : 'high',
      errorMessage,
      details: { operation }
    });
  }

  async logEmailEvent(
    eventType: SecurityEventType,
    context: SecurityAuditContext,
    settingsId: string,
    provider: string,
    operation: string,
    success: boolean
  ): Promise<void> {
    await this.logEvent(eventType, context, {
      resourceId: settingsId,
      resourceType: 'email_settings',
      success,
      riskLevel: 'medium',
      details: { provider, operation }
    });

    // Also log to email settings audit table
    if (context.userId) {
      try {
        await db.insert(emailSettingsAuditTable).values({
          settingsId,
          action: operation,
          changes: { eventType, provider, success },
          userId: context.userId,
          ipAddress: context.ipAddress || 'unknown'
        });
      } catch (error) {
        console.error('Failed to log email settings audit:', error);
      }
    }
  }

  /**
   * Flush buffered events to storage
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const events = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Here you would typically save to a dedicated audit log table
      // For now, we'll log to console and could extend to save to database
      console.log(`Flushing ${events.length} security audit events`);
      
      // In a production environment, you might:
      // - Save to a dedicated audit log database
      // - Send to a SIEM system
      // - Store in a secure log file
      // - Send to a log aggregation service

      // Example: Save high-risk events to database
      const highRiskEvents = events.filter(e => ['high', 'critical'].includes(e.riskLevel));
      if (highRiskEvents.length > 0) {
        console.warn(`${highRiskEvents.length} high-risk security events detected`);
        // Here you would save these to a secure audit table
      }
    } catch (error) {
      console.error('Failed to flush security audit events:', error);
      // Re-add events to buffer if flush failed
      this.logBuffer.unshift(...events);
    }
  }

  /**
   * Handle critical security events
   */
  private async handleCriticalEvent(event: SecurityAuditEvent): Promise<void> {
    console.error('CRITICAL SECURITY EVENT:', {
      type: event.eventType,
      user: event.userEmail,
      ip: event.ipAddress,
      resource: event.resourceId,
      details: event.details
    });

    // In a production environment, you might:
    // - Send immediate alerts to security team
    // - Trigger automated responses (e.g., account lockout)
    // - Escalate to incident management system
    // - Send notifications to compliance officers
  }

  /**
   * Infer risk level based on event type and outcome
   */
  private inferRiskLevel(
    eventType: SecurityEventType,
    success: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Failed authentication/authorization attempts are higher risk
    if (!success) {
      switch (eventType) {
        case SecurityEventType.LOGIN_FAILURE:
          return 'medium';
        case SecurityEventType.ACCESS_DENIED:
          return 'high';
        case SecurityEventType.ENCRYPTION_FAILED:
        case SecurityEventType.DECRYPTION_FAILED:
          return 'critical';
        default:
          return 'medium';
      }
    }

    // Success events by category
    switch (eventType) {
      case SecurityEventType.ENCRYPTION_KEY_GENERATED:
      case SecurityEventType.ENCRYPTION_KEY_ROTATED:
        return 'medium';
      case SecurityEventType.SENSITIVE_DATA_ACCESSED:
      case SecurityEventType.SENSITIVE_DATA_MODIFIED:
        return 'medium';
      case SecurityEventType.SENSITIVE_DATA_EXPORTED:
        return 'high';
      case SecurityEventType.PERMISSION_ESCALATION:
      case SecurityEventType.ROLE_CHANGED:
        return 'high';
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return 'critical';
      default:
        return 'low';
    }
  }

  /**
   * Log event to console for immediate visibility
   */
  private logToConsole(event: SecurityAuditEvent): void {
    const logLevel = event.riskLevel === 'critical' || !event.success ? 'error' :
                    event.riskLevel === 'high' ? 'warn' : 'info';
    
    console[logLevel]('Security Event:', {
      type: event.eventType,
      user: event.userEmail,
      ip: event.ipAddress,
      resource: `${event.resourceType}:${event.resourceId}`,
      success: event.success,
      risk: event.riskLevel
    });
  }

  /**
   * Start automatic flushing of buffered events
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop the audit logger and flush remaining events
   */
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

// Singleton instance
export const securityAuditLogger = SecurityAuditLogger.getInstance();

// Helper function to extract context from Next.js request
export function getSecurityContextFromRequest(
  request: Request,
  user?: { id: string; email: string }
): SecurityAuditContext {
  return {
    userId: user?.id,
    userEmail: user?.email,
    ipAddress: request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}