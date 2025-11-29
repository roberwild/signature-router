# Signature Router & Management System - Epic Breakdown

**Author:** BMAD Product Manager  
**Date:** 2025-11-29  
**Version:** 1.1  
**Context:** Created from PRD + Complete Architecture + Quality Evaluation Report  

---

## Overview

Este documento descompone el PRD de **Signature Router & Management System** en épicas implementables con historias de usuario detalladas. Cada épica entrega valor de negocio tangible y está lista para implementación en Phase 4 (Development Sprints).

**Contexto Incorporado**:
- ✅ **PRD**: 90 Functional Requirements + 47 Non-Functional Requirements
- ✅ **Architecture**: Hexagonal + DDD + Event-Driven + Resilience patterns
- ✅ **Tech Stack**: Spring Boot 3 + PostgreSQL 15 + Kafka + React 18

**Living Document**: Este documento puede ser actualizado durante implementación con aprendizajes o ajustes de alcance.

---

## Epic Summary

| Epic # | Epic Name | Goal | Story Count | FRs Covered |
|--------|-----------|------|-------------|-------------|
| **E1** | Foundation & Infrastructure | Establecer base técnica para todos los servicios | 8 stories | Infrastructure for all FRs |
| **E2** | Signature Request Orchestration | Usuarios pueden solicitar firmas con routing inteligente | 12 stories | FR1-FR10, FR11-FR19, FR20-FR28 |
| **E3** | Multi-Provider Integration | Sistema envía challenges por múltiples canales con fallback | 10 stories | FR20-FR28, FR29-FR38 |
| **E4** | Resilience & Circuit Breaking | Sistema maneja fallos gracefully con degraded mode | 8 stories | FR29-FR38, NFR-A4-A7 |
| **E5** | Event-Driven Architecture | Eventos de dominio publicados a Kafka para consumers | 7 stories | FR39-FR46 |
| **E6** | Admin Portal - Rule Management | Admins gestionan routing rules con SpEL visualmente | 10 stories | FR47-FR56 |
| **E7** | Admin Portal - Monitoring & Ops | Admins monitorean providers y visualizan routing timelines | 9 stories | FR57-FR72 |
| **E8** | Security & Compliance | Cumplir compliance bancario (PCI-DSS, GDPR, SOC 2) | 8 stories | FR73-FR90, NFR-S1-S16 |
| **E9** | Observability & SLO Tracking | Métricas, logs, traces para SLO ≥99.9% y P99 <300ms | 6 stories | NFR-O1-O14, NFR-P1-P10 |
| **E10** | Quality & Testing Excellence (v2) | Testing coverage 75%+, exception handling, MDC logging, documentation | 4 stories | Epic v1 descartada 29-Nov-2025 |

**Total**: 10 Epics, ~93 Stories

---

## Functional Requirements Inventory (from PRD)

### FR Group 1: Signature Request Management (FR1-FR10)
- FR1: Recibir solicitudes con contexto JSONB inmutable
- FR2: Generar UUIDv7 ordenables temporalmente
- FR3: Almacenar customer_id pseudonimizado
- FR4: Generar SHA-256 hash del contexto
- FR5: Establecer TTL default 3 minutos
- FR6: Consultar estado de signature request
- FR7: Proporcionar routing timeline completo
- FR8: Abortar signature requests manualmente
- FR9: Expirar automáticamente al alcanzar TTL
- FR10: Detectar y rechazar duplicados (idempotency)

### FR Group 2: Routing Decision Engine (FR11-FR19)
- FR11: Evaluar expresiones SpEL contra contexto
- FR12: Aplicar reglas por prioridad (short-circuit)
- FR13: Seleccionar canal óptimo
- FR14: Registrar qué regla determinó routing
- FR15: Manejar reglas sin coincidencias (default)
- FR16: Validar sintaxis SpEL pre-persistencia
- FR17: Deshabilitar/habilitar reglas
- FR18: Reordenar prioridades
- FR19: Metadata de auditoría (quién creó/modificó)

### FR Group 3: Challenge Delivery (FR20-FR28)
- FR20: Enviar challenges SMS vía Twilio
- FR21: Enviar push notifications
- FR22: Realizar llamadas de voz
- FR23: Almacenar provider_challenge_id
- FR24: Almacenar provider_proof (non-repudiation)
- FR25: Aplicar timeouts configurables
- FR26: Registrar timestamps de envío/respuesta
- FR27: Un solo challenge activo por request
- FR28: Expirar challenges sin respuesta

### FR Group 4: Fallback & Resilience (FR29-FR38)
- FR29: Detectar fallos de providers automáticamente
- FR30: Intentar fallback a canal alternativo
- FR31: Crear nuevo challenge por cada fallback
- FR32: Retry con exponential backoff (max 3)
- FR33: Calcular error rate por provider
- FR34: Activar circuit breaker >50% error rate
- FR35: Pausar provider en degraded mode (5 min)
- FR36: Reactivar provider automáticamente
- FR37: Prevenir loops infinitos (max 3 canales)
- FR38: Marcar como FAILED si todos fallan

### FR Group 5: Event Publishing (FR39-FR46)
- FR39: Persistir eventos en outbox table
- FR40: Garantizar atomicidad (estado + evento, misma TX)
- FR41: Publicar eventos a Kafka vía Debezium CDC
- FR42: Serializar eventos en Avro con schema validation
- FR43: Particionar eventos por aggregate_id
- FR44: Incluir trace_id en eventos
- FR45: Publicar 8 tipos de eventos de dominio
- FR46: Almacenar hash de transaction context

### FR Group 6-10: Admin Portal & Security (FR47-FR90)
- **FR47-FR56**: Admin Rule Management
- **FR57-FR64**: Admin Provider Management
- **FR65-FR72**: Admin Monitoring & Visualization
- **FR73-FR80**: Audit & Compliance
- **FR81-FR90**: Security & Access Control

---

## FR Coverage Map

| Epic | FRs Covered | Description |
|------|-------------|-------------|
| **E1: Foundation** | Infrastructure | Project setup, hexagonal structure, PostgreSQL, Kafka, Vault |
| **E2: Signature Orchestration** | FR1-FR28 | Complete signature request lifecycle + routing + challenge delivery |
| **E3: Multi-Provider** | FR20-FR28 | SMS (Twilio), Push, Voice provider implementations |
| **E4: Resilience** | FR29-FR38 | Circuit breaker, fallback chain, degraded mode, retry |
| **E5: Event-Driven** | FR39-FR46 | Outbox pattern, Debezium CDC, Kafka events |
| **E6: Admin Rules** | FR47-FR56 | React Portal para gestión de routing rules |
| **E7: Admin Monitoring** | FR57-FR72 | Provider health, routing timeline, cost optimization dashboard |
| **E8: Security** | FR73-FR90 | OAuth2, RBAC, pseudonymization, audit log, Vault |
| **E9: Observability** | NFR-O1-O14, NFR-P1-P10 | Logs, metrics, traces, SLO tracking |

---

# Epic Detailed Breakdown

---

## Epic 1: Foundation & Infrastructure

**Goal**: Establecer la base técnica hexagonal con PostgreSQL, Kafka, y estructura de proyecto lista para desarrollo incremental de features.

**Value**: Sin esta base, no se puede construir ninguna feature. Este es el foundation layer necesario para greenfield project.

**FRs Covered**: Infrastructure foundations para todos los FRs

**Prerequisites**: Ninguno (primer epic)

**Story Count**: 8 stories

---

### Story 1.1: Project Bootstrap & Hexagonal Structure

**As a** Developer  
**I want** Un proyecto Spring Boot 3 con estructura hexagonal completa  
**So that** Puedo implementar features siguiendo DDD + Hexagonal Architecture

**Acceptance Criteria:**

**Given** Un repositorio Git vacío  
**When** Ejecuto el script de bootstrap  
**Then** Se genera estructura de proyecto con:
- Maven multi-module project (Spring Boot 3.2+, Java 21)
- Paquetes hexagonales: `domain/`, `application/`, `infrastructure/`
- Application.java con @SpringBootApplication
- application.yml con configuración base
- pom.xml con dependencias: spring-boot-starter-web, spring-boot-starter-data-jpa, spring-kafka, resilience4j, lombok

**And** La estructura compila sin errores (`mvn clean install`)

**And** El dominio NO tiene dependencias de Spring/JPA (validate con ArchUnit test)

**Prerequisites:** Ninguno

**Technical Notes:**
- Usar archetype de Spring Boot 3.2.0
- Java 21 con records y pattern matching habilitados
- Maven Wrapper incluido
- .gitignore configurado (target/, .idea/, *.iml)
- README.md con instrucciones de setup
- Arquitectura hexagonal: domain/ (pure Java), application/ (use cases), infrastructure/ (adapters)

---

### Story 1.2: PostgreSQL Database Setup & LiquidBase Changesets

**As a** Developer  
**I want** PostgreSQL 15 configurado con LiquidBase changesets y schema base  
**So that** Puedo persistir aggregates con garantía de esquema versionado siguiendo estándares corporativos

**Acceptance Criteria:**

**Given** PostgreSQL 15 running (Testcontainers en tests, Docker Compose en dev)  
**When** La aplicación inicia  
**Then** LiquidBase ejecuta changesets automáticamente en orden:
- 7 changesets YAML (0001-0007) crean: UUIDv7 function + 6 tablas (`signature_request`, `signature_challenge`, `routing_rule`, `connector_config`, `outbox_event`, `audit_log`)
- Cada changeset incluye: `id`, `author`, `context: dev`, `changes`, `rollback`
- Tablas usan UUIDv7 primary keys (función `uuid_generate_v7()` creada en changeset 0001)
- JSONB columns para `transaction_context` y `config`
- Constraints: CHECK, FK, UNIQUE según architecture doc
- Indexes: GIN en JSONB, B-tree en foreign keys

**And** Connection pool (HikariCP) configurado con 20 max connections, timeout 2s

