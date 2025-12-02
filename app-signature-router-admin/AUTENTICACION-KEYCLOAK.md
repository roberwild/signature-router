# 🔐 Autenticación con Keycloak - Signature Router Admin

## 📋 Descripción

El frontend **Signature Router Admin** utiliza **NextAuth v5** para autenticarse contra **Keycloak** mediante el flujo **OAuth 2.0 Authorization Code** con PKCE.

---

## 🏗️ Arquitectura

```
┌─────────────────┐        ┌────────────────┐         ┌──────────────────┐
│   Next.js       │        │   Keycloak     │         │  Spring Boot     │
│   Frontend      │        │   (Port 8180)  │         │  Backend         │
│   (Port 3001)   │        │                │         │  (Port 8080)     │
└────────┬────────┘        └────────┬───────┘         └────────┬─────────┘
         │                          │                          │
         │  1. Redirect to /signin  │                          │
         ├─────────────────────────>│                          │
         │                          │                          │
         │  2. Login form           │                          │
         │<─────────────────────────┤                          │
         │                          │                          │
         │  3. Submit credentials   │                          │
         ├─────────────────────────>│                          │
         │                          │                          │
         │  4. Auth code callback   │                          │
         │<─────────────────────────┤                          │
         │                          │                          │
         │  5. Exchange code for    │                          │
         │     JWT access token     │                          │
         ├─────────────────────────>│                          │
         │<─────────────────────────┤                          │
         │                          │                          │
         │  6. Store JWT in session │                          │
         │                          │                          │
         │  7. GET /api/v1/admin/signatures                    │
         │     Authorization: Bearer <JWT>                     │
         ├─────────────────────────────────────────────────────>│
         │                          │                          │
         │                          │  8. Validate JWT         │
         │                          │<─────────────────────────┤
         │                          │  9. JWT claims & roles   │
         │                          ├─────────────────────────>│
         │                          │                          │
         │  10. JSON response       │                          │
         │<─────────────────────────────────────────────────────┤
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Crea el archivo `.env.local` en la raíz del frontend:

```bash
cd app-signature-router-admin
cp env.local.example .env.local
```

Edita `.env.local`:

```env
# NextAuth Secret (cambiar en producción)
AUTH_SECRET="uG5xQjK8vN2zR6wP9mT3fH7cL4dS1aY0iE8oU6pW2qX5kJ9bV7nM4hG3tF8rA1cZ"

# URL de la aplicación
NEXTAUTH_URL="http://localhost:3001"

# Keycloak Configuration
KEYCLOAK_CLIENT_ID="signature-router-admin"
KEYCLOAK_CLIENT_SECRET="signature-router-admin-secret-12345"
KEYCLOAK_ISSUER="http://localhost:8180/realms/signature-router"

# Backend API
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080/api/v1"
NEXT_PUBLIC_USE_MOCK_DATA="false"
NEXT_PUBLIC_DEBUG="true"
```

### 2. Configurar Cliente en Keycloak

**IMPORTANTE:** Debes crear el cliente `signature-router-admin` en Keycloak.

#### Opción A: Manual (UI de Keycloak)

1. Accede a Keycloak Admin Console:
   ```
   http://localhost:8180/admin
   Usuario: admin
   Password: admin
   ```

2. Selecciona el realm `signature-router`

3. Ve a **Clients** → **Create client**

4. Configura:
   - **Client ID:** `signature-router-admin`
   - **Client Protocol:** `openid-connect`
   - **Client Authentication:** ON
   - **Authorization:** OFF

5. En la pestaña **Settings**:
   - **Valid Redirect URIs:**
     ```
     http://localhost:3001/*
     http://localhost:3001/api/auth/callback/keycloak
     ```
   - **Valid Post Logout Redirect URIs:**
     ```
     http://localhost:3001
     ```
   - **Web Origins:**
     ```
     http://localhost:3001
     ```

6. En la pestaña **Credentials**:
   - Copia el **Client Secret** y actualízalo en `.env.local`

#### Opción B: Importar Realm (Automatizado)

Si el realm `signature-router` no tiene el cliente, agrégalo al archivo de configuración:

```json
{
  "clientId": "signature-router-admin",
  "name": "Signature Router Admin Panel",
  "description": "Frontend Admin Panel for Signature Router",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "signature-router-admin-secret-12345",
  "redirectUris": [
    "http://localhost:3001/*"
  ],
  "webOrigins": [
    "http://localhost:3001"
  ],
  "publicClient": false,
  "protocol": "openid-connect",
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false
}
```

---

## 🚀 Uso

### Iniciar Frontend

```bash
cd app-signature-router-admin
npm run dev:real
```

### Flujo de Autenticación

1. **Accede al frontend:** `http://localhost:3001`

