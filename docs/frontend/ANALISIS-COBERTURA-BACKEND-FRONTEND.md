# 📊 Análisis: Cobertura Backend vs Frontend

**Proyecto:** Signature Router - Admin Panel  
**Fecha:** 2025-11-30  
**Autor:** Equipo Técnico  
**Versión:** 1.0

---

## 🎯 Objetivo

Analizar si el backend actual tiene los endpoints necesarios para soportar **todas las pantallas del frontend** que se acaban de implementar.

---

## 📋 Resumen Ejecutivo

| Pantalla Frontend | Cobertura Backend | Estado | Acción Requerida |
|-------------------|-------------------|--------|------------------|
| **Dashboard** | ⚠️ **Parcial** | Implementable | Crear endpoint de métricas agregadas |
| **Reglas de Routing** | ✅ **Completa** | Listo | Ninguna |
| **Monitoreo de Firmas** | ✅ **Completa** | Listo | Ninguna |
| **Proveedores** | ⚠️ **Parcial** | Falta CRUD | **Crear endpoints CRUD providers** |
| **Métricas** | ❌ **No Existe** | Requiere implementación | **Crear endpoints analytics** |
| **Seguridad** | ⚠️ **Parcial** | Solo audit | **Ampliar endpoints seguridad** |
| **Alertas** | ❌ **No Existe** | Requiere implementación | **Crear sistema de alertas** |
| **Usuarios** | ❌ **No Existe** | Keycloak externo | **Decidir estrategia** |

---

## 🔍 Análisis Detallado por Pantalla

### 1. ✅ Dashboard (`/admin`)

**Pantalla Frontend Muestra:**
- KPIs: Total Firmas (24,567), Tasa Éxito (94.5%), Latencia Promedio (245ms), Providers Activos (3/4)
- Gráficos: Firmas por canal, Latencia P95, Tasa de error

**Backend Disponible:**
- ❌ NO existe endpoint `/api/v1/metrics/dashboard`
- ✅ Existe `/api/v1/slo/status` (SLO mensual)
- ✅ Existe `/api/v1/admin/providers/health` (salud de providers)
- ✅ Existe `/api/v1/signatures` (lista de firmas)

**Gap:**
```
❌ Falta: GET /api/v1/admin/dashboard/metrics
Response esperado:
{
  "totalSignatures": 24567,
  "successRate": 94.5,
  "avgLatency": 245,
  "activeProviders": 3,
  "totalProviders": 4,
  "byChannel": {
    "SMS": { "count": 15000, "successRate": 96.2 },
    "PUSH": { "count": 8000, "successRate": 92.5 },
    "VOICE": { "count": 1500, "successRate": 88.0 },
    "BIOMETRIC": { "count": 67, "successRate": 100 }
  },
  "latencyTimeline": [ ... ],
  "errorTimeline": [ ... ]
}
```

**Solución:**
1. Crear `DashboardMetricsController`
2. Agregar `DashboardMetricsUseCase`
3. Consultar `SignatureRequestRepository` con agregaciones
4. Consultar `ProviderHealthService`

**Effort:** 4-6 horas

---

### 2. ✅ Reglas de Routing (`/admin/rules`)

**Pantalla Frontend Muestra:**
- Lista de reglas con nombre, condición SpEL, acciones, prioridad, estado
- CRUD completo (Create, Read, Update, Delete)
- Validación de SpEL

**Backend Disponible:**
- ✅ `POST /api/v1/admin/rules` - Crear regla
- ✅ `GET /api/v1/admin/rules` - Listar reglas
- ✅ `GET /api/v1/admin/rules/{id}` - Obtener regla
- ✅ `PUT /api/v1/admin/rules/{id}` - Actualizar regla
- ✅ `DELETE /api/v1/admin/rules/{id}` - Eliminar regla
- ✅ `POST /api/v1/admin/routing-rules/validate-spel` - Validar SpEL

**Controller:** `AdminRuleController`  
**Use Case:** `ManageRoutingRulesUseCase`

**Estado:** ✅ **100% Completo** - No requiere cambios

---

### 3. ✅ Monitoreo de Firmas (`/admin/signatures`)

**Pantalla Frontend Muestra:**
- Lista de signature requests con filtros
- Estados: SENT, VALIDATED, EXPIRED, FAILED
- Canales: SMS, VOICE, PUSH, BIOMETRIC
- Detalles: timestamp, recipient, provider, challenge_id

