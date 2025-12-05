# Epic 13: Workflow BMAD Actualizado - MuleSoft Integration

**Fecha:** 5 de diciembre de 2025  
**Status:** ✅ Documentación Completa  
**Próximo Paso:** Kick-off Meeting (6 dic 2025)

---

## 🎯 Resumen del Cambio

### ❌ **Versión Original (Descartada)**
Epic 13 originalmente planteaba un **CRUD completo de providers**:
- Admin crea providers manualmente
- Configuración y credenciales gestionadas por Signature Router
- Vault path configurado por admin
- Providers almacenados en BD con config JSON

**Problema detectado:**
> *"Todos los proveedores se darán de alta en MuleSoft a través de configuración y parametrización de sistemas. Mulesoft nos dejará los providers ahí listos para utilizar, con lo cual no deberíamos estar nosotros dándolos de alta."*

---

### ✅ **Versión Nueva (Implementar)**
Epic 13 ahora es **integración con MuleSoft** como catálogo de providers:
- MuleSoft configura providers centralmente
- Signature Router sincroniza catálogo automáticamente
- Admin solo habilita/deshabilita y configura prioridades
- Credenciales gestionadas por MuleSoft (más seguro)

---

## 📚 Documentación Creada (5 dic 2025)

### **1. Epic Completo** ✅
**Archivo:** `docs/epics/epic-13-providers-mulesoft-integration.md`  
**Tamaño:** ~1,200 líneas  
**Contenido:**
- Resumen ejecutivo
- Arquitectura detallada con flowcharts
- 6 User Stories completas con acceptance criteria
- Estimación de esfuerzo (2 semanas = 9 días + 1.5 días testing)
- Strategy de implementación (2 fases)
- Security considerations
- Success metrics

**Audiencia:** Developers, Tech Lead, PM

---

### **2. Resumen Ejecutivo** ✅
**Archivo:** `docs/EPIC-13-MULESOFT-RESUMEN.md`  
**Tamaño:** ~800 líneas  
**Contenido:**
- Diferencia CRUD vs Sync (clave para stakeholders)
- Arquitectura simplificada (ASCII diagram)
- UI mockup del Admin Portal
- MuleSoft APIs requeridas (contract)
- Database schema
- Plan de implementación (semana a semana)
- Testing strategy
- FAQs (15 preguntas comunes)
- Checklist pre-deployment

**Audiencia:** Stakeholders, PM, Business Analysts

---

### **3. Diagramas de Arquitectura** ✅
**Archivo:** `docs/diagrams/epic-13-mulesoft-architecture.md`  
**Tamaño:** ~600 líneas  
**Contenido:** 11 diagramas Mermaid
1. Arquitectura general (Flowchart)
2. Flujo de sincronización (Sequence diagram)
3. Flujo de health check (Sequence diagram)
4. Flujo de envío con fallback (Flowchart)
5. Admin UI user flow (Flowchart)
6. Database schema (ERD)
7. Security flow (Sequence diagram)
8. Component interaction (Graph)
9. Deployment architecture (K8S)
10. Provider lifecycle (State diagram)
11. Data flow (Flowchart)

**Audiencia:** Architects, Developers, DevOps

---

### **4. Setup & Configuration** ✅
**Archivo:** `docs/setup/EPIC-13-MULESOFT-SETUP.md`  
**Tamaño:** ~1,000 líneas  
**Contenido:**
- Variables de entorno (obligatorias + opcionales)
- MuleSoft configuration (application.yml completo)
- Database setup (migrations, verification queries)
- Scheduled tasks (sync, health checks)
- Health checks (Actuator endpoints)
- **Troubleshooting guide** (6 problemas comunes con soluciones)
- Monitoring (Grafana dashboards, Prometheus alerts)
- Testing setup (WireMock mocks, integration tests)
- Deployment checklist

**Audiencia:** DevOps, Backend Developers, QA

---

### **5. Documentation Index** ✅
**Archivo:** `docs/EPIC-13-DOCUMENTATION-INDEX.md`  
**Tamaño:** ~700 líneas  
**Contenido:**
- Índice maestro de toda la documentación
- Links a cada documento con descripción
- Cambio de enfoque explicado (CRUD → Sync)
- User Stories resumidas
- MuleSoft APIs contract
- Implementation plan (timeline)
- Success metrics
- Security checklist
- Stakeholders y contactos
- Preguntas pendientes para MuleSoft Team
- Próximos pasos

**Audiencia:** Todo el equipo (punto de entrada)

---

## 📋 User Stories

| # | Story | Effort | Archivos a Crear |
|---|-------|--------|------------------|
| **13.1** | Database Schema | 0.5 días | `0020-provider-catalog-table.yaml` |
| **13.2** | MuleSoft Client | 2 días | `MuleSoftProviderClient.java`<br>`MuleSoftConfig.java`<br>`MuleSoftProviderDto.java` |
| **13.3** | Sync Service | 1.5 días | `ProviderSyncService.java`<br>`ProviderCatalogRepository.java` |
| **13.4** | REST API | 1.5 días | `ProviderCatalogController.java`<br>`ProviderCatalogService.java` |
| **13.5** | Admin UI | 2 días | `app/admin/providers/page.tsx`<br>`components/providers/ProviderGroup.tsx` |
| **13.6** | Fallback Logic | 1.5 días | `ProviderSelectionService.java` |

