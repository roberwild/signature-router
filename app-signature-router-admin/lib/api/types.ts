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
  status?: 'SENT' | 'VALIDATED' | 'EXPIRED' | 'FAILED' | 'PENDING';
  channel?: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
  page?: number;
  size?: number;
  sort?: string; // e.g., "createdAt,desc"
}

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

  // Providers
  getProviders(): Promise<Provider[]>;
  getProvider(id: string): Promise<Provider>;

  // Signatures
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
}

