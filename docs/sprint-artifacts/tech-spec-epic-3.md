# Epic Technical Specification: Multi-Provider Integration

Date: 2025-11-27
Author: BMAD Architect Agent
Epic ID: epic-3
Status: Draft

---

## Overview

**Epic 3: Multi-Provider Integration** implementa la capa de integración con múltiples proveedores de canales de comunicación (SMS, Push Notifications, Voice Calls) para enviar challenges de firma digital. Este epic transforma los stubs básicos de Epic 2 en implementaciones productivas con proveedores reales, estableciendo la infraestructura necesaria para fallback y resilience patterns que se completarán en Epic 4.

**Contexto del PRD**: Este epic cubre **FR20-FR28** (Challenge Delivery) y comienza la implementación de **FR29-FR38** (Fallback & Resilience), enfocándose en la abstracción de providers y sus implementaciones concretas.

**Valor de Negocio**: Habilita diversificación de canales para optimización de costos (PUSH más barato que SMS, SMS más barato que VOICE) y establece fundamentos para fallback automático resiliente que se implementará en Epic 4.

---

## Objectives and Scope

### In Scope

1. **Provider Abstraction Layer** (Hexagonal Architecture)
   - `SignatureProviderPort` domain interface (outbound port)
   - `ProviderResult` value object con estados estandarizados
   - `ProviderType` enum (SMS, PUSH, VOICE, BIOMETRIC)
   - Provider registry para selección dinámica por canal

2. **Twilio SMS Provider** (Production Implementation)
   - Reemplazar TwilioSmsProviderStub con implementación real
   - Twilio REST API client (twilio-java SDK)
   - Configuración vía Vault (account_sid, auth_token, from_number)
   - Response parsing y error handling completo
   - Almacenar `message_sid` como `provider_challenge_id`
   - Almacenar Twilio response como `provider_proof` (non-repudiation)

3. **Push Notification Provider** (Firebase Cloud Messaging)
   - Implementar PushNotificationProvider con FCM
   - Firebase Admin SDK configuration
   - Service account credentials vía Vault
   - Support para device tokens y topic subscriptions
   - Response parsing con `message_id` tracking

4. **Voice Call Provider** (Twilio Voice API)
   - Implementar VoiceCallProvider con Twilio Voice
   - Text-to-Speech (TTS) configuration
   - Voice call initiation con OTP verbalization
   - Twilio CallSid tracking para correlación
   - Configurable voice language y speed

5. **Biometric Provider** (Stub - Future Ready)
   - Interface definition para biometric challenges
   - Stub implementation que retorna SUCCESS inmediatamente
   - Preparado para integración futura con biometric SDKs

6. **Provider Configuration Management**
   - `ConnectorConfig` entity para configuración dinámica
   - CRUD API para configurar providers vía Admin Portal
   - Vault integration para secrets (API keys, tokens)
   - Enable/disable providers sin redeploy
   - Timeouts configurables por provider

7. **Provider Health Check Endpoint**
   - `GET /api/v1/admin/providers/health` endpoint
   - Health check por cada provider activo
   - Circuit breaker status exposé (preparación para Epic 4)
   - Last success/failure timestamp tracking

8. **Provider Timeout Configuration**
   - Resilience4j TimeLimiter integration (5s external HTTP)
   - Timeout configuration per provider type
   - Async execution con CompletableFuture
   - Graceful timeout handling

9. **Provider Retry Logic** (Basic)
   - Retry policy con exponential backoff (max 3 attempts)
   - Resilience4j Retry integration
   - Configurable retry intervals: 1s, 2s, 4s
   - Idempotency-safe retry (provider APIs idempotent)

10. **Provider Metrics Tracking**
    - Prometheus metrics: `provider.calls.total`, `provider.calls.failed`, `provider.latency`
    - Success/failure counters per provider
    - Latency histograms para SLO tracking
    - Preparación para error rate calculation (Epic 4)

### Out of Scope (Deferred to Epic 4)

- ❌ **Circuit Breaker per Provider**: Implementado en Epic 4
- ❌ **Fallback Chain Logic**: Lógica de fallback automático en Epic 4
- ❌ **Degraded Mode Manager**: Gestión de providers degradados en Epic 4
- ❌ **Provider Error Rate Calculator**: Cálculo de error rates en Epic 4
- ❌ **Automatic Provider Reactivation**: Reactivación automática en Epic 4

### Prerequisites

- ✅ **Epic 1 (Foundation)**: Domain models, PostgreSQL, Kafka, Vault
- ✅ **Epic 2 (Signature Orchestration)**: SignatureChallenge entity, routing rules, basic flow

---

## System Architecture Alignment

### Hexagonal Architecture Alignment

