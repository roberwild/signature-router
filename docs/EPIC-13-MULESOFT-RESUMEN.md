# Epic 13: Provider Management - MuleSoft Integration
## Resumen Ejecutivo

**Fecha:** 5 de diciembre de 2025  
**Esfuerzo:** 2 semanas  
**Estado:** 📋 Planificación

---

## 🎯 Objetivo

Integrar Signature Router con **MuleSoft ESB** para consumir providers de firma (SMS, PUSH, VOICE, BIOMETRIC) que están configurados centralmente en MuleSoft.

---

## 🔑 Diferencia Clave con Versión Anterior

### ❌ **Versión Antigua (Descartada)**
- Signature Router **crea y gestiona** providers directamente
- Credenciales almacenadas en Vault por Signature Router
- Admin Portal permite crear providers desde cero
- Configuración duplicada (MuleSoft + Signature Router)

### ✅ **Versión Nueva (MuleSoft Integration)**
- Signature Router **consume** providers desde MuleSoft
- MuleSoft gestiona credenciales y configuración de providers
- Admin Portal solo **habilita/deshabilita** y configura prioridades
- Single source of truth: MuleSoft

---

## 🏗️ Arquitectura Simplificada

```
┌─────────────────────┐
│   Admin Portal      │  ← Habilita/deshabilita providers
│   (Next.js)         │  ← Configura prioridades de fallback
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Signature Router    │  ← Sincroniza catálogo desde MuleSoft
│ (Spring Boot)       │  ← Ejecuta health checks
│                     │  ← Aplica fallback automático
└──────────┬──────────┘
           │ REST API
           ▼
┌─────────────────────┐
│   MuleSoft ESB      │  ← Providers configurados aquí
│                     │  ← Credenciales gestionadas aquí
└──────────┬──────────┘
           │
           ▼
┌────────────────────────────────────┐
│ Twilio │ AWS SNS │ FCM │ Veridas   │
└────────────────────────────────────┘
```

---

## 📋 Funcionalidades

### **Admin Portal permite:**
1. ✅ **Ver catálogo** de providers desde MuleSoft
2. ✅ **Habilitar/deshabilitar** providers localmente
3. ✅ **Configurar prioridades** para fallback (1 = mayor prioridad)
4. ✅ **Monitorear salud** de cada provider
5. ✅ **Sincronizar** manualmente desde MuleSoft

### **Sistema automáticamente:**
1. ✅ **Sincroniza catálogo** cada 5 minutos
2. ✅ **Ejecuta health checks** cada 1 minuto (solo habilitados)
3. ✅ **Aplica fallback** si un provider falla
4. ✅ **Detecta nuevos providers** en MuleSoft

---

## 📊 Stories

| # | Story | Effort | Descripción |
|---|-------|--------|-------------|
| **13.1** | Database Schema | 0.5 días | Tabla `provider_catalog` para catálogo local |
| **13.2** | MuleSoft Client | 2 días | Cliente REST para conectar con MuleSoft APIs |
| **13.3** | Sync Service | 1.5 días | Sincronización automática + health checks |
| **13.4** | REST API | 1.5 días | Endpoints para Admin Portal |
| **13.5** | Admin UI | 2 días | Interfaz gráfica en Next.js |
| **13.6** | Fallback Logic | 1.5 días | Selección de provider con fallback automático |

**Total:** 9 días + 1.5 días testing/docs = **2 semanas**

---

## 🎨 Admin Portal UI (Preview)

