# Story 5.1: Outbox Pattern Implementation

**Status:** 📝 Drafted  
**Epic:** Epic 5 - Event-Driven Architecture  
**Sprint:** TBD  
**Story Points:** 8  
**Priority:** HIGH  

---

## 📋 Story Description

**As a** Developer  
**I want** Implementar el patrón Outbox para persistir eventos de dominio  
**So that** Garantizamos entrega de eventos a Kafka con semántica at-least-once y atomicidad (estado + evento en misma TX)

---

## 🎯 Business Value

- **Zero data loss**: Eventos persistidos en DB antes de publicar a Kafka
- **Atomicidad**: Cambio de estado del agregado + evento en misma transacción
- **Desacoplamiento**: Application layer NO depende de Kafka health
- **Compliance**: Audit trail completo de eventos para regulación bancaria

---

## ✅ Acceptance Criteria

### AC1: Outbox JPA Entity Created
- [ ] `OutboxEventEntity` JPA entity created in `infrastructure.adapter.outbound.persistence`
- [ ] Fields: `id` (UUIDv7), `aggregateId`, `aggregateType`, `eventType`, `payload` (JSONB), `payloadHash`, `createdAt`, `publishedAt`
- [ ] Mapped to existing `outbox_event` table (created in Story 1.2)
- [ ] `@Table(name = "outbox_event")` annotation
- [ ] Lombok `@Entity`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`

### AC2: Outbox Repository Created
- [ ] `OutboxEventRepository` extends `JpaRepository<OutboxEventEntity, UUID>`
- [ ] Custom query: `findByAggregateIdOrderByCreatedAtAsc(UUID aggregateId)`
- [ ] Custom query: `findByPublishedAtIsNull()` - eventos pendientes de publicar
- [ ] Custom query: `countByPublishedAtIsNull()` - métrica de lag

### AC3: EventPublisher Port Defined
- [ ] Interface `EventPublisher` created in `application.port.output`
- [ ] Methods:
  - `void publish(DomainEvent event)`
  - `void publishAll(List<DomainEvent> events)`
- [ ] Generic `DomainEvent` interface with methods: `getAggregateId()`, `getEventType()`, `getOccurredAt()`

### AC4: OutboxEventPublisher Adapter Implemented
- [ ] `OutboxEventPublisherAdapter` implements `EventPublisher`
- [ ] Annotated with `@Component`
- [ ] Constructor injection: `OutboxEventRepository`, `ObjectMapper`, `CorrelationIdProvider`
- [ ] `publish()` method:
  - Creates `OutboxEventEntity` from `DomainEvent`
  - Serializes event payload to JSON (JSONB)
  - Generates `payloadHash` = SHA-256 of payload
  - Saves to `outbox_event` table
  - Annotated with `@Transactional(propagation = Propagation.MANDATORY)` - MUST be in existing TX

### AC5: DomainEvent Base Interface
- [ ] `DomainEvent` interface created in `domain.event`
- [ ] Methods:
  - `UUID getEventId()`
  - `UUID getAggregateId()`
  - `String getAggregateType()`
  - `String getEventType()`
  - `Instant getOccurredAt()`
  - `String getCorrelationId()`
- [ ] Default method: `String getVersion()` returns "1.0.0"

### AC6: Existing Domain Events Implement DomainEvent
- [ ] Refactor existing events to implement `DomainEvent`:
  - `SignatureRequestCreated`
  - `ChallengeSent`
  - `ChallengeFailed`
  - `ProviderFailed`
  - `SignatureCompleted`
  - `SignatureExpired`
  - `SignatureAborted`
  - `CircuitBreakerOpened` (from Epic 4)
- [ ] Add `eventId` (UUIDv7) field to each event
- [ ] Add `correlationId` field (from MDC or request header)

### AC7: Integrate with Use Cases
- [ ] Refactor use cases to use `EventPublisher` instead of direct Kafka publishing:
  - `StartSignatureUseCaseImpl`
  - `CompleteSignatureUseCaseImpl`
  - `AbortSignatureUseCaseImpl`
  - `SendChallengeService`
- [ ] Add `@Transactional` annotation to use case methods
- [ ] Events published AFTER aggregate persisted (same TX)

### AC8: Correlation ID Propagation
- [ ] Create `CorrelationIdProvider` utility
- [ ] Extract correlation ID from MDC (set by filter)
- [ ] Include correlation ID in all domain events
- [ ] Fallback: generate new UUID if MDC empty

### AC9: Unit Tests
- [ ] `OutboxEventPublisherAdapterTest`:
  - Should persist event in outbox with correct fields
  - Should serialize payload to JSON correctly
  - Should generate SHA-256 hash of payload
  - Should throw exception if not in transaction (Propagation.MANDATORY)
- [ ] `DomainEventTest`:
  - Validate all events implement `DomainEvent` interface
  - Validate correlation ID propagation
- [ ] Coverage >85%

### AC10: Integration Tests
- [ ] `OutboxPatternIT` with `@Testcontainers`:
  - Should save event to outbox_event table
  - Should guarantee atomicidad: TX rollback → no event in outbox
  - Should persist multiple events in same TX
  - Verify `published_at` is NULL (will be set by Debezium in Story 5.2)
- [ ] Testcontainers PostgreSQL 15
- [ ] All tests pass

### AC11: Metrics
- [ ] Prometheus metrics exposed:
  - `outbox.events.created.total{event_type}` - Counter de eventos creados
  - `outbox.events.pending` - Gauge de eventos pendientes (WHERE published_at IS NULL)
  - `outbox.publish.duration.seconds` - Histogram de latencia de publicación
- [ ] Metrics endpoint `/actuator/prometheus` includes outbox metrics

### AC12: Documentation
- [ ] JavaDoc en `EventPublisher` port
- [ ] JavaDoc en `OutboxEventPublisherAdapter`
- [ ] README update: explain Outbox pattern usage
- [ ] Architecture diagram updated: show Outbox flow

---

## 🏗️ Technical Implementation

### Domain Layer

#### DomainEvent Interface
**File:** `src/main/java/com/bank/signature/domain/event/DomainEvent.java`

```java
package com.singularbank.signature.routing.domain.event;

