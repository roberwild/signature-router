# Story 8.1: OAuth2 Resource Server Setup

**Story ID:** 8.1  
**Story Key:** `8-1-oauth2-resource-server-setup`  
**Epic:** Epic 8 - Security & Compliance  
**Priority:** 🔴 CRITICAL (Blocker for Production)  
**Estimation:** 5 Story Points (1-2 days)  
**Status:** Ready for Development  
**Created:** 2025-11-29  
**Last Updated:** 2025-11-29  

---

## User Story

**As a** System Administrator  
**I want** OAuth2 Resource Server configured with JWT validation  
**So that** All API endpoints are protected with banking-grade authentication (RSA 256 tokens)

---

## Business Context

### Why This Matters

**Security Risk:** Sin autenticación JWT, cualquier cliente puede acceder a endpoints sensibles (crear signature requests, modificar routing rules, ver audit logs).

**Compliance Requirement:**
- **PCI-DSS Req 8:** Strong authentication mechanisms required for financial systems
- **SOC 2 CC6.1:** Logical access controls must authenticate users before granting access
- **GDPR Art. 32:** Technical measures to ensure security of personal data processing

**Current State (Story 1.7):**
- Base `SecurityConfig` exists with basic security
- **NO OAuth2 JWT validation** (endpoints permit all authenticated users without token validation)
- **NO integration with Keycloak** (corporate identity provider)

**Desired State (Story 8.1):**
- OAuth2 Resource Server validates JWT tokens from Keycloak
- RSA 256 signature verification (asymmetric keys)
- Roles extracted from JWT claims (`realm_access.roles`)
- 401 Unauthorized response for invalid/missing/expired tokens

---

## Acceptance Criteria

### AC1: Spring Security OAuth2 Resource Server Dependency

**Given** Maven pom.xml  
**When** Developer adds OAuth2 Resource Server dependency  
**Then** Dependency is available:

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

**Validation:**
- `mvn dependency:tree` shows `spring-security-oauth2-resource-server`
- No version conflicts with existing Spring Security dependencies

---

### AC2: Keycloak Configuration in application.yml

**Given** Keycloak running on localhost:8080 (local dev)  
**When** Application starts with `local` profile  
**Then** OAuth2 Resource Server is configured:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI:http://localhost:8080/realms/signature-router}
          jwk-set-uri: ${KEYCLOAK_JWK_SET_URI:http://localhost:8080/realms/signature-router/protocol/openid-connect/certs}
```

**And** Multi-environment configuration:
- **Local:** `http://localhost:8080/realms/signature-router`
- **UAT:** `https://keycloak-uat.bank.com/realms/signature-router`
- **Prod:** `https://keycloak.bank.com/realms/signature-router`

**Validation:**
- Application starts successfully
- Log message: `Using issuer-uri: http://localhost:8080/realms/signature-router`
- Keycloak JWKS endpoint returns RSA public keys

---

### AC3: SecurityFilterChain with OAuth2 JWT Validation

**Given** SecurityConfig.java  
**When** Developer configures SecurityFilterChain  
**Then** Security rules are:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable()) // Stateless JWT, no CSRF needed
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

**And** Public endpoints (NO authentication required):
- `/swagger-ui/**` (OpenAPI documentation)
- `/v3/api-docs/**` (OpenAPI spec JSON)
- `/actuator/health` (Health check)
- `/actuator/prometheus` (Metrics export)

**And** Protected endpoints (JWT required):
- `/api/v1/**` (All business APIs)

**And** Default deny:
- `anyRequest().denyAll()` (fail-safe, explicit deny)

**Validation:**
- SecurityFilterChain bean created successfully
- No compilation errors
- Spring Security debug log shows JWT filter in filter chain

---

### AC4: JWT Authentication Converter (Roles Extraction)

**Given** JWT token from Keycloak with `realm_access.roles` claim  
**When** Token is validated  
**Then** Roles are extracted and mapped to Spring Security GrantedAuthorities:

```java
@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    
    private static final String ROLE_PREFIX = "ROLE_";
    
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        String username = jwt.getClaimAsString("preferred_username");
        return new JwtAuthenticationToken(jwt, authorities, username);
    }
    
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) {
            return Collections.emptyList();
        }
        
        List<String> roles = (List<String>) realmAccess.get("roles");
        if (roles == null) {
            return Collections.emptyList();
        }
        
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase()))
            .collect(Collectors.toList());
    }
}
```

**And** JWT claims mapping:
- `sub` → User ID (unique identifier)
- `preferred_username` → Username (e.g., "admin@bank.com")
- `email` → User email
- `realm_access.roles` → List<String> ["admin", "user"] → `ROLE_ADMIN`, `ROLE_USER`

**Validation:**
- Test JWT with `realm_access.roles: ["admin"]` → authorities contain `ROLE_ADMIN`
- Test JWT without `realm_access` → authorities empty (graceful degradation)
- Test JWT with multiple roles → all roles mapped correctly

---

### AC5: Integration Test - Valid JWT Token (HTTP 200)

**Given** Integration test with MockMvc  
**When** Request includes valid JWT token  
**Then** Endpoint returns HTTP 200:

```java
@Test
void testApiWithValidJwt_Returns200() throws Exception {
    mockMvc.perform(get("/api/v1/signatures")
        .with(jwt()
            .authorities(new SimpleGrantedAuthority("ROLE_USER"))
            .jwt(jwt -> jwt.claim("preferred_username", "test-user"))))
        .andExpect(status().isOk());
}
```

**Validation:**
- Test passes
- Response status: 200 OK
- SecurityContext contains authenticated principal

---

### AC6: Integration Test - Missing JWT Token (HTTP 401)

**Given** Integration test with MockMvc  
**When** Request does NOT include JWT token  
**Then** Endpoint returns HTTP 401 Unauthorized:

```java
@Test
void testApiWithoutJwt_Returns401() throws Exception {
    mockMvc.perform(get("/api/v1/signatures"))
        .andExpect(status().isUnauthorized());
}
```

**Validation:**
- Test passes
- Response status: 401 Unauthorized
- Response body: `{"error": "Unauthorized", "message": "Full authentication is required"}`

---

### AC7: Integration Test - Expired JWT Token (HTTP 401)

**Given** Integration test with expired JWT  
**When** Request includes expired token  
**Then** Endpoint returns HTTP 401 Unauthorized:

```java
@Test
void testApiWithExpiredJwt_Returns401() throws Exception {
    Jwt expiredJwt = Jwt.withTokenValue("expired-token")
        .header("alg", "RS256")
        .claim("sub", "user123")
        .claim("exp", Instant.now().minusSeconds(3600)) // Expired 1 hour ago
        .build();
    
    mockMvc.perform(get("/api/v1/signatures")
        .with(jwt(expiredJwt)))
        .andExpect(status().isUnauthorized());
}
```

**Validation:**
- Test passes
- Response status: 401 Unauthorized
- Log message: `JWT expired at 2025-11-29T09:00:00Z`

---

### AC8: Integration Test - Invalid JWT Signature (HTTP 401)

**Given** Integration test with tampered JWT  
**When** JWT signature is invalid (tampered claims)  
**Then** Endpoint returns HTTP 401 Unauthorized:

```java
@Test
void testApiWithInvalidSignature_Returns401() throws Exception {
    // Simulate tampered token (wrong signature)
    String tamperedToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.TAMPERED_CLAIMS.INVALID_SIGNATURE";
    
    mockMvc.perform(get("/api/v1/signatures")
        .header("Authorization", "Bearer " + tamperedToken))
        .andExpect(status().isUnauthorized());
}
```

**Validation:**
- Test passes
- Response status: 401 Unauthorized
- Log message: `Invalid JWT signature`

---

### AC9: Integration Test - Public Endpoints Accessible Without JWT

**Given** Integration test for public endpoints  
**When** Request does NOT include JWT token  
**Then** Public endpoints return HTTP 200:

```java
@Test
void testPublicEndpointsWithoutJwt_Returns200() throws Exception {
    // Swagger UI
    mockMvc.perform(get("/swagger-ui/index.html"))
        .andExpect(status().isOk());
    
    // Health check
    mockMvc.perform(get("/actuator/health"))
        .andExpect(status().isOk());
    
    // Prometheus metrics
    mockMvc.perform(get("/actuator/prometheus"))
        .andExpect(status().isOk());
}
```

