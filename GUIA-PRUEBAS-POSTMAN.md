# 🚀 Guía de Pruebas con Postman - Signature Router

## 📋 Índice

1. [Instalación y Setup](#instalación-y-setup)
2. [Flujo de Pruebas Básico](#flujo-de-pruebas-básico)
3. [Escenarios de Prueba Avanzados](#escenarios-de-prueba-avanzados)
4. [Validación de Circuit Breakers](#validación-de-circuit-breakers)
5. [Troubleshooting](#troubleshooting)

---

## 1. Instalación y Setup

### 1.1 Importar la Colección en Postman

1. **Abrir Postman**
2. **Importar archivos:**
   - Click en **Import** (esquina superior izquierda)
   - Arrastra los archivos:
     - `postman/Signature-Router.postman_collection.json`
     - `postman/Signature-Router-Local.postman_environment.json`

3. **Activar el Environment:**
   - En la esquina superior derecha, selecciona **"Signature Router - Local"**

### 1.2 Verificar que la Aplicación está Arrancada

```bash
# Verificar que el servidor está corriendo
curl http://localhost:8080/actuator/health
```

**Respuesta esperada:**
```json
{
  "status": "UP"
}
```

---

## 2. Flujo de Pruebas Básico

### 2.1 Health Check Inicial

**Request:** `1. Health & Monitoring > Health Check`

**Qué valida:**
- ✅ Aplicación arrancada correctamente
- ✅ Base de datos PostgreSQL conectada
- ✅ Vault disponible (si está habilitado)

**Respuesta esperada:**
```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

---

### 2.2 Verificar Estado de Providers

**Request:** `1. Health & Monitoring > Provider Health (Admin)`

**⚠️ NOTA:** Requiere token de administrador. Por ahora, la aplicación NO tiene seguridad implementada, así que funciona sin token.

**Qué valida:**
- ✅ Twilio SMS Provider: `UP` o `DOWN`
- ✅ Push Notification Provider: `DOWN` (deshabilitado en local)
- ✅ Voice Call Provider: `UP` o `DOWN`
- ✅ Biometric Provider: `UP` (stub siempre UP)

**Respuesta esperada:**
```json
{
  "overallStatus": "DEGRADED",
  "timestamp": "2025-11-27T16:00:00Z",
  "providers": [
    {
      "name": "TwilioSmsProvider",
      "type": "SMS",
      "status": "UP",
      "latencyMs": 45,
      "details": {
        "accountSid": "ACxxxx...xxxx",
        "messagingServiceSid": "MGxxxx...xxxx"
      }
    },
    {
      "name": "PushNotificationProvider",
      "type": "PUSH",
      "status": "DOWN",
      "errorMessage": "Provider is disabled"
    },
    {
      "name": "VoiceCallProvider",
      "type": "VOICE",
      "status": "UP",
      "latencyMs": 120
    },
    {
      "name": "BiometricProvider",
      "type": "BIOMETRIC",
      "status": "UP",
      "latencyMs": 5,
      "details": {
        "mode": "STUB"
      }
    }
  ]
}
```

---

### 2.3 Crear Signature Request (SMS)

**Request:** `2. Signature Requests > Create Signature Request - SMS`

**Qué hace:**
1. Crea una solicitud de firma
2. Evalúa reglas de routing
3. Envía SMS con código de 6 dígitos al número configurado en Vault
4. Guarda `signature_request_id` y `challenge_id` automáticamente

**Body de ejemplo:**
```json
{
  "customerId": "CUST-{{$timestamp}}",
  "transactionContext": {
    "transactionId": "TXN-{{$randomInt}}",
    "amount": 1500.00,
    "currency": "EUR",
    "description": "Transferencia a cuenta externa",
    "riskLevel": "MEDIUM"
  },
  "channelPreference": "SMS",
  "metadata": {
    "deviceId": "DEVICE-123",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0"
  }
}
```

**Respuesta esperada (201 Created):**
```json
{
  "id": "01JDQX...",
  "customerId": "CUST-1732723200",
  "status": "PENDING_VALIDATION",
  "currentChallenge": {
    "id": "01JDQY...",
    "channelType": "SMS",
    "status": "SENT",
    "attemptNumber": 1,
    "maxAttempts": 3,
    "expiresAt": "2025-11-27T16:10:00Z"
  },
  "transactionContext": {
    "amount": 1500.00,
    "currency": "EUR",
    "description": "Transferencia a cuenta externa",
    "riskLevel": "MEDIUM"
  },
  "createdAt": "2025-11-27T16:05:00Z"
}
```

**📱 IMPORTANTE:** Revisa el número de teléfono configurado en Vault para recibir el SMS.

---

### 2.4 Verificar el Challenge

**Request:** `3. Challenge Verification > Verify Challenge - SUCCESS`

**Qué hace:**
1. Verifica el código de 6 dígitos que recibiste por SMS
2. Si es correcto, completa la firma
3. Publica eventos de dominio (si Kafka está habilitado)

**Body de ejemplo:**
```json
{
  "userResponse": "123456"
}
```

**Respuesta esperada (200 OK - Código Correcto):**
```json
{
  "id": "01JDQX...",
  "status": "COMPLETED",
  "completedAt": "2025-11-27T16:06:00Z",
  "currentChallenge": {
    "status": "VERIFIED",
    "verifiedAt": "2025-11-27T16:06:00Z"
  }
}
```

**Respuesta esperada (400 Bad Request - Código Incorrecto):**
```json
{
  "error": "INVALID_CHALLENGE_RESPONSE",
  "message": "El código ingresado es incorrecto",
  "timestamp": "2025-11-27T16:06:00Z"
}
```

---

### 2.5 Consultar Signature Request

**Request:** `2. Signature Requests > Get Signature Request by ID`

**Qué valida:**
- ✅ El estado actual de la solicitud
- ✅ Historial de challenges
- ✅ Metadata completa

---

## 3. Escenarios de Prueba Avanzados

### 3.1 Test de Idempotencia

**Request:** `5. Testing Scenarios > Test Idempotency - Same Key`

**Cómo probar:**
1. Ejecuta la request **2 veces seguidas**
2. La segunda ejecución debe devolver **exactamente el mismo resultado** (200 OK, no 201 Created)
3. NO se debe crear un segundo registro en la base de datos

**Validación:**
```bash
# Verificar que solo hay 1 registro
docker exec -it signature-router-postgres psql -U siguser -d sigdb -c \
  "SELECT COUNT(*) FROM signature_request WHERE idempotency_key = 'TEST-IDEMPOTENCY-001';"
```

**Resultado esperado:** `1`

---

### 3.2 Test de Fallback Chain (Push → SMS)

**Request:** `5. Testing Scenarios > Test Fallback Chain - Push to SMS`

**Qué valida:**
1. Push Provider está deshabilitado en local (`providers.push.enabled=false`)
2. Al intentar PUSH, debe fallar inmediatamente
3. El sistema debe hacer **fallback automático a SMS**
4. El challenge final debe enviarse por SMS

**Respuesta esperada:**
```json
{
  "id": "01JDQZ...",
  "status": "PENDING_VALIDATION",
  "currentChallenge": {
    "channelType": "SMS",  // ← IMPORTANTE: Cambió de PUSH a SMS
    "status": "SENT",
    "attemptNumber": 1
  }
}
```

**Validar en logs:**
```bash
# Buscar logs de fallback
docker logs signature-router-app 2>&1 | grep -i "fallback"
```

---

### 3.3 Test de Transacción de Alto Riesgo (Voice Fallback)

**Request:** `2. Signature Requests > Create Signature Request - HIGH RISK (Voice Fallback)`

**Qué hace:**
1. Transacción de alto monto (€25,000)
2. Risk level: `HIGH`
3. Si SMS falla, debe hacer fallback a VOICE (llamada con TTS)

**Body:**
```json
{
  "customerId": "CUST-{{$timestamp}}",
  "transactionContext": {
    "transactionId": "TXN-{{$randomInt}}",
    "amount": 25000.00,
    "currency": "EUR",
    "description": "Transferencia internacional de alto monto",
    "riskLevel": "HIGH"
  },
  "channelPreference": "SMS"
}
```

**Escenarios posibles:**
- ✅ SMS exitoso → Challenge enviado por SMS
- ⚠️ SMS falla → Fallback a VOICE → Challenge enviado por llamada telefónica

---

### 3.4 Test de Código Incorrecto (3 Intentos)

**Requests:**
1. `3. Challenge Verification > Verify Challenge - WRONG CODE` (ejecutar 3 veces)
2. Observar que al tercer intento fallido, la solicitud se marca como `FAILED`

**Body (código incorrecto):**
```json
{
  "userResponse": "000000"
}
```

**Respuesta esperada (tercer intento):**
```json
{
  "id": "01JDQX...",
  "status": "FAILED",
  "failedAt": "2025-11-27T16:10:00Z",
  "currentChallenge": {
    "status": "FAILED",
    "attemptNumber": 3,
    "maxAttempts": 3
  }
}
```

---

## 4. Validación de Circuit Breakers

### 4.1 Probar Circuit Breaker de SMS

**Request:** `5. Testing Scenarios > Test Circuit Breaker - SMS`

**Cómo probar:**
1. Ejecuta la request **10 veces rápidamente** (Ctrl+Enter múltiples veces)
2. Si Twilio SMS falla repetidamente, el circuit breaker se abrirá
3. Los siguientes requests deben hacer **fallback automático a VOICE**

**Configuración del Circuit Breaker (application.yml):**
```yaml
resilience4j:
  circuitbreaker:
    instances:
      smsProvider:
        failure-rate-threshold: 50
        slow-call-rate-threshold: 100
        slow-call-duration-threshold: 2s
        permitted-number-of-calls-in-half-open-state: 5
        sliding-window-size: 10
        minimum-number-of-calls: 5
        wait-duration-in-open-state: 10s
```

**Validación:**
```bash
# Ver estado del circuit breaker
curl http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.state

# Ver métricas detalladas
curl http://localhost:8080/actuator/prometheus | grep circuit
```

---

### 4.2 Verificar Métricas de Providers

**Request:** `1. Health & Monitoring > Prometheus Metrics`

**Buscar métricas clave:**
```bash
# Métricas de providers
signature_provider_send_challenge_total{provider="TwilioSmsProvider",result="success"} 15
signature_provider_send_challenge_total{provider="TwilioSmsProvider",result="failure"} 2

# Métricas de fallback
signature_fallback_triggered_total{from="PUSH",to="SMS"} 3
signature_fallback_success_total{from="PUSH",to="SMS"} 3

# Métricas de circuit breaker
resilience4j_circuitbreaker_state{name="smsProvider",state="closed"} 1
```

---

## 5. Troubleshooting

### 5.1 "Provider Health" devuelve 401 Unauthorized

**Problema:** El endpoint `/api/v1/admin/providers/health` requiere autenticación.

**Solución temporal (desarrollo):**
- Por ahora, la aplicación NO tiene Spring Security implementado
- El token en la colección es un placeholder
- Si ves 401, verifica que Spring Security no esté habilitado en `pom.xml`

---

### 5.2 SMS no se envía (Twilio)

**Problema:** TwilioSmsProvider devuelve error.

**Validar:**
1. **Credenciales de Vault:**
   ```bash
   # Ver secretos de Vault
   docker exec -it signature-router-vault vault kv get secret/signature-router
   ```

2. **Logs de Twilio:**
   ```bash
   docker logs signature-router-app 2>&1 | grep -i twilio
   ```

3. **Verificar configuración:**
   ```bash
   curl http://localhost:8080/actuator/configprops | grep twilio
   ```

**Solución:**
- Asegúrate de que las credenciales de Twilio en Vault son correctas
- Verifica que el número `from` esté verificado en Twilio (cuenta trial)

---

### 5.3 Fallback no se activa

**Problema:** Aunque PUSH está deshabilitado, no hace fallback a SMS.

**Validar:**
1. **Configuración de fallback (`application.yml`):**
   ```yaml
   fallback:
     enabled: true
     chains:
       PUSH: SMS
       SMS: VOICE
   ```

2. **Logs de fallback:**
   ```bash
   docker logs signature-router-app 2>&1 | grep -i "attempting fallback"
   ```

**Solución:**
- Verifica que `fallback.enabled=true` en `application-local.yml`
- Reinicia la aplicación si cambiaste la configuración

---

### 5.4 "Challenge ID not found" al verificar

**Problema:** El `challenge_id` no se guardó automáticamente.

**Solución:**
1. En Postman, ve a la pestaña **Tests** de la request `Create Signature Request - SMS`
2. Verifica que el script guarda las variables:
   ```javascript
   if (pm.response.code === 201) {
       const response = pm.response.json();
       pm.collectionVariables.set('signature_request_id', response.id);
       pm.collectionVariables.set('challenge_id', response.currentChallenge.id);
   }
   ```
3. Ejecuta de nuevo la request de creación y verifica en **Variables** (pestaña de la colección) que `challenge_id` tiene un valor.

---

## 6. Recursos Adicionales

### 6.1 Swagger UI

**URL:** http://localhost:8080/swagger-ui.html

- Documentación interactiva de todos los endpoints
- Puedes probar los endpoints directamente desde el navegador

---

### 6.2 Grafana Dashboards

**URL:** http://localhost:3000 (admin/admin)

1. Ve a **Dashboards > Import**
2. Importa los dashboards de `docs/monitoring/dashboards/`
3. Verifica métricas en tiempo real de:
   - Providers (SMS, Push, Voice, Biometric)
   - Circuit Breakers
   - Latencias
   - Errores

---

### 6.3 Logs en Tiempo Real

```bash
# Ver logs de la aplicación
docker logs -f signature-router-app

# Filtrar por nivel ERROR
docker logs signature-router-app 2>&1 | grep ERROR

# Filtrar por provider específico
docker logs signature-router-app 2>&1 | grep -i "TwilioSmsProvider"
```

---

## 7. Checklist de Validación Completa

- [ ] **Health Check:** Aplicación UP
- [ ] **Provider Health:** Al menos 2 providers UP (SMS/Biometric o Voice/Biometric)
- [ ] **Crear Signature Request (SMS):** 201 Created, SMS recibido
- [ ] **Verificar Challenge (Correcto):** 200 OK, status COMPLETED
- [ ] **Verificar Challenge (Incorrecto):** 400 Bad Request, 3 intentos → FAILED
- [ ] **Idempotencia:** 2 requests con misma key → mismo resultado
- [ ] **Fallback PUSH→SMS:** PUSH falla → SMS enviado
- [ ] **Circuit Breaker:** 10 requests rápidas → circuit abierto → fallback
- [ ] **Reenviar Challenge:** Código reenviado exitosamente
- [ ] **Consultar por ID:** Datos completos y correctos
- [ ] **Métricas Prometheus:** Métricas de providers visibles

---

## 8. Próximos Pasos

Una vez validado el flujo básico:

1. **Implementar Security:** JWT tokens, roles ADMIN/USER
2. **Habilitar Push Provider:** Configurar FCM en Vault
3. **Integrar Kafka:** Validar eventos de dominio publicados
4. **Pruebas de Carga:** JMeter/Gatling para validar circuit breakers bajo carga
5. **Monitoring:** Configurar alertas en Grafana

---

## 📞 Soporte

Si encuentras algún problema:

1. Revisa los logs: `docker logs signature-router-app`
2. Verifica Health: `curl http://localhost:8080/actuator/health`
3. Consulta `LECCIONES-APRENDIDAS-SPRING-BOOT.md`
4. Revisa `TESTING.md` para pruebas más avanzadas

---

**¡Buena suerte con las pruebas! 🚀🎉**

