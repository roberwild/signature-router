# Story 10.4: Integration Tests con Testcontainers - Testing Coverage >70%

**Epic**: 10 - Quality Improvements & Technical Debt  
**Story ID**: 10.4  
**Story Key**: 10-4-testcontainers-integration  
**Status**: drafted  
**Created**: 2025-11-29  
**Story Points**: 8 SP  
**Priority**: 🔴 CRÍTICO

---

## Story

**As a** Developer  
**I want** Integration tests con PostgreSQL y Kafka reales (containers)  
**So that** Adapters funcionen correctamente en entorno real

---

## Context

Esta story implementa tests de integración usando Testcontainers para validar que los adapters de infraestructura funcionan correctamente con bases de datos y sistemas reales (PostgreSQL, Kafka) sin depender de servicios externos configurados manualmente.

**Source**: Evaluación de Calidad identificó que faltan tests de integración para adapters, lo cual es crítico porque los adapters son el punto de contacto con sistemas externos.

**Business Value**: 
- Valida funcionamiento real de adapters con PostgreSQL/Kafka
- Detecta problemas de serialización/deserialización (JSONB, Avro)
- Valida queries personalizados y UUIDv7 generación
- Facilita debugging de problemas de integración
- Cumple con estándares bancarios de testing (>70% coverage en infrastructure layer)

**Prerequisites**: 
- ✅ Epic 1 completado (adapters existentes)
- ✅ Story 10.2 completada (domain layer tests)
- ✅ Story 10.3 completada (use case tests)
- ✅ Testcontainers dependency ya agregada en pom.xml

---

## Acceptance Criteria

### AC1: SignatureRepositoryAdapterTest

**Given** Testcontainers PostgreSQL 15 configurado  
**When** Ejecuto `SignatureRepositoryAdapterTest.java`  
**Then** Coverage >70% con tests para:
- ✅ Save → findById (round-trip completo)
- ✅ JSONB serialization (TransactionContext almacenado y recuperado correctamente)
- ✅ Queries personalizados (findByCustomerIdAndStatus)
- ✅ UUIDv7 generación y ordenamiento temporal
- ✅ Relaciones con challenges (one-to-many)
- ✅ Soft delete (deleted flag)

**And** Tests ejecutan en <30s (container startup optimizado)

---

### AC2: OutboxEventPublisherAdapterTest

**Given** Testcontainers PostgreSQL + Kafka configurado  
**When** Ejecuto `OutboxEventPublisherAdapterTest.java`  
**Then** Coverage >70% con tests para:
- ✅ Publicar evento → outbox_event table tiene registro
- ✅ Transaction atomicity (rollback no persiste evento)
- ✅ Multiple events en misma transacción
- ✅ Avro serialization correcta (si aplica)
- ✅ published_at permanece NULL (Debezium actualizará)

**And** Tests ejecutan en <30s

**Note**: Ya existe `OutboxPatternIT.java` parcialmente - completar y mejorar

---

### AC3: ProviderAdapterTest (WireMock)

**Given** WireMock configurado para simular Twilio/FCM  
**When** Ejecuto `ProviderAdapterTest.java`  
**Then** Coverage >70% con tests para:
- ✅ Enviar SMS → API call correcto a Twilio
- ✅ Enviar Push → API call correcto a FCM
- ✅ Timeout → CircuitBreaker abre correctamente
- ✅ Retry logic con exponential backoff
- ✅ Error handling (4xx, 5xx responses)

**And** Tests ejecutan en <30s

---

### AC4: Testcontainers Configuration

**Given** Suite de tests de integración  
**When** Ejecuto tests  
**Then** Configuración incluye:
- ✅ PostgreSQL 15 container (shared static container)
- ✅ Kafka container (si necesario)
- ✅ WireMock server (para providers)
- ✅ Cleanup automático (@AfterEach truncate tables)
- ✅ Optimización de startup (reuse containers)

**And** Tests son determinísticos (sin flakiness)

---

### AC5: JaCoCo Coverage Report

**Given** Todos los tests ejecutados  
**When** Reviso reporte JaCoCo  
**Then** Infrastructure layer muestra:
- ✅ Line coverage >70%
- ✅ Branch coverage >65%
- ✅ SignatureRepositoryAdapter: >70% coverage
- ✅ OutboxEventPublisherAdapter: >70% coverage
- ✅ ProviderAdapters: >70% coverage

**And** Reporte generado en `target/site/jacoco/index.html`

---

## Technical Notes

### Framework y Librerías

- **Testcontainers**: Containers para PostgreSQL, Kafka
- **WireMock**: Mock HTTP servers para providers
- **JUnit 5**: Framework de testing
- **AssertJ**: Assertions fluidas
- **JaCoCo**: Coverage reporting

### Patrón de Testing

**Testcontainers con @Container estático**:
```java
@Testcontainers
class SignatureRepositoryAdapterTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("testdb")
        .withReuse(true); // Reuse container across tests
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @AfterEach
    void cleanup() {
        // Truncate tables for test isolation
    }
}
```

### Estructura de Tests

```
src/test/java/com/bank/signature/infrastructure/adapter/
├── outbound/
│   ├── persistence/
│   │   └── adapter/
│   │       └── SignatureRequestRepositoryAdapterTest.java
│   └── event/
│       └── OutboxEventPublisherAdapterTest.java (mejorar existente)
└── outbound/
    └── provider/
        └── ProviderAdapterTest.java (WireMock)
```

---

## Definition of Done

- [ ] `SignatureRepositoryAdapterTest.java` creado con 10+ tests (>70% coverage)
- [ ] `OutboxEventPublisherAdapterTest.java` completado/mejorado (>70% coverage)
- [ ] `ProviderAdapterTest.java` creado con 8+ tests (>70% coverage)
- [ ] Total: 15+ integration tests con Testcontainers
- [ ] JaCoCo reporta: Infrastructure layer >70% line coverage
- [ ] Todos los tests ejecutan en <30s total
- [ ] Tests son determinísticos (sin flakiness)
- [ ] Tests integrados en pipeline CI (Maven build)
- [ ] Documentado en TESTING.md

---

## Estimation

**Story Points**: 8 SP  
**Effort**: 3-4 días  
**Dependencies**: 
- Story 10.2 (Domain Layer Tests) debe estar completada
- Story 10.3 (Use Case Tests) debe estar completada
- Testcontainers dependency ya existe en pom.xml

---

## Related Stories

- **Story 10.2**: Domain Layer Tests (prerequisito)
- **Story 10.3**: Use Case Tests (prerequisito)
- **Story 5.1**: Outbox Pattern (ya tiene test parcial)

---

## Notes

- Los tests de integración usan containers reales (PostgreSQL, Kafka)
- WireMock simula providers externos (Twilio, FCM)
- Tests más lentos que unitarios pero validan funcionamiento real
- Coverage >70% es suficiente para infrastructure layer (más complejo que domain/application)
- Container reuse optimiza tiempo de ejecución

