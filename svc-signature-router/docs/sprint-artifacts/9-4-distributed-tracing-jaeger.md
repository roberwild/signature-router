# Story 9.4: Distributed Tracing con Spring Cloud Sleuth & Jaeger

**Status:** drafted  
**Epic:** Epic 9 - Observability & SLO Tracking  
**Sprint:** Sprint 9  
**Story Points:** 8  
**Created:** 2025-11-29

---

## 📋 Story Description

**As a** SRE Team & Backend Engineers  
**I want** Distributed tracing con Spring Cloud Sleuth + Jaeger para 100% de requests en dev (10% en prod)  
**So that** Puedo debuggear issues de latencia/performance rápidamente, correlacionar logs por traceId, y visualizar el flow completo de requests a través de todos los componentes (HTTP → DB → Kafka → Providers)

---

## 🎯 Business Value

Implementa **distributed tracing** que permite:

- **Fast Debugging**: MTTR 4h → 30min (87% reducción) - identificar bottlenecks visualmente
- **Request Flow Visualization**: Ver el path completo de un request (HTTP → Use Case → DB → Kafka → Provider)
- **Latency Analysis**: Identificar qué componente causa latency (DB query? Provider call? Kafka publish?)
- **Cross-Service Correlation**: Correlacionar logs de múltiples servicios usando traceId
- **Production Troubleshooting**: 10% sampling en prod permite debugging sin overhead
- **Performance Optimization**: Identificar N+1 queries, slow endpoints, provider timeouts

**NFR Mapping**:
- **NFR-O9**: Jaeger para distributed tracing ✅
- **NFR-O10**: Trace propagation a Kafka consumers ✅
- **NFR-O11**: Trace context en provider API calls ✅

**Business Impact**:
- **MTTR Reduction**: 4h → 30min debugging time (87% faster incident resolution)
- **Engineering Efficiency**: 60% tiempo debugging → 15% (visual traces vs manual log correlation)
- **Proactive Optimization**: Identificar bottlenecks ANTES de afectar SLOs
- **Customer Experience**: Fix performance issues faster = better UX

---

## ✅ Acceptance Criteria

### AC1: Spring Cloud Sleuth Dependency Added

**Given** `pom.xml` está actualizado  
**When** inicio la aplicación  
**Then** Sleuth auto-instrumenta todos los requests HTTP  
**And** logs muestran `[appName,traceId,spanId]` en cada línea

**Validation:**
```bash
# Start app
./mvnw spring-boot:run

# Make request
curl http://localhost:8080/api/v1/signatures

# Check logs - should show:
# [signature-router,64f3a2b1c9e8d7f6,a1b2c3d4e5f6g7h8] INFO ...
```

**Dependencies to Add:**
```xml
<!-- Spring Cloud Sleuth (auto-instrumentation) -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>

<!-- Sleuth Zipkin (Jaeger compatible) -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-sleuth-zipkin</artifactId>
</dependency>
```

---

### AC2: Jaeger Backend Running in Docker Compose

**Given** Jaeger está configurado en `docker-compose.yml`  
**When** ejecuto `docker-compose up -d jaeger`  
**Then** Jaeger inicia correctamente  
**And** Jaeger UI accesible en `http://localhost:16686`

**Validation:**
```bash
# Start Jaeger
docker-compose up -d jaeger

# Verify service healthy
curl http://localhost:16686 | grep "Jaeger UI"

# Verify Zipkin endpoint (for Sleuth)
curl http://localhost:9411/health
# Expected: HTTP 200 OK
```

**Docker Compose Service:**
```yaml
jaeger:
  image: jaegertracing/all-in-one:1.51
  container_name: signature-router-jaeger
  ports:
    - "16686:16686"  # Jaeger UI
    - "9411:9411"    # Zipkin compatible endpoint (for Sleuth)
    - "14250:14250"  # gRPC (optional)
  environment:
    - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    - MEMORY_MAX_TRACES=10000  # In-memory storage limit
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:16686"]
    interval: 10s
    timeout: 5s
    retries: 5
```

---

### AC3: Application Configured to Send Traces to Jaeger

**Given** `application.yml` tiene configuración de Sleuth  
**When** app recibe request  
**Then** trace se envía a Jaeger vía Zipkin endpoint

