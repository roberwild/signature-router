# Especificación de Interfaces MuleSoft - Signature Router

**Fecha:** 5 de diciembre de 2025  
**Proyecto:** Signature Router - Integración Provider Catalog  
**Estado:** 📋 Ready for Implementation

---

## 1. Contexto

Signature Router necesita consumir el catálogo de providers de firma digital configurados en MuleSoft, verificar su estado de salud periódicamente, y enviar challenges de autenticación a través de ellos.

**Objetivo:** MuleSoft expone 3 endpoints REST que permiten a Signature Router:
1. Obtener la lista de providers disponibles
2. Verificar el estado de salud de cada provider
3. Enviar challenges de firma digital (SMS, PUSH, VOICE, BIOMETRIC)

---

## 2. Autenticación

**Método:** OAuth 2.0 Client Credentials Flow

**Headers requeridos en todas las peticiones:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
X-Correlation-Id: {uuid}
```

**Información requerida:**
- Token endpoint URL
- Client ID
- Client secret
- Scopes: `signature:read`, `signature:write`

---

## 3. Endpoint 1: Listar Providers

### GET /api/v1/signature/providers

**Descripción:** Devuelve el catálogo completo de providers de firma digital configurados en MuleSoft.

**Request:**
```http
GET /api/v1/signature/providers
Authorization: Bearer {token}
X-Correlation-Id: 550e8400-e29b-41d4-a716-446655440000
```

**Query Parameters (Opcionales):**
| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `type` | string | Filtrar por tipo de provider | `SMS`, `PUSH`, `VOICE`, `BIOMETRIC` |
| `status` | string | Filtrar por estado | `available`, `configured`, `down` |

**Ejemplos de uso:**
```http
GET /api/v1/signature/providers?type=SMS
GET /api/v1/signature/providers?status=available
GET /api/v1/signature/providers?type=PUSH&status=available
```

---

### Response 200 OK

```json
{
  "timestamp": "2025-12-05T12:00:00Z",
  "total": 6,
  "providers": [
    {
      "id": "mule-twilio-sms-es",
      "name": "Twilio SMS España",
      "type": "SMS",
      "endpoint": "/api/v1/signature/sms/twilio",
      "status": "available",
      "description": "Provider SMS para España (Twilio)",
      "region": "EU",
      "capabilities": ["SMS", "OTP"],
      "configuredAt": "2025-11-01T10:00:00Z"
    },
    {
      "id": "mule-aws-sns-es",
      "name": "AWS SNS España",
      "type": "SMS",
      "endpoint": "/api/v1/signature/sms/aws-sns",
      "status": "available",
      "description": "Provider SMS fallback (AWS SNS)",
      "region": "EU",
      "capabilities": ["SMS", "OTP"],
      "configuredAt": "2025-11-05T14:00:00Z"
    },
    {
      "id": "mule-firebase-fcm",
      "name": "Firebase Cloud Messaging",
      "type": "PUSH",
      "endpoint": "/api/v1/signature/push/fcm",
      "status": "available",
      "description": "Push notifications vía Firebase",
      "region": "GLOBAL",
      "capabilities": ["PUSH", "RICH_PUSH"],
      "configuredAt": "2025-11-10T09:00:00Z"
    },
    {
      "id": "mule-onesignal",
      "name": "OneSignal Push",
      "type": "PUSH",
      "endpoint": "/api/v1/signature/push/onesignal",
      "status": "configured",
      "description": "OneSignal push notifications",
      "region": "GLOBAL",
      "capabilities": ["PUSH"],
      "configuredAt": "2025-11-12T11:00:00Z"
    },
    {
      "id": "mule-vonage-voice",
      "name": "Vonage Voice API",
      "type": "VOICE",
      "endpoint": "/api/v1/signature/voice/vonage",
      "status": "available",
      "description": "Llamadas de voz automatizadas",
      "region": "EU",
      "capabilities": ["VOICE", "TTS"],
      "configuredAt": "2025-11-08T15:00:00Z"
    },
    {
      "id": "mule-veridas-bio",
      "name": "Veridas Biometric Auth",
      "type": "BIOMETRIC",
      "endpoint": "/api/v1/signature/biometric/veridas",
      "status": "down",
      "description": "Autenticación biométrica facial",
      "region": "EU",
      "capabilities": ["FACE_ID", "LIVENESS"],
      "configuredAt": "2025-11-15T11:00:00Z",
      "downSince": "2025-12-05T08:30:00Z",
      "downReason": "Provider API unavailable"
    }
  ]
}
```

---

### Campos del Provider

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | ✅ | ID único del provider en MuleSoft |
| `name` | string | ✅ | Nombre descriptivo del provider |
| `type` | string | ✅ | Tipo: `SMS`, `PUSH`, `VOICE`, `BIOMETRIC` |
| `endpoint` | string | ✅ | Path relativo del endpoint de envío |
| `status` | string | ✅ | Estado: `available`, `configured`, `down` |
| `description` | string | ❌ | Descripción del provider |
| `region` | string | ❌ | Región: `EU`, `US`, `GLOBAL` |
| `capabilities` | array | ❌ | Array de capacidades soportadas |
| `configuredAt` | datetime | ✅ | Fecha ISO 8601 de configuración |
| `downSince` | datetime | ❌ | Fecha ISO 8601 desde que está caído (solo si `status=down`) |
| `downReason` | string | ❌ | Razón del estado down (solo si `status=down`) |

---

### Estados del Provider

| Status | Descripción | ¿Puede usarse? |
|--------|-------------|----------------|
| `available` | Provider configurado y funcionando | ✅ Sí |
| `configured` | Provider configurado pero no verificado | ✅ Sí |
| `down` | Provider caído o no disponible | ❌ No |

---

### Tipos de Provider

| Type | Descripción | Ejemplos |
|------|-------------|----------|
| `SMS` | Mensajes de texto | Twilio, AWS SNS, Vonage |
| `PUSH` | Notificaciones push | Firebase FCM, OneSignal |
| `VOICE` | Llamadas de voz | Vonage Voice, Twilio Voice |
| `BIOMETRIC` | Autenticación biométrica | Veridas, FaceTech |

---

### Frecuencia de Consulta

Signature Router consultará este endpoint:
- **Cada 5 minutos** (sincronización automática)
- **Rate limit esperado:** ~12 requests/hora

---

## 4. Endpoint 2: Health Check de Provider

### GET /api/v1/signature/providers/{id}/health

**Descripción:** Verifica el estado de salud de un provider específico, haciendo un ping real al servicio externo.

**Request:**
```http
GET /api/v1/signature/providers/mule-twilio-sms-es/health
Authorization: Bearer {token}
X-Correlation-Id: 550e8400-e29b-41d4-a716-446655440001
```

---

### Response 200 OK (Provider Healthy)

```json
{
  "providerId": "mule-twilio-sms-es",
  "providerName": "Twilio SMS España",
  "status": "healthy",
  "latencyMs": 45,
  "checkedAt": "2025-12-05T12:05:30Z",
  "details": "All systems operational",
  "lastSuccessfulRequest": "2025-12-05T12:05:25Z"
}
```

---

### Response 200 OK (Provider Unhealthy)

```json
{
  "providerId": "mule-veridas-bio",
  "providerName": "Veridas Biometric Auth",
  "status": "unhealthy",
  "latencyMs": 0,
  "checkedAt": "2025-12-05T12:05:30Z",
  "details": "Provider API unavailable",
  "error": {
    "code": "PROVIDER_DOWN",
    "message": "Connection timeout after 5000ms"
  },
  "lastSuccessfulRequest": "2025-12-05T08:25:00Z",
  "downSince": "2025-12-05T08:30:00Z"
}
```

---

### Response 404 Not Found

```json
{
  "error": {
    "code": "PROVIDER_NOT_FOUND",
    "message": "Provider with id 'invalid-id' not found"
  }
}
```

---

### Campos del Health Check

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `providerId` | string | ✅ | ID del provider consultado |
| `providerName` | string | ✅ | Nombre del provider |
| `status` | string | ✅ | Estado: `healthy` o `unhealthy` |
| `latencyMs` | number | ✅ | Latencia en milisegundos (0 si unhealthy) |
| `checkedAt` | datetime | ✅ | Timestamp ISO 8601 del health check |
| `details` | string | ❌ | Mensaje descriptivo del estado |
| `error` | object | ❌ | Objeto de error (solo si unhealthy) |
| `error.code` | string | ❌ | Código de error técnico |
| `error.message` | string | ❌ | Mensaje de error |
| `lastSuccessfulRequest` | datetime | ❌ | Última petición exitosa |
| `downSince` | datetime | ❌ | Desde cuándo está caído (solo si unhealthy) |

---

### Frecuencia de Consulta

Signature Router consultará este endpoint:
- **Cada 1 minuto por cada provider habilitado**
- **Ejemplo:** 4 providers habilitados = 240 requests/hora total
- **Rate limit esperado:** ~300 requests/hora (margen para picos)

---

## 5. Endpoint 3: Enviar Challenge

### POST /api/v1/signature/providers/{id}/send

**Descripción:** Envía un challenge de autenticación (SMS, PUSH, VOICE, BIOMETRIC) usando un provider específico.

**Request:**
```http
POST /api/v1/signature/providers/mule-twilio-sms-es/send
Authorization: Bearer {token}
X-Correlation-Id: 550e8400-e29b-41d4-a716-446655440002
Content-Type: application/json

