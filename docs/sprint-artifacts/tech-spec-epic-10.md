# Epic Technical Specification: Quality Improvements & Technical Debt

**Date:** 2025-11-29  
**Author:** BMAD Architect Agent  
**Epic ID:** epic-10  
**Status:** Ready for Implementation  

---

## Overview

**Epic 10: Quality Improvements & Technical Debt** es una iniciativa crítica derivada de la evaluación profesional de calidad realizada el 28 de Noviembre de 2025. Este epic resuelve problemas críticos identificados en la evaluación que bloquean el deployment a producción bancaria, elevando la calificación del proyecto de **7.5/10 a 9.0/10**.

El epic se enfoca en tres áreas críticas identificadas en la evaluación:
1. **Testing Coverage Insuficiente** (14% → 75%): Alto riesgo de bugs en producción
2. **Idempotencia No Funcional**: Doble procesamiento y doble costo
3. **SpEL Injection Vulnerability**: Security risk crítico

**Contexto del PRD**: Este epic no implementa nuevos Functional Requirements, sino que mejora la calidad técnica del sistema existente para cumplir con Non-Functional Requirements de producción bancaria (NFR-S1-S16, NFR-P1-P10, NFR-O1-O14).

**Valor de Negocio**: 
- ✅ Reducir riesgo de bugs en producción (testing coverage 14% → 75%)
- ✅ Prevenir doble procesamiento y doble costo (idempotencia funcional)
- ✅ Eliminar vulnerabilidades de seguridad (SpEL injection)
- ✅ Mejorar observabilidad para troubleshooting en producción
- ✅ Asegurar compliance GDPR y regulatorio

**Source**: [Evaluación de Calidad del Proyecto - 28 Nov 2025](Evaluación_de_Calidad_del_Proyecto_Signature_Router.md)

---

## Objectives and Scope

### In-Scope (15 Stories)

#### 🔴 Fase 1: Problemas Críticos (Sprint 1-3)

✅ **Story 10.1**: ArchUnit Tests - Validación automatizada de arquitectura hexagonal (3 SP)  
✅ **Story 10.2**: Domain Layer Tests - >90% coverage en agregados y value objects (5 SP)  
✅ **Story 10.3**: Use Case Tests - >85% coverage en application layer (5 SP)  
✅ **Story 10.4**: Testcontainers Integration - Tests con PostgreSQL/Kafka reales (8 SP)  
✅ **Story 10.5**: Idempotencia Funcional - IdempotencyService con tabla y cache (5 SP) 🔴 CRÍTICO  
✅ **Story 10.6**: SpEL Security - Whitelist TypeLocator y validación (5 SP) 🔴 CRÍTICO  

#### 🟡 Fase 2: Mejoras Importantes (Sprint 4-6)

✅ **Story 10.7**: Distributed Tracing - OpenTelemetry + Jaeger integration (5 SP)  
✅ **Story 10.8**: MDC Logging - Logstash encoder + contexto enriquecido (3 SP)  
✅ **Story 10.9**: DB Partitioning - Particionamiento RANGE por created_at (5 SP)  
✅ **Story 10.10**: GDPR Compliance - Right to Erasure endpoint (8 SP)  
✅ **Story 10.11**: Exception Handling - Logging contextual y error codes (3 SP)  
✅ **Story 10.12**: TODO Cleanup - Inventario y tickets de deuda técnica (1 SP)  

#### 🟢 Fase 3: Optimizaciones (Sprint 7-8)

✅ **Story 10.13**: Rate Limiting - Global + per-customer con Redis (5 SP)  
✅ **Story 10.14**: Secrets Rotation - Vault auto-rotation con @RefreshScope (5 SP)  
✅ **Story 10.15**: Database Constraints - CHECK constraints y foreign keys (3 SP)  

### Out-of-Scope

❌ **Nuevos Functional Requirements**: Este epic NO agrega nuevas features funcionales  
❌ **Refactoring mayor**: Solo mejoras incrementales, no reescritura de código existente  
❌ **Performance optimization**: Optimizaciones de performance se hacen en Epic 9  
❌ **UI/UX improvements**: Admin Portal mejoras están en Epic 6-7  
❌ **Production deployment**: Kubernetes manifests y CI/CD pipelines se crean después  

