# 🔐 Setup Autenticación Frontend ↔ Backend

## ✅ Cambios Realizados

Se ha implementado la **autenticación completa con Keycloak** para conectar el frontend Next.js con el backend Spring Boot.

---

## 📦 Archivos Creados/Modificados

### Frontend (`app-signature-router-admin/`)

#### Nuevos Archivos:
- ✅ `auth.ts` - Configuración de NextAuth v5 con Keycloak
- ✅ `middleware.ts` - Protección de rutas (requiere autenticación)
- ✅ `app/api/auth/[...nextauth]/route.ts` - API routes de NextAuth
- ✅ `app/auth/signin/page.tsx` - Página de login con diseño Singular Bank
- ✅ `app/auth/error/page.tsx` - Página de errores de autenticación
- ✅ `types/next-auth.d.ts` - Type definitions para TypeScript
- ✅ `env.local.example` - Template de variables de entorno
- ✅ `AUTENTICACION-KEYCLOAK.md` - Documentación completa

#### Archivos Modificados:
- ✅ `app/layout.tsx` - Agregado `<SessionProvider>` de NextAuth
- ✅ `lib/api/real-client.ts` - Inyección automática de JWT en headers

### Backend (`svc-signature-router/`)

#### Archivos Modificados:
- ✅ `keycloak/realms/signature-router-realm.json` - Agregado cliente `signature-router-admin`

---

## 🚀 Pasos para Activar la Autenticación

### 1. Crear `.env.local` en el Frontend

```bash
cd app-signature-router-admin
cp env.local.example .env.local
```

El archivo `.env.local` ya tiene valores por defecto que funcionan:

```env
AUTH_SECRET="uG5xQjK8vN2zR6wP9mT3fH7cL4dS1aY0iE8oU6pW2qX5kJ9bV7nM4hG3tF8rA1cZ"
NEXTAUTH_URL="http://localhost:3001"

KEYCLOAK_CLIENT_ID="signature-router-admin"
KEYCLOAK_CLIENT_SECRET="signature-router-admin-secret-12345"
KEYCLOAK_ISSUER="http://localhost:8180/realms/signature-router"

NEXT_PUBLIC_API_BASE_URL="http://localhost:8080/api/v1"
NEXT_PUBLIC_USE_MOCK_DATA="false"
NEXT_PUBLIC_DEBUG="true"
```

### 2. Reimportar el Realm de Keycloak

El realm actualizado ahora incluye el cliente del frontend (`signature-router-admin`).

**Opción A: Reiniciar Keycloak desde cero**

```powershell
cd svc-signature-router

# Detener Keycloak
docker-compose stop keycloak

# Eliminar volumen de Keycloak (esto BORRA la configuración actual)
docker volume rm svc-signature-router_keycloak-data

# Reiniciar Keycloak (importará el realm actualizado automáticamente)
docker-compose up -d keycloak
```

**Opción B: Importar manualmente** (si quieres conservar otros cambios)

1. Accede a Keycloak Admin:
   ```
   http://localhost:8180/admin
   Usuario: admin
   Password: admin
   ```

2. Selecciona el realm `signature-router`

3. Ve a **Clients** → **Import client**

4. Copia y pega esta configuración:

```json
{
  "clientId": "signature-router-admin",
  "name": "Signature Router Admin Panel",
  "secret": "signature-router-admin-secret-12345",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "redirectUris": [
    "http://localhost:3001/*",
    "http://localhost:3001/api/auth/callback/keycloak"
  ],
  "webOrigins": ["http://localhost:3001"],
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false,
  "publicClient": false
}
```

### 3. Verificar que Keycloak está Corriendo

```bash
curl http://localhost:8180/health
```

Deberías ver: `{"status": "UP"}`

### 4. Iniciar el Frontend con Backend Real

```bash
cd app-signature-router-admin
npm run dev:real
```

Este comando establece `NEXT_PUBLIC_USE_MOCK_DATA=false` y arranca en el puerto 3001.

---

## 🧪 Probar la Autenticación

### 1. Acceder al Frontend

Abre tu navegador en:
```
http://localhost:3001
```

Serás **automáticamente redirigido** a:
```
http://localhost:3001/auth/signin
```

### 2. Hacer Click en "Iniciar Sesión con Keycloak"

Serás redirigido a la página de login de Keycloak:
```
http://localhost:8180/realms/signature-router/protocol/openid-connect/auth?...
```

### 3. Ingresar Credenciales

Usa cualquiera de estos usuarios:

| Usuario   | Password     | Roles         | Descripción              |
|-----------|--------------|---------------|--------------------------|
| `admin`   | `admin123`   | ADMIN, USER   | Acceso completo          |
| `user`    | `user123`    | USER          | Solo operaciones básicas |
| `support` | `support123` | SUPPORT, USER | Solo lectura             |
| `auditor` | `auditor123` | AUDITOR       | Solo auditoría           |

### 4. Verificar Redirección

Después de autenticarte exitosamente, serás redirigido a:
```
http://localhost:3001/admin
```

### 5. Verificar que el Token se Envía

