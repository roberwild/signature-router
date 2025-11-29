# Epic 8: Security & Compliance - Technical Specification

**Epic ID:** Epic 8  
**Epic Name:** Security & Compliance  
**Date Created:** 2025-11-29  
**Author:** BMAD Architect Agent  
**Status:** Ready for Implementation  
**Version:** 1.0  

---

## Executive Summary

Epic 8 implementa las medidas de seguridad y compliance bancario necesarias para cumplir con **PCI-DSS**, **GDPR** y **SOC 2 Type II**. Esta épica es **CRÍTICA** para deployment en producción bancaria y aborda autenticación, autorización, protección de datos, auditoría inmutable y gestión segura de secretos.

**Banking-Grade Security**: Implementa controles de seguridad de grado bancario para proteger datos sensibles de transacciones financieras y cumplir con regulaciones internacionales.

---

## Table of Contents

1. [Business Context](#business-context)
2. [Security Requirements (from PRD)](#security-requirements-from-prd)
3. [Stories Overview](#stories-overview)
4. [Architecture & Design](#architecture--design)
5. [Story-by-Story Technical Details](#story-by-story-technical-details)
6. [Non-Functional Requirements](#non-functional-requirements)
7. [Testing Strategy](#testing-strategy)
8. [Dependencies & Prerequisites](#dependencies--prerequisites)
9. [Risks & Mitigations](#risks--mitigations)

---

## Business Context

### Why Epic 8 Matters

**Compliance Requirements**:
- **PCI-DSS v4.0**: Protección de datos de tarjetas (aunque no procesamos tarjetas directamente, transacciones financieras requieren controles similares)
- **GDPR**: Protección de datos personales de clientes EU, derecho al olvido, minimización de datos
- **SOC 2 Type II**: Controles de seguridad, disponibilidad y confidencialidad auditables

**Business Impact**:
- **Legal Risk**: Multas GDPR hasta €20M o 4% revenue anual
- **Reputational Risk**: Breach de datos bancarios = pérdida de confianza del cliente
- **Operational Risk**: Sin audit trail inmutable, imposible investigar fraudes
- **Regulatory Risk**: Sin compliance, reguladores pueden forzar shutdown del servicio

**Security Posture**:
- **Zero Trust**: Nunca confiar, siempre verificar (OAuth2 JWT + RBAC en todos los endpoints)
- **Defense in Depth**: Múltiples capas de seguridad (TLS, secrets encryption, pseudonymization, audit)
- **Least Privilege**: RBAC granular (ADMIN, AUDITOR, SUPPORT, USER roles)

---

## Security Requirements (from PRD)

### Authentication & Authorization (NFR-S1 to NFR-S4)

**NFR-S1**: JWT tokens con RSA 256 signature mínimo  
**NFR-S2**: Tokens expiran en 1 hora (access) o 30 días (refresh)  
**NFR-S3**: RBAC enforcement en todos los endpoints  
**NFR-S4**: API keys rotables para service-to-service auth  

**Implementation:** OAuth2 Resource Server (Spring Security 6) + Keycloak integration

---

### Data Protection (NFR-S5 to NFR-S9)

**NFR-S5**: TDE (Transparent Data Encryption) habilitado en PostgreSQL  
**NFR-S6**: TLS 1.3 obligatorio para todas las conexiones externas  
**NFR-S7**: Secrets almacenados en HashiCorp Vault (no hardcoded)  
**NFR-S8**: Customer_id pseudonimizado (HMAC-SHA256 one-way)  
**NFR-S9**: Sin PII en logs, eventos, o métricas  

**Implementation:** Vault integration (Story 1.4 - ✅ DONE), Pseudonymization Service (Story 8.3), TLS cert management (Story 8.6)

---

### Audit & Compliance (NFR-S10 to NFR-S13)

**NFR-S10**: Audit log inmutable con timestamp preciso (millisecond)  
**NFR-S11**: Retention de audit logs: 365 días mínimo  
**NFR-S12**: Provider proofs almacenados indefinidamente  
**NFR-S13**: Compliance con PCI-DSS, GDPR, SOC 2 Type II  

**Implementation:** Immutable audit_log table (Story 8.4), GDPR compliance endpoints (Story 10.10), provider_proof storage (Epic 3)

---

### Security Testing (NFR-S14 to NFR-S16)

**NFR-S14**: Dependency scanning en CI/CD (OWASP Dependency Check)  
**NFR-S15**: Container scanning (Trivy) antes de deployment  
**NFR-S16**: Penetration testing semestral  

**Implementation:** CI/CD pipeline enhancements (Epic 8 optional Story 8.9)

---

## Stories Overview

| Story # | Story Name | FRs/NFRs | Priority | Estimation |
|---------|------------|----------|----------|------------|
| **8.1** | OAuth2 Resource Server Setup | NFR-S1, S2, S3 | 🔴 CRITICAL | 5 SP |
| **8.2** | RBAC - Role-Based Access Control | NFR-S3, FR73-FR76 | 🔴 CRITICAL | 5 SP |
| **8.3** | Pseudonymization Service | NFR-S8, S9, FR77-FR80 | 🔴 CRITICAL | 8 SP |
| **8.4** | Audit Log - Immutable Storage | NFR-S10, S11, FR81-FR85 | 🔴 CRITICAL | 8 SP |
| **8.5** | Vault Secret Rotation | NFR-S7, FR86-FR87 | 🟡 HIGH | 5 SP |
| **8.6** | TLS Certificate Management | NFR-S6, FR88-FR89 | 🟡 HIGH | 3 SP |
| **8.7** | Rate Limiting per Customer | FR90, Abuse Prevention | ✅ DONE | - |
| **8.8** | Security Headers Configuration | OWASP Best Practices | 🟢 MEDIUM | 2 SP |

**Total Estimation:** ~36 Story Points (excluding 8.7 DONE)  
**Duration Estimate:** 2-3 semanas (4-5 sprints @ 8 SP/sprint)

**Note:** Story 8.7 (Rate Limiting) ya está implementada como Critical Improvement #2.

---

## Architecture & Design

### Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL CLIENTS                              │
│  (Mobile App, Admin Portal, Service-to-Service)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/TLS 1.3 (Story 8.6)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                   │
│  - TLS Termination                                               │
│  - Rate Limiting (Global) - Story 8.7 ✅                        │
│  - Security Headers - Story 8.8                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ JWT Token
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              SPRING BOOT APPLICATION                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SECURITY FILTER CHAIN (Story 8.1)                       │  │
│  │  - JWT Validation (RSA 256)                              │  │
│  │  - OAuth2 Resource Server                                │  │
│  │  - RBAC Enforcement (Story 8.2)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CONTROLLERS (Inbound Adapters)                          │  │
│  │  - @PreAuthorize("hasRole('ADMIN')")                     │  │
│  │  - @PreAuthorize("hasRole('USER')")                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  USE CASES (Application Layer)                           │  │
│  │  - Business Logic                                         │  │
│  │  - Audit Logging (Story 8.4)                             │  │
│  │  - Pseudonymization (Story 8.3)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DOMAIN LAYER (Pure Business Logic)                      │  │
│  │  - NO SECURITY DEPENDENCIES                               │  │
│  │  - Hexagonal Purity                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  INFRASTRUCTURE LAYER (Outbound Adapters)                │  │
│  │  - Vault Adapter (Secrets) - Story 1.4 ✅               │  │
│  │  - Audit Log Adapter (Story 8.4)                         │  │
│  │  - Pseudonymization Adapter (Story 8.3)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬───────────────────────┬────────────────────┘
                     │                       │
                     ▼                       ▼
         ┌───────────────────┐   ┌──────────────────────┐
         │  POSTGRESQL        │   │  HASHICORP VAULT     │
         │  - TDE Enabled     │   │  - Secrets Storage   │
         │  - Audit Log Table │   │  - Auto-Rotation     │
         │  - Pseudonymized   │   │    (Story 8.5)       │
         │    customer_id     │   └──────────────────────┘
         └───────────────────┘
```

---

### Security Layers

**Layer 1: Network Security (Story 8.6 - TLS)**
- TLS 1.3 for all external connections
- Certificate management with Let's Encrypt or corporate CA
- HTTP → HTTPS redirect
- HSTS headers

**Layer 2: Authentication (Story 8.1 - OAuth2)**
- OAuth2 Resource Server (Spring Security 6)
- JWT token validation (RSA 256)
- Token expiration: 1 hour (access), 30 days (refresh)
- Keycloak integration for centralized identity

**Layer 3: Authorization (Story 8.2 - RBAC)**
- Role-Based Access Control (4 roles)
- Method-level security (@PreAuthorize)
- URL pattern-based authorization
- Deny-by-default policy

**Layer 4: Data Protection (Story 8.3 - Pseudonymization)**
- Customer ID pseudonymization (HMAC-SHA256)
- PII redaction in logs, metrics, events
- Vault for secrets encryption
- PostgreSQL TDE for data at rest

**Layer 5: Audit & Compliance (Story 8.4 - Audit Log)**
- Immutable audit log table
- Who-What-When-Where tracking
- Compliance reporting (GDPR, SOC 2)
- Retention: 365 days minimum

**Layer 6: Attack Prevention (Story 8.7 ✅ + 8.8)**
- Rate limiting per customer (10 req/min)
- Global rate limiting (100 req/sec)
- Security headers (CSP, X-Frame-Options, etc.)
- CSRF protection (disabled for stateless JWT)

---

## Story-by-Story Technical Details

---

### Story 8.1: OAuth2 Resource Server Setup

**Goal:** Integrar OAuth2 Resource Server con Keycloak para validación de JWT tokens en todos los endpoints.

#### Acceptance Criteria

**AC1:** Spring Security configurado como OAuth2 Resource Server
- Dependencies: `spring-boot-starter-oauth2-resource-server`
- JWT decoder configurado con Keycloak issuer URI
- RSA public key obtenido de Keycloak JWKS endpoint

**AC2:** Security Filter Chain configurado
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    return http
        .csrf(csrf -> csrf.disable()) // Stateless JWT
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
            .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
            .requestMatchers("/api/v1/**").authenticated()
            .anyRequest().denyAll())
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
        .build();
}
```

**AC3:** JWT claims extraídos correctamente
- `sub` → Principal username
- `email` → User email
- `realm_access.roles` → Granted authorities (ROLE_ prefix)

**AC4:** Integration tests
- Test con JWT válido → HTTP 200
- Test sin JWT → HTTP 401 Unauthorized
- Test con JWT expirado → HTTP 401
- Test con JWT signature inválida → HTTP 401

#### Technical Design

**Keycloak Configuration:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI:http://localhost:8080/realms/signature-router}
          jwk-set-uri: ${KEYCLOAK_JWK_SET_URI:http://localhost:8080/realms/signature-router/protocol/openid-connect/certs}
```

**JWT Authentication Converter:**
```java
@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        String username = jwt.getClaimAsString("preferred_username");
        return new JwtAuthenticationToken(jwt, authorities, username);
    }
    
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return List.of();
        
        List<String> roles = (List<String>) realmAccess.get("roles");
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toList());
    }
}
```

**Files to Create:**
- `SecurityConfig.java` (infrastructure/config/)
- `KeycloakJwtAuthenticationConverter.java` (infrastructure/security/)
- `SecurityIntegrationTest.java` (test/)

**Files to Modify:**
- `application.yml` (OAuth2 resource server config)
- `application-local.yml` (Keycloak localhost config)
- `pom.xml` (spring-boot-starter-oauth2-resource-server)

**Dependencies:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

**Estimated Effort:** 5 Story Points (1-2 days)

---

### Story 8.2: RBAC - Role-Based Access Control

**Goal:** Implementar control de acceso basado en roles con 4 roles bancarios (ADMIN, AUDITOR, SUPPORT, USER).

#### Acceptance Criteria

**AC1:** 4 roles definidos en Keycloak realm
- **ADMIN**: Full access (create, read, update, delete)
- **AUDITOR**: Read-only access to audit logs, routing rules, provider health
- **SUPPORT**: Create signature requests, view timelines, manage routing rules
- **USER**: Create signature requests, query status (own requests only)

**AC2:** Method-level security en controllers
```java
@RestController
@RequestMapping("/api/v1/admin/routing-rules")
public class RoutingRuleController {
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPPORT')")
    public ResponseEntity<RoutingRuleDto> createRule(@RequestBody CreateRuleDto dto) {
        // ...
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'SUPPORT')")
    public ResponseEntity<List<RoutingRuleDto>> listRules() {
        // ...
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRule(@PathVariable UUID id) {
        // ...
    }
}
```

**AC3:** Audit log de decisiones de autorización
- Log cuando access denied (HTTP 403)
- Include: username, role, attempted endpoint, timestamp

**AC4:** Integration tests para RBAC
```java
@Test
void adminCanCreateRule() {
    mockMvc.perform(post("/api/v1/admin/routing-rules")
        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
        .contentType(APPLICATION_JSON)
        .content(ruleJson))
        .andExpect(status().isCreated());
}

@Test
void auditorCannotCreateRule() {
    mockMvc.perform(post("/api/v1/admin/routing-rules")
        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_AUDITOR")))
        .contentType(APPLICATION_JSON)
        .content(ruleJson))
        .andExpect(status().isForbidden());
}
```

#### Technical Design

**Role Mapping Table:**

| Role | Create Signature | Create Rule | Delete Rule | View Audit | View Provider Health | Manage Secrets |
|------|------------------|-------------|-------------|------------|----------------------|----------------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AUDITOR | ❌ | ❌ | ❌ | ✅ Read-only | ✅ Read-only | ❌ |
| SUPPORT | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| USER | ✅ Own only | ❌ | ❌ | ❌ | ❌ | ❌ |

**SpEL Expressions for Authorization:**
```java
// Admin-only
@PreAuthorize("hasRole('ADMIN')")

// Admin or Support
@PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")

// User can only access own signature requests
@PreAuthorize("hasRole('USER') and #customerId == authentication.principal.customerId")
```

**Global Method Security Configuration:**
```java
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class MethodSecurityConfig {
    // Spring Security 6 auto-configuration
}
```

**Files to Create:**
- `RoleEnum.java` (domain/security/)
- `RbacIntegrationTest.java` (test/)
- `RBAC.md` (docs/security/)

**Files to Modify:**
- All controllers (add @PreAuthorize annotations)
- `SecurityConfig.java` (enable method security)
- `keycloak/realms/signature-router-realm.json` (define roles)

**Estimated Effort:** 5 Story Points (1-2 days)

---

### Story 8.3: Pseudonymization Service

**Goal:** Implementar servicio de pseudonimización para cumplir GDPR (minimización de datos, protección de PII).

#### Acceptance Criteria

**AC1:** Customer ID pseudonimizado con HMAC-SHA256
```java
public interface PseudonymizationService {
    String pseudonymize(String customerId);
    boolean verify(String customerId, String pseudonymizedId);
}
```

**AC2:** PseudonymizationServiceImpl con Vault integration
- Secret key almacenado en Vault (path: `secret/signature-router/pseudonymization-key`)
- HMAC-SHA256 one-way hash
- Deterministic (mismo input → mismo output)
- No reversible (cannot recover original customer ID)

**AC3:** Integration en SignatureRequest aggregate
```java
@Service
public class StartSignatureUseCaseImpl implements StartSignatureUseCase {
    
    private final PseudonymizationService pseudonymizationService;
    
    @Override
    public SignatureRequest execute(CreateSignatureRequestDto dto) {
        String pseudonymizedCustomerId = pseudonymizationService.pseudonymize(dto.customerId());
        
        SignatureRequest request = SignatureRequest.builder()
            .customerId(pseudonymizedCustomerId) // NEVER store original
            .transactionContext(dto.transactionContext())
            .build();
        
        // ...
    }
}
```

**AC4:** PII redaction en logs
```java
@Component
public class PiiRedactionFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, ...) {
        // Redact PII from request body BEFORE logging
        String sanitizedBody = piiRedactionService.redact(requestBody);
        MDC.put("requestBody", sanitizedBody);
        // ...
    }
}
```

**AC5:** Unit tests
- Test pseudonymize(customerId) → 64 hex chars (SHA256)
- Test deterministic (same input → same output)
- Test verify(original, pseudonymized) → true
- Test redaction in logs (no phone, email, name)

#### Technical Design

**HMAC-SHA256 Pseudonymization:**
```java
@Service
public class VaultPseudonymizationServiceImpl implements PseudonymizationService {
    
    private final VaultTemplate vaultTemplate;
    
    @Override
    public String pseudonymize(String customerId) {
        String secretKey = getSecretKeyFromVault();
        
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(UTF_8), "HmacSHA256");
            hmac.init(secretKeySpec);
            
            byte[] hash = hmac.doFinal(customerId.getBytes(UTF_8));
            return HexFormat.of().formatHex(hash); // 64 hex chars
        } catch (Exception e) {
            throw new PseudonymizationException("Failed to pseudonymize customer ID", e);
        }
    }
    
    @Override
    public boolean verify(String customerId, String pseudonymizedId) {
        return pseudonymize(customerId).equals(pseudonymizedId);
    }
    
    private String getSecretKeyFromVault() {
        VaultResponseSupport<Map> response = vaultTemplate.read("secret/data/signature-router/pseudonymization-key");
        return (String) response.getData().get("key");
    }
}
```

**PII Fields to Redact:**
- Customer phone number
- Customer email
- Customer name
- Credit card numbers (if present in transaction context)
- IP addresses (GDPR PII in EU)

**Vault Secret Initialization:**
```bash
# vault-init.sh (update)
vault kv put secret/signature-router/pseudonymization-key \
  key=$(openssl rand -hex 32) # 256-bit random key
```

**Files to Create:**
- `PseudonymizationService.java` (domain/port/outbound/)
- `VaultPseudonymizationServiceImpl.java` (infrastructure/adapter/outbound/pseudonymization/)
- `PiiRedactionFilter.java` (infrastructure/filter/)
- `PseudonymizationException.java` (domain/exception/)
- `PseudonymizationServiceTest.java` (test/)

**Files to Modify:**
- `StartSignatureUseCaseImpl.java` (inject PseudonymizationService)
- `vault-init.sh` (add pseudonymization-key secret)
- `MdcFilter.java` (redact PII from logs)

**Estimated Effort:** 8 Story Points (2-3 days)

---

### Story 8.4: Audit Log - Immutable Storage

**Goal:** Implementar audit log inmutable con retention de 365 días para cumplir SOC 2 Type II y regulaciones bancarias.

#### Acceptance Criteria

**AC1:** Tabla `audit_log` con constraints de inmutabilidad
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  event_type VARCHAR(50) NOT NULL, -- SIGNATURE_CREATED, RULE_MODIFIED, etc.
  entity_type VARCHAR(50) NOT NULL, -- SIGNATURE_REQUEST, ROUTING_RULE, etc.
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
  actor VARCHAR(255) NOT NULL, -- username or service account
  actor_role VARCHAR(50), -- ADMIN, USER, etc.
  changes JSONB, -- Before/after snapshot
  ip_address INET,
  user_agent TEXT,
  trace_id VARCHAR(36), -- Distributed tracing correlation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Immutability constraint (no UPDATE or DELETE allowed)
  CONSTRAINT no_update CHECK (false) DEFERRABLE INITIALLY DEFERRED
);

-- Prevent UPDATE and DELETE via RLS (Row Level Security)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY immutable_audit_log ON audit_log
  FOR DELETE TO PUBLIC USING (false);

CREATE POLICY immutable_audit_log_update ON audit_log
  FOR UPDATE TO PUBLIC USING (false);

-- Only INSERT allowed
CREATE POLICY insert_audit_log ON audit_log
  FOR INSERT TO PUBLIC WITH CHECK (true);
```

**AC2:** AuditService interface en domain layer
```java
public interface AuditService {
    void log(AuditEvent event);
}

public record AuditEvent(
    AuditEventType eventType,
    String entityType,
    UUID entityId,
    AuditAction action,
    String actor,
    String actorRole,
    Map<String, Object> changes,
    String ipAddress,
    String userAgent,
    String traceId
) {
    public static AuditEvent signatureCreated(SignatureRequest request, String actor) {
        return new AuditEvent(
            AuditEventType.SIGNATURE_CREATED,
            "SIGNATURE_REQUEST",
            request.getId(),
            AuditAction.CREATE,
            actor,
            extractRole(actor),
            Map.of("status", request.getStatus(), "customerId", request.getCustomerId()),
            extractIpAddress(),
            extractUserAgent(),
            MDC.get("traceId")
        );
    }
}
```

**AC3:** AuditServiceImpl con JPA entity
```java
@Service
public class JpaAuditServiceImpl implements AuditService {
    
    private final AuditLogRepository auditLogRepository;
    
    @Override
    public void log(AuditEvent event) {
        AuditLogEntity entity = AuditLogEntity.builder()
            .eventType(event.eventType().name())
            .entityType(event.entityType())
            .entityId(event.entityId())
            .action(event.action().name())
            .actor(event.actor())
            .actorRole(event.actorRole())
            .changes(event.changes()) // JSONB
            .ipAddress(event.ipAddress())
            .userAgent(event.userAgent())
            .traceId(event.traceId())
            .createdAt(Instant.now())
            .build();
        
        auditLogRepository.save(entity);
    }
}
```

**AC4:** Audit log en todos los use cases críticos
- SignatureRequestCreated
- SignatureChallengeCompleted
- RoutingRuleCreated/Modified/Deleted
- ProviderConfigurationChanged
- SecretRotated
- UserAccessDenied (HTTP 403)

**AC5:** Query endpoint para auditors
```java
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
public class AuditLogController {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Page<AuditLogDto>> listAuditLogs(
        @RequestParam(required = false) String entityType,
        @RequestParam(required = false) String actor,
        @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE_TIME) Instant to,
        Pageable pageable
    ) {
        // Query with filters
    }
}
```

**AC6:** Retention policy (365 días)
```sql
-- PostgreSQL table partitioning by month
CREATE TABLE audit_log_2025_11 PARTITION OF audit_log
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Cron job to drop old partitions after 365 days
-- /scripts/cleanup-old-audit-logs.sh
```

**AC7:** Integration tests
- Test audit log creation (cannot UPDATE or DELETE)
- Test query with filters (entity type, actor, date range)
- Test immutability (UPDATE attempt → exception)

#### Technical Design

**Audit Event Types:**
```java
public enum AuditEventType {
    // Signature Lifecycle
    SIGNATURE_CREATED,
    SIGNATURE_CHALLENGED,
    SIGNATURE_COMPLETED,
    SIGNATURE_EXPIRED,
    SIGNATURE_ABORTED,
    
    // Routing Rules
    ROUTING_RULE_CREATED,
    ROUTING_RULE_MODIFIED,
    ROUTING_RULE_DELETED,
    ROUTING_RULE_ENABLED,
    ROUTING_RULE_DISABLED,
    
    // Security
    ACCESS_DENIED,
    INVALID_JWT_TOKEN,
    RATE_LIMIT_EXCEEDED,
    
    // Provider Management
    PROVIDER_CONFIGURATION_CHANGED,
    PROVIDER_DEGRADED_MODE_ACTIVATED,
    PROVIDER_CIRCUIT_BREAKER_OPENED,
    
    // Secrets Management
    SECRET_ROTATED,
    SECRET_ACCESS_ATTEMPTED,
    
    // GDPR
    CUSTOMER_DATA_EXPORTED,
    CUSTOMER_DATA_DELETED
}
```

**Changes JSONB Structure:**
```json
{
  "before": {
    "status": "PENDING",
    "expiresAt": "2025-11-29T10:30:00Z"
  },
  "after": {
    "status": "SIGNED",
    "expiresAt": "2025-11-29T10:30:00Z"
  },
  "diff": [
    {"field": "status", "oldValue": "PENDING", "newValue": "SIGNED"}
  ]
}
```

**Files to Create:**
- `AuditService.java` (domain/port/outbound/)
- `AuditEvent.java` (domain/model/valueobject/)
- `AuditEventType.java` (domain/model/enums/)
- `AuditAction.java` (domain/model/enums/)
- `JpaAuditServiceImpl.java` (infrastructure/adapter/outbound/audit/)
- `AuditLogEntity.java` (infrastructure/adapter/outbound/persistence/entity/)
- `AuditLogRepository.java` (infrastructure/adapter/outbound/persistence/repository/)
- `AuditLogController.java` (infrastructure/adapter/inbound/rest/)
- `0008-audit-log-table.yaml` (LiquidBase changeset)
- `AuditServiceIntegrationTest.java` (test/)

**Files to Modify:**
- All use cases (inject AuditService, call log())
- `GlobalExceptionHandler.java` (audit access denied)

**Database Schema:**
- Table: `audit_log` (partitioned by month)
- Indexes: `idx_audit_log_entity_type_entity_id`, `idx_audit_log_actor`, `idx_audit_log_created_at`
- Constraints: RLS policies for immutability

**Estimated Effort:** 8 Story Points (2-3 days)

---

### Story 8.5: Vault Secret Rotation

**Goal:** Implementar rotación automática de secretos cada 90 días con grace period de 7 días.

#### Acceptance Criteria

**AC1:** Vault dynamic secrets configurados
```hcl
# Vault PostgreSQL database secrets engine
path "database/creds/signature-router-role" {
  capabilities = ["read"]
  
  # Auto-rotation every 90 days
  rotation {
    period = "2160h"  # 90 days
    auto_rotate = true
  }
}
```

**AC2:** Spring Cloud Vault @RefreshScope
```java
@Configuration
@RefreshScope
public class DataSourceConfig {
    
    @Value("${database.username}")
    private String dbUsername;
    
    @Value("${database.password}")
    private String dbPassword;
    
    @Bean
    @RefreshScope
    public DataSource dataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:postgresql://localhost:5432/signature_router")
            .username(dbUsername)
            .password(dbPassword)
            .build();
    }
}
```

**AC3:** Config refresh cada 5 minutos
```yaml
spring:
  cloud:
    vault:
      config:
        lifecycle:
          enabled: true
          min-renewal: 300s  # 5 min
          expiry-threshold: 600s  # 10 min
```

**AC4:** Grace period de 7 días
- Old secret (v1) válido por 7 días después de rotación
- New secret (v2) activo inmediatamente
- Aplicación usa v2 para nuevas conexiones
- Conexiones en flight con v1 no se interrumpen

**AC5:** Audit log de rotaciones
```java
@Component
public class SecretRotationEventListener {
    
    @Autowired
    private AuditService auditService;
    
    @EventListener
    public void onSecretRotated(VaultLeaseRenewalEvent event) {
        auditService.log(AuditEvent.builder()
            .eventType(AuditEventType.SECRET_ROTATED)
            .entityType("VAULT_SECRET")
            .entityId(event.getLeaseId())
            .action(AuditAction.UPDATE)
            .actor("vault-auto-rotation")
            .build());
    }
}
```

**AC6:** Alerting si rotación falla
```yaml
# Prometheus alert rule
- alert: VaultSecretRotationFailed
  expr: vault_secret_rotation_failures_total > 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Vault secret rotation failed"
    description: "Secret {{ $labels.secret_path }} failed to rotate"
```

**AC7:** Integration tests
- Test secret rotation simulation (mock Vault)
- Test DataSource reconnect con nuevo secret
- Test grace period (old + new valid simultaneously)

#### Technical Design

**Secrets Eligible for Rotation:**
1. **Database credentials** (PostgreSQL)
   - Dynamic secrets via Vault PostgreSQL engine
   - Lease duration: 90 days
   - Max TTL: 365 days

2. **Twilio API keys** (Provider integration)
   - Manual rotation via Vault KV v2
   - Versioned secrets (keep last 3 versions)

3. **Kafka SASL credentials** (Event streaming)
   - Manual rotation via Vault KV v2

4. **Pseudonymization key** (Story 8.3)
   - Manual rotation (requires data migration)
   - Not auto-rotated (high risk)

**Vault PostgreSQL Database Engine Setup:**
```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/signature-router \
  plugin_name=postgresql-database-plugin \
  allowed_roles="signature-router-role" \
  connection_url="postgresql://{{username}}:{{password}}@localhost:5432/signature_router" \
  username="vault_admin" \
  password="vault_admin_password"

# Create role with 90-day TTL
vault write database/roles/signature-router-role \
  db_name=signature-router \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="2160h" \
  max_ttl="8760h"
```

**Files to Create:**
- `SecretRotationEventListener.java` (infrastructure/vault/)
- `VaultDatabaseSecretsConfig.java` (infrastructure/config/)
- `vault-database-setup.sh` (vault/scripts/)
- `SECRET_ROTATION.md` (docs/security/)

**Files to Modify:**
- `DataSourceConfig.java` (add @RefreshScope)
- `bootstrap.yml` (lifecycle config)
- `vault-init.sh` (database secrets engine setup)

**Estimated Effort:** 5 Story Points (1-2 days)

---

### Story 8.6: TLS Certificate Management

**Goal:** Configurar TLS 1.3 obligatorio para todas las conexiones externas con gestión automática de certificados.

#### Acceptance Criteria

**AC1:** TLS 1.3 habilitado en Spring Boot
```yaml
server:
  ssl:
    enabled: true
    protocol: TLS
    enabled-protocols: TLSv1.3
    key-store: classpath:keystore.p12
    key-store-password: ${TLS_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: signature-router
```

**AC2:** Certificate auto-renewal con Let's Encrypt
- Certbot integration para UAT/Prod
- Certificate renewal 30 días antes de expiración
- Automated deployment (no downtime)

**AC3:** HTTP → HTTPS redirect
```java
@Configuration
public class HttpsRedirectConfig {
    
    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint securityConstraint = new SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL");
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*");
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };
        tomcat.addAdditionalTomcatConnectors(redirectConnector());
        return tomcat;
    }
    
    private Connector redirectConnector() {
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setPort(8080);
        connector.setSecure(false);
        connector.setRedirectPort(8443);
        return connector;
    }
}
```

**AC4:** HSTS headers (HTTP Strict Transport Security)
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    return http
        .headers(headers -> headers
            .httpStrictTransportSecurity(hsts -> hsts
                .maxAgeInSeconds(31536000) // 1 year
                .includeSubDomains(true)
                .preload(true)))
        .build();
}
```

**AC5:** Certificate monitoring
- Prometheus metric: `tls_certificate_expiry_days`
- Alert if expiry < 30 days
- Health check endpoint: `/actuator/health/ssl`

**AC6:** Integration tests
- Test HTTPS connection succeeds
- Test HTTP → HTTPS redirect
- Test TLS 1.2 rejected (only TLS 1.3 allowed)
- Test certificate expiry monitoring

#### Technical Design

**Certificate Providers:**

**Local Development:**
- Self-signed certificate (keytool)
- Validity: 365 days
- NOT trusted by browsers (developer accepts risk)

**UAT/Staging:**
- Let's Encrypt certificate (free, auto-renewal)
- Domain: `uat-signature-router.bank.com`
- Certbot auto-renewal cron job

**Production:**
- Corporate CA certificate (internal bank CA)
- Domain: `signature-router.bank.com`
- Manual renewal process (every 2 years)

**Certbot Auto-Renewal (UAT):**
```bash
#!/bin/bash
# /scripts/certbot-renew.sh

# Renew certificate if expiry < 30 days
certbot renew --quiet --deploy-hook "/scripts/deploy-cert.sh"

# Deploy renewed certificate to Kubernetes secret
kubectl create secret tls signature-router-tls \
  --cert=/etc/letsencrypt/live/signature-router/fullchain.pem \
  --key=/etc/letsencrypt/live/signature-router/privkey.pem \
  --dry-run=client -o yaml | kubectl apply -f -

# Rolling restart pods to pickup new certificate
kubectl rollout restart deployment/signature-router
```

**Files to Create:**
- `HttpsRedirectConfig.java` (infrastructure/config/)
- `SslHealthIndicator.java` (infrastructure/health/)
- `certbot-renew.sh` (scripts/)
- `generate-self-signed-cert.sh` (scripts/)
- `TLS_CERTIFICATE_MANAGEMENT.md` (docs/security/)

**Files to Modify:**
- `application.yml` (server.ssl config)
- `application-prod.yml` (production TLS config)
- `SecurityConfig.java` (HSTS headers)
- `docker-compose.yml` (HTTPS port 8443)

**Estimated Effort:** 3 Story Points (1 day)

---

### Story 8.7: Rate Limiting per Customer ✅

**Status:** ✅ **DONE** (Critical Improvement #2)

**Implementation Summary:**
- Resilience4j RateLimiter integration
- Per-customer rate limit: 10 requests/minute
- Global rate limit: 100 requests/second
- HTTP 429 response con Retry-After header
- Prometheus metrics: `rate_limit_exceeded_total`

**Reference:**
- Implementation: `RateLimitingFilter.java`
- Configuration: `application.yml` (resilience4j.ratelimiter)
- Tests: `RateLimitingIntegrationTest.java`

**Note:** No additional work required for Epic 8.

---

### Story 8.8: Security Headers Configuration

**Goal:** Configurar security headers según OWASP best practices para prevenir XSS, clickjacking, MIME sniffing.

#### Acceptance Criteria

**AC1:** Security headers configurados en Spring Security
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    return http
        .headers(headers -> headers
            .contentSecurityPolicy(csp -> csp
                .policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"))
            .frameOptions(frame -> frame.deny())
            .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
            .contentTypeOptions(Customizer.withDefaults())
            .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            .permissionsPolicy(permissions -> permissions
                .policy("geolocation=(), microphone=(), camera=()")))
        .build();
}
```

**AC2:** Response headers verificados
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**AC3:** CORS configurado restrictivamente
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(
        "https://admin-portal.bank.com",
        "https://mobile-app.bank.com"
    )); // NO wildcard (*)
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-ID"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
}
```

**AC4:** Integration tests
- Test CSP header present
- Test X-Frame-Options DENY
- Test CORS allowed origins (reject wildcard)
- Test HSTS header (31536000 seconds)

#### Technical Design

**Security Headers Explained:**

1. **Content-Security-Policy (CSP)**
   - Prevents XSS attacks
   - Restricts resource loading (scripts, styles, images)
   - `default-src 'self'` → Only load from same origin
   - `script-src 'unsafe-inline'` → Allow inline scripts (Swagger UI needs this)

2. **X-Frame-Options: DENY**
   - Prevents clickjacking attacks
   - Browser will NOT render page in <iframe>
   - Protects Admin Portal from UI redressing

3. **X-Content-Type-Options: nosniff**
   - Prevents MIME sniffing
   - Browser must respect Content-Type header
   - Prevents .txt → .js execution

4. **X-XSS-Protection: 1; mode=block**
   - Legacy XSS filter (modern browsers use CSP)
   - Block page rendering if XSS detected
   - Backward compatibility for older browsers

5. **Referrer-Policy: strict-origin-when-cross-origin**
   - Controls Referer header disclosure
   - HTTPS → HTTP: No referer sent
   - HTTPS → HTTPS: Full URL sent

6. **Permissions-Policy**
   - Disables unnecessary browser features
   - `geolocation=()`, `microphone=()`, `camera=()` → Disabled
   - Reduces attack surface

**Files to Create:**
- `SecurityHeadersConfig.java` (infrastructure/config/)
- `CorsConfig.java` (infrastructure/config/)
- `SecurityHeadersIntegrationTest.java` (test/)

**Files to Modify:**
- `SecurityConfig.java` (add headers configuration)

**Estimated Effort:** 2 Story Points (0.5 days)

---

## Non-Functional Requirements

### Performance (Story 8.3 - Pseudonymization)

**Requirement:** Pseudonymization must NOT add >5ms latency to P95 latency.

**Design Decision:**
- HMAC-SHA256 is fast (~0.1ms per hash on modern CPU)
- Secret key cached in memory (fetched from Vault once at startup)
- No network roundtrip for each pseudonymization call

**Validation:** Performance tests with 1000 requests/sec, measure latency impact.

---

### Security (All Stories)

**Requirement:** Pass OWASP Top 10 security checks.

**Design Decisions:**
1. **A01: Broken Access Control** → Story 8.2 (RBAC enforcement)
2. **A02: Cryptographic Failures** → Story 8.6 (TLS 1.3), Story 8.3 (HMAC-SHA256)
3. **A03: Injection** → Already addressed (SpEL validation in Story 10.6)
4. **A04: Insecure Design** → Hexagonal Architecture (domain purity)
5. **A05: Security Misconfiguration** → Story 8.8 (security headers)
6. **A06: Vulnerable Components** → CI/CD dependency scanning (optional Story 8.9)
7. **A07: Identification & Authentication Failures** → Story 8.1 (OAuth2 JWT)
8. **A08: Software and Data Integrity Failures** → Story 8.4 (immutable audit log)
9. **A09: Security Logging Failures** → Story 8.4 (comprehensive audit log)
10. **A10: SSRF** → Not applicable (no outbound user-controlled URLs)

---

### Compliance (Stories 8.3, 8.4)

**GDPR Requirements:**
- **Art. 5(1)(c) - Data Minimization:** Pseudonymization (Story 8.3)
- **Art. 5(1)(f) - Integrity & Confidentiality:** TLS, Vault, immutable audit (Stories 8.6, 8.4)
- **Art. 17 - Right to Erasure:** Anonymization endpoint (Story 10.10)
- **Art. 30 - Records of Processing:** Audit log (Story 8.4)
- **Art. 32 - Security:** Encryption, pseudonymization, audit (Epic 8 complete)

**PCI-DSS Requirements (if applicable):**
- **Req 2:** TLS 1.3 only (Story 8.6)
- **Req 3:** Encrypt data at rest (PostgreSQL TDE, Vault)
- **Req 8:** Strong authentication (OAuth2 JWT RSA 256, Story 8.1)
- **Req 10:** Audit trail (Story 8.4)

**SOC 2 Type II (Security):**
- **CC6.1:** Logical access controls (Story 8.2 RBAC)
- **CC6.6:** Encryption (Stories 8.6, 8.3, Vault)
- **CC7.2:** System monitoring (Story 8.4 audit log)

---

## Testing Strategy

### Unit Tests

**Story 8.1:**
- JWT decoder configuration test
- Role extraction from JWT claims test
- Authentication converter test

**Story 8.2:**
- @PreAuthorize annotation enforcement test (mock SecurityContext)
- RBAC decision matrix test (Admin can X, User cannot Y)

**Story 8.3:**
- Pseudonymization deterministic test (same input → same output)
- HMAC-SHA256 output format test (64 hex chars)
- PII redaction test (phone, email removed from logs)

**Story 8.4:**
- AuditEvent creation test
- Audit log immutability test (UPDATE attempt throws exception)

**Story 8.5:**
- Secret rotation event handling test
- DataSource refresh test (@RefreshScope)

**Story 8.6:**
- TLS configuration test
- HSTS header test

**Story 8.8:**
- Security headers present test
- CSP policy test

---

### Integration Tests

**Story 8.1:**
- Test valid JWT → HTTP 200
- Test invalid JWT → HTTP 401
- Test expired JWT → HTTP 401
- Test missing JWT → HTTP 401

**Story 8.2:**
- Test ADMIN can create rule → HTTP 201
- Test AUDITOR cannot create rule → HTTP 403
- Test USER can create signature (own) → HTTP 201
- Test USER cannot create signature (other customer) → HTTP 403

**Story 8.3:**
- Test pseudonymization in database (customer_id hashed)
- Test PII redaction in logs (grep logs for phone/email → not found)

**Story 8.4:**
- Test audit log creation on signature created
- Test audit log query with filters (entity type, actor, date range)
- Test immutability (UPDATE attempt via SQL → exception)

**Story 8.5:**
- Test DataSource reconnect after secret rotation simulation (Testcontainers Vault)

**Story 8.6:**
- Test HTTPS connection succeeds
- Test HTTP → HTTPS redirect (port 8080 → 8443)
- Test TLS 1.2 rejected (only TLS 1.3 allowed)

**Story 8.8:**
- Test CSP header present in response
- Test CORS allowed origins (reject wildcard)

---

### Security Tests

**Penetration Testing (Manual):**
- Test JWT token tampering (modify claims, invalid signature)
- Test RBAC bypass attempts (forge roles in JWT)
- Test SQL injection in audit log filters
- Test XSS in transaction context (stored XSS)
- Test CSRF (should fail, stateless JWT)

**Automated Security Scanning:**
- **OWASP Dependency Check** (Maven plugin, CI/CD)
- **Trivy** (Container image scanning)
- **SonarQube** (SAST - Static Application Security Testing)

---

## Dependencies & Prerequisites

### Prerequisites (from Epic 1)

**Story 1.4:** HashiCorp Vault Integration ✅ DONE
- Vault Docker service
- Spring Cloud Vault Config
- Secrets initialization (database, kafka, providers)

**Story 1.7:** REST API Foundation & Security ✅ (partially)
- OpenAPI 3.1 documentation
- Global Exception Handler
- Security Config (base)

**Note:** Story 1.7 implemented base Security Config, but WITHOUT OAuth2 Resource Server. Story 8.1 will enhance Security Config with OAuth2 JWT validation.

---

### External Dependencies

**Keycloak (Identity Provider):**
- Realm: `signature-router`
- Roles: ADMIN, AUDITOR, SUPPORT, USER
- Client: `signature-router-backend` (confidential)
- JWKS endpoint: `http://localhost:8080/realms/signature-router/protocol/openid-connect/certs`

