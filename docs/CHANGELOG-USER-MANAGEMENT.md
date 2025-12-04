# Changelog - Sistema de Gestión de Usuarios

**Proyecto:** Signature Router  
**Fecha:** 4 de diciembre de 2025

---

## 🔄 Cambio de Arquitectura: Sincronización AD → Auditoría JWT

### Decisión

Se cambió el enfoque de gestión de usuarios de **sincronización activa con Active Directory** a **auditoría basada en JWT**.

### Razón del Cambio

La sincronización con Active Directory era innecesariamente compleja para nuestro caso de uso:

- ❌ No necesitamos mostrar TODOS los usuarios de AD
- ❌ No necesitamos crear/editar usuarios desde el portal
- ❌ No queremos carga adicional en AD con queries LDAP periódicas
- ✅ Solo necesitamos auditar quién usa la aplicación
- ✅ Los datos del JWT son suficientes y siempre actualizados

---

## 📋 Cambios Implementados

### Backend (sin cambios)

El backend YA estaba implementado correctamente con la arquitectura de auditoría:

- ✅ `UserProfileSyncFilter` - Extrae datos del JWT en cada login
- ✅ `UserProfileService` - Registra/actualiza perfiles
- ✅ `UserManagementController` - Endpoints read-only
- ✅ `UserProfile` entidad - Almacena datos de auditoría

**No se requirieron cambios en el backend.**

### Frontend

**Archivo:** `app-signature-router-admin/app/admin/users/page.tsx`

**Cambios realizados:**

1. **Títulos y descripciones actualizados:**
   - Antes: "Usuarios sincronizados desde Active Directory (Solo lectura)"
   - Ahora: "Auditoría de accesos - Usuarios recopilados automáticamente al iniciar sesión"

2. **Botón de sincronización renombrado:**
   - Antes: "Sincronizar desde AD"
   - Ahora: "Actualizar"

3. **Mensajes de error:**
   - Antes: "Error al cargar usuarios desde Active Directory"
   - Ahora: "Error al cargar usuarios"

4. **Tarjeta informativa:**
   - Antes: "Usuarios gestionados desde Active Directory" + explicación de sincronización
   - Ahora: "Auditoría automática de accesos" + explicación de JWT

5. **Estadísticas:**
   - Antes: "Sincronizados desde AD"
   - Ahora: "Han accedido a la aplicación"

6. **Estado vacío:**
   - Antes: "No hay usuarios sincronizados"
   - Ahora: "No hay usuarios registrados aún" + "Los usuarios aparecerán aquí cuando inicien sesión"

7. **Footer informativo:**
   - Antes: "Integración con Active Directory" + info de sincronización
   - Ahora: "Auditoría basada en JWT" + explicación de auditoría

### Documentación

**Nuevos documentos:**

1. **`docs/USER-AUDIT-ARCHITECTURE.md`** (NUEVO)
   - Documenta la arquitectura real de auditoría basada en JWT
   - Explica el flujo de registro de usuarios
   - Componentes del sistema
   - Casos de uso
   - Comparativa con sincronización AD
   - Razones de la decisión de diseño

**Documentos marcados como obsoletos:**

2. **`docs/keycloak/USER-SOURCE-CONFIGURATION-GUIDE.md`** (OBSOLETO)
   - Agregado aviso de deprecación en la parte superior
   - Se mantiene solo para referencia de desarrollo/testing

3. **`docs/keycloak/KEYCLOAK-USER-FEDERATION-SETUP.md`** (OBSOLETO)
   - Agregado aviso de deprecación en la parte superior
   - Describe configuración LDAP que NO se usa en producción

**Documentos vigentes (sin cambios):**

4. **`docs/AUTENTICACION-ACTIVE-DIRECTORY.md`**
   - Sigue vigente: documenta autenticación JWT con Keycloak
   - NO documenta sincronización de usuarios

5. **`docs/keycloak/AD-GROUPS-ROLES-MAPPING.md`**
   - Sigue vigente: mapeo de grupos AD a roles
   - Se aplica a través de JWT, no de sincronización

---

## 🎯 Estado Actual

### ¿Cómo funciona el sistema de usuarios?

1. **Autenticación:**
   - Usuario se autentica con credenciales de Active Directory
   - Keycloak verifica credenciales contra AD (LDAP)
   - Keycloak genera JWT con claims del usuario

2. **Registro de Usuario:**
   - Usuario hace request al Admin Portal con JWT
   - `UserProfileSyncFilter` intercepta el request
   - Extrae datos del JWT (sub, preferred_username, email, name, roles)
   - Crea o actualiza perfil en tabla `user_profiles`
   - Registra timestamp, IP, incrementa contador de logins

3. **Visualización:**
   - Admin abre pantalla "Usuarios"
   - Frontend consulta `GET /api/v1/admin/users`
   - Backend retorna usuarios de la tabla `user_profiles`
   - Se muestran solo los usuarios que han iniciado sesión

### ¿Qué NO hace el sistema?

- ❌ NO sincroniza usuarios desde Active Directory
- ❌ NO muestra usuarios que nunca han iniciado sesión
- ❌ NO permite crear/editar/eliminar usuarios desde el portal
- ❌ NO hace queries LDAP periódicas
- ❌ NO requiere conectividad constante con AD

