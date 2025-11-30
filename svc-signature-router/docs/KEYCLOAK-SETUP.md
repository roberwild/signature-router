# 🔐 Keycloak Setup - Signature Router

## 📋 Índice

1. [Qué es Keycloak](#qué-es-keycloak)
2. [Arquitectura de Seguridad](#arquitectura-de-seguridad)
3. [Iniciar Keycloak](#iniciar-keycloak)
4. [Verificar Configuración](#verificar-configuración)
5. [Obtener Tokens JWT](#obtener-tokens-jwt)
6. [Probar con Postman](#probar-con-postman)
7. [Usuarios y Roles](#usuarios-y-roles)
8. [Troubleshooting](#troubleshooting)

---

## 1. Qué es Keycloak

**Keycloak** es un **Key Distribution Center (KDC)** y **OAuth2 Authorization Server** de código abierto que proporciona:

- ✅ **Autenticación centralizada** (SSO - Single Sign-On)
- ✅ **Autorización basada en roles** (RBAC - Role-Based Access Control)
- ✅ **Emisión de tokens JWT** (JSON Web Tokens)
- ✅ **Validación de identidad** para APIs REST

### Flujo OAuth2 Resource Owner Password Credentials (ROPC):

```
┌─────────┐                                  ┌───────────┐
│ Postman │                                  │ Keycloak  │
│ Client  │                                  │  (KDC)    │
└────┬────┘                                  └─────┬─────┘
     │                                              │
     │ 1. POST /token                               │
     │    (username, password, client_id)           │
     ├─────────────────────────────────────────────>│
     │                                              │
     │ 2. Valida credenciales                       │
     │    y emite JWT                               │
     │<─────────────────────────────────────────────┤
     │                                              │
     │ 3. GET /api/v1/admin/providers/health        │
     │    Authorization: Bearer <JWT>               │
     ├────────────────────────┐                     │
     │                        │                     │
     │                        v                     │
     │               ┌────────────────┐             │
     │               │ Signature      │             │
     │               │ Router API     │             │
     │               └────────┬───────┘             │
     │                        │                     │
     │                        │ 4. Valida JWT       │
     │                        │    (verifica firma) │
     │                        ├────────────────────>│
     │                        │<───────────────────┤
     │                        │                     │
     │                        │ 5. Extrae roles     │
     │                        │    del JWT          │
     │                        │                     │
     │ 6. Response 200 OK     │                     │
     │<───────────────────────┤                     │
     │                                              │
```

---

## 2. Arquitectura de Seguridad

### Componentes:

1. **Keycloak (Puerto 8180)**
   - Realm: `signature-router`
   - Client: `signature-router-api`
   - Usuarios: `admin`, `user`, `support`, `auditor`
   - **Base de datos dedicada:** PostgreSQL en puerto `5433` (base de datos `keycloak`)

2. **Signature Router API (Puerto 8080)**
   - Spring Security OAuth2 Resource Server
   - Valida tokens JWT emitidos por Keycloak
   - Aplica autorización basada en roles
   - **Base de datos propia:** PostgreSQL en puerto `5432` (base de datos `signature_router`)

### Roles y Permisos:

| Rol       | Permisos                                                 |
|-----------|----------------------------------------------------------|
| `ADMIN`   | Acceso completo (crear, leer, actualizar, eliminar)     |
| `USER`    | Crear signature requests, ver propias signatures         |
| `SUPPORT` | Ver routing rules, ver signatures (read-only)            |
| `AUDITOR` | Ver audit logs, métricas (read-only)                     |

### Endpoints y Autorización:

| Endpoint                             | Requiere Autenticación | Roles Permitidos  |
|--------------------------------------|------------------------|-------------------|
| `/actuator/health`                   | ❌ No                   | Público           |
| `/swagger-ui/**`                     | ❌ No                   | Público           |
| `/api/v1/signatures` (POST)          | ✅ Sí                   | USER, ADMIN       |
| `/api/v1/signatures/{id}` (GET)      | ✅ Sí                   | USER, ADMIN       |
| `/api/v1/admin/providers/health`     | ✅ Sí                   | ADMIN             |
| `/api/v1/routing/**`                 | ✅ Sí                   | ADMIN, SUPPORT    |

### ¿Por qué Bases de Datos Separadas?

✅ **Razones arquitectónicas:**

1. **Separación de responsabilidades**: Keycloak es un servicio de infraestructura (IAM), no parte del dominio de negocio de la aplicación.

2. **Escalabilidad independiente**: Keycloak y la aplicación pueden escalar de forma independiente con sus propios recursos.

3. **Backup y recuperación**: Se pueden aplicar políticas de backup diferentes:
   - Keycloak: Backups frecuentes, alta disponibilidad (usuarios, sesiones, tokens).
   - Aplicación: Backups según criticidad del negocio.

4. **Gestión de schemas**: Evita conflictos de nombres de tablas y facilita migraciones independientes.

5. **Seguridad**: Usuarios con acceso a la base de datos de la aplicación no tienen acceso automático a la base de datos de Keycloak (credenciales, roles, sesiones).

6. **Mantenimiento**: Actualizaciones de Keycloak no afectan el schema de la aplicación y viceversa.

---

## 3. Iniciar Keycloak

### Paso 1: Arrancar Docker Compose

```bash
# Iniciar todos los servicios (incluyendo Keycloak)
docker-compose up -d

# Verificar que Keycloak está corriendo
docker logs signature-router-keycloak
```

### Paso 2: Esperar a que Keycloak esté listo

Keycloak puede tardar **60-90 segundos** en arrancar la primera vez (importa el realm y configura la base de datos).

```bash
# Ver logs en tiempo real
docker logs -f signature-router-keycloak

# Esperar mensaje: "Added user 'admin' to realm 'master'"
# Esperar mensaje: "Listening on: http://0.0.0.0:8080"
```

### Paso 3: Verificar Health

```bash
# Health check
curl http://localhost:8180/health/ready

# Respuesta esperada:
# {"status": "UP", "checks": [...]}
```

---

## 4. Verificar Configuración

### 4.1 Acceder a Keycloak Admin Console

**URL:** http://localhost:8180

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin`

### 4.2 Verificar el Realm `signature-router`

1. En el menú superior izquierdo, selecciona: **`signature-router`** (en lugar de `master`)
2. Ve a **Realm Settings** → deberías ver:
   - Realm: `signature-router`
   - Display name: `Signature Router`

### 4.3 Verificar Usuarios

1. Ve a **Users** (menú lateral)
2. Click **View all users**
3. Deberías ver 4 usuarios:
   - `admin` (ADMIN + USER)
   - `user` (USER)
   - `support` (SUPPORT + USER)
   - `auditor` (AUDITOR)

### 4.4 Verificar Cliente `signature-router-api`

1. Ve a **Clients** (menú lateral)
2. Busca: `signature-router-api`
3. Click en el cliente
4. Verifica:
   - **Access Type:** `confidential`
   - **Client ID:** `signature-router-api`
   - **Client Secret:** (pestaña **Credentials**) → `signature-router-secret-key-12345`

---

## 5. Obtener Tokens JWT

### Opción 1: Script PowerShell (Windows) ✅ RECOMENDADO

```powershell
# Ejecutar script
cd keycloak
.\get-token.ps1

# Seleccionar opción:
# 1) admin (ADMIN + USER)
# 2) user (USER)
# 3) support (SUPPORT + USER)
# 4) auditor (AUDITOR)
# 5) Todos

# El script mostrará:
# - Access Token (cópialo para Postman)
# - Token decodificado (roles, claims)
# - Expiration time
```

### Opción 2: Script Bash (Linux/Mac)

```bash
# Dar permisos de ejecución
chmod +x keycloak/get-token.sh

# Ejecutar script
./keycloak/get-token.sh

# Seleccionar opción 1-5
```

### Opción 3: cURL Manual

```bash
# Admin Token
curl -X POST "http://localhost:8180/realms/signature-router/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=signature-router-api" \
  -d "client_secret=signature-router-secret-key-12345" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin123"

# Resultado (JSON):
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expires_in": 3600,
#   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "Bearer"
# }
```

### Decodificar el Token JWT

**Opción 1: Usar https://jwt.io**

1. Copia el `access_token`
2. Ve a https://jwt.io
3. Pega el token en el campo **Encoded**
4. Verás el payload decodificado:

```json
{
  "exp": 1701234567,
  "iat": 1701230967,
  "jti": "abc123...",
  "iss": "http://localhost:8180/realms/signature-router",
  "aud": "account",
  "sub": "uuid-user-id",
  "typ": "Bearer",
  "preferred_username": "admin",
  "email": "admin@bank.com",
  "roles": ["ADMIN", "USER"],
  "employeeId": "EMP-001"
}
```

**Opción 2: PowerShell**

```powershell
$token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
$payload = $token.Split('.')[1]
while ($payload.Length % 4 -ne 0) { $payload += '=' }
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload)) | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## 6. Probar con Postman

### 6.1 Importar Colección Actualizada

1. **Importar:**
   - `postman/Signature-Router-v2.postman_collection.json` (nueva versión con Keycloak)
   - `postman/Signature-Router-Local.postman_environment.json`

2. **Activar Environment:**
   - Esquina superior derecha: **"Signature Router - Local"**

### 6.2 Flujo de Prueba Completo

#### Paso 1: Obtener Token de Admin

**Request:** `0. Authentication (Keycloak) > Get Admin Token`

- Click **Send**
- ✅ El script automáticamente guarda el token en la variable `admin_token`
- Verifica en **Environment** que `admin_token` tiene un valor

#### Paso 2: Probar Endpoint Admin

**Request:** `1. Health & Monitoring > Provider Health (Admin)`

- Click **Send**
- ✅ Debería devolver **200 OK** con el estado de los providers

**Si obtienes 401 Unauthorized:**
- El token expiró (válido por 1 hora)
- Ejecuta de nuevo **Get Admin Token**

#### Paso 3: Crear Signature Request

**Request:** `2. Signature Requests > Create Signature Request - SMS (Admin)`

- Click **Send**
- ✅ Debería devolver **201 Created**
- ✅ El script guarda automáticamente `signature_request_id` y `challenge_id`

#### Paso 4: Probar con Usuario Estándar

**Request:** `0. Authentication (Keycloak) > Get User Token`

- Click **Send**
- ✅ Guarda el token en `user_token`

**Request:** `2. Signature Requests > Create Signature Request - SMS (User)`

- Click **Send**
- ✅ Debería devolver **201 Created**

**Probar endpoint ADMIN con token USER:**

**Request:** `1. Health & Monitoring > Provider Health (Admin)`

- Cambia `Authorization: Bearer {{admin_token}}` por `Authorization: Bearer {{user_token}}`
- Click **Send**
- ❌ Debería devolver **403 Forbidden** (el rol USER no tiene acceso a `/api/v1/admin/**`)

---

## 7. Usuarios y Roles

### Usuarios Preconfigurados:

| Username  | Password    | Roles         | Email               | Descripción                    |
|-----------|-------------|---------------|---------------------|--------------------------------|
| `admin`   | `admin123`  | ADMIN, USER   | admin@bank.com      | Administrador con acceso total |
| `user`    | `user123`   | USER          | user@bank.com       | Usuario estándar               |
| `support` | `support123`| SUPPORT, USER | support@bank.com    | Agente de soporte (read-only)  |
| `auditor` | `auditor123`| AUDITOR       | auditor@bank.com    | Auditor (solo métricas)        |

### Crear Nuevos Usuarios (Keycloak Admin Console):

1. Ve a **Users** > **Add user**
2. Completa:
   - Username: `nuevo-usuario`
   - Email: `nuevo@bank.com`
   - First Name, Last Name
   - Email Verified: **ON**
   - Enabled: **ON**
3. Click **Save**
4. Ve a pestaña **Credentials**:
   - Set Password: `password123`
   - Temporary: **OFF**
   - Click **Set Password**
5. Ve a pestaña **Role Mappings**:
   - En **Realm Roles**, selecciona: `USER`, `ADMIN`, etc.
   - Click **Add selected**

---

## 8. Troubleshooting

### 8.1 Error: `Connection refused` (Keycloak)

**Problema:** Keycloak no está corriendo.

**Solución:**

```bash
# Verificar estado
docker ps | grep keycloak

# Si no está corriendo, iniciar
docker-compose up -d keycloak

# Ver logs
docker logs -f signature-router-keycloak
```

---

### 8.2 Error: `401 Unauthorized` al llamar a la API

**Problema:** Token inválido, expirado o no enviado.

**Soluciones:**

1. **Verificar que el token esté en el header:**
   - En Postman, pestaña **Headers**
   - Debe existir: `Authorization: Bearer {{admin_token}}`

2. **Verificar que la variable `admin_token` tiene valor:**
   - En Postman, click en el ícono del "ojo" (esquina superior derecha)
   - Busca `admin_token` → debe tener un valor largo (no vacío)

3. **Obtener un nuevo token:**
   - Ejecuta: `0. Authentication > Get Admin Token`

4. **Verificar que el token es válido:**
   - Ejecuta: `0. Authentication > Verify Token (Introspect)`
   - Respuesta: `{"active": true, "username": "admin", ...}`

---

### 8.3 Error: `403 Forbidden`

**Problema:** El usuario no tiene el rol requerido para el endpoint.

**Ejemplo:**
- Endpoint: `/api/v1/admin/providers/health`
- Requiere: `ADMIN`
- Token actual: `user_token` (rol: `USER`)

**Solución:**
- Usar el token de `admin`: `Authorization: Bearer {{admin_token}}`

---

### 8.4 Error: `Invalid token` (Spring Boot)

**Problema:** La aplicación no puede validar el token contra Keycloak.

**Verificar:**

1. **Keycloak está corriendo:**
   ```bash
   curl http://localhost:8180/realms/signature-router/.well-known/openid-configuration
   ```

2. **Configuración en `application-local.yml`:**
   ```yaml
   spring:
     security:
       oauth2:
         resourceserver:
           jwt:
             issuer-uri: http://localhost:8180/realms/signature-router
             jwk-set-uri: http://localhost:8180/realms/signature-router/protocol/openid-connect/certs
   ```

3. **Logs de Spring Security:**
   ```bash
   docker logs signature-router-app 2>&1 | grep -i "jwt\|oauth2\|security"
   ```

---

### 8.5 Error: Keycloak no importa el realm

**Problema:** El archivo `signature-router-realm.json` no se está importando.

**Verificar:**

```bash
# Ver logs de importación
docker logs signature-router-keycloak 2>&1 | grep -i "import"

# Debe aparecer: "Realm 'signature-router' imported"
```

**Solución:**

```bash
# Eliminar contenedor y volúmenes
docker-compose down -v

# Recrear
docker-compose up -d
```

---

### 8.6 Keycloak tarda mucho en arrancar

**Problema:** Primera vez que arranca + configuración de base de datos.

**Tiempo esperado:**
- Primera vez: **60-90 segundos**
- Arranques posteriores: **30-40 segundos**

**Verificar progreso:**

```bash
# Ver logs en tiempo real
docker logs -f signature-router-keycloak

# Esperar mensaje final:
# "Listening on: http://0.0.0.0:8080"
```

---

## 9. Arquitectura Completa (Diagrama)

```
┌──────────────────────────────────────────────────────────────────┐
│                        SIGNATURE ROUTER                          │
│                     (con Keycloak Security)                      │
└──────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Postman   │
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /token (username, password)
       │
       v
┌──────────────────┐          ┌─────────────────────────┐
│   Keycloak       │          │   PostgreSQL            │
│   (Port 8180)    │◄─────────┤   (Port 5432)           │
│                  │  DB      │   - signature_router    │
│  - Realm:        │  Schema  │   - keycloak schema     │
│    signature-    │          └─────────────────────────┘
│    router        │
│  - Users:        │
│    admin, user   │
│  - Clients:      │
│    signature-    │
│    router-api    │
└──────┬───────────┘
       │
       │ 2. JWT Token
       │
       v
┌──────────────────────────────────────────────────────┐
│        Signature Router API (Port 8080)              │
│                                                      │
│  - Spring Security OAuth2 Resource Server            │
│  - JWT Validation (verifica firma con Keycloak)     │
│  - Role-based Authorization                          │
│                                                      │
│  Endpoints:                                          │
│  - /api/v1/signatures (USER, ADMIN)                  │
│  - /api/v1/admin/** (ADMIN)                          │
│  - /api/v1/routing/** (ADMIN, SUPPORT)               │
└──────┬───────────────────────────────────────────────┘
       │
       │
       v
┌─────────────────┐   ┌─────────────┐   ┌──────────┐
│   Vault         │   │   Kafka     │   │  Grafana │
│   (Port 8200)   │   │ (Port 9092) │   │ (Port    │
│                 │   │             │   │  3000)   │
└─────────────────┘   └─────────────┘   └──────────┘
```

---

## 10. Próximos Pasos

Una vez configurado Keycloak:

1. ✅ Prueba todos los endpoints con diferentes roles
2. ✅ Verifica que la autorización funciona correctamente (403 cuando no tienes el rol)
3. ✅ Configura refresh tokens para sesiones largas
4. ✅ Integra Keycloak con Grafana (SSO)
5. ✅ Habilita 2FA (Two-Factor Authentication) en producción

---

**¡Keycloak configurado y listo para usar! 🔐🚀**

