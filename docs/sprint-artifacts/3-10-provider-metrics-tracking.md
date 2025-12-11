# Story 3.10: Provider Metrics Tracking

**Status:** in-review  
**Epic:** Epic 3 - Multi-Provider Integration  
**Sprint:** Sprint 3  
**Story Points:** 3  
**Created:** 2025-11-28

---

## 📋 Story Description

**As a** Sistema de Signature Router  
**I want** Métricas comprehensivas de provider calls exportadas a Prometheus  
**So that** Puedo monitorear performance, SLO compliance, y detectar degradación de providers proactivamente

---

## 🎯 Business Value

Implementa observability completa para provider integrations con métricas Prometheus que permiten:

- **SLO Monitoring**: Tracking de latencia P99 < 300ms (NFR-P1) y availability 99.9% (NFR-A1)
- **Provider Performance Comparison**: Identificar qué providers son más rápidos/confiables para optimizar routing rules
- **Cost Optimization**: Detectar providers con alta tasa de error para priorizar fallback a canales más económicos
- **Proactive Alerting**: Alertas automáticas cuando error rate > 5% o latency P99 > 500ms
- **Capacity Planning**: Histogramas de latencia para dimensionar timeouts y retry policies
- **Epic 4 Enabler**: Métricas de error rate necesarias para circuit breaker decisions (Story 4.4)

**NFR Mapping**:
- **NFR-O1**: Structured logging con correlation IDs → Métricas complementan logs para observability completa
- **NFR-O2**: Prometheus metrics exportados vía `/actuator/prometheus`
- **NFR-O3**: Distributed tracing preparation → Metrics tagged con `traceId`
- **NFR-P1**: P99 latency < 300ms → Métricas `provider.latency.p99` permiten validación
- **NFR-A1**: 99.9% uptime → Métricas `provider.availability` calculadas desde success rate

**Business Impact**:
- **Incident Detection**: Reducir MTTD (Mean Time To Detect) de 30min → 2min con alertas automáticas
- **SLO Compliance**: Visibilidad en tiempo real de cumplimiento de SLO 99.9%
- **Cost Savings**: Detectar providers degradados early → evitar costos de fallback a Voice (20x más caro que SMS)
- **Proactive Ops**: 80% de incidents detectados antes de afectar usuarios (based on industry benchmarks)

---

## 🎯 Implementation Summary

**Completed** (2025-11-28):
- ✅ **ProviderMetrics Component** (`infrastructure.observability.metrics.ProviderMetrics`)
  - Methods: `recordProviderCall()`, `recordTimeout()`, `updateErrorRate()`
  - Tags: provider, status, channel_type, retried, attempt_number, error_code, error_type
- ✅ **SignatureProviderAdapter Integration**
  - Automatic metrics recording on ALL provider call outcomes (success, failure, timeout, interrupted)
  - Duration measurement from call start to completion
- ✅ **ProviderErrorRateCalculator**
  - Scheduled task (@Scheduled(fixedDelay=10000ms)) - every 10 seconds
  - Error rate formula: `failures / (successes + failures)`
  - Updates `provider.error.rate` gauge for Epic 4 circuit breaker
- ✅ **Metrics Exported**
  - `provider.calls.total{provider, status, channel_type, retried}` - Counter
  - `provider.failures.total{provider, error_code}` - Counter
  - `provider.errors.total{provider, error_type}` - Counter (transient vs permanent)
  - `provider.latency{provider, status, attempt_number}` - Histogram
  - `provider.timeout.duration{provider}` - Histogram
  - `provider.error.rate{provider}` - Gauge
- ✅ **Unit Tests**: 9/9 passed - `ProviderMetricsTest` with SimpleMeterRegistry
- ✅ **Alert Rules**: 5 Prometheus alerts documented (`docs/development/provider-metrics-alerts.yml`)
- ✅ **Grafana Dashboard Spec**: 5 panels documented (`docs/development/grafana-provider-dashboard-spec.json`)
- ✅ **CHANGELOG.md**: Updated with Story 3.10 features

**Notes**:
- Integration tests (`ProviderMetricsIntegrationTest`) deferred to Epic 6-7 (Admin Portal) due to test environment bean conflicts
- Metrics functionality verified via unit tests with SimpleMeterRegistry
- `/actuator/prometheus` endpoint export verified manually (AC12 partial coverage)

## ✅ Acceptance Criteria

### AC1: Core Provider Call Metrics
**Given** un provider ejecuta `sendChallenge()`  
**When** el provider retorna resultado (success o failure)  
**Then** se registran las siguientes métricas Prometheus:

- **Counter**: `provider.calls.total{provider="SMS|PUSH|VOICE|BIOMETRIC", status="success|failure", channel_type="..."}`
  - Incrementado en cada call
  - Tag `status="success"` si `ProviderResult.success == true`
  - Tag `status="failure"` si `ProviderResult.success == false`
  
- **Counter**: `provider.failures.total{provider="...", error_code="TIMEOUT|API_ERROR|..."}`
  - Incrementado solo en failures
  - Tag `error_code` del `ProviderResult.errorCode`
  
- **Histogram**: `provider.latency{provider="...", status="..."}`
  - Buckets: 50ms, 100ms, 200ms, 500ms, 1s, 2s, 5s, 10s
  - Permite calcular P50, P95, P99 percentiles
  - Tagged con `status` para correlacionar latency con success/failure

