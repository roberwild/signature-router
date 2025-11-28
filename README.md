# Signature Router & Management System

Banking-grade digital signature routing and management system built with **Domain-Driven Design (DDD)** and **Hexagonal Architecture**.

## 📋 Overview

The Signature Router orchestrates multi-channel digital signature delivery (SMS, PUSH, VOICE, BIOMETRIC) with intelligent routing, cost optimization, and resilience patterns. Designed for banking compliance (PCI-DSS, GDPR, SOC 2).

> **🔄 Integration Strategy:** Current implementation uses direct provider connections (Twilio, FCM). **Future migration to MuleSoft API Gateway** planned with **zero-downtime** plug-and-play adapter swap. See [MuleSoft Integration Strategy](docs/architecture/08-mulesoft-integration-strategy.md) for details.

### Key Features

- ✅ **Multi-Provider Routing**: Dynamic channel selection based on SpEL rules
- ✅ **Fallback & Resilience**: Automatic provider fallback with Circuit Breaker
- ✅ **Event-Driven Architecture**: Kafka-based event streaming with **Outbox Pattern** (zero data loss)
- ✅ **Hexagonal Architecture**: Clean separation of concerns (Domain, Application, Infrastructure)
- ✅ **MuleSoft-Ready**: Plug-and-play architecture enables seamless migration to API Gateway
- ✅ **Banking Compliance**: Pseudonymization, TDE encryption, audit trails, non-repudiation
- ✅ **Admin Portal**: React SPA for rule management and operational monitoring
- ✅ **Transactional Consistency**: Outbox + Debezium CDC for guaranteed event delivery

## 🏗️ Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters):

```
com.bank.signature/
├── domain/                    # Pure business logic (zero framework dependencies)
│   ├── model/                 # Aggregates, Entities, Value Objects
│   ├── service/               # Domain services
│   └── port/                  # Interfaces (inbound: use cases, outbound: repositories)
│
├── application/               # Use case orchestration
│   ├── usecase/               # Use case implementations
│   └── dto/                   # Application DTOs
│
└── infrastructure/            # Adapters & configurations
    ├── adapter/
    │   ├── inbound/rest/      # REST API controllers
    │   └── outbound/
    │       ├── persistence/   # JPA repositories + Outbox pattern
    │       ├── provider/      # SMS/Push/Voice providers
    │       └── event/         # Event publishers (Outbox adapter)
    └── config/                # Spring configurations
```

**For detailed architecture, see**: [`docs/architecture/README.md`](docs/architecture/README.md)

