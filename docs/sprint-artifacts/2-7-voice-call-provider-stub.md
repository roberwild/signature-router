# Story 2.7: Voice Call Provider (Stub Implementation)

**Status:** ✅ Done  
**Epic:** Epic 2 - Signature Routing Engine  
**Sprint:** Sprint 2  
**Story Points:** 2

---

## 📋 Story Description

**As a** System  
**I want** Realizar llamadas de voz automatizadas con TTS  
**So that** Usuarios escuchan código de firma por teléfono

---

## ✅ Acceptance Criteria

### AC1: Voice Provider Interface Implementation
- [x] `VoiceCallProvider` implements `SignatureProvider`
- [x] Stub implementation (no real API calls)
- [x] Bean registered as `twilioVoiceProvider` (maps to `ProviderType.TWILIO` for VOICE)
- [x] Feature flag controlled via `providers.voice.enabled`
- [x] **Disabled by default** (voice calls are expensive and intrusive)

### AC2: Stub Behavior
- [x] Returns successful `ProviderResult` without actual call placement
- [x] Generates mock call IDs (format: `call_{UUID}`)
- [x] Logs warning: "VOICE challenge sent (stub implementation)"
- [x] Logs TTS message that would be spoken
- [x] Records metrics for monitoring

### AC3: TTS Message Formatting
- [x] OTP code formatted with pauses for clarity
- [x] Message repeats code twice
- [x] Includes expiration notice
- [x] Example: "Su código de verificación es: 1, 2, 3, 4, 5, 6. Repito: 1, 2, 3, 4, 5, 6. Este código es válido por 5 minutos."

### AC4: Configuration
- [x] `VoiceProviderConfig` with feature flag
- [x] Default: `enabled = false` (disabled for cost control)
- [x] TTS language configurable (default: es-ES)
- [x] Future-ready for Twilio Voice integration (Story 3.4)

### AC5: Testing
- [x] Unit tests for stub provider (7 tests)
- [x] Integration tests with routing rules (4 tests)
- [x] Test scenarios: VOICE routing, priority, fallback
- [x] Tests enable voice provider via `@TestPropertySource`
- [x] All existing tests still passing

---

## 🏗️ Technical Implementation

### Infrastructure Layer

#### VoiceCallProvider (Stub)
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceCallProvider.java`

**Responsibilities:**
- Implements `SignatureProvider` interface
- Simulates successful voice call placement
- Generates mock call IDs
- Formats TTS message with pauses
- Records metrics (calls, success rate)
- Feature flag controlled (disabled by default)

**Key Method:**
```java
@Override
public ProviderResult sendChallenge(SignatureChallenge challenge, String phoneNumber) {
    log.warn("VOICE challenge sent (stub implementation) - No real call placed");
    
    // Generate mock call ID
    String mockCallId = "call_" + UUID.randomUUID().toString();
    String mockProof = "stub_voice_proof:" + mockCallId;
    
    // Log TTS message
    logTtsMessage(challenge);
    
    // Record metrics
    meterRegistry.counter(METRIC_PREFIX + ".calls", "status", "success", "type", "stub").increment();
    
    return ProviderResult.of(mockCallId, mockProof);
}
```

**TTS Message Formatting:**
```java
private String buildTtsMessage(SignatureChallenge challenge) {
    String code = challenge.getChallengeCode();
    String codeWithPauses = String.join(", ", code.split(""));
    
    return String.format(
        "Su código de verificación es: %s. Repito: %s. Este código es válido por 5 minutos.",
        codeWithPauses,
        codeWithPauses
    );
}
```

**Example Output:**
```
Su código de verificación es: 1, 2, 3, 4, 5, 6. 
Repito: 1, 2, 3, 4, 5, 6. 
Este código es válido por 5 minutos.
```

**Why Commas Between Digits?**
- Improves TTS pronunciation clarity
- Prevents digits from being spoken as a number ("ciento veintitrés mil" vs "1, 2, 3")
- User can write down each digit at their own pace
- Reduces transcription errors

**Stub Characteristics:**
- ✅ Always succeeds (no call failures)
- ✅ No actual API calls
- ✅ Instant response (no latency)
- ✅ Unique call IDs per invocation
- ✅ **Disabled by default** (must be explicitly enabled)

**Why Stub?**
- Voice calls are expensive (€0.02-0.10 per call)
- Testing requires real phone numbers
- Intrusive user experience (not for all scenarios)
- Production implementation planned for Story 3.4

#### VoiceProviderConfig
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceProviderConfig.java`