```
┌─────────────────────────────────────────────────────────────────┐
│                        Domain Layer                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SignatureProviderPort (Outbound Port Interface)         │  │
│  │  + sendChallenge(challenge: SignatureChallenge): Result  │  │
│  │  + checkHealth(): HealthStatus                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ProviderResult (Value Object)                           │  │
│  │  - success: boolean                                       │  │
│  │  - providerChallengeId: String                           │  │
│  │  - providerProof: String (JSON response)                 │  │
│  │  - errorCode: String                                      │  │
│  │  - errorMessage: String                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Adapter: SignatureProviderAdapter                       │  │
│  │  (Implements: SignatureProviderPort)                     │  │
│  │                                                           │  │
│  │  Dependencies:                                            │  │
│  │  - Map<ProviderType, SignatureProvider> providers        │  │
│  │  - ConnectorConfigRepository configRepository           │  │
│  │  - MetricsRegistry metricsRegistry                       │  │
│  │                                                           │  │
│  │  + sendChallenge(challenge): ProviderResult              │  │
│  │    1. Select provider by challenge.channelType           │  │
│  │    2. Load configuration from ConnectorConfig            │  │
│  │    3. Apply timeout (5s) and retry (3x)                  │  │
│  │    4. Record metrics (latency, success/failure)          │  │
│  │    5. Return ProviderResult                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ TwilioSms      │  │ PushNotif.     │  │ VoiceCall      │   │
│  │ Provider       │  │ Provider       │  │ Provider       │   │
│  │ (REAL)         │  │ (FCM)          │  │ (Twilio)       │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                  │
│  ┌────────────────┐                                             │
│  │ Biometric      │                                             │
│  │ Provider       │                                             │
│  │ (STUB)         │                                             │
│  └────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Layer |
|-----------|---------------|-------|
| **SignatureProviderPort** | Domain interface for sending challenges | Domain (port/outbound) |
| **ProviderResult** | Standardized response from providers | Domain (valueobject) |
| **SignatureProviderAdapter** | Orchestrates provider selection and execution | Infrastructure (adapter/outbound) |
| **TwilioSmsProvider** | SMS delivery via Twilio REST API | Infrastructure (adapter/outbound/provider) |
| **PushNotificationProvider** | Push notifications via Firebase FCM | Infrastructure (adapter/outbound/provider) |
| **VoiceCallProvider** | Voice calls via Twilio Voice API | Infrastructure (adapter/outbound/provider) |
| **BiometricProvider** | Stub for future biometric integration | Infrastructure (adapter/outbound/provider) |
| **ConnectorConfigRepository** | Manage provider configurations | Infrastructure (adapter/outbound/persistence) |
| **ProviderHealthEndpoint** | Expose provider health status | Infrastructure (adapter/inbound/rest) |

### Constraints from Architecture

1. **Hexagonal Purity**: Domain port interface MUST NOT depend on infrastructure concerns (Twilio, FCM, HTTP clients)
2. **Adapter Isolation**: Each provider implementation isolated in separate package
3. **Configuration Externalization**: Provider credentials MUST be stored in Vault (never hardcoded)
4. **Resilience Integration**: All provider calls MUST be wrapped with Resilience4j (timeout, retry)
5. **Non-Repudiation**: Provider responses MUST be stored as `provider_proof` in SignatureChallenge
6. **Metrics Mandatory**: Every provider call MUST record latency and success/failure

---

## Detailed Design

### Services and Modules

#### 1. Provider Abstraction (Domain Layer)

**Package**: `com.singularbank.signature.routing.domain.port.outbound`

```java
/**
 * Outbound port for sending signature challenges via external providers.
 * Implementations in infrastructure layer handle specific provider integrations.
 */
public interface SignatureProviderPort {
    
    /**
     * Send a signature challenge to the specified recipient.
     * 
     * @param challenge The challenge to send (contains recipient, message, channel type)
     * @return ProviderResult with success status and provider metadata
     * @throws ProviderException if provider invocation fails after all retries
     */
    ProviderResult sendChallenge(SignatureChallenge challenge);
    
    /**
     * Check health status of provider.
     * 
     * @param providerType The provider to check
     * @return HealthStatus with details
     */
    HealthStatus checkHealth(ProviderType providerType);
}
```

**Value Object**: `ProviderResult`

```java
public record ProviderResult(
    boolean success,
    String providerChallengeId,  // e.g., Twilio message_sid
    String providerProof,         // Full JSON response for non-repudiation
    String errorCode,             // Standardized error code (TIMEOUT, INVALID_NUMBER, etc.)
    String errorMessage,          // Human-readable error
    Instant timestamp
) {
    public static ProviderResult success(String challengeId, String proof) {
        return new ProviderResult(true, challengeId, proof, null, null, Instant.now());
    }
    
    public static ProviderResult failure(String errorCode, String errorMessage) {
        return new ProviderResult(false, null, null, errorCode, errorMessage, Instant.now());
    }
}
```

#### 2. Provider Implementations (Infrastructure Layer)

**Package**: `com.singularbank.signature.routing.infrastructure.adapter.outbound.provider`

##### 2.1 TwilioSmsProvider (Production)

```java
@Component
@RequiredArgsConstructor
public class TwilioSmsProvider implements SignatureProvider {
    
    private final VaultTemplate vaultTemplate;
    private final MeterRegistry meterRegistry;
    
    @PostConstruct
    public void initialize() {
        // Load Twilio credentials from Vault
        String accountSid = vaultTemplate.read("secret/twilio/account_sid");
        String authToken = vaultTemplate.read("secret/twilio/auth_token");
        Twilio.init(accountSid, authToken);
    }
    
    @Override
    @TimeLimiter(name = "externalHttp")
    @Retry(name = "twilioProvider")
    public ProviderResult send(SignatureChallenge challenge) {
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            String fromNumber = vaultTemplate.read("secret/twilio/from_number");
            
            Message message = Message.creator(
                new PhoneNumber(challenge.getRecipient()),  // To
                new PhoneNumber(fromNumber),                 // From
                challenge.getMessage()                       // Body (OTP code)
            ).create();
            
            // Record success metrics
            sample.stop(meterRegistry.timer("provider.latency", "provider", "twilio", "status", "success"));
            meterRegistry.counter("provider.calls.total", "provider", "twilio", "status", "success").increment();
            
            // Return success with Twilio metadata
            return ProviderResult.success(
                message.getSid(),                           // providerChallengeId
                message.toJson()                            // providerProof (non-repudiation)
            );
            
        } catch (ApiException e) {
            sample.stop(meterRegistry.timer("provider.latency", "provider", "twilio", "status", "error"));
            meterRegistry.counter("provider.calls.total", "provider", "twilio", "status", "error").increment();
            
            return ProviderResult.failure(
                "TWILIO_API_ERROR_" + e.getCode(),
                e.getMessage()
            );
        } catch (Exception e) {
            sample.stop(meterRegistry.timer("provider.latency", "provider", "twilio", "status", "error"));
            meterRegistry.counter("provider.calls.total", "provider", "twilio", "status", "error").increment();
            
            return ProviderResult.failure("TWILIO_UNKNOWN_ERROR", e.getMessage());
        }
    }
    
    @Override
    public HealthStatus checkHealth() {
        try {
            // Validate Twilio credentials by fetching account info
            Account account = Account.fetcher().fetch();
            return HealthStatus.UP("Twilio account active: " + account.getFriendlyName());
        } catch (Exception e) {
            return HealthStatus.DOWN("Twilio health check failed: " + e.getMessage());
        }
    }
}
```

##### 2.2 PushNotificationProvider (Firebase FCM)

```java
@Component
@RequiredArgsConstructor
public class PushNotificationProvider implements SignatureProvider {
    