**And** métricas se exportan vía `/actuator/prometheus` en formato Prometheus text

### AC2: Timeout-Specific Metrics
**Given** un provider call excede timeout configurado  
**When** `TimeoutException` es lanzado  
**Then** se registran métricas adicionales:

- **Counter**: `provider.timeout.total{provider="..."}`
  - Incrementado solo en timeouts (ya existe desde Story 3.8)
  
- **Histogram**: `provider.timeout.duration{provider="..."}`
  - Registra la duración hasta timeout (normalmente ~timeout config: 5s SMS, 3s PUSH, 10s VOICE)
  - Permite detectar si timeouts son consistentes o intermitentes

**And** tag `timedOut=true` en `provider.latency` histogram cuando timeout ocurre

### AC3: Retry Awareness in Metrics
**Given** un provider call es retried (Story 3.9)  
**When** el provider retorna después de 1+ retries  
**Then** las métricas reflejan retry context:

- **Tag**: `retried="true|false"` en `provider.calls.total`
  - `retried="true"` si `ProviderResult.retriedSuccess == true`
  - `retried="false"` si primer attempt fue exitoso
  
- **Tag**: `attempt_number="1|2|3"` en `provider.latency`
  - Permite analizar latency distribution por attempt number
  - Ejemplo: P99 latency en attempt 3 es ~8s (incluye backoff delays)

**And** métricas de retry ya registradas por `ProviderRetryMetrics` (Story 3.9) son complementarias (no duplicadas)

### AC4: Provider Availability Calculation
**Given** métricas de success/failure acumuladas  
**When** se consulta availability en rolling window  
**Then** se puede calcular via Prometheus query:

```promql
# Availability rate (last 5 minutes)
sum(rate(provider_calls_total{status="success"}[5m])) by (provider)
/ 
sum(rate(provider_calls_total[5m])) by (provider)
```

**And** Grafana dashboard panel muestra availability por provider (gauge 0-100%)

**And** alerta Prometheus dispara si availability < 95% por 5 minutos consecutivos

### AC5: Error Rate Metrics (Epic 4 Preparation)
**Given** circuit breaker decisions requieren error rate (Epic 4 Story 4.4)  
**When** provider calls ocurren  
**Then** se registran métricas que permiten calcular error rate:

- **Counter**: `provider.errors.total{provider="...", error_type="transient|permanent"}`
  - `error_type="transient"` para 5xx, timeouts, network errors (retryable)
  - `error_type="permanent"` para 4xx, auth errors (non-retryable)
  
- **Gauge**: `provider.error.rate{provider="..."}`
  - Calculado cada 10s via scheduled task
  - Formula: `failures / (successes + failures)` en ventana de 1 minuto
  - Usado por circuit breaker logic en Epic 4

**And** error rate > 50% en 30s window es criterio para OPEN circuit breaker (Epic 4)

### AC6: Per-Channel Metrics
**Given** routing decisions requieren métricas por canal (SMS vs PUSH vs VOICE)  
**When** challenge es enviado  
**Then** métricas incluyen tag `channel_type`:

- Tag `channel_type="SMS|PUSH|VOICE|BIOMETRIC"` en todas las métricas core
- Permite queries como: "Latency P99 de SMS provider vs PUSH provider"
- Correlación con routing rules: "¿Qué canal tiene mejor performance para high-risk transactions?"

### AC7: Metrics Component Architecture
**Given** métricas deben ser centralizadas y reusables  
**When** se implementa metrics tracking  
**Then** se crea componente `ProviderMetrics`:

- **Package**: `com.singularbank.signature.routing.infrastructure.observability.metrics`
- **Class**: `ProviderMetrics` (similar a `ProviderRetryMetrics` Story 3.9)
- **Dependency**: `MeterRegistry` (Micrometer)
- **Methods**:
  - `recordProviderCall(String provider, String channelType, ProviderResult result, Duration duration)`
  - `recordTimeout(String provider, Duration duration)`
  - `updateErrorRate(String provider, double errorRate)`
- **Reusability**: Llamado desde `SignatureProviderAdapter.sendChallenge()` after provider execution

**And** métricas se registran en un solo lugar (evitar duplicación en cada provider implementation)

### AC8: Integration with Existing Metrics
**Given** Story 3.8 (Timeout) y 3.9 (Retry) ya registran algunas métricas  
**When** Story 3.10 se implementa  
**Then** se integra SIN duplicar métricas existentes:

- **Reuse**: `provider.timeout.total` ya existe (Story 3.8) → NO recrear
- **Reuse**: `provider.retry.*` ya existe (Story 3.9 ProviderRetryMetrics) → NO recrear
- **New**: `provider.calls.total`, `provider.latency`, `provider.error.rate` son nuevas
- **Centralization**: `ProviderMetrics` component llama `ProviderRetryMetrics` cuando `retriedSuccess=true`

**And** documentación en runbook lista TODAS las métricas (Stories 3.8, 3.9, 3.10) en un solo lugar

### AC9: Prometheus Alerting Rules
**Given** proactive monitoring requiere alertas  
**When** métricas son configuradas  
**Then** se definen Prometheus alert rules (ready para deploy, docs only en este story):

- **Alert**: `ProviderHighErrorRate`
  - Condition: `error_rate > 0.05` (5%) por 5 minutos
  - Severity: Warning
  - Action: Page on-call engineer
  
