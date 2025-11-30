# Story 8.2: RBAC - Role-Based Access Control - Progress Report

**Status:** 🚧 **IN PROGRESS** (50% Complete)  
**Started:** 2025-11-29  
**Epic:** Epic 8 - Security & Compliance  
**Story Points:** 5  

---

## ✅ Completed (50%)

### 1. Role Enum Created
✅ **File:** `src/main/java/com/bank/signature/domain/security/Role.java`

**Features:**
- 4 banking roles: ADMIN, SUPPORT, AUDITOR, USER
- Detailed permission matrix in JavaDoc
- Helper methods: `getAuthority()`, `hasPrivilegeLevel()`, `fromString()`
- Comprehensive documentation with compliance mapping (PCI-DSS, GDPR, SOC 2)

**Role Hierarchy:**
1. **ADMIN** - Full system access
2. **SUPPORT** - Operational support (create requests, manage rules)
3. **AUDITOR** - Read-only compliance access
4. **USER** - Basic customer-facing access

### 2. Method Security Enabled
✅ **Confirmed:** `@EnableMethodSecurity` already enabled in `SecurityConfig.java` (Story 8.1)

### 3. AdminRuleController - RBAC Implemented
✅ **File:** `src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/AdminRuleController.java`

**Access Control Matrix:**
| Method | Endpoint | ADMIN | SUPPORT | AUDITOR | USER |
|--------|----------|-------|---------|---------|------|
| POST | `/api/v1/admin/rules` | ✅ | ✅ | ❌ | ❌ |
| GET | `/api/v1/admin/rules` | ✅ | ✅ | ✅ (read) | ❌ |
| GET | `/api/v1/admin/rules/{id}` | ✅ | ✅ | ✅ (read) | ❌ |
| PUT | `/api/v1/admin/rules/{id}` | ✅ | ✅ | ❌ | ❌ |
| DELETE | `/api/v1/admin/rules/{id}` | ✅ | ❌ | ❌ | ❌ |

**Annotations Applied:**
```java
@PostMapping
@PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
public ResponseEntity<RoutingRuleResponseDto> createRule(...) { ... }

@GetMapping
@PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT', 'AUDITOR')")
public ResponseEntity<List<RoutingRuleResponseDto>> listRules() { ... }

@GetMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT', 'AUDITOR')")
public ResponseEntity<RoutingRuleResponseDto> getRule(...) { ... }

@PutMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
public ResponseEntity<RoutingRuleResponseDto> updateRule(...) { ... }

@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Void> deleteRule(...) { ... }
```

---

## 🚧 Pending (50%)

### 4. Add @PreAuthorize to Remaining Controllers

**Controllers Requiring RBAC:**

1. **SignatureController** (`/api/v1/signature`)
   - POST `/create` → ADMIN, SUPPORT, USER (own customer_id only)
   - GET `/{id}` → ADMIN, SUPPORT, USER (own only)
   - POST `/{id}/complete` → USER (own only)
   - POST `/{id}/abort` → ADMIN, SUPPORT

2. **AdminSignatureController** (`/api/v1/admin/signature`)
   - POST `/abort` → ADMIN, SUPPORT

3. **SecurityAuditController** (`/api/v1/audit`)
   - GET `/logs` → ADMIN, AUDITOR (read-only)
   - GET `/access-denied` → ADMIN, AUDITOR

4. **ProviderHealthController** (`/api/v1/admin/providers`)
   - GET `/health` → ADMIN, SUPPORT, AUDITOR (read-only)
   - POST `/circuit-breaker/reset` → ADMIN only

5. **SystemModeController** (`/api/v1/admin/system`)
   - GET `/degraded-mode` → ADMIN, SUPPORT, AUDITOR
   - POST `/degraded-mode/enable` → ADMIN only
   - POST `/degraded-mode/disable` → ADMIN only

6. **HealthController** (`/api/v1/health`)
   - GET `/` → Public (no auth required)

7. **RoutingRuleValidationController** (`/api/v1/routing/validate`)
   - POST `/validate-spel` → ADMIN, SUPPORT

---

### 5. Create AccessDeniedHandler

**File to Create:** `src/main/java/com/bank/signature/infrastructure/security/CustomAccessDeniedHandler.java`

**Purpose:**
- Log all access denied events (HTTP 403)
- Include: username, role, attempted endpoint, timestamp
- Send to audit log service for compliance

**Implementation:**
```java
@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
    
    private final AuditLogger auditLogger;
    
    @Override
    public void handle(HttpServletRequest request, 
                       HttpServletResponse response,
                       AccessDeniedException ex) throws IOException {
        
        String username = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        String roles = extractRoles();
        String endpoint = request.getRequestURI();
        
        auditLogger.logAccessDenied(username, roles, endpoint, ex.getMessage());
        
        response.sendError(HttpServletResponse.SC_FORBIDDEN, 
            "Access Denied: Insufficient privileges");
    }
}
```