1. Abre **DevTools** (F12)
2. Ve a la pestaña **Network**
3. Navega a `/admin/signatures`
4. Busca la petición a `http://localhost:8080/api/v1/admin/signature-requests`
5. En **Headers → Request Headers**, verifica:
   ```
   Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

¡Si ves el header `Authorization`, la autenticación está funcionando correctamente! ✅

---

## 🔍 Verificar Datos Cargados

Con la autenticación funcionando, ahora puedes consultar los datos de prueba que cargaste:

### Desde el Frontend

1. Ve a: http://localhost:3001/admin/signatures
2. Deberías ver **6 solicitudes de firma** en diferentes estados

### Desde cURL (con token)

```powershell
# 1. Obtener token
$token = (Invoke-RestMethod -Uri "http://localhost:8180/realms/signature-router/protocol/openid-connect/token" `
  -Method Post `
  -ContentType "application/x-www-form-urlencoded" `
  -Body @{
    client_id = "signature-router-admin"
    client_secret = "signature-router-admin-secret-12345"
    username = "admin"
    password = "admin123"
    grant_type = "password"
  }).access_token

# 2. Consultar signatures
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/signature-requests" `
  -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 5
```

---

## 📊 Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Usuario accede a http://localhost:3001                       │
│     → Middleware detecta que no hay sesión                       │
│     → Redirect a /auth/signin                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  2. Usuario hace click en "Iniciar Sesión con Keycloak"         │
│     → NextAuth inicia flujo OAuth 2.0 Authorization Code        │
│     → Redirect a Keycloak login page                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  3. Usuario ingresa credenciales en Keycloak                    │
│     → Keycloak valida usuario/password                          │
│     → Genera Authorization Code                                 │
│     → Redirect a /api/auth/callback/keycloak?code=XXX           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  4. NextAuth intercambia code por JWT access token              │
│     → POST a Keycloak /token endpoint                           │
│     → Recibe JWT con roles del usuario                          │
│     → Almacena JWT en sesión (cookie segura)                    │
│     → Redirect a /admin                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  5. Usuario navega a /admin/signatures                          │
│     → Frontend llama a RealApiClient.getSignatureRequests()     │
│     → RealApiClient obtiene JWT de la sesión                    │
│     → Agrega header: Authorization: Bearer <JWT>                │
│     → GET http://localhost:8080/api/v1/admin/signature-requests │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  6. Backend Spring Boot recibe la petición                      │
│     → Spring Security intercepta el request                     │
│     → Extrae y valida el JWT contra Keycloak                    │
│     → Verifica firma (RS256) usando public key de Keycloak      │
│     → Extrae roles del JWT (ADMIN)                              │
│     → Autoriza acceso al endpoint                               │
│     → Devuelve JSON con los 6 signature requests                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  7. Frontend renderiza la tabla con los datos                   │
│     → Muestra: COMPLETED (2), PENDING (1), EXPIRED (1),         │
│                FAILED (1), ABORTED (1)                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Error: "OAuthCallback - Error al autenticar"

**Causa:** El cliente `signature-router-admin` no existe en Keycloak.

**Solución:** Sigue el Paso 2 para reimportar el realm.

### Error: "401 Unauthorized" en las peticiones

**Causa:** El JWT no se está enviando o es inválido.

**Solución:**
1. Verifica que `.env.local` tiene las variables correctas
2. Reinicia el frontend: `npm run dev:real`
3. Cierra sesión y vuelve a iniciar sesión

### Frontend se queda en "Connecting to Keycloak..."

**Causa:** Keycloak no está corriendo.

**Solución:**
```bash
cd svc-signature-router
docker-compose up -d keycloak
```

### Los datos no aparecen en `/admin/signatures`

**Causa:** Backend no está corriendo o no tiene datos.

**Solución:**
```bash
cd svc-signature-router
.\check-and-start.ps1 -LoadTestData
```

---

## 📚 Documentación Adicional

- **Frontend:** `app-signature-router-admin/AUTENTICACION-KEYCLOAK.md`
- **Backend:** `svc-signature-router/docs/KEYCLOAK-SETUP.md`
- **Datos de prueba:** `svc-signature-router/scripts/README-TEST-DATA.md`

---

## ✅ Checklist Final

Antes de continuar, asegúrate de que:

- [ ] Backend está corriendo con datos de prueba: `.\check-and-start.ps1 -LoadTestData`
- [ ] Keycloak está corriendo en puerto 8180
- [ ] El cliente `signature-router-admin` existe en Keycloak (verificar en Admin Console)
- [ ] Archivo `.env.local` existe en `app-signature-router-admin/`
- [ ] Frontend arranca sin errores: `npm run dev:real`
- [ ] Puedes iniciar sesión con `admin / admin123`
- [ ] Ves el token JWT en DevTools → Network → Headers
- [ ] La página `/admin/signatures` muestra las 6 solicitudes de prueba

---

**¡Listo!** Ahora el frontend y backend están completamente integrados con autenticación OAuth 2.0 + JWT mediante Keycloak. 🎉

