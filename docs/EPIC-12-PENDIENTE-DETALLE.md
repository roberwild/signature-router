# 📋 Epic 12 - Lo que Queda Pendiente (Detalle Completo)

**Fecha:** 1 de diciembre de 2025  
**Epic:** Admin Panel Backend Integration  
**Status Actual:** ✅ **50% Completado** (Fase 0+1)  
**Pendiente:** ⏳ **50%** (Fase 2 - Integraciones Avanzadas)

---

## 📊 RESUMEN EJECUTIVO

### ✅ Lo que YA está hecho (50%)

```
✅ Story 12.8: Mock/Backend Toggle System
✅ Story 12.1: Dashboard Metrics Endpoint
✅ Story 12.2: Admin Signatures con Filtros
✅ Story 12.3: Providers Read-Only Endpoint
```

**Resultado:** 3 de 8 pantallas del Admin Panel funcionan con backend real.

### ⏳ Lo que FALTA (50%)

```
⏳ Story 12.4: Metrics Analytics Endpoint
⏳ Story 12.5: Keycloak Users Proxy Endpoint
⏳ Story 12.6: Keycloak Security Audit Endpoint
⏳ Story 12.7: Prometheus AlertManager Integration
```

**Impacto:** 4 pantallas siguen usando mock data (Métricas, Usuarios, Seguridad, Alertas).

---

## 🎯 PANTALLAS DEL ADMIN PANEL - ESTADO ACTUAL

| # | Pantalla | Backend Endpoint | Status | Mock/Real |
|---|----------|------------------|--------|-----------|
| 1 | **Dashboard** | `GET /api/v1/admin/dashboard/metrics` | ✅ COMPLETO | ✅ Real disponible |
| 2 | **Reglas de Routing** | `GET/POST/PUT/DELETE /api/v1/admin/rules` | ✅ COMPLETO | ✅ Real disponible (Epic 2) |
| 3 | **Monitoreo de Firmas** | `GET /api/v1/admin/signatures` | ✅ COMPLETO | ✅ Real disponible |
| 4 | **Proveedores** | `GET /api/v1/admin/providers` | ✅ COMPLETO | ✅ Real disponible |
| 5 | **Métricas Avanzadas** | `GET /api/v1/admin/metrics` | ❌ NO EXISTE | 🎭 Solo mock |
| 6 | **Gestión de Usuarios** | `GET/POST/PUT/DELETE /api/v1/admin/users` | ❌ NO EXISTE | 🎭 Solo mock |
| 7 | **Seguridad y Auditoría** | `GET /api/v1/admin/security/*` | ⚠️ PARCIAL | 🎭 Mock + Real parcial |
| 8 | **Alertas del Sistema** | `GET /api/v1/admin/alerts` | ❌ NO EXISTE | 🎭 Solo mock |

**Cobertura Backend:** 4/8 pantallas (50%)

---

## 📋 STORIES PENDIENTES - DETALLE COMPLETO

---

## Story 12.4: Metrics Analytics Endpoint 📊

### 🎯 Objetivo

Implementar endpoint para métricas avanzadas con gráficos de latencia (P50, P95, P99), throughput y error rate por canal.

### 📄 Descripción

**Como** administrador  
**Quiero** ver gráficos de métricas avanzadas con P50/P95/P99  
**Para** analizar tendencias de rendimiento del sistema

### ✅ Acceptance Criteria

```gherkin
Given el sistema tiene métricas históricas almacenadas
When llamo a GET /api/v1/admin/metrics?range=7d&channel=SMS
Then recibo:
  - Latencia P50, P95, P99 por día (últimos 7 días)
  - Throughput (requests/min) por día
  - Tasa de error por canal
  - Timeline de 7 días con todos los datos
  - Posibilidad de filtrar por canal
```

### 🔧 Especificación Técnica

#### Endpoints

```
GET /api/v1/admin/metrics?range={range}&channel={channel}
```

**Query Parameters:**
- `range` (opcional): `1d`, `7d`, `30d` (default: `7d`)
- `channel` (opcional): `SMS`, `PUSH`, `VOICE`, `BIOMETRIC`

#### Request Examples

```bash
# Métricas generales últimos 7 días
GET /api/v1/admin/metrics

# Métricas de SMS últimos 30 días
GET /api/v1/admin/metrics?range=30d&channel=SMS

# Métricas de todas las channels últimas 24 horas
GET /api/v1/admin/metrics?range=1d
```

#### Response Schema

