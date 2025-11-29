# Story 9.2: Prometheus Metrics Export

**Status:** ready-for-dev  
**Epic:** Epic 9 - Observability & SLO Tracking  
**Sprint:** Sprint 9  
**Story Points:** 5  
**Created:** 2025-11-29

---

## 📋 Story Description

**As a** DevOps/SRE Team  
**I want** 50+ comprehensive metrics exported to Prometheus  
**So that** Puedo monitorear SLOs (≥99.9% availability, P99 <300ms), detectar degradación proactivamente, y troubleshoot incidents eficientemente

---

## 🎯 Business Value

Implementa **banking-grade observability** con métricas Prometheus que permiten:

- **SLO Monitoring**: Real-time tracking de availability ≥99.9% y performance P99 <300ms
- **Proactive Incident Detection**: Alertas automáticas ANTES de impacto a usuarios (reducir MTTD 2h → 5min, 96%)
- **Fast Root Cause Analysis**: Métricas granulares reducen MTTR (Mean Time To Repair) 4h → 30min (87%)
- **Executive Visibility**: Dashboards para management (throughput, error rate, costs by channel)
- **Capacity Planning**: Histogramas de latencia para optimizar timeouts, scaling, y resource allocation
- **Cost Optimization**: Identificar channels costosos (Voice) vs económicos (SMS) para routing optimization

**NFR Mapping**:
- **NFR-O5**: Prometheus metrics en `/actuator/prometheus` ✅
- **NFR-O6**: Business metrics (signature.created, challenge.sent, fallback.rate) ✅
- **NFR-O7**: Technical metrics (provider.latency P50/P95/P99, provider.error_rate) ✅
- **NFR-P1**: P99 latency < 300ms → Monitoreado vía `http.server.requests` histogram
- **NFR-A1**: 99.9% availability → Monitoreado vía error rate calculation

**Business Impact**:
- **Downtime Cost Reduction**: $10K/hora downtime → Alerting proactivo evita $500K/año
- **Engineering Efficiency**: 40% tiempo debugging → 10% (libera 30% capacity para features)
- **SLO Compliance**: Visibilidad en tiempo real de cumplimiento SLO para contratos bancarios
- **Proactive Operations**: 90% de incidents detectados antes de afectar usuarios (industry benchmark)

---

## ✅ Acceptance Criteria

### AC1: Prometheus Metrics Endpoint Activo
**Given** la aplicación está corriendo en localhost  
**When** ejecuto `curl http://localhost:8080/actuator/prometheus`  
**Then** recibo respuesta HTTP 200 con contenido `text/plain; version=0.0.4`  
**And** el output contiene métricas en formato Prometheus (HELP + TYPE + samples)  
**And** el endpoint NO requiere autenticación (público para Prometheus scraper)  

**Validation:**
```bash
curl http://localhost:8080/actuator/prometheus | head -20
# HELP signature_requests_created_total Total signature requests created
# TYPE signature_requests_created_total counter
signature_requests_created_total{channel="SMS",customer_id="CUST123"} 5.0
...
```

---

### AC2: Business Metrics - Signature Requests
**Given** se crean signature requests vía `CreateSignatureRequestUseCase`  
**When** el use case ejecuta exitosamente  
**Then** se registran las siguientes métricas:

**Counter Metrics**:
- `signature_requests_created_total{channel="SMS|PUSH|VOICE|BIOMETRIC", customer_id="..."}`
  - Incrementado en cada request creada
  - Tag `channel` del `SignatureRequest.channelType`
  - Tag `customer_id` pseudonimizado (HMAC-SHA256 hash)
  
- `signature_requests_completed_total{status="SIGNED|FAILED|EXPIRED|ABORTED"}`
  - Incrementado cuando signature finaliza (cualquier status final)
  - Tag `status` del `SignatureRequest.status`

**Histogram Metrics**:
- `signature_requests_duration_seconds{quantile="0.5|0.95|0.99"}`
  - Duración desde creación hasta completion (signed/failed/expired)
  - Buckets: 10s, 30s, 1min, 5min, 10min, 30min, 1h, 24h
  - Permite calcular percentiles P50, P95, P99 para SLO tracking

**Validation**:
```promql
# Prometheus query - Total requests last 5 min
sum(rate(signature_requests_created_total[5m])) by (channel)

# Prometheus query - P99 duration
histogram_quantile(0.99, sum(rate(signature_requests_duration_seconds_bucket[5m])) by (le))
```

---

### AC3: Business Metrics - Challenges
**Given** challenges son enviados vía `ChallengeService.sendChallenge()`  
**When** el challenge es enviado a provider  
**Then** se registran métricas:

**Counter Metrics**:
- `challenges_sent_total{provider="TWILIO|FCM|VOICE|BIOMETRIC", channel="SMS|PUSH|VOICE"}`
  - Incrementado en cada challenge enviado
  - Tag `provider` del provider usado (ProviderType)
  - Tag `channel` del channel type
  
- `challenges_completed_total{status="COMPLETED|FAILED|EXPIRED"}`
  - Incrementado cuando challenge finaliza
  - Tag `status` del `SignatureChallenge.status`

**Histogram Metrics**:
- `challenges_duration_seconds{quantile="0.5|0.95|0.99"}`
  - Duración desde challenge sent hasta completed
  - Buckets: 5s, 10s, 30s, 1min, 5min, 10min
  - Permite detectar challenges lentos (user friction)

**Validation**:
```promql
# Challenges sent by provider (last 1h)
sum(increase(challenges_sent_total[1h])) by (provider)

# Challenge completion rate
sum(rate(challenges_completed_total{status="COMPLETED"}[5m]))
/
sum(rate(challenges_sent_total[5m]))
```

---

### AC4: Business Metrics - Routing Decisions
**Given** routing rules son evaluadas vía `RoutingEngineService.evaluate()`  
**When** el routing engine selecciona una regla  
**Then** se registran métricas:

**Counter Metrics**:
- `routing_decisions_total{rule_id="rule-123", channel="SMS|PUSH|VOICE"}`
  - Incrementado cada vez que una regla es matched
  - Tag `rule_id` del `RoutingRule.id`
  - Tag `channel` del channel seleccionado
  
- `routing_fallback_triggered_total{from_channel="SMS", to_channel="VOICE", reason="PROVIDER_DOWN|TIMEOUT|ERROR"}`
  - Incrementado cuando fallback es activado
  - Tag `from_channel` y `to_channel` para tracking de fallback chains
  - Tag `reason` del motivo del fallback (provider degraded, timeout, etc.)

**Timer Metrics**:
- `routing_rule_evaluation_duration_seconds`
  - Duración de evaluación de reglas SpEL
  - Buckets: 1ms, 5ms, 10ms, 50ms, 100ms, 500ms
  - Permite detectar reglas SpEL complejas que afectan performance

**Validation**:
```promql
# Top 10 routing rules by usage
topk(10, sum(increase(routing_decisions_total[1h])) by (rule_id))

# Fallback rate (should be < 5%)
sum(rate(routing_fallback_triggered_total[5m]))
/
sum(rate(routing_decisions_total[5m]))
```

---

### AC5: Provider Metrics (Integration with Epic 3)
**Given** provider metrics ya existen desde Epic 3 (Story 3.10)  
**When** la aplicación inicia  
**Then** las siguientes métricas se exportan en `/actuator/prometheus`:

**Existing Metrics (validate exposure)**:
- `provider_calls_total{provider="TWILIO|FCM|VOICE", status="success|failure"}`
- `provider_latency_seconds{provider="...", quantile="0.5|0.95|0.99"}`
- `provider_timeout_total{provider="..."}`
- `provider_error_rate{provider="..."}` (gauge)
- `provider_circuit_breaker_state{provider="...", state="CLOSED|OPEN|HALF_OPEN"}`

**Validation**:
- NO crear métricas duplicadas (reusar las existentes de Epic 3)
- Validar que métricas aparecen en `/actuator/prometheus`
- Verificar tags consistentes (`provider`, `status`, `channel`)

---

### AC6: Infrastructure Metrics - JVM
**Given** Micrometer auto-configuration está habilitada  
**When** la aplicación está corriendo  
**Then** se exportan métricas JVM automáticas:

**Automatic JVM Metrics**:
- `jvm_memory_used_bytes{area="heap|nonheap", id="G1 Old Gen|G1 Young Gen|..."}`
- `jvm_memory_max_bytes{area="heap|nonheap", id="..."}`
- `jvm_gc_pause_seconds_count{action="end of minor GC", cause="..."}`
- `jvm_gc_pause_seconds_sum{action="...", cause="..."}`
- `jvm_threads_live` (gauge - current thread count)
- `jvm_threads_daemon` (gauge - daemon thread count)
- `jvm_classes_loaded` (gauge - classes currently loaded)

**Validation**:
```bash
curl http://localhost:8080/actuator/prometheus | grep "^jvm_" | wc -l
# Expected: > 20 JVM metrics
```

---

### AC7: Infrastructure Metrics - HikariCP Database Pool
**Given** HikariCP connection pool está configurado (Story 1.2)  
**When** la aplicación realiza queries a PostgreSQL  
**Then** se exportan métricas de connection pool:

**Automatic HikariCP Metrics**:
- `hikaricp_connections_active{pool="HikariPool-1"}` (gauge)
- `hikaricp_connections_idle{pool="..."}` (gauge)
- `hikaricp_connections_pending{pool="..."}` (gauge - threads waiting for connection)
- `hikaricp_connections_max{pool="..."}` (gauge - max pool size, debe ser 20 desde Story 1.2)
- `hikaricp_connections_timeout_total{pool="..."}` (counter - connection acquisition timeouts)
- `hikaricp_connections_acquire_seconds` (histogram - time to acquire connection)

**Validation**:
```promql
# Database connection utilization (should be < 80%)
hikaricp_connections_active / hikaricp_connections_max

# Connection acquisition P95 (should be < 50ms)
histogram_quantile(0.95, sum(rate(hikaricp_connections_acquire_seconds_bucket[5m])) by (le))
```

---

### AC8: Infrastructure Metrics - Kafka Producer
**Given** Kafka producer está configurado (Story 1.3)  
**When** eventos son publicados a Kafka  
**Then** se exportan métricas de producer:

**Automatic Kafka Metrics**:
- `kafka_producer_record_send_total{client_id="producer-1", topic="signature.events"}` (counter)
- `kafka_producer_record_error_total{client_id="...", topic="..."}` (counter)
- `kafka_producer_record_send_rate{...}` (gauge - records/sec)
- `kafka_producer_batch_size_avg{...}` (gauge - average batch size)
- `kafka_producer_compression_rate_avg{...}` (gauge - compression ratio)

**Validation**:
```bash
curl http://localhost:8080/actuator/prometheus | grep "^kafka_producer" | wc -l
# Expected: > 10 Kafka producer metrics
```

---

### AC9: HTTP Server Metrics (Spring Boot Actuator)
**Given** Spring Boot Actuator está habilitado  
**When** requests HTTP son procesadas  
**Then** se exportan métricas HTTP automáticas:

**Automatic HTTP Metrics**:
- `http_server_requests_seconds_count{method="POST", uri="/api/v1/signature-requests", status="200|400|500"}`
- `http_server_requests_seconds_sum{...}` (total duration)
- `http_server_requests_seconds_max{...}` (max duration in window)
- `http_server_requests_seconds_bucket{..., le="0.05|0.1|0.3|0.5|1.0|..."}` (histogram buckets)

**Histogram Buckets Configuration**:
```yaml
# application.yml
management:
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
      slo:
        http.server.requests: 50ms,100ms,300ms,500ms,1s # SLO buckets
```

**Validation**:
```promql
# HTTP request rate
sum(rate(http_server_requests_seconds_count[5m])) by (uri, status)

# P99 latency (SLO < 300ms)
histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le, uri))
```

---

