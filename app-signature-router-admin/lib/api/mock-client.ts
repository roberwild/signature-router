/**
 * Mock API Client
 * Implementa IApiClient con datos simulados para desarrollo y demos
 */

import { config } from '../config';
import type {
  IApiClient,
  DashboardMetrics,
  Provider,
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
    this.log('POST', '/api/v1/admin/rules/validate-spel', { expression });

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
}

