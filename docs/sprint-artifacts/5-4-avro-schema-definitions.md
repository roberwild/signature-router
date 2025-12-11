# Story 5.4: Avro Schema Definitions

## 📋 Story Description

**As a** Platform Engineer  
**I want** Avro schemas defined for all domain events  
**So that** events published to Kafka have strong schema contracts and evolution guarantees

## 🎯 Acceptance Criteria

### AC1: Base Event Schema Defined
- [ ] `BaseEvent.avsc` schema created with common fields (eventId, eventType, occurredAt, aggregateId, correlationId, version)
- [ ] Schema uses logical types (UUID, timestamp-millis)
- [ ] Schema registered in Confluent Schema Registry

### AC2: Domain Event Schemas Defined
- [ ] `SignatureRequestCreatedEvent.avsc` (FR39)
- [ ] `ChallengeSentEvent.avsc` (FR40)
- [ ] `ChallengeFailedEvent.avsc` (FR41)
- [ ] `ProviderFailedEvent.avsc` (FR42)
- [ ] `SignatureCompletedEvent.avsc` (FR43)
- [ ] `SignatureExpiredEvent.avsc` (FR44)
- [ ] `SignatureAbortedEvent.avsc` (FR45)
- [ ] `CircuitBreakerOpenedEvent.avsc` (FR46)
- [ ] `CircuitBreakerClosedEvent.avsc` (FR46)

### AC3: Schema Evolution Strategy Configured
- [ ] Compatibility mode set to `BACKWARD` in Schema Registry
- [ ] Schemas use default values for optional fields
- [ ] Schemas follow semantic versioning (`version` field)

### AC4: Maven Build Integration
- [ ] Avro Maven Plugin configured to generate Java classes from schemas
- [ ] Generated classes placed in `target/generated-sources/avro`
- [ ] Build generates immutable POJOs with builders

### AC5: Schema Registry Setup
- [ ] Scripts provided to register schemas (`register-schemas.sh`)
- [ ] Scripts provided to check schemas (`check-schemas.sh`)
- [ ] Scripts provided to set compatibility mode (`set-compatibility.sh`)

---

## 🛠️ Technical Implementation

### 1. Avro Schema Files

**Location:** `src/main/resources/avro/`

**Base Event Schema (`BaseEvent.avsc`):**
```json
{
  "type": "record",
  "name": "BaseEvent",
  "namespace": "com.singularbank.signature.routing.events.avro",
  "fields": [
    {"name": "eventId", "type": "string", "logicalType": "uuid"},
    {"name": "eventType", "type": "string"},
    {"name": "occurredAt", "type": "long", "logicalType": "timestamp-millis"},
    {"name": "aggregateId", "type": "string", "logicalType": "uuid"},
    {"name": "aggregateType", "type": "string", "default": "SignatureRequest"},
    {"name": "correlationId", "type": ["null", "string"], "default": null},
    {"name": "version", "type": "int", "default": 1}
  ]
}
```

**Domain Event Example (`SignatureCompletedEvent.avsc`):**
```json
{
  "type": "record",
  "name": "SignatureCompletedEvent",
  "namespace": "com.singularbank.signature.routing.events.avro",
  "fields": [
    ...base fields...,
    {
      "name": "payload",
      "type": {
        "type": "record",
        "name": "SignatureCompletedPayload",
        "fields": [
          {"name": "requestId", "type": "string", "logicalType": "uuid"},
          {"name": "userId", "type": "string"},
          {"name": "transactionType", "type": "string"},
          {"name": "transactionAmount", "type": ["null", "double"], "default": null},
          {"name": "provider", "type": "string"},
          {"name": "channel", "type": "string"},
          {"name": "verifiedCode", "type": "string"},
          {"name": "status", "type": "string", "default": "COMPLETED"},
          {"name": "completedAt", "type": "long", "logicalType": "timestamp-millis"},
          {"name": "timeTakenMs", "type": "long"}
        ]
      }
    }
  ]
}
```

### 2. Maven Plugin Configuration

