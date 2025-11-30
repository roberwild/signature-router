# Autenticación con Active Directory + JWT

**Proyecto:** Signature Router  
**Epic:** Epic 12 - Admin Panel Integration  
**Fecha:** 30 de noviembre de 2025

---

## 🔐 Arquitectura de Autenticación

### Overview

El portal de administración utiliza **autenticación basada en Active Directory** con **JWT tokens**:

```
Usuario AD → Login → Keycloak (AD Federation) → JWT Token → Admin Portal
```

### Componentes

1. **Active Directory (AD)**
   - Source of truth para usuarios de la organización
   - Gestión de usuarios y grupos
   - No se gestionan usuarios desde el portal

2. **Keycloak**
   - Identity Provider (IdP)
   - Federación con Active Directory
   - Generación de JWT tokens
   - Claims con roles/permisos

3. **JWT Token**
   - Contiene claims con información del usuario
   - Roles/permisos vienen en los claims
   - Firmado y verificado por Keycloak

4. **Admin Portal (Frontend Next.js)**
   - Recibe JWT token
   - No gestiona usuarios (solo los visualiza)
   - Control de acceso basado en JWT claims

5. **Backend (Spring Boot)**
   - Valida JWT tokens
   - RBAC basado en claims
   - Endpoints read-only para usuarios AD

---

## 📋 JWT Claims Esperados

### Estructura del Token

```json
{
  "sub": "user123",
  "name": "Juan Pérez",
  "email": "juan.perez@singularbank.com",
  "preferred_username": "jperez",
  "realm_access": {
    "roles": ["ADMIN", "OPERATOR"]
  },
  "groups": [
    "AD-SingularBank-Admins",
    "AD-SingularBank-Operators"
  ],
  "iss": "https://keycloak.singularbank.com/realms/signature-router",
  "exp": 1701360000,
  "iat": 1701356400
}
```

### Claims Utilizados

| Claim | Uso | Ejemplo |
|-------|-----|---------|
| `sub` | User ID único | `"user123"` |
| `name` | Nombre completo | `"Juan Pérez"` |
| `email` | Email corporativo | `"juan.perez@singularbank.com"` |
| `preferred_username` | Username AD | `"jperez"` |
| `realm_access.roles` | Roles del portal | `["ADMIN", "OPERATOR"]` |
| `groups` | Grupos AD (opcional) | `["AD-SingularBank-Admins"]` |

---

## 🔑 Roles y Permisos

### Roles Definidos

Los roles se asignan en **Active Directory** (grupos) y se mapean a roles del portal en **Keycloak**:

| Grupo AD | Rol Portal | Permisos |
|----------|------------|----------|
| `AD-SingularBank-Admins` | `ADMIN` | Full access: gestión, configuración, usuarios |
| `AD-SingularBank-Operators` | `OPERATOR` | Operations: métricas, alertas, signatures |
| `AD-SingularBank-Viewers` | `VIEWER` | Read-only: dashboards, métricas |
| `AD-SingularBank-Support` | `SUPPORT` | Support: troubleshooting, logs |

### Mapeo de Roles en Keycloak

**Keycloak User Federation (AD):**
```
AD Group Mapper:
  AD Group: "AD-SingularBank-Admins"
  → Keycloak Role: "ADMIN"
  
AD Group Mapper:
  AD Group: "AD-SingularBank-Operators"
  → Keycloak Role: "OPERATOR"
  
AD Group Mapper:
  AD Group: "AD-SingularBank-Viewers"
  → Keycloak Role: "VIEWER"
```

---

## 🚫 Gestión de Usuarios (NO desde el Portal)

### ❌ No se Permite

- ❌ Crear usuarios (se crean en AD)
- ❌ Modificar usuarios (se modifican en AD)
- ❌ Eliminar usuarios (se eliminan en AD)
- ❌ Asignar roles (se asignan en AD mediante grupos)
- ❌ Cambiar contraseñas (se cambian en AD)

### ✅ Sí se Permite (Read-Only)

- ✅ Listar usuarios con acceso al portal
- ✅ Ver información de usuarios (nombre, email, roles)
- ✅ Ver última actividad (cuándo hicieron login)
- ✅ Auditoría de accesos (security audit)

---

## 📡 Endpoints Afectados

### Story 12.5: Keycloak Users Proxy

**Endpoints Habilitados (Read-Only):**
```
✅ GET /api/v1/admin/users           - Listar usuarios AD con acceso al portal
✅ GET /api/v1/admin/users/{id}      - Ver detalles de usuario AD
```

