# Story 4-1: Circuit Breaker per Provider (Resilience4j)

**Status:** ✅ Ready for Review  
**Epic:** Epic 4 - Resilience & Circuit Breaking  
**Sprint:** Sprint 4  
**Story Points:** 3

---

## 📋 Story Description

**As a** System  
**I want** Circuit breakers configurados por provider usando Resilience4j  
**So that** El sistema evita llamar providers que están fallando (cascading failures prevention)

---

## 🎯 Business Value

Implementa circuit breakers por provider para prevenir cascading failures y mejorar resilience:

- **Cascading Failures Prevention**: Stop calling failing providers automáticamente
- **Fast Failure**: Falla rápido sin esperar timeouts cuando circuit abierto
- **Automatic Recovery**: Circuit se cierra automáticamente cuando provider recupera
- **Per-Provider Configuration**: Configuración independiente por provider (SMS, Push, Voice, Biometric)
- **Observability**: Métricas de circuit breaker events (opened, closed, half-open)
- **Fallback Ready**: Base para Story 4-2 (Fallback Chain)

---

## ✅ Acceptance Criteria

- [ ] **AC1:** @CircuitBreaker annotation en cada provider's sendChallenge()
- [ ] **AC2:** Configuración en application.yml por provider: smsProvider, pushProvider, voiceProvider, biometricProvider
- [ ] **AC3:** Circuit breaker parameters: failure-rate-threshold (50%), wait-duration-in-open-state (30s), sliding-window-size (10)
- [ ] **AC4:** Circuit states: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery)
- [ ] **AC5:** Cuando circuit OPEN: CallNotPermittedException lanzada (manejada por fallback)
- [ ] **AC6:** Health check indica circuit breaker state en response
- [ ] **AC7:** Prometheus metrics: resilience4j_circuitbreaker_state, resilience4j_circuitbreaker_calls
- [ ] **AC8:** No modifica ProviderResult pattern (circuit breaker transparente)
- [ ] **AC9:** Unit tests para circuit breaker behavior (open, half-open, recovery)
- [ ] **AC10:** Documentation en README.md con circuit breaker config

---

## 🏗️ Tasks

### Task 1: Add Resilience4j Circuit Breaker Annotations
**Estimated:** 45min

#### Subtasks:
1. [ ] Agregar @CircuitBreaker(name = "smsProvider") en TwilioSmsProvider.sendChallenge()
2. [ ] Agregar @CircuitBreaker(name = "pushProvider") en PushNotificationProvider.sendChallenge()
3. [ ] Agregar @CircuitBreaker(name = "voiceProvider") en VoiceCallProvider.sendChallenge()
4. [ ] Agregar @CircuitBreaker(name = "biometricProvider") en BiometricProvider.sendChallenge()
5. [ ] Mantener @Retry y @TimeLimiter (circuit breaker se ejecuta DESPUÉS de retries)

**Files to Modify:**
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/twilio/TwilioSmsProvider.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/push/PushNotificationProvider.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceCallProvider.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/biometric/BiometricProvider.java`

---

### Task 2: Configure Circuit Breakers in application.yml
**Estimated:** 30min

#### Subtasks:
1. [ ] Add resilience4j.circuitbreaker.instances section
2. [ ] Configure smsProvider circuit breaker:
   - failure-rate-threshold: 50%
   - wait-duration-in-open-state: 30s
   - sliding-window-size: 10
   - permitted-number-of-calls-in-half-open-state: 3
   - minimum-number-of-calls: 5
3. [ ] Configure pushProvider, voiceProvider, biometricProvider (same defaults)
4. [ ] Add comments explaining each parameter

**Files to Modify:**
- `src/main/resources/application.yml`

---

### Task 3: Update Health Check to Show Circuit State
**Estimated:** 30min

#### Subtasks:
1. [ ] Inject CircuitBreakerRegistry en ProviderHealthServiceImpl
2. [ ] En checkProviderHealth(), obtener circuit breaker state
3. [ ] Agregar circuitState field a ProviderHealthResponse: CLOSED/OPEN/HALF_OPEN
4. [ ] Si circuit OPEN: status DOWN con errorMessage "Circuit breaker OPEN"

**Files to Modify:**
- `src/main/java/com/bank/signature/application/dto/response/ProviderHealthResponse.java`
- `src/main/java/com/bank/signature/application/service/ProviderHealthServiceImpl.java`

---

### Task 4: Unit Tests
**Estimated:** 1h

#### Subtasks:
1. [ ] Test: Circuit opens after failure threshold exceeded
2. [ ] Test: Circuit stays open for wait-duration
3. [ ] Test: Circuit transitions to HALF_OPEN after wait-duration
4. [ ] Test: Circuit closes after successful calls in HALF_OPEN
5. [ ] Test: Health check shows circuit state

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/CircuitBreakerIntegrationTest.java`

