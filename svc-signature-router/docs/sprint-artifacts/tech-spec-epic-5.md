# Technical Specification - Epic 5: Event-Driven Architecture

**Epic ID:** Epic-5  
**Epic Name:** Event-Driven Architecture  
**Author:** BMAD Architect (Arquímedes)  
**Date:** 2025-11-28  
**Version:** 1.0  
**Status:** Ready for Implementation  

---

## 1. Executive Summary

### 1.1 Goal

Implementar una arquitectura event-driven completa usando el patrón Outbox + Debezium CDC para garantizar entrega de eventos de dominio a Kafka con semántica **at-least-once**, eliminando la necesidad de publicar eventos síncronamente durante transacciones de negocio.

### 1.2 Business Value

- ✅ **Garantía de entrega**: 0% data loss - eventos persistidos en DB antes de publicar
- ✅ **Desacoplamiento**: Application layer NO depende de Kafka health
- ✅ **Atomicidad**: Cambio de estado + evento en misma transacción
- ✅ **Observabilidad**: Consumidores externos pueden trackear lifecycle completo
- ✅ **Compliance**: Audit trail completo de eventos para regulación bancaria

### 1.3 Technical Approach

```
┌─────────────────────────────────────────────────────────────┐
│  Application Layer (Use Cases)                               │
│                                                              │
│  1. Dominio publica evento → OutboxEventPublisher           │
│  2. Evento persistido en outbox_event table (misma TX)     │
│  3. Transacción commit → evento + estado garantizados      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Debezium CDC Connector (Change Data Capture)               │
│                                                              │
│  1. Lee PostgreSQL WAL (Write-Ahead Log)                    │
│  2. Detecta nuevos rows en outbox_event                     │
│  3. Transforma a Kafka event                                │
│  4. Publica a topic signature.events                        │
│  5. Actualiza published_at timestamp                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Kafka Cluster + Schema Registry                            │
│                                                              │
│  • Topic: signature.events (12 partitions, RF=3)            │
│  • Avro schemas con backward compatibility                  │
│  • Partitioning por aggregateId (ordering guarantee)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Consumers (Analytics, Notification, Audit, Fraud)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Functional Requirements Coverage

### 2.1 FR Mapping

| FR ID | Requirement | Implementation |
|-------|-------------|----------------|
| **FR39** | Persistir eventos en outbox table | `OutboxEventPublisher` → `outbox_event` table |
| **FR40** | Garantizar atomicidad (estado + evento, misma TX) | Spring `@Transactional` wraps domain + outbox insert |
| **FR41** | Publicar eventos a Kafka vía Debezium CDC | Debezium PostgreSQL Connector |
| **FR42** | Serializar eventos en Avro con schema validation | Confluent Avro Converter + Schema Registry |
| **FR43** | Particionar eventos por aggregate_id | Kafka partition key = `aggregateId` |
| **FR44** | Incluir trace_id en eventos | `correlationId` field en Avro schema |
| **FR45** | Publicar 8 tipos de eventos de dominio | Domain events ya existentes (Epic 2-4) |
| **FR46** | Almacenar hash de transaction context | `payload_hash` column (SHA-256) |

---

## 3. Architecture Components

### 3.1 Outbox Table Schema

**Ya implementado en** `docs/architecture/03-database-schema.md` (líneas 274-301).

```sql
CREATE TABLE outbox_event (
    id UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL DEFAULT 'SignatureRequest',
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    payload_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_created_at ON outbox_event(created_at ASC) 
    WHERE published_at IS NULL;
```

**Campos críticos:**
- `published_at`: NULL hasta que Debezium publique a Kafka
- `payload_hash`: SHA-256 del `transaction_context` para integridad
- `payload`: JSONB - evento Avro serializado

### 3.2 Domain Event Catalog

**Ya definido en** `docs/architecture/04-event-catalog.md`.

**8 Eventos de dominio:**
1. `SIGNATURE_REQUEST_CREATED`
2. `CHALLENGE_SENT`
3. `CHALLENGE_FAILED`
4. `PROVIDER_FAILED`
5. `SIGNATURE_COMPLETED`
6. `SIGNATURE_EXPIRED`
7. `SIGNATURE_ABORTED`
8. `ROUTING_RULE_CHANGED`

### 3.3 Avro Schema Structure

**Base Event Schema** (común a todos):

```json
{
  "namespace": "com.bank.signature.events",
  "type": "record",
  "name": "BaseEvent",
  "fields": [
    {"name": "eventId", "type": "string", "doc": "UUIDv7"},
    {"name": "aggregateId", "type": "string"},
    {"name": "eventType", "type": "string"},
    {"name": "occurredAt", "type": {"type": "long", "logicalType": "timestamp-millis"}},
    {"name": "version", "type": "string", "default": "1.0.0"},
    {"name": "correlationId", "type": ["null", "string"], "default": null}
  ]
}
```

**Ver schemas completos en:** `docs/architecture/04-event-catalog.md` (líneas 69-637).

---

## 4. Technology Stack

### 4.1 Core Dependencies

```xml
<dependencies>
    <!-- Debezium Embedded (opcional para testing) -->
    <dependency>
        <groupId>io.debezium</groupId>
        <artifactId>debezium-embedded</artifactId>
        <version>2.5.0.Final</version>
        <scope>test</scope>
    </dependency>
    
    <!-- Kafka Avro Serializer -->
    <dependency>
        <groupId>io.confluent</groupId>
        <artifactId>kafka-avro-serializer</artifactId>
        <version>7.5.0</version>
    </dependency>
    
    <!-- Avro -->
    <dependency>
        <groupId>org.apache.avro</groupId>
        <artifactId>avro</artifactId>
        <version>1.11.3</version>
    </dependency>
    
    <!-- Spring Kafka (ya presente) -->
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>
</dependencies>
```

### 4.2 Debezium Configuration

**Connector deployment:** Kafka Connect Cluster (standalone o distributed mode).

**Connector config:** `debezium-connector-config.json`

```json
{
  "name": "signature-outbox-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "tasks.max": "1",
    "database.hostname": "localhost",
    "database.port": "5432",
    "database.user": "signature_user",
    "database.password": "${DB_PASS}",
    "database.dbname": "signature_db",
    "database.server.name": "signature-server",
    "plugin.name": "pgoutput",
    
    "table.include.list": "public.outbox_event",
    "publication.name": "signature_outbox_publication",
    "publication.autocreate.mode": "filtered",
    
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.table.field.event.id": "id",
    "transforms.outbox.table.field.event.key": "aggregate_id",
    "transforms.outbox.table.field.event.type": "event_type",
    "transforms.outbox.table.field.event.payload": "payload",
    "transforms.outbox.table.field.event.timestamp": "created_at",
    "transforms.outbox.route.topic.replacement": "signature.events",
    
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "io.confluent.connect.avro.AvroConverter",
    "value.converter.schema.registry.url": "http://localhost:8081",
    
    "tombstones.on.delete": "false",
    "snapshot.mode": "never"
  }
}
```

---

## 5. Implementation Stories

### Story 5.1: Outbox Pattern Implementation

**Goal:** Implementar outbox table, JPA entity, y publisher adapter.

**Tasks:**
1. ✅ Outbox table ya existe (Story 1.2)
2. Crear `OutboxEventEntity` JPA entity
3. Crear `OutboxEventRepository` (Spring Data JPA)
4. Implementar `OutboxEventPublisher` (adapter)
5. Integrar con domain events existentes

**Acceptance Criteria:**
- AC1: Domain events persisten en `outbox_event` table en misma TX que aggregate
- AC2: `payload` column contiene evento serializado en JSON (Avro schema TBD)
- AC3: `payload_hash` = SHA-256 de `transactionContext`
- AC4: Integration test valida atomicidad (rollback → no event in outbox)

---

### Story 5.2: Debezium CDC Connector Setup

**Goal:** Deploy y configurar Debezium connector para publicar eventos a Kafka.

**Tasks:**
1. Crear PostgreSQL publication: `signature_outbox_publication`
2. Configurar Debezium connector (Kafka Connect)
3. Validar WAL settings en PostgreSQL
4. Deploy connector config vía Kafka Connect REST API
5. Monitoring: verificar connector status

**Acceptance Criteria:**
- AC1: Debezium connector en estado RUNNING
- AC2: Nuevos rows en `outbox_event` aparecen en Kafka topic `signature.events` en <5s
- AC3: `published_at` column actualizado tras publicación
- AC4: Connector survives PostgreSQL restart (replication slot persistente)

---

### Story 5.3: Kafka Event Publisher Adapter

**Goal:** Refactor event publishing para usar Outbox pattern en lugar de publicación directa.

**Tasks:**
1. Crear `EventPublisher` port (output port)
2. Implementar `OutboxEventPublisherAdapter` (usa OutboxEventRepository)
3. Reemplazar publicación directa en use cases (Epic 2/3/4)
4. Añadir `@Transactional` en use cases para atomicidad

**Acceptance Criteria:**
- AC1: `EventPublisher.publish(DomainEvent)` persiste en outbox (NO publica a Kafka)
- AC2: Use cases NO dependen de Kafka availability
- AC3: Si TX falla, evento NO se persiste (atomicidad)
- AC4: Hexagonal architecture preserved (domain no conoce outbox)

---

### Story 5.4: Avro Schema Definitions

**Goal:** Definir schemas Avro para los 8 eventos de dominio y registrarlos en Schema Registry.

**Tasks:**
1. Crear archivos `.avsc` para cada evento (8 schemas)
2. Registrar schemas en Schema Registry (manual o CI/CD)
3. Configurar backward compatibility mode
4. Crear `AvroEventMapper` (Domain Event → Avro GenericRecord)

**Acceptance Criteria:**
- AC1: 8 schemas Avro registrados en Schema Registry
- AC2: Compatibility mode = BACKWARD
- AC3: Schema evolution test: añadir campo nullable no rompe consumers
- AC4: AvroEventMapper convierte correctamente todos los eventos

---

### Story 5.5: Event Serialization/Deserialization

**Goal:** Serializar eventos a Avro antes de persistir en outbox.

**Tasks:**
1. Implementar `AvroSerializer` (Domain Event → byte[])
2. Implementar `AvroDeserializer` (byte[] → Domain Event) - para testing
3. Validar schema antes de serializar (fail-fast)
4. Integrar con `OutboxEventPublisher`

**Acceptance Criteria:**
- AC1: Eventos serializados a Avro binary format en `payload` JSONB
- AC2: Schema validation falla rápido si evento no conforme
- AC3: Deserializer puede reconstruir evento (round-trip test)
- AC4: Performance: serialización <10ms P99

---

### Story 5.6: Domain Event Catalog Implementation

**Goal:** Implementar factory para crear domain events desde aggregates.

**Tasks:**
1. Crear `DomainEventFactory` (static methods)
2. Refactor aggregates para usar factory
3. Añadir `correlationId` (trace ID) a todos los eventos
4. Crear builder pattern para eventos complejos

**Acceptance Criteria:**
- AC1: Todos los eventos incluyen `correlationId` desde MDC
- AC2: Factory methods type-safe (compile-time validation)
- AC3: EventFactory cubre los 8 tipos de eventos
- AC4: Unit tests validan estructura de cada evento

---

### Story 5.7: Event Ordering Guarantees

**Goal:** Garantizar ordenamiento per-aggregate usando Kafka partitioning.

**Tasks:**
1. Configurar partition key = `aggregateId` en Debezium
2. Validar que eventos del mismo SignatureRequest van a misma partición
3. Crear integration test para ordering
4. Documentar garantías de ordenamiento

**Acceptance Criteria:**
- AC1: Eventos con mismo `aggregateId` procesados en orden FIFO
- AC2: Topic `signature.events` tiene 12 partitions (paralelismo)
- AC3: Partition key = `aggregate_id` (configurado en Debezium transform)
- AC4: Test valida ordering: CREATE → SENT → COMPLETED en misma partición

---

## 6. Hexagonal Architecture Mapping

### 6.1 Domain Layer (`domain/`)

**NO changes** - dominio sigue puro, sin conocimiento de Kafka/Outbox.

**Domain Events:**
- `SignatureRequestCreated`
- `ChallengeSent`
- `ChallengeFailed`
- `ProviderFailed`
- `SignatureCompleted`
- `SignatureExpired`
- `SignatureAborted`
- `RoutingRuleChanged`

### 6.2 Application Layer (`application/`)

**Output Port:**
```java
package com.bank.signature.application.port.output;

