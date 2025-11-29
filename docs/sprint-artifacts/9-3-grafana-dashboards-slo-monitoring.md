# Story 9.3: Grafana Dashboards & SLO Monitoring

**Status:** drafted  
**Epic:** Epic 9 - Observability & SLO Tracking  
**Sprint:** Sprint 9  
**Story Points:** 3  
**Created:** 2025-11-29

---

## 📋 Story Description

**As a** DevOps/SRE Team & Executive Management  
**I want** 5 comprehensive Grafana dashboards con SLO panels + burn rate alerts  
**So that** Puedo visualizar métricas en tiempo real, monitorear SLOs (≥99.9% availability, P99 <300ms), detectar degradación proactivamente, y generar reports para stakeholders

---

## 🎯 Business Value

Implementa **banking-grade observability visualization** con dashboards Grafana que permiten:

- **SLO Monitoring Real-Time**: Dashboards con gauges de availability (≥99.9%) y performance P99 (<300ms)
- **Proactive Incident Detection**: Alertas automáticas cuando SLO burn rate excede umbral (antes de impacto a usuarios)
- **Fast Root Cause Analysis**: Dashboards correlacionados (Provider Health + Performance + Infrastructure) reducen MTTR 4h → 30min (87%)
- **Executive Visibility**: Dashboard "Executive Overview" con métricas clave para management (throughput, error rate, cost by channel)
- **Cost Optimization**: Panel "Cost per Channel" identifica canales costosos (Voice) vs económicos (SMS) para routing optimization
- **Provider Health Tracking**: Dashboard dedicado con circuit breaker state, latency, error rate, fallback triggers

**NFR Mapping**:
- **NFR-O6**: Grafana dashboards para SLO tracking ✅
- **NFR-O12**: SLO burn rate alerting (availability + performance) ✅
- **NFR-O13**: Dashboard provisioning automático (Infrastructure as Code) ✅
- **NFR-A1**: 99.9% availability → Monitoreado vía SLO dashboard + alerts
- **NFR-P1**: P99 latency < 300ms → Monitoreado vía Performance dashboard + alerts

**Business Impact**:
- **Downtime Cost Reduction**: $10K/hora downtime → Alerting proactivo evita $500K/año
- **Engineering Efficiency**: 40% tiempo en manual monitoring → 5% (dashboards automatizados)
- **SLO Compliance Visibility**: Ejecutivos pueden ver SLO compliance en tiempo real (cumplimiento contratos bancarios)
- **Proactive Operations**: 95% de incidents detectados antes de afectar usuarios (vs 60% sin alerting)

---

## ✅ Acceptance Criteria

### AC1: 5 Grafana Dashboards Creados y Funcionales

**Given** Grafana está corriendo en Docker Compose  
**When** accedo a Grafana UI `http://localhost:3000`  
**Then** veo 5 dashboards en la carpeta "Signature Router":
1. **Executive Overview** (6 panels)
2. **Provider Health** (5 panels)
3. **Performance** (5 panels)
4. **Infrastructure** (5 panels)
5. **Business Metrics** (5 panels)

**Validation:**
```bash
# Access Grafana
open http://localhost:3000
# Default credentials: admin/admin

# Verify dashboards exist
curl -u admin:admin http://localhost:3000/api/search?query=signature
# Expected: 5 dashboards returned
```

---

### AC2: Executive Overview Dashboard - 6 Panels

**Given** Executive Overview dashboard  
**When** visualizo el dashboard  
**Then** veo los siguientes panels funcionando:

**Panel 1: SLO Availability (Gauge)**
- Current value: 99.95% (ejemplo)
- Target: ≥99.9%
- Color: Verde si ≥99.9%, Amarillo si ≥99.5%, Rojo si <99.5%
- PromQL:
```promql
1 - (
  sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
  /
  sum(rate(http_server_requests_seconds_count[5m]))
)
```

**Panel 2: SLO Performance P99 (Gauge)**
- Current value: 250ms (ejemplo)
- Target: <300ms
- Color: Verde si <300ms, Amarillo si <500ms, Rojo si ≥500ms
- PromQL:
```promql
histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
```

