# User Source Configuration Guide

**Proyecto:** Signature Router  
**Epic:** Epic 12 - Admin Panel Integration  
**Fecha:** 30 de noviembre de 2025

---

## 🎯 Overview

El sistema Admin Panel soporta **3 modos configurables** para la gestión de usuarios:

| Modo | Descripción | CRUD | Casos de Uso |
|------|-------------|------|--------------|
| **MOCK** | Usuarios mock en memoria | ✅ Full | Development, demos, testing |
| **LOCAL** | Usuarios en Keycloak local | ✅ Full | Standalone deployments, testing |
| **ACTIVE_DIRECTORY** | Usuarios desde AD (federado) | ❌ Read-only | Enterprise production |

---

## ⚙️ Configuración

### Archivo: `application.yml`

```yaml
admin:
  portal:
    user-management:
      # Opciones: MOCK, LOCAL, ACTIVE_DIRECTORY
      mode: MOCK
```

### Variables de Entorno

```bash
# Development
ADMIN_PORTAL_USER_MANAGEMENT_MODE=MOCK

# Staging con Keycloak local
ADMIN_PORTAL_USER_MANAGEMENT_MODE=LOCAL

# Production con Active Directory
ADMIN_PORTAL_USER_MANAGEMENT_MODE=ACTIVE_DIRECTORY
```

---

## 📋 Modo MOCK (Development)

### Características

- ✅ **Usuarios en memoria** - No requiere Keycloak
- ✅ **CRUD completo** - Crear, modificar, eliminar usuarios
- ✅ **Datos realistas** - 4 usuarios pre-cargados
- ✅ **Ideal para desarrollo** - Sin dependencias externas

### Configuración

```yaml
# application-dev.yml
admin:
  portal:
    user-management:
      mode: MOCK
```

### Usuarios Pre-cargados

| Username | Email | Roles | Enabled |
|----------|-------|-------|---------|
| `admin` | admin@singularbank.com | ADMIN, OPERATOR, VIEWER | ✅ |
| `operator1` | operator@singularbank.com | OPERATOR, VIEWER | ✅ |
| `viewer1` | viewer@singularbank.com | VIEWER | ✅ |
| `disabled_user` | disabled@singularbank.com | VIEWER | ❌ |

### Testing

```bash
# Iniciar en modo MOCK
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Test endpoints (sin autenticación en dev)
curl http://localhost:8080/api/v1/admin/users

# Crear usuario (funciona en MOCK)
curl -X POST http://localhost:8080/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@singularbank.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPass123!",
    "roles": ["VIEWER"]
  }'
```

---

## 🏢 Modo LOCAL (Keycloak Local)

### Características

- ✅ **Usuarios en Keycloak** - Almacenados en base de datos Keycloak
- ✅ **CRUD completo** - Full management via API
- ✅ **Autenticación real** - OAuth2 JWT
- ✅ **Ideal para staging** - Entorno controlado

### Configuración

```yaml
# application-staging.yml
admin:
  portal:
    user-management:
      mode: LOCAL

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak-staging.singularbank.com/realms/signature-router
          jwk-set-uri: https://keycloak-staging.singularbank.com/realms/signature-router/protocol/openid-connect/certs
```

### Prerequisitos

1. **Keycloak instalado y configurado**
2. **Realm creado:** `signature-router`
3. **Client configurado:** `admin-portal`
4. **Roles creados:** ADMIN, OPERATOR, VIEWER, SUPPORT

### Testing

```bash
# 1. Obtener token
TOKEN=$(curl -X POST "https://keycloak-staging.singularbank.com/realms/signature-router/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-portal" \
  | jq -r '.access_token')

# 2. Listar usuarios
curl -X GET "http://localhost:8080/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN"

# 3. Crear usuario (funciona en LOCAL)
curl -X POST "http://localhost:8080/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@singularbank.com",
    "firstName": "New",
    "lastName": "User",
    "password": "SecurePass123!",
    "roles": ["VIEWER"]
  }'
```

---

## 🔐 Modo ACTIVE_DIRECTORY (Production)

### Características

- ✅ **Usuarios desde AD** - Federación via Keycloak LDAP
- ❌ **Solo lectura** - POST/PUT/DELETE retornan 403
- ✅ **Autenticación AD** - Usuarios se autentican con credenciales AD
- ✅ **Ideal para producción** - Integración enterprise