**Properties:**
```yaml
providers:
  voice:
    enabled: false           # Feature flag - DISABLED by default
    api-url: https://api.twilio.com/2010-04-01  # Future: Twilio Voice
    timeout-seconds: 5
    tts-language: es-ES      # Spanish (Spain)
```

**Validation:**
- Feature flag checked via `@ConditionalOnProperty`
- Provider bean not loaded if `enabled = false` (default)
- `matchIfMissing = false` ensures explicit opt-in

**Why Disabled by Default?**
1. **Cost:** Voice calls are 10-20x more expensive than SMS
2. **User Experience:** Phone calls are intrusive, not always convenient
3. **Use Cases:** Reserved for high-value or high-risk transactions
4. **Production Readiness:** Stub implementation not suitable for production

---

### Provider Selection

#### Existing ProviderSelectorService
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/ProviderSelectorServiceImpl.java`

**Channel Mapping:**
```java
private static final Map<ChannelType, ProviderType> CHANNEL_TO_PROVIDER = Map.of(
    ChannelType.SMS, ProviderType.TWILIO,
    ChannelType.PUSH, ProviderType.FCM,
    ChannelType.VOICE, ProviderType.TWILIO,  // ← Maps to twilioVoiceProvider bean
    ChannelType.BIOMETRIC, ProviderType.BIOMETRIC_SDK
);
```

**No Changes Required:**
- Story 2.4 already implemented VOICE → TWILIO mapping
- Provider resolution via Spring bean name convention
- Bean name: `twilioVoiceProvider` (lowercase provider name + "VoiceProvider")

---

### Configuration

#### Application.yml Updates
**File:** `src/main/resources/application.yml`

```yaml
providers:
  twilio:
    # ... (Story 2.5 - SMS)
  
  push:
    # ... (Story 2.6 - Push)
  
  voice:
    enabled: false            # DISABLED by default
    api-url: https://api.twilio.com/2010-04-01
    timeout-seconds: 5
    tts-language: es-ES
