# Arquitectura de Auditoría de Usuarios

**Proyecto:** Signature Router  
**Epic:** Epic 12 - Admin Panel Integration  
**Fecha:** 4 de diciembre de 2025

---

## 🎯 Overview

El sistema de gestión de usuarios del Admin Panel está diseñado como un **registro de auditoría basado en JWT**, NO como una sincronización de Active Directory.

### Concepto Clave

Los usuarios que aparecen en la pantalla de "Usuarios" son aquellos que **han iniciado sesión en la aplicación**. No se sincroniza ningún dato desde Active Directory ni desde sistemas externos.

---

## 🏗️ Arquitectura

### Flujo de Registro de Usuarios

```
1. Usuario se autentica con Active Directory
   ↓
2. Keycloak genera JWT con datos del usuario
   (nombre, email, roles, etc.)
   ↓
3. Usuario hace request al Admin Portal
   ↓
4. UserProfileSyncFilter intercepta el request
   ↓
5. Extrae datos del JWT
   ↓
6. Crea/Actualiza perfil en BD local
   ↓
7. Registra timestamp del login + IP
   ↓
8. Request continúa normalmente
```

### Componentes

#### Backend

**1. UserProfileSyncFilter**
- Filtro que intercepta requests autenticados
- Extrae información del JWT (claims)
- Registra/actualiza perfil de usuario en BD
- Cache de 5 minutos para evitar escrituras excesivas

```java
// Claims extraídos del JWT:
- sub → Keycloak ID (unique identifier)
- preferred_username → Username
- email → Email corporativo  
- name → Nombre completo
- given_name → Nombre
- family_name → Apellido
- realm_access.roles → Roles del usuario
```

**2. UserProfileService**
- Método `recordLogin()`: Crea o actualiza perfil
- Si el usuario existe: actualiza roles, last login, IP
- Si NO existe: crea nuevo perfil
- Incrementa contador de logins

**3. UserManagementController**
- Endpoints READ-ONLY:
  - `GET /api/v1/admin/users` - Lista usuarios con paginación
  - `GET /api/v1/admin/users/{id}` - Detalle de usuario
  - `GET /api/v1/admin/users/stats` - Estadísticas
- NO hay endpoints de escritura (POST/PUT/DELETE)

**4. UserProfile (Entidad)**
```java
@Entity
@Table(name = "user_profiles")
public class UserProfile {
    UUID id;                  // ID interno (UUIDv7)
    String keycloakId;        // Subject del JWT (unique)
    String username;          // preferred_username
    String email;             // email
    String fullName;          // name
    String firstName;         // given_name
    String lastName;          // family_name
    Set<String> roles;        // realm_access.roles
    String department;        // department (opcional)
    boolean active;           // Derivado de logins recientes
    Instant firstLoginAt;     // Primer login registrado
    Instant lastLoginAt;      // Último login
    int loginCount;           // Contador de logins
    String lastLoginIp;       // IP del último login
    Instant createdAt;        // Timestamp creación
    Instant updatedAt;        // Timestamp actualización
}
```

#### Frontend

**UsersPage Component**
- Muestra usuarios que han accedido
- Búsqueda por nombre/email/username
- Estadísticas: total, activos, por rol
- Información de último acceso
- NO hay botones de "Crear/Editar/Eliminar"
- Botón "Actualizar" recarga datos (NO sincroniza desde AD)

---

## 📊 Datos Almacenados

### Fuente de Datos

**TODO proviene del JWT**, que a su vez obtiene la información de:
- Active Directory (a través de federación Keycloak LDAP)
- Mapeos de grupos AD → Roles Keycloak
- Claims estándar OAuth2/OIDC

### Información Registrada

| Campo | Fuente JWT | Descripción |
|-------|------------|-------------|
| **ID Keycloak** | `sub` | Identificador único del usuario en Keycloak |
| **Username** | `preferred_username` | Login del usuario (ej: `jperez`) |
| **Email** | `email` | Email corporativo |
| **Nombre completo** | `name` | Nombre + Apellido |
| **Nombre** | `given_name` | Primer nombre |
| **Apellido** | `family_name` | Apellido |
| **Roles** | `realm_access.roles` | Array de roles (ADMIN, OPERATOR, VIEWER) |
| **Departamento** | `department` | Opcional, si está en claims |
| **Primer login** | Calculado | Timestamp del primer acceso |
| **Último login** | Calculado | Timestamp del último acceso |
| **Login count** | Calculado | Contador incremental |
| **Última IP** | Request header | IP del cliente (X-Forwarded-For o Remote-Addr) |

---

## 🔒 Seguridad y Privacidad

### Solo Lectura

- La pantalla de usuarios es **READ-ONLY**
- No se pueden crear/editar/eliminar usuarios desde el portal
- La gestión de usuarios se hace en Active Directory
- Los cambios en AD se reflejan automáticamente en el siguiente login del usuario

