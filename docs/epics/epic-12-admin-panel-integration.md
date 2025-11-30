# Epic 12: Integración Frontend-Backend Admin Panel

**Epic ID:** EPIC-12  
**Epic Owner:** Tech Lead  
**Created:** 2025-11-30  
**Status:** 📋 Backlog  
**Priority:** High  
**Target Sprint:** TBD  

---

## 🎯 Objetivo

Implementar los endpoints backend necesarios para que las **8 páginas del Admin Panel** (Epic 6 & 7) funcionen completamente con datos reales, eliminando dependencia de mock data.

---

## 📊 Contexto

El frontend del Admin Panel (Epic 6 & 7) ha sido implementado completamente con **UI funcional y mock data**. Sin embargo, el análisis de cobertura backend revela que **solo ~40% de las pantallas** tienen endpoints backend disponibles.

**Documento de Análisis:** `docs/frontend/ANALISIS-COBERTURA-BACKEND-FRONTEND.md`

### Estado Actual

| Pantalla | Backend | Gap |
|----------|---------|-----|
| Dashboard | ⚠️ Parcial | Falta endpoint de métricas agregadas |
| Reglas | ✅ Completo | - |
| Firmas | ⚠️ Parcial | Falta filtros admin |
| Providers | ❌ No existe | CRUD no implementado |
| Métricas | ❌ No existe | Endpoint analytics |
| Seguridad | ⚠️ Parcial | Integración Keycloak |
| Alertas | ❌ No existe | Sistema de alertas |
| Usuarios | ❌ No existe | Integración Keycloak |

---

## 🎁 Valor de Negocio

- **Operaciones:** Admin Panel completamente funcional para gestión diaria
- **Visibilidad:** Métricas en tiempo real sin necesidad de Grafana/herramientas externas
- **Seguridad:** Gestión centralizada de usuarios y auditoría
- **Eficiencia:** Reducir tiempo de troubleshooting con alertas proactivas

---

## 📋 Historias de Usuario

### Story 12.1: Dashboard Metrics Endpoint ⚡ (Prioridad Alta)

**Como** operador del sistema  
**Quiero** ver métricas agregadas en el dashboard  
**Para** tener visibilidad instantánea del estado del sistema

#### Acceptance Criteria

```gherkin
Given el backend tiene signature requests en la BD
When llamo a GET /api/v1/admin/dashboard/metrics
Then recibo:
  - Total de firmas (24h, 7d, 30d)
  - Tasa de éxito global
  - Latencia promedio (P50, P95, P99)
  - Providers activos vs totales
  - Breakdown por canal (SMS, PUSH, VOICE, BIOMETRIC)
  - Timeline de latencia (últimos 7 días)
  - Timeline de tasa de error (últimos 7 días)
```

#### Technical Details

**Endpoint:**
```
GET /api/v1/admin/dashboard/metrics
```

**Response:**
```json
{
  "overview": {
    "totalSignatures24h": 1234,
    "totalSignatures7d": 8567,
    "totalSignatures30d": 24567,
    "successRate": 94.5,
    "avgLatency": 245,
    "activeProviders": 3,
    "totalProviders": 4
  },
  "byChannel": {
    "SMS": {
      "count": 15000,
      "successRate": 96.2,
      "avgLatency": 180
    },
    "PUSH": {
      "count": 8000,
      "successRate": 92.5,
      "avgLatency": 120
    },
    "VOICE": {
      "count": 1500,
      "successRate": 88.0,
      "avgLatency": 450
    },
    "BIOMETRIC": {
      "count": 67,
      "successRate": 100.0,
      "avgLatency": 90
    }
  },
  "latencyTimeline": [
    {
      "date": "2025-11-24",
      "p50": 150,
      "p95": 420,
      "p99": 780
    }
  ],
  "errorTimeline": [
    {
      "date": "2025-11-24",
      "errorRate": 5.2
    }
  ]
}
```

**Implementación:**
- Controller: `DashboardMetricsController`
- Use Case: `GetDashboardMetricsUseCase`
- Queries: Agregaciones sobre `SignatureRequestRepository`
- Cache: 1 minuto (Caffeine)

**Effort:** 4-6 horas  
**Dependencies:** Ninguna

---

### Story 12.2: Admin Signatures Endpoint con Filtros ⚡ (Prioridad Alta)

