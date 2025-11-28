# 📱 Configuración de Twilio SMS Provider

Este documento explica cómo configurar el proveedor de SMS para el Signature Router.

---

## 🎭 Opción 1: Stub SMS Provider (Desarrollo Local - SIN TWILIO REAL)

**¿Cuándo usar?**
- Desarrollo local sin cuenta de Twilio
- Tests de integración
- Demos
- No quieres configurar credenciales

### Configuración

En `application-local.yml`:

```yaml
providers:
  sms:
    stub: true  # ✅ Activar Stub (NO se enviarán SMS reales)
```

### Comportamiento

- ✅ **No requiere credenciales de Twilio**
- ✅ **No envía SMS reales** (solo logs)
- ✅ Simula envío exitoso con Mock SID
- ✅ Circuito de negocio completo (Challenge creado, estado SENT)
- ✅ Logs detallados del "envío"

### Ejemplo de Log

```
🎭 [STUB] Simulating SMS send:
   📱 To: +34****5678
   🔢 Challenge Code: 123456
   📝 Message: 'Your signature verification code is: 123456'
   ✅ Mock SID: SM1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

### Ventajas

- ✅ No requiere configuración externa
- ✅ Rápido para desarrollo
- ✅ No hay costos
- ✅ No depende de conectividad externa

### Desventajas

- ❌ No valida credenciales reales
- ❌ No prueba el comportamiento real de Twilio API

---

## 📞 Opción 2: Twilio SMS Provider Real (Producción / Pruebas Reales)

**¿Cuándo usar?**
- UAT / Staging / Producción
- Quieres enviar SMS reales
- Tests end-to-end con SMS reales

### Paso 1: Obtener Credenciales de Twilio

#### Opción A: Cuenta Gratuita de Prueba (Trial)

1. **Ir a:** https://www.twilio.com/try-twilio
2. **Registrarse** (gratis - no requiere tarjeta de crédito)
3. **Obtener en la consola:**
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (34 caracteres)
   - **Auth Token**: `your_auth_token_here` (32 caracteres)
   - **Phone Number**: `+15017122661` (número de prueba)

**Limitaciones de la cuenta Trial:**
- ✅ SMS reales enviados
- ⚠️ Prefix: "Sent from your Twilio trial account - "
- ⚠️ Solo a números verificados en la consola
- ⚠️ Límite de crédito ($15 USD aprox.)

#### Opción B: Cuenta de Pago (Producción)

1. **Actualizar a cuenta de pago** en Twilio Console
2. **Comprar un número de teléfono** (Twilio Phone Numbers)
3. **Configurar billing**

**Ventajas:**
- ✅ Sin prefijos de prueba
- ✅ Enviar a cualquier número
- ✅ Mayor throughput
- ✅ Soporte empresarial

---

### Paso 2: Guardar Credenciales en Vault

```bash
# 1. Conectar a Vault (Docker)
docker exec -it signature-router-vault sh

# 2. Configurar Vault CLI
export VAULT_TOKEN=dev-token-123
export VAULT_ADDR=http://127.0.0.1:8200

# 3. Guardar credenciales de Twilio
vault kv put secret/signature-router/twilio \
  account-sid='ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
  auth-token='tu_auth_token_aqui' \
  from-number='+15017122661'

# 4. Verificar (opcional)
vault kv get secret/signature-router/twilio

# 5. Salir
exit
```

---

### Paso 3: Habilitar TwilioSmsProvider

En `application-local.yml`:

```yaml
providers:
  sms:
    stub: false  # ✅ Desactivar Stub, activar Twilio REAL
```

O simplemente **eliminar** la línea `stub: true` (el valor por defecto es `false`).

---

### Paso 4: Reiniciar Aplicación

```bash
# PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

---

### Paso 5: Validar Logs

Busca este log al iniciar:

```
✅ TwilioSmsProvider initialized successfully
   Account SID: AC**************************xxx (masked)
   From Number: +1501****661
```

---

## 🔄 Cambiar entre Stub y Real

### Activar Stub (desarrollo sin Twilio)

```yaml
providers:
  sms:
    stub: true
```

**Bean activo:** `StubSmsProvider`

---

### Activar Twilio Real (producción)

```yaml
providers:
  sms:
    stub: false  # o eliminar esta línea
```

**Bean activo:** `TwilioSmsProvider`

---

## 🧪 Probar con Postman

### 1. Obtener Token de Admin

