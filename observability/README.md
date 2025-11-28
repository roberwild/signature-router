# Observability Stack - Signature Router

This directory contains the observability configuration for the Signature Router system using **Prometheus** and **Grafana**.

## 📊 Architecture

```
Spring Boot App (port 8080)
    ↓ exposes metrics at /actuator/prometheus
Prometheus (port 9090)
    ↓ scrapes metrics every 10s
    ↓ stores time-series data (30 days retention)
Grafana (port 3000)
    ↓ queries Prometheus
    ↓ displays pre-configured dashboards
```

## 🚀 Quick Start

### 1. Start Observability Stack

```bash
# Start Prometheus + Grafana
docker-compose up -d prometheus grafana

# Verify services are healthy
docker-compose ps
```

### 2. Access Grafana

1. Open http://localhost:3000
2. Login: `admin` / `admin`
3. Navigate to **Dashboards → Signature Router → Overview**

### 3. Access Prometheus

1. Open http://localhost:9090
2. Navigate to **Status → Targets** to verify app scraping
3. Use **Graph** tab to query metrics manually

## 📁 Directory Structure

```
observability/
├── README.md                                 # This file
├── prometheus.yml                            # Prometheus scrape configuration
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── prometheus.yml                # Auto-configure Prometheus datasource
    │   └── dashboards/
    │       └── default.yml                   # Auto-load dashboard provider
    └── dashboards/
        └── signature-router-overview.json    # Pre-built dashboard
```

## 📈 Available Dashboards

### Signature Router - Overview

**Panels:**

1. **Application Status** (Gauge)
   - Shows if the Spring Boot app is UP (1) or DOWN (0)
   - Metric: `up{job="signature-router-app"}`

2. **HTTP Request Rate** (Time Series)
   - Requests per second by endpoint and status code
   - Metric: `rate(http_server_requests_seconds_count[5m])`

3. **HTTP Request Latency** (Time Series)
   - P50, P95, P99 latency percentiles
   - SLO Target: P99 < 300ms (banking-grade)
   - Metric: `histogram_quantile(0.99, http_server_requests_seconds_bucket)`

4. **JVM Memory Usage** (Time Series)
   - Heap Used, Heap Max, Non-Heap Used
   - Metric: `jvm_memory_used_bytes`, `jvm_memory_max_bytes`

5. **Database Connection Pool** (Time Series)
   - HikariCP active, idle, pending connections
   - Metric: `hikaricp_connections_*`

6. **CPU Usage** (Time Series)
   - System and process CPU usage
   - Metric: `system_cpu_usage`, `process_cpu_usage`

**Dashboard UID:** `signature-router-overview`

## 🔧 Configuration

### Prometheus Scrape Configuration

**File:** `prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'signature-router-app'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 10s
    static_configs:
      - targets: ['host.docker.internal:8080']
```

**Key Settings:**
- **Scrape Interval:** 10s (faster than default 15s for real-time monitoring)
- **Target:** `host.docker.internal:8080` (Spring Boot app on host machine)
- **Metrics Path:** `/actuator/prometheus` (Spring Boot Actuator endpoint)
- **Storage Retention:** 30 days

### Grafana Auto-Provisioning

**Datasources** (`grafana/provisioning/datasources/prometheus.yml`):
- Automatically adds Prometheus as default datasource on startup
- No manual configuration needed

**Dashboards** (`grafana/provisioning/dashboards/default.yml`):
- Automatically loads dashboards from `grafana/dashboards/` on startup
- Updates every 30s
- Allows UI updates (can be modified in Grafana UI)

## 📊 Key Metrics Reference

### HTTP Metrics

| Metric | Description | Type |
|--------|-------------|------|
| `http_server_requests_seconds_count` | Total HTTP requests | Counter |
| `http_server_requests_seconds_sum` | Total HTTP request duration | Counter |
| `http_server_requests_seconds_bucket` | HTTP request duration histogram | Histogram |
| `http_server_requests_seconds_max` | Maximum HTTP request duration | Gauge |

**Labels:** `method`, `uri`, `status`, `exception`

### JVM Metrics

| Metric | Description | Type |
|--------|-------------|------|
| `jvm_memory_used_bytes` | Used memory | Gauge |
| `jvm_memory_max_bytes` | Maximum memory | Gauge |
| `jvm_memory_committed_bytes` | Committed memory | Gauge |
| `jvm_gc_pause_seconds_*` | GC pause duration | Summary |
| `jvm_threads_live_threads` | Active thread count | Gauge |

**Labels:** `area` (heap/nonheap), `id` (memory pool name)

### Database Metrics (HikariCP)

