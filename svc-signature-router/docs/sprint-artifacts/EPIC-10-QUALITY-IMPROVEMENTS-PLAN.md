# Epic 10: Quality Improvements & Technical Debt - Sprint Plan

**Fecha de Creación:** 29 de Noviembre de 2025  
**Basado en:** Evaluación de Calidad del Proyecto (28-Nov-2025)  
**Estado Actual del Proyecto:** 7.5/10  
**Objetivo:** 9.0/10  
**Bloqueador de Producción:** ✅ SÍ - Debe completarse antes de deployment

---

## 📋 Resumen Ejecutivo

La evaluación de calidad identificó **3 problemas críticos** y **12 mejoras importantes** que deben resolverse antes del deployment a producción bancaria.

### Problemas Críticos 🔴

1. **Testing Coverage Insuficiente** (14% → 75%)
   - Impacto: Alto riesgo de bugs en producción
   - Esfuerzo: 18 SP
   
2. **Idempotencia No Funcional**
   - Impacto: Doble procesamiento, doble costo
   - Esfuerzo: 5 SP
   
3. **SpEL Injection Vulnerability**
   - Impacto: Security risk crítico
   - Esfuerzo: 5 SP

### Roadmap de Implementación

```
Sprint 1-2  →  Sprint 3-4  →  Sprint 5-6  →  Sprint 7-8
  (Crítico)     (Crítico)     (Importante)  (Optimización)
     28 SP         18 SP         29 SP          13 SP
```

**Total:** 15 stories, 73 SP, 8-10 sprints (6-8 semanas)

---

## 🎯 Sprint Breakdown

### Sprint 1: Foundation & Security (14 SP)

**Objetivo:** Resolver vulnerabilidades críticas y establecer base de testing

#### Stories:
1. **Story 10.1: ArchUnit Tests** (3 SP)
   - Validación arquitectural automatizada
   - Prevenir violaciones de capas hexagonales
   - Integrar en CI/CD pipeline
   
2. **Story 10.5: Idempotencia Funcional** (5 SP) 🔴 CRÍTICO
   - Implementar `IdempotencyService`
   - Tabla `idempotency_record` con TTL 24h
   - Cache de responses
   - Prevenir doble procesamiento
   
3. **Story 10.6: SpEL Security** (5 SP) 🔴 CRÍTICO
   - Whitelist TypeLocator
   - Validación pre-persistencia
   - Security audit de reglas existentes
   - Documentar SpEL safe practices

4. **Story 10.12: TODO Cleanup** (1 SP)
   - Inventariar TODOs
   - Crear tickets en backlog
   - Decisión sobre providers temporales

**Deliverables:**
- ✅ Sistema seguro contra SpEL injection
- ✅ Idempotencia funcional (no más duplicados)
- ✅ ArchUnit validando arquitectura
- ✅ Deuda técnica catalogada

---

### Sprint 2: Domain & Use Case Testing (14 SP)

**Objetivo:** Alcanzar >75% coverage en capas críticas

#### Stories:
1. **Story 10.2: Domain Layer Tests** (5 SP) 🔴 CRÍTICO
   - `SignatureRequestTest` (95% coverage)
   - `ChallengeTest` (90% coverage)
   - Value Objects (100% coverage)
   - Tests de reglas de negocio
   
2. **Story 10.3: Use Case Tests** (5 SP) 🔴 CRÍTICO
   - `StartSignatureUseCaseImplTest`
   - `CompleteSignatureUseCaseImplTest`
   - `EvaluateRoutingUseCaseImplTest`
   - Mocks de ports con Mockito
   
3. **Story 10.11: Exception Handling** (3 SP)
   - Logging contextual en controllers
   - Error codes catalog
   - I18N (español/inglés)
   - GlobalExceptionHandler mejorado

4. **Story 10.15: Database Constraints** (1 SP)
   - CHECK constraints para enums
   - Foreign keys
   - GIN indexes para JSONB
   - Tests de integridad

**Deliverables:**
- ✅ Domain layer >90% coverage
- ✅ Application layer >85% coverage
- ✅ Error handling robusto
- ✅ Database integrity garantizada

