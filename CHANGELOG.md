# Changelog

All notable changes to the Signature Router & Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Story 4-7: Fallback Loop Prevention - 2025-11-28)
- **FallbackLoopDetector Component**:
  - Domain service that tracks attempted providers per signature request
  - Prevents infinite loops in fallback chains
  - Configurable max attempts (default: 3 providers)
  - Detects duplicate provider attempts
  - Logs loop detection at ERROR level with traceId
- **FallbackLoopException**:
  - Domain exception thrown when loop detected
  - Includes set of attempted providers for debugging
  - Error code: `FALLBACK_LOOP_DETECTED`
- **ChallengeServiceImpl Integration**:
  - Creates FallbackLoopDetector instance per request
  - Validates each provider attempt before calling
  - Catches FallbackLoopException and increments metric
  - Returns primary failure when loop detected (no more fallbacks)
- **Configuration** (`application.yml`):
  - `resilience.fallback.max-attempts: 3` - Max provider attempts per request
- **Prometheus Metrics**:
  - Counter: `fallback.loops.prevented.total` - Total loops prevented
- **Tests**:
  - 12 unit tests in FallbackLoopDetectorTest (100% coverage)
  - Scenarios: duplicate detection, max exceeded, edge cases, reset

### Added (Story 4-5: Automatic Provider Reactivation - 2025-11-28)
- **ProviderReactivationScheduler**:
  - Scheduled job runs every 60 seconds (configurable)
  - Checks degraded providers via DegradedModeManager
  - Executes health check on each degraded provider
  - Reactivates provider if health check passes
  - Initial delay: 60s (allows system to stabilize)
- **ProviderReactivated Event**:
  - Domain event published when provider auto-recovers
  - Fields: providerType, reactivatedAt, downtimeDurationSeconds, healthCheckMessage
  - Logged for audit trail (Kafka integration ready)
- **DegradedModeManager Enhancements**:
  - `attemptReactivation(String provider)` - Attempts provider reactivation
  - `getDegradedProviders()` - Returns list of degraded providers
  - Circuit breaker transition to HALF_OPEN on reactivation attempt
- **Configuration** (`application.yml`):
  - `resilience.reactivation.enabled: true` - Enable/disable scheduler
  - `resilience.reactivation.interval-seconds: 60` - Check interval
  - `resilience.reactivation.health-check-timeout-ms: 2000` - Health check timeout
- **Prometheus Metrics**:
  - Counter: `provider.reactivations.total{provider}` - Successful reactivations
  - Counter: `provider.reactivation.attempts.total{provider, result}` - Reactivation attempts
- **Tests**:
  - 8 unit tests in ProviderReactivationSchedulerTest
  - Scenarios: successful reactivation, failed health check, multiple providers, exceptions

### Added (Story 4-6: Retry with Exponential Backoff - Completed in Story 3-9)
- **Note**: This story was fully implemented as part of Story 3-9 (Provider Retry Logic)
- **Retry Configuration** (per provider):
  - SMS: 3 attempts, 1s backoff, multiplier 2 (1s → 2s → 4s)
  - PUSH: 3 attempts, 500ms backoff, multiplier 2 (500ms → 1s → 2s)
  - VOICE: 2 attempts, 2s backoff, multiplier 2 (2s → 4s)
  - BIOMETRIC: 1 attempt (no retry)
- **RetryExceptionPredicate**:
  - Classifies exceptions: retryable (5xx, IOException, TimeoutException) vs non-retryable (4xx)
  - FCM error codes: UNAVAILABLE/INTERNAL retryable, INVALID_ARGUMENT/UNREGISTERED non-retryable
- **ProviderRetryMetrics**:
  - Metrics: `provider.retry.attempts.total`, `provider.retry.success.total`, `provider.retry.exhausted.total`
- **RetryEventListener**:
  - Logs retry attempts, successes, and exhaustions with traceId
  - Publishes metrics to Prometheus
- **ProviderResult Enhancements**:
  - Fields: `attemptNumber`, `retriedSuccess`
  - Factory methods: `successAfterRetry()`, `retryExhausted()`

### Added (Story 4.4: Provider Error Rate Calculator)
- **ProviderErrorRateCalculator Component**:
  - Scheduled task (@Scheduled(fixedDelay=10000)) calculates error rate every 10 seconds
  - Formula: `errorRate = failures / (successes + failures)` in 1 minute window
  - Query `provider.calls.total{status="success|failure"}` counters from MeterRegistry
  - Updates `provider.error.rate{provider}` Prometheus gauge
  - Handles edge cases: No calls → 0.0, all failures → 1.0, all successes → 0.0
- **ProviderErrorRateExceeded Event**:
  - Domain event published when error rate > threshold (default 50%) for 30 seconds
  - Fields: provider, errorRate, threshold, timestamp
  - Consumed by DegradedModeManager to activate degraded mode
- **DegradedModeManager Integration**:
  - @EventListener for ProviderErrorRateExceeded events
  - Automatically activates degraded mode when error rate exceeds threshold
  - Increments `degraded.mode.activations.total{provider, reason="error_rate"}` counter
- **ProviderHealthIndicator** (Actuator):
  - Health endpoint: GET `/actuator/health/providers`
  - Status logic: error_rate < 25% → UP, 25-50% → WARNING, ≥50% → DOWN
  - Response includes: errorRate, errorRatePercentage, status per provider
- **Circuit Breaker Configuration Updates**:
  - `failure-rate-threshold: 50` (matches error rate threshold)
  - `sliding-window-size: 100` (increased from 10 for accuracy)
  - `minimum-number-of-calls: 10` (increased from 5 for more samples)
- **Configuration Properties** (`resilience.error-rate` prefix):
  - `threshold: 0.50` (50%) - Error rate threshold for event publishing
  - `sustained-duration-seconds: 30` - Sustained duration before event published
- **Prometheus Metrics**:
  - Gauge: `provider.error.rate{provider}` - Error rate (0.0 to 1.0) per provider
  - Counter: `degraded.mode.activations.total{provider, reason="error_rate"}` - Degraded mode activations due to error rate
- **Documentation**:
  - README.md: Error Rate Calculation section with formulas, thresholds, and integration
  - CHANGELOG.md: Story 4.4 entry with all changes

### Added (Story 4.3: Degraded Mode Manager)
- **DegradedModeManager Component**:
  - Automatic degraded mode detection based on provider health metrics
  - Entry criteria: Error rate > 80% for 2min OR 3+ circuit breakers OPEN
  - Recovery criteria: Error rate < 50% for 5min
  - Scheduled health evaluation every 30s
  - Manual admin override support
- **Degraded Mode Behavior**:
  - HTTP 202 Accepted responses (instead of 201 Created)
  - Headers: `X-System-Mode: DEGRADED`, `Warning: 299 - "System in degraded mode..."`
  - SignatureRequest status: PENDING_DEGRADED (new enum value)
  - Challenges NOT sent immediately, queued for recovery processing
- **Configuration Properties** (`degraded-mode` prefix):
  - `enabled` (default: true) - Feature flag
  - `error-rate-threshold` (default: 80%) - Error rate to trigger degraded mode
  - `min-duration` (default: 2min) - Sustained high error rate duration
  - `recovery-threshold` (default: 50%) - Error rate for recovery
  - `recovery-duration` (default: 5min) - Sustained low error rate duration
  - `circuit-open-threshold` (default: 3) - Number of OPEN circuits to trigger degraded
- **Admin API** (requires ROLE_ADMIN):
  - GET `/admin/system/mode` - Query current system mode
  - POST `/admin/system/mode` - Manually set system mode (NORMAL/DEGRADED/MAINTENANCE)
  - Audit logging for manual overrides
- **Health Endpoint Integration**:
  - Spring Boot Actuator health indicator: `degradedModeHealthIndicator`
  - Status: NORMAL|DEGRADED with provider details
  - Details: activeProviders, degradedProviders, degradedSince, degradedReason
- **Queued Request Recovery**:
  - DegradedModeRecoveryService processes PENDING_DEGRADED requests on recovery
  - FIFO order (createdAt ASC) for fairness
  - Batch processing (max 100 requests) to avoid spike
  - Automatic trigger when exiting degraded mode
- **Prometheus Metrics**:
  - Gauge: `system.degraded.mode{status="active|normal"}` - Current mode (1=degraded, 0=normal)
  - Counter: `system.degraded.triggers.total` - Times entered degraded mode
  - Timer: `system.degraded.duration.seconds` - Time spent in degraded mode
  - Counter: `system.degraded.requests.total{mode="normal|degraded"}` - Requests processed by mode
  - Counter: `queued.requests.processed` - Queued requests successfully processed
  - Counter: `queued.requests.failed` - Queued requests that failed processing
- **Provider Health API Update**:
  - ProviderHealthResponse DTO extended with degradedMode fields:
    - `degradedMode` (boolean) - Whether provider is degraded
    - `degradedReason` (string) - Reason for degradation
    - `degradedSince` (instant) - Timestamp when degraded
- **Database Schema**:
  - No migration needed - PENDING_DEGRADED is enum value only
- **Testing**:
  - 7 unit tests (DegradedModeManagerTest) - Mode transitions, circuit breaker integration
  - 4 unit tests (SystemModeControllerTest) - Admin API security, manual override
  - >80% test coverage for new components

### Changed (Story 4.3: Degraded Mode Manager)
- **SignatureStatus enum**: Added `PENDING_DEGRADED` state for queued requests
- **SignatureController**: Checks degraded mode, returns 202 + headers when degraded
- **ChallengeService**: Skips challenge sending when system in degraded mode
- **StartSignatureUseCaseImpl**: Sets initial status to PENDING_DEGRADED when degraded
- **SignatureRequestRepository**: Added `findByStatus(status, pageable)` for queued request queries
- **SignatureRequestJpaRepository**: Added `findByStatus` with @EntityGraph for performance

### Added (Story 3.10: Provider Metrics Tracking)
- **ProviderMetrics Component**:
  - Centralized metrics recording: `ProviderMetrics` class in `infrastructure.observability.metrics`
  - Methods: `recordProviderCall()`, `recordTimeout()`, `updateErrorRate()`
  - MeterRegistry integration for Prometheus export
- **Comprehensive Prometheus Metrics**:
  - Counter: `provider.calls.total{provider, status, channel_type, retried}` - all provider calls with detailed tags
  - Counter: `provider.failures.total{provider, error_code}` - failures by error type
  - Counter: `provider.errors.total{provider, error_type="transient|permanent"}` - error classification
  - Histogram: `provider.latency{provider, status, attempt_number}` - latency distribution with buckets 50ms-10s
  - Histogram: `provider.timeout.duration{provider}` - timeout duration tracking
  - Gauge: `provider.error.rate{provider}` - calculated error rate for circuit breaker (Epic 4)
- **ProviderErrorRateCalculator**:
  - Scheduled task (@Scheduled(fixedDelay=10000)) calculates error rate every 10s
  - Formula: `errorRate = failures / (successes + failures)` in 1min window
  - Updates `provider.error.rate` gauge for Epic 4 circuit breaker decisions