**Endpoints Deshabilitados en Producción:**
```
❌ POST   /api/v1/admin/users           - Crear usuario (solo AD)
❌ PUT    /api/v1/admin/users/{id}      - Modificar usuario (solo AD)
❌ DELETE /api/v1/admin/users/{id}      - Eliminar usuario (solo AD)
❌ PUT    /api/v1/admin/users/{id}/roles - Asignar roles (solo AD)
```

**Configuración:**
```yaml
# application-prod.yml
keycloak:
  admin:
    mock: false
    read-only: true  # Deshabilita POST/PUT/DELETE
    
active-directory:
  enabled: true
  domain: "SINGULARBANK"
  ldap-url: "ldap://ad.singularbank.com:389"
```

---

## 🔒 Seguridad

### Validación del Token

**Backend (Spring Security):**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                
                // Admin Panel endpoints require authentication
                .requestMatchers("/api/v1/admin/**").authenticated()
                
                // Specific role requirements
                .requestMatchers("/api/v1/admin/users/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/admin/security/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers("/api/v1/admin/alerts/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers("/api/v1/admin/signatures/**").hasAnyRole("ADMIN", "OPERATOR", "VIEWER")
                
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
    
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = 
            new JwtGrantedAuthoritiesConverter();
        
        // Extract roles from "realm_access.roles" claim
        grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
        
        JwtAuthenticationConverter authenticationConverter = 
            new JwtAuthenticationConverter();
        authenticationConverter.setJwtGrantedAuthoritiesConverter(
            grantedAuthoritiesConverter
        );
        
        return authenticationConverter;
    }
}
```

### CORS Configuration

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.singularbank.com/realms/signature-router
          jwk-set-uri: https://keycloak.singularbank.com/realms/signature-router/protocol/openid-connect/certs
          
cors:
  allowed-origins:
    - https://admin.singularbank.com
  allowed-methods:
    - GET
    - POST
    - PUT
    - DELETE
  allowed-headers:
    - Authorization
    - Content-Type
  max-age: 3600
```

---

## 🔄 Flujo de Autenticación

### 1. Login (Frontend)

```typescript
// app-signature-router-admin/lib/auth.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://keycloak.singularbank.com',
  realm: 'signature-router',
  clientId: 'admin-portal'
});

// Initialize Keycloak
keycloak.init({
  onLoad: 'login-required',
  checkLoginIframe: false
}).then((authenticated) => {
  if (authenticated) {
    // User authenticated, token available
    const token = keycloak.token;
    const roles = keycloak.realmAccess?.roles || [];
    
    // Store token for API calls
    localStorage.setItem('token', token);
  }
});
```

### 2. API Calls (Frontend)

```typescript
// app-signature-router-admin/lib/api/real-client.ts
class RealApiClient implements IApiClient {
  
  private async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (response.status === 401) {
      // Token expired, redirect to login
      keycloak.login();
    }
    
    return response;
  }
  
  async getUsers(): Promise<User[]> {
    const response = await this.fetch('/api/v1/admin/users');
    return response.json();
  }
}
```

### 3. Token Validation (Backend)

```java
// Spring Security validates JWT automatically
// Extracts roles from claims
// Checks @PreAuthorize annotations

@GetMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<UserResponse>> getUsers() {
    // Only accessible if JWT has ADMIN role
    // ...
}
```

---

## 🧪 Testing

### Development (Mock Mode)

```bash
# Frontend con datos mock (sin autenticación)
npm run dev:mock

# Backend con mock Keycloak
KEYCLOAK_ADMIN_MOCK=true ./mvnw spring-boot:run
```

### Staging (AD Integration)

```bash
# Frontend con backend real
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_BASE_URL=https://api-staging.singularbank.com
npm run dev:real

# Backend con Keycloak real (federado con AD)
KEYCLOAK_ADMIN_MOCK=false
KEYCLOAK_ADMIN_READ_ONLY=true
./mvnw spring-boot:run
```

### Production

```bash
# Frontend build
npm run build:real

# Backend
KEYCLOAK_ADMIN_MOCK=false
KEYCLOAK_ADMIN_READ_ONLY=true
java -jar signature-router.jar
```

---

## 📊 Story 12.6: Security Audit (Usuarios AD)

La **Story 12.6 (Keycloak Security Audit)** sigue siendo válida y útil:

### Endpoints:
```
✅ GET /api/v1/admin/security/overview
   - Total usuarios AD con acceso
   - Usuarios activos vs inactivos
   - % de usuarios con 2FA (si aplica)
   - Intentos de login fallidos (24h)
   - Tokens activos

✅ GET /api/v1/admin/security/access-audit
   - Eventos de login de usuarios AD
   - IP address
   - Success/failure
   - Timestamp
```