### Success Criteria for Epic 10

Este epic se considera exitoso cuando:

1. ✅ **Test Coverage**: JaCoCo reporta >75% coverage total (actualmente 14%)
2. ✅ **Security**: Zero critical vulnerabilities (actualmente 1: SpEL injection)
3. ✅ **Idempotencia**: Funcional y probada (0% duplicates en load tests)
4. ✅ **Architecture Validation**: ArchUnit tests integrados en CI/CD (falla build si viola)
5. ✅ **Observability**: Distributed tracing visible en Jaeger, logs estructurados con MDC
6. ✅ **GDPR Compliance**: Right to Erasure endpoint funcional y auditado
7. ✅ **Calificación**: Evaluación de calidad muestra 9.0/10+ (actualmente 7.5/10)
8. ✅ **Production Ready**: Sistema listo para deployment bancario

---

## System Architecture Alignment

Este epic mejora la **calidad técnica** del sistema existente sin cambiar la arquitectura fundamental definida en `docs/architecture/02-hexagonal-structure.md`:

### Hexagonal Architecture Layers (Sin Cambios)

```
com.bank.signature/
├── domain/                    # Story 10.2: Tests unitarios >90%
│   ├── model/
│   │   ├── aggregate/SignatureRequest  # Tests: 95%+ coverage
│   │   ├── entity/SignatureChallenge   # Tests: 90%+ coverage
│   │   └── valueobject/                # Tests: 100% coverage
│   └── port/
│       ├── inbound/           # Story 10.3: Use case tests >85%
│       └── outbound/          # Story 10.1: ArchUnit validation
│
├── application/               # Story 10.3: Use case tests con mocks
│   └── usecase/
│       ├── StartSignatureUseCaseImpl
│       ├── CompleteSignatureUseCaseImpl
│       └── EvaluateRoutingUseCaseImpl
│
└── infrastructure/            # Story 10.4: Testcontainers integration
    ├── adapter/
    │   ├── inbound/rest/      # Story 10.5: Idempotency header
    │   └── outbound/
    │       ├── persistence/   # Story 10.4: PostgreSQL tests
    │       ├── provider/      # Story 10.4: WireMock tests
    │       └── event/         # Story 10.4: Kafka tests
    └── config/                # Story 10.6: SpEL security config
```

### Technology Stack Additions

| Component | Technology | Version | Story | Purpose |
|-----------|------------|---------|-------|---------|
| **Architecture Testing** | ArchUnit | 1.2.1 | 10.1 | Validación automatizada |
| **Test Containers** | Testcontainers | 1.19.3 | 10.4 | Integration tests reales |
| **Distributed Tracing** | OpenTelemetry | 1.32.0 | 10.7 | End-to-end tracing |
| **Tracing Backend** | Jaeger | 1.50 | 10.7 | Trace visualization |
| **Logging** | Logstash Encoder | 7.4 | 10.8 | Structured JSON logs |
| **Rate Limiting** | Bucket4j | 8.7.0 | 10.13 | Distributed rate limiting |
| **Cache** | Redis | 7.2 | 10.13 | Rate limiter state |

---

## Detailed Design

### Services and Modules

#### 1. IdempotencyService (Story 10.5)

**Location**: `com.bank.signature.application.service.IdempotencyService`

**Responsibilities**:
- Validar `Idempotency-Key` header en requests
- Cachear responses para keys duplicados
- Limpiar registros expirados (>24h)

**Interface**:
```java
public interface IdempotencyService {
    Optional<IdempotencyRecord> checkAndStore(String idempotencyKey, String requestHash);
    Optional<IdempotencyRecord> getCachedResponse(String idempotencyKey);
    void cleanupExpiredRecords();
}
```

**Database Schema**:
```sql
CREATE TABLE idempotency_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    request_hash VARCHAR(64) NOT NULL,  -- SHA-256
    response_body JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_idempotency_expires ON idempotency_record(expires_at);
```

