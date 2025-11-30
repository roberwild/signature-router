# Suggested GitHub Issues for Technical Debt

**Generated**: 2025-11-29  
**Story**: 10.12 - TODO Cleanup  
**Purpose**: Template for creating GitHub issues for valid TODOs

---

## 🔴 P0 - Critical Issues

*None*

---

## 🟠 P1 - High Priority Issues

### Issue #1: Validate ISO 4217 Currency Codes in Money Value Object

**Labels**: `security`, `bug`, `epic-10`, `priority-high`  
**Priority**: High (P1)  
**Category**: Security

**Description**:
Currently, the `Money` value object only validates that currency is not null/empty, but doesn't validate against ISO 4217 standard. This could allow invalid currency codes to be persisted.

**Location**: `src/main/java/com/bank/signature/domain/model/valueobject/Money.java:33`

**Current Code**:
```java
// TODO: Validate ISO 4217 currency code (EUR, USD, GBP, etc.)
```

**Acceptance Criteria**:
- [ ] Add ISO 4217 currency code validation
- [ ] Throw `IllegalArgumentException` for invalid codes
- [ ] Add unit tests for valid/invalid currency codes
- [ ] Update documentation

**Effort**: 1-2 hours  
**Related**: Epic 10 - Story 10.15 (Database Constraints)

---

### Issue #2: Extract Admin User ID from SecurityContext for Audit Trail

**Labels**: `security`, `feature`, `epic-10`, `priority-high`  
**Priority**: High (P1)  
**Category**: Security

**Description**:
Multiple locations use hardcoded "admin" or "ADMIN" strings instead of extracting the actual authenticated user ID from SecurityContext. This creates incomplete audit trails and security compliance issues.

**Locations**:
- `src/main/java/com/bank/signature/infrastructure/resilience/CircuitBreakerEventListener.java:128`
- `src/main/java/com/bank/signature/application/controller/SystemModeController.java:134`

**Current Code**:
```java
"admin",  // TODO: Extract actual admin user ID from SecurityContext
// TODO Story 4.3: Capture authenticated user identity for audit log
String adminUser = "ADMIN";  // Replace with SecurityContextHolder.getContext().getAuthentication().getName()
```

**Acceptance Criteria**:
- [ ] Extract user ID from `SecurityContextHolder.getContext().getAuthentication()`
- [ ] Handle cases where authentication is not available (fallback to "SYSTEM")
- [ ] Update CircuitBreakerEventListener
- [ ] Update SystemModeController
- [ ] Add unit tests
- [ ] Update audit log entries

**Effort**: 2-4 hours  
**Related**: Epic 10 - Story 10.11 (Exception Handling)

---

## 🟡 P2 - Medium Priority Issues

### Issue #3: Write Structured Audit Log Entries for System Mode Changes

**Labels**: `feature`, `epic-10`, `priority-medium`  
**Priority**: Medium (P2)  
**Category**: Feature

**Description**:
System mode changes are currently only logged via SLF4J. Should write to audit log table for compliance and traceability.

**Location**: `src/main/java/com/bank/signature/application/controller/SystemModeController.java:149, 156, 167`

**Acceptance Criteria**:
- [ ] Create audit log entries for DEGRADED mode changes
- [ ] Create audit log entries for NORMAL mode changes
- [ ] Create audit log entries for MAINTENANCE mode changes
- [ ] Include user ID, timestamp, reason, previous state
- [ ] Add integration tests

**Effort**: 4-6 hours  
**Related**: Issue #2 (depends on user ID extraction)

---

### Issue #4: Refactor Degraded Mode Handling to Domain/Use Case Layer

**Labels**: `refactoring`, `architecture`, `epic-10`, `priority-medium`  
**Priority**: Medium (P2)  
**Category**: Refactoring

**Description**:
Currently degraded mode handling is done in the REST controller (infrastructure layer). Should be moved to domain/use case layer for better separation of concerns and adherence to hexagonal architecture.

**Location**: `src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/SignatureController.java:186`

**Current Code**:
```java
// TODO Story 4.3: Refactor to handle degraded mode in domain/use case layer
```

**Acceptance Criteria**:
- [ ] Move degraded mode logic to use case layer
- [ ] Update domain model if needed
- [ ] Update controller to delegate to use case
- [ ] Add unit tests for use case
- [ ] Update integration tests

**Effort**: 6-8 hours  
**Related**: Epic 4 - Resilience

---

### Issue #5: Add ChallengeService.sendExistingChallenge() Method

**Labels**: `feature`, `epic-4`, `priority-medium`  
**Priority**: Medium (P2)  
**Category**: Feature

**Description**:
Recovery service needs to resend existing challenges, but currently only has `createChallenge()` which creates new ones. This can result in duplicate challenges during recovery scenarios.

**Location**: `src/main/java/com/bank/signature/infrastructure/resilience/DegradedModeRecoveryService.java:142`

