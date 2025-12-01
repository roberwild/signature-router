/**
 * Tipos compartidos para la API
 */

// ============================================
// Dashboard Types
// ============================================

export interface DashboardMetrics {
  overview: {
    totalSignatures24h: number;
    totalSignatures7d: number;
    totalSignatures30d: number;
    successRate: number;
    avgLatency: number;
    activeProviders: number;
    totalProviders: number;
  };
  byChannel: {
    [key: string]: {
      count: number;
      successRate: number;
      avgLatency: number;
    };
  };
  latencyTimeline: Array<{
    date: string;
    p50: number;
    p95: number;
    p99: number;
  }>;
  errorTimeline: Array<{
    date: string;
    errorRate: number;
  }>;
}

// ============================================
// Provider Types
// ============================================

export interface Provider {
  id: string;
  name: string;
  type: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  enabled: boolean;
  priority: number;
  health: {
    status: 'UP' | 'DOWN' | 'DEGRADED';
    lastCheck: string;
    latency: number;
  };
  config: {
    [key: string]: string;
  };
}

// ============================================
// Signature Types
// ============================================

export interface SignatureFilters {
  status?: 'PENDING' | 'SENT' | 'SIGNED' | 'EXPIRED' | 'FAILED' | 'ABORTED';
  channel?: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
  page?: number;
  size?: number;
  sort?: string; // e.g., "createdAt,desc"
}

export interface RoutingEvent {
  timestamp: string; // ISO 8601
  eventType: string; // e.g., "CHALLENGE_SENT", "FALLBACK_TRIGGERED", "SIGNATURE_COMPLETED"
  fromChannel?: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC' | null;
  toChannel?: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC' | null;
  reason: string;
}

export interface TransactionContext {
  amount: number;
  currency: string;
  transactionType: string;
  description?: string;
  metadata?: { [key: string]: any };
}

export interface ProviderResult {
  providerId: string;
  providerName: string;
  providerType: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  transactionId?: string;
  externalReference?: string;
  responseCode?: string;
  responseMessage?: string;
  timestamp: string;
  metadata?: { [key: string]: any };
}

export interface SignatureChallenge {
  id: string;
  channelType: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  provider: 'TWILIO' | 'AWS_SNS' | 'ONESIGNAL' | 'FCM' | 'VONAGE' | 'AWS_CONNECT' | 'BIOCATCH' | 'IOVATION';
  status: 'PENDING' | 'SENT' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  challengeCode?: string;
  sentAt?: string;
  expiresAt: string;
  completedAt?: string; // NEW: Story 1.6 - Challenge completion timestamp
  providerProof?: ProviderResult;
  errorCode?: string;
  createdAt: string;
}

export interface SignatureRequest {
  id: string;
  customerId: string;
  transactionContext: TransactionContext;
  status: 'PENDING' | 'SENT' | 'SIGNED' | 'EXPIRED' | 'FAILED' | 'ABORTED';
  challenges: SignatureChallenge[];
  routingTimeline: RoutingEvent[]; // NEW: Story 1.6 - Complete audit trail
  createdAt: string;
  expiresAt: string;
  signedAt?: string; // NEW: Story 1.6 - Signature completion timestamp
  abortedAt?: string;
  abortReason?: 'USER_CANCELLED' | 'FRAUD_DETECTED' | 'TIMEOUT' | 'SYSTEM_ERROR' | 'ADMIN_ACTION';
}

// Legacy interface for backward compatibility
export interface Signature {
  id: string;
  status: 'SENT' | 'VALIDATED' | 'EXPIRED' | 'FAILED' | 'PENDING';
  channel: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  recipient: {
    phoneNumber: string;
    maskedPhoneNumber: string;
  };
  provider: string;
  challengeId: string;
  createdAt: string;
  sentAt?: string;
  expiresAt: string;
  validatedAt?: string;
}