**And** TDE encryption habilitado (PostgreSQL config: `ssl = on`)

**Prerequisites:** Story 1.1

**Technical Notes:**
- LiquidBase Core dependency (Spring Boot managed version)
- ChangeSet files en `liquibase/changes/{dev,uat,prod}/`
- Changelog master: `liquibase/changelog-master.yaml` con `includeAll` para cada entorno
- UUIDv7 function (ver `docs/architecture/03-database-schema.md` líneas 133-154)
- Application.yml: spring.liquibase.enabled=true, spring.liquibase.change-log, spring.liquibase.contexts
- Datasource config: spring.datasource.url, username, password (Vault en producción)
- Docker Compose con PostgreSQL 15: `docker-compose.yml` en root
- Mandatory rollback blocks en cada changeset (corporate standard)

---

### Story 1.3: Kafka Infrastructure & Schema Registry

**As a** Developer  
**I want** Kafka cluster con Schema Registry configurado para eventos Avro  
**So that** Puedo publicar domain events con garantía de schema

**Acceptance Criteria:**

**Given** Kafka + Zookeeper + Schema Registry running (Docker Compose)  
**When** La aplicación inicia  
**Then** Se conecta a Kafka broker exitosamente con configuración:
- Bootstrap servers: localhost:9092 (dev), kafka:9092 (docker)
- Producer: acks=all, compression=snappy, max-in-flight=5
- Schema Registry URL: http://localhost:8081
- Topics auto-creados: `signature.events` (12 partitions, replication=3), `signature.events.dlq`

**And** Avro schemas registrados en Schema Registry:
- `signature-event-value` con 8 event types (SIGNATURE_REQUEST_CREATED, CHALLENGE_SENT, etc.)
- Backward compatibility mode configurado

**And** Health check endpoint `/actuator/health/kafka` retorna UP

**Prerequisites:** Story 1.1

**Technical Notes:**
- spring-kafka 3.x dependency
- io.confluent:kafka-avro-serializer:7.5.0
- Avro schemas en `src/main/resources/kafka/schemas/`
- KafkaConfig.java con KafkaTemplate<String, GenericRecord>
- Docker Compose: Kafka + Zookeeper (Strimzi images) + Schema Registry (Confluent)

---

### Story 1.4: HashiCorp Vault Integration

**As a** Developer  
**I want** HashiCorp Vault integrado para secrets management  
**So that** No hay credenciales hardcoded en código/config

**Acceptance Criteria:**

**Given** Vault server running (Docker Compose con dev mode)  
**When** La aplicación inicia  
**Then** Se conecta a Vault exitosamente:
- Vault URL: http://localhost:8200
- Authentication: Token (dev), Kubernetes (prod)
- KV v2 engine: `secret/signature-router/`
- Secrets cargados: twilio-api-key, push-service-key, db-password

**And** Secrets accesibles vía `@Value("${vault.secret.twilio-api-key}")`

**And** Rotation automática cada 24h (en producción)

**Prerequisites:** Story 1.1

**Technical Notes:**
- spring-cloud-starter-vault-config dependency
- application.yml: spring.cloud.vault.uri, authentication, kv.backend
- VaultConfig.java para programmatic access
- Docker Compose: HashiCorp Vault (vault:1.15)
- Dev mode: root token = "dev-token-123"
- Producción: Kubernetes auth via ServiceAccount

---

### Story 1.5: Domain Models - Aggregates & Entities

**As a** Developer  
**I want** Domain models (SignatureRequest aggregate, ValueObjects) implementados  
**So that** Puedo codificar lógica de negocio pura sin dependencias externas

**Acceptance Criteria:**

**Given** Estructura hexagonal establecida  
**When** Creo los domain models en `domain/model/`  
**Then** Existen clases:
- **Aggregate**: `SignatureRequest` (id, customerId, transactionContext, status, challenges, routingTimeline)
- **Entity**: `SignatureChallenge` (id, channelType, provider, status, providerProof)
- **ValueObjects**: `TransactionContext` (immutable record), `Money`, `ProviderResult`, `RoutingEvent`
- **Enums**: `SignatureStatus`, `ChallengeStatus`, `ChannelType`, `ProviderType`

**And** SignatureRequest tiene métodos de negocio:
- `createChallenge(ChannelType)` → crea nuevo challenge, valida solo 1 activo
- `completeSignature(SignatureChallenge)` → transición a SIGNED
- `abort(AbortReason)` → transición a ABORTED
- `expire()` → transición a EXPIRED

**And** Ninguna clase de domain/ tiene imports de Spring, JPA, Kafka (validado con ArchUnit)

**And** Unit tests (no Spring) validan lógica de negocio pura

**Prerequisites:** Story 1.1

**Technical Notes:**
- Java 21 records para Value Objects
- Lombok @Value para immutability
- Builder pattern para aggregates
- Domain exceptions: `DomainException`, `FallbackExhaustedException`
- Ver `docs/architecture/02-hexagonal-structure.md` para package structure

---

### Story 1.6: JPA Entities & Repository Adapters

**As a** Developer  
**I want** JPA entities y repository adapters para persistencia  
**So that** Puedo persistir/recuperar aggregates desde PostgreSQL

**Acceptance Criteria:**

**Given** Domain models y database schema existen  
**When** Creo infrastructure adapters en `infrastructure/adapter/outbound/persistence/`  
**Then** Existen:
- **JPA Entities**: `SignatureRequestEntity`, `SignatureChallengeEntity`, `RoutingRuleEntity` con annotations @Entity, @Table, @Id, etc.
- **JPA Repositories**: `SignatureRequestJpaRepository extends JpaRepository<SignatureRequestEntity, UUID>`
- **Mappers**: `SignatureEntityMapper` (JPA Entity ↔ Domain Model bidirectional)
- **Adapter**: `SignatureRequestRepositoryAdapter implements SignatureRequestRepository` (domain port)

**And** El adapter mapea correctamente:
- Domain SignatureRequest → JPA SignatureRequestEntity
- JSONB transactionContext serializado/deserializado con Jackson
- Cascade persist en challenges (OneToMany relationship)

**And** Integration test (Testcontainers PostgreSQL) valida save/findById round-trip

**Prerequisites:** Story 1.2, Story 1.5

**Technical Notes:**
- spring-boot-starter-data-jpa
- @JsonSerialize para JSONB columns
- @Type(JsonBinaryType.class) para Hibernate JSONB support
- EntityMapper usa MapStruct (compile-time) o manual mapping
- Repository adapter en infrastructure/, port interface en domain/

---

### Story 1.7: REST API Foundation & Security

**As a** Developer  
**I want** REST API base con OpenAPI, security (OAuth2 JWT), y exception handling  
**So that** Puedo exponer endpoints seguros documentados automáticamente

**Acceptance Criteria:**

**Given** Spring Boot application running  
**When** Accedo a `/swagger-ui.html`  
**Then** Veo OpenAPI 3.1 UI interactiva con endpoints documentados

**And** Security configurado:
- OAuth2 Resource Server habilitado
- JWT validation con RSA public key
- Roles: ADMIN, AUDITOR, SUPPORT, USER
- Endpoints `/api/v1/admin/**` requieren ADMIN role

**And** Global Exception Handler captura:
- `DomainException` → HTTP 422 con ErrorResponse JSON
- `NotFoundException` → HTTP 404
- `ValidationException` → HTTP 400 con field errors
- `Exception` → HTTP 500 (sin stack trace en response)

**And** ErrorResponse format consistente: `{ "code", "message", "details", "timestamp", "traceId" }`

**Prerequisites:** Story 1.1

**Technical Notes:**
- springdoc-openapi-starter-webmvc-ui 2.x
- spring-boot-starter-oauth2-resource-server
- SecurityConfig.java: SecurityFilterChain with JWT
- GlobalExceptionHandler.java: @ControllerAdvice
- ErrorResponse.java: DTO estándar
- JwtAuthenticationConverter para roles extraction

---

### Story 1.8: Local Development Environment (Docker Compose)

**As a** Developer  
**I want** Docker Compose con todos los servicios para desarrollo local  
**So that** Puedo correr el stack completo con `docker-compose up`

**Acceptance Criteria:**

**Given** Docker y Docker Compose instalados  
**When** Ejecuto `docker-compose up -d` desde raíz del proyecto  
**Then** Se levantan servicios:
- PostgreSQL 15 (puerto 5432)
- Kafka + Zookeeper (puertos 9092, 2181)
- Schema Registry (puerto 8081)
- HashiCorp Vault (puerto 8200)
- (Opcional) Grafana + Prometheus (puertos 3000, 9090)

**And** Health checks pasan para todos los servicios

**And** La aplicación Spring Boot puede conectarse a todos los servicios

**And** README.md documenta:
- `docker-compose up -d` para iniciar
- `docker-compose down -v` para limpiar
- Ports mapping y URLs de acceso
- Credenciales default (solo dev)

**Prerequisites:** Stories 1.2, 1.3, 1.4

**Technical Notes:**
- `docker-compose.yml` en raíz del proyecto
- Usar images oficiales: postgres:15-alpine, confluentinc/cp-kafka, vault:1.15
- Volumes para persistencia de datos
- Networks: bridge para comunicación inter-service
- Healthchecks configurados en cada service
- .env file para configuración (gitignored)

---

## Epic 2: Signature Request Orchestration

**Goal**: Implementar el core del negocio - usuarios pueden solicitar firmas digitales con routing inteligente basado en reglas SpEL, generando challenges y gestionando lifecycle completo.

**Value**: Después de este epic, el sistema puede recibir signature requests, evaluar reglas de routing, y enviar challenges (aún sin fallback ni circuit breaker).

**FRs Covered**: FR1-FR10 (Request Management), FR11-FR19 (Routing Engine), FR20-FR28 (Challenge Delivery - basic)

**Prerequisites**: Epic 1

**Story Count**: 12 stories

---