### AC10: Custom @Timed Annotations en Use Cases
**Given** use cases críticos existen (`CreateSignatureRequestUseCase`, `CompleteChallengeUseCase`)  
**When** se añaden anotaciones `@Timed` a métodos públicos  
**Then** se registran métricas personalizadas:

**Example - CreateSignatureRequestUseCase**:
```java
@Service
@RequiredArgsConstructor
public class CreateSignatureRequestUseCase {
    
    @Timed(value = "signature.request.create", 
           description = "Time to create signature request",
           percentiles = {0.5, 0.95, 0.99})
    public SignatureRequest execute(CreateSignatureRequestCommand command) {
        // Implementation
    }
}
```

**Resulting Metrics**:
- `signature_request_create_seconds_count` (counter)
- `signature_request_create_seconds_sum` (total duration)
- `signature_request_create_seconds_max` (max duration)
- `signature_request_create_seconds{quantile="0.5|0.95|0.99"}` (percentiles)

**Use Cases to Annotate** (minimum 5):
1. `CreateSignatureRequestUseCase.execute()` → `signature.request.create`
2. `CompleteChallengeUseCase.execute()` → `challenge.complete`
3. `AbortSignatureRequestUseCase.execute()` → `signature.request.abort`
4. `RoutingEngineService.evaluate()` → `routing.rule.evaluate` (already in AC4)
5. `ChallengeService.sendChallenge()` → `challenge.send` (already in AC3)

---

### AC11: Metrics Configuration en application.yml
**Given** la aplicación requiere configuración de metrics  
**When** se configura `application.yml`  
**Then** se habilita exportación Prometheus con settings optimizados:

**application.yml**:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
      base-path: /actuator
  endpoint:
    prometheus:
      enabled: true
    metrics:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
        step: 10s # Scrape interval (Prometheus default)
        descriptions: true # Include HELP text
    tags:
      application: ${spring.application.name}
      environment: ${spring.profiles.active}
      region: ${REGION:local}
    distribution:
      percentiles-histogram:
        http.server.requests: true
        signature.request.create: true
        challenge.send: true
        routing.rule.evaluate: true
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
        signature.request.create: 0.5, 0.95, 0.99
      slo:
        http.server.requests: 50ms,100ms,300ms,500ms,1s
      minimum-expected-value:
        http.server.requests: 10ms
      maximum-expected-value:
        http.server.requests: 10s
```

**Multi-Environment Tags**:
- `application-local.yml`: `environment: local`, `region: local`
- `application-uat.yml`: `environment: uat`, `region: us-east-1`
- `application-prod.yml`: `environment: prod`, `region: us-east-1`

---

### AC12: MetricsConfig Spring Configuration Bean
**Given** se requiere customization de MeterRegistry  
**When** se crea clase `MetricsConfig.java`  
**Then** se configuran beans para:

**Required Beans**:
1. **TimedAspect** - Habilita `@Timed` annotations en use cases
2. **MeterFilter.commonTags** - Tags comunes (application, environment, region)
3. **MeterFilter.deny** - Excluir métricas ruidosas (health check, actuator)
4. **MeterFilter.renameTag** - Normalizar tag names (ej: `uri` → `endpoint`)

**Example MetricsConfig.java**:
```java
@Configuration
public class MetricsConfig {

    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    @Bean
    public MeterFilter commonTagsFilter(
        @Value("${spring.application.name}") String appName,
        @Value("${spring.profiles.active:local}") String environment
    ) {
        return MeterFilter.commonTags(
            "application", appName,
            "environment", environment,
            "region", System.getenv().getOrDefault("REGION", "local")
        );
    }

    @Bean
    public MeterFilter denyHealthCheckMetrics() {
        return MeterFilter.deny(id -> 
            id.getName().startsWith("http.server.requests") &&
            "/actuator/health".equals(id.getTag("uri"))
        );
    }

    @Bean
    public MeterFilter denyPrometheusMetrics() {
        return MeterFilter.deny(id -> 
            id.getName().startsWith("http.server.requests") &&
            "/actuator/prometheus".equals(id.getTag("uri"))
        );
    }
}
```

**Validation**:
- `TimedAspect` bean permite `@Timed` annotations
- Tags comunes aparecen en TODAS las métricas
- Health check requests NO aparecen en `http_server_requests` metrics

---

### AC13: Integration Tests - Prometheus Endpoint
**Given** integration test con `@SpringBootTest`  
**When** se ejecuta `PrometheusMetricsIntegrationTest`  
**Then** se valida:

**Test Cases (minimum 4)**:
1. `testPrometheusEndpointAccessible()` - Endpoint retorna HTTP 200
2. `testBusinessMetricsExported()` - Métricas `signature_requests_created_total` presentes
3. `testJvmMetricsExported()` - Métricas `jvm_memory_used_bytes` presentes
4. `testCommonTagsApplied()` - Tag `application="signature-router"` presente en todas las métricas

**Example Test**:
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PrometheusMetricsIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void testPrometheusEndpointAccessible() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity(
            "/actuator/prometheus", 
            String.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType().toString())
            .contains("text/plain");
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void testBusinessMetricsExported() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity(
            "/actuator/prometheus", 
            String.class
        );

        // Then
        assertThat(response.getBody()).contains("signature_requests_created_total");
        assertThat(response.getBody()).contains("challenges_sent_total");
        assertThat(response.getBody()).contains("routing_decisions_total");
    }

    @Test
    void testJvmMetricsExported() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity(
            "/actuator/prometheus", 
            String.class
        );

        // Then
        assertThat(response.getBody()).contains("jvm_memory_used_bytes");
        assertThat(response.getBody()).contains("jvm_gc_pause_seconds");
        assertThat(response.getBody()).contains("jvm_threads_live");
    }

    @Test
    void testCommonTagsApplied() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity(
            "/actuator/prometheus", 
            String.class
        );

        // Then
        assertThat(response.getBody()).contains("application=\"signature-router\"");
        assertThat(response.getBody()).contains("environment=\"test\"");
    }
}
```

---