import java.time.Instant;
import java.util.UUID;

public interface DomainEvent {
    UUID getEventId();
    UUID getAggregateId();
    String getAggregateType();
    String getEventType();
    Instant getOccurredAt();
    String getCorrelationId();
    
    default String getVersion() {
        return "1.0.0";
    }
}
```

#### SignatureRequestCreated (Refactored)
**File:** `src/main/java/com/bank/signature/domain/event/SignatureRequestCreated.java`

```java
package com.singularbank.signature.routing.domain.event;

import com.singularbank.signature.routing.domain.model.SignatureRequest;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class SignatureRequestCreated implements DomainEvent {
    UUID eventId;
    UUID aggregateId;
    String customerId;  // pseudonymized
    String transactionContextHash;
    String requestedChannel;
    String riskLevel;
    Instant occurredAt;
    String correlationId;
    
    @Override
    public String getAggregateType() {
        return "SignatureRequest";
    }
    
    @Override
    public String getEventType() {
        return "SIGNATURE_REQUEST_CREATED";
    }
    
    public static SignatureRequestCreated from(SignatureRequest request, String correlationId) {
        return SignatureRequestCreated.builder()
            .eventId(UuidCreator.getTimeOrderedEpoch())
            .aggregateId(request.getId())
            .customerId(request.getCustomerId())
            .transactionContextHash(request.getTransactionContextHash())
            .requestedChannel(request.getRoutingTimeline().get(0).getTargetChannel().name())
            .riskLevel(request.getTransactionContext().getRiskLevel())
            .occurredAt(Instant.now())
            .correlationId(correlationId)
            .build();
    }
}
```

### Application Layer

#### EventPublisher Port
**File:** `src/main/java/com/bank/signature/application/port/output/EventPublisher.java`

```java
package com.singularbank.signature.routing.application.port.output;