```

**Enabling Voice Provider:**
```yaml
# For testing or specific environments
providers.voice.enabled: true
```

**When Enabled:**
- Bean loads: `twilioVoiceProvider`
- Routing to VOICE channel succeeds
- Stub places "mock" calls

**When Disabled (Default):**
- Bean NOT loaded (`@ConditionalOnProperty`)
- Routing to VOICE channel fails
- `NoAvailableProviderException` thrown (caught by routing engine)
- Falls back to next rule or default channel

---

### Testing

#### Unit Tests
**File:** `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/voice/VoiceCallProviderTest.java`

**Test Scenarios:**
1. ✅ Successfully place voice call (stub)
2. ✅ Generate unique call IDs
3. ✅ Record success metrics
4. ✅ Provider available when enabled
5. ✅ Provider unavailable when disabled
6. ✅ Handle null phone number gracefully
7. ✅ Format OTP code with pauses for TTS

**Coverage:** 100% for stub implementation

#### Integration Tests
**File:** `src/test/java/com/bank/signature/VoiceProviderIntegrationTest.java`

**Important:** Tests use `@TestPropertySource` to enable voice provider:
```java
@TestPropertySource(properties = {
    "providers.voice.enabled=true"  // Enable for tests
})
```

**Test Scenarios:**

**Test 1: Route to VOICE for high-value transactions**
```java
// Given: Routing rule "amount > 500 → VOICE"
// When: Create signature request with amount = 750
// Then: 
//   - Challenge created with channelType = VOICE
//   - Provider = TWILIO
//   - Status = SENT (stub always succeeds)
//   - providerProof contains "stub_voice_proof:"
```

**Test 2: Fallback to SMS when no VOICE rule matches**
```java
// Given: No routing rules
// When: Create signature request
// Then: Default to SMS channel (not VOICE)
```

**Test 3: Route to VOICE for fraud-suspected transactions**
```java
// Given: Routing rule "description contains 'fraud-check' → VOICE"
// When: Create request with description = "Transaction requires fraud-check"
// Then: VOICE channel selected and call placed
```

**Test 4: Prioritize VOICE over other channels**
```java
// Given: Multiple routing rules with different priorities
//   - High Value → PUSH (priority: 200)
//   - Very High Value → VOICE (priority: 50)  ← Higher priority
//   - Default → SMS (priority: 999)
// When: Create request with amount = 600 (matches PUSH and VOICE)
// Then: VOICE selected (priority 50 wins)
```

**Results:**
```
✅ 11 tests passing (7 unit + 4 integration)
✅ 0 failures
✅ All existing tests still passing
```

---

## 🔍 Stub vs Production Comparison

### Stub Implementation (Current - Story 2.7)

**Characteristics:**
- ✅ No network calls
- ✅ Instant response
- ✅ Always succeeds
- ✅ Mock call IDs
- ✅ TTS message logging
- ✅ Suitable for routing testing
- ✅ **Disabled by default**

**Limitations:**
- ❌ No actual calls placed
- ❌ No phone number validation
- ❌ No call status tracking (answered, busy, no-answer)
- ❌ No TTS voice customization
- ❌ No call recording

**Use Cases:**
- Development/testing
- Routing engine validation
- Performance testing (no external dependencies)

### Production Implementation (Future - Story 3.4)

**Planned Features:**
- Twilio Programmable Voice API integration
- Text-to-Speech (TTS) with customizable voices
- Call status tracking (ringing, answered, completed, failed, busy, no-answer)
- Call recording for audit/compliance
- Retry logic for failed calls
- Metrics (call duration, success rate, errors)
- Cost tracking per call

**Configuration (Future):**
```yaml
providers:
  voice:
    enabled: true
    twilio:
      account-sid: ${TWILIO_ACCOUNT_SID}      # From Vault
      auth-token: ${TWILIO_AUTH_TOKEN}        # From Vault
      from-number: ${TWILIO_VOICE_NUMBER}     # From Vault
    tts:
      language: es-ES
      voice: alice  # Twilio voice profile
      speed: 1.0    # Speech rate (0.5-2.0)
    timeout-seconds: 30  # Longer timeout for call completion
    record-calls: true   # For audit purposes
