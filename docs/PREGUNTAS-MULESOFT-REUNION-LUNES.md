# 📋 Preguntas para Reunión MuleSoft - Lunes

**Proyecto:** Signature Router - Integración con MuleSoft API Gateway  
**Fecha Reunión:** Lunes [FECHA]  
**Participantes:** DevOps Team / MuleSoft Team  
**Objetivo:** Obtener especificaciones técnicas completas para Epic 11

---

## 🎯 Contexto Rápido

El **Signature Router** debe integrarse **obligatoriamente** con **MuleSoft API Gateway** como **única** capa de comunicación con providers externos (normativa corporativa).

**Canales potenciales:**
- 📱 **SMS** (actualmente Twilio)
- 📞 **Voice/Call** (actualmente Twilio Voice)
- 🔔 **Push Notifications** (actualmente Firebase FCM)
- 🔐 **Biometric** (futuro)

> ⚠️ **IMPORTANTE:** Si MuleSoft NO tiene un canal implementado (ej: Biometric), ese canal **NO estará disponible** en Signature Router. **NO se permite** comunicación directa con providers (normativa).

---

---

## ⚠️ PREGUNTA MÁS CRÍTICA (PREGUNTAR PRIMERO)

### 🚧 Cobertura de Canales Disponibles

**¿Qué canales de notificación tienen YA implementados en MuleSoft?**

Esta es la pregunta **MÁS IMPORTANTE** porque determina qué funcionalidades tendrá Signature Router.

- [ ] **SMS:** ¿Tienen endpoint implementado? → `POST /api/v1/???`
  - Si **SÍ** → Migrar de Twilio directo a MuleSoft
  - Si **NO** → SMS **NO estará disponible** en Signature Router ❌

- [ ] **PUSH Notifications:** ¿Tienen endpoint implementado? → `POST /api/v1/???`
  - Si **SÍ** → Migrar de Firebase directo a MuleSoft
  - Si **NO** → PUSH **NO estará disponible** en Signature Router ❌

- [ ] **VOICE/Call:** ¿Tienen endpoint implementado? → `POST /api/v1/???`
  - Si **SÍ** → Migrar de Twilio Voice directo a MuleSoft
  - Si **NO** → VOICE **NO estará disponible** en Signature Router ❌

- [ ] **BIOMETRIC:** ¿Tienen endpoint implementado? → `POST /api/v1/???`
  - Si **SÍ** → Implementar desde cero vía MuleSoft
  - Si **NO** → BIOMETRIC **NO estará disponible** en Signature Router ❌

**Canales NO disponibles:**
- [ ] ¿Están en el **roadmap**? ¿Cuándo estarán listos?
- [ ] Si **NO están planificados**, ¿podemos solicitar su implementación?
- [ ] ¿Cuál es el **effort** estimado para implementar un canal nuevo?

**Estrategia de implementación:**
- [ ] ¿Puedo implementar **canal por canal** incrementalmente? (SMS primero, luego PUSH, etc.)
- [ ] ¿O debo esperar a que **todos** estén listos?
- [ ] ¿Qué **timeline** recomiendan para go-live?

---

## 📋 PREGUNTAS TÉCNICAS DETALLADAS

### 1. 📄 Documentación API

**¿Dónde está la documentación técnica completa?**
- [ ] ¿Tienen **OpenAPI 3.0 Specification** (Swagger)? → Necesito el archivo `.yaml` o `.json`
- [ ] ¿Dónde puedo acceder a la **documentación de endpoints**?
- [ ] ¿Tienen **Postman Collection** con ejemplos de requests?
- [ ] ¿Hay algún **portal de desarrolladores** con guías?

---

### 2. 🔌 Endpoints Disponibles (SOLO para canales confirmados)

**Para cada canal que SÍ tienen implementado, necesito:**

#### SMS (si está disponible):
- [ ] **Endpoint:** `POST /api/v1/???` (¿cuál es la ruta exacta?)
- [ ] **Request schema:** ¿Qué campos envío? (phoneNumber, message, from, etc.)
- [ ] **Response schema:** ¿Qué campos recibo? (messageId, status, timestamp)
- [ ] **Provider subyacente:** ¿Usan Twilio, Nexmo, otro?

