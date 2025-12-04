# Epic 14: Integración Completa Frontend-Backend (Admin Panel)

**Epic ID:** E14  
**Epic Owner:** Tech Lead  
**Created:** 2025-12-02  
**Status:** 📋 Backlog  
**Priority:** 🔴 CRITICAL  
**Target Sprint:** Sprint Inmediato  
**Contexto:** Basado en HITO-2025-12-02-VAULT-Y-JWT-ACTIVADOS.md

---

## 🎯 Objetivo

Completar la integración de las **8 páginas pendientes del Admin Panel** con el backend Spring Boot, eliminando completamente los mocks y logrando que el 100% de las pantallas consuman datos reales desde el backend.

---

## 📊 Contexto y Estado Actual

### ✅ Lo que YA funciona (1/9 páginas)

- **Signatures** (`/admin/signatures`) - ✅ 100% integrada con backend real
  - Endpoint: `GET /api/v1/admin/signatures`
  - JWT inyectado automáticamente
  - Filtros funcionando
  - 6 solicitudes de prueba en BD

### ❌ Lo que FALTA (8/9 páginas)

| # | Página | Backend Disponible | Frontend Mock | Prioridad |
|---|--------|-------------------|---------------|-----------|
| 1 | Dashboard | ✅ Implementado | ❌ Hardcoded | 🔴 ALTA |
| 2 | Providers | ✅ Implementado | ⚠️ Parcial | 🔴 ALTA |
| 3 | Rules | ✅ Implementado | ❌ No funcional | 🔴 ALTA |
| 4 | Alerts | ✅ Mock backend | ❌ No implementado | 🟡 MEDIA |
| 5 | Metrics | ✅ Implementado | ❌ Vacío | 🟡 MEDIA |
| 6 | Users | ✅ Mock backend | ⚠️ Parcial | 🟡 MEDIA |
| 7 | Security | ✅ Implementado | ❌ Vacío | 🟢 BAJA |
| 8 | Templates | ✅ Implementado | ❌ Vacío | 🟢 BAJA |

---

## 🎁 Valor de Negocio

- **Operaciones:** Admin Panel 100% funcional para gestión de firmas
- **Visibilidad:** Métricas en tiempo real del sistema
- **Mantenimiento:** Gestión completa de providers y reglas de enrutamiento
- **Seguridad:** Auditoría y gestión de usuarios centralizada

---

## 📋 Historias de Usuario

### 🔴 Prioridad ALTA (Sprint 1-2)

---

### Story 14.1: Dashboard - Conectar Métricas Reales

**As a** Operador del sistema  
**I want** Ver métricas reales del dashboard  
**So that** Tengo visibilidad del estado actual del sistema

#### Acceptance Criteria

**Given** El backend tiene datos de signature requests en BD  
**When** Cargo la página `/admin`  
**Then** El dashboard muestra:

✅ **Métricas agregadas del endpoint real**:
```typescript
// app/admin/page.tsx
const apiClient = useApiClient();
const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

useEffect(() => {
  apiClient.getDashboardMetrics().then(setMetrics);
}, [apiClient]);
```

✅ **Datos mapeados del backend DTO**:
```json
GET /api/v1/admin/dashboard/metrics
{
  "totalSignatures": 42,
  "pendingSignatures": 12,
  "completedSignatures": 25,
  "failedSignatures": 5,
  "activeProviders": 3,
  "totalProviders": 4,
  "degradedProviders": 1,
  "activeRules": 8,
  "avgResponseTime": 245.5,
  "successRate": 87.5,
  "last24hSignatures": 156
}
```