**Current Code**:
```java
// TODO Story 4.3: Add ChallengeService.sendExistingChallenge() method
// For MVP, we'll create a new challenge (may result in duplicate)
```

**Acceptance Criteria**:
- [ ] Add `sendExistingChallenge()` method to ChallengeService
- [ ] Method should resend existing challenge without creating new one
- [ ] Update DegradedModeRecoveryService to use new method
- [ ] Add unit tests
- [ ] Add integration tests

**Effort**: 4-6 hours  
**Related**: Epic 4 - Resilience

---

### Issue #6: Complete AvroEventMapper Data Mapping

**Labels**: `feature`, `epic-9`, `priority-medium`  
**Priority**: Medium (P2)  
**Category**: Feature

**Description**:
AvroEventMapper uses placeholder values instead of extracting actual data from aggregates. This affects event completeness and analytics capabilities.

**Locations**: `src/main/java/com/bank/signature/infrastructure/adapter/outbound/event/AvroEventMapper.java`
- Line 60: `setUserId("pseudonymized-user")`
- Line 63: `setProvider("UNKNOWN")`
- Line 65: `setVerifiedCode("hashed")`
- Line 68: `setTimeTakenMs(0L)`
- Line 92: `setAbortedBy("system")`

**Acceptance Criteria**:
- [ ] Extract user ID from aggregate
- [ ] Extract provider name from aggregate
- [ ] Extract verified code hash from aggregate
- [ ] Calculate time taken from timestamps
- [ ] Extract aborted by from domain event
- [ ] Add unit tests for each mapping
- [ ] Update integration tests

**Effort**: 6-10 hours (can be done as batch)  
**Related**: Epic 9 - Observability

---

### Issue #7: Calculate Actual Circuit Breaker Recovery Duration

**Labels**: `performance`, `epic-9`, `priority-medium`  
**Priority**: Medium (P2)  
**Category**: Performance

**Description**:
Circuit breaker recovery duration should be calculated from actual state transition timestamps, not a hardcoded placeholder value.

**Location**: `src/main/java/com/bank/signature/infrastructure/resilience/CircuitBreakerEventListener.java:223`

**Current Code**:
```java
// TODO: Calculate actual recovery duration (time spent in OPEN/HALF_OPEN states)
Duration recoveryDuration = Duration.ofSeconds(35);  // Placeholder
```

**Acceptance Criteria**:
- [ ] Track state transition timestamps
- [ ] Calculate duration from OPEN to HALF_OPEN to CLOSED
- [ ] Update metrics to use calculated duration
- [ ] Add unit tests
- [ ] Update documentation

**Effort**: 3-4 hours  
**Related**: Epic 9 - Observability

---

## 🟢 P3 - Low Priority Issues

### Issue #8: Implement ShedLock for Multi-Instance Scheduler Coordination

**Labels**: `feature`, `scalability`, `epic-4`, `priority-low`  
**Priority**: Low (P3)  
**Category**: Feature

**Description**:
Scheduler currently assumes single instance. Should use ShedLock for distributed lock coordination when running multiple instances.

**Location**: `src/main/java/com/bank/signature/infrastructure/scheduler/ChallengeExpirationScheduler.java:46`

**Current Code**:
```java
*   <li>TODO (Epic 4): Use ShedLock for multi-instance coordination</li>
*   <li>For now: assumes single instance or optimistic locking</li>
```

**Acceptance Criteria**:
- [ ] Add ShedLock dependency
- [ ] Configure ShedLock for scheduler
- [ ] Add database table for lock coordination
- [ ] Test with multiple instances
- [ ] Update documentation

**Effort**: 4-6 hours  
**Related**: Epic 4 - Resilience  
**Note**: Only needed when multi-instance deployment is required

---

### Issue #9: Implement Keycloak Role Extraction Support

**Labels**: `feature`, `security`, `priority-low`  
**Priority**: Low (P3)  
**Category**: Feature

**Description**:
Currently only supports simple JWT role extraction. Keycloak support would be needed if Keycloak is used as identity provider.

**Location**: `src/main/java/com/bank/signature/infrastructure/config/security/JwtAuthenticationConverter.java:23`

**Current Code**:
```java
*   <li>Keycloak: "realm_access.roles" (nested claim path) - TODO: implement if needed</li>
```

**Acceptance Criteria**:
- [ ] Add Keycloak role extraction logic
- [ ] Support nested claim path "realm_access.roles"
- [ ] Add configuration option
- [ ] Add unit tests
- [ ] Update documentation

**Effort**: 3-4 hours  
**Note**: Only implement if Keycloak adoption is planned

---

## Summary

**Total Issues**: 9  
**P1 (High)**: 2  
**P2 (Medium)**: 5  
**P3 (Low)**: 2

**Estimated Total Effort**: 33-50 hours

---

**Note**: These are suggested GitHub issues. Create them manually in your GitHub repository with appropriate labels and assignees.