#### 2. SpelValidatorService (Story 10.6)

**Location**: `com.bank.signature.application.service.SpelValidatorService`

**Responsibilities**:
- Validar expresiones SpEL contra whitelist
- Prevenir injection attacks (T(java.lang.Runtime).getRuntime().exec(...))
- Validar sintaxis antes de persistir routing rules

**Interface**:
```java
public interface SpelValidatorService {
    ValidationResult validate(String spelExpression);
    boolean isSafe(String spelExpression);
}

public record ValidationResult(boolean isValid, String errorMessage) {}
```

**Whitelist Strategy**:
- Solo permitir clases del paquete `com.bank.signature.domain`
- Bloquear acceso a `java.lang.Runtime`, `java.lang.ProcessBuilder`
- Bloquear acceso a `T()` function (TypeLocator)
- Permitir solo operadores matemáticos y comparaciones básicas

#### 3. HexagonalArchitectureTest (Story 10.1)

**Location**: `src/test/java/com/bank/signature/architecture/HexagonalArchitectureTest.java`

**ArchUnit Rules**:
1. Domain layer NO depende de Infrastructure
2. Domain layer NO depende de Spring/JPA/Jackson
3. Application layer NO depende de Infrastructure
4. Ports son interfaces
5. Adapters implementan ports
6. Flujo unidireccional: Infrastructure → Application → Domain
7. Domain models NO tienen anotaciones JPA
8. Value Objects son inmutables (Records)

### Data Models and Contracts

#### IdempotencyRecord Entity

```java
@Entity
@Table(name = "idempotency_record")
public class IdempotencyRecord {
    @Id
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String idempotencyKey;
    
    @Column(nullable = false)
    private String requestHash;  // SHA-256
    
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private JsonNode responseBody;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant expiresAt;
}
```

#### GDPR Customer Data Export

**Story 10.10**: Endpoint para exportar datos de cliente

**Request**:
```
GET /api/v1/admin/customers/{customerId}/data
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "customerId": "pseudonymized-id-123",
  "signatureRequests": [
    {
      "id": "uuid",
      "createdAt": "2025-11-29T10:00:00Z",
      "status": "COMPLETED",
      "challenges": [...]
    }
  ],
  "exportedAt": "2025-11-29T12:00:00Z"
}
```

### APIs and Interfaces

#### Idempotency Header (Story 10.5)

**Request Header**:
```
POST /api/v1/signatures
Idempotency-Key: uuid-123-456-789
Content-Type: application/json
```

**Response Scenarios**:
- **First Request**: HTTP 201 Created (normal flow)
- **Duplicate Request**: HTTP 200 OK (cached response)
- **Key Conflict**: HTTP 409 Conflict (different request body, same key)

#### SpEL Validation Endpoint (Story 10.6)

**Request**:
```
POST /api/v1/admin/routing-rules/validate-spel
Content-Type: application/json

{
  "expression": "transactionContext.amount > 1000 && transactionContext.currency == 'EUR'"
}
```

**Response**:
```json
{
  "isValid": true,
  "errorMessage": null
}
```

**Error Response**:
```json
{
  "isValid": false,
  "errorMessage": "SpEL expression contains unsafe operations: T(java.lang.Runtime)"
}
```

### Workflows and Sequencing

#### Workflow: Idempotent Request Processing

```
1. Client → POST /signatures with Idempotency-Key header
2. Controller → Extract Idempotency-Key header
3. IdempotencyService → Check if key exists in cache
   ├─ IF EXISTS: Return cached response (HTTP 200)
   └─ IF NOT EXISTS: Continue to step 4
4. UseCase → Process request normally
5. IdempotencyService → Store response in cache (TTL 24h)
6. Controller → Return response (HTTP 201)
```

#### Workflow: SpEL Security Validation

```
1. Admin → POST /admin/routing-rules with SpEL expression
2. Controller → Extract SpEL expression
3. SpelValidatorService → Validate against whitelist
   ├─ IF SAFE: Continue to step 4
   └─ IF UNSAFE: Return HTTP 400 with error message
4. CreateRoutingRuleUseCase → Persist rule
5. Repository → Save to database
```