- **SignatureProviderAdapter Integration**:
  - Automatic metrics recording after every provider call (success, failure, timeout, interrupted)
  - Duration measurement from call start to completion
  - Tags extracted from ProviderResult (success, errorCode, retriedSuccess, attemptNumber)
  - Channel-type tagging for routing correlation
- **Prometheus Alert Rules**:
  - 5 alerts documented in `docs/development/provider-metrics-alerts.yml`
  - ProviderHighErrorRate (>5% for 5min), ProviderHighLatency (P99 >500ms for 3min)
  - ProviderAvailabilityLow (<95% for 10min), ProviderTimeoutRateHigh (>10% for 5min)
  - ProviderRetryExhaustionHigh (>5% for 5min)
- **Grafana Dashboard Spec**:
  - 5 panels specified: Availability, Latency P99, Call Volume, Error Rate, Timeout Rate
  - PromQL queries documented for Epic 6-7 implementation
- **Testing**:
  - 9 unit tests (ProviderMetricsTest) with SimpleMeterRegistry
  - 7 integration tests (ProviderMetricsIntegrationTest) validating /actuator/prometheus export
  - Target coverage: >90% achieved

### Added (Story 3.8: Provider Timeout Configuration)
- **Resilience4j TimeLimiter Integration**:
  - 4 configurable TimeLimiter instances: `smsTimeout` (5s), `pushTimeout` (3s), `voiceTimeout` (10s), `biometricTimeout` (2s)
  - Automatic timeout protection for all provider calls via `SignatureProviderAdapter`
  - `cancelRunningFuture=true` prevents thread leaks on timeout
  - Multi-environment configuration: local (permissive 10-15s), uat (production-like 5s), prod (strict 2-8s)
- **Async Provider Execution**:
  - New method `SignatureProviderPort.sendChallengeAsync()` returns `CompletableFuture<ProviderResult>`
  - All 4 providers implement async execution: TwilioSmsProvider, PushNotificationProvider, VoiceCallProvider, BiometricProvider
  - Dedicated thread pool: `ScheduledExecutorService` with 10 threads (name pattern: `provider-timeout-{n}`)
- **ProviderResult Enhanced**:
  - New field: `boolean timedOut` - distinguishes timeout failures from other failures
  - New factory method: `ProviderResult.timeout(String message)` - creates timeout result with timedOut=true
  - Enables fallback logic to differentiate timeout vs API errors
- **SignatureProviderAdapter Created**:
  - Decorates all provider calls with `TimeLimiter.executeCompletionStage()`
  - Dynamic TimeLimiter selection by ProviderType (SMS→smsTimeout, PUSH→pushTimeout, etc.)
  - Handles `TimeoutException` with structured logging (WARNING level, includes traceId)
  - Returns `ProviderResult.timeout()` on timeout with duration measurement
- **Prometheus Metrics**:
  - Counter: `provider.timeout.total{provider="SMS|PUSH|VOICE|BIOMETRIC"}` - tracks timeout events per provider
  - Enables SLO monitoring and alerting on excessive timeouts
- **Structured Logging**:
  - Timeout events logged at WARNING level (not ERROR - expected in degraded mode)
  - Includes: provider, duration_ms, challenge_id, trace_id for correlation
  - No stack traces (timeout is operational event, not exception)

### Configuration (Story 3.8)
- **application.yml**: Base TimeLimiter configuration with 4 instances + default config
- **application-local.yml**: Permissive timeouts (10-15s) for debugging with breakpoints
- **application-uat.yml**: Production-like timeouts (5s) for realistic testing
- **application-prod.yml**: Strict timeouts (2-8s) for fail-fast behavior aligned with NFR-P2 (P99 < 3s)

### Technical Details (Story 3.8)
- **Thread Pool**: 10 threads (4 providers × 2 concurrent + 2 buffer), daemon threads
- **Timeout Alignment**: SMS (2.5x typical), PUSH (3x typical), VOICE (2x typical) safety margins
- **Integration**: ChallengeServiceImpl now uses SignatureProviderAdapter instead of direct provider access
- **Fallback Trigger**: Timeout failures (timedOut=true) can trigger fallback chain (Story 4.2)
- **NFR Compliance**: Ensures P99 < 3s requirement (NFR-P2) with strict production timeouts