import com.singularbank.signature.routing.domain.event.DomainEvent;

import java.util.List;

public interface EventPublisher {
    /**
     * Publish a single domain event to the outbox table.
     * MUST be called within an active transaction.
     * 
     * @param event Domain event to publish
     * @throws IllegalStateException if no transaction active (Propagation.MANDATORY)
     */
    void publish(DomainEvent event);
    
    /**
     * Publish multiple domain events in batch.
     * MUST be called within an active transaction.
     * 
     * @param events List of domain events to publish
     */
    void publishAll(List<DomainEvent> events);
}
```

### Infrastructure Layer

#### OutboxEventEntity (JPA)
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/persistence/OutboxEventEntity.java`

```java
package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "outbox_event")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxEventEntity {
    
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "aggregate_id", nullable = false, columnDefinition = "uuid")
    private UUID aggregateId;
    
    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;
    
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;
    
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String payload;  // JSON string
    
    @Column(name = "payload_hash", length = 64)
    private String payloadHash;  // SHA-256
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    
    @Column(name = "published_at")
    private Instant publishedAt;  // NULL until Debezium publishes
}
```

#### OutboxEventRepository
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/persistence/OutboxEventRepository.java`

```java
package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, UUID> {
    
    List<OutboxEventEntity> findByAggregateIdOrderByCreatedAtAsc(UUID aggregateId);
    
    List<OutboxEventEntity> findByPublishedAtIsNull();
    
    @Query("SELECT COUNT(o) FROM OutboxEventEntity o WHERE o.publishedAt IS NULL")
    long countPendingEvents();
}
```

#### OutboxEventPublisherAdapter
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/event/OutboxEventPublisherAdapter.java`

```java
package com.singularbank.signature.routing.infrastructure.adapter.outbound.event;

import com.singularbank.signature.routing.application.port.output.EventPublisher;
import com.singularbank.signature.routing.domain.event.DomainEvent;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.OutboxEventEntity;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.f4b6a3.uuid.UuidCreator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxEventPublisherAdapter implements EventPublisher {
    
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void publish(DomainEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            String payloadHash = sha256(payload);
            
            OutboxEventEntity outboxEvent = OutboxEventEntity.builder()
                .id(UuidCreator.getTimeOrderedEpoch())
                .aggregateId(event.getAggregateId())
                .aggregateType(event.getAggregateType())
                .eventType(event.getEventType())
                .payload(payload)
                .payloadHash(payloadHash)
                .createdAt(Instant.now())
                .publishedAt(null)  // Will be set by Debezium
                .build();
            
            outboxRepository.save(outboxEvent);
            
            log.debug("Event persisted to outbox: eventType={}, aggregateId={}, eventId={}", 
                event.getEventType(), event.getAggregateId(), event.getEventId());
                
        } catch (Exception e) {
            log.error("Failed to persist event to outbox: eventType={}, aggregateId={}", 
                event.getEventType(), event.getAggregateId(), e);
            throw new RuntimeException("Failed to publish event to outbox", e);
        }
    }
    
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void publishAll(List<DomainEvent> events) {
        events.forEach(this::publish);
    }
    
    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute SHA-256 hash", e);
        }
    }
}
```

#### CorrelationIdProvider
**File:** `src/main/java/com/bank/signature/infrastructure/util/CorrelationIdProvider.java`

```java
package com.singularbank.signature.routing.infrastructure.util;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CorrelationIdProvider {
    
    private static final String CORRELATION_ID_KEY = "correlationId";
    
    public String getCorrelationId() {
        String correlationId = MDC.get(CORRELATION_ID_KEY);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
            MDC.put(CORRELATION_ID_KEY, correlationId);
        }
        return correlationId;
    }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

#### OutboxEventPublisherAdapterTest
**File:** `src/test/java/com/bank/signature/infrastructure/adapter/outbound/event/OutboxEventPublisherAdapterTest.java`

```java
@ExtendWith(MockitoExtension.class)
class OutboxEventPublisherAdapterTest {
    