**Note:** Keycloak already configured in `keycloak/realms/signature-router-realm.json`. Story 8.1 will integrate Spring Boot with Keycloak.

**HashiCorp Vault:**
- Already running (Docker Compose from Story 1.4)
- Secrets: database, kafka, twilio, firebase, pseudonymization-key (Story 8.3)
- Dynamic secrets: PostgreSQL credentials (Story 8.5)

**PostgreSQL:**
- TDE (Transparent Data Encryption) enabled (DBA responsibility, NOT Story 8)
- Table: `audit_log` (Story 8.4)

---

### Maven Dependencies

**Story 8.1:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

**Story 8.2:**
```xml
<!-- No new dependencies, uses Spring Security @PreAuthorize -->
```

**Story 8.3:**
```xml
<!-- No new dependencies, uses Java Crypto API + Vault (already included) -->
```

**Story 8.4:**
```xml
<!-- No new dependencies, uses JPA + JSONB (Hypersistence Utils already included) -->
```

**Story 8.5:**
```xml
<!-- No new dependencies, Spring Cloud Vault already included from Story 1.4 -->
```

**Story 8.6:**
```xml
<!-- No new dependencies, uses Spring Boot Embedded Tomcat SSL -->
```

**Story 8.8:**
```xml
<!-- No new dependencies, uses Spring Security headers -->
```