**Validation:**
- All 3 tests pass
- Public endpoints do NOT require authentication
- No `WWW-Authenticate` header in response

---

### AC10: Application Startup Success (No Errors)

**Given** Application with OAuth2 Resource Server configured  
**When** Application starts with `local` profile  
**Then** Application starts successfully:

```
2025-11-29 10:00:00.123  INFO --- [main] o.s.s.oauth2.server.resource.web.BearerTokenAuthenticationFilter : 
  JWT authentication filter initialized
2025-11-29 10:00:00.456  INFO --- [main] c.b.s.SignatureRouterApplication : 
  Started SignatureRouterApplication in 5.2 seconds
```

**And** No errors in logs:
- ❌ NO `Failed to retrieve JWK Set from Keycloak`
- ❌ NO `Issuer URI is not accessible`
- ❌ NO `Bean creation failed for SecurityFilterChain`

**Validation:**
- Application starts in < 10 seconds
- Health check: `curl http://localhost:8080/actuator/health` → `{"status": "UP"}`
- Keycloak connectivity verified

---

### AC11: Keycloak Realm Configuration Verified

**Given** Keycloak realm `signature-router`  
**When** Developer imports realm JSON  
**Then** Realm is configured:

```json
{
  "realm": "signature-router",
  "enabled": true,
  "accessTokenLifespan": 3600,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "clients": [
    {
      "clientId": "signature-router-backend",
      "enabled": true,
      "clientAuthenticatorType": "client-secret",
      "secret": "**GENERATED_SECRET**",
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": true
    }
  ],
  "roles": {
    "realm": [
      {"name": "ADMIN"},
      {"name": "AUDITOR"},
      {"name": "SUPPORT"},
      {"name": "USER"}
    ]
  }
}
```

**And** JWKS endpoint accessible:
```bash
curl http://localhost:8080/realms/signature-router/protocol/openid-connect/certs
# Returns RSA public keys in JWK format
```

**Validation:**
- Keycloak realm imported successfully
- 4 roles defined: ADMIN, AUDITOR, SUPPORT, USER
- Client `signature-router-backend` configured
- JWKS endpoint returns valid RSA keys

---

### AC12: Documentation Updated

**Given** README.md, CHANGELOG.md  
**When** Story 8.1 is complete  
**Then** Documentation is updated:

**README.md - Security Section:**
```markdown
## Security & Authentication

### OAuth2 JWT Authentication

The Signature Router uses **OAuth2 Resource Server** with JWT tokens for authentication.

**Keycloak Configuration:**
- **Realm:** `signature-router`
- **Issuer URI:** `http://localhost:8080/realms/signature-router` (local)
- **JWKS Endpoint:** `/protocol/openid-connect/certs`
- **Token Lifespan:** 1 hour (access token), 30 days (refresh token)

**How to Get a JWT Token (Local Development):**

```bash
# Get access token from Keycloak
./keycloak/get-token.sh

# Or manually with curl:
curl -X POST http://localhost:8080/realms/signature-router/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=signature-router-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=admin@bank.com" \
  -d "password=admin123"

# Extract token:
export TOKEN=$(curl ... | jq -r '.access_token')

# Use token in API requests:
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/signatures
```

**Roles:**
- `ROLE_ADMIN`: Full access (all endpoints)
- `ROLE_AUDITOR`: Read-only access (audit logs, routing rules)
- `ROLE_SUPPORT`: Create signature requests, manage routing rules
- `ROLE_USER`: Create own signature requests, query status
```

**CHANGELOG.md Entry:**
```markdown
## [Unreleased] - Epic 8: Security & Compliance