**Total:** 9 días + 1.5 días (testing/docs) = **2 semanas**

---

## 🏗️ Arquitectura Resumida

```
┌─────────────────────┐
│   Admin Portal      │  ← Enable/disable providers
│   (Next.js)         │  ← Configure priorities
└──────────┬──────────┘
           │ REST API
           ▼
┌─────────────────────┐
│ Signature Router    │  ← Sync catalog from MuleSoft (every 5 min)
│ (Spring Boot)       │  ← Health checks (every 1 min)
│                     │  ← Fallback logic
│  ┌──────────────┐   │
│  │ provider_    │   │  Fields:
│  │ catalog      │   │  - mulesoft_provider_id
│  │ (PostgreSQL) │   │  - enabled (local control)
│  └──────────────┘   │  - priority (fallback order)
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│   MuleSoft ESB      │  ← Providers configured here
│                     │  ← Credentials managed here
│  APIs:              │
│  - GET /providers   │
│  - GET /health      │
│  - POST /send       │
└──────────┬──────────┘
           │
           ▼
┌────────────────────────────────────┐
│ Twilio │ AWS SNS │ FCM │ Veridas   │
└────────────────────────────────────┘
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
  "latency_ms": 45
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
  "provider_response_id": "SM123abc"
}
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE provider_catalog (
    id UUID PRIMARY KEY,
    
    -- MuleSoft reference
    mulesoft_provider_id VARCHAR(100) UNIQUE,
    provider_name VARCHAR(100),
    provider_type VARCHAR(20),  -- SMS, PUSH, VOICE, BIOMETRIC
    mulesoft_endpoint VARCHAR(500),
    mulesoft_status VARCHAR(20),  -- available, configured, down
    
    -- Local control (managed by Admin)
    enabled BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 10,
    
    timeout_seconds INTEGER DEFAULT 5,
    retry_max_attempts INTEGER DEFAULT 3,
    health_status VARCHAR(20),
    last_health_check_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);
```

**Índices:**
- `idx_provider_catalog_type_enabled` → Para queries por tipo
- `idx_provider_catalog_priority` → Para fallback chain
- `idx_provider_catalog_mulesoft_id` → Para lookups rápidos

---

## ⏰ Scheduled Tasks

### **1. Provider Sync**
- **Frecuencia:** Cada 5 minutos (`@Scheduled(fixedRate = 300000)`)
- **Acción:** Consulta MuleSoft, actualiza catálogo local
- **Log:**
  ```log
  INFO ProviderSyncService - Starting MuleSoft provider sync...
  INFO ProviderSyncService - Found 4 providers in MuleSoft
  INFO ProviderSyncService - Sync completed: 4 providers
  ```

### **2. Health Check**
- **Frecuencia:** Cada 1 minuto (`@Scheduled(fixedRate = 60000)`)
- **Acción:** Verifica salud de providers habilitados
- **Log:**
  ```log
  DEBUG ProviderSyncService - Starting health check for enabled providers...
  DEBUG ProviderSyncService - Provider Twilio SMS España: healthy (latency: 45ms)
  ```

---

## 🔄 Flujo de Fallback

```java
// Ejemplo: Enviar SMS con fallback automático

Providers habilitados (ordenados por priority):
  1. Twilio SMS (priority 1)
  2. AWS SNS (priority 2)

// Intento 1: Twilio
try {
  response = muleSoftClient.sendChallenge("twilio-sms", code, phone);
  return ProviderResult.success();
} catch (Exception e) {
  log.warn("Twilio failed, trying fallback...");
}

// Intento 2: AWS SNS (fallback automático)
try {
  response = muleSoftClient.sendChallenge("aws-sns", code, phone);
  return ProviderResult.successAfterFallback();
} catch (Exception e) {
  log.error("All providers failed");
  throw new AllProvidersFailedException();
}
```

---

## 🎨 Admin Portal UI (Mockup)