---

## Risks & Mitigations

### Risk 1: Keycloak Integration Complexity

**Risk:** Integrating with corporate Keycloak instance may have different configuration than local development.

**Mitigation:**
- Story 8.1: Start with local Keycloak (Docker) for development
- Multi-environment configuration (bootstrap-local.yml, bootstrap-prod.yml)
- Document Keycloak realm export/import process
- Corporate Keycloak team support (if available)

**Likelihood:** Medium  
**Impact:** High  
**Mitigation Priority:** High  

---

### Risk 2: Secret Rotation Downtime

**Risk:** Automatic secret rotation may cause transient connection failures if not handled gracefully.

**Mitigation:**
- Story 8.5: Implement 7-day grace period (old + new secrets valid simultaneously)
- Connection pool retry logic (HikariCP auto-retry)
- Comprehensive testing with Testcontainers Vault
- Alerting if rotation fails (Prometheus alert)

**Likelihood:** Low  
**Impact:** High (brief downtime)  
**Mitigation Priority:** High  

---

### Risk 3: TLS Certificate Expiry

**Risk:** Production certificate expires, causing service outage.

**Mitigation:**
- Story 8.6: Certificate expiry monitoring (Prometheus metric, alert if < 30 days)
- Automated renewal with Certbot (UAT)
- Corporate CA renewal process documented (Production)
- Health check endpoint: `/actuator/health/ssl`