---

## Non-Functional Requirements

### Performance

**Targets**:
- **Test Execution**: <30s para suite completa de integration tests (Story 10.4)
- **Idempotency Lookup**: <10ms P99 latency (Story 10.5)
- **SpEL Validation**: <5ms P99 latency (Story 10.6)
- **JaCoCo Report Generation**: <60s en CI pipeline

**Constraints**:
- Testcontainers containers deben iniciar en <10s (PostgreSQL, Kafka)
- Idempotency cache debe soportar 1000 req/s
- SpEL validation NO debe bloquear request processing

### Security

**Requirements**:
- ✅ **SpEL Injection Prevention** (Story 10.6): Whitelist TypeLocator, bloquear Runtime access
- ✅ **Idempotency Key Validation** (Story 10.5): SHA-256 hash de request body para detectar conflicts
- ✅ **GDPR Compliance** (Story 10.10): Right to Erasure, data anonymization (no physical delete)
- ✅ **Secrets Rotation** (Story 10.14): Vault auto-rotation cada 90 días, zero-downtime

**Security Audit**:
- Audit de todas las routing rules existentes para detectar SpEL expressions maliciosas
- Documentar SpEL safe practices en `SECURITY.md`

### Reliability/Availability

**Requirements**:
- **Test Coverage**: >75% garantiza menor riesgo de bugs en producción
- **Idempotency**: Prevenir doble procesamiento (critical para sistemas bancarios)
- **ArchUnit Validation**: CI/CD pipeline falla si arquitectura viola (previene degradación)

**Degradation Behavior**:
- Si IdempotencyService falla: Log warning, continuar sin idempotency (degraded mode)
- Si SpEL validation falla: Rechazar request (security first)
- Si Testcontainers falla en CI: Alertar pero no bloquear deployment (tests opcionales)

### Observability

**Requirements**:
- **Distributed Tracing** (Story 10.7): OpenTelemetry spans en controller, use cases, providers
- **MDC Logging** (Story 10.8): Logs estructurados con traceId, customerId, operation
- **Metrics** (Story 10.5, 10.6): Prometheus counters para idempotency hits/misses, SpEL validation failures

**Logging Strategy**:
- **Structured JSON**: Logstash encoder para ELK integration
- **MDC Context**: traceId, customerId, idempotencyKey, operation
- **Log Levels**: 
  - INFO: Idempotency cache hit/miss
  - WARN: SpEL validation failure, idempotency service degraded
  - ERROR: Test failures, security violations

---

## Dependencies and Integrations

### Internal Dependencies

**Prerequisites**:
- ✅ **Epic 1**: Domain models, PostgreSQL, Kafka, Vault (foundation)
- ✅ **Epic 2**: SignatureRequest aggregate, routing rules, use cases
- ✅ **Epic 3**: Provider abstractions (para tests)
- ✅ **Epic 5**: Outbox pattern (para tests de event publishing)

**Dependent Epics**:
- **Epic 6-7**: Admin Portal puede usar SpEL validator para UI validation
- **Epic 8**: Security & Compliance puede usar GDPR endpoints
- **Epic 9**: Observability puede usar distributed tracing

### External Dependencies

**Libraries**:
- `com.tngtech.archunit:archunit-junit5:1.2.1` (Story 10.1)
- `org.testcontainers:testcontainers:1.19.3` (Story 10.4)
- `io.opentelemetry:opentelemetry-api:1.32.0` (Story 10.7)
- `net.logstash.logback:logstash-logback-encoder:7.4` (Story 10.8)
- `com.bucket4j:bucket4j-redis:8.7.0` (Story 10.13)

**Infrastructure**:
- **Jaeger**: Para distributed tracing visualization (Docker Compose)
- **Redis**: Para rate limiting state (Docker Compose)
- **PostgreSQL**: Para idempotency_record table (ya existe)

---

## Acceptance Criteria (Authoritative)

### Story 10.1: ArchUnit Tests

