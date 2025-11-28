# Provider Retry Logic - Operational Runbook

**Story**: 3.9 - Provider Retry Logic  
**Last Updated**: 2025-11-28  
**Owner**: Dev Team / SRE

---

## Overview

This runbook provides operational guidance for monitoring, troubleshooting, and managing the Provider Retry Logic implemented in Story 3.9. The retry mechanism automatically retries failed provider calls (SMS, Push, Voice, Biometric) with exponential backoff to improve system resilience against transient failures.

---

## Retry Configuration

### Provider-Specific Retry Policies

| Provider   | Max Attempts | Initial Wait | Backoff Multiplier | Retryable Exceptions |
|------------|--------------|--------------|--------------------|-----------------------|
| **SMS**    | 3            | 1s           | 2x                 | IOException, TimeoutException, ApiException (5xx) |
| **PUSH**   | 3            | 500ms        | 2x                 | IOException, TimeoutException, FirebaseMessagingException (UNAVAILABLE, INTERNAL) |
| **VOICE**  | 2            | 2s           | 2x                 | IOException, TimeoutException, ApiException (5xx) |
| **BIOMETRIC** | 1 (no retry) | 0s        | -                  | - |

### Environment-Specific Configuration

#### Production (`application-prod.yml`)
```yaml
resilience4j:
  retry:
    instances:
      smsRetry:
        max-attempts: 3
        wait-duration: 1s
      pushRetry:
        max-attempts: 3
        wait-duration: 500ms
      voiceRetry:
        max-attempts: 2
        wait-duration: 2s
      biometricRetry:
        max-attempts: 1  # No retries
```

#### Local Development (`application-local.yml`)
```yaml
resilience4j:
  retry:
    instances:
      smsRetry:
        max-attempts: 5  # Aggressive for testing
        wait-duration: 500ms
      pushRetry:
        max-attempts: 5
        wait-duration: 250ms
```

---

## Monitoring & Metrics

### Prometheus Metrics

The following Prometheus metrics are exported for monitoring retry behavior:

#### `provider.retry.attempts.total`
- **Type**: Counter
- **Labels**: `provider` (SMS, PUSH, VOICE, BIOMETRIC), `attempt` (1, 2, 3, ...)
- **Description**: Total number of retry attempts per provider
- **Alert Threshold**: High retry rate (> 20% of total calls)

**Sample Query**:
```promql
rate(provider_retry_attempts_total[5m])
```

#### `provider.retry.success.total`
- **Type**: Counter
- **Labels**: `provider`, `after_attempts` (1, 2, 3, ...)
- **Description**: Successful provider calls after retries
- **Alert Threshold**: High rate of retried successes (> 10%)

**Sample Query**:
```promql
sum(rate(provider_retry_success_total{after_attempts!="1"}[5m])) by (provider)
```

#### `provider.retry.exhausted.total`
- **Type**: Counter
- **Labels**: `provider`
- **Description**: Failed provider calls after all retry attempts exhausted
- **Alert Threshold**: > 5% of total calls

**Sample Query**:
```promql
rate(provider_retry_exhausted_total[5m])
```

#### `provider.retry.duration`
- **Type**: Timer/Histogram
- **Labels**: `provider`
- **Description**: Total duration from first attempt to final result (including retry delays)
- **Alert Threshold**: p99 > 10s

**Sample Query**:
```promql
histogram_quantile(0.99, provider_retry_duration_bucket)
```

### Sample Grafana Dashboard Queries

**Retry Rate by Provider**:
```promql
sum(rate(provider_retry_attempts_total[5m])) by (provider, attempt)
```

**Success Rate After Retries**:
```promql
sum(rate(provider_retry_success_total{after_attempts!="1"}[5m])) 
/ 
sum(rate(provider_retry_attempts_total{attempt="1"}[5m]))
```

**Retry Exhaustion Rate**:
```promql
rate(provider_retry_exhausted_total[5m]) 
/ 
rate(provider_retry_attempts_total{attempt="1"}[5m])
```

---

## Logging

### Log Levels

| Event | Level | Format |
|-------|-------|--------|
| Retry Attempt | `WARN` | `Provider retry attempt {attempt}: provider={provider}, exception={exception}, traceId={traceId}` |
| Success After Retry | `INFO` | `Provider success after {retries} retries: provider={provider}, traceId={traceId}` |
| Retry Exhausted | `ERROR` | `Provider retry exhausted: provider={provider}, attempts={attempts}, last_error={error}, traceId={traceId}` |