**Como** administrador  
**Quiero** listar todas las signature requests con filtros  
**Para** poder monitorear y hacer troubleshooting

#### Acceptance Criteria

```gherkin
Given existen signature requests en la BD
When llamo a GET /api/v1/admin/signatures?status=SENT&channel=SMS&page=0&size=20
Then recibo:
  - Lista paginada de signature requests
  - Filtros aplicados (status, channel, dateFrom, dateTo)
  - Total de elementos
  - Total de páginas
  - Posibilidad de ordenar (createdAt DESC por default)
```

#### Technical Details

**Endpoint:**
```
GET /api/v1/admin/signatures?status={status}&channel={channel}&dateFrom={iso8601}&dateTo={iso8601}&page={page}&size={size}&sort={field,direction}
```

**Query Parameters:**
- `status` (opcional): SENT, VALIDATED, EXPIRED, FAILED, PENDING
- `channel` (opcional): SMS, PUSH, VOICE, BIOMETRIC
- `dateFrom` (opcional): ISO 8601
- `dateTo` (opcional): ISO 8601
- `page` (opcional, default: 0)
- `size` (opcional, default: 20, max: 100)
- `sort` (opcional, default: createdAt,desc)

**Response:**
```json
{
  "content": [
    {
      "id": "01JFXXXXXXXXXXXXXXXX",
      "status": "SENT",
      "channel": "SMS",
      "recipient": {
        "phoneNumber": "+34612345678",
        "maskedPhoneNumber": "+346****5678"
      },
      "provider": "TWILIO_SMS",
      "challengeId": "CH-123456",
      "createdAt": "2025-11-30T10:00:00Z",
      "sentAt": "2025-11-30T10:00:01Z",
      "expiresAt": "2025-11-30T10:03:00Z"
    }
  ],
  "totalElements": 150,
  "totalPages": 8,
  "page": 0,
  "size": 20
}
```

**Implementación:**
- Controller: `AdminSignatureController`
- Use Case: `QueryAdminSignaturesUseCase`
- Specification Pattern para filtros dinámicos
- Paginación con Spring Data Pageable

**Effort:** 2-3 horas  
**Dependencies:** Ninguna

---

### Story 12.3: Providers Read-Only Endpoint ⚡ (Prioridad Alta)

**Como** administrador  
**Quiero** visualizar la lista de providers configurados  
**Para** conocer qué providers están disponibles y su estado

#### Acceptance Criteria

```gherkin
Given existen providers hardcodeados en el sistema
When llamo a GET /api/v1/admin/providers
Then recibo:
  - Lista de providers (Twilio SMS, Twilio Voice, Firebase FCM, BioCatch)
  - Estado de cada uno (enabled/disabled)
  - Prioridad
  - Tipo de canal
  - Última verificación de salud
And NO puedo crear/editar/eliminar providers (read-only)
```

#### Technical Details

**Endpoint:**
```
GET /api/v1/admin/providers
```

**Response:**
```json
{
  "providers": [
    {
      "id": "twilio-sms",
      "name": "Twilio SMS",
      "type": "SMS",
      "enabled": true,
      "priority": 1,
      "health": {
        "status": "UP",
        "lastCheck": "2025-11-30T10:00:00Z",
        "latency": 180
      },
      "config": {
        "accountSidMasked": "AC***************",
        "fromNumber": "+34912345678"
      }
    },
    {
      "id": "firebase-fcm",
      "name": "Firebase FCM",
      "type": "PUSH",
      "enabled": true,
      "priority": 1,
      "health": {
        "status": "UP",
        "lastCheck": "2025-11-30T10:00:00Z",
        "latency": 120
      },
      "config": {
        "serverKeyMasked": "AAAA***************"
      }
    }
  ]
}
```

**Implementación:**
- Controller: `ProvidersController`
- Service: `ProviderInventoryService` (lista estática de beans)
- Integrar con `ProviderHealthService` (ya existe)
- **NO implementar CRUD** (fuera de alcance)

**Nota:** Esta es una implementación **temporal read-only**. El CRUD completo de providers se implementará en Epic 13 (futuro) si el negocio lo requiere.

**Effort:** 1-2 horas  
**Dependencies:** `ProviderHealthService` (ya existe)

---

### Story 12.4: Metrics Analytics Endpoint 📊 (Prioridad Media)