    private final VaultTemplate vaultTemplate;
    private final MeterRegistry meterRegistry;
    private FirebaseApp firebaseApp;
    
    @PostConstruct
    public void initialize() throws IOException {
        // Load Firebase service account JSON from Vault
        String serviceAccountJson = vaultTemplate.read("secret/firebase/service_account");
        
        InputStream serviceAccount = new ByteArrayInputStream(serviceAccountJson.getBytes());
        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
            .build();
        
        firebaseApp = FirebaseApp.initializeApp(options, "signature-router");
    }
    
    @Override
    @TimeLimiter(name = "externalHttp")
    @Retry(name = "pushProvider")
    public ProviderResult send(SignatureChallenge challenge) {
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            // Build FCM notification
            Message message = Message.builder()
                .setToken(challenge.getRecipient())  // Device token
                .setNotification(Notification.builder()
                    .setTitle("Signature Request")
                    .setBody(challenge.getMessage())
                    .build())
                .putData("signature_id", challenge.getSignatureRequestId().toString())
                .putData("challenge_id", challenge.getId().toString())
                .putData("expires_at", challenge.getExpiresAt().toString())
                .build();
            
            // Send via FCM
            String messageId = FirebaseMessaging.getInstance(firebaseApp).send(message);
            
            // Record success metrics
            sample.stop(meterRegistry.timer("provider.latency", "provider", "push", "status", "success"));
            meterRegistry.counter("provider.calls.total", "provider", "push", "status", "success").increment();
            
            return ProviderResult.success(
                messageId,                                  // providerChallengeId
                "{\"message_id\":\"" + messageId + "\"}"    // providerProof
            );
            
        } catch (FirebaseMessagingException e) {
            sample.stop(meterRegistry.timer("provider.latency", "provider", "push", "status", "error"));
            meterRegistry.counter("provider.calls.total", "provider", "push", "status", "error").increment();
            
            return ProviderResult.failure(
                "FCM_ERROR_" + e.getMessagingErrorCode(),
                e.getMessage()
            );
        }
    }
    
    @Override
    public HealthStatus checkHealth() {
        try {
            // Simple health check: verify Firebase app initialized
            return firebaseApp != null 
                ? HealthStatus.UP("Firebase FCM initialized") 
                : HealthStatus.DOWN("Firebase FCM not initialized");
        } catch (Exception e) {
            return HealthStatus.DOWN("Firebase health check failed: " + e.getMessage());
        }
    }
}
```

##### 2.3 VoiceCallProvider (Twilio Voice API)

```java
@Component
@RequiredArgsConstructor
public class VoiceCallProvider implements SignatureProvider {
    
    private final VaultTemplate vaultTemplate;
    private final MeterRegistry meterRegistry;
    
    @PostConstruct
    public void initialize() {
        String accountSid = vaultTemplate.read("secret/twilio/account_sid");
        String authToken = vaultTemplate.read("secret/twilio/auth_token");
        Twilio.init(accountSid, authToken);
    }
    
    @Override
    @TimeLimiter(name = "externalHttp")
    @Retry(name = "voiceProvider")
    public ProviderResult send(SignatureChallenge challenge) {
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            String fromNumber = vaultTemplate.read("secret/twilio/voice_number");
            String twimlUrl = vaultTemplate.read("secret/twilio/twiml_url");
            
            // Create voice call with TwiML for Text-to-Speech
            Call call = Call.creator(
                new PhoneNumber(challenge.getRecipient()),  // To
                new PhoneNumber(fromNumber),                 // From
                URI.create(twimlUrl + "?otp=" + extractOtp(challenge.getMessage()))
            ).create();
            
            sample.stop(meterRegistry.timer("provider.latency", "provider", "voice", "status", "success"));
            meterRegistry.counter("provider.calls.total", "provider", "voice", "status", "success").increment();
            
            return ProviderResult.success(
                call.getSid(),      // providerChallengeId (CallSid)
                call.toJson()       // providerProof
            );
            
        } catch (ApiException e) {
            sample.stop(meterRegistry.timer("provider.latency", "provider", "voice", "status", "error"));
            meterRegistry.counter("provider.calls.total", "provider", "voice", "status", "error").increment();
            
            return ProviderResult.failure(
                "TWILIO_VOICE_ERROR_" + e.getCode(),
                e.getMessage()
            );
        }
    }
    
    private String extractOtp(String message) {
        // Extract OTP code from message (e.g., "Your code is: 123456" → "123456")
        Pattern pattern = Pattern.compile("\\d{6}");
        Matcher matcher = pattern.matcher(message);
        return matcher.find() ? matcher.group() : "000000";
    }
    
    @Override
    public HealthStatus checkHealth() {
        try {
            Account account = Account.fetcher().fetch();
            return HealthStatus.UP("Twilio Voice account active: " + account.getFriendlyName());
        } catch (Exception e) {
            return HealthStatus.DOWN("Twilio Voice health check failed: " + e.getMessage());
        }
    }
}
```

##### 2.4 BiometricProvider (Stub - Future Ready)

```java
@Component
@RequiredArgsConstructor
public class BiometricProvider implements SignatureProvider {
    
    private final MeterRegistry meterRegistry;
    