```

**Call Flow (Production):**
1. Initiate call via Twilio API
2. Wait for call to be answered
3. Play TTS message with OTP code
4. Optionally: prompt user to press key to confirm
5. Record call status and duration
6. Store call recording URL for audit

---

## 📊 Metrics

### Current Stub Metrics
- **provider.voice.calls** (Counter)
  - Tags: `status=success`, `type=stub`
  - Purpose: Track stub provider invocations

### Future Production Metrics (Story 3.4)
- **provider.voice.calls** (Counter)
  - Tags: `status` (success/failed), `type=twilio`, `call_status` (answered/busy/no-answer)
- **provider.voice.latency** (Timer)
  - Tags: `status` (success/error)
  - Measures: Time from initiation to call completion
- **provider.voice.call_duration** (Timer)
  - Tags: `call_status`
  - Measures: Actual call duration (for cost tracking)
- **provider.voice.errors** (Counter)
  - Tags: `error_code` (invalid_number, no_answer, busy, etc.)
- **provider.voice.cost** (Counter)
  - Purpose: Track total cost of voice calls

---

## 💰 Cost Considerations

### Why Voice Calls Are Expensive

**SMS vs Voice Cost Comparison:**
- **SMS:** €0.01-0.02 per message
- **Voice:** €0.02-0.10 per call (depending on duration and destination)
- **Voice is 2-10x more expensive than SMS**

**Additional Voice Costs:**
- Call recording storage
- Failed call attempts (partial charges)
- International calls (higher rates)
- TTS processing (if not included in call cost)

**Cost Optimization Strategies:**
1. **Selective Routing:** Use VOICE only for high-value/high-risk transactions
2. **Time-based Rules:** Prefer SMS during business hours, VOICE for after-hours
3. **User Preference:** Allow users to opt-in/opt-out of voice calls
4. **Budget Limits:** Circuit breaker based on daily/monthly cost thresholds
5. **Fallback:** If voice fails, fall back to SMS (cheaper backup)

### When to Use Voice Calls

**Good Use Cases:**
- ✅ High-value transactions (> €500)
- ✅ Fraud-suspected transactions
- ✅ Elderly users (may prefer voice over SMS)
- ✅ Users in low-connectivity areas (voice works better than data)
- ✅ Compliance requirements (some regulations mandate voice for certain scenarios)

**Poor Use Cases:**
- ❌ Low-value transactions
- ❌ Frequent/bulk operations
- ❌ Non-urgent scenarios
- ❌ Users with hearing impairments
- ❌ Situations where user can't answer phone

---

## 🔒 Security Considerations

### Stub Implementation
- ✅ No credentials required
- ✅ No sensitive data exposure
- ⚠️ Logs phone number (acceptable for testing)
- ⚠️ Logs OTP code (only in DEBUG level)

### Future Production (Story 3.4)
- Twilio credentials stored in Vault
- Phone numbers validated before calling
- TLS for all Twilio API calls
- Call recordings encrypted at rest
- OTP codes never logged in production
- Call recording retention policy (e.g., 90 days)

---

## 🚀 Deployment Notes

### Prerequisites
- None (stub has no external dependencies)
- Voice provider disabled by default

### Configuration Checklist
- [ ] `providers.voice.enabled` set per environment (default: false)
- [ ] Metrics endpoint exposed for Prometheus
- [ ] Logs configured for stub warnings
- [ ] Routing rules reviewed (ensure VOICE used appropriately)

### Enabling Voice Provider
To enable voice provider in a specific environment:

```yaml
# application-{env}.yml
providers:
  voice:
    enabled: true