    @Mock
    private OutboxEventRepository outboxRepository;
    
    @Mock
    private ObjectMapper objectMapper;
    
    @InjectMocks
    private OutboxEventPublisherAdapter publisher;
    
    @Test
    void shouldPersistEventToOutbox() throws Exception {
        // Given
        DomainEvent event = createTestEvent();
        String expectedJson = "{\"eventId\":\"...\"}";
        when(objectMapper.writeValueAsString(event)).thenReturn(expectedJson);
        
        // When
        publisher.publish(event);
        
        // Then
        ArgumentCaptor<OutboxEventEntity> captor = ArgumentCaptor.forClass(OutboxEventEntity.class);
        verify(outboxRepository).save(captor.capture());
        
        OutboxEventEntity saved = captor.getValue();
        assertThat(saved.getAggregateId()).isEqualTo(event.getAggregateId());
        assertThat(saved.getEventType()).isEqualTo("SIGNATURE_REQUEST_CREATED");
        assertThat(saved.getPayload()).isEqualTo(expectedJson);
        assertThat(saved.getPayloadHash()).hasSize(64); // SHA-256 hex
        assertThat(saved.getPublishedAt()).isNull();
    }
    
    @Test
    void shouldGenerateCorrectSha256Hash() {
        // Given
        String payload = "{\"test\":\"value\"}";
        
        // When
        String hash = sha256(payload);
        
        // Then
        assertThat(hash).hasSize(64);
        assertThat(hash).matches("[a-f0-9]{64}");
    }
}
```

### Integration Tests

#### OutboxPatternIT
**File:** `src/test/java/com/bank/signature/infrastructure/adapter/outbound/event/OutboxPatternIT.java`

```java
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class OutboxPatternIT {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("signature_test")
        .withUsername("test")
        .withPassword("test");
    
    @Autowired
    private EventPublisher eventPublisher;
    
    @Autowired
    private OutboxEventRepository outboxRepository;
    
    @Autowired
    private TransactionTemplate transactionTemplate;
    
    @Test
    void shouldPersistEventInOutboxWithinTransaction() {
        // Given
        DomainEvent event = createSignatureRequestCreatedEvent();
        
        // When
        transactionTemplate.execute(status -> {
            eventPublisher.publish(event);
            return null;
        });
        
        // Then
        List<OutboxEventEntity> events = outboxRepository.findByAggregateId(event.getAggregateId());
        assertThat(events).hasSize(1);
        
        OutboxEventEntity saved = events.get(0);
        assertThat(saved.getEventType()).isEqualTo("SIGNATURE_REQUEST_CREATED");
        assertThat(saved.getPublishedAt()).isNull();
        assertThat(saved.getPayloadHash()).isNotBlank();
    }
    
    @Test
    void shouldRollbackEventWhenTransactionFails() {
        // Given
        DomainEvent event = createSignatureRequestCreatedEvent();
        
        // When - Simulate rollback
        assertThrows(RuntimeException.class, () -> {
            transactionTemplate.execute(status -> {
                eventPublisher.publish(event);
                throw new RuntimeException("Simulated failure");
            });
        });
        
        // Then - NO event in outbox
        List<OutboxEventEntity> events = outboxRepository.findByAggregateId(event.getAggregateId());
        assertThat(events).isEmpty();
    }
    
    @Test
    void shouldPersistMultipleEventsInSameTransaction() {
        // Given
        DomainEvent event1 = createSignatureRequestCreatedEvent();
        DomainEvent event2 = createChallengeSentEvent();
        
        // When
        transactionTemplate.execute(status -> {
            eventPublisher.publish(event1);
            eventPublisher.publish(event2);
            return null;
        });
        
        // Then
        long count = outboxRepository.count();
        assertThat(count).isEqualTo(2);
    }
}
```

---

## 📊 Metrics

### Prometheus Metrics

```yaml
# Counter: Total events created per type
outbox.events.created.total{event_type="SIGNATURE_REQUEST_CREATED"} 1543

