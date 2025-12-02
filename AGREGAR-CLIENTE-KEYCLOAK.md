# 🔧 Agregar Cliente Frontend en Keycloak

## Paso a Paso

### 1. Acceder a Keycloak Admin Console

Abre tu navegador en:
```
http://localhost:8180/admin
```

**Credenciales:**
- Usuario: `admin`
- Password: `admin`

### 2. Seleccionar el Realm

En la esquina superior izquierda, verifica que estás en el realm **`signature-router`** (no en `master`).

### 3. Ir a Clients

En el menú lateral izquierdo, haz click en **"Clients"**.

### 4. Crear Nuevo Cliente

1. Haz click en el botón **"Create client"** (arriba a la derecha)

2. En **General Settings**:
   - **Client type:** `OpenID Connect`
   - **Client ID:** `signature-router-admin`
   - Haz click en **"Next"**

3. En **Capability config**:
   - **Client authentication:** `ON` ✅ (IMPORTANTE)
   - **Authorization:** `OFF`
   - **Authentication flow:**
     - ✅ Standard flow (enabled)
     - ❌ Direct access grants (disabled)
     - ❌ Implicit flow (disabled)
     - ❌ Service accounts roles (disabled)
   - Haz click en **"Next"**

4. En **Login settings**:
   - **Root URL:** `http://localhost:3001`
   - **Home URL:** `http://localhost:3001`
   - **Valid redirect URIs:**
     ```
     http://localhost:3001/*
     http://localhost:3001/api/auth/callback/keycloak
     ```
   - **Valid post logout redirect URIs:**
     ```
     http://localhost:3001
     ```
   - **Web origins:**
     ```
     http://localhost:3001
     ```
   - Haz click en **"Save"**

### 5. Configurar Client Secret

1. Ve a la pestaña **"Credentials"**

2. Copia el **Client Secret** (será algo como: `rXs7kP9mN4vL2hQ8...`)

3. **OPCIÓN A - Usar el secret que ya está en .env.local:**
   - Haz click en **"Regenerate"**
   - Pega este valor: `signature-router-admin-secret-12345`
   - Guarda

   **OPCIÓN B - Actualizar .env.local con el nuevo secret:**
   - Copia el secret generado
   - Edita `app-signature-router-admin/.env.local`
   - Actualiza la línea:
     ```env
     KEYCLOAK_CLIENT_SECRET="<nuevo-secret-aqui>"
     ```

### 6. Configurar Mappers (Opcional pero Recomendado)

Para que los roles lleguen correctamente en el JWT:

1. Ve a la pestaña **"Client scopes"**
2. Haz click en `signature-router-admin-dedicated`
3. Haz click en **"Add mapper"** → **"By configuration"**
4. Selecciona **"User Realm Role"**
5. Configura:
   - **Name:** `roles`
   - **Token Claim Name:** `roles`
   - **Claim JSON Type:** `String`
   - **Multivalued:** `ON` ✅
   - **Add to ID token:** `ON` ✅
   - **Add to access token:** `ON` ✅
   - **Add to userinfo:** `ON` ✅
6. Haz click en **"Save"**

### 7. Verificar Configuración

Revisa que la configuración final sea:

```
Client ID: signature-router-admin
Client Protocol: openid-connect
Access Type: confidential
Standard Flow Enabled: ON
Direct Access Grants Enabled: OFF
Valid Redirect URIs: http://localhost:3001/*
Web Origins: http://localhost:3001
```

### 8. Reiniciar Frontend

Si cambiaste el secret en `.env.local`:

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev:real
```

### 9. Probar Login

1. Ve a: http://localhost:3001
2. Haz click en "Iniciar Sesión con Keycloak"
3. Deberías ver la página de login de Keycloak (no el error "Client not found")
4. Login con: `admin / admin123`
5. Serás redirigido a: http://localhost:3001/admin

---

## ✅ Verificación Rápida

Si todo está bien configurado:

- ✅ El botón redirige a Keycloak
- ✅ Keycloak muestra página de login (no error)
- ✅ Después del login, redirige al frontend
- ✅ Puedes ver `/admin/signatures` con datos

---

## 🔴 Si aún ves "Client not found"

1. Verifica que estás en el realm `signature-router` (no `master`)
2. Confirma que el Client ID es exactamente: `signature-router-admin`
3. Revisa que `KEYCLOAK_CLIENT_ID` en `.env.local` coincide
4. Reinicia el frontend después de crear el cliente

---

## 📝 Atajo con cURL (Avanzado)

Si prefieres, puedes crear el cliente vía API:

```bash
# 1. Obtener token de admin
ADMIN_TOKEN=$(curl -X POST "http://localhost:8180/admin/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  | jq -r '.access_token')

# 2. Crear cliente
curl -X POST "http://localhost:8180/admin/realms/signature-router/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "signature-router-admin",
    "enabled": true,
    "protocol": "openid-connect",
    "publicClient": false,
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": false,
    "secret": "signature-router-admin-secret-12345",
    "redirectUris": ["http://localhost:3001/*"],
    "webOrigins": ["http://localhost:3001"]
  }'
```

---

Después de crear el cliente, vuelve a intentar el login en el frontend.

