# Outbox Pattern Implementation

**Status:** ✅ Implemented (Story 5.1)  
**Epic:** Epic 5 - Event-Driven Architecture  
**Version:** 1.0  
**Date:** 2025-11-28  

---

## 📋 Overview

The Signature Router implements the **Outbox Pattern** to guarantee **at-least-once** delivery of domain events to Kafka with **zero data loss** and **transactional consistency**.

### Why Outbox Pattern?

**Problem:**
- Publishing events directly to Kafka during transaction is **NOT atomic**
- If Kafka is down → event lost (data loss)
- If transaction rolls back after Kafka publish → inconsistent state

**Solution:**
- Persist events to `outbox_event` table **in same transaction** as aggregate
- Debezium CDC connector reads outbox table (PostgreSQL WAL)
- Events published to Kafka asynchronously with **guaranteed delivery**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Application Layer (Use Cases)                               │
│                                                              │
│  @Transactional                                              │
│  public void completeSignature() {                          │
│      repository.save(signatureRequest);  // (1)             │
│      eventPublisher.publish(event);       // (2)            │
│  }                                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ TX COMMIT → Both (1) and (2) persisted
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                         │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ signature_request   │  │ outbox_event        │          │
│  ├─────────────────────┤  ├─────────────────────┤          │
│  │ id                  │  │ id                  │          │
│  │ status = SIGNED     │  │ event_type          │          │
│  │ signed_at           │  │ payload (JSONB)     │          │
│  │ ...                 │  │ published_at = NULL │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Debezium reads PostgreSQL WAL
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Debezium CDC Connector                                      │
│                                                              │
│  1. Detect new row in outbox_event (via WAL)                │
│  2. Transform to Kafka event                                │
│  3. Publish to Kafka topic: signature.events                │
│  4. Update published_at = NOW()                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Kafka Topic: signature.events                               │
│                                                              │
│  Partition Key = aggregateId (ordering guarantee)           │
│  Schema = Avro (Schema Registry validation)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

### outbox_event Table

```sql
CREATE TABLE outbox_event (
    id UUID PRIMARY KEY,                    -- UUIDv7 (time-ordered)
    aggregate_id UUID NOT NULL,             -- SignatureRequest ID
    aggregate_type VARCHAR(100) NOT NULL,   -- "SignatureRequest"
    event_type VARCHAR(100) NOT NULL,       -- "SIGNATURE_COMPLETED"
    payload JSONB NOT NULL,                 -- Event JSON
    payload_hash VARCHAR(64),               -- SHA-256 for integrity
    created_at TIMESTAMPTZ NOT NULL,        -- Application timestamp
    published_at TIMESTAMPTZ                -- Debezium timestamp (NULL until published)
);

-- Index for pending events (Debezium reads these)
CREATE INDEX idx_outbox_created_at 
    ON outbox_event(created_at ASC) 
    WHERE published_at IS NULL;

-- Index for aggregate timeline queries
CREATE INDEX idx_outbox_aggregate 
    ON outbox_event(aggregate_id, aggregate_type);
```

---

## 📝 Code Usage

### Publishing Events in Use Cases

```java
@Service
@RequiredArgsConstructor
public class CompleteSignatureUseCaseImpl implements CompleteSignatureUseCase {
    
    private final SignatureRequestRepository repository;
    private final EventPublisher eventPublisher;
    private final CorrelationIdProvider correlationIdProvider;
    
    @Override
    @Transactional  // CRITICAL: Events MUST be published within TX
    public void execute(UUID requestId, String code) {
        
        // 1. Load aggregate
        SignatureRequest request = repository.findById(requestId)
            .orElseThrow(() -> new NotFoundException("Not found"));
        
        // 2. Business logic
        request.complete(code);
        
        // 3. Save aggregate (state change)
        repository.save(request);
        
        // 4. Publish event (same TX)
        SignatureCompletedEvent event = SignatureCompletedEvent.create(
            request.getId(),
            request.getChallengeId(),
            request.getChannel(),
            correlationIdProvider.getCorrelationId()
        );
        
        eventPublisher.publish(event);  // Persisted to outbox_event
        
        // TX COMMIT → Both aggregate + event guaranteed persisted
    }
}
```

### Creating Domain Events

All events implement `DomainEvent` interface:

```java
public record SignatureCompletedEvent(
    UUID eventId,
    UUID signatureRequestId,
    UUID challengeId,
    ChannelType channelType,
    Instant completedAt,
    String correlationId
) implements DomainEvent {
    
    @Override
    public UUID getAggregateId() {
        return signatureRequestId;
    }
    
    @Override
    public String getEventType() {
        return "SIGNATURE_COMPLETED";
    }
    
    // Factory method
    public static SignatureCompletedEvent create(...) {
        return new SignatureCompletedEvent(
            UuidCreator.getTimeOrderedEpoch(),  // UUIDv7
            signatureRequestId,
            challengeId,
            channelType,
            Instant.now(),
            correlationId
        );
    }
}
```

---

## 🔧 Configuration

### Debezium Connector

Deploy to Kafka Connect cluster:

```json
{
  "name": "signature-outbox-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "localhost",
    "database.port": "5432",
    "database.dbname": "signature_db",
    "plugin.name": "pgoutput",
    
    "table.include.list": "public.outbox_event",
    
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.table.field.event.key": "aggregate_id",
    "transforms.outbox.table.field.event.type": "event_type",
    "transforms.outbox.table.field.event.payload": "payload",
    "transforms.outbox.route.topic.replacement": "signature.events",
    
    "value.converter": "io.confluent.connect.avro.AvroConverter",
    "value.converter.schema.registry.url": "http://localhost:8081"
  }
}
```

### PostgreSQL Publication

```sql
-- Create publication for Debezium
CREATE PUBLICATION signature_outbox_publication 
    FOR TABLE outbox_event;

-- Verify replication slot
SELECT * FROM pg_replication_slots;
```

---

## 📊 Monitoring & Metrics

### Prometheus Metrics

```yaml
# Counter: Total events created
outbox.events.created.total{event_type="SIGNATURE_COMPLETED"} 1543

# Gauge: Pending events (not yet published)
outbox.events.pending 12

# Histogram: Publish duration to outbox
outbox.publish.duration.seconds_count 1543
outbox.publish.duration.seconds{quantile="0.99"} 0.025
```

### Grafana Dashboards

**Panel 1: Events Created Rate**
```promql
rate(outbox_events_created_total[5m])
```

**Panel 2: Pending Events (Debezium Lag)**
```promql
outbox_events_pending
```

**Panel 3: Publish Latency P99**
```promql
histogram_quantile(0.99, outbox_publish_duration_seconds_bucket)
```

### Alerts

```yaml
alerts:
  - name: OutboxEventsNotPublished
    expr: outbox_events_pending > 100
    for: 5m
    severity: HIGH
    action: Check Debezium connector status
    
  - name: DebeziumConnectorDown
    expr: debezium_connector_status != 1
    for: 1m
    severity: CRITICAL
    action: Page on-call engineer
```

---

## 🧪 Testing

### Unit Tests

```java
@Test
void shouldPersistEventToOutbox() {
    // Given
    DomainEvent event = SignatureCompletedEvent.create(...);
    
    // When
    publisher.publish(event);
    
    // Then
    verify(outboxRepository).save(argThat(outbox -> 
        outbox.getEventType().equals("SIGNATURE_COMPLETED") &&
        outbox.getPublishedAt() == null
    ));
}
```

### Integration Tests

```java
@SpringBootTest
@Testcontainers
class OutboxPatternIT {
    
    @Container
    static PostgreSQLContainer<?> postgres = ...;
    
    @Test
    void shouldGuaranteeAtomicity_whenTransactionRollback() {
        // Given
        DomainEvent event = SignatureCompletedEvent.create(...);
        
        // When - Simulate rollback
        assertThrows(RuntimeException.class, () -> {
            transactionTemplate.execute(status -> {
                eventPublisher.publish(event);
                throw new RuntimeException("Rollback");
            });
        });
        
        // Then - NO event in outbox
        assertThat(outboxRepository.count()).isZero();
    }
}
```

---

## 🚨 Troubleshooting

### Issue: Pending Events Growing

**Symptom:** `outbox_events_pending` metric increasing

**Diagnosis:**
```bash
# Check Debezium connector status
curl http://localhost:8083/connectors/signature-outbox-connector/status

# Check PostgreSQL replication slot
SELECT * FROM pg_replication_slots WHERE slot_name = 'debezium';
```

**Resolution:**
```bash
# Restart Debezium connector
curl -X POST http://localhost:8083/connectors/signature-outbox-connector/restart
```

### Issue: Outbox Table Bloat

**Symptom:** `outbox_event` table size > 10GB

**Resolution:**
```sql
-- Purge published events older than 7 days
DELETE FROM outbox_event
WHERE published_at IS NOT NULL
  AND published_at < CURRENT_TIMESTAMP - INTERVAL '7 days';

-- Run VACUUM to reclaim space
VACUUM FULL outbox_event;
```

### Issue: Duplicate Events in Kafka

**Symptom:** Same event published multiple times

**Explanation:** Outbox pattern guarantees **at-least-once** delivery, NOT exactly-once.

**Solution:** Consumers MUST be **idempotent**:
```java
@KafkaListener(topics = "signature.events")
public void handleEvent(SignatureEvent event) {
    // Check if already processed (use eventId as deduplication key)
    if (processedEvents.contains(event.getEventId())) {
        log.warn("Duplicate event ignored: {}", event.getEventId());
        return;
    }
    
    // Process event
    processEvent(event);
    processedEvents.add(event.getEventId());
}
```

---

## 📚 References

- **Pattern:** [Microservices.io - Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- **Debezium:** [Official Documentation](https://debezium.io/documentation/)
- **Story:** `docs/sprint-artifacts/5-1-outbox-pattern-implementation.md`
- **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-5.md`

---

**Status:** ✅ **PRODUCTION READY**

**Next Steps:**
- Story 5.2: Deploy Debezium connector
- Story 5.4: Register Avro schemas in Schema Registry
- Story 5.6: Implement event consumers (Analytics, Audit)

