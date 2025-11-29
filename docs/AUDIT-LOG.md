# 📜 AUDIT LOG - IMMUTABLE STORAGE

**Story:** 8.4 - Audit Log - Immutable Storage  
**Epic:** 8 - Security & Compliance  
**Version:** 1.0  
**Last Updated:** 2025-11-29  

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Audit Event Types](#audit-event-types)
4. [Database Schema](#database-schema)
5. [Immutability Guarantees](#immutability-guarantees)
6. [Usage Examples](#usage-examples)
7. [Querying Audit Logs](#querying-audit-logs)
8. [Compliance Mapping](#compliance-mapping)
9. [Retention Policy](#retention-policy)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 **Overview**

The **Audit Log** subsystem provides **immutable, tamper-proof logging** of all security-critical events in the Signature Router & Management System. It is designed to meet **SOC 2 Type II**, **PCI-DSS v4.0**, and **GDPR** compliance requirements.

### **Key Features**

- ✅ **Immutable Storage:** INSERT-only table with PostgreSQL Row-Level Security (RLS)
- ✅ **25+ Event Types:** Signature lifecycle, routing rules, security events, GDPR actions
- ✅ **Async Logging:** Non-blocking audit logging with @Async processing
- ✅ **Rich Context:** User, IP, User-Agent, distributed tracing ID, JSONB changes
- ✅ **365-Day Retention:** Minimum retention period for compliance
- ✅ **Query API:** REST API for auditors (ADMIN, AUDITOR roles)

---

## 🏗️ **Architecture**

### **Hexagonal Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AuditEvent (record)                                   │   │
│  │ - eventType, action, actor, changes, traceId...       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AuditService (port/outbound)                          │   │
│  │ - log(AuditEvent): void                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │ implements
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ JpaAuditServiceImpl                                   │   │
│  │ - @Async, @Transactional(REQUIRES_NEW)                │   │
│  │ - Maps AuditEvent → AuditLogEntity                    │   │
│  │ - Exception handling (never throws)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AuditLogEntity (JPA Entity)                           │   │
│  │ - JSONB changes column                                │   │
│  │ - @PrePersist for created_at                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AuditLogRepository (Spring Data JPA)                  │   │
│  │ - findByEventType(), findByActor(), findWithFilters() │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │ stores to
┌─────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ audit_log TABLE                                       │   │
│  │ - RLS Policies: INSERT only, no UPDATE/DELETE        │   │
│  │ - GIN index on JSONB changes                          │   │
│  │ - Partitioning ready (future: monthly partitions)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔖 **Audit Event Types**

### **Signature Lifecycle (5 events)**

| Event Type | Description | Typical Actor |
|-----------|-------------|---------------|
| `SIGNATURE_CREATED` | New signature request created | USER, ADMIN |
| `SIGNATURE_CHALLENGED` | Challenge sent to customer | SYSTEM |
| `SIGNATURE_COMPLETED` | Signature successfully validated | USER |
| `SIGNATURE_EXPIRED` | Signature request expired (TTL) | SYSTEM |
| `SIGNATURE_ABORTED` | Signature manually aborted by admin | ADMIN, SUPPORT |

### **Routing Rules (5 events)**

| Event Type | Description | Typical Actor |
|-----------|-------------|---------------|
| `ROUTING_RULE_CREATED` | New routing rule created | ADMIN, SUPPORT |
| `ROUTING_RULE_MODIFIED` | Routing rule updated | ADMIN, SUPPORT |
| `ROUTING_RULE_DELETED` | Routing rule soft-deleted | ADMIN |
| `ROUTING_RULE_ENABLED` | Routing rule enabled | ADMIN, SUPPORT |
| `ROUTING_RULE_DISABLED` | Routing rule disabled | ADMIN, SUPPORT |

### **Security Events (5 events)**

| Event Type | Description | Typical Actor |
|-----------|-------------|---------------|
| `ACCESS_DENIED` | HTTP 403 Forbidden (RBAC violation) | ANY |
| `INVALID_JWT_TOKEN` | JWT validation failed | ANONYMOUS |
| `RATE_LIMIT_EXCEEDED` | Rate limit breached | ANY |
| `AUTHENTICATION_FAILED` | Authentication attempt failed | ANONYMOUS |
| `AUTHORIZATION_FAILED` | Authorization check failed | AUTHENTICATED |

### **Provider Management (4 events)**

| Event Type | Description | Typical Actor |
|-----------|-------------|---------------|
| `PROVIDER_CONFIGURATION_CHANGED` | Provider config updated | ADMIN |
| `PROVIDER_DEGRADED_MODE_ACTIVATED` | Provider marked as degraded | SYSTEM |
| `PROVIDER_DEGRADED_MODE_DEACTIVATED` | Provider back to normal | SYSTEM |
| `PROVIDER_CIRCUIT_BREAKER_OPENED` | Circuit breaker opened | SYSTEM |

### **Secrets Management (3 events)**

| Event Type | Description | Typical Actor |
|-----------|-------------|---------------|
| `SECRET_ROTATED` | Vault secret rotated | ADMIN, SYSTEM |
| `SECRET_ACCESS_ATTEMPTED` | Secret access attempt logged | SYSTEM |
| `SECRET_ACCESS_DENIED` | Secret access denied | SYSTEM |

### **GDPR Compliance (4 events)**

| Event Type | Description | Typical Actor |
|-----------|-------------|---------------|
| `CUSTOMER_DATA_EXPORTED` | Customer data export (GDPR Art. 15) | ADMIN, SUPPORT |
| `CUSTOMER_DATA_DELETED` | Customer data deletion (GDPR Art. 17) | ADMIN |
| `CUSTOMER_CONSENT_RECORDED` | Customer consent logged | SYSTEM |
| `CUSTOMER_CONSENT_REVOKED` | Customer consent revoked | USER, ADMIN |

**Total: 26 Event Types**

---

## 🗄️ **Database Schema**

### **Table: `audit_log`**

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,  -- Nullable for security events
  action VARCHAR(20) NOT NULL,  -- CREATE, READ, UPDATE, DELETE, SECURITY_EVENT
  actor VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50),
  changes JSONB,  -- Before/after snapshot
  ip_address VARCHAR(45),  -- IPv6 support
  user_agent TEXT,
  trace_id VARCHAR(36),  -- Distributed tracing correlation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Row-Level Security (RLS) for immutability
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_audit_log ON audit_log
  FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE POLICY prevent_update_audit_log ON audit_log
  FOR UPDATE TO PUBLIC USING (false);

CREATE POLICY prevent_delete_audit_log ON audit_log
  FOR DELETE TO PUBLIC USING (false);

CREATE POLICY select_audit_log ON audit_log
  FOR SELECT TO PUBLIC USING (true);
```

### **Indexes**

```sql
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX idx_audit_log_entity_id ON audit_log(entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_trace_id ON audit_log(trace_id);
CREATE INDEX idx_audit_log_changes_gin ON audit_log USING GIN (changes);
```

---

## 🔒 **Immutability Guarantees**

### **Database Level (PostgreSQL RLS)**

1. **INSERT-ONLY Policy:** Users can only insert new rows, never update or delete existing rows.
2. **RLS Enforcement:** PostgreSQL Row-Level Security policies prevent UPDATE/DELETE operations at the database engine level.
3. **Append-Only Architecture:** Audit logs are never modified or removed (except via automated retention after 365 days).

### **Application Level**

1. **@Transactional(REQUIRES_NEW):** Audit logs persist even if the parent transaction rolls back.
2. **No Update/Delete Methods:** `AuditLogRepository` does not expose `update()` or `delete()` methods in the service layer.
3. **@PrePersist Hook:** The `created_at` timestamp is set automatically and marked `updatable=false` in JPA.

### **Async Processing**

- **@Async:** Audit logging runs in a separate thread pool, preventing blocking of business logic.
- **Error Isolation:** Exceptions in audit logging are caught and logged, never thrown to callers.

---

## 💻 **Usage Examples**

### **1. Log Access Denied Event (Story 8.2)**

```java
// In CustomAccessDeniedHandler
AuditEvent event = AuditEvent.accessDenied(
    username,
    roles,
    request.getRequestURI(),
    request.getMethod(),
    request.getRemoteAddr(),
    request.getHeader("User-Agent"),
    MDC.get("traceId")
);

auditService.log(event);
```

### **2. Log Signature Created (Story 2.1)**

```java
// In StartSignatureUseCaseImpl
AuditEvent event = AuditEvent.signatureCreated(
    signatureRequest.getId(),
    pseudonymizedCustomerId,
    SecurityContextHolder.getContext().getAuthentication().getName(),
    "ROLE_USER",
    request.getRemoteAddr(),
    request.getHeader("User-Agent"),
    MDC.get("traceId")
);

auditService.log(event);
```

### **3. Log Routing Rule Modified**

```java
AuditEvent event = new AuditEvent(
    AuditEventType.ROUTING_RULE_MODIFIED,
    "ROUTING_RULE",
    ruleId,
    AuditAction.UPDATE,
    actor,
    "ROLE_ADMIN",
    Map.of(
        "before", Map.of("enabled", false, "priority", 10),
        "after", Map.of("enabled", true, "priority", 5)
    ),
    ipAddress,
    userAgent,
    traceId
);

auditService.log(event);
```

---

## 🔍 **Querying Audit Logs**

### **Repository Methods**

```java
// Find by event type
Page<AuditLogEntity> accessDeniedEvents = auditLogRepository.findByEventType(
    AuditEventType.ACCESS_DENIED,
    PageRequest.of(0, 20)
);

// Find by actor
Page<AuditLogEntity> adminActions = auditLogRepository.findByActor(
    "admin@bank.com",
    PageRequest.of(0, 50)
);

// Find within date range
Page<AuditLogEntity> recentLogs = auditLogRepository.findByCreatedAtBetween(
    Instant.now().minus(7, ChronoUnit.DAYS),
    Instant.now(),
    PageRequest.of(0, 100)
);

// Complex query with multiple filters
Page<AuditLogEntity> filteredLogs = auditLogRepository.findWithFilters(
    AuditEventType.SIGNATURE_CREATED,
    "SIGNATURE_REQUEST",
    "user@bank.com",
    startDate,
    endDate,
    PageRequest.of(0, 20, Sort.by("createdAt").descending())
);
```

### **REST API (Future: Story 8.4 AC5)**

```http
GET /api/v1/admin/audit-logs?eventType=ACCESS_DENIED&actor=user@bank.com&from=2025-11-01T00:00:00Z&to=2025-11-30T23:59:59Z&page=0&size=20
Authorization: Bearer {JWT_TOKEN}
```

**Response:**

```json
{
  "content": [
    {
      "id": "01HFXYZ...",
      "eventType": "ACCESS_DENIED",
      "entityType": "HTTP_REQUEST",
      "actor": "user@bank.com",
      "actorRole": "ROLE_USER",
      "changes": {
        "path": "/api/v1/admin/rules",
        "method": "POST"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "traceId": "trace-123",
      "createdAt": "2025-11-29T10:30:00Z"
    }
  ],
  "totalElements": 142,
  "totalPages": 8,
  "size": 20,
  "number": 0
}
```

---

## 📜 **Compliance Mapping**

### **SOC 2 Type II**

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| **CC7.2** | Monitor system components | 26 event types covering all critical operations |
| **CC7.3** | Evaluate system changes | `ROUTING_RULE_MODIFIED`, `PROVIDER_CONFIGURATION_CHANGED` events |

### **PCI-DSS v4.0**

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
| **Req 10.1** | Log all access to system components | All HTTP requests logged via `CustomAccessDeniedHandler` |
| **Req 10.2** | Automated audit trails | Async, immutable logging with PostgreSQL RLS |
| **Req 10.3** | Record specific details | User, timestamp, event type, IP, changes (JSONB) |
| **Req 10.4** | Use time-synchronization | `created_at TIMESTAMP WITH TIME ZONE` |
| **Req 10.5** | Secure audit trails | INSERT-only RLS policies prevent tampering |
| **Req 10.7** | Retain for at least one year | 365-day retention policy (partitioning) |

### **GDPR**

| Article | Requirement | Implementation |
|---------|-------------|----------------|
| **Art. 30** | Records of processing activities | `CUSTOMER_DATA_EXPORTED`, `CUSTOMER_DATA_DELETED` events |
| **Art. 32** | Security of processing | Immutable audit trail for security events |

---

## ⏰ **Retention Policy**

### **Minimum Retention: 365 Days**

- **Compliance:** PCI-DSS Req 10.7, SOC 2 CC7.2
- **Implementation:** PostgreSQL table partitioning (monthly partitions)
- **Cleanup:** Automated script to drop partitions older than 365 days

### **Future: Table Partitioning (Story 8.4 AC6)**

```sql
-- Example: Monthly partitions
CREATE TABLE audit_log_2025_11 PARTITION OF audit_log
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Automated cleanup (cron job)
DROP TABLE IF EXISTS audit_log_2024_11;
```

---

## 🛠️ **Troubleshooting**

### **Audit Logs Not Appearing**

**Symptom:** `auditService.log()` called but no rows in `audit_log` table.

**Possible Causes:**
1. **Async processing delay:** Audit logging is async (@Async). Wait 1-2 seconds.
2. **Exception in audit service:** Check logs for `❌ Failed to log audit event`.
3. **Database connection issue:** Verify PostgreSQL is running.

**Solution:**
```bash
# Check audit service logs
tail -f logs/signature-router.log | grep "Audit event"

# Query database directly
psql -d signature_router -c "SELECT COUNT(*) FROM audit_log;"
```

### **Immutability Tests Failing**

**Symptom:** Integration tests for immutability fail with "Permission denied" or "UPDATE not allowed".

**Possible Causes:**
1. **RLS policies not applied:** Liquibase migration not run.
2. **Using wrong database user:** Some users bypass RLS (e.g., superusers).

**Solution:**
```sql
-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'audit_log';

-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'audit_log';
```

---

## 📚 **References**

- [Story 8.4 Technical Specification](../docs/sprint-artifacts/tech-spec-epic-8.md#story-84-audit-log---immutable-storage)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PCI-DSS Requirement 10](https://www.pcisecuritystandards.org/)
- [SOC 2 CC7 Criteria](https://www.aicpa.org/)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-29  
**Status:** ✅ Implemented (Story 8.4)

