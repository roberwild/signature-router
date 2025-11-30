# Epic 9: Observability & SLO Tracking - Technical Specification

**Epic ID:** Epic 9  
**Epic Name:** Observability & SLO Tracking  
**Date Created:** 2025-11-29  
**Author:** BMAD Architect Agent  
**Status:** Ready for Implementation  
**Version:** 1.0  

---

## Executive Summary

Epic 9 implementa **banking-grade observability** para cumplir con SLOs operacionales (≥99.9% availability, P99 < 300ms) mediante metrics, logging, distributed tracing, y alerting proactivo.

**Business Value**: Reducir MTTR (Mean Time To Repair) de 4 horas → 30 min (87% reduction) y MTTD (Mean Time To Detect) de 2 horas → 5 min (96% reduction), evitando $500K/año en downtime.

**Dependencies**: Epic 1 (Prometheus/Grafana infrastructure), Epic 5 (Event-Driven)

---

## Table of Contents

1. [Business Context](#business-context)
2. [Stories Overview](#stories-overview)
3. [Non-Functional Requirements](#non-functional-requirements)
4. [Architecture & Design](#architecture--design)
5. [Story-by-Story Technical Details](#story-by-story-technical-details)
6. [Testing Strategy](#testing-strategy)
7. [Dependencies & Prerequisites](#dependencies--prerequisites)
8. [Risks & Mitigations](#risks--mitigations)

---

## Business Context

### Why Epic 9 Matters

**Operational Impact**:
- **Proactive Incident Detection**: Alerting ANTES de que usuarios reporten problemas
- **Fast Debugging**: Distributed tracing reduce debug time de 4h → 30min
- **SLO Compliance**: Métricas en tiempo real para cumplir SLOs (99.9% availability, P99 < 300ms)
- **Executive Visibility**: Dashboards para management (request rate, error rate, costs)

**Cost Impact**:
- **Downtime Cost**: $10K/hora → Alerting proactivo evita $500K/año
- **Engineering Time**: 40% tiempo debugging → 10% (freed capacity)
- **SLO Penalties**: Evita penalizaciones contractuales por incumplimiento SLO

---

## Stories Overview

| Story | Name | Goal | SP | Duration | Dependencies |
|-------|------|------|----|-----------| ------------|
| **9.1** | Structured JSON Logging & MDC | Logs estructurados listos para ELK | 0 | ✅ DONE | Epic 1 |
| **9.2** | Prometheus Metrics Export | 50+ metrics para SLO tracking | 5 | 1 week | Epic 1 |
| **9.3** | Grafana Dashboards & SLO | 5 dashboards + SLO burn rate | 3 | 3-4 días | 9.2 |
| **9.4** | Distributed Tracing (Jaeger) | 100% request tracing (dev) | 8 | 1 week | Epic 5 |
| **9.5** | Alerting Rules (Alertmanager) | Critical/warning alerts | 3 | 3-4 días | 9.2, 9.3 |
| **9.6** | SLO Compliance Reporting | Error budget + reports | 5 | 1 week | 9.2, 9.3 |

**Total**: 24 Story Points (2-3 weeks)

---

## Non-Functional Requirements

### NFR-O (Observability): 14 Requirements

**Logging (NFR-O1 to NFR-O4)**:
- **NFR-O1** ✅: Structured JSON logging (Logback + Logstash encoder) - Story 9.1 DONE
- **NFR-O2** ✅: MDC context (traceId, signatureId, customerId pseudonymized) - Story 9.1 DONE
- **NFR-O3**: Log aggregation (ELK Stack o Loki) - Story 9.4
- **NFR-O4** ✅: Log retention 90 días - Story 9.1 DONE

**Metrics (NFR-O5 to NFR-O8)**:
- **NFR-O5**: Prometheus metrics en `/actuator/prometheus` - Story 9.2
- **NFR-O6**: Business metrics (signature.created, challenge.sent, fallback.rate) - Story 9.2
- **NFR-O7**: Technical metrics (provider.latency P50/P95/P99, provider.error_rate) - Story 9.2
- **NFR-O8**: Grafana dashboards para SLO tracking - Story 9.3

**Distributed Tracing (NFR-O9 to NFR-O11)**:
- **NFR-O9**: Jaeger o Zipkin para distributed tracing - Story 9.4
- **NFR-O10**: Trace propagation a Kafka consumers - Story 9.4
- **NFR-O11**: Trace context en provider API calls - Story 9.4

**Alerting (NFR-O12 to NFR-O14)**:
- **NFR-O12**: Critical alerts (P99 > 300ms, availability < 99.9%) - Story 9.5
- **NFR-O13**: Warning alerts (provider degraded, high fallback rate > 10%) - Story 9.5
- **NFR-O14**: Alert delivery (PagerDuty, Slack, Email) - Story 9.5

---

### NFR-P (Performance): 10 Requirements

**Latency (NFR-P1 to NFR-P5)**:
- **NFR-P1**: P99 latency < 300ms - Monitored by Story 9.2, 9.3
- **NFR-P2**: P50 latency < 150ms - Monitored by Story 9.2, 9.3
- **NFR-P3**: Database query timeout 2s - Monitored by Story 9.2
- **NFR-P4**: Provider API timeout 5s - Monitored by Story 9.2
- **NFR-P5**: Kafka send timeout 1.5s - Monitored by Story 9.2

**Throughput (NFR-P6 to NFR-P8)**:
- **NFR-P6**: 100 signatures/sec sostenido - Monitored by Story 9.2, 9.3
- **NFR-P7**: 300 signatures/sec picos (5 min) - Monitored by Story 9.2, 9.3
- **NFR-P8**: Connection pool ≤ 20 connections - Monitored by Story 9.2

**Resources (NFR-P9 to NFR-P10)**:
- **NFR-P9**: Memory < 2GB per instance - Monitored by Story 9.2, 9.3
- **NFR-P10**: CPU < 70% normal operation - Monitored by Story 9.2, 9.3

---

## Architecture & Design

### Observability Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   OBSERVABILITY STACK                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   LOGGING    │  │   METRICS    │  │   TRACING    │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ Logback JSON │  │ Prometheus   │  │ Sleuth/Jaeger│     │
│  │ MDC Context  │  │ Micrometer   │  │ OpenZipkin   │     │
│  │ ELK Stack    │  │ Grafana      │  │ B3 Propagation│    │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  ALERTING                             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Prometheus Alertmanager                              │  │
│  │  → PagerDuty / Slack / Email                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Three Pillars of Observability

**1. Logging** (What happened?)
- Structured JSON logs (Logstash encoder)
- MDC context propagation (traceId)
- Log levels: ERROR (critical), WARN (degraded), INFO (business events)
- Retention: 90 días (compliance)

**2. Metrics** (How many? How fast?)
- Prometheus metrics (pull model, 15s scrape interval)
- Micrometer facade (vendor-agnostic)
- Histogram buckets: [0.001, 0.01, 0.05, 0.1, 0.3, 0.5, 1.0, 3.0, 5.0]
- Retention: 30 días

**3. Distributed Tracing** (Where is the bottleneck?)
- Spring Cloud Sleuth (auto-instrumentation)
- Jaeger backend (trace storage + UI)
- B3 context propagation (HTTP + Kafka headers)
- Sampling: 100% dev, 10% prod

---

## Story-by-Story Technical Details

---

### Story 9.1: Structured JSON Logging & MDC

**Status:** ✅ DONE (Critical Improvement #5)

**Goal:** Logs estructurados en JSON con MDC context para correlación

**Implementation Summary:**
- ✅ Logstash JSON encoder
- ✅ MDC context: traceId, customerId (pseudonymized), requestId
- ✅ ELK Stack integration ready
- ✅ Log retention 90 días

**Files Created:**
- `logback-spring.xml` (JSON encoder configuration)
- `LoggingFilter.java` (MDC population)

**No additional work required** - Story already completed.

---

### Story 9.2: Prometheus Metrics Export

**Goal:** Exportar 50+ metrics para SLO tracking vía Prometheus

#### Acceptance Criteria

**AC1**: Prometheus metrics endpoint activo
```bash
curl http://localhost:8080/actuator/prometheus
# Expected: metrics in Prometheus format (text/plain)
```

**AC2**: Business metrics implementados (10+ metrics)
```java
// Signature request metrics
signature_requests_created_total{channel="SMS|PUSH|VOICE"}
signature_requests_completed_total{status="SIGNED|FAILED|EXPIRED"}
signature_requests_duration_seconds{quantile="0.5|0.95|0.99"}

// Challenge metrics
challenges_sent_total{provider="TWILIO|FCM|VOICE",channel="SMS|PUSH|VOICE"}
challenges_completed_total{status="COMPLETED|FAILED|EXPIRED"}
challenges_duration_seconds{quantile="0.5|0.95|0.99"}

// Routing metrics
routing_decisions_total{rule_id="rule-123"}
routing_fallback_triggered_total{from_channel="SMS",to_channel="VOICE"}
routing_timeline_events_total{event_type="RULE_MATCHED|CHALLENGE_SENT|FALLBACK"}
```

**AC3**: Provider metrics implementados
```java
// Already exists from Epic 3 - verify exposure
provider_calls_total{provider="SMS|PUSH|VOICE",status="success|failure"}
provider_latency_seconds{provider="SMS|PUSH|VOICE",quantile="0.5|0.95|0.99"}
provider_timeout_total{provider="SMS|PUSH|VOICE"}
provider_circuit_breaker_state{provider="SMS",state="CLOSED|OPEN|HALF_OPEN"}
```

**AC4**: Infrastructure metrics
```java
// JVM (automatic via Micrometer)
jvm_memory_used_bytes{area="heap|nonheap"}
jvm_gc_pause_seconds_*
jvm_threads_*

// HikariCP (automatic)
hikaricp_connections_active
hikaricp_connections_idle
hikaricp_connections_pending

// Kafka (automatic)
kafka_producer_record_send_total
kafka_producer_record_error_total
```

**AC5**: Custom @Timed annotations
```java
@Service
public class CreateSignatureRequestUseCase {
    
    @Timed(value = "signature.request.create", percentiles = {0.5, 0.95, 0.99})
    public SignatureRequest execute(CreateSignatureRequestCommand cmd) {
        // Implementation
    }
}
```

**AC6**: Metrics registry configuration
```yaml
# application.yml
management:
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        http.server.requests: true
        signature.request.create: true
        challenge.sent: true
      slo:
        http.server.requests: 50ms,100ms,300ms,500ms,1s
```

#### Technical Design

**Metrics Categories**:

1. **Business Metrics** (custom @Counted / @Timed)
   - SignatureRequestService: create, complete, abort
   - ChallengeService: send, complete, fail
   - RoutingService: evaluate, fallback

2. **Provider Metrics** (already exists from Epic 3)
   - Calls total (success/failure)
   - Latency histogram
   - Timeouts counter
   - Circuit breaker state gauge

3. **Infrastructure Metrics** (automatic)
   - JVM (memory, GC, threads)
   - HikariCP (connections)
   - Kafka (producer lag)

**Files to Create:**
- `MetricsConfig.java` - MeterRegistry customization
- `BusinessMetrics.java` - Custom business metrics wrapper
- `SignatureRequestMetrics.java` - @Aspect for automatic metrics
- `ChallengeMetrics.java` - @Aspect for challenge metrics

**Files to Modify:**
- `application.yml` - Metrics configuration
- Use cases (add @Timed / @Counted annotations)

**Estimated Effort:** 5 Story Points (1 week)

---

### Story 9.3: Grafana Dashboards & SLO Monitoring

**Goal:** 5 Grafana dashboards con SLO panels + burn rate alerts

#### Acceptance Criteria

**AC1**: 5 Grafana dashboards creados

**Dashboard 1: Executive Overview**
```
Panels:
- SLO Availability (gauge): Current 99.95% (target ≥99.9%)
- SLO Performance P99 (gauge): Current 250ms (target <300ms)
- Request Rate (graph): req/sec over time
- Error Rate (graph): % over time
- Top 5 Error Types (table)
- Cost per Channel (pie chart)
```

**Dashboard 2: Provider Health**
```
Panels:
- Provider Status (stat): SMS UP, Push UP, Voice DOWN
- Circuit Breaker State (stat): CLOSED/OPEN/HALF_OPEN
- Provider Latency P95 (graph): by provider
- Provider Error Rate (graph): by provider
- Fallback Rate (graph): fallback triggers over time
```

**Dashboard 3: Performance**
```
Panels:
- P50/P95/P99 Latency (graph): percentiles over time
- Throughput (graph): req/sec
- Database Query Time (graph): P95
- Provider Call Time (graph): P95 by provider
- Kafka Publish Time (graph): P95
```

**Dashboard 4: Infrastructure**
```
Panels:
- JVM Heap Usage (graph): used/max
- JVM GC Pauses (graph): duration + frequency
- Database Connections (graph): active/idle/pending
- Kafka Producer Lag (graph): lag by topic
- CPU/Memory (graph): system metrics
```

**Dashboard 5: Business Metrics**
```
Panels:
- Signatures by Channel (pie chart): SMS 60%, Push 30%, Voice 10%
- Signature Success Rate (gauge): 95%
- Challenge Completion Time (heatmap): distribution
- Routing Rules Usage (table): top 10 rules by hits
- Cost Optimization (graph): actual vs optimal cost
```

**AC2**: SLO burn rate alerts configurados
```yaml
# Grafana alert rules
- alert: SLOAvailabilityBurnRate
  expr: |
    (
      1 - (
        sum(rate(http_server_requests_seconds_count{status!~"5.."}[1h]))
        /
        sum(rate(http_server_requests_seconds_count[1h]))
      )
    ) > 0.001  # 0.1% error rate threshold
  for: 5m
  annotations:
    summary: "SLO Availability burn rate too high"

- alert: SLOPerformanceBurnRate
  expr: |
    histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le)) > 0.3
  for: 5m
  annotations:
    summary: "SLO Performance P99 > 300ms"
```

**AC3**: Dashboard provisioning automated
```yaml
# observability/grafana/provisioning/dashboards/dashboards.yaml
apiVersion: 1
providers:
  - name: 'Signature Router'
    folder: 'Banking'
    type: file
    options:
      path: /etc/grafana/dashboards
```

**AC4**: Datasource auto-configured
```yaml
# observability/grafana/provisioning/datasources/prometheus.yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
```

#### Technical Design

**Dashboard Files** (JSON):
- `executive-overview.json`
- `provider-health.json`
- `performance.json`
- `infrastructure.json`
- `business-metrics.json`

**PromQL Queries**:
```promql
# Availability SLO
1 - (
  sum(rate(http_server_requests_seconds_count{status!~"5.."}[5m]))
  /
  sum(rate(http_server_requests_seconds_count[5m]))
)

# Performance SLO (P99)
histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))

# Error rate
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_server_requests_seconds_count[5m]))
```

**Files to Create:**
- 5 dashboard JSON files
- `grafana/provisioning/dashboards/dashboards.yaml`
- `grafana/provisioning/datasources/prometheus.yaml`
- `SLO_MONITORING.md` (documentation)

**Files to Modify:**
- `docker-compose.yml` - Grafana volume mounts

**Estimated Effort:** 3 Story Points (3-4 días)

---

### Story 9.4: Distributed Tracing (Jaeger)

**Goal:** 100% request tracing (dev) para debugging rápido

#### Acceptance Criteria

**AC1**: Spring Cloud Sleuth configurado
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-sleuth-zipkin</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  sleuth:
    sampler:
      probability: 1.0  # 100% sampling in dev
    baggage:
      remote-fields:
        - customerId
        - signatureRequestId
  zipkin:
    base-url: http://localhost:9411
    sender:
      type: web
```

**AC2**: Jaeger backend running
```yaml
# docker-compose.yml
jaeger:
  image: jaegertracing/all-in-one:1.51
  ports:
    - "16686:16686"  # Jaeger UI
    - "9411:9411"    # Zipkin compatible endpoint
  environment:
    - COLLECTOR_ZIPKIN_HOST_PORT=:9411
```

**AC3**: Trace context propagation (HTTP)
```java
// Automatic via Sleuth - verify in logs
// TraceId: 64f3a2b1c9e8d7f6
// SpanId: a1b2c3d4e5f6g7h8
```

**AC4**: Trace context propagation (Kafka)
```java
@Component
public class KafkaTracingProducer {
    
    @Autowired
    private Tracer tracer;
    
    public void send(SignatureEvent event) {
        Span span = tracer.currentSpan();
        // Inject trace context into Kafka headers
        kafkaTemplate.send(topic, event);
    }
}
```

**AC5**: Custom span annotations
```java
@Service
public class CreateSignatureRequestUseCase {
    
    @Autowired
    private Tracer tracer;
    
    @NewSpan("signature.request.create")
    public SignatureRequest execute(CreateSignatureRequestCommand cmd) {
        Span span = tracer.currentSpan();
        span.tag("customerId", cmd.customerId());
        span.tag("channel", cmd.channel());
        // Implementation
    }
}
```

**AC6**: Provider calls traced
```java
@Component
public class TwilioSmsProvider implements SignatureProviderPort {
    
    @NewSpan("provider.sms.send")
    public ProviderResult sendChallenge(SignatureChallenge challenge) {
        Span span = tracer.currentSpan();
        span.tag("provider", "TWILIO");
        span.tag("phone", maskPhone(challenge.getRecipient()));
        // Implementation
    }
}
```

**AC7**: Jaeger UI accessible
```bash
# Access Jaeger UI
open http://localhost:16686

# Search traces by:
# - Service: signature-router
# - Operation: signature.request.create
# - Tags: customerId=xxx
```

#### Technical Design

**Trace Structure**:
```
Trace: CreateSignatureRequest (64f3a2b1c9e8d7f6)
├─ Span: signature.request.create (200ms)
│  ├─ Tag: customerId=pseudo-123
│  ├─ Tag: channel=SMS
│  ├─ Span: routing.evaluate (50ms)
│  │  └─ Tag: ruleId=rule-xyz
│  ├─ Span: challenge.create (30ms)
│  └─ Span: provider.sms.send (120ms)
│     ├─ Tag: provider=TWILIO
│     ├─ Tag: phone=+34***1234
│     └─ Event: SMS sent successfully
└─ Span: kafka.publish (20ms)
   └─ Tag: topic=signature.events
```

**Baggage Items** (propagated across services):
- `customerId` (pseudonymized)
- `signatureRequestId`
- `correlationId`

**Files to Create:**
- `TracingConfig.java` - Sleuth customization
- `KafkaTracingConfig.java` - Kafka trace propagation
- `DISTRIBUTED_TRACING.md` - Documentation

**Files to Modify:**
- `pom.xml` - Sleuth dependencies
- `docker-compose.yml` - Jaeger service
- `application-{local/uat/prod}.yml` - Sampling config
- Use cases - Add @NewSpan annotations

**Estimated Effort:** 8 Story Points (1 week)

---

### Story 9.5: Alerting Rules (Alertmanager)

**Goal:** Critical/warning alerts con routing a PagerDuty/Slack

#### Acceptance Criteria

**AC1**: Prometheus Alertmanager running
```yaml
# docker-compose.yml
alertmanager:
  image: prom/alertmanager:v0.26.0
  ports:
    - "9093:9093"
  volumes:
    - ./observability/alertmanager:/etc/alertmanager
```

**AC2**: Critical alerts configurados (5 alerts)
```yaml
# observability/prometheus/alerts/critical.yml
groups:
  - name: critical
    interval: 30s
    rules:
      - alert: SLOAvailabilityBreach
        expr: |
          (
            1 - (
              sum(rate(http_server_requests_seconds_count{status!~"5.."}[5m]))
              /
              sum(rate(http_server_requests_seconds_count[5m]))
            )
          ) > 0.001
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "SLO Availability < 99.9%"
          
      - alert: SLOPerformanceBreach
        expr: |
          histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le)) > 0.3
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "SLO Performance P99 > 300ms"
          
      - alert: AllProvidersDEGRADED
        expr: |
          count(provider_circuit_breaker_state{state="OPEN"} == 1) == count(provider_circuit_breaker_state)
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "All providers degraded - no signature delivery possible"
          
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          hikaricp_connections_pending > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool exhausted"
          
      - alert: KafkaProducerLagHigh
        expr: |
          kafka_producer_record_send_total - kafka_producer_record_send_total offset 5m > 1000
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Kafka producer lag > 1000 messages"
```

**AC3**: Warning alerts configurados
```yaml
# observability/prometheus/alerts/warning.yml
groups:
  - name: warning
    interval: 1m
    rules:
      - alert: ProviderDegraded
        expr: |
          provider_circuit_breaker_state{state="OPEN"} == 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Provider {{ $labels.provider }} circuit breaker OPEN"
          
      - alert: HighFallbackRate
        expr: |
          sum(rate(routing_fallback_triggered_total[5m])) / sum(rate(signature_requests_created_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Fallback rate > 10%"
```

**AC4**: Alert routing configurado
```yaml
# observability/alertmanager/alertmanager.yml
route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@bank.com'
        
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        
  - name: 'slack'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#signature-router-alerts'
```

**AC5**: Alert silencing & inhibition
```yaml
# Inhibition: suppress warning if critical firing
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

#### Technical Design

**Alert Categories**:

1. **Critical** (PagerDuty - immediate response):
   - SLO breaches (availability, performance)
   - All providers degraded
   - Database/Kafka issues

2. **Warning** (Slack - monitoring):
   - Single provider degraded
   - High fallback rate
   - Resource usage high

**Files to Create:**
- `observability/prometheus/alerts/critical.yml`
- `observability/prometheus/alerts/warning.yml`
- `observability/alertmanager/alertmanager.yml`
- `ALERTING_RUNBOOK.md` - Alert response procedures

**Files to Modify:**
- `docker-compose.yml` - Alertmanager service
- `observability/prometheus.yml` - Include alert rules

**Estimated Effort:** 3 Story Points (3-4 días)

---

### Story 9.6: SLO Compliance Reporting

**Goal:** SLO error budget calculation + weekly/monthly reports

#### Acceptance Criteria

**AC1**: SLO error budget calculation
```java
@Service
public class SLOCalculator {
    
    public SLOReport calculateMonthly(YearMonth month) {
        // SLO Availability: 99.9% = 43 minutes downtime/month allowed
        double totalRequests = getTotalRequests(month);
        double failedRequests = getFailedRequests(month);
        double availability = 1 - (failedRequests / totalRequests);
        
        double errorBudget = 0.001; // 0.1%
        double errorBudgetConsumed = failedRequests / totalRequests;
        double errorBudgetRemaining = errorBudget - errorBudgetConsumed;
        
        return SLOReport.builder()
            .month(month)
            .availability(availability)
            .errorBudgetRemaining(errorBudgetRemaining)
            .build();
    }
}
```

**AC2**: Weekly SLO report generation
```java
@Scheduled(cron = "0 0 9 * * MON") // Every Monday 9am
public void generateWeeklySLOReport() {
    SLOReport report = sloCalculator.calculateWeekly(LocalDate.now().minusWeeks(1));
    emailService.send(report, "team@bank.com");
}
```

**AC3**: SLO dashboard for stakeholders
```
# Grafana dashboard: SLO Compliance
Panels:
- Error Budget Remaining (gauge): 80% (green if >50%, red if <20%)
- Availability Trend (graph): 99.95% (last 30 days)
- Performance P99 Trend (graph): 250ms (last 30 days)
- SLO Breach History (table): incidents with duration
```

**AC4**: Incident postmortem template
```markdown
# Incident Postmortem Template

**Incident ID:** INC-2025-001
**Date:** 2025-11-29
**Duration:** 15 minutes
**Severity:** Critical
**SLO Impact:** 0.05% error budget consumed

## Timeline
- 10:00: Alert fired (P99 > 300ms)
- 10:05: On-call engineer paged
- 10:10: Root cause identified (database slow query)
- 10:15: Mitigation applied (query optimized)

## Root Cause
Database query missing index on `signature_request.created_at`

## Action Items
- [ ] Add missing index (Owner: DBA, Due: 2025-12-01)
- [ ] Add slow query alerting (Owner: DevOps, Due: 2025-12-05)

## Lessons Learned
- Missing monitoring on database slow queries
- Need automated index recommendation tool
```

#### Technical Design

**SLO Targets**:
- **Availability SLO:** ≥99.9% (43 min/month downtime budget)
- **Performance SLO:** P99 < 300ms
- **Error Budget:** 0.1% failed requests allowed

**Files to Create:**
- `SLOCalculator.java` - Error budget calculation
- `SLOReportService.java` - Weekly/monthly reports
- `SLOReport.java` - DTO
- `slo-compliance-dashboard.json` - Grafana dashboard
- `INCIDENT_POSTMORTEM_TEMPLATE.md`

**Files to Modify:**
- `application.yml` - Scheduler config

**Estimated Effort:** 5 Story Points (1 week)

---

## Testing Strategy

### Unit Tests

**Metrics**:
- Test custom metric registration
- Test metric values increment
- Test histogram buckets

**SLO Calculator**:
- Test error budget calculation
- Test SLO breach detection
- Test edge cases (zero requests)

### Integration Tests

**Metrics Endpoint**:
```java
@Test
void shouldExposePrometheusMetrics() {
    ResponseEntity<String> response = restTemplate.getForEntity(
        "/actuator/prometheus",
        String.class
    );
    
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).contains("signature_requests_created_total");
}
```

**Distributed Tracing**:
```java
@Test
void shouldPropagateTraceContext() {
    String traceId = createSignatureRequest();
    
    // Verify trace in logs
    assertThat(logs).contains("TraceId=" + traceId);
    
    // Verify span in Jaeger (manual verification)
}
```

### Load Tests

**SLO Validation**:
```bash
# Gatling load test
mvn gatling:test -Dgatling.simulationClass=SLOLoadTest

# Target: 100 req/sec sustained for 10 minutes
# Validate: P99 < 300ms, error rate < 0.1%
```

---

## Dependencies & Prerequisites

### Infrastructure

- ✅ **Prometheus** - Already configured (Story 1.8)
- ✅ **Grafana** - Already configured (Story 1.8)
- 📝 **Jaeger** - Add to docker-compose.yml
- 📝 **Alertmanager** - Add to docker-compose.yml

### Maven Dependencies

```xml
<!-- Already included -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

<!-- NEW for Epic 9 -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-sleuth-zipkin</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-dependencies</artifactId>
    <version>2023.0.0</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

---

## Risks & Mitigations

### Risk 1: Observability Overhead

**Risk**: Metrics/tracing overhead > 5% CPU/memory

**Mitigation**:
- Use sampling (10% in prod)
- Async metric recording
- Monitor metrics overhead with `micrometer_overhead` metric

---

### Risk 2: Jaeger Storage Limits

**Risk**: Trace storage fills disk (7 días retention)

**Mitigation**:
- Configure Jaeger storage limits
- Automated cleanup (Jaeger TTL)
- Monitor Jaeger disk usage

---

### Risk 3: Alert Fatigue

**Risk**: Too many false positive alerts

**Mitigation**:
- Tune alert thresholds based on real data
- Use inhibition rules
- Group related alerts

---

## Epic-Level Acceptance Criteria

1. ✅ All 6 stories DONE (24 SP)
2. ✅ 50+ Prometheus metrics exposed
3. ✅ 5 Grafana dashboards operational
4. ✅ Distributed tracing 100% requests (dev)
5. ✅ Critical/warning alerts configured
6. ✅ SLO reporting automated
7. ✅ Integration tests > 80% coverage
8. ✅ Documentation complete (3 guides)
9. ✅ No regressions (Epic 1-8 tests passing)

---

**Document Version:** 1.0  
**Status:** ✅ Ready for Implementation  
**Next Step:** Create Story 9.2 (Prometheus Metrics Export)

---

*For implementation workflow, use `/bmad:bmm:workflows:dev-story` for each story.*