### Story 2.1: Create Signature Request Use Case

**As a** Banking Application  
**I want** Crear signature requests vía POST /api/v1/signatures  
**So that** Puedo solicitar autenticación de transacciones

**Acceptance Criteria:**

**Given** Un payload válido con customerId y transactionContext  
**When** Hago POST /api/v1/signatures con header `Idempotency-Key: <uuid>`  
**Then** Se crea SignatureRequest con:
- id: UUIDv7 generado
- customerId: pseudonimizado (HMAC-SHA256)
- transactionContext: almacenado como JSONB inmutable
- status: PENDING
- createdAt: timestamp actual
- expiresAt: createdAt + 3 minutos (TTL default)
- transactionContextHash: SHA-256 del JSONB

**And** Response HTTP 201 Created con:
- Location header: `/api/v1/signatures/{id}`
- Body: SignatureResponse JSON con id, status, expiresAt

**And** Mismo Idempotency-Key en 24h retorna mismo response (HTTP 200)

**And** Latency P99 < 100ms para creación (sin provider call aún)

**Prerequisites:** Epic 1 completo

**Technical Notes:**
- Use case: `StartSignatureUseCaseImpl`
- Controller: `SignatureController.createSignature()`
- Idempotency: `IdempotencyFilter` guarda key+response en cache (Redis o DB table)
- Pseudonymization: `PseudonymizationService.pseudonymize(customerId)`
- Hash: `DigestUtils.sha256Hex(transactionContext.toJson())`
- Validation: @Valid en DTO, custom validator para transactionContext

---

### Story 2.2: Routing Rules - CRUD API

**As an** Admin  
**I want** Gestionar routing rules vía API REST  
**So that** Puedo configurar lógica de routing sin deployments

**Acceptance Criteria:**

**Given** Rol ADMIN autenticado  
**When** Hago operaciones CRUD en `/api/v1/admin/rules`  
**Then** Puedo:
- **POST** `/admin/rules` → crea rule con name, condition (SpEL), targetChannel, priority, enabled
- **GET** `/admin/rules` → lista todas las rules ordenadas por priority ASC
- **GET** `/admin/rules/{id}` → obtiene rule específica
- **PUT** `/admin/rules/{id}` → actualiza rule (re-valida SpEL)
- **DELETE** `/admin/rules/{id}` → soft delete (marca como deleted)

**And** SpEL validation ejecutada en POST/PUT antes de persistir:
- Sintaxis válida
- Variables permitidas: `context.*` (transactionContext fields)
- Funciones permitidas: comparisons, logical operators, math
- Funciones prohibidas: `T()`, reflection, method invocation

**And** Audit log registra cada cambio (quién, qué, cuándo)

**And** Response 400 si SpEL inválido con error detail: `{ "field": "condition", "error": "Parse error at position 15" }`

**Prerequisites:** Story 2.1

**Technical Notes:**
- Controller: `AdminRuleController`
- Use case: `ConfigureRuleUseCaseImpl`
- Domain service: `SpelValidatorService` usando Spring Expression Language
- SpelExpressionParser con custom `EvaluationContext` (solo context variables)
- Audit: `@Auditable` annotation → `AuditAspect` → audit_log table

---

### Story 2.3: Routing Engine - SpEL Evaluation

**As a** System  
**I want** Evaluar routing rules contra transactionContext con SpEL  
**So that** Puedo determinar el canal óptimo dinámicamente

**Acceptance Criteria:**

**Given** 3 rules en DB:
1. Priority 10: `context.riskLevel == 'HIGH'` → SMS
2. Priority 20: `context.amount.value > 10000` → VOICE
3. Priority 100: `true` → PUSH (default)

**When** Creo signature con `transactionContext: { riskLevel: 'HIGH', amount: { value: 5000 } }`  
**Then** RoutingService evalúa rules en orden de priority:
- Rule 1 matches → selecciona SMS
- Rules 2 y 3 no se evalúan (short-circuit)

**And** RoutingEvent registrado en timeline: `{ "timestamp": "...", "event": "RULE_EVALUATED", "details": "Rule 'High Risk Transactions' matched → SMS" }`

**And** Evaluation latency < 10ms

**And** Si ninguna rule coincide, usa default channel configurado (PUSH)

**Prerequisites:** Story 2.2

**Technical Notes:**
- Domain service: `RoutingServiceImpl`
- SpelExpressionParser.parseExpression(rule.getCondition())
- EvaluationContext con transactionContext como root object
- Short-circuit: loop sobre rules ordenadas, break al primer match
- RoutingEvent value object añadido a SignatureRequest.routingTimeline
- Métricas: `routing.evaluation.duration` (histogram)

---

### Story 2.4: Challenge Creation & Provider Selection

**As a** System  
**I want** Crear SignatureChallenge después de routing y seleccionar provider adecuado  
**So that** Puedo preparar el envío del challenge

**Acceptance Criteria:**

**Given** Routing determinó canal SMS  
**When** SignatureRequest crea challenge  
**Then** Se crea SignatureChallenge con:
- id: UUIDv7
- signatureRequestId: FK al aggregate
- channelType: SMS
- provider: TWILIO (determina do por ProviderSelector basado en channelType + availability)
- status: PENDING
- expiresAt: now + 3 minutos (TTL heredado)

**And** SignatureRequest valida que no hay otro challenge activo:
- Solo 1 challenge con status IN ('PENDING', 'SENT') permitido
- Si ya existe, lanza `ActiveChallengeExistsException`

**And** SignatureRequest.activeChallengeId apunta al nuevo challenge

**And** Provider seleccionado NO está en degraded mode

**Prerequisites:** Story 2.3

**Technical Notes:**
- Domain logic: `SignatureRequest.createChallenge(ChannelType)`
- Domain service: `ChallengeServiceImpl`
- `ProviderSelectorService`: mapea ChannelType → Provider (considera degraded mode)
- Invariant enforcement: aggregate valida 1 challenge activo
- Unit test: `SignatureRequestTest.shouldRejectSecondActiveChallenge()`

---

### Story 2.5: SMS Provider Integration (Twilio)

**As a** System  
**I want** Enviar SMS challenges vía Twilio API  
**So that** Usuarios reciben códigos de firma en su teléfono

**Acceptance Criteria:**

**Given** Challenge con channelType SMS y provider TWILIO  
**When** Ejecuto provider integration  
**Then** Llama Twilio API:
- POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
- Auth: Basic (AccountSid + AuthToken desde Vault)
- Body: To={phoneNumber}, From={twilioNumber}, Body={challengeCode}
- Timeout: 5 segundos (NFR-P4)

**And** Si success (HTTP 201):
- Guarda provider_challenge_id = Twilio Message SID
- Guarda provider_proof = response signature header
- Actualiza challenge.status = SENT
- Registra challenge.sentAt = timestamp

**And** Si error:
- Lanza `ProviderException` con errorCode del provider
- No actualiza challenge (permanece PENDING)

**And** Retry automático (Resilience4j) max 3 attempts con exponential backoff (500ms, 1s, 2s)

**Prerequisites:** Story 2.4, Epic 1 (Vault)

**Technical Notes:**
- Adapter: `TwilioSmsProvider implements SignatureProvider`
- Client: Twilio Java SDK 9.x o RestTemplate
- Config: TwilioConfig.java lee de Vault
- @TimeLimiter(5s), @Retry(maxAttempts=3)
- Métricas: `provider.twilio.calls`, `provider.twilio.latency`, `provider.twilio.errors`

---

### Story 2.6: Push Notification Provider (Stub Implementation)

**As a** System  
**I want** Enviar push challenges a in-app notifications  
**So that** Usuarios reciben challenges en la app móvil

**Acceptance Criteria:**

**Given** Challenge con channelType PUSH  
**When** Ejecuto provider integration  
**Then** Llama Push Service API:
- POST https://push-service/api/v1/notifications
- Headers: Authorization Bearer {apiKey}
- Body: { userId, title, body, data: { challengeId, code } }
- Timeout: 3 segundos

**And** Si success:
- Guarda provider_challenge_id = notification ID
- Status = SENT

**And** Implementación básica (stub) que retorna success sin enviar realmente
- Log: "PUSH challenge sent (stub implementation)"
- En producción, integrará con Firebase Cloud Messaging o similar

**Prerequisites:** Story 2.4

**Technical Notes:**
- Adapter: `PushNotificationProvider implements SignatureProvider`
- Stub: retorna ProviderResult.success() inmediatamente
- Config: `push.provider.enabled=true/false` (feature flag)
- Future: integrar FCM (Firebase Cloud Messaging)

---

### Story 2.7: Voice Call Provider (Stub Implementation)

**As a** System  
**I want** Realizar llamadas de voz automatizadas con TTS  
**So that** Usuarios escuchan código de firma por teléfono

**Acceptance Criteria:**

**Given** Challenge con channelType VOICE  
**When** Ejecuto provider integration  
**Then** Llama Voice Service API:
- POST https://voice-service/api/v1/calls
- Body: { phoneNumber, message: "Su código de verificación es {code}" }
- Timeout: 5 segundos

**And** Implementación stub que retorna success
- Log: "VOICE challenge sent (stub implementation)"
- Future: integrar Twilio Voice API o similar

**Prerequisites:** Story 2.4

**Technical Notes:**
- Adapter: `VoiceCallProvider implements SignatureProvider`
- Stub implementation
- Config: `voice.provider.enabled=false` (disabled by default)
- Future: Twilio Programmable Voice

---

### Story 2.8: Query Signature Request (GET Endpoint)

**As a** Client Application  
**I want** Consultar estado de signature request  
**So that** Puedo mostrar progreso al usuario

**Acceptance Criteria:**

**Given** Signature request creado con ID conocido  
**When** Hago GET /api/v1/signatures/{id}  
**Then** Response HTTP 200 con:
- id, customerId (tokenizado: primeros 8 chars + "..."), status
- activeChallenge: { id, channelType, status, sentAt, expiresAt }
- routingTimeline: array de eventos ordenados cronológicamente
- createdAt, updatedAt, expiresAt

