# 🏢 Guía de Migración: Keycloak Local → Keycloak Corporativo

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Pre-requisitos](#pre-requisitos)
3. [Diferencias: Local vs Corporativo](#diferencias-local-vs-corporativo)
4. [Proceso de Migración](#proceso-de-migración)
5. [Configuración Spring Boot](#configuración-spring-boot)
6. [Mapeo de Roles](#mapeo-de-roles)
7. [Testing en UAT](#testing-en-uat)
8. [Despliegue a Producción](#despliegue-a-producción)
9. [Rollback Plan](#rollback-plan)
10. [Troubleshooting](#troubleshooting)

---

## 1. Resumen Ejecutivo

Esta guía documenta el proceso de migración desde el **Keycloak local (Docker)** usado en desarrollo, hacia el **Keycloak corporativo** gestionado por IT/Seguridad para los entornos UAT y Producción.

### Impacto Estimado:
- **Código de aplicación:** ❌ Sin cambios (OAuth2 estándar)
- **Configuración:** ✅ Cambio de 2-5 líneas en `application.yml`
- **Testing requerido:** ✅ Pruebas de integración en UAT
- **Downtime:** ❌ Ninguno (deployment estándar)

---

## 2. Pre-requisitos

### 2.1 Coordinación con IT/Seguridad

Antes de iniciar la migración, coordinar con:

- [ ] **Equipo de Seguridad/IAM:** Para acceso al Keycloak corporativo
- [ ] **Arquitectura:** Para validar el diseño de integración
- [ ] **Operaciones:** Para el plan de despliegue

### 2.2 Información Requerida del Keycloak Corporativo

Solicitar a IT/Seguridad:

| Información | Ejemplo | Descripción |
|-------------|---------|-------------|
| **Realm Name** | `banking-apps` o `signature-services` | Realm asignado al proyecto |
| **Issuer URI** | `https://sso.empresa.com/realms/banking-apps` | URL base del realm |
| **Client ID** | `signature-router-api` | Identificador del cliente OAuth2 |
| **Client Secret** | `<secreto-generado>` | Credencial confidencial (guardar en Vault) |
| **JWKS URI** | `https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/certs` | Endpoint de claves públicas |
| **Mapeo de Roles** | Ver sección 6 | Cómo se llaman los roles en el realm corporativo |
| **Grupos AD/LDAP** | `CN=SignatureAdmins,OU=Apps,DC=empresa,DC=com` | Grupos de AD mapeados a roles |

### 2.3 Accesos Necesarios

- [ ] VPN corporativa (si aplica)
- [ ] Acceso a Keycloak Admin Console (solo para testing UAT)
- [ ] Credenciales de prueba en UAT
- [ ] Vault corporativo (para guardar `client_secret`)

---

## 3. Diferencias: Local vs Corporativo

### 3.1 Tabla Comparativa

| Aspecto | Keycloak Local (Desarrollo) | Keycloak Corporativo (UAT/Prod) |
|---------|----------------------------|----------------------------------|
| **URL** | `http://localhost:8180` | `https://sso.empresa.com` |
| **Realm** | `signature-router` | `banking-apps` (o asignado por IT) |
| **Base de Datos** | PostgreSQL dedicado (puerto `5433`, DB `keycloak`) | PostgreSQL corporativo (gestionado por IT) |
| **Usuarios** | Creados manualmente (admin, user, etc.) | Sincronizados desde AD/LDAP |
| **Autenticación** | Password simple | AD/LDAP + 2FA/MFA corporativo |
| **Roles** | `ADMIN`, `USER`, `SUPPORT`, `AUDITOR` | Pueden tener prefijos: `APP_SIGNATURE_ADMIN` |
| **Client Secret** | Hardcoded en `application-local.yml` | Almacenado en Vault corporativo |
| **Certificados SSL** | No requerido (HTTP) | Requerido (HTTPS) |
| **Gestión** | Desarrolladores | IT/Seguridad |
| **Disponibilidad** | Local, puede detenerse | Alta disponibilidad (cluster) |

### 3.2 Ventajas del Keycloak Corporativo

✅ **Single Sign-On (SSO):** Usuarios autenticados con credenciales corporativas  
✅ **Integración AD/LDAP:** Sincronización automática de usuarios y grupos  
✅ **Políticas de seguridad centralizadas:** Password policies, 2FA, lockout  
✅ **Auditoría corporativa:** Todos los logins/logouts registrados  
✅ **Alta disponibilidad:** Cluster con failover automático  
✅ **Gestión centralizada:** IT gestiona usuarios, roles, y políticas  

---

## 4. Proceso de Migración

### 4.1 Fase 1: Solicitud y Configuración Inicial

#### Paso 1: Solicitar Onboarding a Keycloak Corporativo

**Ticket a IT/Seguridad:**

```
Asunto: Solicitud de Onboarding - Signature Router API en Keycloak Corporativo

Descripción:
- Aplicación: Signature Router
- Entornos: UAT, Producción
- Protocolo: OAuth2 / OpenID Connect
- Grant Types requeridos: Authorization Code, Client Credentials
- Redirect URIs (UAT): https://signature-router-uat.empresa.com/*
- Redirect URIs (Prod): https://signature-router.empresa.com/*
- Roles necesarios:
  - ADMIN (administradores del sistema)
  - USER (usuarios estándar)
  - SUPPORT (equipo de soporte, read-only)
  - AUDITOR (auditores, read-only logs)
- Scopes: profile, email, roles
```

#### Paso 2: Recibir Credenciales

IT/Seguridad proveerá:
- ✅ Realm asignado
- ✅ Client ID
- ✅ Client Secret (guardar en Vault inmediatamente)
- ✅ Issuer URI
- ✅ JWKS URI
- ✅ Documentación de mapeo de roles/grupos

---

### 4.2 Fase 2: Configuración en UAT

#### Paso 1: Crear `application-uat.yml`

```yaml
# src/main/resources/application-uat.yml

spring:
  application:
    name: signature-router
  
  profiles:
    active: uat
  
  # Keycloak Corporativo - UAT
  security:
    oauth2:
      resourceserver:
        jwt:
          # Issuer URI del Keycloak corporativo
          issuer-uri: https://sso.empresa.com/realms/banking-apps
          
          # JWKS URI para validar firmas de tokens
          jwk-set-uri: https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/certs
          
          # Opcional: audiences esperadas en el token
          # audiences: signature-router-api

  # PostgreSQL - UAT
  datasource:
    url: jdbc:postgresql://db-uat.empresa.com:5432/signature_router_uat
    username: ${DB_USERNAME}  # Desde variable de entorno
    password: ${DB_PASSWORD}  # Desde Vault
    
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 5000
      idle-timeout: 600000
      max-lifetime: 1800000

  # Liquibase - UAT
  liquibase:
    enabled: true
    change-log: classpath:liquibase/changelog-master.yaml
    contexts: uat

  # JPA - UAT
  jpa:
    hibernate:
      ddl-auto: validate  # Liquibase gestiona el schema
    show-sql: false  # No loguear SQL en UAT

# Logging - UAT
logging:
  level:
    root: INFO
    com.singularbank.signature.routing: INFO
    org.springframework.security: INFO
  file:
    name: /var/log/signature-router/application.log
    max-size: 100MB
    max-history: 30

# Actuator - UAT
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized  # Solo admins ven detalles

# Providers - UAT (credenciales desde Vault)
providers:
  twilio:
    enabled: true
    timeout-seconds: 5
    retry-max-attempts: 3
    account-sid: ${TWILIO_ACCOUNT_SID}  # Desde Vault
    auth-token: ${TWILIO_AUTH_TOKEN}    # Desde Vault
    from-number: ${TWILIO_FROM_NUMBER}  # Desde Vault
```

#### Paso 2: Actualizar Vault con Credenciales Corporativas

```bash
# Conectar a Vault UAT
export VAULT_ADDR="https://vault-uat.empresa.com"
export VAULT_TOKEN="<tu-token-uat>"

# Guardar Client Secret de Keycloak
vault kv put secret/signature-router-uat/keycloak \
  client_id="signature-router-api" \
  client_secret="<secreto-provisto-por-IT>"

# Guardar credenciales de base de datos
vault kv put secret/signature-router-uat/database \
  username="signature_app_uat" \
  password="<password-generado>"

# Guardar credenciales de Twilio
vault kv put secret/signature-router-uat/twilio \
  account_sid="ACxxxxxxxxxxxxxxxxx" \
  auth_token="xxxxxxxxxxxxxxxxxx" \
  from_number="+34912345678"
```

---

### 4.3 Fase 3: Ajustar Mapeo de Roles (Si es necesario)

Si el Keycloak corporativo usa nombres de roles diferentes, actualizar `JwtAuthenticationConverter`:

#### Opción A: Roles con Prefijo Corporativo

Si IT asigna roles como `APP_SIGNATURE_ADMIN`, `APP_SIGNATURE_USER`:

```java
// src/main/java/com/bank/signature/infrastructure/config/security/CorporateJwtAuthenticationConverter.java

package com.singularbank.signature.routing.infrastructure.config.security;

import org.springframework.context.annotation.Profile;
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

/**
 * Mapea roles del Keycloak corporativo a roles de la aplicación.
 * 
 * Mapeo:
 * - APP_SIGNATURE_ADMIN → ROLE_ADMIN
 * - APP_SIGNATURE_USER → ROLE_USER
 * - APP_SIGNATURE_SUPPORT → ROLE_SUPPORT
 * - APP_SIGNATURE_AUDITOR → ROLE_AUDITOR
 */
@Component
@Profile({"uat", "prod"})  // Solo para entornos corporativos
public class CorporateJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        return new JwtAuthenticationToken(jwt, authorities);
    }
    
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        // Keycloak corporativo puede usar "realm_access.roles" o "groups"
        List<String> roles = jwt.getClaimAsStringList("realm_access.roles");
        
        if (roles == null || roles.isEmpty()) {
            // Fallback a "groups" si no hay roles
            roles = jwt.getClaimAsStringList("groups");
        }
        
        return roles.stream()
                .map(this::mapCorporateRoleToAppRole)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
    }
    
    /**
     * Mapea roles corporativos a roles de la aplicación.
     */
    private String mapCorporateRoleToAppRole(String corporateRole) {
        return switch (corporateRole) {
            case "APP_SIGNATURE_ADMIN" -> "ADMIN";
            case "APP_SIGNATURE_USER" -> "USER";
            case "APP_SIGNATURE_SUPPORT" -> "SUPPORT";
            case "APP_SIGNATURE_AUDITOR" -> "AUDITOR";
            default -> corporateRole;  // Devolver sin cambios si no hay mapeo
        };
    }
}
```

#### Opción B: Grupos de AD/LDAP

Si IT mapea grupos de Active Directory a roles:

```java
/**
 * Mapea grupos de AD/LDAP a roles de la aplicación.
 * 
 * Ejemplo de grupos:
 * - CN=SignatureAdmins,OU=Apps,DC=empresa,DC=com → ROLE_ADMIN
 * - CN=SignatureUsers,OU=Apps,DC=empresa,DC=com → ROLE_USER
 */
private String mapADGroupToAppRole(String adGroup) {
    // Extraer CN del Distinguished Name
    String groupName = extractCN(adGroup);
    
    return switch (groupName) {
        case "SignatureAdmins" -> "ADMIN";
        case "SignatureUsers" -> "USER";
        case "SignatureSupport" -> "SUPPORT";
        case "SignatureAuditors" -> "AUDITOR";
        default -> groupName;
    };
}

private String extractCN(String dn) {
    // Extraer CN de "CN=SignatureAdmins,OU=Apps,DC=empresa,DC=com"
    if (dn.startsWith("CN=")) {
        return dn.substring(3, dn.indexOf(','));
    }
    return dn;
}
```

---

## 5. Configuración Spring Boot

### 5.1 Resumen de Cambios por Entorno

#### **Local (Desarrollo):**
```yaml
# application-local.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/signature-router
```

#### **UAT:**
```yaml
# application-uat.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://sso.empresa.com/realms/banking-apps
          jwk-set-uri: https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/certs
```

#### **Producción:**
```yaml
# application-prod.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://sso.empresa.com/realms/banking-apps
          jwk-set-uri: https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/certs
```

### 5.2 Externalización de URLs (Recomendado)

Para mayor flexibilidad, usar variables de entorno:

```yaml
# application-uat.yml / application-prod.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI}
          jwk-set-uri: ${KEYCLOAK_JWKS_URI}
```

**Variables de entorno (Kubernetes/Docker):**
```bash
KEYCLOAK_ISSUER_URI=https://sso.empresa.com/realms/banking-apps
KEYCLOAK_JWKS_URI=https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/certs
```

---

## 6. Mapeo de Roles

### 6.1 Escenarios Comunes

#### Escenario 1: Roles Directos (sin prefijo)

Si IT configura los roles exactamente como en local:
- `ADMIN`, `USER`, `SUPPORT`, `AUDITOR`

**✅ NO requiere cambios en código.**

#### Escenario 2: Roles con Prefijo de Aplicación

Si IT usa prefijos por aplicación:
- `APP_SIGNATURE_ADMIN` → `ADMIN`
- `APP_SIGNATURE_USER` → `USER`

**✅ Implementar `CorporateJwtAuthenticationConverter`** (ver sección 4.3)

#### Escenario 3: Grupos de AD/LDAP

Si IT mapea grupos de Active Directory:
- `CN=SignatureAdmins,OU=Apps,DC=empresa,DC=com` → `ADMIN`

**✅ Implementar extracción de CN** (ver sección 4.3, Opción B)

### 6.2 Testing del Mapeo

Crear un endpoint temporal para verificar roles:

```java
// src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/debug/DebugAuthController.java

package com.singularbank.signature.routing.infrastructure.adapter.inbound.rest.debug;

import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Endpoint temporal para debugging de autenticación en UAT.
 * ⚠️ ELIMINAR antes de producción.
 */
@RestController
@RequestMapping("/api/v1/debug")
@Profile("uat")  // Solo disponible en UAT
public class DebugAuthController {
    
    @GetMapping("/whoami")
    public Map<String, Object> whoami(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        if (authentication == null) {
            response.put("authenticated", false);
            return response;
        }
        
        response.put("authenticated", true);
        response.put("principal", authentication.getName());
        response.put("authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        
        // Si es JWT, mostrar claims
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            response.put("claims", jwt.getClaims());
            response.put("issuer", jwt.getIssuer());
            response.put("subject", jwt.getSubject());
            response.put("expiresAt", jwt.getExpiresAt());
        }
        
        return response;
    }
}
```

**Probar en UAT:**
```bash
curl -H "Authorization: Bearer <token-uat>" \
  https://signature-router-uat.empresa.com/api/v1/debug/whoami
```

**Respuesta esperada:**
```json
{
  "authenticated": true,
  "principal": "juan.perez@empresa.com",
  "authorities": [
    "ROLE_ADMIN",
    "ROLE_USER"
  ],
  "claims": {
    "sub": "abc123-def456-...",
    "preferred_username": "juan.perez",
    "email": "juan.perez@empresa.com",
    "realm_access": {
      "roles": ["APP_SIGNATURE_ADMIN", "APP_SIGNATURE_USER"]
    },
    "groups": ["CN=SignatureAdmins,OU=Apps,DC=empresa,DC=com"]
  },
  "issuer": "https://sso.empresa.com/realms/banking-apps",
  "expiresAt": "2025-11-27T21:00:00Z"
}
```

**⚠️ IMPORTANTE:** Eliminar este endpoint antes de desplegar a producción.

---

## 7. Testing en UAT

### 7.1 Pre-deployment Checklist

Antes de desplegar a UAT:

- [ ] Credenciales guardadas en Vault UAT
- [ ] `application-uat.yml` configurado con URLs corporativas
- [ ] Mapeo de roles implementado (si aplica)
- [ ] Endpoint de debug agregado (temporal)
- [ ] Variables de entorno configuradas en deployment

### 7.2 Pruebas Funcionales

#### Test 1: Obtener Token de Keycloak Corporativo

```bash
# Obtener token con credenciales corporativas
curl -X POST "https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=signature-router-api" \
  -d "client_secret=<secreto-de-vault>" \
  -d "grant_type=password" \
  -d "username=juan.perez@empresa.com" \
  -d "password=<password-corporativo>"
```

**Verificar:**
- ✅ `access_token` recibido
- ✅ `expires_in: 3600` (o según políticas corporativas)
- ✅ `token_type: "Bearer"`

#### Test 2: Validar Roles en el Token

Decodificar el token en https://jwt.io y verificar:

```json
{
  "realm_access": {
    "roles": ["APP_SIGNATURE_ADMIN", "APP_SIGNATURE_USER"]
  },
  "preferred_username": "juan.perez",
  "email": "juan.perez@empresa.com"
}
```

#### Test 3: Endpoint Protegido con Rol ADMIN

```bash
# Usar token corporativo
curl -H "Authorization: Bearer <token-uat>" \
  https://signature-router-uat.empresa.com/api/v1/admin/providers/health
```

**Resultado esperado:** `200 OK`

#### Test 4: Endpoint Protegido con Rol USER (Acceso Denegado)

```bash
# Obtener token de usuario SIN rol ADMIN
curl -X POST "https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/token" \
  -d "username=maria.lopez@empresa.com" \
  -d "password=<password>" \
  ...

# Intentar acceder a endpoint admin
curl -H "Authorization: Bearer <token-user>" \
  https://signature-router-uat.empresa.com/api/v1/admin/providers/health
```

**Resultado esperado:** `403 FORBIDDEN`

#### Test 5: Flujo Completo End-to-End

1. Autenticarse con Keycloak corporativo
2. Crear signature request
3. Verificar challenge
4. Consultar estado
5. Verificar eventos publicados en Kafka

### 7.3 Pruebas de Integración

```bash
# Ejecutar tests de integración contra UAT
mvn clean verify -Puat -Dspring.profiles.active=uat

# O con variables de entorno
export KEYCLOAK_ISSUER_URI="https://sso.empresa.com/realms/banking-apps"
export KEYCLOAK_JWKS_URI="https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/certs"
mvn clean verify
```

### 7.4 Smoke Tests

Checklist mínimo después de deployment:

- [ ] Health check: `GET /actuator/health` → `200 OK`
- [ ] Provider health (con token admin): `GET /api/v1/admin/providers/health` → `200 OK`
- [ ] Crear signature request: `POST /api/v1/signatures` → `201 CREATED`
- [ ] Token inválido: `GET /api/v1/admin/providers/health` (sin token) → `401 UNAUTHORIZED`
- [ ] Rol insuficiente: `GET /api/v1/admin/**` (con rol USER) → `403 FORBIDDEN`

---

## 8. Despliegue a Producción

### 8.1 Checklist Pre-Producción

- [ ] **Testing UAT completado:** Todos los smoke tests passed
- [ ] **Aprobación de Seguridad:** IT/Seguridad aprueba la integración
- [ ] **Credenciales en Vault Prod:** Client secret guardado en Vault productivo
- [ ] **Configuración revisada:** `application-prod.yml` validado
- [ ] **Endpoint de debug eliminado:** `DebugAuthController.java` removido del código
- [ ] **Logs sanitizados:** No se loguean tokens o credenciales
- [ ] **Plan de rollback:** Documentado y aprobado
- [ ] **Monitoreo configurado:** Alertas en Grafana para errores de autenticación

### 8.2 Deployment

```bash
# Build de producción
mvn clean package -Pprod -DskipTests

# Desplegar (ejemplo con Kubernetes)
kubectl apply -f k8s/signature-router-prod.yaml

# Verificar pods
kubectl get pods -n banking-apps -l app=signature-router

# Ver logs
kubectl logs -f deployment/signature-router -n banking-apps
```

### 8.3 Post-Deployment Validation

```bash
# 1. Health check
curl https://signature-router.empresa.com/actuator/health

# 2. Obtener token de producción
curl -X POST "https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/token" \
  -d "client_id=signature-router-api" \
  -d "client_secret=<vault-prod-secret>" \
  -d "grant_type=client_credentials"

# 3. Verificar endpoint protegido
curl -H "Authorization: Bearer <prod-token>" \
  https://signature-router.empresa.com/api/v1/admin/providers/health

# 4. Monitorear logs de autenticación
kubectl logs -f deployment/signature-router -n banking-apps | grep "JWT\|OAuth2\|Authentication"
```

---

## 9. Rollback Plan

### 9.1 Escenario: Keycloak Corporativo no disponible

**Síntomas:**
- `500 Internal Server Error` en endpoints protegidos
- Logs: `Unable to resolve configuration from issuer`
- Métricas: Spike en errores de autenticación

**Rollback:**

#### Opción 1: Rollback a versión anterior (Recomendado)

```bash
# Rollback a deployment anterior
kubectl rollout undo deployment/signature-router -n banking-apps

# Verificar rollback
kubectl rollout status deployment/signature-router -n banking-apps
```

#### Opción 2: Cambiar a fallback temporal

Si necesitas mantener la nueva versión pero Keycloak corporativo está caído:

```bash
# Actualizar ConfigMap para usar Keycloak local temporalmente
kubectl edit configmap signature-router-config -n banking-apps

# Cambiar:
# KEYCLOAK_ISSUER_URI: https://sso.empresa.com/realms/banking-apps
# A:
# KEYCLOAK_ISSUER_URI: http://keycloak-backup.internal/realms/signature-router

# Reiniciar pods
kubectl rollout restart deployment/signature-router -n banking-apps
```

### 9.2 Escenario: Mapeo de roles incorrecto

**Síntomas:**
- Usuarios reciben `403 FORBIDDEN` aunque tienen permisos
- Logs: `Access Denied - Required role: ADMIN, User has: []`

**Fix rápido:**

```bash
# Desplegar hotfix con mapeo corregido
# 1. Corregir CorporateJwtAuthenticationConverter.java
# 2. Build y deploy de parche

kubectl set image deployment/signature-router \
  signature-router=registry.empresa.com/signature-router:v1.2.1-hotfix \
  -n banking-apps
```

---

## 10. Troubleshooting

### 10.1 Error: `401 Unauthorized` con token válido

**Causa:** Spring Boot no puede validar la firma del JWT con Keycloak.

**Diagnóstico:**
```bash
# Verificar conectividad a JWKS endpoint
curl https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/certs

# Ver logs de Spring Security
kubectl logs deployment/signature-router -n banking-apps | grep "JwtDecoder\|JWKS"
```

**Solución:**
- Verificar que `jwk-set-uri` es correcto
- Verificar que la aplicación puede alcanzar Keycloak (firewall, VPN)
- Verificar certificados SSL si Keycloak usa HTTPS con certificado interno

---

### 10.2 Error: `403 Forbidden` para usuario con rol correcto

**Causa:** Mapeo de roles incorrecto.

**Diagnóstico:**
```bash
# Usar endpoint de debug (UAT)
curl -H "Authorization: Bearer <token>" \
  https://signature-router-uat.empresa.com/api/v1/debug/whoami

# Verificar "authorities" en la respuesta
```

**Solución:**
- Verificar que `CorporateJwtAuthenticationConverter` mapea correctamente
- Verificar que los roles en Keycloak tienen el prefijo `ROLE_` en Spring Security
- Revisar logs: `User authorities: [ROLE_USER], Required: [ROLE_ADMIN]`

---

### 10.3 Error: `Unable to resolve configuration from issuer`

**Causa:** Keycloak no está disponible o URL incorrecta.

**Diagnóstico:**
```bash
# Verificar well-known endpoint
curl https://sso.empresa.com/realms/banking-apps/.well-known/openid-configuration

# Debe devolver configuración de OpenID Connect
```

**Solución:**
- Verificar conectividad de red (VPN, firewall)
- Verificar que `issuer-uri` es correcto
- Contactar a IT si Keycloak está caído

---

### 10.4 Error: Token expira muy rápido

**Causa:** Políticas corporativas de expiración de tokens.

**Solución:**
Implementar refresh token flow:

```java
// Guardar refresh_token al obtener access_token
String refreshToken = tokenResponse.getRefreshToken();

// Cuando access_token expire, usar refresh_token
curl -X POST "https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/token" \
  -d "client_id=signature-router-api" \
  -d "client_secret=<secret>" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=<refresh_token>"
```

---

## 11. Contactos y Recursos

### 11.1 Equipos Responsables

| Equipo | Responsabilidad | Contacto |
|--------|-----------------|----------|
| **IT/Seguridad** | Gestión de Keycloak corporativo | it-security@empresa.com |
| **Operaciones** | Deployment y monitoreo | ops@empresa.com |
| **Arquitectura** | Validación de diseño | architecture@empresa.com |
| **Desarrollo Signature Router** | Implementación y soporte | dev-team@empresa.com |

### 11.2 Documentación Relacionada

- [KEYCLOAK-SETUP.md](KEYCLOAK-SETUP.md) - Setup local para desarrollo
- [SEGURIDAD-KEYCLOAK-RESUMEN.md](SEGURIDAD-KEYCLOAK-RESUMEN.md) - Resumen de implementación OAuth2
- [LECCIONES-APRENDIDAS-SPRING-BOOT.md](LECCIONES-APRENDIDAS-SPRING-BOOT.md) - Troubleshooting general
- [GUIA-PRUEBAS-POSTMAN.md](GUIA-PRUEBAS-POSTMAN.md) - Guía de testing con Postman

### 11.3 URLs Corporativas (Ejemplo - Actualizar según tu organización)

| Entorno | Keycloak URL | Realm | Aplicación URL |
|---------|-------------|-------|----------------|
| **UAT** | https://sso-uat.empresa.com | banking-apps | https://signature-router-uat.empresa.com |
| **Producción** | https://sso.empresa.com | banking-apps | https://signature-router.empresa.com |

---

## 12. Anexos

### Anexo A: Ejemplo de Token JWT Corporativo

```json
{
  "exp": 1732730000,
  "iat": 1732726400,
  "jti": "uuid-123-456",
  "iss": "https://sso.empresa.com/realms/banking-apps",
  "aud": "signature-router-api",
  "sub": "abc123-def456-789",
  "typ": "Bearer",
  "azp": "signature-router-api",
  "session_state": "session-uuid",
  "acr": "1",
  "realm_access": {
    "roles": [
      "APP_SIGNATURE_ADMIN",
      "APP_SIGNATURE_USER"
    ]
  },
  "resource_access": {
    "signature-router-api": {
      "roles": ["ADMIN", "USER"]
    }
  },
  "scope": "profile email",
  "sid": "session-id",
  "email_verified": true,
  "name": "Juan Pérez García",
  "preferred_username": "juan.perez",
  "given_name": "Juan",
  "family_name": "Pérez García",
  "email": "juan.perez@empresa.com",
  "groups": [
    "CN=SignatureAdmins,OU=Apps,DC=empresa,DC=com",
    "CN=AllUsers,OU=Groups,DC=empresa,DC=com"
  ],
  "employeeId": "EMP-12345",
  "department": "IT"
}
```

### Anexo B: Ejemplo de ConfigMap para Kubernetes

```yaml
# k8s/configmap-prod.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: signature-router-config
  namespace: banking-apps
data:
  SPRING_PROFILES_ACTIVE: "prod"
  KEYCLOAK_ISSUER_URI: "https://sso.empresa.com/realms/banking-apps"
  KEYCLOAK_JWKS_URI: "https://sso.empresa.com/realms/banking-apps/protocol/openid-connect/certs"
  DB_HOST: "db-prod.empresa.com"
  DB_PORT: "5432"
  DB_NAME: "signature_router_prod"
  KAFKA_BOOTSTRAP_SERVERS: "kafka-prod.empresa.com:9092"
  VAULT_ADDR: "https://vault-prod.empresa.com"
```

### Anexo C: Checklist de Migración Completo

```markdown
## Checklist de Migración - Keycloak Corporativo

### Pre-Migración
- [ ] Solicitud de onboarding a IT/Seguridad enviada
- [ ] Realm asignado recibido
- [ ] Client ID y Client Secret recibidos
- [ ] Documentación de mapeo de roles recibida
- [ ] Acceso a Keycloak Admin Console (UAT) otorgado
- [ ] Credenciales de prueba UAT recibidas

### Configuración
- [ ] `application-uat.yml` creado con URLs corporativas
- [ ] `application-prod.yml` creado con URLs corporativas
- [ ] Client Secret guardado en Vault UAT
- [ ] Client Secret guardado en Vault Prod
- [ ] Mapeo de roles implementado (si aplica)
- [ ] Endpoint de debug creado (temporal, solo UAT)

### Testing UAT
- [ ] Token obtenido exitosamente de Keycloak corporativo
- [ ] Roles mapeados correctamente (verificado con /debug/whoami)
- [ ] Health check funciona (público)
- [ ] Provider health funciona (requiere ADMIN)
- [ ] Crear signature request funciona (requiere USER)
- [ ] Acceso denegado para roles incorrectos (403)
- [ ] Token inválido rechazado (401)
- [ ] Tests de integración passed
- [ ] Smoke tests completados

### Pre-Producción
- [ ] Aprobación de Seguridad obtenida
- [ ] Plan de rollback documentado y aprobado
- [ ] Endpoint de debug eliminado del código
- [ ] Build de producción generado
- [ ] Deployment scripts validados
- [ ] Monitoreo y alertas configuradas
- [ ] Runbook de troubleshooting actualizado

### Deployment Producción
- [ ] Deployment ejecutado exitosamente
- [ ] Health check passed
- [ ] Token de producción obtenido exitosamente
- [ ] Smoke tests en producción passed
- [ ] Logs monitoreados (sin errores)
- [ ] Métricas normales (sin spikes de errores)

### Post-Deployment
- [ ] Documentación actualizada con URLs productivas
- [ ] Equipo de soporte notificado
- [ ] Monitoreo 24h sin incidentes
- [ ] Retrospectiva de migración completada
```

---

## Conclusión

Esta guía proporciona un proceso paso a paso para migrar desde el **Keycloak local de desarrollo** hacia el **Keycloak corporativo** en UAT y Producción.

La arquitectura OAuth2 implementada es **estándar y portable**, lo que facilita la migración con cambios mínimos de configuración (2-5 líneas en `application.yml`).

**Puntos clave:**
- ✅ Migración de bajo riesgo (solo configuración)
- ✅ Testing exhaustivo en UAT antes de producción
- ✅ Plan de rollback documentado
- ✅ Monitoreo y troubleshooting cubiertos

---

**Última actualización:** 2025-11-27  
**Versión:** 1.0  
**Autor:** Equipo de Desarrollo Signature Router

