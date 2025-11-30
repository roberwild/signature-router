# Story 4.3: Degraded Mode Manager

**Status:** done  
**Epic:** Epic 4 - Resilience & Circuit Breaking  
**Sprint:** Sprint 4  
**Story Points:** 5  
**Created:** 2025-11-28  
**Completed:** 2025-11-28  
**Reviewed:** 2025-11-28

---

## 📋 Story Description

**As a** System  
**I want** Degraded mode automático cuando providers fallan masivamente  
**So that** El sistema sigue operativo con funcionalidad reducida en lugar de fallar completamente

---

## 🎯 Business Value

Implementa degraded mode para mantener el sistema operativo durante outages parciales:

- **Graceful Degradation**: Sistema sigue aceptando requests incluso con providers down
- **Automatic Mode Switching**: Detecta degradación automáticamente via error rate metrics
- **Business Continuity**: 99.9% uptime target (NFR-A1) incluso con provider outages
- **Transparency**: API responde con warnings sobre modo degradado
- **Recovery**: Vuelve a modo normal automáticamente cuando providers recuperan
- **Cost Optimization**: Evita fallback a canales caros (Voice) durante outages masivos

**NFR Mapping**:
- **NFR-A1**: 99.9% uptime → Degraded mode mantiene sistema operativo
- **NFR-A4**: Graceful degradation → No hard failures
- **NFR-A5**: Circuit breaker integration → Modo degradado basado en circuit states
- **NFR-O2**: Metrics-driven decisions → Error rate de Story 3.10

**Business Impact**:
- **Incident Mitigation**: Sistema sobrevive outages parciales sin downtime
- **SLA Compliance**: Cumple SLA 99.9% uptime
- **Customer Experience**: Requests no fallan silenciosamente, responden con expected delay
- **Ops Efficiency**: Auto-recovery reduce intervención manual

---

## ✅ Acceptance Criteria

### AC1: Degraded Mode Detection
**Given** Provider error rate > 80% durante 2 minutos consecutivos  
**When** DegradedModeManager evalúa health  
**Then** Sistema entra en DEGRADED mode automáticamente

**And** Prometheus gauge `system.degraded.mode{status="active|normal"}` updated

### AC2: Degraded Mode Behavior
**Given** Sistema en DEGRADED mode  
**When** Request POST /api/v1/signatures recibido  
**Then** Response incluye:
- HTTP 202 Accepted (en lugar de 201 Created)
- Header `X-System-Mode: DEGRADED`
- Warning header: `299 - "System in degraded mode, expect delays"`
- SignatureRequest created con status PENDING_DEGRADED

**And** NO se intenta enviar challenge inmediatamente (queued para retry cuando recovery)

### AC3: Per-Provider Degraded State
**Given** SMS provider con error rate > 80%  
**When** GET /admin/health/providers/SMS  
**Then** Response indica:
- `degradedMode: true`
- `degradedReason: "Error rate 85% exceeds threshold 80%"`
- `degradedSince: "2025-11-28T10:30:00Z"`

### AC4: Circuit Breaker Integration
**Given** 3+ providers con circuit OPEN simultáneamente  
**When** DegradedModeManager evalúa  
**Then** Sistema entra en DEGRADED mode

**And** Logs WARNING: "Degraded mode activated: 3/4 providers circuit OPEN"

### AC5: Automatic Recovery
**Given** Sistema en DEGRADED mode  
**When** Error rate < 50% durante 5 minutos  
**Then** Sistema vuelve a NORMAL mode automáticamente

**And** Logs INFO: "Recovered from degraded mode: error rate normalized"

**And** Queued requests se intentan procesar

### AC6: Configuration
**Given** application.yml con degraded-mode config  
**Then** Configurable:
- `degraded-mode.enabled: true`
- `degraded-mode.error-rate-threshold: 80` (%)
- `degraded-mode.min-duration: 120s`
- `degraded-mode.recovery-threshold: 50` (%)
- `degraded-mode.recovery-duration: 300s`
- `degraded-mode.circuit-open-threshold: 3` (providers)