2. **Serás redirigido a:** `http://localhost:3001/auth/signin`

3. **Haz clic en "Iniciar Sesión con Keycloak"**

4. **Serás redirigido a Keycloak:** `http://localhost:8180/realms/signature-router/protocol/openid-connect/auth`

5. **Ingresa credenciales:**
   - Usuario: `admin`
   - Password: `admin123`

6. **Serás redirigido de vuelta al frontend** con una sesión activa

7. **El JWT se almacena automáticamente** en la sesión de NextAuth

8. **Todas las llamadas API incluyen:** `Authorization: Bearer <JWT>`

### Usuarios Disponibles

| Usuario   | Password     | Roles           | Descripción                 |
|-----------|--------------|------------------|-----------------------------|
| `admin`   | `admin123`   | ADMIN, USER      | Acceso completo             |
| `user`    | `user123`    | USER             | Operaciones de firma        |
| `support` | `support123` | SUPPORT, USER    | Consulta de reglas/firmas   |
| `auditor` | `auditor123` | AUDITOR          | Solo auditoría y métricas   |

---

## 🔍 Verificación

### Comprobar que el Token se Inyecta

1. Abre las **DevTools del navegador** (F12)

2. Ve a la pestaña **Network**

3. Accede a una página del admin (ej: `/admin/signatures`)

4. Busca la petición a `http://localhost:8080/api/v1/admin/signature-requests`

5. En **Headers**, verifica que existe:
   ```
   Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5...
   ```

### Decodificar el JWT

Copia el token y pégalo en: https://jwt.io

Deberías ver:

```json
{
  "exp": 1733184000,
  "iat": 1733182200,
  "jti": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "iss": "http://localhost:8180/realms/signature-router",
  "aud": "account",
  "sub": "12345678-90ab-cdef-1234-567890abcdef",
  "typ": "Bearer",
  "azp": "signature-router-admin",
  "realm_access": {
    "roles": ["ADMIN", "USER"]
  },
  "preferred_username": "admin",
  "email": "admin@singular.com"
}
```

---

## 🛠️ Troubleshooting

### Error: "OAuthCallback - Error al autenticar con Keycloak"

**Causa:** Cliente no configurado correctamente en Keycloak.

**Solución:**
1. Verifica que el cliente `signature-router-admin` existe en el realm
2. Confirma que los **Redirect URIs** incluyen `http://localhost:3001/*`
3. Asegúrate de que **Client Authentication** está habilitado

### Error: "401 Unauthorized" en llamadas API

**Causa:** Token JWT no se está enviando o es inválido.

**Solución:**
1. Verifica que la sesión esté activa: `console.log(await auth())`
2. Comprueba que `KEYCLOAK_ISSUER` coincide con la URL del realm
3. Revisa los logs del backend Spring Boot para ver el error específico

### Error: "Session Expired"

**Causa:** El token JWT ha expirado (30 minutos por defecto).

**Solución:**
1. Cierra sesión y vuelve a iniciar sesión
2. Implementa refresh token flow (TODO para producción)

### Keycloak no está corriendo

**Solución:**

```bash
cd svc-signature-router
docker-compose up -d keycloak
```

Espera 30-60 segundos y verifica:
```bash
curl http://localhost:8180/health
```

---

## 📝 Archivos Creados

| Archivo                                | Descripción                           |
|----------------------------------------|---------------------------------------|
| `auth.ts`                              | Configuración de NextAuth             |
| `middleware.ts`                        | Protección de rutas                   |
| `app/api/auth/[...nextauth]/route.ts` | API routes de NextAuth                |
| `app/auth/signin/page.tsx`             | Página de login                       |
| `app/auth/error/page.tsx`              | Página de errores de autenticación    |
| `types/next-auth.d.ts`                 | Type definitions para NextAuth        |
| `lib/api/real-client.ts`               | Modificado para inyectar JWT          |
| `env.local.example`                    | Ejemplo de variables de entorno       |

---

## 🎯 Próximos Pasos

1. ✅ Autenticación básica implementada
2. ⏳ **Implementar refresh token flow** para renovar tokens expirados
3. ⏳ **Agregar botón "Cerrar Sesión"** en el sidebar del admin
4. ⏳ **Mostrar información del usuario** en el header (nombre, rol, avatar)
5. ⏳ **Manejo de roles** para mostrar/ocultar secciones según permisos

---

## 📚 Referencias

- [NextAuth v5 Documentation](https://next-auth.js.org)
- [Keycloak Documentation](https://www.keycloak.org/docs/latest/)
- [OAuth 2.0 Authorization Code Flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow)
- [JWT.io - Decode JWT tokens](https://jwt.io)

---

**¿Preguntas?** Consulta el README principal o revisa los logs del navegador y del backend para más detalles.

