/**
 * Mock API Client
 * Implementa IApiClient con datos simulados para desarrollo y demos
 */

import { config } from '../config';
import type {
  IApiClient,
  DashboardMetrics,
  Provider,
  ProviderMetrics,
  PaginatedSignatures,
  PaginatedSignatureRequests,
  Signature,
  SignatureRequest,
  SignatureFilters,
  MetricsData,
  SecurityOverview,
  AccessEvent,
  Alert,
  AlertFilters,
  User,
  CreateUserDto,
  UpdateUserDto,
  RoutingRule,
  CreateRuleDto,
  UpdateRuleDto,
  AuditLog,
  AuditStats,
  AuditFilterOptions,
  AuditSearchParams,
  PaginatedAuditLogs,
} from './types';

import {
  mockDashboardMetrics,
  mockProviders,
  mockSignatures,
  mockPaginatedSignatures,
  mockSignatureRequests,
  mockPaginatedSignatureRequests,
  mockMetricsData,
  mockSecurityOverview,
  mockAccessEvents,
  mockAlerts,
  mockUsers,
  mockRules,
  mockProvidersData,
  mockProviderTemplates,
} from './mock-data';

/**
 * MockApiClient - Simula llamadas a la API con datos mock
 */
export class MockApiClient implements IApiClient {
  /**
   * Simula latencia de red
   */
  private async delay<T>(data: T): Promise<T> {
    if (config.mockDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.mockDelay));
    }
    return data;
  }

  /**
   * Log de llamada mock (solo en desarrollo con debug activado)
   */
  private log(method: string, endpoint: string, params?: any) {
    if (config.enableDebugLogs) {
      console.log(`🎭 [MOCK] ${method} ${endpoint}`, params || '');
    }
  }

  // ============================================
  // Dashboard
  // ============================================

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    this.log('GET', '/api/v1/admin/dashboard/metrics');
    return this.delay(mockDashboardMetrics);
  }

  // ============================================
  // Providers
  // ============================================

  async getProviders(): Promise<Provider[]> {
    this.log('GET', '/api/v1/admin/providers');
    return this.delay(mockProviders);
  }

  async getProvider(id: string): Promise<Provider> {
    this.log('GET', `/api/v1/admin/providers/${id}`);
    const provider = mockProviders.find((p) => p.id === id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }
    return this.delay(provider);
  }

  // ============================================
  // Signatures
  // ============================================

  async getSignatures(filters?: SignatureFilters): Promise<PaginatedSignatures> {
    this.log('GET', '/api/v1/admin/signatures', filters);

    // Simular filtrado
    let filtered = [...mockSignatures];

    if (filters?.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    if (filters?.channel) {
      filtered = filtered.filter((s) => s.channel === filters.channel);
    }

    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((s) => new Date(s.createdAt) >= fromDate);
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter((s) => new Date(s.createdAt) <= toDate);
    }

    // Simular paginación
    const page = filters?.page || 0;
    const size = filters?.size || 20;
    const start = page * size;
    const end = start + size;

    return this.delay({
      content: filtered.slice(start, end),
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      page,
      size,
    });
  }

  async getSignature(id: string): Promise<Signature> {
    this.log('GET', `/api/v1/admin/signatures/${id}`);
    const signature = mockSignatures.find((s) => s.id === id);
    if (!signature) {
      throw new Error(`Signature not found: ${id}`);
    }
    return this.delay(signature);
  }

  // ============================================
  // Signature Requests (New Enhanced API)
  // ============================================

  async getSignatureRequests(filters?: SignatureFilters): Promise<PaginatedSignatureRequests> {
    this.log('GET', '/api/v1/admin/signature-requests', filters);

    // Simulate filtering
    let filtered = [...mockSignatureRequests];

    if (filters?.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    if (filters?.channel) {
      // Filter by primary channel (first challenge)
      filtered = filtered.filter((s) =>
        s.challenges.length > 0 && s.challenges[0].channelType === filters.channel
      );
    }

    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((s) => new Date(s.createdAt) >= fromDate);
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter((s) => new Date(s.createdAt) <= toDate);
    }

    // Simulate pagination
    const page = filters?.page || 0;
    const size = filters?.size || 20;
    const start = page * size;
    const end = start + size;

    return this.delay({
      content: filtered.slice(start, end),
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      page,
      size,
    });
  }

  async getSignatureRequest(id: string): Promise<SignatureRequest> {
    this.log('GET', `/api/v1/admin/signature-requests/${id}`);
    const request = mockSignatureRequests.find((s) => s.id === id);
    if (!request) {
      throw new Error(`Signature request not found: ${id}`);
    }
    return this.delay(request);
  }

  // ============================================
  // Metrics
  // ============================================

  async getMetrics(range: '1d' | '7d' | '30d', channel?: string): Promise<MetricsData> {
    this.log('GET', '/api/v1/admin/metrics', { range, channel });

    // Simular filtrado por rango y canal
    const data = { ...mockMetricsData, range };

    if (channel) {
      // Filtrar datos por canal específico
      const channelData = mockDashboardMetrics.byChannel[channel];
      if (channelData) {
        data.errorRate.overall = 100 - channelData.successRate;
      }
    }

    return this.delay(data);
  }

  // ============================================
  // Security
  // ============================================

  async getSecurityOverview(): Promise<SecurityOverview> {
    this.log('GET', '/api/v1/admin/security/overview');
    return this.delay(mockSecurityOverview);
  }

  async getAccessAudit(limit: number = 50): Promise<AccessEvent[]> {
    this.log('GET', '/api/v1/admin/security/access-audit', { limit });
    return this.delay(mockAccessEvents.slice(0, limit));
  }

  // ============================================
  // Alerts
  // ============================================

  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    this.log('GET', '/api/v1/admin/alerts', filters);

    let filtered = [...mockAlerts];

    if (filters?.severity) {
      filtered = filtered.filter((a) => a.severity === filters.severity);
    }

    if (filters?.status) {
      filtered = filtered.filter((a) => a.status === filters.status);
    }

    return this.delay(filtered);
  }

  async acknowledgeAlert(id: string): Promise<void> {
    this.log('PUT', `/api/v1/admin/alerts/${id}/acknowledge`);
    const alert = mockAlerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedAt = new Date().toISOString();
    }
    return this.delay(undefined);
  }

  async resolveAlert(id: string): Promise<void> {
    this.log('PUT', `/api/v1/admin/alerts/${id}/resolve`);
    const alert = mockAlerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
    }
    return this.delay(undefined);
  }

  // ============================================
  // Users
  // ============================================

  async getUsers(): Promise<User[]> {
    this.log('GET', '/api/v1/admin/users');
    return this.delay(mockUsers);
  }

  async getUser(id: string): Promise<User> {
    this.log('GET', `/api/v1/admin/users/${id}`);
    const user = mockUsers.find((u) => u.id === id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    return this.delay(user);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    this.log('POST', '/api/v1/admin/users', data);
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      enabled: true,
      roles: data.roles,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return this.delay(newUser);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    this.log('PUT', `/api/v1/admin/users/${id}`, data);
    const user = mockUsers.find((u) => u.id === id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    Object.assign(user, data);
    return this.delay(user);
  }

  async deleteUser(id: string): Promise<void> {
    this.log('DELETE', `/api/v1/admin/users/${id}`);
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index !== -1) {
      mockUsers.splice(index, 1);
    }
    return this.delay(undefined);
  }

  async updateUserRoles(id: string, roles: string[]): Promise<void> {
    this.log('PUT', `/api/v1/admin/users/${id}/roles`, { roles });
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.roles = roles;
    }
    return this.delay(undefined);
  }

  // ============================================
  // Rules
  // ============================================

  async getRules(): Promise<RoutingRule[]> {
    this.log('GET', '/api/v1/admin/rules');
    return this.delay(mockRules);
  }

  async getRule(id: string): Promise<RoutingRule> {
    this.log('GET', `/api/v1/admin/rules/${id}`);
    const rule = mockRules.find((r) => r.id === id);
    if (!rule) {
      throw new Error(`Rule not found: ${id}`);
    }
    return this.delay(rule);
  }

  async createRule(data: CreateRuleDto): Promise<RoutingRule> {
    this.log('POST', '/api/v1/admin/rules', data);
    const newRule: RoutingRule = {
      id: `rule-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRules.push(newRule);
    return this.delay(newRule);
  }

  async updateRule(id: string, data: UpdateRuleDto): Promise<RoutingRule> {
    this.log('PUT', `/api/v1/admin/rules/${id}`, data);
    const rule = mockRules.find((r) => r.id === id);
    if (!rule) {
      throw new Error(`Rule not found: ${id}`);
    }
    Object.assign(rule, data, { updatedAt: new Date().toISOString() });
    return this.delay(rule);
  }

  async deleteRule(id: string): Promise<void> {
    this.log('DELETE', `/api/v1/admin/rules/${id}`);
    const index = mockRules.findIndex((r) => r.id === id);
    if (index !== -1) {
      mockRules.splice(index, 1);
    }
    return this.delay(undefined);
  }

  async toggleRule(id: string, enabled: boolean): Promise<RoutingRule> {
    this.log('PATCH', `/api/v1/admin/rules/${id}/toggle`, { enabled });
    const rule = mockRules.find((r) => r.id === id);
    if (!rule) {
      throw new Error(`Rule not found: ${id}`);
    }
    rule.enabled = enabled;
    rule.updatedAt = new Date().toISOString();
    return this.delay(rule);
  }

  async validateSpel(expression: string): Promise<{ valid: boolean; message?: string }> {
    this.log('POST', '/api/v1/admin/routing-rules/validate-spel', { expression });

    // Validación básica mock
    if (!expression || expression.trim() === '') {
      return this.delay({
        valid: false,
        message: 'Expression cannot be empty',
      });
    }

    // Simular validación de sintaxis SpEL
    const hasInvalidChars = /[^\w\s.()'"=!<>&|+-/*]/.test(expression);
    if (hasInvalidChars) {
      return this.delay({
        valid: false,
        message: 'Invalid characters in SpEL expression',
      });
    }

    return this.delay({
      valid: true,
    });
  }

  // ============================================
  // Providers (Epic 13)
  // ============================================

  async getProviders(params?: { type?: string; enabled?: boolean }): Promise<{ providers: any[]; total_count: number }> {
    this.log('GET', '/api/v1/admin/providers', params);

    let providers = (mockProvidersData || []);

    if (params?.type) {
      providers = providers.filter((p: any) => p.provider_type === params.type);
    }
    if (params?.enabled !== undefined) {
      providers = providers.filter((p: any) => p.enabled === params.enabled);
    }

    return this.delay({
      providers,
      total_count: providers.length,
    });
  }

  async getProvider(id: string): Promise<any> {
    this.log('GET', `/api/v1/admin/providers/${id}`);

    const provider = (mockProvidersData || []).find((p: any) => p.id === id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }

    return this.delay(provider);
  }

  async createProvider(data: any): Promise<any> {
    this.log('POST', '/api/v1/admin/providers', data);

    const newProvider = {
      id: `provider-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'admin@bank.com',
      updated_by: 'admin@bank.com',
    };

    if (mockProvidersData) {
      (mockProvidersData as any[]).push(newProvider);
    }

    return this.delay(newProvider);
  }

  async updateProvider(id: string, data: any): Promise<any> {
    this.log('PUT', `/api/v1/admin/providers/${id}`, data);

    const index = (mockProvidersData || []).findIndex((p: any) => p.id === id);
    if (index === -1) {
      throw new Error(`Provider not found: ${id}`);
    }

    if (mockProvidersData) {
      (mockProvidersData as any[])[index] = {
        ...(mockProvidersData as any[])[index],
        ...data,
        updated_at: new Date().toISOString(),
        updated_by: 'admin@bank.com',
      };
      return this.delay((mockProvidersData as any[])[index]);
    }

    throw new Error('Mock providers data not available');
  }

  async deleteProvider(id: string): Promise<void> {
    this.log('DELETE', `/api/v1/admin/providers/${id}`);

    const provider = (mockProvidersData || []).find((p: any) => p.id === id);
    if (provider) {
      provider.enabled = false; // Soft delete
      provider.updated_at = new Date().toISOString();
    }

    return this.delay(undefined);
  }

  async testProvider(id: string, data: { test_destination: string; test_message?: string }): Promise<any> {
    this.log('POST', `/api/v1/admin/providers/${id}/test`, data);

    const provider = (mockProvidersData || []).find((p: any) => p.id === id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }

    // Simulate test result
    const success = provider.enabled && Math.random() > 0.2; // 80% success rate for enabled providers

    return this.delay({
      success,
      message: success ? 'Provider test successful' : 'Provider test failed',
      response_time_ms: Math.floor(Math.random() * 500) + 100,
      tested_at: new Date().toISOString(),
      error_details: success ? undefined : 'Simulated connection timeout',
    });
  }

  async getProviderTemplates(type?: string): Promise<any[]> {
    this.log('GET', '/api/v1/admin/providers/templates', { type });

    const templates = mockProviderTemplates || [];

    if (type) {
      return this.delay(templates.filter((t: any) => t.provider_type === type));
    }

    return this.delay(templates);
  }

  // ============================================
  // Providers - MuleSoft Integration (Epic 13)
  // ============================================

  async getProviderCatalog(params?: { type?: string; enabled?: boolean }): Promise<{ providers: any[]; total_count: number }> {
    this.log('GET', '/api/v1/admin/providers/catalog', params);

    let providers = mockProvidersData || [];

    if (params?.type) {
      providers = providers.filter((p: any) => p.provider_type === params.type);
    }

    if (params?.enabled !== undefined) {
      providers = providers.filter((p: any) => p.enabled === params.enabled);
    }

    return this.delay({
      providers,
      total_count: providers.length,
    });
  }

  async syncProvidersFromMuleSoft(): Promise<{ synced: number; message: string }> {
    this.log('POST', '/api/v1/admin/providers/sync');

    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const synced = mockProvidersData?.length || 0;

    return {
      synced,
      message: `Successfully synced ${synced} providers from MuleSoft`,
    };
  }

  async toggleProvider(id: string, action: 'enable' | 'disable'): Promise<any> {
    this.log('PUT', `/api/v1/admin/providers/${id}/${action}`);

    const provider = (mockProvidersData || []).find((p: any) => p.id === id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }

    // Simulate toggle
    provider.enabled = action === 'enable';

    return this.delay({
      ...provider,
      updated_at: new Date().toISOString(),
    });
  }

  async updateProviderPriority(id: string, priority: number): Promise<any> {
    this.log('PUT', `/api/v1/admin/providers/${id}/priority`, { priority });

    const provider = (mockProvidersData || []).find((p: any) => p.id === id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }

    // Simulate priority update
    provider.priority = priority;

    return this.delay({
      ...provider,
      updated_at: new Date().toISOString(),
    });
  }

  async testProviderHealth(id: string): Promise<{ healthy: boolean; latencyMs?: number; error?: string }> {
    this.log('GET', `/api/v1/admin/providers/${id}/health`);

    const provider = (mockProvidersData || []).find((p: any) => p.id === id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }

    // Simulate health check
    const healthy = provider.enabled && Math.random() > 0.1; // 90% healthy if enabled
    const latencyMs = healthy ? Math.floor(Math.random() * 200) + 20 : undefined;
    const error = healthy ? undefined : 'Connection timeout';

    return this.delay({
      healthy,
      latencyMs,
      error,
    });
  }

  // ========================================
  // Provider Metrics (Epic 14 - MuleSoft Integration Ready)
  // ========================================

  async getProviderMetrics(providerId: string): Promise<ProviderMetrics> {
    this.log('GET', `/api/v1/admin/providers/${providerId}/metrics`);

    // Generate realistic mock metrics
    const mockMetrics: ProviderMetrics = {
      provider_id: providerId,
      provider_name: 'Mock Provider',

      // Request Metrics
      requests_today: Math.floor(Math.random() * 10000) + 500,
      requests_7d: Math.floor(Math.random() * 50000) + 5000,
      requests_30d: Math.floor(Math.random() * 200000) + 20000,
      success_rate: 95 + Math.random() * 4.9,
      failed_requests_today: Math.floor(Math.random() * 100),

      // Latency Metrics
      avg_response_time: 0.8 + Math.random() * 1.5,
      latency_p50_ms: 80 + Math.floor(Math.random() * 50),
      latency_p95_ms: 200 + Math.floor(Math.random() * 100),
      latency_p99_ms: 400 + Math.floor(Math.random() * 150),

      // Availability Metrics
      uptime: 99 + Math.random() * 0.9,
      health_check_failures_24h: Math.floor(Math.random() * 3),
      seconds_since_last_health_check: 30 + Math.floor(Math.random() * 90),

      // Cost Metrics
      cost_per_request_eur: 0.01 + Math.random() * 0.09,
      total_cost_today_eur: 50 + Math.random() * 450,
      total_cost_month_eur: 1500 + Math.random() * 13500,

      // MuleSoft Integration
      mulesoft_integrated: false,
      mulesoft_provider_id: null,
      calculated_at: new Date().toISOString(),
    };

    return this.delay(mockMetrics);
  }

  // ============================================
  // Audit Log (Epic 17)
  // ============================================

  async getAuditLogs(page = 0, size = 20): Promise<PaginatedAuditLogs> {
    this.log('GET', `/api/v1/admin/audit?page=${page}&size=${size}`);

    // Generate mock audit logs
    const mockAuditLogs: AuditLog[] = Array.from({ length: size }, (_, i) => ({
      id: `audit-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      userId: `user-${Math.floor(Math.random() * 10)}`,
      username: ['admin', 'user1', 'operator2', 'auditor1'][Math.floor(Math.random() * 4)],
      operation: ['CREATE', 'UPDATE', 'DELETE', 'READ'][Math.floor(Math.random() * 4)],
      entityType: ['ROUTING_RULE', 'PROVIDER', 'USER', 'SIGNATURE'][Math.floor(Math.random() * 4)],
      entityId: `entity-${Math.floor(Math.random() * 100)}`,
      entityName: `Entity ${Math.floor(Math.random() * 100)}`,
      changes: { field1: 'oldValue', field2: 'newValue' },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: Math.random() > 0.1,
      errorMessage: Math.random() > 0.9 ? 'Permission denied' : undefined,
      metadata: { source: 'admin-panel' },
    }));

    return this.delay({
      content: mockAuditLogs,
      totalElements: 1000,
      totalPages: Math.ceil(1000 / size),
      number: page,
      size,
    });
  }

  async searchAuditLogs(params: AuditSearchParams): Promise<PaginatedAuditLogs> {
    this.log('GET', '/api/v1/admin/audit/search', params);

    // Generate filtered mock audit logs
    const size = params.size || 20;
    const page = params.page || 0;

    const mockAuditLogs: AuditLog[] = Array.from({ length: size }, (_, i) => ({
      id: `audit-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      userId: `user-${Math.floor(Math.random() * 10)}`,
      username: params.username || ['admin', 'user1', 'operator2', 'auditor1'][Math.floor(Math.random() * 4)],
      operation: params.operation || ['CREATE', 'UPDATE', 'DELETE', 'READ'][Math.floor(Math.random() * 4)],
      entityType: params.entityType || ['ROUTING_RULE', 'PROVIDER', 'USER', 'SIGNATURE'][Math.floor(Math.random() * 4)],
      entityId: `entity-${Math.floor(Math.random() * 100)}`,
      entityName: `Entity ${Math.floor(Math.random() * 100)}`,
      changes: { field1: 'oldValue', field2: 'newValue' },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: Math.random() > 0.1,
      errorMessage: Math.random() > 0.9 ? 'Permission denied' : undefined,
      metadata: { source: 'admin-panel' },
    }));

    return this.delay({
      content: mockAuditLogs,
      totalElements: 500,
      totalPages: Math.ceil(500 / size),
      number: page,
      size,
    });
  }

  async getEntityAuditHistory(entityId: string): Promise<AuditLog[]> {
    this.log('GET', `/api/v1/admin/audit/entity/${entityId}`);

    const mockHistory: AuditLog[] = Array.from({ length: 5 }, (_, i) => ({
      id: `audit-${entityId}-${i}`,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      userId: `user-${Math.floor(Math.random() * 10)}`,
      username: ['admin', 'user1', 'operator2'][Math.floor(Math.random() * 3)],
      operation: ['CREATE', 'UPDATE', 'DELETE'][i % 3],
      entityType: 'ROUTING_RULE',
      entityId,
      entityName: `Entity ${entityId}`,
      changes: { field1: `value${i}`, field2: `value${i + 1}` },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0',
      success: true,
      metadata: { source: 'admin-panel' },
    }));

    return this.delay(mockHistory);
  }

  async getAuditStats(): Promise<AuditStats> {
    this.log('GET', '/api/v1/admin/audit/stats');

    const mockStats: AuditStats = {
      totalLogs: 10000,
      createOperations: 3000,
      updateOperations: 5000,
      deleteOperations: 2000,
      byEntityType: {
        ROUTING_RULE: 4000,
        PROVIDER: 3000,
        USER: 2000,
        SIGNATURE: 1000,
      },
    };

    return this.delay(mockStats);
  }

  async getAuditFilterOptions(): Promise<AuditFilterOptions> {
    this.log('GET', '/api/v1/admin/audit/filters');

    const mockFilters: AuditFilterOptions = {
      operations: ['CREATE', 'UPDATE', 'DELETE', 'READ'],
      entityTypes: ['ROUTING_RULE', 'PROVIDER', 'USER', 'SIGNATURE'],
    };

    return this.delay(mockFilters);
  }
}