    @Override
    public ProviderResult send(SignatureChallenge challenge) {
        // Stub implementation: always return success
        // Future integration with biometric SDKs (TouchID, FaceID, fingerprint)
        
        meterRegistry.counter("provider.calls.total", "provider", "biometric", "status", "stub").increment();
        
        return ProviderResult.success(
            "BIOMETRIC_STUB_" + UUID.randomUUID(),
            "{\"status\":\"STUB_SUCCESS\",\"message\":\"Biometric provider not yet implemented\"}"
        );
    }
    
    @Override
    public HealthStatus checkHealth() {
        return HealthStatus.UP("Biometric provider (STUB)");
    }
}
```

#### 3. Provider Adapter (Orchestration Layer)

**Package**: `com.singularbank.signature.routing.infrastructure.adapter.outbound.provider`

```java
@Component
@RequiredArgsConstructor
public class SignatureProviderAdapter implements SignatureProviderPort {
    
    private final Map<ProviderType, SignatureProvider> providers;
    private final ConnectorConfigRepository configRepository;
    private final MeterRegistry meterRegistry;
    
    @PostConstruct
    public void initializeProviders() {
        // Register providers by type
        providers.put(ProviderType.SMS, twilioSmsProvider);
        providers.put(ProviderType.PUSH, pushNotificationProvider);
        providers.put(ProviderType.VOICE, voiceCallProvider);
        providers.put(ProviderType.BIOMETRIC, biometricProvider);
    }
    
    @Override
    public ProviderResult sendChallenge(SignatureChallenge challenge) {
        ProviderType providerType = challenge.getChannelType().toProviderType();
        
        // 1. Check if provider is enabled
        ConnectorConfig config = configRepository.findByProviderType(providerType)
            .orElseThrow(() -> new ProviderException("Provider not configured: " + providerType));
        
        if (!config.isEnabled()) {
            return ProviderResult.failure(
                "PROVIDER_DISABLED",
                "Provider " + providerType + " is currently disabled"
            );
        }
        
        // 2. Get provider implementation
        SignatureProvider provider = providers.get(providerType);
        if (provider == null) {
            return ProviderResult.failure(
                "PROVIDER_NOT_FOUND",
                "No implementation found for provider: " + providerType
            );
        }
        
        // 3. Execute with timeout and retry (via Resilience4j annotations on provider)
        try {
            return provider.send(challenge);
        } catch (Exception e) {
            log.error("Provider execution failed: {}", e.getMessage(), e);
            return ProviderResult.failure("PROVIDER_EXECUTION_ERROR", e.getMessage());
        }
    }
    
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        SignatureProvider provider = providers.get(providerType);
        if (provider == null) {
            return HealthStatus.DOWN("Provider not found: " + providerType);
        }
        
        return provider.checkHealth();
    }
}
```

#### 4. Provider Health Endpoint

**Package**: `com.singularbank.signature.routing.infrastructure.adapter.inbound.rest.admin`

```java
@RestController
@RequestMapping("/api/v1/admin/providers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProviderHealthController {
    
    private final SignatureProviderPort providerPort;
    
    @GetMapping("/health")
    public ResponseEntity<ProviderHealthResponse> getProviderHealth() {
        Map<ProviderType, HealthStatus> healthMap = Arrays.stream(ProviderType.values())
            .collect(Collectors.toMap(
                type -> type,
                providerPort::checkHealth
            ));
        
        return ResponseEntity.ok(new ProviderHealthResponse(healthMap));
    }
    
    @GetMapping("/health/{providerType}")
    public ResponseEntity<HealthStatus> getProviderHealthByType(
        @PathVariable ProviderType providerType
    ) {
        HealthStatus health = providerPort.checkHealth(providerType);
        return ResponseEntity.ok(health);
    }
}

public record ProviderHealthResponse(
    Map<ProviderType, HealthStatus> providers,
    Instant timestamp
) {
    public ProviderHealthResponse(Map<ProviderType, HealthStatus> providers) {
        this(providers, Instant.now());
    }
}
```

---

### Data Models and Contracts

#### ConnectorConfig Entity

```java
@Entity
@Table(name = "connector_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectorConfigEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private ProviderType providerType;
    
    @Column(nullable = false)
    private Boolean enabled = true;
    
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> config;  // Provider-specific config (non-secret)
    
    @Column(nullable = false)
    private Integer timeoutSeconds = 5;
    
    @Column(nullable = false)
    private Integer maxRetries = 3;
    
    private String vaultPath;  // Path to secrets in Vault
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
    
    private String createdBy;
    private String updatedBy;
}
```

#### API Contract: Provider Health Response

```json
{
  "providers": {
    "SMS": {
      "status": "UP",
      "details": "Twilio account active: Bank Signature Service"
    },
    "PUSH": {
      "status": "UP",
      "details": "Firebase FCM initialized"
    },
    "VOICE": {
      "status": "UP",
      "details": "Twilio Voice account active"
    },
    "BIOMETRIC": {
      "status": "UP",
      "details": "Biometric provider (STUB)"
    }
  },
  "timestamp": "2025-11-27T10:30:00Z"
}
```

---

### APIs and Interfaces

#### 1. Admin API: Provider Health

```
GET /api/v1/admin/providers/health
```

**Security**: Requires `ROLE_ADMIN`

**Response 200 OK**:
```json
{
  "providers": {
    "SMS": {"status": "UP", "details": "..."},
    "PUSH": {"status": "UP", "details": "..."},
    "VOICE": {"status": "UP", "details": "..."},
    "BIOMETRIC": {"status": "UP", "details": "..."}
  },
  "timestamp": "2025-11-27T10:30:00Z"
}
```

#### 2. Admin API: Connector Configuration CRUD

```
GET    /api/v1/admin/connectors              # List all connector configs
GET    /api/v1/admin/connectors/{id}         # Get specific config
POST   /api/v1/admin/connectors              # Create connector config
PUT    /api/v1/admin/connectors/{id}         # Update connector config
PATCH  /api/v1/admin/connectors/{id}/enable  # Enable connector
PATCH  /api/v1/admin/connectors/{id}/disable # Disable connector
```

**Request Body (POST/PUT)**:
```json
{
  "providerType": "SMS",
  "enabled": true,
  "config": {
    "from_number_label": "Bank OTP Service",
    "max_message_length": "160"
  },
  "timeoutSeconds": 5,
  "maxRetries": 3,
  "vaultPath": "secret/twilio"
}
```

---

### Workflows and Sequencing

#### Workflow: Send Challenge with Provider Selection

```
1. POST /api/v1/signatures (CreateSignatureUseCase)
   ↓
