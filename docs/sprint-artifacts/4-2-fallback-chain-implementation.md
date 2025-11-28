# Story 4-2: Fallback Chain Implementation

**Status:** ✅ COMPLETED - Fallback chain fully implemented  
**Epic:** Epic 4 - Resilience & Circuit Breaking  
**Sprint:** Sprint 4  
**Story Points:** 5

---

## 📋 Story Description

**As a** System  
**I want** Fallback chain automático cuando un provider falla (SMS → Voice fallback)  
**So that** El sistema intenta delivery por canal alternativo sin intervención manual

---

## 🎯 Business Value

Implementa fallback chain para mejorar delivery success rate:

- **Automatic Fallback**: Si SMS falla → intenta Voice automáticamente
- **Higher Success Rate**: ~95% delivery (SMS 85% + Voice fallback 10%)
- **Better UX**: Usuario recibe challenge por canal alternativo (no falla silenciosamente)
- **Circuit Breaker Integration**: Fallback se activa también cuando circuit OPEN
- **Configurable Chains**: Define fallback sequences por channel (SMS→Voice, Push→SMS)
- **No Infinite Loops**: Previene fallback loops (Story 4-7 concept aplicado aquí)

---

## ✅ Acceptance Criteria

- [ ] **AC1:** FallbackChainConfig define fallback sequences (SMS→VOICE, PUSH→SMS)
- [ ] **AC2:** ChallengeServiceImpl detecta provider failure y ejecuta fallback
- [ ] **AC3:** Fallback se activa en: ProviderResult.failure, CallNotPermittedException (circuit OPEN), Exception
- [ ] **AC4:** Nuevo SignatureChallenge creado para fallback attempt (preserva original)
- [ ] **AC5:** SignatureRequest.challenges lista incluye challenge original + fallback challenge
- [ ] **AC6:** Loop prevention: Máximo 1 fallback por request (SMS→Voice, no Voice→SMS de nuevo)
- [ ] **AC7:** RoutingTimeline registra: FALLBACK_TRIGGERED, FALLBACK_ATTEMPT, FALLBACK_SUCCESS/FAILURE
- [ ] **AC8:** Métricas: fallback.triggered, fallback.success, fallback.failure
- [ ] **AC9:** Si fallback también falla: SignatureRequest.status = CHALLENGE_FAILED
- [ ] **AC10:** Configuration en application.yml: fallback chains habilitadas/deshabilitadas
- [ ] **AC11:** Unit tests: fallback success, fallback failure, loop prevention
- [ ] **AC12:** Integration test: End-to-end fallback flow (mock SMS failure → Voice success)

---

## 🏗️ Tasks

### Task 1: Create FallbackChainConfig
**Estimated:** 30min

#### Subtasks:
1. [ ] Crear FallbackChainConfig class
2. [ ] @ConfigurationProperties(prefix = "fallback")
3. [ ] Properties: enabled (boolean), chains (Map<ChannelType, ChannelType>)
4. [ ] Default chains: SMS→VOICE, PUSH→SMS, VOICE→none, BIOMETRIC→SMS
5. [ ] JavaDoc documenta fallback strategy

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/config/FallbackChainConfig.java`

---

### Task 2: Refactor ChallengeServiceImpl to Support Fallback
**Estimated:** 2h

#### Subtasks:
1. [ ] Inject FallbackChainConfig en ChallengeServiceImpl
2. [ ] Wrap provider.sendChallenge() en try-catch (captura CallNotPermittedException, Exception)
3. [ ] Si ProviderResult.failure() O exception: ejecutar fallback
4. [ ] Method: `executeFallback(SignatureRequest, SignatureChallenge original, ProviderResult failureResult)`
5. [ ] Obtener fallback channel de FallbackChainConfig
6. [ ] Crear nuevo SignatureChallenge para fallback
7. [ ] Llamar provider con fallback channel
8. [ ] Registrar eventos en RoutingTimeline
9. [ ] Actualizar SignatureRequest.status basado en resultado
10. [ ] Metrics: increment fallback.triggered, fallback.success/failure

**Files to Modify:**
- `src/main/java/com/bank/signature/application/service/ChallengeServiceImpl.java`

---

### Task 3: Add Fallback Events to RoutingTimeline
**Estimated:** 30min

#### Subtasks:
1. [ ] Agregar RoutingEventType: FALLBACK_TRIGGERED, FALLBACK_ATTEMPT, FALLBACK_SUCCESS, FALLBACK_FAILURE
2. [ ] Method: `addFallbackTriggeredEvent(reason, originalChannel, fallbackChannel)`
3. [ ] Method: `addFallbackAttemptEvent(fallbackChannel, recipient)`
4. [ ] Method: `addFallbackSuccessEvent(providerResult)`
5. [ ] Method: `addFallbackFailureEvent(errorMessage)`

**Files to Modify:**
- `src/main/java/com/bank/signature/domain/model/aggregate/SignatureRequest.java`
- `src/main/java/com/bank/signature/domain/model/valueobject/RoutingEventType.java`

---

### Task 4: Configuration in application.yml
**Estimated:** 15min

#### Subtasks:
1. [ ] Add fallback section
2. [ ] enabled: true
3. [ ] chains: SMS→VOICE, PUSH→SMS, BIOMETRIC→SMS
4. [ ] Add comments explaining fallback strategy

**Files to Modify:**
- `src/main/resources/application.yml`

---

### Task 5: Unit Tests
**Estimated:** 1.5h

#### Subtasks:
1. [ ] Test: fallback triggered when SMS fails (ProviderResult.failure)
2. [ ] Test: fallback triggered when circuit OPEN (CallNotPermittedException)
3. [ ] Test: fallback success (SMS fails → Voice succeeds)
4. [ ] Test: fallback failure (SMS fails → Voice also fails)
5. [ ] Test: loop prevention (Voice doesn't fallback to SMS)
6. [ ] Test: fallback disabled via config
7. [ ] Test: no fallback chain configured for channel
8. [ ] Test: routing timeline includes fallback events

**Files to Create:**
- `src/test/java/com/bank/signature/application/service/FallbackChainIntegrationTest.java`

---

### Task 6: Update Documentation
**Estimated:** 30min

#### Subtasks:
1. [ ] README.md: Fallback chain configuration and flow
2. [ ] CHANGELOG.md: Story 4-2 entry
3. [ ] Document fallback strategy and chain configuration

**Files to Modify:**
- `README.md`
- `CHANGELOG.md`

---

## 📐 Architecture Context

### Fallback Flow

```
Client Request (SMS)
   ↓