```json
{
  "range": "7d",
  "channel": "SMS",
  
  "latency": {
    "current": {
      "p50": 150,
      "p95": 450,
      "p99": 780,
      "min": 50,
      "max": 1200,
      "avg": 245
    },
    "timeline": [
      {
        "date": "2025-11-24",
        "p50": 145,
        "p95": 420,
        "p99": 750,
        "avg": 240
      },
      {
        "date": "2025-11-25",
        "p50": 150,
        "p95": 450,
        "p99": 780,
        "avg": 245
      }
    ]
  },
  
  "throughput": {
    "current": 120,
    "peak": 450,
    "timeline": [
      {
        "date": "2025-11-24",
        "requestsPerMinute": 115,
        "requestsTotal": 165600
      },
      {
        "date": "2025-11-25",
        "requestsPerMinute": 120,
        "requestsTotal": 172800
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
        "errorRate": 5.2,
        "totalRequests": 165600,
        "failedRequests": 8611
      }
    ]
  },
  
  "slo": {
    "target": {
      "p99LatencyMs": 500,
      "successRate": 95.0,
      "availability": 99.9
    },
    "actual": {
      "p99LatencyMs": 780,
      "successRate": 94.5,
      "availability": 99.85
    },
    "compliance": {
      "p99Latency": false,
      "successRate": false,
      "availability": true
    }
  }
}
```

### 💻 Implementación Backend

#### Componentes a Crear

```
MetricsAnalyticsResponse.java (DTO)
  ├── LatencyMetrics
  │   ├── LatencySnapshot (current)
  │   └── List<LatencyTimelinePoint> (timeline)
  ├── ThroughputMetrics
  │   └── List<ThroughputTimelinePoint> (timeline)
  ├── ErrorRateMetrics
  │   ├── Map<ChannelType, Double> (byChannel)
  │   └── List<ErrorTimelinePoint> (timeline)
  └── SloMetrics
      ├── SloTargets
      ├── SloActual
      └── SloCompliance

GetMetricsAnalyticsUseCase.java (Interface)
GetMetricsAnalyticsUseCaseImpl.java (Implementación)
MetricsAnalyticsController.java (REST Controller)
```

#### Queries Necesarias

**Opción A: Calcular desde BD (RECOMENDADO para MVP)**

```java
// SignatureRequestRepository
List<SignatureRequest> findByCreatedAtBetween(Instant from, Instant to);
List<SignatureRequest> findByChannelAndCreatedAtBetween(ChannelType channel, Instant from, Instant to);

// Cálculo en memoria
public LatencySnapshot calculateLatencyPercentiles(List<SignatureRequest> requests) {
    List<Long> latencies = requests.stream()
        .map(r -> Duration.between(r.getCreatedAt(), r.getSentAt()).toMillis())
        .sorted()
        .toList();
    
    int size = latencies.size();
    return new LatencySnapshot(
        latencies.get((int)(size * 0.50)),  // P50
        latencies.get((int)(size * 0.95)),  // P95
        latencies.get((int)(size * 0.99)),  // P99
        latencies.get(0),                   // Min
        latencies.get(size - 1),            // Max
        latencies.stream().mapToLong(Long::longValue).average().orElse(0.0)
    );
}
```

**Opción B: Consultar Micrometer/Prometheus (IDEAL)**

```java
@Service
public class MetricsAnalyticsServiceImpl implements MetricsAnalyticsService {
    
    private final MeterRegistry meterRegistry;
    
    public LatencyMetrics getLatencyMetrics(String range, ChannelType channel) {
        Timer timer = meterRegistry.timer("signature.request.latency", 
            "channel", channel.name());
        
        HistogramSnapshot snapshot = timer.takeSnapshot();
        
        return new LatencyMetrics(
            new LatencySnapshot(
                snapshot.percentileValues()[0].value(TimeUnit.MILLISECONDS),  // P50
                snapshot.percentileValues()[1].value(TimeUnit.MILLISECONDS),  // P95
                snapshot.percentileValues()[2].value(TimeUnit.MILLISECONDS),  // P99
                snapshot.min(TimeUnit.MILLISECONDS),
                snapshot.max(TimeUnit.MILLISECONDS),
                snapshot.mean(TimeUnit.MILLISECONDS)
            ),
            calculateTimeline(range, channel)
        );
    }
}
```

#### Cache Strategy

```java
@Cacheable(value = "metricsAnalytics", key = "#range + '_' + #channel")
public MetricsAnalyticsResponse getMetrics(String range, ChannelType channel) {
    // ...
}
```

- **TTL:** 5 minutos
- **Cache Provider:** Caffeine
- **Eviction:** LRU (Least Recently Used)

#### Performance

**Estimado:**
- Cached: ~10-20ms
- Uncached: ~500-1000ms (depende del rango de fechas)

