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
    // Epic 14: New fields for complete dashboard integration
    activeSignatures: number;
    routingRulesCount: number;
    circuitBreakersOpen: number;
    failedSignatures24h: number;
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
  // Epic 14: New fields for complete dashboard integration
  providerHealth: Array<{
    name: string;
    type: string;
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    circuitState: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
    relativeTime: string;
  }>;
  hourlyData: Array<{
    hour: string;
    total: number;
    successful: number;
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

/**
 * Provider Metrics - Epic 14
 * Operational metrics for a signature provider including:
 * - Request counts and success rates (internal metrics)
 * - Response times and latency (from MuleSoft when available)
 * - Uptime and availability (from MuleSoft health checks)
 * - Cost information (from MuleSoft when available)
 */
export interface ProviderMetrics {
  provider_id: string;
  provider_name: string;
  
  // Request Metrics (Internal)
  requests_today: number;
  requests_7d: number;
  requests_30d: number;
  success_rate: number;
  failed_requests_today: number;
  
  // Latency Metrics (From MuleSoft)
  avg_response_time: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
  latency_p99_ms: number;
  
  // Availability Metrics (From MuleSoft)
  uptime: number;
  health_check_failures_24h: number;
  seconds_since_last_health_check: number;
  
  // Cost Metrics (From MuleSoft)
  cost_per_request_eur: number;
  total_cost_today_eur: number;
  total_cost_month_eur: number;
  
  // MuleSoft Integration Metadata
  mulesoft_integrated: boolean;
  mulesoft_provider_id: string | null;
  calculated_at: string;
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
  amount: {
    amount: string;
    currency: string;
  };
  hash?: string;
  merchantId?: string;
  orderId?: string;
  description?: string;
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
  userId?: string;
  ipAddress: string;
  eventType: 'LOGIN' | 'LOGOUT' | 'LOGIN_ERROR';
  success: boolean;
  error?: string;
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
  fullName: string;
  firstName: string;
  lastName: string;
  roles: string[];
  primaryRole: string;
  department?: string;
  enabled: boolean; // maps to 'active' from backend
  firstLoginAt?: string;
  lastAccess?: string; // maps to 'lastLoginAt' from backend
  loginCount: number;
  lastLoginIp?: string;
}

export interface UsersListResponse {
  users: User[];
  stats: {
    total: number;
    active: number;
    admins: number;
    operators: number;
    viewers: number;
  };
  lastSyncAt: string;
  dataSource: string;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

// Legacy DTOs - kept for compatibility but Users are read-only
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
  providerId?: string; // UUID of the provider to use
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
  providerId?: string; // UUID of the provider to use
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
  
  // Provider Metrics (Epic 14 - MuleSoft Integration Ready)
  getProviderMetrics(providerId: string): Promise<ProviderMetrics>;
}

