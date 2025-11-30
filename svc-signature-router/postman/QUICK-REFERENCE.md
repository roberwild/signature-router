# 🚀 Quick Reference - Postman Collection

Referencia rápida de todos los endpoints disponibles en la colección.

---

## 🔐 **0. Authentication (Keycloak)**

| Endpoint | Método | URL | Auth | Guarda Variable |
|----------|--------|-----|------|-----------------|
| Get Admin Token | POST | `{{keycloak_url}}/realms/{{keycloak_realm}}/protocol/openid-connect/token` | No | `admin_token` |
| Get User Token | POST | `{{keycloak_url}}/realms/{{keycloak_realm}}/protocol/openid-connect/token` | No | `user_token` |
| Verify Token | POST | `{{keycloak_url}}/realms/{{keycloak_realm}}/protocol/openid-connect/token/introspect` | No | - |

---

## 💚 **1. Health & Monitoring**

| Endpoint | Método | URL | Auth | Rol Requerido |
|----------|--------|-----|------|---------------|
| Health Check | GET | `/actuator/health` | No | - |
| Prometheus Metrics | GET | `/actuator/prometheus` | No | - |

---

## ✍️ **2. Signature Requests**

| Endpoint | Método | URL | Auth | Rol | Guarda Variable |
|----------|--------|-----|------|-----|-----------------|
| Create Signature Request - SMS (Admin) | POST | `/api/v1/signatures` | ✅ | ADMIN | `signature_request_id` |
| Create Signature Request - SMS (User) | POST | `/api/v1/signatures` | ✅ | USER | `signature_request_id` |
| Get Signature Request by ID | GET | `/api/v1/signatures/{{signature_request_id}}` | ✅ | USER/ADMIN | `challenge_id` |
| Verify Challenge | PATCH | `/api/v1/signatures/{{signature_request_id}}/complete` | ✅ | USER/ADMIN | - |

**Body Example (Create):**
```json
{
  "customerId": "CUST-1234567890",
  "phoneNumber": "+34612345678",
  "transactionContext": {
    "amount": { "value": 1500.00, "currency": "EUR" },
    "merchantId": "MERCHANT-123",
    "orderId": "ORDER-456",
    "description": "Transferencia a cuenta externa"
  }
}
```

**Body Example (Verify):**
```json
{
  "challengeId": "019ad705-2b9e-75f5-ad88-70f869573c55",
  "code": "509575"
}
```

---

## 🔧 **3. Provider Management (Epic 13)** ⭐ NUEVO

| Endpoint | Método | URL | Auth | Rol | Guarda Variable |
|----------|--------|-----|------|-----|-----------------|
| List All Providers | GET | `/api/v1/admin/providers` | ✅ | ADMIN/SUPPORT | `provider_id` |
| List Providers by Type | GET | `/api/v1/admin/providers?type=SMS` | ✅ | ADMIN/SUPPORT | - |
| List Providers by Enabled | GET | `/api/v1/admin/providers?enabled=true` | ✅ | ADMIN/SUPPORT | - |
| Get Provider by ID | GET | `/api/v1/admin/providers/{{provider_id}}` | ✅ | ADMIN/SUPPORT | - |
| Create Provider - SMS | POST | `/api/v1/admin/providers` | ✅ | ADMIN | `provider_id` |
| Create Provider - PUSH | POST | `/api/v1/admin/providers` | ✅ | ADMIN | `provider_id` |
| Update Provider | PUT | `/api/v1/admin/providers/{{provider_id}}` | ✅ | ADMIN | - |
| Delete Provider | DELETE | `/api/v1/admin/providers/{{provider_id}}` | ✅ | ADMIN | - |
| Test Provider | POST | `/api/v1/admin/providers/{{provider_id}}/test` | ✅ | ADMIN | - |

**Provider Types:**
- `SMS` - SMS providers (Twilio, Vonage, etc.)
- `PUSH` - Push notification providers (Firebase, etc.)
- `VOICE` - Voice call providers
- `BIOMETRIC` - Biometric providers (FacePhi, etc.)

**Body Example (Create SMS Provider):**
```json
{
  "providerCode": "TWILIO_SMS_PROD",
  "type": "SMS",
  "displayName": "Twilio SMS Provider",
  "description": "Proveedor de SMS usando Twilio API",
  "enabled": true,
  "priority": 1,
  "config": {
    "accountSid": "ACxxxxxxxxxxxxxxxxxxxxx",
    "authToken": "your-auth-token-here",
    "fromNumber": "+34900123456",
    "maxRetries": 3,
    "timeoutMs": 5000
  },
  "healthCheckConfig": {
    "enabled": true,
    "intervalSeconds": 60,
    "timeoutMs": 3000,
    "failureThreshold": 3
  }
}
```

**Body Example (Update Provider):**
```json
{
  "displayName": "Twilio SMS Provider (Updated)",
  "description": "Provider actualizado",
  "enabled": true,
  "priority": 2,
  "config": {
    "accountSid": "ACxxxxxxxxxxxxxxxxxxxxx",
    "authToken": "new-token",
    "fromNumber": "+34900999888",
    "maxRetries": 5,
    "timeoutMs": 8000
  }
}
```

**Body Example (Test Provider):**
```json
{
  "testPhoneNumber": "+34600000000",
  "testMessage": "Test message from Signature Router"
}
```

---

## 📊 **4. Provider Registry (Epic 13)** ⭐ NUEVO

