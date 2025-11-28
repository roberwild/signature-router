# 🔐 Resumen: Seguridad con Keycloak Implementada

## ✅ Lo que se ha configurado

### 1. **Keycloak (KDC - Key Distribution Center)**

**Servicio agregado a `docker-compose.yml`:**
- **Imagen:** `quay.io/keycloak/keycloak:23.0`
- **Puerto:** `8180` (acceso web)
- **Base de datos dedicada:** PostgreSQL independiente
  - Puerto: `5433` (externo, mapeado a `5432` interno)
  - Base de datos: `keycloak`
  - Usuario: `keycloak`
  - Password: `keycloak`
- **Credenciales admin:** `admin` / `admin`

**Configuración inicial:**
- Realm: `signature-router`
- Auto-import del realm al arrancar
- Health check: `http://localhost:8180/health/ready`

**¿Por qué base de datos separada?**
✅ **Separación de responsabilidades**: Keycloak es infraestructura (IAM), no dominio de negocio  
✅ **Escalabilidad independiente**: Cada servicio escala según sus necesidades  
✅ **Backup diferenciado**: Políticas de backup independientes  
✅ **Seguridad**: Acceso a DB de aplicación ≠ acceso a DB de Keycloak  
✅ **Mantenimiento**: Actualizaciones de Keycloak no afectan el schema de la aplicación  

---

### 2. **Realm `signature-router`**

**Archivo:** `keycloak/realms/signature-router-realm.json`

**Contiene:**
- ✅ **4 Roles:**
  - `ADMIN` (acceso completo)
  - `USER` (crear y ver propias signatures)
  - `SUPPORT` (read-only routing rules)
  - `AUDITOR` (read-only audit logs)

- ✅ **4 Usuarios preconfigurados:**
  | Username  | Password    | Roles         |
  |-----------|-------------|---------------|
  | admin     | admin123    | ADMIN, USER   |
  | user      | user123     | USER          |
  | support   | support123  | SUPPORT, USER |
  | auditor   | auditor123  | AUDITOR       |

- ✅ **2 Clientes OAuth2:**
  - `signature-router-api` (confidential, para la API)
    - Client Secret: `signature-router-secret-key-12345`
  - `postman-client` (public, para testing)

- ✅ **Protocol Mappers:**
  - `roles` → Incluye roles en el JWT
  - `email` → Incluye email del usuario
  - `username` → Incluye `preferred_username`
  - `employeeId` → Custom claim para identificación interna

---

### 3. **Spring Boot OAuth2 Resource Server**

**Configuración en `application-local.yml`:**

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/signature-router
          jwk-set-uri: http://localhost:8180/realms/signature-router/protocol/openid-connect/certs