✅ **Actualización automática cada 30 segundos**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    apiClient.getDashboardMetrics().then(setMetrics);
  }, 30000);
  return () => clearInterval(interval);
}, [apiClient]);
```

**And** Si el backend falla:
```typescript
try {
  const data = await apiClient.getDashboardMetrics();
  setMetrics(data);
  setError(null);
} catch (error) {
  console.error('Error loading metrics:', error);
  setError('No se pudieron cargar las métricas. Intenta de nuevo.');
  // Opcionalmente: mostrar datos en caché
}
```

#### Technical Notes

- **Archivo a modificar**: `app-signature-router-admin/app/admin/page.tsx`
- **Método API**: Ya existe `apiClient.getDashboardMetrics()` en `lib/api/types.ts`
- **Backend endpoint**: Ya implementado en `AdminDashboardController.java`
- **Tipos**: Verificar que `DashboardMetrics` en `types.ts` coincide con DTO del backend

#### Prerequisites

- ✅ Backend running (`check-and-start.ps1`)
- ✅ JWT authentication funcionando
- ✅ `useApiClient()` hook disponible

#### Definition of Done

- [ ] Dashboard muestra métricas reales del backend
- [ ] No hay datos hardcodeados en el componente
- [ ] Actualización automática cada 30s
- [ ] Manejo de errores con mensaje al usuario
- [ ] Loading state mientras carga
- [ ] Tipos TypeScript correctos

---

### Story 14.1.1: Rules - Enable/Disable Toggle 🔴 PENDIENTE

**As a** Administrador del sistema  
**I want** Habilitar/deshabilitar reglas de routing mediante un toggle switch  
**So that** Puedo controlar qué reglas están activas sin necesidad de eliminarlas

**Status:** 📋 Backlog  
**Priority:** 🔴 ALTA  
**Estimated Effort:** 30 minutos  
**Documento Detallado:** `docs/sprint-artifacts/stories/STORY-14.3-RULE-ENABLE-DISABLE-TOGGLE.md`

#### Quick Summary

**Problema Actual:**  
El switch de estado (enabled/disabled) en el grid de reglas está deshabilitado o no funciona.

**Solución:**  
Implementar función `toggleRule()` que:
1. Envía `PUT /api/v1/admin/rules/{id}` con DTO completo (todos los campos requeridos)
2. Actualiza estado local del frontend
3. Persiste cambio en BD (`routing_rule.enabled`)
4. Audita el cambio (`modified_at`, `modified_by`)

**Referencia:** Similar al fix de botones de orden (↑↓) completado el 5-dic-2025

**Acceptance Criteria (Resumen):**
- [ ] Switch funcional en grid de reglas
- [ ] Estado se persiste correctamente en BD
- [ ] Todos los campos del DTO se envían
- [ ] Indicador visual del estado (ON/OFF)
- [ ] Manejo de errores con toast notification
- [ ] Reglas deshabilitadas NO se evalúan en routing engine

**Technical Notes:**
- Archivo: `app-signature-router-admin/app/admin/rules/page.tsx`
- Componente UI: `@/components/ui/switch`
- Backend: Endpoint ya existe (`PUT /api/v1/admin/rules/{id}`)

---

### Story 14.2: Providers - CRUD Completo

**As a** Administrador del sistema  
**I want** Gestionar providers de firma (crear, editar, eliminar, probar)  
**So that** Puedo configurar y mantener los canales de firma disponibles

#### Acceptance Criteria

**Given** La página `/admin/providers` está abierta  
**When** Cargo la página  
**Then** Veo:

✅ **Listado de providers reales**:
```typescript
// app/admin/providers/page.tsx
const apiClient = useApiClient();
const [providers, setProviders] = useState<ProviderConfig[]>([]);