**Optimizaciones:**
- Índices en `created_at` y `channel`
- Queries con proyecciones (solo campos necesarios)
- Cálculos en memoria para percentiles
- Cache agresivo (5 min TTL)

### 📦 Esfuerzo Estimado

**Opción A (BD + Cálculo en memoria):**
- **Backend:** 3-4 días
- **Testing:** 1 día
- **Total:** 1 semana

**Opción B (Micrometer/Prometheus):**
- **Backend:** 4-5 días
- **Integración Prometheus:** 1-2 días
- **Testing:** 1 día
- **Total:** 1-1.5 semanas

**Recomendación:** Opción A para MVP, Opción B para versión final.

### 🔗 Dependencies

- ✅ Micrometer (ya existe en proyecto)
- ⚠️ Prometheus API client (si se usa Opción B)
- ✅ Story 12.8 (Mock/Real toggle)

### 🎯 Definition of Done

- [ ] Endpoint `/api/v1/admin/metrics` implementado
- [ ] Response con P50, P95, P99 por día
- [ ] Filtro por canal funcionando
- [ ] Filtro por rango (1d, 7d, 30d)
- [ ] Cache configurado (5 min TTL)
- [ ] Tests unitarios (coverage >80%)
- [ ] Tests de integración
- [ ] OpenAPI documentation actualizada
- [ ] Frontend integrado con RealApiClient
- [ ] Performance: P95 < 500ms

---

## Story 12.5: Keycloak Users Proxy Endpoint 👥

### 🎯 Objetivo

Implementar endpoints para gestionar usuarios desde el Admin Panel, actuando como proxy hacia Keycloak Admin API.

### 📄 Descripción

**Como** administrador  
**Quiero** gestionar usuarios (crear, editar, eliminar, asignar roles) desde el Admin Panel  
**Para** no tener que ir a Keycloak Admin Console

### ✅ Acceptance Criteria

```gherkin
Given tengo credenciales de Keycloak Admin
When llamo a GET /api/v1/admin/users
Then recibo:
  - Lista de usuarios desde Keycloak
  - Nombre, email, roles, estado, último acceso
When llamo a POST /api/v1/admin/users
Then se crea el usuario en Keycloak
And se asignan roles por defecto
When llamo a PUT /api/v1/admin/users/{id}/roles
Then se actualizan los roles del usuario en Keycloak
```

### 🔧 Especificación Técnica

#### Endpoints

```
GET    /api/v1/admin/users                # Listar usuarios
GET    /api/v1/admin/users/{id}           # Obtener usuario por ID
POST   /api/v1/admin/users                # Crear usuario
PUT    /api/v1/admin/users/{id}           # Actualizar usuario
DELETE /api/v1/admin/users/{id}           # Eliminar usuario
PUT    /api/v1/admin/users/{id}/roles     # Actualizar roles
GET    /api/v1/admin/users/{id}/sessions  # Sesiones activas
```

#### Request/Response Examples

**GET /api/v1/admin/users**

```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john.doe",
      "email": "john.doe@singularbank.com",
      "firstName": "John",
      "lastName": "Doe",
      "enabled": true,
      "emailVerified": true,
      "createdAt": "2025-01-15T10:00:00Z",
      "roles": ["OPERATOR", "VIEWER"],
      "groups": ["Operations Team"],
      "lastLogin": "2025-11-30T09:45:00Z",
      "attributes": {
        "department": "Operations",
        "employeeId": "EMP-12345"
      }
    }
  ],
  "totalCount": 45
}
```

**POST /api/v1/admin/users**

```json
// Request
{
  "username": "jane.smith",
  "email": "jane.smith@singularbank.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "TempPassword123!",
  "roles": ["VIEWER"],
  "enabled": true,
  "emailVerified": false,
  "attributes": {
    "department": "Support",
    "employeeId": "EMP-12346"
  }
}

// Response
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "username": "jane.smith",
  "email": "jane.smith@singularbank.com",
  "createdAt": "2025-12-01T10:00:00Z",
  "enabled": true,
  "roles": ["VIEWER"]
}
```

**PUT /api/v1/admin/users/{id}/roles**

```json
// Request
{
  "roles": ["OPERATOR", "VIEWER", "SUPPORT"]
}

// Response
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john.doe",
  "roles": ["OPERATOR", "VIEWER", "SUPPORT"],
  "updatedAt": "2025-12-01T10:30:00Z"
}
```

### 💻 Implementación Backend

#### Componentes a Crear

```
UserResponse.java (DTO)
UserListResponse.java (DTO)
CreateUserRequest.java (DTO)
UpdateUserRequest.java (DTO)
UpdateUserRolesRequest.java (DTO)

KeycloakAdminService.java (Interface)
KeycloakAdminServiceImpl.java (Implementación)
UserManagementController.java (REST Controller)

KeycloakAdminConfig.java (Configuration)
```