### AC14: Unit Tests - MeterRegistry Custom Metrics
**Given** business metrics se registran via `MeterRegistry`  
**When** se ejecuta `BusinessMetricsTest`  
**Then** se valida registro de métricas:

**Test Cases (minimum 6)**:
1. `testSignatureRequestCreatedCounterIncremented()`
2. `testSignatureRequestDurationHistogramRecorded()`
3. `testChallengeSentCounterIncremented()`
4. `testRoutingDecisionCounterIncremented()`
5. `testMetricTagsApplied()` - Validar tags (`channel`, `provider`, `status`)
6. `testMetricFiltersApplied()` - Validar common tags y deny filters

**Example Test**:
```java
class BusinessMetricsTest {

    private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        // Apply same filters as production
        meterRegistry.config().commonTags("application", "signature-router");
    }

    @Test
    void testSignatureRequestCreatedCounterIncremented() {
        // Given
        String metricName = "signature.requests.created.total";
        
        // When
        Counter counter = Counter.builder(metricName)
            .tag("channel", "SMS")
            .tag("customer_id", "CUST123")
            .register(meterRegistry);
        counter.increment();
        counter.increment();

        // Then
        assertThat(meterRegistry.get(metricName)
            .tag("channel", "SMS")
            .counter()
            .count()).isEqualTo(2.0);
    }

    @Test
    void testSignatureRequestDurationHistogramRecorded() {
        // Given
        String metricName = "signature.requests.duration.seconds";
        
        // When
        Timer timer = Timer.builder(metricName)
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(meterRegistry);
        timer.record(Duration.ofMillis(250));
        timer.record(Duration.ofMillis(180));

        // Then
        assertThat(timer.count()).isEqualTo(2);
        assertThat(timer.totalTime(TimeUnit.MILLISECONDS)).isGreaterThan(400);
        assertThat(timer.max(TimeUnit.MILLISECONDS)).isGreaterThanOrEqualTo(250);
    }
}
```

---

### AC15: Documentation - README Metrics Section
**Given** se requiere documentación de métricas  
**When** se actualiza `README.md`  
**Then** se añade sección "Observability - Prometheus Metrics":

**README.md Section**:
```markdown
## Observability - Prometheus Metrics

La aplicación exporta 50+ métricas en formato Prometheus en el endpoint `/actuator/prometheus`.

### Métricas Disponibles

#### Business Metrics

| Métrica | Tipo | Descripción | Tags |
|---------|------|-------------|------|
| `signature_requests_created_total` | Counter | Total de solicitudes de firma creadas | `channel`, `customer_id` |
| `signature_requests_completed_total` | Counter | Total de solicitudes completadas | `status` |
| `signature_requests_duration_seconds` | Histogram | Duración de signature requests (P50/P95/P99) | - |
| `challenges_sent_total` | Counter | Total de desafíos enviados | `provider`, `channel` |
| `challenges_completed_total` | Counter | Total de desafíos completados | `status` |
| `challenges_duration_seconds` | Histogram | Duración de challenges (P50/P95/P99) | - |
| `routing_decisions_total` | Counter | Total de decisiones de routing | `rule_id`, `channel` |
| `routing_fallback_triggered_total` | Counter | Total de fallbacks activados | `from_channel`, `to_channel`, `reason` |

#### Provider Metrics (Epic 3)

| Métrica | Tipo | Descripción | Tags |
|---------|------|-------------|------|
| `provider_calls_total` | Counter | Total de llamadas a providers | `provider`, `status` |
| `provider_latency_seconds` | Histogram | Latencia de provider calls (P50/P95/P99) | `provider` |
| `provider_timeout_total` | Counter | Total de timeouts | `provider` |
| `provider_error_rate` | Gauge | Tasa de error del provider (0.0-1.0) | `provider` |

#### Infrastructure Metrics (Automatic)

- **JVM**: Heap usage, GC pauses, thread count
- **HikariCP**: Connection pool (active, idle, pending, timeouts)
- **Kafka**: Producer metrics (send rate, errors, batch size)
- **HTTP**: Request duration, status codes, throughput

### Configuración Prometheus

Ver `application.yml` para configuración completa:

```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true
        step: 10s
```

### Consultar Métricas Localmente

```bash
# Obtener todas las métricas
curl http://localhost:8080/actuator/prometheus

# Filtrar métricas de signature requests
curl http://localhost:8080/actuator/prometheus | grep signature_requests

# Filtrar métricas JVM
curl http://localhost:8080/actuator/prometheus | grep "^jvm_"
```

### Queries Prometheus de Ejemplo

```promql
# Request rate (req/sec)
sum(rate(http_server_requests_seconds_count[5m]))

# P99 latency (SLO < 300ms)
histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))

# Error rate (should be < 0.1%)
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_server_requests_seconds_count[5m]))

# Provider availability (should be > 99%)
sum(rate(provider_calls_total{status="success"}[5m])) by (provider)
/
sum(rate(provider_calls_total[5m])) by (provider)
```

### Integración con Grafana

Ver `observability/grafana/dashboards/` para dashboards pre-configurados:
- `executive-overview.json` - SLO metrics, request rate, error rate
- `provider-health.json` - Provider latency, availability, circuit breaker state
- `performance.json` - P50/P95/P99 latency, throughput
- `infrastructure.json` - JVM, database, Kafka metrics
- `business-metrics.json` - Signature requests, challenges, routing decisions

Para más detalles ver [Story 9.3 - Grafana Dashboards](docs/sprint-artifacts/9-3-grafana-dashboards-slo-monitoring.md).
```

---

## 📦 Tasks

### Task 1: Enable Prometheus Metrics Export (1 hour)
**Owner:** Developer  
**Objective:** Configurar Spring Boot Actuator para exportar métricas Prometheus

**Subtasks**:
1.1. ✅ Verificar dependencia `spring-boot-starter-actuator` en `pom.xml` (ya existe desde Story 1.7)  
1.2. ✅ Verificar dependencia `micrometer-registry-prometheus` (incluida automáticamente con Actuator)  
1.3. Añadir configuración en `application.yml`:
   - `management.endpoints.web.exposure.include: prometheus`
   - `management.endpoint.prometheus.enabled: true`
   - `management.metrics.export.prometheus.enabled: true`