**AC1**: `HexagonalArchitectureTest.java` creado con 8+ reglas ArchUnit  
**AC2**: Tests pasan en codebase actual (sin violaciones)  
**AC3**: Maven build falla si arquitectura viola (integrado en `pom.xml`)  
**AC4**: Documentado en README.md sección "Architecture Validation"

### Story 10.2: Domain Layer Tests

**AC1**: `SignatureRequestTest.java` con 95%+ coverage  
**AC2**: `SignatureChallengeTest.java` con 90%+ coverage  
**AC3**: Value Objects (TransactionContext, Money) con 100% coverage  
**AC4**: JaCoCo reporta Domain layer >90% line coverage  
**AC5**: 25+ tests unitarios ejecutan en <5s

### Story 10.3: Use Case Tests

**AC1**: `StartSignatureUseCaseImplTest` con mocks (happy path, idempotencia, validación)  
**AC2**: `CompleteSignatureUseCaseImplTest` con mocks (código correcto/incorrecto, expiración)  
**AC3**: `EvaluateRoutingUseCaseImplTest` con mocks (SpEL match, prioridad, default)  
**AC4**: JaCoCo reporta Application layer >85% coverage  
**AC5**: 20+ tests ejecutan en <10s (sin I/O)

### Story 10.4: Testcontainers Integration

**AC1**: `SignatureRepositoryAdapterTest` con PostgreSQL container (save, findById, JSONB)  
**AC2**: `OutboxEventPublisherAdapterTest` con PostgreSQL + Kafka containers (event → outbox → Kafka)  
**AC3**: `ProviderAdapterTest` con WireMock container (SMS send, timeout, retry)  
**AC4**: Tests ejecutan en <30s (container startup optimizado)  
**AC5**: JaCoCo reporta Infrastructure layer >70% coverage

### Story 10.5: Idempotencia Funcional

**AC1**: Tabla `idempotency_record` creada (Liquibase changeset)  
**AC2**: `IdempotencyService` implementado (checkAndStore, getCachedResponse)  
**AC3**: Controller integrado (POST /signatures acepta Idempotency-Key header)  
**AC4**: Tests: duplicate key → cached response (HTTP 200)  
**AC5**: Tests: key conflict → HTTP 409 Conflict  
**AC6**: Job scheduler limpia registros expirados (>24h)

### Story 10.6: SpEL Security

**AC1**: `SpelValidatorService` con whitelist TypeLocator  
**AC2**: Validación en `CreateRoutingRuleUseCase` (rechaza expresiones maliciosas)  
**AC3**: Tests: regla maliciosa → rechazada con HTTP 400  
**AC4**: Security audit de reglas existentes en BD  
**AC5**: Documentado en `SECURITY.md` (SpEL safe practices)

### Story 10.7: Distributed Tracing

**AC1**: OpenTelemetry agent configurado  
**AC2**: Jaeger running en Docker Compose  
**AC3**: Spans automáticos (controller, use cases, providers)  
**AC4**: Logs con `traceId` en MDC  
**AC5**: Dashboard Grafana con trace stats

### Story 10.8: MDC Logging

**AC1**: `logback-spring.xml` con Logstash encoder  
**AC2**: `RequestLoggingFilter` pobla MDC (traceId, customerId, operation)  
**AC3**: Logs en JSON estructurado  
**AC4**: Documentado en `OBSERVABILITY.md`

### Story 10.9: DB Partitioning

**AC1**: Liquibase migration → partitioned table (RANGE por created_at)  
**AC2**: 3 partitions iniciales (current + 2 futuros)  
**AC3**: Job scheduler crea partitions automáticamente  
**AC4**: Tests: partition pruning funciona  
**AC5**: Performance tests con 10M filas

### Story 10.10: GDPR Compliance

**AC1**: Endpoint `DELETE /admin/customers/{id}/data`  
**AC2**: Export service (JSON customer data)  
**AC3**: Anonymization queries (UPDATE, no DELETE)  
**AC4**: Audit log de eliminaciones  
**AC5**: Tests: anonimización completa

### Story 10.11: Exception Handling