#### Keycloak Admin API Integration

**1. Configuración:**

```yaml
# application.yml
keycloak:
  admin:
    server-url: ${KEYCLOAK_URL:http://localhost:8082}
    realm: signature-router
    client-id: admin-cli
    client-secret: ${KEYCLOAK_ADMIN_CLIENT_SECRET}  # Vault
```

**2. Service Account:**

Crear service account en Keycloak con roles:
- `realm-admin` (para gestión de usuarios)
- `view-users`
- `manage-users`
- `manage-realm`

**3. Implementación:**

```java
@Service
@RequiredArgsConstructor
public class KeycloakAdminServiceImpl implements KeycloakAdminService {
    
    private final KeycloakAdminConfig config;
    private final RestTemplate restTemplate;
    
    @Override
    public List<UserResponse> getAllUsers() {
        String url = config.getServerUrl() + 
            "/admin/realms/" + config.getRealm() + "/users";
        
        String token = getAdminToken();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        
        ResponseEntity<KeycloakUser[]> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            KeycloakUser[].class
        );
        
        return Arrays.stream(response.getBody())
            .map(this::mapToUserResponse)
            .toList();
    }
    
    @Override
    public UserResponse createUser(CreateUserRequest request) {
        String url = config.getServerUrl() + 
            "/admin/realms/" + config.getRealm() + "/users";
        
        String token = getAdminToken();
        
        KeycloakUserRepresentation keycloakUser = KeycloakUserRepresentation.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .enabled(request.isEnabled())
            .emailVerified(request.isEmailVerified())
            .credentials(List.of(
                KeycloakCredential.builder()
                    .type("password")
                    .value(request.getPassword())
                    .temporary(true)
                    .build()
            ))
            .build();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        ResponseEntity<Void> response = restTemplate.exchange(
            url,
            HttpMethod.POST,
            new HttpEntity<>(keycloakUser, headers),
            Void.class
        );
        
        // Keycloak returns Location header with user ID
        String userId = extractUserIdFromLocation(response.getHeaders().getLocation());
        
        // Assign roles
        assignRoles(userId, request.getRoles());
        
        return getUserById(userId);
    }
    
    private String getAdminToken() {
        String url = config.getServerUrl() + 
            "/realms/master/protocol/openid-connect/token";
        
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", config.getClientId());
        body.add("client_secret", config.getClientSecret());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        ResponseEntity<KeycloakTokenResponse> response = restTemplate.postForEntity(
            url,
            new HttpEntity<>(body, headers),
            KeycloakTokenResponse.class
        );
        
        return response.getBody().getAccessToken();
    }
}
```

#### Modo MOCK para Desarrollo

**Opción: Active Directory vs Local Keycloak**

```yaml
# application.yml
admin:
  portal:
    user-management:
      mode: MOCK  # MOCK, LOCAL, ACTIVE_DIRECTORY
```

```java
@Service
@ConditionalOnProperty(name = "admin.portal.user-management.mode", havingValue = "MOCK")
public class KeycloakAdminServiceMockImpl implements KeycloakAdminService {
    
    private final List<UserResponse> mockUsers = List.of(
        UserResponse.builder()
            .id("mock-user-1")
            .username("admin")
            .email("admin@singularbank.com")
            .roles(List.of("ADMIN", "OPERATOR"))
            .build(),
        UserResponse.builder()
            .id("mock-user-2")
            .username("operator")
            .email("operator@singularbank.com")
            .roles(List.of("OPERATOR"))
            .build()
    );
    
    @Override
    public List<UserResponse> getAllUsers() {
        return mockUsers;
    }
    
    // ... implementar todos los métodos con mock data
}
```

### 📦 Esfuerzo Estimado

**Backend:**
- Keycloak Admin API client: 2 días
- CRUD endpoints: 2 días
- Mock implementation: 1 día
- Testing: 1 día
- **Total:** 1 semana

**Frontend:**
- Ya implementado con mock
- Solo integrar con RealApiClient
- **Total:** Incluido en Story 12.8

### 🔗 Dependencies

- ⚠️ Keycloak Admin Service Account (crear)
- ⚠️ Keycloak Admin Client Secret (Vault)
- ✅ Story 12.8 (Mock/Real toggle)

### 🎯 Definition of Done

- [ ] 6 endpoints implementados
- [ ] Keycloak Admin API integration funcionando
- [ ] Mock mode para desarrollo
- [ ] Tests unitarios (coverage >80%)
- [ ] Tests de integración con Testcontainers Keycloak
- [ ] OpenAPI documentation actualizada
- [ ] Frontend integrado con RealApiClient
- [ ] Roles mapping correcto