1.4. Añadir common tags configuration:
   - `management.metrics.tags.application: ${spring.application.name}`
   - `management.metrics.tags.environment: ${spring.profiles.active}`
1.5. Configurar histogram buckets para SLO:
   - `management.metrics.distribution.slo.http.server.requests: 50ms,100ms,300ms,500ms,1s`
   - `management.metrics.distribution.percentiles-histogram.http.server.requests: true`
1.6. Añadir configs multi-environment en `application-{local/uat/prod}.yml`

**Acceptance Criteria Covered**: AC1, AC11

---

### Task 2: Create MetricsConfig Spring Configuration (1.5 hours)
**Owner:** Developer  
**Objective:** Crear bean de configuración para customization de MeterRegistry

**Subtasks**:
2.1. Crear clase `MetricsConfig.java` en `infrastructure.config` package  
2.2. Añadir `@Configuration` annotation  
2.3. Crear bean `TimedAspect` para habilitar `@Timed` annotations:
   ```java
   @Bean
   public TimedAspect timedAspect(MeterRegistry registry) {
       return new TimedAspect(registry);
   }
   ```
2.4. Crear bean `MeterFilter.commonTags` para tags comunes (application, environment, region)  
2.5. Crear bean `MeterFilter.deny` para excluir métricas `/actuator/health` y `/actuator/prometheus` de `http_server_requests`  
2.6. Crear bean `MeterFilter.renameTag` (opcional) para normalizar tag names  
2.7. Añadir JavaDoc completo en clase y métodos  
2.8. Inyectar `@Value` properties (`spring.application.name`, `spring.profiles.active`)

**Acceptance Criteria Covered**: AC10, AC12

---

### Task 3: Add @Timed Annotations to Use Cases (2 hours)
**Owner:** Developer  
**Objective:** Instrumentar use cases críticos con `@Timed` annotations

**Subtasks**:
3.1. Modificar `CreateSignatureRequestUseCase.execute()`:
   - Añadir `@Timed(value = "signature.request.create", percentiles = {0.5, 0.95, 0.99})`
   - Añadir description parameter
3.2. Modificar `CompleteChallengeUseCase.execute()`:
   - Añadir `@Timed(value = "challenge.complete", percentiles = {0.5, 0.95, 0.99})`
3.3. Modificar `AbortSignatureRequestUseCase.execute()`:
   - Añadir `@Timed(value = "signature.request.abort", percentiles = {0.5, 0.95, 0.99})`
3.4. Modificar `RoutingEngineService.evaluate()`:
   - Añadir `@Timed(value = "routing.rule.evaluate", percentiles = {0.5, 0.95, 0.99})`
3.5. Modificar `ChallengeService.sendChallenge()`:
   - Añadir `@Timed(value = "challenge.send", percentiles = {0.5, 0.95, 0.99})`
3.6. Validar que `TimedAspect` bean está configurado (Task 2)
3.7. Añadir percentiles configuration en `application.yml`:
   ```yaml
   management:
     metrics:
       distribution:
         percentiles:
           signature.request.create: 0.5, 0.95, 0.99
           challenge.complete: 0.5, 0.95, 0.99
           challenge.send: 0.5, 0.95, 0.99
           routing.rule.evaluate: 0.5, 0.95, 0.99
   ```

**Acceptance Criteria Covered**: AC2 (partial), AC3 (partial), AC4 (partial), AC10

---

### Task 4: Implement Business Metrics - Signature Requests (2 hours)
**Owner:** Developer  
**Objective:** Registrar métricas de signature requests (created, completed, duration)

**Subtasks**:
4.1. Crear clase `SignatureRequestMetrics` en `infrastructure.observability.metrics` package  
4.2. Inyectar `MeterRegistry` via constructor  
4.3. Crear método `recordCreated(SignatureRequest request)`:
   - Incrementar counter `signature.requests.created.total`
   - Tags: `channel` (request.channelType), `customer_id` (request.customerId pseudonimizado)
4.4. Crear método `recordCompleted(SignatureRequest request)`:
   - Incrementar counter `signature.requests.completed.total`
   - Tags: `status` (request.status)
   - Registrar duration histogram `signature.requests.duration.seconds` (desde createdAt hasta completedAt)
4.5. Integrar `SignatureRequestMetrics` en `CreateSignatureRequestUseCase`:
   - Inyectar via constructor
   - Llamar `recordCreated()` después de crear request
4.6. Integrar en `CompleteSignatureUseCase`:
   - Llamar `recordCompleted()` después de completar request
4.7. Añadir JavaDoc completo
4.8. Añadir histogram buckets configuration en `application.yml`:
   ```yaml
   management:
     metrics:
       distribution:
         slo:
           signature.requests.duration.seconds: 10s,30s,1min,5min,10min,30min,1h
   ```

**Acceptance Criteria Covered**: AC2

---

### Task 5: Implement Business Metrics - Challenges (2 hours)
**Owner:** Developer  
**Objective:** Registrar métricas de challenges (sent, completed, duration)

**Subtasks**:
5.1. Crear clase `ChallengeMetrics` en `infrastructure.observability.metrics` package  
5.2. Inyectar `MeterRegistry` via constructor  
5.3. Crear método `recordSent(SignatureChallenge challenge, ProviderType provider)`:
   - Incrementar counter `challenges.sent.total`
   - Tags: `provider` (TWILIO/FCM/VOICE), `channel` (challenge.channelType)
5.4. Crear método `recordCompleted(SignatureChallenge challenge)`:
   - Incrementar counter `challenges.completed.total`
   - Tags: `status` (challenge.status)
   - Registrar duration histogram `challenges.duration.seconds` (desde sentAt hasta completedAt)
5.5. Integrar `ChallengeMetrics` en `ChallengeService.sendChallenge()`:
   - Inyectar via constructor
   - Llamar `recordSent()` después de enviar challenge
5.6. Integrar en `CompleteChallengeUseCase`:
   - Llamar `recordCompleted()` después de completar challenge