{
  "challengeCode": "123456",
  "recipient": "+34600123456",
  "message": "Tu código de verificación Singular Bank es: {{code}}",
  "expiresInSeconds": 300,
  "metadata": {
    "sessionId": "SIG-SESSION-12345",
    "userId": "user-789",
    "ip": "192.168.1.100"
  }
}
```

---

### Campos del Request

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `challengeCode` | string | ✅ | Código OTP de 6 dígitos |
| `recipient` | string | ✅ | Destinatario (teléfono, device token, etc) |
| `message` | string | ❌ | Template del mensaje ({{code}} será reemplazado) |
| `expiresInSeconds` | number | ❌ | Tiempo de expiración (default: 300s) |
| `metadata` | object | ❌ | Metadata adicional para logging/auditoría |
| `metadata.sessionId` | string | ❌ | ID de sesión de firma |
| `metadata.userId` | string | ❌ | ID del usuario |
| `metadata.ip` | string | ❌ | IP del usuario |

---

### Response 200 OK (Envío Exitoso)

```json
{
  "success": true,
  "notificationId": "COMM-EXEC-20241205-001234",
  "status": "SENT",
  "submittedAt": "2025-12-05T12:10:25.123Z",
  "channel": "SMS",
  "communicationExecutionId": "BIAN-COMM-EXEC-UUID-12345",
  
  "providerMetadata": {
    "providerId": "mule-twilio-sms-es",
    "providerName": "Twilio SMS España",
    "providerType": "SMS",
    "providerLatencyMs": 95,
    "providerTransactionId": "SM1234567890abcdef"
  }
}
```

---

### Response 200 OK (Envío Fallido - Retryable)

```json
{
  "success": false,
  "notificationId": "COMM-EXEC-20241205-001235",
  "status": "FAILED",
  "submittedAt": "2025-12-05T12:10:30.456Z",
  "channel": "SMS",
  
  "error": {
    "code": "RATE_LIMITED",
    "message": "Provider rate limit exceeded",
    "retryable": true,
    "retryAfterSeconds": 60
  },
  
  "providerMetadata": {
    "providerId": "mule-twilio-sms-es",
    "providerName": "Twilio SMS España",
    "providerType": "SMS",
    "providerLatencyMs": 450,
    "providerError": {
      "code": "20429",
      "message": "Too Many Requests"
    }
  }
}
```

---

### Response 200 OK (Envío Fallido - No Retryable)

```json
{
  "success": false,
  "notificationId": "COMM-EXEC-20241205-001236",
  "status": "FAILED",
  "submittedAt": "2025-12-05T12:10:35.789Z",
  "channel": "SMS",
  
  "error": {
    "code": "INVALID_PHONE",
    "message": "Invalid phone number format",
    "retryable": false
  },
  
  "providerMetadata": {
    "providerId": "mule-twilio-sms-es",
    "providerName": "Twilio SMS España",
    "providerType": "SMS",
    "providerLatencyMs": 120,
    "providerError": {
      "code": "21211",
      "message": "The 'To' number +341234 is not a valid phone number."
    }
  }
}
```

---

### Response 404 Not Found

```json
{
  "error": {
    "code": "PROVIDER_NOT_FOUND",
    "message": "Provider with id 'invalid-id' not found"
  }
}
```

---

### Campos del Response (Éxito)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `success` | boolean | ✅ | `true` si se envió correctamente |
| `notificationId` | string | ✅ | ID único de la notificación |
| `status` | string | ✅ | Estado: `SENT`, `FAILED` |
| `submittedAt` | datetime | ✅ | Timestamp ISO 8601 del envío |
| `channel` | string | ✅ | Canal: `SMS`, `PUSH`, `VOICE`, `BIOMETRIC` |
| `communicationExecutionId` | string | ❌ | ID de ejecución BIAN (si aplica) |
| `providerMetadata` | object | ✅ | Metadata del provider utilizado |
| `providerMetadata.providerId` | string | ✅ | ID del provider |
| `providerMetadata.providerName` | string | ✅ | Nombre del provider |
| `providerMetadata.providerType` | string | ✅ | Tipo del provider |
| `providerMetadata.providerLatencyMs` | number | ✅ | Latencia del provider en ms |
| `providerMetadata.providerTransactionId` | string | ❌ | ID de transacción del provider externo |

---

### Campos del Response (Error)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `success` | boolean | ✅ | `false` si falló |
| `notificationId` | string | ✅ | ID único de la notificación |
| `status` | string | ✅ | `FAILED` |
| `submittedAt` | datetime | ✅ | Timestamp ISO 8601 del intento |
| `channel` | string | ✅ | Canal intentado |
| `error` | object | ✅ | Objeto de error |
| `error.code` | string | ✅ | Código de error (ver tabla abajo) |
| `error.message` | string | ✅ | Mensaje de error |
| `error.retryable` | boolean | ✅ | `true` si se puede reintentar |
| `error.retryAfterSeconds` | number | ❌ | Segundos a esperar antes de reintentar |
| `providerMetadata` | object | ✅ | Metadata del provider |
| `providerMetadata.providerError` | object | ❌ | Error específico del provider externo |

---

### Códigos de Error

| Code | Retryable | HTTP Status | Descripción |
|------|-----------|-------------|-------------|
| `PROVIDER_DOWN` | ✅ Yes | 200 | Provider no disponible |
| `RATE_LIMITED` | ✅ Yes | 200 | Rate limit excedido |
| `TIMEOUT` | ✅ Yes | 200 | Timeout del provider |
| `INVALID_PHONE` | ❌ No | 200 | Número de teléfono inválido |
| `INVALID_REQUEST` | ❌ No | 400 | Request malformado |
| `PROVIDER_NOT_FOUND` | ❌ No | 404 | Provider ID no existe |
| `UNAUTHORIZED` | ❌ No | 401 | Token inválido o expirado |
| `INTERNAL_ERROR` | ✅ Yes | 500 | Error interno de MuleSoft |

**Nota:** Los errores de negocio (envío fallido) retornan **HTTP 200** con `success: false`.

---

### Frecuencia de Consulta

Signature Router enviará challenges:
- **Variable según tráfico de usuarios**
- **Pico estimado:** ~100-500 requests/minuto
- **Promedio:** ~50 requests/minuto

---

## 6. Timeouts

Timeouts máximos esperados por endpoint:

| Endpoint | Timeout | Descripción |
|----------|---------|-------------|
| `GET /providers` | 5 segundos | Lista de providers |
| `GET /providers/{id}/health` | 3 segundos | Health check |
| `POST /providers/{id}/send` | 10 segundos | Incluye latencia del provider real |

Si se excede el timeout, Signature Router cancela la petición.

---

## 7. Rate Limiting

Rate limits esperados:

| Endpoint | Rate Limit |
|----------|------------|
| `GET /providers` | 20 req/min |
| `GET /providers/{id}/health` | 300 req/hora total |
| `POST /providers/{id}/send` | 1000 req/min |

---

## 8. Seguridad

### Requisitos:
- ✅ **HTTPS obligatorio** (TLS 1.2+)
- ✅ **OAuth 2.0 Client Credentials**
- ✅ **Token refresh automático** (manejado por Signature Router)
- ✅ **Correlation ID** en header `X-Correlation-Id` para trazabilidad

### Información requerida para configuración:
1. **Token endpoint URL:** `https://...`
2. **Client ID:** (proporcionado por MuleSoft)
3. **Client secret:** (proporcionado por MuleSoft)
4. **Scopes:** `signature:read signature:write`
5. **IP Whitelisting:** (si aplica)