**AC1**: Try-catch contextual en controllers  
**AC2**: Error codes catalog (`ERROR_CODES.md`)  
**AC3**: GlobalExceptionHandler con códigos  
**AC4**: I18N: mensajes español e inglés  
**AC5**: Tests: logging en exceptions

### Story 10.12: TODO Cleanup

**AC1**: Inventario de TODOs (`tech-debt-inventory.txt`)  
**AC2**: Tickets creados para TODOs válidos  
**AC3**: TODOs obsoletos eliminados  
**AC4**: Decisión sobre providers temporales  
**AC5**: Backlog priorizado

### Story 10.13: Rate Limiting

**AC1**: Rate limiter: global (100/s) + per-customer (10/min)  
**AC2**: Redis para estado distribuido  
**AC3**: Headers `X-RateLimit-*` en responses  
**AC4**: Métricas Prometheus  
**AC5**: Tests: HTTP 429 cuando excede

### Story 10.14: Secrets Rotation

**AC1**: Vault rotation configurada (90 días)  
**AC2**: Spring Cloud Vault `@RefreshScope`  
**AC3**: Tests: simular rotation  
**AC4**: Alert si rotation falla  
**AC5**: Documentado en `VAULT_ROTATION.md`

### Story 10.15: Database Constraints

**AC1**: CHECK constraints para enums  
**AC2**: Foreign keys configuradas  
**AC3**: GIN indexes para JSONB  
**AC4**: Tests: verificar constraints  
**AC5**: Documentado en `DATABASE_SCHEMA.md`

---

## Traceability Mapping

### Quality Evaluation → Epic 10 Stories

| Evaluation Finding | Story | Priority |
|-------------------|-------|----------|
| Testing coverage 14% (should be >75%) | 10.2, 10.3, 10.4 | 🔴 CRÍTICO |
| Missing ArchUnit tests | 10.1 | 🔴 CRÍTICO |
| Idempotency not functional | 10.5 | 🔴 CRÍTICO |
| SpEL injection vulnerability | 10.6 | 🔴 CRÍTICO |
| No distributed tracing | 10.7 | 🟡 IMPORTANTE |
| Inconsistent exception handling | 10.11 | 🟡 IMPORTANTE |
| TODO comments without tickets | 10.12 | 🟡 IMPORTANTE |
| GDPR compliance partial | 10.10 | 🟡 IMPORTANTE |
| No DB partitioning | 10.9 | 🟡 IMPORTANTE |
| Basic rate limiting | 10.13 | 🟢 OPTIMIZACIÓN |
| No secrets rotation | 10.14 | 🟢 OPTIMIZACIÓN |
| Missing DB constraints | 10.15 | 🟢 OPTIMIZACIÓN |

### PRD NFRs → Epic 10 Stories

| NFR | Story | Coverage |
|-----|-------|----------|
| NFR-P2: P99 < 3s | 10.4 (performance tests) | Indirect |
| NFR-S1-S16: Security | 10.6 (SpEL), 10.14 (secrets) | Direct |
| NFR-O1-O14: Observability | 10.7 (tracing), 10.8 (logging) | Direct |
| GDPR Article 17 | 10.10 (Right to Erasure) | Direct |

---

## Risks, Assumptions, Open Questions

### Risks

**R1: Test Coverage Goal Too Aggressive**
- **Risk**: Alcanzar 75% coverage puede requerir más tiempo del estimado
- **Mitigation**: Priorizar coverage en código crítico (domain, use cases) primero
- **Contingency**: Aceptar 70% si 75% no es alcanzable en timeline

**R2: Idempotency Performance Impact**
- **Risk**: Lookup en BD puede agregar latencia
- **Mitigation**: Usar cache en memoria (Caffeine) con TTL corto, BD como source of truth
- **Contingency**: Redis cache si performance no es suficiente

**R3: SpEL Whitelist Too Restrictive**
- **Risk**: Whitelist puede bloquear expresiones válidas
- **Mitigation**: Iterar whitelist basado en reglas existentes, documentar safe patterns
- **Contingency**: Permitir excepciones con approval de security team