- **Alert**: `ProviderHighLatency`
  - Condition: `histogram_quantile(0.99, provider_latency_bucket) > 0.5s` por 3 minutos
  - Severity: Warning
  - Action: Investigate provider performance
  
- **Alert**: `ProviderAvailabilityLow`
  - Condition: `availability < 0.95` (95%) por 10 minutos
  - Severity: Critical
  - Action: Trigger fallback chain evaluation (Epic 4)

**And** alert rules documentadas en `docs/development/provider-metrics-alerts.yml`

**And** README incluye instrucciones para deploy de alerts a Prometheus

### AC10: Grafana Dashboard Design (Spec Only)
**Given** visualización de métricas requiere dashboard  
**When** métricas están disponibles  
**Then** se documenta diseño de Grafana dashboard (implementation en Epic 6-7):

**Dashboard Panels** (specs, no implementation):
1. **Provider Availability** (Gauge per provider)
   - Query: `sum(rate(provider_calls_total{status="success"}[5m])) / sum(rate(provider_calls_total[5m]))`
   - Thresholds: Green >99%, Yellow 95-99%, Red <95%
   
2. **Provider Latency P99** (Graph time series)
   - Query: `histogram_quantile(0.99, provider_latency_bucket)`
   - Y-axis: milliseconds, X-axis: time
   
3. **Call Volume by Provider** (Stacked area chart)
   - Query: `sum(rate(provider_calls_total[5m])) by (provider)`
   
4. **Error Rate by Provider** (Graph)
   - Query: `provider_error_rate`
   - Threshold line: 5% (red line)
   
5. **Timeout Rate** (Single stat)
   - Query: `rate(provider_timeout_total[5m]) / rate(provider_calls_total[5m])`

**And** dashboard JSON spec documentado en `docs/development/grafana-provider-dashboard-spec.json`

### AC11: Unit Tests for ProviderMetrics
**Given** metrics component debe ser testeable  
**When** unit tests ejecutan  
**Then** se validan:

- Test: `recordProviderCall_success_shouldIncrementSuccessCounter()`
  - Verify: `provider.calls.total{status="success"}` incrementado
  - Verify: `provider.latency` histogram registrado con duration
  
- Test: `recordProviderCall_failure_shouldIncrementFailureCounter()`
  - Verify: `provider.calls.total{status="failure"}` incrementado
  - Verify: `provider.failures.total{error_code="TIMEOUT"}` incrementado
  
- Test: `recordProviderCall_withRetry_shouldTagRetried()`
  - Given: `ProviderResult.retriedSuccess = true`
  - Verify: Tag `retried="true"` presente
  
- Test: `updateErrorRate_shouldSetGauge()`
  - Given: `errorRate = 0.15` (15%)
  - Verify: Gauge `provider.error.rate` = 0.15

**And** tests usan `SimpleMeterRegistry` (Micrometer test utility) NO mock

**And** coverage > 90% en `ProviderMetrics` class

### AC12: Integration Test - Metrics Export
**Given** métricas deben ser exportables a Prometheus  
**When** integration test ejecuta  
**Then** se valida:

- Test: `testMetricsExportedToPrometheus()`
  - Given: Provider call ejecutado (mock Twilio)
  - When: GET `/actuator/prometheus`
  - Then: Response contiene:
    ```
    provider_calls_total{provider="SMS",status="success",channel_type="SMS"} 1.0
    provider_latency_bucket{provider="SMS",status="success",le="0.5"} 1.0
    ```
  - And: Prometheus text format válido
  
- Test: `testErrorRateMetric()`
  - Given: 3 calls (2 success, 1 failure)
  - When: Scheduled task calcula error rate
  - Then: `provider.error.rate` gauge = 0.33 (33%)

**And** test usa `@SpringBootTest` + `TestRestTemplate` para validar actuator endpoint

---

## 🏗️ Tasks

### Task 1: Create ProviderMetrics Component
**Estimated:** 2h

#### Subtasks:
1. [ ] Crear `ProviderMetrics.java` en `infrastructure/observability/metrics` package:
   - Inject `MeterRegistry` dependency
   - Private fields para counter/histogram references (cache para performance)
   - Constructor initializa counters/histograms en el registry
   
2. [ ] Implementar método `recordProviderCall()`:
   - Parameters: `String provider, String channelType, ProviderResult result, Duration duration`
   - Increment `provider.calls.total` con tags apropiados
   - Increment `provider.failures.total` si failure
   - Record `provider.latency` histogram con duration
   - Tag `retried=true` si `result.retriedSuccess()`
   
3. [ ] Implementar método `recordTimeout()`:
   - Reuse `provider.timeout.total` counter (ya existe desde Story 3.8)
   - Record `provider.timeout.duration` histogram
   
4. [ ] Implementar método `updateErrorRate()`:
   - Parameters: `String provider, double errorRate`
   - Set gauge `provider.error.rate`
   
