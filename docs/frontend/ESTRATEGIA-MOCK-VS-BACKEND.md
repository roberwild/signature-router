# 🔄 Estrategia Mock vs Backend Real - Frontend

**Proyecto:** Signature Router - Admin Panel  
**Fecha:** 2025-11-30  
**Autor:** Equipo Frontend  
**Versión:** 1.0

---

## 🎯 Objetivo

Permitir **cambiar entre datos Mock y Backend Real de forma instantánea** mediante configuración, sin modificar código.

### Casos de Uso

1. **Demo a stakeholders**: Mostrar UI funcional aunque el backend no esté listo
2. **Desarrollo desacoplado**: Frontend puede avanzar sin esperar al backend
3. **Testing local**: Probar UI sin necesidad de levantar el backend
4. **Presentaciones**: Mostrar funcionalidades "en desarrollo" con datos mock
5. **CI/CD**: Tests de UI sin dependencias externas

---

## 🏗️ Arquitectura de la Solución

### Concepto: Adapter Pattern con Feature Flag

```
┌────────────────────────────────────────────────────┐
│              React Components                      │
│      (Providers, Rules, Documents, etc.)           │
└────────────────────┬───────────────────────────────┘
                     │
                     │ usa
                     ▼
┌────────────────────────────────────────────────────┐
│              API Client Service                    │
│                                                    │
│  if (USE_MOCK_DATA) {                             │
│    return MockApiClient                           │
│  } else {                                         │
│    return RealApiClient                           │
│  }                                                │
└────────────────────┬───────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ MockApiClient│          │RealApiClient │
│              │          │              │
│ - Datos JSON │          │ - fetch()    │
│ - localStorage│         │ - axios      │
│ - Fixtures   │          │ - Backend    │
└──────────────┘          └──────────────┘
```

### Principio Clave: Misma Interface

Ambos clientes (Mock y Real) implementan **la misma interface**, por lo que el código de React **NO cambia**.

```typescript
// Interface común
interface ApiClient {
  getProviders(): Promise<Provider[]>;
  createProvider(data: CreateProviderDto): Promise<Provider>;
  updateProvider(id: string, data: UpdateProviderDto): Promise<Provider>;
  deleteProvider(id: string): Promise<void>;
  // ... más métodos
}

// Implementación Mock
class MockApiClient implements ApiClient {
  async getProviders(): Promise<Provider[]> {
    return MOCK_PROVIDERS; // Datos hardcodeados
  }
}

// Implementación Real
class RealApiClient implements ApiClient {
  async getProviders(): Promise<Provider[]> {
    const response = await fetch('/api/v1/providers');
    return response.json();
  }
}
```

---

## 💻 Implementación Técnica

### 1. Variables de Entorno

```bash
# .env.local (desarrollo con mock)
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# .env.development (desarrollo con backend real)
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# .env.production
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_BASE_URL=https://api.company.com
```

### 2. Configuración Centralizada

```typescript
// lib/config.ts
export const config = {
  // Feature Flags
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  apiTimeout: 10000,
  
  // Mock Configuration
  mockDelay: 500, // Simular latencia de red (ms)
  mockErrorRate: 0, // 0-100 (% de requests que fallan)
} as const;
```

### 3. Interface Común (Contrato)