**R4: Testcontainers CI/CD Performance**
- **Risk**: Containers pueden hacer CI pipeline lento
- **Mitigation**: Parallel test execution, container reuse, optimized images
- **Contingency**: Tests opcionales en PR, mandatory en main branch

### Assumptions

**A1**: Codebase actual tiene arquitectura hexagonal correcta (solo falta validación)  
**A2**: Domain models están bien diseñados (solo falta coverage)  
**A3**: Use cases tienen lógica correcta (solo falta tests)  
**A4**: Infraestructura (PostgreSQL, Kafka) funciona correctamente (solo falta tests)

### Open Questions

**Q1**: ¿Debemos mantener idempotency records indefinidamente o solo 24h?  
**Answer**: 24h TTL es suficiente para prevenir doble procesamiento, cleanup automático

**Q2**: ¿SpEL whitelist debe ser configurable o hardcoded?  
**Answer**: Hardcoded inicialmente, hacer configurable si hay necesidad de extensibilidad

**Q3**: ¿Distributed tracing debe ser opcional o mandatory?  
**Answer**: Mandatory para producción, pero puede deshabilitarse en desarrollo local

---

## Test Strategy Summary

### Unit Tests (Story 10.2, 10.3)

**Framework**: JUnit 5 + AssertJ  
**Coverage Target**: Domain >90%, Application >85%  
**Pattern**: Arrange-Act-Assert (AAA)  
**Mocking**: Mockito para use cases (mocks de ports)  
**Execution**: <15s total (sin I/O)

### Integration Tests (Story 10.4)

**Framework**: Testcontainers + JUnit 5  
**Containers**: PostgreSQL 15, Kafka + Schema Registry, WireMock  
**Coverage Target**: Infrastructure >70%  
**Pattern**: Real infrastructure, no mocks  
**Execution**: <30s total (optimized container startup)

### Architecture Tests (Story 10.1)

**Framework**: ArchUnit + JUnit 5  
**Coverage**: 8+ rules validando hexagonal architecture  
**Execution**: <5s  
**Integration**: Maven build falla si viola

### Security Tests (Story 10.6)

**Framework**: JUnit 5  
**Coverage**: SpEL injection attempts, whitelist validation  
**Pattern**: Negative testing (malicious expressions → rejected)

### Performance Tests (Story 10.9)

**Framework**: JMeter o Gatling  
**Coverage**: DB partitioning con 10M filas  
**Target**: Query performance <100ms P99

---

## Implementation Timeline

### Sprint Breakdown

**Total**: 15 stories, 73 SP, 8-10 sprints (6-8 semanas)

| Sprint | Stories | SP | Focus |
|--------|---------|----|----|
| Sprint 1 | 10.1, 10.5, 10.6, 10.12 | 14 | Security & Foundation |
| Sprint 2 | 10.2, 10.3, 10.11, 10.15 | 14 | Domain & Use Case Testing |
| Sprint 3 | 10.4 | 8 | Integration Testing |
| Sprint 4 | 10.7, 10.8 | 8 | Observability |
| Sprint 5 | 10.9, 10.13 | 8 | Scalability |
| Sprint 6 | 10.10 | 8 | GDPR Compliance |
| Sprint 7-8 | 10.14 | 5 | Production Hardening |

### Checkpoints

**Checkpoint 1 (Post-Sprint 2)**: Coverage >75%  
**Checkpoint 2 (Post-Sprint 3)**: Production-ready básico (GO/NO-GO para UAT)  
**Checkpoint 3 (Post-Sprint 6)**: Production-ready completo (GO/NO-GO para Production)

---

## Next Steps

1. **Sprint Planning**: Seleccionar stories para Sprint 1 (10.1, 10.5, 10.6, 10.12)
2. **Story Creation**: Crear story files para Sprint 1 stories
3. **Implementation**: Comenzar con Story 10.1 (ArchUnit Tests)
4. **Tracking**: Actualizar `sprint-status.yaml` conforme avance

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2025-11-29  
**Next Review**: After Sprint 1 completion