**Likelihood:** Low (with monitoring)  
**Impact:** Critical (service down)  
**Mitigation Priority:** Critical  

---

### Risk 4: Pseudonymization Performance Impact

**Risk:** HMAC-SHA256 hashing may add latency to every request.

**Mitigation:**
- Story 8.3: Benchmark pseudonymization latency (<1ms expected)
- Cache secret key in memory (no Vault roundtrip per request)
- Performance tests: 1000 req/sec with pseudonymization enabled
- Optimize: Hash only once at request creation, NOT on every query

**Likelihood:** Low  
**Impact:** Medium (latency increase)  
**Mitigation Priority:** Medium  

---

### Risk 5: Audit Log Storage Growth

**Risk:** Audit log table grows unbounded, impacting database performance.

**Mitigation:**
- Story 8.4: PostgreSQL table partitioning by month
- Automated cleanup script (delete partitions > 365 days)
- Index optimization (created_at, entity_type, actor)
- Archive old audit logs to S3/cold storage (optional)

**Likelihood:** High (expected growth)  
**Impact:** Medium (query performance degradation)  
**Mitigation Priority:** High  

---

### Risk 6: RBAC Misconfiguration

**Risk:** Accidentally granting excessive permissions to roles (e.g., USER has ADMIN permissions).

