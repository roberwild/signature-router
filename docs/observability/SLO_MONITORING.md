# SLO Monitoring - Grafana Dashboards

**Author:** Signature Router Team  
**Version:** 1.0  
**Last Updated:** 2025-11-29  
**Story:** 9.3 - Grafana Dashboards & SLO Monitoring

---

## 📊 Overview

Este documento describe los 5 dashboards de Grafana implementados para monitorear los SLOs (Service Level Objectives) del sistema Signature Router:

- **SLO Availability:** ≥99.9% (error rate ≤0.1%)
- **SLO Performance:** P99 < 300ms

---

## 🎯 Dashboards

### 1. Executive Overview

**Purpose:** Vista de alto nivel para management con SLO compliance y métricas clave de negocio.

**Panels (6):**

1. **SLO Availability (Gauge)**
   - **Metric:** Availability percentage
   - **PromQL:**
     ```promql
     1 - (
       sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
       /
       sum(rate(http_server_requests_seconds_count[5m]))
     )
     ```
   - **Thresholds:**
     - Green: ≥99.9%
     - Yellow: 99.5-99.9%
     - Red: <99.5%

2. **SLO Performance P99 (Gauge)**
   - **Metric:** P99 latency
   - **PromQL:**
     ```promql
     histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
     ```
   - **Thresholds:**
     - Green: <300ms
     - Yellow: 300-500ms
     - Red: ≥500ms

3. **Request Rate (Time Series)**
   - **Metric:** Requests per second
   - **PromQL:**
     ```promql
     sum(rate(http_server_requests_seconds_count[1m]))
     ```

4. **Error Rate (Time Series)**
   - **Metric:** Percentage of 5xx errors
   - **PromQL:**
     ```promql
     sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
     /
     sum(rate(http_server_requests_seconds_count[5m]))
     * 100
     ```

5. **Top 5 Error Types (Table)**
   - **Metric:** Most frequent error types
   - **PromQL:**
     ```promql
     topk(5, sum by (error_type) (rate(signature_requests_aborted_total[1h])))
     ```

6. **Cost per Channel (Pie Chart)**
   - **Metric:** Request distribution by channel
   - **PromQL:**
     ```promql
     sum by (channel) (rate(signature_requests_created_total[1h]))
     ```

---

### 2. Provider Health

**Purpose:** Monitoreo de la salud de providers externos (Twilio SMS, FCM Push, Twilio Voice).

**Panels (5):**

1. **Provider Status (Stat)**
   - **Metric:** UP/DOWN status per provider
   - **PromQL:**
     ```promql
     up{job="signature-router-app"}
     ```

2. **Circuit Breaker State (Stat)**
   - **Metric:** CLOSED/OPEN/HALF_OPEN per provider
   - **PromQL:**
     ```promql
     provider_circuit_breaker_state{provider=~"SMS|PUSH|VOICE"}
     ```

3. **Provider Latency P95 (Time Series)**
   - **Metric:** 95th percentile latency per provider
   - **PromQL:**
     ```promql
     histogram_quantile(0.95, sum by (provider, le) (rate(provider_latency_seconds_bucket[5m])))
     ```

4. **Provider Error Rate (Time Series)**
   - **Metric:** Percentage of failed calls per provider
   - **PromQL:**
     ```promql
     sum by (provider) (rate(provider_failures_total[5m]))
     /
     sum by (provider) (rate(provider_calls_total[5m]))
     * 100
     ```

5. **Fallback Rate (Time Series)**
   - **Metric:** Fallback triggers per minute
   - **PromQL:**
     ```promql
     sum by (from_channel, to_channel) (rate(routing_fallback_triggered_total[1m]))
     ```

---

### 3. Performance

**Purpose:** Análisis detallado de latencia y throughput del sistema.

**Panels (5):**

1. **P50/P95/P99 Latency (Time Series)**
   - **Metric:** Latency percentiles
   - **PromQL:**
     ```promql
     histogram_quantile(0.50, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
     histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
     histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
     ```

2. **Throughput (Time Series)**
   - **Metric:** Requests per second
   - **PromQL:**
     ```promql
     sum(rate(http_server_requests_seconds_count[1m]))
     ```