### Added - Story 8.1: OAuth2 Resource Server Setup
- OAuth2 Resource Server with Keycloak integration (JWT RSA 256 validation)
- Spring Security 6 configuration: stateless JWT, CSRF disabled, session STATELESS
- JWT Authentication Converter: roles extracted from `realm_access.roles` → `ROLE_ADMIN`, etc.
- SecurityFilterChain: `/api/v1/**` requires JWT, public endpoints (`/swagger-ui`, `/actuator/*`) permit all
- Integration tests: valid JWT → 200, missing JWT → 401, expired JWT → 401, invalid signature → 401
- Keycloak realm configuration: `signature-router` realm with 4 roles (ADMIN, AUDITOR, SUPPORT, USER)
- Multi-environment configuration: `application-{local/uat/prod}.yml` with Keycloak issuer URIs
- Dependencies: `spring-boot-starter-oauth2-resource-server`, `spring-security-test`
- Documentation: README.md Security section, SECURITY.md OAuth2 guide
```

**Validation:**
- README.md has OAuth2 setup instructions
- CHANGELOG.md has Story 8.1 entry (detailed change list)
- Documentation builds successfully (no broken links)

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL CLIENT                               │
│  (Mobile App, Admin Portal, Service-to-Service)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP Request
                             │ Header: Authorization: Bearer <JWT>
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              SPRING BOOT APPLICATION                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SECURITY FILTER CHAIN (Story 8.1)                       │  │
│  │  1. BearerTokenAuthenticationFilter                      │  │
│  │     - Extract JWT from Authorization header              │  │
│  │  2. JwtDecoder                                            │  │
│  │     - Fetch RSA public key from Keycloak JWKS            │  │
│  │     - Validate JWT signature (RSA 256)                   │  │
│  │     - Validate expiration (exp claim)                    │  │
│  │  3. KeycloakJwtAuthenticationConverter                   │  │
│  │     - Extract realm_access.roles                         │  │
│  │     - Map to ROLE_ADMIN, ROLE_USER, etc.                 │  │
│  │  4. AuthenticationManagerResolver                        │  │
│  │     - Create JwtAuthenticationToken                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼ SecurityContext                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CONTROLLERS (Inbound Adapters)                          │  │
│  │  - Access authenticated user: SecurityContextHolder      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼ JWKS Request (once, cached)
┌─────────────────────────────────────────────────────────────────┐
│              KEYCLOAK (Identity Provider)                        │
│  - Realm: signature-router                                      │
│  - JWKS Endpoint: /protocol/openid-connect/certs                │
│  - RSA Public Key: {kty: RSA, n: ..., e: AQAB}                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### JWT Token Structure

**Example JWT Token from Keycloak:**

**Header:**
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "FJ86GcF3jTbNLOco4NvZkUCIUmfYCqoqtOQeMfbhNlE"
}
```

**Payload (Claims):**
```json
{
  "exp": 1701345600,
  "iat": 1701342000,
  "jti": "a7b3c4d5-e6f7-8901-2345-6789abcdef01",
  "iss": "http://localhost:8080/realms/signature-router",
  "sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "typ": "Bearer",
  "azp": "signature-router-backend",
  "session_state": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "acr": "1",
  "realm_access": {
    "roles": [
      "admin",
      "user"
    ]
  },
  "scope": "email profile",
  "email_verified": true,
  "preferred_username": "admin@bank.com",
  "email": "admin@bank.com"
}
```

**Signature:**
```
RSASHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  keycloak_private_key
)
```

**Key Claims Used:**
- `iss` (Issuer): `http://localhost:8080/realms/signature-router` → Validate issuer matches configuration
- `exp` (Expiration): `1701345600` (Unix timestamp) → Reject if `now() > exp`
- `sub` (Subject): User ID → Principal identifier
- `preferred_username`: `admin@bank.com` → Display name
- `realm_access.roles`: `["admin", "user"]` → Extract roles

---

### Files to Create

**1. Infrastructure/Config Layer:**
- `src/main/java/com/bank/signature/infrastructure/config/SecurityConfig.java` (MODIFY existing from Story 1.7)
- `src/main/java/com/bank/signature/infrastructure/security/KeycloakJwtAuthenticationConverter.java` (NEW)

**2. Test Layer:**
- `src/test/java/com/bank/signature/infrastructure/security/OAuth2SecurityIntegrationTest.java` (NEW)