---

### 6. Create RBAC Integration Tests

**File to Create:** `src/test/java/com/bank/signature/infrastructure/security/RbacIntegrationTest.java`

**Test Coverage:**
- ✅ ADMIN can create routing rule
- ✅ SUPPORT can create routing rule
- ✅ AUDITOR cannot create routing rule (403)
- ✅ USER cannot create routing rule (403)
- ✅ ADMIN can delete routing rule
- ✅ SUPPORT cannot delete routing rule (403)
- ✅ AUDITOR can list routing rules (read-only)
- ✅ USER cannot access admin endpoints (403)
- ✅ Access denied events are logged
- ✅ USER can only access own signature requests

**Example Test:**
```java
@Test
@DisplayName("ADMIN can delete routing rule")
void adminCanDeleteRule() throws Exception {
    mockMvc.perform(delete("/api/v1/admin/rules/{id}", ruleId)
        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
        .andExpect(status().isNoContent());
}

@Test
@DisplayName("SUPPORT cannot delete routing rule - 403 Forbidden")
void supportCannotDeleteRule() throws Exception {
    mockMvc.perform(delete("/api/v1/admin/rules/{id}", ruleId)
        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SUPPORT"))))
        .andExpect(status().isForbidden());
}
```

---

### 7. Create RBAC Documentation

**File to Create:** `docs/security/RBAC.md`

**Content:**
- Role descriptions and responsibilities
- Permission matrix (detailed)
- How to assign roles in Keycloak
- How to test RBAC locally
- Compliance mapping (PCI-DSS Req 7, GDPR Art. 32, SOC 2 CC6.3)
- Troubleshooting access denied scenarios

---

## 📊 Acceptance Criteria Status

| ID | Acceptance Criteria | Status |
|----|---------------------|--------|
| AC1 | 4 roles defined (ADMIN, AUDITOR, SUPPORT, USER) | ✅ Done |
| AC2 | Method-level security in controllers | 🚧 50% (1/7 controllers) |
| AC3 | Audit log of authorization decisions | ⏳ Pending |
| AC4 | Integration tests for RBAC | ⏳ Pending |

**Overall Completion:** 50%

---

## 🎯 Next Steps

### Option A: Continue Implementation (YOLO Mode)
1. Add `@PreAuthorize` to remaining 6 controllers (30 min)
2. Create `CustomAccessDeniedHandler` (15 min)
3. Create RBAC integration tests (45 min)
4. Create RBAC.md documentation (30 min)
5. Update sprint-status.yaml to `review` (5 min)

**Total Estimated Time:** 2 hours

### Option B: Review & Test Current Progress
1. Test AdminRuleController RBAC manually with Keycloak
2. Verify Role enum is working correctly
3. Continue with remaining controllers after validation

---

## 🔧 Manual Testing Guide

### 1. Start Keycloak
```bash
docker run -d --name keycloak \
  -p 8180:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:23.0 start-dev
```

### 2. Configure Realm
1. Access: `http://localhost:8180`
2. Create realm: `signature-router`
3. Create client: `signature-router-client`
4. Create roles: `ADMIN`, `SUPPORT`, `AUDITOR`, `USER`
5. Create test users:
   - `admin-user` → assign `ADMIN` role
   - `support-user` → assign `SUPPORT` role
   - `auditor-user` → assign `AUDITOR` role
   - `basic-user` → assign `USER` role

### 3. Get Tokens
```bash
# ADMIN token
./keycloak/get-token.sh admin-user admin-pass signature-router-client \
  http://localhost:8180/realms/signature-router

# SUPPORT token
./keycloak/get-token.sh support-user support-pass signature-router-client \
  http://localhost:8180/realms/signature-router
```

### 4. Test RBAC
```bash
# Test: ADMIN can delete rule
curl -X DELETE "http://localhost:8080/api/v1/admin/rules/{id}" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: HTTP 204

# Test: SUPPORT cannot delete rule
curl -X DELETE "http://localhost:8080/api/v1/admin/rules/{id}" \
  -H "Authorization: Bearer $SUPPORT_TOKEN"
# Expected: HTTP 403 Forbidden

# Test: AUDITOR can list rules
curl -X GET "http://localhost:8080/api/v1/admin/rules" \
  -H "Authorization: Bearer $AUDITOR_TOKEN"
# Expected: HTTP 200
```

---

## 📝 Notes

- **Method Security** (`@EnableMethodSecurity`) is already enabled from Story 8.1
- **Role extraction** from JWT is handled by `KeycloakJwtAuthenticationConverter` (Story 8.1)
- **HTTP 403 responses** are automatic when `@PreAuthorize` fails
- **Access denied logging** requires custom `AccessDeniedHandler`

---

**Last Updated:** 2025-11-29  
**Progress:** 50% (3/7 tasks completed)  
**Next Milestone:** Complete remaining 6 controllers + tests + documentation