---

### Task 5: Update Documentation
**Estimated:** 30min

#### Subtasks:
1. [ ] README.md: Circuit breaker configuration section
2. [ ] CHANGELOG.md: Story 4-1 entry
3. [ ] Documenting circuit breaker states and metrics

**Files to Modify:**
- `README.md`
- `CHANGELOG.md`

---

## 📐 Architecture Context

### Circuit Breaker Pattern

```
Client Request
   ↓
ChallengeServiceImpl
   ↓
SignatureProviderPort.sendChallenge()
   ↓
@CircuitBreaker (Resilience4j AOP)
   ↓ if CLOSED (normal)
   │   ↓
   │   @Retry (max 3 attempts)
   │   ↓
   │   @TimeLimiter (5s timeout)
   │   ↓
   │   Provider Implementation (Twilio, FCM, etc.)
   │   ↓
   │   Success → ProviderResult.success()
   │   Failure → increment failure counter
   │   ↓
   │   If failure-rate > 50% → Circuit OPEN
   │
   ↓ if OPEN (failing)
   │   ↓
   │   CallNotPermittedException (immediate fail)
   │   ↓
   │   After 30s → Circuit HALF_OPEN
   │
   ↓ if HALF_OPEN (testing)
       ↓
       Allow 3 test calls
       ↓
       If success → Circuit CLOSED
       If failure → Circuit OPEN again
```

### Configuration Example

```yaml
resilience4j:
  circuitbreaker:
    instances:
      smsProvider:
        failure-rate-threshold: 50  # Open circuit if 50% of calls fail
        wait-duration-in-open-state: 30s  # Stay open for 30s before testing
        sliding-window-size: 10  # Track last 10 calls
        permitted-number-of-calls-in-half-open-state: 3  # Allow 3 test calls
        minimum-number-of-calls: 5  # Need at least 5 calls before evaluating
        sliding-window-type: COUNT_BASED  # COUNT_BASED or TIME_BASED
```

---

## 🔗 Dependencies

### Prerequisites
- ✅ **Epic 3**: All providers implement SignatureProviderPort
- ✅ **Resilience4j**: Already in dependencies (@Retry, @TimeLimiter)

### Enables
- ⏭️ **Story 4-2**: Fallback Chain (circuit breaker triggers fallback)
- ⏭️ **Story 4-7**: Fallback Loop Prevention

---

## 🧪 Test Strategy

### Unit Tests
- Circuit breaker state transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
- Health check shows circuit state
- CallNotPermittedException handling

### Integration Tests
- Full flow with circuit breaker (simulate provider failures)
- Circuit recovery after wait-duration

**Target Coverage:** > 80%

---

## 📝 Dev Notes

### Circuit Breaker States

**CLOSED (Normal):**
- All calls pass through
- Failures tracked in sliding window
- If failure rate > threshold → OPEN

**OPEN (Failing):**
- All calls rejected immediately (CallNotPermittedException)
- No calls to provider (fast fail)
- After wait-duration → HALF_OPEN

**HALF_OPEN (Testing):**
- Allow limited number of test calls
- If all succeed → CLOSED
- If any fails → OPEN

### Why Circuit Breaker AFTER Retry?

Order of execution: `@CircuitBreaker` → `@Retry` → `@TimeLimiter` → Method

1. Circuit breaker checks state first
2. If CLOSED, allow call through
3. Retry attempts if failure
4. Timeout enforced per attempt
5. Final result updates circuit breaker state

### Metrics

Resilience4j auto-exports to Prometheus:
- `resilience4j_circuitbreaker_state` (gauge: 0=CLOSED, 1=OPEN, 2=HALF_OPEN)
- `resilience4j_circuitbreaker_calls` (counter: success, failure, rejected)
- `resilience4j_circuitbreaker_failure_rate` (gauge: current failure rate)

---

## 🎯 Definition of Done

- [ ] **Code Complete**: @CircuitBreaker en todos los providers
- [ ] **Configuration**: Circuit breakers configurados en application.yml
- [ ] **Health Check**: Circuit state visible en health endpoint
- [ ] **Tests**: Unit tests PASS
- [ ] **Metrics**: Prometheus metrics exportando
- [ ] **Documentation**: README + CHANGELOG actualizados
- [ ] **No Breaking Changes**: ProviderResult pattern intacto

---

## 📚 References

**Resilience4j Circuit Breaker:**
- https://resilience4j.readme.io/docs/circuitbreaker

**Circuit Breaker Pattern:**
- https://martinfowler.com/bliki/CircuitBreaker.html

---

**Story Created:** 2025-11-27  
**Previous Story:** 3.7 - Provider Health Check Endpoint  
**Next Story:** 4-2 - Fallback Chain Implementation