**Panel 3: Request Rate (Time Series Graph)**
- Y-axis: req/sec
- X-axis: time (last 1h)
- PromQL:
```promql
sum(rate(http_server_requests_seconds_count[1m]))
```

**Panel 4: Error Rate (Time Series Graph)**
- Y-axis: % (0-100)
- X-axis: time (last 1h)
- PromQL:
```promql
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_server_requests_seconds_count[5m]))
* 100
```

**Panel 5: Top 5 Error Types (Table)**
- Columns: Error Type, Count (last 1h), % of Total
- Sorted by Count DESC
- PromQL:
```promql
topk(5, sum by (error_type) (rate(signature_requests_aborted_total[1h])))
```

**Panel 6: Cost per Channel (Pie Chart)**
- Segments: SMS (60%), PUSH (30%), VOICE (10%)
- Labels: Channel name + % + cost estimate
- PromQL:
```promql
sum by (channel) (rate(signature_requests_created_total[1h]))
```

**Validation:**
- Screenshot: `docs/observability/screenshots/executive-overview.png`
- All panels render without errors
- Data updates every 5s (refresh interval)

---

### AC3: Provider Health Dashboard - 5 Panels

**Given** Provider Health dashboard  
**When** visualizo el dashboard  
**Then** veo los siguientes panels:

**Panel 1: Provider Status (Stat)**
- Values: SMS UP, PUSH UP, VOICE DOWN
- Colors: Green (UP), Red (DOWN)
- PromQL:
```promql
up{job="signature-router"}
```

**Panel 2: Circuit Breaker State (Stat)**
- Values per provider: CLOSED / OPEN / HALF_OPEN
- Colors: Green (CLOSED), Red (OPEN), Yellow (HALF_OPEN)
- PromQL:
```promql
provider_circuit_breaker_state{provider=~"SMS|PUSH|VOICE"}
```

**Panel 3: Provider Latency P95 (Time Series Graph)**
- Multiple series (one per provider)
- Y-axis: milliseconds
- PromQL:
```promql
histogram_quantile(0.95, sum by (provider, le) (rate(provider_latency_seconds_bucket[5m])))
```

**Panel 4: Provider Error Rate (Time Series Graph)**
- Multiple series (one per provider)
- Y-axis: % (0-100)
- PromQL:
```promql
sum by (provider) (rate(provider_failures_total[5m]))
/
sum by (provider) (rate(provider_calls_total[5m]))
* 100
```

**Panel 5: Fallback Rate (Time Series Graph)**
- Y-axis: fallbacks/min
- Stacked by `from_channel` → `to_channel`
- PromQL:
```promql
sum by (from_channel, to_channel) (rate(routing_fallback_triggered_total[1m]))
```

---

### AC4: Performance Dashboard - 5 Panels

**Given** Performance dashboard  
**When** visualizo el dashboard  
**Then** veo los siguientes panels:

**Panel 1: P50/P95/P99 Latency (Time Series Graph)**
- 3 series (P50, P95, P99)
- Y-axis: milliseconds
- PromQL:
```promql
histogram_quantile(0.50, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
```

**Panel 2: Throughput (Time Series Graph)**
- Y-axis: req/sec
- PromQL:
```promql
sum(rate(http_server_requests_seconds_count[1m]))
```

**Panel 3: Database Query Time P95 (Time Series Graph)**
- Y-axis: milliseconds
- PromQL:
```promql
histogram_quantile(0.95, sum(rate(hikaricp_connections_acquire_seconds_bucket[5m])) by (le))
```

**Panel 4: Provider Call Time P95 (Time Series Graph)**
- Multiple series (one per provider)
- Y-axis: milliseconds
- PromQL:
```promql
histogram_quantile(0.95, sum by (provider, le) (rate(provider_latency_seconds_bucket[5m])))
```

**Panel 5: Kafka Publish Time P95 (Time Series Graph)**
- Y-axis: milliseconds
- PromQL:
```promql
histogram_quantile(0.95, sum(rate(kafka_producer_record_send_rate[5m])) by (le))
```

---

### AC5: Infrastructure Dashboard - 5 Panels

