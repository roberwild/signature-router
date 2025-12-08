# 📋 Preguntas para Reunión MuleSoft

**Proyecto:** Signature Router - Integración Provider Catalog  
**Fecha Reunión:** 6 de diciembre de 2025  
**Participantes:** Equipo Signature Router + Equipo MuleSoft (Borja)  
**Objetivo:** Validar especificación de 3 endpoints y obtener acceso para desarrollo

---

## 📌 Contexto de la Reunión

Signature Router necesita consumir providers de firma digital configurados en MuleSoft. Hemos preparado una especificación técnica de 3 endpoints REST que necesitamos.

**Documento de referencia:** `PROPUESTA-INTERFACES-MULESOFT.md`

---

## 🎯 Objetivos de la Reunión (60 min)

1. **Validar especificación técnica** (20 min)
   - Revisar los 3 endpoints propuestos
   - Confirmar viabilidad técnica
   - Identificar ajustes necesarios

2. **Obtener información de configuración** (20 min)
   - URLs de ambientes (DEV, UAT, PROD)
   - Autenticación OAuth2 (client_id, client_secret, token endpoint)
   - Providers actualmente configurados en MuleSoft

3. **Definir timeline de implementación** (20 min)
   - Fecha de disponibilidad de endpoints en DEV
   - Plan de testing integrado
   - Fecha de go-live en PRD

---

## 🔴 TOP 5 Preguntas Críticas

### 1️⃣ ¿Los 3 endpoints propuestos son viables técnicamente?

**Endpoints requeridos:**
- `GET /api/v1/signature/providers` - Listar providers
- `GET /api/v1/signature/providers/{id}/health` - Health check
- `POST /api/v1/signature/providers/{id}/send` - Enviar challenge

¿Hay algo que no sea viable o requiera ajustes?

---

### 2️⃣ ¿Cuándo estarán disponibles en ambiente DEV?

**Timeline propuesto:**
- **9 dic:** Endpoints en DEV
- **9-13 dic:** Integration testing
- **16 dic:** Deployment a UAT
- **23 dic:** Go-live PRD

¿Es realista este timeline?

---

### 3️⃣ ¿Cómo obtenemos las credenciales OAuth2?

Necesitamos para cada ambiente:
- **Client ID**
- **Client secret**
- **Token endpoint URL**
- **Scopes requeridos**

¿Cuál es el proceso para obtenerlas?

---

### 4️⃣ ¿Qué providers están actualmente configurados?

Por tipo:
- **SMS:** ¿Twilio? ¿AWS SNS? ¿Otros?
- **PUSH:** ¿Firebase FCM? ¿OneSignal? ¿Otros?
- **VOICE:** ¿Vonage? ¿Twilio Voice?
- **BIOMETRIC:** ¿Alguno configurado?

Necesitamos la lista completa para configurar nuestro catálogo inicial.

---

### 5️⃣ ¿El endpoint de health check hace ping real o devuelve estado cacheado?

**Contexto:** Llamaremos al health check cada 1 minuto por provider habilitado.

- ¿Hace ping real al provider externo?
- ¿O devuelve un estado cacheado?
- ¿Cuál es la latencia típica del health check?

---

## 📋 Preguntas Técnicas Detalladas

### Autenticación

- [ ] ¿Qué **grant type** de OAuth2 usan? (client_credentials, authorization_code)
- [ ] ¿Los tokens **expiran**? ¿Cada cuánto?
- [ ] ¿Cómo renovamos el token automáticamente?
- [ ] ¿Necesitamos IP whitelisting?

### URLs de Ambientes

- [ ] **DEV:** `https://???`
- [ ] **UAT:** `https://???`
- [ ] **PROD:** `https://???`

### Rate Limiting

- [ ] `GET /providers`: ¿Cuántos requests/minuto?
- [ ] `GET /providers/{id}/health`: ¿Cuántos requests/minuto?
- [ ] `POST /providers/{id}/send`: ¿Cuántos requests/minuto?