---

## 9. Ambientes

### DEV
- **Base URL:** TBD
- **Disponibilidad esperada:** 9 dic 2025

### UAT
- **Base URL:** TBD
- **Disponibilidad esperada:** 20 dic 2025

### PRD
- **Base URL:** TBD
- **Disponibilidad esperada:** 23 dic 2025

---

## 10. Testing

### Casos de Prueba Mínimos:

**Endpoint 1 (List Providers):**
- ✅ Listar todos los providers
- ✅ Filtrar por `type=SMS`
- ✅ Filtrar por `status=available`
- ✅ Response con 0 providers (catálogo vacío)

**Endpoint 2 (Health Check):**
- ✅ Provider healthy (latencia < 500ms)
- ✅ Provider unhealthy (timeout)
- ✅ Provider no encontrado (404)

**Endpoint 3 (Send Challenge):**
- ✅ Envío exitoso SMS
- ✅ Envío exitoso PUSH
- ✅ Error retryable (rate limit)
- ✅ Error no retryable (teléfono inválido)
- ✅ Provider no encontrado (404)

---

## 11. Monitoreo

### Métricas requeridas (MuleSoft side):
- Requests totales por endpoint
- Latencia P50, P95, P99
- Rate de errores por código
- Availability del servicio

### Logs requeridos:
- Correlation ID en todos los logs
- Request/Response completo (sanitizado)
- Errores de providers externos