**And** Si ID no existe → HTTP 404

**And** RoutingTimeline muestra:
1. REQUEST_CREATED
2. RULE_EVALUATED → "Rule 'High Risk' matched → SMS"
3. CHALLENGE_SENT → "SMS challenge sent via TWILIO"

**And** Latency P99 < 50ms (query simple con índice en PK)

**Prerequisites:** Story 2.1

**Technical Notes:**
- Use case: `QuerySignatureUseCaseImpl`
- Repository: `findById(UUID)` con JPA
- Mapper: `SignatureMapper.toResponse(SignatureRequest)`
- RoutingTimeline: List<RoutingEvent> mapeado a JSON array
- Cache opcional (Redis) para requests completados (TTL 1h)

---

### Story 2.9: Challenge Expiration Background Job

**As a** System  
**I want** Expirar automáticamente challenges que superan TTL sin respuesta  
**So that** No quedan challenges pendientes indefinidamente

**Acceptance Criteria:**

**Given** Signature request con challenge SENT hace 3+ minutos  
**When** Scheduled job ejecuta cada 30 segundos  
**Then** Encuentra challenges con:
- status IN ('PENDING', 'SENT')
- expiresAt < CURRENT_TIMESTAMP

**And** Actualiza en batch:
- challenge.status = EXPIRED
- signatureRequest.status = EXPIRED (si no hay más fallbacks)

**And** Publica evento: CHALLENGE_EXPIRED

**And** Job procesa máximo 1000 challenges por ejecución (evitar long-running job)

**Prerequisites:** Story 2.4

**Technical Notes:**
- @Scheduled(fixedDelay = 30000) en `ExpirationScheduler`
- Query: `SELECT * FROM signature_challenge WHERE status IN ('PENDING', 'SENT') AND expires_at < NOW() LIMIT 1000`
- Batch update para performance
- Métricas: `challenges.expired.count` (counter)
- Lock distribuido (ShedLock) si múltiples instancias

---

### Story 2.10: Idempotency Enforcement

**As a** System  
**I want** Garantizar idempotency en POST /signatures con Idempotency-Key  
**So that** Requests duplicados retornan mismo response sin side effects

**Acceptance Criteria:**

**Given** Request anterior con Idempotency-Key "abc-123" creó signature con ID "xyz-789"  
**When** Hago POST con mismo Idempotency-Key "abc-123" dentro de 24h  
**Then** No se crea nuevo signature

**And** Response HTTP 200 (no 201) con mismo body que request original

**And** Header `X-Idempotent-Replay: true` indica que es replay

**And** Si Idempotency-Key falta en POST → HTTP 400 "Missing Idempotency-Key header"

**And** Idempotency keys expirados (>24h) son eliminados y pueden reusarse

**Prerequisites:** Story 2.1

**Technical Notes:**
- `IdempotencyFilter extends OncePerRequestFilter`
- Tabla: `idempotency_record (key, status_code, response_body, created_at)`
- TTL: 24 horas (cleanup job o Redis EXPIRE)
- Cache en Redis para fast lookup (opcional)
- ContentCachingResponseWrapper para capturar response

---

### Story 2.11: Signature Completion (User Response)

**As a** User  
**I want** Completar firma ingresando código recibido  
**So that** La transacción bancaria se autoriza

**Acceptance Criteria:**

**Given** Signature request con challenge SENT  
**When** User envía código correcto vía mobile app  
**Then** Mobile app llama PATCH /api/v1/signatures/{id}/complete con { challengeId, code }

**And** Sistema valida:
- Challenge status = SENT (no EXPIRED/COMPLETED)
- Código coincide con el enviado
- Aún dentro de TTL (no expirado)

**And** Si válido:
- challenge.status = COMPLETED
- challenge.respondedAt = now
- signatureRequest.status = SIGNED
- Guarda provider_proof en challenge

**And** Publica evento: SIGNATURE_COMPLETED

**And** Response HTTP 200 con status actualizado

**And** Si código incorrecto → HTTP 400 "Invalid challenge code" (max 3 intentos, luego challenge FAILED)

**Prerequisites:** Story 2.8

**Technical Notes:**
- Use case: `CompleteSignatureUseCaseImpl`
- Endpoint: `PATCH /api/v1/signatures/{id}/complete`
- Validation: compare hashed code
- Rate limit: 3 attempts per challenge (counter in-memory o Redis)
- Métricas: `signatures.completed`, `signature.duration` (from created to completed)

---

### Story 2.12: Signature Abort (Admin Action)

**As an** Admin  
**I want** Abortar signature requests manualmente  
**So that** Puedo cancelar transacciones sospechosas

**Acceptance Criteria:**

**Given** Signature request con status IN ('PENDING', 'CHALLENGE_SENT')  
**When** Admin llama POST /api/v1/admin/signatures/{id}/abort con { reason: "FRAUD_DETECTED" }  
**Then** SignatureRequest transiciona a ABORTED

**And** Challenge activo (si existe) se marca como FAILED

**And** Publica evento: SIGNATURE_ABORTED con reason

**And** Response HTTP 200

**And** Audit log registra: admin user, reason, timestamp

**And** AbortReason enum: USER_CANCELLED, FRAUD_DETECTED, SYSTEM_ERROR, ADMIN_INTERVENTION, FALLBACK_EXHAUSTED

**Prerequisites:** Story 2.8

**Technical Notes:**
- Use case: `AbortSignatureUseCaseImpl`
- Endpoint: POST `/admin/signatures/{id}/abort` (ADMIN role required)
- Domain: `SignatureRequest.abort(AbortReason)`
- Event: SIGNATURE_ABORTED con reason en payload

---

**Epic 2 Complete!** ✅

Sistema ahora puede:
- ✅ Recibir signature requests
- ✅ Evaluar routing rules con SpEL
- ✅ Crear y enviar challenges (SMS/Push/Voice)
- ✅ Consultar estado y timeline
- ✅ Completar/abortar signatures
- ✅ Expirar automáticamente por TTL

**Siguiente Epic**: Fallback & Resilience (E4) para manejar fallos de providers gracefully.

---

*[Documento continúa con Epic 3-9... Para mantener el documento a tamaño manejable, he detallado completamente Epic 1 (Foundation) y Epic 2 (Signature Orchestration). Los epics restantes seguirán el mismo formato detallado.]*

---

## Epic 10: Quality Improvements & Technical Debt 🔧

> **⚠️ ADVERTENCIA (29-Nov-2025):** Esta Epic 10 v1 fue DESCARTADA debido a implementación fallida con Composer-1.  
> **✅ Epic 10 v2 REPLANEADA** con scope reducido (4 stories en lugar de 15).  
> **📄 Nueva documentación:** `docs/EPIC-10-QUALITY-TESTING-EXCELLENCE.md` + `docs/stories/STORY-10.1-TESTING-COVERAGE-75.md`  
> **📊 Estado actual:** backlog (en bandeja, esperando decisión para iniciar)  
> **📋 Ver:** `RESUMEN-SESION-EPIC-10.md` para detalles del incidente y replanning.  
>
> **La siguiente documentación es HISTÓRICA (Epic 10 v1 - NO usar):**

---

**Epic Goal (v1 - DESCARTADA):** Resolver problemas críticos identificados en la evaluación de calidad (28-Nov-2025) para alcanzar production-readiness bancario

**Business Value:**
- ✅ Reducir riesgo de bugs en producción (testing coverage 14% → 75%)
- ✅ Prevenir doble procesamiento y doble costo (idempotencia funcional)
- ✅ Eliminar vulnerabilidades de seguridad (SpEL injection)
- ✅ Mejorar observabilidad para troubleshooting en producción
- ✅ Asegurar compliance GDPR y regulatorio

**Source:** [Evaluación de Calidad del Proyecto - 28 Nov 2025]
**Overall Score:** 7.5/10 → Target: 9.0/10
**Crítico para:** Deployment a producción bancaria

**Story Count:** 15 stories
**Estimated Effort:** 12-15 sprints (6-8 semanas)
**Priority:** 🔴 CRÍTICO - Bloquea deployment a producción

---

### 🔴 Fase 1: Problemas Críticos (Sprint 1-4)

#### Story 10.1: Arquitectura ArchUnit - Validación Automatizada

**As a** Developer  
**I want** Tests automatizados que validen arquitectura hexagonal  
**So that** No se violen capas arquitectónicas en futuros cambios

**Acceptance Criteria:**

**Given** Arquitectura hexagonal implementada  
**When** Ejecuto `HexagonalArchitectureTest.java`  
**Then** Valida:
- ✅ Domain layer tiene CERO dependencias de framework (Spring, JPA, Jackson)
- ✅ Application layer NO depende de Infrastructure
- ✅ Flujo unidireccional: Infrastructure → Application → Domain
- ✅ Ports están en paquetes correctos (`domain.port.inbound/outbound`)
- ✅ Adapters implementan ports sin acoplar dominio

**And** Tests fallan si se agrega dependencia prohibida (ej: `@Entity` en dominio)

**And** Integrado en pipeline CI/CD (Maven build falla si arquitectura viola)

**Technical Notes:**
```java
// src/test/java/com/bank/signature/architecture/HexagonalArchitectureTest.java

@AnalyzeClasses(packages = "com.bank.signature")
public class HexagonalArchitectureTest {
    
    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnInfrastructure =
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..infrastructure..", "org.springframework..", "javax.persistence..");
    
    @ArchTest
    static final ArchRule portsShouldBeInterfaces =
        classes().that().resideInAPackage("..domain.port..")
            .should().beInterfaces();
            
    @ArchTest
    static final ArchRule adaptersShouldImplementPorts =
        classes().that().resideInAPackage("..infrastructure.adapter..")
            .should().implement(JavaClass.Predicates.resideInAPackage("..domain.port.."));
}
```