**Mitigation:**
- Story 8.2: Comprehensive RBAC matrix documented (RBAC.md)
- Integration tests for each role × endpoint combination
- Code review checklist (verify @PreAuthorize annotations)
- Keycloak realm configuration review (roles, client scopes)

**Likelihood:** Medium  
**Impact:** Critical (security breach)  
**Mitigation Priority:** Critical  

---

## Acceptance Criteria (Epic-Level)

**Epic 8 is considered DONE when:**

✅ **Story 8.1:** OAuth2 Resource Server operational (JWT validation, 401 on invalid token)  
✅ **Story 8.2:** RBAC enforced (4 roles, @PreAuthorize on all controllers)  
✅ **Story 8.3:** Customer ID pseudonymized (HMAC-SHA256, no PII in logs)  
✅ **Story 8.4:** Audit log immutable (RLS policies, 365-day retention, query endpoint)  
✅ **Story 8.5:** Secret rotation automated (Vault dynamic secrets, @RefreshScope, grace period)  
✅ **Story 8.6:** TLS 1.3 enabled (HTTPS only, HSTS, certificate monitoring)  
✅ **Story 8.7:** Rate limiting operational (✅ already DONE)  
✅ **Story 8.8:** Security headers configured (CSP, X-Frame-Options, CORS restrictive)  

