/**
 * Mock Data para desarrollo y demos
 * Datos realistas que simulan respuestas del backend
 */

import type {
  DashboardMetrics,
  Provider,
  PaginatedSignatures,
  Signature,
  MetricsData,
  SecurityOverview,
  AccessEvent,
  Alert,
  User,
  RoutingRule,
} from './types';

// ============================================
// Dashboard Mock Data
// ============================================

export const mockDashboardMetrics: DashboardMetrics = {
  overview: {
    totalSignatures24h: 1234,
    totalSignatures7d: 8567,
    totalSignatures30d: 24567,
    successRate: 94.5,
    avgLatency: 245,
    activeProviders: 3,
    totalProviders: 4,
  },
  byChannel: {
    SMS: {
      count: 15000,
      successRate: 96.2,
      avgLatency: 180,
    },
    PUSH: {
      count: 8000,
      successRate: 92.5,
      avgLatency: 120,
    },
    VOICE: {
      count: 1500,
      successRate: 88.0,
      avgLatency: 450,
    },
    BIOMETRIC: {
      count: 67,
      successRate: 100.0,
      avgLatency: 90,
    },
  },
  latencyTimeline: [
    { date: '2025-11-24', p50: 145, p95: 420, p99: 750 },
    { date: '2025-11-25', p50: 150, p95: 430, p99: 780 },
    { date: '2025-11-26', p50: 142, p95: 410, p99: 740 },
    { date: '2025-11-27', p50: 155, p95: 440, p99: 800 },
    { date: '2025-11-28', p50: 148, p95: 425, p99: 770 },
    { date: '2025-11-29', p50: 152, p95: 435, p99: 790 },
    { date: '2025-11-30', p50: 150, p95: 420, p99: 780 },
  ],
  errorTimeline: [
    { date: '2025-11-24', errorRate: 5.2 },
    { date: '2025-11-25', errorRate: 4.8 },
    { date: '2025-11-26', errorRate: 5.5 },
    { date: '2025-11-27', errorRate: 6.1 },
    { date: '2025-11-28', errorRate: 5.0 },
    { date: '2025-11-29', errorRate: 5.3 },
    { date: '2025-11-30', errorRate: 5.5 },
  ],
};

// ============================================
// Providers Mock Data
// ============================================

export const mockProviders: Provider[] = [
  {
    id: 'twilio-sms',
    name: 'Twilio SMS',
    type: 'SMS',
    enabled: true,
    priority: 1,
    health: {
      status: 'UP',
      lastCheck: new Date().toISOString(),
      latency: 180,
    },
    config: {
      accountSidMasked: 'AC***************',
      fromNumber: '+34912345678',
    },
  },
  {
    id: 'firebase-fcm',
    name: 'Firebase FCM',
    type: 'PUSH',
    enabled: true,
    priority: 1,
    health: {
      status: 'UP',
      lastCheck: new Date().toISOString(),
      latency: 120,
    },
    config: {
      serverKeyMasked: 'AAAA***************',
    },
  },
  {
    id: 'twilio-voice',
    name: 'Twilio Voice',
    type: 'VOICE',
    enabled: true,
    priority: 1,
    health: {
      status: 'UP',
      lastCheck: new Date().toISOString(),
      latency: 450,
    },
    config: {
      accountSidMasked: 'AC***************',
      fromNumber: '+34987654321',
    },
  },
  {
    id: 'biocatch',
    name: 'BioCatch Biometric',
    type: 'BIOMETRIC',
    enabled: false,
    priority: 2,
    health: {
      status: 'DOWN',
      lastCheck: new Date().toISOString(),
      latency: 0,
    },
    config: {
      apiKeyMasked: 'BC***************',
    },
  },
];

// ============================================
// Signatures Mock Data
// ============================================

const generateMockSignatures = (count: number): Signature[] => {
  const statuses: Signature['status'][] = ['SENT', 'VALIDATED', 'EXPIRED', 'FAILED', 'PENDING'];
  const channels: Signature['channel'][] = ['SMS', 'PUSH', 'VOICE', 'BIOMETRIC'];
  const providers = ['twilio-sms', 'firebase-fcm', 'twilio-voice', 'biocatch'];

  return Array.from({ length: count }, (_, i) => {
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: `01JF${String(i).padStart(16, '0')}`,
      status,
      channel,
      recipient: {
        phoneNumber: `+346${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        maskedPhoneNumber: `+346****${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      },
      provider: providers[channels.indexOf(channel)],
      challengeId: `CH-${Math.random().toString(36).substring(7).toUpperCase()}`,
      createdAt: createdAt.toISOString(),
      sentAt: status !== 'PENDING' ? new Date(createdAt.getTime() + 1000).toISOString() : undefined,
      expiresAt: new Date(createdAt.getTime() + 3 * 60 * 1000).toISOString(),
      validatedAt: status === 'VALIDATED' ? new Date(createdAt.getTime() + 30000).toISOString() : undefined,
    };
  });
};

export const mockSignatures = generateMockSignatures(150);

export const mockPaginatedSignatures: PaginatedSignatures = {
  content: mockSignatures.slice(0, 20),
  totalElements: 150,
  totalPages: 8,
  page: 0,
  size: 20,
};

// ============================================
// Metrics Mock Data
// ============================================

