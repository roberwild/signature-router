# Active Directory Groups → Keycloak Roles Mapping

**Proyecto:** Signature Router  
**Epic:** Epic 12 - Admin Panel Integration  
**Fecha:** 30 de noviembre de 2025

---

## 📋 Resumen

Este documento describe el mapeo entre **grupos de Active Directory** y **roles de Keycloak** para el portal de administración.

### Flujo Completo

```
Usuario AD → Grupo AD → Keycloak Federation → Rol Keycloak → JWT Claim → RBAC Backend
```

---

## 🏢 Grupos de Active Directory

### Nomenclatura

Todos los grupos relacionados con Signature Router siguen la convención:

```
SingularBank-SignatureRouter-{ROLE}
```

Donde `{ROLE}` puede ser: `Admins`, `Operators`, `Viewers`, `Support`

### Grupos a Crear en AD

| Grupo AD | DN Completo | Descripción |
|----------|-------------|-------------|
| `SingularBank-SignatureRouter-Admins` | `CN=SingularBank-SignatureRouter-Admins,OU=Groups,DC=singularbank,DC=com` | Administradores con acceso completo al portal |
| `SingularBank-SignatureRouter-Operators` | `CN=SingularBank-SignatureRouter-Operators,OU=Groups,DC=singularbank,DC=com` | Operadores con acceso a métricas y monitoreo |
| `SingularBank-SignatureRouter-Viewers` | `CN=SingularBank-SignatureRouter-Viewers,OU=Groups,DC=singularbank,DC=com` | Usuarios con acceso de solo lectura |
| `SingularBank-SignatureRouter-Support` | `CN=SingularBank-SignatureRouter-Support,OU=Groups,DC=singularbank,DC=com` | Equipo de soporte técnico |

### Script PowerShell para Crear Grupos

```powershell
# Script: crear-grupos-signature-router.ps1
# Ejecutar en Domain Controller o con permisos de AD Admin

# Variables
$GroupsOU = "OU=Groups,DC=singularbank,DC=com"
$Prefix = "SingularBank-SignatureRouter"

# Grupos a crear
$Groups = @(
    @{
        Name = "$Prefix-Admins"
        Description = "Administradores del portal Signature Router - Full access"
    },
    @{
        Name = "$Prefix-Operators"
        Description = "Operadores del portal Signature Router - Operations and monitoring"
    },
    @{
        Name = "$Prefix-Viewers"
        Description = "Usuarios read-only del portal Signature Router - Dashboards only"
    },
    @{
        Name = "$Prefix-Support"
        Description = "Equipo de soporte del portal Signature Router - Troubleshooting"
    }
)

# Crear grupos
foreach ($Group in $Groups) {
    Write-Host "Creando grupo: $($Group.Name)"
    
    try {
        New-ADGroup `
            -Name $Group.Name `
            -GroupScope Global `
            -GroupCategory Security `
            -Path $GroupsOU `
            -Description $Group.Description `
            -ErrorAction Stop
        
        Write-Host "✅ Grupo creado: $($Group.Name)" -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Message -like "*already exists*") {
            Write-Host "⚠️  Grupo ya existe: $($Group.Name)" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ Error creando grupo: $($Group.Name)" -ForegroundColor Red
            Write-Host $_.Exception.Message
        }
    }
}

Write-Host "`n✅ Script completado" -ForegroundColor Green
```

---

## 🔑 Roles de Keycloak

### Roles a Crear

Los siguientes roles deben existir en Keycloak (Realm: `signature-router`):

| Rol Keycloak | Descripción | Permisos |
|--------------|-------------|----------|
| `ADMIN` | Administrador completo | Full access - Todas las operaciones |
| `OPERATOR` | Operador | Operations, monitoring, alerts - NO user management |
| `VIEWER` | Visualizador | Read-only - Dashboards, métricas |
| `SUPPORT` | Soporte | Troubleshooting, logs - acceso limitado |

### Crear Roles en Keycloak (via Admin Console)

**Navegación:** `Realm Settings` → `Roles` → `Create Role`

Para cada rol:

1. **ADMIN**
   - Role Name: `ADMIN`
   - Description: `Full system access - all operations allowed`
   
2. **OPERATOR**
   - Role Name: `OPERATOR`
   - Description: `Operations and monitoring - no user management`
   
3. **VIEWER**
   - Role Name: `VIEWER`
   - Description: `Read-only access - dashboards and metrics`
   
4. **SUPPORT**
   - Role Name: `SUPPORT`
   - Description: `Support operations - troubleshooting and logs`

### Crear Roles en Keycloak (via REST API)

```bash
# Variables
KEYCLOAK_URL="https://keycloak.singularbank.com"
REALM="signature-router"
ADMIN_TOKEN="<token>"