**Checkpoint:** Coverage report debe mostrar >75% antes de continuar

---

### Sprint 3: Integration Testing (8 SP)

**Objetivo:** Validar adapters con infraestructura real

#### Stories:
1. **Story 10.4: Testcontainers Integration** (8 SP) 🔴 CRÍTICO
   - PostgreSQL container tests
   - Kafka + Schema Registry tests
   - WireMock para providers
   - Round-trip serialization tests

**Deliverables:**
- ✅ Infrastructure layer >70% coverage
- ✅ Tests ejecutan en CI pipeline
- ✅ Containers optimizados (<30s startup)

**Checkpoint:** CI pipeline verde con todos los tests

---

### Sprint 4: Observability Foundation (8 SP)

**Objetivo:** Habilitar debugging en producción

#### Stories:
1. **Story 10.7: Distributed Tracing** (5 SP) 🟡 IMPORTANTE
   - OpenTelemetry + Jaeger
   - Spans automáticos (controller, use cases, providers)
   - Trace ID en logs
   - Grafana dashboard con trace stats
   
2. **Story 10.8: MDC Logging** (3 SP)
   - Logstash JSON encoder
   - MDC context (traceId, customerId, operation)
   - RequestLoggingFilter
   - GDPR-compliant logging

**Deliverables:**
- ✅ End-to-end tracing visible en Jaeger
- ✅ Logs estructurados con contexto enriquecido
- ✅ Troubleshooting mejorado

---

### Sprint 5: Scalability & Performance (8 SP)

**Objetivo:** Preparar sistema para millones de registros

#### Stories:
1. **Story 10.9: Database Partitioning** (5 SP) 🟡 IMPORTANTE
   - Particionamiento RANGE por `created_at`
   - Particiones mensuales automáticas
   - Retention policy (90 días)
   - Performance tests con 10M filas
   
2. **Story 10.13: Rate Limiting** (3 SP)
   - Global: 100 req/s
   - Per-customer: 10 req/min
   - Redis distributed limiter
   - Headers `X-RateLimit-*`

**Deliverables:**
- ✅ DB performance garantizada a escala
- ✅ Protection contra abuso

---

### Sprint 6: GDPR Compliance (8 SP)

**Objetivo:** Cumplir regulaciones de privacidad

#### Stories:
1. **Story 10.10: Right to Erasure** (8 SP) 🟡 IMPORTANTE
   - Endpoint DELETE customer data
   - Anonymization (no physical delete)
   - Data export (Right to Access)
   - Audit trail de eliminaciones
   - Customer ID mapping table

**Deliverables:**
- ✅ GDPR Article 17 compliance
- ✅ Audit trail completo
- ✅ Data export funcional

---

### Sprint 7: Production Hardening (5 SP)

**Objetivo:** Finalizar preparación para producción

#### Stories:
1. **Story 10.14: Secrets Rotation** (5 SP)
   - Vault auto-rotation (90 días)
   - Spring Cloud Vault `@RefreshScope`
   - Grace period (7 días)
   - Alerting si rotation falla

**Deliverables:**
- ✅ Secrets rotation automatizada
- ✅ Zero-downtime rotation
- ✅ Security policy compliance

---

## 📊 Métricas de Éxito

### Antes de Epic 10

| Métrica | Valor Actual | Target |
|---------|--------------|--------|
| Test Coverage | 14% | 75% |
| Tests Count | 24 | 150+ |
| Security Vulnerabilities | 1 (SpEL) | 0 |
| Idempotencia | ❌ No funcional | ✅ Funcional |
| Distributed Tracing | ❌ No | ✅ Jaeger |
| GDPR Compliance | ⚠️ Parcial | ✅ Completo |
| DB Partitioning | ❌ No | ✅ Sí |
| Rate Limiting | ⚠️ Básico | ✅ Granular |
| Calificación General | 7.5/10 | 9.0/10 |

### Después de Epic 10 (Proyectado)

