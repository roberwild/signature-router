import { NextRequest, NextResponse } from 'next/server';

export enum ErrorType {
  // Network/Connection Errors
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Authentication/Authorization Errors
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCHEMA_ERROR = 'SCHEMA_ERROR',
  REQUIRED_FIELD_ERROR = 'REQUIRED_FIELD_ERROR',
  
  // Provider Errors
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_CONFIG_ERROR = 'PROVIDER_CONFIG_ERROR',
  PROVIDER_RATE_LIMIT = 'PROVIDER_RATE_LIMIT',
  PROVIDER_QUOTA_EXCEEDED = 'PROVIDER_QUOTA_EXCEEDED',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  
  // Cache Errors
  CACHE_ERROR = 'CACHE_ERROR',
  CACHE_UNAVAILABLE = 'CACHE_UNAVAILABLE',
  
  // Rate Limiting
  RATE_LIMIT = 'RATE_LIMIT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Feature Toggle Errors
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  FEATURE_TOGGLE_ERROR = 'FEATURE_TOGGLE_ERROR',
  
  // Encryption/Security Errors
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  DECRYPTION_ERROR = 'DECRYPTION_ERROR',
  SECURITY_ERROR = 'SECURITY_ERROR',
  
  // System Errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
  stackTrace?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    code: string;
    message: string;
    userMessage: string;
    details?: unknown;
    recovery?: string;
    documentation?: string;
    requestId?: string;
    timestamp: string;
    retryable: boolean;
    retryAfter?: number;
  };
}