#### Voice/Call (si está disponible):
- [ ] **Endpoint:** `POST /api/v1/???`
- [ ] **Request schema:** ¿Campos necesarios?
- [ ] **Response schema:** ¿Qué devuelve?
- [ ] **Provider subyacente:** ¿Usan Twilio Voice, otro?

#### Push Notifications (si está disponible):
- [ ] **Endpoint:** `POST /api/v1/???`
- [ ] **Request schema:** ¿Cómo envío deviceToken, message, etc.?
- [ ] **Response schema:** ¿Qué devuelve?
- [ ] **Provider subyacente:** ¿Usan Firebase FCM, otro?

#### Biometric (si está disponible):
- [ ] **Endpoint:** `POST /api/v1/???`
- [ ] **Request schema:** ¿Qué campos necesarios?
- [ ] **Response schema:** ¿Qué devuelve?
- [ ] **Provider subyacente:** ¿Cuál usan?

---

### 3. 🔐 Autenticación & Seguridad

**¿Cómo me autentico con MuleSoft API?**

- [ ] **Método:** ¿OAuth2, API Key, mTLS, JWT Bearer?
- [ ] **Credenciales DEV:** ¿Cómo las obtengo?
- [ ] **Credenciales UAT:** ¿Cómo las obtengo?
- [ ] **Credenciales PROD:** ¿Cómo las obtengo?

Si es **OAuth2:**
- [ ] ¿Cuál es el **token endpoint**?
- [ ] ¿Qué **grant type** usan? (client_credentials, authorization_code)
- [ ] ¿Los tokens **expiran**? ¿Cada cuánto?
- [ ] ¿Cómo **renuevo** el token?
- [ ] ¿Qué **scopes** necesito solicitar?

Si es **API Key:**
- [ ] ¿Dónde va la key? (header, query param)
- [ ] ¿Qué nombre tiene el header? (ej: `X-API-Key`, `Authorization`)

Otros:
- [ ] ¿Necesito **IP whitelisting**? ¿Qué IPs debo registrar?
- [ ] ¿Hay **certificados TLS/mTLS** requeridos?

---

### 4. 🌐 Ambientes & URLs

**¿Qué URLs uso para cada ambiente?**

- [ ] **DEV/Sandbox:** `https://???`
- [ ] **UAT/Staging:** `https://???`
- [ ] **PROD:** `https://???`

Conectividad:
- [ ] ¿Necesito **VPN** para acceder?
- [ ] ¿Necesito **firewall rules** configuradas?
- [ ] ¿Los **endpoints son iguales** en todos los ambientes? (solo cambia base URL)

---

### 5. ⚡ SLAs, Timeouts & Rate Limits

**¿Cuáles son los límites y garantías de servicio?**

#### Timeouts:
- [ ] ¿Cuál es el **timeout máximo recomendado** por request?
- [ ] ¿Cuál es el **tiempo de respuesta promedio**? (P50, P95, P99)

#### Rate Limits:
- [ ] ¿Cuántos **requests por segundo** puedo enviar?
- [ ] ¿Es por **IP**, por **API key**, o por **aplicación**?
- [ ] ¿Qué pasa si excedo el límite? → HTTP 429 + `Retry-After` header?

#### SLAs:
- [ ] **Disponibilidad garantizada:** 99.9%? 99.5%?
- [ ] **Latency garantizada:** P99 < 500ms? P95 < 300ms?

#### Retry Policy:
- [ ] ¿**Cuántos reintentos** permiten antes de bloquear?
- [ ] ¿Qué **backoff strategy** recomiendan? (exponencial, lineal)

---

### 6. 🔴 Manejo de Errores

**¿Qué códigos de error devuelven y qué significan?**

- [ ] **400 Bad Request:** ¿Qué errores específicos? (validación, campos faltantes)
- [ ] **401 Unauthorized:** ¿Token inválido o expirado?
- [ ] **403 Forbidden:** ¿Falta de permisos?
- [ ] **429 Too Many Requests:** ¿Rate limit excedido? → `Retry-After` header?
- [ ] **500 Internal Server Error:** ¿Error de MuleSoft?
- [ ] **503 Service Unavailable:** ¿Provider caído?

Formato de errores:
- [ ] ¿Tienen **formato estandarizado** de error response?
  ```json
  {
    "code": "INVALID_PHONE",
    "message": "Phone number format invalid",
    "details": { ... },
    "timestamp": "2025-11-30T10:00:00Z"
  }
  ```