---

## 12. Documentación Adicional Requerida

Por favor proporcionar:
1. ✅ **OpenAPI/Swagger spec** de los 3 endpoints
2. ✅ **Guía de autenticación OAuth2** (cómo obtener token)
3. ✅ **Credenciales para DEV** (client_id, client_secret)
4. ✅ **Rate limits exactos** por endpoint
5. ✅ **Contacto técnico** para soporte

---

## 13. Timeline

| Fecha | Milestone |
|-------|-----------|
| **6 dic** | Kick-off meeting - Validar especificación |
| **9 dic** | Endpoints disponibles en DEV |
| **9-13 dic** | Integration testing |
| **16 dic** | Endpoints disponibles en UAT |
| **20 dic** | UAT validation |
| **23 dic** | Go-live PRD |

---

## 14. Contacto

**Signature Router Team:**
- Responsable técnico: [TBD]
- Email: [TBD]

**MuleSoft Team:**
- Responsable técnico: Borja
- Email: [TBD]

---

## 15. Anexos

### Anexo A: Ejemplo de Flujo Completo

```
1. Signature Router sincroniza catálogo (cada 5 min)
   GET /providers → 6 providers disponibles

2. Signature Router hace health check (cada 1 min)
   GET /providers/mule-twilio-sms-es/health → healthy (45ms)
   GET /providers/mule-aws-sns-es/health → healthy (78ms)
   GET /providers/mule-firebase-fcm/health → healthy (32ms)

3. Usuario solicita OTP por SMS
   POST /providers/mule-twilio-sms-es/send → ERROR (rate limited)
   
4. Signature Router intenta fallback automático
   POST /providers/mule-aws-sns-es/send → SUCCESS
```

### Anexo B: Formato de Recipient por Tipo

| Provider Type | Recipient Format | Ejemplo |
|---------------|------------------|---------|
| SMS | E.164 phone number | `+34600123456` |
| PUSH | Device token | `fGH...xyz` (Firebase token) |
| VOICE | E.164 phone number | `+34600123456` |
| BIOMETRIC | User ID | `user-12345` |

---

**Documento preparado para:** Equipo MuleSoft  
**Última actualización:** 5 de diciembre de 2025  
**Próxima acción:** Kick-off meeting 6 dic 2025