**Backend Disponible:**
- ✅ `POST /api/v1/signatures` - Crear firma
- ✅ `GET /api/v1/signatures/{id}` - Consultar firma
- ✅ `POST /api/v1/signatures/{id}/complete` - Completar firma
- ⚠️ Falta: `GET /api/v1/admin/signatures` (lista con filtros para admin)

**Controller:** `SignatureController`

**Gap:**
```
⚠️ Falta: GET /api/v1/admin/signatures?status=SENT&channel=SMS&page=0&size=20
Response esperado:
{
  "content": [ { "id": "...", "status": "SENT", ... } ],
  "totalElements": 150,
  "totalPages": 8,
  "page": 0,
  "size": 20
}
```

**Solución:**
1. Crear `AdminSignatureController` (separado del público)
2. Agregar método `getAllSignatures(filters, pageable)`
3. Usar `SignatureRequestRepository.findAll(spec, pageable)`

**Effort:** 2-3 horas

---

### 4. ⚠️ Proveedores (`/admin/providers`)

**Pantalla Frontend Muestra:**
- Lista de providers (Twilio SMS, Twilio Voice, Firebase FCM, BioCatch)
- CRUD completo: Create, Read, Update, Delete, Test
- Configuración: type, enabled, priority, config (JSON)
- Botón "Test Provider"

**Backend Disponible:**
- ✅ `GET /api/v1/admin/providers/health` - Salud de providers
- ❌ NO existe CRUD de providers (están hardcodeados en código)

**Estado Actual:**
Los providers están **hardcodeados** en:
- `TwilioSmsProviderAdapter`
- `TwilioVoiceProviderAdapter`
- `FcmPushProviderAdapter`
- `BiometricProviderAdapter`

**Gap CRÍTICO:**
```
❌ Falta TODO el CRUD:
- POST /api/v1/admin/providers
- GET /api/v1/admin/providers
- GET /api/v1/admin/providers/{id}
- PUT /api/v1/admin/providers/{id}
- DELETE /api/v1/admin/providers/{id}
- POST /api/v1/admin/providers/{id}/test
```

**Implicación:**
Si se implementa el CRUD de providers:
1. Requiere **refactoring significativo** del backend
2. Providers deben almacenarse en BD (tabla `providers`)
3. Configuración dinámica (no hardcoded beans)
4. `ProviderFactory` para instanciar providers desde BD
5. Vault integration para secrets

**Solución Recomendada:**

**Opción A: Backend Simplificado (RECOMENDADO para MVP)** 🟢
- Mantener providers hardcodeados en backend
- Frontend solo **visualiza** providers (read-only)
- Endpoint: `GET /api/v1/admin/providers` (lista estática)
- NO permitir CRUD desde UI (solo configuración via YAML)
- **Effort:** 1-2 horas

**Opción B: CRUD Completo (Futuro)** 🔴
- Implementar tabla `providers` en BD
- Dynamic provider loading desde BD
- CRUD completo vía API
- Vault integration para secrets
- **Effort:** 2-3 semanas (Epic completa)

**Decisión Requerida:** ¿Opción A o B?

---

### 5. ❌ Métricas (`/admin/metrics`)

**Pantalla Frontend Muestra:**
- Gráficos de latencia (P50, P95, P99)
- Gráficos de throughput (requests/min)
- Gráficos de tasa de error por canal
- Timeline de 7 días

**Backend Disponible:**
- ✅ Prometheus metrics (`/actuator/prometheus`)
- ✅ SLO status (`/api/v1/slo/status`)
- ❌ NO existe endpoint de analytics/metrics agregados

**Gap:**
```
❌ Falta: GET /api/v1/admin/metrics?range=7d
Response esperado:
{
  "latency": {
    "p50": 150,
    "p95": 450,
    "p99": 780,
    "timeline": [
      { "timestamp": "2025-11-24T00:00:00Z", "p95": 420 },
      { "timestamp": "2025-11-25T00:00:00Z", "p95": 450 }
    ]
  },
  "throughput": {
    "current": 120,
    "timeline": [ ... ]
  },
  "errorRate": {
    "overall": 5.5,
    "byChannel": {
      "SMS": 3.8,
      "PUSH": 7.5,
      "VOICE": 12.0,
      "BIOMETRIC": 0
    },
    "timeline": [ ... ]
  }
}
```

**Solución:**
1. Crear `MetricsController`
2. Crear `MetricsService` que consulte:
   - `MeterRegistry` (Micrometer) para métricas en tiempo real
   - `SignatureRequestRepository` para histórico