### AC7: Metrics
**Given** Sistema operando  
**Then** Prometheus metrics exportadas:
- `system.degraded.mode{status}` - Gauge (1=degraded, 0=normal)
- `system.degraded.triggers.total` - Counter (cuántas veces entró en degraded)
- `system.degraded.duration.seconds` - Histogram (tiempo en degraded mode)
- `system.degraded.requests.total` - Counter (requests procesados en degraded)

### AC8: Admin API Override
**Given** Admin con ROLE_ADMIN  
**When** POST /admin/system/mode con body `{"mode": "DEGRADED", "reason": "Manual override"}`  
**Then** Sistema fuerza DEGRADED mode manualmente

**And** Response 200 OK con estado actual

**And** Audit log registra override con user identity

### AC9: Queue Strategy
**Given** Request creado en DEGRADED mode  
**When** Sistema recupera a NORMAL mode  
**Then** Requests con status PENDING_DEGRADED se procesan en orden FIFO

**And** Background job intenta enviar challenges queued

### AC10: Health Endpoint Indication
**Given** Sistema en DEGRADED mode  
**When** GET /actuator/health  
**Then** Response:
- `status: UP` (sistema sigue funcionando)
- `components.degradedMode.status: DEGRADED`
- `components.degradedMode.details.activeProviders: ["BIOMETRIC"]`
- `components.degradedMode.details.degradedProviders: ["SMS", "PUSH", "VOICE"]`

---

## 🏗️ Tasks

### Task 1: Create DegradedModeManager Component
**Estimated:** 1.5h

#### Subtasks:
1. [x] Create `DegradedModeManager` @Component
2. [x] Inject ProviderMetrics, CircuitBreakerRegistry, MeterRegistry
3. [x] Track current mode: SystemMode enum (NORMAL, DEGRADED, MAINTENANCE)
4. [x] Method: `evaluateSystemHealth()` - check error rates + circuits
5. [x] Method: `enterDegradedMode(String reason)` - switch to degraded
6. [x] Method: `exitDegradedMode()` - return to normal
7. [x] Method: `isInDegradedMode()` - query current state
8. [x] Method: `getDegradedProviders()` - list degraded providers
9. [x] Metrics: record mode changes, duration, triggers

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/resilience/DegradedModeManager.java`
- `src/main/java/com/bank/signature/domain/model/valueobject/SystemMode.java`

---

### Task 2: Scheduled Health Evaluation
**Estimated:** 45min

#### Subtasks:
1. [x] @Scheduled method: `evaluateSystemHealthPeriodically()` - every 30 seconds
2. [x] Query error rate per provider from ProviderMetrics
3. [x] Count circuit breakers OPEN from CircuitBreakerRegistry
4. [x] Apply degraded mode criteria (AC1, AC4)
5. [x] Trigger mode change if thresholds exceeded
6. [x] Apply recovery criteria (AC5)
7. [x] Log mode transitions at WARN/INFO level

**Files to Modify:**
- `src/main/java/com/bank/signature/infrastructure/resilience/DegradedModeManager.java`

---

### Task 3: Degraded Mode Configuration
**Estimated:** 30min

#### Subtasks:
1. [x] Create `DegradedModeConfig` @ConfigurationProperties
2. [x] Prefix: `degraded-mode`
3. [x] Properties: enabled, errorRateThreshold, minDuration, recoveryThreshold, recoveryDuration, circuitOpenThreshold
4. [x] Defaults per AC6
5. [x] Validation: @Min, @Max annotations
6. [x] Add config to application.yml, application-local.yml, application-prod.yml

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/config/DegradedModeConfig.java`

**Files to Modify:**
- `src/main/resources/application.yml`
- `src/main/resources/application-local.yml`
- `src/main/resources/application-prod.yml`

---

### Task 4: Modify SignatureController for Degraded Response
**Estimated:** 1h

#### Subtasks:
1. [x] Inject DegradedModeManager en SignatureController
2. [x] En createSignature(): check `degradedModeManager.isInDegradedMode()`
3. [x] If degraded:
   - Return HTTP 202 Accepted (not 201 Created)
   - Add header `X-System-Mode: DEGRADED`
   - Add Warning header `299 - "System in degraded mode..."`
   - Create SignatureRequest con status PENDING_DEGRADED
4. [x] If normal: comportamiento actual (HTTP 201, challenge sent)