**Como** administrador  
**Quiero** ver gráficos de métricas avanzadas  
**Para** analizar tendencias de rendimiento

#### Acceptance Criteria

```gherkin
Given el sistema tiene métricas históricas
When llamo a GET /api/v1/admin/metrics?range=7d
Then recibo:
  - Latencia P50, P95, P99 por día
  - Throughput (requests/min) por día
  - Tasa de error por canal
  - Timeline de 7 días
```

#### Technical Details

**Endpoint:**
```
GET /api/v1/admin/metrics?range={range}&channel={channel}
```

**Query Parameters:**
- `range` (opcional): 1d, 7d, 30d (default: 7d)
- `channel` (opcional): SMS, PUSH, VOICE, BIOMETRIC

**Response:**
```json
{
  "range": "7d",
  "latency": {
    "current": {
      "p50": 150,
      "p95": 450,
      "p99": 780
    },
    "timeline": [
      {
        "date": "2025-11-24",
        "p50": 145,
        "p95": 420,
        "p99": 750
      }
    ]
  },
  "throughput": {
    "current": 120,
    "timeline": [
      {
        "date": "2025-11-24",
        "requestsPerMinute": 115
      }
    ]
  },
  "errorRate": {
    "overall": 5.5,
    "byChannel": {
      "SMS": 3.8,
      "PUSH": 7.5,
      "VOICE": 12.0,
      "BIOMETRIC": 0.0
    },
    "timeline": [
      {
        "date": "2025-11-24",
        "errorRate": 5.2
      }
    ]
  }
}
```

**Implementación:**
- Controller: `MetricsController`
- Service: `MetricsAnalyticsService`
- Consultar `MeterRegistry` (Micrometer)
- Agregar queries sobre `SignatureRequestRepository`
- Cache: 5 minutos

**Effort:** 1 semana  
**Dependencies:** Micrometer (ya existe)

---

### Story 12.5: Keycloak Users Proxy Endpoint 👥 (Prioridad Media)

**Como** administrador  
**Quiero** gestionar usuarios desde el Admin Panel  
**Para** no tener que ir a Keycloak Admin Console

#### Acceptance Criteria

```gherkin
Given tengo credenciales de Keycloak Admin
When llamo a GET /api/v1/admin/users
Then recibo:
  - Lista de usuarios desde Keycloak
  - Nombre, email, roles, estado, último acceso
When llamo a POST /api/v1/admin/users
Then se crea el usuario en Keycloak
When llamo a PUT /api/v1/admin/users/{id}
Then se actualiza el usuario en Keycloak
```

#### Technical Details

**Endpoints:**
```
GET    /api/v1/admin/users
GET    /api/v1/admin/users/{id}
POST   /api/v1/admin/users
PUT    /api/v1/admin/users/{id}
DELETE /api/v1/admin/users/{id}
PUT    /api/v1/admin/users/{id}/roles
```

**Implementación:**
- Controller: `UserManagementController`
- Service: `KeycloakAdminService` (proxy a Keycloak Admin REST API)
- Client: `KeycloakAdminClient` (configurado con service account)
- Mapear roles de Keycloak a nuestro modelo

**Keycloak Admin API:**
- `GET /admin/realms/{realm}/users`
- `POST /admin/realms/{realm}/users`
- `PUT /admin/realms/{realm}/users/{id}`
- `DELETE /admin/realms/{realm}/users/{id}`

**Effort:** 1 semana  
**Dependencies:** Keycloak Admin credentials

---

### Story 12.6: Keycloak Security Audit Endpoint 🔒 (Prioridad Media)

**Como** administrador de seguridad  
**Quiero** ver métricas de seguridad y eventos de acceso  
**Para** auditar actividad del sistema

#### Acceptance Criteria

```gherkin
Given Keycloak tiene eventos de login
When llamo a GET /api/v1/admin/security/overview
Then recibo:
  - Estado general de seguridad
  - % de usuarios con 2FA
  - Tokens activos
  - Intentos fallidos últimas 24h
When llamo a GET /api/v1/admin/security/access-audit
Then recibo:
  - Lista de eventos de login (success/failure)
  - IP, timestamp, usuario
```

#### Technical Details

**Endpoints:**
```
GET /api/v1/admin/security/overview
GET /api/v1/admin/security/access-audit?limit={limit}
```