**pom.xml:**
```xml
<plugin>
    <groupId>org.apache.avro</groupId>
    <artifactId>avro-maven-plugin</artifactId>
    <version>${avro.version}</version>
    <executions>
        <execution>
            <phase>generate-sources</phase>
            <goals>
                <goal>schema</goal>
            </goals>
            <configuration>
                <sourceDirectory>${project.basedir}/src/main/resources/avro</sourceDirectory>
                <outputDirectory>${project.build.directory}/generated-sources/avro</outputDirectory>
                <stringType>String</stringType>
                <enableDecimalLogicalType>true</enableDecimalLogicalType>
                <createSetters>false</createSetters>
                <fieldVisibility>PRIVATE</fieldVisibility>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**Generate Java classes:**
```bash
mvn clean generate-sources
```

**Generated classes:**
- `com.singularbank.signature.routing.events.avro.BaseEvent`
- `com.singularbank.signature.routing.events.avro.SignatureCompletedEvent`
- `com.singularbank.signature.routing.events.avro.SignatureCompletedPayload`
- etc.

### 3. Schema Registry Scripts

**Register Schemas:**
```bash
cd docker/schema-registry
./register-schemas.sh
```

**Check Registered Schemas:**
```bash
./check-schemas.sh signature.events-value
```

**Set Compatibility Mode:**
```bash
./set-compatibility.sh BACKWARD
```

---

## 📚 Schema Catalog

### Event Type Matrix

| Event Type | Avro Schema | FR | Trigger | Consumer Use Case |
|------------|-------------|-----|---------|-------------------|
| SIGNATURE_REQUEST_CREATED | `SignatureRequestCreatedEvent.avsc` | FR39 | Signature request created | Audit log, analytics dashboard |
| CHALLENGE_SENT | `ChallengeSentEvent.avsc` | FR40 | Challenge sent via provider | Delivery tracking, metrics |
| CHALLENGE_FAILED | `ChallengeFailedEvent.avsc` | FR41 | Challenge send failed | Alert system, retry logic |
| PROVIDER_FAILED | `ProviderFailedEvent.avsc` | FR42 | All providers failed | Escalation, manual intervention |
| SIGNATURE_COMPLETED | `SignatureCompletedEvent.avsc` | FR43 | User verified code | Transaction processing, KYC |
| SIGNATURE_EXPIRED | `SignatureExpiredEvent.avsc` | FR44 | Request TTL expired | Cleanup, user notification |
| SIGNATURE_ABORTED | `SignatureAbortedEvent.avsc` | FR45 | Admin aborted request | Fraud prevention, compliance |
| CIRCUIT_BREAKER_OPENED | `CircuitBreakerOpenedEvent.avsc` | FR46 | Circuit breaker opened | Provider health dashboard, alerts |
| CIRCUIT_BREAKER_CLOSED | `CircuitBreakerClosedEvent.avsc` | FR46 | Circuit breaker recovered | Provider health dashboard |

### Schema Evolution Guidelines

**BACKWARD Compatibility (Safe Changes):**
- ✅ Add new fields with default values
- ✅ Remove optional fields
- ❌ Remove required fields
- ❌ Change field types
- ❌ Rename fields

**Example Evolution:**
```json
// Version 1
{
  "name": "SignatureCompletedEvent",
  "version": 1,
  "fields": [
    {"name": "requestId", "type": "string"},
    {"name": "userId", "type": "string"}
  ]
}

// Version 2 (BACKWARD compatible)
{
  "name": "SignatureCompletedEvent",
  "version": 2,
  "fields": [
    {"name": "requestId", "type": "string"},
    {"name": "userId", "type": "string"},
    {"name": "deviceId", "type": ["null", "string"], "default": null}  // Added optional field
  ]
}
```

---

## 🔬 Testing Strategy

### Unit Tests

**Test: `AvroSchemaValidationTest.java`**
```java
@Test
void shouldValidateBaseEventSchema() {
    Schema schema = new Schema.Parser().parse(
        getClass().getResourceAsStream("/avro/BaseEvent.avsc"));
    
    assertThat(schema.getType()).isEqualTo(Schema.Type.RECORD);
    assertThat(schema.getName()).isEqualTo("BaseEvent");
    assertThat(schema.getNamespace()).isEqualTo("com.singularbank.signature.routing.events.avro");
    
    assertThat(schema.getField("eventId")).isNotNull();
    assertThat(schema.getField("eventType")).isNotNull();
    assertThat(schema.getField("occurredAt")).isNotNull();
    assertThat(schema.getField("aggregateId")).isNotNull();
}