5. [ ] JavaDoc completo con ejemplos de uso

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/observability/metrics/ProviderMetrics.java`

---

### Task 2: Integrate ProviderMetrics in SignatureProviderAdapter
**Estimated:** 1h 30min

#### Subtasks:
1. [ ] Inject `ProviderMetrics` en `SignatureProviderAdapter`:
   - Constructor injection vía `@RequiredArgsConstructor`
   
2. [ ] Modificar `sendChallenge()` para registrar métricas:
   - Capturar `startTime = Instant.now()` ANTES de provider call
   - Capturar `endTime = Instant.now()` DESPUÉS de result
   - Calcular `duration = Duration.between(startTime, endTime)`
   - Llamar `providerMetrics.recordProviderCall(provider, channelType, result, duration)`
   
3. [ ] Modificar bloque de timeout handling:
   - Ya existe log de timeout (Story 3.8)
   - Agregar `providerMetrics.recordTimeout(provider, duration)` después del log
   
4. [ ] Ensure tags son extraídos correctamente:
   - `provider` tag: `challenge.getProvider().name()` (SMS, PUSH, VOICE, BIOMETRIC)
   - `channelType` tag: `challenge.getChannelType().name()` (mismo valor típicamente)
   - `status` tag: `result.success() ? "success" : "failure"`
   
5. [ ] Remove individual metrics calls de providers si existen (centralizar en adapter)

**Files to Modify:**
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/SignatureProviderAdapter.java`

---

### Task 3: Implement Error Rate Calculator
**Estimated:** 1h 30min

#### Subtasks:
1. [ ] Crear `ProviderErrorRateCalculator` scheduled component:
   - Package: `infrastructure/observability/metrics`
   - Annotation: `@Component`, `@Scheduled(fixedDelay = 10000)` (10s interval)
   
2. [ ] Implementar método `calculateErrorRates()`:
   - Query `MeterRegistry` para obtener counters:
     - `successCount = provider.calls.total{status="success"}` en 1min window
     - `failureCount = provider.calls.total{status="failure"}` en 1min window
   - Calcular: `errorRate = failureCount / (successCount + failureCount)`
   - Para cada provider (SMS, PUSH, VOICE, BIOMETRIC):
     - Llamar `providerMetrics.updateErrorRate(provider, errorRate)`
   
3. [ ] Handle edge cases:
   - Si `successCount + failureCount == 0` → `errorRate = 0.0` (sin calls)
   - Si provider deshabilitado → skip calculation
   
4. [ ] Log error rate changes:
   - `log.info("Provider error rate updated: provider={}, errorRate={:.2f}%", provider, errorRate * 100)`
   
5. [ ] Unit test con manual clock advance (mocking time)

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/observability/metrics/ProviderErrorRateCalculator.java`

---

### Task 4: Unit Tests - ProviderMetrics
**Estimated:** 2h

#### Subtasks:
1. [ ] Crear `ProviderMetricsTest.java`:
   - Use `SimpleMeterRegistry` (no mock)
   - Setup: `ProviderMetrics metrics = new ProviderMetrics(new SimpleMeterRegistry())`
   
2. [ ] Test: `recordProviderCall_success_shouldIncrementSuccessCounter()`:
   - Given: `ProviderResult.success("msg-123", "proof")`
   - When: `metrics.recordProviderCall("SMS", "SMS", result, Duration.ofMillis(150))`
   - Then: Verify counter `provider.calls.total{provider="SMS", status="success"}` = 1.0
   - Then: Verify histogram `provider.latency{provider="SMS"}` contains sample ~150ms
   
3. [ ] Test: `recordProviderCall_failure_shouldIncrementFailureAndErrorCounters()`:
   - Given: `ProviderResult.failure("TIMEOUT", "Provider timed out")`
   - When: `metrics.recordProviderCall("PUSH", "PUSH", result, Duration.ofSeconds(3))`
   - Then: Verify `provider.calls.total{status="failure"}` = 1.0
   - Then: Verify `provider.failures.total{provider="PUSH", error_code="TIMEOUT"}` = 1.0
   
4. [ ] Test: `recordProviderCall_withRetry_shouldTagRetriedTrue()`:
   - Given: `ProviderResult.successAfterRetry("msg-123", "proof", 3)`
   - When: `metrics.recordProviderCall(...)`
   - Then: Verify tag `retried="true"` presente en counters
   
5. [ ] Test: `updateErrorRate_shouldSetGauge()`:
   - When: `metrics.updateErrorRate("SMS", 0.15)`
   - Then: Gauge `provider.error.rate{provider="SMS"}` = 0.15
   
6. [ ] Test: `recordTimeout_shouldIncrementTimeoutCounter()`:
   - When: `metrics.recordTimeout("VOICE", Duration.ofSeconds(10))`
   - Then: Verify `provider.timeout.total{provider="VOICE"}` = 1.0
   
7. [ ] Ejecutar tests y verificar PASS

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/observability/metrics/ProviderMetricsTest.java`

---

### Task 5: Integration Test - Metrics Export
**Estimated:** 2h

#### Subtasks:
1. [ ] Crear `ProviderMetricsIntegrationTest.java`:
   - `@SpringBootTest(webEnvironment = RANDOM_PORT)`
   - Inject `TestRestTemplate`
   - Inject `MeterRegistry` para assertions
   
2. [ ] Test: `testProviderCallMetricsExported()`:
   - Given: Mock Twilio provider (WireMock stub HTTP 200)
   - When: Call `SignatureProviderAdapter.sendChallenge(smsCha llenge, "+1234567890")`
   - Then: Verify MeterRegistry contains:
     - `provider.calls.total{provider="SMS", status="success"}` ≥ 1
     - `provider.latency` histogram has samples
   - When: GET `/actuator/prometheus`
   - Then: Response body contains Prometheus text:
     ```
     provider_calls_total{provider="SMS",status="success",channel_type="SMS"} 1.0
     ```
   