---

### 7. 🧪 Testing & Sandbox

**¿Cómo puedo probar sin consumir providers reales?**

- [ ] ¿Tienen **sandbox environment** con **mock providers**?
- [ ] ¿Puedo hacer requests de prueba **sin costo** en DEV?
- [ ] ¿Tienen **datos de prueba** (teléfonos, deviceTokens) que pueda usar?
- [ ] ¿Requieren que hagamos **contract tests**? (Pact, Spring Cloud Contract)
- [ ] ¿Tienen **mock server** o **WireMock stubs** disponibles?

---

### 8. 📊 Monitoreo & Observabilidad

**¿Cómo monitoreo el estado y uso de la API?**

- [ ] ¿Tienen **dashboards de MuleSoft** que pueda ver?
- [ ] ¿Proveen **métricas** de mi consumo? (requests, latency, errores)
- [ ] ¿Dónde puedo ver **logs** de mis requests?
- [ ] ¿Tienen **alertas** configuradas? ¿Cómo me notifican?
- [ ] ¿Cómo reporto **incidentes**? (Slack, Jira, email)
- [ ] ¿Hay **status page** para ver disponibilidad de MuleSoft?

---

### 9. 🎛️ Configuración de Providers (en MuleSoft)

**¿Cómo funciona la selección de provider en el lado de MuleSoft?**

Preguntas:
- [ ] ¿MuleSoft elige el provider automáticamente? (transparente para nosotros)
- [ ] ¿O debemos **especificar qué provider usar** en el request? (header, query param, body field)
- [ ] ¿MuleSoft maneja **fallback automático** si un provider falla?
- [ ] ¿MuleSoft tiene **múltiples providers** por canal? (ej: Twilio + Nexmo para SMS)
- [ ] ¿Podemos **configurar preferencias** de provider en MuleSoft?

> 🔒 **Nota:** Signature Router **NO** se comunicará directamente con providers (Twilio, Firebase). Solo con MuleSoft.

---

### 10. 🔄 Resiliencia (Circuit Breaker, Retry)

**¿Quién maneja los patrones de resiliencia?**

Signature Router tiene capacidad para:
- ✅ Circuit Breaker (Resilience4j)
- ✅ Retry con exponential backoff
- ✅ Timeout configuration

**Preguntas sobre división de responsabilidades:**
- [ ] ¿MuleSoft tiene **circuit breaker** implementado hacia los providers?
- [ ] ¿MuleSoft hace **retry automático** si un provider externo falla?
- [ ] ¿Esperan que nosotros implementemos **circuit breaker/retry** hacia MuleSoft?
- [ ] ¿O MuleSoft garantiza disponibilidad y nosotros solo manejamos timeouts?

**Coordinación:**
- [ ] ¿Cómo se **coordina** la resiliencia entre ambos sistemas para evitar "retry storms"?
- [ ] ¿Cómo notifican **degradación de servicio**? (header `X-Service-Status`, status code)
- [ ] Si un provider externo está caído, ¿MuleSoft devuelve **503** inmediatamente o intenta retry?

---

### 11. 🚀 Migración & Rollout

**¿Cuál es el plan recomendado para la migración?**

- [ ] ¿Cuándo podemos **empezar a integrar**? (timeline de acceso)
- [ ] ¿Cuál es el **proceso de onboarding**?
- [ ] ¿Recomiendan **canary deployment**? (10% → 25% → 50% → 100%)
- [ ] ¿Hay alguna **ventana de mantenimiento** que deba considerar?

**Estrategia de migración por canal:**
- [ ] ¿Puedo migrar **un canal a la vez**? (ej: SMS primero, luego PUSH)
- [ ] ¿O debo migrar **todos los canales simultáneamente**?
- [ ] ¿Qué **orden** recomiendan? (SMS → PUSH → VOICE → BIOMETRIC)

**Rollback:**
- [ ] Si hay problemas con MuleSoft, ¿puedo hacer **rollback temporal** a providers directos?
- [ ] ¿O la normativa **prohíbe estrictamente** comunicación directa (sin excepciones)?
- [ ] ¿Qué hacer en caso de **incidente crítico** de MuleSoft en producción?

---

### 12. 🆘 Soporte & Contactos

**¿A quién contacto si hay problemas?**

