# ✅ Solución: Twilio "invalid username" - STUB SMS Provider

## 🎯 Problema Original

```
[SMS] Twilio API error: Authentication Error - invalid username (code: 20003)
```

**Causa:** Las credenciales de Twilio en `application-local.yml` eran placeholders (no válidas).

---

## 🎭 Solución Implementada: STUB SMS Provider

Hemos creado un **Stub SMS Provider** que **simula** el envío de SMS sin llamar a Twilio API.

### Ventajas

✅ **No requiere cuenta de Twilio**  
✅ **No envía SMS reales** (ideal para desarrollo)  
✅ **Logs detallados** del envío simulado  
✅ **Circuit Breaker, Retry, Metrics** (igual que el real)  
✅ **Circuito de negocio completo** (Challenge creado, status SENT, etc.)

---

## 📋 ¿Qué se ha hecho?

### 1. Nuevo componente: `StubSmsProvider`

```java
@Component("twilioSmsProvider")
@ConditionalOnProperty(prefix = "providers.sms", name = "stub", havingValue = "true")
public class StubSmsProvider implements SignatureProviderPort {
    // Simula envío de SMS sin llamar a Twilio
}
```

**Ubicación:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/stub/StubSmsProvider.java`

### 2. Actualización de `TwilioSmsProvider`

Ahora solo se activa cuando `stub=false`:

```java
@Component("twilioSmsProvider")
@ConditionalOnProperty(prefix = "providers.sms", name = "stub", havingValue = "false", matchIfMissing = true)
public class TwilioSmsProvider implements SignatureProviderPort {
    // Twilio REAL
}
```

### 3. Configuración en `application-local.yml`

```yaml
providers:
  sms:
    stub: true  # true = Stub (SIN Twilio), false = Twilio REAL
```

---

## 🧪 Prueba Exitosa

```bash
PS> .\test-stub-sms.ps1

Signature Request creada exitosamente!

Detalles:
   Request ID: 019ac6f8-3c7d-7989-82c7-221cb7048e93
   Status: PENDING
   Created At: 2025-11-27T20:19:08.538227900Z
   Expires At: 2025-11-27T20:22:08.538227900Z
```

### Logs generados por el Stub

```
2025-11-27 21:19:08.563 [http-nio-8080-exec-7] INFO  StubSmsProvider - [STUB] Simulating SMS send:
2025-11-27 21:19:08.563 [http-nio-8080-exec-7] INFO  StubSmsProvider -    To: +34****5678
2025-11-27 21:19:08.563 [http-nio-8080-exec-7] INFO  StubSmsProvider -    Challenge Code: 495809
2025-11-27 21:19:08.563 [http-nio-8080-exec-7] INFO  StubSmsProvider -    Message: 'Your signature verification code is: 495809'
2025-11-27 21:19:08.563 [http-nio-8080-exec-7] INFO  StubSmsProvider -    Mock SID: SM44c35283d6494ee1908b59d8ce9486b3
```

**✅ El sistema funciona completamente sin credenciales reales de Twilio.**

---

## 🔄 Cambiar entre Stub y Twilio Real

### Opción 1: Desarrollo Local (SIN Twilio)

```yaml
providers:
  sms:
    stub: true
```

**Bean activo:** `StubSmsProvider`  
**Requiere:** Nada (funciona out-of-the-box)

---

### Opción 2: UAT/Producción (Twilio REAL)

```yaml
providers:
  sms:
    stub: false  # o eliminar esta línea
```

**Bean activo:** `TwilioSmsProvider`  
**Requiere:**
1. Cuenta de Twilio (gratis en https://www.twilio.com/try-twilio)
2. Credenciales en Vault:
   ```bash
   vault kv put secret/signature-router/twilio \
     account-sid='ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
     auth-token='tu_auth_token_aqui' \
     from-number='+15017122661'
   ```

---

## 📚 Documentación Completa

Ver `CONFIGURAR-TWILIO.md` para detalles sobre:
- Cómo obtener credenciales de Twilio (gratis)
- Diferencias entre Trial y cuenta de pago
- Configuración de Vault
- Troubleshooting

---

## 🎉 Resultado Final

| Aspecto | Estado |
|---------|--------|
| **Error original** | ✅ Resuelto |
| **Desarrollo local** | ✅ Funcional (Stub) |
| **SMS enviados** | 🎭 Simulados (logs) |
| **Twilio requerido** | ❌ No (para desarrollo) |
| **Circuito de negocio** | ✅ Completo |
| **Métricas/Circuit Breaker** | ✅ Activos |
| **Tests end-to-end** | ✅ Posibles (con Stub) |

---

## 🛠️ Archivos Creados/Modificados

### Nuevos
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/stub/StubSmsProvider.java`
- `CONFIGURAR-TWILIO.md`
- `test-stub-sms.ps1`
- `SOLUCION-TWILIO-STUB.md` (este archivo)

### Modificados
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/twilio/TwilioSmsProvider.java` (added `@ConditionalOnProperty`)
- `src/main/resources/application-local.yml` (added `providers.sms.stub: true`)

---

## ✅ Checklist Final

- [x] Stub SMS Provider implementado
- [x] Conditional beans configurados correctamente
- [x] Configuración en `application-local.yml`
- [x] Compilación exitosa
- [x] Aplicación iniciada
- [x] Stub activado y funcionando
- [x] Test ejecutado exitosamente
- [x] Logs validados
- [x] Documentación creada
- [x] Script de prueba creado

---

## 🚀 Próximos Pasos (Opcional)

### Para UAT/Staging
1. Obtener cuenta Trial de Twilio (gratis)
2. Configurar credenciales en Vault
3. Cambiar `stub: false` en UAT profile
4. Probar con SMS reales

### Para Producción
1. Cuenta de Twilio de pago
2. Comprar número de teléfono Twilio
3. Vault Enterprise para credenciales
4. Configurar alertas de Twilio
5. Monitoring de métricas

---

**Estado:** ✅ **COMPLETADO**  
**Fecha:** 27 de noviembre de 2025  
**Versión:** 1.0  
**Autor:** BMAD Dev Agent