export interface PaginatedSignatureRequests {
  content: SignatureRequest[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Legacy pagination interface
export interface PaginatedSignatures {
  content: Signature[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ============================================
// Metrics Types
// ============================================

export interface MetricsData {
  range: '1d' | '7d' | '30d';
  latency: {
    current: {
      p50: number;
      p95: number;
      p99: number;
    };
    timeline: Array<{
      date: string;
      p50: number;
      p95: number;
      p99: number;
    }>;
  };
  throughput: {
    current: number;
    timeline: Array<{
      date: string;
      requestsPerMinute: number;
    }>;
  };
  errorRate: {
    overall: number;
    byChannel: {
      [key: string]: number;
    };
    timeline: Array<{
      date: string;
      errorRate: number;
    }>;
  };
  // NEW: Duration analytics using signedAt field
  signatureDuration: {
    average: number;
    median: number;
    p95: number;
    byChannel: {
      [key: string]: {
        average: number;
        median: number;
        p95: number;
      };
    };
    timeline: Array<{
      date: string;
      average: number;
      median: number;
    }>;
  };
  // NEW: Challenge completion analytics using completedAt field
  challengeCompletion: {
    averageResponseTime: number;
    byChannel: {
      [key: string]: {
        averageResponseTime: number;
        completionRate: number;
        totalChallenges: number;
      };
    };
    timeline: Array<{
      date: string;
      avgResponseTime: number;
      completionRate: number;
    }>;
  };
  // NEW: Fallback analytics from routing timeline
  fallbackMetrics: {
    fallbackRate: number;
    totalFallbacks: number;
    byChannelTransition: {
      [key: string]: number; // e.g., "SMS->PUSH": 45
    };
    timeline: Array<{
      date: string;
      fallbackCount: number;
      fallbackRate: number;
    }>;
  };
}

// ============================================
// Security Types
// ============================================

export interface SecurityOverview {
  totalUsers: number;
  users2FA: number;
  activeTokens: number;
  failedLogins24h: number;
}

export interface AccessEvent {
  id: string;
  timestamp: string;
  username: string;
  ipAddress: string;
  event: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT';
  userAgent: string;
}

// ============================================
// Alert Types
// ============================================

export interface AlertFilters {
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface Alert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  title: string;
  description: string;
  timestamp: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  roles: string[];
  createdAt: string;
  lastAccess?: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  roles?: string[];
}

// ============================================
// Rule Types (ya existentes, agregados para completitud)
// ============================================

export interface RoutingRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  condition: string; // SpEL expression
  targetChannel: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleDto {
  name: string;
  description?: string;
  priority: number;
  condition: string;
  targetChannel: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  enabled: boolean;
}

export interface UpdateRuleDto extends Partial<CreateRuleDto> {}

// ============================================
// API Client Interface
// ============================================

/**
 * Interfaz común que deben implementar tanto MockApiClient como RealApiClient
 */
export interface IApiClient {
  // Dashboard
  getDashboardMetrics(): Promise<DashboardMetrics>;

  // Signatures (New Enhanced API)
  getSignatureRequests(filters?: SignatureFilters): Promise<PaginatedSignatureRequests>;
  getSignatureRequest(id: string): Promise<SignatureRequest>;

  // Signatures (Legacy - for backward compatibility)
  getSignatures(filters?: SignatureFilters): Promise<PaginatedSignatures>;
  getSignature(id: string): Promise<Signature>;

  // Metrics
  getMetrics(range: '1d' | '7d' | '30d', channel?: string): Promise<MetricsData>;

  // Security
  getSecurityOverview(): Promise<SecurityOverview>;
  getAccessAudit(limit?: number): Promise<AccessEvent[]>;

  // Alerts
  getAlerts(filters?: AlertFilters): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<void>;
  resolveAlert(id: string): Promise<void>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
  updateUser(id: string, data: UpdateUserDto): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateUserRoles(id: string, roles: string[]): Promise<void>;

  // Rules
  getRules(): Promise<RoutingRule[]>;
  getRule(id: string): Promise<RoutingRule>;
  createRule(data: CreateRuleDto): Promise<RoutingRule>;
  updateRule(id: string, data: UpdateRuleDto): Promise<RoutingRule>;
  deleteRule(id: string): Promise<void>;
  toggleRule(id: string, enabled: boolean): Promise<RoutingRule>;
  validateSpel(expression: string): Promise<{ valid: boolean; message?: string }>;

  // Providers (Epic 13 - CRUD Management)
  getProviders(params?: { type?: string; enabled?: boolean }): Promise<{ providers: any[]; total_count: number }>;
  getProvider(id: string): Promise<any>;
  createProvider(data: any): Promise<any>;
  updateProvider(id: string, data: any): Promise<any>;
  deleteProvider(id: string): Promise<void>;
  testProvider(id: string, data: { test_destination: string; test_message?: string }): Promise<any>;
  getProviderTemplates(type?: string): Promise<any[]>;
}