export interface RecoveryAction {
  action: string;
  description: string;
  automated: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
  private static readonly ERROR_MESSAGES: Record<ErrorType, string> = {
    // Network/Connection
    [ErrorType.CONNECTION_ERROR]: 'Unable to establish connection to the service',
    [ErrorType.TIMEOUT_ERROR]: 'The request timed out',
    [ErrorType.NETWORK_ERROR]: 'Network connectivity issue occurred',
    
    // Auth
    [ErrorType.AUTH_ERROR]: 'Authentication failed',
    [ErrorType.PERMISSION_ERROR]: 'Insufficient permissions for this operation',
    [ErrorType.TOKEN_EXPIRED]: 'Session expired, please sign in again',
    
    // Validation
    [ErrorType.VALIDATION_ERROR]: 'The provided data is invalid',
    [ErrorType.SCHEMA_ERROR]: 'Data format does not match requirements',
    [ErrorType.REQUIRED_FIELD_ERROR]: 'Required information is missing',
    
    // Provider
    [ErrorType.PROVIDER_ERROR]: 'Email provider encountered an error',
    [ErrorType.PROVIDER_CONFIG_ERROR]: 'Email provider configuration is invalid',
    [ErrorType.PROVIDER_RATE_LIMIT]: 'Provider rate limit exceeded',
    [ErrorType.PROVIDER_QUOTA_EXCEEDED]: 'Provider quota has been exceeded',
    
    // Database
    [ErrorType.DATABASE_ERROR]: 'Database operation failed',
    [ErrorType.DATABASE_CONNECTION_ERROR]: 'Unable to connect to database',
    [ErrorType.TRANSACTION_ERROR]: 'Database transaction failed',
    
    // Cache
    [ErrorType.CACHE_ERROR]: 'Cache operation failed',
    [ErrorType.CACHE_UNAVAILABLE]: 'Cache service is temporarily unavailable',
    
    // Rate Limiting
    [ErrorType.RATE_LIMIT]: 'Too many requests, please slow down',
    [ErrorType.QUOTA_EXCEEDED]: 'Usage quota exceeded',
    
    // Feature Toggles
    [ErrorType.FEATURE_DISABLED]: 'This feature is currently disabled',
    [ErrorType.FEATURE_TOGGLE_ERROR]: 'Feature toggle service error',
    
    // Security
    [ErrorType.ENCRYPTION_ERROR]: 'Data encryption failed',
    [ErrorType.DECRYPTION_ERROR]: 'Data decryption failed',
    [ErrorType.SECURITY_ERROR]: 'Security validation failed',
    
    // System
    [ErrorType.SYSTEM_ERROR]: 'An unexpected system error occurred',
    [ErrorType.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
    [ErrorType.UNKNOWN_ERROR]: 'An unknown error occurred'
  };

  private static readonly USER_MESSAGES: Record<ErrorType, string> = {
    // Network/Connection
    [ErrorType.CONNECTION_ERROR]: 'Unable to connect to the email service. Please check your internet connection and try again.',
    [ErrorType.TIMEOUT_ERROR]: 'The request took too long to complete. Please try again.',
    [ErrorType.NETWORK_ERROR]: 'Network issue detected. Please check your connection and retry.',
    
    // Auth
    [ErrorType.AUTH_ERROR]: 'Please check your credentials and try signing in again.',
    [ErrorType.PERMISSION_ERROR]: 'You don\'t have permission to perform this action. Contact your administrator if needed.',
    [ErrorType.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again to continue.',
    
    // Validation
    [ErrorType.VALIDATION_ERROR]: 'Please check the form and correct any highlighted errors.',
    [ErrorType.SCHEMA_ERROR]: 'The data format is incorrect. Please review your input.',
    [ErrorType.REQUIRED_FIELD_ERROR]: 'Please fill in all required fields before continuing.',
    
    // Provider
    [ErrorType.PROVIDER_ERROR]: 'There\'s an issue with your email provider. Please check your settings.',
    [ErrorType.PROVIDER_CONFIG_ERROR]: 'Your email provider settings appear to be incorrect. Please review and update them.',
    [ErrorType.PROVIDER_RATE_LIMIT]: 'Too many email requests. Please wait a moment before trying again.',
    [ErrorType.PROVIDER_QUOTA_EXCEEDED]: 'Your email quota has been reached. Please upgrade your plan or wait for the reset.',
    
    // Database
    [ErrorType.DATABASE_ERROR]: 'We\'re experiencing technical difficulties. Please try again in a few minutes.',
    [ErrorType.DATABASE_CONNECTION_ERROR]: 'Cannot connect to our servers. Please try again shortly.',
    [ErrorType.TRANSACTION_ERROR]: 'The operation couldn\'t be completed. Please try again.',
    
    // Cache
    [ErrorType.CACHE_ERROR]: 'Temporary performance issue detected. Your request may take longer than usual.',
    [ErrorType.CACHE_UNAVAILABLE]: 'Performance optimization is temporarily unavailable.',
    
    // Rate Limiting
    [ErrorType.RATE_LIMIT]: 'You\'re making requests too quickly. Please wait 60 seconds and try again.',
    [ErrorType.QUOTA_EXCEEDED]: 'You\'ve reached your usage limit. Please upgrade your plan or wait for the reset.',
    
    // Feature Toggles
    [ErrorType.FEATURE_DISABLED]: 'This feature is temporarily disabled. Please contact support for more information.',
    [ErrorType.FEATURE_TOGGLE_ERROR]: 'Feature availability check failed. Please try again.',
    
    // Security
    [ErrorType.ENCRYPTION_ERROR]: 'Security processing failed. Please try again or contact support.',
    [ErrorType.DECRYPTION_ERROR]: 'Unable to process encrypted data. This may indicate a configuration issue.',
    [ErrorType.SECURITY_ERROR]: 'Security validation failed. Please contact support if this persists.',
    
    // System
    [ErrorType.SYSTEM_ERROR]: 'We\'re experiencing technical difficulties. Our team has been notified.',
    [ErrorType.SERVICE_UNAVAILABLE]: 'Service is temporarily down for maintenance. Please try again soon.',
    [ErrorType.UNKNOWN_ERROR]: 'Something unexpected happened. Please try again or contact support.'
  };

  private static readonly RECOVERY_SUGGESTIONS: Record<ErrorType, string> = {
    // Network/Connection
    [ErrorType.CONNECTION_ERROR]: 'Check your internet connection and verify the service URL',
    [ErrorType.TIMEOUT_ERROR]: 'Reduce request size or increase timeout settings',
    [ErrorType.NETWORK_ERROR]: 'Check network connectivity and retry',

    // Authentication/Authorization
    [ErrorType.AUTH_ERROR]: 'Verify credentials and ensure account is active',
    [ErrorType.PERMISSION_ERROR]: 'Request proper permissions from administrator',
    [ErrorType.TOKEN_EXPIRED]: 'Refresh your authentication token',

    // Validation
    [ErrorType.VALIDATION_ERROR]: 'Review input data against schema requirements',
    [ErrorType.SCHEMA_ERROR]: 'Ensure data matches the expected schema',
    [ErrorType.REQUIRED_FIELD_ERROR]: 'Provide all required fields',

    // Provider
    [ErrorType.PROVIDER_ERROR]: 'Check provider status and configuration',
    [ErrorType.PROVIDER_CONFIG_ERROR]: 'Review provider documentation and update configuration',
    [ErrorType.PROVIDER_RATE_LIMIT]: 'Wait 60 seconds before retrying or upgrade your plan',
    [ErrorType.PROVIDER_QUOTA_EXCEEDED]: 'Upgrade provider plan or wait for quota reset',

    // Database
    [ErrorType.DATABASE_ERROR]: 'Check database status and retry',
    [ErrorType.DATABASE_CONNECTION_ERROR]: 'Check database connectivity and credentials',
    [ErrorType.TRANSACTION_ERROR]: 'Retry transaction or contact support',

    // Cache
    [ErrorType.CACHE_ERROR]: 'Clear cache and retry',
    [ErrorType.CACHE_UNAVAILABLE]: 'Service will use direct database queries',

    // Rate Limiting
    [ErrorType.RATE_LIMIT]: 'Implement exponential backoff in your requests',
    [ErrorType.QUOTA_EXCEEDED]: 'Wait for quota reset or upgrade plan',

    // Feature Toggle
    [ErrorType.FEATURE_DISABLED]: 'Contact administrator to enable this feature',
    [ErrorType.FEATURE_TOGGLE_ERROR]: 'Check feature toggle configuration',

    // Encryption/Security
    [ErrorType.ENCRYPTION_ERROR]: 'Verify encryption keys and configuration',
    [ErrorType.DECRYPTION_ERROR]: 'Check decryption keys and data format',
    [ErrorType.SECURITY_ERROR]: 'Review security settings and permissions',

    // System
    [ErrorType.SYSTEM_ERROR]: 'Contact support if issue persists',
    [ErrorType.SERVICE_UNAVAILABLE]: 'Wait and retry later',
    [ErrorType.UNKNOWN_ERROR]: 'Contact support with error details'
  };

  /**
   * Handle error with comprehensive processing
   */
  static handle(
    error: unknown,
    context: ErrorContext,
    _request?: NextRequest
  ): ErrorResponse {
    const errorType = this.categorizeError(error);
    const errorCode = this.generateErrorCode(errorType, context);
    const requestId = context.requestId || this.generateRequestId();
    const timestamp = new Date().toISOString();

    // Log error for debugging
    this.logError(error, errorType, context, requestId);

    return {
      success: false,
      error: {
        type: errorType,
        code: errorCode,
        message: this.ERROR_MESSAGES[errorType],
        userMessage: this.getUserMessage(errorType, error),
        details: this.extractErrorDetails(error, errorType),
        recovery: this.getRecoverySuggestion(errorType, error),
        documentation: this.getDocumentationLink(errorType),
        requestId,
        timestamp,
        retryable: this.isRetryable(errorType),
        retryAfter: this.getRetryDelay(errorType)
      }
    };
  }

  /**
   * Create Next.js response from error
   */
  static createResponse(
    error: unknown,
    context: ErrorContext,
    request?: NextRequest
  ): NextResponse {
    const errorResponse = this.handle(error, context, request);
    const httpStatus = this.getHttpStatus(errorResponse.error.type);
    
    const response = NextResponse.json(errorResponse, { status: httpStatus });
    
    // Add retry headers for retryable errors
    if (errorResponse.error.retryable && errorResponse.error.retryAfter) {
      response.headers.set('Retry-After', errorResponse.error.retryAfter.toString());
    }
    
    return response;
  }

  /**
   * Categorize error type
   */
  private static categorizeError(error: unknown): ErrorType {
    const err = error as Record<string, unknown>;

    // Helper to safely get response status
    const getResponseStatus = (response: unknown): number | undefined => {
      return response && typeof response === 'object' && 'status' in response
        ? (response as { status: unknown }).status as number
        : undefined;
    };

    // Network errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return ErrorType.CONNECTION_ERROR;
    }
    if (err.code === 'ETIMEDOUT' || (typeof err.message === 'string' && err.message.includes('timeout'))) {
      return ErrorType.TIMEOUT_ERROR;
    }
    if (err.code === 'ENETUNREACH' || err.code === 'EHOSTUNREACH') {
      return ErrorType.NETWORK_ERROR;
    }

    // HTTP status codes
    const responseStatus = getResponseStatus(err.response);
    if (err.status || responseStatus) {
      const status = err.status || responseStatus;
      switch (status) {
        case 401:
          return ErrorType.AUTH_ERROR;
        case 403:
          return ErrorType.PERMISSION_ERROR;
        case 422:
          return ErrorType.VALIDATION_ERROR;
        case 429:
          return ErrorType.RATE_LIMIT;
        case 502:
        case 503:
        case 504:
          return ErrorType.SERVICE_UNAVAILABLE;
      }
    }

    // Provider specific errors
    if (err.provider || (typeof err.message === 'string' && err.message.includes('provider'))) {
      if ((typeof err.message === 'string' && err.message.includes('config')) || (typeof err.message === 'string' && err.message.includes('credential'))) {
        return ErrorType.PROVIDER_CONFIG_ERROR;
      }
      if (typeof err.message === 'string' && err.message.includes('rate limit')) {
        return ErrorType.PROVIDER_RATE_LIMIT;
      }
      if (typeof err.message === 'string' && err.message.includes('quota')) {
        return ErrorType.PROVIDER_QUOTA_EXCEEDED;
      }
      return ErrorType.PROVIDER_ERROR;
    }

    // Database errors
    if ((typeof err.code === 'string' && err.code.startsWith('P')) || (typeof err.message === 'string' && err.message.includes('database'))) {
      if (typeof err.message === 'string' && err.message.includes('connection')) {
        return ErrorType.DATABASE_CONNECTION_ERROR;
      }
      return ErrorType.DATABASE_ERROR;
    }

    // Validation errors
    if (err.name === 'ZodError' || err.name === 'ValidationError') {
      return ErrorType.VALIDATION_ERROR;
    }

    // Feature toggle errors
    if (typeof err.message === 'string' && err.message.includes('feature') && err.message.includes('disabled')) {
      return ErrorType.FEATURE_DISABLED;
    }

    // Encryption errors
    if ((typeof err.message === 'string' && err.message.includes('decrypt')) || (typeof err.message === 'string' && err.message.includes('encrypt'))) {
      return (typeof err.message === 'string' && err.message.includes('decrypt'))
        ? ErrorType.DECRYPTION_ERROR
        : ErrorType.ENCRYPTION_ERROR;
    }

    // Cache errors
    if ((typeof err.message === 'string' && err.message.includes('cache')) || (typeof err.message === 'string' && err.message.includes('redis'))) {
      return ErrorType.CACHE_ERROR;
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Get user-friendly message
   */
  private static getUserMessage(errorType: ErrorType, error: unknown): string {
    const err = error as Record<string, unknown>;
    // Check for custom user message in error
    if (err.userMessage && typeof err.userMessage === 'string') {
      return err.userMessage;
    }

    return this.USER_MESSAGES[errorType];
  }

  /**
   * Extract relevant error details
   */
  private static extractErrorDetails(error: unknown, errorType: ErrorType): unknown {
    const details: Record<string, unknown> = {};
    const err = error as Record<string, unknown>;

    // Helper to safely get response status
    const getResponseStatus = (response: unknown): number | undefined => {
      return response && typeof response === 'object' && 'status' in response
        ? (response as { status: unknown }).status as number
        : undefined;
    };

    // Validation error details
    if (errorType === ErrorType.VALIDATION_ERROR && err.errors) {
      details.fields = err.errors;
    }

    // Provider error details
    if (errorType.toString().includes('PROVIDER') && err.provider) {
      details.provider = err.provider;
    }

    // HTTP error details
    const responseStatus = getResponseStatus(err.response);
    if (err.status || responseStatus) {
      details.httpStatus = err.status || responseStatus;
    }

    // Rate limit details
    if (errorType === ErrorType.RATE_LIMIT || errorType === ErrorType.PROVIDER_RATE_LIMIT) {
      details.resetTime = err.resetTime;
      details.limit = err.limit;
      details.remaining = err.remaining;
    }

    return Object.keys(details).length > 0 ? details : undefined;
  }

  /**
   * Get recovery suggestion
   */
  private static getRecoverySuggestion(errorType: ErrorType, _error: unknown): string | undefined {
    return this.RECOVERY_SUGGESTIONS[errorType];
  }

  /**
   * Get documentation link
   */
  private static getDocumentationLink(errorType: ErrorType): string | undefined {
    const docLinks: Partial<Record<ErrorType, string>> = {
      [ErrorType.PROVIDER_CONFIG_ERROR]: '/docs/email-providers',
      [ErrorType.VALIDATION_ERROR]: '/docs/api-reference',
      [ErrorType.AUTH_ERROR]: '/docs/authentication',
      [ErrorType.RATE_LIMIT]: '/docs/rate-limits'
    };

    return docLinks[errorType];
  }

  /**
   * Check if error is retryable
   */
  private static isRetryable(errorType: ErrorType): boolean {
    const retryableErrors = [
      ErrorType.TIMEOUT_ERROR,
      ErrorType.NETWORK_ERROR,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorType.DATABASE_CONNECTION_ERROR,
      ErrorType.CACHE_UNAVAILABLE,
      ErrorType.SYSTEM_ERROR
    ];

    return retryableErrors.includes(errorType);
  }

  /**
   * Get retry delay in seconds
   */
  private static getRetryDelay(errorType: ErrorType): number | undefined {
    const retryDelays: Partial<Record<ErrorType, number>> = {
      [ErrorType.TIMEOUT_ERROR]: 5,
      [ErrorType.NETWORK_ERROR]: 10,
      [ErrorType.SERVICE_UNAVAILABLE]: 60,
      [ErrorType.DATABASE_CONNECTION_ERROR]: 30,
      [ErrorType.RATE_LIMIT]: 60,
      [ErrorType.PROVIDER_RATE_LIMIT]: 60
    };

    return retryDelays[errorType];
  }

  /**
   * Get HTTP status code
   */
  private static getHttpStatus(errorType: ErrorType): number {
    const statusMap: Partial<Record<ErrorType, number>> = {
      [ErrorType.AUTH_ERROR]: 401,
      [ErrorType.TOKEN_EXPIRED]: 401,
      [ErrorType.PERMISSION_ERROR]: 403,
      [ErrorType.VALIDATION_ERROR]: 400,
      [ErrorType.SCHEMA_ERROR]: 400,
      [ErrorType.REQUIRED_FIELD_ERROR]: 400,
      [ErrorType.RATE_LIMIT]: 429,
      [ErrorType.PROVIDER_RATE_LIMIT]: 429,
      [ErrorType.QUOTA_EXCEEDED]: 429,
      [ErrorType.PROVIDER_QUOTA_EXCEEDED]: 429,
      [ErrorType.SERVICE_UNAVAILABLE]: 503,
      [ErrorType.TIMEOUT_ERROR]: 504,
      [ErrorType.FEATURE_DISABLED]: 422
    };

    return statusMap[errorType] || 500;
  }

  /**
   * Generate error code
   */
  private static generateErrorCode(errorType: ErrorType, context: ErrorContext): string {
    const prefix = context.operation?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'EMAIL';
    const timestamp = Date.now().toString(36);
    return `${prefix}_${errorType}_${timestamp}`;
  }

  /**
   * Generate request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error for debugging
   */
  private static logError(
    error: unknown,
    errorType: ErrorType,
    context: ErrorContext,
    requestId: string
  ): void {
    const err = error as Record<string, unknown>;
    const logData = {
      requestId,
      errorType,
      message: err.message,
      stack: err.stack,
      context,
      timestamp: new Date().toISOString()
    };

    // Use appropriate log level based on error type
    if (this.isCriticalError(errorType)) {
      console.error('CRITICAL ERROR:', logData);
    } else if (this.isWarningError(errorType)) {
      console.warn('WARNING ERROR:', logData);
    } else {
      console.info('INFO ERROR:', logData);
    }
  }

  /**
   * Check if error is critical
   */
  private static isCriticalError(errorType: ErrorType): boolean {
    const criticalErrors = [
      ErrorType.DATABASE_ERROR,
      ErrorType.SECURITY_ERROR,
      ErrorType.SYSTEM_ERROR,
      ErrorType.ENCRYPTION_ERROR,
      ErrorType.DECRYPTION_ERROR
    ];

    return criticalErrors.includes(errorType);
  }

  /**
   * Check if error is warning level
   */
  private static isWarningError(errorType: ErrorType): boolean {
    const warningErrors = [
      ErrorType.AUTH_ERROR,
      ErrorType.PERMISSION_ERROR,
      ErrorType.PROVIDER_ERROR,
      ErrorType.RATE_LIMIT
    ];

    return warningErrors.includes(errorType);
  }
}

// Export convenience function
export function handleError(
  error: unknown,
  context: ErrorContext,
  request?: NextRequest
): NextResponse {
  return ErrorHandler.createResponse(error, context, request);
}