# Gauge: Pending events (published_at IS NULL)
outbox.events.pending 12

# Histogram: Publish duration
outbox.publish.duration.seconds_count 1543
outbox.publish.duration.seconds_sum 7.234
outbox.publish.duration.seconds{quantile="0.99"} 0.005
```

### Grafana Dashboard Panels

1. **Events Created Rate** (Counter rate)
2. **Pending Events** (Gauge)
3. **Publish Latency P99** (Histogram)
4. **Events by Type** (Pie chart)

---

## 🔗 Dependencies

### Prerequisites

- ✅ **Story 1.2**: `outbox_event` table created via LiquidBase
- ✅ **Epic 2-4**: Domain events existentes

### Maven Dependencies

```xml
<!-- UUIDv7 generation -->
<dependency>
    <groupId>com.github.f4b6a3</groupId>
    <artifactId>uuid-creator</artifactId>
    <version>5.3.2</version>
</dependency>

<!-- JSON serialization (already present) -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

---

## 📝 Implementation Tasks

- [ ] **Task 1**: Create `DomainEvent` interface in `domain.event`
- [ ] **Task 2**: Refactor existing domain events to implement `DomainEvent`
- [ ] **Task 3**: Create `OutboxEventEntity` JPA entity
- [ ] **Task 4**: Create `OutboxEventRepository`
- [ ] **Task 5**: Create `EventPublisher` port
- [ ] **Task 6**: Implement `OutboxEventPublisherAdapter`
- [ ] **Task 7**: Create `CorrelationIdProvider`
- [ ] **Task 8**: Integrate with use cases (replace direct Kafka publishing)
- [ ] **Task 9**: Write unit tests (>85% coverage)
- [ ] **Task 10**: Write integration tests (Testcontainers)
- [ ] **Task 11**: Add Prometheus metrics
- [ ] **Task 12**: Update documentation

---

## 🎯 Definition of Done

- [ ] All acceptance criteria met (AC1-AC12)
- [ ] All tasks completed and checked
- [ ] Unit tests pass (>85% coverage)
- [ ] Integration tests pass with Testcontainers
- [ ] No regression: all existing tests pass
- [ ] Code reviewed by SM
- [ ] Prometheus metrics operational
- [ ] Documentation updated
- [ ] Story deployed to DEV environment
- [ ] Manual smoke test passed

---

## 📚 References

- **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-5.md`
- **Architecture:** `docs/architecture/04-event-catalog.md`
- **Database Schema:** `docs/architecture/03-database-schema.md` (outbox_event table)
- **Outbox Pattern:** https://microservices.io/patterns/data/transactional-outbox.html

---

## 🚨 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Transaction propagation misconfiguration | HIGH | Integration tests validate atomicity |
| Outbox table bloat | MEDIUM | Purge job in Story 5.2 (Debezium updates `published_at`) |
| JSON serialization failure | MEDIUM | Try-catch + log error + throw runtime exception |

---

**Story Created:** 2025-11-28  
**Created By:** BMAD PM (John)  
**Next Story:** 5.2 - Debezium CDC Connector Setup  

---

## Dev Agent Record

### Context Reference
- **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-5.md`
- **Architecture:** `docs/architecture/04-event-catalog.md`

### Implementation Notes
- Use `Propagation.MANDATORY` for `@Transactional` in publisher
- UUIDv7 for `eventId` (sortable, performance)
- SHA-256 hash for payload integrity
- Correlation ID from MDC (set by `CorrelationFilter`)

### Pre-Implementation Checklist
- [ ] Read tech spec epic-5
- [ ] Read event catalog architecture doc
- [ ] Verify outbox_event table exists in DB schema
- [ ] Review existing domain events (Epic 2-4)

---

_Story drafted by BMAD Method - Ready for Implementation_ 🚀