**Implementación:**
- Controller: `SecurityAuditController` (extender el existente)
- Service: `KeycloakSecurityService`
- Consultar Keycloak Admin API:
  - `GET /admin/realms/{realm}/users` (count, 2FA status)
  - `GET /admin/realms/{realm}/events` (login events)

**Effort:** 3-4 días  
**Dependencies:** Keycloak Admin credentials

---

### Story 12.7: Prometheus AlertManager Integration 🚨 (Prioridad Media)

**Como** operador  
**Quiero** ver alertas del sistema en el Admin Panel  
**Para** responder rápidamente a incidentes

#### Acceptance Criteria

```gherkin
Given Prometheus AlertManager está configurado
When llamo a GET /api/v1/admin/alerts
Then recibo:
  - Lista de alertas activas
  - Severidad (CRITICAL, WARNING, INFO)
  - Estado (ACTIVE, ACKNOWLEDGED, RESOLVED)
  - Descripción y timestamp
When llamo a PUT /api/v1/admin/alerts/{id}/acknowledge
Then la alerta se marca como reconocida
```

#### Technical Details

**Endpoints:**
```
GET /api/v1/admin/alerts?severity={severity}&status={status}
GET /api/v1/admin/alerts/{id}
PUT /api/v1/admin/alerts/{id}/acknowledge
PUT /api/v1/admin/alerts/{id}/resolve
```

**Implementación:**

**Opción A: Prometheus AlertManager (RECOMENDADO)**
- Service: `AlertManagerService` (proxy a AlertManager API)
- Client: AlertManager REST API
  - `GET /api/v2/alerts`
  - `POST /api/v2/silences` (acknowledge)
- Mapear alertas de Prometheus a nuestro modelo

**Opción B: Sistema Custom**
- Tabla `alerts` en BD
- Event listeners para crear alertas automáticamente
- Circuit breaker events → alerta "Provider down"
- SLO calculator events → alerta "SLO degraded"

**Decisión:** Opción A (estándar de la industria)

**Effort:** 2 días (Opción A) o 2-3 semanas (Opción B)  
**Dependencies:** Prometheus AlertManager

---

### Story 12.8: Frontend Mock/Backend Toggle System 🔄 (Prioridad CRÍTICA)

**Como** desarrollador/stakeholder  
**Quiero** poder alternar entre mock data y backend real mediante configuración  
**Para** hacer demos sin backend o usar datos reales según necesidad

#### Acceptance Criteria

```gherkin
Given el frontend tiene configuración NEXT_PUBLIC_USE_MOCK_DATA
When configuro NEXT_PUBLIC_USE_MOCK_DATA=true
Then todas las pantallas usan mock data (sin llamar al backend)
And puedo hacer demos sin tener backend levantado
When configuro NEXT_PUBLIC_USE_MOCK_DATA=false
Then todas las pantallas llaman a endpoints backend reales
And los datos se muestran correctamente
And los errores se manejan apropiadamente
When cambio la configuración
Then NO necesito modificar código
And solo requiere restart del servidor de desarrollo
```

#### Technical Details

**Implementación (según `docs/frontend/ESTRATEGIA-MOCK-VS-BACKEND.md`):**

**1. Estructura de Archivos:**
```
lib/
├── api/
│   ├── types.ts              # IApiClient interface
│   ├── mock-client.ts        # MockApiClient (ya existe parcialmente)
│   ├── real-client.ts        # RealApiClient (NUEVO)
│   ├── client.ts             # Factory pattern (NUEVO)
│   └── mock-data.ts          # Mock fixtures (NUEVO)
├── config.ts                 # Feature flag config (NUEVO)
hooks/
├── use-providers.ts          # React hooks (ACTUALIZAR)
├── use-rules.ts              # React hooks (ya existe)
├── use-signatures.ts         # React hooks (NUEVO)
├── use-metrics.ts            # React hooks (NUEVO)
├── use-security.ts           # React hooks (NUEVO)
├── use-alerts.ts             # React hooks (NUEVO)
└── use-users.ts              # React hooks (NUEVO)
```

**2. Config Setup:**
```typescript
// lib/config.ts
export const config = {
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  apiTimeout: 10000,
  mockDelay: 500, // Simular latencia
} as const;
```

