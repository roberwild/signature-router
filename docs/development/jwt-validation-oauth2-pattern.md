# JWT Validation & OAuth2 Resource Server Pattern

**Documento técnico detallado - Story 1.7**  
**Autor:** BMAD Dev Agent (Amelia)  
**Fecha:** 2025-11-27  
**Versión:** 1.0

---

## Índice

1. [OAuth2 Resource Server Pattern](#1-oauth2-resource-server-pattern)
2. [JWT Structure & Validation](#2-jwt-structure--validation)
3. [RSA Public Key Validation (Banking-Grade)](#3-rsa-public-key-validation-banking-grade)
4. [JwtAuthenticationConverter](#4-jwtauthenticationconverter)
5. [SecurityFilterChain Configuration](#5-securityfilterchain-configuration)
6. [Stateless Session Management](#6-stateless-session-management)
7. [CSRF Protection](#7-csrf-protection-disabled-for-jwt)
8. [Integration Testing con MockMvc](#8-integration-testing-con-mockmvc)
9. [Production Considerations](#9-production-considerations-banking-grade)
10. [Resumen](#resumen-banking-grade-jwt-security)

---

## 1. OAuth2 Resource Server Pattern

### Arquitectura General

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  Client (SPA)   │─────▶│ Authorization    │      │  Resource       │
│  React/Angular  │      │ Server (Keycloak)│      │  Server         │
│                 │      │                  │      │  (Signature     │
└─────────────────┘      └──────────────────┘      │   Router API)   │
                                │                   │                 │
                                │ 2. RSA Public Key │                 │
                                │    (JWKS endpoint)│                 │
                                └──────────────────▶│                 │
                                                    └─────────────────┘
                         1. User login → JWT token
                         3. API call with JWT → Validation → Access granted
```

### Flujo Completo (Story 1.7)

```java
// SecurityConfig.java - Spring Security OAuth2 Resource Server
http.oauth2ResourceServer(oauth2 -> oauth2
    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
);
```

**Paso a paso:**

1. **Client obtiene JWT token**:
   ```bash
   # Usuario se autentica contra Keycloak (Authorization Server)
   POST https://keycloak.bank.com/realms/signature-router/protocol/openid-connect/token
   
   # Response: JWT token
   {
     "access_token": "eyJhbGciOiJSUzI1NiIs...",
     "token_type": "Bearer",
     "expires_in": 300
   }
   ```

2. **Client envía request con JWT**:
   ```bash
   GET /api/v1/signature/abc-123
   Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
   ```

3. **Spring Security valida JWT automáticamente**:
   - Descarga RSA public key del issuer (cached)
   - Verifica firma digital (RSA-SHA256)
   - Valida claims: `exp` (expiration), `iss` (issuer), `aud` (audience)
   - Extrae roles del claim `roles`

---

## 2. JWT Structure & Validation

### JWT Anatomy (Story 1.7)

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl0sImV4cCI6MTczMzE4NDAwMH0.SflKxwRJ...
│─────────── Header ──────────│──────────────────── Payload ─────────────────────────│──── Signature ────│
```

**Header (Base64URL encoded):**
```json
{
  "alg": "RS256",      // RSA with SHA-256 (asymmetric)
  "typ": "JWT",
  "kid": "key-id-123"  // Key ID for multi-key rotation
}
```

**Payload (Base64URL encoded):**
```json
{
  "sub": "user@bank.com",           // Subject (user ID)
  "iss": "http://keycloak:8080/realms/signature-router", // Issuer
  "aud": "signature-router-api",    // Audience (target API)
  "exp": 1733184000,                // Expiration (Unix timestamp)
  "iat": 1733180400,                // Issued at
  "roles": ["admin", "user"],       // Custom claim (Story 1.7)
  "jti": "unique-jwt-id"            // JWT ID (replay prevention)
}
```

**Signature (RSA-SHA256):**
```javascript
// Pseudocode
signature = RSA_SHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  issuer_private_key  // SOLO el Authorization Server tiene esta clave
)
```

---

## 3. RSA Public Key Validation (Banking-Grade)

### ¿Por qué RSA y no HMAC?

**HMAC (Shared Secret) - NO USAR en producción:**
```
┌──────────────┐  Secret: "supersecret"  ┌──────────────┐
│  Auth Server │◄─────────────────────────│ Resource     │
│  (Keycloak)  │                          │ Server (API) │
└──────────────┘                          └──────────────┘
   ❌ Ambos necesitan la MISMA clave
   ❌ Si el API se compromete, el Auth Server también
   ❌ No escalable (cada microservicio necesita el secret)
```

**RSA (Asymmetric) - IMPLEMENTADO en Story 1.7:**
```
┌──────────────┐  Private Key (SOLO aquí)  
│  Auth Server │  
│  (Keycloak)  │  ──────▶ Firma JWT con private key
└──────────────┘  
       │
       │ Public Key (JWKS endpoint)
       │ http://keycloak:8080/realms/signature-router/protocol/openid-connect/certs
       │
       ▼
┌──────────────┐
│ Resource     │  ✅ Valida JWT con public key
│ Server (API) │  ✅ NO puede firmar JWTs (solo validar)
└──────────────┘  ✅ Si el API se compromete, NO afecta al Auth Server
```

### Implementación Spring Security (Story 1.7)

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # Opción 1: Issuer URI (recomendado, auto-descubre JWKS endpoint)
          issuer-uri: http://localhost:8080/realms/signature-router
          
          # Opción 2: JWKS URI directo (más control)
          # jwk-set-uri: http://localhost:8080/realms/signature-router/protocol/openid-connect/certs
```

**Spring Security hace automáticamente:**

1. **Descarga public keys** del JWKS endpoint:
   ```json
   GET http://localhost:8080/realms/signature-router/protocol/openid-connect/certs
   {
     "keys": [
       {
         "kid": "key-id-123",
         "kty": "RSA",
         "alg": "RS256",
         "use": "sig",
         "n": "0vx7agoebGcQSuuPiLJXZptN9...",  // Modulus (public key)
         "e": "AQAB"                            // Exponent
       }
     ]
   }
   ```

2. **Cache public keys** (refreshed every 5 minutes):
   ```java
   // Spring Security internals (NimbusJwtDecoder)
   JWKSource<SecurityContext> jwkSource = new RemoteJWKSet<>(
       new URL(issuerUri + "/.well-known/openid-configuration")
   );
   ```

3. **Valida JWT signature**:
   ```java
   // Pseudocode
   boolean isValid = RSA.verify(
       signature,
       header + "." + payload,
       publicKey  // Downloaded from JWKS endpoint
   );
   ```

4. **Valida claims**:
   ```java
   // Spring Security validators (automático)
   - JwtTimestampValidator: exp (expiration) > now
   - JwtIssuerValidator: iss == configured issuer-uri
   - JwtAudienceValidator: aud contains expected audience (opcional)
   ```

---

## 4. JwtAuthenticationConverter

### Role Extraction & ROLE_ Prefix

**Implementación (Story 1.7):**

```java
// JwtAuthenticationConverter.java
package com.singularbank.signature.routing.infrastructure.config.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    
    private static final String ROLE_PREFIX = "ROLE_";
    private static final String ROLES_CLAIM = "roles";
    
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractRoles(jwt);
        return new JwtAuthenticationToken(jwt, authorities);
    }
    
    private Collection<GrantedAuthority> extractRoles(Jwt jwt) {
        // Simple JWT with direct "roles" claim
        List<String> roles = jwt.getClaimAsStringList(ROLES_CLAIM);
        
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }
        
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase()))
            .collect(Collectors.toList());
    }
}
```

### ¿Por qué ROLE_ prefix?

Spring Security **requiere** el prefix `ROLE_` para `@PreAuthorize("hasRole('ADMIN')")`:

```java
// ❌ NO funciona sin ROLE_ prefix
JWT claim: "roles": ["admin"]
Spring authority: "admin"
@PreAuthorize("hasRole('ADMIN')") → FALSE (busca "ROLE_ADMIN")

// ✅ Funciona con JwtAuthenticationConverter
JWT claim: "roles": ["admin"]
Spring authority: "ROLE_ADMIN"  // JwtAuthenticationConverter agrega prefix
@PreAuthorize("hasRole('ADMIN')") → TRUE
```

### Alternativa para Keycloak (nested claim)

```java
// Keycloak JWT structure:
{
  "realm_access": {
    "roles": ["admin", "user"]
  }
}

// Custom JwtAuthenticationConverter para Keycloak
private Collection<GrantedAuthority> extractRoles(Jwt jwt) {
    Map<String, Object> realmAccess = jwt.getClaim("realm_access");
    if (realmAccess == null) return List.of();
    
    @SuppressWarnings("unchecked")
    List<String> roles = (List<String>) realmAccess.get("roles");
    
    if (roles == null || roles.isEmpty()) {
        return List.of();
    }
    
    return roles.stream()
        .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase()))
        .collect(Collectors.toList());
}
```

---

## 5. SecurityFilterChain Configuration

### Security Policies Implementation (Story 1.7)

```java
// SecurityConfig.java
package com.singularbank.signature.routing.infrastructure.config;

import com.singularbank.signature.routing.infrastructure.config.security.JwtAuthenticationConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    private final JwtAuthenticationConverter jwtAuthenticationConverter;
    
    public SecurityConfig(JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // 1. Public endpoints (NO JWT required)
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/api/v1/health").permitAll()
                
                // 2. Role-based access (JWT required with specific role)
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/routing/**").hasAnyRole("ADMIN", "SUPPORT")
                
                // 3. Authenticated (JWT required, any role)
                .requestMatchers("/api/v1/**").authenticated()
                
                // 4. Deny all other requests
                .anyRequest().denyAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()));
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",  // React dev server
            "http://localhost:4200"   // Angular dev server
        ));
        
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-ID"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
```

### Request Flow con JWT

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Request arrives with Authorization: Bearer <JWT>         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BearerTokenAuthenticationFilter extracts JWT             │
│    - Looks for "Authorization: Bearer " header              │
│    - Extracts token: eyJhbGciOiJSUzI1NiIs...               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. JwtDecoder validates JWT signature                       │
│    - Downloads RSA public key from issuer (cached)          │
│    - Verifies RSA-SHA256 signature                          │
│    - Validates exp, iss, aud claims                         │
│    - Returns Jwt object if valid                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. JwtAuthenticationConverter extracts roles                │
│    - Reads "roles" claim: ["admin", "user"]                │
│    - Converts to GrantedAuthority: [ROLE_ADMIN, ROLE_USER] │
│    - Creates JwtAuthenticationToken                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SecurityContext stores authentication                    │
│    - SecurityContextHolder.setAuthentication(...)          │
│    - Available in controller via @AuthenticationPrincipal  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. AuthorizationFilter checks access                        │
│    - Evaluates .requestMatchers() rules                    │
│    - Checks .hasRole("ADMIN") requirements                 │
│    - Allows/denies based on authorities                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Request reaches controller or returns 403 Forbidden      │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Stateless Session Management

### ¿Por qué Stateless?

```java
.sessionManagement(session -> session
    .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
)
```

### Comparación: Stateful vs Stateless

| Stateful (Traditional) | Stateless (JWT - Story 1.7) |
|------------------------|------------------------------|
| Session stored in server memory/Redis | NO server-side sessions |
| JSESSIONID cookie | JWT in Authorization header |
| Server memory usage: HIGH | Server memory usage: ZERO |
| Horizontal scaling: DIFFICULT | Horizontal scaling: TRIVIAL |
| Load balancer: Sticky sessions | Load balancer: Any server |
| Session timeout: Server-side | Token expiration: Client-side |

### Banking-grade Benefits

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ API Server 1 │     │ API Server 2 │     │ API Server 3 │
│              │     │              │     │              │
│ NO sessions  │     │ NO sessions  │     │ NO sessions  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       └────────────────────┴────────────────────┘
                            │
                 Load Balancer (round-robin)
                            │
                 ┌──────────▼──────────┐
                 │ Client with JWT     │
                 │ ANY server can      │
                 │ validate JWT        │
                 └─────────────────────┘
```

**Ventajas para Banking:**
- ✅ **Zero memory overhead**: Sin estado en servidor
- ✅ **Horizontal scaling**: Cualquier servidor puede procesar cualquier request
- ✅ **High availability**: Un servidor caído NO afecta sesiones activas
- ✅ **Stateless load balancing**: No sticky sessions, mejor distribución de carga

---

## 7. CSRF Protection (Disabled for JWT)

### ¿Por qué disable CSRF con JWT?

```java
.csrf(csrf -> csrf.disable())
```

### CSRF Attack (Traditional Session-Based Auth)

```html
<!-- Malicious website: evil.com -->
<form action="https://bank.com/api/v1/transfer" method="POST">
  <input name="to" value="attacker-account" />
  <input name="amount" value="10000" />
</form>
<script>document.forms[0].submit();</script>

<!-- Browser automatically sends JSESSIONID cookie to bank.com -->
<!-- Server thinks it's a legitimate request from authenticated user -->
```

### JWT-Based Auth (Story 1.7) - CSRF Inmune

```bash
# Attacker's evil.com tries:
POST https://bank.com/api/v1/transfer
Cookie: JSESSIONID=abc123  # Browser sends automatically

# But NO Authorization header (browser doesn't auto-send custom headers)
# Server returns: 401 Unauthorized (no JWT token)
```

### ¿Por qué JWT es Inmune a CSRF?

1. **JWT está en `Authorization: Bearer` header** (NO cookie)
2. **Browsers NO envían custom headers cross-origin** sin CORS + explicit permission
3. **Attacker NO puede forzar** al browser a enviar `Authorization` header

**Conclusión:** CSRF token NO necesario con JWT stateless

---

## 8. Integration Testing con MockMvc

### Testing JWT Validation sin OAuth2 Server Real

```java
// SecurityConfigurationIntegrationTest.java
package com.singularbank.signature.routing.infrastructure.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigurationIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    /**
     * Test AC1: Swagger UI should be accessible without authentication.
     */
    @Test
    void testSwaggerUiAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
            .andExpect(status().isOk());
    }
    
    /**
     * Test AC2: API endpoints should require JWT authentication.
     */
    @Test
    void testApiRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
            .andExpect(status().isUnauthorized());
    }
    
    /**
     * Test AC2, AC4: Valid JWT token should allow API access.
     */
    @Test
    void testApiAccessibleWithValidJwt() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                .with(jwt().jwt(builder -> builder
                    .subject("testuser")
                    .claim("roles", java.util.List.of("user"))
                )))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.apiVersion").value("1.0"));
    }
    
    /**
     * Test AC3, AC4: Admin endpoints should require ADMIN role.
     */
    @Test
    void testAdminEndpointRequiresAdminRole() throws Exception {
        // User with USER role (not ADMIN) should be denied
        mockMvc.perform(get("/api/v1/admin/rules")
                .with(jwt().jwt(builder -> builder
                    .subject("testuser")
                    .claim("roles", java.util.List.of("user"))
                )))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }
    
    /**
     * Test AC3, AC4: Admin endpoints should allow access with ADMIN role.
     */
    @Test
    void testAdminEndpointAllowsAdminRole() throws Exception {
        // User with ADMIN role should be allowed (404 because endpoint doesn't exist yet)
        mockMvc.perform(get("/api/v1/admin/rules")
                .with(jwt().jwt(builder -> builder
                    .subject("admin")
                    .claim("roles", java.util.List.of("admin"))
                )))
            .andExpect(status().isNotFound()); // 404, not 403 Forbidden
    }
    
    /**
     * Test AC7: Actuator health endpoint should be accessible without authentication.
     */
    @Test
    void testHealthEndpointAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }
    
    /**
     * Test AC3: Support role should allow access to routing endpoints.
     */
    @Test
    void testRoutingEndpointRequiresSupportOrAdminRole() throws Exception {
        // User with USER role (not SUPPORT/ADMIN) should be denied
        mockMvc.perform(get("/api/v1/routing/rules")
                .with(jwt().jwt(builder -> builder
                    .subject("testuser")
                    .claim("roles", java.util.List.of("user"))
                )))
            .andExpect(status().isForbidden());
        
        // User with SUPPORT role should be allowed
        mockMvc.perform(get("/api/v1/routing/rules")
                .with(jwt().jwt(builder -> builder
                    .subject("support")
                    .claim("roles", java.util.List.of("support"))
                )))
            .andExpect(status().isNotFound()); // 404, not 403 Forbidden
    }
}
```

### ¿Cómo Funciona `jwt()` Helper?

```java
// Spring Security Test internals
.with(jwt())  →  SecurityMockMvcRequestPostProcessors.jwt()
  → Creates mock Jwt object
  → Sets SecurityContext with JwtAuthenticationToken
  → Bypasses actual JWT validation (no OAuth2 server needed)
  → Tests authorization rules ONLY
