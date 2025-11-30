# Runbook: Provider Circuit Breaker Open

**Alert Name:** `ProviderCircuitBreakerOpen`  
**Severity:** Critical  
**Team:** DevOps/SRE  
**Last Updated:** 2025-11-29

---

## 📋 Alert Details

**Threshold:** Circuit breaker state = OPEN for 5 minutes  
**Impact:** All requests to external provider are being blocked (fail-fast)  
**Business Impact:** Signature requests may be failing or routing to fallback channels

---

## 🚨 Symptoms

- Circuit breaker status showing "OPEN" in metrics
- High rate of provider call failures
- Fallback channel activation increasing
- Users may experience delays (fallback channels slower)

---

## 🔍 Diagnosis

### Step 1: Identify Which Provider Circuit Breaker is Open

```bash
# Check circuit breaker state for all providers
curl http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.state | jq

# Expected output:
# {
#   "name": "resilience4j.circuitbreaker.state",
#   "measurements": [
#     { "statistic": "VALUE", "value": 1 }  # 1 = OPEN, 0 = CLOSED, 0.5 = HALF_OPEN
#   ],
#   "availableTags": [
#     {
#       "tag": "name",
#       "values": ["twilioSmsProvider", "pushNotificationProvider", "voiceProvider"]
#     }
#   ]
# }

# Query specific provider
curl 'http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.state?tag=name:twilioSmsProvider' | jq
```

---

### Step 2: Check Provider Health Dashboard

```bash
# Open Provider Health dashboard
open http://localhost:3000/d/provider-health

# Look for:
# - Which provider's circuit breaker is OPEN
# - Provider latency (P95, P99)
# - Provider error rate
# - Fallback rate by channel
```

---

### Step 3: Check Provider Call Failures

```bash
# Check circuit breaker failure rate
curl http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.failure.rate | jq

# Check provider call errors (last 5 minutes)
curl 'http://localhost:9090/api/v1/query?query=increase(provider_calls_total{status="error"}[5m])' | jq

# Check application logs for provider errors
docker-compose logs signature-router-app | grep "ProviderException" | tail -20
```

---

### Step 4: Verify Provider Endpoint Externally

Test provider API directly (outside application):

```bash
# Example: Test Twilio SMS API
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json \
  -u "YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN" \
  -d "From=+1234567890" \
  -d "To=+0987654321" \
  -d "Body=Test message"

# Expected: HTTP 201 Created (or 200 OK)
# If error: Provider is down or credentials invalid
```

---

## 🛠️ Resolution Steps

### Scenario 1: Provider API is Down (External Outage)

**Symptoms:** External curl test fails, provider status page shows outage

**Resolution:**
```bash
# 1. Verify provider status page
# - Twilio: https://status.twilio.com/
# - Pusher: https://status.pusher.com/
# - Vonage: https://status.nexmo.com/

# 2. Check provider support channels (Twitter, email)

# 3. Verify fallback routing is working
curl 'http://localhost:9090/api/v1/query?query=rate(routing_fallback_triggered_total[5m])' | jq

# 4. Wait for provider to restore service
# (Circuit breaker will auto-transition to HALF_OPEN and retry)

# 5. Monitor fallback rate
# Fallback should be handling traffic until provider recovers
```

**Communication:**
- Notify stakeholders: "Provider X experiencing outage, fallback channels active"
- Update status page (if customer-facing)

**No Action Required:** Circuit breaker is doing its job (preventing cascading failures)

---

### Scenario 2: Invalid Credentials / Configuration Error

**Symptoms:** External curl test fails with 401/403, logs show authentication errors

**Resolution:**
```bash
# 1. Verify provider credentials in Vault
curl -X GET http://localhost:8200/v1/secret/data/providers/twilio \
  -H "X-Vault-Token: dev-token-123" | jq

# 2. Check for expired API keys
# (Some providers rotate keys periodically)

# 3. Update credentials in Vault if needed
curl -X POST http://localhost:8200/v1/secret/data/providers/twilio \
  -H "X-Vault-Token: dev-token-123" \
  -d '{
    "data": {
      "accountSid": "NEW_ACCOUNT_SID",
      "authToken": "NEW_AUTH_TOKEN"
    }
  }'

# 4. Restart application to reload credentials
docker-compose restart signature-router-app

# 5. Manually transition circuit breaker to HALF_OPEN (test retry)
curl -X POST http://localhost:8080/actuator/circuitbreaker/twilioSmsProvider/state \
  -H "Content-Type: application/json" \
  -d '{"state": "HALF_OPEN"}'
```

---

### Scenario 3: Network/Firewall Issue

**Symptoms:** Connection timeout errors, external curl test works from different network