**Configuration:**
```yaml
spring:
  sleuth:
    enabled: true
    sampler:
      probability: 1.0  # 100% sampling in local/dev (AC requirement)
    baggage:
      remote-fields: customerId,signatureId  # Propagate business IDs
  zipkin:
    base-url: http://localhost:9411  # Jaeger Zipkin endpoint
    enabled: true
```

**Environment-Specific Sampling:**
```yaml
# application-local.yml (dev)
spring.sleuth.sampler.probability: 1.0  # 100%

# application-uat.yml
spring.sleuth.sampler.probability: 0.5  # 50%

# application-prod.yml
spring.sleuth.sampler.probability: 0.1  # 10% (to reduce overhead)
```

---

### AC4: Trace Context Propagation in HTTP Requests

**Given** Sleuth está activo  
**When** hago request HTTP a `/api/v1/signatures`  
**Then** logs muestran traceId y spanId  
**And** trace aparece en Jaeger UI con spans:
- HTTP request span
- Use case span
- Repository span (DB query)
- Kafka producer span

**Validation:**
```bash
# 1. Make request
curl -X POST http://localhost:8080/api/v1/signatures \
  -H "Content-Type: application/json" \
  -d '{...}'

# 2. Check logs for traceId
# [signature-router,64f3a2b1c9e8d7f6,a1b2c3d4e5f6g7h8] INFO ...

# 3. Open Jaeger UI
open http://localhost:16686

# 4. Search for trace:
# Service: signature-router
# Operation: POST /api/v1/signatures
# Find trace 64f3a2b1c9e8d7f6

# 5. Verify spans:
# ├─ POST /api/v1/signatures (200ms total)
# │  ├─ CreateSignatureRequestUseCase (180ms)
# │  │  ├─ SignatureRequestRepository.save (50ms)
# │  │  ├─ KafkaProducer.send (30ms)
# │  │  └─ ProviderService.sendChallenge (80ms)
```

---

### AC5: Trace Context Propagation in Kafka Messages

**Given** Sleuth Kafka integration está activo  
**When** publico mensaje a Kafka  
**Then** trace headers (`b3`, `X-B3-TraceId`) se propagan automáticamente  
**And** consumer puede correlacionar trace con producer

**Automatic Propagation (Sleuth handles this):**
```java
// Producer (automatic - Sleuth adds headers)
kafkaTemplate.send("signature.events", event);
// Headers added: X-B3-TraceId, X-B3-SpanId, X-B3-Sampled

// Consumer (automatic - Sleuth extracts headers)
@KafkaListener(topics = "signature.events")
public void consume(SignatureEvent event) {
    // Same traceId as producer!
    log.info("Processing event"); // [app,64f3a2b1c9e8d7f6,newSpanId]
}
```

**Validation:**
```bash
# 1. Trigger event publication
curl -X POST http://localhost:8080/api/v1/signatures -d '{...}'

# 2. Check Kafka message headers
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic signature.events \
  --property print.headers=true

# Expected headers:
# X-B3-TraceId:64f3a2b1c9e8d7f6
# X-B3-SpanId:a1b2c3d4e5f6g7h8
# X-B3-Sampled:1

# 3. Check Jaeger UI - trace should show Kafka publish span
```

---

### AC6: Custom Spans for Business Operations

**Given** Use cases tienen `@NewSpan` annotations  
**When** use case se ejecuta  
**Then** Jaeger muestra span dedicado para esa operación

**Example:**
```java
@Service
@RequiredArgsConstructor
public class CreateSignatureRequestUseCase {
    
    private final Tracer tracer; // Inject Sleuth Tracer
    
    @NewSpan("signature.request.create") // Custom span name
    public SignatureRequest execute(CreateSignatureRequestCommand command) {
        Span span = tracer.currentSpan();
        
        // Add custom tags
        span.tag("customerId", command.getCustomerId());
        span.tag("channel", command.getPreferredChannel().name());
        
        // Business logic...
        SignatureRequest request = createRequest(command);
        
        // Add event annotation
        span.annotate("request.created");
        
        return request;
    }
}
```