```
┌────────────────────────────────────────────────────────┐
│  Provider Management                  [🔄 Sync MuleSoft]│
├────────────────────────────────────────────────────────┤
│                                                        │
│  📱 SMS Providers                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ☑ Twilio SMS España        Priority: 1   [↑][↓] │ │
│  │   Endpoint: /api/v1/signature/sms/twilio         │ │
│  │   MuleSoft: 🟢 available  Health: 🟢 healthy     │ │
│  │   Last sync: 2025-12-05 10:30                    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ☑ AWS SNS España           Priority: 2   [↑][↓] │ │
│  │   Endpoint: /api/v1/signature/sms/aws-sns        │ │
│  │   MuleSoft: 🟢 configured  Health: 🟢 healthy    │ │
│  │   Last sync: 2025-12-05 10:30                    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  🔔 PUSH Providers                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ☐ Firebase FCM             Priority: 1   [↑][↓] │ │
│  │   Endpoint: /api/v1/signature/push/fcm           │ │
│  │   MuleSoft: 🔴 down  Health: 🔴 unhealthy        │ │
│  │   Last sync: 2025-12-05 10:29                    │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 🔌 MuleSoft APIs Requeridas

### **1. List Providers**
```http
GET /api/v1/signature/providers

Response:
{
  "providers": [
    {
      "id": "mule-twilio-sms-es",
      "name": "Twilio SMS España",
      "type": "SMS",
      "endpoint": "/api/v1/signature/sms/twilio",
      "status": "available"
    }
  ]
}
```

### **2. Health Check**
```http
GET /api/v1/signature/providers/{id}/health

Response:
{
  "status": "healthy",
  "latency_ms": 45,
  "last_check": "2025-12-05T10:30:00Z"
}
```

### **3. Send Challenge**
```http
POST /api/v1/signature/providers/{id}/send

Request:
{
  "challenge_code": "123456",
  "recipient": "+34600123456"
}

Response:
{
  "success": true,
  "provider_response_id": "SM123abc",
  "sent_at": "2025-12-05T10:30:00Z"
}
```

---

## 💾 Base de Datos

### **Tabla: `provider_catalog`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `mulesoft_provider_id` | VARCHAR(100) | ID del provider en MuleSoft (unique) |
| `provider_name` | VARCHAR(100) | Nombre (ej: "Twilio SMS España") |
| `provider_type` | VARCHAR(20) | SMS, PUSH, VOICE, BIOMETRIC |
| `mulesoft_endpoint` | VARCHAR(500) | URL del endpoint en MuleSoft |
| `mulesoft_status` | VARCHAR(20) | available, configured, down |
| **`enabled`** | **BOOLEAN** | **Control local (default: false)** |
| **`priority`** | **INTEGER** | **Orden de fallback (1 = mayor prioridad)** |
| `timeout_seconds` | INTEGER | Timeout local |
| `retry_max_attempts` | INTEGER | Reintentos locales |
| `health_status` | VARCHAR(20) | healthy, unhealthy, unknown |
| `last_health_check_at` | TIMESTAMPTZ | Último health check |
| `last_sync_at` | TIMESTAMPTZ | Última sincronización |
| `created_at` | TIMESTAMPTZ | Fecha creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |
| `updated_by` | VARCHAR(100) | Usuario que modificó |

**Nota:** Los campos en **negrita** son los únicos que el admin puede modificar.

---

## 🔄 Flujo de Fallback

```java
// Ejemplo: Enviar SMS con fallback automático

Providers habilitados (ordenados por priority):
  1. Twilio SMS (priority 1)
  2. AWS SNS (priority 2)

Intento 1: Twilio SMS
  → Request a MuleSoft: POST /sms/twilio/send
  → Response: ERROR (timeout)
  → Log: "Twilio failed, trying fallback..."

Intento 2: AWS SNS (fallback automático)
  → Request a MuleSoft: POST /sms/aws-sns/send
  → Response: SUCCESS
  → Log: "Challenge sent via AWS SNS (fallback)"
  → Return: ProviderResult.success("aws-sns", "SM123abc")

Si ambos fallan:
  → Throw: AllProvidersFailedException
