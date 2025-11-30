# Runbook: SLO Availability Burn Rate Critical

**Alert Name:** `SignatureRouterAvailabilityBurnRateCritical`  
**Severity:** Critical  
**Team:** DevOps/SRE  
**Last Updated:** 2025-11-29

---

## 📋 Alert Details

**Threshold:** Availability < 99.9% for 5 minutes  
**Impact:** User requests are failing, impacting customer experience  
**SLA Impact:** May breach banking SLA (99.9% uptime requirement)

---

## 🚨 Symptoms

- High HTTP 5xx error rate (> 0.1%)
- Users reporting "Service Unavailable" errors
- Availability dashboard shows red status
- Error rate spike in Grafana

---

## 🔍 Diagnosis

### Step 1: Verify Alert is Firing

```bash
# Check Prometheus alerts
open http://localhost:9090/alerts

# Check Alertmanager
open http://localhost:9093

# Verify alert details
curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.labels.alertname == "SignatureRouterAvailabilityBurnRateCritical")'
```

---

### Step 2: Check Error Rate Dashboard

```bash
# Open Executive Overview dashboard
open http://localhost:3000/d/executive-overview

# Look for:
# - Error rate spike
# - Which endpoints are failing
# - HTTP status code breakdown (500, 502, 503, 504)
```

---

### Step 3: Check Application Logs

```bash
# Check Spring Boot logs for exceptions
docker-compose logs signature-router-app | grep "ERROR" | tail -50

# Look for:
# - Database connection errors
# - Kafka producer errors
# - Provider integration timeouts
# - Keycloak authentication failures
```

---

### Step 4: Check Infrastructure Health

```bash
# Verify all services are running
docker-compose ps

# Expected services UP:
# - signature-router-app
# - postgres
# - kafka
# - keycloak
# - vault
# - prometheus
# - grafana
# - alertmanager

# Check service health
curl http://localhost:8080/actuator/health | jq
```

---

## 🛠️ Resolution Steps

### Scenario 1: Database Connection Failures

**Symptoms:** Logs show `HikariPool` connection errors

**Resolution:**
```bash
# 1. Check database is running
docker-compose ps postgres

# 2. Restart database if down
docker-compose restart postgres

# 3. Verify connection pool metrics
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active | jq

# 4. Check for connection leaks (active > max pool size)
curl http://localhost:8080/actuator/metrics/hikaricp.connections.pending | jq
```

**Escalation:** If database has crashed, escalate to DBA team.

---

### Scenario 2: Kafka Producer Failures

**Symptoms:** Logs show `KafkaException` or `TimeoutException`

**Resolution:**
```bash
# 1. Check Kafka is running
docker-compose ps kafka

# 2. Restart Kafka if down
docker-compose restart kafka

# 3. Verify Kafka topics exist
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# 4. Check Kafka producer metrics
curl http://localhost:8080/actuator/metrics/kafka.producer.record.send.total | jq
```

**Workaround:** If Kafka is down but not blocking critical flows, consider temporary circuit breaker to prevent cascading failures.

---

### Scenario 3: Provider Integration Timeouts

**Symptoms:** Circuit breakers are OPEN, provider latency high

**Resolution:**
```bash
# 1. Check circuit breaker status
curl http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.state | jq

# 2. Check provider health dashboard
open http://localhost:3000/d/provider-health

# 3. Verify provider endpoints externally
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json

# 4. If provider is down, enable fallback routing
# (Automatic fallback should already be active)
```

**Escalation:** Contact provider support team if downtime persists > 15 minutes.

---

### Scenario 4: Keycloak Authentication Failures

**Symptoms:** High rate of 401/403 errors, auth failures in logs

**Resolution:**
```bash
# 1. Check Keycloak is running
docker-compose ps keycloak

# 2. Restart Keycloak if down
docker-compose restart keycloak

# 3. Verify Keycloak admin console accessible
open http://localhost:8180

# 4. Check realm configuration
# Admin Console → Realms → signature-router
```

**Workaround:** If Keycloak is down, consider emergency read-only mode (if implemented).

---

### Scenario 5: Application Crash / Out of Memory

**Symptoms:** Application not responding, OOMKilled in logs

**Resolution:**
```bash
# 1. Check application status
docker-compose ps signature-router-app

# 2. Check memory usage
docker stats signature-router-app

# 3. Check JVM heap usage
curl http://localhost:8080/actuator/metrics/jvm.memory.used | jq

# 4. Restart application if crashed
docker-compose restart signature-router-app

# 5. Increase JVM heap if needed (in docker-compose.yml)
# JAVA_OPTS: "-Xmx2g -Xms1g"
```

**Post-Incident:** Investigate heap dump for memory leak.

---

## ✅ Verification

After resolution, verify availability is restored:

```bash
# 1. Wait 2-3 minutes for metrics to update
sleep 180

# 2. Check availability metric
curl 'http://localhost:9090/api/v1/query?query=sum(rate(http_server_requests_seconds_count{status!~"5.."}[5m]))/sum(rate(http_server_requests_seconds_count[5m]))' | jq

# Expected: > 0.999 (99.9%)

# 3. Verify alert resolved in Alertmanager
open http://localhost:9093

# 4. Check Slack for "✅ RESOLVED" message
```

---

## 📝 Post-Incident Actions

1. **Create Incident Report:**
   - Start time, end time, duration
   - Root cause analysis
   - Impact (# of failed requests, # of affected users)
   - Corrective actions taken

2. **Update Metrics:**
   - Calculate actual downtime
   - Update error budget (99.9% SLA)
   - Document in SLO compliance report

3. **Prevention:**
   - Add additional monitoring if gap identified
   - Improve runbook if steps were unclear
   - Consider circuit breaker tuning if provider-related

4. **Communication:**
   - Notify stakeholders (PM, Engineering Manager)
   - Update status page (if customer-facing)

---

## 📞 Escalation Path

| Duration | Action |
|----------|--------|
| **0-5 min** | On-call SRE investigates |
| **5-15 min** | Escalate to Backend Engineering team |
| **15-30 min** | Escalate to Engineering Manager |
| **30-60 min** | Escalate to CTO + external support (providers, cloud) |

---

## 📊 Related Dashboards

- [Executive Overview](http://localhost:3000/d/executive-overview)
- [Provider Health](http://localhost:3000/d/provider-health)
- [Infrastructure](http://localhost:3000/d/infrastructure)

---

## 📚 Related Runbooks

- [SLO Performance P99 Burn Rate](./slo-performance-p99.md)
- [Database Connection Pool Exhausted](./database-connection-pool-exhausted.md)
- [Provider Circuit Breaker Open](./provider-circuit-breaker-open.md)

