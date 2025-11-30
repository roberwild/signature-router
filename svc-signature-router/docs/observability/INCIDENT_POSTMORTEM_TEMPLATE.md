# Incident Postmortem Template

**Use this template to document incidents that impacted SLO compliance.**

---

## Incident Metadata

| Field | Value |
|-------|-------|
| **Incident ID** | INC-YYYY-NNN (e.g., INC-2025-001) |
| **Date** | YYYY-MM-DD |
| **Severity** | Critical / High / Medium / Low |
| **Duration** | XX minutes/hours |
| **Status** | Resolved / Investigating / Mitigated |
| **Primary On-Call** | Engineer Name |
| **Incident Commander** | Manager Name |

---

## Executive Summary

**Brief description of the incident (2-3 sentences):**

Example:
> On 2025-11-29 at 10:00 UTC, the Signature Router API experienced elevated error rates (15% 5xx errors) for 30 minutes due to a database connection pool exhaustion. This incident consumed 5% of our monthly error budget and violated our 99.9% availability SLO.

---

## SLO Impact

| Metric | Value |
|--------|-------|
| **Availability SLO Target** | 99.9% |
| **Actual Availability During Incident** | XX.X% |
| **Error Budget Consumed** | X.XX% (of 0.1% monthly budget) |
| **Error Budget Remaining** | XX% |
| **SLO Status After Incident** | COMPLIANT / AT_RISK / VIOLATED |
| **Performance SLO Impact** | P99 latency: XXXms (target <300ms) |

**Error Budget Calculation:**
```
Incident duration: 30 minutes
Monthly downtime budget: 43 minutes (0.1% of 30 days)
Budget consumed by this incident: 30/43 = 69.8%
```

---

## Timeline (UTC)

| Time | Event | Actor |
|------|-------|-------|
| 10:00 | 🔥 Incident begins: High 5xx error rate detected | Alertmanager |
| 10:02 | 🔔 Alert fired: `SLOAvailabilityBurnRateCritical` | Prometheus |
| 10:03 | 👤 On-call engineer paged via PagerDuty | @john.doe |
| 10:05 | 🔍 Investigation started: Checking logs, metrics | @john.doe |
| 10:10 | 🎯 Root cause identified: DB connection pool exhausted | @john.doe |
| 10:15 | ⚙️ Mitigation applied: Restarted app, increased pool size | @john.doe |
| 10:20 | ✅ Error rate normalized, services healthy | System |
| 10:30 | ✅ Incident resolved, monitoring continues | @john.doe |
| 11:00 | 📋 Postmortem scheduled for 2025-11-30 | @jane.manager |

---

## Root Cause Analysis

### What Happened?

**Detailed technical explanation:**

Example:
> A gradual leak in database connections caused the HikariCP connection pool to reach its maximum size (10 connections). New requests were blocked waiting for available connections, causing timeouts and 5xx errors.  The leak was introduced in release v1.2.3 by a bug in SignatureRequestRepository where connections were not properly closed in error paths.

### Why Did It Happen?

**Root cause (5 Whys analysis):**

1. **Why did requests fail?** → Database connections were not available
2. **Why were connections not available?** → Connection pool exhausted
3. **Why was the pool exhausted?** → Connections were leaking
4. **Why were connections leaking?** → Try-catch block didn't properly close connections
5. **Why wasn't this caught in testing?** → Missing integration test for error paths

**Contributing Factors:**
- Code review missed the connection leak
- Integration tests didn't cover error paths
- No alerting on pending connection pool metrics
- Connection pool size (10) was too small for production load

---

## Impact Assessment

### User Impact

| Metric | Value |
|--------|-------|
| **Affected Users** | ~1,500 customers |
| **Failed Requests** | 4,200 (out of 28,000 total) |
| **Error Rate** | 15% |
| **User-Reported Incidents** | 23 support tickets |
| **Customer Satisfaction Impact** | Estimated -5 NPS points |

### Business Impact

| Metric | Value |
|--------|-------|
| **Revenue Impact** | $2,500 (estimated failed transactions) |
| **SLA Penalty Risk** | Low (within SLO tolerance) |
| **Regulatory Impact** | None (incident < 1 hour) |
| **Reputational Impact** | Low (resolved quickly) |

### Technical Impact