| Dimensión | Score Before | Score After | Δ |
|-----------|--------------|-------------|---|
| Calidad del Código | 7/10 | 8.5/10 | +1.5 |
| Arquitectura | 8/10 | 9/10 | +1.0 |
| Planteamiento Funcional | 7/10 | 9/10 | +2.0 |
| **TOTAL** | **7.5/10** | **9.0/10** | **+1.5** ⭐ |

---

## 🚦 Definition of Ready (DoR)

Antes de iniciar cada story:

- [ ] Acceptance Criteria claros y medibles
- [ ] Dependencias técnicas identificadas
- [ ] Tests approach definido
- [ ] Estimación validada por equipo
- [ ] Prioridad confirmada

---

## ✅ Definition of Done (DoD)

Para considerar story completada:

- [ ] Código implementado según AC
- [ ] Tests unitarios/integración passing (>75% coverage)
- [ ] Code review aprobado (2+ approvals)
- [ ] Documentación actualizada (README, ADR, etc.)
- [ ] CI/CD pipeline verde
- [ ] No linter errors
- [ ] Performance validada (no regresión)
- [ ] Security review si aplica

---

## 🔄 Sprint Ceremonies

### Sprint Planning (cada 2 semanas)
- Seleccionar stories de Epic 10
- Estimar con Planning Poker
- Asignar ownership
- Identificar blockers

### Daily Standup (diario, 15 min)
- ¿Qué hice ayer?
- ¿Qué haré hoy?
- ¿Impedimentos?

### Sprint Review (fin de sprint)
- Demo de stories completadas
- Validar AC cumplidos
- Feedback de stakeholders

### Sprint Retrospective (fin de sprint)
- ¿Qué salió bien?
- ¿Qué mejorar?
- Action items para siguiente sprint

---

## 🎯 Prioridades por Fase

### Fase 1: Críticos (Sprint 1-3) 🔴

**NO SE PUEDE IR A PRODUCCIÓN SIN ESTO**

- ✅ Testing coverage >75%
- ✅ Idempotencia funcional
- ✅ SpEL security fix
- ✅ ArchUnit validación

**Criterio de Aceptación Fase 1:**
- [ ] CI pipeline verde con >75% coverage
- [ ] Zero security vulnerabilities
- [ ] Idempotencia probada con load tests
- [ ] ArchUnit integrado en build

---

### Fase 2: Importantes (Sprint 4-6) 🟡

**MEJORA SIGNIFICATIVA DE CALIDAD**

- ✅ Distributed tracing
- ✅ DB partitioning
- ✅ GDPR compliance

**Criterio de Aceptación Fase 2:**
- [ ] Traces visibles en Jaeger
- [ ] DB performance tests con 10M filas
- [ ] GDPR endpoints funcionales

---

### Fase 3: Optimizaciones (Sprint 7-8) 🟢

**PRODUCTION HARDENING**

- ✅ MDC logging
- ✅ Rate limiting
- ✅ Secrets rotation
- ✅ Exception handling

**Criterio de Aceptación Fase 3:**
- [ ] Logs estructurados en producción
- [ ] Rate limiting probado bajo carga
- [ ] Secrets rotation automática

---

## 📝 Tracking

### GitHub Project Board

```
TODO (31)          IN PROGRESS (2)      REVIEW (1)        DONE (0)
┌─────────────┐    ┌────────────┐    ┌──────────┐    ┌─────────┐
│ Story 10.3  │    │ Story 10.1 │    │Story 10.5│    │         │
│ Story 10.4  │    │ Story 10.6 │    │          │    │         │
│ Story 10.7  │    │            │    │          │    │         │
│ ...         │    │            │    │          │    │         │
└─────────────┘    └────────────┘    └──────────┘    └─────────┘
```

### Velocity Tracking

**Sprint Velocity Target:** 14 SP/sprint (2 weeks)