useEffect(() => {
  apiClient.listProviders().then(setProviders);
}, [apiClient]);
```

✅ **Datos del backend**:
```json
GET /api/v1/admin/providers
[
  {
    "id": "01938a23-...",
    "name": "Twilio SMS Dev",
    "type": "SMS",
    "enabled": true,
    "priority": 1,
    "config": {
      "from_number": "+34912345678"
    },
    "status": "UP",
    "lastHealthCheck": "2025-12-02T12:30:00Z"
  },
  ...
]
```

**When** Hago clic en "Crear Provider"  
**Then** Se abre formulario modal:

✅ **Formulario de creación**:
```typescript
const handleCreate = async (formData: ProviderCreateDto) => {
  try {
    const newProvider = await apiClient.createProvider(formData);
    setProviders([...providers, newProvider]);
    toast.success('Provider creado exitosamente');
    setShowCreateModal(false);
  } catch (error) {
    toast.error('Error al crear provider');
  }
};
```

**When** Hago clic en "Editar" en un provider  
**Then** Se abre formulario con datos precargados:

✅ **Formulario de edición**:
```typescript
const handleUpdate = async (id: string, formData: ProviderUpdateDto) => {
  try {
    const updated = await apiClient.updateProvider(id, formData);
    setProviders(providers.map(p => p.id === id ? updated : p));
    toast.success('Provider actualizado');
  } catch (error) {
    toast.error('Error al actualizar provider');
  }
};
```

**When** Hago clic en "Probar Conexión"  
**Then** El sistema:

✅ **Prueba el provider**:
```typescript
const handleTest = async (id: string) => {
  setTesting(id);
  try {
    const result = await apiClient.testProvider(id);
    if (result.success) {
      toast.success(`Provider OK: ${result.message}`);
    } else {
      toast.error(`Provider FAIL: ${result.message}`);
    }
  } finally {
    setTesting(null);
  }
};
```

**When** Hago clic en "Eliminar" en un provider  
**Then** Se confirma y elimina:

✅ **Confirmación y eliminación**:
```typescript
const handleDelete = async (id: string) => {
  if (confirm('¿Estás seguro de eliminar este provider?')) {
    try {
      await apiClient.deleteProvider(id);
      setProviders(providers.filter(p => p.id !== id));
      toast.success('Provider eliminado');
    } catch (error) {
      toast.error('Error al eliminar provider');
    }
  }
};
```

#### Technical Notes

- **Archivo a modificar**: `app-signature-router-admin/app/admin/providers/page.tsx`
- **Backend endpoints**: Ya implementados en `AdminProviderController.java`
  - `GET /api/v1/admin/providers` - Listar
  - `GET /api/v1/admin/providers/{id}` - Detalle
  - `POST /api/v1/admin/providers` - Crear
  - `PUT /api/v1/admin/providers/{id}` - Actualizar
  - `DELETE /api/v1/admin/providers/{id}` - Eliminar
  - `POST /api/v1/admin/providers/{id}/test` - Probar
- **Formularios**: Usar componentes Shadcn/UI existentes (Dialog, Form, Input)
- **Validación**: Implementar validación frontend con Zod o React Hook Form

#### Prerequisites

- ✅ Backend CRUD implementado
- ✅ JWT authentication funcionando
- ✅ `useApiClient()` hook disponible

#### Definition of Done

- [ ] Listado de providers consume API real
- [ ] Formulario de creación funcional
- [ ] Formulario de edición funcional
- [ ] Botón de "Probar Conexión" funcional
- [ ] Eliminación con confirmación funcional
- [ ] Manejo de errores con toasts
- [ ] Loading states en todos los botones
- [ ] Validación de formularios
- [ ] No hay mocks en el código

---

### Story 14.3: Rules - Editor de Reglas de Enrutamiento

**As a** Administrador del sistema  
**I want** Crear y editar reglas de enrutamiento con SpEL  
**So that** Puedo definir la lógica de routing de firmas

#### Acceptance Criteria

**Given** La página `/admin/rules` está abierta  
**When** Cargo la página  
**Then** Veo:

✅ **Listado de reglas reales**:
```typescript
const apiClient = useApiClient();
const [rules, setRules] = useState<RoutingRule[]>([]);

useEffect(() => {
  apiClient.listRules({ enabled: undefined }).then(setRules);
}, [apiClient]);
```

✅ **Datos del backend**:
```json
GET /api/v1/admin/rules
{
  "content": [
    {
      "id": "01938a24-...",
      "name": "High Value Transactions",
      "priority": 1,
      "enabled": true,
      "spel": "transactionContext.amount.amount > 5000",
      "targetChannel": "BIOMETRIC",
      "description": "Montos altos requieren biometría",
      "createdBy": "admin@bank.com",
      "createdAt": "2025-12-01T10:00:00Z"
    },
    ...
  ]
}
```

**When** Hago clic en "Nueva Regla"  
**Then** Se abre formulario con:

✅ **Editor SpEL con validación en tiempo real**:
```typescript
const [spel, setSpel] = useState('');
const [spelValid, setSpelValid] = useState<boolean | null>(null);
const [spelError, setSpelError] = useState<string | null>(null);