```

**Ventajas:**
- ✅ **No OAuth2 server real**: Tests rápidos sin infraestructura externa
- ✅ **Control total**: Custom claims para cada test
- ✅ **Isolation**: Tests independientes del Authorization Server
- ✅ **Speed**: Integration tests en segundos, no minutos

---

## 9. Production Considerations (Banking-Grade)

### Multi-Environment Configuration

**Development (application-local.yml):**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # Dev: Mock OAuth2 server or local Keycloak
          issuer-uri: http://localhost:8080/realms/signature-router
```

**UAT (application-uat.yml):**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # UAT: Internal Keycloak cluster
          issuer-uri: https://keycloak-uat.bank.internal/realms/signature-router
```

**Production (application-prod.yml):**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # Prod: HA Keycloak cluster with TLS
          issuer-uri: https://keycloak-prod.bank.internal/realms/signature-router
          # Optional: Custom audience validation
          audiences: signature-router-api
```

### Key Rotation Strategy (RSA Public Keys)

```java
// Spring Security auto-refreshes JWKS every 5 minutes
// Keycloak rotation strategy:
{
  "keys": [
    {
      "kid": "key-2025-11",  // Current active key
      "kty": "RSA",
      "use": "sig",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kid": "key-2025-10",  // Previous key (grace period)
      "kty": "RSA",
      "use": "sig",
      "n": "...",
      "e": "AQAB"
    }
  ]
}

// JWT header includes "kid" to select correct key
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-2025-11"  // Tells Resource Server which public key to use
}
```

