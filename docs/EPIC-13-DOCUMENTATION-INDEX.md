# Epic 13: MuleSoft Integration - Documentation Index

**Fecha de Creación:** 5 de diciembre de 2025  
**Status:** 📋 Planificación Completa  
**Próximo Paso:** Kick-off Meeting

---

## 📚 Documentación Disponible

### **1. Epic Completo** 📖
**Archivo:** [`docs/epics/epic-13-providers-mulesoft-integration.md`](./epics/epic-13-providers-mulesoft-integration.md)

**Contenido:**
- ✅ Resumen ejecutivo
- ✅ Arquitectura detallada
- ✅ 6 User Stories completas con acceptance criteria
- ✅ Estimación de esfuerzo (2 semanas)
- ✅ Estrategia de implementación
- ✅ Security considerations
- ✅ Success metrics

**Audiencia:** Product Manager, Tech Lead, Developers

---

### **2. Resumen Ejecutivo** 📊
**Archivo:** [`docs/EPIC-13-MULESOFT-RESUMEN.md`](./EPIC-13-MULESOFT-RESUMEN.md)

**Contenido:**
- ✅ Diferencia clave vs versión anterior (CRUD vs Sync)
- ✅ Arquitectura simplificada (diagrama)
- ✅ Funcionalidades principales
- ✅ Stories resumidas con effort
- ✅ Preview del Admin Portal UI
- ✅ MuleSoft APIs requeridas
- ✅ Plan de implementación (2 semanas)
- ✅ Testing strategy
- ✅ Checklist pre-deployment
- ✅ FAQs

**Audiencia:** Stakeholders, Product Manager, Business Analysts

---

### **3. Diagramas de Arquitectura** 🏗️
**Archivo:** [`docs/diagrams/epic-13-mulesoft-architecture.md`](./diagrams/epic-13-mulesoft-architecture.md)

**Contenido:**
- ✅ Arquitectura general (Mermaid)
- ✅ Flujo de sincronización (Sequence diagram)
- ✅ Flujo de health check (Sequence diagram)
- ✅ Flujo de envío con fallback (Flowchart)
- ✅ Admin UI user flow (Flowchart)
- ✅ Database schema (ERD)
- ✅ Security flow (Sequence diagram)
- ✅ Component interaction (Graph)
- ✅ Deployment architecture (K8S)
- ✅ Provider lifecycle (State diagram)
- ✅ Data flow (Flowchart)

**Audiencia:** Architects, Developers, DevOps

---

### **4. Setup & Configuration Guide** 🔧
**Archivo:** [`docs/setup/EPIC-13-MULESOFT-SETUP.md`](./setup/EPIC-13-MULESOFT-SETUP.md)

**Contenido:**
- ✅ Variables de entorno (obligatorias y opcionales)
- ✅ MuleSoft configuration (application.yml)
- ✅ Database setup (migrations, verification)
- ✅ Scheduled tasks (sync, health checks)
- ✅ Health checks (Actuator endpoints)
- ✅ Troubleshooting guide (5+ problemas comunes)
- ✅ Monitoring (Grafana dashboards, Prometheus alerts)
- ✅ Testing setup (WireMock, integration tests)
- ✅ Deployment checklist

**Audiencia:** DevOps, Backend Developers, QA

---

## 🎯 Cambio de Enfoque: CRUD → Sync

### ❌ **Versión Anterior (epic-13-providers-crud-management.md)**

```
Admin crea providers manualmente
    ↓
Configuración almacenada en BD
    ↓
Credenciales en Vault gestionadas por Signature Router
    ↓
Provider listo para usar
```

**Problemas:**
- Duplicación de configuración (MuleSoft + Signature Router)
- Governance complejo (¿quién es source of truth?)
- Admin debe conocer detalles técnicos de cada provider

---

### ✅ **Versión Nueva (epic-13-providers-mulesoft-integration.md)**

```
MuleSoft configura providers
    ↓
Signature Router sincroniza catálogo automáticamente
    ↓
Admin solo habilita/deshabilita y configura prioridades
    ↓
Provider listo para usar
```

**Ventajas:**
- ✅ Single source of truth: MuleSoft
- ✅ Governance centralizado
- ✅ Admin solo gestiona qué usar, no cómo configurar
- ✅ Credenciales manejadas por MuleSoft (más seguro)
- ✅ Nuevos providers auto-detectados

---

## 📋 User Stories Resumen