// Validación en tiempo real (debounce 500ms)
useEffect(() => {
  const timeout = setTimeout(async () => {
    if (spel) {
      try {
        const result = await apiClient.validateRule({ spel });
        setSpelValid(result.valid);
        setSpelError(result.error || null);
      } catch (error) {
        setSpelValid(false);
        setSpelError('Error al validar SpEL');
      }
    }
  }, 500);
  return () => clearTimeout(timeout);
}, [spel]);
```

✅ **Formulario completo**:
```typescript
interface RuleFormData {
  name: string;
  priority: number;
  enabled: boolean;
  spel: string;
  targetChannel: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  description?: string;
}

const handleCreateRule = async (formData: RuleFormData) => {
  try {
    const newRule = await apiClient.createRule(formData);
    setRules([...rules, newRule]);
    toast.success('Regla creada');
    setShowCreateModal(false);
  } catch (error) {
    toast.error('Error al crear regla');
  }
};
```

**When** Cambio el orden de prioridad arrastrando una regla  
**Then** El sistema:

✅ **Actualiza prioridades**:
```typescript
const handleReorder = async (reorderedRules: RoutingRule[]) => {
  setRules(reorderedRules);
  try {
    await apiClient.updateRulePriorities(
      reorderedRules.map((r, idx) => ({ id: r.id, priority: idx + 1 }))
    );
    toast.success('Prioridades actualizadas');
  } catch (error) {
    toast.error('Error al reordenar');
    // Revertir cambios
    apiClient.listRules({ enabled: undefined }).then(setRules);
  }
};
```

**When** Hago clic en toggle "Enabled"  
**Then** La regla se activa/desactiva:

✅ **Toggle de estado**:
```typescript
const handleToggleEnabled = async (id: string, enabled: boolean) => {
  try {
    const updated = await apiClient.updateRule(id, { enabled });
    setRules(rules.map(r => r.id === id ? { ...r, enabled } : r));
  } catch (error) {
    toast.error('Error al cambiar estado');
  }
};
```

#### Technical Notes

- **Archivo a modificar**: `app-signature-router-admin/app/admin/rules/page.tsx`
- **Backend endpoints**: Ya implementados en `AdminRuleController.java`
  - `GET /api/v1/admin/rules` - Listar
  - `POST /api/v1/admin/rules` - Crear
  - `PUT /api/v1/admin/rules/{id}` - Actualizar
  - `DELETE /api/v1/admin/rules/{id}` - Eliminar
  - `POST /api/v1/admin/rules/{id}/validate` - Validar SpEL
- **Drag & Drop**: Usar `@dnd-kit/core` o `react-beautiful-dnd`
- **Editor SpEL**: Considerar Monaco Editor o CodeMirror para syntax highlighting

#### Prerequisites

- ✅ Backend CRUD implementado
- ✅ Validación SpEL en backend
- ✅ JWT authentication funcionando

#### Definition of Done

- [ ] Listado de reglas consume API real
- [ ] Formulario de creación con validación SpEL
- [ ] Editor SpEL con syntax highlighting
- [ ] Validación en tiempo real
- [ ] Drag & Drop para reordenar prioridades
- [ ] Toggle enabled/disabled funcional
- [ ] Eliminación con confirmación
- [ ] Manejo de errores con toasts
- [ ] No hay mocks en el código

---

### 🟡 Prioridad MEDIA (Sprint 3-4)

---

### Story 14.4: Alerts - Sistema de Alertas

**As a** Operador del sistema  
**I want** Ver y gestionar alertas del sistema  
**So that** Puedo responder rápidamente a problemas

#### Acceptance Criteria

**Given** El backend tiene alertas configuradas  
**When** Cargo la página `/admin/alerts`  
**Then** Veo:

✅ **Listado de alertas**:
```typescript
const apiClient = useApiClient();
const [alerts, setAlerts] = useState<Alert[]>([]);