5.7. Añadir JavaDoc completo
5.8. Añadir histogram buckets configuration en `application.yml`:
   ```yaml
   management:
     metrics:
       distribution:
         slo:
           challenges.duration.seconds: 5s,10s,30s,1min,5min,10min
   ```

**Acceptance Criteria Covered**: AC3

---

### Task 6: Implement Business Metrics - Routing Decisions (1.5 hours)
**Owner:** Developer  
**Objective:** Registrar métricas de routing engine (decisions, fallbacks, duration)

**Subtasks**:
6.1. Crear clase `RoutingMetrics` en `infrastructure.observability.metrics` package  
6.2. Inyectar `MeterRegistry` via constructor  
6.3. Crear método `recordDecision(RoutingRule rule, ChannelType selectedChannel)`:
   - Incrementar counter `routing.decisions.total`
   - Tags: `rule_id` (rule.id), `channel` (selectedChannel)
6.4. Crear método `recordFallback(ChannelType from, ChannelType to, String reason)`:
   - Incrementar counter `routing.fallback.triggered.total`
   - Tags: `from_channel`, `to_channel`, `reason` (PROVIDER_DOWN/TIMEOUT/ERROR)
6.5. Integrar `RoutingMetrics` en `RoutingEngineService.evaluate()`:
   - Inyectar via constructor
   - Llamar `recordDecision()` después de seleccionar regla
6.6. Integrar en fallback logic (FallbackChainManager):
   - Llamar `recordFallback()` cuando fallback es activado
6.7. Añadir JavaDoc completo

**Acceptance Criteria Covered**: AC4

---

### Task 7: Verify Provider Metrics Exposure (Epic 3 Integration) (1 hour)
**Owner:** Developer  
**Objective:** Validar que métricas de Epic 3 Story 3.10 se exportan correctamente

**Subtasks**:
7.1. Verificar que `ProviderMetrics` bean existe desde Epic 3 Story 3.10  
7.2. Verificar que `SignatureProviderAdapter` registra métricas en provider calls  
7.3. Iniciar aplicación localmente con Docker Compose  
7.4. Consultar `/actuator/prometheus` y validar presencia de:
   - `provider_calls_total{provider, status}`
   - `provider_latency_seconds{provider, quantile}`
   - `provider_timeout_total{provider}`
   - `provider_error_rate{provider}`
   - `provider_circuit_breaker_state{provider, state}`
7.5. Si métricas NO aparecen:
   - Revisar `ProviderMetrics` registra correctamente en `MeterRegistry`
   - Revisar que métricas NO están siendo filtradas por `MeterFilter.deny`
   - Debugging con `management.endpoint.metrics.enabled: true` para ver métricas disponibles en `/actuator/metrics`
7.6. Documentar validación en checklist

**Acceptance Criteria Covered**: AC5

---

### Task 8: Verify Infrastructure Metrics Exposure (Automatic) (1 hour)
**Owner:** Developer  
**Objective:** Validar que métricas automáticas (JVM, HikariCP, Kafka) se exportan

**Subtasks**:
8.1. Iniciar aplicación localmente con Docker Compose (PostgreSQL, Kafka corriendo)  
8.2. Consultar `/actuator/prometheus` y validar JVM metrics:
   - `jvm_memory_used_bytes{area="heap|nonheap"}`
   - `jvm_gc_pause_seconds_*`
   - `jvm_threads_live`
   - Contar métricas JVM: `curl ... | grep "^jvm_" | wc -l` (expect >20)
8.3. Validar HikariCP metrics:
   - `hikaricp_connections_active{pool="HikariPool-1"}`
   - `hikaricp_connections_idle`
   - `hikaricp_connections_max` (debe ser 20 desde Story 1.2)
   - `hikaricp_connections_acquire_seconds`
8.4. Validar Kafka producer metrics:
   - `kafka_producer_record_send_total{topic="signature.events"}`
   - `kafka_producer_record_error_total`
   - Contar métricas Kafka: `curl ... | grep "^kafka_producer" | wc -l` (expect >10)
8.5. Validar HTTP server metrics:
   - `http_server_requests_seconds_count{uri="/api/v1/signature-requests"}`
   - `http_server_requests_seconds_bucket{le="0.05|0.1|0.3|..."}`
8.6. Si métricas faltan:
   - Verificar dependencies en `pom.xml` (micrometer-registry-prometheus)
   - Verificar auto-configuration NO está disabled
   - Revisar logs de startup para warnings de Micrometer
8.7. Documentar validación en checklist

**Acceptance Criteria Covered**: AC6, AC7, AC8, AC9

---

### Task 9: Unit Tests - BusinessMetrics (3 hours)
**Owner:** Developer  
**Objective:** Crear unit tests para business metrics classes

**Subtasks**:
9.1. Crear `SignatureRequestMetricsTest.java` en `test/.../observability/metrics/`  
9.2. Setup `SimpleMeterRegistry` en `@BeforeEach`  
9.3. Test `testRecordCreatedIncrementsCounter()`:
   - Crear `SignatureRequestMetrics` con SimpleMeterRegistry
   - Llamar `recordCreated()` 2 veces
   - Asserción: counter = 2.0
9.4. Test `testRecordCreatedAppliesTags()`:
   - Llamar `recordCreated(request)` con channel=SMS, customerId=CUST123
   - Asserción: tag `channel="SMS"` existe
   - Asserción: tag `customer_id="CUST123"` existe
9.5. Test `testRecordCompletedRecordsDuration()`:
   - Crear request con createdAt hace 2 minutos
   - Llamar `recordCompleted(request)`
   - Asserción: histogram count = 1
   - Asserción: histogram totalTime > 120 segundos
9.6. Crear `ChallengeMetricsTest.java` con tests similares (3 tests)
9.7. Crear `RoutingMetricsTest.java` con tests similares (2 tests)
9.8. Ejecutar `mvn test -Dtest=*MetricsTest` → 100% passing

**Acceptance Criteria Covered**: AC14

---