✅ **Integration Tests:** All 8 stories have passing integration tests (>80% coverage)  
✅ **Documentation:** Security documentation complete (SECURITY.md, RBAC.md, TLS.md, VAULT.md)  
✅ **Compliance:** GDPR, PCI-DSS, SOC 2 requirements met (checklist verified)  
✅ **No Regressions:** All existing tests (Epic 1-7) still passing  

---

## Documentation Deliverables

**Epic 8 Documentation:**

1. **SECURITY.md** (root, already exists - Story 10.6 SpEL Security)
   - **Update:** OAuth2 JWT validation (Story 8.1)
   - **Add:** RBAC section (Story 8.2)
   - **Add:** Pseudonymization strategy (Story 8.3)
   - **Add:** TLS configuration (Story 8.6)

2. **RBAC.md** (docs/security/ - NEW)
   - Role definitions (ADMIN, AUDITOR, SUPPORT, USER)
   - Permission matrix (role × endpoint)
   - @PreAuthorize annotation guide
   - Keycloak realm configuration

3. **AUDIT_LOG.md** (docs/security/ - NEW)
   - Audit event types catalog
   - Query API documentation
   - Retention policy
   - Compliance mapping (GDPR Art. 30, SOC 2 CC7.2)

4. **VAULT_ROTATION.md** (docs/security/ - NEW, Story 8.5)
   - Dynamic secrets configuration
   - Grace period strategy
   - Manual rotation procedures (Twilio, Kafka)
   - Troubleshooting guide