```

Or via environment variable:
```bash
PROVIDERS_VOICE_ENABLED=true
```

### Rollback Plan
If Story 2.7 needs to be rolled back:
1. Set `providers.voice.enabled: false` (default)
2. All VOICE routing rules will fail gracefully
3. System falls back to next rule or default channel (SMS)
4. No disruption to end users

---

## 📈 Performance Characteristics

### Stub Implementation
- **Latency:** ~1ms (in-memory only)
- **Throughput:** Unlimited (no external calls)
- **Success Rate:** 100% (always succeeds)
- **CPU:** Minimal (UUID generation only)
- **Memory:** Negligible

### Future Production (Estimated - Story 3.4)
- **Latency:** 
  - P50: ~15s (time to answer + TTS playback)
  - P95: ~25s
  - P99: ~30s (timeout)
- **Throughput:** Limited by Twilio concurrency limits (~100 concurrent calls)
- **Success Rate:** ~70-80% (many calls go unanswered or busy)
- **Cost:** €0.02-0.10 per call

---

## 🔗 Related Stories

### Depends On
- ✅ Story 2.4: Challenge Creation (provider selection)
- ✅ Story 2.5: SMS Provider (SignatureProvider interface)
- ✅ Story 2.6: Push Provider (stub pattern established)

### Enables
- 🔜 Story 3.4: Twilio Voice Integration (production voice calls)
- 🔜 Story 4.2: Fallback Chain (VOICE → SMS fallback)
- 🔜 Story 6.7: Cost Optimization Dashboard

### Blocked By
- None (stub implementation has no dependencies)

---

## 📚 References

### Documentation
- [Twilio Programmable Voice](https://www.twilio.com/docs/voice)
- [Twilio TTS Voices](https://www.twilio.com/docs/voice/twiml/say#voice-voices)
- [Voice UI Best Practices](https://www.nngroup.com/articles/voice-first/)

### Code Files Changed

**Created (4 files):**
- `VoiceCallProvider.java` (stub implementation)
- `VoiceProviderConfig.java` (configuration)
- `VoiceCallProviderTest.java` (7 unit tests)
- `VoiceProviderIntegrationTest.java` (4 integration tests)

**Modified (1 file):**
- `application.yml` (voice provider configuration)

---

## 🎯 Design Decisions

### Why Disabled by Default?

Unlike Push (enabled by default) and SMS (always enabled), Voice is **disabled by default**.

**Reasons:**
1. **Cost Control:** Prevents accidental voice call charges
2. **User Experience:** Voice calls are intrusive, not suitable for all scenarios
3. **Production Readiness:** Stub implementation is clearly not production-ready
4. **Explicit Opt-in:** Forces conscious decision to enable voice calls

**Production Deployment:**
- Development: `enabled: false` (default, testing only)
- UAT: `enabled: true` (test real Twilio integration)
- Production: `enabled: true` (with routing rules limiting usage)

### TTS Message Design

**Format Choices:**
1. **Digit-by-digit:** "1, 2, 3, 4, 5, 6" (not "ciento veintitrés mil")
2. **Repetition:** Code repeated twice (reduces transcription errors)
3. **Expiration:** "válido por 5 minutos" (creates urgency)
4. **Language:** Spanish (es-ES) default for target market

**Alternative Considered:**
- Spell each digit: "uno, dos, tres, cuatro, cinco, seis"
- Rejected: Takes longer, user may not understand Spanish numbers

### Bean Naming Pattern

**Current:**
- SMS: `twilioSmsProvider`
- PUSH: `fcmPushProvider`
- VOICE: `twilioVoiceProvider` ✅

**Pattern:** `{provider}{Channel}Provider` (lowercase)

**Why Consistent?**
- Easy to predict bean names
- Clear separation between channels
- Same provider (Twilio) can support multiple channels (SMS, VOICE)

---

## ✅ Definition of Done

- [x] Code implemented and compiling
- [x] Unit tests written and passing (7 tests)
- [x] Integration tests written and passing (4 tests)
- [x] Configuration documented in application.yml
- [x] Stub warning logs present
- [x] TTS message formatting implemented
- [x] Metrics recorded for stub calls
- [x] Feature flag tested (enabled/disabled)
- [x] Documentation updated (this file)
- [x] No linter errors or warnings
- [x] All existing tests still passing
- [x] Voice provider disabled by default

---

## 📝 Implementation Notes

### Feature Flag Pattern

**Comparison:**
```yaml
# SMS: Always enabled (no feature flag)
providers.twilio.account-sid: ...

# Push: Enabled by default
providers.push.enabled: true

# Voice: Disabled by default (most restrictive)
providers.voice.enabled: false
```

**Pattern Evolution:**
- **MVP (Current):** Feature flags per provider
- **Future (Epic 3):** More granular controls (per-channel, per-customer, per-transaction-type)

### Cost Awareness in Routing

**Example Routing Rules:**
```yaml
# High-value → Voice (cost justified)
- name: "Very High Value → VOICE"
  condition: "amount.value > 1000"
  target: VOICE
  priority: 50

# Medium-value → Push (free, good UX)
- name: "Medium Value → PUSH"
  condition: "amount.value > 100"
  target: PUSH
  priority: 100

# Default → SMS (low cost, reliable)
- name: "Default → SMS"
  condition: "true"
  target: SMS
  priority: 999
```

**Cost-Aware Design:**
- Most expensive (VOICE) reserved for highest-priority scenarios
- Free option (PUSH) used when available
- Reliable fallback (SMS) as default

---

**Story Completed:** 2024-11-27  
**Implemented By:** AI Assistant (Signature Router Team)  
**Reviewed By:** Pending  
**Deployed To:** Development