```

**SecurityConfig (`SecurityConfig.java`):**
- ✅ Validación automática de tokens JWT
- ✅ Extracción de roles del claim `roles`
- ✅ Autorización basada en roles con `@PreAuthorize`

**Endpoints protegidos:**

| Endpoint                           | Requiere Auth | Roles Permitidos |
|------------------------------------|---------------|------------------|
| `/actuator/health`                 | ❌ No          | Público          |
| `/swagger-ui/**`                   | ❌ No          | Público          |
| `/api/v1/signatures` (POST)        | ✅ Sí          | USER, ADMIN      |
| `/api/v1/signatures/{id}` (GET)    | ✅ Sí          | USER, ADMIN      |
| `/api/v1/admin/providers/health`   | ✅ Sí          | ADMIN            |
| `/api/v1/routing/**`               | ✅ Sí          | ADMIN, SUPPORT   |

---

### 4. **Scripts de Utilidad**

#### **PowerShell (`keycloak/get-token.ps1`)**
- Obtiene tokens JWT para cualquier usuario
- Decodifica el token y muestra los claims
- Muestra tiempo de expiración

**Uso:**
```powershell
cd keycloak
.\get-token.ps1

# Seleccionar usuario (admin, user, support, auditor)
# Copiar el Access Token para Postman
```

#### **Bash (`keycloak/get-token.sh`)**
- Misma funcionalidad para Linux/Mac
- Requiere `jq` instalado

**Uso:**
```bash
chmod +x keycloak/get-token.sh
./keycloak/get-token.sh
```

---

### 5. **Postman Collections Actualizadas**

#### **Nueva colección:** `postman/Signature-Router-v2.postman_collection.json`

**Folder nuevo: `0. Authentication (Keycloak)`**
- ✅ **Get Admin Token** → Obtiene JWT para `admin`, guarda en `{{admin_token}}`
- ✅ **Get User Token** → Obtiene JWT para `user`, guarda en `{{user_token}}`
- ✅ **Verify Token (Introspect)** → Valida si el token es válido

**Scripts automáticos:**
- Al ejecutar **Get Admin Token**, el token se guarda automáticamente en la variable `admin_token`
- Todos los endpoints admin usan `Authorization: Bearer {{admin_token}}`

#### **Environment actualizado:** `postman/Signature-Router-Local.postman_environment.json`

**Nuevas variables:**
```json
{
  "keycloak_url": "http://localhost:8180",
  "keycloak_realm": "signature-router",
  "keycloak_client_id": "signature-router-api",
  "keycloak_client_secret": "signature-router-secret-key-12345",
  "admin_username": "admin",
  "admin_password": "admin123",
  "admin_token": "(se autocompleta al ejecutar Get Admin Token)",
  "user_username": "user",
  "user_password": "user123",
  "user_token": "(se autocompleta al ejecutar Get User Token)"
}
```

---

### 6. **Documentación Completa**

#### **`KEYCLOAK-SETUP.md`**
- ✅ Qué es Keycloak y arquitectura OAuth2
- ✅ Cómo iniciar Keycloak (`docker-compose up -d`)
- ✅ Cómo verificar que esté corriendo
- ✅ Cómo obtener tokens JWT (3 métodos: PowerShell, Bash, cURL)
- ✅ Cómo probar con Postman (flujo paso a paso)
- ✅ Usuarios y roles preconfigurados
- ✅ Troubleshooting completo (8 problemas comunes + soluciones)
- ✅ Arquitectura completa con diagrama

---

## 🚀 Cómo Probar Ahora Mismo

### Paso 1: Verificar que Keycloak esté corriendo

```bash
# Ver logs de Keycloak
docker logs -f signature-router-keycloak

# Esperar mensaje: "Listening on: http://0.0.0.0:8080"
# (puede tardar 60-90 segundos la primera vez)
```

### Paso 2: Verificar Health de Keycloak

```bash
curl http://localhost:8180/health/ready
```

**Respuesta esperada:**
```json
{
  "status": "UP",
  "checks": [...]
}
```

### Paso 3: Obtener Token de Admin

**Opción A: PowerShell Script**
```powershell
cd keycloak
.\get-token.ps1

# Seleccionar opción 1 (admin)
# Copiar el Access Token
```

**Opción B: cURL Manual**
```bash
curl -X POST "http://localhost:8180/realms/signature-router/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=signature-router-api" \
  -d "client_secret=signature-router-secret-key-12345" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin123"
```

### Paso 4: Probar en Postman

1. **Importar la nueva colección:**
   - `postman/Signature-Router-v2.postman_collection.json`

2. **Activar el environment:**
   - `Signature Router - Local`

3. **Ejecutar:**
   - `0. Authentication (Keycloak) > Get Admin Token`
   - Click **Send**
   - ✅ El token se guarda automáticamente en `{{admin_token}}`

4. **Probar endpoint admin:**
   - `1. Health & Monitoring > Provider Health (Admin)`
   - Click **Send**
   - ✅ Debería devolver **200 OK** con el estado de los providers

### Paso 5: Verificar Autorización (403 Forbidden)

1. **Obtener token de user:**
   - `0. Authentication > Get User Token`

2. **Intentar acceder a endpoint admin:**
   - `1. Health & Monitoring > Provider Health (Admin)`
   - Cambiar header: `Authorization: Bearer {{user_token}}`
   - Click **Send**
   - ❌ Debería devolver **403 Forbidden** (USER no tiene rol ADMIN)

---

## 📊 Arquitectura OAuth2 Implementada

```
┌─────────────┐
│   Postman   │
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /realms/signature-router/protocol/openid-connect/token
       │    Body: client_id, client_secret, username, password
       │
       v
┌──────────────────────┐
│     Keycloak         │
│   (Port 8180)        │
│                      │
│  Realm: signature-   │
│  router              │
│                      │
│  Users:              │
│  - admin (ADMIN)     │
│  - user (USER)       │
│  - support (SUPPORT) │
│  - auditor (AUDITOR) │
└──────┬───────────────┘
       │
       │ 2. Response: JWT Token
       │    {
       │      "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
       │      "expires_in": 3600,
       │      "token_type": "Bearer"
       │    }
       │
       v
┌─────────────┐
│   Postman   │ 3. Authorization: Bearer <JWT>
└──────┬──────┘
       │
       │ GET /api/v1/admin/providers/health
       │ Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
       │
       v
┌──────────────────────────────────────────┐
│   Signature Router API (Port 8080)       │
│                                          │
│   Spring Security OAuth2 Resource Server │
│                                          │
│   4. Valida JWT:                         │
│      - Verifica firma con Keycloak       │
│        (usando JWKS endpoint)            │
│      - Extrae claims: roles, email, sub  │
│      - Verifica exp (expiration)         │
│                                          │
│   5. Autorización:                       │
│      - Endpoint requiere: ADMIN          │
│      - Token tiene roles: [ADMIN, USER]  │
│      - ✅ AUTORIZADO                      │
│                                          │
│   6. Response: 200 OK + Provider Health  │
└──────┬───────────────────────────────────┘
       │
       v
┌─────────────┐
│   Postman   │
└─────────────┘
```

---

## 🔒 Seguridad Implementada

### ✅ **Autenticación (Authentication)**
- Usuarios deben proporcionar credenciales válidas a Keycloak
- Keycloak emite un JWT firmado con clave privada
- La API valida el JWT usando la clave pública de Keycloak (JWKS)

### ✅ **Autorización (Authorization)**
- Los endpoints están protegidos por roles:
  - `@PreAuthorize("hasRole('ADMIN')")` en `ProviderHealthController`
  - `@PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")` en `AdminRuleController`
- Spring Security verifica los roles automáticamente antes de permitir acceso

### ✅ **Tokens JWT**
- **Firmados:** RSA256 (no se pueden falsificar sin la clave privada de Keycloak)
- **Validez:** 1 hora (configurable en Keycloak)
- **Refresh tokens:** Soportados (válidos por 30 días)
- **Claims incluidos:**
  - `sub`: User ID
  - `preferred_username`: admin, user, etc.
  - `email`: admin@bank.com
  - `roles`: [ADMIN, USER]
  - `employeeId`: EMP-001 (custom claim)

### ✅ **Stateless**
- No se almacenan sesiones en el servidor
- Cada request debe incluir el JWT en el header `Authorization: Bearer <token>`

---

## 📝 Próximos Pasos

1. ✅ **Probar todos los endpoints con diferentes roles**
   - Verificar que ADMIN puede acceder a `/api/v1/admin/**`
   - Verificar que USER NO puede acceder a `/api/v1/admin/**` (403)

2. ✅ **Implementar Refresh Token Flow**
   - Cuando el `access_token` expire, usar `refresh_token` para obtener uno nuevo
   - Evitar pedir credenciales cada hora

3. ✅ **Integrar Keycloak con Grafana (SSO)**
   - Configurar Grafana para usar Keycloak como identity provider
   - Login único para toda la plataforma

4. ✅ **Habilitar 2FA (Two-Factor Authentication)**
   - Para producción, forzar 2FA para roles ADMIN y SUPPORT

5. ✅ **Auditoría**
   - Registrar todos los logins y accesos a endpoints admin
   - Integrar con Keycloak Events (login, logout, failed attempts)

---

## 📚 Referencias

- **Keycloak Admin Console:** http://localhost:8180 (admin/admin)
- **Keycloak Documentation:** https://www.keycloak.org/documentation
- **Spring Security OAuth2 Resource Server:** https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html
- **JWT.io:** https://jwt.io (para decodificar tokens)

---

**¡Seguridad OAuth2 con Keycloak completamente implementada! 🔐✅**

**Archivos creados/modificados:**
- ✅ `docker-compose.yml` (agregado servicio Keycloak)
- ✅ `keycloak/realms/signature-router-realm.json` (configuración completa del realm)
- ✅ `keycloak/get-token.ps1` (script PowerShell para obtener tokens)
- ✅ `keycloak/get-token.sh` (script Bash para obtener tokens)
- ✅ `postman/Signature-Router-v2.postman_collection.json` (colección actualizada con auth)
- ✅ `postman/Signature-Router-Local.postman_environment.json` (variables de Keycloak)
- ✅ `src/main/resources/application-local.yml` (configuración OAuth2)
- ✅ `KEYCLOAK-SETUP.md` (guía completa de 10 secciones)
- ✅ `SEGURIDAD-KEYCLOAK-RESUMEN.md` (este documento)

