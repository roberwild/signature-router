# 📊 Hallazgos - Communication Services API

**Fecha de análisis:** 1 de diciembre de 2025  
**Documento analizado:** Singular Bank - Communication Services API.pdf (Exchange)  
**Versión de la API:** v1 (Asset 1.0.16)

---

## ✅ RESUMEN EJECUTIVO

### **API Confirmada para Signature Router:**
**Singular Bank - Communication Services API (ID: 2611145)**

### **Alcance Confirmado:**
- ✅ **2 canales a implementar** (SMS, PUSH)
- ⚪ **1 canal disponible pero no planeado** (EMAIL)
- ❌ **2 canales NO disponibles y fuera de alcance** (VOICE, BIOMETRIC)
- ⚠️ **Metadata de providers NO incluida** (solicitar ampliación)

### **Impacto en Epic 11:**
- ✅ Se implementará SMS + PUSH únicamente
- ❌ VOICE y BIOMETRIC definitivamente fuera de alcance
- ⚠️ Epic 9 (Analytics) tendrá limitaciones sin metadata de providers

---

## 📋 CANALES DISPONIBLES

| Canal | Estado | Endpoint | Alcance Epic 11 | Provider |
|-------|--------|----------|-----------------|----------|
| **📱 SMS** | ✅ Disponible | `POST /communication-execution/sms-notification/execute` | ✅ **IMPLEMENTAR** | ❓ Desconocido (preguntar) |
| **🔔 PUSH** | ✅ Disponible | `POST /communication-execution/push-notification/execute` | ✅ **IMPLEMENTAR** | ❓ Desconocido (preguntar) |
| **📧 EMAIL** | ✅ Disponible | `POST /communication-execution/email-notification/execute` | ⚪ Opcional (no planeado) | ✅ Microsoft Outlook 365 |
| **📞 VOICE** | ❌ NO disponible | - | ❌ **FUERA DE ALCANCE** | - |
| **🔐 BIOMETRIC** | ❌ NO disponible | - | ❌ **FUERA DE ALCANCE** | - |

### **Decisión de Alcance:**
- ✅ **Epic 11 implementará SOLO:** SMS + PUSH
- ❌ **Fuera de alcance definitivo:** VOICE y BIOMETRIC (no disponibles en MuleSoft)

---

## 🔍 ESTRUCTURA DE REQUEST/RESPONSE

### **Ejemplo Request SMS:**

```json
{
    "customerId": "CUST12345678",
    "practice": "monkey",  // ⚠️ CAMPO DESCONOCIDO - PREGUNTAR
    "channel": "SMS",
    "recipient": {
        "phoneNumber": "+34653093774",
        "countryCode": "ES"
    },
    "content": {
        "message": "Su código de firma es: 123456",
        "encoding": "UTF8"
    },
    "smsOptions": {
        "senderId": "SELFBANK",
        "validityPeriod": 60,
        "deliveryReport": true
    },
    "metadata": {
        "campaignId": "SIGNATURE_REQUEST_2024",
        "businessUnit": "RETAIL_BANKING",
        "correlationId": "CORR-1234-ABCD-5678"
    }
}
```

### **Response Actual:**

```json
{
    "notificationId": "COMM-EXEC-20241209-001234",
    "status": "SENT",
    "submittedAt": "2024-12-09T15:30:25.123Z",
    "channel": "SMS",
    "communicationExecutionId": "BIAN-COMM-EXEC-UUID-12345"
}
```

### **⚠️ LIMITACIÓN:** Response NO incluye metadata de providers

---

## 🔴 PROBLEMAS CRÍTICOS DETECTADOS

### **1. Campo "practice": "monkey" - Desconocido**

**Problema:**
- Aparece en ejemplo de la documentación
- NO hay explicación de su propósito
- NO se sabe si es obligatorio

**Preguntas para reunión:**
- ❓ ¿Qué es el campo "practice"?
- ❓ ¿Es obligatorio?
- ❓ ¿Qué valores puede tener? ("monkey", ¿otros?)
- ❓ ¿Afecta al routing o procesamiento?

---

### **2. NO Metadata de Providers - CRÍTICO para Analytics**

**Problema:**
- Response NO incluye información del provider real
- No podemos saber si usó Twilio, Nexmo, Firebase, etc.
- No tenemos latencias específicas del provider
- No tenemos costes por envío
- Imposible hacer troubleshooting granular

**Impacto:**

| Funcionalidad | Estado | Impacto |
|---------------|--------|---------|
| Dashboard por provider | ❌ No posible | 🔴 CRÍTICO |
| Troubleshooting detallado | ⚠️ Limitado | 🔴 CRÍTICO |
| Tracking de SLAs (P99 < 500ms) | ⚠️ Impreciso | 🔴 CRÍTICO |
| Optimización de costos | ❌ No posible | 🟡 ALTO |
| A/B testing de providers | ❌ No posible | 🟡 ALTO |
| Alertas específicas | ⚠️ Genéricas | 🟡 ALTO |