**Utilidad:**
- Auditoría de accesos de usuarios AD
- Detección de intentos de acceso no autorizados
- Compliance (SOC 2, ISO 27001)

---

## 📝 Configuración de Keycloak

### User Federation (Active Directory)

**Keycloak Admin Console:**

1. **Realm Settings → User Federation → Add LDAP**

```yaml
Vendor: Active Directory
Connection URL: ldap://ad.singularbank.com:389
Bind DN: CN=keycloak-service,OU=ServiceAccounts,DC=singularbank,DC=com
Bind Credential: <password>
Users DN: OU=Users,DC=singularbank,DC=com
Custom User LDAP Filter: (&(objectClass=user)(memberOf=CN=SingularBank-SignatureRouter-*,OU=Groups,DC=singularbank,DC=com))
```

2. **Mappers:**

```yaml
# Username Mapper
Mapper Type: user-attribute-ldap-mapper
LDAP Attribute: sAMAccountName
User Model Attribute: username

# Email Mapper
Mapper Type: user-attribute-ldap-mapper
LDAP Attribute: mail
User Model Attribute: email

# Full Name Mapper
Mapper Type: full-name-ldap-mapper
LDAP Attribute: displayName

# Group Mapper
Mapper Type: group-ldap-mapper
LDAP Groups DN: OU=Groups,DC=singularbank,DC=com
Group Name LDAP Attribute: cn
Membership LDAP Attribute: member
```

3. **Role Mappers:**

```yaml
# Admin Group → ADMIN Role
Mapper Type: hardcoded-role-mapper
Condition: user is member of "AD-SingularBank-Admins"
Role: ADMIN

# Operator Group → OPERATOR Role
Mapper Type: hardcoded-role-mapper
Condition: user is member of "AD-SingularBank-Operators"
Role: OPERATOR

# Viewer Group → VIEWER Role
Mapper Type: hardcoded-role-mapper
Condition: user is member of "AD-SingularBank-Viewers"
Role: VIEWER
```

---

## ✅ Checklist de Configuración

### Keycloak

- [ ] User Federation con AD configurada
- [ ] LDAP connection testeada
- [ ] Mappers configurados (username, email, name)
- [ ] Group mappers configurados
- [ ] Role mappers configurados (AD groups → Roles)
- [ ] Client configurado (admin-portal)
- [ ] JWT claims verificados

### Backend (Spring Boot)

- [ ] OAuth2 Resource Server configurado
- [ ] JWT validation configurado
- [ ] RBAC configurado con @PreAuthorize
- [ ] CORS configurado
- [ ] Endpoints read-only habilitados
- [ ] Endpoints write deshabilitados (read-only mode)

### Frontend (Next.js)

- [ ] Keycloak client library instalado
- [ ] Keycloak init configurado
- [ ] Token management implementado
- [ ] Auto-refresh token configurado
- [ ] Logout implementado
- [ ] Role-based UI rendering

### Testing

- [ ] Login con usuario AD funciona
- [ ] JWT claims contienen roles correctos
- [ ] RBAC funciona (ADMIN vs OPERATOR vs VIEWER)
- [ ] Token refresh funciona
- [ ] Logout funciona
- [ ] Endpoints protegidos rechazan acceso sin token

---

## 🚀 Próximos Pasos

### Fase 1: Configuración (1-2 días)
1. Configurar Keycloak User Federation con AD
2. Mapear grupos AD → roles Keycloak
3. Configurar cliente admin-portal
4. Testear login con usuarios AD

### Fase 2: Backend (1 día)
1. Configurar OAuth2 Resource Server
2. Configurar JWT validation
3. Habilitar read-only mode para usuarios
4. Testing de endpoints con JWT real

### Fase 3: Frontend (1 día)
1. Integrar Keycloak JS client
2. Implementar login flow
3. Implementar token management
4. Testing de integración

### Fase 4: Testing & Deploy (1-2 días)
1. E2E testing con usuarios AD reales
2. Security testing
3. Performance testing
4. Deploy a staging
5. UAT (User Acceptance Testing)

---

## 📚 Referencias

- [Keycloak LDAP/AD Federation](https://www.keycloak.org/docs/latest/server_admin/#_ldap)
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
- [JWT.io](https://jwt.io/) - JWT debugger
- [Keycloak JS Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)

---

**Documento creado:** 30 de noviembre de 2025  
**Última actualización:** 30 de noviembre de 2025  
**Owner:** Architect + Security Team  
**Status:** ✅ Documentado - Pendiente Configuración Keycloak