### ¿Cuándo se actualizan los datos?

- ✅ En cada login del usuario (con cache de 5 minutos)
- ✅ Si un usuario cambia de rol en AD, se actualiza en su siguiente login
- ✅ Los datos siempre provienen del JWT (fuente de verdad)

---

## 🔍 Impacto

### Backend
- ✅ Sin cambios (ya estaba implementado correctamente)
- ✅ Código existente sigue funcionando igual

### Frontend
- ✅ Cambios cosméticos (textos e iconos)
- ✅ Sin cambios en lógica o flujo de datos
- ✅ Sin cambios en API calls

### Base de Datos
- ✅ Sin cambios en esquema
- ✅ Tabla `user_profiles` sigue igual
- ✅ No se requieren migraciones

### Operación
- ✅ Sin cambios en configuración
- ✅ Sin cambios en despliegue
- ✅ Sin nuevas dependencias

---

## 📝 Checklist de Validación

- [x] Frontend actualizado con nueva terminología
- [x] Documentación de arquitectura creada
- [x] Documentos obsoletos marcados
- [x] Backend validado (ya estaba correcto)
- [x] No hay errores de linting
- [x] No se requieren migraciones de BD
- [x] No se requieren cambios de configuración

---

## 📞 Para más información

- **Arquitectura de auditoría:** Ver [USER-AUDIT-ARCHITECTURE.md](USER-AUDIT-ARCHITECTURE.md)
- **Autenticación JWT:** Ver [AUTENTICACION-ACTIVE-DIRECTORY.md](AUTENTICACION-ACTIVE-DIRECTORY.md)
- **Mapeo de roles:** Ver [keycloak/AD-GROUPS-ROLES-MAPPING.md](keycloak/AD-GROUPS-ROLES-MAPPING.md)

---

---

## ✅ Actualización - Epic 16 Completada (4 de diciembre de 2025)

### Nuevas Funcionalidades Implementadas

**Epic 16: User Audit Trail - JWT-Based Registration** ahora está **100% COMPLETADA**.

#### 1. Security Audit Integration ✅

- **Implementación real de auditoría de accesos** en `/admin/security`
- `KeycloakSecurityServiceImpl` - Usa datos de `user_profiles` en lugar de mock
- Configuración `admin.portal.user-management.mode=LOCAL` activada
- Endpoints de seguridad devuelven datos reales:
  - `/api/v1/admin/security/overview` - Métricas de usuarios registrados
  - `/api/v1/admin/security/access-audit` - Eventos de login desde la BD

#### 2. Keycloak Logout Integration ✅

- **Logout completo** que cierra sesión también en Keycloak
- Función `performKeycloakLogout()` en frontend
- Redirect a Keycloak logout endpoint con `post_logout_redirect_uri`
- Variables de entorno públicas configuradas en `.env.local`

#### 3. Backend Improvements ✅

- `UserProfileService.getAllUsers()` - Método para obtener todos los usuarios sin paginación
- `UserProfileSyncFilter` ahora registrado **después** de `BearerTokenAuthenticationFilter`
- Tabla `user_profiles` creada automáticamente por Hibernate en desarrollo

#### Archivos Modificados

**Backend:**
- `KeycloakSecurityServiceImpl.java` (NEW)
- `application-dev.yml`, `application-local.yml` (config actualizada)
- `SecurityConfig.java` (filter order corregido)
- `UserProfileService.java`, `UserProfileServiceImpl.java` (nuevo método)
- `UserProfileRepository.java`, `UserProfileRepositoryAdapter.java` (nuevo método)

**Frontend:**
- `auth.ts` (evento signOut para Keycloak)
- `lib/auth-utils.ts` (NEW - logout helper)
- `components/admin/admin-sidebar.tsx` (botón logout actualizado)
- `.env.local` (variables públicas de Keycloak)

**Documentación:**
- `docs/epics.md` (Epic 16 actualizada)
- `docs/epics/EPIC-16-COMPLETION-SUMMARY.md` (NEW)

### Estado Final

- ✅ **Backend:** Filtro JWT activo, usuarios registrándose automáticamente
- ✅ **Frontend:** Páginas de Usuarios y Seguridad mostrando datos reales
- ✅ **Base de Datos:** Tabla `user_profiles` con datos de logins
- ✅ **Seguridad:** Logout completo con Keycloak
- ✅ **Configuración:** Modo LOCAL activado (no mock)

### Evidencia de Funcionamiento

**Logs del Backend:**
```
INFO  c.b.s.a.s.KeycloakSecurityServiceImpl - Getting security overview from local user profiles
INFO  c.b.s.a.s.KeycloakSecurityServiceImpl - Getting access audit from local user profiles (limit: 20)
INFO  c.b.s.a.s.KeycloakSecurityServiceImpl - Retrieved 1 access events from user profiles
```

**Frontend:**
- Página `/admin/users` → Muestra usuarios registrados automáticamente
- Página `/admin/security` → Auditoría de accesos con datos reales (no mock)
- Estadísticas: Total Usuarios: 1, Activos: 1

---

**Última actualización:** 4 de diciembre de 2025  
**Autor:** BMAD Dev Agent  
**Epic:** Epic 16 - User Audit Trail (100% COMPLETADA)