### Auditoría

- Se registra **cada login** (con throttling de 5 min)
- Se guarda la **IP del cliente** para auditoría de seguridad
- Se mantiene un **contador de accesos** por usuario
- Se actualiza el **timestamp del último acceso**

### GDPR / Privacidad

- Solo se almacenan datos del JWT (públicos dentro del sistema)
- No se almacenan contraseñas
- No se almacenan datos sensibles adicionales
- Los datos se actualizan automáticamente en cada login (siempre frescos)

---

## 🚀 Casos de Uso

### 1. Ver quién ha usado la aplicación

**Escenario:** Admin quiere ver qué usuarios han accedido al sistema.

**Comportamiento:**
1. Admin abre pantalla "Usuarios"
2. Ve lista de usuarios que han iniciado sesión
3. Puede filtrar por nombre/email
4. Ve último acceso y conteo de logins

### 2. Ver roles de un usuario

**Escenario:** Admin quiere verificar qué permisos tiene un usuario.

**Comportamiento:**
1. Admin busca al usuario
2. Ve badge con rol principal (ADMIN/OPERATOR/VIEWER)
3. Puede ver detalles (historial de accesos, IP, etc.)

### 3. Usuario cambia de departamento en AD

**Escenario:** Usuario es transferido a otro departamento en Active Directory.

**Comportamiento:**
1. IT actualiza el usuario en Active Directory
2. Usuario hace logout/login en el Admin Portal
3. JWT viene con claims actualizados
4. UserProfileSyncFilter actualiza el perfil local
5. Admin ve datos actualizados en pantalla "Usuarios"

### 4. Usuario es dado de baja en AD

**Escenario:** Usuario deja la empresa, su cuenta AD se desactiva.

**Comportamiento:**
1. IT desactiva cuenta en Active Directory
2. Usuario NO puede hacer login (Keycloak rechaza autenticación)
3. Perfil local permanece en BD (para auditoría histórica)
4. Campo `active` no se actualiza (último login queda en el pasado)
5. Admin puede ver que el usuario no accede desde X fecha

---

## 🛠️ Operación

### Limpieza de Datos Antiguos

**No implementado actualmente**, pero se podría:

```sql
-- Identificar usuarios que no acceden hace >90 días
SELECT * FROM user_profiles 
WHERE last_login_at < NOW() - INTERVAL '90 days';

-- Archivar o eliminar (según política de retención)
-- NO recomendado: mejor mantener para auditoría histórica
```

### Sincronización Manual

**NO existe sincronización manual**. Los datos se actualizan automáticamente cuando el usuario inicia sesión.

El botón "Actualizar" en el frontend simplemente recarga los datos de la BD local, NO dispara ninguna sincronización externa.

---

## 📈 Métricas y Estadísticas

### Estadísticas Disponibles

```java
UserStats {
    long totalUsers;      // Total usuarios registrados
    long activeUsers;     // Con login reciente (definir "reciente")
    long adminUsers;      // Con rol ADMIN
    long operatorUsers;   // Con rol OPERATOR  
    long viewerUsers;     // Con rol VIEWER
}
```

### Queries Útiles

```sql
-- Usuarios más activos (por login count)
SELECT username, email, login_count, last_login_at
FROM user_profiles
ORDER BY login_count DESC
LIMIT 10;

-- Nuevos usuarios (primer login reciente)
SELECT username, email, first_login_at
FROM user_profiles
WHERE first_login_at > NOW() - INTERVAL '7 days'
ORDER BY first_login_at DESC;

-- Usuarios inactivos
SELECT username, email, last_login_at
FROM user_profiles
WHERE last_login_at < NOW() - INTERVAL '30 days'
ORDER BY last_login_at ASC;
```

---

## ⚠️ Limitaciones

### 1. No es un inventario completo de AD

- Solo muestra usuarios **que han iniciado sesión**
- Si un usuario nunca accedió, NO aparece
- Para ver todos los usuarios de AD, usar herramientas AD nativas

### 2. Datos pueden estar desactualizados

- Los datos se actualizan **solo cuando el usuario hace login**
- Si un usuario cambió de rol en AD pero no se ha logueado, veremos roles antiguos
- Solución: datos se actualizan automáticamente en el siguiente login

### 3. No hay sincronización inversa

- Cambios en AD NO se reflejan inmediatamente
- Requiere que el usuario haga login
- NO hay sincronización periódica (por diseño)

### 4. Usuarios antiguos permanecen en BD

- Si un usuario ya no existe en AD, su perfil queda en BD
- Útil para auditoría histórica
- Requiere política de limpieza manual si se desea

---

## 🔍 Comparación: Auditoría JWT vs Sincronización AD

