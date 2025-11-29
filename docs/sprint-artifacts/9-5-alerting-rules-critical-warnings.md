# Story 9.5: Alerting Rules - Critical & Warnings

**Status:** drafted  
**Epic:** Epic 9 - Observability & SLO Tracking  
**Sprint:** Sprint 9  
**Story Points:** 3  
**Created:** 2025-11-29

---

## 📋 Story Description

**As a** DevOps/SRE Team  
**I want** Prometheus Alertmanager configurado con routing a Slack/PagerDuty/Email para alertas críticas y warnings  
**So that** Puedo recibir notificaciones proactivas de degradación del sistema ANTES de impactar usuarios (MTTD 2h → 5min, 96% reducción)

---

## 🎯 Business Value

Implementa **proactive incident detection** con Alertmanager que permite:

- **Fast Incident Detection**: MTTD (Mean Time To Detect) 2h → 5min (96% reducción)
- **Prevent User Impact**: 90% de incidents detectados antes de afectar usuarios (vs 60% sin alerting)
- **Reduce Downtime Cost**: $10K/hora downtime → Alerting proactivo evita $500K/año
- **On-Call Efficiency**: Alertas críticas a PagerDuty (wake up engineers), warnings a Slack (durante business hours)
- **Alert Fatigue Prevention**: Deduplicación + silencing + inhibition rules evitan alert spam
- **Multi-Channel Notifications**: Slack (#sre-alerts) + PagerDuty (critical) + Email (fallback)

**NFR Mapping**:
- **NFR-O12**: Alertmanager para routing + deduplicación de alertas ✅
- **NFR-O14**: Slack integration para notificaciones en tiempo real ✅
- **NFR-O15**: PagerDuty integration para alertas críticas (on-call) ✅
- **NFR-A1**: 99.9% availability → Alertas cuando error rate > 0.1%
- **NFR-P1**: P99 < 300ms → Alertas cuando P99 > 300ms

**Business Impact**:
- **Downtime Cost Reduction**: $10K/hora → $500K/año evitados
- **Engineering Efficiency**: 40% tiempo en manual monitoring → 5% (automated alerting)
- **Customer Satisfaction**: 96% reducción en MTTD mejora customer experience
- **SLA Compliance**: Proactive alerts aseguran cumplimiento de SLAs bancarios

---

## ✅ Acceptance Criteria

### AC1: Alertmanager Service Configurado en Docker Compose

**Given** Alertmanager está configurado en `docker-compose.yml`  
**When** ejecuto `docker-compose up -d alertmanager`  
**Then** Alertmanager inicia correctamente en puerto 9093  
**And** está accesible vía `http://localhost:9093`

**Validation:**
```bash
# Start Alertmanager
docker-compose up -d alertmanager

# Verify service healthy
curl http://localhost:9093/-/healthy
# Expected: HTTP 200 OK

# Verify UI accessible
open http://localhost:9093
```

---

### AC2: Alertmanager Configurado con Routing Tree

**Given** Alertmanager está corriendo  
**When** reviso configuración en `observability/alertmanager/alertmanager.yml`  
**Then** veo routing tree configurado:
- **Critical alerts** → Route to PagerDuty + Slack
- **Warning alerts** → Route to Slack only
- **Group by:** alertname, severity
- **Group wait:** 10s (wait for more alerts before sending)
- **Group interval:** 5m (batch alerts every 5 minutes)
- **Repeat interval:** 3h (resend unresolved alerts every 3 hours)

**File:** `observability/alertmanager/alertmanager.yml`
```yaml
route:
  receiver: 'slack-sre-alerts'
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 3h
  
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    
    - match:
        severity: critical
      receiver: 'slack-sre-alerts'
```

---

### AC3: Slack Integration Configurada

**Given** Slack webhook URL está configurado  
**When** una alerta se dispara  
**Then** notificación se envía a canal Slack `#sre-alerts`  
**And** mensaje incluye: alertname, severity, description, runbook link

**Slack Message Format:**
```
🔴 CRITICAL: SLO Availability Burn Rate Too High

Error rate 0.15% exceeds 0.1% threshold for 5 minutes
Current availability: 99.85%

Runbook: https://wiki.example.com/runbooks/slo-availability-burn-rate
```

**Validation:**
```bash
# Trigger test alert (simulate high error rate)
# Generate 50 5xx errors
for i in {1..50}; do
  curl -X POST http://localhost:8080/api/v1/invalid-endpoint
done

# Wait 5 minutes for alert to fire
sleep 300

# Verify Slack message received in #sre-alerts channel
```

---

### AC4: PagerDuty Integration Configurada (OPCIONAL - Bonus)

**Given** PagerDuty integration key está configurado  
**When** alerta **crítica** se dispara  
**Then** incident se crea en PagerDuty  
**And** on-call engineer recibe notificación (SMS/phone call)

**Validation:**
- Trigger critical alert → Verify PagerDuty incident created
- (Opcional si no hay PagerDuty: skip this AC)

---

### AC5: Email Fallback Configurado

**Given** Slack webhook falla (network issue)  
**When** alerta se dispara  
**Then** email se envía a `sre-team@example.com` como fallback

**File:** `observability/alertmanager/alertmanager.yml`
```yaml
receivers:
  - name: 'email-fallback'
    email_configs:
      - to: 'sre-team@example.com'
        from: 'alertmanager@signature-router.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@signature-router.com'
        auth_password: '<password>'
```

---

### AC6: Alert Deduplication & Grouping

**Given** múltiples alerts se disparan simultáneamente  
**When** Alertmanager recibe alerts  
**Then** alerts se agrupan por `alertname` y `severity`  
**And** solo 1 notificación se envía (NO spam)

**Example:**
- 10 alerts de `SLOAvailabilityBurnRateCritical` en 10s → Grouped into 1 Slack message
- Message shows: "10 alerts firing"

---

### AC7: Alert Silencing & Inhibition Rules

**Given** estoy haciendo deployment planned  
**When** creo silence rule en Alertmanager UI  
**Then** alertas se silencian durante ventana de mantenimiento  
**And** NO se envían notificaciones

**Validation:**
```bash
# Create silence via API
curl -X POST http://localhost:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "SLOAvailabilityBurnRateCritical", "isRegex": false}
    ],
    "startsAt": "2025-11-29T10:00:00Z",
    "endsAt": "2025-11-29T11:00:00Z",
    "createdBy": "sre-team",
    "comment": "Planned deployment"
  }'

# Verify silence active
curl http://localhost:9093/api/v1/silences | jq
```

**Inhibition Rule Example:**
```yaml
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```
(If critical alert firing, suppress corresponding warning alert)

---

### AC8: Prometheus Integrado con Alertmanager

**Given** Prometheus está configurado para enviar alerts a Alertmanager  
**When** alert rule se evalúa como `firing`  
**Then** alert se envía a Alertmanager automáticamente

**File:** `observability/prometheus.yml`
```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

**Validation:**
```bash
# Verify Prometheus connected to Alertmanager
curl http://localhost:9090/api/v1/alertmanagers | jq
# Expected: Alertmanager endpoint with state "up"
```

---

### AC9: Alert Rules Adicionales (Beyond SLO)

**Given** tengo rules adicionales para provider health  
**When** provider circuit breaker abre  
**Then** alert `ProviderCircuitBreakerOpen` se dispara

**Additional Alert Rules:**

1. **ProviderCircuitBreakerOpen** (Critical)
   - Provider circuit breaker en estado OPEN por >5min
   - Severity: critical

2. **HighFallbackRate** (Warning)
   - Fallback rate > 10% por 10min
   - Severity: warning

3. **DatabaseConnectionPoolExhausted** (Critical)
   - HikariCP pending connections > 5 por 2min
   - Severity: critical

4. **KafkaProducerLagHigh** (Warning)
   - Kafka producer lag > 1000 messages por 5min
   - Severity: warning

5. **JVMMemoryPressure** (Warning)
   - JVM heap usage > 85% por 5min
   - Severity: warning

**File:** `observability/prometheus/alerts/infrastructure-alerts.yml`

---

### AC10: Alertmanager UI Funcional

**Given** Alertmanager UI está accesible  
**When** abro `http://localhost:9093`  
**Then** veo:
- Lista de alertas activas (firing)
- Silences configurados
- Botón "New Silence" funcional
- Status de receivers (Slack, PagerDuty, Email)

---

### AC11: Alert Testing Script

**Given** script de testing automatizado  
**When** ejecuto `scripts/test-alerts.sh`  
**Then** script:
1. Genera tráfico con errores (trigger availability alert)
2. Simula latencia alta (trigger performance alert)
3. Verifica alerts aparecen en Prometheus
4. Verifica notificaciones en Slack
5. Reporta resultado: PASS/FAIL

---

## 🏗️ Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Prometheus Alert Rules                       │
│  - SLO alerts (availability, performance)              │
│  - Infrastructure alerts (circuit breaker, DB, Kafka)  │
│  - Provider health alerts                              │
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

## 📋 Tasks

### Task 1: Add Alertmanager Service to Docker Compose (30 min)
**Subtasks:**
1. Add Alertmanager service to `docker-compose.yml`
   - Image: `prom/alertmanager:v0.26.0`
   - Port: `9093:9093`
   - Volumes: config, data
2. Create directory: `observability/alertmanager/`
3. Add healthcheck for Alertmanager

### Task 2: Create Alertmanager Configuration (1 hora)
**Subtasks:**
1. Create `observability/alertmanager/alertmanager.yml`
2. Configure global settings (resolve_timeout, slack_api_url)
3. Define routing tree (critical → PagerDuty + Slack, warning → Slack)
4. Configure receivers (slack-sre-alerts, pagerduty-critical, email-fallback)
5. Add inhibit_rules (critical suppresses warning)

### Task 3: Configure Slack Integration (30 min)
**Subtasks:**
1. Create Slack incoming webhook for #sre-alerts channel
2. Add webhook URL to `alertmanager.yml` (or .env file for security)
3. Configure Slack message template (title, text, color)
4. Test Slack notification with `amtool` (Alertmanager CLI)

### Task 4: Configure Prometheus to Send Alerts to Alertmanager (15 min)
**Subtasks:**
1. Update `observability/prometheus.yml`
2. Add `alerting` section with Alertmanager target
3. Restart Prometheus: `docker-compose restart prometheus`
4. Verify connection: `curl http://localhost:9090/api/v1/alertmanagers`

### Task 5: Create Additional Alert Rules (1.5 horas)
**Subtasks:**
1. Create `observability/prometheus/alerts/infrastructure-alerts.yml`
2. Add alert: `ProviderCircuitBreakerOpen` (critical)
3. Add alert: `HighFallbackRate` (warning)
4. Add alert: `DatabaseConnectionPoolExhausted` (critical)
5. Add alert: `KafkaProducerLagHigh` (warning)
6. Add alert: `JVMMemoryPressure` (warning)
7. Verify syntax: `promtool check rules infrastructure-alerts.yml`

### Task 6: Configure PagerDuty Integration (OPCIONAL - 1 hora)
**Subtasks:**
1. Create PagerDuty integration key
2. Add PagerDuty receiver to `alertmanager.yml`
3. Test critical alert routing to PagerDuty
4. (Skip if PagerDuty unavailable)

### Task 7: Configure Email Fallback (30 min)
**Subtasks:**
1. Add email receiver to `alertmanager.yml`
2. Configure SMTP settings (Gmail SMTP as example)
3. Add email to routing as fallback
4. Test email notification

### Task 8: Integration Testing (1 hora)
**Subtasks:**
1. Start full stack: `docker-compose up -d`
2. Trigger SLO availability alert (generate 5xx errors)
3. Verify alert appears in Prometheus UI
4. Verify alert sent to Alertmanager
5. Verify Slack notification received
6. Test alert silencing via Alertmanager UI
7. Test alert grouping (trigger multiple alerts)

### Task 9: Create Alert Testing Script (1 hora)
**Subtasks:**
1. Create `scripts/test-alerts.sh`
2. Function: generate_high_error_rate()
3. Function: generate_high_latency()
4. Function: verify_prometheus_alerts()
5. Function: verify_slack_notification()
6. Make script executable + documentation

### Task 10: Documentation (1 hora)
**Subtasks:**
1. Create `docs/observability/ALERTING.md`:
   - Alertmanager overview
   - Alert routing tree diagram
   - Slack/PagerDuty/Email configuration
   - How to create silences
   - How to test alerts
   - Troubleshooting guide
2. Update `README.md` with Alerting section
3. Update `CHANGELOG.md` with Story 9.5 entry
4. Create runbook templates for each alert type

### Task 11: Code Review Prep (30 min)
**Subtasks:**
1. Validate all 11 Acceptance Criteria met
2. Test alert end-to-end (Prometheus → Alertmanager → Slack)
3. Prepare demo for SM review

---

## 📂 Files to Create

1. **`observability/alertmanager/alertmanager.yml`** (~100 lines) - Alertmanager main config
2. **`observability/prometheus/alerts/infrastructure-alerts.yml`** (~150 lines) - 5 additional alert rules
3. **`scripts/test-alerts.sh`** (~100 lines) - Automated alert testing script
4. **`docs/observability/ALERTING.md`** (~400 lines) - Alerting documentation
5. **`docs/observability/runbooks/slo-availability-burn-rate.md`** (~200 lines) - Runbook for SLO availability alert
6. **`docs/observability/runbooks/slo-performance-p99.md`** (~200 lines) - Runbook for SLO performance alert

---

## 📝 Files to Modify

1. **`docker-compose.yml`** (+20 lines) - Add Alertmanager service
2. **`observability/prometheus.yml`** (+5 lines) - Add alerting section
3. **`README.md`** (+40 lines) - Add Alerting section
4. **`CHANGELOG.md`** (+50 lines) - Add Story 9.5 entry
5. **`.env.example`** (+3 lines) - Add Slack/PagerDuty/Email credentials placeholders

---

## 🧪 Testing Strategy

### Manual Testing
1. **Slack Integration Test**: Trigger alert → Verify Slack message
2. **Alert Grouping Test**: Trigger 10 alerts simultaneously → Verify 1 grouped message
3. **Silence Test**: Create silence → Trigger alert → Verify NO notification
4. **Inhibition Test**: Fire critical + warning → Verify warning suppressed

### Automated Testing (Bonus)
- `scripts/test-alerts.sh` - End-to-end alert testing script

---

## 📚 Dependencies

- **Story 9.2** (Prometheus Metrics): REQUIRED - metrics must exist
- **Story 9.3** (Grafana Dashboards): REQUIRED - SLO alert rules must exist
- **Slack Workspace**: REQUIRED - need webhook URL
- **PagerDuty Account**: OPTIONAL - can skip if unavailable

---

## 🎯 Definition of Done

- [ ] Alertmanager service running in Docker Compose
- [ ] Slack integration working (test alert received)
- [ ] Email fallback configured
- [ ] 5 additional alert rules created (infrastructure-alerts.yml)
- [ ] Prometheus connected to Alertmanager
- [ ] Alert deduplication & grouping working
- [ ] Alert silencing tested via UI
- [ ] Documentation complete (ALERTING.md + runbooks)
- [ ] README.md + CHANGELOG.md updated
- [ ] Automated test script created

**Story Status:** ✅ READY FOR DEVELOPMENT  
**Next Step:** Execute `/bmad:bmm:workflows:story-context` (Story Context creation)