**Rotation Best Practices:**
1. **Dual-key period**: Mantener clave anterior activa 24h después de rotación
2. **Automatic refresh**: Spring Security re-descarga JWKS cada 5 minutos
3. **Graceful transition**: JWTs firmados con clave anterior siguen válidos durante grace period
4. **Monitoring**: Alertas si JWKS endpoint no responde (fallback a cache)

### Performance Tuning

**JWKS Cache Configuration:**
```java
// Custom JwtDecoder bean (opcional, para tuning avanzado)
@Bean
public JwtDecoder jwtDecoder(OAuth2ResourceServerProperties properties) {
    String jwkSetUri = properties.getJwt().getJwkSetUri();
    
    NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri)
        .cache(new CaffeineJwtDecoderCache(
            Caffeine.newBuilder()
                .maximumSize(100)              // Max 100 public keys cached
                .expireAfterWrite(5, TimeUnit.MINUTES)  // Refresh every 5 min
                .build()
        ))
        .build();
    
    // Custom validators
    jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(
        properties.getJwt().getIssuerUri()
    ));
    
    return jwtDecoder;
}
```

**Connection Pooling (RestTemplate for JWKS):**
```java
@Bean
public RestOperations restOperations() {
    HttpComponentsClientHttpRequestFactory factory = 
        new HttpComponentsClientHttpRequestFactory();
    
    factory.setConnectionRequestTimeout(2000);  // 2s
    factory.setConnectTimeout(2000);            // 2s
    factory.setReadTimeout(5000);               // 5s
    
    return new RestTemplate(factory);
}
```

