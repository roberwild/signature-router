# ✅ Epic 10: Quality Improvements - Checklist

**Versión:** 1.0  
**Última Actualización:** 29-Nov-2025  
**Uso:** Checklist rápido para tracking de Epic 10

---

## 🔴 Fase 1: Problemas Críticos (Sprint 1-3)

### Sprint 1: Security & Foundation (2 semanas)

- [ ] **Story 10.1: ArchUnit Tests** (3 SP)
  - [ ] Crear `HexagonalArchitectureTest.java`
  - [ ] 8+ reglas ArchUnit implementadas
  - [ ] Tests pasan en codebase actual
  - [ ] Integrado en Maven build (falla si viola)
  - [ ] Documentado en README.md

- [ ] **Story 10.5: Idempotencia Funcional** (5 SP) 🔴 CRÍTICO
  - [ ] Tabla `idempotency_record` creada (Liquibase)
  - [ ] `IdempotencyService` implementado
  - [ ] Controller integrado (POST /signatures)
  - [ ] Tests: duplicate key → cached response
  - [ ] Tests: key conflict → HTTP 409
  - [ ] Job cleanup registros expirados (>24h)

- [ ] **Story 10.6: SpEL Security** (5 SP) 🔴 CRÍTICO
  - [ ] `SpelValidatorService` con whitelist
  - [ ] Validación en `CreateRoutingRuleUseCase`
  - [ ] Tests: reglas maliciosas → rechazadas
  - [ ] Security audit de reglas existentes
  - [ ] Documentado en SECURITY.md

- [ ] **Story 10.12: TODO Cleanup** (1 SP)
  - [ ] Inventario de TODOs (tech-debt-inventory.txt)
  - [ ] Tickets creados para TODOs válidos
  - [ ] TODOs obsoletos eliminados
  - [ ] Decisión sobre providers temporales
  - [ ] Backlog priorizado

**Sprint 1 Goal:** ✅ Sistema seguro, arquitectura validada, deuda técnica catalogada

---

### Sprint 2: Domain & Use Case Testing (2 semanas)

- [ ] **Story 10.2: Domain Layer Tests** (5 SP) 🔴 CRÍTICO
  - [ ] `SignatureRequestTest.java` (95%+ coverage)
    - [ ] Test: crear challenge
    - [ ] Test: solo 1 challenge activo
    - [ ] Test: transiciones de estado
    - [ ] Test: expiración por TTL
    - [ ] Test: abortar signature
  - [ ] `ChallengeTest.java` (90%+ coverage)
    - [ ] Test: crear con código generado
    - [ ] Test: validar código correcto/incorrecto
    - [ ] Test: expirar por timeout
    - [ ] Test: estados SENT/COMPLETED/FAILED
  - [ ] Value Objects (100% coverage)
  - [ ] JaCoCo report: Domain >90%

- [ ] **Story 10.3: Use Case Tests** (5 SP) 🔴 CRÍTICO
  - [ ] `StartSignatureUseCaseImplTest`
    - [ ] Test: happy path
    - [ ] Test: idempotencia
    - [ ] Test: validación input
  - [ ] `CompleteSignatureUseCaseImplTest`
    - [ ] Test: código correcto → SIGNED
    - [ ] Test: código incorrecto → error
    - [ ] Test: challenge expirado → exception
  - [ ] `EvaluateRoutingUseCaseImplTest`
    - [ ] Test: SpEL match
    - [ ] Test: prioridad
    - [ ] Test: default
  - [ ] Coverage: Application layer >85%

- [ ] **Story 10.11: Exception Handling** (3 SP)
  - [ ] Try-catch contextual en controllers
  - [ ] Error codes catalog (ERROR_CODES.md)
  - [ ] GlobalExceptionHandler con códigos
  - [ ] I18N: mensajes español e inglés
  - [ ] Tests: logging en exceptions

- [ ] **Story 10.15: Database Constraints** (1 SP)
  - [ ] CHECK constraints para enums
  - [ ] Foreign keys configuradas
  - [ ] GIN indexes para JSONB
  - [ ] Tests: verificar constraints
  - [ ] Documentado en DATABASE_SCHEMA.md

**Sprint 2 Goal:** ✅ Domain >90%, Application >85% coverage, error handling robusto

**CHECKPOINT:** ⚠️ Coverage >75% antes de continuar a Sprint 3

---

### Sprint 3: Integration Testing (2 semanas)