**Solución Propuesta:**
- Solicitar ampliación de interfaces para incluir `providerMetadata` en responses
- Ver sección 9.1 del documento de preguntas para justificación completa

---

### **3. "Not Validated" Conformance Status**

**Problema:**
- La API NO está validando conformidad con especificación RAML
- Pueden existir discrepancias entre documentación y comportamiento real

**Preguntas para reunión:**
- ❓ ¿Hay diferencias conocidas entre spec y implementación?
- ❓ ¿Están planeando validar conformidad?
- ❓ ¿Debemos reportar discrepancias si las encontramos?

---

## 🎯 ENDPOINTS DE MONITOREO (IMPORTANTE)

La API incluye endpoints de monitoreo que podrían ayudar con observabilidad:

| Endpoint | Método | Propósito | Info Disponible |
|----------|--------|-----------|-----------------|
| `/health/retrieve` | GET | Health check | ❓ Preguntar qué incluye |
| `/metrics/retrieve` | GET | Métricas | ❓ Preguntar qué incluye |

**Preguntas críticas:**
- ❓ ¿`/health/retrieve` devuelve estado por provider? (Twilio UP/DOWN)
- ❓ ¿`/metrics/retrieve` incluye latencias por provider?
- ❓ ¿Incluyen tasas de éxito/error por provider?
- ❓ ¿Podemos usar estos endpoints para dashboard de Signature Router?

**Si estos endpoints incluyen info por provider, podrían compensar parcialmente la falta de metadata en responses.**

---

## 📊 CARACTERÍSTICAS TÉCNICAS CONFIRMADAS

### **SMS:**
- ✅ Codificación automática (GSM 7-bit, UCS-2)
- ✅ Cálculo de segmentos de mensaje
- ✅ Validación de números internacionales
- ✅ Entrega inmediata y programada
- ✅ SenderId personalizable ("SELFBANK")
- ✅ Delivery reports disponibles

**Preguntas pendientes:**
- ❓ ¿Soporte para emojis?
- ❓ ¿Límite de caracteres por mensaje?
- ❓ ¿Límite de segmentos?
- ❓ ¿Podemos cambiar SenderId o solo "SELFBANK"?

### **PUSH:**
- ✅ Notificaciones inmediatas
- ✅ Personalización de contenido
- ✅ Gestión de destinatarios
- ✅ Prioridad de entrega
- ✅ Metadatos de aplicación

**Preguntas pendientes:**
- ❓ ¿Cómo se especifica deviceToken?
- ❓ ¿Formato de payload?
- ❓ ¿Soporte para iOS + Android?
- ❓ ¿Rich notifications? (imágenes, botones)

### **EMAIL:**
- ✅ Provider: Microsoft Outlook 365 (Graph API)
- ✅ Contenido HTML y texto plano
- ✅ Destinatarios múltiples
- ✅ Importancia configurable
- ✅ Confirmación de lectura/entrega

---

## 🏗️ ARQUITECTURA BIAN v12.0

La API está basada en el estándar **BIAN v12.0** (Banking Industry Architecture Network):

**Service Domain:** Communication Execution  
**Pattern:** Ejecución inmediata con respuesta síncrona  
**Control Records:** Cada comunicación crea un Communication Execution Control Record

**Integración con otros dominios:**
- Customer Communications
- Customer Authentication
- Customer Advisory Services
- Portfolio Management
- Fraud Detection
- Customer Onboarding

**Implicación:** La API está diseñada para ser consumida por múltiples servicios bancarios, no solo Signature Router.

---

## 🔐 AUTENTICACIÓN (PENDIENTE DE CONFIRMAR)

**NO documentado en el PDF analizado.**

**Preguntas para reunión:**
- ❓ ¿OAuth2, API Key, mTLS, JWT?
- ❓ ¿Cómo obtenemos credenciales?
- ❓ ¿Client ID + Client Secret?
- ❓ ¿Los tokens expiran?

---

## 🌐 AMBIENTES (PENDIENTE DE CONFIRMAR)

**NO documentado en el PDF analizado.**

**Preguntas para reunión:**
- ❓ URL completa de DEV: `https://???/communication-execution/...`
- ❓ URL completa de UAT: `https://???/communication-execution/...`
- ❓ URL completa de PROD: `https://???/communication-execution/...`

**Pista:** En el API Manager se vio URL truncada: `https://api.selfbank.es/system/commu...`

Posible URL completa: `https://api.selfbank.es/system/communication/v1`

---