useEffect(() => {
  apiClient.getAlerts().then(setAlerts);
}, [apiClient]);
```

✅ **Datos del backend (Mock por ahora)**:
```json
GET /api/v1/admin/alerts
[
  {
    "id": "alert-001",
    "severity": "CRITICAL",
    "title": "Provider Twilio SMS degradado",
    "description": "Error rate >50% en los últimos 5 minutos",
    "status": "ACTIVE",
    "createdAt": "2025-12-02T11:30:00Z",
    "acknowledgedBy": null
  },
  ...
]
```

**When** Hago clic en "Reconocer"  
**Then** La alerta se marca como acknowledged:

✅ **Reconocer alerta**:
```typescript
const handleAcknowledge = async (id: string) => {
  try {
    const updated = await apiClient.acknowledgeAlert(id);
    setAlerts(alerts.map(a => a.id === id ? updated : a));
    toast.success('Alerta reconocida');
  } catch (error) {
    toast.error('Error al reconocer alerta');
  }
};
```

**When** Hago clic en "Resolver"  
**Then** La alerta se marca como resuelta:

✅ **Resolver alerta**:
```typescript
const handleResolve = async (id: string) => {
  try {
    await apiClient.resolveAlert(id);
    setAlerts(alerts.filter(a => a.id !== id));
    toast.success('Alerta resuelta');
  } catch (error) {
    toast.error('Error al resolver alerta');
  }
};
```

#### Technical Notes

- **Crear página**: `app-signature-router-admin/app/admin/alerts/page.tsx`
- **Backend**: Ya implementado en `AdminAlertsController.java` (usa MOCK por ahora)
- **Estado backend**: `admin.portal.alerts.mock=true` en `application-local.yml`
- **Futuro**: Integrar con Prometheus AlertManager real

#### Prerequisites

- ✅ Backend mock implementado
- ✅ JWT authentication funcionando

#### Definition of Done

- [ ] Página de alertas creada desde cero
- [ ] Listado de alertas consume API
- [ ] Botón "Reconocer" funcional
- [ ] Botón "Resolver" funcional
- [ ] Filtros por severidad (CRITICAL, WARNING, INFO)
- [ ] Auto-refresh cada 60 segundos
- [ ] Manejo de errores
- [ ] Badge con contador de alertas activas en sidebar

---

### Story 14.5: Metrics - Dashboard de Analíticas

**As a** Administrador del sistema  
**I want** Ver gráficos y métricas detalladas  
**So that** Puedo analizar el rendimiento del sistema

#### Acceptance Criteria

**Given** El backend tiene datos de métricas  
**When** Cargo la página `/admin/metrics`  
**Then** Veo:

✅ **Gráficos de métricas**:
```typescript
import { LineChart, BarChart } from 'recharts';

const apiClient = useApiClient();
const [signatureMetrics, setSignatureMetrics] = useState<MetricsData[]>([]);
const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics[]>([]);

useEffect(() => {
  Promise.all([
    apiClient.getSignatureMetrics({ period: '7d' }),
    apiClient.getProviderMetrics({ period: '24h' })
  ]).then(([sigs, provs]) => {
    setSignatureMetrics(sigs);
    setProviderMetrics(provs);
  });
}, [apiClient]);
```

✅ **Datos del backend**:
```json
GET /api/v1/admin/metrics/signatures?period=7d
{
  "data": [
    { "date": "2025-12-01", "total": 245, "completed": 210, "failed": 35 },
    { "date": "2025-12-02", "total": 156, "completed": 140, "failed": 16 },
    ...
  ]
}
```

✅ **Gráfico de latencia**:
```typescript
const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics | null>(null);

useEffect(() => {
  apiClient.getLatencyMetrics({ period: '24h' }).then(setLatencyMetrics);
}, [apiClient]);

// Renderizar:
<LineChart data={latencyMetrics?.data}>
  <Line dataKey="p50" stroke="#8884d8" name="P50" />
  <Line dataKey="p95" stroke="#82ca9d" name="P95" />
  <Line dataKey="p99" stroke="#ffc658" name="P99" />
</LineChart>
```

**When** Cambio el período (24h, 7d, 30d)  
**Then** Los gráficos se actualizan:

✅ **Selector de período**:
```typescript
const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');