```typescript
// lib/api/types.ts

// DTOs
export interface Provider {
  id: string;
  name: string;
  type: 'SMS' | 'VOICE' | 'PUSH' | 'BIOMETRIC';
  enabled: boolean;
  priority: number;
  config: ProviderConfig;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderDto {
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  config: ProviderConfig;
}

// Interface del API Client
export interface IApiClient {
  // Providers
  getProviders(): Promise<Provider[]>;
  getProvider(id: string): Promise<Provider>;
  createProvider(data: CreateProviderDto): Promise<Provider>;
  updateProvider(id: string, data: Partial<Provider>): Promise<Provider>;
  deleteProvider(id: string): Promise<void>;
  testProvider(id: string): Promise<TestResult>;
  
  // Rules
  getRules(): Promise<Rule[]>;
  getRule(id: string): Promise<Rule>;
  createRule(data: CreateRuleDto): Promise<Rule>;
  updateRule(id: string, data: Partial<Rule>): Promise<Rule>;
  deleteRule(id: string): Promise<void>;
  
  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document>;
  uploadDocument(file: File, metadata: DocumentMetadata): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Signature Requests
  getSignatureRequests(filters?: SignatureRequestFilters): Promise<SignatureRequest[]>;
  getSignatureRequest(id: string): Promise<SignatureRequest>;
  createSignatureRequest(data: CreateSignatureRequestDto): Promise<SignatureRequest>;
  retrySignatureRequest(id: string): Promise<SignatureRequest>;
  
  // Analytics
  getAnalytics(dateRange: DateRange): Promise<Analytics>;
  getProviderMetrics(providerId: string, dateRange: DateRange): Promise<ProviderMetrics>;
  
  // Auth (si aplica)
  login(credentials: Credentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<AuthResponse>;
}
```

### 4. Mock API Client

