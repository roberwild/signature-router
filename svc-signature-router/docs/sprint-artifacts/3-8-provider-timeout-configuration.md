# Story 3.8: Provider Timeout Configuration

**Status:** ✅ Ready for Dev  
**Epic:** Epic 3 - Multi-Provider Integration  
**Sprint:** Sprint 3  
**Story Points:** 3

---

## 📋 Story Description

**As a** System Administrator / SRE  
**I want** Timeout configuration granular y configurable per-provider con Resilience4j TimeLimiter  
**So that** Puedo ajustar timeouts según características de cada provider y evitar hang indefinido

---

## 🎯 Business Value

Implementa timeout protection robusto para todas las llamadas a providers externos con:

- **Granular Timeouts**: Timeouts diferentes per-provider (SMS: 5s, Push: 3s, Voice: 10s, Biometric: 2s)
- **Fail-Fast**: Evita hang indefinido cuando provider externo no responde
- **Resilience4j Integration**: TimeLimiter decorators con cancelación de CompletableFutures
- **Dynamic Configuration**: Timeouts configurables vía `application.yml` sin redeploy
- **Observability**: Métricas de timeout events (Prometheus)
- **NFR Compliance**: P99 < 3s (PRD NFR-P2) requiere timeouts estrictos

**NFR Mapping**:
- **NFR-P2**: P99 latency < 3s → Timeout max 5s en external HTTP
- **NFR-R4**: Resilience patterns → TimeLimiter + CompletableFuture
- **NFR-O3**: Timeout metrics → `provider.timeout.total` counter

---

## ✅ Acceptance Criteria

- [ ] **AC1:** Resilience4j TimeLimiter configurado en `application.yml` con 4 instancias:
  - `smsTimeout`: 5s (Twilio SMS API típicamente < 2s)
  - `pushTimeout`: 3s (FCM API típicamente < 1s)
  - `voiceTimeout`: 10s (Twilio Voice API puede tomar 5-7s)
  - `biometricTimeout`: 2s (stub, future real SDK)

- [ ] **AC2:** Cada provider implementa método `sendChallengeAsync()` que retorna `CompletableFuture<ProviderResult>`

- [ ] **AC3:** SignatureProviderAdapter decora cada provider call con `@TimeLimiter`:
  - Annotation: `@TimeLimiter(name = "smsTimeout")` (por provider type)
  - Timeout exceeded → Return `ProviderResult.failure("TIMEOUT", "Provider timeout exceeded: {duration}ms")`

- [ ] **AC4:** Configuration property `cancelRunningFuture=true` para cada TimeLimiter:
  - Al timeout, cancela CompletableFuture en ejecución (evita thread leak)
  - Thread pool configurado: `ScheduledExecutorService` con 10 threads

- [ ] **AC5:** Timeout events publicados a Prometheus metrics:
  - Counter: `provider.timeout.total{provider="SMS|PUSH|VOICE|BIOMETRIC"}`
  - Histogram: `provider.timeout.duration{provider="..."}`
  - Increment en cada timeout event

- [ ] **AC6:** Timeout values expuestos en `/actuator/configprops`:
  - Masked secrets (API keys NO visibles)
  - Timeout durations visibles para troubleshooting

- [ ] **AC7:** Integration test con Testcontainers:
  - Mock provider que responde después de 6s (excede timeout 5s)
  - Verify `ProviderResult.failure("TIMEOUT", ...)`
  - Verify CompletableFuture cancelled

- [ ] **AC8:** Unit tests para SignatureProviderAdapter:
  - testSendChallenge_whenProviderTimesOut_shouldReturnFailure()
  - testSendChallenge_whenProviderRespondsInTime_shouldReturnSuccess()
  - testAsyncExecution_whenTimeoutExceeded_shouldCancelFuture()

- [ ] **AC9:** Multi-environment configuration (local/uat/prod):
  - `application-local.yml`: Timeouts permissive (10s) para debugging
  - `application-uat.yml`: Timeouts production-like (5s)
  - `application-prod.yml`: Timeouts strict (3-5s)

- [ ] **AC10:** ProviderResult incluye campo `timedOut` boolean:
  - `true` si failure fue causado por timeout
  - `false` para otros tipos de failure
  - Usado en Epic 4 para fallback decision logic

- [ ] **AC11:** Logging detallado en timeout events:
  - `log.warn("Provider timeout: provider={}, duration={}ms, challenge_id={}", ...)` 
  - Include traceId para correlación
  - Log level WARNING (not ERROR, es esperado en degraded mode)

