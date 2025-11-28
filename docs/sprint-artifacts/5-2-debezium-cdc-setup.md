# Story 5.2: Debezium CDC Connector Setup

## 📋 Story Description

**As a** Platform Engineer  
**I want** Debezium CDC connector configured to read from outbox_event table  
**So that** domain events are automatically published to Kafka with transactional guarantees

## 🎯 Acceptance Criteria

### AC1: PostgreSQL Logical Replication Enabled
- [ ] PostgreSQL configured with `wal_level = logical`
- [ ] Publication created for `outbox_event` table
- [ ] Replication slot created for Debezium

### AC2: Debezium Connector Deployed
- [ ] Kafka Connect cluster running with Debezium PostgreSQL connector
- [ ] Connector configuration uses Outbox Event Router SMT
- [ ] Connector successfully connects to PostgreSQL and Schema Registry

### AC3: Event Transformation Configured
- [ ] Outbox Event Router SMT maps `event_type` → topic routing
- [ ] `aggregate_id` used as Kafka message key (partition key)
- [ ] `payload` field transformed to Avro schema
- [ ] `published_at` timestamp added to message envelope

### AC4: Topic Configuration
- [ ] Events published to `signature.events` topic
- [ ] Failed events routed to `signature.events.dlq`
- [ ] Topics created with correct partitioning (8 partitions by `aggregateId`)

### AC5: Monitoring & Observability
- [ ] Connector health metrics exposed
- [ ] Replication lag monitored (pending events in outbox)
- [ ] Scripts provided for deployment and status checking

---

## 🛠️ Technical Implementation

### 1. PostgreSQL Logical Replication Setup

**Migration: `V008__create_debezium_publication.sql`**

```sql
-- Enable logical replication (requires postgresql.conf: wal_level = logical)
CREATE PUBLICATION signature_outbox_publication FOR TABLE outbox_event;

-- Verify publication
SELECT * FROM pg_publication WHERE pubname = 'signature_outbox_publication';
```

**PostgreSQL Configuration (postgresql.conf):**
```ini
wal_level = logical
max_replication_slots = 4
max_wal_senders = 4
```

### 2. Kafka Connect with Debezium

**docker-compose.yml:**
```yaml
kafka-connect:
  image: debezium/connect:2.5
  ports:
    - "8083:8083"
  environment:
    BOOTSTRAP_SERVERS: 'kafka:29092'
    GROUP_ID: 'signature-connect-cluster'
    VALUE_CONVERTER: 'io.confluent.connect.avro.AvroConverter'
    VALUE_CONVERTER_SCHEMA_REGISTRY_URL: 'http://schema-registry:8081'
```

### 3. Debezium Connector Configuration

**File: `src/main/resources/debezium/connector-config.json`**

Key configurations:

```json
{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "database.hostname": "${DB_HOST}",
  "database.dbname": "signature_router",
  "table.include.list": "public.outbox_event",
  "publication.name": "signature_outbox_publication",
  
  "transforms": "outbox",
  "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
  "transforms.outbox.table.field.event.id": "id",
  "transforms.outbox.table.field.event.key": "aggregate_id",
  "transforms.outbox.table.field.event.type": "event_type",
  "transforms.outbox.table.field.event.payload": "payload",
  "transforms.outbox.route.topic.replacement": "signature.events"
}
```

**Outbox Event Router Transformation:**
- **Purpose**: Transforms outbox table rows into proper Kafka events
- **Input**: Row from `outbox_event` table (via CDC)
- **Output**: Kafka message with:
  - **Topic**: `signature.events` (from `route.topic.replacement`)
  - **Key**: `aggregate_id` (ensures ordering per aggregate)
  - **Value**: `payload` JSON → Avro schema
  - **Headers**: `eventId`, `eventType`, `occurredAt`, `publishedAt`

### 4. Deployment Scripts

**Deploy Connector: `docker/debezium/deploy-connector.sh`**
```bash
#!/bin/bash
KAFKA_CONNECT_URL="http://localhost:8083"
curl -X POST -H "Content-Type: application/json" \
  --data @connector-config.json \
  $KAFKA_CONNECT_URL/connectors
```

**Check Status: `docker/debezium/check-connector-status.sh`**
```bash
#!/bin/bash
# Check connector health, replication slot, pending events
curl http://localhost:8083/connectors/signature-outbox-connector/status | jq '.'
```

---

## 🔬 Testing Strategy

### Unit Tests
- N/A (infrastructure component, tested via integration tests)

### Integration Tests