**3. Interface Común:**
```typescript
// lib/api/types.ts
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
  getMetrics(range: string): Promise<MetricsData>;
  
  // Security
  getSecurityOverview(): Promise<SecurityOverview>;
  getAccessAudit(limit?: number): Promise<AccessEvent[]>;
  
  // Alerts
  getAlerts(filters?: AlertFilters): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<void>;
  
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
  updateUser(id: string, data: UpdateUserDto): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Rules (ya existe)
  getRules(): Promise<Rule[]>;
  // ... más métodos
}
```

**4. Mock Client:**
```typescript
// lib/api/mock-client.ts
export class MockApiClient implements IApiClient {
  
  private async delay<T>(data: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), config.mockDelay);
    });
  }
  
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    console.log('[MOCK] GET /api/v1/admin/dashboard/metrics');
    return this.delay(mockDashboardMetrics);
  }
  
  async getProviders(): Promise<Provider[]> {
    console.log('[MOCK] GET /api/v1/admin/providers');
    return this.delay(mockProviders);
  }
  
  // ... implementar todos los métodos con mock data
}
```

**5. Real Client:**
```typescript
// lib/api/real-client.ts
export class RealApiClient implements IApiClient {
  
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }
  
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${getToken()}`,
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    console.log('[REAL] GET /api/v1/admin/dashboard/metrics');
    return this.fetch('/api/v1/admin/dashboard/metrics');
  }
  
  async getProviders(): Promise<Provider[]> {
    console.log('[REAL] GET /api/v1/admin/providers');
    return this.fetch('/api/v1/admin/providers');
  }
  
  // ... implementar todos los métodos
}
```

**6. Factory Pattern:**
```typescript
// lib/api/client.ts
import { IApiClient } from './types';
import { MockApiClient } from './mock-client';
import { RealApiClient } from './real-client';
import { config } from '../config';

export function createApiClient(): IApiClient {
  if (config.useMockData) {
    console.log('🎭 Using MOCK API Client');
    return new MockApiClient();
  } else {
    console.log('🌐 Using REAL API Client');
    return new RealApiClient();
  }
}

// Singleton
export const apiClient = createApiClient();
```

**7. React Hooks (ejemplo):**
```typescript
// hooks/use-dashboard.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiClient.getDashboardMetrics(),
  });
}
```

**8. Scripts NPM:**
```json
// package.json
{
  "scripts": {
    "dev": "next dev --port 3001",
    "dev:mock": "NEXT_PUBLIC_USE_MOCK_DATA=true next dev --port 3001",
    "dev:real": "NEXT_PUBLIC_USE_MOCK_DATA=false next dev --port 3001",
    "build": "next build",
    "build:mock": "NEXT_PUBLIC_USE_MOCK_DATA=true next build",
    "build:real": "NEXT_PUBLIC_USE_MOCK_DATA=false next build"
  }
}
```

**9. Environment Files:**
```bash
# .env.local (desarrollo con mock)
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# .env.development (desarrollo con backend real)
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# .env.production
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_BASE_URL=https://api.production.com
```

**10. Componentes NO cambian:**
```typescript
// app/admin/page.tsx (Dashboard)
'use client';