**3. Configuration:**
- `src/main/resources/application.yml` (MODIFY - add OAuth2 resource server config)
- `src/main/resources/application-local.yml` (MODIFY - Keycloak localhost URI)
- `src/main/resources/application-uat.yml` (MODIFY - Keycloak UAT URI)
- `src/main/resources/application-prod.yml` (MODIFY - Keycloak Prod URI)

**4. Keycloak:**
- `keycloak/get-token.sh` (NEW - helper script to get JWT token for testing)
- `keycloak/realms/signature-router-realm.json` (MODIFY - add client configuration)

**5. Documentation:**
- `README.md` (UPDATE - Security & Authentication section)
- `CHANGELOG.md` (UPDATE - Story 8.1 entry)
- `docs/security/OAUTH2.md` (NEW - OAuth2 configuration guide)

---

### Files to Modify

**SecurityConfig.java** (from Story 1.7):
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private KeycloakJwtAuthenticationConverter jwtAuthenticationConverter;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                .requestMatchers("/api/v1/**").authenticated()
                .anyRequest().denyAll())
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
            .build();
    }
}
```

---

### Configuration (application.yml)

**application.yml:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI}
          jwk-set-uri: ${KEYCLOAK_JWK_SET_URI}

management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
```

**application-local.yml:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/signature-router
          jwk-set-uri: http://localhost:8080/realms/signature-router/protocol/openid-connect/certs

logging:
  level:
    org.springframework.security: DEBUG
```

**application-uat.yml:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak-uat.bank.com/realms/signature-router
          jwk-set-uri: https://keycloak-uat.bank.com/realms/signature-router/protocol/openid-connect/certs
```

**application-prod.yml:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.bank.com/realms/signature-router
          jwk-set-uri: https://keycloak.bank.com/realms/signature-router/protocol/openid-connect/certs
```

---

### Keycloak Helper Script (get-token.sh)

```bash
#!/bin/bash
# keycloak/get-token.sh
# Helper script to get JWT token from Keycloak for testing

set -e