**Test: `DebeziumIntegrationTest.java`**
```java
@SpringBootTest
@Testcontainers
class DebeziumIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withCommand("postgres -c wal_level=logical");
    
    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));
    
    @Container
    static GenericContainer<?> kafkaConnect = new GenericContainer<>("debezium/connect:2.5")
        .withEnv("BOOTSTRAP_SERVERS", kafka.getBootstrapServers())
        .withExposedPorts(8083);
    
    @Test
    void shouldPublishOutboxEventToKafka() {
        // Given: Event in outbox table
        OutboxEventEntity event = createTestEvent();
        outboxRepository.save(event);
        
        // When: Wait for Debezium to process
        await().atMost(10, SECONDS).until(() -> kafkaConsumer.poll(Duration.ofSeconds(1)).count() > 0);
        
        // Then: Event published to Kafka
        ConsumerRecords<String, GenericRecord> records = kafkaConsumer.poll(Duration.ofSeconds(5));
        assertThat(records.count()).isEqualTo(1);
        
        ConsumerRecord<String, GenericRecord> record = records.iterator().next();
        assertThat(record.topic()).isEqualTo("signature.events");
        assertThat(record.key()).isEqualTo(event.getAggregateId().toString());
        assertThat(record.value().get("eventType")).isEqualTo("SIGNATURE_COMPLETED");
    }
    
    @Test
    void shouldMaintainEventOrderingPerAggregate() {
        // Given: 3 events for same aggregate
        UUID aggregateId = UUID.randomUUID();
        outboxRepository.saveAll(List.of(
            createEvent(aggregateId, "EVENT_1"),
            createEvent(aggregateId, "EVENT_2"),
            createEvent(aggregateId, "EVENT_3")
        ));
        
        // When: Consume from Kafka
        List<ConsumerRecord<String, GenericRecord>> consumed = consumeAll();
        
        // Then: Events in correct order (same partition due to same key)
        assertThat(consumed).hasSize(3);
        assertThat(consumed.get(0).value().get("eventType")).isEqualTo("EVENT_1");
        assertThat(consumed.get(1).value().get("eventType")).isEqualTo("EVENT_2");
        assertThat(consumed.get(2).value().get("eventType")).isEqualTo("EVENT_3");
    }
}
```

### Manual Testing

**1. Deploy Connector:**
```bash
cd docker/debezium
./deploy-connector.sh
```

**2. Insert Test Event:**
```sql
INSERT INTO outbox_event (id, aggregate_id, aggregate_type, event_type, payload)
VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    'SignatureRequest',
    'SIGNATURE_COMPLETED',
    '{"requestId":"123","status":"COMPLETED"}'::jsonb
);
```

**3. Verify Kafka Topic:**
```bash
docker exec signature-router-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic signature.events \
  --from-beginning
```

**4. Check Connector Status:**
```bash
./check-connector-status.sh
```

---

## 📊 Monitoring & Alerts

### Prometheus Metrics

**Kafka Connect Metrics:**
```yaml
# Connector health
kafka_connect_connector_state{connector="signature-outbox-connector"} == 1  # RUNNING

# Task health
kafka_connect_connector_task_state{connector="signature-outbox-connector", task="0"} == 1

# Replication lag (from outbox query)
outbox_events_pending > 1000  # Alert if > 1000 pending events
```

### Grafana Dashboard

**Panel 1: Connector Health**
- Connector state (RUNNING / FAILED)
- Task state
- Last restart time

**Panel 2: Replication Lag**
```sql
SELECT COUNT(*) as lag 
FROM outbox_event 
WHERE published_at IS NULL
```

**Panel 3: Throughput**
- Events published/sec
- Average publish latency

---

## 🚨 Troubleshooting

### Issue: Connector Fails to Start

**Symptom:**
```json
{
  "state": "FAILED",
  "trace": "org.postgresql.util.PSQLException: ERROR: publication does not exist"
}
```

**Solution:**
```bash
# Verify publication exists
docker exec signature-router-postgres psql -U siguser -d signature_router \
  -c "SELECT * FROM pg_publication WHERE pubname = 'signature_outbox_publication';"

# If missing, run migration
liquibase update
```

### Issue: Replication Slot Not Created

**Symptom:**
```
ERROR: replication slot "debezium_signature_outbox" does not exist
```

**Solution:**
```sql
-- Check existing slots
SELECT * FROM pg_replication_slots;

-- Delete stale slot if exists
SELECT pg_drop_replication_slot('debezium_signature_outbox');

-- Restart connector (will recreate slot)
curl -X POST http://localhost:8083/connectors/signature-outbox-connector/restart
```

### Issue: Schema Registry Connection Failed

**Symptom:**
```
Failed to serialize Avro data: Schema Registry unreachable
```

**Solution:**
```bash
# Verify Schema Registry is running
curl http://localhost:8081/subjects

# Check Kafka Connect logs
docker logs kafka-connect | grep schema-registry

# Restart Kafka Connect
docker-compose restart kafka-connect
```

---

## 📚 References

- [Debezium PostgreSQL Connector Documentation](https://debezium.io/documentation/reference/2.5/connectors/postgresql.html)
- [Outbox Event Router SMT](https://debezium.io/documentation/reference/2.5/transformations/outbox-event-router.html)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/15/logical-replication.html)
- [Kafka Connect REST API](https://docs.confluent.io/platform/current/connect/references/restapi.html)

---

## ✅ Definition of Done

- [x] PostgreSQL publication created for outbox_event table
- [x] Debezium connector configuration file created
- [x] Kafka Connect service added to docker-compose.yml
- [x] Deployment scripts created (deploy-connector.sh, check-connector-status.sh)
- [x] Integration tests written and passing
- [x] Connector health monitored via Prometheus
- [x] Documentation completed
- [ ] Manual testing successful (deployment + event flow)
- [ ] Code review approved
- [ ] Merged to main branch