2. RoutingService.evaluateRoute(transactionContext)
   → SpEL evaluation → ChannelType (SMS/PUSH/VOICE)
   ↓
3. SignatureRequest.createChallenge(channelType, recipient)
   ↓
4. SignatureProviderPort.sendChallenge(challenge)
   ↓
5. SignatureProviderAdapter.sendChallenge(challenge)
   ├─ Load ConnectorConfig from repository
   ├─ Check if provider enabled
   ├─ Select provider by challenge.channelType
   ├─ Apply @TimeLimiter (5s timeout)
   ├─ Apply @Retry (3 attempts, exponential backoff)
   └─ Execute provider.send(challenge)
       ↓
6. TwilioSmsProvider.send(challenge)
   ├─ Load credentials from Vault
   ├─ Call Twilio REST API (Message.creator().create())
   ├─ Record metrics (latency, success/failure)
   └─ Return ProviderResult(success=true, providerChallengeId=message_sid, providerProof=json)
       ↓
7. SignatureChallenge.recordProviderResponse(providerResult)
   ├─ Store provider_challenge_id = message_sid
   ├─ Store provider_proof = Twilio JSON response
   ├─ Update status = SENT
   └─ Set sent_at = now()
       ↓
8. SignatureRequestRepository.save(signatureRequest)
   ↓
9. EventPublisher.publish(ChallengeCreatedEvent)
   ↓
10. Return SignatureResponse to client
```

#### Workflow: Provider Health Check

```
1. GET /api/v1/admin/providers/health
   ↓
2. ProviderHealthController.getProviderHealth()
   ↓
3. For each ProviderType (SMS, PUSH, VOICE, BIOMETRIC):
   ├─ SignatureProviderPort.checkHealth(providerType)
   ├─ SignatureProviderAdapter.checkHealth(providerType)
   └─ TwilioSmsProvider.checkHealth()
       ├─ Twilio.Account.fetcher().fetch()
       └─ Return HealthStatus(UP/DOWN, details)
   ↓
4. Aggregate health statuses
   ↓
5. Return ProviderHealthResponse
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement | Notes |
|--------|--------|-------------|-------|
| **Provider Call Latency P99** | < 3s | `provider.latency` histogram | Includes network + provider processing |
| **Provider Call Latency P50** | < 1s | `provider.latency` histogram | Typical case |
| **Timeout Configuration** | 5s | Resilience4j TimeLimiter | External HTTP calls |
| **Retry Latency Overhead** | < 10s | 3 retries × exponential backoff | Max total: 1s + 2s + 4s = 7s |
| **Health Check Latency** | < 500ms | `/admin/providers/health` | Admin endpoint |

**Performance Requirements from PRD**:
- **NFR-P1**: P99 latency end-to-end < 300ms (Epic 3 contributes provider call < 3s)
- **NFR-P2**: Throughput ≥ 1000 signatures/min (provider parallelization ready)

### Security

| Requirement | Implementation | PRD Reference |
|-------------|---------------|---------------|
| **Credential Storage** | Vault: `secret/twilio/*`, `secret/firebase/*` | NFR-S1 |
| **No Hardcoded Secrets** | All credentials via VaultTemplate | NFR-S2 |
| **TLS Everywhere** | All provider calls over HTTPS | NFR-S3 |
| **Non-Repudiation** | Store full provider response as `provider_proof` | FR24 |
| **Admin Access Control** | Provider health/config endpoints require `ROLE_ADMIN` | NFR-S7 |
| **Audit Trail** | Connector config changes logged to `audit_log` table | NFR-S8 |

**Security Requirements from PRD**:
- **FR24**: Almacenar provider_proof (non-repudiation) ✅
- **NFR-S1**: Vault para credenciales ✅
- **NFR-S2**: No hardcoded secrets ✅
- **NFR-S3**: TLS everywhere ✅

### Reliability/Availability

| Pattern | Configuration | Purpose |
|---------|--------------|---------|
| **Timeout** | 5s (Resilience4j TimeLimiter) | Prevent hanging calls |
| **Retry** | 3 attempts, exponential backoff (1s, 2s, 4s) | Transient failure recovery |
| **Idempotency** | Provider APIs idempotent (Twilio, FCM) | Safe to retry |
| **Graceful Degradation** | Return ProviderResult.failure on errors | No exceptions to caller |
| **Health Checks** | `/admin/providers/health` endpoint | Proactive monitoring |

**Availability Requirements from PRD**:
- **NFR-A1**: 99.9% uptime ✅ (providers monitored)
- **NFR-A2**: Graceful degradation ✅ (Epic 4 will add fallback chain)

### Observability

#### Metrics (Prometheus)

```yaml
# Provider call metrics
provider.calls.total{provider="twilio|push|voice|biometric", status="success|error"}
provider.latency{provider="twilio|push|voice|biometric", status="success|error"}

# Health check metrics
provider.health.status{provider="twilio|push|voice|biometric", status="up|down"}

# Configuration metrics
connector.config.changes.total{provider="twilio|push|voice|biometric", action="created|updated|enabled|disabled"}
```

#### Logs (Structured JSON)