```
┌────────────────────────────────────────────────────────┐
│  Provider Management                  [🔄 Sync MuleSoft]│
├────────────────────────────────────────────────────────┤
│                                                        │
│  📱 SMS Providers                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Twilio SMS España                                 │ │
│  │ Endpoint: /api/v1/signature/sms/twilio           │ │
│  │ MuleSoft: 🟢 available  Health: 🟢 healthy       │ │
│  │                                                   │ │
│  │ Enabled: [●─────] ON                             │ │
│  │ Priority: [───●───] 1  ↑↓                        │ │
│  │ Last sync: 2025-12-05 10:30:00                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ AWS SNS España                                    │ │
│  │ Endpoint: /api/v1/signature/sms/aws-sns          │ │
│  │ MuleSoft: 🟢 configured  Health: 🟢 healthy      │ │
│  │                                                   │ │
│  │ Enabled: [●─────] ON                             │ │
│  │ Priority: [─────●─] 2  ↑↓                        │ │
│  │ Last sync: 2025-12-05 10:30:00                   │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Success Metrics

| Métrica | Target | Cómo Medir |
|---------|--------|------------|
| Providers sincronizados | 100% | `SELECT COUNT(*) FROM provider_catalog` |
| Latencia de sync | < 5s | Prometheus: `provider_sync_duration_seconds{p95}` |
| Health check accuracy | > 99% | `(healthy / total) * 100` |
| Fallback success rate | > 95% | `(fallback_success / fallback_attempts) * 100` |
| Admin UI response time | < 500ms | Browser DevTools Network |

---

## 🚀 Timeline

| Fecha | Milestone | Owner |
|-------|-----------|-------|
| **2025-12-05** | ✅ Documentación completa | PM + Architect |
| **2025-12-06** | ⏳ Kick-off meeting | PM + MuleSoft Team + Dev Team |
| **2025-12-09** | ⏳ MuleSoft sandbox + credenciales | MuleSoft Team |
| **2025-12-09-13** | ⏳ Semana 1: Backend (Stories 13.1-13.4) | Backend Team |
| **2025-12-16-20** | ⏳ Semana 2: Frontend + Testing (13.5-13.6) | Frontend Team + QA |
| **2025-12-20** | ⏳ Deployment a UAT | DevOps |
| **2025-12-23** | ⏳ UAT validation + Go-live PRD | QA + PM |

---

## ✅ Checklist Pre-Kick-off

### **Preparación:**
- [x] Documentación Epic 13 completa
- [x] Diagramas de arquitectura creados
- [x] Stories definidas con acceptance criteria
- [x] Estimación de esfuerzo realizada
- [ ] Invitaciones a kick-off enviadas
- [ ] Agenda de kick-off preparada

### **Pendiente de MuleSoft Team:**
- [ ] Documentación OpenAPI/Swagger de APIs
- [ ] Credenciales OAuth2 (client_id, client_secret)
- [ ] Sandbox environment URL
- [ ] SLA de respuesta de endpoints
- [ ] Rate limiting info

### **Pendiente de DevOps:**
- [ ] Vault path para credenciales MuleSoft
- [ ] Variables de entorno configuradas
- [ ] Whitelisting de IPs (si aplica)
- [ ] Secret management strategy (K8S)

---

## ❓ Preguntas para Kick-off Meeting

### **Para MuleSoft Team:**
1. ¿Cuándo estará disponible el sandbox environment?
2. ¿Cómo obtenemos las credenciales OAuth2?
3. ¿Existe documentación OpenAPI/Swagger?
4. ¿Cuál es el SLA de respuesta de los endpoints?
5. ¿Hay rate limiting? ¿Límite de requests/min?
6. ¿Los health checks están implementados?
7. ¿Qué providers están actualmente configurados?

### **Para Backend Team:**
1. ¿Necesitamos algún cambio en la estructura de BD actual?
2. ¿Tenemos experiencia con @Scheduled tasks en el proyecto?
3. ¿Hay algún client REST reutilizable o creamos uno nuevo?

### **Para Frontend Team:**
1. ¿La UI de providers encaja en el diseño actual del Admin Portal?
2. ¿Necesitamos nuevos componentes UI o reutilizamos existentes?

### **Para DevOps:**
1. ¿Cómo gestionamos secrets en K8S?
2. ¿Necesitamos whitelisting de IPs para MuleSoft?
3. ¿Prometheus/Grafana están configurados para nuevas métricas?

---

## 📝 Próximos Pasos

1. **Hoy (5 dic):** ✅ Documentación completada
2. **Mañana (6 dic):** Kick-off meeting
   - **Asistentes:** PM, MuleSoft Team, Backend Lead, Frontend Lead, QA Lead, DevOps Lead
   - **Duración:** 1 hora
   - **Agenda:**
     1. Presentación de Epic 13 (10 min) - PM
     2. Review de arquitectura (15 min) - Architect
     3. MuleSoft APIs (15 min) - MuleSoft Team
     4. Q&A y acuerdos (20 min) - Todos
3. **9 dic:** Inicio implementación Semana 1

---

## 🔗 Links Útiles

- [Epic Completo](./epics/epic-13-providers-mulesoft-integration.md)
- [Resumen Ejecutivo](./EPIC-13-MULESOFT-RESUMEN.md)
- [Diagramas de Arquitectura](./diagrams/epic-13-mulesoft-architecture.md)
- [Setup Guide](./setup/EPIC-13-MULESOFT-SETUP.md)
- [Documentation Index](./EPIC-13-DOCUMENTATION-INDEX.md)
- [Tareas Pendientes](./TAREAS-PENDIENTES.md) (actualizado con Epic 13)

---

**Documento creado:** 5 de diciembre de 2025  
**Autor:** AI Assistant + Product Manager  
**Status:** ✅ Ready for Kick-off  
**Próxima Acción:** Enviar invitaciones a kick-off meeting (6 dic 2025)