useEffect(() => {
  apiClient.getSignatureMetrics({ period }).then(setSignatureMetrics);
}, [period, apiClient]);
```

**When** Hago clic en "Exportar CSV"  
**Then** Se descarga un CSV con los datos:

✅ **Exportación**:
```typescript
const handleExport = () => {
  const csv = convertToCSV(signatureMetrics);
  downloadFile(csv, 'metrics.csv', 'text/csv');
};
```

#### Technical Notes

- **Crear página**: `app-signature-router-admin/app/admin/metrics/page.tsx`
- **Backend endpoints**: Ya implementados en `MetricsAnalyticsController.java`
  - `GET /api/v1/admin/metrics/signatures`
  - `GET /api/v1/admin/metrics/providers`
  - `GET /api/v1/admin/metrics/latency`
  - `GET /api/v1/admin/metrics/errors`
- **Gráficos**: Usar Recharts (ya incluido en dependencias)

#### Prerequisites

- ✅ Backend implementado
- ✅ Recharts instalado

#### Definition of Done

- [ ] Página de métricas creada
- [ ] 4 gráficos funcionando (Firmas, Providers, Latencia, Errores)
- [ ] Selector de período funcional
- [ ] Exportación CSV funcional
- [ ] Loading states
- [ ] Responsive design
- [ ] No hay mocks en el código

---

### Story 14.6: Users - Gestión de Usuarios (Keycloak Proxy)

**As a** Administrador del sistema  
**I want** Gestionar usuarios del sistema  
**So that** Puedo controlar accesos y roles

#### Acceptance Criteria

**Given** Keycloak tiene usuarios configurados  
**When** Cargo la página `/admin/users`  
**Then** Veo:

✅ **Listado de usuarios (proxy a Keycloak)**:
```typescript
const apiClient = useApiClient();
const [users, setUsers] = useState<User[]>([]);

useEffect(() => {
  apiClient.listUsers().then(setUsers);
}, [apiClient]);
```

✅ **Datos del backend (proxy a Keycloak)**:
```json
GET /api/v1/admin/users
[
  {
    "id": "keycloak-user-001",
    "username": "admin@bank.com",
    "email": "admin@bank.com",
    "firstName": "Admin",
    "lastName": "User",
    "enabled": true,
    "roles": ["ADMIN", "OPERATOR"],
    "createdAt": "2025-11-01T10:00:00Z",
    "lastLogin": "2025-12-02T08:30:00Z"
  },
  ...
]
```

**When** Hago clic en "Crear Usuario"  
**Then** Se abre formulario:

✅ **Formulario de creación**:
```typescript
interface UserCreateDto {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
  enabled: boolean;
}

const handleCreateUser = async (formData: UserCreateDto) => {
  try {
    const newUser = await apiClient.createUser(formData);
    setUsers([...users, newUser]);
    toast.success('Usuario creado en Keycloak');
  } catch (error) {
    toast.error('Error al crear usuario');
  }
};
```

**When** Hago clic en "Editar Roles"  
**Then** Puedo modificar los roles:

✅ **Editor de roles**:
```typescript
const handleUpdateRoles = async (userId: string, roles: string[]) => {
  try {
    await apiClient.updateUserRoles(userId, roles);
    setUsers(users.map(u => u.id === userId ? { ...u, roles } : u));
    toast.success('Roles actualizados');
  } catch (error) {
    toast.error('Error al actualizar roles');
  }
};
```

**When** Hago clic en "Desactivar"  
**Then** El usuario se desactiva:

✅ **Desactivar usuario**:
```typescript
const handleToggleEnabled = async (userId: string, enabled: boolean) => {
  try {
    await apiClient.updateUser(userId, { enabled });
    setUsers(users.map(u => u.id === userId ? { ...u, enabled } : u));
    toast.success(enabled ? 'Usuario activado' : 'Usuario desactivado');
  } catch (error) {
    toast.error('Error al cambiar estado');
  }
};
```

#### Technical Notes

- **Archivo a modificar**: `app-signature-router-admin/app/admin/users/page.tsx`
- **Backend**: Ya implementado en `AdminUsersController.java` (usa MOCK por ahora)
- **Estado backend**: `admin.portal.user-management.mode=MOCK` en `application-local.yml`
- **Futuro**: Activar integración real con Keycloak Admin API

#### Prerequisites

- ✅ Backend mock implementado
- ✅ Keycloak funcionando

#### Definition of Done

- [ ] Listado de usuarios consume API (mock)
- [ ] Formulario de creación funcional
- [ ] Edición de roles funcional
- [ ] Toggle enabled/disabled funcional
- [ ] Búsqueda de usuarios
- [ ] Filtros por rol
- [ ] Manejo de errores
- [ ] No hay mocks en el frontend

---

### 🟢 Prioridad BAJA (Sprint 5+)

---

### Story 14.7: Security - Auditoría de Seguridad

**As a** Auditor de seguridad  
**I want** Ver logs de auditoría del sistema  
**So that** Puedo cumplir con requisitos de compliance

#### Acceptance Criteria

**Given** El backend registra eventos de seguridad  
**When** Cargo la página `/admin/security`  
**Then** Veo:

✅ **Log de auditoría**:
```typescript
const apiClient = useApiClient();
const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

