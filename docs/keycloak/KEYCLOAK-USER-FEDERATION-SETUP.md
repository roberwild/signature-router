# Keycloak User Federation - Active Directory Setup

> ⚠️ **DOCUMENTO OBSOLETO PARA PRODUCCIÓN**  
> Este documento describe la configuración de sincronización LDAP con Active Directory, la cual **NO se usa en producción**.  
> 
> **Arquitectura Real en Producción:** [USER-AUDIT-ARCHITECTURE.md](../USER-AUDIT-ARCHITECTURE.md)  
> 
> En producción NO hay sincronización de usuarios desde AD. Los usuarios se registran automáticamente cuando inician sesión (datos del JWT).  
> Este documento se mantiene solo como referencia técnica.

**Proyecto:** Signature Router  
**Epic:** Epic 12 - Admin Panel Integration  
**Fecha:** 30 de noviembre de 2025  
**Objetivo:** Configurar Keycloak para federar usuarios desde Active Directory

---

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Paso 1: Crear Service Account en AD](#paso-1-crear-service-account-en-ad)
3. [Paso 2: Configurar LDAP User Federation](#paso-2-configurar-ldap-user-federation)
4. [Paso 3: Configurar Mappers](#paso-3-configurar-mappers)
5. [Paso 4: Mapear Grupos AD a Roles](#paso-4-mapear-grupos-ad-a-roles)
6. [Paso 5: Testing](#paso-5-testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisitos

### Información Requerida de Active Directory

Antes de comenzar, necesitas recopilar la siguiente información:

| Información | Ejemplo | Descripción |
|-------------|---------|-------------|
| **LDAP URL** | `ldap://ad.singularbank.com:389` | URL del servidor AD |
| **LDAP Port** | `389` (LDAP) o `636` (LDAPS) | Puerto de conexión |
| **Base DN** | `DC=singularbank,DC=com` | Distinguished Name base |
| **Users DN** | `OU=Users,DC=singularbank,DC=com` | OU donde están los usuarios |
| **Groups DN** | `OU=Groups,DC=singularbank,DC=com` | OU donde están los grupos |
| **Bind DN** | `CN=keycloak-service,OU=ServiceAccounts,DC=singularbank,DC=com` | Service account DN |
| **Bind Password** | `***********` | Contraseña del service account |

### Accesos Necesarios

- ✅ Acceso a Keycloak Admin Console
- ✅ Credenciales de administrador de Keycloak
- ✅ Service Account en Active Directory (creado por IT)
- ✅ Conectividad de red: Keycloak → Active Directory (puerto 389/636)

---

## Paso 1: Crear Service Account en AD

**Responsable:** Equipo de IT / Active Directory Admins

### 1.1. Crear Usuario de Servicio

```powershell
# En Active Directory (PowerShell)
New-ADUser -Name "keycloak-service" `
    -SamAccountName "keycloak-service" `
    -UserPrincipalName "keycloak-service@singularbank.com" `
    -Path "OU=ServiceAccounts,DC=singularbank,DC=com" `
    -AccountPassword (ConvertTo-SecureString "ComplexPassword123!" -AsPlainText -Force) `
    -Enabled $true `
    -PasswordNeverExpires $true `
    -CannotChangePassword $true `
    -Description "Service Account para Keycloak User Federation"
```

### 1.2. Asignar Permisos de Lectura

El service account necesita permisos de **lectura** en:
- OU de usuarios (`OU=Users,DC=singularbank,DC=com`)
- OU de grupos (`OU=Groups,DC=singularbank,DC=com`)

**Permisos mínimos requeridos:**
- ✅ Read All Properties
- ✅ List Contents
- ❌ Write (NO necesario - read-only)
- ❌ Delete (NO necesario - read-only)

### 1.3. Verificar Conectividad

```bash
# Desde el servidor donde corre Keycloak
ldapsearch -x -H ldap://ad.singularbank.com:389 \
    -D "CN=keycloak-service,OU=ServiceAccounts,DC=singularbank,DC=com" \
    -w "ComplexPassword123!" \
    -b "OU=Users,DC=singularbank,DC=com" \
    "(objectClass=user)" cn mail

# Debe retornar lista de usuarios
```

---

## Paso 2: Configurar LDAP User Federation

**Responsable:** Keycloak Admin

### 2.1. Acceder a Keycloak Admin Console

1. Navegar a: `https://keycloak.singularbank.com/admin`
2. Login con credenciales de admin
3. Seleccionar Realm: `signature-router`

### 2.2. Agregar User Federation

**Navegación:** `User Federation` → `Add provider` → `ldap`

### 2.3. Configuración General

| Campo | Valor | Notas |
|-------|-------|-------|
| **Console Display Name** | `Active Directory - SingularBank` | Nombre descriptivo |
| **Priority** | `0` | Máxima prioridad |
| **Edit Mode** | `READ_ONLY` | ⚠️ IMPORTANTE: Solo lectura |
| **Sync Registrations** | `OFF` | Usuarios no se crean en Keycloak |
| **Import Users** | `ON` | Importar usuarios de AD |
| **Enabled** | `ON` | Habilitar federación |

### 2.4. Configuración de Conexión

| Campo | Valor |
|-------|-------|
| **Vendor** | `Active Directory` |
| **Connection URL** | `ldap://ad.singularbank.com:389` |
| **Enable StartTLS** | `OFF` (o `ON` si usas LDAPS) |
| **Use Truststore SPI** | `Only for ldaps` |
| **Connection Timeout** | `5000` ms |
| **Read Timeout** | `10000` ms |

### 2.5. Configuración de Autenticación

| Campo | Valor |
|-------|-------|
| **Authentication Type** | `simple` |
| **Bind DN** | `CN=keycloak-service,OU=ServiceAccounts,DC=singularbank,DC=com` |
| **Bind Credential** | `[Password del service account]` |

### 2.6. Configuración de Usuarios

| Campo | Valor | Descripción |
|-------|-------|-------------|
| **Users DN** | `OU=Users,DC=singularbank,DC=com` | OU de usuarios |
| **Username LDAP Attribute** | `sAMAccountName` | Username AD |
| **RDN LDAP Attribute** | `cn` | Common Name |
| **UUID LDAP Attribute** | `objectGUID` | Unique ID |
| **User Object Classes** | `person, organizationalPerson, user` | Clases de objeto |
| **Custom User LDAP Filter** | `(&(objectClass=user)(memberOf=CN=SingularBank-SignatureRouter-*,OU=Groups,DC=singularbank,DC=com))` | Solo usuarios con acceso al portal |

**⚠️ Nota sobre Custom User LDAP Filter:**
- Este filtro solo importa usuarios que pertenecen a grupos relacionados con Signature Router
- Reduce la carga y mejora la seguridad
- Formato: `(&(objectClass=user)(memberOf=CN=SingularBank-SignatureRouter-*,OU=Groups,DC=singularbank,DC=com))`

### 2.7. Configuración de Sincronización

| Campo | Valor | Descripción |
|-------|-------|-------------|
| **Periodic Full Sync** | `ON` | Sincronización completa periódica |
| **Full Sync Period** | `86400` segundos (24 horas) | Una vez al día |
| **Periodic Changed Users Sync** | `ON` | Sincronización incremental |
| **Changed Users Sync Period** | `3600` segundos (1 hora) | Cada hora |
| **Cache Policy** | `DEFAULT` | Cache por defecto |

### 2.8. Guardar y Testear

1. Click en **Save**
2. Click en **Test connection** → Debe mostrar "Success"
3. Click en **Test authentication** → Debe mostrar "Success"
4. Click en **Synchronize all users** → Debe importar usuarios

---

## Paso 3: Configurar Mappers

**Navegación:** `User Federation` → `Active Directory - SingularBank` → `Mappers`

### 3.1. Username Mapper

**Agregar Mapper:** `Add mapper` → `user-attribute-ldap-mapper`

| Campo | Valor |
|-------|-------|
| **Name** | `username` |
| **User Model Attribute** | `username` |
| **LDAP Attribute** | `sAMAccountName` |
| **Read Only** | `ON` |
| **Always Read Value From LDAP** | `ON` |
| **Is Mandatory In LDAP** | `ON` |

### 3.2. Email Mapper

**Agregar Mapper:** `Add mapper` → `user-attribute-ldap-mapper`

| Campo | Valor |
|-------|-------|
| **Name** | `email` |
| **User Model Attribute** | `email` |
| **LDAP Attribute** | `mail` |
| **Read Only** | `ON` |
| **Always Read Value From LDAP** | `ON` |
| **Is Mandatory In LDAP** | `ON` |

### 3.3. First Name Mapper

**Agregar Mapper:** `Add mapper` → `user-attribute-ldap-mapper`

| Campo | Valor |
|-------|-------|
| **Name** | `firstName` |
| **User Model Attribute** | `firstName` |
| **LDAP Attribute** | `givenName` |
| **Read Only** | `ON` |
| **Always Read Value From LDAP** | `ON` |
| **Is Mandatory In LDAP** | `OFF` |

### 3.4. Last Name Mapper

**Agregar Mapper:** `Add mapper` → `user-attribute-ldap-mapper`

| Campo | Valor |
|-------|-------|
| **Name** | `lastName` |
| **User Model Attribute** | `lastName` |
| **LDAP Attribute** | `sn` |
| **Read Only** | `ON` |
| **Always Read Value From LDAP** | `ON` |
| **Is Mandatory In LDAP** | `OFF` |

### 3.5. Full Name Mapper (Opcional)

**Agregar Mapper:** `Add mapper` → `full-name-ldap-mapper`

| Campo | Valor |
|-------|-------|
| **Name** | `fullName` |
| **LDAP Full Name Attribute** | `displayName` |
| **Read Only** | `ON` |
| **Write Only** | `OFF` |

---

## Paso 4: Mapear Grupos AD a Roles

### 4.1. Crear Grupos en Active Directory

**Responsable:** Equipo de IT / Active Directory Admins

```powershell
# En Active Directory (PowerShell)

# Grupo de Administradores
New-ADGroup -Name "SingularBank-SignatureRouter-Admins" `
    -GroupScope Global `
    -GroupCategory Security `
    -Path "OU=Groups,DC=singularbank,DC=com" `
    -Description "Administradores del portal Signature Router"

# Grupo de Operadores
New-ADGroup -Name "SingularBank-SignatureRouter-Operators" `
    -GroupScope Global `
    -GroupCategory Security `
    -Path "OU=Groups,DC=singularbank,DC=com" `
    -Description "Operadores del portal Signature Router"

# Grupo de Viewers
New-ADGroup -Name "SingularBank-SignatureRouter-Viewers" `
    -GroupScope Global `
    -GroupCategory Security `
    -Path "OU=Groups,DC=singularbank,DC=com" `
    -Description "Usuarios read-only del portal Signature Router"

# Grupo de Support
New-ADGroup -Name "SingularBank-SignatureRouter-Support" `
    -GroupScope Global `
    -GroupCategory Security `
    -Path "OU=Groups,DC=singularbank,DC=com" `
    -Description "Equipo de soporte del portal Signature Router"
```

### 4.2. Asignar Usuarios a Grupos AD

```powershell
# Ejemplo: Agregar usuario a grupo de Admins
Add-ADGroupMember -Identity "SingularBank-SignatureRouter-Admins" `
    -Members "juan.perez", "maria.garcia"

# Ejemplo: Agregar usuario a grupo de Operators
Add-ADGroupMember -Identity "SingularBank-SignatureRouter-Operators" `
    -Members "pedro.lopez", "ana.martinez"
```

### 4.3. Configurar Group Mapper en Keycloak

**Navegación:** `User Federation` → `Active Directory - SingularBank` → `Mappers` → `Add mapper`

**Tipo:** `group-ldap-mapper`

| Campo | Valor |
|-------|-------|
| **Name** | `AD-Groups` |
| **LDAP Groups DN** | `OU=Groups,DC=singularbank,DC=com` |
| **Group Name LDAP Attribute** | `cn` |
| **Group Object Classes** | `group` |
| **Preserve Group Inheritance** | `ON` |
| **Ignore Missing Groups** | `OFF` |
| **Membership LDAP Attribute** | `member` |
| **Membership Attribute Type** | `DN` |
| **Membership User LDAP Attribute** | `cn` |
| **LDAP Filter** | `(cn=SingularBank-SignatureRouter-*)` |
| **Mode** | `READ_ONLY` |
| **User Groups Retrieve Strategy** | `LOAD_GROUPS_BY_MEMBER_ATTRIBUTE` |
| **Member-Of LDAP Attribute** | `memberOf` |
| **Mapped Group Attributes** | [vacío] |
| **Drop non-existing groups during sync** | `OFF` |

### 4.4. Crear Roles en Keycloak

**Navegación:** `Realm Settings` → `Roles` → `Add Role`

Crear los siguientes roles:

| Role Name | Description |
|-----------|-------------|
| `ADMIN` | Full system access - all operations allowed |
| `OPERATOR` | Operations and monitoring - no user management |
| `VIEWER` | Read-only access - dashboards and metrics |
| `SUPPORT` | Support operations - troubleshooting and logs |

### 4.5. Mapear Grupos AD → Roles Keycloak

Ahora necesitamos mapear cada grupo AD a su rol correspondiente.

**Opción A: Via Group Membership** (Recomendado)

**Navegación:** `Groups` → [Seleccionar grupo] → `Role Mapping`

| Grupo AD (sincronizado) | Rol Keycloak |
|-------------------------|--------------|
| `SingularBank-SignatureRouter-Admins` | `ADMIN` |
| `SingularBank-SignatureRouter-Operators` | `OPERATOR` |
| `SingularBank-SignatureRouter-Viewers` | `VIEWER` |
| `SingularBank-SignatureRouter-Support` | `SUPPORT` |

Para cada grupo:
1. `Groups` → Buscar y seleccionar grupo (ej: `SingularBank-SignatureRouter-Admins`)
2. Tab `Role Mapping`
3. Click `Assign role`
4. Seleccionar el rol correspondiente (ej: `ADMIN`)
5. Click `Assign`

**Opción B: Via Hardcoded Role Mapper** (Alternativa)

Si la Opción A no funciona, crear mappers individuales:

**Navegación:** `User Federation` → `Active Directory - SingularBank` → `Mappers` → `Add mapper`

**Tipo:** `hardcoded-role-mapper`

| Campo | Valor |
|-------|-------|
| **Name** | `AD-Admins-to-ADMIN` |
| **Role** | `ADMIN` |

**LDAP Filter (avanzado):**
```
(memberOf=CN=SingularBank-SignatureRouter-Admins,OU=Groups,DC=singularbank,DC=com)
```

Repetir para cada grupo/rol.

---

## Paso 5: Testing

### 5.1. Verificar Sincronización de Usuarios

**Navegación:** `Users` → `View all users`

- ✅ Deben aparecer usuarios de Active Directory
- ✅ Verificar que tengan email, first name, last name
- ✅ Verificar que el username sea el `sAMAccountName` de AD

### 5.2. Verificar Grupos Sincronizados

**Navegación:** `Groups`

- ✅ Deben aparecer grupos de AD con prefijo `SingularBank-SignatureRouter-`
- ✅ Verificar que tengan miembros

### 5.3. Verificar Mapeo de Roles

**Navegación:** `Users` → [Seleccionar usuario] → `Role Mapping`

- ✅ Usuarios de grupo `Admins` deben tener rol `ADMIN`
- ✅ Usuarios de grupo `Operators` deben tener rol `OPERATOR`
- ✅ Usuarios de grupo `Viewers` deben tener rol `VIEWER`

### 5.4. Testing de Login

#### 5.4.1. Test desde Keycloak Account Console

1. Abrir (en modo incógnito): `https://keycloak.singularbank.com/realms/signature-router/account`
2. Login con credenciales AD: `juan.perez` / `[password de AD]`
3. ✅ Debe loguear correctamente
4. ✅ Verificar datos de perfil (nombre, email)

#### 5.4.2. Test desde Admin Portal

1. Abrir: `https://admin.singularbank.com`
2. Login con credenciales AD
3. ✅ Debe loguear correctamente
4. ✅ Verificar JWT token contiene roles correctos

#### 5.4.3. Verificar JWT Claims

Decodificar el JWT token en https://jwt.io:

```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Juan Pérez",
  "email": "juan.perez@singularbank.com",
  "preferred_username": "juan.perez",
  "realm_access": {
    "roles": ["ADMIN", "OPERATOR"]
  },
  "groups": [
    "/SingularBank-SignatureRouter-Admins",
    "/SingularBank-SignatureRouter-Operators"
  ]
}
```

✅ Verificar:
- `name` está correcto
- `email` está correcto
- `preferred_username` es el sAMAccountName
- `realm_access.roles` contiene los roles esperados
- `groups` contiene los grupos AD

### 5.5. Testing de Backend API

```bash
# 1. Obtener token
TOKEN=$(curl -X POST "https://keycloak.singularbank.com/realms/signature-router/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=juan.perez" \
  -d "password=[password]" \
  -d "grant_type=password" \
  -d "client_id=admin-portal" \
  | jq -r '.access_token')

# 2. Test endpoint (debe funcionar con rol ADMIN)
curl -X GET "https://api.singularbank.com/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN"

# 3. Debe retornar lista de usuarios
```

---

## Troubleshooting

### Problema: "Test connection" falla

**Síntomas:**
```
Could not connect to LDAP server
```

**Soluciones:**
1. Verificar conectividad de red:
   ```bash
   telnet ad.singularbank.com 389
   ```
2. Verificar firewall permite conexión desde Keycloak
3. Verificar URL correcta: `ldap://ad.singularbank.com:389`

---

### Problema: "Test authentication" falla

**Síntomas:**
```
Invalid credentials
```

**Soluciones:**
1. Verificar Bind DN correcto:
   - Formato: `CN=keycloak-service,OU=ServiceAccounts,DC=singularbank,DC=com`
   - **NO** usar: `keycloak-service@singularbank.com`
2. Verificar password del service account
3. Verificar service account no está bloqueado en AD
4. Test manual con ldapsearch:
   ```bash
   ldapsearch -x -H ldap://ad.singularbank.com:389 \
       -D "CN=keycloak-service,OU=ServiceAccounts,DC=singularbank,DC=com" \
       -w "password"
   ```

---

### Problema: Usuarios no se sincronizan

**Síntomas:**
- "Synchronize all users" no importa ningún usuario
- 0 users imported

**Soluciones:**
1. Verificar **Users DN** es correcto:
   ```
   OU=Users,DC=singularbank,DC=com
   ```
2. Verificar **Custom User LDAP Filter**:
   - Si está vacío, debe importar todos
   - Si tiene filtro, verificar sintaxis:
     ```
     (&(objectClass=user)(memberOf=CN=SingularBank-SignatureRouter-*,OU=Groups,DC=singularbank,DC=com))
     ```
3. Verificar permisos de lectura del service account
4. Check Keycloak logs:
   ```bash
   docker logs keycloak | grep LDAP
   ```

---

### Problema: Grupos no se sincronizan

**Síntomas:**
- Usuarios importados pero sin grupos
- Tab "Groups" vacío

**Soluciones:**
1. Verificar Group Mapper está configurado
2. Verificar **LDAP Groups DN**:
   ```
   OU=Groups,DC=singularbank,DC=com
   ```
3. Verificar **LDAP Filter** en Group Mapper:
   ```
   (cn=SingularBank-SignatureRouter-*)
   ```
4. Sincronizar manualmente:
   - `User Federation` → `Active Directory` → `Mappers` → `AD-Groups`
   - Click `Sync LDAP Groups To Keycloak`

---

### Problema: Roles no se asignan

**Síntomas:**
- Usuarios logueados pero sin roles
- JWT no contiene `realm_access.roles`

**Soluciones:**
1. Verificar mapeo de grupos a roles:
   - `Groups` → [Seleccionar grupo] → `Role Mapping`
   - Asegurarse que cada grupo AD tiene rol asignado
2. Verificar Client Scopes:
   - `Clients` → `admin-portal` → `Client scopes`
   - `roles` debe estar en "Assigned client scopes"
3. Verificar Mapper en Client:
   - `Clients` → `admin-portal` → `Client scopes` → `roles` → `Mappers`
   - Debe existir mapper "realm roles"

---

### Problema: Login falla en Admin Portal

**Síntomas:**
- Login desde Keycloak funciona
- Login desde Admin Portal falla

**Soluciones:**
1. Verificar Client configurado:
   - `Clients` → `admin-portal`
   - `Valid redirect URIs`: `https://admin.singularbank.com/*`
   - `Web origins`: `https://admin.singularbank.com`
2. Verificar CORS en backend:
   ```yaml
   cors:
     allowed-origins:
       - https://admin.singularbank.com
   ```
3. Check browser console para errores CORS/OAuth

---

### Problema: Backend rechaza JWT

**Síntomas:**
- Frontend login OK
- Backend retorna HTTP 401

**Soluciones:**
1. Verificar backend OAuth2 configuración:
   ```yaml
   spring:
     security:
       oauth2:
         resourceserver:
           jwt:
             issuer-uri: https://keycloak.singularbank.com/realms/signature-router
             jwk-set-uri: https://keycloak.singularbank.com/realms/signature-router/protocol/openid-connect/certs
   ```
2. Verificar JWT claims extractor:
   ```java
   grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");
   grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
   ```
3. Verificar endpoint en Swagger UI con token

---

## 📚 Checklist Final

### Keycloak Configuration

- [ ] User Federation creada (`Active Directory - SingularBank`)
- [ ] Edit Mode = `READ_ONLY`
- [ ] Test connection = Success
- [ ] Test authentication = Success
- [ ] Usuarios sincronizados (> 0)
- [ ] Mappers configurados (username, email, firstName, lastName)
- [ ] Group mapper configurado
- [ ] Grupos sincronizados
- [ ] Roles creados (ADMIN, OPERATOR, VIEWER, SUPPORT)
- [ ] Grupos mapeados a roles

### Active Directory

- [ ] Service account creado (`keycloak-service`)
- [ ] Permisos de lectura asignados
- [ ] Grupos creados (`SingularBank-SignatureRouter-*`)
- [ ] Usuarios asignados a grupos

### Testing

- [ ] Login desde Keycloak Account Console funciona
- [ ] Login desde Admin Portal funciona
- [ ] JWT contiene roles correctos
- [ ] Backend acepta JWT
- [ ] RBAC funciona (ADMIN puede acceder, VIEWER no puede a endpoints ADMIN)

---

## 📖 Referencias

- [Keycloak User Federation LDAP](https://www.keycloak.org/docs/latest/server_admin/#_ldap)
- [Active Directory Integration Guide](https://www.keycloak.org/docs/latest/server_admin/#_ldap_mappers)
- [Keycloak Group Mappers](https://www.keycloak.org/docs/latest/server_admin/#_group_ldap_mapper)
- [JWT Claims](https://www.keycloak.org/docs/latest/server_admin/#_protocol-mappers)

---

**Documento creado:** 30 de noviembre de 2025  
**Última actualización:** 30 de noviembre de 2025  
**Mantenedor:** DevOps Team + Security Team  
**Status:** ✅ Documentado - Pendiente Implementación

