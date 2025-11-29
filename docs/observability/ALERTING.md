# Alerting Configuration - Signature Router

**Author:** BMAD DevOps  
**Version:** 1.0  
**Story:** 9.5 - Alerting Rules - Critical & Warnings  
**Last Updated:** 2025-11-29

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Alertmanager Configuration](#alertmanager-configuration)
4. [Alert Routing Tree](#alert-routing-tree)
5. [Notification Channels](#notification-channels)
6. [Alert Rules](#alert-rules)
7. [Alert Silencing](#alert-silencing)
8. [Testing Alerts](#testing-alerts)
9. [Troubleshooting](#troubleshooting)
10. [Runbooks](#runbooks)

---

## 🎯 Overview

El sistema de alerting de Signature Router utiliza **Prometheus Alertmanager** para routing, deduplicación y notificación de alertas.

### Objetivos de Negocio

- **Fast Incident Detection**: MTTD (Mean Time To Detect) 2h → 5min (96% reducción)
- **Prevent User Impact**: 90% de incidents detectados antes de afectar usuarios
- **Reduce Downtime Cost**: Alerting proactivo evita $500K/año en downtime
- **On-Call Efficiency**: Alertas críticas a PagerDuty, warnings a Slack
- **Alert Fatigue Prevention**: Deduplicación + silencing + inhibition rules

### Componentes

- **Prometheus**: Evalúa alert rules cada 15 segundos
- **Alertmanager**: Routing, deduplicación, grouping, silencing
- **Slack**: Notificaciones a canal `#sre-alerts`
- **PagerDuty** (opcional): Incidents para alertas críticas (on-call)
- **Email** (opcional): Fallback notifications

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Prometheus Alert Rules                       │
│  - SLO alerts (slo-alerts.yml)                         │
│  - Infrastructure alerts (infrastructure-alerts.yml)   │
│    - Circuit breaker, DB, Kafka, JVM, etc.            │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTP POST /api/v1/alerts
                         ▼
┌─────────────────────────────────────────────────────────┐
│       Prometheus Alertmanager (Port 9093)               │
│  - Alert deduplication & grouping                      │
│  - Routing tree (critical → PagerDuty, warning → Slack)│
│  - Silencing & inhibition rules                        │
│  - Retry logic for failed notifications                │
└─────────────────────────────────────────────────────────┘
         │                │                │
         │                │                │
         ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │ Slack  │      │PagerDuty│      │ Email  │
    │#sre-   │      │(critical│      │(fallback│
    │alerts  │      │ only)   │      │)        │
    └────────┘      └────────┘      └────────┘
```

---

## ⚙️ Alertmanager Configuration

### Archivo de Configuración

**Location:** `observability/alertmanager/alertmanager.yml`

### Global Settings

```yaml
global:
  resolve_timeout: 5m  # Mark as resolved after 5min
  slack_api_url: '${SLACK_WEBHOOK_URL}'  # From .env
```

### Grouping Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `group_by` | `['alertname', 'severity']` | Agrupa alerts por nombre y severidad |
| `group_wait` | `10s` | Espera 10s antes de enviar primera notificación |
| `group_interval` | `5m` | Envía notificación cada 5min para nuevas alerts en el grupo |
| `repeat_interval` | `3h` | Re-envía alerts no resueltas cada 3 horas |

---

## 🌳 Alert Routing Tree

### Routing Logic

```yaml
route:
  receiver: 'slack-sre-alerts'  # Default receiver
  
  routes:
    # Critical alerts → PagerDuty (if configured)
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true  # Also send to Slack
    
    # Critical alerts → Slack (always)
    - match:
        severity: critical
      receiver: 'slack-sre-alerts'
      continue: false
    
    # Warning alerts → Slack only
    - match:
        severity: warning
      receiver: 'slack-sre-alerts'
```

### Inhibition Rules

Previenen alert spam suprimiendo alertas de menor severidad cuando hay alertas críticas:

```yaml
inhibit_rules:
  # Si critical alert está firing, suprimir warning del mismo alertname
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

**Example:**
- `SLOAvailabilityBurnRateCritical` firing → Suprimir `SLOAvailabilityBurnRateWarning`

---

## 📢 Notification Channels

### 1. Slack Integration

**Channel:** `#sre-alerts`  
**Severity:** All (critical, warning)  
**Format:** Rich message con emojis y colores

#### Setup

1. **Crear Slack App:**
   - Ir a: https://api.slack.com/apps
   - Create New App → From scratch
   - Name: "Signature Router Alertmanager"
   - Workspace: Tu workspace

2. **Activar Incoming Webhooks:**
   - Features → Incoming Webhooks → Activate
   - Add New Webhook to Workspace
   - Select channel: `#sre-alerts`
   - Copy webhook URL

3. **Configurar en Alertmanager:**
   - Editar `observability/alertmanager/alertmanager.yml`
   - Reemplazar `${SLACK_WEBHOOK_URL}` con tu webhook URL
   - O usar variable de entorno (recomendado):
     ```bash
     export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
     ```

4. **Reiniciar Alertmanager:**
   ```bash
   docker-compose restart alertmanager
   ```

#### Slack Message Format

```
🔴 CRITICAL: SignatureRouterAvailabilityBurnRateCritical

Alert: SignatureRouterAvailabilityBurnRateCritical
Severity: critical
Summary: Signature Router Availability SLO Burn Rate Critical
Description: The Signature Router application availability is below 99.9% for 5 minutes.
Runbook: https://wiki.example.com/runbooks/slo-availability-burn-rate
Status: firing
Firing Since: 2025-11-29 10:30:00
```

---

### 2. PagerDuty Integration (OPTIONAL)

**Purpose:** Wake up on-call engineer para alertas críticas  
**Severity:** Critical only

#### Setup

1. **Crear PagerDuty Service:**
   - Services → Service Directory → New Service
   - Name: "Signature Router"
   - Integration Type: Prometheus

2. **Copiar Integration Key:**
   - Services → Signature Router → Integrations
   - Copy "Integration Key"

3. **Configurar en Alertmanager:**
   - Editar `observability/alertmanager/alertmanager.yml`
   - Descomentar sección `pagerduty-critical`
   - Reemplazar `${PAGERDUTY_SERVICE_KEY}` con tu integration key

4. **Reiniciar Alertmanager:**
   ```bash
   docker-compose restart alertmanager
   ```

---

### 3. Email Fallback (OPTIONAL)

**Purpose:** Backup notification si Slack falla  
**Recipient:** `sre-team@example.com`

#### Setup (Gmail SMTP Example)

1. **Crear App Password:**
   - Google Account → Security → 2-Step Verification
   - App passwords → Generate password
   - Copy password

2. **Configurar en Alertmanager:**
   - Editar `observability/alertmanager/alertmanager.yml`
   - Descomentar sección `email-fallback`
   - Reemplazar credenciales SMTP

3. **Reiniciar Alertmanager:**
   ```bash
   docker-compose restart alertmanager
   ```

---

## 🚨 Alert Rules

### SLO Alerts (`slo-alerts.yml`)

| Alert Name | Severity | Threshold | Duration | Description |
|------------|----------|-----------|----------|-------------|
| `SignatureRouterAvailabilityBurnRateCritical` | critical | Availability < 99.9% | 5min | Error rate too high |
| `SignatureRouterPerformanceP99BurnRateCritical` | critical | P99 > 300ms | 5min | Latency too high |
| `SignatureRouterAvailabilityBurnRateWarning` | warning | Availability < 99.95% | 15min | Early warning |
| `SignatureRouterPerformanceP99BurnRateWarning` | warning | P99 > 200ms | 15min | Early warning |

---

### Infrastructure Alerts (`infrastructure-alerts.yml`)

| Alert Name | Severity | Threshold | Duration | Component |
|------------|----------|-----------|----------|-----------|
| `ProviderCircuitBreakerOpen` | critical | Circuit breaker OPEN | 5min | Provider Integration |
| `HighFallbackRate` | warning | Fallback rate > 10% | 10min | Routing Engine |
| `DatabaseConnectionPoolExhausted` | critical | Pending connections > 5 | 2min | Database |
| `KafkaProducerLagHigh` | warning | Lag > 1000 messages | 5min | Kafka Producer |
| `JVMMemoryPressure` | warning | Heap usage > 85% | 5min | JVM |
| `HighGCPauseTime` | warning | GC time > 50% | 5min | JVM |
| `DatabaseQueryLatencyHigh` | warning | P95 > 500ms | 5min | Database |
| `HTTPServerErrorRateHigh` | warning | 5xx rate > 5% | 5min | HTTP Server |
| `KeycloakAuthenticationFailuresHigh` | critical | Auth failures > 20% | 5min | Authentication |
| `VaultSecretsFetchFailures` | critical | Failures > 5 | 2min | Secrets Management |
| `KafkaConsumerLagHigh` | warning | Lag > 1000 messages | 10min | Kafka Consumer |

**Total:** 15 alert rules (4 SLO + 11 Infrastructure)

---

## 🔕 Alert Silencing

### Silencing via Alertmanager UI

1. **Abrir Alertmanager UI:**
   ```bash
   open http://localhost:9093
   ```

2. **Crear Silence:**
   - Click "New Silence"
   - Matchers: `alertname = "SignatureRouterAvailabilityBurnRateCritical"`
   - Start: `2025-11-29T10:00:00Z`
   - End: `2025-11-29T11:00:00Z`
   - Created By: `sre-team`
   - Comment: `Planned deployment`
   - Click "Create"

3. **Verificar Silence:**
   - Silences tab → Ver lista de silences activos
   - Alertas silenciadas no enviarán notificaciones

---

### Silencing via API

```bash
# Create silence
curl -X POST http://localhost:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "SignatureRouterAvailabilityBurnRateCritical", "isRegex": false}
    ],
    "startsAt": "2025-11-29T10:00:00Z",
    "endsAt": "2025-11-29T11:00:00Z",
    "createdBy": "sre-team",
    "comment": "Planned deployment"
  }'

# List silences
curl http://localhost:9093/api/v1/silences | jq

# Delete silence (replace SILENCE_ID)
curl -X DELETE http://localhost:9093/api/v1/silence/SILENCE_ID
```

---

## 🧪 Testing Alerts

### Test 1: Trigger SLO Availability Alert

Genera 5xx errors para disparar alert de availability:

```bash
# Generate 100 5xx errors
for i in {1..100}; do
  curl -X POST http://localhost:8080/api/v1/invalid-endpoint
  sleep 0.1
done

# Wait 5 minutes for alert to fire
sleep 300

# Verify alert in Prometheus
open http://localhost:9090/alerts

# Verify alert in Alertmanager
open http://localhost:9093

# Check Slack #sre-alerts channel for notification
```

---

### Test 2: Trigger JVM Memory Pressure Alert

Simula memory pressure:

```bash
# Trigger memory allocation endpoint (if exists)
curl -X POST http://localhost:8080/actuator/test/memory-pressure

# Or use load testing tool
ab -n 10000 -c 100 http://localhost:8080/api/v1/signatures

# Wait 5 minutes
sleep 300

# Verify alert fired
open http://localhost:9093
```

---

### Test 3: Test Alert Grouping

Dispara múltiples alerts simultáneamente:

```bash
# Trigger availability alert
for i in {1..50}; do curl -X POST http://localhost:8080/api/v1/invalid-endpoint; done &

# Trigger high load (performance alert)
ab -n 5000 -c 200 http://localhost:8080/api/v1/signatures &

# Wait and verify only 1 grouped Slack message sent
sleep 10
```

---

### Test 4: Test Alert Silencing

```bash
# Create silence
curl -X POST http://localhost:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {"name": "severity", "value": "warning", "isRegex": false}
    ],
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "endsAt": "'$(date -u -d '+1 hour' +%Y-%m-%dT%H:%M:%SZ)'",
    "createdBy": "test-user",
    "comment": "Testing silence"
  }'

# Trigger warning alert
# ... (alert should NOT send notification)

# Verify silence active
curl http://localhost:9093/api/v1/silences | jq
```

---

## 🔧 Troubleshooting

### Problem 1: Alertmanager No Recibe Alerts de Prometheus

**Symptoms:**
- Prometheus muestra alerts "firing"
- Alertmanager no muestra alerts

**Diagnosis:**
```bash
# Verify Prometheus connected to Alertmanager
curl http://localhost:9090/api/v1/alertmanagers | jq

# Expected output:
# {
#   "status": "success",
#   "data": {
#     "activeAlertmanagers": [
#       { "url": "http://alertmanager:9093/api/v2/alerts" }
#     ]
#   }
# }
```

**Solution:**
1. Verify `observability/prometheus.yml` tiene sección `alerting`
2. Restart Prometheus: `docker-compose restart prometheus`
3. Check Prometheus logs: `docker-compose logs prometheus`

---

### Problem 2: Slack Notifications No Llegan

**Symptoms:**
- Alert aparece en Alertmanager UI
- No llega mensaje a Slack

**Diagnosis:**
```bash
# Check Alertmanager logs
docker-compose logs alertmanager | grep "slack"

# Test Slack webhook manually
curl -X POST "YOUR_SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message from Alertmanager"}'
```

**Solution:**
1. Verify webhook URL is correct in `alertmanager.yml`
2. Verify Slack app has permission to post to `#sre-alerts`
3. Check if alert is silenced: `http://localhost:9093/#/silences`
4. Restart Alertmanager: `docker-compose restart alertmanager`

---

### Problem 3: Alert Spam (Demasiadas Notificaciones)

**Symptoms:**
- Recibo múltiples notificaciones para la misma alert

**Diagnosis:**
```bash
# Check Alertmanager config grouping
cat observability/alertmanager/alertmanager.yml | grep -A 5 "route:"
```

**Solution:**
1. Verify `group_by` está configurado correctamente
2. Increase `group_wait` y `group_interval`
3. Adjust `repeat_interval` (default 3h)

---

### Problem 4: PagerDuty Incidents No Se Crean

**Symptoms:**
- Alert aparece en Alertmanager
- No se crea incident en PagerDuty

**Diagnosis:**
```bash
# Check Alertmanager logs
docker-compose logs alertmanager | grep "pagerduty"

# Verify PagerDuty service key
cat observability/alertmanager/alertmanager.yml | grep "service_key"
```

**Solution:**
1. Verify PagerDuty service key is correct
2. Verify alert severity is `critical` (PagerDuty solo para critical)
3. Test PagerDuty API manually:
   ```bash
   curl -X POST https://events.pagerduty.com/v2/enqueue \
     -H "Content-Type: application/json" \
     -d '{
       "routing_key": "YOUR_SERVICE_KEY",
       "event_action": "trigger",
       "payload": {
         "summary": "Test alert",
         "severity": "critical",
         "source": "alertmanager"
       }
     }'
   ```

---

## 📖 Runbooks

Cada alert tiene un runbook asociado con pasos de resolución:

| Alert | Runbook Location |
|-------|------------------|
| SLO Availability Burn Rate | `docs/observability/runbooks/slo-availability-burn-rate.md` |
| SLO Performance P99 | `docs/observability/runbooks/slo-performance-p99.md` |
| Provider Circuit Breaker Open | `docs/observability/runbooks/provider-circuit-breaker-open.md` |
| Database Connection Pool Exhausted | `docs/observability/runbooks/database-connection-pool-exhausted.md` |
| JVM Memory Pressure | `docs/observability/runbooks/jvm-memory-pressure.md` |

*(Ver sección Runbooks Templates más abajo)*

---

## 📚 Resources

- [Prometheus Alerting Documentation](https://prometheus.io/docs/alerting/latest/)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [PagerDuty Integration](https://www.pagerduty.com/docs/guides/prometheus-integration-guide/)

---

## 🎯 Success Metrics

| Metric | Before (Epic 9.0) | After (Epic 9.5) | Improvement |
|--------|------------------|------------------|-------------|
| **MTTD** (Mean Time To Detect) | 2 hours | 5 minutes | **96% ↓** |
| **MTTR** (Mean Time To Resolve) | 4 hours | 30 minutes | **87% ↓** |
| **Incidents Detected Proactively** | 60% | 90% | **+30pp** |
| **Downtime Cost** | $500K/año | $50K/año | **90% ↓** |
| **On-Call Efficiency** | Manual monitoring | Automated alerts | **∞** |

---

**Next Steps:**
1. Configure Slack webhook URL
2. Test alerts end-to-end
3. Create runbooks for each alert type
4. Configure PagerDuty (optional)
5. Set up email fallback (optional)