### Security Monitoring

**Metrics a Monitorear:**
```yaml
# application.yml
management:
  metrics:
    tags:
      application: signature-router
    enable:
      security: true  # Enable security metrics
```

**Key Metrics:**
- `security.authentication.attempts` - Total authentication attempts
- `security.authentication.failures` - Failed JWT validations
- `security.authorization.denied` - Authorization failures (403)
- `http.server.requests{status=401}` - Unauthorized requests
- `http.server.requests{status=403}` - Forbidden requests

**Alertas Críticas:**
- ⚠️ **High 401 rate**: Posible ataque con tokens inválidos
- ⚠️ **High 403 rate**: Posible privilege escalation attempt
- ⚠️ **JWKS endpoint down**: Authorization Server no responde
- ⚠️ **JWT expiration spikes**: Refresh token flow issues

---

## Resumen: Banking-Grade JWT Security

### Implementación Story 1.7

| Aspecto | Implementación | Rationale |
|---------|----------------|-----------|
| **Signature Algorithm** | RSA-SHA256 (asymmetric) | ✅ Resource Server NO puede firmar JWTs |
| **Key Distribution** | JWKS endpoint (public keys) | ✅ Auto-refresh, rotation support |
| **Session Management** | Stateless (NO server sessions) | ✅ Horizontal scaling, zero memory overhead |
| **CSRF Protection** | Disabled (JWT in header) | ✅ Browsers don't auto-send custom headers |
| **Role Mapping** | ROLE_ prefix (Spring Security) | ✅ Compatible with @PreAuthorize annotations |
| **Token Expiration** | Server-side validation (`exp` claim) | ✅ Auto-revocation, short TTL (5-15 min) |
| **TraceId Correlation** | MDC integration | ✅ Log aggregation, audit trail |
| **Testing** | MockMvc with jwt() helper | ✅ Integration tests without OAuth2 server |
| **Multi-Environment** | issuer-uri per profile | ✅ Dev/UAT/Prod separation |
| **Key Rotation** | kid claim + JWKS cache | ✅ Zero-downtime key updates |