| # | Story | Effort | Descripción |
|---|-------|--------|-------------|
| **13.1** | Database Schema | 0.5 días | Tabla `provider_catalog` |
| **13.2** | MuleSoft Client | 2 días | Cliente REST + OAuth2 |
| **13.3** | Sync Service | 1.5 días | Sincronización automática + health checks |
| **13.4** | REST API | 1.5 días | Endpoints para Admin Portal |
| **13.5** | Admin UI | 2 días | Interfaz gráfica Next.js |
| **13.6** | Fallback Logic | 1.5 días | Selección + fallback automático |

**Total:** 9 días implementación + 1.5 días testing/docs = **2 semanas**

---

## 🔌 MuleSoft APIs Requeridas

### **1. List Providers**
```http
GET /api/v1/signature/providers
```

### **2. Health Check**
```http
GET /api/v1/signature/providers/{id}/health
```

### **3. Send Challenge**
```http
POST /api/v1/signature/providers/{id}/send
```

**Nota:** Coordinar con MuleSoft Team para obtener:
- Documentación OpenAPI/Swagger
- Credenciales OAuth2 (client_id, client_secret)
- Sandbox environment para testing

---

## 🗄️ Database Schema

### **Tabla Principal: `provider_catalog`**

```sql
CREATE TABLE provider_catalog (
    id UUID PRIMARY KEY,
    mulesoft_provider_id VARCHAR(100) UNIQUE,  -- ID en MuleSoft
    provider_name VARCHAR(100),
    provider_type VARCHAR(20),  -- SMS, PUSH, VOICE, BIOMETRIC
    mulesoft_endpoint VARCHAR(500),
    mulesoft_status VARCHAR(20),  -- available, configured, down
    
    -- Local config (controlado por Admin)
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

---

## 🚀 Implementation Plan

### **Semana 1: Backend Foundation**

**Lunes-Martes (Días 1-2)**
- Story 13.1: Database schema + migration
- Story 13.2: MuleSoft client (partial)

**Miércoles-Jueves (Días 3-4)**
- Story 13.2: MuleSoft client (complete)
- Story 13.3: Sync service

**Viernes (Día 5)**
- Story 13.4: REST API endpoints
- Testing integration con MuleSoft sandbox

---

### **Semana 2: UI + Finalización**

**Lunes-Martes (Días 1-2)**
- Story 13.5: Admin Portal UI

**Miércoles (Día 3)**
- Story 13.6: Fallback logic

**Jueves (Día 4)**
- Testing E2E
- Bug fixing

**Viernes (Día 5)**
- Documentation
- Deployment to UAT

---

## ✅ Acceptance Criteria (Epic Level)

```gherkin
Given MuleSoft tiene providers configurados
When se despliega Epic 13
Then:
  ✅ Catálogo se sincroniza automáticamente cada 5 minutos
  ✅ Admin puede ver todos los providers desde MuleSoft
  ✅ Admin puede habilitar/deshabilitar providers localmente
  ✅ Admin puede configurar prioridades de fallback
  ✅ Sistema usa fallback automático si un provider falla
  ✅ Health checks se ejecutan cada 1 minuto para providers habilitados
  ✅ UI muestra estado en tiempo real (MuleSoft + local + health)
  ✅ No se requiere reiniciar servicio para cambios
```

---

## 🧪 Testing Strategy

### **Unit Tests**
```bash
# MuleSoft client
MuleSoftProviderClientTest
- testListProvidersSuccess()
- testListProvidersTimeout()
- testHealthCheckSuccess()
- testHealthCheckUnhealthy()
- testSendChallengeSuccess()

# Sync service
ProviderSyncServiceTest
- testSyncNewProvider()
- testSyncExistingProvider()
- testHealthCheckEnabledProviders()

# Selection service
ProviderSelectionServiceTest
- testSelectProviderByPriority()
- testFallbackWhenPrimaryFails()
- testAllProvidersFailedException()
```

### **Integration Tests**
```bash
# Database
ProviderCatalogRepositoryIT
- testFindByMuleSoftProviderId()
- testFindByTypeEnabledOrderByPriority()