**Resolution:**
```bash
# 1. Check network connectivity from Docker container
docker-compose exec signature-router-app curl -I https://api.twilio.com

# 2. Check DNS resolution
docker-compose exec signature-router-app nslookup api.twilio.com

# 3. Check firewall rules (outbound HTTPS allowed?)
# Contact network/security team if blocked

# 4. Verify proxy settings (if corporate proxy required)
# Check JAVA_OPTS in docker-compose.yml:
# -Dhttp.proxyHost=proxy.example.com -Dhttp.proxyPort=8080
```

---

### Scenario 4: Provider Rate Limiting

**Symptoms:** 429 Too Many Requests errors in logs

**Resolution:**
```bash
# 1. Check rate limit headers in provider response
# (Look for X-RateLimit-Remaining, X-RateLimit-Reset)

# 2. Verify request volume
curl 'http://localhost:9090/api/v1/query?query=rate(provider_calls_total[1m])' | jq

# 3. Implement request throttling if needed
# (Add rate limiter configuration in application.yml)

# 4. Contact provider support to increase rate limits
# (May require plan upgrade)

# 5. Temporary workaround: Increase circuit breaker thresholds
# (Edit application.yml, restart app)
```

---

### Scenario 5: Circuit Breaker Misconfiguration

**Symptoms:** Circuit breaker opening too frequently, provider is actually healthy

**Resolution:**
```bash
# 1. Check circuit breaker configuration
cat src/main/resources/application.yml | grep -A 10 "circuitbreaker"

# 2. Review metrics:
# - failureRateThreshold (default 50%)
# - slowCallRateThreshold (default 100%)
# - slowCallDurationThreshold (default 60s)
# - minimumNumberOfCalls (default 10)

# 3. If thresholds too aggressive, adjust in application.yml:
resilience4j:
  circuitbreaker:
    instances:
      twilioSmsProvider:
        failureRateThreshold: 70  # Increase from 50%
        slowCallRateThreshold: 80  # Increase from 100%

# 4. Restart application
docker-compose restart signature-router-app
```

---

## ✅ Verification

After resolution, verify circuit breaker transitions to CLOSED:

```bash
# 1. Wait 1-2 minutes for circuit breaker to retry (HALF_OPEN state)
sleep 120

# 2. Check circuit breaker state
curl 'http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.state?tag=name:twilioSmsProvider' | jq

# Expected: "value": 0  # 0 = CLOSED (healthy)

# 3. Verify provider calls succeeding
curl 'http://localhost:9090/api/v1/query?query=rate(provider_calls_total{status="success"}[5m])' | jq

# 4. Check alert resolved in Alertmanager
open http://localhost:9093

# 5. Verify fallback rate returning to normal (<5%)
open http://localhost:3000/d/provider-health
```

---

## 📝 Post-Incident Actions

1. **Root Cause Analysis:**
   - Provider outage? → Log incident with provider support ticket #
   - Configuration error? → Update runbook with prevention steps
   - Rate limiting? → Document provider limits, plan upgrade if needed

2. **Update Monitoring:**
   - Add provider status page monitoring (if not already)
   - Consider external uptime monitoring (Pingdom, UptimeRobot)

3. **Improve Resilience:**
   - Review circuit breaker thresholds (too sensitive?)
   - Verify fallback routing is effective
   - Consider multi-provider setup for critical channels

4. **Communication:**
   - Notify stakeholders of resolution
   - Document lessons learned in incident report

---

## 🔄 Circuit Breaker State Machine

```
┌─────────────────────────────────────────────────────────┐
│                   CLOSED (Normal)                       │
│  - All requests pass through to provider               │
│  - Failures are counted                                │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Failure rate > threshold
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   OPEN (Blocked)                        │
│  - All requests are blocked (fail-fast)                │
│  - No calls to provider                                │
│  - Wait for configured duration                        │
└─────────────────────────────────────────────────────────┘
                         │
                         │ After wait duration
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  HALF_OPEN (Testing)                    │
│  - Limited # of requests allowed through               │
│  - Testing if provider recovered                       │
└─────────────────────────────────────────────────────────┘
         │                                │
         │ Success                        │ Failure
         ▼                                ▼
      CLOSED                            OPEN
```

---

## 📞 Escalation Path

| Duration | Action |
|----------|--------|
| **0-5 min** | On-call SRE investigates, verifies provider status |
| **5-15 min** | Contact provider support (create ticket) |
| **15-30 min** | Escalate to Engineering Manager, consider fallback channels |
| **30-60 min** | Escalate to CTO, consider emergency provider switch |

---

## 📊 Related Dashboards

- [Provider Health](http://localhost:3000/d/provider-health) - Circuit breaker status
- [Executive Overview](http://localhost:3000/d/executive-overview) - Overall system health
- [Performance](http://localhost:3000/d/performance) - Provider latency

---

## 📚 Related Runbooks

- [High Fallback Rate](./high-fallback-rate.md)
- [SLO Availability Burn Rate](./slo-availability-burn-rate.md)