---

## Story 12.6: Keycloak Security Audit Endpoint 🔒

### 🎯 Objetivo

Implementar endpoints para visualizar métricas de seguridad y eventos de acceso desde Keycloak.

### 📄 Descripción

**Como** administrador de seguridad  
**Quiero** ver métricas de seguridad (2FA, tokens activos, intentos fallidos) y eventos de acceso  
**Para** auditar actividad del sistema

### ✅ Acceptance Criteria

```gherkin
Given Keycloak tiene eventos de login almacenados
When llamo a GET /api/v1/admin/security/overview
Then recibo:
  - Estado general de seguridad
  - % de usuarios con 2FA habilitado
  - Número de tokens activos
  - Intentos fallidos últimas 24h
When llamo a GET /api/v1/admin/security/access-audit?limit=100
Then recibo:
  - Lista de eventos de login (success/failure)
  - IP, timestamp, usuario, resultado
```

### 🔧 Especificación Técnica

#### Endpoints

```
GET /api/v1/admin/security/overview
GET /api/v1/admin/security/access-audit?limit={limit}&type={type}
GET /api/v1/admin/security/failed-logins?hours={hours}
```

#### Response Examples

**GET /api/v1/admin/security/overview**

```json
{
  "overview": {
    "totalUsers": 45,
    "activeUsers": 38,
    "usersWithMFA": 32,
    "mfaPercentage": 84.2,
    "activeSessions": 12,
    "activeTokens": 18
  },
  "failedLogins": {
    "last24h": 15,
    "last7d": 78,
    "last30d": 245
  },
  "passwordPolicies": {
    "minLength": 12,
    "requireSpecialChar": true,
    "requireUppercase": true,
    "requireDigit": true,
    "expiryDays": 90
  },
  "compliance": {
    "mfaCompliant": false,
    "mfaTarget": 95.0,
    "passwordPolicyCompliant": true,
    "sessionTimeoutCompliant": true
  }
}
```

**GET /api/v1/admin/security/access-audit**

```json
{
  "events": [
    {
      "id": "event-12345",
      "type": "LOGIN",
      "result": "SUCCESS",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john.doe",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-11-30T10:00:00Z",
      "details": {
        "clientId": "signature-router-client",
        "authMethod": "password+mfa"
      }
    },
    {
      "id": "event-12346",
      "type": "LOGIN_ERROR",
      "result": "FAILURE",
      "error": "invalid_credentials",
      "username": "jane.smith",
      "ipAddress": "192.168.1.105",
      "timestamp": "2025-11-30T09:45:00Z",
      "details": {
        "clientId": "signature-router-client",
        "attempts": 3
      }
    }
  ],
  "totalCount": 150,
  "page": 0,
  "size": 20
}
```

### 💻 Implementación Backend

#### Componentes a Crear

```
SecurityOverviewResponse.java (DTO)
AccessAuditResponse.java (DTO)
AccessEventDto.java (DTO)

KeycloakSecurityService.java (Interface)
KeycloakSecurityServiceImpl.java (Implementación)
SecurityAuditController.java (REST Controller - extender existente)
```

#### Keycloak Events API Integration

```java
@Service
@RequiredArgsConstructor
public class KeycloakSecurityServiceImpl implements KeycloakSecurityService {
    
    private final KeycloakAdminConfig config;
    private final RestTemplate restTemplate;
    
    @Override
    public SecurityOverviewResponse getSecurityOverview() {
        String token = getAdminToken();
        
        // Get all users
        List<UserResponse> users = getAllUsers(token);
        int totalUsers = users.size();
        int activeUsers = (int) users.stream().filter(UserResponse::isEnabled).count();
        
        // Count users with MFA
        int usersWithMFA = countUsersWithMFA(token);
        double mfaPercentage = (double) usersWithMFA / totalUsers * 100;
        
        // Get active sessions
        int activeSessions = getActiveSessions(token);
        
        // Get failed logins
        int failedLogins24h = getFailedLoginCount(token, 24);
        int failedLogins7d = getFailedLoginCount(token, 168);
        
        return SecurityOverviewResponse.builder()
            .overview(SecurityOverview.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .usersWithMFA(usersWithMFA)
                .mfaPercentage(mfaPercentage)
                .activeSessions(activeSessions)
                .build())
            .failedLogins(FailedLoginsStats.builder()
                .last24h(failedLogins24h)
                .last7d(failedLogins7d)
                .build())
            .build();
    }
    
    @Override
    public AccessAuditResponse getAccessAudit(int limit, String type) {
        String url = config.getServerUrl() + 
            "/admin/realms/" + config.getRealm() + "/events";
        
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
            .queryParam("max", limit);
        
        if (type != null) {
            builder.queryParam("type", type);
        }
        
        String token = getAdminToken();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        
        ResponseEntity<KeycloakEvent[]> response = restTemplate.exchange(
            builder.toUriString(),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            KeycloakEvent[].class
        );
        
        List<AccessEventDto> events = Arrays.stream(response.getBody())
            .map(this::mapToAccessEvent)
            .toList();
        
        return AccessAuditResponse.builder()
            .events(events)
            .totalCount(events.size())
            .build();
    }
    
    private int countUsersWithMFA(String token) {
        String url = config.getServerUrl() + 
            "/admin/realms/" + config.getRealm() + "/users";
        
        // Keycloak API para obtener usuarios
        // Filtrar por atributo OTP (One-Time Password configured)
        // requiredActions: CONFIGURE_TOTP
        
        // Por ahora simplificado
        return 0; // TODO: Implementar
    }
}
```