- [ ] **AC12:** Documentation completa:
  - README sección "Provider Timeouts" con ejemplos de configuration
  - CHANGELOG entrada detallada
  - JavaDoc en SignatureProviderAdapter.sendChallengeAsync()

---

## 🏗️ Tasks

### Task 1: Configure Resilience4j TimeLimiter Instances
**Estimated:** 45min

#### Subtasks:
1. [ ] Actualizar `pom.xml` con Resilience4j dependencies (si no están ya):
   - `io.github.resilience4j:resilience4j-spring-boot3` (ya incluido en Epic 2)
   - `io.github.resilience4j:resilience4j-timelimiter` (module adicional)
   - `io.github.resilience4j:resilience4j-reactor` (para CompletableFuture support)
2. [ ] Crear sección `resilience4j.timelimiter` en `application.yml`:
   ```yaml
   resilience4j:
     timelimiter:
       configs:
         default:
           timeoutDuration: 5s
           cancelRunningFuture: true
       instances:
         smsTimeout:
           baseConfig: default
           timeoutDuration: 5s
         pushTimeout:
           baseConfig: default
           timeoutDuration: 3s
         voiceTimeout:
           baseConfig: default
           timeoutDuration: 10s
         biometricTimeout:
           baseConfig: default
           timeoutDuration: 2s
   ```
3. [ ] Crear `application-local.yml` overrides (permissive timeouts):
   ```yaml
   resilience4j:
     timelimiter:
       instances:
         smsTimeout:
           timeoutDuration: 10s
         pushTimeout:
           timeoutDuration: 10s
         voiceTimeout:
           timeoutDuration: 15s
   ```
4. [ ] Crear `application-prod.yml` overrides (strict timeouts):
   ```yaml
   resilience4j:
     timelimiter:
       instances:
         smsTimeout:
           timeoutDuration: 4s
         pushTimeout:
           timeoutDuration: 2s
         voiceTimeout:
           timeoutDuration: 8s
   ```
5. [ ] Configurar thread pool para CompletableFuture execution:
   - Bean `ScheduledExecutorService` con 10 threads
   - Thread name prefix: `provider-timeout-`

**Files to Create:**
- (None, modify existing config)

**Files to Modify:**
- `pom.xml` (add Resilience4j timelimiter module si no está)
- `src/main/resources/application.yml`
- `src/main/resources/application-local.yml`
- `src/main/resources/application-prod.yml`
- `src/main/resources/application-uat.yml`

---

### Task 2: Refactor Provider Interface to Async
**Estimated:** 1h

#### Subtasks:
1. [ ] Actualizar `SignatureProviderPort` domain interface:
   - Agregar método: `CompletableFuture<ProviderResult> sendChallengeAsync(SignatureChallenge challenge)`
   - **CRITICAL**: NO eliminar método sync `ProviderResult sendChallenge(...)` (backward compatibility)
   - JavaDoc: Documentar que async method es preferido para timeout support
2. [ ] Implementar `sendChallengeAsync()` en TwilioSmsProvider:
   - Return `CompletableFuture.supplyAsync(() -> sendChallenge(challenge), executorService)`
   - Reutiliza método sync existente (no duplicar lógica)
3. [ ] Implementar `sendChallengeAsync()` en PushNotificationProvider:
   - Return `CompletableFuture.supplyAsync(() -> sendChallenge(challenge), executorService)`
4. [ ] Implementar `sendChallengeAsync()` en VoiceCallProvider:
   - Return `CompletableFuture.supplyAsync(() -> sendChallenge(challenge), executorService)`
5. [ ] Implementar `sendChallengeAsync()` en BiometricProvider:
   - Return `CompletableFuture.completedFuture(sendChallenge(challenge))` (stub, instant)
6. [ ] Inject `ScheduledExecutorService` en cada provider
7. [ ] Update todos los providers con JavaDoc completo