@Test
void shouldGenerateAvroClassesFromSchema() {
    // Given: Avro schema compiled by Maven plugin
    // When: Instantiate generated class
    SignatureCompletedEvent event = SignatureCompletedEvent.newBuilder()
        .setEventId("123e4567-e89b-12d3-a456-426614174000")
        .setEventType("SIGNATURE_COMPLETED")
        .setOccurredAt(Instant.now().toEpochMilli())
        .setAggregateId("123e4567-e89b-12d3-a456-426614174000")
        .setAggregateType("SignatureRequest")
        .setVersion(1)
        .setPayload(SignatureCompletedPayload.newBuilder()
            .setRequestId("123e4567-e89b-12d3-a456-426614174000")
            .setUserId("user123")
            .setTransactionType("TRANSFER")
            .setProvider("SMS_TWILIO")
            .setChannel("SMS")
            .setVerifiedCode("sha256hash")
            .setStatus("COMPLETED")
            .setCompletedAt(Instant.now().toEpochMilli())
            .setTimeTakenMs(5000L)
            .build())
        .build();
    
    // Then: Object created successfully
    assertThat(event.getEventType()).isEqualTo("SIGNATURE_COMPLETED");
    assertThat(event.getPayload().getStatus()).isEqualTo("COMPLETED");
}

@Test
void shouldSerializeAndDeserializeAvroEvent() throws IOException {
    // Given: Avro event
    SignatureCompletedEvent original = createTestEvent();
    
    // When: Serialize to bytes
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    DatumWriter<SignatureCompletedEvent> writer = 
        new SpecificDatumWriter<>(SignatureCompletedEvent.class);
    Encoder encoder = EncoderFactory.get().binaryEncoder(outputStream, null);
    writer.write(original, encoder);
    encoder.flush();
    
    byte[] serialized = outputStream.toByteArray();
    
    // And: Deserialize back
    DatumReader<SignatureCompletedEvent> reader = 
        new SpecificDatumReader<>(SignatureCompletedEvent.class);
    Decoder decoder = DecoderFactory.get().binaryDecoder(serialized, null);
    SignatureCompletedEvent deserialized = reader.read(null, decoder);
    
    // Then: Events match
    assertThat(deserialized.getEventId()).isEqualTo(original.getEventId());
    assertThat(deserialized.getPayload().getRequestId())
        .isEqualTo(original.getPayload().getRequestId());
}
```

### Integration Tests

**Test: `SchemaRegistryIT.java`**
```java
@SpringBootTest
@Testcontainers
class SchemaRegistryIT {
    
    @Container
    static SchemaRegistryContainer schemaRegistry = new SchemaRegistryContainer();
    
    @Test
    void shouldRegisterSchemaInRegistry() {
        // Given: Schema Registry client
        CachedSchemaRegistryClient client = new CachedSchemaRegistryClient(
            schemaRegistry.getUrl(), 100);
        
        // When: Register schema
        Schema schema = SignatureCompletedEvent.getClassSchema();
        int schemaId = client.register("signature.events-value", schema);
        
        // Then: Schema registered
        assertThat(schemaId).isGreaterThan(0);
        
        // And: Can retrieve schema by ID
        Schema retrieved = client.getById(schemaId);
        assertThat(retrieved).isEqualTo(schema);
    }
    
    @Test
    void shouldEnforceBackwardCompatibility() {
        // Given: V1 schema registered
        Schema v1 = parseSchema("SignatureCompletedEvent_v1.avsc");
        client.register("signature.events-value", v1);
        
        // When: Register V2 with new optional field (BACKWARD compatible)
        Schema v2 = parseSchema("SignatureCompletedEvent_v2.avsc");
        
        // Then: Registration succeeds
        assertThatCode(() -> client.register("signature.events-value", v2))
            .doesNotThrowAnyException();
    }
    