**Given** Infrastructure dashboard  
**When** visualizo el dashboard  
**Then** veo los siguientes panels:

**Panel 1: JVM Heap Usage (Time Series Graph)**
- 2 series: Used, Max
- Y-axis: megabytes
- PromQL:
```promql
jvm_memory_used_bytes{area="heap"} / 1024 / 1024
jvm_memory_max_bytes{area="heap"} / 1024 / 1024
```

**Panel 2: JVM GC Pauses (Time Series Graph)**
- Y-axis: milliseconds
- PromQL:
```promql
rate(jvm_gc_pause_seconds_sum[1m]) * 1000
```

**Panel 3: Database Connections (Time Series Graph)**
- 3 series: Active, Idle, Pending
- Y-axis: connections
- PromQL:
```promql
hikaricp_connections_active
hikaricp_connections_idle
hikaricp_connections_pending
```

**Panel 4: Kafka Producer Lag (Time Series Graph)**
- Y-axis: messages
- Grouped by topic
- PromQL:
```promql
sum by (topic) (kafka_producer_record_send_total - kafka_producer_record_ack_total)
```

**Panel 5: CPU / Memory (Time Series Graph)**
- 2 series: CPU %, Memory %
- Y-axis: % (0-100)
- PromQL:
```promql
process_cpu_usage * 100
(jvm_memory_used_bytes / jvm_memory_max_bytes) * 100
```

---

### AC6: Business Metrics Dashboard - 5 Panels

**Given** Business Metrics dashboard  
**When** visualizo el dashboard  
**Then** veo los siguientes panels:

**Panel 1: Signatures by Channel (Pie Chart)**
- Segments: SMS 60%, PUSH 30%, VOICE 10%
- PromQL:
```promql
sum by (channel) (rate(signature_requests_created_total[1h]))
```

**Panel 2: Signature Success Rate (Gauge)**
- Current value: 95%
- Target: ≥95%
- PromQL:
```promql
sum(rate(signature_requests_completed_total{status="SIGNED"}[5m]))
/
sum(rate(signature_requests_created_total[5m]))
* 100
```

**Panel 3: Challenge Completion Time (Heatmap)**
- X-axis: time
- Y-axis: duration buckets (0-10s, 10-30s, 30s-1min, 1-5min, >5min)
- PromQL:
```promql
sum(rate(challenges_duration_seconds_bucket[5m])) by (le)
```

**Panel 4: Routing Rules Usage (Table)**
- Columns: Rule Name, Hits (last 1h), % of Total
- Top 10 rules sorted by Hits DESC
- PromQL:
```promql
topk(10, sum by (rule_id) (rate(routing_decisions_total[1h])))
```

**Panel 5: Cost Optimization (Time Series Graph)**
- 2 series: Actual Cost, Optimal Cost
- Y-axis: USD/hour
- PromQL (simplified):
```promql
# Actual cost
sum(rate(signature_requests_created_total{channel="VOICE"}[1h])) * 0.05 +
sum(rate(signature_requests_created_total{channel="SMS"}[1h])) * 0.01 +
sum(rate(signature_requests_created_total{channel="PUSH"}[1h])) * 0.001
```

---

### AC7: SLO Burn Rate Alerts Configurados

**Given** Prometheus Alertmanager está configurado  
**When** SLO availability burn rate excede umbral  
**Then** se dispara alerta crítica

**Alert 1: SLO Availability Burn Rate**
```yaml
# File: observability/prometheus/alerts/slo-alerts.yml
groups:
  - name: slo_alerts
    interval: 30s
    rules:
      - alert: SLOAvailabilityBurnRateCritical
        expr: |
          (
            1 - (
              sum(rate(http_server_requests_seconds_count{status!~"5.."}[1h]))
              /
              sum(rate(http_server_requests_seconds_count[1h]))
            )
          ) > 0.001  # 0.1% error rate threshold (99.9% availability)
        for: 5m
        labels:
          severity: critical
          slo: availability
        annotations:
          summary: "SLO Availability burn rate too high"
          description: "Error rate {{ $value | humanizePercentage }} exceeds 0.1% threshold for 5 minutes"
```