- [ ] **Story 10.4: Testcontainers** (8 SP) 🔴 CRÍTICO
  - [ ] `SignatureRepositoryAdapterTest`
    - [ ] PostgreSQL container
    - [ ] Test: save → findById
    - [ ] Test: JSONB serialization
    - [ ] Test: queries personalizados
  - [ ] `OutboxEventPublisherAdapterTest`
    - [ ] PostgreSQL + Kafka containers
    - [ ] Test: evento → outbox_event table
    - [ ] Test: Debezium CDC → Kafka
    - [ ] Test: Avro serialization
  - [ ] `ProviderAdapterTest`
    - [ ] WireMock container
    - [ ] Test: enviar SMS → API call
    - [ ] Test: timeout → circuit breaker
    - [ ] Test: retry logic
  - [ ] Coverage: Infrastructure >70%
  - [ ] Tests ejecutan en <30s
  - [ ] Documentado en TESTING.md

**Sprint 3 Goal:** ✅ Infrastructure layer tested, CI pipeline verde

**CHECKPOINT:** 🚦 **GO/NO-GO DECISION** - ¿Production ready básico?

### Criterios para GO:
- [ ] Coverage total >75% (JaCoCo report)
- [ ] Zero critical vulnerabilities (Snyk)
- [ ] Idempotencia: 0% duplicates en load test
- [ ] SpEL whitelist implementado
- [ ] CI pipeline verde

---

## 🟡 Fase 2: Mejoras Importantes (Sprint 4-6)

### Sprint 4: Observability (2 semanas)

- [ ] **Story 10.7: Distributed Tracing** (5 SP)
  - [ ] OpenTelemetry agent configurado
  - [ ] Jaeger running en Docker Compose
  - [ ] Spans: controller, use cases, providers
  - [ ] Logs con `traceId` en MDC
  - [ ] Dashboard Grafana con trace stats

- [ ] **Story 10.8: MDC Logging** (3 SP)
  - [ ] `logback-spring.xml` con Logstash encoder
  - [ ] `RequestLoggingFilter` pobla MDC
  - [ ] Logs en JSON estructurado
  - [ ] Documentado en OBSERVABILITY.md

**Sprint 4 Goal:** ✅ Troubleshooting mejorado, traces end-to-end visibles

---

### Sprint 5: Scalability (2 semanas)

- [ ] **Story 10.9: DB Partitioning** (5 SP)
  - [ ] Liquibase migration → partitioned table
  - [ ] 3 partitions iniciales (current + 2 futuros)
  - [ ] Job scheduler crea partitions automáticamente
  - [ ] Tests: partition pruning funciona
  - [ ] Documentado en DATABASE_MIGRATIONS.md

- [ ] **Story 10.13: Rate Limiting** (3 SP)
  - [ ] Rate limiter: global + per-customer
  - [ ] Redis para estado distribuido
  - [ ] Headers `X-RateLimit-*` en responses
  - [ ] Métricas Prometheus
  - [ ] Tests: HTTP 429 cuando excede

**Sprint 5 Goal:** ✅ Performance garantizada a escala, protección contra abuso

---

### Sprint 6: GDPR Compliance (2 semanas)

- [ ] **Story 10.10: Right to Erasure** (8 SP)
  - [ ] Endpoint `DELETE /admin/customers/{id}/data`
  - [ ] Export service (JSON customer data)
  - [ ] Anonymization queries (UPDATE, no DELETE)
  - [ ] Audit log de eliminaciones
  - [ ] Tests: anonimización completa
  - [ ] Documentado en GDPR_COMPLIANCE.md

**Sprint 6 Goal:** ✅ GDPR Article 17 compliance, audit trail completo

---

## 🟢 Fase 3: Production Hardening (Sprint 7-8)

### Sprint 7-8: Optimizaciones (2 semanas)

- [ ] **Story 10.14: Secrets Rotation** (5 SP)
  - [ ] Vault rotation configurada (90 días)
  - [ ] Spring Cloud Vault `@RefreshScope`
  - [ ] Tests: simular rotation
  - [ ] Alert si rotation falla
  - [ ] Documentado en VAULT_ROTATION.md

**Sprint 7-8 Goal:** ✅ Secrets rotation automatizada, zero-downtime

---

## 📊 Métricas de Progreso

### Overall Progress

```
Total Stories: 15
Completed: 0 ✅
In Progress: 0 🔄
Pending: 15 📋

Story Points: 0/73 (0%)
Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
```

### Por Fase