# Crear rol ADMIN
curl -X POST "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ADMIN",
    "description": "Full system access - all operations allowed"
  }'

# Crear rol OPERATOR
curl -X POST "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OPERATOR",
    "description": "Operations and monitoring - no user management"
  }'

# Crear rol VIEWER
curl -X POST "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIEWER",
    "description": "Read-only access - dashboards and metrics"
  }'

# Crear rol SUPPORT
curl -X POST "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SUPPORT",
    "description": "Support operations - troubleshooting and logs"
  }'
```

---

## 🔄 Mapeo Grupos AD → Roles Keycloak

### Tabla de Mapeo

| Grupo AD | Rol Keycloak | Permisos en Portal |
|----------|--------------|-------------------|
| `SingularBank-SignatureRouter-Admins` | `ADMIN` | ✅ Dashboard<br>✅ Signatures (full)<br>✅ Providers<br>✅ Metrics<br>✅ Users (CRUD)<br>✅ Security<br>✅ Alerts |
| `SingularBank-SignatureRouter-Operators` | `OPERATOR` | ✅ Dashboard<br>✅ Signatures (full)<br>✅ Providers<br>✅ Metrics<br>❌ Users<br>✅ Security<br>✅ Alerts |
| `SingularBank-SignatureRouter-Viewers` | `VIEWER` | ✅ Dashboard (view)<br>✅ Signatures (view)<br>✅ Providers (view)<br>✅ Metrics (view)<br>❌ Users<br>❌ Security<br>❌ Alerts |
| `SingularBank-SignatureRouter-Support` | `SUPPORT` | ✅ Dashboard<br>✅ Signatures (view + detail)<br>✅ Providers<br>✅ Metrics<br>❌ Users<br>❌ Security<br>✅ Alerts (view) |

### Implementar Mapeo en Keycloak

**Opción 1: Via Groups (Recomendado)**

Después de sincronizar grupos desde AD:

**Navegación:** `Groups` → [Seleccionar grupo AD] → `Role Mapping` → `Assign role`

| Paso | Grupo AD (sincronizado en Keycloak) | Acción |
|------|-------------------------------------|--------|
| 1 | `SingularBank-SignatureRouter-Admins` | Assign role: `ADMIN` |
| 2 | `SingularBank-SignatureRouter-Operators` | Assign role: `OPERATOR` |
| 3 | `SingularBank-SignatureRouter-Viewers` | Assign role: `VIEWER` |
| 4 | `SingularBank-SignatureRouter-Support` | Assign role: `SUPPORT` |

**Opción 2: Via Client Role Mappers**

Si la Opción 1 no funciona, crear un mapper por cada grupo:

**Navegación:** `User Federation` → `Active Directory` → `Mappers` → `Add mapper`

**Tipo:** `role-ldap-mapper`

| Campo | Valor (ejemplo para Admins) |
|-------|------------------------------|
| Name | `AD-Admins-to-ADMIN` |
| Role | `ADMIN` |
| Mode | `READ_ONLY` |
| User Roles Retrieve Strategy | `LOAD_ROLES_BY_MEMBER_ATTRIBUTE` |
| Memberof LDAP Attribute | `memberOf` |
| Role Name LDAP Attribute | `cn` |
| Role Object Classes | `group` |
| Roles LDAP Filter | `(cn=SingularBank-SignatureRouter-Admins)` |

Repetir para cada grupo/rol.

---

## 👥 Asignación de Usuarios a Grupos AD

### Via Active Directory Users and Computers (GUI)

1. Abrir **Active Directory Users and Computers**
2. Navegar a usuario: `OU=Users,DC=singularbank,DC=com`
3. Right-click en usuario → **Properties**
4. Tab **Member Of** → **Add**
5. Buscar grupo: `SingularBank-SignatureRouter-Admins`
6. Click **OK**

### Via PowerShell

```powershell
# Asignar usuario individual
Add-ADGroupMember `
    -Identity "SingularBank-SignatureRouter-Admins" `
    -Members "juan.perez"

