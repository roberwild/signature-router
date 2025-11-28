# MuleSoft Integration Strategy

**Status:** Planned  
**Target Date:** TBD (pending MuleSoft API specifications)  
**Impact:** Low (Hexagonal Architecture enables seamless migration)

---

## 📋 Executive Summary

El sistema **Signature Router** actualmente utiliza conectores directos a providers externos (Twilio, FCM, Biometric APIs). Esta arquitectura es **temporal** y será reemplazada por **MuleSoft API Gateway** como capa de integración única.

**Ventaja clave**: La arquitectura hexagonal permite migración **Plug & Play** sin impacto en lógica de negocio.

---

## 🎯 Current State vs. Target State

### Current Architecture (Temporary/MVP)

```
┌─────────────────────────────────────────────────────────┐
│         Signature Router (Java Spring Boot)             │
│                                                         │
│  ┌─────────────┐    ┌────────────────────────┐        │
│  │   Domain    │◄───│  SignatureProvider     │        │
│  │   (Ports)   │    │  (Port Interface)      │        │
│  └─────────────┘    └────────────┬───────────┘        │
│                                   │                     │
│         ┌────────────────────────┴──────────┐         │
│         │   Infrastructure Adapters          │         │
│         │                                    │         │
│         │  • TwilioSmsProvider               │         │
│         │  • TwilioVoiceProvider             │         │
│         │  • FcmPushProvider                 │         │
│         │  • BiometricStubProvider           │         │
│         └────────────────────────────────────┘         │
└────────────────────────┬────────────────────────────────┘
                         │ Direct HTTP/SDK calls
                         ↓
        ┌────────────────────────────────────┐
        │   External Provider APIs           │
        │                                    │
        │  • Twilio (SMS/Voice)              │
        │  • Firebase Cloud Messaging (FCM)  │
        │  • Biometric Provider (TBD)        │
        └────────────────────────────────────┘
```

**Características actuales:**
- ✅ Conectores directos a cada provider
- ✅ Resilience4j (Circuit Breaker, Retry, Timeout)
- ✅ Métricas Prometheus por provider
- ✅ Configuración independiente por provider
- ⚠️ **Acoplamiento a SDKs externos** (Twilio SDK, Firebase Admin SDK)
- ⚠️ **Múltiples puntos de integración**

---

### Target Architecture (Production)

```
┌─────────────────────────────────────────────────────────┐
│         Signature Router (Java Spring Boot)             │
│                                                         │
│  ┌─────────────┐    ┌────────────────────────┐        │
│  │   Domain    │◄───│  SignatureProvider     │        │
│  │   (Ports)   │    │  (Port Interface)      │        │
│  └─────────────┘    └────────────┬───────────┘        │
│                                   │                     │
│         ┌────────────────────────┴──────────┐         │
│         │   Infrastructure Adapter           │         │
│         │                                    │         │
│         │  • MuleSoftApiProvider             │  ◄──┐  │
│         │    (Single REST client)            │     │  │
│         └────────────────────────────────────┘     │  │
└────────────────────────┬────────────────────────────┼──┘
                         │ REST API calls             │
                         ↓                            │
        ┌────────────────────────────────────┐       │
        │      MuleSoft API Gateway          │       │
        │                                    │       │
        │  Endpoints:                        │       │
        │  • POST /api/v1/sms                │       │
        │  • POST /api/v1/voice              │       │
        │  • POST /api/v1/push               │       │
        │  • POST /api/v1/biometric          │       │
        │                                    │       │
        │  Features:                         │       │
        │  • Rate limiting                   │       │
        │  • Authentication (OAuth2/API Key) │       │
        │  • Monitoring & Logging            │       │
        │  • Protocol translation            │       │
        │  • Provider routing                │       │
        └────────────────┬───────────────────┘       │
                         │                            │
                         ↓                            │
        ┌────────────────────────────────────┐       │
        │   External Provider APIs           │       │
        │                                    │       │
        │  • Twilio (SMS/Voice)              │       │
        │  • Firebase Cloud Messaging (FCM)  │       │
        │  • Biometric Provider              │       │
        └────────────────────────────────────┘       │
                                                      │
        Circuit Breaker, Retry, Metrics ──────────────┘
        (Maintained in Signature Router)
```

**Características target:**
- ✅ **Un solo adapter REST** (MuleSoftApiProvider)
- ✅ **Zero acoplamiento a SDKs externos**
- ✅ **Single integration point** (MuleSoft Gateway)
- ✅ **Resilience patterns conservados** (Circuit Breaker sigue en Signature Router)
- ✅ **Métricas unificadas** (mismo sistema Prometheus)
- ✅ **API Gateway centralizada** (rate limiting, auth, monitoring en MuleSoft)