```json
{
  "timestamp": "2025-11-27T10:30:00.123Z",
  "level": "INFO",
  "logger": "TwilioSmsProvider",
  "message": "Challenge sent successfully",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "signatureId": "01234567-89ab-cdef-0123-456789abcdef",
  "challengeId": "fedcba98-7654-3210-fedc-ba9876543210",
  "provider": "SMS",
  "providerChallengeId": "SM1234567890abcdef",
  "latencyMs": 1234,
  "status": "SUCCESS"
}
```

**Observability Requirements from PRD**:
- **NFR-O1**: Structured JSON logs ✅
- **NFR-O2**: Prometheus metrics ✅
- **NFR-O3**: Distributed tracing (traceId propagation) ✅
- **NFR-O4**: No PII in logs ✅ (customer_id pseudonymized)

---

## Dependencies and Integrations

### External Dependencies (Maven)

```xml
<!-- Twilio SDK -->
<dependency>
    <groupId>com.twilio.sdk</groupId>
    <artifactId>twilio</artifactId>
    <version>9.14.1</version>
</dependency>

<!-- Firebase Admin SDK -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>

<!-- Resilience4j (already included from Epic 1) -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.1.0</version>
</dependency>

<!-- Micrometer Prometheus (already included) -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### External Service Integrations

| Service | API | Authentication | Purpose |
|---------|-----|----------------|---------|
| **Twilio SMS** | REST API (https://api.twilio.com) | Basic Auth (account_sid + auth_token) | Send SMS challenges |
| **Twilio Voice** | REST API (https://api.twilio.com) | Basic Auth | Initiate voice calls |
| **Firebase FCM** | REST API (https://fcm.googleapis.com) | Service Account JWT | Send push notifications |
| **Vault** | HTTP REST (http://localhost:8200) | Token Auth (dev), Kubernetes (prod) | Retrieve provider credentials |

### Configuration Files

#### application.yml (Resilience4j)

```yaml
resilience4j:
  timelimiter:
    instances:
      externalHttp:
        timeoutDuration: 5s
        cancelRunningFuture: true
  
  retry:
    instances:
      twilioProvider:
        maxAttempts: 3
        waitDuration: 1s
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
      
      pushProvider:
        maxAttempts: 3
        waitDuration: 1s
        exponentialBackoffMultiplier: 2
      
      voiceProvider:
        maxAttempts: 3
        waitDuration: 1s
        exponentialBackoffMultiplier: 2
```

#### Vault Secrets Structure

```
secret/
├── twilio/
│   ├── account_sid
│   ├── auth_token
│   ├── from_number
│   └── voice_number
└── firebase/
    └── service_account (JSON string)