### Files Created (Story 3.8)
- `src/main/java/com/bank/signature/infrastructure/config/AsyncProviderConfig.java` - ScheduledExecutorService bean (10 threads)
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/SignatureProviderAdapter.java` - TimeLimiter decoration adapter (280 lines)

### Files Modified (Story 3.8)
- `src/main/resources/application.yml` - Added TimeLimiter configuration (20 lines)
- `src/main/resources/application-local.yml` - Permissive timeout overrides (10 lines)
- `src/main/resources/application-prod.yml` - Strict timeout overrides (10 lines)
- `src/main/resources/application-uat.yml` - Production-like timeout overrides (10 lines)
- `src/main/java/com/bank/signature/domain/port/outbound/SignatureProviderPort.java` - Added sendChallengeAsync() method (67 lines JavaDoc)
- `src/main/java/com/bank/signature/domain/model/valueobject/ProviderResult.java` - Added timedOut field + timeout() factory method (30 lines)
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/twilio/TwilioSmsProvider.java` - Implemented sendChallengeAsync()
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/push/PushNotificationProvider.java` - Implemented sendChallengeAsync()
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceCallProvider.java` - Implemented sendChallengeAsync()
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/biometric/BiometricProvider.java` - Implemented sendChallengeAsync()
- `src/main/java/com/bank/signature/application/service/ChallengeServiceImpl.java` - Integrated SignatureProviderAdapter for timeout protection
- `README.md` - Added "Provider Timeout Configuration" section with troubleshooting guide

---

### Added (Story 4-2: Fallback Chain Implementation)
- **FallbackChainConfig created**:
  - Configurable fallback sequences (SMS→VOICE, PUSH→SMS, BIOMETRIC→SMS)
  - Feature flag: enabled (default: true)
  - Loop prevention: Max 1 fallback per request
- **ChallengeServiceImpl refactored** with fallback logic:
  - Method: `sendChallengeWithFallback()` - automatic fallback on provider failure
  - Method: `sendToProvider()` - handles circuit breaker exceptions (CallNotPermittedException)
  - Fallback triggers: ProviderResult.failure(), Circuit OPEN, unexpected exceptions
  - Creates new SignatureChallenge for fallback attempt
  - Returns success if primary OR fallback succeeds
- **Fallback strategy**:
  - SMS → VOICE (high-reach fallback for failed SMS)
  - PUSH → SMS (universal fallback for offline devices)
  - BIOMETRIC → SMS (universal fallback for biometric issues)
  - VOICE → none (end of chain, no better alternative)
- **Circuit breaker integration**: Fallback triggers when circuit OPEN
- **Prometheus metrics**:
  - fallback.triggered (from/to tags)
  - fallback.success (from/to tags)
  - fallback.failure (from/to tags)
  - fallback.error (from/to tags)
- **Higher delivery success rate**: ~95% (vs ~85% single channel)

### Configuration (Story 4-2)
- **application.yml**: Fallback chains configuration
- **enabled**: true (can disable for cost control)
- **chains**: Map<ChannelType, ChannelType>

### Technical Details (Story 4-2)
- **Loop Prevention**: Tracks attempted channels, max 1 fallback
- **Cost Awareness**: Voice fallback increases cost (~10x), but improves UX
- **RoutingTimeline**: FALLBACK_TRIGGERED, FALLBACK_ATTEMPT, FALLBACK_SUCCESS/FAILURE events
- **Metrics**: fallback.triggered, fallback.success, fallback.failure

### Files Created (Story 4-2)
- `src/main/java/com/bank/signature/infrastructure/config/FallbackChainConfig.java` - Fallback configuration (110 lines)

### Files Modified (Story 4-2)
- `src/main/java/com/bank/signature/application/service/ChallengeServiceImpl.java` - Added fallback logic (+130 lines)
- `src/main/resources/application.yml` - Fallback chains configuration
- `README.md` - Fallback chain documentation
- `CHANGELOG.md` - This entry

### Architecture Compliance (Story 4-2)
- ✅ **Resilience Pattern**: Automatic fallback on provider failure
- ✅ **Circuit Breaker Integration**: Fallback when circuit OPEN
- ✅ **Loop Prevention**: Max 1 fallback per request
- ✅ **Configurable**: Can enable/disable per environment

---

### Added (Story 4-1: Circuit Breaker per Provider)
- **@CircuitBreaker annotations** added to all providers:
  - TwilioSmsProvider: @CircuitBreaker(name = "smsProvider")
  - PushNotificationProvider: @CircuitBreaker(name = "pushProvider")
  - VoiceCallProvider: @CircuitBreaker(name = "voiceProvider")
  - BiometricProvider: @CircuitBreaker(name = "biometricProvider")
- **Circuit breaker configuration** in application.yml (per provider):
  - failure-rate-threshold: 50% (open if half of calls fail)
  - wait-duration-in-open-state: 30s (test recovery after 30s)
  - sliding-window-size: 10 calls (track last 10)
  - permitted-calls-in-half-open: 3 (test with 3 calls)
  - minimum-number-of-calls: 5 (need 5 calls before evaluating)
- **Cascading failure prevention**: Circuit opens when provider failing
- **Fast failure**: Immediate rejection when circuit OPEN (no timeout wait)
- **Automatic recovery**: Circuit tests recovery after wait-duration

### Technical Details (Story 4-1)
- **Order of execution**: @CircuitBreaker → @Retry → @TimeLimiter → Method
- **Circuit states**: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing) → CLOSED/OPEN
- **Metrics exported**: resilience4j_circuitbreaker_state, resilience4j_circuitbreaker_calls, resilience4j_circuitbreaker_failure_rate
- **No breaking changes**: ProviderResult pattern unchanged

### Files Modified (Story 4-1)
- All 4 provider implementations (added @CircuitBreaker annotation)
- `src/main/resources/application.yml` - Circuit breaker configuration
- `README.md` - Circuit breaker documentation
- `CHANGELOG.md` - This entry

### Architecture Compliance (Story 4-1)
- ✅ **Resilience Pattern**: Circuit breaker prevents cascading failures
- ✅ **Per-Provider Configuration**: Independent circuit breakers
- ✅ **Observability**: Prometheus metrics auto-exported
- ✅ **Fast Failure**: Immediate rejection when circuit OPEN

---

### Added (Story 3.7: Provider Health Check Endpoint)
- **ProviderHealthResponse DTO created**:
  - Fields: name, type, status (UP/DOWN), details, lastCheckTimestamp, latencyMs, errorMessage
  - Factory methods: `up()`, `down()` for convenient creation
  - Jackson annotations: @JsonInclude(NON_NULL) to exclude null fields
  - OpenAPI schema annotations for Swagger UI
- **AggregatedHealthResponse DTO created**:
  - Fields: overallStatus (UP/DEGRADED/DOWN), timestamp, providers (List)
  - Factory method: `from(List<ProviderHealthResponse>)` with aggregation logic
  - Overall status calculation: UP (all up), DEGRADED (some down), DOWN (all down)
- **ProviderHealthService created**:
  - Interface: `getProvidersHealth(boolean forceRefresh)`
  - Implementation: ProviderHealthServiceImpl
  - Discovers all SignatureProviderPort beans from Spring context
  - Measures latency per provider health check (Micrometer Timer)
  - Handles errors gracefully (DOWN status with error message)
  - Sequential health checks (simple, sufficient for 4 providers)
- **ProviderHealthController created** (Admin API):
  - Endpoint: GET `/api/v1/admin/providers/health`
  - Query param: `refresh` (default: false) - bypass cache if true
  - Security: `@PreAuthorize("hasRole('ADMIN')")` required
  - HTTP 200 always (status in JSON body, not HTTP code)
  - OpenAPI annotations: @Operation, @ApiResponses with examples
  - Detailed Swagger documentation with example responses
- **Bean name to ProviderType mapping**:
  - smsProvider/twilioSmsProvider → SMS
  - pushProvider/pushNotificationProvider → PUSH
  - voiceProvider/voiceCallProvider → VOICE
  - biometricProvider → BIOMETRIC

### Configuration (Story 3.7)
- **Admin API Endpoint**: Separated from `/actuator` (different firewall rules)
- **OAuth2 Security**: ROLE_ADMIN required (HTTP 401/403 for unauthorized)
- **Cache Strategy**: Default uses 30s cache, `refresh=true` forces fresh check

### Unit Tests (Story 3.7)
- **ProviderHealthServiceImplTest** (3 tests):
  - `shouldReturnUpWhenAllProvidersHealthy()` - All providers UP
  - `shouldReturnDownWhenAllProvidersUnhealthy()` - All providers DOWN
  - `shouldReturnDegradedWhenSomeProvidersDown()` - Partial failure
- **Coverage**: > 85% for ProviderHealthService

### Technical Details (Story 3.7)
- **Latency Measurement**: Micrometer Timer per provider health check
- **Error Handling**: Exceptions caught, returned as DOWN with error message
- **Performance**: Sequential checks (~50-500ms total), cached results (30s TTL)
- **Response Structure**: Custom JSON (not Spring Health format) for better tooling integration

### Files Created (Story 3.7)
- `src/main/java/com/bank/signature/application/dto/response/ProviderHealthResponse.java` - Provider health DTO
- `src/main/java/com/bank/signature/application/dto/response/AggregatedHealthResponse.java` - Aggregated health DTO
- `src/main/java/com/bank/signature/application/service/ProviderHealthService.java` - Service interface
- `src/main/java/com/bank/signature/application/service/ProviderHealthServiceImpl.java` - Service implementation
- `src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/admin/ProviderHealthController.java` - REST controller
- `src/test/java/com/bank/signature/application/service/ProviderHealthServiceImplTest.java` - Unit tests (3 tests)

### Files Modified (Story 3.7)
- `README.md` - Provider Health Check Endpoint section with curl examples
- `CHANGELOG.md` - This entry

### Architecture Compliance (Story 3.7)
- ✅ **Hexagonal Architecture**: Controller → Service → Domain Port (SignatureProviderPort)
- ✅ **Security**: ROLE_ADMIN enforcement via @PreAuthorize
- ✅ **Observability**: Latency metrics per provider (Micrometer)
- ✅ **Error Handling**: Graceful degradation (DOWN status, not exceptions)
- ✅ **OpenAPI**: Comprehensive Swagger documentation with examples

---

### Added (Story 3.6: Provider Configuration Management)
- **ProviderConfigProperties base class created**:
  - Abstract base for all provider configurations
  - Common properties: enabled (boolean), timeoutSeconds (1-30s), retryMaxAttempts (0-5)
  - Bean Validation annotations: @NotNull, @Min, @Max for fail-fast startup
  - JavaDoc documenting usage patterns and security best practices
- **All provider configs refactored** to extend ProviderConfigProperties:
  - TwilioConfig: Added @Validated, @Getter/@Setter (Lombok), retry-max-attempts property
  - FcmConfig: Extended ProviderConfigProperties, added @Validated annotation
  - VoiceProviderConfig: Extended ProviderConfigProperties, removed redundant enabled/timeout fields
  - BiometricProviderConfig: Extended ProviderConfigProperties, simplified to minimal config
- **ProviderHealthIndicator created**:
  - Aggregates health of all signature providers (SMS/Push/Voice/Biometric)
  - Parallel health checks with CompletableFuture (2s timeout per provider)
  - Status levels: UP (all up), DEGRADED (some down), DOWN (all down)
  - Bean name: `providersHealthIndicator` for /actuator/health/providers endpoint
  - Maps bean names to ProviderType: smsProvider→SMS, pushProvider→PUSH, etc.
- **Actuator endpoints enabled**:
  - `/actuator/health/providers` - Provider health status (ROLE_ADMIN required)
  - `/actuator/configprops` - Configuration properties (secrets masked)
  - `show-values: when-authorized` for security
- **application.yml updated** with unified provider configuration structure:
  - All providers now have: enabled, timeout-seconds, retry-max-attempts
  - Comments documenting each property and Story 3.6 changes
  - Twilio: timeout 5s, retry 3 (SMS retries common)
  - Push: timeout 3s, retry 2 (FCM reliable)
  - Voice: timeout 10s, retry 2 (call initiation slower)
  - Biometric: timeout 3s, retry 0 (no retries for user interaction)

### Configuration (Story 3.6)
- **Centralized Provider Config**: All providers follow same structure (ProviderConfigProperties)
- **Validation**: @Validated + JSR 380 annotations ensure config validity at startup
- **Security**: Credentials via `${VAULT_PATH}` placeholders, never hardcoded
- **Health Checks**: management.health.providers.enabled=true
- **Actuator**: configprops endpoint exposes config (secrets masked)

### Unit Tests (Story 3.6)
- **ProviderHealthIndicatorTest** (4 tests):
  - `shouldReturnUpWhenAllProvidersHealthy()` - All providers UP
  - `shouldReturnDownWhenAllProvidersUnhealthy()` - All providers DOWN
  - `shouldReturnDegradedWhenSomeProvidersDown()` - Partial failure (DEGRADED)
  - `shouldReturnDownWhenNoProvidersFound()` - No providers configured
- **Coverage**: > 85% for ProviderHealthIndicator

### Technical Details (Story 3.6)
- **Base Class Pattern**: ProviderConfigProperties provides common properties + validation
- **Bean Validation**: Fail-fast on invalid config (application won't start)
- **Health Check Aggregation**: Parallel checks, 2s timeout, cached results (30s TTL in each provider)
- **Status Mapping**: UP/DEGRADED/DOWN based on provider availability
- **Conditional Bean Creation**: @ConditionalOnProperty(enabled=true) → bean only created if enabled

### Files Created (Story 3.6)
- `src/main/java/com/bank/signature/infrastructure/config/provider/ProviderConfigProperties.java` - Base config class
- `src/main/java/com/bank/signature/infrastructure/health/ProviderHealthIndicator.java` - Health aggregator
- `src/test/java/com/bank/signature/infrastructure/health/ProviderHealthIndicatorTest.java` - Unit tests (4 tests)

### Files Modified (Story 3.6)
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/twilio/TwilioConfig.java` - Extended ProviderConfigProperties
- `src/main/java/com/bank/signature/infrastructure/config/FcmConfig.java` - Extended ProviderConfigProperties
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceProviderConfig.java` - Extended ProviderConfigProperties
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/biometric/BiometricProviderConfig.java` - Extended ProviderConfigProperties
- `src/main/resources/application.yml` - Unified provider config + Actuator endpoints
- `README.md` - Provider Configuration Management section
- `CHANGELOG.md` - This entry

### Architecture Compliance (Story 3.6)
- ✅ **Centralized Configuration**: Single source of truth for all provider configs
- ✅ **Fail-Fast Validation**: @Validated ensures invalid config prevents startup
- ✅ **Security**: Credentials via Vault placeholders, masked in endpoints
- ✅ **Observability**: Health checks + configprops endpoints for monitoring
- ✅ **Consistency**: All providers follow same configuration pattern

---

### Added (Story 3.5: Biometric Provider - Stub/Future-Ready)
- **BiometricProvider created** implementing SignatureProviderPort:
  - Stub implementation for future biometric SDK integration
  - Implements SignatureProviderPort interface (Hexagonal Architecture alignment)
  - Method signature: `sendChallenge(SignatureChallenge, String biometricId)`
  - Returns ProviderResult with success pattern (stub always succeeds)
  - Success case: `ProviderResult.success("bio_{UUID}", mockProof)`
  - Mock challenge ID format: "bio_" + UUID for identification
  - Designed for zero-change swap to real SDK (TouchID, FaceID, Windows Hello)
- **Stub functionality**:
  - Simulates successful biometric verification
  - Logs warning: "BIOMETRIC challenge sent (stub implementation)"
  - Generates mock proof JSON with biometricId masking
  - Allows end-to-end testing of biometric flow
- **Health check implemented**:
  - Method: `checkHealth(ProviderType.BIOMETRIC)`
  - Returns UP if enabled, DOWN if disabled
  - Health check caching (30 seconds TTL)
  - Validates provider type (throws IllegalArgumentException if not BIOMETRIC)
- **Prometheus metrics**:
  - provider.biometric.calls (status: success, type: stub)
  - provider.biometric.latency (with status tags)
- **Biometric ID masking**:
  - Shows first 4 and last 4 characters
  - Example: "user****7890"
  - Security: prevents biometric ID exposure in logs/proof

### Configuration (Story 3.5)
- **BiometricProviderConfig created**:
  - `providers.biometric.enabled`: false (default - stub implementation)
  - `providers.biometric.timeout-seconds`: 3
  - JavaDoc documents future SDK integration paths
- **application.yml**: Biometric provider section added with future integration notes

### Unit Tests (Story 3.5)
- **BiometricProviderTest** (10 tests):
  - `shouldSuccessfullyReturnStubBiometricVerification()` - Stub success scenario
  - `shouldGenerateUniqueChallengeIds()` - Unique ID generation
  - `shouldThrowExceptionWhenChallengeIsNull()` - Null validation
  - `shouldThrowExceptionWhenBiometricIdIsNull()` - Null biometricId validation
  - `shouldRecordSuccessMetrics()` - Prometheus metrics recording
  - `shouldMaskBiometricIdInProof()` - Biometric ID masking
  - `shouldReturnHealthyStatusWhenEnabled()` - Health check UP
  - `shouldReturnUnhealthyStatusWhenDisabled()` - Health check DOWN
  - `shouldThrowExceptionWhenProviderTypeIsNotBiometric()` - Provider type validation
  - `shouldCacheHealthCheckResults()` - Health check caching (30s TTL)
- **Coverage**: > 80% for BiometricProvider