3. Agregar queries de agregación por timestamp

**Effort:** 1 semana

**Alternativa Temporal:**
- Frontend consume **directamente Prometheus** vía Grafana Proxy
- No implementar endpoint custom
- Usar Grafana embebido en iframe

---

### 6. ⚠️ Seguridad (`/admin/security`)

**Pantalla Frontend Muestra:**
- Estado de Seguridad (Seguro/En Riesgo)
- Autenticación 2FA (85% usuarios)
- Tokens Activos (127)
- Intentos Fallidos (23 últimas 24h)
- Configuración de OAuth2, 2FA, JWT
- Políticas: Contraseña Fuerte, IP Whitelisting, Rate Limiting
- Auditoría de Acceso (últimos logins)

**Backend Disponible:**
- ✅ `GET /api/v1/admin/security/audit-routing-rules` - Audit de reglas SpEL
- ❌ NO existe endpoint de métricas de seguridad
- ❌ NO existe endpoint de auditoría de acceso
- ❌ NO existe gestión de 2FA (delegado a Keycloak)

**Gap:**
```
❌ Falta: GET /api/v1/admin/security/overview
Response esperado:
{
  "status": "SECURE",
  "twoFactorEnabled": 85.0,
  "activeTokens": 127,
  "failedAttempts24h": 23,
  "policies": {
    "strongPassword": { "enabled": true, "minLength": 12 },
    "ipWhitelisting": { "enabled": true, "count": 45 },
    "rateLimiting": { "enabled": true, "limit": 100 }
  }
}

❌ Falta: GET /api/v1/admin/security/access-audit?limit=10
Response esperado:
{
  "events": [
    {
      "user": "admin@company.com",
      "event": "LOGIN_SUCCESS",
      "ip": "192.168.1.100",
      "timestamp": "2025-11-30T10:00:00Z"
    }
  ]
}
```

**Implicación:**
- **Autenticación/Usuarios están en Keycloak (externo)**
- Backend NO tiene tabla `users` (delegado a Keycloak)
- 2FA, login audit, etc. están en Keycloak

**Solución:**

**Opción A: Integración con Keycloak Admin API** 🟢
- Crear `SecurityController`
- Consumir Keycloak Admin REST API:
  - `GET /admin/realms/{realm}/users` (users count)
  - `GET /admin/realms/{realm}/events` (login events)
- Agregar `KeycloakAdminClient` service
- **Effort:** 3-4 días

**Opción B: Simplificar Pantalla** 🟡
- Mostrar solo:
  - Audit de routing rules (ya existe)
  - Configuración estática (read-only)
- NO mostrar: users, 2FA, login events
- **Effort:** 1 hora (actualizar frontend)

**Decisión Requerida:** ¿Opción A o B?

---

### 7. ❌ Alertas (`/admin/alerts`)

**Pantalla Frontend Muestra:**
- Alertas Críticas (3)
- Advertencias (12)
- Informativas (47)
- Resueltas (234)
- Lista de alertas:
  - "Provider Twilio SMS caído"
  - "Tasa de error elevada"
  - "Timeout en base de datos"

**Backend Disponible:**
- ❌ NO existe sistema de alertas
- ❌ NO existe tabla `alerts`
- ❌ NO existe endpoint `/api/v1/admin/alerts`

**Gap CRÍTICO:**
```
❌ Falta TODO el sistema:
- GET /api/v1/admin/alerts?severity=CRITICAL&status=ACTIVE
- POST /api/v1/admin/alerts (crear alerta)
- PUT /api/v1/admin/alerts/{id}/acknowledge
- PUT /api/v1/admin/alerts/{id}/resolve
```

**Solución:**

**Opción A: Sistema de Alertas Completo** 🔴
1. Crear tabla `alerts` en BD
2. Crear `AlertsController`
3. Implementar `AlertsService` que:
   - Escucha eventos del sistema (provider down, high error rate, etc.)
   - Crea alertas automáticamente
   - Envía notificaciones (email, Slack)
4. Integrar con Circuit Breaker events
5. Integrar con SLO calculator
- **Effort:** 2-3 semanas

**Opción B: Alertas Mock (Temporal)** 🟡
- Frontend usa mock data
- NO integrar con backend
- Solo para demos
- **Effort:** 0 (ya está hecho en frontend)