**Validation:**
```bash
# 1. Execute use case
curl -X POST http://localhost:8080/api/v1/signatures -d '{...}'

# 2. Open Jaeger UI
# 3. Find trace
# 4. Verify custom span exists:
#    - Name: "signature.request.create"
#    - Tags: customerId=xxx, channel=SMS
#    - Annotation: "request.created"
```

---

### AC7: Jaeger UI Shows Complete Request Flow

**Given** Jaeger UI está accesible  
**When** busco trace por traceId  
**Then** veo flamegraph con todos los spans:
- HTTP request (total duration)
- Use case execution
- Database queries (individual queries visible)
- Kafka publish
- Provider API calls

**Validation:**
```bash
# 1. Access Jaeger UI
open http://localhost:16686

# 2. Search traces:
# - Service: signature-router
# - Operation: POST /api/v1/signatures
# - Lookback: Last hour
# - Min Duration: 100ms (to find slow requests)

# 3. Click on a trace
# 4. Verify flamegraph shows:
#    ├─ POST /api/v1/signatures (250ms total)
#    │  ├─ signature.request.create (230ms)
#    │  │  ├─ SELECT signature_request (30ms) - DB query
#    │  │  ├─ INSERT signature_request (20ms) - DB query
#    │  │  ├─ kafka.send signature.events (40ms)
#    │  │  └─ provider.send.challenge (120ms)
#    │     └─ HTTP POST twilio.com/Messages (100ms)
```

---

### AC8: Trace IDs in Logs for Correlation

**Given** Sleuth está activo  
**When** reviso logs  
**Then** cada línea incluye `[appName,traceId,spanId]`  
**And** puedo buscar todos los logs de un request usando traceId

**Log Format:**
```
2025-11-29 10:30:15 [signature-router,64f3a2b1c9e8d7f6,a1b2c3d4e5f6g7h8] INFO  [http-nio-8080-exec-1] c.b.s.i.a.i.r.SignatureController : Received signature request
2025-11-29 10:30:15 [signature-router,64f3a2b1c9e8d7f6,b2c3d4e5f6g7h8i9] INFO  [http-nio-8080-exec-1] c.b.s.a.u.CreateSignatureRequestUseCase : Creating signature request
2025-11-29 10:30:15 [signature-router,64f3a2b1c9e8d7f6,c3d4e5f6g7h8i9j0] INFO  [http-nio-8080-exec-1] c.b.s.i.a.o.p.SignatureRequestRepository : Saving signature request
```

**Validation:**
```bash
# 1. Make request
curl http://localhost:8080/api/v1/signatures -d '{...}'

# 2. Get traceId from response header (or logs)
TRACE_ID=64f3a2b1c9e8d7f6

# 3. Search all logs for this trace
grep $TRACE_ID logs/application.log

# Expected: All logs related to this request (across all components)
```

---

### AC9: Performance Impact < 5%

**Given** Sleuth está activo con 100% sampling  
**When** ejecuto load test  
**Then** overhead de tracing < 5% latency increase

**Validation:**
```bash
# Baseline (without tracing)
# Disable Sleuth: spring.sleuth.enabled=false
ab -n 1000 -c 10 http://localhost:8080/api/v1/health
# P99 latency: 50ms

# With tracing (100% sampling)
# Enable Sleuth: spring.sleuth.enabled=true, probability=1.0
ab -n 1000 -c 10 http://localhost:8080/api/v1/health
# P99 latency: <53ms (< 5% increase)
```

---

## 📋 Tasks

### Task 1: Add Spring Cloud Sleuth Dependencies (30 min)
1. Add `spring-cloud-dependencies` BOM to `pom.xml`
2. Add `spring-cloud-starter-sleuth` dependency
3. Add `spring-cloud-sleuth-zipkin` dependency
4. Add `spring-kafka` tracing (auto-configured)
5. Run `mvn clean install` to verify

### Task 2: Add Jaeger to Docker Compose (30 min)
1. Add Jaeger service to `docker-compose.yml`
2. Expose ports: 16686 (UI), 9411 (Zipkin)
3. Add healthcheck
4. Start Jaeger: `docker-compose up -d jaeger`
5. Verify UI accessible: `http://localhost:16686`