public interface EventPublisher {
    void publish(DomainEvent event);
    void publishAll(List<DomainEvent> events);
}
```

### 6.3 Infrastructure Layer (`infrastructure/`)

**Outbound Adapter:**
```java
package com.bank.signature.infrastructure.adapter.outbound.event;

@Component
public class OutboxEventPublisherAdapter implements EventPublisher {
    
    private final OutboxEventRepository outboxRepository;
    private final AvroSerializer avroSerializer;
    
    @Override
    @Transactional(propagation = Propagation.MANDATORY) // MUST be in existing TX
    public void publish(DomainEvent event) {
        OutboxEventEntity outboxEvent = OutboxEventEntity.builder()
            .id(UuidCreator.getTimeOrderedEpoch())
            .aggregateId(event.getAggregateId())
            .aggregateType("SignatureRequest")
            .eventType(event.getEventType())
            .payload(avroSerializer.serialize(event))
            .payloadHash(hashTransactionContext(event))
            .createdAt(Instant.now())
            .build();
            
        outboxRepository.save(outboxEvent);
    }
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Target Coverage:** >90%

```java
@Test
void shouldPersistEventInOutboxWithinTransaction() {
    // Given
    SignatureRequest request = createTestRequest();
    SignatureRequestCreated event = new SignatureRequestCreated(request);
    
    // When
    eventPublisher.publish(event);
    
    // Then
    OutboxEvent saved = outboxRepository.findByAggregateId(request.getId());
    assertThat(saved.getEventType()).isEqualTo("SIGNATURE_REQUEST_CREATED");
    assertThat(saved.getPublishedAt()).isNull();
}
```

### 7.2 Integration Tests

**Testcontainers:** PostgreSQL + Kafka + Schema Registry

```java
@SpringBootTest
@Testcontainers
class OutboxPatternIT {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");
    
    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.5.0")
    );
    
    @Test
    void shouldGuaranteeAtomicity_whenTransactionRollback() {
        // Given
        SignatureRequest request = createTestRequest();
        
        // When - Simular rollback
        assertThrows(RuntimeException.class, () -> {
            signatureService.createWithError(request); // Lanza exception
        });
        
        // Then - NO event in outbox
        assertThat(outboxRepository.findByAggregateId(request.getId())).isEmpty();
    }
}
```

### 7.3 E2E Test (Debezium)

**Requiere Debezium connector running:**

```java
@Test
void shouldPublishEventToKafka_viaDebezium() {
    // Given
    SignatureRequest request = createTestRequest();
    
    // When
    signatureService.create(request);
    
    // Then - Verify outbox
    OutboxEvent outboxEvent = outboxRepository.findByAggregateId(request.getId());
    assertThat(outboxEvent).isNotNull();
    
    // And - Wait for Debezium to publish (max 10s)
    await().atMost(10, SECONDS).untilAsserted(() -> {
        ConsumerRecord<String, GenericRecord> kafkaRecord = 
            consumeEvent("signature.events");
        
        assertThat(kafkaRecord.key()).isEqualTo(request.getId().toString());
        assertThat(kafkaRecord.value().get("eventType"))
            .isEqualTo("SIGNATURE_REQUEST_CREATED");
    });
    
    // And - Verify published_at updated
    OutboxEvent published = outboxRepository.findByAggregateId(request.getId());
    assertThat(published.getPublishedAt()).isNotNull();
}
```

---

## 8. Monitoring & Observability

### 8.1 Metrics

```yaml
metrics:
  outbox:
    - outbox.events.created.total{event_type}
    - outbox.events.published.total{event_type}
    - outbox.events.pending{event_type}  # WHERE published_at IS NULL
    
  debezium:
    - debezium.connector.status  # RUNNING | FAILED
    - debezium.lag.seconds  # replication lag
    - debezium.records.produced.total
    
  kafka:
    - signature.events.records.lag{consumer_group}
    - signature.events.bytes.in.rate
```

### 8.2 Alerts

```yaml
alerts:
  - name: OutboxEventsNotPublished
    condition: COUNT(*) FROM outbox_event WHERE published_at IS NULL > 100
    severity: HIGH
    action: Check Debezium connector status
    
  - name: DebeziumConnectorDown
    condition: debezium.connector.status != RUNNING
    severity: CRITICAL
    action: Page on-call engineer
    
  - name: HighReplicationLag
    condition: debezium.lag.seconds > 30
    severity: MEDIUM
    action: Investigate PostgreSQL load
```

---

## 9. Deployment Strategy

### 9.1 Phase 1: Deploy Outbox (Stories 5.1, 5.3, 5.6)

1. Deploy outbox table (LiquidBase migration)
2. Deploy `OutboxEventPublisher` adapter
3. Update use cases to use outbox
4. **NO Kafka dependency yet** - events acumulan en outbox

**Rollback:** Feature flag para volver a publicación directa.

### 9.2 Phase 2: Deploy Debezium (Story 5.2)

1. Configure PostgreSQL publication
2. Deploy Debezium connector to Kafka Connect
3. Verify events flowing to Kafka
4. Backfill: publicar eventos pendientes

**Rollback:** Stop Debezium connector (eventos quedan en outbox).

### 9.3 Phase 3: Avro Schemas (Stories 5.4, 5.5)

1. Register Avro schemas in Schema Registry
2. Update serializer to use Avro
3. Deploy consumers expecting Avro format

**Rollback:** Revert to JSON payload (backward compatible).

### 9.4 Phase 4: Ordering Guarantees (Story 5.7)

1. Configure partition key in Debezium
2. Validate ordering in integration tests
3. Update consumer documentation

---

## 10. Security & Compliance

### 10.1 Data Privacy (GDPR/PCI-DSS)

```yaml
security:
  - NO PII in events: customerId pseudonymized
  - transactionContext hashed (SHA-256)
  - payload_hash for integrity validation
  - Kafka TLS encryption in transit
  - Kafka broker-side encryption at rest
```

### 10.2 Access Control

```yaml
kafka_acls:
  producer:
    principal: User:debezium-connector
    permissions:
      - WRITE on topic signature.events
      
  consumers:
    - principal: User:analytics-service
      permissions:
        - READ on topic signature.events
        - READ on group signature-analytics-group
```

---

## 11. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Outbox insert latency** | <5ms P99 | JPA insert time |
| **Debezium lag** | <5s P99 | Time from outbox insert to Kafka publish |
| **Event throughput** | 10K events/sec | Kafka topic throughput |
| **Storage overhead** | <100MB/day | Outbox table growth (before purge) |

---

## 12. Runbook

### 12.1 Common Issues

**Issue:** Debezium connector stuck in PAUSED state

**Resolution:**
```bash
# Check connector status
curl http://localhost:8083/connectors/signature-outbox-connector/status

# Restart connector
curl -X POST http://localhost:8083/connectors/signature-outbox-connector/restart

# Check PostgreSQL replication slot
SELECT * FROM pg_replication_slots WHERE slot_name = 'debezium';
```

**Issue:** outbox_event table growing unbounded

**Resolution:**
```sql
-- Purge published events older than 7 days
DELETE FROM outbox_event
WHERE published_at IS NOT NULL
  AND published_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
```

**Issue:** Schema Registry unreachable

**Resolution:**
```bash
# Check Schema Registry health
curl http://localhost:8081/subjects

# Fallback: use JSON serialization (degraded mode)
# Update debezium config: value.converter=JsonConverter
```

---

## 13. Dependencies & Prerequisites

### 13.1 Completed Stories (Prerequisites)

- ✅ **Story 1.2**: PostgreSQL + outbox_event table
- ✅ **Story 1.3**: Kafka + Schema Registry setup
- ✅ **Epic 2-4**: Domain events existentes

### 13.2 External Dependencies

- **Debezium**: Version 2.5.0+ (PostgreSQL connector)
- **Kafka Connect**: Distributed mode cluster (3+ nodes recommended)
- **PostgreSQL**: 12+ (logical replication support)
- **Schema Registry**: Confluent 7.5.0+

---

## 14. Acceptance Criteria (Epic Level)

**Epic 5 is DONE when:**

- ✅ AC1: Todos los domain events (8 tipos) persisten en `outbox_event` en misma TX que aggregate
- ✅ AC2: Debezium connector publica eventos a Kafka topic `signature.events` en <5s P99
- ✅ AC3: Avro schemas registrados y validation habilitada
- ✅ AC4: Eventos particionados por `aggregateId` (ordering guarantee)
- ✅ AC5: Zero data loss: outbox survives application crashes
- ✅ AC6: Integration tests validan atomicidad (rollback → no event)
- ✅ AC7: Monitoring dashboards para outbox lag y Debezium health
- ✅ AC8: Runbook documentado para troubleshooting

---

## 15. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Debezium connector failure | HIGH | MEDIUM | Alerting + auto-restart + runbook |
| Outbox table bloat | MEDIUM | HIGH | Automated purge job (cron) |
| Schema evolution breaking change | HIGH | LOW | Enforce BACKWARD compatibility mode |
| PostgreSQL WAL disk full | CRITICAL | LOW | Monitor WAL size + replication lag |

---

## 16. Follow-up Work (Post-Epic 5)

**Not in scope for Epic 5:**

- Consumer implementations (Analytics, Notification, Audit) → Future epic
- Event replay capability → Future feature
- Multi-datacenter replication → Not needed for MVP
- Event versioning strategy → Handled by Schema Registry

---

**Status:** ✅ **READY FOR IMPLEMENTATION**

**Next Actions:**
1. SM: Draft Story 5.1 (Outbox Pattern Implementation)
2. Dev: Implement stories sequentially (5.1 → 5.7)
3. QA: Validate each story against ACs before moving to next

---

_Technical Specification created by BMAD Architect_  
_Context: Epic 5 of 9 | Depends on: Epic 1-4 | Enables: Analytics & Audit consumers_