- [ ] ¿Quién es el **contacto técnico principal**?
- [ ] ¿Tienen **Slack channel** de soporte?
- [ ] ¿Cuál es el **SLA de respuesta** a issues?
- [ ] ¿Hay **oncall/guardia** 24/7 para producción?
- [ ] ¿Cómo escalo **incidentes críticos**?

---

### 13. 📦 Request/Response Examples

**¿Pueden darme ejemplos reales de request/response?**

Necesito ver:
- [ ] **Request completo** con headers, auth, body para SMS
- [ ] **Response exitoso** (200 OK)
- [ ] **Response con error** (400, 429, 500, 503)

Ejemplo ideal:
```bash
# Request
curl -X POST https://mulesoft.company.com/api/v1/sms \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": {
      "phoneNumber": "+34612345678"
    },
    "message": {
      "body": "Your code is: 123456"
    }
  }'

# Response 200 OK
{
  "messageId": "SM1234567890",
  "status": "SENT",
  "timestamp": "2025-11-30T10:00:00Z"
}
```

---

### 14. 💰 Costos & Billing

**¿Hay algún costo asociado al uso de MuleSoft API?**

- [ ] ¿Hay **límite de requests gratis**?
- [ ] ¿Cómo se **facturan** los requests?
- [ ] ¿Hay **alertas** cuando me acerco a límites de presupuesto?
- [ ] ¿Puedo ver **consumo en tiempo real**?

---

### 15. 🔍 Casos Especiales & Edge Cases

**Situaciones específicas que debo considerar:**

**Fallos de providers externos:**
- [ ] ¿Qué pasa si **provider externo está caído**? (Twilio down, Firebase down)
- [ ] ¿MuleSoft devuelve **503** inmediatamente o intenta con provider secundario?
- [ ] ¿Tienen **redundancia** de providers? (ej: Twilio primario + Nexmo secundario)
- [ ] ¿Cómo me notifican que un provider específico está degradado?

**Validaciones:**
- [ ] ¿Cómo manejan **mensajes largos** (SMS > 160 chars)? ¿Segmentación automática?
- [ ] ¿Soportan **números internacionales**? ¿Todos los países?
- [ ] ¿Hay **validación de formato** de phoneNumber en su lado?
- [ ] ¿Qué validaciones hacen **antes** de llamar al provider? (formato, blacklist, etc.)

**Idempotencia:**
- [ ] ¿Cómo manejan **duplicados**? (enviar mismo SMS 2 veces)
- [ ] ¿Aceptan **idempotency key** en headers? (ej: `X-Idempotency-Key`)
- [ ] ¿Durante cuánto tiempo **cachean** requests duplicados? (5 min, 1 hora)

**Canales no disponibles:**
- [ ] Si un canal **NO está implementado** en MuleSoft, ¿qué código de error devuelven?
- [ ] ¿Devuelven **501 Not Implemented** o **404 Not Found**?
- [ ] ¿El error response indica qué **canales SÍ están disponibles**?

---

## 📥 Entregables que Necesito

Al final de la reunión, por favor solicita:

1. ✅ **Lista de canales disponibles** (SMS, PUSH, VOICE, BIOMETRIC) con status (disponible/roadmap/no planificado)
2. ✅ **OpenAPI 3.0 Spec** (archivo `.yaml` o `.json`) de los canales disponibles
3. ✅ **Postman Collection** con ejemplos de request/response
4. ✅ **Credenciales de DEV/Sandbox** para empezar pruebas
5. ✅ **URLs de ambientes** (DEV, UAT, PROD)
6. ✅ **Contacto técnico principal** (email, Slack, Teams)
7. ✅ **Documentación completa** (link al portal de developers)
8. ✅ **Timeline de migración** (cuándo podemos empezar, cuándo go-live)
9. ✅ **Roadmap de canales futuros** (si aplica)

---

## ✅ Checklist Post-Reunión

Después de la reunión, validar que tengo:

- [ ] **Lista clara de canales disponibles** (cuáles SÍ, cuáles NO)
- [ ] **OpenAPI spec descargada** para cada canal disponible
- [ ] **Credenciales almacenadas en Vault** (DEV, UAT, PROD)
- [ ] **URLs de ambientes documentadas**
- [ ] **SLAs y rate limits claros** (timeouts, requests/seg, latency)
- [ ] **Contacto técnico agregado a Slack/Email**
- [ ] **Timeline de migración acordado** (fecha inicio, fecha go-live)
- [ ] **Acceso a sandbox funcionando**
- [ ] **Primer request de prueba exitoso** (al menos 1 canal)
- [ ] **Entendimiento claro de canales NO disponibles** y cómo impactan al proyecto

---

## 🚀 Próximos Pasos Post-Reunión

**Una vez tengas toda esta información:**

### 1. Documentar Canales Disponibles
Crear: `docs/architecture/mulesoft-canales-disponibles.md`
```markdown
# Canales Disponibles en MuleSoft

## ✅ Canales Implementados
- SMS: Disponible (endpoint: /api/v1/sms)
- PUSH: Disponible (endpoint: /api/v1/push)

## ❌ Canales NO Disponibles
- VOICE: No planificado
- BIOMETRIC: Roadmap Q2 2026

## 📊 Impacto en Signature Router
- Funcionalidades disponibles: SMS, PUSH
- Funcionalidades NO disponibles: VOICE, BIOMETRIC
```

### 2. Guardar Especificaciones
- Guardar OpenAPI spec en: `docs/architecture/mulesoft-api-spec.yaml`
- Documentar hallazgos en: `docs/architecture/mulesoft-api-reference.md`
- Actualizar: `docs/architecture/08-mulesoft-integration-strategy.md`

### 3. Actualizar PRD y Epics
- **Si canales NO disponibles:** Remover/postponer epics afectadas
- **Si todos disponibles:** Proceder con Epic 11 completa
- Actualizar `docs/epics.md` según canales reales

### 4. Generar Epic 11
- **Avisar al equipo** para generar **Epic 11** con specs reales
- Incluir **SOLO** los canales que MuleSoft tiene disponibles
- Agregar stories para canales futuros en backlog (si aplica)

---

**Preparado para:** Reunión MuleSoft - Lunes  
**Objetivo:** Obtener 100% de información técnica para implementar Epic 11  
**Resultado esperado:** Poder empezar desarrollo en 1-2 días post-reunión

---

## 💡 Tips para la Reunión

1. **Graba la reunión** (si es virtual) para no perder detalles
2. **Empieza preguntando por canales disponibles** - es la pregunta MÁS importante
3. **Toma notas** de URLs, nombres técnicos, procesos
4. **Pide que compartan pantalla** cuando muestren documentación
5. **Solicita acceso inmediato** a todos los recursos (no esperar días)
6. **Confirma timeline realista** de cuándo puedes empezar a integrar
7. **Pregunta por casos límite** (qué hacer cuando hay problemas, provider caído, etc.)
8. **Clarifica normativa** de comunicación directa (¿permitido en emergencias?)
9. **Verifica que tengas todo** antes de terminar la reunión

---

## ⚠️ ESCENARIOS ESPERADOS

### Escenario A: Solo SMS disponible (30% probabilidad)
**Impacto:** Signature Router solo soportará SMS  
**Acción:** Epic 11 minimalista (solo SMS), postponer PUSH/VOICE/BIOMETRIC

### Escenario B: SMS + PUSH disponibles (50% probabilidad) ✅ ESPERADO
**Impacto:** Signature Router soportará SMS y PUSH  
**Acción:** Epic 11 con SMS y PUSH, postponer VOICE/BIOMETRIC

### Escenario C: SMS + PUSH + VOICE disponibles (15% probabilidad)
**Impacto:** Signature Router soportará 3 canales principales  
**Acción:** Epic 11 completa (sin BIOMETRIC)

### Escenario D: Todos los canales disponibles (5% probabilidad)
**Impacto:** Signature Router con funcionalidad completa  
**Acción:** Epic 11 completa (4 canales)

---

## 🎯 Objetivo de la Reunión

**Salir con claridad absoluta de:**
1. ✅ Qué canales **SÍ** puedo implementar
2. ❌ Qué canales **NO** están disponibles
3. ⏳ Qué canales están en **roadmap** (y cuándo)
4. 📅 Timeline realista para **empezar desarrollo**

---

**¡Buena suerte en la reunión! 🚀**

> 💡 **Recuerda:** La pregunta de canales disponibles define TODO el alcance de Epic 11. ¡Es la MÁS importante!