3. [ ] Test: `testTimeoutMetricExported()`:
   - Given: Mock provider que delays 10s (trigger timeout)
   - When: Call provider con timeout 3s
   - Then: Verify `provider.timeout.total{provider="PUSH"}` incrementado
   - And: `/actuator/prometheus` contiene `provider_timeout_total`
   
4. [ ] Test: `testErrorRateCalculated()`:
   - Given: 3 provider calls (2 success, 1 failure)
   - When: Scheduled task ejecuta (trigger manually or wait)
   - Then: Verify `provider.error.rate{provider="SMS"}` ≈ 0.33
   
5. [ ] Test: `testRetriedMetricTag()`:
   - Given: Mock provider fails 2 times, success on 3rd (retry scenario)
   - When: Call provider
   - Then: Verify `provider.calls.total{retried="true"}` incrementado
   
6. [ ] Ejecutar tests y verificar PASS

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/observability/metrics/ProviderMetricsIntegrationTest.java`

---

### Task 6: Prometheus Alerting Rules Documentation
**Estimated:** 1h

#### Subtasks:
1. [ ] Crear `docs/development/provider-metrics-alerts.yml`:
   - Prometheus alert rules en YAML format
   - 3 alerts documentadas (AC9):
     - `ProviderHighErrorRate`
     - `ProviderHighLatency`
     - `ProviderAvailabilityLow`
   - Cada alert con:
     - `expr`: Prometheus query
     - `for`: Duration antes de firing
     - `severity`: warning/critical
     - `annotations`: description y runbook_url
   
2. [ ] Crear example queries para validar alerts:
   - Queries que simulan alert conditions
   - Ejemplo: `rate(provider_calls_total{status="failure"}[5m]) > 0.05`
   
3. [ ] Documentar deployment instructions:
   - Cómo agregar rules a Prometheus config
   - Cómo validar rules: `promtool check rules provider-metrics-alerts.yml`
   - Cómo test alerts en dev environment

**Files to Create:**
- `docs/development/provider-metrics-alerts.yml`

---

### Task 7: Grafana Dashboard Specification
**Estimated:** 1h 30min

#### Subtasks:
1. [ ] Crear `docs/development/grafana-provider-dashboard-spec.json`:
   - Grafana dashboard JSON skeleton (not full implementation, Epic 6-7)
   - 5 panels definidos (AC10):
     - Provider Availability (Gauge)
     - Latency P99 (Time series graph)
     - Call Volume (Stacked area)
     - Error Rate (Graph with threshold)
     - Timeout Rate (Single stat)
   
2. [ ] Para cada panel definir:
   - Panel type (gauge, graph, stat)
   - Prometheus query (PromQL)
   - Visualization settings (colors, thresholds)
   - Legend format
   
3. [ ] Crear example screenshot (text description, no real screenshot):
   - `docs/development/grafana-provider-dashboard-mockup.md`
   - ASCII art o descripción textual del layout
   
4. [ ] Documentar cómo importar dashboard a Grafana (future Epic 6-7):
   - Dashboard import JSON path
   - Required Prometheus datasource config

**Files to Create:**
- `docs/development/grafana-provider-dashboard-spec.json`
- `docs/development/grafana-provider-dashboard-mockup.md`

---

### Task 8: Update Metrics Runbook
**Estimated:** 1h

#### Subtasks:
1. [ ] Actualizar `docs/development/provider-retry-runbook.md`:
   - Agregar sección "Provider Call Metrics" (Story 3.10)
   - Listar TODAS las métricas:
     - Story 3.8: `provider.timeout.total`
     - Story 3.9: `provider.retry.*`
     - Story 3.10: `provider.calls.total`, `provider.latency`, `provider.error.rate`
   - Cross-reference entre métricas (cómo se relacionan)
   
2. [ ] Agregar sección "Metrics Queries Cookbook":
   - Query: Overall provider success rate
   - Query: P99 latency per provider
   - Query: Error rate trending
   - Query: Timeout rate by provider
   - Query: Retry success rate
   
3. [ ] Agregar troubleshooting scenarios:
   - Scenario: "Provider latency suddenly increased"
     - Check: `provider.latency` histogram
     - Check: `provider.retry.attempts.total` (retries increase latency)
     - Action: Review provider status page, check network
   - Scenario: "Provider error rate spiking"
     - Check: `provider.error.rate` gauge
     - Check: `provider.failures.total` by error_code
     - Action: Identify error type (transient vs permanent)
   
4. [ ] Agregar alerting section:
   - Reference to `provider-metrics-alerts.yml`
   - Runbook URLs para cada alert

**Files to Modify:**
- `docs/development/provider-retry-runbook.md` → rename to `provider-observability-runbook.md` (broader scope)

---

### Task 9: Update README and Documentation
**Estimated:** 45min

#### Subtasks:
1. [ ] Actualizar `README.md` sección "Observability":
   - Agregar subsección "Provider Metrics"
   - Listar métricas disponibles (table format)
   - Link a runbook y Grafana dashboard spec
   
2. [ ] Actualizar `CHANGELOG.md`:
   - Story 3.10 entry:
     - Provider metrics tracking (calls, latency, error rate)
     - Prometheus export vía `/actuator/prometheus`
     - Grafana dashboard spec
     - Alert rules documentation
   
3. [ ] Actualizar tech spec (`tech-spec-epic-3.md`):
   - Mark Story 3.10 metrics acceptance criteria as IMPLEMENTED
   - Update Epic 3 progress: 10/10 stories complete
   
4. [ ] JavaDoc en `ProviderMetrics`:
   - Class-level doc con ejemplo de uso
   - Method-level doc para cada public method
   - Link a Prometheus metrics naming conventions

**Files to Modify:**
- `README.md`
- `CHANGELOG.md`
- `docs/sprint-artifacts/tech-spec-epic-3.md`

---

## 📐 Architecture Context

### Metrics Flow Diagram

```
SignatureProviderAdapter.sendChallenge(challenge, recipient)
   ↓
   ├─ startTime = Instant.now()
   ↓
   ├─ Execute Provider (TwilioSmsProvider, PushNotificationProvider, etc.)
   │  ├─ Timeout decoration (Story 3.8)
   │  ├─ Retry decoration (Story 3.9)
   │  └─ Actual provider call
   ↓
   ├─ endTime = Instant.now()
   ├─ duration = Duration.between(startTime, endTime)
   ↓
   ├─ ProviderMetrics.recordProviderCall(provider, channelType, result, duration)
   │  ├─ Increment provider.calls.total{provider, status, channel_type, retried}
   │  ├─ If failure: Increment provider.failures.total{provider, error_code}
   │  ├─ Record provider.latency{provider, status} histogram
   │  └─ If timeout: Call recordTimeout()
   ↓
   └─ Return ProviderResult to caller
   