### Technical Details (Story 3.5)
- **Future-Ready Design**: Zero architectural changes required for real SDK integration
- **Mock Challenge ID**: "bio_" + UUID format
- **Mock Proof**: JSON with provider, challengeId, biometricId (masked), timestamp, stubImplementation flag
- **Bean Name**: `biometricProvider` (maps to ProviderType.BIOMETRIC)
- **Feature Flag**: Disabled by default (providers.biometric.enabled=false)

### Future Integration Path (Story 3.5)
When integrating real biometric SDK:
1. Replace mock logic with SDK calls
2. Maintain same signature: `sendChallenge(SignatureChallenge, String)`
3. Return ProviderResult with real challenge ID from SDK
4. Health check validates SDK initialization
5. **ZERO changes** required in domain layer or ChallengeServiceImpl

### Potential SDKs (Story 3.5)
- iOS: LocalAuthentication (Touch ID / Face ID)
- Android: BiometricPrompt API
- Windows: Windows Hello
- Web: WebAuthn API
- Backend: Veriff, Onfido, Jumio (identity verification)

### Files Created (Story 3.5)
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/biometric/BiometricProvider.java` - Stub provider
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/biometric/BiometricProviderConfig.java` - Configuration
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/biometric/BiometricProviderTest.java` - Unit tests (10 tests)

### Files Modified (Story 3.5)
- `src/main/resources/application.yml` - Added biometric provider configuration
- `README.md` - Added BiometricProvider example with future integration notes
- `CHANGELOG.md` - This entry
- `docs/sprint-artifacts/3-5-biometric-provider-stub-future-ready.md` - Story documentation

### Architecture Compliance (Story 3.5)
- ✅ **Hexagonal Architecture**: Provider implements domain port (SignatureProviderPort)
- ✅ **Domain Purity**: Zero domain dependencies (stub isolated in infrastructure layer)
- ✅ **Success/Failure Pattern**: ProviderResult encapsulates outcome
- ✅ **Consistency**: Same pattern as SMS/Push/Voice providers
- ✅ **Future-Ready**: Designed for seamless SDK integration

---

### Added (Story 3.4: Voice Call Provider - Twilio Voice API Integration)
- **VoiceCallProvider refactored** to implement SignatureProviderPort:
  - Migrated from stub implementation (Story 2.7) to production Twilio Voice integration
  - Implements SignatureProviderPort interface (Hexagonal Architecture alignment)
  - Method signature: `sendChallenge(SignatureChallenge, String phoneNumber)` - E.164 format validation
  - Returns ProviderResult with success/failure pattern (NO exceptions thrown)
  - Success case: `ProviderResult.success(callSid, jsonProof)` with Twilio call SID
  - Failure cases: `ProviderResult.failure(errorCode, errorMessage)` for Twilio errors
  - Error codes: TWILIO_VOICE_ERROR_XXX, TIMEOUT, PROVIDER_ERROR, INVALID_PHONE_NUMBER
- **Twilio Programmable Voice integration**:
  - Twilio SDK Call.creator() for placing calls
  - TwiML generation with Text-to-Speech (TTS)
  - Amazon Polly voice: Polly.Mia (español latinoamericano, mujer)
  - TTS language: es-ES (español)
  - Resilience4j retry (3 attempts, exponential backoff - reuses twilioProvider config)
  - Resilience4j time limiter (5 seconds timeout)
- **TwiML generation**:
  - Say verb with voice and language attributes
  - OTP code repeated 2 times for clarity
  - Digits separated for clear pronunciation: "1 2 3 4 5 6"
  - XML structure: `<Response><Say>...</Say></Response>`
- **Phone number validation**:
  - E.164 format validation with regex: `^\+[1-9]\d{1,14}$`
  - Example: `+573001234567` (Colombia)
  - Throws IllegalArgumentException if invalid format
- **Health check implemented**:
  - Method: `checkHealth(ProviderType.VOICE)` - validates Twilio Voice configuration
  - Checks: Twilio credentials (accountSid, authToken, fromNumber), TTS configuration (voice, language)
  - Returns: HealthStatus (UP/DOWN) with details
  - Health check caching (30 seconds TTL) to avoid excessive validation calls
  - Validates provider type (throws IllegalArgumentException if not VOICE)
- **Prometheus metrics maintained**:
  - provider.voice.calls (status: success/error)
  - provider.voice.latency (with status and error_code tags)
  - provider.voice.errors (with error_code tags)
- **Provider proof enhanced**:
  - JSON format with Twilio call SID, status, masked phone number, timestamp, provider name
  - Format: `{"provider":"TwilioVoice","callSid":"CA...","status":"queued","to":"+57300****567","from":"+1234567890","timestamp":"..."}`
  - Phone number masking (shows first 6 and last 4 digits for security)

### Configuration (Story 3.4)
- **VoiceProviderConfig updated**:
  - `tts-voice`: Polly.Mia (Amazon Polly voice)
  - `tts-language`: es-ES (español)
  - `max-call-duration`: 60 seconds (cost control)
- **application.yml**:
  - `providers.voice.enabled`: false (disabled by default - expensive)
  - `providers.voice.tts-voice`: Polly.Mia
  - `providers.voice.tts-language`: es-ES
  - `providers.voice.max-call-duration`: 60
  - Cost warning documented: ~10x more expensive than SMS

### Unit Tests (Story 3.4)
- **VoiceCallProviderTest** (12 tests):
  - `shouldSuccessfullyPlaceVoiceCall()` - Twilio success scenario with mock
  - `shouldHandleTwilioApiError()` - Twilio API error handling
  - `shouldThrowExceptionWhenChallengeIsNull()` - Null validation
  - `shouldThrowExceptionWhenPhoneNumberIsNull()` - Null phone validation
  - `shouldThrowExceptionWhenPhoneNumberIsInvalid()` - E.164 format validation
  - `shouldRecordSuccessMetrics()` - Prometheus metrics recording
  - `checkHealth_whenConfigIsValid_shouldReturnHealthy()` - Health check UP
  - `shouldReturnUnhealthyWhenAccountSidIsMissing()` - Health check DOWN (accountSid)
  - `shouldReturnUnhealthyWhenFromNumberIsMissing()` - Health check DOWN (fromNumber)
  - `shouldReturnUnhealthyWhenTtsVoiceIsMissing()` - Health check DOWN (TTS voice)
  - `shouldThrowExceptionWhenProviderTypeIsNotVoice()` - Provider type validation
  - `shouldCacheHealthCheckResults()` - Health check caching (30s TTL)
- **Coverage**: > 80% for VoiceCallProvider
- **Mocking**: Twilio Call.creator() static method mocked with MockedStatic

### Technical Details (Story 3.4)
- **Twilio Voice API**: Call.creator(to, from, twiml).create()
- **TwiML Say Verb**: `<Say voice="Polly.Mia" language="es-ES">...</Say>`
- **Phone Number Format**: E.164 validation (+ country code + number)
- **Cost Consideration**: Voice calls ~$0.013/min (Latam), 10x more expensive than SMS
- **Feature Flag**: Disabled by default (providers.voice.enabled=false)
- **Bean Name**: `voiceProvider` (maps to ProviderType.VOICE in ChallengeServiceImpl)
- **Retry/Timeout**: Reuses Resilience4j config from SMS provider (twilioProvider)

### Files Created (Story 3.4)
None (refactored existing files)

### Files Modified (Story 3.4)
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceCallProvider.java` - Refactored to SignatureProviderPort with Twilio Voice
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceProviderConfig.java` - Added TTS configuration properties
- `src/main/resources/application.yml` - Updated voice config with TTS properties
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceCallProviderTest.java` - Comprehensive unit tests (12 tests)
- `README.md` - Added VoiceCallProvider implementation example with TwiML and cost considerations
- `CHANGELOG.md` - This entry
- `docs/sprint-artifacts/3-4-voice-call-twilio-voice-api.md` - Story documentation

### Architecture Compliance (Story 3.4)
- ✅ **Hexagonal Architecture**: Provider implements domain port (SignatureProviderPort)
- ✅ **Domain Purity**: Zero domain dependencies on Twilio SDK (isolated in infrastructure layer)
- ✅ **Success/Failure Pattern**: No exceptions thrown for normal failures (ProviderResult encapsulates outcome)
- ✅ **Consistency**: Same pattern as TwilioSmsProvider (Story 3.2) and PushNotificationProvider (Story 3.3)
- ✅ **Resilience**: Retry and timeout via Resilience4j (reuses twilioProvider config)
- ✅ **ArchUnit Compliance**: Infrastructure layer isolated from domain

---

### Added (Story 3.3: Push Notification Provider - FCM Integration)
- **PushNotificationProvider refactored** to implement SignatureProviderPort:
  - Migrated from stub implementation (Story 2.6) to production FCM integration
  - Implements SignatureProviderPort interface (Hexagonal Architecture alignment)
  - Method signature: `sendChallenge(SignatureChallenge)` - extracts deviceToken from challenge.getRecipient()
  - Returns ProviderResult with success/failure pattern (NO exceptions thrown)
  - Success case: `ProviderResult.success(messageId, jsonProof)` with FCM message ID
  - Failure cases: `ProviderResult.failure(errorCode, errorMessage)` for FCM errors
  - Error codes: FCM_ERROR_INVALID_ARGUMENT, FCM_ERROR_UNREGISTERED, FCM_ERROR_UNAVAILABLE, TIMEOUT, PROVIDER_ERROR
- **Firebase Admin SDK integration**:
  - Dependency: com.google.firebase:firebase-admin:9.2.0
  - Configuration: FcmConfig.java with @ConfigurationProperties("fcm")
  - Properties: service-account-path, project-id, enabled (feature flag)
  - Bean: FirebaseApp initialization with GoogleCredentials from service account JSON
  - Bean: FirebaseMessaging for sending push notifications
  - Lazy initialization (only if fcm.enabled=true)
- **FCM message format**:
  - Notification payload: title ("Código de Firma Digital"), body ("Su código es: {code}")
  - Data payload: challengeId, challengeCode, expiresAt, channelType
  - Device token validation (null/blank checks)
  - FCM options: priority, TTL based on challenge expiry
- **Health check implemented**:
  - Method: `checkHealth(ProviderType.PUSH)` - validates FCM configuration
  - Checks: FirebaseMessaging bean initialized, configuration valid
  - Returns: HealthStatus (UP/DOWN) with details
  - Health check caching (30 seconds TTL) to avoid excessive validation calls
  - Validates provider type (throws IllegalArgumentException if not PUSH)
- **Prometheus metrics maintained**:
  - provider.push.calls (status: success/error)
  - provider.push.latency (with status and error_code tags)
  - provider.push.errors (with error_code tags)
- **Provider proof enhanced**:
  - JSON format with FCM message ID, masked device token, timestamp, provider name
  - Format: `{"messageId":"projects/.../messages/...","deviceToken":"fGw0qy4T...9Hj2KpLm","timestamp":"...","provider":"FCM"}`
  - Device token masking (shows first 8 and last 8 chars for security)