**Files to Modify:**
- `src/main/java/com/bank/signature/application/controller/SignatureController.java`
- `src/main/java/com/bank/signature/domain/model/valueobject/SignatureStatus.java` (add PENDING_DEGRADED)

---

### Task 5: Admin API for Manual Override (AC8)
**Estimated:** 1h

#### Subtasks:
1. [x] Create `SystemModeController` REST controller
2. [x] POST /admin/system/mode endpoint
3. [x] Request DTO: `SetSystemModeRequest{mode, reason}`
4. [x] Response DTO: `SystemModeResponse{currentMode, since, reason, degradedProviders}`
5. [x] Security: @PreAuthorize("hasRole('ADMIN')")
6. [x] Call degradedModeManager.enterDegradedMode(reason) or exitDegradedMode()
7. [x] Audit log entry
8. [x] OpenAPI documentation

**Files to Create:**
- `src/main/java/com/bank/signature/application/controller/SystemModeController.java`
- `src/main/java/com/bank/signature/application/dto/request/SetSystemModeRequest.java`
- `src/main/java/com/bank/signature/application/dto/response/SystemModeResponse.java`

---

### Task 6: Health Endpoint Integration (AC10)
**Estimated:** 45min

#### Subtasks:
1. [x] Create `DegradedModeHealthIndicator` implements HealthIndicator
2. [x] Query degradedModeManager.isInDegradedMode()
3. [x] If degraded: Health.up().withDetail("status", "DEGRADED")
4. [x] Add details: activeProviders, degradedProviders, degradedSince
5. [x] Register in Spring Boot actuator health

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/health/DegradedModeHealthIndicator.java`

---

### Task 7: Queued Request Processing (AC9)
**Estimated:** 1.5h

#### Subtasks:
1. [x] Create `DegradedModeRecoveryService` @Component
2. [x] Method: `processQueuedRequests()` - called on recovery
3. [x] Query SignatureRequestRepository for status=PENDING_DEGRADED
4. [x] Order by createdAt ASC (FIFO)
5. [x] For each: attempt challenge sending via ChallengeService
6. [x] Update status to PENDING or CHALLENGE_FAILED
7. [x] Metrics: queued_requests_processed, queued_requests_failed
8. [x] Scheduled task: @Scheduled(fixedDelay = 60000) - check for recovery

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/resilience/DegradedModeRecoveryService.java`

---

### Task 8: Provider Health API Update (AC3)
**Estimated:** 30min

#### Subtasks:
1. [x] Modify ProviderHealthResponse DTO
2. [x] Add fields: degradedMode (boolean), degradedReason (String), degradedSince (Instant)
3. [x] En ProviderHealthServiceImpl.checkProviderHealth():
   - Query degradedModeManager.getDegradedProviders()
   - If provider degraded: populate degradedMode fields
4. [x] Update OpenAPI docs

**Files to Modify:**
- `src/main/java/com/bank/signature/application/dto/response/ProviderHealthResponse.java`
- `src/main/java/com/bank/signature/application/service/ProviderHealthServiceImpl.java`

---

### Task 9: Metrics Implementation (AC7)
**Estimated:** 45min

#### Subtasks:
1. [x] En DegradedModeManager: inject MeterRegistry
2. [x] Gauge: `system.degraded.mode{status}` - 1=degraded, 0=normal
3. [x] Counter: `system.degraded.triggers.total` - increment on enter
4. [x] Timer: `system.degraded.duration.seconds` - record on exit
5. [x] Counter: `system.degraded.requests.total` - increment in SignatureController
6. [x] Export via /actuator/prometheus

**Files to Modify:**
- `src/main/java/com/bank/signature/infrastructure/resilience/DegradedModeManager.java`
- `src/main/java/com/bank/signature/application/controller/SignatureController.java`

---

### Task 10: Unit Tests
**Estimated:** 2h

#### Subtasks:
1. [x] DegradedModeManagerTest:
   - testEnterDegradedMode_whenErrorRateHigh()
   - testExitDegradedMode_whenErrorRateNormalized()
   - testCircuitBreakerThreshold_triggersDegrade()
   - testManualOverride()
2. [x] SystemModeControllerTest:
   - testSetDegradedMode_adminOnly()
   - testSetDegradedMode_unauthorized()
