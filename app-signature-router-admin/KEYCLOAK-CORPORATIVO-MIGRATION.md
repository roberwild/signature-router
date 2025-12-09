# Migración: Keycloak Local → Keycloak Corporativo con Active Directory

**Fecha Creación:** 2025-12-09  
**Última Actualización:** 2025-12-09  
**Autor:** BMAD Development Team  
**Versión:** 1.0

---

## 📋 Resumen Ejecutivo

Este documento detalla el proceso de migración de Keycloak local (Docker) a Keycloak corporativo federado con Active Directory, incluyendo:

- ✅ Ajustes necesarios en la extracción de roles del JWT
- ✅ Configuración de variables de entorno
- ✅ Scripts de diagnóstico
- ✅ Troubleshooting de escenarios comunes

**Tiempo Estimado:** 30-60 minutos  
**Complejidad:** Media  
**Riesgo:** Bajo (código backward-compatible incluido)

---

## 🔧 Configuración Actual (Keycloak Local)

### Variables de Entorno (`.env.local`)

```bash
# Keycloak Local (Docker)
KEYCLOAK_CLIENT_ID="signature-router-admin"
KEYCLOAK_CLIENT_SECRET="signature-router-admin-secret-12345"
KEYCLOAK_ISSUER="http://localhost:8180/realms/signature-router"
```

### Estructura JWT Actual

```json
{
  "realm_access": {
    "roles": ["PRF_CONSULTIVO", "USER"]
  },
  "resource_access": {
    "signature-router-admin": {
      "roles": ["PRF_ADMIN"]
    }
  },
  "preferred_username": "user",
  "email": "user@bank.com"
}
```

**Extracción de Roles:**
- `lib/auth/roles.ts` → `extractRolesFromJWT()` lee de `realm_access` y `resource_access`

---

## 🌐 Configuración Corporativa (Keycloak + AD)

### Variables de Entorno (`.env.production` o `.env.uat`)

```bash
# Keycloak Corporativo (Federado con AD)
KEYCLOAK_CLIENT_ID="signature-router-admin"  # Solicitar a Infraestructura
KEYCLOAK_CLIENT_SECRET="<solicitar-a-infra>"  # Secret corporativo
KEYCLOAK_ISSUER="https://keycloak.singular.com/realms/singular-bank"  # URL corporativa
```

**IMPORTANTE:**
- ✅ El `CLIENT_ID` puede cambiar (verificar con Infraestructura)
- ✅ El `ISSUER` apuntará al realm corporativo
- ✅ El `CLIENT_SECRET` será gestionado como secret de Kubernetes

---

## 🔍 Posibles Estructuras de JWT Corporativo

### **Escenario 1: Roles en `resource_access` (Ideal - No requiere cambios)**

```json
{
  "realm_access": {
    "roles": ["INTERNAL_USER", "EMPLOYEES"]
  },
  "resource_access": {
    "signature-router-admin": {
      "roles": ["PRF_ADMIN", "PRF_CONSULTIVO"]
    }
  },
  "preferred_username": "rgutierrez",
  "email": "rgutierrez@singular.com",
  "name": "Ricardo Gutierrez"
}
```

**Estado:** ✅ **Funciona sin cambios** - El código actual ya maneja este caso.

---

### **Escenario 2: Roles en `groups` (Común con AD)**

```json
{
  "realm_access": {
    "roles": ["default-roles-singular-bank"]
  },
  "groups": [
    "PRF_ADMIN",
    "PRF_CONSULTIVO",
    "INTERNAL_USER",
    "/Singular/TI/Desarrollo"
  ],
  "preferred_username": "rgutierrez",
  "email": "rgutierrez@singular.com"
}
```

**Estado:** ⚠️ **Requiere ajuste menor** - Ver sección "Código Actualizado"

---

### **Escenario 3: Roles en Formato DN de AD**

```json
{
  "realm_access": {
    "roles": ["default-roles-singular-bank"]
  },
  "ad_groups": [
    "CN=PRF_ADMIN,OU=Applications,OU=Groups,DC=singular,DC=com",
    "CN=PRF_CONSULTIVO,OU=Applications,OU=Groups,DC=singular,DC=com",
    "CN=TI-Desarrollo,OU=Departments,DC=singular,DC=com"
  ],
  "preferred_username": "rgutierrez"
}
```