| Metric | Value |
|--------|-------|
| **Services Affected** | Signature Router API, Admin Portal |
| **Data Loss** | None |
| **Security Impact** | None |
| **Error Budget Consumed** | 69.8% of monthly budget |

---

## Mitigation Actions (During Incident)

**What was done to stop the bleeding?**

1. ✅ **10:15** - Restarted application to clear leaked connections
2. ✅ **10:16** - Increased HikariCP pool size from 10 → 20 connections
3. ✅ **10:18** - Deployed hotfix with connection leak fix
4. ✅ **10:20** - Verified error rate normalized (<0.1%)

---

## Corrective Actions (Prevent Recurrence)

| Action Item | Owner | Priority | Due Date | Status |
|-------------|-------|----------|----------|--------|
| Fix connection leak bug (close in error path) | @john.doe | P0 | 2025-11-29 | ✅ Done |
| Add integration test for connection leak scenarios | @john.doe | P0 | 2025-11-30 | 🔄 In Progress |
| Add Prometheus alert for pending connections >5 | @devops-team | P1 | 2025-12-01 | 📝 Planned |
| Increase HikariCP pool size to 30 in production | @devops-team | P1 | 2025-12-01 | 📝 Planned |
| Add connection pool metrics to Grafana dashboard | @devops-team | P2 | 2025-12-05 | 📝 Planned |
| Improve code review checklist (resource management) | @eng-manager | P2 | 2025-12-10 | 📝 Planned |

---

## Lessons Learned

### What Went Well? ✅

- Alerting fired correctly (Prometheus + Alertmanager)
- On-call engineer responded within 3 minutes
- Root cause identified quickly (10 minutes)
- Incident resolved within 30 minutes (MTTR target: 30 min)
- Communication with stakeholders was clear

### What Could Be Improved? ⚠️

- **Detection:** Connection pool pending metric should have alerted earlier
- **Testing:** Integration tests missed error path scenarios
- **Code Review:** Connection leak was not caught during review
- **Capacity:** Connection pool size (10) was undersized for production
- **Documentation:** Runbook for DB connection issues was incomplete

### Surprises / Unexpected Behavior? ❓

- Connection pool exhausted much faster than expected under load
- No automatic recovery mechanism for connection leaks

---

## Follow-Up

### Postmortem Review Meeting

- **Date:** 2025-11-30 at 10:00 UTC
- **Attendees:** Engineering team, SRE team, Engineering Manager
- **Agenda:**
  1. Review timeline and root cause
  2. Discuss corrective actions
  3. Update runbooks
  4. Assign action items

### Related Incidents

- **INC-2025-002**: Similar connection leak (2 weeks ago, minor impact)
- **INC-2024-089**: Database timeout issues (different root cause)

### External References

- **Grafana Dashboard:** http://localhost:3000/d/infrastructure
- **Prometheus Alerts:** http://localhost:9093
- **Jira Ticket:** JIRA-12345
- **GitHub PR:** https://github.com/org/repo/pull/678 (hotfix)

---

## Appendix

### Relevant Logs

```
2025-11-29T10:05:23Z ERROR [SignatureRequestService] Failed to create signature request: 
    org.springframework.dao.DataAccessResourceFailureException: 
    Unable to acquire JDBC Connection
    
2025-11-29T10:05:23Z WARN  [HikariPool] HikariPool-1 - Connection pending timeout 
    (current: 10, max: 10, pending: 25)
```

### Relevant Metrics

```promql
# Connection pool pending connections
hikaricp_connections_pending{pool="HikariPool-1"} = 25

# Error rate during incident
rate(http_server_requests_seconds_count{status=~"5.."}[5m]) = 0.15 (15%)
```

### Code Changes (Hotfix)

```java
// BEFORE (bug):
try {
    return repository.save(request);
} catch (Exception e) {
    log.error("Error saving request", e);
    return null; // Connection not closed!
}

// AFTER (fix):
try {
    return repository.save(request);
} catch (Exception e) {
    log.error("Error saving request", e);
    throw e; // Re-throw to properly close connection
}
```

---

**Postmortem Author:** @john.doe  
**Reviewed By:** @jane.manager  
**Date:** 2025-11-30  
**Status:** Approved ✅

---

*Template Version: 1.0 (Story 9.6)*  
*Last Updated: 2025-11-29*

