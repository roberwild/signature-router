# 📮 Colección de Postman - Signature Router API

Esta carpeta contiene la colección de Postman actualizada para probar todos los endpoints de la API Signature Router.

**Última actualización:** 2025-12-04  
**Versión:** v2.0 (Epic 13 - Provider Management)

---

## 📦 Archivos

| Archivo | Descripción |
|---------|-------------|
| `Signature-Router-v2.postman_collection.json` | Colección principal con todos los endpoints |
| `Signature-Router-Local.postman_environment.json` | Entorno para desarrollo local (Keycloak local) |
| `Signature-Router-DevRemote.postman_environment.json` | Entorno con Active Directory (Keycloak SBTech) |
| `README.md` | Este archivo |

---

## 🚀 Inicio Rápido

### 1. Importar en Postman

1. Abre Postman Desktop o Web
2. Click en **Import** (esquina superior izquierda)
3. Arrastra o selecciona los 2 archivos JSON:
   - `Signature-Router-v2.postman_collection.json`
   - `Signature-Router-Local.postman_environment.json`
4. Selecciona el entorno **"Signature Router - Local Development"** en el dropdown superior derecho

### 2. Iniciar el Backend

#### Opción A: Desarrollo Local (Keycloak Docker)

Usar environment: **"Signature Router - Local Development"**

```powershell
cd svc-signature-router
docker-compose up -d
mvn spring-boot:run "-Dspring-boot.run.profiles=local" "-Dmaven.test.skip=true"
```

#### Opción B: Desarrollo con Active Directory (Keycloak SBTech)

Usar environment: **"Signature Router - Dev Remote (Active Directory)"**

```powershell
cd svc-signature-router
docker-compose up -d
mvn spring-boot:run "-Dspring-boot.run.profiles=local,dev-remote" "-Dmaven.test.skip=true"
```

> ⚠️ **Nota:** En este modo, debes usar tus credenciales de Active Directory para autenticarte.

### 3. Obtener Token de Autenticación

Ejecuta primero:
```
0. Authentication (Keycloak) > Get Admin Token
```

Esto guardará automáticamente el token JWT en la variable de entorno `admin_token`.

### 4. Probar Endpoints

Ahora puedes ejecutar cualquier endpoint. Los más importantes:

**Flujo Completo de Firma:**
1. `2. Signature Requests > Create Signature Request - SMS (Admin)`
2. `2. Signature Requests > Get Signature Request by ID`
3. Copiar el `challenge_code` desde la base de datos (ver console log)
4. `2. Signature Requests > Verify Challenge`

**Gestión de Providers (Epic 13):**
1. `3. Provider Management > List All Providers`
2. `3. Provider Management > Create Provider - SMS (Twilio)`
3. `3. Provider Management > Test Provider Connectivity`
4. `4. Provider Registry > Get Registry Statistics`

---

## 📚 Estructura de la Colección

### **0. Authentication (Keycloak)** 🔐
Obtención de tokens JWT para diferentes roles:
- `Get Admin Token` - Token con rol `ADMIN`
- `Get User Token` - Token con rol `USER`
- `Verify Token (Introspect)` - Verificar validez del token

### **1. Health & Monitoring** 💚
Endpoints de monitoreo:
- `Health Check` - Estado general de la aplicación
- `Prometheus Metrics` - Métricas en formato Prometheus

### **2. Signature Requests** ✍️
Flujo principal de firma digital:
- `Create Signature Request - SMS (Admin)` - Crear solicitud de firma
- `Create Signature Request - SMS (User)` - Crear como usuario estándar
- `Get Signature Request by ID` - Consultar estado
- `Verify Challenge` - Completar la firma con el código

### **3. Provider Management (Epic 13)** 🔧
Gestión CRUD de providers:
- `List All Providers` - Listar todos los providers
- `List Providers by Type` - Filtrar por tipo (SMS, PUSH, VOICE, BIOMETRIC)
- `List Providers by Enabled Status` - Filtrar por estado
- `Get Provider by ID` - Detalle de un provider
- `Create Provider - SMS (Twilio)` - Crear provider SMS
- `Create Provider - PUSH (Firebase)` - Crear provider PUSH
- `Update Provider` - Actualizar configuración
- `Delete Provider (Soft Delete)` - Eliminar (deshabilitar)
- `Test Provider Connectivity` - Probar conectividad

### **4. Provider Registry (Epic 13)** 📊
Gestión del registro en memoria:
- `Get Registry Statistics` - Estadísticas del registro
- `Reload Provider Registry` - Forzar recarga desde DB

### **5. Provider Health (Epic 13)** 🏥
Monitoreo de salud de providers:
- `Get All Providers Health Status` - Estado de todos
- `Get Provider Health by ID` - Estado de uno específico

---

## 🔑 Variables de Entorno

### Environment: Local Development (Keycloak Docker)