**Estado:** ⚠️ **Requiere parsing de DN** - Ver sección "Código Actualizado"

---

### **Escenario 4: Mapeo Custom en Keycloak**

```json
{
  "roles": ["PRF_ADMIN", "PRF_CONSULTIVO"],  // Custom claim
  "department": "TI",
  "division": "BackOffice",
  "preferred_username": "rgutierrez"
}
```

**Estado:** ⚠️ **Requiere configuración en Keycloak** - Solicitar a Infraestructura que mapeen los grupos de AD a un claim `roles`

---

## ✅ Código Actualizado - Soporte Multi-Escenario

### **1. Actualizar `lib/auth/roles.ts`**

Reemplaza la función `extractRolesFromJWT()` con esta versión extendida:

```typescript
/**
 * Extract roles from JWT token - Multi-source compatible
 * 
 * Soporta extracción de roles desde:
 * 1. realm_access.roles (Keycloak estándar)
 * 2. resource_access.{client_id}.roles (Client roles)
 * 3. groups (AD integration - array de strings)
 * 4. ad_groups (AD integration - DN format)
 * 5. roles (Custom claim)
 * 
 * @param token - Decoded JWT token from NextAuth session or Keycloak
 * @returns Array of role strings (without ROLE_ prefix, uppercase)
 */
export function extractRolesFromJWT(token: any): string[] {
  if (!token) return [];

  const roles: string[] = [];

  // 1. Extract realm_access.roles (Keycloak estándar)
  if (token.realm_access?.roles) {
    roles.push(...token.realm_access.roles);
  }

  // 2. Extract resource_access.{client_id}.roles (Client-specific roles)
  if (token.resource_access) {
    Object.values(token.resource_access).forEach((clientAccess: any) => {
      if (clientAccess?.roles) {
        roles.push(...clientAccess.roles);
      }
    });
  }

  // 3. Extract groups (AD integration - simple array)
  if (token.groups && Array.isArray(token.groups)) {
    // Filter only app-related groups (PRF_*, ADMIN, USER, AUDITOR, etc.)
    const appGroups = token.groups.filter((g: string) => {
      const groupName = typeof g === 'string' ? g.trim() : '';
      // Accept groups that match PRF_* or known role names
      return groupName.startsWith('PRF_') || 
             ['ADMIN', 'USER', 'AUDITOR', 'CONSULTIVO', 'INTERNAL_USER'].includes(groupName.toUpperCase());
    });
    roles.push(...appGroups);
  }

  // 4. Extract ad_groups (AD integration - DN format)
  if (token.ad_groups && Array.isArray(token.ad_groups)) {
    // Parse AD Distinguished Name format: "CN=PRF_ADMIN,OU=..."
    const adRoles = token.ad_groups.map((dn: string) => {
      if (typeof dn !== 'string') return null;
      const match = dn.match(/CN=([^,]+)/i);
      return match ? match[1] : null;
    }).filter(Boolean);
    roles.push(...adRoles);
  }

  // 5. Extract custom 'roles' claim (if Keycloak is configured with custom mapper)
  if (token.roles && Array.isArray(token.roles)) {
    roles.push(...token.roles);
  }

  // Normalize to uppercase and remove duplicates
  return [...new Set(roles.map(r => String(r).toUpperCase()))];
}
```

---

### **2. Actualizar `auth.ts` con Logging de Diagnóstico**

En el callback `jwt()`, añade logging detallado:

```typescript
async jwt({ token, account, user }) {
  if (account) {
    console.log("[auth] JWT callback - account received, storing tokens")
    token.accessToken = account.access_token
    token.refreshToken = account.refresh_token
    token.expiresAt = account.expires_at
    token.id = user?.id
    
    if (account.access_token) {
      try {
        const base64Url = account.access_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decodedToken = JSON.parse(jsonPayload);
        
        // 🔍 DIAGNÓSTICO: Loguear estructura completa en DEV
        if (process.env.NODE_ENV === 'development') {
          console.log("[auth] ===== JWT PAYLOAD ANALYSIS =====");
          console.log("[auth] Full payload:", decodedToken);
          console.log("[auth] realm_access:", decodedToken.realm_access);
          console.log("[auth] resource_access:", decodedToken.resource_access);
          console.log("[auth] groups:", decodedToken.groups);
          console.log("[auth] ad_groups:", decodedToken.ad_groups);
          console.log("[auth] roles (custom):", decodedToken.roles);
          console.log("[auth] preferred_username:", decodedToken.preferred_username);
          console.log("[auth] ==================================");
        }
        
        token.realm_access = decodedToken.realm_access
        token.resource_access = decodedToken.resource_access
        token.preferred_username = decodedToken.preferred_username
        const roles = extractRolesFromJWT(decodedToken)
        token.roles = roles
        console.log("[auth] ✅ Extracted roles from JWT:", roles)
      } catch (error) {
        console.error("[auth] ❌ Error decoding JWT:", error)
        token.roles = []
      }
    }
  }
  
  // ... resto del código
}
```

---

## 🧪 Script de Diagnóstico - Día de la Migración

### **Ejecutar INMEDIATAMENTE después del primer login corporativo**

Abre **DevTools (F12)** → **Console** y ejecuta:

```javascript
// ===== DIAGNÓSTICO KEYCLOAK CORPORATIVO =====
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.clear();
    console.log('%c===== KEYCLOAK CORPORATIVO - DIAGNÓSTICO =====', 'color: blue; font-size: 16px; font-weight: bold');
    
    console.log('\n%c1. ROLES EXTRAÍDOS (Session):', 'color: green; font-weight: bold');
    console.log('   Roles:', session.roles);
    console.log('   ✅ Esperado: Array con al menos 1 rol (ej: ["PRF_ADMIN", "INTERNAL_USER"])');
    console.log('   ❌ Si está vacío [], ver paso 2-6 para diagnosticar');
    
    const payload = JSON.parse(atob(session.accessToken.split('.')[1]));
    
    console.log('\n%c2. REALM ACCESS:', 'color: orange; font-weight: bold');
    console.log('   realm_access:', payload.realm_access);
    
    console.log('\n%c3. RESOURCE ACCESS (Client Roles):', 'color: orange; font-weight: bold');
    console.log('   resource_access:', payload.resource_access);
    
    console.log('\n%c4. GROUPS (AD Integration):', 'color: orange; font-weight: bold');
    console.log('   groups:', payload.groups);
    
    console.log('\n%c5. AD_GROUPS (DN Format):', 'color: orange; font-weight: bold');
    console.log('   ad_groups:', payload.ad_groups);
    
    console.log('\n%c6. CUSTOM ROLES CLAIM:', 'color: orange; font-weight: bold');
    console.log('   roles:', payload.roles);
    
    console.log('\n%c7. OTROS CLAIMS RELEVANTES:', 'color: purple; font-weight: bold');
    console.log('   preferred_username:', payload.preferred_username);
    console.log('   email:', payload.email);
    console.log('   name:', payload.name);
    console.log('   department:', payload.department);
    
    console.log('\n%c8. TODOS LOS CLAIMS DISPONIBLES:', 'color: gray; font-weight: bold');
    console.log('   Claims:', Object.keys(payload).filter(k => 
      !['exp', 'iat', 'iss', 'aud', 'sub', 'jti', 'azp', 'typ'].includes(k)
    ));
    
    console.log('\n%c===== FIN DIAGNÓSTICO =====', 'color: blue; font-size: 16px; font-weight: bold');
    
    // Guardar en variable global para fácil acceso
    window.jwtDiagnostic = {
      session,
      payload,
      extractedRoles: session.roles,
      allClaims: Object.keys(payload)
    };
    console.log('\n💾 Diagnóstico guardado en: window.jwtDiagnostic');
  });
```

### **Copiar y Enviar Resultado**

Después de ejecutar el script:
1. **Copia TODA la salida de la consola**
2. **Pégala en un documento** (para análisis posterior)
3. **Identifica** dónde están los roles (paso 2-6)
4. **Ajusta** `extractRolesFromJWT()` si es necesario

---

## 📝 Checklist de Migración - Día D

### **Pre-Migración (1 día antes)**