3. **Database Query Time P95 (Time Series)**
   - **Metric:** 95th percentile DB query time
   - **PromQL:**
     ```promql
     histogram_quantile(0.95, sum(rate(hikaricp_connections_acquire_seconds_bucket[5m])) by (le))
     ```

4. **Provider Call Time P95 (Time Series)**
   - **Metric:** 95th percentile provider call time per provider
   - **PromQL:**
     ```promql
     histogram_quantile(0.95, sum by (provider, le) (rate(provider_latency_seconds_bucket[5m])))
     ```

5. **Kafka Publish Time P95 (Time Series)**
   - **Metric:** 95th percentile Kafka publish time
   - **PromQL:**
     ```promql
     histogram_quantile(0.95, sum(rate(kafka_producer_record_send_rate[5m])) by (le))
     ```

---

### 4. Infrastructure

**Purpose:** Monitoreo de JVM, base de datos, y recursos del sistema.

**Panels (5):**

1. **JVM Heap Usage (Time Series)**
   - **Metric:** Heap memory used vs max (MB)
   - **PromQL:**
     ```promql
     jvm_memory_used_bytes{area="heap"} / 1024 / 1024
     jvm_memory_max_bytes{area="heap"} / 1024 / 1024
     ```

2. **JVM GC Pauses (Time Series)**
   - **Metric:** Garbage collection pause duration (ms)
   - **PromQL:**
     ```promql
     rate(jvm_gc_pause_seconds_sum[1m]) * 1000
     ```

3. **Database Connections (Time Series)**
   - **Metric:** Active, Idle, Pending connections (HikariCP)
   - **PromQL:**
     ```promql
     hikaricp_connections_active
     hikaricp_connections_idle
     hikaricp_connections_pending
     ```

4. **Kafka Producer Lag (Time Series)**
   - **Metric:** Messages pending send
   - **PromQL:**
     ```promql
     sum by (topic) (kafka_producer_record_send_total - kafka_producer_record_ack_total)
     ```

5. **CPU / Memory (Time Series)**
   - **Metric:** CPU and Memory usage percentage
   - **PromQL:**
     ```promql
     process_cpu_usage * 100
     (jvm_memory_used_bytes / jvm_memory_max_bytes) * 100
     ```

---

### 5. Business Metrics

**Purpose:** KPIs de negocio (tasa de éxito, distribución por canal, cost optimization).

**Panels (5):**

1. **Signatures by Channel (Pie Chart)**
   - **Metric:** Request distribution (SMS, PUSH, VOICE)
   - **PromQL:**
     ```promql
     sum by (channel) (rate(signature_requests_created_total[1h]))
     ```

2. **Signature Success Rate (Gauge)**
   - **Metric:** Percentage of successfully signed requests
   - **PromQL:**
     ```promql
     sum(rate(signature_requests_completed_total{status="SIGNED"}[5m]))
     /
     sum(rate(signature_requests_created_total[5m]))
     * 100
     ```

3. **Challenge Completion Time (Heatmap)**
   - **Metric:** Distribution of challenge completion times
   - **PromQL:**
     ```promql
     sum(rate(challenges_duration_seconds_bucket[5m])) by (le)
     ```

4. **Routing Rules Usage (Table)**
   - **Metric:** Top 10 routing rules by hit count
   - **PromQL:**
     ```promql
     topk(10, sum by (rule_id) (rate(routing_decisions_total[1h])))
     ```

5. **Cost Optimization (Time Series)**
   - **Metric:** Actual vs optimal cost per channel
   - **PromQL:**
     ```promql
     # Actual cost (simplified)
     sum(rate(signature_requests_created_total{channel="VOICE"}[1h])) * 0.05 +
     sum(rate(signature_requests_created_total{channel="SMS"}[1h])) * 0.01 +
     sum(rate(signature_requests_created_total{channel="PUSH"}[1h])) * 0.001
     ```

---

## 🚨 SLO Alerts

### Alert 1: SLO Availability Burn Rate (Critical)

**Condition:** Error rate > 0.1% for 5 minutes

```yaml
- alert: SLOAvailabilityBurnRateCritical
  expr: |
    (
      1 - (
        sum(rate(http_server_requests_seconds_count{status!~"5.."}[1h]))
        /
        sum(rate(http_server_requests_seconds_count[1h]))
      )
    ) > 0.001
  for: 5m
  labels:
    severity: critical
    slo: availability
```