**Alert 2: SLO Performance P99 Burn Rate**
```yaml
      - alert: SLOPerformanceP99BurnRateCritical
        expr: |
          histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le)) > 0.3
        for: 5m
        labels:
          severity: critical
          slo: performance
        annotations:
          summary: "SLO Performance P99 > 300ms"
          description: "P99 latency {{ $value | humanizeDuration }} exceeds 300ms SLO for 5 minutes"
```

**Validation:**
```bash
# Trigger test alert (simulate high error rate)
curl http://localhost:9090/api/v1/alerts
# Expected: 2 SLO alerts configured

# Verify Alertmanager receives alerts
curl http://localhost:9093/api/v1/alerts
```

---

### AC8: Dashboard Provisioning Automatizado

**Given** Grafana container está iniciando  
**When** Docker Compose levanta el stack  
**Then** dashboards se cargan automáticamente sin intervención manual

**File: `observability/grafana/provisioning/dashboards/dashboards.yaml`**
```yaml
apiVersion: 1

providers:
  - name: 'Signature Router'
    orgId: 1
    folder: 'Banking'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

**Validation:**
```bash
# Stop Grafana
docker-compose down grafana

# Delete Grafana data volume
docker volume rm signature-router_grafana-data

# Start Grafana
docker-compose up -d grafana

# Wait 10 seconds
sleep 10

# Verify dashboards auto-provisioned
curl -u admin:admin http://localhost:3000/api/search?query=signature | jq '.[].title'
# Expected: 5 dashboards listed
```

---

### AC9: Datasource Prometheus Auto-Configurado

**Given** Prometheus está corriendo en `http://prometheus:9090`  
**When** Grafana inicia  
**Then** datasource "Prometheus" se configura automáticamente como default

**File: `observability/grafana/provisioning/datasources/prometheus.yaml`**
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "5s"
      queryTimeout: "60s"
      httpMethod: POST
```

**Validation:**
```bash
# Verify datasource configured
curl -u admin:admin http://localhost:3000/api/datasources | jq '.[] | select(.name=="Prometheus")'
# Expected: Datasource JSON with url="http://prometheus:9090", isDefault=true
```

---

### AC10: Common Tags Aplicados en Todos los Panels

**Given** métricas Prometheus incluyen common tags (application, environment, region)  
**When** visualizo cualquier dashboard  
**Then** puedo filtrar por tags comunes usando variables de Grafana

**Dashboard Variables:**
```json
{
  "templating": {
    "list": [
      {
        "name": "environment",
        "type": "query",
        "query": "label_values(http_server_requests_seconds_count, environment)",
        "current": {
          "value": "local"
        }
      },
      {
        "name": "region",
        "type": "query",
        "query": "label_values(http_server_requests_seconds_count{environment=\"$environment\"}, region)",
        "current": {
          "value": "local"
        }
      }
    ]
  }
}
```

**Validation:**
- Cada dashboard tiene variables `$environment` y `$region` en top bar
- Al cambiar variable, todos los panels se actualizan
- PromQL queries usan `{environment="$environment", region="$region"}`

---

### AC11: Alertas Integradas con Slack (Opcional - Bonus)

**Given** Alertmanager configurado con Slack webhook  
**When** SLO burn rate alert se dispara  
**Then** notificación se envía a canal Slack `#sre-alerts`

**File: `observability/prometheus/alertmanager/alertmanager.yml`**
```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  receiver: 'slack-sre-alerts'
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 3h

receivers:
  - name: 'slack-sre-alerts'
    slack_configs:
      - channel: '#sre-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        color: '{{ if eq .Status "firing" }}danger{{ else }}good{{ end }}'
```

**Validation:**
- Trigger test alert → Verify Slack message received
- (Opcional si no hay Slack: email fallback)

---