---

## 🏗️ Migration Strategy

### Phase 0: Current Implementation (MVP) ✅

**Status:** DONE  
**Duration:** Sprint 1-5

**Deliverables:**
- ✅ Hexagonal Architecture con `SignatureProvider` port
- ✅ 4 adapters implementados: Twilio SMS, Twilio Voice, FCM Push, Biometric Stub
- ✅ Resilience4j Circuit Breaker per provider
- ✅ Retry logic con exponential backoff
- ✅ Timeout configuration
- ✅ Prometheus metrics tracking
- ✅ Provider health checks
- ✅ Degraded mode manager

**Propósito:** MVP funcional con conectores directos mientras MuleSoft API specs están en desarrollo.

---

### Phase 1: MuleSoft API Design & Contract Definition 🔄

**Status:** PENDING (waiting for MuleSoft API specifications)  
**Duration:** 2-3 weeks (estimated)

**Prerequisites:**
- [ ] MuleSoft API endpoints definidos (OpenAPI 3.0 spec)
- [ ] Authentication mechanism (OAuth2, API Key, mTLS)
- [ ] Rate limiting policies
- [ ] Error response format standardization
- [ ] Timeout SLAs per endpoint
- [ ] Monitoring & observability requirements

**Deliverables:**
- [ ] **OpenAPI 3.0 Specification** for MuleSoft API Gateway
- [ ] **API Contract Tests** (Pact/Spring Cloud Contract)
- [ ] **Authentication credentials** (dev/uat/prod environments)
- [ ] **SLA agreements** (response times, availability)

**Example MuleSoft API Contract (draft):**

```yaml
# OpenAPI 3.0 Specification (draft)
paths:
  /api/v1/sms:
    post:
      summary: Send SMS challenge
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                recipient:
                  type: object
                  properties:
                    phoneNumber: { type: string }
                    countryCode: { type: string }
                message:
                  type: object
                  properties:
                    body: { type: string }
                    from: { type: string }
      responses:
        '200':
          description: SMS sent successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  messageId: { type: string }
                  status: { type: string }
                  timestamp: { type: string }
        '429':
          description: Rate limit exceeded
        '503':
          description: Provider unavailable
```

---

### Phase 2: MuleSoftApiProvider Implementation 🚀

**Status:** NOT STARTED  
**Duration:** 1 sprint (2 weeks)  
**Estimated Story Points:** 8

**Tasks:**

1. **Create MuleSoftApiProvider Adapter** (3 SP)
   - Implement `SignatureProvider` interface
   - REST client configuration (Spring WebClient/RestTemplate)
   - OAuth2 authentication
   - Request/response mapping
   - Error handling

2. **Configuration Management** (2 SP)
   - `application.yml` configuration for MuleSoft endpoints
   - Environment-specific configs (dev/uat/prod)
   - Vault integration for API credentials
   - Feature flag: `providers.mulesoft.enabled`

3. **Resilience Integration** (2 SP)
   - Circuit Breaker configuration for MuleSoft
   - Retry policy (align with MuleSoft rate limits)
   - Timeout configuration (based on MuleSoft SLAs)
   - Fallback behavior

4. **Testing** (1 SP)
   - Unit tests (mock MuleSoft API)
   - Integration tests (WireMock/Testcontainers)
   - Contract tests (Pact)
   - Performance tests (load testing)

**Implementation Example:**