**Opción C: Prometheus AlertManager** 🟢
- Usar **Prometheus + AlertManager** (estándar de la industria)
- Backend expone métricas vía `/actuator/prometheus`
- Prometheus genera alertas (rules)
- Frontend consume AlertManager API:
  - `GET /api/v2/alerts`
- **Effort:** 1-2 días (configuración)

**Decisión Requerida:** ¿Opción A, B o C?

**Recomendación:** **Opción C** (Prometheus AlertManager) - es el estándar.

---

### 8. ❌ Usuarios (`/admin/users`)

**Pantalla Frontend Muestra:**
- Total Usuarios (127)
- Usuarios Activos (112)
- Administradores (8)
- Sesiones Activas (45)
- Lista de usuarios con:
  - Nombre, email, rol (Admin/Operator/Viewer), estado, último acceso
- CRUD de usuarios
- Gestión de roles

**Backend Disponible:**
- ❌ NO existe tabla `users` en el backend
- ✅ Usuarios gestionados por **Keycloak** (externo)
- ✅ Roles: ADMIN, SUPPORT, AUDITOR, USER (en JWT)

**Gap CRÍTICO:**
```
❌ Backend NO gestiona usuarios (delegado a Keycloak)
❌ NO existe: GET /api/v1/admin/users
❌ NO existe: POST /api/v1/admin/users
❌ NO existe: PUT /api/v1/admin/users/{id}
❌ NO existe: DELETE /api/v1/admin/users/{id}
```

**Implicación:**
- **Toda la gestión de usuarios está en Keycloak**
- Backend solo **valida** JWT (no crea/edita users)

**Solución:**

**Opción A: Integración con Keycloak Admin API** 🟢
- Frontend llama a Keycloak Admin API directamente (con proxy)
- O crear `UserManagementController` que proxy a Keycloak:
  - `GET /api/v1/admin/users` → Keycloak `/admin/realms/{realm}/users`
  - `POST /api/v1/admin/users` → Keycloak `POST /admin/realms/{realm}/users`
- **Effort:** 1 semana

**Opción B: Gestión Manual en Keycloak** 🟡
- Usuarios se gestionan **directamente en Keycloak Admin Console**
- Frontend muestra mensaje: "Gestión de usuarios delegada a Keycloak"
- **Effort:** 1 hora (actualizar frontend)

**Opción C: Tabla Local + Sync** 🔴
- Crear tabla `users` en backend
- Sync con Keycloak vía webhooks
- CRUD local + push a Keycloak
- **Effort:** 3-4 semanas (complejo, prone to desync)

**Decisión Requerida:** ¿Opción A, B o C?

**Recomendación:** **Opción A** (Keycloak Admin API via proxy) - estándar OAuth2.

---

## 📊 Matriz de Cobertura

| Pantalla | Endpoint Necesario | Existe Backend | Complejidad | Effort Estimado |
|----------|-------------------|----------------|-------------|-----------------|
| **Dashboard** | `GET /admin/dashboard/metrics` | ❌ | Media | 4-6 horas |
| **Reglas** | `GET/POST/PUT/DELETE /admin/rules` | ✅ | - | 0 horas |
| **Firmas** | `GET /admin/signatures` (con filtros) | ⚠️ | Baja | 2-3 horas |
| **Providers** | `GET/POST/PUT/DELETE /admin/providers` | ❌ | **Alta** | 2-3 semanas o 1-2 horas (read-only) |
| **Métricas** | `GET /admin/metrics` | ❌ | Media-Alta | 1 semana o Grafana |
| **Seguridad** | `GET /admin/security/*` | ⚠️ | Media | 3-4 días (Keycloak API) |
| **Alertas** | `GET /admin/alerts` | ❌ | **Alta** | 2-3 semanas o Prometheus |
| **Usuarios** | `GET/POST/PUT/DELETE /admin/users` | ❌ | Media | 1 semana (Keycloak API) |

---

## 🎯 Recomendaciones

### Estrategia: Implementación Progresiva

#### **Fase 1: Rápido Win (1-2 días)** 🟢

Habilitar pantallas con **backend existente**:

1. ✅ **Reglas de Routing** - Ya funciona 100%
2. ⚠️ **Monitoreo de Firmas** - Agregar endpoint admin con filtros (2h)
3. ⚠️ **Dashboard** - Agregar endpoint de métricas agregadas (4-6h)

**Total Effort:** 6-8 horas  
**Resultado:** 3 pantallas funcionando con backend real

---

#### **Fase 2: Integraciones Externas (1 semana)** 🟡

