# Technical Debt Management - Signature Router

**Last Updated**: 2025-11-29  
**Story**: 10.12 - TODO Cleanup  
**Status**: ✅ Inventory Complete

---

## Executive Summary

This document tracks and prioritizes technical debt in the Signature Router project. All technical debt items have been cataloged, categorized, and prioritized for systematic resolution.

**Total Items**: 15  
**Critical (P0)**: 0  
**High (P1)**: 3  
**Medium (P2)**: 8  
**Low (P3)**: 4

---

## Priority Matrix

### 🔴 P0 - Critical (Blocks Production or Security)
*None at this time*

### 🟠 P1 - High Priority (Quality/Performance Critical)

1. **ISO 4217 Currency Validation** (TODO-001)
   - **Category**: Security
   - **Effort**: 1-2 hours
   - **Impact**: Medium - Data integrity
   - **Timeline**: Current Sprint

2. **Extract Admin User ID from SecurityContext** (TODO-002, TODO-003)
   - **Category**: Security
   - **Effort**: 2-4 hours (combined)
   - **Impact**: High - Audit compliance
   - **Timeline**: Current Sprint

### 🟡 P2 - Medium Priority (Important Improvements)

3. **Write Audit Log Entries** (TODO-004)
   - **Category**: Feature
   - **Effort**: 4-6 hours
   - **Impact**: Medium - Compliance
   - **Timeline**: Next Sprint

4. **Refactor Degraded Mode to Domain Layer** (TODO-005)
   - **Category**: Refactoring
   - **Effort**: 6-8 hours
   - **Impact**: Medium - Architecture
   - **Timeline**: Next Sprint

5. **Add sendExistingChallenge() Method** (TODO-006)
   - **Category**: Feature
   - **Effort**: 4-6 hours
   - **Impact**: Medium - Feature completeness
   - **Timeline**: Next Sprint

6. **AvroEventMapper Data Completeness** (TODO-007 through TODO-011)
   - **Category**: Feature
   - **Effort**: 6-10 hours (batch)
   - **Impact**: Medium - Observability
   - **Timeline**: Sprint +1

7. **Calculate Actual Recovery Duration** (TODO-012)
   - **Category**: Performance
   - **Effort**: 3-4 hours
   - **Impact**: Medium - Metrics accuracy
   - **Timeline**: Sprint +1

### 🟢 P3 - Low Priority (Nice to Have)

8. **ShedLock for Multi-Instance Coordination** (TODO-013)
   - **Category**: Feature
   - **Effort**: 4-6 hours
   - **Impact**: Low - Scalability
   - **Timeline**: Future (when multi-instance needed)

9. **Keycloak Role Extraction** (TODO-014)
   - **Category**: Feature
   - **Effort**: 3-4 hours
   - **Impact**: Low - Conditional (only if Keycloak adopted)
   - **Timeline**: Future (when Keycloak adopted)

---

## Resolution Timeline

### Current Sprint (Epic 10)
- ✅ TODO-001: ISO 4217 Currency Validation
- ✅ TODO-002: Extract Admin User ID (CircuitBreakerEventListener)
- ✅ TODO-003: Extract Admin User ID (SystemModeController)

### Next Sprint
- TODO-004: Write Audit Log Entries
- TODO-005: Refactor Degraded Mode Handling
- TODO-006: Add sendExistingChallenge() Method

### Sprint +1
- TODO-007 through TODO-011: AvroEventMapper Improvements (batch)
- TODO-012: Calculate Actual Recovery Duration

### Future Sprints
- TODO-013: ShedLock Implementation (when needed)
- TODO-014: Keycloak Support (if adopted)

---

## Estimated Total Effort

- **P1 Items**: 3-6 hours
- **P2 Items**: 23-34 hours
- **P3 Items**: 7-10 hours
- **Total**: 33-50 hours (~1-1.5 sprints)

---

## Categories Breakdown

### Security (3 items)
- ISO 4217 validation
- Admin user ID extraction (2 locations)

### Feature (8 items)
- Audit log entries
- sendExistingChallenge method
- AvroEventMapper data completeness (5 items)
- ShedLock coordination
- Keycloak support

### Refactoring (1 item)
- Degraded mode handling refactor

### Performance (1 item)
- Recovery duration calculation

### Documentation (1 item)
- Keycloak documentation (conditional)

---

## Related Epics

- **Epic 4**: Resilience & Circuit Breakers (TODO-002, TODO-006, TODO-012)
- **Epic 9**: Observability & SLO Tracking (TODO-007 through TODO-011, TODO-012)
- **Epic 10**: Quality Improvements & Technical Debt (All TODOs)

---

## Notes

- All technical debt items are tracked in `tech-debt-inventory.txt`
- No obsolete TODOs found - codebase is clean
- No temporary code found - good code hygiene
- Most items can be batched for efficiency (e.g., AvroEventMapper improvements)
- Security-related items should be prioritized

---

**For detailed information on each TODO, see `tech-debt-inventory.txt`**