| Sprint | Planned | Completed | Velocity | Burndown |
|--------|---------|-----------|----------|----------|
| Sprint 1 | 14 SP | - | - | 73 SP |
| Sprint 2 | 14 SP | - | - | 59 SP |
| Sprint 3 | 8 SP | - | - | 51 SP |
| Sprint 4 | 8 SP | - | - | 43 SP |
| Sprint 5 | 8 SP | - | - | 35 SP |
| Sprint 6 | 8 SP | - | - | 27 SP |
| Sprint 7 | 5 SP | - | - | 22 SP |
| Sprint 8 | - | - | - | 0 SP ✅ |

---

## 🚨 Riesgos e Impedimentos

### Riesgo 1: Testing Coverage Target Muy Ambicioso
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:** Priorizar domain + use cases primero (core business logic)
- **Contingencia:** Aceptar 65% si >75% no alcanzable en tiempo

### Riesgo 2: Testcontainers Lento en CI
- **Probabilidad:** Media
- **Impacto:** Medio (builds lentos)
- **Mitigación:** Optimizar container caching, parallel test execution
- **Contingencia:** Separar integration tests en pipeline nocturno

### Riesgo 3: DB Partitioning Requiere Downtime
- **Probabilidad:** Baja
- **Impacto:** Alto
- **Mitigación:** Ejecutar migration en ventana de mantenimiento
- **Contingencia:** Blue-green deployment

### Riesgo 4: SpEL Security Fix Rompe Reglas Existentes
- **Probabilidad:** Alta
- **Impacto:** Medio
- **Mitigación:** Security audit pre-deployment, whitelisting gradual
- **Contingencia:** Feature flag para habilitar validación estricta

---

## 📚 Referencias

### Documentos Base
- [Evaluación de Calidad - 28 Nov 2025](../Evaluación_de_Calidad_del_Proyecto_Signature_Router.md)
- [Epic Breakdown](../epics.md)
- [PRD Original](../prd.md)
- [Architecture Docs](../architecture/)

### External Resources
- [ArchUnit User Guide](https://www.archunit.org/userguide/html/000_Index.html)
- [Testcontainers Best Practices](https://www.testcontainers.org/)
- [OpenTelemetry Java](https://opentelemetry.io/docs/instrumentation/java/)
- [GDPR Article 17](https://gdpr-info.eu/art-17-gdpr/)

---

## 🎓 Aprendizajes y Mejora Continua

### Post-Epic Retrospective

**Preguntas clave:**
1. ¿Alcanzamos 9.0/10 en calidad?
2. ¿Testing coverage >75% fue realista?
3. ¿Qué pattern de testing funcionó mejor?
4. ¿Security audit encontró otras vulnerabilidades?
5. ¿Performance mejoró con partitioning?

**Action Items para Futuros Proyectos:**
- Implementar ArchUnit desde Sprint 1 (no después)
- Idempotencia como requirement desde diseño
- SpEL security review en architectural design
- Testing strategy definida en Epic 1

---

## ✅ Go/No-Go Checklist (Pre-Producción)

**TODOS deben estar ✅ antes de deployment a producción bancaria**

### Críticos 🔴
- [ ] Testing coverage >75% (JaCoCo report)
- [ ] Zero critical security vulnerabilities (Snyk scan)
- [ ] Idempotencia probada con load test (10K req/s, 0% duplicates)
- [ ] SpEL whitelist implementado y auditado
- [ ] ArchUnit tests passing en CI

### Importantes 🟡
- [ ] Distributed tracing funcional (Jaeger UI accessible)
- [ ] DB partitioning configurado (3 meses de partitions)
- [ ] GDPR endpoints testeados (delete + export)
- [ ] MDC logging en todos los controllers
- [ ] Rate limiting funcional (global + per-customer)

### Deseables 🟢
- [ ] Secrets rotation configurada (Vault)
- [ ] Database constraints aplicados
- [ ] Exception handling con error codes
- [ ] TODO cleanup completado

---

**Última Actualización:** 29 de Noviembre de 2025  
**Responsable:** Tech Lead / Engineering Manager  
**Next Review:** Al finalizar cada sprint

---

_Documento creado como parte de Epic 10: Quality Improvements & Technical Debt_  
_Basado en metodología BMAD - Banking Modern Application Development_