## 🏗️ Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Grafana Dashboards (Port 3000)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  Executive  │ │  Provider   │ │ Performance │       │
│  │  Overview   │ │   Health    │ │             │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐                       │
│  │Infra-       │ │  Business   │                       │
│  │structure    │ │  Metrics    │                       │
│  └─────────────┘ └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
                         │
                         │ PromQL Queries
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Prometheus (Port 9090)                        │
│  - Scrapes /actuator/prometheus every 10s              │
│  - Stores metrics (retention 15 days)                  │
│  - Evaluates alert rules every 30s                     │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Alerts
                         ▼
┌─────────────────────────────────────────────────────────┐
│       Prometheus Alertmanager (Port 9093)               │
│  - Deduplicates alerts                                 │
│  - Routes to Slack / Email / PagerDuty                 │
│  - Silencing + Inhibition rules                        │
└─────────────────────────────────────────────────────────┘
```

### Dashboard JSON Structure

Each dashboard JSON file follows Grafana schema:

```json
{
  "dashboard": {
    "title": "Executive Overview",
    "uid": "executive-overview",
    "tags": ["signature-router", "slo"],
    "timezone": "browser",
    "refresh": "5s",
    "panels": [
      {
        "id": 1,
        "type": "gauge",
        "title": "SLO Availability",
        "targets": [
          {
            "expr": "1 - (sum(rate(http_server_requests_seconds_count{status=~\"5..\"}[5m])) / sum(rate(http_server_requests_seconds_count[5m])))",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "red" },
                { "value": 0.995, "color": "yellow" },
                { "value": 0.999, "color": "green" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

---

## 📋 Tasks

### Task 1: Setup Grafana Infrastructure (1 hora)
**Subtasks:**
1. Add Grafana service to `docker-compose.yml`
   - Image: `grafana/grafana:10.2.0`
   - Port: `3000:3000`
   - Volumes: config, dashboards, datasources, data
2. Create directory structure:
   ```
   observability/
   ├── grafana/
   │   ├── provisioning/
   │   │   ├── dashboards/
   │   │   │   └── dashboards.yaml
   │   │   └── datasources/
   │   │       └── prometheus.yaml
   │   └── dashboards/
   │       ├── executive-overview.json
   │       ├── provider-health.json
   │       ├── performance.json
   │       ├── infrastructure.json
   │       └── business-metrics.json
   └── prometheus/
       └── alerts/
           └── slo-alerts.yml
   ```
3. Configure Grafana environment variables (admin password, provisioning paths)

### Task 2: Create Dashboard Provisioning Config (30 min)
**Subtasks:**
1. Create `grafana/provisioning/dashboards/dashboards.yaml`
   - Provider name: "Signature Router"
   - Folder: "Banking"
   - Path: `/etc/grafana/provisioning/dashboards`
2. Create `grafana/provisioning/datasources/prometheus.yaml`
   - Name: "Prometheus"
   - URL: `http://prometheus:9090`
   - isDefault: true

### Task 3: Create Executive Overview Dashboard (2 horas)
**Subtasks:**
1. Create `executive-overview.json` base structure
2. Add Panel 1: SLO Availability (Gauge)
   - PromQL query for availability
   - Thresholds: Red <99.5%, Yellow 99.5-99.9%, Green ≥99.9%
3. Add Panel 2: SLO Performance P99 (Gauge)
   - PromQL query for P99 latency
   - Thresholds: Red ≥500ms, Yellow 300-500ms, Green <300ms
4. Add Panel 3: Request Rate (Time Series)
5. Add Panel 4: Error Rate (Time Series)
6. Add Panel 5: Top 5 Error Types (Table)
7. Add Panel 6: Cost per Channel (Pie Chart)
8. Configure dashboard variables (`$environment`, `$region`)
9. Set refresh interval to 5s

### Task 4: Create Provider Health Dashboard (1.5 horas)
**Subtasks:**
1. Create `provider-health.json` base structure
2. Add Panel 1: Provider Status (Stat) - UP/DOWN indicators
3. Add Panel 2: Circuit Breaker State (Stat) - CLOSED/OPEN/HALF_OPEN
4. Add Panel 3: Provider Latency P95 (Time Series)
5. Add Panel 4: Provider Error Rate (Time Series)
6. Add Panel 5: Fallback Rate (Time Series)

### Task 5: Create Performance Dashboard (1.5 horas)
**Subtasks:**
1. Create `performance.json` base structure
2. Add Panel 1: P50/P95/P99 Latency (Time Series) - 3 series
3. Add Panel 2: Throughput (Time Series)
4. Add Panel 3: Database Query Time P95 (Time Series)
5. Add Panel 4: Provider Call Time P95 (Time Series)
6. Add Panel 5: Kafka Publish Time P95 (Time Series)

### Task 6: Create Infrastructure Dashboard (1.5 horas)
**Subtasks:**
1. Create `infrastructure.json` base structure
2. Add Panel 1: JVM Heap Usage (Time Series)
3. Add Panel 2: JVM GC Pauses (Time Series)
4. Add Panel 3: Database Connections (Time Series)
5. Add Panel 4: Kafka Producer Lag (Time Series)
6. Add Panel 5: CPU / Memory (Time Series)

### Task 7: Create Business Metrics Dashboard (1.5 horas)
**Subtasks:**
1. Create `business-metrics.json` base structure
2. Add Panel 1: Signatures by Channel (Pie Chart)
3. Add Panel 2: Signature Success Rate (Gauge)
4. Add Panel 3: Challenge Completion Time (Heatmap)
5. Add Panel 4: Routing Rules Usage (Table)
6. Add Panel 5: Cost Optimization (Time Series)

### Task 8: Configure SLO Burn Rate Alerts (1 hora)
**Subtasks:**
1. Create `prometheus/alerts/slo-alerts.yml`
2. Add alert: SLOAvailabilityBurnRateCritical
   - Expr: Error rate > 0.1% for 5m
   - Severity: critical
3. Add alert: SLOPerformanceP99BurnRateCritical
   - Expr: P99 > 300ms for 5m
   - Severity: critical
4. Update `prometheus.yml` to include alert rules file
5. Verify alerts appear in Prometheus UI (`http://localhost:9090/alerts`)

### Task 9: Configure Alertmanager (Opcional - 1 hora)
**Subtasks:**
1. Add Alertmanager service to `docker-compose.yml`
   - Image: `prom/alertmanager:v0.26.0`
   - Port: `9093:9093`
2. Create `alertmanager/alertmanager.yml` config
3. Configure Slack webhook (or email fallback)
4. Test alert routing with manual trigger

### Task 10: Integration Testing (1 hora)
**Subtasks:**
1. Start full observability stack: `docker-compose up -d grafana prometheus`
2. Verify Grafana accessible: `http://localhost:3000` (admin/admin)
3. Verify 5 dashboards auto-provisioned
4. Verify Prometheus datasource configured
5. Generate traffic: `scripts/generate-traffic.sh` (create signature requests)
6. Verify all panels render data (no "No data" errors)
7. Verify dashboard variables work (`$environment` filter)
8. Trigger SLO alert (simulate high error rate)
9. Verify alert appears in Prometheus UI
10. Verify alert routed to Alertmanager (if configured)

### Task 11: Documentation (1 hora)
**Subtasks:**
1. Create `docs/observability/SLO_MONITORING.md`:
   - Dashboard overview (5 dashboards purpose)
   - PromQL query explanations
   - Alert rule documentation
   - Troubleshooting guide (common issues)
2. Update `README.md`:
   - Add "Grafana Dashboards" section
   - Instructions to access dashboards
   - Screenshot links
3. Create screenshots directory: `docs/observability/screenshots/`
4. Take screenshots of all 5 dashboards
5. Update `CHANGELOG.md` with Story 9.3 entry

### Task 12: Code Review Prep (30 min)
**Subtasks:**
1. Validate all 11 Acceptance Criteria met
2. Run linting/formatting on JSON files
3. Test dashboard provisioning from scratch (clean Docker volumes)
4. Prepare demo for SM review (show all 5 dashboards + alerts)

---

## 📂 Files to Create

### Dashboard JSON Files (5 files)
1. `observability/grafana/dashboards/executive-overview.json` (~500 lines)
2. `observability/grafana/dashboards/provider-health.json` (~400 lines)
3. `observability/grafana/dashboards/performance.json` (~400 lines)
4. `observability/grafana/dashboards/infrastructure.json` (~400 lines)
5. `observability/grafana/dashboards/business-metrics.json` (~400 lines)

### Provisioning Config (2 files)
6. `observability/grafana/provisioning/dashboards/dashboards.yaml` (~20 lines)
7. `observability/grafana/provisioning/datasources/prometheus.yaml` (~15 lines)

### Alert Rules (1 file)
8. `observability/prometheus/alerts/slo-alerts.yml` (~30 lines)

### Documentation (1 file)
9. `docs/observability/SLO_MONITORING.md` (~300 lines)

### Scripts (Opcional - 1 file)
10. `scripts/generate-traffic.sh` - Script para generar tráfico de prueba (~50 lines)

---

## 📝 Files to Modify

1. **`docker-compose.yml`** (+30 lines)
   - Add Grafana service with volume mounts
   - Add Alertmanager service (opcional)
   - Update Prometheus config volume to include alert rules

2. **`observability/prometheus/prometheus.yml`** (+5 lines)
   - Add `rule_files` section pointing to `slo-alerts.yml`
   - (If Alertmanager) Add `alerting` section

3. **`README.md`** (+30 lines)
   - Add "Grafana Dashboards" section after "Prometheus Metrics"
   - Link to dashboard screenshots

4. **`CHANGELOG.md`** (+40 lines)
   - Add Story 9.3 entry with features/dashboards list

---

## 🧪 Testing Strategy

### Manual Testing (30 min)
1. **Dashboard Rendering Test**:
   ```bash
   # Start stack
   docker-compose up -d grafana prometheus
   
   # Access Grafana
   open http://localhost:3000
   # Login: admin/admin
   
   # Verify 5 dashboards in "Banking" folder
   # Click each dashboard → All panels render without errors
   ```

2. **Data Validation Test**:
   ```bash
   # Generate traffic
   for i in {1..100}; do
     curl -X POST http://localhost:8080/api/v1/signatures \
       -H "Content-Type: application/json" \
       -d '{"customerId":"CUST'$i'","amount":100,"currency":"USD"}'
   done
   
   # Wait 10s for Prometheus scrape
   sleep 10
   
   # Verify Executive Overview shows:
   # - Request Rate > 0 req/sec
   # - SLO Availability > 99%
   # - Error Rate data (even if 0%)
   ```

3. **Alert Firing Test**:
   ```bash
   # Trigger high error rate (simulate 5xx errors)
   for i in {1..50}; do
     curl -X POST http://localhost:8080/api/v1/signatures \
       -H "Content-Type: application/json" \
       -d '{"invalid":"payload"}'  # Will return 400
   done
   
   # Wait 5 minutes
   sleep 300
   
   # Check Prometheus alerts
   curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.labels.alertname=="SLOAvailabilityBurnRateCritical")'
   # Expected: Alert in "firing" state
   ```

4. **Provisioning Test (Clean Slate)**:
   ```bash
   # Stop Grafana
   docker-compose down grafana
   
   # Delete Grafana volume
   docker volume rm signature-router_grafana-data
   
   # Restart Grafana
   docker-compose up -d grafana
   
   # Wait 15s
   sleep 15
   
   # Verify auto-provisioning worked
   curl -u admin:admin http://localhost:3000/api/search?query=signature | jq '.[].title'
   # Expected: ["Executive Overview", "Provider Health", "Performance", "Infrastructure", "Business Metrics"]
   ```

### Automated Testing (Opcional - Bonus)
**Grafana API Tests** (using `curl` + `jq`):
```bash
#!/bin/bash
# File: tests/integration/grafana-api-test.sh

BASE_URL="http://localhost:3000"
AUTH="admin:admin"

# Test 1: Verify datasource exists
echo "Test 1: Verify Prometheus datasource..."
DATASOURCE=$(curl -s -u $AUTH $BASE_URL/api/datasources/name/Prometheus)
if [[ $(echo $DATASOURCE | jq -r '.isDefault') == "true" ]]; then
  echo "✅ Datasource test PASSED"
else
  echo "❌ Datasource test FAILED"
  exit 1
fi

# Test 2: Verify 5 dashboards exist
echo "Test 2: Verify 5 dashboards exist..."
DASHBOARD_COUNT=$(curl -s -u $AUTH "$BASE_URL/api/search?query=signature" | jq '. | length')
if [[ $DASHBOARD_COUNT -eq 5 ]]; then
  echo "✅ Dashboard count test PASSED"
else
  echo "❌ Dashboard count test FAILED (expected 5, got $DASHBOARD_COUNT)"
  exit 1
fi

# Test 3: Verify Executive Overview has 6 panels
echo "Test 3: Verify Executive Overview has 6 panels..."
DASHBOARD_UID=$(curl -s -u $AUTH "$BASE_URL/api/search?query=Executive" | jq -r '.[0].uid')
PANEL_COUNT=$(curl -s -u $AUTH "$BASE_URL/api/dashboards/uid/$DASHBOARD_UID" | jq '.dashboard.panels | length')
if [[ $PANEL_COUNT -eq 6 ]]; then
  echo "✅ Panel count test PASSED"
else
  echo "❌ Panel count test FAILED (expected 6, got $PANEL_COUNT)"
  exit 1
fi

echo "All tests PASSED ✅"
```

---

## 📚 Dependencies

### External Dependencies (Docker Images)
- **Grafana**: `grafana/grafana:10.2.0`
- **Prometheus Alertmanager** (opcional): `prom/alertmanager:v0.26.0`

### Internal Dependencies
- **Story 9.2** (Prometheus Metrics Export): REQUIRED - Must be done first
  - Without metrics, dashboards will show "No data"
- **Epic 1** (Prometheus/Grafana infrastructure): REQUIRED
  - Docker Compose must have Prometheus already configured

### Configuration Dependencies
- `observability/prometheus/prometheus.yml` must exist (from Epic 1)
- Spring Boot `/actuator/prometheus` endpoint must be working (from Story 9.2)

---

## 🎯 Definition of Done

**Code Quality:**
- [ ] 5 dashboard JSON files created and valid Grafana schema
- [ ] Dashboard provisioning config created (`dashboards.yaml`, `prometheus.yaml`)
- [ ] SLO alert rules created (`slo-alerts.yml`)
- [ ] No JSON syntax errors (validate with `jq`)
- [ ] All PromQL queries tested in Prometheus UI

**Testing:**
- [ ] Manual test: All 5 dashboards render without errors
- [ ] Manual test: All panels show data (after traffic generation)
- [ ] Manual test: Dashboard provisioning works from clean slate
- [ ] Manual test: SLO alerts fire when thresholds exceeded
- [ ] (Opcional) Automated Grafana API tests pass

**Documentation:**
- [ ] `SLO_MONITORING.md` created with dashboard explanations
- [ ] README.md updated with Grafana section
- [ ] CHANGELOG.md updated with Story 9.3 entry
- [ ] Screenshots taken for all 5 dashboards
- [ ] PromQL queries documented with comments

**Multi-Environment:**
- [ ] Dashboard variables support `$environment` and `$region` filtering
- [ ] Datasource URL uses Docker Compose service name (`prometheus:9090`)
- [ ] No hardcoded values (all configurable via variables)

**Integration & Dependencies:**
- [ ] Grafana integrates with Prometheus datasource
- [ ] Alert rules integrate with Alertmanager (if configured)
- [ ] Dashboards use metrics from Story 9.2
- [ ] No breaking changes to existing Prometheus config

**Status:** ✅ Ready for Development

---

## 📊 Story Estimation

**Complexity:** Medium  
**Risk:** Low  
**Dependencies:** High (requires Story 9.2 done)

**Breakdown:**
- Dashboard creation: 8 hours (5 dashboards × 1.5h average)
- Alert configuration: 1 hour
- Provisioning setup: 1 hour
- Testing: 2 hours
- Documentation: 1 hour

**Total Estimate:** 13 hours (~3 Story Points, ~2 días)

---

**Story Status:** ✅ READY FOR DEVELOPMENT  
**Next Step:** Execute `/bmad:bmm:workflows:story-context` (Story Context creation)