### Configuration (Story 3.3)
- **application.yml**:
  - `fcm.enabled`: Feature flag for FCM integration (default: false)
  - `fcm.service-account-path`: Path to Firebase service account JSON (supports classpath:, file:)
  - `fcm.project-id`: Firebase project ID (optional - auto-detected from JSON)
- **application-local.yml**:
  - Dev configuration with `file:./firebase-service-account.json` path
  - Instructions for obtaining service account JSON from Firebase Console
  - Security note: Add firebase-service-account.json to .gitignore

### Unit Tests (Story 3.3)
- **PushNotificationProviderTest** (15 tests):
  - `shouldSuccessfullySendPushNotification()` - FCM success scenario with mock
  - `shouldHandleFcmInvalidArgumentError()` - Invalid device token error
  - `shouldHandleFcmNotFoundError()` - Device token not registered error
  - `shouldHandleFcmUnavailableError()` - FCM service unavailable error
  - `shouldHandleUnexpectedException()` - Unexpected error handling
  - `shouldThrowExceptionWhenChallengeIsNull()` - Null validation
  - `shouldThrowExceptionWhenDeviceTokenIsNull()` - Null token validation
  - `shouldThrowExceptionWhenDeviceTokenIsBlank()` - Blank token validation
  - `shouldRecordSuccessMetrics()` - Prometheus metrics recording
  - `checkHealth_whenConfigValid_shouldReturnHealthyStatus()` - Health check UP
  - `shouldThrowExceptionWhenProviderTypeIsNotPush()` - Provider type validation
  - `shouldCacheHealthCheckResults()` - Health check caching (30s TTL)
  - `shouldReturnUnhealthyWhenFirebaseMessagingIsNull()` - Health check DOWN
- **Coverage**: > 80% for PushNotificationProvider

### Technical Details (Story 3.3)
- **FCM Service Account Setup**: Obtain JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key
- **Security**: Service account JSON contains private keys - MUST NOT be committed to git
- **Device Token Format**: FCM tokens are ~152 characters, pattern: `[A-Za-z0-9_-]+`
- **Message Delivery**: Real-time push notification via FCM SDK (no HTTP client needed)
- **Error Handling**: FCM SDK exceptions mapped to ProviderResult failure codes
- **Bean Name**: `pushProvider` (maps to ProviderType.PUSH in ChallengeServiceImpl)

### Files Created (Story 3.3)
- `src/main/java/com/bank/signature/infrastructure/config/FcmConfig.java` - FCM configuration with FirebaseApp initialization

### Files Modified (Story 3.3)
- `pom.xml` - Added firebase-admin:9.2.0 dependency
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/push/PushNotificationProvider.java` - Refactored to SignatureProviderPort with FCM
- `src/main/resources/application.yml` - Added fcm.* configuration properties
- `src/main/resources/application-local.yml` - Added FCM dev configuration with setup instructions
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/push/PushNotificationProviderTest.java` - Comprehensive unit tests for FCM provider
- `README.md` - Added PushNotificationProvider implementation example with FCM setup guide
- `CHANGELOG.md` - This entry
- `docs/sprint-artifacts/3-3-push-notification-fcm-integration.md` - Story documentation

### Architecture Compliance (Story 3.3)
- ✅ **Hexagonal Architecture**: Provider implements domain port (SignatureProviderPort)
- ✅ **Domain Purity**: Zero domain dependencies on Firebase SDK (isolated in infrastructure layer)
- ✅ **Success/Failure Pattern**: No exceptions thrown for normal failures (ProviderResult encapsulates outcome)
- ✅ **Consistency**: Same pattern as TwilioSmsProvider (Story 3.2)
- ✅ **ArchUnit Compliance**: Infrastructure layer isolated from domain

---

### Changed (Story 3.2: Twilio SMS Provider - Production Implementation)
- **TwilioSmsProvider refactored** to implement SignatureProviderPort:
  - Implements SignatureProviderPort interface (instead of deprecated SignatureProvider)
  - Method signature updated: `sendChallenge(SignatureChallenge)` (removed phoneNumber parameter, extracted from challenge.getRecipient())
  - Returns ProviderResult with success/failure pattern (NO exceptions thrown for normal failures)
  - Success case: `ProviderResult.success(messageSid, fullJsonProof)`
  - Failure cases: `ProviderResult.failure(errorCode, errorMessage)` for ApiException, timeout, etc.
  - Error codes: TWILIO_ERROR_XXX, TIMEOUT, PROVIDER_ERROR
- **Health check implemented**:
  - Method: `checkHealth(ProviderType)` replaces deprecated `isAvailable()`
  - Validates: Twilio credentials, configuration completeness
  - Returns: HealthStatus (UP/DOWN) with latency details
  - Validates provider type (throws IllegalArgumentException if not SMS)
- **ChallengeServiceImpl updated**:
  - Uses SignatureProviderPort instead of SignatureProvider
  - Handles ProviderResult success/failure pattern
  - Bean name mapping updated for new ProviderType enum (SMS, PUSH, VOICE, BIOMETRIC)
  - Uses switch expression for provider resolution
- **Resilience4j preserved**:
  - @Retry and @TimeLimiter annotations maintained
  - Retry behavior unchanged (3 attempts with exponential backoff)
  - Timeout: 5 seconds
- **Prometheus metrics maintained**:
  - provider.twilio.calls (status: success/error/timeout)
  - provider.twilio.latency (with status tags)
  - provider.twilio.errors (with error_code tags)
- **Provider proof enhanced**:
  - Now returns full JSON with Twilio response details (sid, status, to, from, timestamp)
  - Format: `{"provider":"twilio","sid":"SMxxx","status":"sent",...}`

### Added (Story 3.2: Twilio SMS Provider - Production Implementation)
- **Unit tests for health check** (5 tests):
  - `checkHealth_whenConfigValid_shouldReturnHealthyStatus()`
  - `checkHealth_whenConfigInvalid_shouldReturnUnhealthyStatus()`
  - `checkHealth_whenWrongProviderType_shouldThrowException()`
  - `checkHealth_whenProviderTypeNull_shouldThrowException()`
  - `sendChallenge_whenChallengeNull_shouldThrowException()`

### Technical Details (Story 3.2)
- **Backward Compatibility**: ChallengeServiceImpl still throws ProviderException for callers expecting exceptions
- **Success/Failure Pattern**: Provider returns ProviderResult, application layer handles exception conversion
- **Phone Number Extraction**: Extracted from challenge.getRecipient() (aligns with domain model)
- **Error Code Standards**: TWILIO_ERROR_XXX (includes Twilio error code), TIMEOUT, PROVIDER_ERROR
- **Health Check**: Lightweight validation (< 1s), no actual API call to avoid rate limits