KEYCLOAK_URL=${KEYCLOAK_URL:-http://localhost:8080}
REALM=${REALM:-signature-router}
CLIENT_ID=${CLIENT_ID:-signature-router-backend}
CLIENT_SECRET=${CLIENT_SECRET:-YOUR_CLIENT_SECRET}
USERNAME=${1:-admin@bank.com}
PASSWORD=${2:-admin123}

echo "Getting JWT token from Keycloak..."
echo "Realm: $REALM"
echo "Username: $USERNAME"

RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=$USERNAME" \
  -d "password=$PASSWORD")

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')
EXPIRES_IN=$(echo $RESPONSE | jq -r '.expires_in')

if [ "$ACCESS_TOKEN" != "null" ]; then
    echo ""
    echo "✅ JWT Token obtained successfully!"
    echo ""
    echo "Access Token (valid for $EXPIRES_IN seconds):"
    echo "$ACCESS_TOKEN"
    echo ""
    echo "Export to environment:"
    echo "export TOKEN='$ACCESS_TOKEN'"
    echo ""
    echo "Use in curl:"
    echo "curl -H 'Authorization: Bearer $ACCESS_TOKEN' http://localhost:8080/api/v1/signatures"
else
    echo "❌ Failed to get token"
    echo "Response: $RESPONSE"
    exit 1
fi
```

---

## Testing Strategy

### Unit Tests

**KeycloakJwtAuthenticationConverterTest.java:**

```java
@ExtendWith(MockitoExtension.class)
class KeycloakJwtAuthenticationConverterTest {
    
    private KeycloakJwtAuthenticationConverter converter;
    
    @BeforeEach
    void setUp() {
        converter = new KeycloakJwtAuthenticationConverter();
    }
    
    @Test
    void testConvert_WithAdminRole_MapsToRoleAdmin() {
        // Given
        Jwt jwt = createJwtWithRoles("admin");
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_ADMIN");
    }
    
    @Test
    void testConvert_WithMultipleRoles_MapsAllRoles() {
        // Given
        Jwt jwt = createJwtWithRoles("admin", "user", "auditor");
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_USER", "ROLE_AUDITOR");
    }
    
    @Test
    void testConvert_WithoutRealmAccess_ReturnsEmptyAuthorities() {
        // Given
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .claim("sub", "user123")
            .claim("preferred_username", "test-user")
            .build();
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities()).isEmpty();
    }
    
    private Jwt createJwtWithRoles(String... roles) {
        Map<String, Object> realmAccess = Map.of("roles", Arrays.asList(roles));
        
        return Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .claim("sub", "user123")
            .claim("preferred_username", "test-user")
            .claim("realm_access", realmAccess)
            .build();
    }
}
```

---

### Integration Tests

**OAuth2SecurityIntegrationTest.java:**

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OAuth2SecurityIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    // AC5: Valid JWT → 200
    @Test
    void testApiWithValidJwt_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/signatures")
            .with(jwt()
                .authorities(new SimpleGrantedAuthority("ROLE_USER"))
                .jwt(jwt -> jwt.claim("preferred_username", "test-user"))))
            .andExpect(status().isOk());
    }
    
    // AC6: Missing JWT → 401
    @Test
    void testApiWithoutJwt_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/signatures"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().exists("WWW-Authenticate"));
    }
    
    // AC7: Expired JWT → 401
    @Test
    void testApiWithExpiredJwt_Returns401() throws Exception {
        Jwt expiredJwt = Jwt.withTokenValue("expired-token")
            .header("alg", "RS256")
            .claim("sub", "user123")
            .claim("exp", Instant.now().minusSeconds(3600)) // Expired 1h ago
            .build();
        
        mockMvc.perform(get("/api/v1/signatures")
            .with(jwt(expiredJwt)))
            .andExpect(status().isUnauthorized());
    }
    
    // AC8: Invalid signature → 401
    @Test
    void testApiWithInvalidSignature_Returns401() throws Exception {
        String tamperedToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.TAMPERED.INVALID_SIGNATURE";
        
        mockMvc.perform(get("/api/v1/signatures")
            .header("Authorization", "Bearer " + tamperedToken))
            .andExpect(status().isUnauthorized());
    }
    
    // AC9: Public endpoints without JWT → 200
    @Test
    void testSwaggerUiWithoutJwt_Returns200() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
            .andExpect(status().isOk());
    }
    
    @Test
    void testActuatorHealthWithoutJwt_Returns200() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }
    
    @Test
    void testActuatorPrometheusWithoutJwt_Returns200() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("jvm_memory_used_bytes")));
    }
}
```

---

## Dependencies

### Maven Dependencies (pom.xml)