- [ ] Backup completo del código actual
- [ ] Actualizar `extractRolesFromJWT()` con versión extendida
- [ ] Activar logging de diagnóstico en `auth.ts`
- [ ] Preparar script de diagnóstico
- [ ] Obtener credenciales de Infraestructura:
  - [ ] `KEYCLOAK_CLIENT_ID`
  - [ ] `KEYCLOAK_CLIENT_SECRET`
  - [ ] `KEYCLOAK_ISSUER`
- [ ] Verificar que el cliente está configurado en Keycloak corporativo

### **Migración (Día D)**

**Paso 1: Actualizar Variables de Entorno**

```bash
# En el servidor (UAT/PROD) o .env.local para pruebas
KEYCLOAK_CLIENT_ID="<valor-de-infraestructura>"
KEYCLOAK_CLIENT_SECRET="<secret-corporativo>"
KEYCLOAK_ISSUER="https://keycloak.singular.com/realms/singular-bank"
```

**Paso 2: Reiniciar Frontend**

```bash
# Si es local
npm run dev

# Si es servidor
kubectl rollout restart deployment/signature-router-admin
```

**Paso 3: Primer Login de Prueba**

- [ ] Abrir `http://localhost:3000` (o URL de UAT)
- [ ] **F12** para abrir DevTools
- [ ] Login con usuario de AD
- [ ] **VERIFICAR** logs en consola:
  ```
  [auth] JWT callback - account received, storing tokens
  [auth] ===== JWT PAYLOAD ANALYSIS =====
  [auth] ✅ Extracted roles from JWT: ['PRF_ADMIN', ...]
  ```

**Paso 4: Ejecutar Script de Diagnóstico**

- [ ] Copiar y pegar script en consola
- [ ] Guardar salida completa
- [ ] Verificar `session.roles` tiene valores

**Paso 5: Verificar UI**

- [ ] Sidebar muestra opciones según rol
- [ ] Footer muestra badge de rol (ej: "ADMIN")
- [ ] Página de Reglas muestra/oculta botones según permisos
- [ ] No hay errores 403 en llamadas API

**Paso 6: Ajustes (si es necesario)**

Si `session.roles` está vacío:

1. **Identificar** en qué claim están los roles (ver diagnóstico paso 2-6)
2. **Ajustar** `extractRolesFromJWT()` para leer de ese claim
3. **Reiniciar** frontend
4. **Logout** + **Login** de nuevo
5. **Verificar** que ahora sí extrae roles

### **Post-Migración**

- [ ] Probar con 3-4 usuarios diferentes (diferentes roles)
- [ ] Verificar que cada uno ve menú diferente
- [ ] Documentar configuración final en README
- [ ] Desactivar logs de diagnóstico si están muy verbosos
- [ ] Crear issue/ticket de seguimiento

---

## 🛠️ Troubleshooting Común

### **Problema 1: `session.roles` está vacío (`[]`)**

**Síntoma:**
```javascript
Session roles: []
```

**Diagnóstico:**
1. Ejecutar script de diagnóstico
2. Ver pasos 2-6 para identificar dónde están los roles

**Solución:**
- Si roles están en `groups` → Verificar que `extractRolesFromJWT()` tiene el bloque #3
- Si roles están en `ad_groups` → Verificar que tiene el bloque #4
- Si roles están en claim custom → Verificar que tiene el bloque #5
- Reiniciar frontend después de cambios
- **IMPORTANTE:** Hacer logout + login de nuevo

---

### **Problema 2: Menú vacío después de login**

**Síntoma:**
- Login exitoso
- Sidebar aparece pero sin items de navegación

**Diagnóstico:**
```javascript
fetch('/api/auth/session').then(r => r.json()).then(s => console.log(s.roles))
// Si muestra [] → Ver Problema 1
// Si muestra roles → Verificar nombres de roles
```

**Solución:**
- Verificar que los roles extraídos coinciden con `lib/auth/roles.ts`:
  ```typescript
  export enum Role {
    ADMIN = 'PRF_ADMIN',      // ← Debe coincidir
    CONSULTIVO = 'PRF_CONSULTIVO',
    AUDITOR = 'PRF_AUDITOR',
    // ...
  }
  ```
- Si AD usa nombres diferentes (ej: `SIG_ADMIN` en vez de `PRF_ADMIN`):
  - Opción A: Mapear en Keycloak (preferido)
  - Opción B: Agregar alias en `extractRolesFromJWT()`