```

---

## Acceptance Criteria (Authoritative)

### AC1: Provider Abstraction Layer

**Given** the domain layer needs to send challenges  
**When** SignatureProviderPort interface is defined  
**Then**:
- Interface is in `domain/port/outbound` package
- Method signature: `ProviderResult sendChallenge(SignatureChallenge challenge)`
- Method signature: `HealthStatus checkHealth(ProviderType providerType)`
- ProviderResult value object includes: success, providerChallengeId, providerProof, errorCode, errorMessage
- Domain layer has ZERO dependencies on infrastructure (Twilio, FCM, HTTP clients)

### AC2: Twilio SMS Provider (Production)

**Given** a signature challenge with channelType = SMS  
**When** TwilioSmsProvider.send(challenge) is called  
**Then**:
- Twilio credentials loaded from Vault (`secret/twilio/*`)
- Twilio REST API called with Message.creator()
- Timeout 5s applied (Resilience4j TimeLimiter)
- Retry 3 attempts with exponential backoff (1s, 2s, 4s)
- On success: Return ProviderResult with message_sid as providerChallengeId
- On success: Store full Twilio JSON response as providerProof
- On failure: Return ProviderResult.failure with standardized errorCode
- Metrics recorded: `provider.calls.total`, `provider.latency`

### AC3: Push Notification Provider (FCM)

**Given** a signature challenge with channelType = PUSH  
**When** PushNotificationProvider.send(challenge) is called  
**Then**:
- Firebase service account JSON loaded from Vault
- FCM message built with notification title/body
- Device token from challenge.recipient used
- FCM API called via Firebase Admin SDK
- On success: Return ProviderResult with FCM message_id
- On failure: Return ProviderResult.failure with FCM error code
- Metrics recorded: `provider.calls.total`, `provider.latency`

### AC4: Voice Call Provider (Twilio Voice)

**Given** a signature challenge with channelType = VOICE  
**When** VoiceCallProvider.send(challenge) is called  
**Then**:
- Twilio credentials loaded from Vault
- OTP code extracted from challenge message (regex pattern match)
- Twilio Voice API called with Call.creator()
- TwiML URL includes OTP parameter for Text-to-Speech
- On success: Return ProviderResult with call_sid as providerChallengeId
- Metrics recorded: `provider.calls.total`, `provider.latency`

### AC5: Biometric Provider (Stub)

**Given** a signature challenge with channelType = BIOMETRIC  
**When** BiometricProvider.send(challenge) is called  
**Then**:
- Return ProviderResult.success immediately (stub)
- providerChallengeId = "BIOMETRIC_STUB_{UUID}"
- providerProof = JSON with status "STUB_SUCCESS"
- Metrics recorded with tag `status=stub`

### AC6: Provider Adapter (Orchestration)

**Given** SignatureProviderAdapter receives sendChallenge() call  
**When** processing the challenge  
**Then**:
- Load ConnectorConfig from repository by providerType
- Validate provider is enabled (config.enabled = true)
- Select correct provider implementation by channelType
- Execute provider.send() with timeout and retry wrapping
- Return ProviderResult to caller (never throw exceptions)
- Log all provider execution details with traceId

### AC7: Connector Configuration Management

**Given** ConnectorConfig entity exists  
**When** admin creates/updates connector configuration  
**Then**:
- Entity persisted to `connector_config` table
- Fields: providerType (unique), enabled, config (JSONB), timeoutSeconds, maxRetries, vaultPath
- Audit fields: createdAt, updatedAt, createdBy, updatedBy
- Configuration changes logged to `audit_log` table
- CRUD API endpoints available at `/api/v1/admin/connectors`

### AC8: Provider Health Check Endpoint

**Given** admin needs to monitor provider status  
**When** GET /api/v1/admin/providers/health is called  
**Then**:
- Endpoint requires ROLE_ADMIN
- Health check executed for all 4 providers (SMS, PUSH, VOICE, BIOMETRIC)
- Response includes status (UP/DOWN) and details per provider
- Response format: `{ "providers": {...}, "timestamp": "..." }`
- Endpoint responds within 500ms

### AC9: Provider Timeout Configuration

**Given** provider calls can hang indefinitely  
**When** any provider.send() is executed  
**Then**:
- Resilience4j TimeLimiter applied with 5s timeout
- Timeout configured via `@TimeLimiter(name = "externalHttp")`
- On timeout: Return ProviderResult.failure("TIMEOUT", "Provider timeout exceeded")
- CompletableFuture cancelled (cancelRunningFuture = true)

### AC10: Provider Retry Logic

**Given** provider calls can fail transiently  
**When** provider.send() fails with IOException or TimeoutException  
**Then**:
- Resilience4j Retry applied with max 3 attempts
- Exponential backoff: 1s, 2s, 4s
- Retry configured via `@Retry(name = "twilioProvider")`
- Only retry on specified exceptions (IOException, TimeoutException)
- After 3 failures: Return ProviderResult.failure

### AC11: Provider Metrics Tracking

**Given** observability requires provider metrics  
**When** any provider.send() is executed  
**Then**:
- Counter incremented: `provider.calls.total{provider="...", status="success|error"}`
- Histogram recorded: `provider.latency{provider="...", status="..."}`
- Timer started before send(), stopped after result
- Metrics exportable via `/actuator/prometheus`

### AC12: Vault Integration for Secrets

**Given** provider credentials must be secure  
**When** providers initialize  
**Then**:
- All credentials loaded from Vault via VaultTemplate
- Twilio: `secret/twilio/account_sid`, `secret/twilio/auth_token`, `secret/twilio/from_number`
- Firebase: `secret/firebase/service_account` (JSON string)
- Zero hardcoded secrets in source code
- Vault connection configured in bootstrap.yml

---

## Traceability Mapping

| AC | Spec Section | Component | API/Interface | Test Idea |
|----|--------------|-----------|---------------|-----------|
| AC1 | Provider Abstraction (1) | SignatureProviderPort | `sendChallenge()`, `checkHealth()` | ArchUnit: domain port purity test |
| AC2 | TwilioSmsProvider (2.1) | TwilioSmsProvider | Twilio REST API | Integration test with Twilio mock |
| AC3 | PushNotificationProvider (2.2) | PushNotificationProvider | Firebase FCM API | Integration test with FCM mock |
| AC4 | VoiceCallProvider (2.3) | VoiceCallProvider | Twilio Voice API | Integration test with Twilio Voice mock |
| AC5 | BiometricProvider (2.4) | BiometricProvider | N/A (stub) | Unit test: verify stub success response |
| AC6 | Provider Adapter (3) | SignatureProviderAdapter | SignatureProviderPort | Integration test: provider selection logic |
| AC7 | ConnectorConfig (Data Models) | ConnectorConfigEntity, API | POST/PUT/PATCH `/admin/connectors` | API test: create/update connector config |
| AC8 | Provider Health Endpoint (4) | ProviderHealthController | GET `/admin/providers/health` | API test: health check response format |
| AC9 | Timeout Configuration (NFR Performance) | Resilience4j TimeLimiter | `@TimeLimiter` annotation | Integration test: simulate slow provider (> 5s) |
| AC10 | Retry Logic (NFR Reliability) | Resilience4j Retry | `@Retry` annotation | Integration test: simulate transient failure (retry success) |
| AC11 | Metrics Tracking (NFR Observability) | MeterRegistry | Prometheus metrics | Integration test: verify metrics incremented |
| AC12 | Vault Integration (NFR Security) | VaultTemplate | Vault REST API | Integration test: load secrets from Testcontainers Vault |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **R1: Twilio API Rate Limits** | Provider failures under load | Medium | Monitor rate limits, implement backpressure, add secondary SMS provider (future) |
| **R2: Firebase FCM Token Expiry** | Push notifications fail silently | Medium | Validate device tokens before send, handle FCM errors gracefully |
| **R3: Vault Unavailability** | Providers can't initialize | High | Fail-fast on startup (bootstrap fail-fast=true), cache credentials in-memory (future) |
| **R4: Provider Cost Overruns** | Budget exceeded | Low | Monitor metrics dashboard (Epic 6), implement rate limiting per customer (Epic 8) |
| **R5: Biometric Integration Complexity** | Stub may not match real SDK | Low | Design interface with biometric vendors early, validate stub assumptions |

### Assumptions

| Assumption | Validation Required |
|------------|---------------------|
| **A1: Twilio account active** | Validate during Story 3.2 implementation |
| **A2: Firebase project configured** | Validate during Story 3.3 implementation |
| **A3: Provider APIs idempotent** | Confirm in Twilio/FCM documentation |
| **A4: Device tokens available** | Assume mobile app provides tokens via registration endpoint |
| **A5: Voice call costs acceptable** | Validate with finance team before enabling voice in production |

### Open Questions

| Question | Owner | Deadline |
|----------|-------|----------|
| **Q1: Twilio account SID for UAT/Prod?** | DevOps | Before Story 3.2 |
| **Q2: Firebase service account JSON for Prod?** | DevOps | Before Story 3.3 |
| **Q3: Voice call TwiML endpoint URL?** | Backend Lead | Before Story 3.4 |
| **Q4: Biometric SDK vendor selection?** | Product Owner | Before Epic 3 completion |
| **Q5: Max concurrent provider calls limit?** | Architect | Before load testing (Epic 9) |

---

## Test Strategy Summary

### Test Levels

#### 1. Unit Tests (Pure JUnit 5)

**Target**: Domain models, value objects, business logic

**Scope**:
- ProviderResult.success() / failure() factory methods
- ProviderType enum mappings
- ChannelType.toProviderType() conversion

**Coverage Target**: > 90%

**Example**:
```java
@Test
void providerResult_success_shouldIncludeProviderId() {
    ProviderResult result = ProviderResult.success("SM123", "{\"status\":\"sent\"}");
    
    assertThat(result.success()).isTrue();
    assertThat(result.providerChallengeId()).isEqualTo("SM123");
    assertThat(result.providerProof()).contains("\"status\":\"sent\"");
}
```

#### 2. Integration Tests (Spring Boot + Testcontainers)

**Target**: Provider implementations, adapter logic, database persistence

**Scope**:
- TwilioSmsProvider with Twilio mock server (WireMock)
- PushNotificationProvider with FCM mock
- VoiceCallProvider with Twilio Voice mock
- SignatureProviderAdapter provider selection logic
- ConnectorConfigRepository CRUD operations
- Vault integration with Testcontainers VaultContainer

**Coverage Target**: > 80%

**Example**:
```java
@SpringBootTest
@Testcontainers
class TwilioSmsProviderIntegrationTest {
    
    @Container
    static VaultContainer<?> vault = new VaultContainer<>("hashicorp/vault:1.15");
    
    @MockBean
    private TwilioClient twilioClient;  // Or use WireMock
    
    @Autowired
    private TwilioSmsProvider provider;
    
    @Test
    void send_shouldReturnSuccessWithMessageSid() {
        // Given
        SignatureChallenge challenge = SignatureChallenge.builder()
            .recipient("+1234567890")
            .message("Your code is: 123456")
            .build();
        
        Message mockMessage = mock(Message.class);
        when(mockMessage.getSid()).thenReturn("SM123456");
        when(twilioClient.messages().create(any())).thenReturn(mockMessage);
        
        // When
        ProviderResult result = provider.send(challenge);
        
        // Then
        assertThat(result.success()).isTrue();
        assertThat(result.providerChallengeId()).isEqualTo("SM123456");
    }
}
```

#### 3. API Tests (MockMvc + Security)

**Target**: REST endpoints, security, request/response validation

**Scope**:
- GET /api/v1/admin/providers/health (with ROLE_ADMIN)
- POST /api/v1/admin/connectors (create connector config)
- PATCH /api/v1/admin/connectors/{id}/enable (enable/disable provider)

**Coverage Target**: All admin endpoints

**Example**:
```java
@WebMvcTest(ProviderHealthController.class)
class ProviderHealthControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private SignatureProviderPort providerPort;
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void getProviderHealth_shouldReturnAllProviderStatuses() throws Exception {
        // Given
        when(providerPort.checkHealth(any())).thenReturn(HealthStatus.UP("OK"));
        
        // When & Then
        mockMvc.perform(get("/api/v1/admin/providers/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.providers.SMS.status").value("UP"))
            .andExpect(jsonPath("$.providers.PUSH.status").value("UP"));
    }
}
```

#### 4. Resilience Tests

**Target**: Timeout, retry, circuit breaker behavior

**Scope**:
- Provider timeout after 5s (Resilience4j TimeLimiter)
- Provider retry on transient failure (3 attempts, exponential backoff)
- Simulate slow provider response (> 5s)
- Simulate transient failures (IOException)

**Coverage Target**: All resilience patterns

**Example**:
```java
@SpringBootTest
class ProviderResilienceTest {
    
    @Autowired
    private TwilioSmsProvider provider;
    
    @Test
    void send_shouldTimeoutAfter5Seconds() {
        // Given
        SignatureChallenge challenge = createChallenge();
        mockTwilioToDelay(10_000);  // 10s delay
        
        // When
        ProviderResult result = provider.send(challenge);
        
        // Then
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("TIMEOUT");
    }
    
    @Test
    void send_shouldRetryThreeTimes() {
        // Given
        SignatureChallenge challenge = createChallenge();
        mockTwilioToFailTwiceThenSucceed();
        
        // When
        ProviderResult result = provider.send(challenge);
        
        // Then
        assertThat(result.success()).isTrue();
        verify(twilioClient, times(3)).send(any());  // 1 initial + 2 retries
    }
}
```

### Test Data Strategy

- **Vault Secrets**: Testcontainers VaultContainer with pre-seeded secrets
- **Twilio Responses**: WireMock server with canned JSON responses
- **Firebase Responses**: Mock Firebase Admin SDK with predefined responses
- **Database**: Testcontainers PostgreSQL 15 with LiquidBase migrations

### Test Execution

```bash
# Unit tests only
mvn test -Dgroups=unit

# Integration tests (requires Testcontainers)
mvn test -Dgroups=integration

# All tests
mvn verify

# Coverage report (JaCoCo)
mvn jacoco:report
# Report: target/site/jacoco/index.html
```

### Test Coverage Requirements

| Layer | Minimum Coverage |
|-------|------------------|
| Domain (value objects) | 90% |
| Providers (TwilioSms, Push, Voice) | 80% |
| Adapter (SignatureProviderAdapter) | 80% |
| Controllers (ProviderHealthController) | 90% |
| Overall Epic 3 | 85% |

---

**Tech Spec Status**: ✅ READY FOR IMPLEMENTATION

**Approved By**: BMAD Architect Agent  
**Next Step**: Story 3.1 (Provider Abstraction Interface) - Load SM agent and run `/bmad:bmm:workflows:create-story`