Integrar con **sistemas existentes** (Keycloak, Prometheus):

1. **Usuarios** - Proxy a Keycloak Admin API (3 días)
2. **Seguridad** - Proxy a Keycloak Admin API (2 días)
3. **Alertas** - Integrar Prometheus AlertManager (2 días)

**Total Effort:** 1 semana  
**Resultado:** 6 pantallas funcionando (Dashboard, Reglas, Firmas, Usuarios, Seguridad, Alertas)

---

#### **Fase 3: Features Avanzadas (2-3 semanas)** 🔴

Implementar funcionalidades complejas:

1. **Providers CRUD** - Dynamic provider management (2-3 semanas)
2. **Métricas Avanzadas** - Endpoint custom de analytics (1 semana)
3. **Sistema de Alertas Custom** - Si no se usa Prometheus (2-3 semanas)

**Total Effort:** 4-6 semanas  
**Resultado:** Admin Panel 100% funcional

---

### Estrategia Simplificada (Recomendada para MVP)

#### **Opción: Frontend Mock con Plan de Migración** 🎯

1. **Implementar estrategia Mock vs Backend** (ya documentada)
2. **Fase 1 inmediata:** Reglas, Firmas, Dashboard con backend real
3. **Resto de pantallas:** Usar mock data temporalmente
4. **Migrar progresivamente** según prioridades de negocio

**Ventajas:**
- ✅ Frontend **100% funcional para demos** (con mock)
- ✅ Pantallas críticas con backend real (Reglas, Firmas)
- ✅ No bloquea desarrollo del frontend
- ✅ Migración incremental sin presión

**Desventajas:**
- ⚠️ Datos mock no reflejan realidad en algunas pantallas
- ⚠️ Requiere implementar todos los endpoints eventualmente

---

## 🚀 Plan de Acción Recomendado

### Corto Plazo (Esta Semana)

1. **Implementar endpoints básicos:**
   - ✅ `GET /api/v1/admin/signatures` (con filtros) - 2h
   - ✅ `GET /api/v1/admin/dashboard/metrics` - 4-6h

2. **Implementar estrategia Mock vs Backend:**
   - Seguir doc: `docs/frontend/ESTRATEGIA-MOCK-VS-BACKEND.md`
   - Feature flag `NEXT_PUBLIC_USE_MOCK_DATA`
   - 3 pantallas con backend real, resto con mock

### Medio Plazo (Próximas 2 Semanas)

1. **Integraciones externas:**
   - Keycloak Admin API (Usuarios + Seguridad)
   - Prometheus AlertManager (Alertas)

2. **Decisión sobre Providers:**
   - ¿CRUD completo o read-only?
   - Si CRUD → Epic 12 (2-3 semanas)
   - Si read-only → 1-2 horas

### Largo Plazo (Próximo Mes)

1. **Métricas avanzadas:**
   - Endpoint custom o Grafana embed

2. **Sistema de Alertas:**
   - Prometheus AlertManager o custom

3. **Providers CRUD:**
   - Si se decide implementar

---

## 📋 Checklist de Decisiones Pendientes

- [ ] **Providers:** ¿CRUD completo o read-only?
- [ ] **Métricas:** ¿Endpoint custom o Grafana embed?
- [ ] **Alertas:** ¿Prometheus AlertManager o custom?
- [ ] **Usuarios:** ¿Keycloak Admin API proxy o gestión manual?
- [ ] **Seguridad:** ¿Integrar Keycloak Admin API o simplificar pantalla?

---

## 📖 Conclusión

### Cobertura Actual: ~40%

- **3/8 pantallas** tienen backend completo (Reglas, Firmas parcial, Dashboard parcial)
- **5/8 pantallas** requieren trabajo adicional

### Estrategia Recomendada:

1. ✅ **Implementar estrategia Mock vs Backend** (YA documentada)
2. ✅ **Fase 1:** Completar 3 pantallas básicas (6-8 horas)
3. ⏳ **Fase 2:** Integraciones externas (1 semana)
4. ⏳ **Fase 3:** Features avanzadas (según prioridad de negocio)

### Ventaja Clave:

El frontend **YA ESTÁ 100% funcional para demos** con mock data. Podemos migrar a backend real de forma **incremental** sin bloquear desarrollo ni demos.

---

**Fecha:** 2025-11-30  
**Autor:** Equipo Técnico  
**Próxima Revisión:** Post-reunión MuleSoft (Lunes)