# Asignar múltiples usuarios
$AdminUsers = @("juan.perez", "maria.garcia", "pedro.lopez")
Add-ADGroupMember `
    -Identity "SingularBank-SignatureRouter-Admins" `
    -Members $AdminUsers

# Asignar operadores
$OperatorUsers = @("ana.martinez", "carlos.rodriguez")
Add-ADGroupMember `
    -Identity "SingularBank-SignatureRouter-Operators" `
    -Members $OperatorUsers

# Asignar viewers
$ViewerUsers = @("luisa.fernandez", "miguel.santos")
Add-ADGroupMember `
    -Identity "SingularBank-SignatureRouter-Viewers" `
    -Members $ViewerUsers
```

### Verificar Membresía de Grupos

```powershell
# Listar miembros de un grupo
Get-ADGroupMember -Identity "SingularBank-SignatureRouter-Admins" | Select-Object Name, SamAccountName

# Ver grupos de un usuario
Get-ADUser -Identity "juan.perez" -Properties MemberOf | Select-Object -ExpandProperty MemberOf
```

---

## 🧪 Testing del Mapeo

### 1. Verificar Usuario en AD

```powershell
# Verificar usuario existe y está en grupo correcto
Get-ADUser -Identity "juan.perez" -Properties MemberOf | 
    Select-Object Name, SamAccountName, @{Name="Groups";Expression={$_.MemberOf}}
```

**Resultado esperado:**
```
Name          : Juan Pérez
SamAccountName: juan.perez
Groups        : {CN=SingularBank-SignatureRouter-Admins,OU=Groups,DC=singularbank,DC=com}
```

### 2. Sincronizar Keycloak desde AD

**Navegación:** `User Federation` → `Active Directory - SingularBank` → `Synchronize all users`

### 3. Verificar Usuario en Keycloak

**Navegación:** `Users` → Search: `juan.perez`

**Verificar:**
- ✅ Usuario existe
- ✅ Email correcto
- ✅ Username = sAMAccountName

### 4. Verificar Grupos en Keycloak

**Navegación:** `Users` → `juan.perez` → `Groups`

**Verificar:**
- ✅ Aparece en grupo `SingularBank-SignatureRouter-Admins`

### 5. Verificar Roles en Keycloak

**Navegación:** `Users` → `juan.perez` → `Role Mapping`

**Verificar:**
- ✅ Tiene rol `ADMIN` asignado

### 6. Verificar JWT Claims

Login desde Admin Portal y decodificar JWT en https://jwt.io:

```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Juan Pérez",
  "email": "juan.perez@singularbank.com",
  "preferred_username": "juan.perez",
  "realm_access": {
    "roles": ["ADMIN"]  ← ✅ Rol presente
  },
  "groups": [
    "/SingularBank-SignatureRouter-Admins"  ← ✅ Grupo presente
  ]
}
```

### 7. Verificar RBAC en Backend

```bash
# Login y obtener token
TOKEN=$(curl -X POST "https://keycloak.singularbank.com/realms/signature-router/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=juan.perez" \
  -d "password=password123" \
  -d "grant_type=password" \
  -d "client_id=admin-portal" \
  | jq -r '.access_token')

# Test endpoint que requiere ADMIN
curl -X GET "https://api.singularbank.com/api/v1/admin/users" \
  -H "Authorization: Bearer $TOKEN"