**Files to Modify:**
- `src/main/java/com/bank/signature/domain/port/outbound/SignatureProviderPort.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/TwilioSmsProvider.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/PushNotificationProvider.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/VoiceCallProvider.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/BiometricProvider.java`

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/config/AsyncProviderConfig.java` (bean ScheduledExecutorService)

---

### Task 3: Implement TimeLimiter Decoration in SignatureProviderAdapter
**Estimated:** 1h 30min

#### Subtasks:
1. [ ] Inject `TimeLimiterRegistry` en SignatureProviderAdapter:
   ```java
   private final TimeLimiterRegistry timeLimiterRegistry;
   ```
2. [ ] Modificar método `sendChallenge(SignatureChallenge challenge)`:
   - Determinar provider por `challenge.getChannelType().toProviderType()`
   - Seleccionar TimeLimiter instance por provider:
     - SMS → `smsTimeout`
     - PUSH → `pushTimeout`
     - VOICE → `voiceTimeout`
     - BIOMETRIC → `biometricTimeout`
   - Decorar `provider.sendChallengeAsync()` con TimeLimiter:
     ```java
     TimeLimiter timeLimiter = timeLimiterRegistry.timeLimiter("smsTimeout");
     CompletableFuture<ProviderResult> future = timeLimiter.decorateFuture(
         () -> provider.sendChallengeAsync(challenge)
     );
     ```
   - Handle TimeoutException:
     ```java
     try {
         return future.get();
     } catch (TimeoutException e) {
         log.warn("Provider timeout: provider={}, duration={}ms", ...);
         return ProviderResult.failure("TIMEOUT", "Provider timeout exceeded");
     }
     ```
3. [ ] Agregar campo `timedOut` boolean en ProviderResult value object:
   - Factory method: `ProviderResult.timeout(String message, Duration duration)`
   - Constructor Java 21 record actualizado
4. [ ] Agregar Prometheus metrics tracking:
   - Counter: `provider.timeout.total` con tag `provider`
   - Timer: `provider.timeout.duration` con tag `provider`
   - Inject `MeterRegistry` en SignatureProviderAdapter
   - Increment counter en cada timeout event
5. [ ] Logging completo:
   - `log.warn()` con traceId, provider, duration, challenge_id
   - NO log stack trace (no es error, es timeout esperado)

**Files to Modify:**
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/SignatureProviderAdapter.java`
- `src/main/java/com/bank/signature/domain/model/valueobject/ProviderResult.java` (add timedOut field)

---

### Task 4: Unit Tests - Provider Async Methods
**Estimated:** 45min

#### Subtasks:
1. [ ] Crear TwilioSmsProviderAsyncTest:
   - Test: sendChallengeAsync_shouldReturnCompletableFuture()
   - Test: sendChallengeAsync_shouldCompleteSuccessfully()
   - Mock Twilio API client
   - Verify CompletableFuture result
2. [ ] Repeat para PushNotificationProviderAsyncTest
3. [ ] Repeat para VoiceCallProviderAsyncTest
4. [ ] Repeat para BiometricProviderAsyncTest
5. [ ] Ejecutar tests y verificar PASS

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/TwilioSmsProviderAsyncTest.java`
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/PushNotificationProviderAsyncTest.java`
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/VoiceCallProviderAsyncTest.java`
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/BiometricProviderAsyncTest.java`

---

### Task 5: Unit Tests - SignatureProviderAdapter Timeout Logic
**Estimated:** 1h

#### Subtasks:
1. [ ] Crear SignatureProviderAdapterTimeoutTest:
   - Test: testSendChallenge_whenProviderTimesOut_shouldReturnFailure()
     - Mock provider.sendChallengeAsync() que no completa nunca
     - Mock TimeLimiter que lanza TimeoutException
     - Verify ProviderResult.timedOut = true
   - Test: testSendChallenge_whenProviderRespondsInTime_shouldReturnSuccess()
     - Mock provider completa en 1s (timeout 5s)
     - Verify ProviderResult.success = true
   - Test: testTimeoutMetrics_shouldIncrementCounter()
     - Verify MeterRegistry counter incremented
   - Test: testTimeoutLogging_shouldLogWarning()
     - Verify log.warn() called with traceId
   - Test: testCancelRunningFuture_whenTimeout_shouldCancelFuture()
     - Verify CompletableFuture.isCancelled() = true