### 📦 Esfuerzo Estimado

- Keycloak Events API integration: 2 días
- Security overview calculations: 1 día
- Testing: 1 día
- **Total:** 3-4 días

### 🔗 Dependencies

- ✅ Story 12.5 (Keycloak Admin Service)
- ✅ Story 12.8 (Mock/Real toggle)

### 🎯 Definition of Done

- [ ] 3 endpoints implementados
- [ ] Keycloak Events API integration funcionando
- [ ] MFA percentage calculation
- [ ] Failed logins tracking
- [ ] Tests unitarios (coverage >80%)
- [ ] OpenAPI documentation actualizada
- [ ] Frontend integrado

---

## Story 12.7: Prometheus AlertManager Integration 🚨

### 🎯 Objetivo

Implementar integración con Prometheus AlertManager para mostrar alertas del sistema en el Admin Panel.

### 📄 Descripción

**Como** operador  
**Quiero** ver alertas del sistema (provider down, SLO degraded, high error rate) en el Admin Panel  
**Para** responder rápidamente a incidentes sin ir a Prometheus

### ✅ Acceptance Criteria

```gherkin
Given Prometheus AlertManager está configurado
When llamo a GET /api/v1/admin/alerts
Then recibo:
  - Lista de alertas activas
  - Severidad (CRITICAL, WARNING, INFO)
  - Estado (ACTIVE, PENDING, RESOLVED)
  - Descripción, timestamp, labels
When llamo a PUT /api/v1/admin/alerts/{id}/acknowledge
Then la alerta se marca como reconocida (silenced en AlertManager)
When llamo a PUT /api/v1/admin/alerts/{id}/resolve
Then la alerta se marca como resuelta
```

### 🔧 Especificación Técnica

#### Endpoints

```
GET /api/v1/admin/alerts?severity={severity}&status={status}&limit={limit}
GET /api/v1/admin/alerts/{id}
PUT /api/v1/admin/alerts/{id}/acknowledge
PUT /api/v1/admin/alerts/{id}/resolve
```

#### Response Examples

**GET /api/v1/admin/alerts**

```json
{
  "alerts": [
    {
      "id": "alert-provider-sms-down",
      "name": "ProviderDown",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "message": "SMS Provider (Twilio) is DOWN",
      "description": "Circuit breaker for SMS provider has been OPEN for 5 minutes",
      "startsAt": "2025-11-30T10:00:00Z",
      "endsAt": null,
      "labels": {
        "provider": "twilio-sms",
        "type": "SMS",
        "severity": "critical"
      },
      "annotations": {
        "summary": "SMS Provider Down",
        "description": "Circuit breaker OPEN, automatic fallback to VOICE activated"
      },
      "generatorURL": "http://prometheus:9090/graph?...",
      "acknowledged": false,
      "acknowledgedBy": null,
      "acknowledgedAt": null
    },
    {
      "id": "alert-high-error-rate",
      "name": "HighErrorRate",
      "severity": "WARNING",
      "status": "ACTIVE",
      "message": "Error rate > 10% in last 5 minutes",
      "startsAt": "2025-11-30T09:55:00Z",
      "labels": {
        "channel": "PUSH",
        "severity": "warning"
      },
      "acknowledged": true,
      "acknowledgedBy": "john.doe",
      "acknowledgedAt": "2025-11-30T10:05:00Z"
    }
  ],
  "summary": {
    "totalActive": 2,
    "critical": 1,
    "warning": 1,
    "info": 0
  }
}
```

**PUT /api/v1/admin/alerts/{id}/acknowledge**