ProviderErrorRateCalculator (scheduled @10s interval)
   ↓
   ├─ Query MeterRegistry:
   │  ├─ successCount = provider.calls.total{status="success"} in 1min window
   │  ├─ failureCount = provider.calls.total{status="failure"} in 1min window
   │  └─ errorRate = failureCount / (successCount + failureCount)
   ↓
   └─ ProviderMetrics.updateErrorRate(provider, errorRate)
      └─ Set gauge provider.error.rate{provider}
```

### Metrics Hierarchy

```
Provider Call Metrics (Story 3.10)
├─ provider.calls.total (counter)
│  ├─ Tags: provider, status, channel_type, retried
│  └─ Dimensions: SMS/PUSH/VOICE/BIOMETRIC × success/failure
│
├─ provider.failures.total (counter)
│  ├─ Tags: provider, error_code
│  └─ Enables: Error classification (TIMEOUT, API_ERROR, etc.)
│
├─ provider.latency (histogram)
│  ├─ Tags: provider, status
│  ├─ Buckets: 50ms, 100ms, 200ms, 500ms, 1s, 2s, 5s, 10s
│  └─ Enables: P50, P95, P99 percentile calculations
│
└─ provider.error.rate (gauge)
   ├─ Tags: provider
   ├─ Updated: Every 10s by scheduled task
   └─ Enables: Circuit breaker decisions (Epic 4)

Timeout Metrics (Story 3.8 - Reused)
├─ provider.timeout.total (counter)
│  └─ Tags: provider
│
└─ provider.timeout.duration (histogram) - NEW in 3.10
   └─ Tags: provider

Retry Metrics (Story 3.9 - Complementary)
├─ provider.retry.attempts.total (counter)
├─ provider.retry.success.total (counter)
├─ provider.retry.exhausted.total (counter)
└─ provider.retry.duration (histogram)
```

### Prometheus Metrics Naming

Following Prometheus best practices:

| Metric | Type | Unit | Naming Convention |
|--------|------|------|-------------------|
| `provider.calls.total` | Counter | calls | Use `_total` suffix for counters |
| `provider.latency` | Histogram | seconds | Base unit, buckets in seconds |
| `provider.error.rate` | Gauge | ratio (0-1) | No suffix, represents current state |
| `provider.timeout.duration` | Histogram | seconds | Duration in base unit |

**Buckets Rationale:**
- **50ms, 100ms**: Fast responses (PUSH notifications)
- **200ms, 500ms**: Normal SMS/Voice latency
- **1s, 2s**: With retries (backoff delays)
- **5s, 10s**: Timeout scenarios (Story 3.8: SMS=5s, VOICE=10s)

### Integration with Existing Observability

```
┌────────────────────────────────────────────────────────────┐
│                  Observability Stack                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Provider Metrics (Story 3.10)                       │  │
│  │  - provider.calls.total                              │  │
│  │  - provider.latency (histogram)                      │  │
│  │  - provider.error.rate (gauge)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↑                                     │
│                        │                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Timeout Metrics (Story 3.8)                         │  │
│  │  - provider.timeout.total                            │  │
│  │  - provider.timeout.duration (NEW)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↑                                     │
│                        │                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Retry Metrics (Story 3.9)                           │  │
│  │  - provider.retry.attempts.total                     │  │
│  │  - provider.retry.success.total                      │  │
│  │  - provider.retry.exhausted.total                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↑                                     │
│         All exported via /actuator/prometheus                │
│                        │                                     │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Prometheus Server                                    │  │
│  │  - Scrapes every 15s                                  │  │
│  │  - Evaluates alert rules                             │  │
│  │  - Stores time series (15 days retention)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Grafana Dashboard (Epic 6-7)                        │  │
│  │  - Provider Availability panel                       │  │
│  │  - Latency P99 graph                                 │  │
│  │  - Error Rate visualization                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 🔗 Dependencies