    @Test
    void shouldRejectIncompatibleSchema() {
        // Given: V1 schema registered
        Schema v1 = parseSchema("SignatureCompletedEvent_v1.avsc");
        client.register("signature.events-value", v1);
        
        // When: Try to register V2 that removes required field (NOT compatible)
        Schema v2 = parseSchema("SignatureCompletedEvent_incompatible.avsc");
        
        // Then: Registration fails
        assertThatThrownBy(() -> client.register("signature.events-value", v2))
            .isInstanceOf(RestClientException.class)
            .hasMessageContaining("incompatible");
    }
}
```

---

## 📊 Monitoring & Validation

### Schema Registry Metrics

**Health Check:**
```bash
curl http://localhost:8081/
```

**List All Subjects:**
```bash
curl http://localhost:8081/subjects | jq '.'
```

**Get Schema Versions:**
```bash
curl http://localhost:8081/subjects/signature.events-value/versions | jq '.'
```

**Get Latest Schema:**
```bash
curl http://localhost:8081/subjects/signature.events-value/versions/latest | jq '.'
```

### Prometheus Alerts

```yaml
# Alert if Schema Registry is down
- alert: SchemaRegistryDown
  expr: up{job="schema-registry"} == 0
  for: 1m
  annotations:
    summary: "Schema Registry is down"
    description: "Cannot register or validate schemas"

# Alert if schema compatibility check fails
- alert: SchemaIncompatibilityDetected
  expr: kafka_schema_registry_incompatible_schemas_total > 0
  annotations:
    summary: "Incompatible schema detected"
    description: "A schema failed compatibility check"
```

---

## 🚨 Troubleshooting

### Issue: Maven Build Fails - Schema Not Found

**Symptom:**
```
[ERROR] Failed to execute goal org.apache.avro:avro-maven-plugin:schema
java.io.FileNotFoundException: /src/main/resources/avro/BaseEvent.avsc
```

**Solution:**
```bash
# Verify schema files exist
ls -la src/main/resources/avro/

# Clean and regenerate
mvn clean generate-sources
```

### Issue: Schema Registry Registration Fails

**Symptom:**
```
HTTP 422: Schema being registered is incompatible with an earlier schema
```

**Solution:**
```bash
# Check current compatibility mode
curl http://localhost:8081/config/signature.events-value | jq '.'

# Check schema diff
./check-schemas.sh signature.events-value

# Delete subject if needed (NON-PROD ONLY!)
curl -X DELETE http://localhost:8081/subjects/signature.events-value

# Re-register with corrected schema
./register-schemas.sh
```

### Issue: Generated Avro Classes Not Found

**Symptom:**
```
error: cannot find symbol
  symbol:   class SignatureCompletedEvent
  location: package com.singularbank.signature.routing.events.avro
```

**Solution:**
```bash
# Generate sources
mvn generate-sources

# Add generated sources to IDE classpath
# IntelliJ: Right-click target/generated-sources/avro -> Mark Directory as -> Generated Sources Root

# Verify classes generated
ls -la target/generated-sources/avro/com/bank/signature/events/avro/
```

---

## 📚 References

- [Apache Avro Specification](https://avro.apache.org/docs/current/spec.html)
- [Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)
- [Schema Evolution Best Practices](https://docs.confluent.io/platform/current/schema-registry/avro.html)
- [Avro Maven Plugin](https://avro.apache.org/docs/current/gettingstartedjava.html#Compiling+the+schema)

---

## ✅ Definition of Done

- [x] BaseEvent.avsc schema created
- [x] All 9 domain event schemas created (SignatureRequestCreated, ChallengeSent, ChallengeFailed, ProviderFailed, SignatureCompleted, SignatureExpired, SignatureAborted, CircuitBreakerOpened, CircuitBreakerClosed)
- [x] Avro Maven Plugin configured in pom.xml
- [x] Schema registration scripts created (register-schemas.sh, check-schemas.sh, set-compatibility.sh)
- [ ] Maven build generates Java classes successfully
- [ ] Unit tests validate schema structure
- [ ] Integration tests verify Schema Registry integration
- [ ] Schemas registered in Schema Registry (manual step)
- [ ] Compatibility mode set to BACKWARD
- [ ] Documentation completed
- [ ] Code review approved
- [ ] Merged to main branch