```http
POST http://localhost:8180/realms/signature-router/protocol/openid-connect/token

Body (x-www-form-urlencoded):
- client_id: signature-router-api
- client_secret: signature-router-secret-key-12345
- grant_type: password
- username: admin
- password: admin123
```

### 2. Crear Signature Request

```http
POST http://localhost:8080/api/v1/signatures
Authorization: Bearer {{admin_token}}
Idempotency-Key: {{$guid}}

Body (JSON):
{
  "customerId": "CUST-12345",
  "phoneNumber": "+34612345678",
  "transactionContext": {
    "amount": {
      "value": 1500.00,
      "currency": "EUR"
    },
    "merchantId": "MERCHANT-001",
    "orderId": "ORDER-001",
    "description": "Transferencia de prueba"
  }
}
```

---

## 📊 Comparación

| Característica | Stub SMS Provider | Twilio Real |
|---|---|---|
| **Requiere Twilio** | ❌ No | ✅ Sí |
| **Costo** | 💰 Gratis | 💳 Trial gratis / Pago |
| **Envía SMS reales** | ❌ No (logs) | ✅ Sí |
| **Configuración Vault** | ❌ No requerida | ✅ Requerida |
| **Ideal para** | Dev local, CI/CD | UAT, Staging, Prod |
| **Circuito de negocio** | ✅ Completo | ✅ Completo |
| **Métricas Prometheus** | ✅ Sí | ✅ Sí |
| **Circuit Breaker** | ✅ Sí | ✅ Sí |

---

## 🔒 Buenas Prácticas

### Desarrollo Local
- ✅ Usar **Stub** (`stub: true`)
- ✅ No commitear credenciales reales
- ✅ `.gitignore` para archivos de configuración sensibles

### UAT / Staging
- ✅ Usar **Twilio Trial** (`stub: false`)
- ✅ Credenciales en Vault
- ✅ Verificar números de destino en Twilio Console

### Producción
- ✅ Usar **Twilio de Pago** (`stub: false`)
- ✅ Credenciales en Vault Enterprise
- ✅ Configurar alertas de Twilio
- ✅ Monitoring de métricas (`provider.twilio.errors`)

---

## 🛠️ Troubleshooting

### Error: "Authentication Error - invalid username (code: 20003)"

**Causa:** Credenciales incorrectas en Vault.

**Solución:**
1. Verificar credenciales en Twilio Console
2. Actualizar en Vault:
   ```bash
   vault kv put secret/signature-router/twilio \
     account-sid='ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
     auth-token='nuevo_auth_token'
   ```
3. Reiniciar aplicación

---

### Error: "Unable to create record: The 'To' number +34612345678 is not a valid phone number."

**Causa:** Número de destino no válido o no verificado (Trial account).

**Solución (Trial):**
1. Ir a Twilio Console → Phone Numbers → Verified Caller IDs
2. Agregar el número `+34612345678`
3. Verificar vía SMS/llamada

**Solución (Producción):**
- Validar formato E.164: `+[country code][number]`

---

### No veo logs de SMS

**Causa:** Stub deshabilitado pero Twilio no configurado.

**Solución:**
- Revisar logs de inicio: `TwilioSmsProvider initialized`
- Si no aparece: verificar `stub: false` en `application-local.yml`
- Si aparece error: verificar credenciales en Vault

---

## 📚 Referencias

- **Twilio API Docs:** https://www.twilio.com/docs/sms/api
- **Twilio Console:** https://console.twilio.com/
- **Vault KV Docs:** https://developer.hashicorp.com/vault/docs/secrets/kv
- **Spring Conditional Beans:** https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.developing-auto-configuration.condition-annotations

---

## ✅ Checklist de Configuración

### Para Desarrollo Local (Stub)
- [ ] `stub: true` en `application-local.yml`
- [ ] Reiniciar aplicación
- [ ] Validar logs: `🎭 STUB SMS Provider initialized`

### Para Producción (Twilio Real)
- [ ] Cuenta de Twilio creada
- [ ] Account SID obtenido
- [ ] Auth Token obtenido
- [ ] Número de teléfono obtenido/comprado
- [ ] Credenciales guardadas en Vault
- [ ] `stub: false` (o eliminado) en configuración
- [ ] Aplicación reiniciada
- [ ] Logs validados: `✅ TwilioSmsProvider initialized successfully`
- [ ] Test SMS enviado y recibido

---

**Última actualización:** 27 de noviembre de 2025  
**Versión:** 1.0  
**Autor:** BMAD Dev Agent