2. [ ] Ejecutar tests y verificar PASS

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/SignatureProviderAdapterTimeoutTest.java`

---

### Task 6: Integration Tests - Slow Provider Simulation
**Estimated:** 1h

#### Subtasks:
1. [ ] Crear ProviderTimeoutIntegrationTest:
   - @SpringBootTest con Testcontainers
   - Mock provider que sleep(6000) → excede timeout 5s
   - Test: testProviderTimeout_shouldReturnFailureAfter5Seconds()
     - Call SignatureProviderAdapter.sendChallenge(...)
     - Measure duration (debe ser ~5s, NO 6s)
     - Verify ProviderResult.timedOut = true
     - Verify ProviderResult.errorCode = "TIMEOUT"
   - Test: testTimeoutMetrics_shouldBeExportedToPrometheus()
     - Call `/actuator/prometheus`
     - Verify `provider_timeout_total` counter present
2. [ ] Test multi-environment config:
   - Test: testLocalProfile_shouldUsePermissiveTimeouts()
     - @ActiveProfiles("local")
     - Verify timeout = 10s (from application-local.yml)
   - Test: testProdProfile_shouldUseStrictTimeouts()
     - @ActiveProfiles("prod")
     - Verify timeout = 4s (from application-prod.yml)
3. [ ] Ejecutar tests y verificar PASS

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/ProviderTimeoutIntegrationTest.java`

---

### Task 7: Update Documentation
**Estimated:** 45min

#### Subtasks:
1. [ ] Actualizar README.md con sección "Provider Timeouts":
   - Configuration examples (application.yml)
   - Multi-environment strategy
   - Timeout values recomendados per-provider
   - Troubleshooting: "Provider timing out? Check logs for traceId"
2. [ ] Actualizar CHANGELOG.md:
   - Story 3.8 entry con:
     - Resilience4j TimeLimiter integration
     - 4 timeout instances configurables
     - CompletableFuture async execution
     - Prometheus metrics (provider.timeout.total)
     - Multi-environment profiles
3. [ ] JavaDoc completo en:
   - SignatureProviderAdapter.sendChallenge()
   - SignatureProviderPort.sendChallengeAsync()
   - ProviderResult.timeout()
4. [ ] Crear operational runbook entry (opcional):
   - "How to adjust provider timeouts in production"
   - "How to investigate timeout events"

**Files to Modify:**
- `README.md`
- `CHANGELOG.md`

**Files to Create:**
- (Optional) `docs/runbooks/provider-timeout-troubleshooting.md`

---

## 📐 Architecture Context

### Timeout Flow Diagram

```
SignatureProviderAdapter.sendChallenge(challenge)
   ↓
   ↓ Determine provider by channelType
   ↓
   ↓ Select TimeLimiter instance:
   │   - SMS → smsTimeout (5s)
   │   - PUSH → pushTimeout (3s)
   │   - VOICE → voiceTimeout (10s)
   │   - BIOMETRIC → biometricTimeout (2s)
   ↓
TimeLimiter.decorateFuture(() -> provider.sendChallengeAsync(challenge))
   ↓ CompletableFuture<ProviderResult>
   ↓
   ├─ Scenario A: Provider responds in time (< timeout)
   │  ↓ future.get() → ProviderResult.success(...)
   │  ↓ Return success
   │
   ├─ Scenario B: Provider times out (> timeout)
   │  ↓ TimeoutException thrown
   │  ↓ log.warn("Provider timeout: provider={}, duration={}ms")
   │  ↓ meterRegistry.counter("provider.timeout.total").increment()
   │  ↓ future.cancel(true) → CompletableFuture cancelled
   │  ↓ Return ProviderResult.timeout("TIMEOUT", "Provider timeout exceeded: 5000ms")
   │
   └─ Scenario C: Provider throws exception (before timeout)
      ↓ ExecutionException thrown
      ↓ Return ProviderResult.failure("ERROR", ex.getMessage())
```

### Resilience4j Configuration Structure

```yaml
resilience4j:
  timelimiter:
    configs:
      default:                          # Base config (inherited by all)
        timeoutDuration: 5s
        cancelRunningFuture: true       # Cancel thread on timeout
    
    instances:
      smsTimeout:                       # Twilio SMS (typical: 1-2s)
        baseConfig: default
        timeoutDuration: 5s             # Conservative (2.5x typical)
      
      pushTimeout:                      # Firebase FCM (typical: 0.5-1s)
        baseConfig: default
        timeoutDuration: 3s             # Conservative (3x typical)
      
      voiceTimeout:                     # Twilio Voice (typical: 4-6s)
        baseConfig: default
        timeoutDuration: 10s            # Conservative (2x typical)
      
      biometricTimeout:                 # Biometric SDK (stub: instant)
        baseConfig: default
        timeoutDuration: 2s             # Future real SDK: 1-2s
```

### ProviderResult with Timeout Field