### Task 3: Configure Sleuth in application.yml (1 hora)
1. Add `spring.sleuth` configuration
2. Enable Zipkin exporter with Jaeger endpoint
3. Configure sampling: 100% local, 10% prod
4. Configure baggage propagation (customerId, signatureId)
5. Test with simple request

### Task 4: Add Custom Spans to Use Cases (2 horas)
1. Inject `Tracer` in use cases
2. Add `@NewSpan` annotations to key operations
3. Add custom tags (customerId, channel, etc.)
4. Add span events/annotations
5. Test 3 use cases: CreateSignature, SendChallenge, EvaluateRouting

### Task 5: Verify Kafka Trace Propagation (1 hora)
1. Publish Kafka message and verify headers
2. Consume message and verify traceId correlation
3. Check Jaeger UI shows Kafka spans
4. Test with KafkaProducer and KafkaConsumer

### Task 6: Integration Testing (1.5 horas)
1. Create integration test: `DistributedTracingIntegrationTest`
2. Test: Make HTTP request → Verify trace in Jaeger
3. Test: Publish Kafka message → Verify trace propagation
4. Test: traceId in logs correlates with Jaeger trace
5. Test: Custom spans appear in Jaeger

### Task 7: Performance Testing (1 hora)
1. Run load test WITHOUT tracing (baseline)
2. Run load test WITH tracing (100% sampling)
3. Measure overhead (should be < 5%)
4. Document results

### Task 8: Documentation (1 hora)
1. Create `docs/observability/DISTRIBUTED_TRACING.md`
2. Document Jaeger UI usage
3. Document how to search traces
4. Document custom span creation
5. Update README.md with tracing section
6. Update CHANGELOG.md

---

## 📂 Files to Create

1. **`docs/observability/DISTRIBUTED_TRACING.md`** (~400 lines) - Tracing guide
2. **`DistributedTracingIntegrationTest.java`** (~100 lines) - Integration tests
3. **`9-4-distributed-tracing-jaeger.context.xml`** (optional) - Story context

---

## 📝 Files to Modify

1. **`pom.xml`** (+20 lines) - Spring Cloud dependencies
2. **`docker-compose.yml`** (+15 lines) - Jaeger service
3. **`application.yml`** (+15 lines) - Sleuth configuration
4. **`application-local.yml`** (+3 lines) - 100% sampling
5. **`application-prod.yml`** (+3 lines) - 10% sampling
6. **Use case classes** (3-5 files) - Add `@NewSpan` annotations
7. **`README.md`** (+30 lines) - Distributed Tracing section
8. **`CHANGELOG.md`** (+50 lines) - Story 9.4 entry

---

## 🧪 Testing Strategy

### Integration Tests
1. **Trace Creation Test**: Verify HTTP request creates trace in Jaeger
2. **Kafka Propagation Test**: Verify traceId propagates through Kafka
3. **Custom Span Test**: Verify `@NewSpan` creates dedicated span
4. **Log Correlation Test**: Verify logs contain traceId

### Manual Testing
1. Make HTTP request → Check Jaeger UI for trace
2. Publish Kafka event → Verify trace shows Kafka span
3. Search logs by traceId → Verify all related logs found
4. Load test → Verify < 5% overhead

---

## 📚 Dependencies

- **Story 9.1** (Structured Logging): REQUIRED - MDC context already set up
- **Story 9.2** (Prometheus Metrics): OPTIONAL - complementary
- **Kafka Infrastructure** (Epic 1): REQUIRED - for Kafka tracing
- **Jaeger**: REQUIRED - must be running in Docker

---

## 🎯 Definition of Done

- [ ] Spring Cloud Sleuth dependencies added
- [ ] Jaeger running in Docker Compose
- [ ] Application sends traces to Jaeger
- [ ] Trace context propagates in HTTP requests
- [ ] Trace context propagates in Kafka messages
- [ ] Custom spans added to 3+ use cases
- [ ] Jaeger UI shows complete request flow (flamegraph)
- [ ] Trace IDs appear in logs
- [ ] Performance overhead < 5%
- [ ] Integration tests passing
- [ ] Documentation complete (DISTRIBUTED_TRACING.md)
- [ ] README.md + CHANGELOG.md updated

**Story Status:** ✅ READY FOR DEVELOPMENT  
**Estimated Effort:** 8 Story Points (~1 week, compressed to 1 day for completion)

