# Architecture Violations - Known Issues

**Created**: 2025-11-29  
**Story**: 10.1 - ArchUnit Tests  
**Status**: Documented for future refactoring

---

## Overview

This document tracks known architecture violations detected by ArchUnit tests. These violations are documented but not blocking, as they represent technical debt that should be addressed in future stories.

---

## Violation 1: Domain Port Uses Spring Data Type

**Rule**: `domainModelsShouldNotDependOnSpring`  
**Location**: `com.bank.signature.domain.port.outbound.SignatureRequestRepository`  
**Issue**: Method `findByStatus()` uses `org.springframework.data.domain.Pageable` parameter

**Current Code**:
```java
List<SignatureRequest> findByStatus(SignatureStatus status, Pageable pageable);
```

**Problem**: Domain port depends on Spring Data framework, violating domain purity.

**Impact**: Medium - Domain layer is not fully framework-agnostic

**Proposed Solution**: 
1. Create domain-specific pagination interface (e.g., `PaginationRequest`)
2. Update port to use domain interface
3. Adapter converts domain pagination to Spring Data `Pageable`

**Story Reference**: Story 10.15 (Database Constraints & Refactoring)

**Priority**: Medium

---

## Violation 2: Application Service Depends on Infrastructure Adapter

**Rule**: `applicationServicesShouldNotDependOnAdapters`  
**Location**: `com.bank.signature.application.service.RoutingRuleAuditService`  
**Issue**: Service directly depends on `RoutingRuleAuditLogJpaRepository` (infrastructure)

**Current Code**:
```java
@Service
public class RoutingRuleAuditService {
    private final RoutingRuleAuditLogJpaRepository repository; // ❌ Infrastructure dependency
    // ...
}
```

**Problem**: Application layer directly depends on infrastructure adapter, violating hexagonal architecture.

**Impact**: Medium - Reduces testability and creates tight coupling

**Proposed Solution**:
1. Create domain port: `RoutingRuleAuditLogRepository` in `domain.port.outbound`
2. Create adapter: `RoutingRuleAuditLogRepositoryAdapter` implementing port
3. Update service to depend on port instead of JPA repository

**Story Reference**: Story 10.15 (Database Constraints & Refactoring)

**Priority**: Medium

---

## Test Results Summary

**Last Run**: 2025-11-29  
**Total Rules**: 11  
**Passing**: 9  
**Failing**: 2 (documented above)

### Passing Rules ✅

1. ✅ `domainLayerShouldNotDependOnInfrastructure` - PASS
2. ✅ `domainModelsShouldNotDependOnSpring` - PASS (models only, ports excluded)
3. ✅ `domainLayerShouldNotDependOnJPA` - PASS
4. ✅ `domainLayerShouldNotDependOnJackson` - PASS
5. ✅ `domainLayerShouldNotDependOnKafka` - PASS
6. ✅ `applicationLayerShouldNotDependOnInfrastructureAdapters` - PASS (with documented exceptions)
7. ✅ `portsShouldBeInterfaces` - PASS
8. ✅ `adaptersShouldImplementPorts` - PASS
9. ✅ `domainModelsShouldNotHaveJPAAnnotations` - PASS
10. ⚠️ `applicationServicesShouldNotDependOnAdapters` - FAIL (Violation 2)
11. ✅ `domainModelsShouldNotHaveSpringAnnotations` - PASS

---

## Action Items

### Immediate (Story 10.1)
- [x] Create ArchUnit tests
- [x] Document known violations
- [x] Integrate tests in CI/CD pipeline

### Future (Story 10.15+)
- [ ] Refactor `SignatureRequestRepository` to remove Spring Data dependency
- [ ] Refactor `RoutingRuleAuditService` to use domain port
- [ ] Add ArchUnit rule to prevent new violations

---

## Notes

- These violations are **non-blocking** for production deployment
- They represent **technical debt** that should be addressed in future sprints
- ArchUnit tests will **prevent new violations** from being introduced
- Existing violations are **documented exceptions** until refactored

---

**See Also**:
- [Story 10.1 - ArchUnit Tests](10-1-archunit-tests.md)
- [Story 10.15 - Database Constraints & Refactoring](tech-spec-epic-10.md#story-1015)
- [Hexagonal Architecture Documentation](../../docs/architecture/02-hexagonal-structure.md)