```

---

## ✅ Ventajas de esta Aproximación

| Aspecto | Ventaja |
|---------|---------|
| **Governance** | MuleSoft como single source of truth |
| **Seguridad** | Credenciales centralizadas en MuleSoft |
| **Simplicidad** | Signature Router solo consume, no gestiona |
| **Flexibilidad** | Nuevos providers en MuleSoft → auto-detectados |
| **Operación** | Cambios en MuleSoft sin modificar Signature Router |
| **Auditabilidad** | MuleSoft registra accesos y uso de providers |
| **Fallback** | Automático basado en prioridades locales |

---

## 🚀 Plan de Implementación

### **Semana 1**
- ✅ Día 1-2: Database schema + MuleSoft client
- ✅ Día 3-4: Sync service + health checks
- ✅ Día 5: REST API endpoints

### **Semana 2**
- ✅ Día 1-2: Admin Portal UI
- ✅ Día 3: Fallback logic
- ✅ Día 4: Testing E2E
- ✅ Día 5: Documentation + Deployment

---

## 🧪 Testing Strategy

### **1. Unit Tests**
- MuleSoft client (mocked responses)
- Sync service logic
- Fallback selection logic

### **2. Integration Tests**
- MuleSoft sandbox/dev environment
- Provider sync end-to-end
- Health check automation

### **3. E2E Tests**
- Admin UI: Enable/disable providers
- Admin UI: Update priorities
- Challenge sending con fallback

---

## 📋 Checklist Pre-Deployment

### **MuleSoft (Prerequisitos)**
- [ ] MuleSoft APIs disponibles en dev/uat/prod
- [ ] Documentación de APIs (OpenAPI/Swagger)
- [ ] Credenciales OAuth2 (client_id, client_secret)
- [ ] Sandbox/dev environment para testing

### **Signature Router**
- [ ] Migración LiquidBase ejecutada
- [ ] MuleSoft client configurado
- [ ] Variables de entorno: `MULESOFT_BASE_URL`, `MULESOFT_CLIENT_ID`, `MULESOFT_CLIENT_SECRET`
- [ ] Sync service habilitado (scheduled tasks)

### **Admin Portal**
- [ ] UI deployada
- [ ] RBAC configurado (rol ADMIN)
- [ ] Testing con usuarios reales

---

## 📞 Contactos

| Rol | Responsable | Acción |
|-----|-------------|--------|
| **MuleSoft Team** | [Nombre] | Proveer APIs y credenciales |
| **Backend Dev** | [Nombre] | Implementar Stories 13.1-13.4, 13.6 |
| **Frontend Dev** | [Nombre] | Implementar Story 13.5 (Admin UI) |
| **QA** | [Nombre] | Testing E2E |
| **DevOps** | [Nombre] | Deployment + variables de entorno |

---

## ❓ Preguntas Frecuentes

### **1. ¿Qué pasa si MuleSoft está down?**
- Health checks marcarán providers como `unhealthy`
- Admin verá estado en rojo en UI
- Signature Router no podrá enviar challenges (dependencia crítica)

### **2. ¿Puedo crear providers desde Signature Router?**
- No. Los providers se crean en MuleSoft.
- Signature Router solo los consume.

### **3. ¿Cómo se agregan nuevos providers?**
1. MuleSoft team configura nuevo provider en MuleSoft
2. Esperar 5 minutos (sync automático) o hacer sync manual desde UI
3. Admin habilita provider y configura prioridad
4. Provider queda disponible

### **4. ¿Qué pasa con providers existentes (Twilio, FCM)?**
- Se migrarán a MuleSoft
- Signature Router dejará de llamarlos directamente
- Usará MuleSoft como proxy/gateway

### **5. ¿Cómo funciona el fallback?**
- Providers se ordenan por `priority` (1 = mayor prioridad)
- Si priority 1 falla → intenta priority 2
- Si todos fallan → error al usuario

---

**Documento creado:** 5 de diciembre de 2025  
**Owner:** Product Manager  
**Próxima revisión:** Pre-kick-off Epic 13