### Configuración

```yaml
# application-prod.yml
admin:
  portal:
    user-management:
      mode: ACTIVE_DIRECTORY

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.singularbank.com/realms/signature-router
          jwk-set-uri: https://keycloak.singularbank.com/realms/signature-router/protocol/openid-connect/certs
```

### Prerequisitos

1. **Keycloak con User Federation configurada**
2. **Active Directory accesible**
3. **Grupos AD creados:** `SingularBank-SignatureRouter-*`
4. **Mapeo grupos → roles configurado**

Ver: [KEYCLOAK-USER-FEDERATION-SETUP.md](KEYCLOAK-USER-FEDERATION-SETUP.md)

### Endpoints Disponibles

| Endpoint | Método | Disponible | Resultado |
|----------|--------|------------|-----------|
| List users | GET | ✅ | Lista usuarios desde AD |
| Get user | GET | ✅ | Detalles de usuario AD |
| Create user | POST | ❌ | HTTP 403 + mensaje "Contact IT" |
| Update user | PUT | ❌ | HTTP 403 + mensaje "Contact IT" |
| Delete user | DELETE | ❌ | HTTP 403 + mensaje "Contact IT" |
| Update roles | PUT | ❌ | HTTP 403 + mensaje "Contact IT" |

### Mensaje de Error (ACTIVE_DIRECTORY mode)

```json
{
  "error": "Read-only mode",
  "message": "User management is in read-only mode. Users are managed in Active Directory. Contact your IT administrator to create/modify/delete users.",
  "action": "Contact your IT administrator to create users in Active Directory"
}
```

### Testing

```bash
# 1. Login con usuario AD
TOKEN=$(curl -X POST "https://keycloak.singularbank.com/realms/signature-router/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=juan.perez" \
  -d "password=[AD password]" \
  -d "grant_type=password" \
  -d "client_id=admin-portal" \
  | jq -r '.access_token')

# 2. Listar usuarios (FUNCIONA)
curl -X GET "https://api.singularbank.com/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN"

# 3. Crear usuario (FALLA con 403)
curl -X POST "https://api.singularbank.com/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@singularbank.com",
    "firstName": "New",
    "lastName": "User",
    "password": "SecurePass123!",
    "roles": ["VIEWER"]
  }'

# Resultado esperado: HTTP 403
# {
#   "error": "Read-only mode",
#   "message": "User management is in read-only mode. Users are managed in Active Directory. Contact your IT administrator to create/modify/delete users.",
#   "action": "Contact your IT administrator to create users in Active Directory"
# }
```

---

## 🔄 Switching Between Modes

### Development → Staging

```bash
# 1. Change configuration
# application-staging.yml
admin:
  portal:
    user-management:
      mode: LOCAL  # Changed from MOCK

# 2. Setup Keycloak
# - Install Keycloak
# - Create realm: signature-router
# - Create client: admin-portal
# - Create roles: ADMIN, OPERATOR, VIEWER

# 3. Redeploy
./mvnw clean package -DskipTests
java -jar target/signature-router.jar --spring.profiles.active=staging
```

### Staging → Production

```bash
# 1. Change configuration
# application-prod.yml
admin:
  portal:
    user-management:
      mode: ACTIVE_DIRECTORY  # Changed from LOCAL

# 2. Setup Active Directory integration
# - Configure Keycloak User Federation (LDAP)
# - Create AD groups: SingularBank-SignatureRouter-*
# - Map AD groups → Keycloak roles
# - Assign users to AD groups

# 3. Redeploy
java -jar target/signature-router.jar --spring.profiles.active=prod
```

---

## 🧪 Testing Matrix

| Test Case | MOCK | LOCAL | ACTIVE_DIRECTORY |
|-----------|------|-------|------------------|
| **GET /users** | ✅ 4 mock users | ✅ Keycloak users | ✅ AD users |
| **GET /users/{id}** | ✅ Mock user | ✅ Keycloak user | ✅ AD user |
| **POST /users** | ✅ Creates in memory | ✅ Creates in Keycloak | ❌ HTTP 403 |
| **PUT /users/{id}** | ✅ Updates in memory | ✅ Updates in Keycloak | ❌ HTTP 403 |
| **DELETE /users/{id}** | ✅ Deletes from memory | ✅ Deletes from Keycloak | ❌ HTTP 403 |
| **PUT /users/{id}/roles** | ✅ Updates in memory | ✅ Updates in Keycloak | ❌ HTTP 403 |
| **Authentication** | ❌ No auth (dev) | ✅ OAuth2 JWT | ✅ OAuth2 JWT (AD) |
| **Roles from** | Mock data | Keycloak roles | AD groups mapped |