**Runbook:** https://wiki.example.com/runbooks/slo-availability-burn-rate

---

### Alert 2: SLO Performance P99 Burn Rate (Critical)

**Condition:** P99 latency > 300ms for 5 minutes

```yaml
- alert: SLOPerformanceP99BurnRateCritical
  expr: |
    histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le)) > 0.3
  for: 5m
  labels:
    severity: critical
    slo: performance
```

**Runbook:** https://wiki.example.com/runbooks/slo-performance-p99

---

## 🔧 Configuration

### Dashboard Provisioning

Los dashboards se cargan automáticamente al iniciar Grafana mediante provisioning:

**File:** `observability/grafana/provisioning/dashboards/dashboards.yaml`

```yaml
apiVersion: 1
providers:
  - name: 'Signature Router'
    orgId: 1
    folder: 'Banking'
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards
```

### Datasource Auto-Configuration

Prometheus se configura automáticamente como datasource por defecto:

**File:** `observability/grafana/provisioning/datasources/prometheus.yaml`

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
```

---

## 🚀 Usage

### Accessing Grafana

1. Start Docker Compose:
   ```bash
   docker-compose up -d grafana prometheus
   ```

2. Access Grafana UI:
   ```
   http://localhost:3000
   ```

3. Default credentials:
   - **Username:** admin
   - **Password:** admin

4. Navigate to **Dashboards → Banking** folder to see all 5 dashboards

### Dashboard Variables

All dashboards support filtering by:

- **$environment**: local / uat / prod
- **$region**: local / us-east-1 / eu-west-1

Use the dropdown selectors at the top of each dashboard to filter metrics.

---

## 🧪 Testing

### Generate Test Traffic

```bash
# Generate 100 signature requests
for i in {1..100}; do
  curl -X POST http://localhost:8080/api/v1/signatures \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"customerId\":\"CUST$i\",\"amount\":100,\"currency\":\"USD\"}"
done
```

### Trigger SLO Alert

```bash
# Generate 5xx errors to trigger availability alert
for i in {1..50}; do
  curl -X POST http://localhost:8080/api/v1/signatures \
    -H "Content-Type: application/json" \
    -d '{"invalid":"payload"}'
done

# Wait 5 minutes
sleep 300

# Check Prometheus alerts
curl http://localhost:9090/api/v1/alerts | jq
```

---

## 📸 Screenshots

Dashboard screenshots are available in `docs/observability/screenshots/`:

- `executive-overview.png`
- `provider-health.png`
- `performance.png`
- `infrastructure.png`
- `business-metrics.png`

---

## 🔍 Troubleshooting

### Issue: Dashboards not loading

**Symptom:** Grafana UI shows empty "Banking" folder

**Solution:**
1. Check Grafana logs: `docker-compose logs grafana`
2. Verify provisioning config mounted:
   ```bash
   docker exec signature-router-grafana ls -la /etc/grafana/provisioning/dashboards
   ```
3. Restart Grafana: `docker-compose restart grafana`

---

### Issue: "No data" in panels

**Symptom:** Panels show "No data" even with traffic

**Solution:**
1. Verify Prometheus is scraping:
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```
2. Verify metrics are exposed:
   ```bash
   curl http://localhost:8080/actuator/prometheus | grep signature_requests
   ```
3. Check PromQL query in Prometheus UI: http://localhost:9090/graph

---

### Issue: Alerts not firing

**Symptom:** SLO alerts not appearing in Prometheus UI

**Solution:**
1. Verify alert rules loaded:
   ```bash
   curl http://localhost:9090/api/v1/rules
   ```
2. Check Prometheus logs for syntax errors:
   ```bash
   docker-compose logs prometheus | grep error
   ```
3. Manually evaluate PromQL expression in Prometheus UI

---

## 📚 References

- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [SLO Best Practices](https://sre.google/workbook/implementing-slos/)
- [Story 9.2: Prometheus Metrics Export](../sprint-artifacts/9-2-prometheus-metrics-export.md)
- [Tech Spec Epic 9](../sprint-artifacts/tech-spec-epic-9.md)