### Log Aggregation Queries

**Splunk/ELK - Find Retry Patterns**:
```spl
index=signature-router level=WARN "Provider retry attempt"
| stats count by provider, exception
| sort -count
```

**Splunk/ELK - Find Exhausted Retries**:
```spl
index=signature-router level=ERROR "Provider retry exhausted"
| stats count by provider, last_error
| sort -count
```

**Trace Correlation**:
```spl
index=signature-router traceId="abc-123-def"
| search "retry" OR "exhausted" OR "success after"
| table _time, level, provider, message
```

---

## Troubleshooting

### High Retry Rate (> 20% of calls)

**Symptoms**:
- Prometheus metric `provider_retry_attempts_total` increasing rapidly
- Logs show frequent `Provider retry attempt` warnings

**Possible Causes**:
1. **Provider Service Degradation**: External API (Twilio, FCM) experiencing issues
2. **Network Instability**: Intermittent connectivity between app and provider
3. **Timeout Misconfiguration**: Timeout too aggressive, causing false timeouts

**Resolution Steps**:
1. **Check Provider Status**: 
   - Twilio: https://status.twilio.com/
   - FCM: https://status.firebase.google.com/
   
2. **Verify Network Health**:
   ```bash
   # From app server
   curl -I https://api.twilio.com
   curl -I https://fcm.googleapis.com
   ```

3. **Review Timeout Configuration** (`application.yml`):
   ```yaml
   resilience4j:
     timelimiter:
       instances:
         smsTimeout:
           timeout-duration: 5s  # May need adjustment
   ```

4. **Temporary Mitigation** (if provider issue):
   - Enable circuit breaker (Epic 4 - future)
   - Reduce retry attempts temporarily:
     ```yaml
     resilience4j:
       retry:
         instances:
           smsRetry:
             max-attempts: 2  # Reduce from 3
     ```

### Retry Exhaustion (> 5% of calls)

**Symptoms**:
- Prometheus metric `provider_retry_exhausted_total` increasing
- Logs show `Provider retry exhausted` errors
- End users not receiving challenges

**Possible Causes**:
1. **Provider Outage**: Complete failure of external provider API
2. **Invalid Configuration**: Wrong API credentials, invalid phone numbers
3. **Rate Limiting**: Provider throttling requests

**Resolution Steps**:
1. **Check Provider Dashboard**:
   - Twilio: https://www.twilio.com/console
   - FCM: https://console.firebase.google.com/

2. **Verify Credentials** (Vault):
   ```bash
   vault kv get secret/signature-router/twilio
   vault kv get secret/signature-router/fcm
   ```

3. **Check Rate Limits**:
   - Review provider account limits
   - Check Prometheus metric `provider.calls` for spike

4. **Escalation Path**:
   - **Level 1**: Contact provider support (Twilio, Google FCM)
   - **Level 2**: Enable fallback provider (Epic 4 - future)
   - **Level 3**: Temporarily disable signature creation API

### Slow Retry Duration (p99 > 10s)

**Symptoms**:
- Prometheus metric `provider_retry_duration` p99 > 10s
- Users experiencing slow challenge delivery

**Possible Causes**:
1. **Excessive Retry Delays**: Exponential backoff causing long waits
2. **High Max Attempts**: Too many retries before failure

**Resolution Steps**:
1. **Review Retry Configuration**:
   ```yaml
   resilience4j:
     retry:
       instances:
         smsRetry:
           max-attempts: 3
           wait-duration: 1s
           exponential-backoff-multiplier: 2
   # Total max duration: 1s + 2s + 4s = 7s
   ```

2. **Optimize for Faster Failure**:
   - Reduce `max-attempts` from 3 to 2
   - Reduce `wait-duration` from 1s to 500ms

3. **Monitor Impact**:
   - Watch `provider_retry_success_total` (may decrease)
   - Watch `provider_retry_exhausted_total` (may increase)
   - Balance speed vs resilience

---

## Configuration Changes

### How to Update Retry Configuration

1. **Edit Configuration File** (`application-{env}.yml`):
   ```yaml
   resilience4j:
     retry:
       instances:
         smsRetry:
           max-attempts: 4  # Increase from 3
           wait-duration: 800ms  # Adjust timing
   ```