```typescript
// lib/api/mock-client.ts
import { IApiClient } from './types';
import { mockProviders, mockRules, mockDocuments, mockSignatureRequests } from './mock-data';
import { config } from '../config';

export class MockApiClient implements IApiClient {
  
  // Simular latencia de red
  private async delay<T>(data: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), config.mockDelay);
    });
  }
  
  // Simular errores aleatorios (para testing)
  private async maybeThrowError(): Promise<void> {
    if (config.mockErrorRate > 0 && Math.random() * 100 < config.mockErrorRate) {
      throw new Error('Mock API Error (simulado)');
    }
  }
  
  // ========== PROVIDERS ==========
  
  async getProviders(): Promise<Provider[]> {
    await this.maybeThrowError();
    console.log('[MOCK] GET /api/v1/providers');
    return this.delay(mockProviders);
  }
  
  async getProvider(id: string): Promise<Provider> {
    await this.maybeThrowError();
    console.log(`[MOCK] GET /api/v1/providers/${id}`);
    const provider = mockProviders.find(p => p.id === id);
    if (!provider) {
      throw new Error(`Provider ${id} not found`);
    }
    return this.delay(provider);
  }
  
  async createProvider(data: CreateProviderDto): Promise<Provider> {
    await this.maybeThrowError();
    console.log('[MOCK] POST /api/v1/providers', data);
    
    const newProvider: Provider = {
      id: `mock-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Persistir en localStorage para que sobreviva a refreshes
    const stored = this.getStoredProviders();
    stored.push(newProvider);
    localStorage.setItem('mock_providers', JSON.stringify(stored));
    
    return this.delay(newProvider);
  }
  
  async updateProvider(id: string, data: Partial<Provider>): Promise<Provider> {
    await this.maybeThrowError();
    console.log(`[MOCK] PUT /api/v1/providers/${id}`, data);
    
    const stored = this.getStoredProviders();
    const index = stored.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error(`Provider ${id} not found`);
    }
    
    const updated = {
      ...stored[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    stored[index] = updated;
    localStorage.setItem('mock_providers', JSON.stringify(stored));
    
    return this.delay(updated);
  }
  
  async deleteProvider(id: string): Promise<void> {
    await this.maybeThrowError();
    console.log(`[MOCK] DELETE /api/v1/providers/${id}`);
    
    const stored = this.getStoredProviders();
    const filtered = stored.filter(p => p.id !== id);
    localStorage.setItem('mock_providers', JSON.stringify(filtered));
    
    return this.delay(undefined);
  }
  
  async testProvider(id: string): Promise<TestResult> {
    await this.maybeThrowError();
    console.log(`[MOCK] POST /api/v1/providers/${id}/test`);
    
    // Simular test exitoso
    return this.delay({
      success: true,
      message: 'Provider test successful (mock)',
      latency: Math.random() * 500 + 100,
    });
  }
  
  // ========== RULES ==========
  
  async getRules(): Promise<Rule[]> {
    await this.maybeThrowError();
    console.log('[MOCK] GET /api/v1/rules');
    return this.delay(this.getStoredRules());
  }
  
  async getRule(id: string): Promise<Rule> {
    await this.maybeThrowError();
    console.log(`[MOCK] GET /api/v1/rules/${id}`);
    const rule = this.getStoredRules().find(r => r.id === id);
    if (!rule) {
      throw new Error(`Rule ${id} not found`);
    }
    return this.delay(rule);
  }
  
  async createRule(data: CreateRuleDto): Promise<Rule> {
    await this.maybeThrowError();
    console.log('[MOCK] POST /api/v1/rules', data);
    
    const newRule: Rule = {
      id: `mock-rule-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const stored = this.getStoredRules();
    stored.push(newRule);
    localStorage.setItem('mock_rules', JSON.stringify(stored));
    
    return this.delay(newRule);
  }
  
  async updateRule(id: string, data: Partial<Rule>): Promise<Rule> {
    await this.maybeThrowError();
    console.log(`[MOCK] PUT /api/v1/rules/${id}`, data);
    
    const stored = this.getStoredRules();
    const index = stored.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new Error(`Rule ${id} not found`);
    }
    
    const updated = { ...stored[index], ...data, updatedAt: new Date().toISOString() };
    stored[index] = updated;
    localStorage.setItem('mock_rules', JSON.stringify(stored));
    
    return this.delay(updated);
  }
  
  async deleteRule(id: string): Promise<void> {
    await this.maybeThrowError();
    console.log(`[MOCK] DELETE /api/v1/rules/${id}`);
    
    const stored = this.getStoredRules();
    const filtered = stored.filter(r => r.id !== id);
    localStorage.setItem('mock_rules', JSON.stringify(filtered));
    
    return this.delay(undefined);
  }
  
  // ========== HELPER METHODS ==========
  
  private getStoredProviders(): Provider[] {
    const stored = localStorage.getItem('mock_providers');
    return stored ? JSON.parse(stored) : mockProviders;
  }
  
  private getStoredRules(): Rule[] {
    const stored = localStorage.getItem('mock_rules');
    return stored ? JSON.parse(stored) : mockRules;
  }
  
  // ... más métodos para documents, signature-requests, analytics
}
```

### 5. Real API Client

```typescript
// lib/api/real-client.ts
import { IApiClient } from './types';
import { config } from '../config';

export class RealApiClient implements IApiClient {
  
  private baseUrl: string;
  private timeout: number;
  
  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.timeout = config.apiTimeout;
  }
  
  // Helper para fetch con timeout y headers
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${getAuthToken()}`, // Si hay auth
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  // ========== PROVIDERS ==========
  
  async getProviders(): Promise<Provider[]> {
    console.log('[REAL] GET /api/v1/providers');
    return this.fetch<Provider[]>('/api/v1/providers');
  }
  
  async getProvider(id: string): Promise<Provider> {
    console.log(`[REAL] GET /api/v1/providers/${id}`);
    return this.fetch<Provider>(`/api/v1/providers/${id}`);
  }
  
  async createProvider(data: CreateProviderDto): Promise<Provider> {
    console.log('[REAL] POST /api/v1/providers', data);
    return this.fetch<Provider>('/api/v1/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async updateProvider(id: string, data: Partial<Provider>): Promise<Provider> {
    console.log(`[REAL] PUT /api/v1/providers/${id}`, data);
    return this.fetch<Provider>(`/api/v1/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  async deleteProvider(id: string): Promise<void> {
    console.log(`[REAL] DELETE /api/v1/providers/${id}`);
    return this.fetch<void>(`/api/v1/providers/${id}`, {
      method: 'DELETE',
    });
  }
  
  async testProvider(id: string): Promise<TestResult> {
    console.log(`[REAL] POST /api/v1/providers/${id}/test`);
    return this.fetch<TestResult>(`/api/v1/providers/${id}/test`, {
      method: 'POST',
    });
  }
  
  // ========== RULES ==========
  
  async getRules(): Promise<Rule[]> {
    console.log('[REAL] GET /api/v1/rules');
    return this.fetch<Rule[]>('/api/v1/rules');
  }
  
  async getRule(id: string): Promise<Rule> {
    console.log(`[REAL] GET /api/v1/rules/${id}`);
    return this.fetch<Rule>(`/api/v1/rules/${id}`);
  }
  
  async createRule(data: CreateRuleDto): Promise<Rule> {
    console.log('[REAL] POST /api/v1/rules', data);
    return this.fetch<Rule>('/api/v1/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async updateRule(id: string, data: Partial<Rule>): Promise<Rule> {
    console.log(`[REAL] PUT /api/v1/rules/${id}`, data);
    return this.fetch<Rule>(`/api/v1/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  async deleteRule(id: string): Promise<void> {
    console.log(`[REAL] DELETE /api/v1/rules/${id}`);
    return this.fetch<void>(`/api/v1/rules/${id}`, {
      method: 'DELETE',
    });
  }
  
  // ... más métodos
}
```

### 6. Factory Pattern (Selector de Cliente)

```typescript
// lib/api/client.ts
import { IApiClient } from './types';
import { MockApiClient } from './mock-client';
import { RealApiClient } from './real-client';
import { config } from '../config';

// Factory que devuelve el cliente correcto según configuración
export function createApiClient(): IApiClient {
  if (config.useMockData) {
    console.log('🎭 Using MOCK API Client');
    return new MockApiClient();
  } else {
    console.log('🌐 Using REAL API Client');
    return new RealApiClient();
  }
}

// Singleton (instancia única en toda la app)
export const apiClient = createApiClient();
```

### 7. React Hooks Personalizados

```typescript
// hooks/use-providers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: () => apiClient.getProviders(),
  });
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: ['providers', id],
    queryFn: () => apiClient.getProvider(id),
    enabled: !!id,
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProviderDto) => apiClient.createProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create provider: ${error.message}`);
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Provider> }) =>
      apiClient.updateProvider(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['providers', variables.id] });
      toast.success('Provider updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update provider: ${error.message}`);
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete provider: ${error.message}`);
    },
  });
}
```

### 8. Uso en Componentes React

```typescript
// app/providers/page.tsx
'use client';

import { useProviders, useDeleteProvider } from '@/hooks/use-providers';
import { ProviderCard } from '@/components/provider-card';
import { Button } from '@/components/ui/button';

export default function ProvidersPage() {
  const { data: providers, isLoading, error } = useProviders();
  const deleteProvider = useDeleteProvider();
  
  if (isLoading) return <div>Loading providers...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Providers</h1>
      
      {/* El componente NO sabe si está usando mock o real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers?.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onDelete={(id) => deleteProvider.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
```

**IMPORTANTE:** El componente React **NO SABE** si está usando mock o backend real. Solo usa `useProviders()`.

---

## 🎛️ Cómo Cambiar entre Mock y Real

### Opción 1: Variable de Entorno (Recomendada)

```bash
# Cambiar a MOCK
NEXT_PUBLIC_USE_MOCK_DATA=true npm run dev

# Cambiar a REAL
NEXT_PUBLIC_USE_MOCK_DATA=false npm run dev
```

### Opción 2: Scripts en package.json

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "dev:mock": "NEXT_PUBLIC_USE_MOCK_DATA=true next dev",
    "dev:real": "NEXT_PUBLIC_USE_MOCK_DATA=false next dev",
    "build": "next build",
    "build:mock": "NEXT_PUBLIC_USE_MOCK_DATA=true next build",
    "build:real": "NEXT_PUBLIC_USE_MOCK_DATA=false next build"
  }
}
```

**Uso:**

```bash
# Desarrollo con mock
npm run dev:mock