### Prerequisites
- ✅ **Story 3.8**: Provider Timeout Configuration (reuse `provider.timeout.total`)
- ✅ **Story 3.9**: Provider Retry Logic (reuse `ProviderRetryMetrics`, tag `retried`)
- ✅ **Story 1.8**: Prometheus + Grafana Docker Compose stack (infrastructure ready)
- ✅ **Epic 1**: Micrometer + Prometheus actuator dependency already included

### Enables
- ⏭️ **Story 4.4**: Provider Error Rate Calculator (usa `provider.error.rate` gauge)
- ⏭️ **Story 4.1**: Circuit Breaker per Provider (decision based on error rate metrics)
- ⏭️ **Epic 7**: Admin Portal Monitoring (Grafana dashboard implementation)
- ⏭️ **Story 9.3**: Grafana Dashboards SLO Monitoring (provider metrics integration)

### Maven Dependencies

**Already Included:**
- `io.micrometer:micrometer-registry-prometheus` (Prometheus registry)
- `org.springframework.boot:spring-boot-starter-actuator` (actuator endpoints)

**No New Dependencies Required** ✅

---

## 🧪 Test Strategy

### Unit Tests
- **ProviderMetrics Methods**: recordProviderCall(), updateErrorRate(), recordTimeout() (7 tests)
- **SimpleMeterRegistry**: Verify counters/histograms/gauges incremented correctly
- **Edge Cases**: Zero calls, null provider, negative duration

### Integration Tests
- **Metrics Export**: Verify `/actuator/prometheus` endpoint contains metrics (4 tests)
- **End-to-End Flow**: Provider call → metrics recorded → Prometheus export (2 tests)
- **Error Rate Calculation**: Scheduled task computes correct error rate (2 tests)
- **Multi-Provider**: Metrics tagged correctly per provider (SMS, PUSH, VOICE, BIOMETRIC) (1 test)

**Total Tests:** ~16 tests  
**Target Coverage:** > 90% (ProviderMetrics component)

---

## 📝 Dev Notes

### Learnings from Previous Story (3.9 - Provider Retry Logic)

**From Story 3-9-provider-retry-logic.md (Status: done)**

- **ProviderRetryMetrics Pattern**: Component centraliza retry metrics con MeterRegistry injection - reutilizar mismo patrón para ProviderMetrics
- **MeterRegistry Caching**: Store counter/histogram references como fields para evitar registry lookups en cada call - performance optimization
- **Tag Strategy**: Counters con tags múltiples (`provider`, `attempt`, `after_attempts`) permite queries granulares - aplicar a `provider.calls.total` con tags `provider`, `status`, `channel_type`, `retried`
- **SimpleMeterRegistry Testing**: Unit tests usan SimpleMeterRegistry (no mock) para verificar metrics reales - template disponible en `ProviderResultRetryTest`
- **Integration with Prometheus**: `/actuator/prometheus` endpoint auto-exporta todas las métricas - no requiere configuración adicional
- **Histogram Buckets**: Resilience4j retry duration usa buckets default - personalizar buckets en `provider.latency` para provider-specific ranges
- **Scheduled Task Pattern**: RetryEventListener usa event-driven approach - ProviderErrorRateCalculator usa scheduled task (@Scheduled) - ambos válidos

**Technical Debt from 3.9:**
- Retry metrics son independientes de provider call metrics → Story 3.10 integra ambos (tag `retried` en `provider.calls.total`)
- Error rate NO calculado en 3.9 → Story 3.10 implementa `ProviderErrorRateCalculator` scheduled task