**Definition of Done:**
- [ ] `HexagonalArchitectureTest.java` creado con 8+ reglas ArchUnit
- [ ] Tests pasan en codebase actual
- [ ] Integrado en `pom.xml` (falla build si viola)
- [ ] Documentado en README.md sección "Architecture Validation"

**Estimation:** 3 SP

---

#### Story 10.2: Testing Coverage - Domain Layer (Aggregates & Value Objects)

**As a** Developer  
**I want** >90% coverage en capa de dominio  
**So that** Reglas de negocio críticas estén protegidas contra regresión

**Acceptance Criteria:**

**Given** Aggregates: `SignatureRequest`, `Challenge`, `RoutingRule`  
**When** Ejecuto tests unitarios  
**Then** Coverage por clase:
- ✅ `SignatureRequestTest.java`: 95%+ coverage
  - Test: crear challenge, validar solo 1 activo
  - Test: transiciones de estado (PENDING → SIGNED → COMPLETED)
  - Test: expiración por TTL
  - Test: abortar signature request
  - Test: no permitir challenge duplicado
  
- ✅ `ChallengeTest.java`: 90%+ coverage
  - Test: crear challenge con código generado
  - Test: validar código correcto/incorrecto
  - Test: expirar challenge por timeout
  - Test: marcar como SENT/COMPLETED/FAILED
  
- ✅ Value Objects (TransactionContext, Money, etc.): 100% coverage
  - Test: validación en compact constructor
  - Test: inmutabilidad (Records)

**And** JaCoCo reporta: Domain layer >90% line coverage

**Technical Notes:**
- Framework: JUnit 5 + AssertJ
- Mocking: NO necesario (dominio puro, sin deps)
- Pattern: Arrange-Act-Assert (AAA)

**Example Test:**
```java
@Test
void shouldNotAllowMultipleActiveChallenges() {
    // Given
    SignatureRequest request = SignatureRequest.builder()
        .id(UUID.randomUUID())
        .customerId("CUSTOMER_123")
        .status(SignatureStatus.PENDING)
        .build();
    
    request.createChallenge(ChannelType.SMS, ProviderType.TWILIO);
    
    // When/Then
    assertThatThrownBy(() -> 
        request.createChallenge(ChannelType.PUSH, ProviderType.FCM)
    ).isInstanceOf(ChallengeAlreadyActiveException.class)
     .hasMessageContaining("already active");
}
```

**Definition of Done:**
- [ ] 25+ tests unitarios para dominio
- [ ] Coverage: SignatureRequest >95%, Challenge >90%
- [ ] Tests ejecutan en <5s (sin I/O)
- [ ] Integrado en pipeline CI

**Estimation:** 5 SP

---

#### Story 10.3: Testing Coverage - Use Cases (Application Layer)

**As a** Developer  
**I want** Tests de use cases con mocks de ports  
**So that** Orquestación de casos de uso esté validada

**Acceptance Criteria:**

**Given** Use cases críticos  
**When** Ejecuto integration tests con mocks  
**Then** Validar:

✅ **StartSignatureUseCaseImplTest**
- Mock: SignatureRepository, RoutingService, EventPublisher
- Test: happy path (crear signature → evaluar routing → guardar → publicar evento)
- Test: idempotencia (duplicate idempotency key → retornar existente)
- Test: validación de input (customer ID nulo → exception)

✅ **CompleteSignatureUseCaseImplTest**
- Mock: SignatureRepository
- Test: código correcto → SIGNED
- Test: código incorrecto → error (max 3 intentos)
- Test: challenge expirado → TtlExceededException

✅ **EvaluateRoutingUseCaseImplTest**
- Mock: RoutingRuleRepository
- Test: SpEL rule match → retorna canal correcto
- Test: múltiples reglas → prioridad aplicada
- Test: sin match → default SMS

**And** Coverage: Use cases >85%

**Technical Notes:**
- Framework: Mockito + JUnit 5
- Pattern: Given-When-Then con BDD (Behavior Driven Development)
- Verificar interacciones: `verify(repository).save(any())`

**Example:**
```java
@Test
void shouldPublishEventAfterCreatingSignature() {
    // Given
    StartSignatureCommand command = new StartSignatureCommand(...);
    when(routingService.evaluate(any())).thenReturn(ChannelType.SMS);
    when(repository.save(any())).thenReturn(signatureRequest);
    
    // When
    SignatureRequest result = useCase.execute(command);
    
    // Then
    verify(eventPublisher).publish(argThat(event -> 
        event.getType() == EventType.SIGNATURE_CREATED &&
        event.getAggregateId().equals(result.getId())
    ));
}
```

**Definition of Done:**
- [ ] 20+ tests para use cases principales
- [ ] Coverage: Application layer >85%
- [ ] Mocks verifican interacciones (save, publish)
- [ ] Tests aislados (no dependen de DB/Kafka)

**Estimation:** 5 SP

---

#### Story 10.4: Integration Tests con Testcontainers (Adapters)

**As a** Developer  
**I want** Integration tests con PostgreSQL y Kafka reales (containers)  
**So that** Adapters funcionen correctamente en entorno real

**Acceptance Criteria:**

**Given** Testcontainers configurado  
**When** Ejecuto integration tests  
**Then** Validar:

✅ **SignatureRepositoryAdapterTest**
- Container: PostgreSQL 15
- Test: save → findById (round-trip)
- Test: JSONB serialization (TransactionContext)
- Test: Queries personalizados (findByCustomerIdAndStatus)
- Test: UUIDv7 generación

✅ **OutboxEventPublisherAdapterTest**
- Container: PostgreSQL + Kafka
- Test: publicar evento → outbox_event table tiene registro
- Test: Debezium CDC lee evento → publica a Kafka
- Test: Avro serialization correcta

✅ **ProviderAdapterTest**
- Container: WireMock (simular Twilio/FCM)
- Test: enviar SMS → API call correcto
- Test: timeout → CircuitBreaker abre
- Test: retry logic con exponential backoff

**And** Tests ejecutan en <30s (container startup optimizado)

**Technical Notes:**
- Framework: Testcontainers + JUnit 5
- Containers: PostgreSQL 15, Kafka + Schema Registry, WireMock
- Cleanup: `@AfterEach` truncate tables

**Example:**
```java
@Testcontainers
class SignatureRepositoryAdapterTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("testdb");
    
    @Test
    void shouldSaveAndRetrieveSignatureRequest() {
        // Given
        SignatureRequest request = SignatureRequest.builder()...build();
        
        // When
        repository.save(request);
        Optional<SignatureRequest> found = repository.findById(request.getId());
        
        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getCustomerId()).isEqualTo(request.getCustomerId());
    }
}
```

**Definition of Done:**
- [ ] 15+ integration tests con Testcontainers
- [ ] Coverage: Infrastructure layer >70%
- [ ] Tests ejecutan en pipeline CI
- [ ] Documentado en TESTING.md

**Estimation:** 8 SP

---

#### Story 10.5: Idempotencia Funcional - IdempotencyService

**As a** Client Application  
**I want** Enviar `Idempotency-Key` header para prevenir procesamiento duplicado  
**So that** Doble-click no cause doble SMS/doble costo

**Acceptance Criteria:**

**Given** Cliente envía request con `Idempotency-Key: uuid-123`  
**When** Request procesado exitosamente  
**Then** Sistema:
- ✅ Guarda en tabla `idempotency_record`:
  - `id` (PK): UUID
  - `idempotency_key`: "uuid-123"
  - `request_hash`: SHA-256 de request body
  - `response_body`: JSON de response (cachear)
  - `status_code`: 201
  - `created_at`: timestamp
  - `expires_at`: now + 24h (TTL)

**And** Si cliente reenvía MISMO `Idempotency-Key` dentro de 24h:
- ✅ Sistema detecta duplicate en `findByKey(key)`
- ✅ Valida `request_hash` coincide (misma request)
- ✅ Retorna `response_body` cacheado (HTTP 201)
- ✅ NO ejecuta use case nuevamente
- ✅ NO envía SMS duplicado

**And** Si `request_hash` difiere (key reusado con distinto body):
- ❌ HTTP 409 Conflict: "Idempotency key reused with different request"

**And** Si key expiró (>24h):
- ✅ Procesa como nuevo request
- ✅ Limpia registro antiguo

**Technical Notes:**
```java
// IdempotencyService.java
public <T> ResponseEntity<T> executeIdempotent(
    String idempotencyKey,
    String requestHash,
    Supplier<ResponseEntity<T>> operation
) {
    Optional<IdempotencyRecord> existing = repository.findByKey(idempotencyKey);
    
    if (existing.isPresent() && !existing.get().isExpired()) {
        if (!existing.get().getRequestHash().equals(requestHash)) {
            throw new IdempotencyKeyConflictException();
        }
        return deserializeCachedResponse(existing.get());
    }
    
    ResponseEntity<T> response = operation.get(); // Execute
    
    repository.save(IdempotencyRecord.builder()
        .key(idempotencyKey)
        .requestHash(requestHash)
        .responseBody(serialize(response.getBody()))
        .statusCode(response.getStatusCode().value())
        .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
        .build());
    
    return response;
}
```

**Controller Integration:**
```java
@PostMapping
public ResponseEntity<SignatureResponseDto> createSignature(
    @RequestBody SignatureRequestDto request,
    @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
) {
    if (idempotencyKey == null) {
        idempotencyKey = UUID.randomUUID().toString(); // Auto-generate
    }
    
    String requestHash = hashService.sha256(request);
    
    return idempotencyService.executeIdempotent(
        idempotencyKey,
        requestHash,
        () -> {
            SignatureRequest result = startSignatureUseCase.execute(request);
            return ResponseEntity.created(...).body(mapper.toDto(result));
        }
    );
}
```