## 🚀 Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Backend** | Spring Boot | 3.2.0 |
| **Language** | Java | 21 |
| **Build Tool** | Maven | 3.9+ |
| **Database** | PostgreSQL | 15 |
| **Messaging** | Apache Kafka | 3.6 (Confluent) |
| **Secret Management** | HashiCorp Vault | 1.15 |
| **Testing** | JUnit 5, Testcontainers, ArchUnit | - |
| **API Docs** | OpenAPI 3.1 | - |

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 21+** (OpenJDK or Oracle JDK) - [Download](https://adoptium.net/)
- **Maven 3.9+** (or use included Maven Wrapper `./mvnw`)
- **Docker & Docker Compose** (for local infrastructure: PostgreSQL, Kafka, Vault)
- **Git** (for version control)

## 🛠️ Quick Start

> **⚡ Nuevo:** Scripts automáticos disponibles para Windows PowerShell

### Opción A: Inicio Automático (Recomendado para Windows)

```powershell
# Script que inicia Docker Desktop, levanta servicios y verifica salud
.\start-system.ps1
```

Este script:
- ✅ Detecta y arranca Docker Desktop automáticamente
- ✅ Levanta todos los servicios de infraestructura
- ✅ Verifica la salud de los servicios
- ✅ Compila el proyecto

**Scripts adicionales:**
- `.\check-docker.ps1` - Diagnosticar estado de Docker y servicios
- `.\verify-health.ps1` - Verificar salud de servicios

**¿Problemas con Docker?** Ver: [`SOLUCION-RAPIDA.md`](SOLUCION-RAPIDA.md)

---

### Opción B: Inicio Manual (Paso a Paso)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd signature-router
```

### 2. Build the Project

```bash
# Using Maven Wrapper (recommended)
./mvnw clean install

# Or using system Maven
mvn clean install
```

### 3. Start Local Infrastructure

```bash
# Start all infrastructure services (PostgreSQL, Kafka, Vault, Observability)
docker-compose up -d

# Or start services individually:
docker-compose up -d postgres          # PostgreSQL 15 (Story 1.2)
docker-compose up -d zookeeper kafka   # Kafka cluster (Story 1.3)
docker-compose up -d schema-registry   # Confluent Schema Registry (Story 1.3)
docker-compose up -d vault             # HashiCorp Vault (Story 1.4)
docker-compose up -d prometheus        # Prometheus metrics (Story 1.8)
docker-compose up -d grafana           # Grafana dashboards (Story 1.8)

# Wait for services to be ready (healthchecks)
docker-compose logs -f

# Verify all services are running
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (clean state)
docker-compose down -v
```

**Infrastructure Services:**
- **PostgreSQL 15 (Application)**: Database for Signature Router (port 5432)
- **PostgreSQL 15 (Keycloak)**: Database for Keycloak IAM (port 5433)
- **Keycloak**: OAuth2 / OpenID Connect KDC (port 8180)
- **Kafka**: Event streaming (port 9092)
- **Zookeeper**: Kafka coordination (port 2181)
- **Schema Registry**: Avro schema validation (port 8081)
- **HashiCorp Vault**: Secret management (port 8200)
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Metrics visualization (port 3000)

### 4. Run the Application

```bash
# Using Maven Wrapper with local profile
./mvnw spring-boot:run -Dspring.profiles.active=local

# Application will start on http://localhost:8080
# LiquidBase will auto-execute database migrations on startup
```

**Database Migrations:**
- LiquidBase automatically creates 6 tables: `signature_request`, `signature_challenge`, `routing_rule`, `connector_config`, `outbox_event`, `audit_log`
- UUIDv7 function is created for sortable UUID primary keys
- See [`docs/development/database-migrations.md`](docs/development/database-migrations.md) for details

### 5. Verify Health

**Automated Health Check Script:**

```bash
# Windows (PowerShell)
.\verify-health.ps1

# Linux/Mac (Bash)
chmod +x verify-health.sh
./verify-health.sh
```

The script checks:
- ✅ Docker container health status
- ✅ HTTP health endpoints (Vault, Schema Registry, Prometheus, Grafana)
- ✅ Spring Boot application (if running)

**Manual Health Checks:**

```bash
# Check application health
curl http://localhost:8080/actuator/health | jq .

# Expected response:
# {
#   "status": "UP",
#   "components": {
#     "db": {"status": "UP"},
#     "kafka": {"status": "UP"},
#     "vault": {"status": "UP"},
#     ...
#   }
# }

# Check individual components
curl http://localhost:8080/actuator/health/kafka | jq .
curl http://localhost:8080/actuator/health/db | jq .
curl http://localhost:8080/actuator/health/vault | jq .

# Check infrastructure services
curl http://localhost:8081/ | jq .                    # Schema Registry
curl http://localhost:8200/v1/sys/health | jq .      # Vault
curl http://localhost:9090/-/healthy                  # Prometheus
curl http://localhost:3000/api/health | jq .         # Grafana

# Check all Docker containers
docker-compose ps
```

### 6. Access API Documentation

Once the application is running:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

## 🧪 Testing

### Run All Tests

```bash
./mvnw test
```

### Run Integration Tests

```bash
./mvnw verify
```

### Run Architecture Tests (ArchUnit)

```bash
./mvnw test -Dtest=HexagonalArchitectureTest
```

### Test Coverage

```bash
./mvnw jacoco:report

# View coverage report at: target/site/jacoco/index.html
```

## 🗄️ Database Setup

### PostgreSQL 15 with LiquidBase

This project uses **LiquidBase** for database migrations following corporate standards.

### Outbox Pattern for Event Publishing

The Signature Router implements the **Transactional Outbox Pattern** for guaranteed event delivery:

```
Application TX:
  1. Save aggregate (signature_request)
  2. Save event (outbox_event)
  ↓
Debezium CDC:
  3. Read outbox_event from PostgreSQL WAL
  4. Publish to Kafka (signature.events topic)
  5. Update published_at timestamp
```

**Benefits:**
- ✅ **Zero data loss** - Events survive app crashes
- ✅ **Atomicity** - State + Event in same transaction
- ✅ **Decoupling** - App doesn't depend on Kafka availability

**See:** [`docs/architecture/OUTBOX-PATTERN.md`](docs/architecture/OUTBOX-PATTERN.md) for implementation details.

**Quick Commands:**

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Connect to PostgreSQL
docker exec -it signature-router-postgres psql -U siguser -d signature_router

# Verify tables created
\dt

# Check LiquidBase migration history
SELECT id, author, filename FROM databasechangelog ORDER BY orderexecuted;

# Exit psql
\q
```

**LiquidBase Commands:**

```bash
# Check LiquidBase status
./mvnw liquibase:status

# Rollback last changeset
./mvnw liquibase:rollback -Dliquibase.rollbackCount=1

# Generate SQL without executing (dry-run)
./mvnw liquibase:updateSQL
```

**Documentation:**
- **[Database Migrations Workflow](docs/development/database-migrations.md)** - LiquidBase standards, promotion flow, troubleshooting
- **[Database Schema](docs/architecture/03-database-schema.md)** - Complete DDL with constraints, indexes, performance tuning

---

## 🗃️ Persistence Layer (JPA)

### Hexagonal Architecture Pattern

This project implements persistence using **Hexagonal Architecture** (Ports & Adapters):

```
Domain Layer (Pure Business Logic)
  ├── domain/model/                    # Aggregates, Entities, Value Objects
  └── domain/port/outbound/            # Port Interfaces (contracts)
      └── SignatureRequestRepository   # ← Domain defines what it needs

Infrastructure Layer (Adapters)
  └── infrastructure/adapter/outbound/persistence/
      ├── entity/                      # JPA Entities (SignatureRequestEntity)
      ├── repository/                  # Spring Data JPA Repositories
      ├── mapper/                      # Domain ↔ Entity Mappers
      └── adapter/                     # Repository Adapter (implements port)
          └── SignatureRequestRepositoryAdapter  # ← Infrastructure provides it
```

**Benefits:**
- ✅ Domain layer remains pure (zero framework dependencies)
- ✅ Infrastructure is swappable (JPA, MongoDB, in-memory for testing)
- ✅ Testability: Domain logic testable without database

### JPA Entities

**SignatureRequestEntity** (root entity):
- Maps to `signature_request` table
- `@OneToMany` relationship with challenges (cascade ALL, orphanRemoval)
- JSONB columns: `transaction_context`, `routing_timeline` (PostgreSQL JSONB)

**SignatureChallengeEntity** (child entity):
- Maps to `signature_challenge` table
- `@ManyToOne` back-reference to SignatureRequestEntity
- JSONB column: `provider_proof` (non-repudiation proof)

### JSONB Serialization

JSONB columns use **Hypersistence Utils** for PostgreSQL:

```java
@Type(JsonBinaryType.class)
@Column(name = "transaction_context", columnDefinition = "jsonb")
private String transactionContextJson;  // Jackson serialized TransactionContext
```

**Value Objects → JSONB:**
- `TransactionContext` (Money, merchantId, orderId, hash)
- `List<RoutingEvent>` (audit trail of routing decisions)
- `ProviderResult` (cryptographic proof for compliance)

### Entity Mappers

**Bidirectional mapping** (Domain ↔ JPA Entity):

```java
@Component
public class SignatureRequestEntityMapper {
    public SignatureRequestEntity toEntity(SignatureRequest domain) {
        // Domain → JPA Entity (for save)
    }
    
    public SignatureRequest toDomain(SignatureRequestEntity entity) {
        // JPA Entity → Domain (for retrieval)
    }
    
    public void updateEntity(SignatureRequest domain, SignatureRequestEntity entity) {
        // Update existing entity (for updates)
    }
}
```

### Repository Adapter

**SignatureRequestRepositoryAdapter** implements domain port:

```java
@Component
public class SignatureRequestRepositoryAdapter implements SignatureRequestRepository {
    private final SignatureRequestJpaRepository jpaRepository;
    private final SignatureRequestEntityMapper mapper;
    
    @Override
    @Transactional
    public SignatureRequest save(SignatureRequest request) {
        SignatureRequestEntity entity = mapper.toEntity(request);
        SignatureRequestEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);  // Returns DOMAIN model, NOT JPA entity
    }
}
```

**Transactional Boundaries:**
- Write methods: `@Transactional` (read-only = false)
- Read methods: `@Transactional(readOnly = true)` (performance optimization)

---

## 🔌 Provider Abstraction (Story 3.1)

### Hexagonal Architecture - Domain Port Pattern

The **Provider Abstraction Layer** enables the domain layer to communicate with external signature providers (SMS, Push, Voice, Biometric) without coupling to specific vendor implementations (Twilio, Firebase, etc.).

```
Domain Layer (Pure Business Logic)
  ├── domain/port/outbound/            
  │   └── SignatureProviderPort        # ← Domain port interface (vendor-agnostic)
  └── domain/model/valueobject/
      ├── ProviderResult               # Success/failure result pattern
      ├── ProviderType                 # Abstract provider types (SMS, PUSH, VOICE, BIOMETRIC)
      └── HealthStatus                 # Provider health status (UP/DOWN)

Infrastructure Layer (Adapters)
  └── infrastructure/adapter/outbound/provider/
      ├── TwilioSmsProvider            # ← Implements SignatureProviderPort
      ├── FcmPushProvider              # ← Implements SignatureProviderPort
      ├── TwilioVoiceProvider          # ← Implements SignatureProviderPort
      └── BiometricSdkProvider         # ← Implements SignatureProviderPort
```

### SignatureProviderPort Interface

**Domain port interface** (zero infrastructure dependencies):

```java
public interface SignatureProviderPort {
    /**
     * Sends a signature challenge via provider's channel.
     * Returns ProviderResult with success/failure details.
     */
    ProviderResult sendChallenge(SignatureChallenge challenge);
    
    /**
     * Checks health status of provider.
     * Returns HealthStatus (UP/DOWN) with details.
     */
    HealthStatus checkHealth(ProviderType providerType);
}
```

### ProviderResult (Success/Failure Pattern)

**Immutable record** representing provider call result:

```java
// Success scenario
ProviderResult result = ProviderResult.success(
    "SM1234567890abcdef",           // Provider challenge ID (e.g., Twilio Message SID)
    "{\"status\":\"sent\",\"to\":\"...\"}"  // Full JSON proof
);

if (result.success()) {
    String messageId = result.providerChallengeId();
    String proof = result.providerProof();
    challenge.markAsSent(messageId, proof);
}

// Failure scenario
ProviderResult result = ProviderResult.failure(
    "TIMEOUT",                      // Error code
    "Provider did not respond within 5s"  // Error message
);

if (!result.success()) {
    log.error("Provider failed: {} - {}", result.errorCode(), result.errorMessage());
    throw new ProviderException(result.errorCode(), result.errorMessage());
}
```

### ProviderType Enum (Abstract Types)

**Abstract provider types** (not vendor-specific):

```java
public enum ProviderType {
    SMS("SMS Provider"),                    // SMS channel (Twilio, Vonage, etc.)
    PUSH("Push Notification Provider"),     // Push notifications (FCM, OneSignal, etc.)
    VOICE("Voice Call Provider"),           // Voice calls (Twilio Voice, etc.)
    BIOMETRIC("Biometric Provider");        // Biometric authentication

    public String getDisplayName() {
        return displayName;
    }
}
```

### ChannelType to ProviderType Mapping

**Business channel** → **Abstract provider type**:

```java
ChannelType.SMS.toProviderType()       // → ProviderType.SMS
ChannelType.PUSH.toProviderType()      // → ProviderType.PUSH
ChannelType.VOICE.toProviderType()     // → ProviderType.VOICE
ChannelType.BIOMETRIC.toProviderType() // → ProviderType.BIOMETRIC
```

### Benefits

- ✅ **Domain Purity**: Zero dependencies on Twilio, FCM, HTTP clients
- ✅ **Testability**: Domain logic testable without real providers
- ✅ **Flexibility**: Swap providers (Twilio → Vonage) without touching domain
- ✅ **ArchUnit Validation**: Automated tests enforce domain purity

### Implementation Examples

> **⚠️ Note:** Current provider implementations (TwilioSmsProvider, FcmPushProvider, etc.) are **temporary** and will be replaced by a single `MuleSoftApiProvider` when MuleSoft API Gateway is available. See [MuleSoft Integration Strategy](docs/architecture/08-mulesoft-integration-strategy.md) and [ADR-003](docs/architecture/adr/ADR-003-mulesoft-integration.md) for migration plan.

#### TwilioSmsProvider (Story 3.2) - TEMPORARY

**Twilio SMS Provider** implements SignatureProviderPort for SMS delivery:

```java
@Component("smsProvider")
public class TwilioSmsProvider implements SignatureProviderPort {
    
    @Override
    public ProviderResult sendChallenge(SignatureChallenge challenge) {
        try {
            // Send SMS via Twilio API
            Message message = twilioClient.sendSms(
                challenge.getRecipient(),
                challenge.getMessage()
            );
            
            // Return success with proof
            String proof = buildProviderProof(message);
            return ProviderResult.success(message.getSid(), proof);
            
        } catch (ApiException e) {
            // Return failure (no exception thrown)
            return ProviderResult.failure("TWILIO_ERROR", e.getMessage());
        } catch (TimeoutException e) {
            return ProviderResult.failure("TIMEOUT", "Twilio timeout exceeded");
        }
    }
    
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        if (providerType != ProviderType.SMS) {
            throw new IllegalArgumentException("Expected SMS provider type");
        }
        try {
            // Validate credentials and connectivity
            long latency = performHealthCheck();
            return HealthStatus.up("Twilio SMS operational (latency: " + latency + "ms)");
        } catch (Exception e) {
            return HealthStatus.down("Twilio API unreachable: " + e.getMessage());
        }
    }
}
```

#### PushNotificationProvider (Story 3.3) - TEMPORARY

**Firebase Cloud Messaging (FCM) Provider** implements SignatureProviderPort for push notifications:


```java
@Component("pushProvider")
public class PushNotificationProvider implements SignatureProviderPort {
    
    private final FirebaseMessaging firebaseMessaging;
    
    @Override
    public ProviderResult sendChallenge(SignatureChallenge challenge) {
        String deviceToken = challenge.getRecipient();
        
        try {
            // Build FCM message with notification + data payload
            Message message = Message.builder()
                .setNotification(Notification.builder()
                    .setTitle("Código de Firma Digital")
                    .setBody("Su código es: " + challenge.getChallengeCode())
                    .build())
                .putAllData(Map.of(
                    "challengeId", challenge.getId().toString(),
                    "challengeCode", challenge.getChallengeCode(),
                    "expiresAt", challenge.getExpiresAt().toString()
                ))
                .setToken(deviceToken)
                .build();
            
            // Send via FCM
            String messageId = firebaseMessaging.send(message);
            String proof = buildProviderProof(messageId, deviceToken);
            
            return ProviderResult.success(messageId, proof);
            
        } catch (FirebaseMessagingException e) {
            String errorCode = "FCM_ERROR_" + e.getMessagingErrorCode();
            return ProviderResult.failure(errorCode, e.getMessage());
        } catch (Exception e) {
            return ProviderResult.failure("PROVIDER_ERROR", e.getMessage());
        }
    }
    
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        if (providerType != ProviderType.PUSH) {
            throw new IllegalArgumentException("Expected PUSH provider type");
        }
        try {
            // Validate FCM configuration
            if (firebaseMessaging == null) {
                return HealthStatus.down("FCM not initialized");
            }
            return HealthStatus.up("FCM Push provider operational");
        } catch (Exception e) {
            return HealthStatus.down("FCM configuration error: " + e.getMessage());
        }
    }
}
```

**FCM Configuration** (`application.yml`):

```yaml
fcm:
  enabled: true
  service-account-path: classpath:firebase-service-account.json
  project-id: my-firebase-project  # Optional - auto-detected from JSON
```

**Setup Steps**:
1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
2. Click "Generate new private key" and save `firebase-service-account.json`
3. Place in `src/main/resources/` or external path
4. **IMPORTANT**: Add to `.gitignore` (DO NOT commit credentials)
5. Enable FCM by setting `fcm.enabled=true`

---

#### VoiceCallProvider (Story 3.4)

**Twilio Programmable Voice Provider** implements SignatureProviderPort for voice calls with TTS:

```java
@Component("voiceProvider")
public class VoiceCallProvider implements SignatureProviderPort {
    
    private final TwilioConfig twilioConfig;
    private final VoiceProviderConfig voiceConfig;
    
    @Override
    @Retry(name = "twilioProvider")
    @TimeLimiter(name = "twilioProvider")
    public ProviderResult sendChallenge(SignatureChallenge challenge, String phoneNumber) {
        try {
            // Build TwiML with Text-to-Speech
            String twiml = buildTwiml(challenge);
            
            // Place voice call via Twilio
            Call call = Call.creator(
                new PhoneNumber(phoneNumber),
                new PhoneNumber(twilioConfig.getFromNumber()),
                new Twiml(twiml)
            ).create();
            
            String proof = buildProviderProof(call, phoneNumber);
            return ProviderResult.success(call.getSid(), proof);
            
        } catch (ApiException e) {
            return ProviderResult.failure("TWILIO_VOICE_ERROR_" + e.getCode(), e.getMessage());
        } catch (Exception e) {
            return ProviderResult.failure("PROVIDER_ERROR", e.getMessage());
        }
    }
    
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        if (providerType != ProviderType.VOICE) {
            throw new IllegalArgumentException("Expected VOICE provider type");
        }
        // Validate Twilio credentials, fromNumber, TTS config
        return HealthStatus.up("Twilio Voice provider operational");
    }
    
    private String buildTwiml(SignatureChallenge challenge) {
        String code = challenge.getChallengeCode();
        String digits = String.join(" ", code.split(""));  // "1 2 3 4 5 6"
        
        return String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<Response>" +
            "  <Say voice=\"%s\" language=\"%s\">" +
            "    Su código de firma es: %s. Repito, su código es: %s" +
            "  </Say>" +
            "</Response>",
            voiceConfig.getTtsVoice(),
            voiceConfig.getTtsLanguage(),
            digits,
            digits
        );
    }
}
```

**Voice Configuration** (`application.yml`):

```yaml
providers:
  voice:
    enabled: false  # Disabled by default (expensive - ~10x SMS cost)
    api-url: https://api.twilio.com/2010-04-01
    timeout-seconds: 5
    tts-language: es-ES  # Spanish
    tts-voice: Polly.Mia  # Amazon Polly (español latinoamericano)
    max-call-duration: 60  # Max 60 seconds
```

**Available TTS Voices**:
- `Polly.Mia` - Español latinoamericano (mujer) ⭐ Default
- `Polly.Lupe` - Español latinoamericano (mujer)
- `Polly.Miguel` - Español latinoamericano (hombre)

**Cost Considerations**:
- Voice calls cost ~$0.013/minute in Latin America
- **~10x more expensive than SMS**
- Disabled by default - enable only for high-value transactions
- Set `max-call-duration` to control costs

**Phone Number Format**: E.164 required (e.g., `+573001234567`)

---

#### BiometricProvider (Story 3.5)

**Biometric Provider (Stub)** implements SignatureProviderPort for future biometric integration:

```java
@Component("biometricProvider")
public class BiometricProvider implements SignatureProviderPort {
    
    @Override
    public ProviderResult sendChallenge(SignatureChallenge challenge, String biometricId) {
        // Stub implementation - simulates successful biometric verification
        String mockChallengeId = "bio_" + UUID.randomUUID();
        String mockProof = buildMockProof(mockChallengeId, biometricId);
        
        return ProviderResult.success(mockChallengeId, mockProof);
    }
    
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        if (providerType != ProviderType.BIOMETRIC) {
            throw new IllegalArgumentException("Expected BIOMETRIC provider type");
        }
        return config.isEnabled() 
            ? HealthStatus.up("Biometric provider operational (stub)")
            : HealthStatus.down("Biometric provider disabled");
    }
}
```

**Future Integration** (Zero Architectural Changes):
- **iOS**: LocalAuthentication (Touch ID / Face ID)
- **Android**: BiometricPrompt API
- **Windows**: Windows Hello
- **Web**: WebAuthn API
- **Backend**: Veriff, Onfido, Jumio

**Configuration**:
```yaml
providers:
  biometric:
    enabled: false  # Stub - not production-ready
    timeout-seconds: 3
```

---

### Provider Configuration Management (Story 3.6)

**Unified Configuration**: All providers extend `ProviderConfigProperties` for consistent configuration:

```yaml
providers:
  twilio:
    enabled: true  # Feature flag
    timeout-seconds: 5  # API timeout
    retry-max-attempts: 3  # Retry count
    account-sid: ${TWILIO_ACCOUNT_SID}  # Vault secret
    auth-token: ${TWILIO_AUTH_TOKEN}  # Vault secret
    from-number: ${TWILIO_FROM_NUMBER}  # E.164 format
  
  push:
    enabled: true
    timeout-seconds: 3
    retry-max-attempts: 2
  
  voice:
    enabled: false  # Disabled (expensive)
    timeout-seconds: 10
    retry-max-attempts: 2
  
  biometric:
    enabled: false  # Stub
    timeout-seconds: 3
    retry-max-attempts: 0  # No retries
```

**Base Configuration Class**:
```java
@Data
public abstract class ProviderConfigProperties {
    @NotNull
    private boolean enabled = false;  // Feature flag
    
    @Min(1) @Max(30)
    private int timeoutSeconds = 3;  // Timeout (1-30s)
    
    @Min(0) @Max(5)
    private int retryMaxAttempts = 3;  // Retry count (0-5)
}
```

**Provider Health Check**:
```bash
# Check all providers health
curl http://localhost:8080/actuator/health/providers

# Response example
{
  "status": "UP",
  "details": {
    "smsProvider": "UP: Twilio SMS operational",
    "pushProvider": "UP: FCM Push operational",
    "voiceProvider": "DOWN: Voice provider disabled",
    "biometricProvider": "DOWN: Biometric provider disabled"
  }
}
```

---

### Provider Timeout Configuration (Story 3.8)

**Resilience4j TimeLimiter Integration**: Each provider has configurable timeout protection via Resilience4j TimeLimiter to prevent indefinite hangs and ensure fail-fast behavior.

**Default Timeout Values**:
```yaml
resilience4j:
  timelimiter:
    configs:
      default:
        timeout-duration: 5s
        cancel-running-future: true  # Cancel thread on timeout
    instances:
      smsTimeout:
        timeout-duration: 5s    # Twilio SMS (typical: 1-2s → 2.5x margin)
      pushTimeout:
        timeout-duration: 3s    # Firebase FCM (typical: 0.5-1s → 3x margin)
      voiceTimeout:
        timeout-duration: 10s   # Twilio Voice (typical: 4-6s → 2x margin)
      biometricTimeout:
        timeout-duration: 2s    # Biometric SDK (stub: instant, future: 1-2s)
```

**Multi-Environment Strategy**:

| Environment | SMS Timeout | Push Timeout | Voice Timeout | Biometric Timeout | Rationale |
|-------------|-------------|--------------|---------------|-------------------|-----------|
| **local** (dev) | 10s | 10s | 15s | 10s | Permissive for debugging with breakpoints |
| **uat** | 5s | 3s | 10s | 2s | Production-like for realistic testing |
| **prod** | 4s | 2s | 8s | 2s | Strict fail-fast to meet P99 < 3s NFR |

**Configuration Per Environment**:

`application-local.yml` (Development):
```yaml
resilience4j:
  timelimiter:
    instances:
      smsTimeout:
        timeout-duration: 10s  # Permissive for debugging
      pushTimeout:
        timeout-duration: 10s
      voiceTimeout:
        timeout-duration: 15s
```

`application-prod.yml` (Production):
```yaml
resilience4j:
  timelimiter:
    instances:
      smsTimeout:
        timeout-duration: 4s   # Strict for fail-fast
      pushTimeout:
        timeout-duration: 2s
      voiceTimeout:
        timeout-duration: 8s
```

**Timeout Behavior**:
1. **Provider responds in time** → Normal `ProviderResult.success()`
2. **Provider exceeds timeout** → `ProviderResult.timeout()` returned with `timedOut=true`
3. **Timeout triggers**:
   - CompletableFuture cancelled (`cancelRunningFuture=true` prevents thread leak)
   - Prometheus counter `provider.timeout.total{provider="SMS|PUSH|VOICE|BIOMETRIC"}` incremented
   - Log WARNING (not ERROR): `"Provider timeout: provider=SMS, duration=5001ms, challengeId=..., traceId=..."`
   - May trigger fallback chain (if configured)

**Prometheus Metrics**:
```promql
# Total timeout events by provider
provider_timeout_total{provider="SMS"}
provider_timeout_total{provider="PUSH"}
provider_timeout_total{provider="VOICE"}
provider_timeout_total{provider="BIOMETRIC"}
```

**Troubleshooting Timeouts**:

**Symptom**: Provider timing out frequently

**Diagnosis**:
```bash
# Check timeout metrics
curl http://localhost:8080/actuator/prometheus | grep provider_timeout

# View recent timeout logs (includes traceId for correlation)
grep "Provider timeout" logs/application.log

# Check provider latency metrics
curl http://localhost:8080/actuator/prometheus | grep provider_latency
```

**Resolution**:
1. **Verify timeout configuration** matches provider typical latency:
   ```bash
   curl http://localhost:8080/actuator/configprops | jq '.resilience4j.timelimiter'
   ```

2. **Adjust timeouts** if P99 latency > timeout value:
   - Calculate: `timeout = P99_latency + 2s safety margin`
   - Update `application-{env}.yml`
   - Restart application

3. **Check provider health**:
   ```bash
   curl http://localhost:8080/api/v1/admin/providers/health
   ```

**Implementation Details**:
- **Async Execution**: All providers implement `sendChallengeAsync()` returning `CompletableFuture<ProviderResult>`
- **TimeLimiter Decoration**: `SignatureProviderAdapter` decorates async calls with `TimeLimiter.executeCompletionStage()`
- **Thread Pool**: Dedicated `ScheduledExecutorService` with 10 threads (name pattern: `provider-timeout-{n}`)
- **Fallback Integration**: Timeout failures (`ProviderResult.timedOut=true`) can trigger fallback chain

**Configuration Properties Endpoint**:
```bash
# View all configuration (secrets masked)
curl http://localhost:8080/actuator/configprops
```

**Security**:
- Credentials referenced via `${VAULT_PATH}` placeholders
- Secrets masked in `/actuator/configprops` endpoint
- `@Validated` + Bean Validation for fail-fast startup

---

### Provider Health Check Endpoint (Story 3.7)

**Admin API** para monitoreo detallado de providers:

```bash
# Get provider health (uses cache)
curl -H "Authorization: Bearer ${JWT_TOKEN}" \
  http://localhost:8080/api/v1/admin/providers/health

# Force fresh health check (bypass cache)
curl -H "Authorization: Bearer ${JWT_TOKEN}" \
  http://localhost:8080/api/v1/admin/providers/health?refresh=true
```

**Response Example**:
```json
{
  "overallStatus": "DEGRADED",
  "timestamp": "2025-11-27T10:30:00Z",
  "providers": [
    {
      "name": "smsProvider",
      "type": "SMS",
      "status": "UP",
      "details": "Twilio SMS operational",
      "lastCheckTimestamp": "2025-11-27T10:29:45Z",
      "latencyMs": 120
    },
    {
      "name": "voiceProvider",
      "type": "VOICE",
      "status": "DOWN",
      "details": "Voice provider disabled",
      "lastCheckTimestamp": "2025-11-27T10:29:45Z",
      "latencyMs": 5,
      "errorMessage": "Provider disabled via configuration"
    }
  ]
}
```

**Overall Status**:
- `UP`: All providers operational
- `DEGRADED`: Some providers down (fallback available)
- `DOWN`: All providers down (system unhealthy)

**Security**: Requires `ROLE_ADMIN` (OAuth2 JWT)

---

### Circuit Breakers per Provider (Story 4-1)

**Resilience4j Circuit Breakers** previenen cascading failures:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      smsProvider:
        failure-rate-threshold: 50  # Open if 50% fail
        wait-duration-in-open-state: 30s  # Test recovery after 30s
        sliding-window-size: 100  # Track last 100 calls (Story 4.4)
```

**Circuit States**:
- **CLOSED**: Normal operation
- **OPEN**: Provider failing, calls rejected immediately
- **HALF_OPEN**: Testing recovery (3 test calls)

**Metrics**: `resilience4j_circuitbreaker_state`, `resilience4j_circuitbreaker_calls`

---

### Error Rate Calculation (Story 4.4)

**ProviderErrorRateCalculator** calcula error rate en tiempo real para circuit breaker decisions:

```yaml
resilience:
  error-rate:
    threshold: 0.50  # Publish event if error rate > 50%
    sustained-duration-seconds: 30  # Must exceed for 30s
```

**Error Rate Formula**:
```
errorRate = failures / (successes + failures)
```

**Window**: 1 minute rolling window (actualizado cada 10 segundos)

**Edge Cases**:
- Sin llamadas → `errorRate = 0.0` (asume healthy)
- Todas las llamadas fallaron → `errorRate = 1.0` (100%)
- Todas exitosas → `errorRate = 0.0` (0%)

**Integration**:
- Error rate > 50% por 30s → Publica `ProviderErrorRateExceeded` event
- `DegradedModeManager` escucha evento y activa degraded mode
- Health endpoint `/actuator/health/providers` incluye error rate actual

**Prometheus Gauge**: `provider.error.rate{provider="SMS|PUSH|VOICE|BIOMETRIC"}`

**Health Status Logic**:
- `error_rate < 25%` → UP (healthy)
- `25% ≤ error_rate < 50%` → WARNING (degraded)
- `error_rate ≥ 50%` → DOWN (critical)

---

### Fallback Chain (Story 4-2)

**Automatic fallback** cuando provider falla:

```yaml
fallback:
  enabled: true
  chains:
    SMS: VOICE      # SMS fails → Voice fallback
    PUSH: SMS       # Push fails → SMS fallback
    BIOMETRIC: SMS  # Biometric fails → SMS fallback
```

**Beneficios**:
- 📈 **Higher Success Rate**: ~95% delivery (vs ~85% single channel)
- 🔄 **Automatic Recovery**: No manual intervention needed
- ⚡ **Circuit Breaker Integration**: Fallback when circuit OPEN
- 🔒 **Loop Prevention**: Max 1 fallback per request

**Flow**: SMS fail → Circuit OPEN → Fallback to Voice → Success ✅

### Usage Example

```java
// In a use case (application layer)
@Service
public class CreateSignatureRequestUseCase {
    private final SignatureRequestRepository repository;  // Domain port interface
    
    public SignatureRequest execute(CreateSignatureRequestCommand cmd) {
        SignatureRequest request = SignatureRequest.builder()
            .id(UUIDGenerator.generateV7())
            .customerId(cmd.customerId())
            .transactionContext(cmd.transactionContext())
            .status(SignatureStatus.PENDING)
            .build();
        
        return repository.save(request);  // Uses JPA adapter under the hood
    }
}
```

---

## 🔐 REST API & Security

### OpenAPI 3.1 Documentation (Springdoc)

This project uses **Springdoc OpenAPI** for automatic API documentation generation.

**Access Points:**
- **Swagger UI**: http://localhost:8080/swagger-ui.html (Interactive API documentation)
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs (Machine-readable spec)

**Features:**
- ✅ Automatic request/response schema generation from DTOs
- ✅ Try-it-out functionality for testing endpoints
- ✅ Bearer JWT authentication scheme configured
- ✅ API versioning: Base path `/api/v1/`

### OAuth2 Resource Server (JWT Authentication)

This project uses **Spring Security OAuth2 Resource Server** for stateless JWT authentication.

**Authentication Flow:**
1. Client obtains JWT token from OAuth2 authorization server (e.g., Keycloak)
2. Client includes token in `Authorization: Bearer {token}` header
3. Application validates token against issuer's RSA public key
4. Claims extracted: subject, roles, expiration
5. Request processed if token valid; otherwise HTTP 401 Unauthorized

**Configuration:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/signature-router
```

### Role-Based Access Control (RBAC)

**Security Policies:**

| Endpoint Pattern | Access Level | Required Role |
|-----------------|--------------|---------------|
| `/swagger-ui/**`, `/v3/api-docs/**` | Public | None |
| `/actuator/health`, `/actuator/info` | Public | None |
| `/api/v1/health` | Public | None (smoke test) |
| `/api/v1/admin/**` | Admin only | `ROLE_ADMIN` |
| `/api/v1/routing/**` | Support/Admin | `ROLE_ADMIN` or `ROLE_SUPPORT` |
| `/api/v1/**` | Authenticated | Any role |

**Supported Roles:**
- `ROLE_ADMIN` - Full access (CRUD routing rules, view audit logs)
- `ROLE_AUDITOR` - Read-only access (view signature requests, audit logs)
- `ROLE_SUPPORT` - Routing rules management, signature request queries
- `ROLE_USER` - Basic signature request operations (create, query own requests)

### Error Response Format (Standard)

All REST endpoints return consistent error responses:

```json
{
  "code": "FALLBACK_EXHAUSTED",
  "message": "All fallback channels have been exhausted",
  "details": {
    "requestId": "abc-123",
    "channelsAttempted": ["SMS", "PUSH", "VOICE"]
  },
  "timestamp": "2025-11-27T10:30:00.000Z",
  "traceId": "64f3a2b1c9e8d7f6",
  "path": "/api/v1/signature/abc-123/complete"
}
```

**Exception Mapping:**

| Exception Type | HTTP Status | Error Code |
|---------------|-------------|------------|
| `DomainException` | 422 Unprocessable Entity | `exception.errorCode` |
| `NotFoundException` | 404 Not Found | `NOT_FOUND` |
| `MethodArgumentNotValidException` | 400 Bad Request | `VALIDATION_ERROR` |
| `AccessDeniedException` | 403 Forbidden | `FORBIDDEN` |
| `Exception` (generic) | 500 Internal Server Error | `INTERNAL_ERROR` |

**Note:** HTTP 500 responses do NOT expose stack traces (security best practice).

### CORS Configuration

**Development (`application-local.yml`):**
```yaml
# Allowed origins for local development
- http://localhost:3000  # React dev server
- http://localhost:4200  # Angular dev server
```

**Production (`application-prod.yml`):**
```yaml
# Restrictive origins for production
- https://admin.signature-router.bank.com
```

### Session Management

- **Strategy**: Stateless (no server-side sessions)
- **CSRF Protection**: Disabled (stateless JWT authentication)
- **Token Storage**: Client-side (JWT in Authorization header)

### Testing REST API

**Example curl commands:**

```bash
# Access Swagger UI (no auth)
curl http://localhost:8080/swagger-ui.html

# API health check (public endpoint)
curl http://localhost:8080/api/v1/health

# API without JWT (should fail with 401)
curl http://localhost:8080/api/v1/signature

# API with JWT (replace $JWT_TOKEN with actual token)
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:8080/api/v1/signature

# Health endpoint (no auth)
curl http://localhost:8080/actuator/health | jq .
```

---

## 📡 Kafka Event Streaming

### Kafka Cluster (Confluent Platform 7.5)

This project uses **Apache Kafka** for event-driven architecture with **Avro serialization** and **Schema Registry** for schema validation.

**Quick Commands:**

```bash
# Start Kafka cluster
docker-compose up -d zookeeper kafka schema-registry

# List topics
docker exec signature-router-kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --list

# Describe signature.events topic
docker exec signature-router-kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic signature.events

# Consume events (console consumer)
docker exec signature-router-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic signature.events \
  --from-beginning

# Check Schema Registry schemas
curl http://localhost:8081/subjects | jq .

# Get latest schema for signature.events
curl http://localhost:8081/subjects/signature.events-value/versions/latest | jq .
```

**Event Types:**
- `SIGNATURE_REQUEST_CREATED` - New signature request
- `CHALLENGE_SENT` - Challenge delivered to user
- `CHALLENGE_COMPLETED` - User completed challenge
- `CHALLENGE_FAILED` - Challenge failed (timeout, invalid OTP)
- `SIGNATURE_COMPLETED` - Signature process completed successfully
- `SIGNATURE_FAILED` - Signature process failed
- `FALLBACK_TRIGGERED` - Fallback channel activated
- `PROVIDER_DEGRADED` - Provider circuit breaker opened

**Documentation:**
- **[Kafka Messaging Guide](docs/development/kafka-messaging.md)** - Event publishing, schema evolution, troubleshooting
- **[Event Catalog](docs/architecture/04-event-catalog.md)** - Complete event schemas, Avro definitions

---

## 🔐 Vault Secret Management

### HashiCorp Vault 1.15

This project uses **HashiCorp Vault** for banking-grade secret management.

**Quick Commands:**

```bash
# Start Vault (dev mode)
docker-compose up -d vault

# Access Vault UI
open http://localhost:8200/ui
# Token: dev-token-123

# Initialize secrets
docker-compose exec vault sh /vault/scripts/vault-init.sh

# Verify secrets
docker-compose exec vault vault kv get secret/signature-router

# Check Vault health
curl http://localhost:8080/actuator/health/vault
```

**Secrets Managed:**
- `database.password` - PostgreSQL database password
- `kafka.sasl-jaas-config` - Kafka SASL authentication config (placeholder for prod)
- `twilio.api-key`, `twilio.api-secret` - Twilio SMS provider credentials
- `push-service.api-key` - Push notification service API key
- `biometric-sdk.license` - Biometric SDK license key

**Key Features:**
- ✅ **Fail-Fast:** Application won't start if Vault is unavailable (banking-grade reliability)
- ✅ **Dynamic Refresh:** Secrets auto-reload every 60s (dev) / 300s (prod) without restart
- ✅ **Multi-Environment:** TOKEN auth (dev) vs KUBERNETES auth (prod)
- ✅ **KV v2:** Versioned secrets with rollback support
- ⚠️ **Dev Mode:** Uses `dev-token-123` for local development ONLY (never in production)

**Documentation:**
- **[Vault Secrets Guide](docs/development/vault-secrets.md)** - Architecture, rotation strategy, troubleshooting ✨ NEW
- **[Security Architecture](docs/architecture/07-observability-security.md)** - PseudonymizationService, secret management

---

## 📊 Observability & Monitoring

### Prometheus + Grafana Stack

This project includes a complete observability stack for metrics collection and visualization.

**Quick Commands:**

```bash
# Start observability stack
docker-compose up -d prometheus grafana

# Access Prometheus UI
open http://localhost:9090

# Access Grafana UI
open http://localhost:3000
# Credentials: admin / admin

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq .

# Query metrics directly
curl http://localhost:9090/api/v1/query?query=up | jq .

# Check Spring Boot Actuator Prometheus endpoint
curl http://localhost:8080/actuator/prometheus
```

**Grafana Dashboards:**
- **Signature Router - Overview**: Pre-configured dashboard with key metrics
  - Application Status (UP/DOWN)
  - HTTP Request Rate (req/s)
  - HTTP Latency Percentiles (P50, P95, P99)
  - JVM Memory Usage (Heap, Non-Heap)
  - Database Connection Pool (HikariCP)
  - CPU Usage (System, Process)

**Prometheus Metrics Collected:**
- `http_server_requests_seconds_*` - HTTP request metrics (rate, latency)
- `jvm_memory_*` - JVM memory metrics (heap, non-heap, GC)
- `hikaricp_connections_*` - Database connection pool metrics
- `system_cpu_usage`, `process_cpu_usage` - CPU metrics
- `up` - Application health status

**Configuration Files:**
- `observability/prometheus.yml` - Prometheus scrape configuration
- `observability/grafana/provisioning/datasources/` - Grafana datasource auto-provisioning
- `observability/grafana/provisioning/dashboards/` - Dashboard auto-provisioning
- `observability/grafana/dashboards/` - Pre-built dashboard definitions

**Key Features:**
- ✅ **Auto-Discovery:** Prometheus scrapes Spring Boot Actuator every 10s
- ✅ **Pre-Configured Dashboards:** Grafana loads dashboards automatically on startup
- ✅ **Persistent Storage:** Prometheus data retained for 30 days
- ✅ **Health Checks:** All services include health checks with retries
- ✅ **Banking-Grade SLO Tracking:** P99 latency monitoring for <300ms target

**Accessing Services:**
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Spring Boot Actuator**: http://localhost:8080/actuator
- **Prometheus Metrics Endpoint**: http://localhost:8080/actuator/prometheus

**Documentation:**
- **[Observability Architecture](docs/architecture/07-observability-security.md)** - Metrics, logging, tracing strategy ✨

---

## 🎯 Domain Models (DDD)

### Pure Business Logic - Hexagonal Architecture

This project uses **Domain-Driven Design (DDD)** with strict hexagonal architecture.

**Domain Layer Structure:**

```
src/main/java/com/bank/signature/domain/
├── model/
│   ├── aggregate/
│   │   └── SignatureRequest.java         # Aggregate root
│   ├── entity/
│   │   └── SignatureChallenge.java      # Entity
│   └── valueobject/
│       ├── Money.java                    # Value Object (record)
│       ├── TransactionContext.java       # Value Object (record)
│       ├── ProviderResult.java           # Value Object (record)
│       ├── RoutingEvent.java             # Value Object (record)
│       ├── UUIDGenerator.java            # Utility
│       ├── SignatureStatus.java          # Enum
│       ├── ChallengeStatus.java          # Enum
│       ├── ChannelType.java              # Enum
│       └── ProviderType.java             # Enum
└── exception/
    ├── DomainException.java              # Base exception
    ├── FallbackExhaustedException.java
    ├── InvalidStateTransitionException.java
    └── ChallengeAlreadyActiveException.java
```

**Key Features:**
- ✅ **Domain Purity:** No dependencies on Spring/JPA/Jackson/Kafka (validated by ArchUnit)
- ✅ **Java 21 Records:** Immutable Value Objects with compact constructor validation
- ✅ **Lombok @Builder:** Fluent API for Aggregate/Entity construction
- ✅ **Business Rules:** Only 1 challenge PENDING at a time, explicit state transitions
- ✅ **UUIDv7:** Time-sortable UUIDs for better PostgreSQL B-tree performance

**Usage Example:**

```java
// Create signature request with builder pattern
SignatureRequest request = SignatureRequest.builder()
    .id(UUIDGenerator.generateV7())
    .customerId("pseudonymized-cust-123")
    .transactionContext(new TransactionContext(
        new Money(new BigDecimal("100.00"), "EUR"),
        "merchant-789",
        "order-456",
        "Payment for Order #456",
        "sha256-hash-xyz"
    ))
    .status(SignatureStatus.PENDING)
    .challenges(new ArrayList<>())
    .routingTimeline(new ArrayList<>())
    .createdAt(Instant.now())
    .expiresAt(Instant.now().plus(Duration.ofMinutes(15)))
    .build();

// Create challenge (business method validates 1 active max)
SignatureChallenge challenge = request.createChallenge(ChannelType.SMS, ProviderType.TWILIO);

// Complete challenge (entity lifecycle method)
challenge.complete(new ProviderResult("proof-jwt-123", Instant.now(), Map.of()));

// Complete signature (aggregate business method)
request.completeSignature(challenge);
// Status: SIGNED, signedAt: 2025-11-26T23:45:00Z
```

---

## 📚 Project Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[Architecture](docs/architecture/README.md)** - System design, C4 diagrams, database schema
- **[PRD](docs/prd.md)** - Product Requirements (90 FRs, 47 NFRs)
- **[Epics & Stories](docs/epics.md)** - User stories and acceptance criteria
- **[Tech Spec](docs/sprint-artifacts/tech-spec-epic-1.md)** - Technical specifications
- **[Database Migrations](docs/development/database-migrations.md)** - LiquidBase workflow
- **[Kafka Messaging](docs/development/kafka-messaging.md)** - Event streaming, schema evolution
- **[Vault Secrets](docs/development/vault-secrets.md)** - Secret management, rotation strategy ✨ NEW

## 🗂️ Project Structure

```
signature-router/
├── .mvn/                      # Maven Wrapper
├── docs/                      # Documentation
│   ├── architecture/          # Architecture documentation
│   ├── sprint-artifacts/      # Sprint planning artifacts
│   ├── prd.md                 # Product Requirements Document
│   └── epics.md               # User stories
├── src/
│   ├── main/
│   │   ├── java/              # Application source code
│   │   └── resources/         # Configuration files
│   └── test/                  # Test source code
├── docker-compose.yml         # Local development infrastructure
├── pom.xml                    # Maven build configuration
├── README.md                  # This file
└── CHANGELOG.md               # Version history
```

## 🔧 Development

### Local Development Profile

The application uses the `local` profile by default, which enables:
- SQL logging with formatting
- DEBUG log level for application code
- All actuator endpoints exposed

### Configuration Files

- `application.yml` - Base configuration
- `application-local.yml` - Local development overrides
- `application-test.yml` - Test profile configuration

### Code Quality

The project enforces architectural constraints using **ArchUnit**:

- Domain layer has zero framework dependencies ✅
- Application layer doesn't depend on infrastructure adapters ✅
- Unidirectional dependency flow: Infrastructure → Application → Domain ✅

## 📈 Roadmap

> **🔄 MuleSoft Integration:** Migration to MuleSoft API Gateway planned after current provider implementation is validated. Zero-downtime migration with plug-and-play adapter replacement. See [Migration Strategy](docs/architecture/08-mulesoft-integration-strategy.md).

### ✅ Fase 1: Foundation (Current)
- [x] Story 1.1: Project structure with hexagonal architecture ✅
- [x] Story 1.2: PostgreSQL + LiquidBase migrations ✅
- [x] Story 1.3: Kafka infrastructure + Schema Registry ✅
- [x] Story 1.4: HashiCorp Vault integration ✅
- [x] Story 1.5: Domain models (Aggregates, Entities, Value Objects) ✅
- [x] Story 1.6: JPA entities & repository adapters ✅
- [x] Story 1.7: REST API foundation + Security (OAuth2 JWT) ✅
- [x] Story 1.8: Local development environment (Docker Compose + Observability) ✅

### 🚧 Fase 2: Core Features
- [ ] Signature request orchestration
- [ ] Routing rules engine (SpEL)
- [ ] SMS provider integration (Twilio)

### 📅 Fase 3: Resilience & Scalability
- [ ] Multi-provider fallback chain
- [ ] Circuit Breaker (Resilience4j)
- [ ] Event-driven architecture (Kafka + Outbox)

### 🎯 Fase 4: Admin & Monitoring
- [ ] Admin Portal (React SPA)
- [ ] Routing timeline visualization
- [ ] Cost optimization dashboards

### 🔄 Fase 5: MuleSoft Migration (Future)
- [ ] **Phase 1:** MuleSoft API specification & contract definition
- [ ] **Phase 2:** MuleSoftApiProvider implementation (single REST adapter)
- [ ] **Phase 3:** Canary deployment (10% → 50% → 100% traffic)
- [ ] **Phase 4:** Decommission legacy providers (delete direct integrations)
- [ ] **Benefits:** Centralized gateway, simplified codebase, enterprise API governance

See [MuleSoft Integration Strategy](docs/architecture/08-mulesoft-integration-strategy.md) for detailed migration plan.

## 📝 Contributing

1. Follow hexagonal architecture principles
2. Ensure all tests pass (`./mvnw verify`)
3. Maintain test coverage (target: 75%+)
4. Document significant changes in CHANGELOG.md
5. Follow commit message conventions

## 📄 License

Copyright © 2025 Bank Signature System. All rights reserved.

## 🆘 Support

For questions or issues:
- Review documentation in [`docs/`](docs/)
- Check architecture decision records in [`docs/architecture/adr/`](docs/architecture/adr/)
- MuleSoft integration questions: See [ADR-003](docs/architecture/adr/ADR-003-mulesoft-integration.md)
- Contact the development team

---

**Current Version**: 0.1.0-SNAPSHOT  
**Last Updated**: 2025-11-28  
**Architecture**: Hexagonal (MuleSoft-ready via Adapter Pattern)