useEffect(() => {
  apiClient.getSecurityAudit({
    startDate: '2025-12-01',
    endDate: '2025-12-02',
    eventType: undefined
  }).then(setAuditLogs);
}, [apiClient]);
```

✅ **Datos del backend**:
```json
GET /api/v1/admin/security/audit
[
  {
    "id": "audit-001",
    "eventType": "USER_LOGIN",
    "userId": "admin@bank.com",
    "ipAddress": "192.168.1.100",
    "timestamp": "2025-12-02T08:30:15Z",
    "success": true,
    "details": {
      "userAgent": "Mozilla/5.0...",
      "sessionId": "sess-abc123"
    }
  },
  ...
]
```

**When** Filtro por tipo de evento  
**Then** El listado se filtra:

✅ **Filtros**:
```typescript
const [filters, setFilters] = useState({
  eventType: undefined,
  startDate: '2025-12-01',
  endDate: '2025-12-02',
  userId: undefined
});

useEffect(() => {
  apiClient.getSecurityAudit(filters).then(setAuditLogs);
}, [filters, apiClient]);
```

**When** Hago clic en "Exportar"  
**Then** Se descarga el log completo:

✅ **Exportación**:
```typescript
const handleExport = async () => {
  const fullLog = await apiClient.getSecurityAudit({ ...filters, limit: 10000 });
  const csv = convertToCSV(fullLog);
  downloadFile(csv, 'security-audit.csv', 'text/csv');
};
```

#### Technical Notes

- **Crear página**: `app-signature-router-admin/app/admin/security/page.tsx`
- **Backend**: Ya implementado en `SecurityAuditController.java`
  - `GET /api/v1/admin/security/audit`
  - `GET /api/v1/admin/security/access-events`

#### Prerequisites

- ✅ Backend implementado

#### Definition of Done

- [ ] Página de seguridad creada
- [ ] Listado de eventos de auditoría
- [ ] Filtros por tipo, fecha, usuario
- [ ] Paginación
- [ ] Exportación CSV
- [ ] Vista de detalles del evento
- [ ] No hay mocks en el código

---

### Story 14.8: Provider Templates - Catálogo de Configuraciones

**As a** Administrador del sistema  
**I want** Ver templates predefinidos de providers  
**So that** Puedo configurar nuevos providers rápidamente

#### Acceptance Criteria

**Given** El backend tiene templates definidos  
**When** Cargo la página `/admin/providers/templates`  
**Then** Veo:

✅ **Catálogo de templates**:
```typescript
const apiClient = useApiClient();
const [templates, setTemplates] = useState<ProviderTemplate[]>([]);

useEffect(() => {
  apiClient.getProviderTemplates().then(setTemplates);
}, [apiClient]);
```

✅ **Datos del backend**:
```json
GET /api/v1/admin/provider-templates
[
  {
    "type": "SMS",
    "name": "Twilio SMS",
    "description": "Configuración para envío de SMS vía Twilio",
    "configSchema": {
      "account_sid": { "type": "string", "required": true },
      "auth_token": { "type": "secret", "required": true },
      "from_number": { "type": "string", "required": true }
    },
    "example": {
      "account_sid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "from_number": "+1234567890"
    }
  },
  ...
]
```

**When** Hago clic en "Usar Template"  
**Then** Se redirige al formulario de crear provider con datos precargados:

✅ **Usar template**:
```typescript
const handleUseTemplate = (template: ProviderTemplate) => {
  router.push(`/admin/providers/create?template=${template.type}`);
  // El formulario de crear provider lee el query param y precarga datos
};
```

**When** Selecciono un tipo de provider  
**Then** Veo los detalles del template:

✅ **Vista de detalles**:
```typescript
const [selectedType, setSelectedType] = useState<string | null>(null);
const [templateDetails, setTemplateDetails] = useState<ProviderTemplate | null>(null);