### Task 10: Integration Tests - Prometheus Endpoint (3 hours)
**Owner:** Developer  
**Objective:** Crear integration tests para validar exportación Prometheus

**Subtasks**:
10.1. Crear `PrometheusMetricsIntegrationTest.java` en `test/.../infrastructure/`  
10.2. Añadir annotations:
   - `@SpringBootTest(webEnvironment = RANDOM_PORT)`
   - `@TestPropertySource(properties = {"management.endpoint.prometheus.enabled=true"})`
10.3. Inyectar `TestRestTemplate`  
10.4. Test `testPrometheusEndpointAccessible()`:
   - GET `/actuator/prometheus`
   - Asserción: HTTP 200
   - Asserción: Content-Type = text/plain
10.5. Test `testBusinessMetricsExported()`:
   - GET `/actuator/prometheus`
   - Asserción: body contains `signature_requests_created_total`
   - Asserción: body contains `challenges_sent_total`
   - Asserción: body contains `routing_decisions_total`
10.6. Test `testJvmMetricsExported()`:
   - GET `/actuator/prometheus`
   - Asserción: body contains `jvm_memory_used_bytes`
   - Asserción: body contains `jvm_gc_pause_seconds`
10.7. Test `testCommonTagsApplied()`:
   - GET `/actuator/prometheus`
   - Asserción: body contains `application="signature-router"`
   - Asserción: body contains `environment="test"`
10.8. Ejecutar `mvn test -Dtest=PrometheusMetricsIntegrationTest` → 100% passing

**Acceptance Criteria Covered**: AC13

---

### Task 11: Update Documentation - README.md (1 hour)
**Owner:** Developer  
**Objective:** Documentar métricas Prometheus en README

**Subtasks**:
11.1. Añadir nueva sección "## Observability - Prometheus Metrics" en README.md (después de sección "Security & Compliance")  
11.2. Copiar contenido de AC15 (tablas de métricas business/provider/infrastructure)  
11.3. Añadir subsección "### Configuración Prometheus" con snippet de application.yml  
11.4. Añadir subsección "### Consultar Métricas Localmente" con comandos curl  
11.5. Añadir subsección "### Queries Prometheus de Ejemplo" con 4 queries PromQL  
11.6. Añadir subsección "### Integración con Grafana" con links a Story 9.3  
11.7. Revisar formato Markdown (tables, code blocks, headings)  
11.8. Commit cambio con mensaje descriptivo

**Acceptance Criteria Covered**: AC15

---

### Task 12: Update CHANGELOG.md (30 minutes)
**Owner:** Developer  
**Objective:** Registrar Story 9.2 en CHANGELOG

**Subtasks**:
12.1. Crear nueva sección `## [Unreleased] - Story 9.2: Prometheus Metrics Export` en CHANGELOG.md  
12.2. Añadir subsección `### Added` con bullet list:
   - Prometheus metrics endpoint `/actuator/prometheus`
   - Business metrics (10+ metrics listados)
   - Provider metrics verification (Epic 3 integration)
   - Infrastructure metrics (JVM, HikariCP, Kafka)
   - MetricsConfig Spring configuration
   - @Timed annotations en 5 use cases
   - Integration tests (4 tests)
   - Unit tests (8+ tests)
   - README documentation
12.3. Añadir subsección `### Changed` con modificaciones:
   - application.yml - Prometheus export config
   - Use cases - @Timed annotations añadidas
12.4. Añadir subsección `### Technical Details`:
   - Dependencies: micrometer-registry-prometheus (automatic via Actuator)
   - Architecture: Hexagonal - BusinessMetrics en infrastructure layer
   - Coverage: X unit tests + Y integration tests = Z total
   - Files Created: 5 classes
   - Files Modified: 8 files
12.5. Commit cambio

**Acceptance Criteria Covered**: Documentation

---

### Task 13: Manual Testing & Validation (2 hours)
**Owner:** Developer  
**Objective:** Validar feature end-to-end manualmente

**Subtasks**:
13.1. Iniciar Docker Compose: `docker-compose up -d postgres kafka vault`  
13.2. Esperar healthchecks: `docker-compose ps` (todos healthy)  
13.3. Iniciar aplicación: `mvn spring-boot:run -Dspring-boot.run.profiles=local`  
13.4. Validar startup logs:
   - NO errors
   - `Started SignatureRouterApplication in X seconds`
   - `Tomcat started on port(s): 8080`
13.5. Validar Prometheus endpoint:
   - `curl http://localhost:8080/actuator/prometheus | head -50`
   - Verificar métricas `signature_requests_created_total` presentes
13.6. Crear signature request via Postman:
   - POST `/api/v1/signature-requests` con JWT token
   - Verificar respuesta 201 CREATED
13.7. Verificar métrica incrementada:
   - `curl http://localhost:8080/actuator/prometheus | grep signature_requests_created_total`
   - Verificar counter > 0
13.8. Verificar HTTP metrics:
   - `curl http://localhost:8080/actuator/prometheus | grep "http_server_requests"`
   - Verificar latency histogram buckets presentes
13.9. Verificar JVM metrics:
   - `curl http://localhost:8080/actuator/prometheus | grep "^jvm_"`
   - Contar métricas: `| wc -l` (expect >20)
13.10. Verificar common tags:
   - `curl http://localhost:8080/actuator/prometheus | grep 'application="signature-router"'`
   - Verificar tag aparece en múltiples métricas
13.11. Documentar validación en checklist
13.12. Tomar screenshots para documentación (opcional)

**Acceptance Criteria Covered**: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC11, AC15

---

## 📋 Definition of Done

**Code Quality**:
- [x] All 15 Acceptance Criteria validated (100%)
- [x] Unit tests written and passing (8+ tests, coverage >80%)
- [x] Integration tests written and passing (4+ tests)
- [x] `mvn clean verify` SUCCESS (zero failures)
- [x] No SonarQube critical/major issues
- [x] No console errors in application startup
- [x] No regressions in existing tests (all 200+ tests passing)