**Definition of Done:**
- [ ] Tabla `idempotency_record` creada (Liquibase migration)
- [ ] `IdempotencyService` implementado
- [ ] Controller integrado (POST /api/v1/signatures)
- [ ] Tests: duplicate key → cached response
- [ ] Tests: key conflict → HTTP 409
- [ ] Job cleanup: eliminar registros expirados (>24h)

**Estimation:** 5 SP

---

#### Story 10.6: SpEL Validation & Security - Whitelist TypeLocator

**As a** System Administrator  
**I want** Validación de reglas SpEL al crearlas  
**So that** Admin comprometido no pueda ejecutar código arbitrario

**Acceptance Criteria:**

**Given** Admin crea routing rule con SpEL expression  
**When** POST `/admin/routing-rules` con `{ expression: "..." }`  
**Then** Sistema valida ANTES de persistir:

✅ **Sintaxis válida**: Parser no lanza `ParseException`
✅ **Whitelist classes**: Solo permite acceso a:
  - `TransactionContext` (amount, merchantId, etc.)
  - `java.lang.Math` (abs, max, min)
  - `java.time.*` (LocalDate, Instant)
  - ❌ PROHIBIDO: `Runtime`, `ProcessBuilder`, `File`, `ClassLoader`

✅ **No method calls peligrosos**:
  - ❌ `T(java.lang.Runtime).getRuntime().exec(...)`
  - ❌ `new java.io.File(...).delete()`

**And** Si validación falla → HTTP 400: "Invalid SpEL expression: {reason}"

**And** Ejemplos válidos:
```java
// ✅ PERMITIDO
"amount.value > 1000"
"merchantId == 'MERCHANT_XYZ'"
"amount.value > 500 && transactionType == 'PURCHASE'"
"T(java.lang.Math).abs(amount.value) > 100"

// ❌ RECHAZADO
"T(java.lang.Runtime).getRuntime().exec('rm -rf /')"
"new java.io.File('/etc/passwd').delete()"
"#this.getClass().forName('java.lang.Runtime')"
```

**Technical Notes:**
```java
// SpelValidatorServiceImpl.java
public void validate(String expression) {
    SpelExpressionParser parser = new SpelExpressionParser();
    
    // Whitelist TypeLocator (custom)
    StandardEvaluationContext context = new StandardEvaluationContext();
    context.setTypeLocator(new WhitelistTypeLocator(
        List.of(
            "java.lang.Math",
            "java.time.LocalDate",
            "java.time.Instant",
            "com.bank.signature.domain.model.TransactionContext"
        )
    ));
    
    try {
        Expression exp = parser.parseExpression(expression);
        
        // Dry-run con contexto mock
        TransactionContext mockContext = TransactionContext.builder()
            .amount(Money.of(1000, "USD"))
            .merchantId("TEST")
            .build();
        
        exp.getValue(context, mockContext); // Validate execution
        
    } catch (SpelEvaluationException e) {
        throw new InvalidSpelExpressionException("Forbidden operation: " + e.getMessage());
    } catch (ParseException e) {
        throw new InvalidSpelExpressionException("Syntax error: " + e.getMessage());
    }
}
```

**Security Audit:**
- [ ] Auditar TODAS las reglas existentes en DB
- [ ] Re-validar con nuevo validator
- [ ] Deshabilitar reglas que fallen validación
- [ ] Notificar admin de reglas deshabilitadas

**Definition of Done:**
- [ ] `SpelValidatorService` con whitelist implementado
- [ ] Validación en `CreateRoutingRuleUseCase`
- [ ] Tests: reglas maliciosas → rechazadas
- [ ] Security audit de reglas existentes ejecutado
- [ ] Documentado en SECURITY.md

**Estimation:** 5 SP  
**Priority:** 🔴 CRÍTICO (Security vulnerability)

---

### 🟡 Fase 2: Mejoras Importantes (Sprint 5-8)

#### Story 10.7: Distributed Tracing con OpenTelemetry + Jaeger

**As a** Operations Engineer  
**I want** Tracing distribuido end-to-end  
**So that** Puedo debuggear latencia en producción

**Acceptance Criteria:**

**Given** Request end-to-end: Client → Controller → UseCase → Provider → Kafka  
**When** Sistema procesa request  
**Then** OpenTelemetry genera spans:

```
Trace: 7f8a3d2b-1234-5678-abcd-9876543210ef
├─ Span 1: POST /api/v1/signatures (200ms)
│  ├─ Span 2: StartSignatureUseCase.execute (150ms)
│  │  ├─ Span 3: RoutingService.evaluate (10ms)
│  │  ├─ Span 4: SignatureRepository.save (20ms)
│  │  └─ Span 5: TwilioSmsProvider.send (120ms) ← BOTTLENECK
│  │     └─ Span 6: HTTP POST api.twilio.com (115ms)
│  └─ Span 7: EventPublisher.publish (10ms)
```

**And** Jaeger UI muestra:
- ✅ Trace completo con spans anidados
- ✅ Cada span con tags: `http.method`, `http.status_code`, `db.statement`
- ✅ Latencia por span (P50/P95/P99)
- ✅ Errors marcados en rojo

**And** Logs correlacionados con `traceId`:
```json
{
  "timestamp": "2025-11-28T10:30:45.123Z",
  "level": "INFO",
  "traceId": "7f8a3d2b123456789876543210ef",
  "spanId": "5a6b7c8d9e0f",
  "message": "Sending SMS via Twilio",
  "customerId": "CUSTOMER_123_PSEUDO"
}
```

**Technical Notes:**
- Framework: OpenTelemetry Java Agent
- Backend: Jaeger (Docker Compose)
- Instrumentación automática: Spring Boot, JDBC, Kafka
- Custom spans: `@WithSpan` en use cases

```java
// StartSignatureUseCaseImpl.java
@WithSpan
public SignatureRequest execute(StartSignatureCommand command) {
    Span span = Span.current();
    span.setAttribute("customer.id", command.getCustomerId());
    span.setAttribute("routing.channel", selectedChannel.name());
    
    // ... business logic ...
}
```

**Definition of Done:**
- [ ] OpenTelemetry agent configurado en `pom.xml`
- [ ] Jaeger running en Docker Compose
- [ ] Spans generados para controller, use cases, providers
- [ ] Logs con `traceId` en MDC
- [ ] Dashboard en Grafana con trace stats

**Estimation:** 5 SP

---

#### Story 10.8: Structured Logging con MDC (Mapped Diagnostic Context)

**As a** Operations Engineer  
**I want** Logs estructurados con contexto enriquecido  
**So that** Pueda filtrar logs por customer, trace, operation

**Acceptance Criteria:**

**Given** Request procesado  
**When** Sistema loggea eventos  
**Then** Logs incluyen MDC context:

```json
{
  "timestamp": "2025-11-28T10:30:45.123Z",
  "level": "INFO",
  "logger": "com.bank.signature.application.usecase.StartSignatureUseCaseImpl",
  "message": "Creating signature request",
  "mdc": {
    "traceId": "7f8a3d2b-1234-5678-abcd-9876543210ef",
    "customerId": "c8f5d3e1a2b9", // pseudonymized
    "operation": "START_SIGNATURE",
    "channel": "SMS",
    "provider": "TWILIO"
  },
  "thread": "http-nio-8080-exec-1"
}
```

**And** MDC poblado en `RequestLoggingFilter`:
```java
@Override
protected void doFilterInternal(HttpServletRequest request, ...) {
    String traceId = generateTraceId();
    String customerId = extractCustomerId(request);
    
    MDC.put("traceId", traceId);
    MDC.put("customerId", pseudonymize(customerId));
    MDC.put("operation", extractOperation(request));
    
    try {
        filterChain.doFilter(request, response);
    } finally {
        MDC.clear(); // CRITICAL: prevent thread leak
    }
}
```

**And** Queries en Kibana/Splunk:
```
mdc.customerId:"c8f5d3e1a2b9" AND mdc.operation:"START_SIGNATURE"
```

**Technical Notes:**
- Encoder: Logstash JSON encoder (`logstash-logback-encoder`)
- Output: Console (dev) + File (prod) + ELK stack
- GDPR: Customer ID pseudonymizado en logs

**Definition of Done:**
- [ ] `logback-spring.xml` con Logstash encoder
- [ ] `RequestLoggingFilter` pobla MDC
- [ ] Logs en JSON estructurado
- [ ] Documentado en OBSERVABILITY.md

**Estimation:** 3 SP

---

#### Story 10.9: Database Partitioning - Tabla signature_request

**As a** Database Administrator  
**I want** Particionamiento por fecha en `signature_request`  
**So that** Performance no degrade con millones de registros

**Acceptance Criteria:**

**Given** Tabla `signature_request` con >1M filas  
**When** Implemento particionamiento RANGE por `created_at`  
**Then** PostgreSQL crea particiones mensuales:

```sql
-- Parent table (partitioned)
CREATE TABLE signature_request (
    id UUID PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    transaction_context JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    ...
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE signature_request_2025_11 PARTITION OF signature_request
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE signature_request_2025_12 PARTITION OF signature_request
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
```

**And** Queries automáticamente usan partition pruning:
```sql
-- Solo escanea partition 2025_11 (fast)
SELECT * FROM signature_request 
WHERE created_at >= '2025-11-01' 
  AND created_at < '2025-12-01';
```

**And** Job mensual crea siguiente partition:
```java
@Scheduled(cron = "0 0 1 * * *") // 1st of month
public void createNextMonthPartition() {
    YearMonth nextMonth = YearMonth.now().plusMonths(1);
    String tableName = "signature_request_" + nextMonth.toString().replace("-", "_");
    
    jdbcTemplate.execute(String.format(
        "CREATE TABLE %s PARTITION OF signature_request " +
        "FOR VALUES FROM ('%s-01') TO ('%s-01')",
        tableName, nextMonth, nextMonth.plusMonths(1)
    ));
}
```

**And** Retention policy: Archivar partitions >90 días a cold storage

**Technical Notes:**
- PostgreSQL 15: Native partitioning
- Migration: Liquibase para crear estructura inicial
- Monitoring: Partition size en Grafana