export const mockMetricsData: MetricsData = {
  range: '7d',
  latency: {
    current: {
      p50: 150,
      p95: 450,
      p99: 780,
    },
    timeline: mockDashboardMetrics.latencyTimeline,
  },
  throughput: {
    current: 120,
    timeline: [
      { date: '2025-11-24', requestsPerMinute: 115 },
      { date: '2025-11-25', requestsPerMinute: 118 },
      { date: '2025-11-26', requestsPerMinute: 112 },
      { date: '2025-11-27', requestsPerMinute: 125 },
      { date: '2025-11-28', requestsPerMinute: 119 },
      { date: '2025-11-29', requestsPerMinute: 122 },
      { date: '2025-11-30', requestsPerMinute: 120 },
    ],
  },
  errorRate: {
    overall: 5.5,
    byChannel: {
      SMS: 3.8,
      PUSH: 7.5,
      VOICE: 12.0,
      BIOMETRIC: 0.0,
    },
    timeline: mockDashboardMetrics.errorTimeline,
  },
};

// ============================================
// Security Mock Data
// ============================================

export const mockSecurityOverview: SecurityOverview = {
  totalUsers: 45,
  users2FA: 38,
  activeTokens: 12,
  failedLogins24h: 3,
};

export const mockAccessEvents: AccessEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    username: 'admin@singularbank.com',
    ipAddress: '192.168.1.100',
    event: 'LOGIN_SUCCESS',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    username: 'operator@singularbank.com',
    ipAddress: '192.168.1.101',
    event: 'LOGIN_SUCCESS',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    username: 'unknown@example.com',
    ipAddress: '203.0.113.45',
    event: 'LOGIN_FAILED',
    userAgent: 'curl/7.68.0',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    username: 'viewer@singularbank.com',
    ipAddress: '192.168.1.102',
    event: 'LOGOUT',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
  },
];

// ============================================
// Alerts Mock Data
// ============================================

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    title: 'Provider Twilio Voice Down',
    description: 'Twilio Voice provider has been unreachable for 5 minutes. Error rate: 100%',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-2',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    title: 'High Error Rate on PUSH Channel',
    description: 'Firebase FCM error rate above threshold (7.5%). Current: 8.2%',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-3',
    severity: 'INFO',
    status: 'RESOLVED',
    title: 'SLO Target Missed',
    description: 'Monthly SLO target (99.5%) missed. Actual: 99.3%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-4',
    severity: 'WARNING',
    status: 'ACTIVE',
    title: 'Latency P95 Above Threshold',
    description: 'P95 latency is 485ms, above target of 450ms',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

// ============================================
// Users Mock Data
// ============================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@singularbank.com',
    firstName: 'Admin',
    lastName: 'User',
    enabled: true,
    roles: ['ADMIN', 'OPERATOR', 'VIEWER'],
    createdAt: '2025-01-15T10:00:00Z',
    lastAccess: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-2',
    username: 'operator1',
    email: 'operator@singularbank.com',
    firstName: 'María',
    lastName: 'García',
    enabled: true,
    roles: ['OPERATOR', 'VIEWER'],
    createdAt: '2025-02-01T14:30:00Z',
    lastAccess: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-3',
    username: 'viewer1',
    email: 'viewer@singularbank.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    enabled: true,
    roles: ['VIEWER'],
    createdAt: '2025-03-10T09:15:00Z',
    lastAccess: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-4',
    username: 'disabled_user',
    email: 'disabled@singularbank.com',
    firstName: 'Disabled',
    lastName: 'Account',
    enabled: false,
    roles: ['VIEWER'],
    createdAt: '2025-04-05T11:20:00Z',
  },
];

// ============================================
// Rules Mock Data
// ============================================

export const mockRules: RoutingRule[] = [
  {
    id: 'rule-1',
    name: 'High Risk → Biometric',
    description: 'Route high-risk transactions to biometric authentication',
    priority: 10,
    condition: "context.riskLevel == 'HIGH' && context.amount.value > 10000",
    targetChannel: 'BIOMETRIC',
    enabled: true,
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-15T14:30:00Z',
  },
  {
    id: 'rule-2',
    name: 'Premium Users → Push',
    description: 'Premium customers use push notifications by default',
    priority: 20,
    condition: "context.customer.segment == 'PREMIUM'",
    targetChannel: 'PUSH',
    enabled: true,
    createdAt: '2025-11-05T11:20:00Z',
    updatedAt: '2025-11-20T09:45:00Z',
  },
  {
    id: 'rule-3',
    name: 'Business Hours → SMS',
    description: 'Use SMS during business hours',
    priority: 30,
    condition: 'context.timestamp.hour >= 9 && context.timestamp.hour <= 21',
    targetChannel: 'SMS',
    enabled: true,
    createdAt: '2025-11-10T15:10:00Z',
    updatedAt: '2025-11-10T15:10:00Z',
  },
  {
    id: 'rule-4',
    name: 'Night Hours → Voice',
    description: 'Use voice calls during night for urgent transactions',
    priority: 40,
    condition: "(context.timestamp.hour < 9 || context.timestamp.hour > 21) && context.urgency == 'HIGH'",
    targetChannel: 'VOICE',
    enabled: false,
    createdAt: '2025-11-12T16:00:00Z',
    updatedAt: '2025-11-25T10:30:00Z',
  },
  {
    id: 'rule-5',
    name: 'International → Push',
    description: 'Use push for international customers to avoid SMS costs',
    priority: 50,
    condition: "!context.phoneNumber.startsWith('+34')",
    targetChannel: 'PUSH',
    enabled: true,
    createdAt: '2025-11-18T12:00:00Z',
    updatedAt: '2025-11-18T12:00:00Z',
  },
];