```json
// Request
{
  "comment": "Investigating the issue",
  "duration": "1h"  // Silence for 1 hour
}

// Response
{
  "id": "alert-provider-sms-down",
  "status": "ACKNOWLEDGED",
  "acknowledgedBy": "john.doe",
  "acknowledgedAt": "2025-11-30T10:10:00Z",
  "silenceId": "silence-12345",
  "silenceEndsAt": "2025-11-30T11:10:00Z"
}
```

### 💻 Implementación Backend

#### Componentes a Crear

```
AlertResponse.java (DTO)
AlertListResponse.java (DTO)
AcknowledgeAlertRequest.java (DTO)

AlertManagerService.java (Interface)
AlertManagerServiceImpl.java (Implementación)
AlertManagerServiceMockImpl.java (Mock para desarrollo)
AlertsController.java (REST Controller)

AlertManagerConfig.java (Configuration)
```

#### Prometheus AlertManager API Integration

**1. Configuración:**

```yaml
# application.yml
admin:
  portal:
    alerts:
      mock: false  # true para desarrollo sin AlertManager
      
alertmanager:
  url: ${ALERTMANAGER_URL:http://localhost:9093}
  api-version: v2
```

**2. Implementación:**

```java
@Service
@ConditionalOnProperty(name = "admin.portal.alerts.mock", havingValue = "false")
@RequiredArgsConstructor
public class AlertManagerServiceImpl implements AlertManagerService {
    
    private final AlertManagerConfig config;
    private final RestTemplate restTemplate;
    
    @Override
    public AlertListResponse getAllAlerts(String severity, String status, Integer limit) {
        String url = config.getUrl() + "/api/v2/alerts";
        
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url);
        
        if (severity != null) {
            builder.queryParam("filter", "severity=" + severity);
        }
        
        ResponseEntity<PrometheusAlert[]> response = restTemplate.exchange(
            builder.toUriString(),
            HttpMethod.GET,
            null,
            PrometheusAlert[].class
        );
        
        List<AlertResponse> alerts = Arrays.stream(response.getBody())
            .map(this::mapToAlertResponse)
            .limit(limit != null ? limit : 100)
            .toList();
        
        return AlertListResponse.builder()
            .alerts(alerts)
            .summary(calculateSummary(alerts))
            .build();
    }
    
    @Override
    public void acknowledgeAlert(String alertId, AcknowledgeAlertRequest request) {
        // Create silence in AlertManager
        String url = config.getUrl() + "/api/v2/silences";
        
        SilenceRequest silence = SilenceRequest.builder()
            .matchers(List.of(
                Matcher.builder()
                    .name("alertname")
                    .value(alertId)
                    .isRegex(false)
                    .build()
            ))
            .startsAt(Instant.now())
            .endsAt(Instant.now().plus(parseDuration(request.getDuration())))
            .createdBy(getCurrentUsername())
            .comment(request.getComment())
            .build();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        ResponseEntity<SilenceResponse> response = restTemplate.postForEntity(
            url,
            new HttpEntity<>(silence, headers),
            SilenceResponse.class
        );
        
        log.info("Alert {} acknowledged, silence ID: {}", 
            alertId, response.getBody().getSilenceId());
    }
    
    private AlertSummary calculateSummary(List<AlertResponse> alerts) {
        long critical = alerts.stream()
            .filter(a -> "CRITICAL".equals(a.getSeverity()))
            .count();
        
        long warning = alerts.stream()
            .filter(a -> "WARNING".equals(a.getSeverity()))
            .count();
        
        return AlertSummary.builder()
            .totalActive(alerts.size())
            .critical((int) critical)
            .warning((int) warning)
            .build();
    }
}
```

**3. Mock Implementation:**

```java
@Service
@ConditionalOnProperty(name = "admin.portal.alerts.mock", havingValue = "true", matchIfMissing = true)
public class AlertManagerServiceMockImpl implements AlertManagerService {
    
    private final List<AlertResponse> mockAlerts = List.of(
        AlertResponse.builder()
            .id("alert-provider-sms-down")
            .name("ProviderDown")
            .severity("CRITICAL")
            .status("ACTIVE")
            .message("SMS Provider (Twilio) is DOWN")
            .startsAt(Instant.now().minus(Duration.ofMinutes(15)))
            .labels(Map.of("provider", "twilio-sms", "severity", "critical"))
            .build(),
        AlertResponse.builder()
            .id("alert-high-error-rate")
            .name("HighErrorRate")
            .severity("WARNING")
            .status("ACTIVE")
            .message("Error rate > 10% in last 5 minutes")
            .startsAt(Instant.now().minus(Duration.ofMinutes(10)))
            .labels(Map.of("channel", "PUSH", "severity", "warning"))
            .build()
    );
    
    @Override
    public AlertListResponse getAllAlerts(String severity, String status, Integer limit) {
        List<AlertResponse> filtered = mockAlerts;
        
        if (severity != null) {
            filtered = filtered.stream()
                .filter(a -> severity.equalsIgnoreCase(a.getSeverity()))
                .toList();
        }
        
        return AlertListResponse.builder()
            .alerts(filtered)
            .summary(calculateSummary(filtered))
            .build();
    }
    
    @Override
    public void acknowledgeAlert(String alertId, AcknowledgeAlertRequest request) {
        log.info("[MOCK] Alert {} acknowledged: {}", alertId, request.getComment());
        // No-op en modo mock
    }
}
```