# Desarrollo con backend real
npm run dev:real

# Build para demo (con mock)
npm run build:mock
```

### Opción 3: UI Toggle (Avanzado)

```typescript
// components/dev-mode-toggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';

export function DevModeToggle() {
  const [useMock, setUseMock] = useState(false);
  
  useEffect(() => {
    // Leer del localStorage
    const stored = localStorage.getItem('dev_use_mock');
    setUseMock(stored === 'true');
  }, []);
  
  const handleToggle = (checked: boolean) => {
    setUseMock(checked);
    localStorage.setItem('dev_use_mock', String(checked));
    
    // Refrescar página para aplicar cambio
    window.location.reload();
  };
  
  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-card p-4 rounded-lg shadow-lg border">
      <div className="flex items-center gap-2">
        <Switch checked={useMock} onCheckedChange={handleToggle} />
        <span className="text-sm font-medium">
          {useMock ? '🎭 Mock Data' : '🌐 Real Backend'}
        </span>
      </div>
    </div>
  );
}
```

```typescript
// lib/config.ts (actualizado)
export const config = {
  useMockData:
    // 1. Primero chequear localStorage (override manual)
    (typeof window !== 'undefined' && localStorage.getItem('dev_use_mock') === 'true') ||
    // 2. Luego variable de entorno
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  
  // ... resto
};
```

**Uso:**
- Toggle visible solo en desarrollo
- Click en el switch → recarga la página con el nuevo modo
- Persiste en localStorage (sobrevive a refreshes)

---

## 📦 Datos Mock (Fixtures)

```typescript
// lib/api/mock-data.ts