import { useDashboardMetrics } from '@/hooks/use-dashboard';

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  
  // El componente NO SABE si usa mock o real
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Total Firmas: {metrics.overview.totalSignatures24h}</h1>
      {/* ... resto del UI */}
    </div>
  );
}
```

**Ventajas:**
- ✅ Cambio entre mock/real **sin modificar código**
- ✅ Solo cambiar variable de entorno
- ✅ Componentes React **agnósticos** del origen de datos
- ✅ Demos funcionales sin backend
- ✅ Testing simplificado (siempre mock)

**Effort:** 1 semana  
**Dependencies:** 
- Documentación ya existe: `docs/frontend/ESTRATEGIA-MOCK-VS-BACKEND.md`
- Mock data parcial ya existe en el frontend
- Necesita Stories 12.1-12.7 para endpoints reales

**Entregables:**
- [ ] `lib/config.ts` con feature flag
- [ ] `lib/api/types.ts` con interface completa
- [ ] `lib/api/mock-client.ts` completo (8 pantallas)
- [ ] `lib/api/real-client.ts` completo (8 pantallas)
- [ ] `lib/api/client.ts` con factory
- [ ] `lib/api/mock-data.ts` con fixtures realistas
- [ ] Hooks React actualizados (use-dashboard, use-signatures, etc.)
- [ ] Scripts NPM (`dev:mock`, `dev:real`)
- [ ] `.env.local` y `.env.development` configurados
- [ ] README actualizado con instrucciones de uso
- [ ] Tests verificando toggle funciona

---

## 📊 Estimación de Esfuerzo

### Fase 0: Mock/Backend Toggle System (Prioridad CRÍTICA) 🔴

| Story | Effort | Dependencies |
|-------|--------|--------------|
| 12.8 Mock/Backend Toggle | 1 semana | Documentación ya existe |

**Total Fase 0:** 1 semana  
**Resultado:** Sistema de alternancia mock/real funcionando  
**Beneficio:** Demos sin backend + migración incremental

---

### Fase 1: Endpoints Básicos (Prioridad Alta) ⚡

| Story | Effort | Dependencies |
|-------|--------|--------------|
| 12.1 Dashboard Metrics | 4-6 horas | Story 12.8 |
| 12.2 Admin Signatures | 2-3 horas | Story 12.8 |
| 12.3 Providers Read-Only | 1-2 horas | Story 12.8 |

**Total Fase 1:** 7-11 horas (1-2 días)  
**Resultado:** 3 pantallas alternando entre mock/real

---

### Fase 2: Integraciones Externas (Prioridad Media) 🟡

| Story | Effort | Dependencies |
|-------|--------|--------------|
| 12.4 Metrics Analytics | 1 semana | Story 12.8 |
| 12.5 Keycloak Users | 1 semana | Keycloak Admin, 12.8 |
| 12.6 Keycloak Security | 3-4 días | Keycloak Admin, 12.8 |
| 12.7 AlertManager | 2 días | AlertManager, 12.8 |

**Total Fase 2:** 3 semanas  
**Resultado:** 7/8 pantallas alternando entre mock/real

---

## 🎯 Total Epic Effort

**Fase 0 (Toggle System):** 1 semana - **CRÍTICO PRIMERO**  
**Mínimo (Fase 0 + Fase 1):** ~2 semanas  
**Completo (Fases 0-2):** ~5 semanas

**Nota:** La Fase 0 (Story 12.8) debe hacerse **PRIMERO** porque todas las demás stories dependen de ella.

---

## 🚀 Estrategia de Implementación

### Sprint 1 (Fase 0 - Foundation) 🔴 CRÍTICO

**Objetivo:** Implementar sistema de alternancia Mock/Backend

**Stories:**
- ✅ Story 12.8: Mock/Backend Toggle System (1 semana)

**Entregable:** 
- Sistema de feature flag funcionando
- Todas las pantallas pueden usar mock O backend
- Scripts npm para cambiar entre modos
- Documentación de uso

**Demo:** 
- Mostrar `npm run dev:mock` → Todo funciona con mock
- Mostrar `npm run dev:real` → Llama a backend (aunque falle si no existe)
- **Beneficio:** Ya podemos hacer demos sin backend

**⚠️ IMPORTANTE:** Este sprint debe hacerse **PRIMERO** porque todos los demás dependen de él.

---

### Sprint 2 (Fase 1 - Quick Win) ⚡

**Objetivo:** Habilitar 3 pantallas con backend real

**Stories:**
- ✅ Story 12.1: Dashboard Metrics (4-6h)
- ✅ Story 12.2: Admin Signatures (2-3h)
- ✅ Story 12.3: Providers Read-Only (1-2h)

**Entregable:** 
- Dashboard, Firmas, Providers pueden usar backend real
- Resto sigue con mock
- Configuración: `NEXT_PUBLIC_USE_MOCK_DATA=false` activa modo real

**Demo:** 
- Dashboard con métricas reales del backend
- Firmas con datos reales paginados
- Providers mostrando health real
- **Beneficio:** Datos reales en 3 pantallas críticas

---

### Sprint 3-4 (Fase 2 - Integraciones) 🟡

**Objetivo:** Integrar sistemas externos

**Stories:**
- ✅ Story 12.7: AlertManager (2 días)
- ✅ Story 12.4: Metrics Analytics (1 semana)
- ✅ Story 12.6: Keycloak Security (3-4 días)
- ✅ Story 12.5: Keycloak Users (1 semana)

**Entregable:** 
- 7/8 pantallas pueden usar backend real
- Solo Biometric sigue con mock (si aplica)

**Demo:** 
- Admin Panel casi completo con datos reales
- Alertas desde Prometheus
- Usuarios desde Keycloak
- **Beneficio:** Sistema productivo

---

## 📋 Decisiones Pendientes

### Decisión 1: CRUD de Providers

**Pregunta:** ¿Implementar CRUD completo de providers o mantener read-only?

**Opción A: Read-Only (Story 12.3)** 🟢
- Providers configurados vía YAML
- Solo visualización en UI
- **Effort:** 1-2 horas

**Opción B: CRUD Completo (Epic 13 futuro)** 🔴
- Dynamic provider loading desde BD
- CRUD vía UI
- Vault integration
- **Effort:** 2-3 semanas

**Recomendación:** Opción A para MVP, Opción B como Epic 13 futuro

---

### Decisión 2: Sistema de Alertas

**Pregunta:** ¿Prometheus AlertManager o sistema custom?

**Opción A: Prometheus AlertManager (Story 12.7)** 🟢
- Estándar de la industria
- Ya existe en la organización (probablemente)
- **Effort:** 2 días

**Opción B: Sistema Custom** 🔴
- Tabla `alerts` en BD
- Event listeners
- **Effort:** 2-3 semanas

**Recomendación:** Opción A (Prometheus)

---

### Decisión 3: Métricas

**Pregunta:** ¿Endpoint custom o Grafana embed?

**Opción A: Endpoint Custom (Story 12.4)** 🟢
- Control total sobre UI
- Integrado en Admin Panel
- **Effort:** 1 semana

**Opción B: Grafana Embed** 🟡
- Iframe de Grafana
- Sin desarrollo backend
- **Effort:** 1 día

**Recomendación:** Opción A (mejor UX)

---

## 🔗 Dependencies

### Infraestructura Requerida

- ✅ PostgreSQL 15 (ya existe)
- ✅ Keycloak (ya existe)
- ⚠️ Keycloak Admin Service Account (crear)
- ⚠️ Prometheus AlertManager (verificar si existe)
- ✅ Micrometer/Prometheus metrics (ya existe)

### Épicas Relacionadas

- **Epic 6:** Admin Portal - Rule Management (UI ya implementada)
- **Epic 7:** Admin Portal - Monitoring & Ops (UI ya implementada)
- **Epic 8:** Security & Compliance (RBAC ya implementado)
- **Epic 9:** Observability & SLO Tracking (métricas ya existen)

---

## 📖 Documentación Relacionada

- `docs/frontend/ANALISIS-COBERTURA-BACKEND-FRONTEND.md` - Análisis completo de gaps
- `docs/frontend/ESTRATEGIA-MOCK-VS-BACKEND.md` - Estrategia de migración
- `app-signature-router-admin/README.md` - Frontend implementado
- `app-signature-router-admin/IMPLEMENTACION-COMPLETA.md` - Detalles UI

---

## ✅ Definition of Done

### Por Story

- [ ] Endpoint implementado y testeado
- [ ] OpenAPI documentation actualizada
- [ ] Tests unitarios (coverage >80%)
- [ ] Tests de integración
- [ ] Frontend integrado (si aplica)
- [ ] Code review aprobado
- [ ] Documentación técnica actualizada

### Por Epic

- [ ] Todas las stories completadas
- [ ] Admin Panel funcionando 100% con backend real
- [ ] Mock data eliminado de producción
- [ ] Performance testing (P95 < 500ms)
- [ ] Security testing (OWASP Top 10)
- [ ] UAT completado
- [ ] Documentación de usuario actualizada
- [ ] Desplegado en producción

---

**Epic Owner:** Tech Lead  
**Stakeholders:** Product Manager, Frontend Team, Backend Team, DevOps  
**Estimación Total:** 4-5 semanas (completo) o 1-2 días (MVP)  
**ROI:** Alto - Admin Panel completamente funcional

---

**Próximos Pasos:**
1. Decidir sobre Providers CRUD (A o B)
2. Decidir sobre Sistema de Alertas (A o B)
3. Decidir sobre Métricas (A o B)
4. Priorizar stories en Sprint Planning
5. Iniciar Fase 1 (Quick Win)