El archivo `Signature-Router-Local.postman_environment.json` incluye:

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `base_url` | `http://localhost:8080` | URL del backend API |
| `keycloak_url` | `http://localhost:8180` | URL de Keycloak |
| `keycloak_realm` | `signature-router` | Realm de Keycloak |
| `keycloak_client_id` | `signature-router-api` | Client ID |
| `keycloak_client_secret` | `signature-router-secret-key-12345` | Client Secret |
| `admin_username` | `admin` | Usuario admin |
| `admin_password` | `admin123` | Password admin |
| `user_username` | `user` | Usuario estándar |
| `user_password` | `user123` | Password usuario |
| `admin_token` | (auto) | Token JWT (se guarda automáticamente) |
| `user_token` | (auto) | Token JWT (se guarda automáticamente) |
| `signature_request_id` | (auto) | ID de la solicitud de firma |
| `challenge_id` | (auto) | ID del challenge |
| `challenge_code` | `123456` | Código del challenge (actualizar manualmente) |
| `provider_id` | (auto) | ID del provider |

### Environment: Dev Remote (Active Directory)

El archivo `Signature-Router-DevRemote.postman_environment.json` incluye:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `base_url` | `http://localhost:8080` | URL del backend API (local) |
| `keycloak_url` | `https://identitydev.sbtech.es` | URL de Keycloak SBTech |
| `keycloak_realm` | `customer` | Realm de Active Directory |
| `keycloak_client_id` | `2ed840ae-2b4c-41cd-a11d-1202f3790f6f` | Client ID registrado |
| `keycloak_client_secret` | `oh6QbAvhj5wAZxvvW2NdjF6QU1cESJxT` | Client Secret |
| `admin_username` | *(tu usuario AD)* | Tu usuario de Active Directory |
| `admin_password` | *(tu password)* | Tu contraseña de AD |

**Roles disponibles en Active Directory:**
- `PRF_ADMIN` - Acceso completo (CRUD + operaciones administrativas)
- `PRF_CONSULTIVO` - Acceso de solo lectura (consultas)

---

## 🧪 Flujos de Prueba Recomendados

### **Flujo 1: Firma Digital Completa (End-to-End)**

1. ✅ `0. Authentication > Get Admin Token`
2. ✅ `2. Signature Requests > Create Signature Request - SMS (Admin)`
3. ✅ `2. Signature Requests > Get Signature Request by ID`
4. 📋 Copiar el `challenge_code` desde PostgreSQL:
   ```powershell
   docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT challenge_code FROM signature_challenge WHERE id = '<challenge_id>';"
   ```
5. 📝 Actualizar variable `challenge_code` en el entorno de Postman
6. ✅ `2. Signature Requests > Verify Challenge`
7. ✅ Verificar que el status sea `SIGNED`

---

### **Flujo 2: Gestión de Providers (Epic 13)**

1. ✅ `0. Authentication > Get Admin Token`
2. ✅ `3. Provider Management > List All Providers`
3. ✅ `3. Provider Management > Create Provider - SMS (Twilio)`
4. ✅ `3. Provider Management > Get Provider by ID`
5. ✅ `3. Provider Management > Update Provider`
6. ✅ `3. Provider Management > Test Provider Connectivity`
7. ✅ `4. Provider Registry > Get Registry Statistics`
8. ✅ `4. Provider Registry > Reload Provider Registry`
9. ✅ `5. Provider Health > Get All Providers Health Status`
10. ✅ `3. Provider Management > Delete Provider (Soft Delete)`

---

### **Flujo 3: Monitoreo y Observabilidad**

1. ✅ `1. Health & Monitoring > Health Check`
2. ✅ `1. Health & Monitoring > Prometheus Metrics`
3. ✅ `5. Provider Health > Get All Providers Health Status`
4. ✅ `4. Provider Registry > Get Registry Statistics`

---

## 🔧 Configuración Avanzada

### **Cambiar a Entorno de Producción**

1. Duplica `Signature-Router-Local.postman_environment.json`
2. Renombra a `Signature-Router-Production.postman_environment.json`
3. Actualiza las URLs:
   ```json
   {
     "key": "base_url",
     "value": "https://api.signature-router.example.com"
   },
   {
     "key": "keycloak_url",
     "value": "https://auth.signature-router.example.com"
   }
   ```
4. Importa el nuevo entorno en Postman

### **Agregar Nuevos Endpoints**

Si añades nuevos endpoints al backend:

1. Abre la colección en Postman
2. Click derecho en la carpeta correspondiente
3. Selecciona **Add Request**
4. Configura:
   - **Name**: Nombre descriptivo
   - **Method**: GET, POST, PUT, DELETE, PATCH
   - **URL**: `{{base_url}}/api/v1/...`
   - **Headers**: `Authorization: Bearer {{admin_token}}`
5. Añade scripts de prueba en la pestaña **Tests** si es necesario

---

## 📝 Scripts de Prueba Automáticos

Todos los endpoints incluyen scripts de prueba automáticos:

### **Ejemplo: Create Signature Request**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set('signature_request_id', response.id);
    console.log('✅ Request ID guardado:', response.id);
    console.log('   Status:', response.status);
}
```

### **Script Global (todas las requests)**
```javascript
pm.test('Response time < 5000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});

if (pm.response.code === 401) {
    console.warn('⚠️ Unauthorized. Ejecuta primero: 0. Authentication > Get Admin Token');
}
```

---

## 🐛 Troubleshooting

### **Error: `401 Unauthorized`**
**Causa:** Token JWT expirado o no obtenido.  
**Solución:** Ejecuta `0. Authentication > Get Admin Token` nuevamente.

### **Error: `Connection refused (localhost:8080)`**
**Causa:** Backend no está corriendo.  
**Solución:** Ejecuta `.\check-and-start.ps1` en `svc-signature-router/`

### **Error: `Connection refused (localhost:8180)`**
**Causa:** Keycloak no está corriendo.  
**Solución:** Ejecuta `docker-compose up -d` para iniciar Keycloak

### **Error: `401 Unauthorized` con Active Directory**
**Causa:** El grant type `password` puede no estar habilitado en SBTech.  
**Solución alternativa:** Obtener el token manualmente:
1. Abre `https://identitydev.sbtech.es/realms/customer/account` en el navegador
2. Inicia sesión con tus credenciales de AD
3. Abre DevTools (F12) > Network > busca peticiones al `/token` endpoint
4. Copia el `access_token` del response
5. Pega el token en la variable `admin_token` del environment de Postman

### **Error: `403 Forbidden` - Access Denied**
**Causa:** Tu usuario no tiene el rol requerido (PRF_ADMIN o PRF_CONSULTIVO).  
**Solución:** Verifica tus roles en el token JWT usando https://jwt.io o el endpoint `Verify Token (Introspect)`

### **Error: `404 Not Found` en endpoints de providers**
**Causa:** El endpoint podría no estar implementado aún.  
**Solución:** Verifica que el controlador correspondiente exista en el backend.

### **Variables no se guardan automáticamente**
**Causa:** El script de prueba no se ejecutó correctamente.  
**Solución:** 
1. Verifica que el response sea exitoso (200, 201)
2. Revisa la consola de Postman (View > Show Postman Console)
3. Ejecuta manualmente el script en la pestaña **Tests**

---

## 📖 Documentación Adicional

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs
- **Actuator Health**: http://localhost:8080/actuator/health
- **Prometheus Metrics**: http://localhost:8080/actuator/prometheus
- **Grafana Dashboard**: http://localhost:3000
- **Jaeger Tracing**: http://localhost:16686
- **Keycloak Admin**: http://localhost:8180/admin

---

## 🎯 Endpoints Nuevos en Epic 13

| Endpoint | Método | Descripción | Story |
|----------|--------|-------------|-------|
| `/api/v1/admin/providers` | GET | Listar providers | 13.4 |
| `/api/v1/admin/providers` | POST | Crear provider | 13.4 |
| `/api/v1/admin/providers/{id}` | GET | Obtener provider | 13.4 |
| `/api/v1/admin/providers/{id}` | PUT | Actualizar provider | 13.4 |
| `/api/v1/admin/providers/{id}` | DELETE | Eliminar provider | 13.4 |
| `/api/v1/admin/providers/{id}/test` | POST | Probar provider | 13.4 |
| `/api/v1/admin/registry/stats` | GET | Estadísticas registro | 13.6 |
| `/api/v1/admin/registry/reload` | POST | Recargar registro | 13.6 |
| `/api/v1/admin/providers/health` | GET | Salud de todos | 13.5 |
| `/api/v1/admin/providers/{id}/health` | GET | Salud de uno | 13.5 |

---

## 🚀 ¡Listo para Usar!

La colección está completamente actualizada con todos los endpoints de Epic 13 (Provider Management).

**¿Necesitas ayuda?** Revisa la documentación del backend en `/docs` o consulta Swagger UI.

---

---

## 🆕 Cambios en v2.1 (2025-12-04)

### **Contexto Enriquecido para Reglas SpEL**

Los requests de signature ahora incluyen un `transactionContext` completo que funciona con las reglas SpEL existentes:

**Antes (v2.0):**
```json
{
  "transactionContext": {
    "amount": { "value": 1500.00, "currency": "EUR" },
    "merchantId": "MERCHANT-919"
  }
}
```

**Ahora (v2.1):**
```json
{
  "transactionContext": {
    "customer": {
      "tier": "premium",         // ← Para reglas: context.customer.tier == 'premium'
      "riskLevel": "low",         // ← Para reglas: context.customer.riskLevel
      "age": 35,
      "country": "ES"
    },
    "amount": {
      "value": 1500.00,           // ← Para reglas: context.amount.value > 1000
      "currency": "EUR"
    },
    "channel": "SMS",             // ← Para reglas: context.channel == 'SMS'
    "merchantId": "MERCHANT-919",
    "deviceInfo": {
      "type": "mobile",           // ← Para reglas: context.deviceInfo.type
      "os": "iOS"
    }
  }
}
```

**Beneficio:** Las reglas SpEL ahora pueden evaluar correctamente propiedades como:
- `context.customer.tier == 'premium'` ✅
- `context.channel == 'SMS'` ✅
- `context.amount.value > 1000` ✅
- `context.deviceInfo.os == 'iOS'` ✅

---

**Última actualización:** 2025-12-04  
**Autor:** Signature Router Team  
**Versión:** 2.1 (SpEL Context Fix + Epic 13)