| Metric | Description | Type |
|--------|-------------|------|
| `hikaricp_connections_active` | Active connections | Gauge |
| `hikaricp_connections_idle` | Idle connections | Gauge |
| `hikaricp_connections_pending` | Pending connections | Gauge |
| `hikaricp_connections_max` | Maximum pool size | Gauge |
| `hikaricp_connections_timeout_total` | Connection timeout count | Counter |

**Labels:** `pool` (HikariCP pool name)

### System Metrics

| Metric | Description | Type |
|--------|-------------|------|
| `system_cpu_usage` | System CPU usage (0-1) | Gauge |
| `process_cpu_usage` | Process CPU usage (0-1) | Gauge |
| `system_load_average_1m` | 1-minute load average | Gauge |

## 🎯 SLO Tracking

### Banking-Grade SLOs (from PRD)

| SLO | Target | Metric Query |
|-----|--------|--------------|
| **Availability** | ≥99.9% | `avg_over_time(up{job="signature-router-app"}[30d])` |
| **P99 Latency** | <300ms | `histogram_quantile(0.99, http_server_requests_seconds_bucket)` |
| **Error Rate** | <0.1% | `sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) / sum(rate(http_server_requests_seconds_count[5m]))` |

### Example PromQL Queries

**Availability (30-day rolling):**
```promql
avg_over_time(up{job="signature-router-app"}[30d]) * 100
```

**P99 Latency by Endpoint:**
```promql
histogram_quantile(0.99, 
  sum(rate(http_server_requests_seconds_bucket[5m])) by (le, uri)
)
```

**Error Rate (5-minute window):**
```promql
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) 
/ 
sum(rate(http_server_requests_seconds_count[5m])) * 100
```

**Request Rate by Endpoint:**
```promql
sum(rate(http_server_requests_seconds_count[5m])) by (uri, method)
```

## 🔍 Troubleshooting

### Prometheus not scraping Spring Boot app

**Symptom:** Target shows as DOWN in Prometheus UI

**Solution:**
```bash
# 1. Verify Spring Boot app is running
curl http://localhost:8080/actuator/health

# 2. Verify Prometheus endpoint is accessible
curl http://localhost:8080/actuator/prometheus

# 3. Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq .

# 4. Check Prometheus container logs
docker-compose logs prometheus

# 5. Verify host.docker.internal resolves (Windows/Mac)
docker exec signature-router-prometheus ping -c 1 host.docker.internal
```

### Grafana dashboard shows "No data"

**Symptom:** Dashboard panels are empty

**Solution:**
```bash
# 1. Verify Prometheus datasource is configured
curl -u admin:admin http://localhost:3000/api/datasources | jq .

# 2. Test Prometheus query directly
curl 'http://localhost:9090/api/v1/query?query=up' | jq .

# 3. Restart Grafana to reload provisioning
docker-compose restart grafana

# 4. Check Grafana logs
docker-compose logs grafana
```

### High memory usage in Prometheus

**Symptom:** Prometheus container using excessive memory

**Solution:**
```bash
# 1. Check storage size
docker exec signature-router-prometheus du -sh /prometheus

# 2. Reduce retention time (edit prometheus.yml)
--storage.tsdb.retention.time=7d  # Instead of 30d

# 3. Increase scrape interval (edit prometheus.yml)
scrape_interval: 30s  # Instead of 10s

# 4. Restart Prometheus
docker-compose restart prometheus
```

## 🚀 Advanced Configuration

### Adding Custom Dashboards

1. Create dashboard in Grafana UI
2. Export as JSON (**Share → Export → Save to file**)
3. Save to `grafana/dashboards/my-dashboard.json`
4. Restart Grafana: `docker-compose restart grafana`

### Adding Alerting Rules

1. Create `prometheus/alerts.yml`:

```yaml
groups:
  - name: signature-router
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) / sum(rate(http_server_requests_seconds_count[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

2. Update `prometheus.yml`:

```yaml
rule_files:
  - 'alerts.yml'
```

3. Restart Prometheus: `docker-compose restart prometheus`

### Connecting AlertManager

1. Add AlertManager to `docker-compose.yml`
2. Update `prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

## 📚 Additional Resources

- **Prometheus Documentation:** https://prometheus.io/docs/
- **Grafana Documentation:** https://grafana.com/docs/
- **Spring Boot Actuator Metrics:** https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.metrics
- **PromQL Tutorial:** https://prometheus.io/docs/prometheus/latest/querying/basics/

---

**Author:** BMAD DevOps Team  
**Last Updated:** 2025-11-27  
**Version:** 1.0