```java
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "providers.mulesoft.enabled", havingValue = "true")
public class MuleSoftApiProvider implements SignatureProvider {
    
    private final WebClient muleSoftWebClient;
    private final MuleSoftConfig config;
    private final ProviderMetrics providerMetrics;
    
    @Override
    @CircuitBreaker(name = "muleSoftProvider")
    @Retry(name = "muleSoftRetry")
    @TimeLimiter(name = "muleSoftTimeout")
    public ProviderResult sendChallenge(SignatureChallenge challenge, ChallengeRecipient recipient) {
        Instant startTime = Instant.now();
        
        try {
            // Determine endpoint based on channel type
            String endpoint = switch (challenge.getChannelType()) {
                case SMS -> config.getSmsEndpoint();
                case VOICE -> config.getVoiceEndpoint();
                case PUSH -> config.getPushEndpoint();
                case BIOMETRIC -> config.getBiometricEndpoint();
            };
            
            // Map domain model to MuleSoft API request
            MuleSoftChallengeRequest request = mapToMuleSoftRequest(challenge, recipient);
            
            // Call MuleSoft API
            MuleSoftChallengeResponse response = muleSoftWebClient
                .post()
                .uri(endpoint)
                .header("Authorization", "Bearer " + config.getApiToken())
                .bodyValue(request)
                .retrieve()
                .bodyToMono(MuleSoftChallengeResponse.class)
                .block();
            
            // Record metrics
            Duration duration = Duration.between(startTime, Instant.now());
            ProviderResult result = mapToProviderResult(response);
            providerMetrics.recordProviderCall(
                challenge.getProvider().name(),
                challenge.getChannelType().name(),
                result,
                duration
            );
            
            return result;
            
        } catch (Exception e) {
            Duration duration = Duration.between(startTime, Instant.now());
            ProviderResult errorResult = ProviderResult.failure(
                mapErrorCode(e),
                e.getMessage()
            );
            
            providerMetrics.recordProviderCall(
                challenge.getProvider().name(),
                challenge.getChannelType().name(),
                errorResult,
                duration
            );
            
            return errorResult;
        }
    }
    
    private MuleSoftChallengeRequest mapToMuleSoftRequest(
        SignatureChallenge challenge, 
        ChallengeRecipient recipient
    ) {
        return MuleSoftChallengeRequest.builder()
            .recipient(MuleSoftRecipient.builder()
                .phoneNumber(recipient.getPhoneNumber())
                .countryCode(recipient.getCountryCode())
                .email(recipient.getEmail())
                .deviceToken(recipient.getDeviceToken())
                .build())
            .message(MuleSoftMessage.builder()
                .body(challenge.getChallengeCode())
                .from(config.getFromNumber())
                .build())
            .metadata(MuleSoftMetadata.builder()
                .transactionId(challenge.getId().toString())
                .timestamp(Instant.now().toString())
                .build())
            .build();
    }
}
```

**Configuration:**

```yaml
# application.yml
providers:
  mulesoft:
    enabled: false  # Feature flag (enable when MuleSoft ready)
    base-url: ${MULESOFT_BASE_URL:https://api.mulesoft.company.com}
    api-token: ${MULESOFT_API_TOKEN}  # Loaded from Vault
    endpoints:
      sms: /api/v1/sms
      voice: /api/v1/voice
      push: /api/v1/push
      biometric: /api/v1/biometric
    timeout-seconds: 5
    retry-max-attempts: 3
    
# Resilience4j configuration for MuleSoft
resilience4j:
  circuitbreaker:
    instances:
      muleSoftProvider:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        sliding-window-size: 100
        minimum-number-of-calls: 10
```

---

### Phase 3: Parallel Deployment (Blue-Green) 🔄

**Status:** NOT STARTED  
**Duration:** 1 sprint (2 weeks)

**Strategy:** Run BOTH implementations in parallel (canary deployment)

**Configuration:**

```yaml
providers:
  # Legacy providers (current)
  twilio:
    enabled: true  # Keep enabled during transition
  push:
    enabled: true
  voice:
    enabled: true
  biometric:
    enabled: true
  
  # New MuleSoft provider
  mulesoft:
    enabled: true  # Enable for canary testing
    canary-percentage: 10  # Route 10% of traffic to MuleSoft
```

**Tasks:**
1. Deploy MuleSoft adapter to production (feature flag OFF)
2. Enable feature flag for 10% traffic (canary)
3. Monitor metrics: latency, error rate, success rate
4. Compare MuleSoft vs. direct providers (A/B testing)
5. Gradually increase canary percentage: 10% → 25% → 50% → 100%

**Monitoring:**
- Grafana dashboard comparing:
  - Latency: MuleSoft vs. Twilio direct
  - Error rate: MuleSoft vs. Twilio direct
  - Success rate: MuleSoft vs. Twilio direct
- Alert rules for regression detection

---

### Phase 4: Full Migration & Decommission 🗑️

**Status:** NOT STARTED  
**Duration:** 1 sprint (cleanup)

**Tasks:**

1. **Route 100% traffic to MuleSoft** ✅
   ```yaml
   providers:
     mulesoft:
       enabled: true
       canary-percentage: 100
   ```

2. **Disable legacy providers** ✅
   ```yaml
   providers:
     twilio:
       enabled: false  # DEPRECATED
     push:
       enabled: false  # DEPRECATED
     voice:
       enabled: false  # DEPRECATED
     biometric:
       enabled: false  # DEPRECATED
   ```

3. **Delete legacy adapter code** 🗑️
   - `TwilioSmsProvider.java` → DELETE
   - `TwilioVoiceProvider.java` → DELETE
   - `FcmPushProvider.java` → DELETE
   - `BiometricStubProvider.java` → DELETE
   - Twilio SDK dependencies (`pom.xml`) → DELETE
   - Firebase Admin SDK dependencies → DELETE