| Endpoint | Método | URL | Auth | Rol |
|----------|--------|-----|------|-----|
| Get Registry Statistics | GET | `/api/v1/admin/registry/stats` | ✅ | ADMIN/SUPPORT |
| Reload Provider Registry | POST | `/api/v1/admin/registry/reload` | ✅ | ADMIN |

**Response Example (Registry Stats):**
```json
{
  "totalProviders": 12,
  "enabledProviders": 10,
  "disabledProviders": 2,
  "providersByType": {
    "SMS": 4,
    "PUSH": 3,
    "VOICE": 2,
    "BIOMETRIC": 3
  },
  "lastReloadAt": "2025-11-30T23:15:00Z",
  "cacheHitRate": 0.95
}
```

---

## 🏥 **5. Provider Health (Epic 13)** ⭐ NUEVO

| Endpoint | Método | URL | Auth | Rol |
|----------|--------|-----|------|-----|
| Get All Providers Health | GET | `/api/v1/admin/providers/health` | ✅ | ADMIN/SUPPORT |
| Get Provider Health by ID | GET | `/api/v1/admin/providers/{{provider_id}}/health` | ✅ | ADMIN/SUPPORT |

**Response Example (All Providers Health):**
```json
{
  "overallStatus": "HEALTHY",
  "totalProviders": 12,
  "healthyProviders": 10,
  "unhealthyProviders": 2,
  "providers": [
    {
      "providerId": "019ad705-...",
      "providerCode": "TWILIO_SMS_PROD",
      "type": "SMS",
      "status": "HEALTHY",
      "lastCheckAt": "2025-11-30T23:10:00Z",
      "responseTimeMs": 120,
      "consecutiveFailures": 0
    }
  ]
}
```

---

## 🎯 Flujos de Prueba Rápidos

### **Flujo 1: Firma Digital (3 minutos)** ⚡

```
1. Get Admin Token
2. Create Signature Request - SMS (Admin)
3. Get Signature Request by ID
4. [Manual] Copiar challenge_code desde PostgreSQL
5. Verify Challenge
✅ Status: SIGNED
```

### **Flujo 2: Gestión de Providers (5 minutos)** ⚡

```
1. Get Admin Token
2. List All Providers
3. Create Provider - SMS (Twilio)
4. Test Provider Connectivity
5. Get Registry Statistics
6. Get All Providers Health
✅ Provider creado y funcionando
```

---

## 📝 Variables de Entorno Importantes

| Variable | Descripción | Se Guarda Auto |
|----------|-------------|----------------|
| `admin_token` | JWT token con rol ADMIN | ✅ |
| `user_token` | JWT token con rol USER | ✅ |
| `signature_request_id` | ID de la solicitud de firma | ✅ |
| `challenge_id` | ID del challenge activo | ✅ |
| `challenge_code` | Código del challenge (6 dígitos) | ❌ Manual |
| `provider_id` | ID del provider | ✅ |

---

## 🔑 Headers Comunes

### **Autenticación**
```
Authorization: Bearer {{admin_token}}
```

### **Content Type**
```
Content-Type: application/json
```

### **Idempotency (para POSTs críticos)**
```
Idempotency-Key: {{$guid}}
```

---

## ❌ Códigos de Error Comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| 401 | Unauthorized | Obtener nuevo token (expiró) |
| 403 | Forbidden | Usuario sin rol necesario (ej: USER intentando crear provider) |
| 404 | Not Found | ID incorrecto o recurso eliminado |
| 409 | Conflict | Provider con mismo código ya existe |
| 422 | Validation Error | Body con datos inválidos |
| 500 | Internal Server Error | Revisar logs del backend |

---

## 🚀 Atajos de Teclado en Postman

| Acción | Windows/Linux | Mac |
|--------|---------------|-----|
| Enviar request | `Ctrl + Enter` | `Cmd + Enter` |
| Guardar request | `Ctrl + S` | `Cmd + S` |
| Nueva request | `Ctrl + N` | `Cmd + N` |
| Abrir consola | `Ctrl + Alt + C` | `Cmd + Alt + C` |
| Buscar | `Ctrl + F` | `Cmd + F` |

---

## 📊 Estadísticas de la Colección

- **Total Endpoints:** 22
- **Endpoints con Auth:** 18
- **Endpoints Públicos:** 4
- **Métodos GET:** 11
- **Métodos POST:** 8
- **Métodos PUT:** 1
- **Métodos PATCH:** 1
- **Métodos DELETE:** 1

---

## 🔗 URLs Útiles

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Backend API** | http://localhost:8080 | API principal |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | Documentación interactiva |
| **Actuator Health** | http://localhost:8080/actuator/health | Health check |
| **Keycloak** | http://localhost:8180 | Auth server |
| **PostgreSQL** | localhost:5432 | Base de datos |
| **Grafana** | http://localhost:3000 | Dashboards |
| **Jaeger** | http://localhost:16686 | Distributed tracing |
| **Prometheus** | http://localhost:9090 | Métricas |

---

## 📦 Scripts Útiles

### **Obtener challenge_code desde PostgreSQL**
```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT challenge_code FROM signature_challenge WHERE id = 'TU_CHALLENGE_ID';"
```

### **Ver últimas firmas creadas**
```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT id, status, created_at FROM signature_request ORDER BY created_at DESC LIMIT 5;"
```

### **Ver todos los providers**
```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT id, provider_code, type, enabled FROM provider ORDER BY created_at DESC;"
```

---

**Última actualización:** 2025-11-30  
**Versión:** 2.0.0  
**Total Endpoints:** 22 (+14 desde v1.0.0)