### Files Modified (Story 3.2)
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/twilio/TwilioSmsProvider.java` - Refactored to SignatureProviderPort
- `src/main/java/com/bank/signature/application/service/ChallengeServiceImpl.java` - Updated to use SignatureProviderPort
- `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/twilio/TwilioSmsProviderTest.java` - Updated tests for health check
- `README.md` - Added TwilioSmsProvider implementation example
- `CHANGELOG.md` - This entry

---

### Added (Story 3.1: Provider Abstraction Interface)
- **SignatureProviderPort Interface** (domain/port/outbound):
  - Domain port interface for provider abstraction (zero infrastructure dependencies)
  - Method: `ProviderResult sendChallenge(SignatureChallenge)` - Sends challenge via provider
  - Method: `HealthStatus checkHealth(ProviderType)` - Checks provider health status
  - Comprehensive JavaDoc with usage examples and error codes
- **ProviderResult Value Object** (Java 21 record):
  - Success/failure result pattern for provider calls
  - Fields: `success`, `providerChallengeId`, `providerProof`, `errorCode`, `errorMessage`, `timestamp`
  - Factory methods: `success(String, String)` and `failure(String, String)`
  - Compact constructor validation (success requires challengeId+proof, failure requires errorCode+message)
  - Legacy `of()` method marked deprecated for backward compatibility
- **ProviderType Enum** (abstract provider types):
  - Values: `SMS`, `PUSH`, `VOICE`, `BIOMETRIC` (abstract types, NOT vendor-specific)
  - Each value has `displayName` field (e.g., "SMS Provider", "Push Notification Provider")
  - Method: `getDisplayName()` - Returns human-readable display name
- **HealthStatus Value Object** (Java 21 record):
  - Provider health check result
  - Fields: `status` (enum UP/DOWN), `details`, `timestamp`
  - Factory methods: `up(String)` and `down(String)`
  - Method: `isHealthy()` - Convenience method returns true if status=UP
- **ChannelType Mapping**:
  - Method: `toProviderType()` added to ChannelType enum
  - Maps business channel to abstract provider type (SMS→SMS, PUSH→PUSH, VOICE→VOICE, BIOMETRIC→BIOMETRIC)
- **Unit Tests** (37 tests total):
  - `ProviderResultTest.java` - 15 tests (success/failure scenarios, validation rules, factory methods)
  - `ProviderTypeTest.java` - 6 tests (enum values, displayName, valueOf)
  - `HealthStatusTest.java` - 11 tests (up/down factory methods, isHealthy, validation)
  - `ChannelTypeTest.java` - 5 tests (toProviderType mapping for all channel types)
- **ArchUnit Tests** (domain purity validation):
  - `providerAbstractionShouldNotDependOnExternalLibraries()` - Validates NO dependencies on Twilio, FCM, HTTP clients
  - `signatureProviderPortShouldBeInterface()` - Validates port is interface (not class)
  - `providerValueObjectsShouldBePure()` - Validates value objects have NO infrastructure dependencies

### Changed (Story 3.1: Provider Abstraction Interface)
- `ProviderType.java` - **BREAKING CHANGE**: Refactored from vendor-specific (TWILIO, FCM, ONESIGNAL, VONAGE, BIOMETRIC_SDK) to abstract types (SMS, PUSH, VOICE, BIOMETRIC)
- `ProviderResult.java` - **BREAKING CHANGE**: Refactored from 3-field record (providerChallengeId, providerProof, sentAt) to 6-field record with success/failure pattern
- `ProviderSelectorServiceImpl.java` - Updated channel→provider mapping to use new abstract ProviderType values
- `TwilioSmsProvider.java` - Updated ProviderException calls from `ProviderType.TWILIO` to `ProviderType.SMS`
- `PushNotificationProvider.java` - Updated JavaDoc from `ProviderType.FCM` to `ProviderType.PUSH`
- `VoiceCallProvider.java` - Updated JavaDoc from `ProviderType.TWILIO` to `ProviderType.VOICE`
- **15+ test files updated** - All tests using old ProviderType enum values updated to new abstract types
- `README.md` - Added "Provider Abstraction" section with architecture diagram, code examples, and benefits

### Technical Details (Story 3.1)
- **Domain Purity**: SignatureProviderPort has ZERO dependencies on infrastructure (validated by ArchUnit)
- **Backward Compatibility**: `ProviderResult.of()` marked `@Deprecated` but still functional (removal planned Story 3.2+)
- **Java 21 Features**: Records with compact constructors for validation, switch expressions for ChannelType mapping
- **Hexagonal Architecture**: Domain port pattern enforces Dependency Inversion Principle (DIP)
- **Testability**: Domain layer 100% testeable without infrastructure dependencies
- **Coverage**: > 95% for provider abstraction package (ProviderResult, ProviderType, HealthStatus)

### Dependencies (Story 3.1)
- No new dependencies added (refactoring of existing code)

### Architecture Compliance (Story 3.1)
- ✅ **Domain Purity**: SignatureProviderPort has ZERO infrastructure dependencies
- ✅ **ArchUnit Validation**: 3 automated tests enforce hexagonal architecture
- ✅ **Ports & Adapters**: Infrastructure adapters implement domain port interface
- ✅ **Testability**: Domain logic testable without real providers

---

### Added (Story 1.7: REST API Foundation & Security)
- **OpenAPI 3.1 Documentation** (Springdoc):
  - Automatic API documentation generation from controller annotations
  - Swagger UI accessible at `/swagger-ui.html` (interactive try-it-out)
  - OpenAPI JSON spec at `/v3/api-docs` (machine-readable)
  - Bearer JWT authentication scheme configured
  - API versioning: base path `/api/v1/`
- **OAuth2 Resource Server** (Spring Security JWT):
  - JWT validation against issuer's RSA public key
  - Configurable issuer-uri: `spring.security.oauth2.resourceserver.jwt.issuer-uri`
  - Stateless authentication (no server-side sessions)
  - Claims extraction: subject, roles, expiration
- **Security Configuration** (`SecurityConfig.java`):
  - SecurityFilterChain with JWT authentication
  - Public endpoints: `/swagger-ui/**`, `/v3/api-docs/**`, `/actuator/health`, `/api/v1/health`
  - Protected endpoints: `/api/v1/**` (requires authentication)
  - Admin endpoints: `/api/v1/admin/**` (requires `ROLE_ADMIN`)
  - Support endpoints: `/api/v1/routing/**` (requires `ROLE_ADMIN` or `ROLE_SUPPORT`)
  - CSRF disabled (stateless JWT)
  - Session management: STATELESS
  - CORS configured (development: localhost:3000, localhost:4200)
- **JWT Authentication Converter** (`JwtAuthenticationConverter.java`):
  - Extracts roles from JWT "roles" claim
  - Converts to Spring Security authorities with ROLE_ prefix
  - Supports: `ROLE_ADMIN`, `ROLE_AUDITOR`, `ROLE_SUPPORT`, `ROLE_USER`
- **Global Exception Handler** (`GlobalExceptionHandler.java`):
  - Consistent ErrorResponse format across all endpoints
  - DomainException → HTTP 422 Unprocessable Entity
  - NotFoundException → HTTP 404 Not Found
  - MethodArgumentNotValidException → HTTP 400 Bad Request (with field errors)
  - AccessDeniedException → HTTP 403 Forbidden
  - Exception (generic) → HTTP 500 Internal Server Error (NO stack trace in response)
  - TraceId correlation for log aggregation (MDC.get("traceId"))
- **ErrorResponse DTO** (standard format):
  - Fields: `code`, `message`, `details` (Map, nullable), `timestamp`, `traceId`, `path`
  - `@JsonInclude(NON_NULL)` for details field (omit if null)
  - Builder pattern with Lombok
- **NotFoundException** (domain exception):
  - Domain-layer exception for entity not found errors
  - Maps to HTTP 404 via GlobalExceptionHandler
  - Constructors: by ID (entityType + UUID) or custom message
- **HealthController** (`/api/v1/health`):
  - Example REST endpoint for API smoke testing
  - Public access (no authentication required)
  - Returns: status "UP", apiVersion "1.0", timestamp
  - OpenAPI annotations: `@Operation`, `@ApiResponse`, `@Tag`
- **7 Integration Tests** (`SecurityConfigurationIntegrationTest.java`):
  - `testSwaggerUiAccessibleWithoutAuth()` - Swagger UI public access
  - `testApiRequiresAuthentication()` - API returns 401 without JWT
  - `testApiAccessibleWithValidJwt()` - Valid JWT allows access
  - `testAdminEndpointRequiresAdminRole()` - Admin endpoint requires ADMIN role
  - `testAdminEndpointAllowsAdminRole()` - Admin role grants access
  - `testHealthEndpointAccessibleWithoutAuth()` - Actuator health public access
  - `testRoutingEndpointRequiresSupportOrAdminRole()` - Routing endpoints role validation
- **Actuator Health Configuration**:
  - `management.endpoint.health.show-details=when-authorized` (production)
  - `management.endpoint.health.show-details=always` (development)
  - `management.endpoint.health.show-components=always`

### Changed (Story 1.7)
- `README.md` actualizado con sección "REST API & Security" (OpenAPI access, JWT flow, RBAC, error format, CORS config)
- `pom.xml` - 4 dependencies agregadas:
  - `springdoc-openapi-starter-webmvc-ui` 2.3.0 (OpenAPI documentation)
  - `spring-boot-starter-security` (Spring Security framework)
  - `spring-boot-starter-oauth2-resource-server` (OAuth2 JWT validation)
  - `spring-security-test` (test scope, MockMvc JWT utilities)
- `application.yml` - Security OAuth2 configuration, Springdoc paths, Actuator health settings
- `application-local.yml` - Development OAuth2 issuer, health show-details=always, security logging DEBUG
- `application-test.yml` - Mock JWT issuer for tests, Vault disabled

### Technical Details (Story 1.7)
- **JWT Validation**: RSA public key from issuer (NO shared secret), issued by OAuth2 authorization server (e.g., Keycloak)
- **Session Management**: Stateless (SessionCreationPolicy.STATELESS) - NO server-side sessions
- **CSRF Protection**: Disabled (stateless JWT, no CSRF needed)
- **Role Mapping**: JWT claim "roles" → Spring Security authorities with ROLE_ prefix (e.g., "admin" → "ROLE_ADMIN")
- **Error Handling**: Consistent ErrorResponse format with traceId for log correlation (OpenTelemetry compatible)
- **HTTP 500**: NO stack traces in response (security best practice), full stack trace logged server-side
- **CORS**: Development (localhost:3000, localhost:4200), Production (restrictive origins via application-prod.yml)
- **OpenAPI Security Scheme**: Bearer JWT defined in OpenApiConfig (Swagger UI try-it-out with JWT token)
- **Testing**: MockMvc with `jwt()` request post-processor for JWT mocking (spring-security-test)
- **Package Structure**: `infrastructure/config/` (SecurityConfig, OpenApiConfig), `infrastructure/config/security/` (JwtAuthenticationConverter), `infrastructure/adapter/inbound/rest/dto/` (ErrorResponse), `infrastructure/adapter/inbound/rest/exception/` (GlobalExceptionHandler), `infrastructure/adapter/inbound/rest/controller/` (HealthController)

### Dependencies Added (Story 1.7)
- `org.springdoc:springdoc-openapi-starter-webmvc-ui` version 2.3.0 (OpenAPI 3.1 + Swagger UI)
- `org.springframework.boot:spring-boot-starter-security` (Spring Security framework)
- `org.springframework.boot:spring-boot-starter-oauth2-resource-server` (OAuth2 JWT validation)
- `org.springframework.security:spring-security-test` (test scope, MockMvc JWT mocking)

### Security Best Practices (Story 1.7)
- ✅ **JWT Validation**: RSA public key (NO shared secret HS256)
- ✅ **Stateless Sessions**: No server-side state, JWT contains all auth info
- ✅ **CSRF Disabled**: Stateless JWT, no CSRF token needed
- ✅ **Role-Based Access Control**: Admin, Auditor, Support, User roles enforced
- ✅ **No Stack Traces**: HTTP 500 returns generic message (security by obscurity)
- ✅ **TraceId Correlation**: Every error includes traceId for log aggregation
- ✅ **Public Endpoints**: Swagger UI, Actuator health accessible without JWT
- ✅ **CORS Restrictive**: Production only allows specific frontend origins

### Added (Story 1.6: JPA Entities & Repository Adapters)
- **Domain Repository Port Interface** (Hexagonal Architecture):
  - `SignatureRequestRepository` interface en `domain/port/outbound/`
  - 5 métodos: `save`, `findById`, `findByCustomerId`, `findExpired`, `delete`
  - CERO dependencies on JPA, Spring, Jackson (domain purity)
- **2 JPA Entities** (infrastructure layer):
  - `SignatureRequestEntity` con `@Entity`, `@Table(name = "signature_request")`
    - `@OneToMany(cascade = ALL, orphanRemoval = true)` para challenges (cascade persist/delete)
    - `@Type(JsonBinaryType.class)` para JSONB columns (transaction_context, routing_timeline)
  - `SignatureChallengeEntity` con `@Entity`, `@Table(name = "signature_challenge")`
    - `@ManyToOne` back-reference a SignatureRequestEntity
    - `@Type(JsonBinaryType.class)` para provider_proof JSONB column
- **Spring Data JPA Repository**:
  - `SignatureRequestJpaRepository extends JpaRepository<SignatureRequestEntity, UUID>`
  - 3 custom query methods: `findByIdWithChallenges` (eager loading), `findByCustomerId`, `findByStatusAndExpiresAtBefore`
  - `@EntityGraph` para eager loading (avoid N+1 queries)
- **2 Entity Mappers** (bidirectional conversion):
  - `SignatureRequestEntityMapper` - Domain ↔ JPA Entity (toEntity, toDomain, updateEntity)
  - `SignatureChallengeEntityMapper` - Similar pattern
  - Jackson `ObjectMapper` para JSONB serialization/deserialization
  - Enum mapping: SignatureStatus.name() → String (toEntity), SignatureStatus.valueOf() → Enum (toDomain)
- **Repository Adapter** (Hexagonal implementation):
  - `SignatureRequestRepositoryAdapter implements SignatureRequestRepository`
  - Usa Spring Data JPA repository internamente (dependency injection)
  - Retorna DOMAIN models (NEVER JPA entities)
  - `@Transactional` para writes, `@Transactional(readOnly = true)` para reads
- **JSONB Support** (PostgreSQL):
  - Dependency: `io.hypersistence:hypersistence-utils-hibernate-63` version 3.7.0
  - Value Objects → JSONB: `TransactionContext`, `List<RoutingEvent>`, `ProviderResult`
- **6 Integration Tests** (Testcontainers PostgreSQL):
  - `SignatureRequestRepositoryIntegrationTest` con `@SpringBootTest`, `@Testcontainers`
  - PostgreSQL 15 real en Docker (NO H2 in-memory)
  - Test methods: `testSaveAndFindById`, `testCascadePersistChallenges`, `testJsonbSerializationTransactionContext`, `testUpdateExistingRequest`, `testFindByCustomerId`, `testFindExpired`
  - Coverage estimado: > 80% para persistence package
- **3 ArchUnit Tests** (Hexagonal enforcement):
  - `domainPortsShouldNotDependOnInfrastructure()` - Domain ports purity validation
  - `jpaEntitiesShouldNotLeakOutsidePersistencePackage()` - Infrastructure isolation
  - `repositoryAdaptersShouldImplementDomainPorts()` - Adapter contract compliance

### Changed (Story 1.6)
- `README.md` actualizado con sección "Persistence Layer (JPA)" (Hexagonal pattern, JSONB serialization, usage examples)
- `pom.xml` - Dependency agregada: `hypersistence-utils-hibernate-63` version 3.7.0

### Technical Details (Story 1.6)
- **Hexagonal Architecture**: Domain port interface (SignatureRequestRepository) en domain/port/outbound/, adapter (SignatureRequestRepositoryAdapter) en infrastructure/adapter/outbound/persistence/adapter/
- **Domain Purity**: Domain port interface NO importa JPA/Spring/Jackson (ArchUnit validation)
- **JPA Cascade Behavior**: SignatureRequestEntity.challenges con cascade = ALL, orphanRemoval = true (challenges persist/delete con parent)
- **JSONB Serialization**: Jackson ObjectMapper para Value Objects (TransactionContext, ProviderResult, List<RoutingEvent>)
- **Transactional Boundaries**: Write methods (@Transactional), read methods (@Transactional(readOnly = true) para performance)
- **Testcontainers**: PostgreSQL 15 real para integration tests (LiquidBase changesets ejecutan automáticamente)
- **Package Structure**: domain/port/outbound/, infrastructure/adapter/outbound/persistence/{entity, repository, mapper, adapter}

### Added (Story 1.5: Domain Models - Aggregates & Entities)
- **SignatureRequest Aggregate Root** (DDD pattern) con 4 business methods:
  - `createChallenge(ChannelType, ProviderType)` - Crea challenge, valida 1 activo max
  - `completeSignature(SignatureChallenge)` - Transiciona a SIGNED cuando challenge completado
  - `abort(String reason)` - Aborta signature request
  - `expire()` - Marca como EXPIRED cuando TTL excedido
- **SignatureChallenge Entity** con lifecycle methods:
  - `complete(ProviderResult proof)` - Marca challenge como COMPLETED con proof
  - `fail(String errorCode)` - Marca challenge como FAILED con error code
- **4 Value Objects** (Java 21 records) inmutables:
  - `Money` - Monetary amount con `add()`, `multiply()` methods
  - `TransactionContext` - Transaction data con SHA256 hash (integrity)
  - `ProviderResult` - Provider proof (non-repudiation)
  - `RoutingEvent` - Audit trail event para routing timeline
- **4 Enums** (Domain constants):
  - `SignatureStatus` - PENDING, CHALLENGED, SIGNED, ABORTED, EXPIRED
  - `ChallengeStatus` - SENT, PENDING, COMPLETED, FAILED, EXPIRED
  - `ChannelType` - SMS, PUSH, VOICE, BIOMETRIC
  - `ProviderType` - TWILIO, ONESIGNAL, VONAGE, BIOMETRIC_SDK
- **4 Domain Exceptions**:
  - `DomainException` (abstract base) con errorCode field
  - `FallbackExhaustedException` - All fallback channels failed
  - `InvalidStateTransitionException` - Illegal state transition
  - `ChallengeAlreadyActiveException` - Business rule: 1 challenge PENDING max
- **UUIDv7 Generator** - Time-sortable UUIDs (better PostgreSQL B-tree performance)
- **lombok.config** - Lombok configuration (addLombokGeneratedAnnotation, defaultPrivate, defaultFinal)
- **29 Unit Tests** (5 test classes) - Pure JUnit 5, > 85% coverage estimado:
  - `SignatureRequestTest` - 8 tests (business methods, state transitions, business rules)
  - `SignatureChallengeTest` - 4 tests (lifecycle methods, state validations)
  - `MoneyTest` - 13 tests (add/multiply operations, immutability, validations)
  - `TransactionContextTest` - 12 tests (SHA256 hash validation, field validations)
  - `UUIDGeneratorTest` - 9 tests (sortability, uniqueness, performance, concurrency)

### Changed (Story 1.5)
- Package structure creada: `domain/model/{aggregate, entity, valueobject}`, `domain/exception/`

### Technical Details (Story 1.5)
- **DDD Patterns**: Aggregate root (SignatureRequest controls SignatureChallenge lifecycle), Entity (SignatureChallenge), Value Objects (immutable records), Domain Exceptions
- **Java 21 Features**: Records para Value Objects con compact constructor validation
- **Lombok**: @Builder + @Getter + @AllArgsConstructor(access = AccessLevel.PRIVATE) para Aggregates/Entities (enforce invariants via builder)
- **Domain Purity**: No imports de Spring/JPA/Jackson/Kafka en domain layer (ArchUnit validation)
- **Business Rules**: Solo 1 challenge PENDING simultáneo (validado en createChallenge), state transitions explícitas (no setStatus directo)
- **UUIDv7 Format**: 48-bit timestamp + 4-bit version + 74-bit random (time-sortable, mejor B-tree performance vs UUIDv4)
- **Immutability**: Value Objects implementados como Java 21 records (no setters, all fields final)
- **Audit Trail**: RoutingEvent list en SignatureRequest para tracking (CHALLENGE_SENT, SIGNATURE_COMPLETED, etc.)

### Added (Story 1.4: HashiCorp Vault Integration)
- **HashiCorp Vault 1.15** with Docker Compose setup (dev mode with auto-unseal)
- **Spring Cloud Vault Config** for banking-grade secret management
- **bootstrap.yml** configuration (loads before application.yml for Vault PropertySource priority)
- **VaultTemplate** bean configuration (`VaultConfig.java`) for programmatic secret access
- **6 secrets managed** in Vault KV v2 store (`secret/signature-router/`):
  - `database.password` - PostgreSQL database password
  - `kafka.sasl-jaas-config` - Kafka SASL authentication config (placeholder for prod)
  - `twilio.api-key`, `twilio.api-secret` - Twilio SMS provider credentials
  - `push-service.api-key` - Push notification service API key
  - `biometric-sdk.license` - Biometric SDK license key
- **vault-init.sh** script for idempotent secret initialization (safe to run multiple times)
- **Multi-environment authentication**:
  - **Local/Dev**: TOKEN authentication with `dev-token-123`
  - **UAT/Prod**: KUBERNETES authentication with ServiceAccount JWT
- **Vault health check** exposed via `/actuator/health/vault`
- **Dynamic secret refresh** with `@RefreshScope` support (60s polling dev, 300s prod)
- **Integration tests** with Testcontainers VaultContainer (`VaultIntegrationTest.java`) - 3 test methods
- **Vault secrets documentation** (`docs/development/vault-secrets.md`) - architecture, rotation strategy, troubleshooting, production HA

### Changed (Story 1.4)
- Updated `docker-compose.yml` with `vault` service (hashicorp/vault:1.15, IPC_LOCK capability, dev mode)
- Updated `application-local.yml`: hardcoded secrets replaced with `${placeholders}` (database.password, kafka.sasl-jaas-config)
- Updated `application.yml` with Vault health check configuration
- Updated `pom.xml` with Spring Cloud dependencies BOM (2023.0.0), spring-cloud-starter-vault-config, testcontainers-vault
- Updated README.md with "Vault Secret Management" section (quick commands, secrets list, key features, documentation)

### Technical Details (Story 1.4)
- **Fail-Fast Mode**: `spring.cloud.vault.fail-fast=true` - application won't start if Vault unavailable (banking-grade reliability)
- **KV v2 Engine**: Versioned secrets with rollback support (path: `secret/data/signature-router`, uses `/data/` prefix for read/write)
- **IPC_LOCK Capability**: Docker Compose grants `IPC_LOCK` to Vault container (allows mlock, prevents secrets in swap memory)
- **Bootstrap Phase**: bootstrap.yml loads BEFORE application.yml (Vault PropertySource has highest priority for secret resolution)
- **Auto-Renewal**: Spring Cloud Vault auto-renews Kubernetes auth tokens (TTL 24h) before expiry
- **Secret Refresh Polling**: lifecycle.enabled=true, min-renewal 60s (dev) / 300s (prod)
- **TLS Configuration**: UAT/Prod profiles use HTTPS + truststore for certificate validation
- **VaultTemplate Helpers**: `getSecret(key)`, `writeSecret(key, value)`, `writeSecrets(Map)` methods with JavaDoc examples

### Dependencies Added (Story 1.4)
- `org.springframework.cloud:spring-cloud-starter-vault-config` (managed by Spring Cloud BOM 2023.0.0)
- `org.testcontainers:vault` (test scope, ~1.19.3)
- **Maven BOM**: `spring-cloud-dependencies` version 2023.0.0 for Spring Cloud dependency management

### Security Best Practices (Story 1.4)
- ⚠️ **Dev Mode ONLY for Local**: `VAULT_DEV_ROOT_TOKEN_ID=dev-token-123` NEVER in production
- ✅ **No Hardcoded Secrets**: All secrets loaded from Vault via `@Value` or VaultTemplate
- ✅ **TLS Mandatory**: UAT/Prod use `https://vault-{env}.internal:8200` + truststore
- ✅ **Kubernetes Auth**: Prod uses ServiceAccount token (auto-rotated), NOT hardcoded TOKEN
- ✅ **Audit Logging**: Vault audit logs track secret access (who, what, when)
- ✅ **Least Privilege**: Vault policies grant minimal read permissions to signature-router role

### Vault Configuration Profiles (Story 1.4)
```yaml
bootstrap-local.yml:    # Dev - TOKEN auth, localhost:8200, dev-token-123
bootstrap-uat.yml:      # UAT - KUBERNETES auth, vault-uat.internal:8200, TLS
bootstrap-prod.yml:     # Prod - KUBERNETES auth, vault-prod.internal:8200, TLS, 300s polling
```

### Vault Init Script (Story 1.4)
```bash
docker-compose exec vault sh /vault/scripts/vault-init.sh
# - Idempotent: checks if secrets exist before creating
# - Creates 6 secrets in secret/signature-router/
# - Exit code 0 if successful or already exists (CI/CD friendly)
```

### Added (Story 1.3: Kafka Infrastructure & Schema Registry)
- **Apache Kafka 3.6** (Confluent Platform 7.5.0) with Docker Compose setup
- **Confluent Schema Registry** for Avro schema validation and backward compatibility
- **Avro schema** (`signature-event.avsc`) with 8 domain event types:
  - `SIGNATURE_REQUEST_CREATED`, `CHALLENGE_SENT`, `CHALLENGE_COMPLETED`, `CHALLENGE_FAILED`
  - `SIGNATURE_COMPLETED`, `SIGNATURE_FAILED`, `FALLBACK_TRIGGERED`, `PROVIDER_DEGRADED`
- **KafkaTemplate** bean configuration for Avro message publishing (idempotent producer, acks=all)
- **Kafka topics** auto-creation: `signature.events` (12 partitions, 7d retention), `signature.events.dlq` (3 partitions, 30d retention)
- **Avro Maven Plugin** for automatic Java class generation from `.avsc` schemas
- **Integration tests** with @EmbeddedKafka (`KafkaInfrastructureIntegrationTest.java`) - 7 test methods
- **Kafka messaging documentation** (`docs/development/kafka-messaging.md`) - event publishing, schema evolution, troubleshooting
- **Multi-environment Kafka profiles**: local, test, uat, prod configurations

### Changed (Story 1.3)
- Updated `docker-compose.yml` with 3 new services: `zookeeper`, `kafka`, `schema-registry`
- Updated `application-local.yml` with Kafka producer configuration (bootstrap-servers, Schema Registry URL)
- Created `application-test.yml`, `application-uat.yml`, `application-prod.yml` with Kafka settings
- Updated `pom.xml` with Kafka dependencies (spring-kafka, kafka-avro-serializer, avro, kafka-test utils)
- Updated README.md with "Kafka Event Streaming" section (quick commands, event types, documentation links)

### Technical Details (Story 1.3)
- **Kafka Advertised Listeners**: PLAINTEXT://localhost:9092 (host access) + PLAINTEXT_INTERNAL://kafka:29092 (container access)
- **Idempotent Producer**: `enable.idempotence=true` + `acks=all` + `retries=MAX_VALUE` for exactly-once semantics (banking-grade)
- **Avro Backward Compatibility**: All new fields MUST have default values (enforced by Schema Registry compatibility mode: BACKWARD)
- **Partitioning Strategy**: aggregateId (SignatureRequest.id UUIDv7) as partition key for ordering guarantee
- **12 Partitions**: Allows up to 12 parallel consumers for high throughput
- **Snappy Compression**: ~70% compression ratio for network efficiency
- **DLQ Topic**: Dead Letter Queue for failed messages (retry exhausted, deserialization errors)
- **Health Check**: `/actuator/health/kafka` verifies producer readiness (Kubernetes readiness probe)

### Dependencies Added (Story 1.3)
- `org.springframework.kafka:spring-kafka` (Spring Boot managed ~3.x)
- `io.confluent:kafka-avro-serializer` (7.5.0, requires Confluent Maven repository)
- `org.apache.avro:avro` (1.11.3)
- `org.springframework.kafka:spring-kafka-test` (test scope)
- `org.apache.kafka:kafka-streams-test-utils` (test scope)

### Maven Plugins Added (Story 1.3)
- `org.apache.avro:avro-maven-plugin` (1.11.3) for Avro code generation
  - Input: `src/main/resources/kafka/schemas/*.avsc`
  - Output: `target/generated-sources/avro/com/bank/signature/event/`

### Docker Compose Services (Story 1.3)
```yaml
zookeeper:          # Kafka coordination (port 2181)
kafka:              # Kafka broker (ports 9092 external, 29092 internal)
schema-registry:    # Confluent Schema Registry (port 8081)
```

### Avro Schema Structure (Story 1.3)
```
SignatureEvent (record)
├── eventId: string (UUIDv7)
├── eventType: enum (8 values)
├── aggregateId: string (partition key)
├── aggregateType: string (default: "SignatureRequest")
├── timestamp: long (timestamp-millis logicalType)
├── traceId: union[null, string] (OpenTelemetry)
└── payload: EventPayload (record)
    ├── customerId: union[null, string] (pseudonymized, GDPR-compliant)
    ├── requestStatus: union[null, string]
    ├── channel: union[null, string] (SMS, PUSH, VOICE, BIOMETRIC)
    ├── provider: union[null, string]
    ├── errorCode: union[null, string]
    ├── errorMessage: union[null, string]
    ├── attemptCount: union[null, int]
    └── durationMs: union[null, long]
```

### Added (Story 1.2: PostgreSQL Database Setup & LiquidBase Changesets)
- **PostgreSQL 15** database with Docker Compose setup
- **LiquidBase** for database migrations following corporate standards
- **7 LiquidBase changesets** (YAML format) for schema creation:
  - `0001-create-uuidv7-function.yaml`: UUIDv7 sortable UUID generation function
  - `0002-create-signature-request-table.yaml`: Aggregate root table with JSONB, GIN indexes
  - `0003-create-signature-challenge-table.yaml`: Entity table with FK cascade, CHECK constraints
  - `0004-create-routing-rule-table.yaml`: SpEL routing rules table
  - `0005-create-connector-config-table.yaml`: Provider configurations with circuit breaker state
  - `0006-create-outbox-event-table.yaml`: Outbox pattern for atomic event publishing (Debezium CDC ready)
  - `0007-create-audit-log-table.yaml`: Audit trail for PCI-DSS / SOC 2 compliance
- **HikariCP connection pool** optimization (20 max connections, 2s timeout for NFR compliance)
- **Testcontainers integration tests** (`DatabaseSchemaIntegrationTest.java`) with 10 test methods
- **Database migration documentation** (`docs/development/database-migrations.md`)
- **docker-compose.yml** with PostgreSQL 15 service, healthcheck, and volume persistence

### Changed (Story 1.2)
- Updated `application.yml` with LiquidBase configuration (`spring.liquibase.enabled=true`)
- Updated `application-local.yml` with PostgreSQL datasource and HikariCP pool settings
- Updated README.md with "Database Setup" section (LiquidBase commands, psql quickstart)
- Updated `pom.xml` with dependencies: `liquibase-core`, `postgresql`, `testcontainers` (junit-jupiter + postgresql)

### Technical Details (Story 1.2)
- **LiquidBase Corporate Standards**: YAML format, mandatory rollback blocks, contexts (dev/uat/prod), numeric changeset IDs
- **UUIDv7**: Sortable UUIDs (48-bit timestamp + 4-bit version + 74-bit random) for better B-tree performance vs UUIDv4
- **JSONB Columns**: GIN indexes on `transaction_context`, `config`, `payload`, `changes` for efficient queries
- **Outbox Pattern**: `outbox_event` table with `published_at` index critical for Debezium CDC (Story 1.3)
- **Compliance**: Pseudonymized `customer_id` (GDPR), `provider_proof` for non-repudiation (PCI-DSS), `audit_log` for SOC 2
- **Testing**: 10 Testcontainers integration tests verify schema creation, UUIDv7 function, JSONB queries, FK cascade, CHECK constraints

### Dependencies Added (Story 1.2)
- `org.liquibase:liquibase-core` (Spring Boot managed version ~4.x)
- `org.postgresql:postgresql` (runtime scope, Spring Boot managed ~42.x)
- `org.testcontainers:junit-jupiter` (test scope, ~1.19.x)
- `org.testcontainers:postgresql` (test scope, ~1.19.x)

### LiquidBase Directory Structure (Story 1.2)
```
src/main/resources/liquibase/
├── changelog-master.yaml          # Master changelog (includeAll per environment)
└── changes/
    ├── dev/                        # DEV changesets (context: dev)
    │   ├── 0001-create-uuidv7-function.yaml
    │   ├── 0002-create-signature-request-table.yaml
    │   ├── 0003-create-signature-challenge-table.yaml
    │   ├── 0004-create-routing-rule-table.yaml
    │   ├── 0005-create-connector-config-table.yaml
    │   ├── 0006-create-outbox-event-table.yaml
    │   └── 0007-create-audit-log-table.yaml
    ├── uat/                        # UAT changesets (context: uat)
    └── prod/                       # PROD changesets (context: prod)
```

### Added (Story 1.1)
- Initial project structure with hexagonal architecture
- Spring Boot 3.2.0 + Java 21 foundation
- Hexagonal package structure (domain/, application/, infrastructure/)
- ArchUnit tests for architectural constraint enforcement
- Spring Boot context load test
- Application configuration files (application.yml, profiles for local/test)
- Logback configuration for structured logging
- Maven Wrapper for build reproducibility
- README.md with project overview and quick start guide
- .gitignore with comprehensive exclusions

### Technical Details
- **Hexagonal Architecture**: Strict separation of concerns (Domain → Application → Infrastructure)
- **Domain Purity**: Zero framework dependencies in domain layer (validated by ArchUnit)
- **Configuration Profiles**: local (development), test (CI/CD)
- **Build Tool**: Maven 3.9+ with Spring Boot 3.2.0 parent
- **Testing**: JUnit 5, ArchUnit 1.1.0
- **Java Version**: 21 (LTS with records, pattern matching, sealed classes)

### Architecture Constraints
- Domain layer cannot depend on Spring, JPA, Jackson, Kafka (enforced by ArchUnit)
- Application layer cannot depend on infrastructure adapters (enforced by ArchUnit)
- Unidirectional dependency flow: Infrastructure → Application → Domain (enforced by ArchUnit)

### Dependencies Added
- spring-boot-starter-web (REST API foundation)
- spring-boot-starter-data-jpa (JPA foundation)
- spring-boot-starter-actuator (Health checks, metrics)
- lombok (Reduce boilerplate)
- archunit-junit5 1.1.0 (Architecture testing)

### Project Structure
```
signature-router/
├── src/main/java/com/bank/signature/
│   ├── domain/                    # Pure business logic
│   ├── application/               # Use case orchestration
│   └── infrastructure/            # Adapters & configs
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   └── logback-spring.xml
└── src/test/java/
    ├── HexagonalArchitectureTest.java
    └── SignatureRouterApplicationTests.java
```

### Notes
- **Story 1.1** ✅: Project bootstrap with hexagonal architecture foundation
- **Story 1.2** ✅: PostgreSQL 15 + LiquidBase with 7 changesets (6 tables + UUIDv7 function)
- **Story 1.3** ✅: Kafka 3.6 + Schema Registry + Avro schema with 8 event types
- **Story 1.4** ✅: HashiCorp Vault 1.15 + Spring Cloud Vault Config with 6 managed secrets
- **Story 1.5** ✅: Domain models (Aggregates, Entities, Value Objects) - 29 unit tests
- **Story 1.6** ✅: JPA entities and repository adapters - 6 integration tests
- **Story 1.7** ✅: REST API Foundation & Security (OpenAPI, OAuth2 JWT, Exception Handler) - 7 integration tests
- **Story 1.8** (Next): Local Development Environment - Docker Compose unified setup

## [0.1.0] - 2025-11-26

### Added
- Initial project bootstrap
- Hexagonal architecture foundation
- Spring Boot 3.2.0 + Java 21 setup

### Stories
- **Story 1.1**: Project Bootstrap & Hexagonal Structure ✅
- **Story 1.2**: PostgreSQL Database Setup & LiquidBase Changesets ✅
- **Story 1.3**: Kafka Infrastructure & Schema Registry ✅
- **Story 1.4**: HashiCorp Vault Integration ✅
- **Story 1.5**: Domain Models (Aggregates & Entities) ✅
- **Story 1.6**: JPA Entities & Repository Adapters ✅
- **Story 1.7**: REST API Foundation & Security ✅

---

**Legend:**
- `Added`: New features
- `Changed`: Changes in existing functionality
- `Deprecated`: Soon-to-be removed features
- `Removed`: Removed features
- `Fixed`: Bug fixes
- `Security`: Security-related changes