4. **Update documentation** 📝
   - Architecture diagrams
   - README.md
   - OpenAPI spec
   - Runbooks

5. **Cleanup configuration** 🧹
   - Remove Twilio config from Vault
   - Remove FCM service account JSON
   - Archive legacy provider configs

---

## 🎯 Benefits of MuleSoft Integration

### Business Benefits

1. **Centralized Provider Management** 🏢
   - Single team manages all provider integrations (MuleSoft team)
   - Signature Router focuses on business logic, not provider SDKs
   - Faster onboarding of new providers (no code changes in Signature Router)

2. **Cost Optimization** 💰
   - MuleSoft negotiates better rates with providers
   - Centralized rate limiting prevents cost overruns
   - Shared infrastructure across multiple apps

3. **Compliance & Governance** 🔒
   - Centralized audit logging
   - Standardized security policies (OAuth2, encryption)
   - Data governance (PII handling, GDPR compliance)

### Technical Benefits

1. **Decoupling from Provider SDKs** 🔌
   - Zero dependency on Twilio SDK, Firebase Admin SDK, etc.
   - No breaking changes when providers update SDKs
   - Simpler dependency management

2. **Simplified Codebase** 📉
   - 1 adapter instead of 4+ adapters
   - Less code to maintain (delete ~2000 LOC)
   - Faster development velocity

3. **Unified Observability** 📊
   - MuleSoft provides centralized monitoring
   - Signature Router metrics remain unchanged (same Prometheus gauges)
   - End-to-end tracing (distributed tracing integration)

4. **API Versioning** 🔄
   - MuleSoft handles API version migrations
   - Signature Router unaffected by provider API changes
   - Backward compatibility guaranteed by MuleSoft SLA

---

## 🚨 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **MuleSoft Gateway Downtime** | HIGH | LOW | Circuit Breaker in Signature Router, fallback to degraded mode |
| **Increased Latency (MuleSoft hop)** | MEDIUM | MEDIUM | Monitor P99 latency, optimize MuleSoft routing, consider regional deployments |
| **MuleSoft Rate Limiting** | MEDIUM | LOW | Align retry policies with MuleSoft limits, monitor 429 responses |
| **Loss of Provider-Specific Features** | LOW | MEDIUM | Document feature parity requirements with MuleSoft team |
| **API Contract Breaking Changes** | HIGH | LOW | Contract tests (Pact), API versioning strategy |

---

## 📊 Success Metrics

### Phase 2 Completion Criteria
- [ ] MuleSoftApiProvider passes all unit tests (>95% coverage)
- [ ] Integration tests pass with WireMock
- [ ] Contract tests pass with Pact
- [ ] Performance tests: P99 latency < 500ms

### Phase 3 Completion Criteria
- [ ] Canary deployment successful (0 errors in 1 week)
- [ ] Latency regression < 10% compared to direct providers
- [ ] Error rate parity (MuleSoft error rate ≤ direct providers)
- [ ] Zero customer complaints

### Phase 4 Completion Criteria
- [ ] 100% traffic routed to MuleSoft
- [ ] Legacy provider code deleted
- [ ] Documentation updated
- [ ] Team trained on MuleSoft integration
- [ ] Runbooks validated

---

## 📚 Related Documents

- [Architecture Decision Record: ADR-003 - MuleSoft Integration](./adr/ADR-003-mulesoft-integration.md)
- [Provider Abstraction Design](./04-provider-abstraction.md)
- [Resilience Strategy](./06-resilience-strategy.md)
- [OpenAPI Specification - MuleSoft API Gateway](../api/mulesoft-gateway-api.yaml) (pending)

---

## 📅 Timeline

| Phase | Duration | Start Date | End Date | Status |
|-------|----------|------------|----------|--------|
| Phase 0: MVP (Direct Providers) | 5 sprints | 2025-11-01 | 2025-11-28 | ✅ DONE |
| Phase 1: MuleSoft API Design | 2-3 weeks | TBD | TBD | ⏸️ PENDING |
| Phase 2: Implementation | 2 weeks | TBD | TBD | ⏸️ PENDING |
| Phase 3: Parallel Deployment | 2 weeks | TBD | TBD | ⏸️ PENDING |
| Phase 4: Full Migration | 1 week | TBD | TBD | ⏸️ PENDING |

**Total Estimated Duration:** 7-8 weeks (after MuleSoft API specs available)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-28  
**Authors:** Signature Router Team  
**Reviewers:** Architecture Team, MuleSoft Integration Team