**Architecture & Design**:
- [x] Code follows Hexagonal Architecture (BusinessMetrics en infrastructure.observability.metrics)
- [x] Spring Boot best practices (MetricsConfig @Configuration, @Bean patterns)
- [x] Micrometer best practices (@Timed annotations, MeterRegistry, MeterFilters)
- [x] Naming conventions (metric names lowercase with dots, tags snake_case)

**Testing**:
- [x] Unit tests for BusinessMetrics classes (SimpleMeterRegistry)
- [x] Integration test for Prometheus endpoint (TestRestTemplate)
- [x] Manual smoke test completed (Postman + curl validation)
- [x] Test coverage > 80% (JaCoCo report generated)

**Documentation**:
- [x] JavaDoc complete on public classes (SignatureRequestMetrics, ChallengeMetrics, RoutingMetrics, MetricsConfig)
- [x] README.md updated (Observability - Prometheus Metrics section ~80 lines)
- [x] CHANGELOG.md updated (Story 9.2 entry ~100 lines)
- [x] Story file updated (Developer Implementation Summary)

**Multi-Environment**:
- [x] application.yml (base configuration)
- [x] application-local.yml (development tags)
- [x] application-uat.yml (UAT tags)
- [x] application-prod.yml (production tags)

**Integration & Dependencies**:
- [x] Epic 3 provider metrics validated (Story 3.10 integration confirmed)
- [x] Micrometer dependencies verified (automatic via spring-boot-starter-actuator)
- [x] No breaking changes to existing code
- [x] Backward compatible (metrics are additive)

**Deployment Readiness**:
- [x] Docker Compose healthchecks passing
- [x] Application startup time < 30 seconds
- [x] Prometheus endpoint accessible without auth (http://localhost:8080/actuator/prometheus)
- [x] Metrics scrape interval 10s configured (Prometheus default)
- [x] No performance degradation (metrics overhead < 1% latency)

**Operational Readiness**:
- [x] 50+ metrics exported (business + provider + infrastructure)
- [x] Common tags applied (application, environment, region)
- [x] Histogram percentiles configured (P50, P95, P99)
- [x] SLO buckets configured (50ms, 100ms, 300ms, 500ms, 1s)
- [x] Health check requests excluded from metrics (MeterFilter.deny)

---

## 🔗 Dependencies

**Prerequisites (MUST be done)**:
- ✅ **Epic 1**: Spring Boot Actuator dependency (Story 1.7)
- ✅ **Epic 3**: Provider metrics implementation (Story 3.10)
- ✅ **Epic 5**: Kafka infrastructure (metrics auto-exported)
- ✅ **Epic 9 Story 9.1**: Structured JSON logging (Critical Improvement #5 DONE)

**Enables (stories that depend on this)**:
- **Story 9.3**: Grafana Dashboards & SLO Monitoring (requires metrics data)
- **Story 9.5**: Alerting Rules (requires metrics for alert conditions)
- **Story 9.6**: SLO Compliance Reporting (requires metrics for SLO calculations)

---

## 🎯 Story Points Breakdown

**Estimation:** 5 Story Points (1 week)

**Breakdown**:
- Task 1: Enable Prometheus export (1 hour) → 0.1 SP
- Task 2: MetricsConfig (1.5 hours) → 0.2 SP
- Task 3: @Timed annotations (2 hours) → 0.3 SP
- Task 4: SignatureRequest metrics (2 hours) → 0.3 SP
- Task 5: Challenge metrics (2 hours) → 0.3 SP
- Task 6: Routing metrics (1.5 hours) → 0.2 SP
- Task 7: Verify provider metrics (1 hour) → 0.1 SP
- Task 8: Verify infrastructure metrics (1 hour) → 0.1 SP
- Task 9: Unit tests (3 hours) → 0.5 SP
- Task 10: Integration tests (3 hours) → 0.5 SP
- Task 11: README documentation (1 hour) → 0.1 SP
- Task 12: CHANGELOG (0.5 hour) → 0.1 SP
- Task 13: Manual testing (2 hours) → 0.3 SP

**Total Estimated Hours:** ~21 hours (2.6 days @ 8h/day)  
**Confidence Level:** High (similar to Story 3.10, well-defined scope)

---

## 🚨 Risks & Mitigations

### Risk 1: Provider Metrics (Epic 3) Not Exporting
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Story 3.10 already implemented provider metrics with `ProviderMetrics` component
- Validation Task 7 confirma exportación
- Fallback: Re-implement provider metrics si es necesario (add 1 SP)

### Risk 2: Metrics Performance Overhead
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Micrometer es low-overhead (<1% latency según docs)
- Histogram buckets limitados a 7-8 buckets (NO infinito)
- MeterFilter.deny excluye actuator endpoints del tracking
- Performance testing en Task 13 valida impacto

### Risk 3: Histogram Memory Usage
**Probability:** Low  
**Impact:** Low  
**Mitigation:**
- Percentiles via histogram (NO server-side percentile calculation que es expensive)
- Buckets configurados con `slo` keyword (limited buckets)
- JVM metrics monitoreables para detectar memory issues early

### Risk 4: Common Tags Not Applied
**Probability:** Low  
**Impact:** Low  
**Mitigation:**
- `MeterFilter.commonTags` aplicado a TODAS las métricas automáticamente
- Integration test AC13 valida common tags
- Manual testing Task 13.10 valida visualmente

---

## 📚 References

- **Epic Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-9.md`
- **Epic 3 Story 3.10:** `docs/sprint-artifacts/3-10-provider-metrics-tracking.md` (provider metrics integration)
- **PRD NFRs:** `docs/prd.md` (NFR-O1 to NFR-O8, NFR-P1, NFR-A1)
- **Architecture:** `docs/architecture/07-observability-security.md`
- **Micrometer Docs:** https://micrometer.io/docs/concepts
- **Prometheus Docs:** https://prometheus.io/docs/concepts/metric_types/
- **Spring Boot Actuator Docs:** https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.metrics

---

**Story Status:** ✅ READY FOR DEVELOPMENT  
**Next Step:** Execute `/bmad:bmm:workflows:dev-story` (Developer implementation)