3. [x] SignatureControllerTest:
   - testCreateSignature_inDegradedMode_returns202()
   - testCreateSignature_normalMode_returns201()
4. [x] DegradedModeRecoveryServiceTest:
   - testProcessQueuedRequests_onRecovery()

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/resilience/DegradedModeManagerTest.java`
- `src/test/java/com/bank/signature/application/controller/SystemModeControllerTest.java`

**Files to Modify:**
- `src/test/java/com/bank/signature/application/controller/SignatureControllerTest.java`

---

### Task 11: Integration Tests
**Estimated:** 1h

#### Subtasks:
1. [x] DegradedModeIntegrationTest:
   - testAutomaticDegradation_highErrorRate()
   - testAutomaticRecovery()
   - testQueuedRequestProcessing()
2. [x] Use Testcontainers for PostgreSQL
3. [x] Mock high error rate via ProviderMetrics
4. [x] Verify HTTP 202, headers, PENDING_DEGRADED status

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/resilience/DegradedModeIntegrationTest.java`

---

### Task 12: Documentation
**Estimated:** 45min

#### Subtasks:
1. [x] Update CHANGELOG.md con Story 4.3 features
2. [x] Create docs/operations/degraded-mode-runbook.md:
   - How to monitor degraded mode
   - Manual override procedure
   - Recovery checklist
   - Alert response guide
3. [x] Update README.md con degraded mode configuration
4. [x] Add Prometheus alerting rules for degraded mode

**Files to Create:**
- `docs/operations/degraded-mode-runbook.md`

**Files to Modify:**
- `CHANGELOG.md`
- `README.md`

---

## 📚 Context Reference

- **Story Context XML**: `docs/sprint-artifacts/4-3-degraded-mode-manager.context.xml` (generated 2025-11-28)
  - Comprehensive technical context for implementation
  - Code artifacts, dependencies, interfaces, constraints
  - Test ideas mapped to ACs
  - Learnings from Stories 3.10, 4.1, 4.2

## 📚 Technical Context

### Dependencies
- **Story 3.10**: Provider Metrics Tracking (ProviderErrorRateCalculator, provider.error.rate gauge)
- **Story 4.1**: Circuit Breaker (CircuitBreakerRegistry integration)
- **Story 4.2**: Fallback Chain (degraded mode affects fallback behavior)

### Architecture Alignment
- **Hexagonal**: DegradedModeManager en infrastructure layer
- **Domain Purity**: SystemMode value object en domain
- **Resilience4j**: Integration con circuit breaker registry
- **Observability**: Prometheus metrics + health indicator

### Integration Points
- **SignatureController**: Modify response behavior
- **ProviderHealthService**: Update health response
- **ChallengeService**: Queue logic during degraded mode
- **Actuator Health**: Custom health indicator

---

## 📊 Test Coverage Target

- **Unit Tests**: >90% coverage
- **Integration Tests**: End-to-end degraded mode flow
- **Manual Testing**: Admin override, recovery

---

## 🚀 Definition of Done

- [x] All 10 ACs validated with automated tests
- [x] Unit tests passing (>90% coverage)
- [x] Integration tests passing
- [x] Prometheus metrics exported correctly
- [x] Health endpoint shows degraded mode
- [x] Admin API secured with ROLE_ADMIN
- [x] CHANGELOG.md updated
- [x] Runbook documented
- [x] Code review approved
- [x] Degraded mode tested in local environment

---

## 💡 Dev Notes

### Error Rate Threshold Tuning
- **80%**: Aggressive (enters degraded quickly)
- **90%**: Conservative (waits for severe degradation)
- **Production**: Start conservative (90%), tune based on telemetry

### Recovery Strategy
- FIFO queue ensures fairness
- Rate limiting may be needed if large queue accumulates
- Consider max queue size (e.g., 1000 requests) to prevent memory issues

### Circuit Breaker vs Degraded Mode
- **Circuit OPEN**: Per-provider protection
- **Degraded Mode**: System-wide graceful degradation
- Both work together: degraded mode triggers when multiple circuits open

---

_Story created as part of Epic 4 - Resilience & Circuit Breaking_  
_Context: Provider metrics from Story 3.10, Circuit breakers from Story 4.1_