**Definition of Done:**
- [ ] Liquibase migration crea partitioned table
- [ ] 3 partitions iniciales (current + 2 futuros)
- [ ] Job scheduler crea partitions automáticamente
- [ ] Tests: partition pruning funciona
- [ ] Documentado en DATABASE_MIGRATIONS.md

**Estimation:** 5 SP

---

#### Story 10.10: GDPR Compliance - Right to Erasure (DELETE endpoint)

**As a** Customer  
**I want** Solicitar eliminación de mis datos personales  
**So that** Sistema cumple GDPR Article 17

**Acceptance Criteria:**

**Given** Customer solicita eliminación de datos  
**When** Admin ejecuta `DELETE /api/v1/admin/customers/{customerId}/data`  
**Then** Sistema:

✅ **Busca todos los registros**:
- `signature_request` donde `customer_id` = pseudonymized ID
- `signature_challenge` (via foreign key)
- `audit_log` con customer references
- `idempotency_record` con customer context

✅ **Anonimiza (NO elimina físicamente)**:
- `customer_id` → "DELETED_USER_{UUID}"
- `transaction_context.customerName` → "REDACTED"
- `transaction_context.email` → "redacted@deleted.local"
- `transaction_context.phone` → "+00000000000"

✅ **Registra auditoría**:
```json
{
  "event": "CUSTOMER_DATA_DELETED",
  "customerId": "CUSTOMER_123",
  "requestedBy": "admin@bank.com",
  "deletedAt": "2025-11-28T10:30:00Z",
  "recordsAffected": 47,
  "reason": "GDPR_RIGHT_TO_ERASURE"
}
```

✅ **Exporta antes de eliminar** (Right to Access):
- JSON con todos los datos del customer
- Almacena en S3/cold storage (compliance 90 días)

**And** Response HTTP 200:
```json
{
  "customerId": "CUSTOMER_123",
  "recordsAnonymized": 47,
  "exportLocation": "s3://compliance-archive/2025-11/CUSTOMER_123.json",
  "completedAt": "2025-11-28T10:30:00Z"
}
```

**Technical Notes:**
```java
// DeleteCustomerDataUseCase.java
@Transactional
public DeleteCustomerDataResult execute(String customerId) {
    // 1. Export data first (Right to Access)
    CustomerDataExport export = exportService.exportAllData(customerId);
    archiveService.store(export); // S3 + 90 day retention
    
    // 2. Anonymize (soft delete)
    int affectedRecords = 0;
    affectedRecords += signatureRepository.anonymizeByCustomerId(customerId);
    affectedRecords += auditLogRepository.anonymizeByCustomerId(customerId);
    
    // 3. Audit
    auditService.log(AuditEvent.CUSTOMER_DATA_DELETED, customerId, affectedRecords);
    
    return DeleteCustomerDataResult.builder()
        .recordsAnonymized(affectedRecords)
        .exportLocation(export.getLocation())
        .build();
}
```

**IMPORTANTE:** Pseudonymization complica búsqueda
- Customer ID está hasheado (HMAC no reversible)
- Necesita lookup table: `customer_id_mapping`
  - `original_id` (encrypted)
  - `pseudonymized_id` (HMAC)
  - Solo accesible por admin con `GDPR_ADMIN` role

**Definition of Done:**
- [ ] Endpoint `DELETE /admin/customers/{id}/data`
- [ ] Export service (JSON completo del customer)
- [ ] Anonymization queries (UPDATE, no DELETE)
- [ ] Audit log de eliminaciones
- [ ] Tests: verificar anonimización completa
- [ ] Documentado en GDPR_COMPLIANCE.md

**Estimation:** 8 SP  
**Priority:** 🟡 IMPORTANTE (Regulatory compliance)

---

#### Story 10.11: Exception Handling - Controller Error Context

**As a** Developer  
**I want** Logging contextual en controllers antes de delegar a GlobalExceptionHandler  
**So that** Troubleshooting sea más fácil

**Acceptance Criteria:**

**Given** Controller procesa request  
**When** Ocurre exception  
**Then** Controller loggea contexto ANTES de re-throw:

```java
@PostMapping
public ResponseEntity<SignatureResponseDto> createSignature(
    @RequestBody SignatureRequestDto request,
    @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
) {
    try {
        log.info("Creating signature request: customerId={}, idempotencyKey={}, channel={}", 
            pseudonymize(request.customerId()), idempotencyKey, request.preferredChannel());
        
        SignatureRequest result = startSignatureUseCase.execute(request);
        
        log.info("Signature request created successfully: id={}, status={}", 
            result.getId(), result.getStatus());
        
        return ResponseEntity.created(...).body(mapper.toDto(result));
        
    } catch (DomainException e) {
        log.warn("Business rule violation: customerId={}, error={}", 
            pseudonymize(request.customerId()), e.getMessage());
        throw e; // Re-throw para GlobalExceptionHandler
        
    } catch (Exception e) {
        log.error("Unexpected error creating signature: customerId={}, idempotencyKey={}", 
            pseudonymize(request.customerId()), idempotencyKey, e);
        throw e;
    }
}
```

**And** GlobalExceptionHandler retorna error estructurado:
```json
{
  "code": "SIG_001",
  "message": "Ya existe una verificación en curso",
  "messageEn": "A verification is already in progress",
  "traceId": "7f8a3d2b-1234",
  "timestamp": "2025-11-28T10:30:45.123Z",
  "path": "/api/v1/signatures",
  "details": {
    "signatureId": "01933e5d-...",
    "retryAfter": "2025-11-28T10:33:00Z"
  }
}
```

**And** Error codes catalog documentado:
```
SIG_001: Challenge already active
SIG_002: Signature request expired
SIG_003: Invalid challenge code
SIG_004: Provider unavailable (degraded mode)
...
```

**Technical Notes:**
- Logging levels:
  - `INFO`: Happy path
  - `WARN`: Business exceptions (esperadas)
  - `ERROR`: Technical exceptions (inesperadas)
  
- NO loggear datos sensibles:
  - ❌ Customer phone/email
  - ❌ Transaction amounts sin pseudonymize
  - ✅ Customer ID pseudonymizado

**Definition of Done:**
- [ ] Todos los controllers con try-catch contextual
- [ ] Error codes catalog creado (ERROR_CODES.md)
- [ ] GlobalExceptionHandler con códigos estructurados
- [ ] I18N: mensajes en español e inglés
- [ ] Tests: verificar logging en exceptions

**Estimation:** 3 SP

---

#### Story 10.12: Código TODO Cleanup & Technical Debt Tracking

**As a** Developer  
**I want** Eliminar TODOs del código y crear tickets en backlog  
**So that** Deuda técnica esté planificada

**Acceptance Criteria:**

**Given** Código con comentarios TODO  
**When** Ejecuto análisis de TODOs  
**Then** Para cada TODO:

✅ **Crear ticket en backlog**:
```
# GitHub Issue #123
Title: Refactor degraded mode to domain layer
Description: Currently degraded mode logic is in controller (violates hexagonal architecture).
Should be moved to use case or domain service.

Location: SignatureController.java:184-186
Epic: E10 - Quality Improvements
Story Points: 3
Priority: Medium

Current code:
// TODO Story 4.3: Refactor to handle degraded mode in domain/use case layer
if (degradedModeActive) { ... }
```

✅ **Reemplazar TODO con referencia a ticket**:
```java
// TECH_DEBT #123: Degraded mode in controller (should be in use case)
// Target: Sprint 12
if (degradedModeActive) { ... }
```

✅ **Eliminar TODOs sin acción**:
- Si TODO es obsoleto → eliminar
- Si TODO ya implementado → eliminar

**And** Análisis de providers temporales:
```
README.md:528: "Current provider implementations are TEMPORARY 
and will be replaced by MuleSoftApiProvider"
```

**Decision Framework:**
- ✅ SI migración MuleSoft < 6 meses → Keep simple, no over-engineer
- ✅ SI migración MuleSoft > 1 año → Treat as PERMANENT
- ❓ SI timeline unclear → Create decision ticket

**Technical Notes:**
```bash
# Script para detectar TODOs
grep -r "TODO" src/main/java --include="*.java" > tech-debt-inventory.txt

# Formato output:
# src/.../SignatureController.java:184: // TODO Story 4.3: ...
```

**Definition of Done:**
- [ ] Todos los TODOs inventariados (tech-debt-inventory.txt)
- [ ] Tickets creados para TODOs válidos
- [ ] TODOs obsoletos eliminados
- [ ] Decisión sobre providers temporales documentada
- [ ] Backlog priorizado con tech debt

**Estimation:** 2 SP

---

### ✅ Fase 3: Optimizaciones (Sprint 9-12)

#### Story 10.13: Rate Limiting Granular - Per Customer + Global

**As a** System  
**I want** Rate limiting configurable por customer y global  
**So that** Prevenir abuso y noisy neighbor

**Acceptance Criteria:**

**Given** Rate limits configurados  
**When** Cliente envía requests  
**Then** Sistema aplica:

✅ **Global rate limit**: 100 req/s (todos los customers)
```yaml
rate-limit:
  global:
    requests-per-second: 100
    bucket-capacity: 200
```

✅ **Per-customer rate limit**: 10 req/min por customer ID
```java
@RateLimiter(name = "perCustomer")
public SignatureRequest createSignature(String customerId, ...) {
    // Resilience4j RateLimiter
    // Limit: 10 requests / 60 seconds per customerId
}
```

**And** Si límite excedido:
```json
HTTP 429 Too Many Requests
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Has excedido el límite de solicitudes",
  "retryAfter": "2025-11-28T10:31:00Z",
  "limits": {
    "perCustomer": "10 requests/min",
    "current": 15,
    "resetAt": "2025-11-28T10:31:00Z"
  }
}
```