export const mockProviders: Provider[] = [
  {
    id: 'prov-twilio-sms',
    name: 'Twilio SMS',
    type: 'SMS',
    enabled: true,
    priority: 1,
    config: {
      accountSid: 'AC***************',
      authToken: '***************',
      fromNumber: '+34912345678',
    },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'prov-firebase-push',
    name: 'Firebase FCM',
    type: 'PUSH',
    enabled: true,
    priority: 1,
    config: {
      serverKey: 'AAAA***************',
      senderId: '123456789',
    },
    createdAt: '2025-01-16T11:00:00Z',
    updatedAt: '2025-01-16T11:00:00Z',
  },
  {
    id: 'prov-twilio-voice',
    name: 'Twilio Voice',
    type: 'VOICE',
    enabled: false,
    priority: 2,
    config: {
      accountSid: 'AC***************',
      authToken: '***************',
      fromNumber: '+34912345678',
    },
    createdAt: '2025-01-17T12:00:00Z',
    updatedAt: '2025-01-17T12:00:00Z',
  },
];

export const mockRules: Rule[] = [
  {
    id: 'rule-1',
    name: 'High Value Documents',
    description: 'Documents over €10,000 require SMS + Voice',
    condition: 'document.amount > 10000',
    actions: [
      { type: 'REQUIRE_CHANNEL', channel: 'SMS' },
      { type: 'REQUIRE_CHANNEL', channel: 'VOICE' },
    ],
    priority: 1,
    enabled: true,
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Weekend Fallback',
    description: 'Use PUSH on weekends if SMS fails',
    condition: 'isWeekend() && sms.failed',
    actions: [
      { type: 'FALLBACK_TO_CHANNEL', channel: 'PUSH' },
    ],
    priority: 2,
    enabled: true,
    createdAt: '2025-01-21T11:00:00Z',
    updatedAt: '2025-01-21T11:00:00Z',
  },
];

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'Contrato de compraventa.pdf',
    type: 'CONTRACT',
    size: 2457600, // 2.4 MB
    uploadedAt: '2025-01-25T09:30:00Z',
    uploadedBy: 'user@company.com',
    status: 'PENDING_SIGNATURE',
    metadata: {
      amount: 15000,
      parties: ['John Doe', 'Jane Smith'],
      expiresAt: '2025-02-25T23:59:59Z',
    },
  },
  {
    id: 'doc-2',
    name: 'Política de privacidad.pdf',
    type: 'POLICY',
    size: 512000, // 500 KB
    uploadedAt: '2025-01-26T14:00:00Z',
    uploadedBy: 'admin@company.com',
    status: 'SIGNED',
    metadata: {
      version: '2.0',
      effectiveDate: '2025-02-01',
    },
  },
];