### 📦 Esfuerzo Estimado

- AlertManager API client: 1 día
- CRUD endpoints: 1 día
- Mock implementation: 0.5 día
- Testing: 0.5 día
- **Total:** 2 días

### 🔗 Dependencies

- ⚠️ Prometheus AlertManager (verificar si existe)
- ✅ Story 12.8 (Mock/Real toggle)

### 🎯 Definition of Done

- [ ] 4 endpoints implementados
- [ ] AlertManager API integration funcionando
- [ ] Mock mode para desarrollo
- [ ] Acknowledge/Resolve funcionalidad
- [ ] Tests unitarios (coverage >80%)
- [ ] OpenAPI documentation actualizada
- [ ] Frontend integrado con RealApiClient

---

## 📊 RESUMEN DE ESFUERZOS

| Story | Effort | Prioridad | Dependencies |
|-------|--------|-----------|--------------|
| 12.4 Metrics Analytics | 1 semana | Media | 12.8 |
| 12.5 Keycloak Users | 1 semana | Media | 12.8, Keycloak Admin |
| 12.6 Keycloak Security | 3-4 días | Media | 12.5, 12.8 |
| 12.7 AlertManager | 2 días | Media | 12.8, AlertManager |

**Total Fase 2:** ~3 semanas

---

## 🎯 PRIORIZACIÓN RECOMENDADA

### Opción A: MVP Rápido (Solo Fase 1) ✅

**Ya completado:**
- ✅ Dashboard con métricas básicas
- ✅ Listado de firmas con filtros
- ✅ Proveedores con health status
- ✅ Reglas de routing (Epic 2)

**Beneficio:**
- 4/8 pantallas funcionando con backend real
- **80% del valor de negocio** con solo 50% del esfuerzo
- Sistema productivo

### Opción B: Sistema Completo (Fase 1 + 2)

**Timeline:**
- Semana 1: Story 12.7 (AlertManager)
- Semana 2-3: Story 12.4 (Metrics Analytics)
- Semana 4: Story 12.6 (Keycloak Security)
- Semana 5: Story 12.5 (Keycloak Users)

**Beneficio:**
- 8/8 pantallas funcionando
- Admin Panel 100% funcional
- Zero mock data en producción

---

## 🔗 DEPENDENCIES EXTERNAS

### Para Story 12.5 & 12.6 (Keycloak)

**Crear en Keycloak:**
1. Service Account Client
   ```
   Client ID: signature-router-admin
   Client Protocol: openid-connect
   Access Type: confidential
   Service Accounts Enabled: ON
   ```

2. Asignar Roles al Service Account:
   - `realm-admin`
   - `view-users`
   - `manage-users`
   - `view-events`

3. Configurar en Vault:
   ```
   vault kv put secret/signature-router/keycloak \
     admin-client-id="signature-router-admin" \
     admin-client-secret="XXXXXXXXXX"
   ```

### Para Story 12.7 (AlertManager)

**Verificar si existe Prometheus AlertManager:**
- URL: `http://alertmanager:9093`
- API: `http://alertmanager:9093/api/v2/alerts`

**Si no existe, opciones:**
1. Instalar AlertManager (Docker Compose)
2. Usar sistema custom de alertas (tabla BD + event listeners)

---

## 💡 RECOMENDACIÓN FINAL

### Para Producción Inmediata: Opción A (MVP) ✅

**Razón:**
- Ya tienes 4/8 pantallas funcionando
- Cubre 80% de casos de uso diarios
- Resto de pantallas siguen funcionando con mock (demos)

### Para Sistema Completo: Opción B (Fase 2)

**Solo si:**
- Necesitas gestión de usuarios desde UI (vs Keycloak Admin Console)
- Necesitas alertas centralizadas (vs ir a Prometheus)
- Necesitas métricas avanzadas (vs Grafana)

**Si no es crítico:** Postergar Fase 2 para Epic 13 o futuro.

---

**Documento creado:** 1 de diciembre de 2025  
**Autor:** BMAD Technical Lead  
**Próxima revisión:** Post-decisión Fase 2