```java
/**
 * Value object representing the result of a provider send operation.
 * 
 * @param success True if challenge sent successfully
 * @param providerChallengeId Provider-specific challenge identifier (e.g., Twilio message_sid)
 * @param providerProof Non-repudiation proof (provider API response)
 * @param errorCode Error code if failure (e.g., "TIMEOUT", "API_ERROR")
 * @param errorMessage Human-readable error message
 * @param timedOut True if failure was caused by timeout (added in Story 3.8)
 */
public record ProviderResult(
    boolean success,
    String providerChallengeId,
    String providerProof,
    String errorCode,
    String errorMessage,
    boolean timedOut  // NEW FIELD
) {
    
    public static ProviderResult success(String challengeId, String proof) {
        return new ProviderResult(true, challengeId, proof, null, null, false);
    }
    
    public static ProviderResult failure(String errorCode, String message) {
        return new ProviderResult(false, null, null, errorCode, message, false);
    }
    
    /**
     * Factory method for timeout failures.
     * 
     * @param message Timeout message with duration
     * @return ProviderResult with timedOut=true
     */
    public static ProviderResult timeout(String message) {
        return new ProviderResult(false, null, null, "TIMEOUT", message, true);
    }
}
```

---

## 🔗 Dependencies

### Prerequisites
- ✅ **Story 3.6**: Provider configuration properties (timeout values source)
- ✅ **Story 3.1-3.5**: Todos los providers implementados
- ✅ **Epic 2 (Story 2.5)**: Resilience4j dependency ya incluido (Retry module)

### Enables
- ⏭️ **Story 3.9**: Provider Retry Logic (retry AFTER timeout check)
- ⏭️ **Story 4.1**: Circuit Breaker per Provider (circuit breaker + timeout)
- ⏭️ **Story 4.2**: Fallback Chain (timeout triggers fallback)

### Maven Dependencies

**Already Included (from Story 2.5):**
- `io.github.resilience4j:resilience4j-spring-boot3`

**New Dependencies:**
- `io.github.resilience4j:resilience4j-timelimiter` (if not auto-included)
- `io.github.resilience4j:resilience4j-reactor` (for CompletableFuture support)

---

## 🧪 Test Strategy

### Unit Tests
- **Provider Async Methods**: Verify CompletableFuture creation (4 tests, 1 per provider)
- **SignatureProviderAdapter**: Mock TimeLimiter, verify timeout handling (5 tests)
- **ProviderResult**: Verify timeout factory method (2 tests)

### Integration Tests
- **Slow Provider Simulation**: Mock provider sleep(6000ms), verify timeout after 5s (3 tests)
- **Multi-Environment Config**: Verify timeout values per profile (2 tests)
- **Metrics Export**: Verify Prometheus metrics incremented (1 test)

**Total Tests:** ~17 tests  
**Target Coverage:** > 85%

---

## 📝 Dev Notes

### Learnings from Previous Story (3.7 - Provider Health Check Endpoint)

**From Story 3-7-provider-health-check-endpoint.md (Status: Ready for Review)**

- **New Service Created**: `ProviderHealthService` interface + implementation en `application/service/` - ya existe bean para inyectar en controllers
- **DTOs Established**: Pattern de Response DTOs con Java 21 records (ProviderHealthResponse, AggregatedHealthResponse) - seguir mismo patrón
- **Security Pattern**: `@PreAuthorize("hasRole('ADMIN')")` en controllers admin - ya configurado, reutilizar
- **OpenAPI Annotations**: `@Operation`, `@ApiResponse`, `@Parameter` completamente documentados - seguir mismo estilo
- **Integration Test Pattern**: @SpringBootTest + TestRestTemplate para endpoints - template disponible
- **Actuator Integration**: Health indicators registrados en Spring Boot Actuator - integrar métricas similarmente
- **Cache Strategy**: Health checks con TTL 30s mencionado - considerar para timeout tracking
- **Admin API Structure**: Controllers en `infrastructure/adapter/inbound/rest/admin/` - mantener estructura

[Source: docs/sprint-artifacts/3-7-provider-health-check-endpoint.md]

### Async Execution Pattern

**CompletableFuture Pattern:**
```java
// Provider implementation
@Override
public CompletableFuture<ProviderResult> sendChallengeAsync(SignatureChallenge challenge) {
    return CompletableFuture.supplyAsync(() -> {
        // Existing sync logic
        return sendChallenge(challenge);
    }, scheduledExecutorService);
}
```