export const mockSignatureRequests: SignatureRequest[] = [
  {
    id: 'req-1',
    documentId: 'doc-1',
    channel: 'SMS',
    recipient: {
      phoneNumber: '+34612345678',
      name: 'John Doe',
    },
    status: 'SENT',
    sentAt: '2025-01-25T10:00:00Z',
    expiresAt: '2025-01-25T10:15:00Z',
    attempts: 1,
  },
  {
    id: 'req-2',
    documentId: 'doc-2',
    channel: 'PUSH',
    recipient: {
      deviceToken: 'fcm-token-***',
      name: 'Jane Smith',
    },
    status: 'VALIDATED',
    sentAt: '2025-01-26T15:00:00Z',
    validatedAt: '2025-01-26T15:02:30Z',
    expiresAt: '2025-01-26T15:15:00Z',
    attempts: 1,
  },
];

export const mockAnalytics = {
  totalRequests: 1234,
  successRate: 94.5,
  avgLatency: 245,
  byChannel: {
    SMS: { count: 800, successRate: 96.2, avgLatency: 180 },
    PUSH: { count: 300, successRate: 91.3, avgLatency: 120 },
    VOICE: { count: 100, successRate: 88.0, avgLatency: 450 },
    BIOMETRIC: { count: 34, successRate: 100.0, avgLatency: 90 },
  },
  timeline: [
    { date: '2025-01-20', requests: 150, success: 142 },
    { date: '2025-01-21', requests: 180, success: 172 },
    { date: '2025-01-22', requests: 210, success: 198 },
    { date: '2025-01-23', requests: 195, success: 185 },
    { date: '2025-01-24', requests: 220, success: 210 },
    { date: '2025-01-25', requests: 160, success: 152 },
    { date: '2025-01-26', requests: 119, success: 112 },
  ],
};
```

---

## ✅ Ventajas de Esta Estrategia

### 1. ✅ Cambio Instantáneo

```bash
# Cambiar de mock a real
NEXT_PUBLIC_USE_MOCK_DATA=false

# Cambiar de real a mock
NEXT_PUBLIC_USE_MOCK_DATA=true
```

**Sin modificar código.**

### 2. ✅ Demos sin Backend

- Stakeholder quiere ver UI → `npm run dev:mock`
- UI funcional completa sin levantar backend
- Datos consistentes y realistas

### 3. ✅ Desarrollo Desacoplado

Frontend puede avanzar **sin esperar** al backend:
- Backend en desarrollo → usar mock
- Backend listo → cambiar a real
- Backend caído → volver a mock temporalmente

### 4. ✅ Testing Simplificado

```typescript
// Componente React tests
describe('ProvidersPage', () => {
  it('should render providers', () => {
    // SIEMPRE usa mock en tests (rápido, determinista)
    render(<ProvidersPage />);
    expect(screen.getByText('Twilio SMS')).toBeInTheDocument();
  });
});
```

### 5. ✅ Datos Persistentes (localStorage)

Mock usa `localStorage`:
- Crear provider → persiste aunque refresques la página
- Borrar provider → se borra del localStorage
- Editar provider → cambios persisten

**Simula backend real con persistencia.**

### 6. ✅ Misma Lógica de UI

El código React **NO CAMBIA**:

```typescript
// Este código funciona IGUAL con mock o real
const { data: providers } = useProviders();
```

**No hay `if (mock) { ... } else { ... }`** en los componentes.

### 7. ✅ Simular Latencia y Errores

```typescript
// lib/config.ts
export const config = {
  mockDelay: 500,       // Simular 500ms de latencia
  mockErrorRate: 10,    // 10% de requests fallan
};
```

**Util para:**
- Probar loading states
- Probar error handling
- Probar retry logic

---

## 🎬 Casos de Uso Reales

### Caso 1: Demo a Stakeholders

**Situación:** CTO quiere ver el Admin Panel el viernes, pero el backend no estará listo hasta el lunes.

**Solución:**

```bash
# 1. Preparar build con mock
npm run build:mock