### Archivos Implementados

**Configuration:**
- `SecurityConfig.java` - SecurityFilterChain, CORS, session management
- `JwtAuthenticationConverter.java` - Roles extraction con ROLE_ prefix
- `OpenApiConfig.java` - Bearer JWT scheme en OpenAPI spec

**Exception Handling:**
- `GlobalExceptionHandler.java` - @RestControllerAdvice con 5 exception mappings
- `ErrorResponse.java` - Standard error format con traceId
- `NotFoundException.java` - Domain exception (HTTP 404)

**Testing:**
- `SecurityConfigurationIntegrationTest.java` - 7 integration tests (MockMvc + jwt())

**Configuration Files:**
- `application.yml` - OAuth2 JWT base configuration
- `application-local.yml` - Development settings (localhost issuer)
- `application-test.yml` - Test settings (mock issuer)

### Compliance & Standards

- ✅ **PCI-DSS**: Stateless authentication, no credentials in logs
- ✅ **GDPR**: TraceId correlation sin PII en tokens
- ✅ **SOC 2**: Audit trail con timestamps, access control granular
- ✅ **Banking Standards**: RSA-2048, short token TTL (5-15 min), key rotation

---

## Referencias

### Documentación Oficial
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [RFC 7519 - JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 7517 - JSON Web Key (JWK)](https://datatracker.ietf.org/doc/html/rfc7517)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)

### Documentación Interna
- [`docs/architecture/07-observability-security.md`](../architecture/07-observability-security.md) - Security architecture
- [`docs/sprint-artifacts/tech-spec-epic-1.md`](../sprint-artifacts/tech-spec-epic-1.md) - Epic 1 technical specification
- [`README.md`](../../README.md) - Section "REST API & Security"
- [`CHANGELOG.md`](../../CHANGELOG.md) - Story 1.7 entry

### Código Fuente
- `src/main/java/com/bank/signature/infrastructure/config/SecurityConfig.java`
- `src/main/java/com/bank/signature/infrastructure/config/security/JwtAuthenticationConverter.java`
- `src/test/java/com/bank/signature/infrastructure/config/SecurityConfigurationIntegrationTest.java`

---

**Versión:** 1.0  
**Última actualización:** 2025-11-27  
**Autor:** BMAD Dev Agent (Amelia) - Story 1.7  
**Proyecto:** Signature Router & Management System