```xml
<!-- OAuth2 Resource Server -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>

<!-- Spring Security Test -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

**Note:** Spring Boot BOM manages versions, no explicit version required.

---

### Prerequisites

**Story 1.7:** REST API Foundation & Security ✅ DONE (partially)
- Base `SecurityConfig` exists
- OpenAPI 3.1 documentation configured
- Global Exception Handler

**Keycloak:**
- Keycloak running (Docker Compose or standalone)
- Realm: `signature-router` imported
- Client: `signature-router-backend` configured
- Roles: ADMIN, AUDITOR, SUPPORT, USER defined

---

## Risks & Mitigations

### Risk 1: Keycloak Not Accessible at Startup

**Risk:** Application fails to start if Keycloak is down (cannot fetch JWKS).

**Mitigation:**
- Configure retry logic in Spring Security (default: 5 attempts)
- Health check: Warn if JWKS unreachable, but allow startup
- Graceful degradation: Cache RSA public keys for 24 hours

**Likelihood:** Medium  
**Impact:** High (app won't start)  
**Priority:** High  

---

### Risk 2: JWT Token Expiry (1 hour)

**Risk:** Long-running operations may fail if token expires mid-request.

**Mitigation:**
- Token expiry: 1 hour (access token), 30 days (refresh token)
- Client responsibility: Refresh token before expiry
- Backend: Stateless (no session, no token refresh on server side)

**Likelihood:** Low (clients should refresh)  
**Impact:** Low (user re-authenticates)  
**Priority:** Low  

---

### Risk 3: Corporate Keycloak Integration (UAT/Prod)

**Risk:** Corporate Keycloak may have different configuration (LDAP integration, custom claims).

**Mitigation:**
- Multi-environment configuration (`application-{local/uat/prod}.yml`)
- Test with UAT Keycloak before Prod deployment
- Document corporate Keycloak requirements in `OAUTH2.md`

**Likelihood:** High  
**Impact:** Medium (configuration adjustments needed)  
**Priority:** High  

---

## Definition of Done

- [ ] **Code Complete:**
  - [ ] `KeycloakJwtAuthenticationConverter.java` created
  - [ ] `SecurityConfig.java` updated with OAuth2 Resource Server
  - [ ] `application.yml` configured (OAuth2 resource server)
  - [ ] `application-{local/uat/prod}.yml` multi-environment configs
  - [ ] `get-token.sh` helper script created

- [ ] **Tests Passing:**
  - [ ] Unit tests: `KeycloakJwtAuthenticationConverterTest.java` (3 tests passing)
  - [ ] Integration tests: `OAuth2SecurityIntegrationTest.java` (7 tests passing)
  - [ ] All existing tests (Epic 1-7) still passing (NO regressions)
  - [ ] `mvn test` → BUILD SUCCESS

- [ ] **Integration Validated:**
  - [ ] Keycloak realm imported successfully
  - [ ] `get-token.sh` returns valid JWT token
  - [ ] Valid JWT → HTTP 200 (tested with curl)
  - [ ] Missing JWT → HTTP 401 (tested with curl)
  - [ ] Public endpoints accessible without JWT

- [ ] **Code Quality:**
  - [ ] Code review completed (senior developer)
  - [ ] No Sonar violations (security, bugs, code smells)
  - [ ] JavaDoc complete (public methods)
  - [ ] Logging: INFO for authentication success, WARN for 401

- [ ] **Documentation:**
  - [ ] README.md updated (Security & Authentication section)
  - [ ] CHANGELOG.md updated (Story 8.1 entry)
  - [ ] `docs/security/OAUTH2.md` created (configuration guide)
  - [ ] Keycloak setup instructions documented

- [ ] **Deployment Ready:**
  - [ ] Environment variables documented: `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_JWK_SET_URI`
  - [ ] Docker Compose updated (if Keycloak added)
  - [ ] Kubernetes manifest updated (if applicable)

---

## Estimation Breakdown

| Task | Estimation | Notes |
|------|------------|-------|
| Add Maven dependencies | 0.25 SP | Straightforward |
| Create `KeycloakJwtAuthenticationConverter` | 1 SP | JWT claims extraction logic |
| Update `SecurityConfig` with OAuth2 | 1 SP | SecurityFilterChain configuration |
| Create `application-{env}.yml` configs | 0.5 SP | Multi-environment setup |
| Create `get-token.sh` script | 0.25 SP | Helper script |
| Unit tests (3 tests) | 0.5 SP | JUnit 5 |
| Integration tests (7 tests) | 1 SP | MockMvc + Spring Security Test |
| Documentation (README, CHANGELOG, OAUTH2.md) | 0.5 SP | Markdown |
| **Total** | **5 SP** | **1-2 days** |

---

## Senior Developer Review

_Pendiente de implementación_

---

## Notes

**Keycloak Realm:**
- Realm JSON already exists: `keycloak/realms/signature-router-realm.json`
- Import command: `docker exec keycloak /opt/keycloak/bin/kc.sh import --file /tmp/signature-router-realm.json`

**Testing JWT Locally:**
```bash
# 1. Start Keycloak
docker-compose up -d keycloak

# 2. Get token
./keycloak/get-token.sh admin@bank.com admin123

# 3. Export token
export TOKEN='<JWT_TOKEN_FROM_STEP_2>'

# 4. Test API
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/signatures

# 5. Test without token (should return 401)
curl http://localhost:8080/api/v1/signatures
```

**JWKS Caching:**
- Spring Security caches JWKS for 5 minutes by default
- Reduces load on Keycloak
- Public keys rarely change (only during key rotation)

---

**Story Status:** Ready for Development  
**Next Steps:** Implement Story 8.1 → dev-story workflow  
**Blocked By:** None  
**Blocks:** Story 8.2 (RBAC depends on JWT roles extraction)  

