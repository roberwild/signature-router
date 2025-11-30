# Epic 13: Providers CRUD Management

**Fecha de Creación:** 30 de noviembre de 2025  
**Owner:** Product Manager + Architect  
**Estado:** 📋 Planificación  
**Prioridad:** Media  
**Effort Total:** 2-3 semanas

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Objetivo](#objetivo)
3. [Contexto](#contexto)
4. [User Stories](#user-stories)
5. [Arquitectura](#arquitectura)
6. [Decisiones Técnicas](#decisiones-técnicas)
7. [Effort Estimation](#effort-estimation)
8. [Dependencies](#dependencies)
9. [Acceptance Criteria](#acceptance-criteria)
10. [Implementation Strategy](#implementation-strategy)

---

## 🎯 Resumen Ejecutivo

Actualmente, los **providers de firma** (Twilio SMS, FCM Push, Voice, Biometric) se configuran estáticamente en `application.yml` y requieren **reiniciar el servicio** para cualquier cambio. Esta Epic implementa un **sistema de gestión dinámica** que permite a los administradores:

- ✅ **Crear/modificar/eliminar providers** desde el Admin Portal
- ✅ **Hot reload** sin reiniciar el servicio
- ✅ **Credenciales seguras** en Vault
- ✅ **Testing de providers** antes de activarlos
- ✅ **Versionado y auditoría** de cambios
- ✅ **Templates pre-configurados** para setup rápido

**Valor de Negocio:**
- ⚡ **Time to Market:** De horas/días a minutos para agregar un nuevo provider
- 🔧 **Operaciones:** Sin downtime para cambios de configuración
- 🔒 **Seguridad:** Credenciales en Vault (no en archivos YAML)
- 📊 **Auditabilidad:** Historial completo de cambios

---

## 🎯 Objetivo

> **Como** administrador del sistema  
> **Quiero** gestionar providers de firma dinámicamente desde el Admin Portal  
> **Para** poder agregar, modificar o deshabilitar canales de firma sin reiniciar el servicio

### Success Criteria

| Métrica | Objetivo |
|---------|----------|
| **Time to add provider** | < 5 minutos (vs 30-60 min actual) |
| **Downtime para cambios** | 0 segundos (vs 2-5 min actual) |
| **Credenciales en Vault** | 100% (vs 0% actual) |
| **Testing pre-producción** | Test providers desde UI antes de activar |
| **Audit trail** | 100% de cambios registrados con quién/cuándo/qué |

---

## 📖 Contexto

### Estado Actual (Post Epic 12)

**Story 12.3** implementó endpoints **read-only** para providers:

```java
// Providers configurados estáticamente en application.yml
providers:
  twilio:
    enabled: true
    timeout-seconds: 5
    account-sid: ${TWILIO_ACCOUNT_SID}
    auth-token: ${TWILIO_AUTH_TOKEN}
```

**Limitaciones:**
- ❌ Cambios requieren modificar YAML + reiniciar servicio
- ❌ Credenciales en variables de entorno (menos seguro)
- ❌ No hay historial de cambios
- ❌ No se puede testear un provider antes de activarlo
- ❌ Agregar un nuevo tipo de provider requiere código

### Estado Futuro (Epic 13)

**Gestión dinámica desde Admin Portal:**

```
Admin UI → REST API → Provider Service → Vault → Hot Reload → Provider activo
```

**Mejoras:**
- ✅ CRUD completo desde UI
- ✅ Credenciales en Vault
- ✅ Hot reload sin reiniciar
- ✅ Testing integrado
- ✅ Audit log completo
- ✅ Templates para providers comunes

---

## 📝 User Stories

### Story 13.1: Provider Database Schema & Migration 🗄️

**Prioridad:** CRÍTICA (Foundation)  
**Effort:** 1 día

**Como** desarrollador  
**Quiero** un esquema de base de datos para almacenar providers dinámicamente  
**Para** poder gestionar configuraciones fuera de archivos YAML

#### Acceptance Criteria

```gherkin
Given necesito almacenar providers dinámicamente
When ejecuto las migraciones LiquidBase
Then se crean las tablas:
  - provider_config (configuración de providers)
  - provider_credential (credenciales en Vault)
  - provider_config_history (auditoría de cambios)
And todas las tablas tienen:
  - UUIDv7 como primary key
  - Timestamps (created_at, updated_at)
  - Audit fields (created_by, updated_by)
```

#### Technical Details

**Tablas:**

1. **`provider_config`**
   - `id` (UUIDv7, PK)
   - `provider_type` (SMS, PUSH, VOICE, BIOMETRIC)
   - `provider_name` (Twilio SMS, FCM Push, etc.)
   - `enabled` (boolean)
   - `priority` (integer - para fallback order)
   - `timeout_seconds` (integer)
   - `retry_max_attempts` (integer)
   - `config_json` (JSONB - configuración específica)
   - `vault_path` (string - path a credenciales en Vault)
   - `created_at`, `updated_at`, `created_by`, `updated_by`

2. **`provider_credential`**
   - `id` (UUIDv7, PK)
   - `provider_config_id` (FK)
   - `vault_key` (string - key en Vault)
   - `credential_type` (API_KEY, OAUTH, BASIC_AUTH)
   - `created_at`, `updated_at`, `created_by`

3. **`provider_config_history`**
   - `id` (UUIDv7, PK)
   - `provider_config_id` (FK)
   - `action` (CREATE, UPDATE, DELETE, ENABLE, DISABLE)
   - `changes_json` (JSONB - diff de cambios)
   - `changed_by` (string - username)
   - `changed_at` (timestamp)

**Archivo:** `changelog-0015-provider-config-tables.yaml`

---

### Story 13.2: Provider Domain Model & Repository 🏗️

**Prioridad:** CRÍTICA (Foundation)  
**Effort:** 1 día

**Como** desarrollador  
**Quiero** entidades de dominio y repositorios para providers  
**Para** implementar la lógica de negocio de gestión de providers

#### Acceptance Criteria

```gherkin
Given el esquema de BD está creado
When implemento el modelo de dominio
Then tengo:
  - Entity: ProviderConfig (aggregate root)
  - Value Objects: ProviderCredential, ProviderType
  - Repository: ProviderConfigRepository
  - Domain Events: ProviderCreated, ProviderUpdated, ProviderDeleted
And sigue arquitectura hexagonal:
  - Domain entities en /domain/model
  - Repository port en /domain/port/outbound
  - JPA adapter en /infrastructure/adapter/outbound/persistence
```

#### Technical Details

**Domain Model:**

```java
@Entity
@Table(name = "provider_config")
public class ProviderConfig {
    @Id
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    private ProviderType type;
    
    private String name;
    private boolean enabled;
    private int priority;
    private int timeoutSeconds;
    private int retryMaxAttempts;
    
    @Type(JsonType.class)
    private Map<String, Object> configJson;
    
    private String vaultPath;
    
    // Audit fields
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
}

public enum ProviderType {
    SMS,
    PUSH,
    VOICE,
    BIOMETRIC
}
```

**Repository Interface:**

```java
public interface ProviderConfigRepository {
    ProviderConfig save(ProviderConfig config);
    Optional<ProviderConfig> findById(UUID id);
    List<ProviderConfig> findAll();
    List<ProviderConfig> findByType(ProviderType type);
    List<ProviderConfig> findByEnabled(boolean enabled);
    List<ProviderConfig> findByTypeAndEnabled(ProviderType type, boolean enabled);
    void deleteById(UUID id);
}
```

---

### Story 13.3: Provider CRUD Use Cases 💼

**Prioridad:** ALTA  
**Effort:** 2 días

**Como** desarrollador  
**Quiero** casos de uso para gestionar providers  
**Para** encapsular la lógica de negocio de CRUD

#### Acceptance Criteria

```gherkin
Given tengo el modelo de dominio implementado
When implemento los use cases
Then tengo:
  - CreateProviderUseCase
  - UpdateProviderUseCase
  - DeleteProviderUseCase
  - GetProviderUseCase
  - ListProvidersUseCase
  - EnableProviderUseCase
  - DisableProviderUseCase
  - TestProviderConnectionUseCase
And cada use case:
  - Valida reglas de negocio
  - Publica eventos de dominio
  - Registra en audit log
```

#### Technical Details

**Use Cases:**

1. **CreateProviderUseCase**
   - Validar datos obligatorios
   - Validar credenciales en Vault
   - Asignar prioridad automática
   - Publicar `ProviderCreatedEvent`

2. **UpdateProviderUseCase**
   - Validar cambios
   - Guardar snapshot en history
   - Publicar `ProviderUpdatedEvent`
   - Trigger hot reload

3. **DeleteProviderUseCase**
   - Validar que no hay requests activos
   - Soft delete (enabled=false)
   - Publicar `ProviderDeletedEvent`

4. **TestProviderConnectionUseCase**
   - Conectar temporalmente con credenciales
   - Enviar mensaje de prueba
   - Retornar resultado (success/error)

---

### Story 13.4: Provider CRUD REST API 🌐

**Prioridad:** ALTA  
**Effort:** 2 días

**Como** administrador  
**Quiero** endpoints REST para gestionar providers  
**Para** realizar operaciones CRUD desde el Admin Portal

#### Acceptance Criteria

```gherkin
Given soy un administrador autenticado
When llamo a POST /api/v1/admin/providers
Then puedo crear un nuevo provider con:
  - Tipo (SMS, PUSH, VOICE, BIOMETRIC)
  - Nombre
  - Configuración JSON
  - Credenciales (enviadas a Vault)
When llamo a PUT /api/v1/admin/providers/{id}
Then puedo actualizar configuración
When llamo a DELETE /api/v1/admin/providers/{id}
Then el provider se deshabilita (soft delete)
When llamo a POST /api/v1/admin/providers/{id}/test
Then puedo testear la conexión antes de activar
```

#### Technical Details

**Endpoints:**

```
POST   /api/v1/admin/providers
GET    /api/v1/admin/providers
GET    /api/v1/admin/providers/{id}
PUT    /api/v1/admin/providers/{id}
DELETE /api/v1/admin/providers/{id}
PUT    /api/v1/admin/providers/{id}/enable
PUT    /api/v1/admin/providers/{id}/disable
POST   /api/v1/admin/providers/{id}/test
GET    /api/v1/admin/providers/{id}/history
```

**DTOs:**

```java
public record CreateProviderRequest(
    @NotNull ProviderType type,
    @NotBlank String name,
    @NotNull Map<String, Object> config,
    @NotNull ProviderCredentials credentials,
    int timeoutSeconds,
    int retryMaxAttempts
) {}

public record ProviderCredentials(
    String apiKey,
    String apiSecret,
    String accountSid,
    String authToken
    // ... otros según tipo
) {}

public record ProviderResponse(
    UUID id,
    ProviderType type,
    String name,
    boolean enabled,
    int priority,
    Map<String, Object> config,
    String healthStatus,
    Instant createdAt,
    String createdBy
) {}
```

**Security:**
- Requiere rol `ADMIN`
- Credenciales nunca se retornan en GET (solo metadata)
- HTTPS obligatorio

---

### Story 13.5: Vault Integration for Credentials 🔐

**Prioridad:** CRÍTICA  
**Effort:** 2 días

**Como** administrador  
**Quiero** que las credenciales se almacenen en Vault  
**Para** cumplir con estándares de seguridad bancaria

#### Acceptance Criteria

```gherkin
Given creo un nuevo provider con credenciales
When el sistema guarda el provider
Then las credenciales se almacenan en Vault en:
  - Path: secret/signature-router/providers/{provider-id}
  - Keys: api_key, api_secret, account_sid, etc.
And en la BD solo se guarda el vault_path
And las credenciales nunca se exponen en logs
And las credenciales se rotan automáticamente cada 90 días
```

#### Technical Details

**Vault Service:**

```java
@Service
public class ProviderVaultService {
    
    public void storeCredentials(UUID providerId, ProviderCredentials credentials) {
        String path = String.format("secret/signature-router/providers/%s", providerId);
        
        Map<String, String> secrets = Map.of(
            "api_key", credentials.apiKey(),
            "api_secret", credentials.apiSecret(),
            "account_sid", credentials.accountSid(),
            "auth_token", credentials.authToken()
        );
        
        vaultOperations.write(path, secrets);
    }
    
    public ProviderCredentials retrieveCredentials(String vaultPath) {
        VaultResponse response = vaultOperations.read(vaultPath);
        return mapToCredentials(response.getData());
    }
    
    public void rotateCredentials(UUID providerId) {
        // Trigger rotation in Vault
        // Update provider config with new vault path version
    }
}
```

**Vault Paths:**

```
secret/
  signature-router/
    providers/
      {provider-uuid-1}/
        - api_key
        - api_secret
        - account_sid
        - auth_token
      {provider-uuid-2}/
        - fcm_server_key
        - fcm_project_id
```

---

### Story 13.6: Hot Reload Provider Registry 🔥

**Prioridad:** ALTA  
**Effort:** 3 días

**Como** operador  
**Quiero** que los cambios de providers se apliquen sin reiniciar  
**Para** evitar downtime en producción

#### Acceptance Criteria

```gherkin
Given el servicio está ejecutándose
When actualizo un provider en la BD
Then el sistema:
  - Detecta el cambio automáticamente
  - Recarga el provider sin reiniciar
  - Actualiza el registry en memoria
  - Publica evento ProviderReloadedEvent
And las signature requests en curso NO se interrumpen
And el nuevo provider está disponible en <5 segundos
```

#### Technical Details

**Provider Registry:**

```java
@Service
public class DynamicProviderRegistry implements ProviderRegistry {
    
    private final Map<UUID, SignatureProvider> providers = new ConcurrentHashMap<>();
    private final ProviderConfigRepository repository;
    private final ProviderFactory factory;
    
    @PostConstruct
    public void initialize() {
        loadAllProviders();
        startWatcher();
    }
    
    private void loadAllProviders() {
        List<ProviderConfig> configs = repository.findByEnabled(true);
        configs.forEach(this::registerProvider);
    }
    
    private void startWatcher() {
        // Option A: Polling (simple)
        @Scheduled(fixedDelay = 5000)
        public void checkForUpdates() {
            // Check updated_at timestamps
            // Reload changed providers
        }
        
        // Option B: Database triggers + notification (advanced)
        // PostgreSQL LISTEN/NOTIFY
    }
    
    public void registerProvider(ProviderConfig config) {
        SignatureProvider provider = factory.create(config);
        providers.put(config.getId(), provider);
        log.info("Provider registered: {} ({})", config.getName(), config.getType());
    }
    
    public void unregisterProvider(UUID providerId) {
        SignatureProvider removed = providers.remove(providerId);
        if (removed != null) {
            removed.shutdown();
        }
    }
    
    @Override
    public SignatureProvider getByType(ProviderType type) {
        return providers.values().stream()
            .filter(p -> p.getType() == type)
            .filter(SignatureProvider::isEnabled)
            .findFirst()
            .orElseThrow(() -> new ProviderNotFoundException(type));
    }
}
```

**Provider Factory:**

```java
@Component
public class ProviderFactory {
    
    public SignatureProvider create(ProviderConfig config) {
        ProviderCredentials credentials = vaultService.retrieveCredentials(config.getVaultPath());
        
        return switch (config.getType()) {
            case SMS -> createSmsProvider(config, credentials);
            case PUSH -> createPushProvider(config, credentials);
            case VOICE -> createVoiceProvider(config, credentials);
            case BIOMETRIC -> createBiometricProvider(config, credentials);
        };
    }
    
    private SignatureProvider createSmsProvider(ProviderConfig config, ProviderCredentials creds) {
        // Read config.configJson for provider-specific settings
        String fromNumber = (String) config.getConfigJson().get("from_number");
        
        return TwilioSmsProvider.builder()
            .accountSid(creds.accountSid())
            .authToken(creds.authToken())
            .fromNumber(fromNumber)
            .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
            .retryMaxAttempts(config.getRetryMaxAttempts())
            .build();
    }
}
```

---

### Story 13.7: Provider Templates & Presets 📋

**Prioridad:** MEDIA  
**Effort:** 2 días

**Como** administrador  
**Quiero** templates pre-configurados para providers comunes  
**Para** configurar rápidamente sin conocer todos los parámetros

#### Acceptance Criteria

```gherkin
Given quiero agregar un provider Twilio SMS
When selecciono el template "Twilio SMS"
Then el formulario se pre-llena con:
  - Tipo: SMS
  - Timeout: 5 segundos
  - Retry: 3 intentos
  - Campos requeridos: account_sid, auth_token, from_number
And solo necesito ingresar las credenciales
And el template incluye validación específica
```

#### Technical Details

**Templates:**

```java
public enum ProviderTemplate {
    TWILIO_SMS("Twilio SMS", ProviderType.SMS, Map.of(
        "timeout_seconds", 5,
        "retry_max_attempts", 3,
        "config", Map.of(
            "api_url", "https://api.twilio.com/2010-04-01",
            "from_number", "+1234567890"  // placeholder
        ),
        "required_credentials", List.of("account_sid", "auth_token")
    )),
    
    FCM_PUSH("Firebase Cloud Messaging", ProviderType.PUSH, Map.of(
        "timeout_seconds", 3,
        "retry_max_attempts", 2,
        "config", Map.of(
            "api_url", "https://fcm.googleapis.com/fcm/send",
            "fcm_project_id", ""  // placeholder
        ),
        "required_credentials", List.of("fcm_server_key")
    )),
    
    TWILIO_VOICE("Twilio Voice Call", ProviderType.VOICE, Map.of(
        "timeout_seconds", 10,
        "retry_max_attempts", 2,
        "config", Map.of(
            "api_url", "https://api.twilio.com/2010-04-01",
            "tts_language", "es-ES",
            "tts_voice", "Polly.Mia",
            "max_call_duration", 60
        ),
        "required_credentials", List.of("account_sid", "auth_token")
    ));
    
    // ... más templates
}
```

**Endpoint:**

```
GET /api/v1/admin/providers/templates
```

**Response:**

```json
[
  {
    "id": "TWILIO_SMS",
    "name": "Twilio SMS",
    "type": "SMS",
    "description": "Send SMS via Twilio",
    "defaultConfig": {
      "timeout_seconds": 5,
      "retry_max_attempts": 3,
      "api_url": "https://api.twilio.com/2010-04-01"
    },
    "requiredCredentials": ["account_sid", "auth_token", "from_number"],
    "configSchema": {
      "from_number": {
        "type": "string",
        "pattern": "^\\+[1-9]\\d{1,14}$",
        "description": "Twilio phone number (E.164 format)"
      }
    }
  }
]
```

---

### Story 13.8: Provider Testing & Validation 🧪

**Prioridad:** ALTA  
**Effort:** 2 días

**Como** administrador  
**Quiero** testear un provider antes de activarlo  
**Para** verificar que funciona correctamente

#### Acceptance Criteria

```gherkin
Given he configurado un nuevo provider Twilio
When hago click en "Test Connection"
Then el sistema:
  - Crea instancia temporal del provider
  - Envía un mensaje de prueba a un número configurado
  - Retorna resultado (success/error) con detalles
And si el test falla:
  - Muestra mensaje de error descriptivo
  - Sugiere soluciones
And si el test pasa:
  - Permite habilitar el provider
```

#### Technical Details

**Test Endpoint:**

```
POST /api/v1/admin/providers/{id}/test
```

**Request:**

```json
{
  "testType": "SMS",
  "testTarget": "+34600123456",  // Phone number for SMS test
  "testMessage": "Test message from Signature Router"
}
```

**Response:**

```json
{
  "success": true,
  "duration": 1234,  // milliseconds
  "providerResponse": {
    "messageId": "SM1234567890",
    "status": "sent",
    "timestamp": "2025-11-30T10:30:00Z"
  },
  "recommendation": "Provider is working correctly. Safe to enable."
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Authentication failed",
  "errorCode": "20003",
  "details": "Invalid Account SID or Auth Token",
  "recommendation": "Verify your Twilio credentials in Vault",
  "documentationUrl": "https://www.twilio.com/docs/errors/20003"
}
```

---

### Story 13.9: Provider Audit Log & History 📜

**Prioridad:** MEDIA  
**Effort:** 1 día

**Como** auditor  
**Quiero** ver historial completo de cambios en providers  
**Para** compliance y troubleshooting

#### Acceptance Criteria

```gherkin
Given un provider ha sido modificado varias veces
When accedo a /api/v1/admin/providers/{id}/history
Then veo:
  - Lista de todos los cambios (CREATE, UPDATE, DELETE, ENABLE, DISABLE)
  - Quién hizo el cambio (username)
  - Cuándo se hizo (timestamp)
  - Qué cambió (diff JSON)
And puedo filtrar por:
  - Tipo de acción
  - Rango de fechas
  - Usuario
```

#### Technical Details

**History Endpoint:**

```
GET /api/v1/admin/providers/{id}/history?action=UPDATE&from=2025-11-01&to=2025-11-30
```

**Response:**

```json
[
  {
    "id": "hist-001",
    "providerConfigId": "prov-123",
    "action": "UPDATE",
    "changedBy": "admin@singularbank.com",
    "changedAt": "2025-11-30T10:30:00Z",
    "changes": {
      "timeout_seconds": {
        "old": 5,
        "new": 10
      },
      "retry_max_attempts": {
        "old": 3,
        "new": 5
      }
    },
    "reason": "Increase timeout due to high latency observed"
  }
]
```

---

### Story 13.10: Admin UI - Providers Management Page 🖥️

**Prioridad:** ALTA  
**Effort:** 3 días

**Como** administrador  
**Quiero** una interfaz gráfica para gestionar providers  
**Para** no tener que usar curl o API directamente

#### Acceptance Criteria

```gherkin
Given accedo al Admin Portal → Providers
Then veo:
  - Lista de providers con estado (enabled/disabled)
  - Health status de cada provider
  - Botón "Add Provider"
And puedo:
  - Crear provider desde template
  - Editar configuración inline
  - Habilitar/deshabilitar con toggle
  - Testear conexión con un click
  - Ver historial de cambios
  - Eliminar provider (con confirmación)
```

#### Technical Details

**Página:** `/admin/providers`

**Componentes React:**

1. **ProvidersListPage**
   - Table con providers
   - Filters (type, enabled/disabled)
   - Search
   - Actions (edit, delete, test)

2. **CreateProviderDialog**
   - Template selector
   - Form dinámico según template
   - Credential inputs (encrypted)
   - Test button
   - Save & Enable

3. **EditProviderDialog**
   - Similar a create
   - Muestra valores actuales
   - Permite cambios parciales
   - Audit log preview

4. **ProviderHistoryDialog**
   - Timeline de cambios
   - Diff viewer
   - Filter por acción/fecha

**API Integration:**

```typescript
// lib/api/providers-client.ts
export class ProvidersClient {
  async listProviders(): Promise<Provider[]> {
    return this.apiClient.get('/api/v1/admin/providers');
  }
  
  async createProvider(request: CreateProviderRequest): Promise<Provider> {
    return this.apiClient.post('/api/v1/admin/providers', request);
  }
  
  async testProvider(id: string): Promise<TestResult> {
    return this.apiClient.post(`/api/v1/admin/providers/${id}/test`);
  }
  
  // ... más métodos
}
```

---

## 🏗️ Arquitectura

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Portal (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Providers  │  │    Create    │  │     Test     │      │
│  │     List     │  │   Provider   │  │   Provider   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Provider Management Controller                  │
│                    (Inbound Adapter)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Provider Use Cases                          │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐            │
│  │   Create   │ │   Update   │ │   Delete     │            │
│  │  Provider  │ │  Provider  │ │   Provider   │            │
│  └────────────┘ └────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌──────────────────────┐          ┌────────────────────┐
│  ProviderConfig      │          │  DynamicProvider   │
│  Repository          │          │  Registry          │
│  (Outbound Port)     │          │  (Hot Reload)      │
└──────────────────────┘          └────────────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────────────┐          ┌────────────────────┐
│  PostgreSQL          │          │  In-Memory         │
│  (provider_config)   │          │  Provider Map      │
└──────────────────────┘          └────────────────────┘
          │
          ▼
┌──────────────────────┐
│  HashiCorp Vault     │
│  (Credentials)       │
└──────────────────────┘
```

### Database Schema

```sql
-- provider_config
CREATE TABLE provider_config (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    provider_type VARCHAR(20) NOT NULL,  -- SMS, PUSH, VOICE, BIOMETRIC
    provider_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    priority INT NOT NULL,
    timeout_seconds INT NOT NULL,
    retry_max_attempts INT NOT NULL,
    config_json JSONB NOT NULL,
    vault_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT pk_provider_config PRIMARY KEY (id),
    CONSTRAINT ck_provider_type CHECK (provider_type IN ('SMS', 'PUSH', 'VOICE', 'BIOMETRIC'))
);

CREATE INDEX idx_provider_config_type ON provider_config(provider_type);
CREATE INDEX idx_provider_config_enabled ON provider_config(enabled);
CREATE INDEX idx_provider_config_priority ON provider_config(priority);

-- provider_config_history
CREATE TABLE provider_config_history (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    provider_config_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE, ENABLE, DISABLE
    changes_json JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_provider_config FOREIGN KEY (provider_config_id) 
        REFERENCES provider_config(id) ON DELETE CASCADE
);

CREATE INDEX idx_provider_history_config_id ON provider_config_history(provider_config_id);
CREATE INDEX idx_provider_history_action ON provider_config_history(action);
CREATE INDEX idx_provider_history_changed_at ON provider_config_history(changed_at);
```

---

## 🔧 Decisiones Técnicas

### Decisión 1: Configuración Estática vs Dinámica

**Problema:** ¿Mantener configuración YAML o migrar a base de datos?

**Opción A: Configuración Estática (YAML)** ❌
- Pro: Simple, no requiere BD
- Con: Cambios requieren reinicio
- Con: No hay historial de cambios
- Con: Credenciales en archivos

**Opción B: Configuración Dinámica (BD)** ✅
- Pro: Hot reload sin reinicio
- Pro: Audit trail completo
- Pro: Credenciales en Vault
- Con: Más complejidad inicial

**Decisión:** **Opción B** - Los beneficios operacionales superan la complejidad

---

### Decisión 2: Hot Reload Mechanism

**Problema:** ¿Cómo detectar cambios en providers?

**Opción A: Polling (cada 5 segundos)** ✅
- Pro: Simple de implementar
- Pro: Funciona en cualquier BD
- Con: Latencia de hasta 5 segundos
- Con: Queries periódicos

**Opción B: Database Triggers + LISTEN/NOTIFY** 🔶
- Pro: Latencia < 1 segundo
- Pro: No polling innecesario
- Con: Específico de PostgreSQL
- Con: Más complejo

**Opción C: Event Bus (Kafka)** ❌
- Pro: Desacoplado
- Con: Overkill para este caso
- Con: Latencia mayor

**Decisión:** **Opción A** para MVP, **Opción B** como optimización futura

---

### Decisión 3: Credenciales en Vault vs BD Encriptada

**Problema:** ¿Dónde almacenar credenciales de providers?

**Opción A: BD Encriptada** ❌
- Pro: Todo en un lugar
- Con: Keys de encriptación en el servicio
- Con: Menos seguro
- Con: No cumple estándares bancarios

**Opción B: HashiCorp Vault** ✅
- Pro: Estándar de la industria
- Pro: Rotación automática
- Pro: Audit log de accesos
- Pro: Cumple PCI-DSS
- Con: Dependencia externa

**Decisión:** **Opción B** - Vault es obligatorio para compliance bancario

---

### Decisión 4: Soft Delete vs Hard Delete

**Problema:** ¿Qué hacer cuando se elimina un provider?

**Opción A: Hard Delete** ❌
- Pro: Limpia la BD
- Con: Pierde historial
- Con: Puede romper auditoría

**Opción B: Soft Delete (enabled=false)** ✅
- Pro: Mantiene historial
- Pro: Puede reactivar
- Pro: Audit trail completo
- Con: Acumula registros

**Decisión:** **Opción B** - Soft delete con purge manual después de 1 año

---

## ⏱️ Effort Estimation

### Por Story

| Story | Descripción | Effort | Dependencies |
|-------|-------------|--------|--------------|
| 13.1 | Database Schema | 1 día | - |
| 13.2 | Domain Model | 1 día | 13.1 |
| 13.3 | Use Cases | 2 días | 13.2 |
| 13.4 | REST API | 2 días | 13.3 |
| 13.5 | Vault Integration | 2 días | 13.4 |
| 13.6 | Hot Reload Registry | 3 días | 13.2, 13.5 |
| 13.7 | Templates | 2 días | 13.4 |
| 13.8 | Testing & Validation | 2 días | 13.6 |
| 13.9 | Audit Log | 1 día | 13.3 |
| 13.10 | Admin UI | 3 días | 13.4, 13.7, 13.8 |

**Total:** 19 días (~3 semanas)

### Por Fase

**Fase 1: Foundation** (4 días)
- Story 13.1, 13.2, 13.3

**Fase 2: CRUD & Vault** (6 días)
- Story 13.4, 13.5, 13.7

**Fase 3: Hot Reload & Testing** (5 días)
- Story 13.6, 13.8, 13.9

**Fase 4: UI** (3 días)
- Story 13.10

---

## 📦 Dependencies

### External Dependencies

- ✅ **Vault** - Debe estar configurado y accesible
- ✅ **PostgreSQL** - Database para provider_config tables
- ✅ **Epic 12** - Admin Portal base ya existe
- ✅ **Epic 3** - Provider interfaces ya definidas

### Internal Dependencies

- Story 13.6 (Hot Reload) depende de 13.2, 13.5
- Story 13.10 (UI) depende de 13.4, 13.7, 13.8
- Todas las stories dependen de 13.1 (schema)

---

## ✅ Acceptance Criteria (Epic Level)

### Functional

- [ ] ✅ Puedo crear un provider desde Admin UI sin modificar YAML
- [ ] ✅ Puedo editar configuración de provider sin reiniciar servicio
- [ ] ✅ Puedo testear un provider antes de habilitarlo
- [ ] ✅ Credenciales se almacenan en Vault (no en BD)
- [ ] ✅ Cambios de provider se aplican en < 5 segundos
- [ ] ✅ Historial completo de cambios con quién/cuándo/qué
- [ ] ✅ Templates pre-configurados para providers comunes

### Non-Functional

- [ ] ✅ Zero downtime para cambios de configuración
- [ ] ✅ Audit log cumple con SOC 2
- [ ] ✅ Credenciales encriptadas en tránsito y en reposo
- [ ] ✅ Performance: Hot reload < 5 segundos
- [ ] ✅ Testing: Coverage > 75% para provider management

### Security

- [ ] ✅ Solo ADMIN puede gestionar providers
- [ ] ✅ Credenciales nunca se exponen en logs
- [ ] ✅ Credenciales nunca se retornan en GET
- [ ] ✅ HTTPS obligatorio para todos los endpoints
- [ ] ✅ Rotación automática de credenciales cada 90 días

---

## 🚀 Implementation Strategy

### Phase 0: Preparation (1 día)

1. Review architecture with team
2. Setup Vault paths for providers
3. Design database schema
4. Create Epic 13 branch

### Phase 1: Backend Foundation (1 semana)

**Sprint 1:**
- Day 1-2: Stories 13.1, 13.2 (Schema + Domain Model)
- Day 3-4: Story 13.3 (Use Cases)
- Day 5: Story 13.4 (REST API basic CRUD)

**Deliverable:** CRUD endpoints funcionando con BD

### Phase 2: Security & Hot Reload (1 semana)

**Sprint 2:**
- Day 1-2: Story 13.5 (Vault Integration)
- Day 3-5: Story 13.6 (Hot Reload Registry)

**Deliverable:** Hot reload funcional con credenciales en Vault

### Phase 3: Templates & Testing (3-4 días)

**Sprint 3:**
- Day 1-2: Story 13.7 (Templates)
- Day 3: Story 13.8 (Testing & Validation)
- Day 4: Story 13.9 (Audit Log)

**Deliverable:** Sistema completo con testing y templates

### Phase 4: UI & Integration (3 días)

**Sprint 4:**
- Day 1-3: Story 13.10 (Admin UI)

**Deliverable:** UI completa para gestión de providers

### Phase 5: Testing & Deploy (2-3 días)

- Integration testing
- E2E testing
- UAT
- Production deployment

---

## 📊 Success Metrics

### Performance

| Métrica | Baseline (Actual) | Target (Epic 13) |
|---------|-------------------|------------------|
| Time to add provider | 30-60 min | < 5 min |
| Downtime para cambios | 2-5 min | 0 min |
| Hot reload latency | N/A | < 5 seg |
| Provider test duration | Manual | < 10 seg |

### Security

| Métrica | Baseline | Target |
|---------|----------|--------|
| Credenciales en Vault | 0% | 100% |
| Credenciales en logs | Sí | No |
| Audit trail | No | 100% |
| Credential rotation | Manual | Automático (90d) |

### Operational

| Métrica | Baseline | Target |
|---------|----------|--------|
| Configuration errors | Alto | Bajo (templates + validation) |
| Time to troubleshoot | Alto | Bajo (audit log + history) |
| Provider setup complexity | Alto | Bajo (templates + UI) |

---

## 🔗 Related Documentation

- [Epic 3: Multi-Provider Integration](epic-3-multi-provider-integration.md)
- [Epic 12: Admin Panel Integration](epic-12-admin-panel-integration.md)
- [Architecture: Hexagonal Design](../architecture/02-hexagonal-structure.md)
- [Security: Vault Integration](../security/vault-integration.md)

---

**Documento creado:** 30 de noviembre de 2025  
**Última actualización:** 30 de noviembre de 2025  
**Owner:** Product Manager + Architect  
**Status:** 📋 Ready for Implementation