### Timeouts

- [ ] ¿Cuál es el timeout máximo recomendado por request?
- [ ] ¿Cuál es el tiempo de respuesta promedio (P50, P95, P99)?

### Metadata en Responses

**Pregunta clave:** ¿El response de `POST /providers/{id}/send` puede incluir metadata del provider real?

**Lo que necesitamos:**
```json
{
  "success": true,
  "notificationId": "...",
  "providerMetadata": {
    "providerId": "mule-twilio-sms-es",
    "providerName": "Twilio SMS España",
    "providerLatencyMs": 95,
    "providerTransactionId": "SM123..."
  }
}
```

¿Es viable incluir esta información?

### Manejo de Errores

- [ ] ¿Qué códigos de error devuelven? (400, 401, 429, 500, 503)
- [ ] ¿Tienen formato estandarizado de error response?
- [ ] ¿Incluyen información del provider en errores (ej: "Twilio error 21211")?

### Campo "practice" del Response Actual

En la documentación actual vimos un campo `"practice": "monkey"` en los requests.

- [ ] ¿Qué es este campo?
- [ ] ¿Es obligatorio?
- [ ] ¿Valores posibles?

---

## 📄 Documentación Requerida

Por favor proporcionar:

1. **OpenAPI/Swagger spec** de los 3 endpoints
2. **Guía de autenticación OAuth2**
   - Cómo obtener el token
   - Ejemplo de request con curl
3. **Postman Collection** con ejemplos
4. **Lista de providers configurados** en MuleSoft
5. **Contacto técnico** para soporte durante desarrollo

---

## 🧪 Testing & Sandbox

- [ ] ¿Tienen ambiente DEV con mock providers?
- [ ] ¿Podemos hacer requests de prueba sin consumir providers reales?
- [ ] ¿Tienen datos de prueba? (números de teléfono, device tokens)
- [ ] ¿Requieren contract tests?

---

## 🔄 Resiliencia & Fallback

**División de responsabilidades:**

- [ ] ¿MuleSoft tiene circuit breaker hacia los providers?
- [ ] ¿MuleSoft hace retry automático si un provider falla?
- [ ] ¿MuleSoft tiene múltiples providers por canal? (ej: Twilio + AWS SNS para SMS)
- [ ] ¿MuleSoft maneja fallback automático entre providers?

**Del lado de Signature Router:**
- Implementaremos fallback entre providers si el primero falla
- Configuraremos circuit breaker hacia MuleSoft
- Reintentaremos solo si el error es `retryable: true`

---

## 📊 Monitoreo

- [ ] ¿Tienen dashboards de MuleSoft que podamos ver?
- [ ] ¿Proveen métricas de nuestro consumo? (requests, latency, errores)
- [ ] ¿Dónde vemos logs de nuestros requests?
- [ ] ¿Cómo reportamos incidentes?
- [ ] ¿Tienen status page?

---

## 🆘 Soporte

- [ ] ¿Quién es el contacto técnico principal?
- [ ] ¿Tienen canal de Slack/Teams de soporte?
- [ ] ¿Cuál es el SLA de respuesta a issues?
- [ ] ¿Cómo escalamos incidentes críticos?

---

## 📦 Ejemplos de Request/Response

**¿Pueden darnos ejemplos reales con datos de DEV?**

Necesitamos ver:
- Request completo con headers y auth para SMS
- Response exitoso (200 OK)
- Response con error retryable (rate limit)
- Response con error no retryable (teléfono inválido)

---

## ✅ Checklist de Entregables

Al final de la reunión, necesitamos:

- [ ] ✅ Especificación validada (o lista de ajustes necesarios)
- [ ] 🔴 Timeline confirmado (fecha de endpoints en DEV)
- [ ] 🔴 Credenciales de DEV (client_id, client_secret, token_endpoint)
- [ ] 🔴 URLs de DEV completas
- [ ] ✅ Lista de providers configurados actualmente
- [ ] ✅ OpenAPI/Swagger spec (o comprometido a enviarlo)
- [ ] ✅ Postman Collection (o comprometido a enviarlo)
- [ ] ✅ Contacto técnico (email, Slack)
- [ ] ✅ Próximos pasos claramente definidos

---

## 🚀 Próximos Pasos Post-Reunión

**Una vez tengamos las credenciales:**

1. **Configurar cliente OAuth2** en Signature Router
2. **Hacer primer request de prueba** a DEV
3. **Validar los 3 endpoints** con datos reales
4. **Iniciar implementación backend** (Stories 13.1-13.4)
5. **Testing integrado** durante la semana del 9-13 dic
6. **Deployment a UAT** semana del 16-20 dic
7. **Go-live PRD** 23 dic (si todo va bien)

---

## 💡 Estrategia de Comunicación

### Primeros 10 min: Contexto
- Presentar proyecto Signature Router brevemente
- Explicar cambio de enfoque (de CRUD a integración con MuleSoft)
- Mostrar documento técnico preparado

### Siguientes 20 min: Validación Técnica
- Revisar los 3 endpoints uno por uno
- Validar request/response schemas
- Identificar ajustes necesarios

### Siguientes 15 min: Configuración
- Obtener credenciales y URLs
- Entender proceso de autenticación
- Clarificar rate limits y timeouts

### Siguientes 10 min: Timeline
- Confirmar fechas de disponibilidad
- Acordar plan de testing
- Definir criterios de go-live

### Últimos 5 min: Cierre
- Resumir acuerdos
- Confirmar entregables
- Programar follow-up si es necesario

---

## 📌 Frase Clave para Metadata

Si preguntan por qué necesitamos metadata del provider:

> "Necesitamos visibilidad del provider real para cumplir nuestros SLAs con clientes finales y hacer troubleshooting efectivo. No queremos gestionar providers directamente (eso es responsabilidad de MuleSoft), solo necesitamos observabilidad."

---

## ⚠️ Posibles Escenarios

### ✅ Escenario Ideal
- Los 3 endpoints son viables sin cambios
- Endpoints disponibles en DEV para el 9 dic
- Credenciales entregadas inmediatamente
- **Acción:** Iniciar desarrollo el 9 dic según lo planificado

### 🟡 Escenario con Ajustes Menores
- Algunos campos del schema necesitan ajustes
- Timeline se extiende 2-3 días
- **Acción:** Ajustar especificación y re-planificar

### 🔴 Escenario con Cambios Mayores
- Endpoints requieren re-diseño significativo
- Timeline se extiende 1-2 semanas
- **Acción:** Re-planificar Epic 13 con nuevo timeline

---

## 📧 Template de Email Post-Reunión

**Para:** Borja (MuleSoft Team)  
**Asunto:** Resumen reunión - Signature Router MuleSoft Integration

Hola Borja,

Gracias por la reunión de hoy. Resumo los puntos clave:

**Acuerdos:**
- [ ] Timeline confirmado: endpoints en DEV el [FECHA]
- [ ] Credenciales enviadas a: [EMAIL]
- [ ] Documentación OpenAPI compartida vía: [LINK]

**Pendientes:**
- [ ] [ACCIÓN 1] - Responsable: [NOMBRE] - Fecha: [FECHA]
- [ ] [ACCIÓN 2] - Responsable: [NOMBRE] - Fecha: [FECHA]

**Próximos pasos:**
- [FECHA]: Primer test en DEV
- [FECHA]: Integration testing completo
- [FECHA]: Go-live UAT

¿Algo que ajustar?

Saludos,  
[Tu nombre]

---

**¡Buena suerte en la reunión! 🚀**

> 💡 **Recuerda:** El objetivo es salir con TODO lo necesario para empezar desarrollo el lunes 9 dic.