**Adapter decoration:**
```java
TimeLimiter timeLimiter = timeLimiterRegistry.timeLimiter(getTimeoutInstanceName(challenge));
CompletableFuture<ProviderResult> future = timeLimiter.decorateFuture(
    () -> provider.sendChallengeAsync(challenge)
);

try {
    return future.get(); // Blocks until complete or timeout
} catch (TimeoutException e) {
    log.warn("Provider timeout: provider={}, duration={}ms, traceId={}", 
        providerType, duration, MDC.get("traceId"));
    meterRegistry.counter("provider.timeout.total", "provider", providerType.name()).increment();
    return ProviderResult.timeout("Provider timeout exceeded: " + duration + "ms");
} catch (ExecutionException e) {
    // Handle provider exception
    return ProviderResult.failure("ERROR", e.getCause().getMessage());
}
```

### Timeout Values Rationale

| Provider | Timeout | Typical Latency | Rationale |
|----------|---------|----------------|-----------|
| **SMS (Twilio)** | 5s | 1-2s | 2.5x typical, handles transient network delays |
| **Push (FCM)** | 3s | 0.5-1s | 3x typical, FCM very fast but connection setup may delay |
| **Voice (Twilio)** | 10s | 4-6s | 2x typical, voice call initiation is slower |
| **Biometric** | 2s | instant (stub) | Future real SDK expected 1-2s for fingerprint capture |

**Production Adjustment**:
- Start conservative (current values)
- Monitor P95/P99 latency metrics (Story 3.10)
- Adjust timeouts to P99 + 2s safety margin
- Example: Si SMS P99 = 1.8s → timeout = 3.8s ≈ 4s

### Thread Pool Sizing

**ScheduledExecutorService Configuration:**
- **Core Pool Size**: 10 threads
- **Rationale**: Max 4 providers × 2 concurrent requests = 8 threads needed, +2 buffer
- **Thread Name**: `provider-timeout-{n}` para debugging
- **Shutdown**: Graceful shutdown con 30s timeout

```java
@Bean
public ScheduledExecutorService providerExecutorService() {
    return new ScheduledThreadPoolExecutor(
        10, // corePoolSize
        new ThreadFactoryBuilder()
            .setNameFormat("provider-timeout-%d")
            .setDaemon(true)
            .build()
    );
}
```

### Multi-Environment Strategy

**Development (local):**
- Permissive timeouts (10-15s)
- Permite debugging con breakpoints sin timeout
- Logs verbose

**UAT (uat):**
- Production-like timeouts (5s)
- Prueba comportamiento real de timeout

**Production (prod):**
- Strict timeouts (3-5s)
- Fail-fast para minimizar cascading failures
- P99 compliance

---

## 🎯 Definition of Done

- [ ] **Code Complete**: Async methods en providers + TimeLimiter decoration en adapter
- [ ] **Tests Passing**: Unit tests (12+) + Integration tests (5+) PASS
- [ ] **Coverage**: > 85%
- [ ] **Timeout Configuration**: 4 TimeLimiter instances configuradas (application.yml)
- [ ] **Multi-Environment**: application-{local/uat/prod}.yml con timeouts específicos
- [ ] **Metrics Export**: `provider.timeout.total` counter exportado a Prometheus
- [ ] **ProviderResult Enhanced**: Campo `timedOut` boolean agregado
- [ ] **CompletableFuture Cancellation**: `cancelRunningFuture=true` configurado y validado
- [ ] **Logging**: log.warn() con traceId en timeout events
- [ ] **Documentation**: README con configuration examples, CHANGELOG actualizado
- [ ] **JavaDoc**: SignatureProviderAdapter y ProviderResult completamente documentados
- [ ] **Integration**: End-to-end timeout flow funcional (slow provider → timeout → ProviderResult.timeout)

---

## 📚 References

**Resilience4j TimeLimiter:**
- https://resilience4j.readme.io/docs/timeout

**CompletableFuture:**
- https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html

**Spring Boot Resilience4j:**
- https://resilience4j.readme.io/docs/getting-started-3

**Timeout Best Practices:**
- Martin Fowler - Timeout Patterns: https://martinfowler.com/bliki/CircuitBreaker.html

---

**Story Created:** 2025-11-28  
**Previous Story:** 3.7 - Provider Health Check Endpoint  
**Next Story:** 3.9 - Provider Retry Logic


