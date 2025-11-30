// Configuración de la API para conectar con Spring Boot Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface APIError {
  message: string;
  status: number;
  timestamp: string;
  path: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error: APIError = await response.json();
        throw new Error(error.message || `API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Signature Request endpoints
  async getSignatureRequests(params?: {
    page?: number;
    size?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/signatures${queryParams ? `?${queryParams}` : ''}`);
  }

  async getSignatureById(id: string) {
    return this.request(`/signatures/${id}`);
  }

  // Routing Rule endpoints
  async getRoutingRules() {
    return this.request('/routing-rules');
  }

  async createRoutingRule(rule: any) {
    return this.request('/routing-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async updateRoutingRule(id: string, rule: any) {
    return this.request(`/routing-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  async deleteRoutingRule(id: string) {
    return this.request(`/routing-rules/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleRoutingRule(id: string, enabled: boolean) {
    return this.request(`/routing-rules/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  // Provider endpoints
  async getProviders() {
    return this.request('/providers');
  }

  async getProviderHealth(providerId: string) {
    return this.request(`/providers/${providerId}/health`);
  }

  // Metrics endpoints
  async getMetrics() {
    return this.request('/metrics');
  }

  async getChannelMetrics() {
    return this.request('/metrics/channels');
  }

  async getPerformanceMetrics() {
    return this.request('/metrics/performance');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL);

// Legacy export for backwards compatibility
export async function fetchFromAPI(endpoint: string, options?: RequestInit) {
  return apiClient.request(endpoint, options);
}