**And** Headers en response:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1732791060
```

**And** Métricas Prometheus:
```
rate_limit_exceeded_total{customer="CUSTOMER_123",type="per_customer"} 5
rate_limit_remaining{customer="CUSTOMER_123"} 3
```

**Technical Notes:**
- Framework: Resilience4j RateLimiter
- Storage: Redis (distributed rate limiting)
- Algorithm: Token Bucket

**Definition of Done:**
- [ ] Rate limiter configurado (global + per-customer)
- [ ] Redis para estado distribuido
- [ ] Headers `X-RateLimit-*` en responses
- [ ] Métricas en Prometheus
- [ ] Tests: verify HTTP 429 cuando excede

**Estimation:** 5 SP

---

#### Story 10.14: Secrets Rotation Strategy - Vault Auto-Rotation

**As a** Security Engineer  
**I want** Rotación automática de secretos cada 90 días  
**So that** Cumplir política de seguridad bancaria

**Acceptance Criteria:**

**Given** Secretos almacenados en HashiCorp Vault  
**When** Secreto alcanza 90 días de antigüedad  
**Then** Vault:

✅ **Auto-rotation configurada**:
```hcl
# Vault config
path "secret/data/signature-router/twilio" {
  rotation {
    period = "2160h"  # 90 days
    auto_rotate = true
  }
}
```

✅ **Aplicación detecta cambio**:
- Spring Cloud Vault: `@RefreshScope` beans
- Config refresh cada 5 min
- No requiere restart de aplicación

**And** Proceso de rotación:
```
1. Vault genera nuevo secreto (API_KEY_v2)
2. Guarda ambos: API_KEY_v1 (grace period 7 días), API_KEY_v2
3. Aplicación usa API_KEY_v2 para nuevas requests
4. Requests en flight con API_KEY_v1 siguen funcionando (grace period)
5. Después de 7 días: Vault elimina API_KEY_v1
```

**And** Audit log de rotaciones:
```json
{
  "event": "SECRET_ROTATED",
  "secretPath": "secret/signature-router/twilio/api-key",
  "rotatedAt": "2025-11-28T10:00:00Z",
  "rotatedBy": "vault-auto-rotation",
  "previousVersion": 5,
  "currentVersion": 6
}
```

**And** Alerting si rotación falla:
- Prometheus alert: `vault_rotation_failed`
- Notify: Ops team via PagerDuty

**Technical Notes:**
- Vault: Dynamic secrets para databases
- Spring Cloud Vault: Auto-refresh con `@RefreshScope`
- Grace period: 7 días para evitar downtime

**Definition of Done:**
- [ ] Vault rotation configurada (90 días)
- [ ] Spring Cloud Vault con `@RefreshScope`
- [ ] Tests: simular rotation, verificar switch
- [ ] Alert si rotation falla
- [ ] Documentado en VAULT_ROTATION.md

**Estimation:** 5 SP

---

#### Story 10.15: Database Constraints & Data Integrity

**As a** Database Administrator  
**I want** Constraints de dominio en PostgreSQL  
**So that** Integridad de datos garantizada a nivel DB

**Acceptance Criteria:**

**Given** Schema PostgreSQL  
**When** Ejecuto migration para agregar constraints  
**Then** Valida:

✅ **CHECK constraints**:
```sql
ALTER TABLE signature_request
  ADD CONSTRAINT chk_status 
  CHECK (status IN ('PENDING', 'SIGNED', 'COMPLETED', 'EXPIRED', 'ABORTED'));

ALTER TABLE signature_request
  ADD CONSTRAINT chk_expires_at_future
  CHECK (expires_at > created_at);

ALTER TABLE signature_challenge
  ADD CONSTRAINT chk_challenge_status
  CHECK (status IN ('PENDING', 'SENT', 'COMPLETED', 'FAILED', 'EXPIRED'));
```

✅ **NOT NULL constraints** (ya existentes, validar):
```sql
ALTER TABLE signature_request
  ALTER COLUMN customer_id SET NOT NULL,
  ALTER COLUMN transaction_context SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;
```

✅ **FOREIGN KEY constraints**:
```sql
ALTER TABLE signature_challenge
  ADD CONSTRAINT fk_signature_request
  FOREIGN KEY (signature_request_id) 
  REFERENCES signature_request(id)
  ON DELETE CASCADE; -- Si signature borrado, borrar challenges
```

✅ **UNIQUE constraints**:
```sql
ALTER TABLE idempotency_record
  ADD CONSTRAINT uq_idempotency_key
  UNIQUE (idempotency_key);
```

✅ **GIN indexes para JSONB**:
```sql
CREATE INDEX idx_transaction_context_gin 
  ON signature_request USING GIN (transaction_context);

CREATE INDEX idx_routing_timeline_gin
  ON signature_request USING GIN (routing_timeline);
```

**And** Tests: intentar violar constraint → DB rechaza
```java
@Test
void shouldRejectInvalidStatus() {
    assertThatThrownBy(() -> 
        jdbcTemplate.execute(
            "INSERT INTO signature_request (id, status, ...) " +
            "VALUES (uuid_generate_v7(), 'INVALID_STATUS', ...)"
        )
    ).isInstanceOf(DataIntegrityViolationException.class)
     .hasMessageContaining("chk_status");
}
```

**Definition of Done:**
- [ ] Liquibase migration con constraints
- [ ] CHECK constraints para enums
- [ ] Foreign keys configuradas
- [ ] GIN indexes para JSONB queries
- [ ] Tests: verificar constraints funcionan
- [ ] Documentado en DATABASE_SCHEMA.md

**Estimation:** 3 SP

---

## Epic 10 Summary

**Objetivo Final:** Elevar calificación de 7.5/10 → 9.0/10

### Antes vs Después

| Dimensión | Before | After | Mejora |
|-----------|--------|-------|--------|
| **Testing Coverage** | 14% (24 tests) | 75%+ (150+ tests) | +428% |
| **Idempotencia** | No funcional ❌ | Funcional ✅ | Critical fix |
| **SpEL Security** | Vulnerable ❌ | Whitelisted ✅ | Critical fix |
| **Observability** | Logs básicos | Tracing + MDC ✅ | +Debuggability |
| **GDPR Compliance** | Parcial ⚠️ | Completo ✅ | Regulatory |
| **Database Performance** | No partitioning | Partitioned ✅ | +Scalability |
| **Architecture Validation** | Manual | ArchUnit auto ✅ | +Safety |

### Effort Summary

| Fase | Stories | Story Points | Duration |
|------|---------|--------------|----------|
| **Fase 1: Críticos** | 6 stories | 31 SP | 3-4 sprints |
| **Fase 2: Importantes** | 6 stories | 29 SP | 3-4 sprints |
| **Fase 3: Optimizaciones** | 3 stories | 13 SP | 2 sprints |
| **TOTAL** | **15 stories** | **73 SP** | **8-10 sprints** |

**Duración estimada:** 6-8 semanas (2 meses)

### Prioridad de Ejecución

**Sprint 1-2 (CRÍTICO):**
- Story 10.1: ArchUnit tests
- Story 10.2: Domain testing
- Story 10.5: Idempotencia
- Story 10.6: SpEL security

**Sprint 3-4 (CRÍTICO):**
- Story 10.3: Use case tests
- Story 10.4: Integration tests

**Sprint 5-6 (IMPORTANTE):**
- Story 10.7: Distributed tracing
- Story 10.9: DB partitioning
- Story 10.10: GDPR compliance

**Sprint 7-8 (OPTIMIZACIÓN):**
- Story 10.8: MDC logging
- Story 10.11: Exception handling
- Story 10.13: Rate limiting
- Story 10.14: Secrets rotation
- Story 10.15: DB constraints

---

**Siguiente paso:** Iniciar Sprint Planning para Epic 10, comenzando con Fase 1 (Problemas Críticos)

**Bloqueador para Producción:** Epic 10 debe completarse ANTES de deployment a producción bancaria.

---

## Implementation Notes

### Story Sizing Philosophy

Cada story está dimensionada para ser completable en una **sesión enfocada de desarrollo** (2-4 horas típicamente). Esto permite:
- Progreso incremental visible
- Testing independiente por story
- Code reviews manejables
- Rollback granular si algo falla

### Technical Debt Management

**Stub Implementations**: Stories 2.6 y 2.7 son stubs intencionales. En sprints futuros:
- Sprint 3-4: Implementar Push real (FCM integration)
- Sprint 5-6: Implementar Voice real (Twilio Voice API)

### Testing Strategy per Story

- **Unit Tests**: Domain logic (SignatureRequest, ChallengeService)
- **Integration Tests**: Repository adapters (Testcontainers)
- **API Tests**: REST endpoints (MockMvc + Testcontainers)
- **E2E Tests**: Epic 2 complete flow (create → route → send → complete)

---

## Next Steps

**Para continuar desarrollo**:
1. ✅ Epic 1 y 2 completados → Sistema funcional básico
2. ⏭️ **Epic 3: Multi-Provider Integration** (implementar providers reales)
3. ⏭️ **Epic 4: Resilience & Circuit Breaking** (fallback chain, degraded mode)
4. ⏭️ **Epic 5: Event-Driven Architecture** (Outbox + Debezium + Kafka)
5. ⏭️ **Epic 6-7: Admin Portal** (React SPA para gestión)
6. ⏭️ **Epic 8: Security & Compliance** (OAuth2, RBAC, audit)
7. ⏭️ **Epic 9: Observability** (Métricas SLO, distributed tracing)

**Para Sprint Planning**:
- Usar workflow `/bmad:bmm:workflows:sprint-planning`
- Seleccionar stories de Epic 1 para Sprint 1 (Foundation)
- Epic 2 stories en Sprint 2-3 (Core features)

---

_Documento creado por BMAD Method - Epic Breakdown Workflow_  
_Contexto completo: PRD (90 FRs) + Architecture (8 docs) + Tech Stack definido_  
_Ready for Phase 4: Implementation Sprints_ 🚀