ChallengeServiceImpl.sendChallenge()
   ↓
Try SMS Provider
   ↓
   ├─ Success → Return ProviderResult.success()
   │
   ├─ Failure (ProviderResult.failure) → Fallback
   │     ↓
   │     Check FallbackChainConfig: SMS → VOICE
   │     ↓
   │     Create fallback SignatureChallenge
   │     ↓
   │     Try VOICE Provider
   │     ↓
   │     ├─ Success → RoutingTimeline: FALLBACK_SUCCESS
   │     │            SignatureRequest.status = CHALLENGE_SENT
   │     │            Return ProviderResult.success()
   │     │
   │     └─ Failure → RoutingTimeline: FALLBACK_FAILURE
   │                  SignatureRequest.status = CHALLENGE_FAILED
   │                  Return ProviderResult.failure()
   │
   └─ Circuit OPEN (CallNotPermittedException) → Fallback
         (Same flow as Failure)
```

### Configuration Example

```yaml
fallback:
  enabled: true
  chains:
    SMS: VOICE      # SMS fails → try Voice
    PUSH: SMS       # Push fails → try SMS
    BIOMETRIC: SMS  # Biometric fails → try SMS
    VOICE: null     # Voice has no fallback (end of chain)
```

### Fallback Chains Strategy

**SMS → VOICE:**
- Rationale: If SMS not delivered, voice call more likely to reach user
- Cost: Voice ~10x more expensive, but better than failed transaction
- Use case: High-value transactions, urgent notifications

**PUSH → SMS:**
- Rationale: If push not delivered (device offline), SMS fallback
- Cost: SMS cheaper than push (opposite direction useful)
- Use case: Mobile app users with unreliable internet

**BIOMETRIC → SMS:**
- Rationale: If biometric not available (device issue), SMS fallback
- Cost: SMS universal fallback
- Use case: Biometric authentication unavailable

**VOICE → none:**
- Rationale: Voice is already high-reach channel, no better fallback
- Alternative: Could fallback to SMS (cheaper), but less reliable

---

## 🔗 Dependencies

### Prerequisites
- ✅ **Story 4-1**: Circuit breakers (fallback triggered when circuit OPEN)
- ✅ **Epic 3**: All providers implemented

### Enables
- ⏭️ **Story 4-7**: Fallback Loop Prevention (concept already applied here)
- ⏭️ **Higher success rate**: ~95% delivery vs ~85% single channel

---

## 🧪 Test Strategy

### Unit Tests
- Fallback triggered on provider failure
- Fallback triggered on circuit OPEN
- Fallback success/failure scenarios
- Loop prevention validation
- Routing timeline events

### Integration Tests
- End-to-end: SMS fails → Voice succeeds
- Circuit breaker integration
- Metrics validation

**Target Coverage:** > 85%

---

## 📝 Dev Notes

### Loop Prevention

**Simple Strategy (This Story):**
- Max 1 fallback per request
- Track attempted channels in SignatureRequest
- If fallback channel already attempted → no fallback

**Advanced Strategy (Future Story 4-7):**
- Graph-based loop detection
- Multi-level fallbacks (SMS→Voice→Push)
- Configurable max attempts

### Cost Considerations

**Fallback Increases Cost:**
- SMS failure + Voice fallback = SMS cost + Voice cost
- But: Better UX + higher success rate justifies cost
- Config allows disabling fallback in cost-sensitive scenarios

**Mitigation:**
- Only fallback on genuine failures (not user error)
- Monitor fallback rate (if high, investigate root cause)
- Voice fallback only for high-value transactions

### Circuit Breaker Integration

**When Circuit OPEN:**
- Provider.sendChallenge() throws CallNotPermittedException
- ChallengeServiceImpl catches exception
- Triggers fallback immediately (no retry attempts wasted)
- Fallback provider might also have circuit OPEN → CHALLENGE_FAILED

---

## 🎯 Definition of Done

- [ ] **Code Complete**: FallbackChainConfig + ChallengeServiceImpl refactored
- [ ] **Configuration**: Fallback chains en application.yml
- [ ] **Routing Timeline**: Fallback events registrados
- [ ] **Loop Prevention**: Max 1 fallback per request
- [ ] **Tests**: Unit + Integration tests PASS
- [ ] **Metrics**: fallback.triggered, fallback.success, fallback.failure
- [ ] **Documentation**: README + CHANGELOG actualizados
- [ ] **Circuit Breaker Integration**: Fallback triggers cuando circuit OPEN

---

## 📚 References

**Fallback Pattern:**
- https://docs.microsoft.com/en-us/azure/architecture/patterns/retry

**Circuit Breaker + Fallback:**
- https://resilience4j.readme.io/docs/getting-started-3

---

**Story Created:** 2025-11-27  
**Previous Story:** 4-1 - Circuit Breaker per Provider  
**Next Story:** 4-3 - Degraded Mode Manager (or skip to 4-7)