## ⏱️ SLAs Y RATE LIMITS (PENDIENTE DE CONFIRMAR)

**NO documentado en el PDF analizado.**

**Preguntas para reunión:**
- ❓ Timeout recomendado
- ❓ Requests por segundo permitidos
- ❓ Disponibilidad garantizada (99.9%?)
- ❓ Latencia garantizada (P99 < 500ms?)
- ❓ Retry policy recomendada

---

## 📦 ENTREGABLES PENDIENTES PARA LA REUNIÓN

### **🔴 CRÍTICOS (sin esto no podemos empezar):**
1. **Credenciales de DEV:** Client ID + Client Secret
2. **URLs completas:** DEV, UAT, PROD
3. **Explicación campo "practice":** ¿Qué es? ¿Obligatorio?
4. **Providers reales:** ¿Qué proveedor usa cada canal?

### **🟡 IMPORTANTES (necesarios para planificación):**
5. **Roadmap de VOICE y BIOMETRIC:** ¿Cuándo estarán disponibles?
6. **Postman Collection:** Con ejemplos completos
7. **Archivo RAML descargable:** Especificación completa
8. **SLAs y rate limits:** Documentación de limitaciones

### **🟢 DESEABLES (mejoran la implementación):**
9. **Metadata de providers:** Solicitud formal de ampliación de interfaces
10. **Specs de /health y /metrics:** ¿Qué información devuelven?
11. **Contacto técnico:** Para soporte y dudas
12. **Timeline de integración:** Cuándo podemos empezar

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### **Antes de la reunión del lunes:**
- [x] ✅ Analizar documentación obtenida
- [x] ✅ Identificar gaps de información
- [x] ✅ Preparar preguntas específicas
- [ ] ⏳ Revisar documento de preguntas completo

### **Durante la reunión del lunes:**
1. **Confirmar providers reales** (Twilio, Firebase, etc.)
2. **Solicitar credenciales inmediatas** (DEV al menos)
3. **Aclarar campo "practice": "monkey"**
4. **Solicitar formalmente metadata de providers** (usar argumentos de sección 9.1)
5. **Obtener roadmap de VOICE/BIOMETRIC**
6. **Confirmar SLAs y rate limits**

### **Después de la reunión:**
1. Hacer primer request de prueba (SMS)
2. Validar conformidad de responses con spec
3. Probar endpoints de monitoreo (/health, /metrics)
4. Actualizar Epic 11 con alcance confirmado
5. Diseñar estrategia de integración

---

## 🚨 RIESGOS IDENTIFICADOS

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| ~~**VOICE/BIOMETRIC no disponibles**~~ | ✅ CONFIRMADO | ✅ RESUELTO | Epic 11 solo SMS+PUSH (decisión tomada) |
| **No metadata de providers** | 🔴 ALTA | 🔴 ALTO | Epic 9 (Analytics) con alcance reducido, solicitar ampliación |
| **Campo "practice" obligatorio sin docs** | 🟡 MEDIA | 🟡 MEDIO | Preguntar en reunión, hardcodear si es necesario |
| **Conformance not validated** | 🟡 MEDIA | 🟡 MEDIO | Testing exhaustivo, reportar discrepancias |
| **Rate limits desconocidos** | 🟡 MEDIA | 🔴 ALTO | Preguntar en reunión, implementar circuit breaker conservador |

---

## ✅ CONCLUSIONES

### **Buenas Noticias:**
- ✅ API identificada y confirmada
- ✅ SMS y PUSH disponibles (canales principales)
- ✅ Endpoints de monitoreo disponibles
- ✅ Arquitectura BIAN estándar (bien diseñada)
- ✅ Documentación básica existente
- ✅ Alcance claramente definido (solo SMS + PUSH)

### **Malas Noticias:**
- ❌ VOICE y BIOMETRIC no disponibles (confirmado fuera de alcance)
- ❌ Metadata de providers NO incluida
- ❌ Conformance no validada
- ❌ Algunos aspectos críticos sin documentar (credenciales, URLs, "practice")

### **Recomendación:**
**PROCEDER con Epic 11** con alcance definitivo (solo SMS + PUSH), solicitando en la reunión:
1. 🔴 **CRÍTICO:** Credenciales de DEV (para empezar inmediatamente)
2. 🔴 **CRÍTICO:** URLs completas de ambientes
3. 🔴 **CRÍTICO:** Explicación del campo "practice"
4. 🔴 **CRÍTICO:** Schema completo de PUSH
5. 🟡 **IMPORTANTE:** Ampliación de interfaces para metadata de providers
6. 🟡 **IMPORTANTE:** Rate limits y SLAs

---

**Documento actualizado:** 1 de diciembre de 2025  
**Próxima revisión:** Después de reunión del lunes

