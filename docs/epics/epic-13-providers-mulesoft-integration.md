# Epic 13: Provider Management - MuleSoft Integration

**Fecha de Creación:** 5 de diciembre de 2025  
**Owner:** Product Manager + Architect  
**Estado:** 📋 Planificación  
**Prioridad:** Media  
**Effort Total:** 2 semanas

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura](#arquitectura)
3. [User Stories](#user-stories)
4. [Diseño Técnico](#diseño-técnico)
5. [Effort Estimation](#effort-estimation)
6. [Implementation Strategy](#implementation-strategy)

---

## 🎯 Resumen Ejecutivo

Los **providers de firma** (SMS, PUSH, VOICE, BIOMETRIC) están **configurados en MuleSoft** como capa de integración empresarial. Signature Router **no crea providers**, sino que los **consume desde MuleSoft**.

Esta Epic implementa:

- ✅ **Catálogo sincronizado** desde MuleSoft
- ✅ **Activación/desactivación local** de providers
- ✅ **Configuración de prioridades** para fallback chain
- ✅ **Health monitoring** de providers vía MuleSoft
- ✅ **Sincronización automática** del catálogo

**Diferencia clave:** 
- ❌ **NO creamos providers** (eso se hace en MuleSoft)
- ✅ **Sí controlamos** qué providers usar y en qué orden

---

## 🏗️ Arquitectura

### **Flujo de Integración**

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Portal (Next.js)                   │
│  • Lista providers disponibles desde MuleSoft               │
│  • Habilita/deshabilita providers localmente                │
│  • Configura prioridades para fallback                      │
│  • Monitorea salud de providers                             │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│             Signature Router (Spring Boot)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Provider Catalog Service                      │  │
│  │  • Sync providers from MuleSoft                      │  │
│  │  • Enable/disable locally                            │  │
│  │  • Manage fallback priorities                        │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────────┐  │
│  │         MuleSoft Client                              │  │
│  │  • GET /providers → List available                   │  │
│  │  • GET /providers/{id}/health → Check status        │  │
│  │  • POST /providers/{id}/send → Send challenge       │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────────┐  │
│  │      PostgreSQL: provider_catalog                    │  │
│  │  • mulesoft_provider_id                              │  │
│  │  • provider_name, provider_type                      │  │
│  │  • mulesoft_endpoint                                 │  │
│  │  • enabled, priority (LOCAL CONFIG)                  │  │
│  │  • health_status, last_sync_at                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MuleSoft ESB                              │
│  • Providers configurados en MuleSoft                       │
│  • Credenciales gestionadas por MuleSoft                    │
│  • APIs expuestas:                                          │
│    - /api/v1/signature/providers (list)                     │
│    - /api/v1/signature/providers/{id}/health                │
│    - /api/v1/signature/providers/{id}/send                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            External Providers                               │
│  Twilio SMS  │  AWS SNS  │  FCM Push  │  Veridas Bio        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 User Stories

### Story 13.1: Database Schema - Provider Catalog 🗄️

**Prioridad:** CRÍTICA  
**Effort:** 0.5 días

**Como** desarrollador  
**Quiero** un esquema para almacenar el catálogo de providers desde MuleSoft  
**Para** gestionar localmente qué providers usar

#### Acceptance Criteria

```gherkin
Given necesito sincronizar providers desde MuleSoft
When ejecuto la migración LiquidBase
Then se crea la tabla provider_catalog con:
  - mulesoft_provider_id (unique identifier en MuleSoft)
  - provider_name, provider_type
  - mulesoft_endpoint (URL del API en MuleSoft)
  - mulesoft_status (available, configured, down)
  - enabled (control local - boolean)
  - priority (control local - integer)
  - timeout_seconds, retry_max_attempts
  - health_status, last_health_check_at
  - last_sync_at
And tiene índices para: type, enabled, priority
```

#### Schema

```sql
CREATE TABLE provider_catalog (
    -- ID
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- MuleSoft Reference
    mulesoft_provider_id VARCHAR(100) NOT NULL UNIQUE,
    provider_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(20) NOT NULL 
        CHECK (provider_type IN ('SMS', 'PUSH', 'VOICE', 'BIOMETRIC')),
    
    -- MuleSoft Config
    mulesoft_endpoint VARCHAR(500) NOT NULL,
    mulesoft_status VARCHAR(20) DEFAULT 'available',
    
    -- Local Config (Signature Router)
    enabled BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 10,
    timeout_seconds INTEGER DEFAULT 5,
    retry_max_attempts INTEGER DEFAULT 3,
    
    -- Health & Sync
    health_status VARCHAR(20),  -- healthy, unhealthy, unknown
    last_health_check_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- Indexes
CREATE INDEX idx_provider_catalog_type_enabled 
    ON provider_catalog(provider_type, enabled);
CREATE INDEX idx_provider_catalog_priority 
    ON provider_catalog(provider_type, enabled, priority);
CREATE INDEX idx_provider_catalog_mulesoft_id 
    ON provider_catalog(mulesoft_provider_id);
```

**Files:**
- `db/changelog/0020-provider-catalog-table.yaml`

---

### Story 13.2: MuleSoft Client Integration 🔌

**Prioridad:** CRÍTICA  
**Effort:** 2 días

**Como** sistema  
**Quiero** conectarme a MuleSoft para obtener providers disponibles  
**Para** sincronizar el catálogo local

#### Acceptance Criteria

```gherkin
Given MuleSoft expone APIs de providers
When llamo a GET /api/v1/signature/providers
Then obtengo lista de providers con:
  - id, name, type
  - endpoint URL
  - status (available, configured, down)
And puedo verificar salud con GET /providers/{id}/health
And puedo enviar challenges con POST /providers/{id}/send
```

#### Technical Details

**MuleSoft APIs (Contract):**

```yaml
# GET /api/v1/signature/providers
Response:
  providers:
    - id: "mule-twilio-sms-es"
      name: "Twilio SMS España"
      type: "SMS"
      endpoint: "/api/v1/signature/sms/twilio"
      status: "available"
    - id: "mule-aws-sns-es"
      name: "AWS SNS España"
      type: "SMS"
      endpoint: "/api/v1/signature/sms/aws-sns"
      status: "configured"

# GET /api/v1/signature/providers/{id}/health
Response:
  status: "healthy" | "unhealthy"
  latency_ms: 45
  last_check: "2025-12-05T10:30:00Z"

# POST /api/v1/signature/providers/{id}/send
Request:
  challenge_code: "123456"
  recipient: "+34600123456"
Response:
  success: true
  provider_response_id: "SM123abc"
  sent_at: "2025-12-05T10:30:00Z"
```

**Java Implementation:**

```java
@Component
@RequiredArgsConstructor
public class MuleSoftProviderClient {
    
    private final RestTemplate restTemplate;
    private final MuleSoftConfig config;
    
    public List<MuleSoftProviderDto> listAvailableProviders() {
        String url = config.getBaseUrl() + "/api/v1/signature/providers";
        MuleSoftProviderResponse response = restTemplate.getForObject(
            url, MuleSoftProviderResponse.class
        );
        return response.getProviders();
    }
    
    public ProviderHealthStatus checkProviderHealth(String providerId) {
        String url = String.format(
            "%s/api/v1/signature/providers/%s/health",
            config.getBaseUrl(), providerId
        );
        return restTemplate.getForObject(url, ProviderHealthStatus.class);
    }
    
    public MuleSoftChallengeResponse sendChallenge(
        String providerId,
        String challengeCode,
        String recipient
    ) {
        String url = String.format(
            "%s/api/v1/signature/providers/%s/send",
            config.getBaseUrl(), providerId
        );
        
        MuleSoftChallengeRequest request = MuleSoftChallengeRequest.builder()
            .challengeCode(challengeCode)
            .recipient(recipient)
            .build();
        
        return restTemplate.postForObject(url, request, MuleSoftChallengeResponse.class);
    }
}
```

**Configuration:**

```yaml
# application.yml
mulesoft:
  base-url: ${MULESOFT_BASE_URL:https://api.mulesoft.singular.com}
  auth:
    client-id: ${MULESOFT_CLIENT_ID}
    client-secret: ${MULESOFT_CLIENT_SECRET}
  timeout-seconds: 10
  retry-max-attempts: 3
```

**Files:**
- `MuleSoftProviderClient.java`
- `MuleSoftConfig.java`
- `MuleSoftProviderDto.java`
- `MuleSoftChallengeRequest.java`
- `MuleSoftChallengeResponse.java`

---

### Story 13.3: Provider Sync Service ⚙️

**Prioridad:** ALTA  
**Effort:** 1.5 días

**Como** sistema  
**Quiero** sincronizar automáticamente el catálogo desde MuleSoft  
**Para** detectar nuevos providers y cambios de estado

#### Acceptance Criteria

```gherkin
Given MuleSoft tiene providers configurados
When ejecuto la sincronización (cada 5 minutos)
Then se actualizan providers existentes
And se agregan nuevos providers detectados
And nuevos providers se crean disabled por defecto
And se actualiza last_sync_at timestamp
```

#### Technical Details

```java
@Service
@RequiredArgsConstructor
public class ProviderSyncService {
    
    private final MuleSoftProviderClient muleSoftClient;
    private final ProviderCatalogRepository repository;
    
    /**
     * Sincroniza catálogo cada 5 minutos
     */
    @Scheduled(fixedRate = 300000) // 5 min
    @Transactional
    public void syncProvidersFromMuleSoft() {
        log.info("Starting MuleSoft provider sync...");
        
        List<MuleSoftProviderDto> providers = muleSoftClient.listAvailableProviders();
        
        for (MuleSoftProviderDto dto : providers) {
            syncProvider(dto);
        }
        
        log.info("Sync completed: {} providers", providers.size());
    }
    
    private void syncProvider(MuleSoftProviderDto dto) {
        ProviderCatalog existing = repository
            .findByMuleSoftProviderId(dto.getId())
            .orElse(null);
        
        if (existing == null) {
            // New provider detected
            ProviderCatalog newProvider = ProviderCatalog.builder()
                .muleSoftProviderId(dto.getId())
                .providerName(dto.getName())
                .providerType(dto.getType())
                .muleSoftEndpoint(dto.getEndpoint())
                .muleSoftStatus(dto.getStatus())
                .enabled(false)  // Disabled by default
                .priority(10)
                .lastSyncAt(Instant.now())
                .build();
            
            repository.save(newProvider);
            log.info("New provider synced: {}", dto.getName());
        } else {
            // Update existing
            existing.setMuleSoftStatus(dto.getStatus());
            existing.setMuleSoftEndpoint(dto.getEndpoint());
            existing.setLastSyncAt(Instant.now());
            repository.save(existing);
        }
    }
    
    /**
     * Health check de providers habilitados (cada 1 min)
     */
    @Scheduled(fixedRate = 60000) // 1 min
    @Transactional
    public void healthCheckEnabledProviders() {
        List<ProviderCatalog> enabled = repository.findByEnabled(true);
        
        for (ProviderCatalog provider : enabled) {
            try {
                var health = muleSoftClient.checkProviderHealth(
                    provider.getMuleSoftProviderId()
                );
                
                provider.setHealthStatus(health.getStatus());
                provider.setLastHealthCheckAt(Instant.now());
                repository.save(provider);
                
            } catch (Exception e) {
                log.warn("Health check failed: {}", provider.getProviderName(), e);
                provider.setHealthStatus("unhealthy");
                repository.save(provider);
            }
        }
    }
}
```

**Files:**
- `ProviderSyncService.java`
- `ProviderCatalogRepository.java`
- `ProviderCatalog.java` (entity)

---

### Story 13.4: Provider Catalog REST API 🌐

**Prioridad:** ALTA  
**Effort:** 1.5 días

**Como** administrador  
**Quiero** un API REST para gestionar el catálogo de providers  
**Para** habilitar/deshabilitar y configurar prioridades

#### Acceptance Criteria

```gherkin
Given tengo rol ADMIN
When llamo a GET /api/v1/admin/providers
Then obtengo lista completa de providers del catálogo
And puedo filtrar por tipo con GET /api/v1/admin/providers/type/SMS
And puedo habilitar con PUT /api/v1/admin/providers/{id}/enable
And puedo deshabilitar con PUT /api/v1/admin/providers/{id}/disable
And puedo cambiar prioridad con PUT /api/v1/admin/providers/{id}/priority
And puedo forzar sync con POST /api/v1/admin/providers/sync
```

#### API Endpoints

```java
@RestController
@RequestMapping("/api/v1/admin/providers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ProviderCatalogController {
    
    private final ProviderCatalogService service;
    private final ProviderSyncService syncService;
    
    @GetMapping
    public ResponseEntity<List<ProviderCatalogDto>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<ProviderCatalogDto>> listByType(@PathVariable String type) {
        return ResponseEntity.ok(service.listByType(type));
    }
    
    @PostMapping("/sync")
    public ResponseEntity<Void> syncFromMuleSoft() {
        syncService.syncProvidersFromMuleSoft();
        return ResponseEntity.accepted().build();
    }
    
    @PutMapping("/{id}/enable")
    public ResponseEntity<ProviderCatalogDto> enable(@PathVariable UUID id) {
        return ResponseEntity.ok(service.enableProvider(id));
    }
    
    @PutMapping("/{id}/disable")
    public ResponseEntity<ProviderCatalogDto> disable(@PathVariable UUID id) {
        return ResponseEntity.ok(service.disableProvider(id));
    }
    
    @PutMapping("/{id}/priority")
    public ResponseEntity<ProviderCatalogDto> updatePriority(
        @PathVariable UUID id,
        @RequestParam int priority
    ) {
        return ResponseEntity.ok(service.updatePriority(id, priority));
    }
    
    @GetMapping("/{id}/health")
    public ResponseEntity<ProviderHealthDto> checkHealth(@PathVariable UUID id) {
        return ResponseEntity.ok(service.checkHealth(id));
    }
}
```

**Files:**
- `ProviderCatalogController.java`
- `ProviderCatalogService.java`
- `ProviderCatalogDto.java`

---

### Story 13.5: Admin Portal UI - Provider Management 🖥️

**Prioridad:** ALTA  
**Effort:** 2 días

**Como** administrador  
**Quiero** una interfaz gráfica para gestionar providers  
**Para** ver, habilitar y configurar providers sin usar APIs directamente

#### Acceptance Criteria

```gherkin
Given estoy en Admin Portal
When navego a /admin/providers
Then veo lista de providers agrupados por tipo (SMS, PUSH, VOICE, BIOMETRIC)
And cada provider muestra:
  - Nombre
  - Estado en MuleSoft (available, configured, down)
  - Estado de salud (healthy, unhealthy, unknown)
  - Switch habilitado/deshabilitado
  - Slider de prioridad (1-10)
  - Endpoint de MuleSoft
  - Última sincronización
And puedo hacer sync manual con botón "Sync from MuleSoft"
And cambios se aplican inmediatamente (hot reload)
```

#### UI Design

```typescript
// app/admin/providers/page.tsx

interface Provider {
  id: string;
  muleSoftProviderId: string;
  providerName: string;
  providerType: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  muleSoftEndpoint: string;
  muleSoftStatus: 'available' | 'configured' | 'down';
  enabled: boolean;
  priority: number;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastSyncAt: string;
  lastHealthCheckAt: string;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  
  const syncFromMuleSoft = async () => {
    await fetch('/api/v1/admin/providers/sync', { method: 'POST' });
    fetchProviders();
  };
  
  const toggleProvider = async (id: string, enabled: boolean) => {
    const action = enabled ? 'enable' : 'disable';
    await fetch(`/api/v1/admin/providers/${id}/${action}`, { method: 'PUT' });
    fetchProviders();
  };
  
  const updatePriority = async (id: string, priority: number) => {
    await fetch(`/api/v1/admin/providers/${id}/priority?priority=${priority}`, {
      method: 'PUT'
    });
    fetchProviders();
  };
  
  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Provider Management</h1>
        <Button onClick={syncFromMuleSoft}>
          🔄 Sync from MuleSoft
        </Button>
      </div>
      
      {/* SMS Providers */}
      <ProviderGroup 
        type="SMS" 
        providers={providers.filter(p => p.providerType === 'SMS')}
        onToggle={toggleProvider}
        onPriorityChange={updatePriority}
      />
      
      {/* PUSH Providers */}
      <ProviderGroup 
        type="PUSH" 
        providers={providers.filter(p => p.providerType === 'PUSH')}
        onToggle={toggleProvider}
        onPriorityChange={updatePriority}
      />
      
      {/* VOICE Providers */}
      <ProviderGroup 
        type="VOICE" 
        providers={providers.filter(p => p.providerType === 'VOICE')}
        onToggle={toggleProvider}
        onPriorityChange={updatePriority}
      />
      
      {/* BIOMETRIC Providers */}
      <ProviderGroup 
        type="BIOMETRIC" 
        providers={providers.filter(p => p.providerType === 'BIOMETRIC')}
        onToggle={toggleProvider}
        onPriorityChange={updatePriority}
      />
    </div>
  );
}
```

**UI Components:**

```
┌────────────────────────────────────────────────────────┐
│  Provider Management                  [🔄 Sync MuleSoft]│
├────────────────────────────────────────────────────────┤
│                                                        │
│  📱 SMS Providers                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Twilio SMS España                                 │ │
│  │ Endpoint: /api/v1/signature/sms/twilio           │ │
│  │ MuleSoft: 🟢 available  Health: 🟢 healthy       │ │
│  │                                                   │ │
│  │ Enabled: [●─────] ON                             │ │
│  │ Priority: [───●───] 1  ↑↓                        │ │
│  │ Last sync: 2025-12-05 10:30:00                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ AWS SNS España                                    │ │
│  │ Endpoint: /api/v1/signature/sms/aws-sns          │ │
│  │ MuleSoft: 🟢 configured  Health: 🟢 healthy      │ │
│  │                                                   │ │
│  │ Enabled: [●─────] ON                             │ │
│  │ Priority: [─────●─] 2  ↑↓                        │ │
│  │ Last sync: 2025-12-05 10:30:00                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  🔔 PUSH Providers                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Firebase FCM                                      │ │
│  │ Endpoint: /api/v1/signature/push/fcm             │ │
│  │ MuleSoft: 🔴 down  Health: 🔴 unhealthy          │ │
│  │                                                   │ │
│  │ Enabled: [─────●] OFF                            │ │
│  │ Priority: [───●───] 1  ↑↓  (disabled)           │ │
│  │ Last sync: 2025-12-05 10:29:00                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Files:**
- `app/admin/providers/page.tsx`
- `components/providers/ProviderGroup.tsx`
- `components/providers/ProviderCard.tsx`

---

### Story 13.6: Provider Selection with Fallback 🔄

**Prioridad:** CRÍTICA  
**Effort:** 1.5 días

**Como** sistema  
**Quiero** seleccionar providers habilitados según prioridad  
**Para** usar fallback automático si un provider falla

#### Acceptance Criteria

```gherkin
Given tengo múltiples providers SMS habilitados
  - Twilio SMS (priority 1, enabled, healthy)
  - AWS SNS (priority 2, enabled, healthy)
When necesito enviar un SMS
Then selecciono provider con menor priority (Twilio)
And si Twilio falla, uso AWS SNS (fallback)
And si todos fallan, devuelvo error
```

#### Technical Details

```java
@Service
@RequiredArgsConstructor
public class ProviderSelectionService {
    
    private final ProviderCatalogRepository catalogRepository;
    private final MuleSoftProviderClient muleSoftClient;
    
    /**
     * Selecciona el mejor provider disponible para un tipo
     */
    public ProviderCatalog selectProvider(ProviderType type) {
        List<ProviderCatalog> providers = catalogRepository
            .findByTypeEnabledOrderByPriority(type, true);
        
        if (providers.isEmpty()) {
            throw new NoProviderAvailableException("No providers available for type: " + type);
        }
        
        // Return provider with lowest priority (highest priority number = 1 is best)
        return providers.get(0);
    }
    
    /**
     * Selecciona provider con fallback automático
     */
    public ProviderResult sendWithFallback(
        ProviderType type,
        String challengeCode,
        String recipient
    ) {
        List<ProviderCatalog> providers = catalogRepository
            .findByTypeEnabledOrderByPriority(type, true);
        
        Exception lastException = null;
        
        for (ProviderCatalog provider : providers) {
            try {
                log.info("Attempting provider: {} (priority {})", 
                    provider.getProviderName(), provider.getPriority());
                
                MuleSoftChallengeResponse response = muleSoftClient.sendChallenge(
                    provider.getMuleSoftProviderId(),
                    challengeCode,
                    recipient
                );
                
                log.info("Challenge sent successfully via {}", provider.getProviderName());
                
                return ProviderResult.success(
                    provider.getMuleSoftProviderId(),
                    response.getProviderResponseId()
                );
                
            } catch (Exception e) {
                log.warn("Provider {} failed: {}", provider.getProviderName(), e.getMessage());
                lastException = e;
                // Continue to next provider (fallback)
            }
        }
        
        // All providers failed
        log.error("All providers failed for type: {}", type);
        throw new AllProvidersFailed("All providers exhausted", lastException);
    }
}
```

**Files:**
- `ProviderSelectionService.java`
- `NoProviderAvailableException.java`
- `AllProvidersFailedException.java`

---

## 📊 Effort Estimation

| Story | Tasks | Effort | Priority |
|-------|-------|--------|----------|
| **13.1** Database Schema | Schema + Migration | 0.5 días | CRÍTICA |
| **13.2** MuleSoft Client | Client + DTOs + Config | 2 días | CRÍTICA |
| **13.3** Sync Service | Scheduled sync + Health check | 1.5 días | ALTA |
| **13.4** REST API | Controller + Service | 1.5 días | ALTA |
| **13.5** Admin UI | Next.js components | 2 días | ALTA |
| **13.6** Fallback Logic | Selection + Fallback | 1.5 días | CRÍTICA |
| **Testing** | Integration + E2E | 1 día | ALTA |
| **Documentation** | Runbooks + API docs | 0.5 días | MEDIA |

**Total Effort:** 10.5 días (~2 semanas)

---

## 🚀 Implementation Strategy

### **Phase 1: Foundation** (3 días)
1. ✅ Story 13.1: Database schema
2. ✅ Story 13.2: MuleSoft client integration
3. ✅ Testing con MuleSoft sandbox

### **Phase 2: Sync & API** (3 días)
4. ✅ Story 13.3: Provider sync service
5. ✅ Story 13.4: REST API endpoints
6. ✅ Testing de sincronización

### **Phase 3: UI & Selection** (3.5 días)
7. ✅ Story 13.5: Admin Portal UI
8. ✅ Story 13.6: Fallback logic
9. ✅ E2E testing

### **Phase 4: Documentation & Rollout** (1 día)
10. ✅ Documentation
11. ✅ UAT validation
12. ✅ Production deployment

---

## 🔒 Security Considerations

1. **Credenciales en MuleSoft:** MuleSoft maneja todas las credenciales de providers externos
2. **Auth con MuleSoft:** Client ID/Secret para autenticar contra MuleSoft APIs
3. **RBAC:** Solo rol ADMIN puede gestionar providers
4. **Audit:** Registrar quién habilitó/deshabilitó providers

---

## 📈 Success Metrics

| Métrica | Objetivo |
|---------|----------|
| Providers sincronizados | 100% de providers en MuleSoft |
| Latencia de sync | < 5 segundos |
| Health check accuracy | > 99% |
| Fallback success rate | > 95% cuando hay backup disponible |
| Admin UI response time | < 500ms |

---

## 🔗 Dependencies

- **MuleSoft APIs:** Requiere que MuleSoft exponga:
  - `GET /api/v1/signature/providers`
  - `GET /api/v1/signature/providers/{id}/health`
  - `POST /api/v1/signature/providers/{id}/send`
- **Database:** PostgreSQL 15+
- **Auth:** OAuth2 client credentials con MuleSoft

---

## 📝 Acceptance Criteria (Epic Level)

```gherkin
Given MuleSoft tiene providers configurados
When se despliega Epic 13
Then:
  ✅ Catálogo se sincroniza automáticamente cada 5 minutos
  ✅ Admin puede ver todos los providers desde MuleSoft
  ✅ Admin puede habilitar/deshabilitar providers localmente
  ✅ Admin puede configurar prioridades de fallback
  ✅ Sistema usa fallback automático si un provider falla
  ✅ Health checks se ejecutan cada 1 minuto para providers habilitados
  ✅ UI muestra estado en tiempo real (MuleSoft + local + health)
  ✅ No se requiere reiniciar servicio para cambios
```

---

**Documento creado:** 5 de diciembre de 2025  
**Última actualización:** 5 de diciembre de 2025  
**Owner:** Dev Team  
**Status:** 📋 Planificación