| Fase | Stories | SP Completados | SP Total | Progress |
|------|---------|----------------|----------|----------|
| Fase 1: Críticos | 0/6 | 0/28 | 28 | ░░░░░ 0% |
| Fase 2: Importantes | 0/6 | 0/29 | 29 | ░░░░░ 0% |
| Fase 3: Optimizaciones | 0/3 | 0/13 | 13 | ░░░░░ 0% |

### Quality Metrics

| Métrica | Baseline | Current | Target | Status |
|---------|----------|---------|--------|--------|
| Test Coverage | 14% | 14% | 75% | 🔴 |
| Security Vulnerabilities | 1 | 1 | 0 | 🔴 |
| Idempotencia | ❌ | ❌ | ✅ | 🔴 |
| Architecture Validation | ❌ | ❌ | ✅ | 🔴 |
| Distributed Tracing | ❌ | ❌ | ✅ | 🟡 |
| GDPR Compliance | ⚠️ | ⚠️ | ✅ | 🟡 |
| Overall Score | 7.5/10 | 7.5/10 | 9.0/10 | 🔴 |

---

## 🚦 Checkpoints

### Checkpoint 1: Post-Sprint 2
**Objetivo:** Coverage >75%

- [ ] JaCoCo report generado
- [ ] Domain layer >90%
- [ ] Application layer >85%
- [ ] Infrastructure layer >70%
- [ ] **DECISION:** ¿Continuar a Sprint 3?

### Checkpoint 2: Post-Sprint 3
**Objetivo:** Production-ready básico

- [ ] Todos los tests pasan
- [ ] CI pipeline verde
- [ ] Zero security vulnerabilities
- [ ] Idempotencia funcional
- [ ] **DECISION:** 🚦 GO/NO-GO para UAT

### Checkpoint 3: Post-Sprint 6
**Objetivo:** Production-ready completo

- [ ] Fase 1 + Fase 2 completadas
- [ ] Observability funcional
- [ ] GDPR compliance
- [ ] Performance validada
- [ ] **DECISION:** 🚦 GO/NO-GO para Production

---

## 🎯 Definition of Done (Epic 10)

**Epic 10 se considera COMPLETADO cuando:**

### Técnico
- [ ] 15/15 stories completadas
- [ ] Coverage >75% (verificado en JaCoCo)
- [ ] Zero critical vulnerabilities (Snyk scan)
- [ ] CI/CD pipeline verde
- [ ] Performance benchmarks passed

### Funcional
- [ ] Idempotencia probada (0% duplicates)
- [ ] SpEL security audit completado
- [ ] Distributed tracing visible en Jaeger
- [ ] GDPR endpoints funcionales
- [ ] DB partitioning configurado

### Documentación
- [ ] Todos los ADRs actualizados
- [ ] README.md con nuevas features
- [ ] TESTING.md completo
- [ ] SECURITY.md actualizado
- [ ] Runbooks operacionales

### Calidad
- [ ] Code review: 2+ approvals por story
- [ ] No linter errors
- [ ] Retrospective completada
- [ ] Lecciones aprendidas documentadas

### Resultado Final
- [ ] **Calificación:** 9.0/10+ ✅
- [ ] **Production-ready:** SÍ ✅
- [ ] **Stakeholder approval:** ✅

---

## 📞 Contactos

**Preguntas sobre Epic 10:**
- Tech Lead: [Responsable técnico]
- Product Owner: [PM responsable]
- QA Lead: [Testing strategy]

**Escalación de Blockers:**
- Engineering Manager
- CTO (si crítico)

---

## 📚 Referencias Rápidas

- [Epic 10 - Detalle Completo](docs/epics.md)
- [Sprint Plan](docs/sprint-artifacts/EPIC-10-QUALITY-IMPROVEMENTS-PLAN.md)
- [Resumen Ejecutivo](EPIC-10-RESUMEN-EJECUTIVO.md)
- [Evaluación de Calidad](Evaluación_de_Calidad_del_Proyecto_Signature_Router.md)
- [Estado del Proyecto](ESTADO-DEL-PROYECTO.md)

---

**Instrucciones de Uso:**
1. Marcar con `[x]` cada item al completarlo
2. Actualizar métricas de progreso semanalmente
3. Documentar blockers en sección de cada sprint
4. Celebrar cada checkpoint alcanzado 🎉

---

_Última actualización: 29-Nov-2025_  
_Próxima revisión: Al completar cada sprint_