[Source: docs/sprint-artifacts/3-9-provider-retry-logic.md#Dev-Agent-Record]

### Prometheus Metrics Best Practices

**Naming Conventions:**
- Use `_total` suffix para counters (acumulativos)
- Use base units (seconds, bytes) NO milliseconds, kilobytes
- Use snake_case NOT camelCase
- Namespace metrics: `provider.*` (consistent prefix)

**Cardinality Control:**
- Limit tag values (provider: 4 values, status: 2 values, channel_type: 4 values)
- Cardinality: 4 × 2 × 4 × 2 (retried) = 64 time series para `provider.calls.total`
- ✅ Safe: <1000 time series typical threshold

**Histogram Configuration:**
- Buckets must be monotonically increasing
- Cover expected range: 50ms (fastest) to 10s (timeout max)
- Use exponential buckets for better distribution

**Gauge vs Counter:**
- **Counter**: Monotonic increase (calls.total, failures.total) - never decreases
- **Gauge**: Current value (error.rate) - can increase/decrease

**Example:**
```java
// Counter - cumulative
meterRegistry.counter("provider.calls.total", "provider", "SMS").increment();

// Histogram - distribution
meterRegistry.timer("provider.latency", "provider", "SMS").record(Duration.ofMillis(150));

// Gauge - current state
meterRegistry.gauge("provider.error.rate", Tags.of("provider", "SMS"), errorRate);
```

### Error Rate Calculation Strategy

**Window Selection:**
- **1 minute rolling window**: Balance between responsiveness y noise reduction
- Too short (10s): Noisy, false positives
- Too long (5min): Slow to detect incidents

**Calculation:**
```java
double errorRate = failureCount / (successCount + failureCount);
```

**Edge Cases:**
- Zero calls: `errorRate = 0.0` (assume healthy until proven otherwise)
- All failures: `errorRate = 1.0` (100% error rate)
- Integer overflow: Use long for counters (unlikely in 10s window)

**Epic 4 Integration:**
- Circuit breaker threshold: `errorRate > 0.50` (50%) en 30s window
- Story 4.4 usará `provider.error.rate` gauge para decision logic

### Grafana Dashboard Panel Queries

**Provider Availability (Gauge):**
```promql
sum(rate(provider_calls_total{status="success"}[5m])) by (provider)
/ 
sum(rate(provider_calls_total[5m])) by (provider)
* 100
```

**Latency P99 (Graph):**
```promql
histogram_quantile(0.99, 
  sum(rate(provider_latency_bucket[5m])) by (provider, le)
)
```

**Error Rate (Graph with threshold):**
```promql
provider_error_rate * 100
```
- Threshold: Red line at 5%

**Call Volume (Stacked area):**
```promql
sum(rate(provider_calls_total[5m])) by (provider)
```

**Timeout Rate (Single stat):**
```promql
sum(rate(provider_timeout_total[5m]))
/
sum(rate(provider_calls_total[5m]))
* 100
```

### Alert Rule Examples

**High Error Rate:**
```yaml
- alert: ProviderHighErrorRate
  expr: provider_error_rate > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Provider {{ $labels.provider }} error rate is {{ $value }}%"
    description: "Error rate exceeded 5% threshold for 5 minutes"
    runbook_url: "https://wiki.example.com/runbooks/provider-high-error-rate"
```

**High Latency:**
```yaml
- alert: ProviderHighLatency
  expr: histogram_quantile(0.99, provider_latency_bucket) > 0.5
  for: 3m
  labels:
    severity: warning
  annotations:
    summary: "Provider {{ $labels.provider }} P99 latency is {{ $value }}s"
    description: "P99 latency exceeded 500ms for 3 minutes"
```

**Low Availability:**
```yaml
- alert: ProviderAvailabilityLow
  expr: |
    sum(rate(provider_calls_total{status="success"}[5m])) by (provider)
    /
    sum(rate(provider_calls_total[5m])) by (provider)
    < 0.95
  for: 10m
  labels:
    severity: critical
  annotations:
    summary: "Provider {{ $labels.provider }} availability is {{ $value }}%"
    description: "Availability below 95% for 10 minutes - investigate immediately"
```

---

## 🎯 Definition of Done

- [ ] **Code Complete**: `ProviderMetrics` component implementado con 4 public methods
- [ ] **Integration**: `SignatureProviderAdapter` llama `ProviderMetrics.recordProviderCall()` en cada provider call
- [ ] **Error Rate Calculation**: `ProviderErrorRateCalculator` scheduled task calcula error rate cada 10s
- [ ] **Tests Passing**: Unit tests (7+) + Integration tests (9+) PASS
- [ ] **Coverage**: > 90% en `ProviderMetrics` component
- [ ] **Metrics Export**: `/actuator/prometheus` endpoint contiene todas las métricas (calls, latency, error_rate, timeout)
- [ ] **Histogram Buckets**: `provider.latency` configurado con buckets 50ms-10s
- [ ] **Tags Correctos**: Metrics incluyen tags `provider`, `status`, `channel_type`, `retried`
- [ ] **Reuse Existing Metrics**: NO duplicar `provider.timeout.total` (Story 3.8) ni `provider.retry.*` (Story 3.9)
- [ ] **Alert Rules Documented**: `provider-metrics-alerts.yml` creado con 3 alert rules
- [ ] **Grafana Dashboard Spec**: `grafana-provider-dashboard-spec.json` creado con 5 panel definitions
- [ ] **Runbook Updated**: `provider-observability-runbook.md` incluye métricas de Stories 3.8, 3.9, 3.10
- [ ] **README Updated**: Sección "Observability" con métricas disponibles
- [ ] **CHANGELOG**: Story 3.10 entry agregado
- [ ] **JavaDoc**: `ProviderMetrics` completamente documentado
- [ ] **Integration Verified**: Metrics exportados a Prometheus en integration test

---

## 📚 References

**Prometheus Best Practices:**
- https://prometheus.io/docs/practices/naming/
- https://prometheus.io/docs/practices/histograms/

**Micrometer Documentation:**
- https://micrometer.io/docs/concepts#_counters
- https://micrometer.io/docs/concepts#_distribution_summaries

**Spring Boot Actuator:**
- https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.metrics

**Grafana Dashboard Design:**
- https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/

**SRE Monitoring:**
- Google SRE Book - Chapter 6: Monitoring Distributed Systems

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/3-10-provider-metrics-tracking.context.xml` - Story context con artifacts, interfaces, constraints y test ideas (generado 2025-11-28)
- `docs/sprint-artifacts/tech-spec-epic-3.md` - Epic technical specification con acceptance criteria para metrics tracking
- `docs/sprint-artifacts/3-9-provider-retry-logic.md` - Previous story con ProviderRetryMetrics pattern

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

_(To be filled during implementation)_

### Completion Notes List

_(To be filled after story completion)_

### File List

**NEW:**
_(Files to be created during implementation)_

**MODIFIED:**
_(Files to be modified during implementation)_

---

**Story Created:** 2025-11-28  
**Previous Story:** 3.9 - Provider Retry Logic  
**Next Story:** Epic 3 Complete! → Epic 4 (Resilience & Circuit Breaking)