| Aspecto | Auditoría JWT (Implementado) | Sincronización AD (NO implementado) |
|---------|------------------------------|-------------------------------------|
| **Fuente de datos** | JWT claims en cada login | LDAP queries periódicas a AD |
| **Frecuencia actualización** | En cada login del usuario | Periódica (ej: cada hora) |
| **Usuarios mostrados** | Solo los que han accedido | Todos los usuarios AD |
| **Latencia de cambios** | Hasta el siguiente login | Según frecuencia de sync |
| **Carga en AD** | Cero (datos vienen de JWT) | Alta (queries LDAP periódicas) |
| **Dependencia de AD** | Solo en autenticación | Constante (sincronización activa) |
| **Datos históricos** | Sí (logins, IPs, timestamps) | No (solo snapshot actual) |
| **Complejidad** | Baja | Alta |
| **Auditoría** | Excelente | Limitada |
| **Inventario completo** | No | Sí |

---

## 🎯 Decisión de Diseño

### ¿Por qué NO sincronizamos desde AD?

**Razones:**

1. **Simplicidad:** No requerimos un inventario completo de usuarios de AD
2. **Carga en AD:** Evitamos queries LDAP periódicas innecesarias
3. **Auditoría:** Nos interesa saber **quién usa la aplicación**, no quién existe en AD
4. **Datos frescos:** El JWT siempre trae los datos más actualizados de AD
5. **Sin dependencias:** No requerimos conectividad constante con AD
6. **Seguridad:** Reducimos superficie de ataque (no exponemos todos los usuarios AD)

### ¿Cuándo sí tiene sentido sincronizar desde AD?

- Si necesitas mostrar **todos** los usuarios AD (no solo los que accedieron)
- Si necesitas **buscar usuarios** para asignarles permisos antes de que se logueen
- Si requieres datos actualizados en **tiempo real** sin esperar login
- Si implementas **gestión de usuarios** desde el portal (crear/editar/eliminar)

**En nuestro caso:** NO aplica. Somos un sistema de auditoría, no de gestión.

---

## 📚 Documentos Relacionados

### Vigentes

- [AUTENTICACION-ACTIVE-DIRECTORY.md](AUTENTICACION-ACTIVE-DIRECTORY.md) - Flujo de autenticación JWT
- [keycloak/AD-GROUPS-ROLES-MAPPING.md](keycloak/AD-GROUPS-ROLES-MAPPING.md) - Mapeo de grupos AD a roles

### Obsoletos (No aplicables a producción)

- ❌ [keycloak/USER-SOURCE-CONFIGURATION-GUIDE.md](keycloak/USER-SOURCE-CONFIGURATION-GUIDE.md) - Modos MOCK/LOCAL/ACTIVE_DIRECTORY (solo desarrollo/testing)
- ❌ [keycloak/KEYCLOAK-USER-FEDERATION-SETUP.md](keycloak/KEYCLOAK-USER-FEDERATION-SETUP.md) - Configuración de sincronización LDAP (no se usa en producción)

**Nota:** Los documentos marcados como obsoletos describen arquitecturas alternativas que NO están implementadas en producción. Se mantienen solo como referencia para desarrollo/testing local.

---

## 🧪 Testing

### Test Manual

1. Login como usuario nuevo
2. Verificar que aparece en tabla `user_profiles`
3. Hacer logout/login varias veces
4. Verificar que `login_count` se incrementa
5. Verificar que `last_login_at` se actualiza
6. Abrir Admin Portal → Usuarios
7. Verificar que el usuario aparece en la lista

### Test Automatizado

```java
@Test
void testUserProfileCreatedOnFirstLogin() {
    // Mock JWT with user claims
    Jwt jwt = createMockJwt("user123", "jperez", "juan.perez@bank.com");
    
    // Simulate filter execution
    userProfileSyncFilter.syncUserProfile(jwt, mockIp);
    
    // Verify profile created
    Optional<UserProfile> profile = userProfileService.getByKeycloakId("user123");
    assertTrue(profile.isPresent());
    assertEquals("jperez", profile.get().getUsername());
    assertEquals(1, profile.get().getLoginCount());
}

@Test
void testUserProfileUpdatedOnSubsequentLogin() {
    // Create existing profile
    userProfileService.recordLogin("user123", "jperez", ...);
    
    // Simulate second login
    userProfileSyncFilter.syncUserProfile(jwt, mockIp);
    
    // Verify login count incremented
    Optional<UserProfile> profile = userProfileService.getByKeycloakId("user123");
    assertEquals(2, profile.get().getLoginCount());
}
```

---

## 📞 Contacto

**Para dudas sobre:**
- Gestión de usuarios en AD: Contactar IT/Active Directory team
- Roles y permisos: Ver [AD-GROUPS-ROLES-MAPPING.md](keycloak/AD-GROUPS-ROLES-MAPPING.md)
- Arquitectura del sistema: Ver este documento

---

**Última actualización:** 4 de diciembre de 2025  
**Autor:** BMAD Dev Agent  
**Epic:** Epic 12 - Admin Panel Integration  
**Story:** 14.2 - Users Page Backend Integration