---

## 📊 Decision Matrix

### Cuándo usar cada modo?

| Escenario | Modo Recomendado | Justificación |
|-----------|------------------|---------------|
| **Desarrollo local** | MOCK | Sin dependencias externas |
| **Demos a stakeholders** | MOCK | Datos controlados y predecibles |
| **Testing automatizado** | MOCK | Tests rápidos y aislados |
| **Staging environment** | LOCAL | Keycloak real sin AD |
| **QA testing** | LOCAL | Ambiente controlado |
| **Production standalone** | LOCAL | Sin integración AD |
| **Production enterprise** | ACTIVE_DIRECTORY | Usuarios corporativos |
| **Production bank** | ACTIVE_DIRECTORY | Compliance y seguridad |

### Matriz de Decisión

```
¿Tienes Active Directory?
├─ NO → LOCAL (usuarios en Keycloak)
└─ SI → ¿Quieres gestionar usuarios desde portal?
    ├─ SI → LOCAL (sincronización unidireccional desde AD posible)
    └─ NO → ACTIVE_DIRECTORY (federación read-only)
```

---

## 🚀 Quick Start Examples

### Example 1: Developer Working on New Feature

```bash
# application.yml
admin:
  portal:
    user-management:
      mode: MOCK  # Quick start, no setup needed

# Run
./mvnw spring-boot:run

# Test immediately - no Keycloak needed!
curl http://localhost:8080/api/v1/admin/users
```

### Example 2: Staging Environment for UAT

```bash
# application-staging.yml
admin:
  portal:
    user-management:
      mode: LOCAL  # Real Keycloak, controlled users

# Deploy
docker-compose up -d  # Includes Keycloak
java -jar signature-router.jar --spring.profiles.active=staging

# QA can create test users
curl -X POST "http://staging:8080/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"qa-test-01", ...}'
```

### Example 3: Production Bank Deployment

```bash
# application-prod.yml
admin:
  portal:
    user-management:
      mode: ACTIVE_DIRECTORY  # Users from corporate AD

# Deploy
java -jar signature-router.jar --spring.profiles.active=prod

# Users from AD - managed by IT department
# Administrators use portal with AD credentials
# No user creation from portal (read-only)
```

---

## 📚 Related Documentation

- [KEYCLOAK-USER-FEDERATION-SETUP.md](KEYCLOAK-USER-FEDERATION-SETUP.md) - Setup Active Directory integration
- [AD-GROUPS-ROLES-MAPPING.md](AD-GROUPS-ROLES-MAPPING.md) - AD groups → Keycloak roles mapping
- [AUTENTICACION-ACTIVE-DIRECTORY.md](../AUTENTICACION-ACTIVE-DIRECTORY.md) - Authentication architecture

---

## ✅ Checklist

### Development (MOCK mode)

- [ ] Configuration: `mode: MOCK`
- [ ] No external dependencies needed
- [ ] Can run immediately
- [ ] 4 test users available

### Staging (LOCAL mode)

- [ ] Configuration: `mode: LOCAL`
- [ ] Keycloak installed and running
- [ ] Realm `signature-router` created
- [ ] Client `admin-portal` configured
- [ ] Roles created (ADMIN, OPERATOR, VIEWER)
- [ ] OAuth2 JWT validation configured

### Production (ACTIVE_DIRECTORY mode)

- [ ] Configuration: `mode: ACTIVE_DIRECTORY`
- [ ] Keycloak User Federation configured
- [ ] AD connectivity tested
- [ ] AD groups created (`SingularBank-SignatureRouter-*`)
- [ ] Group → Role mapping configured
- [ ] Users assigned to AD groups
- [ ] Read-only mode verified (POST/PUT/DELETE return 403)

---

**Documento creado:** 30 de noviembre de 2025  
**Última actualización:** 30 de noviembre de 2025  
**Mantenedor:** DevOps Team  
**Status:** ✅ Completo