# 2. Levantar servidor
npm start

# 3. Presentar
# - UI totalmente funcional
# - Datos realistas
# - Todas las funcionalidades (CRUD, filtros, búsqueda)
```

**Stakeholder NO notará** que es mock (si los datos son buenos).

### Caso 2: Frontend Bloqueado por Backend

**Situación:** Backend tiene bug crítico en endpoint `/api/v1/providers`. Frontend no puede avanzar.

**Solución:**

```bash
# Cambiar a mock temporalmente
NEXT_PUBLIC_USE_MOCK_DATA=true npm run dev
```

**Frontend sigue trabajando** mientras backend arregla el bug.

### Caso 3: Testing de UI sin Infraestructura

**Situación:** QA quiere probar UI en su laptop sin Docker/PostgreSQL/Backend.

**Solución:**

```bash
# QA ejecuta
npm run dev:mock
```

**QA puede probar toda la UI** sin dependencias.

### Caso 4: Desarrollo Offline

**Situación:** Desarrollador en avión sin internet.

**Solución:**

```bash
# Mock no necesita red
NEXT_PUBLIC_USE_MOCK_DATA=true npm run dev
```

**Desarrollador puede seguir trabajando** sin backend.

---

## 📋 Checklist de Implementación

### Fase 1: Setup Inicial

- [ ] Crear `lib/api/types.ts` (interface `IApiClient`)
- [ ] Crear `lib/config.ts` (feature flag `useMockData`)
- [ ] Crear `.env.local` con `NEXT_PUBLIC_USE_MOCK_DATA=true`
- [ ] Crear `.env.development` con `NEXT_PUBLIC_USE_MOCK_DATA=false`

### Fase 2: Mock Client

- [ ] Crear `lib/api/mock-data.ts` (fixtures)
- [ ] Crear `lib/api/mock-client.ts` (implementación mock)
- [ ] Implementar métodos básicos (GET, POST, PUT, DELETE)
- [ ] Agregar persistencia en localStorage
- [ ] Agregar simulación de latencia

### Fase 3: Real Client

- [ ] Crear `lib/api/real-client.ts` (implementación real)
- [ ] Implementar métodos con `fetch` o `axios`
- [ ] Agregar timeout handling
- [ ] Agregar error handling
- [ ] Agregar auth headers (si aplica)

### Fase 4: Factory & Hooks

- [ ] Crear `lib/api/client.ts` (factory pattern)
- [ ] Crear hooks: `useProviders`, `useRules`, etc.
- [ ] Integrar React Query para caching
- [ ] Agregar toast notifications

### Fase 5: Scripts & Testing

- [ ] Agregar scripts `dev:mock` y `dev:real` en `package.json`
- [ ] Probar cambio entre mock y real
- [ ] Verificar que UI funciona igual en ambos modos
- [ ] Agregar toggle UI (opcional)

---

## 🚀 Próximos Pasos

1. **Implementar estructura base** (Fase 1-2)
2. **Poblar mock-data.ts** con datos realistas de Providers, Rules, Documents
3. **Crear hooks personalizados** para cada entidad
4. **Migrar componentes existentes** a usar hooks (en lugar de fetch directo)
5. **Probar demo** con stakeholders usando mock
6. **Integrar backend real** cuando esté listo (cambiar flag)

---

**¿Listo para demos en cualquier momento! 🎭✨**

---

## 📖 Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [React Query](https://tanstack.com/query/latest)
- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter)
- [Factory Pattern](https://refactoring.guru/design-patterns/factory-method)

---

**Fecha:** 2025-11-30  
**Autor:** Equipo Frontend  
**Revisado por:** [Pendiente]