5. **TLS_CERTIFICATE_MANAGEMENT.md** (docs/security/ - NEW, Story 8.6)
   - Certificate providers (Let's Encrypt, Corporate CA)
   - Renewal procedures
   - Monitoring and alerting
   - Local development setup (self-signed certs)

6. **README.md** (root - UPDATE)
   - Security & Compliance section (Epic 8 summary)
   - Quick Start: Keycloak setup, JWT token generation
   - Environment variables: `KEYCLOAK_ISSUER_URI`, `TLS_KEYSTORE_PASSWORD`

7. **CHANGELOG.md** (root - UPDATE)
   - Epic 8 entry with detailed story list
   - Security improvements summary
   - Breaking changes (if any)

---

## Implementation Roadmap

### Sprint 1: Authentication & Authorization (Stories 8.1, 8.2)

**Week 1:**
- Day 1-2: Story 8.1 (OAuth2 Resource Server setup, JWT validation)
- Day 3-4: Story 8.2 (RBAC implementation, @PreAuthorize annotations)
- Day 5: Integration testing, documentation

**Deliverable:** All endpoints require valid JWT, RBAC enforced.

---

### Sprint 2: Data Protection & Audit (Stories 8.3, 8.4)

**Week 2:**
- Day 1-3: Story 8.3 (Pseudonymization Service, PII redaction)
- Day 4-5: Story 8.4 (Audit Log table, immutable storage, query endpoint)

**Week 3:**
- Day 1-2: Integration testing (pseudonymization + audit log)
- Day 3-4: Documentation (SECURITY.md, AUDIT_LOG.md)
- Day 5: Code review, QA

**Deliverable:** Customer IDs pseudonymized, audit log operational.

---

### Sprint 3: Secrets & TLS (Stories 8.5, 8.6, 8.8)

**Week 4:**
- Day 1-2: Story 8.5 (Vault secret rotation, dynamic secrets)
- Day 3: Story 8.6 (TLS 1.3 configuration, HSTS)
- Day 4: Story 8.8 (Security headers, CORS)
- Day 5: Integration testing, documentation

**Deliverable:** Secret rotation automated, TLS 1.3 enforced, security headers configured.

---

### Sprint 4: Testing & Hardening

**Week 5:**
- Day 1-2: Comprehensive integration testing (all 8 stories)
- Day 3: Penetration testing (manual security tests)
- Day 4: Documentation review, final updates
- Day 5: Epic 8 retrospective, hand-off to Epic 9

**Deliverable:** Epic 8 DONE, ready for Epic 9 (Observability).

---

## Conclusion

Epic 8 implementa controles de seguridad de **grado bancario** para cumplir con **PCI-DSS**, **GDPR** y **SOC 2 Type II**. Esta épica es **CRÍTICA** para deployment en producción y establece las bases de seguridad y compliance necesarias para operar en entornos regulados.

**Key Achievements:**
- ✅ OAuth2 JWT authentication (RSA 256)
- ✅ RBAC enforcement (4 roles, method-level security)
- ✅ Pseudonymization (GDPR compliance)
- ✅ Immutable audit log (SOC 2 compliance)
- ✅ Vault secret rotation (security best practices)
- ✅ TLS 1.3 enforcement (data in transit protection)
- ✅ Rate limiting (✅ already DONE)
- ✅ Security headers (OWASP best practices)

**Next Epic:** Epic 9 - Observability & SLO Tracking (Prometheus metrics, Grafana dashboards, distributed tracing, alerting).

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-29  
**Author:** BMAD Architect Agent  
**Status:** Ready for Implementation  
**Estimated Duration:** 2-3 weeks (4-5 sprints @ 8 SP/sprint)  

