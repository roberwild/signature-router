/**
 * Real API Client
 * Implementa IApiClient con llamadas reales al backend Spring Boot
 */

import { config } from '../config';
import { auth } from '@/auth';
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

/**
 * RealApiClient - Conecta con el backend real
 */
export class RealApiClient implements IApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  /**
   * Wrapper genérico para fetch con manejo de errores
   * Nota: El token se debe pasar desde el componente que llama
   */
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    if (config.enableDebugLogs) {
      console.log(`🌐 [REAL] ${options?.method || 'GET'} ${endpoint}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: AbortSignal.timeout(config.apiTimeout),
      });

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          console.error('❌ Unauthorized - Token inválido o expirado');
          // Redirigir al login (esto será manejado por el middleware)
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin?error=SessionExpired';
          }
          throw new Error('Sesión expirada o no autorizada');
        }

        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ API Error [${endpoint}]:`, error.message);
        throw error;
      }
      throw new Error('Unknown API error');
    }
  }

  // ============================================
  // Dashboard
  // ============================================

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.fetch('/admin/dashboard/metrics');
  }

  // ============================================
  // Providers
  // ============================================

  async getProviders(): Promise<Provider[]> {
    return this.fetch('/admin/providers');
  }

  async getProvider(id: string): Promise<Provider> {
    return this.fetch(`/admin/providers/${id}`);
  }

  // ============================================
  // Signatures
  // ============================================

  async getSignatures(filters?: SignatureFilters): Promise<PaginatedSignatures> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.channel) params.append('channel', filters.channel);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.size !== undefined) params.append('size', filters.size.toString());
    if (filters?.sort) params.append('sort', filters.sort);

    const queryString = params.toString();
    return this.fetch(`/admin/signatures${queryString ? `?${queryString}` : ''}`);
  }

  async getSignature(id: string): Promise<Signature> {
    return this.fetch(`/admin/signatures/${id}`);
  }

  // ============================================
  // Signature Requests (New Enhanced API)
  // ============================================

  async getSignatureRequests(filters?: SignatureFilters): Promise<PaginatedSignatureRequests> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.channel) params.append('channel', filters.channel);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.size !== undefined) params.append('size', filters.size.toString());
    if (filters?.sort) params.append('sort', filters.sort);

    const queryString = params.toString();
    return this.fetch(`/admin/signatures${queryString ? `?${queryString}` : ''}`);
  }

  async getSignatureRequest(id: string): Promise<SignatureRequest> {
    return this.fetch(`/admin/signatures/${id}`);
  }

  // ============================================
  // Metrics
  // ============================================

  async getMetrics(range: '1d' | '7d' | '30d', channel?: string): Promise<MetricsData> {
    const params = new URLSearchParams({ range });
    if (channel) params.append('channel', channel);
    return this.fetch(`/admin/metrics?${params.toString()}`);
  }

  // ============================================
  // Security
  // ============================================

  async getSecurityOverview(): Promise<SecurityOverview> {
    return this.fetch('/admin/security/overview');
  }

  async getAccessAudit(limit: number = 50): Promise<AccessEvent[]> {
    return this.fetch(`/admin/security/access-audit?limit=${limit}`);
  }

  // ============================================
  // Alerts
  // ============================================

  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    return this.fetch(`/admin/alerts${queryString ? `?${queryString}` : ''}`);
  }

  async acknowledgeAlert(id: string): Promise<void> {
    return this.fetch(`/admin/alerts/${id}/acknowledge`, {
      method: 'PUT',
    });
  }

  async resolveAlert(id: string): Promise<void> {
    return this.fetch(`/admin/alerts/${id}/resolve`, {
      method: 'PUT',
    });
  }

  // ============================================
  // Users
  // ============================================

  async getUsers(): Promise<User[]> {
    return this.fetch('/admin/users');
  }

  async getUser(id: string): Promise<User> {
    return this.fetch(`/admin/users/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.fetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    return this.fetch(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.fetch(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateUserRoles(id: string, roles: string[]): Promise<void> {
    return this.fetch(`/admin/users/${id}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles }),
    });
  }

  // ============================================
  // Rules
  // ============================================

  async getRules(): Promise<RoutingRule[]> {
    return this.fetch('/admin/rules');
  }

  async getRule(id: string): Promise<RoutingRule> {
    return this.fetch(`/admin/rules/${id}`);
  }

  async createRule(data: CreateRuleDto): Promise<RoutingRule> {
    return this.fetch('/admin/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRule(id: string, data: UpdateRuleDto): Promise<RoutingRule> {
    return this.fetch(`/admin/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRule(id: string): Promise<void> {
    return this.fetch(`/admin/rules/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleRule(id: string, enabled: boolean): Promise<RoutingRule> {
    return this.fetch(`/admin/rules/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  async validateSpel(expression: string): Promise<{ valid: boolean; message?: string }> {
    return this.fetch('/admin/rules/validate-spel', {
      method: 'POST',
      body: JSON.stringify({ expression }),
    });
  }

  // ============================================
  // Providers (Epic 13)
  // ============================================

  async getProviders(params?: { type?: string; enabled?: boolean }): Promise<{ providers: any[]; total_count: number }> {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.enabled !== undefined) query.append('enabled', params.enabled.toString());

    return this.fetch(`/admin/providers${query.toString() ? '?' + query.toString() : ''}`);
  }

  async getProvider(id: string): Promise<any> {
    return this.fetch(`/admin/providers/${id}`);
  }

  async createProvider(data: any): Promise<any> {
    return this.fetch('/admin/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProvider(id: string, data: any): Promise<any> {
    return this.fetch(`/admin/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProvider(id: string): Promise<void> {
    return this.fetch(`/admin/providers/${id}`, {
      method: 'DELETE',
    });
  }

  async testProvider(id: string, data: { test_destination: string; test_message?: string }): Promise<any> {
    return this.fetch(`/admin/providers/${id}/test`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProviderTemplates(type?: string): Promise<any[]> {
    const query = type ? `?type=${type}` : '';
    return this.fetch(`/admin/providers/templates${query}`);
  }
}