useEffect(() => {
  if (selectedType) {
    apiClient.getProviderTemplate(selectedType).then(setTemplateDetails);
  }
}, [selectedType, apiClient]);
```

#### Technical Notes

- **Crear página**: `app-signature-router-admin/app/admin/providers/templates/page.tsx`
- **Backend**: Ya implementado en `ProviderTemplatesController.java`
  - `GET /api/v1/admin/provider-templates`
  - `GET /api/v1/admin/provider-templates/{type}`

#### Prerequisites

- ✅ Backend implementado

#### Definition of Done

- [ ] Página de templates creada
- [ ] Catálogo de templates consume API
- [ ] Vista de detalles por tipo
- [ ] Botón "Usar Template" redirige a formulario
- [ ] Documentación de configuración
- [ ] Ejemplos de configuración
- [ ] No hay mocks en el código

---

## 📊 Estimación y Priorización

### Sprint 1 (Prioridad ALTA - Core)
- **Story 14.1**: Dashboard - 4h
- **Story 14.2**: Providers CRUD - 8h
- **Story 14.3**: Rules Editor - 12h

**Total Sprint 1:** ~3 días (24h)

### Sprint 2 (Prioridad MEDIA - Operations)
- **Story 14.4**: Alerts - 6h
- **Story 14.5**: Metrics - 8h
- **Story 14.6**: Users - 6h

**Total Sprint 2:** ~2.5 días (20h)

### Sprint 3 (Prioridad BAJA - Admin)
- **Story 14.7**: Security - 5h
- **Story 14.8**: Templates - 3h

**Total Sprint 3:** ~1 día (8h)

---

## ✅ Definition of Ready

Para que una historia esté lista para implementarse:

- [ ] Backend endpoint implementado y testeado
- [ ] Tipos TypeScript definidos en `lib/api/types.ts`
- [ ] Método en `IApiClient` interface disponible
- [ ] JWT authentication funcionando
- [ ] Datos de prueba disponibles en BD (si aplica)

---

## 🎯 Definition of Done (Epic Completa)

Para considerar Epic 14 como completada:

- [ ] 8/9 páginas del Admin Panel 100% integradas con backend real
- [ ] 0 mocks en el código frontend (excepto modo desarrollo)
- [ ] Todos los endpoints consumen API real
- [ ] Manejo de errores implementado en todas las páginas
- [ ] Loading states en todas las interacciones
- [ ] Tests E2E del flujo completo de cada página
- [ ] Documentación actualizada en README del frontend

---

## 📝 Notas Técnicas

### Patrón de Implementación Común

Todas las historias siguen este patrón:

```typescript
// 1. Hook de API client
const apiClient = useApiClient();

// 2. Estado local
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// 3. Cargar datos
useEffect(() => {
  setLoading(true);
  apiClient.getData()
    .then(setData)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [apiClient]);

// 4. Renderizar con estados
if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
return <DataTable data={data} />;
```

### Manejo de Errores Consistente

```typescript
try {
  const result = await apiClient.doSomething();
  toast.success('Operación exitosa');
} catch (error) {
  console.error('Error:', error);
  toast.error(error.message || 'Error inesperado');
}
```

### Testing Strategy

Para cada página integrada:

1. **Unit Tests**: Componentes individuales
2. **Integration Tests**: Flujo completo con mock del API client
3. **E2E Tests**: Flujo con backend real (Playwright/Cypress)

---

## 🚀 Ventajas de Completar Epic 14

1. ✅ **Admin Panel 100% funcional** - Ninguna dependencia de mocks
2. ✅ **Visibilidad completa** - Métricas y monitoreo en tiempo real
3. ✅ **Operaciones eficientes** - Gestión centralizada de todo el sistema
4. ✅ **Compliance** - Auditoría y seguridad implementadas
5. ✅ **Escalabilidad** - Base sólida para features futuras

---

**Siguiente paso:** Iniciar Sprint 1 con Story 14.1 (Dashboard)

---

_Epic creada por BMAD Method - Basado en HITO-2025-12-02-VAULT-Y-JWT-ACTIVADOS.md_  
_Contexto completo: Backend 100% implementado + JWT funcionando + 8/9 páginas pendientes de integración_ 🚀