# ✅ Debe retornar lista de usuarios (200 OK)
# ❌ Si retorna 403, el mapeo de roles no está funcionando
```

---

## 📊 Matriz de Permisos por Rol

### Endpoints del Admin Portal

| Endpoint | URL | ADMIN | OPERATOR | VIEWER | SUPPORT |
|----------|-----|-------|----------|--------|---------|
| **Dashboard** | GET `/api/v1/admin/dashboard/metrics` | ✅ | ✅ | ❌ | ✅ |
| **Signatures - List** | GET `/api/v1/admin/signatures` | ✅ | ✅ | ✅ | ✅ |
| **Signatures - Detail** | GET `/api/v1/admin/signatures/{id}` | ✅ | ✅ | ✅ | ✅ |
| **Providers** | GET `/api/v1/admin/providers` | ✅ | ✅ | ✅ | ✅ |
| **Metrics** | GET `/api/v1/admin/metrics` | ✅ | ✅ | ✅ | ✅ |
| **Users - List** | GET `/api/v1/admin/users` | ✅ | ❌ | ❌ | ❌ |
| **Users - Create** | POST `/api/v1/admin/users` | ✅<sup>1</sup> | ❌ | ❌ | ❌ |
| **Users - Update** | PUT `/api/v1/admin/users/{id}` | ✅<sup>1</sup> | ❌ | ❌ | ❌ |
| **Users - Delete** | DELETE `/api/v1/admin/users/{id}` | ✅<sup>1</sup> | ❌ | ❌ | ❌ |
| **Security - Overview** | GET `/api/v1/admin/security/overview` | ✅ | ✅ | ❌ | ❌ |
| **Security - Audit** | GET `/api/v1/admin/security/access-audit` | ✅ | ✅ | ❌ | ❌ |
| **Alerts - List** | GET `/api/v1/admin/alerts` | ✅ | ✅ | ❌ | ✅ |
| **Alerts - Acknowledge** | PUT `/api/v1/admin/alerts/{id}/acknowledge` | ✅ | ✅ | ❌ | ❌ |
| **Alerts - Resolve** | PUT `/api/v1/admin/alerts/{id}/resolve` | ✅ | ✅ | ❌ | ❌ |

<sup>1</sup> Solo disponible en modo `LOCAL`. En modo `ACTIVE_DIRECTORY` retorna 403.

---

## 🔧 Troubleshooting

### Problema: Usuario no tiene roles después de login

**Diagnóstico:**
```bash
# 1. Verificar usuario en AD está en grupo
Get-ADUser -Identity "juan.perez" -Properties MemberOf

# 2. Sincronizar Keycloak
# Keycloak Admin Console → User Federation → Synchronize all users

# 3. Verificar grupo en Keycloak tiene rol asignado
# Keycloak Admin Console → Groups → [grupo] → Role Mapping
```

**Solución:**
- Asegurar usuario está en grupo AD
- Sincronizar usuarios desde AD
- Verificar mapeo grupo → rol en Keycloak

### Problema: JWT no contiene claim `realm_access.roles`

**Diagnóstico:**
```bash
# Verificar Client Scopes
# Keycloak Admin Console → Clients → admin-portal → Client scopes
```

**Solución:**
- Asegurar "roles" está en "Assigned client scopes"
- Verificar mapper "realm roles" existe en scope "roles"

### Problema: Backend retorna 403 a pesar de tener rol

**Diagnóstico:**
```java
// Verificar configuración Spring Security
grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");
grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
```

**Solución:**
- Verificar JWT contiene `realm_access.roles`
- Verificar prefijo `ROLE_` está configurado
- Verificar `@PreAuthorize("hasRole('ADMIN')")` (sin prefijo `ROLE_`)

---

## 📚 Scripts de Automatización

### Script: Sincronizar Todo

```bash
#!/bin/bash
# sync-ad-to-keycloak.sh
# Sincroniza usuarios y grupos de AD a Keycloak

KEYCLOAK_URL="https://keycloak.singularbank.com"
REALM="signature-router"
ADMIN_USER="admin"
ADMIN_PASS="<password>"

# 1. Obtener token de admin
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASS" \
  -d "grant_type=password" \
  | jq -r '.access_token')

echo "✅ Token obtenido"

# 2. Trigger sync de usuarios
curl -X POST "$KEYCLOAK_URL/admin/realms/$REALM/user-storage/{federation-id}/sync?action=triggerFullSync" \
  -H "Authorization: Bearer $TOKEN"

echo "✅ Sync de usuarios completado"

# 3. Trigger sync de grupos
curl -X POST "$KEYCLOAK_URL/admin/realms/$REALM/user-storage/{federation-id}/mappers/{mapper-id}/sync?direction=fedToKeycloak" \
  -H "Authorization: Bearer $TOKEN"

echo "✅ Sync de grupos completado"
```

---

**Documento creado:** 30 de noviembre de 2025  
**Última actualización:** 30 de noviembre de 2025  
**Mantenedor:** DevOps Team + IT Department  
**Status:** ✅ Documentado