---

### **Problema 3: Errores 403 Forbidden en API**

**Síntoma:**
```
GET /api/v1/admin/rules 403 (Forbidden)
```

**Diagnóstico:**
- Frontend sí tiene roles
- Backend rechaza peticiones

**Causa:** El backend espera `ROLE_PRF_ADMIN` pero el JWT tiene nombre diferente

**Solución:**

1. **Verificar logs del backend:**
   ```
   DEBUG o.s.s.o.s.r.a.JwtAuthenticationToken - JWT converted for user 'user' with authorities: [ROLE_XXX]
   ```

2. **Ver qué roles extrae el backend** de `realm_access` y `resource_access`

3. **Si no coinciden:**
   - Verificar configuración de `KeycloakJwtAuthenticationConverter.java`
   - Verificar que Keycloak mapea correctamente los grupos de AD a roles

---

### **Problema 4: Sesión expira muy rápido**

**Síntoma:** Logout automático cada 5-10 minutos

**Causa:** TTL del token corporativo puede ser diferente

**Solución:**

1. Verificar TTL en JWT:
   ```javascript
   fetch('/api/auth/session').then(r => r.json()).then(s => {
     const payload = JSON.parse(atob(s.accessToken.split('.')[1]));
     const exp = new Date(payload.exp * 1000);
     const iat = new Date(payload.iat * 1000);
     console.log('Token issued at:', iat);
     console.log('Token expires at:', exp);
     console.log('TTL (minutes):', (payload.exp - payload.iat) / 60);
   });
   ```

2. Ajustar `auth.ts` si es necesario:
   ```typescript
   session: {
     strategy: "jwt",
     maxAge: 30 * 60, // Ajustar según TTL corporativo
   }
   ```

---

## 📞 Contactos y Escalación

### **Contactos Infraestructura**

- **Keycloak Admin:** [infraestructura@singular.com]
- **Active Directory:** [ti@singular.com]
- **Kubernetes Secrets:** [devops@singular.com]

### **Información a Solicitar**

Al abrir ticket con Infraestructura, incluir:

```
Asunto: Configuración Keycloak para Signature Router Admin

Hola,

Necesitamos configurar autenticación para la aplicación "Signature Router Admin" en Keycloak corporativo.

Información requerida:
1. Client ID para la aplicación
2. Client Secret (como Kubernetes secret)
3. Issuer URL del realm
4. Configuración de mapeo de roles:
   - ¿Los grupos de AD se mapean a realm_access.roles?
   - ¿O se mapean a resource_access.{client}.roles?
   - ¿O vienen en un claim custom?

Roles de AD que necesitamos mapear:
- PRF_ADMIN (Full access)
- PRF_CONSULTIVO (Create/Update)
- PRF_AUDITOR (Read-only)
- PRF_USER (Basic access)

Redirect URIs:
- https://signature-router-admin.singular.com/*
- https://signature-router-admin-uat.singular.com/*

Saludos,
[Tu nombre]
```

---

## 📚 Referencias

- **NextAuth.js v5 Docs:** https://authjs.dev/
- **Keycloak OIDC Docs:** https://www.keycloak.org/docs/latest/securing_apps/
- **JWT.io Debugger:** https://jwt.io (para decodificar JWTs manualmente)
- **Código Fuente:**
  - `app-signature-router-admin/auth.ts`
  - `app-signature-router-admin/lib/auth/roles.ts`
  - `app-signature-router-admin/lib/auth/use-user-roles.ts`

---

## 📝 Notas Finales

- ✅ **El código actual es backward-compatible**: Funciona con Keycloak local Y corporativo
- ✅ **Logging de diagnóstico**: Facilita troubleshooting en producción
- ✅ **Multi-source role extraction**: Soporta 5 fuentes diferentes de roles
- ⚠️ **Primer login es crítico**: Guardar logs para análisis
- ⚠️ **Coordinación con Infraestructura**: Validar mapeo de roles antes del go-live

---

**Última Actualización:** 2025-12-09  
**Próxima Revisión:** Después de migración a Keycloak corporativo  
**Mantenido por:** BMAD Development Team