2. **Test in Local/UAT First**:
   ```bash
   # Run integration tests
   mvn test -Dtest=ProviderRetryIntegrationTest
   ```

3. **Deploy to Production**:
   ```bash
   # Rolling deployment to avoid downtime
   kubectl rollout restart deployment/signature-router
   ```

4. **Monitor Post-Deployment**:
   - Watch Prometheus metrics for 30 minutes
   - Check for unexpected increases in `retry_exhausted_total`

### Emergency Rollback

If retry changes cause issues:

1. **Revert Configuration**:
   ```bash
   git revert HEAD
   kubectl rollout undo deployment/signature-router
   ```

2. **Verify Rollback**:
   ```bash
   kubectl get pods -l app=signature-router
   kubectl logs <pod-name> | grep "Retry configuration"
   ```

---

## Alerting Rules

### Recommended Prometheus Alerts

```yaml
groups:
  - name: provider_retry_alerts
    rules:
      - alert: HighProviderRetryRate
        expr: |
          (
            sum(rate(provider_retry_attempts_total{attempt!="1"}[5m])) by (provider)
            /
            sum(rate(provider_retry_attempts_total{attempt="1"}[5m])) by (provider)
          ) > 0.2
        for: 5m
        labels:
          severity: warning
          component: provider-retry
        annotations:
          summary: "High retry rate for {{ $labels.provider }} provider"
          description: "{{ $labels.provider }} retry rate is {{ $value | humanizePercentage }} (threshold: 20%)"

      - alert: ProviderRetryExhausted
        expr: |
          (
            sum(rate(provider_retry_exhausted_total[5m])) by (provider)
            /
            sum(rate(provider_retry_attempts_total{attempt="1"}[5m])) by (provider)
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          component: provider-retry
        annotations:
          summary: "Provider {{ $labels.provider }} retry exhaustion rate critical"
          description: "{{ $labels.provider }} exhaustion rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      - alert: SlowProviderRetryDuration
        expr: |
          histogram_quantile(0.99, 
            rate(provider_retry_duration_bucket[5m])
          ) > 10
        for: 5m
        labels:
          severity: warning
          component: provider-retry
        annotations:
          summary: "Slow provider retry duration"
          description: "p99 retry duration is {{ $value }}s (threshold: 10s)"
```

---

## FAQ

**Q: Why is Biometric provider configured with `max-attempts: 1` (no retries)?**  
A: Biometric verification requires user interaction (fingerprint, face scan). Retrying automatically would prompt the user multiple times, degrading UX. Failures should be handled at the application layer.

**Q: What happens if a provider succeeds on the 2nd attempt?**  
A: The `ProviderResult` will have `attemptNumber=2` and `retriedSuccess=true`, and metrics `provider.retry.success.total{after_attempts="2"}` will be incremented.

**Q: Can I disable retries for a specific provider in production?**  
A: Yes. Set `max-attempts: 1` in `application-prod.yml`:
```yaml
resilience4j:
  retry:
    instances:
      smsRetry:
        max-attempts: 1  # Disable retries
```

**Q: How do I test retry logic locally?**  
A: Use the `application-local.yml` aggressive retry settings and simulate failures:
```java
// In provider stub
if (Math.random() < 0.5) {
    throw new IOException("Simulated transient failure");
}
```

**Q: What's the maximum total retry duration for SMS?**  
A: With default config: `1s + 2s + 4s = 7s` total (initial wait + 2 retries with exponential backoff).

---

## Related Documentation

- [06-resilience-strategy.md](../architecture/06-resilience-strategy.md) - Overall resilience architecture
- [Story 3.8: Provider Timeout Configuration](../sprint-artifacts/3-8-provider-timeout-configuration.md) - Timeout implementation
- [Story 3.9: Provider Retry Logic](../sprint-artifacts/3-9-provider-retry-logic.md) - Implementation details
- [Epic 4: Resilience & Circuit Breaking](../epics.md#epic-4) - Future fallback/circuit breaker implementation

---

## Support Contacts

| Role | Contact | Scope |
|------|---------|-------|
| **Dev Team** | dev-team@bank.com | Code issues, configuration changes |
| **SRE/Ops** | sre@bank.com | Production incidents, monitoring |
| **Twilio Support** | https://support.twilio.com | SMS/Voice provider issues |
| **Google FCM Support** | https://firebase.google.com/support | Push notification provider issues |

---

**End of Runbook**