# MuleSoft (con WireMock)
MuleSoftIntegrationIT
- testSyncFromMuleSoftSandbox()
- testHealthCheckAgainstMuleSoft()
```

### **E2E Tests (Cypress)**
```javascript
// Admin Portal
describe('Provider Management', () => {
  it('should list providers from MuleSoft')
  it('should enable provider')
  it('should disable provider')
  it('should update priority')
  it('should sync manually')
})
```

---

## 📊 Success Metrics

| Métrica | Target | Medición |
|---------|--------|----------|
| Providers sincronizados | 100% | `SELECT COUNT(*) FROM provider_catalog` |
| Latencia de sync | < 5s | Prometheus: `provider_sync_duration_seconds{quantile="0.95"}` |
| Health check accuracy | > 99% | `(healthy_checks / total_checks) * 100` |
| Fallback success rate | > 95% | `(fallback_success / total_fallback_attempts) * 100` |
| Admin UI response time | < 500ms | Browser DevTools Network tab |

---

## 🔒 Security Checklist

- [ ] MuleSoft credenciales almacenadas en Vault (no en código)
- [ ] OAuth2 token refresh implementado
- [ ] RBAC: Solo rol ADMIN puede gestionar providers
- [ ] Audit log: Registrar quién habilita/deshabilita providers
- [ ] HTTPS: Todas las comunicaciones con MuleSoft encriptadas
- [ ] Rate limiting en MuleSoft client (evitar DDoS accidental)

---

## 📞 Stakeholders

| Rol | Responsable | Email | Acción Requerida |
|-----|-------------|-------|------------------|
| **MuleSoft Team** | TBD | mulesoft@singular.com | Proveer APIs, credenciales, documentación |
| **Backend Lead** | TBD | backend@singular.com | Implementar Stories 13.1-13.4, 13.6 |
| **Frontend Lead** | TBD | frontend@singular.com | Implementar Story 13.5 (Admin UI) |
| **QA Lead** | TBD | qa@singular.com | Testing E2E, validación UAT |
| **DevOps Lead** | TBD | devops@singular.com | Deployment, variables de entorno |
| **Security Team** | TBD | security@singular.com | Review de OAuth2, credenciales |

---

## 🔗 Links Rápidos

### **Documentación Interna**
- [Epic 12: Provider Management (Read-Only)](./epics/epic-12-provider-management.md)
- [Architecture Decision Records](./architecture/ADR-013-mulesoft-integration.md)
- [Database Migrations Guide](./development/database-migrations.md)

### **External Resources**
- [MuleSoft API Documentation](https://mulesoft.singular.com/api-docs) *(pendiente)*
- [OAuth2 Client Credentials Flow](https://oauth.net/2/grant-types/client-credentials/)
- [Spring @Scheduled Documentation](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)

---

## 📅 Timeline

| Fecha | Milestone |
|-------|-----------|
| **2025-12-05** | 📋 Documentación completa |
| **2025-12-06** | 🎯 Kick-off meeting con MuleSoft Team |
| **2025-12-09** | 🔧 MuleSoft sandbox disponible + credenciales |
| **2025-12-09-13** | 💻 Semana 1: Backend implementation |
| **2025-12-16-20** | 🎨 Semana 2: Frontend + testing |
| **2025-12-20** | 🚀 Deployment a UAT |
| **2025-12-23** | ✅ UAT validation + go-live PRD |

---

## ❓ Preguntas Pendientes

### **Para MuleSoft Team:**
1. ¿Cuándo estará disponible el sandbox environment?
2. ¿Cómo obtenemos las credenciales OAuth2 (client_id, client_secret)?
3. ¿Existe documentación OpenAPI/Swagger de las APIs?
4. ¿Cuál es el SLA de respuesta de los endpoints?
5. ¿Hay rate limiting? ¿Cuál es el límite?

### **Para DevOps:**
1. ¿En qué Vault path se almacenarán las credenciales de MuleSoft?
2. ¿Necesitamos whitelisting de IPs para acceder a MuleSoft?
3. ¿Cómo se gestionarán los secrets en K8S (Sealed Secrets, External Secrets)?

### **Para Security:**
1. ¿OAuth2 client credentials es suficiente o necesitamos mutual TLS?
2. ¿Necesitamos audit log de todas las llamadas a MuleSoft?

---

## 📝 Próximos Pasos

1. ✅ **Hoy (2025-12-05):** Documentación completada
2. ⏳ **Mañana (2025-12-06):** Kick-off meeting
   - Invitar: MuleSoft Team, Backend Lead, Frontend Lead, QA, DevOps
   - Agenda: Review de arquitectura, APIs, credenciales, timeline
3. ⏳ **2025-12-09:** Inicio de implementación (Semana 1)

---

**Documento creado:** 5 de diciembre de 2025  
**Última actualización:** 5 de diciembre de 2025  
**Owner:** Product Manager  
**Status:** 📋 Planificación Completa → ⏳ Esperando Kick-off
