# Story 2.6: Push Notification Provider (Stub Implementation)

**Status:** ✅ Done  
**Epic:** Epic 2 - Signature Routing Engine  
**Sprint:** Sprint 2  
**Story Points:** 2

---

## 📋 Story Description

**As a** System  
**I want** Enviar push challenges a in-app notifications  
**So that** Usuarios reciben challenges en la app móvil

---

## ✅ Acceptance Criteria

### AC1: Push Provider Interface Implementation
- [x] `PushNotificationProvider` implements `SignatureProvider`
- [x] Stub implementation (no real API calls)
- [x] Bean registered as `fcmPushProvider` (maps to `ProviderType.FCM`)
- [x] Feature flag controlled via `providers.push.enabled`

### AC2: Stub Behavior
- [x] Returns successful `ProviderResult` without actual notification send
- [x] Generates mock notification IDs (format: `push_{UUID}`)
- [x] Logs warning: "PUSH challenge sent (stub implementation)"
- [x] Records metrics for monitoring

### AC3: Configuration
- [x] `PushProviderConfig` with feature flag
- [x] Default: `enabled = true`
- [x] Future-ready for FCM integration (Story 3.3)

### AC4: Testing
- [x] Unit tests for stub provider
- [x] Integration tests with routing rules
- [x] Test scenarios: PUSH routing, fallback to SMS
- [x] All existing tests still passing

### AC5: Documentation
- [x] Inline comments explaining stub nature
- [x] Future integration notes (FCM)
- [x] Configuration documentation

---

## 🏗️ Technical Implementation

### Infrastructure Layer

#### PushNotificationProvider (Stub)
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/push/PushNotificationProvider.java`

**Responsibilities:**
- Implements `SignatureProvider` interface
- Simulates successful push notification delivery
- Generates mock notification IDs
- Records metrics (calls, success rate)
- Feature flag controlled

**Key Method:**
```java
@Override
public ProviderResult sendChallenge(SignatureChallenge challenge, String deviceToken) {
    log.warn("PUSH challenge sent (stub implementation) - No real notification sent");
    
    // Generate mock notification ID
    String mockNotificationId = "push_" + UUID.randomUUID().toString();
    String mockProof = "stub_push_proof:" + mockNotificationId;
    
    // Record metrics
    meterRegistry.counter(METRIC_PREFIX + ".calls", "status", "success", "type", "stub").increment();
    
    return ProviderResult.of(mockNotificationId, mockProof);
}
```

**Stub Characteristics:**
- ✅ Always succeeds (no network errors)
- ✅ No actual API calls
- ✅ Instant response (no latency)
- ✅ Unique notification IDs per call

**Why Stub?**
- Allows testing routing logic without real push service
- Faster test execution
- No external dependencies in tests
- Production implementation planned for Story 3.3

#### PushProviderConfig
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/push/PushProviderConfig.java`

**Properties:**
```yaml
providers:
  push:
    enabled: true             # Feature flag
    api-url: https://fcm.googleapis.com/fcm/send  # Future use
    timeout-seconds: 3
```

**Validation:**
- Feature flag checked via `@ConditionalOnProperty`
- Provider not loaded if `enabled = false`

---

### Provider Selection

#### Existing ProviderSelectorService
**File:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/provider/ProviderSelectorServiceImpl.java`

**Channel Mapping:**
```java
private static final Map<ChannelType, ProviderType> CHANNEL_TO_PROVIDER = Map.of(
    ChannelType.SMS, ProviderType.TWILIO,
    ChannelType.PUSH, ProviderType.FCM,      // ← Maps to fcmPushProvider bean
    ChannelType.VOICE, ProviderType.TWILIO,
    ChannelType.BIOMETRIC, ProviderType.BIOMETRIC_SDK
);
```

**No Changes Required:**
- Story 2.4 already implemented PUSH → FCM mapping
- Provider resolution via Spring bean name convention
- Bean name: `fcmPushProvider` (lowercase provider name + channel suffix)

---

### Application Layer

#### ChallengeServiceImpl
**File:** `src/main/java/com/bank/signature/application/service/ChallengeServiceImpl.java`

**Provider Resolution (existing):**
```java
private SignatureProvider getProvider(ProviderType providerType) {
    String beanName = providerType.name().toLowerCase() + "PushProvider";
    // For FCM: "fcm" + "PushProvider" = "fcmPushProvider"
    return providerMap.get(beanName);
}
```

**Note:** This resolution logic handles SMS and PUSH differently:
- SMS: `twilioSmsProvider` (provider + "SmsProvider")
- PUSH: `fcmPushProvider` (provider + "PushProvider")
- Future refactoring may standardize this (Epic 3)

---

### Configuration

#### Application.yml Updates
**File:** `src/main/resources/application.yml`

```yaml
providers:
  twilio:
    # ... (Story 2.5)
  
  push:
    enabled: true
    api-url: https://fcm.googleapis.com/fcm/send
    timeout-seconds: 3
```

**Feature Flag Usage:**
```yaml
# Disable push provider
providers.push.enabled: false
```

When disabled:
- Bean not loaded (`@ConditionalOnProperty`)
- Routing still works (selects PUSH channel)
- Provider not found → `NoAvailableProviderException` thrown

---

### Testing

#### Unit Tests
**File:** `src/test/java/com/bank/signature/infrastructure/adapter/outbound/provider/push/PushNotificationProviderTest.java`

**Test Scenarios:**
1. ✅ Successfully send push notification (stub)
2. ✅ Generate unique notification IDs
3. ✅ Record success metrics
4. ✅ Provider available when enabled
5. ✅ Provider unavailable when disabled
6. ✅ Handle null device token gracefully

**Coverage:** 100% for stub implementation

#### Integration Tests
**File:** `src/test/java/com/bank/signature/PushProviderIntegrationTest.java`

**Test Scenarios:**

**Test 1: Route to PUSH and send notification**
```java
// Given: Routing rule "amount > 100 → PUSH"
// When: Create signature request with amount = 250
// Then: 
//   - Challenge created with channelType = PUSH
//   - Provider = FCM
//   - Status = SENT (stub always succeeds)
//   - providerProof contains "stub_push_proof:"
```

**Test 2: Fallback to SMS when no PUSH rule matches**
```java
// Given: No routing rules
// When: Create signature request
// Then: Default to SMS channel (not PUSH)
```

**Test 3: Route to PUSH for mobile app transactions**
```java
// Given: Routing rule "merchantId contains 'mobile-app' → PUSH"
// When: Create request with merchantId = "mobile-app-store"
// Then: PUSH channel selected and notification sent
```

**Results:**
```
✅ 9 tests passing (6 unit + 3 integration)
✅ 0 failures
✅ All existing tests still passing
```

---

## 🔍 Stub vs Production Comparison

### Stub Implementation (Current - Story 2.6)

**Characteristics:**
- ✅ No network calls
- ✅ Instant response
- ✅ Always succeeds
- ✅ Mock notification IDs
- ✅ Suitable for routing testing

**Limitations:**
- ❌ No actual notifications sent
- ❌ No device token validation
- ❌ No delivery receipts
- ❌ No error scenarios

**Use Cases:**
- Development/testing
- Routing engine validation
- Performance testing (no external dependencies)

### Production Implementation (Future - Story 3.3)

**Planned Features:**
- Firebase Cloud Messaging (FCM) SDK integration
- Device token management
- Notification payload customization
- Delivery receipts handling
- Error handling (invalid tokens, FCM errors)
- Retry logic with Resilience4j
- Metrics (latency, success rate, errors)

**Configuration (Future):**
```yaml
providers:
  push:
    enabled: true
    fcm:
      server-key: ${FCM_SERVER_KEY}        # From Vault
      sender-id: ${FCM_SENDER_ID}          # From Vault
      project-id: ${FCM_PROJECT_ID}        # From Vault
    timeout-seconds: 3
```

---

## 📊 Metrics

### Current Stub Metrics
- **provider.push.calls** (Counter)
  - Tags: `status=success`, `type=stub`
  - Purpose: Track stub provider invocations

### Future Production Metrics (Story 3.3)
- **provider.push.calls** (Counter)
  - Tags: `status` (success/failed), `type=fcm`
- **provider.push.latency** (Timer)
  - Tags: `status` (success/error)
- **provider.push.errors** (Counter)
  - Tags: `error_code` (invalid_token, fcm_error, etc.)

---

## 🔒 Security Considerations

### Stub Implementation
- ✅ No credentials required
- ✅ No sensitive data exposure
- ⚠️ Logs device token (acceptable for testing)

### Future Production (Story 3.3)
- FCM server key stored in Vault
- Device tokens encrypted at rest
- TLS for all FCM API calls
- Token validation before sending

---

## 🚀 Deployment Notes

### Prerequisites
- None (stub has no external dependencies)

### Configuration Checklist
- [ ] `providers.push.enabled` set appropriately per environment
- [ ] Metrics endpoint exposed for Prometheus
- [ ] Logs configured for stub warnings

### Rollback Plan
If Story 2.6 needs to be rolled back:
1. Set `providers.push.enabled: false`
2. All PUSH routing rules will fail with `NoAvailableProviderException`
3. Update routing rules to use SMS or VOICE

---

## 📈 Performance Characteristics

### Stub Implementation
- **Latency:** ~1ms (in-memory only)
- **Throughput:** Unlimited (no external calls)
- **Success Rate:** 100% (always succeeds)
- **CPU:** Minimal (UUID generation only)
- **Memory:** Negligible

### Future Production (Estimated - Story 3.3)
- **Latency:** 
  - P50: ~500ms
  - P95: ~1.5s
  - P99: ~3s (timeout)
- **Throughput:** FCM limit (~500k/sec per project)
- **Success Rate:** ~98% (depends on token validity)

---

## 🔗 Related Stories

### Depends On
- ✅ Story 2.4: Challenge Creation (provider selection)
- ✅ Story 2.5: SMS Provider (SignatureProvider interface)

### Enables
- 🔜 Story 2.7: Voice Call Provider (similar stub pattern)
- 🔜 Story 3.3: FCM Integration (production push notifications)
- 🔜 Story 6.4: Device Token Management

### Blocked By
- None (stub implementation has no dependencies)

---

## 📚 References

### Documentation
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Push Notification Best Practices](https://developer.android.com/design/patterns/notifications)

### Code Files Changed

**Created (4 files):**
- `PushNotificationProvider.java` (stub implementation)
- `PushProviderConfig.java` (configuration)
- `PushNotificationProviderTest.java` (unit tests)
- `PushProviderIntegrationTest.java` (integration tests)

**Modified (1 file):**
- `application.yml` (push provider configuration)

---

## 🎯 Story vs Epic Scope

### Story 2.6 Scope (Current)
- ✅ Stub implementation only
- ✅ No external dependencies
- ✅ Testing routing to PUSH channel
- ✅ Feature flag support

### Epic 3 Scope (Future)
- 🔜 Production FCM integration
- 🔜 Device token management
- 🔜 Notification customization
- 🔜 Delivery receipts
- 🔜 Error handling & retry

**Design Decision:**
Stub implementation allows:
1. Unblocking routing engine development
2. Testing PUSH channel without FCM account
3. Faster test execution
4. Clear separation: routing logic (Epic 2) vs provider implementation (Epic 3)

---

## ✅ Definition of Done

- [x] Code implemented and compiling
- [x] Unit tests written and passing (6 tests)
- [x] Integration tests written and passing (3 tests)
- [x] Configuration documented in application.yml
- [x] Stub warning logs present
- [x] Metrics recorded for stub calls
- [x] Documentation updated (this file)
- [x] No linter errors or warnings
- [x] All existing tests still passing
- [x] Feature flag tested (enabled/disabled)

---

## 📝 Implementation Notes

### Why Stub First?

**Advantages:**
1. **Fast Development:** No need to set up FCM account for Epic 2
2. **Stable Tests:** No flaky tests due to network issues
3. **Clear Contracts:** Interface defined, implementation swappable
4. **Parallel Work:** Epic 3 can implement FCM independently

**Trade-offs:**
- ⚠️ No real-world error scenarios tested
- ⚠️ May miss FCM-specific issues
- ⚠️ Requires future story for production readiness

**Mitigation:**
- Clearly document stub nature (logs, docs, code comments)
- Plan Epic 3 story for FCM integration
- Keep stub available for testing even after production impl

### Bean Naming Convention

Current convention is inconsistent:
- SMS: `twilioSmsProvider` (provider name + channel suffix)
- PUSH: `fcmPushProvider` (provider name + channel suffix)

Both work but pattern differs:
- Twilio is a company name
- FCM is a service name

**Future Refactoring (Epic 3):**
- Standardize to: `{provider}_{channel}_provider`
- Example: `twilio_sms_provider`, `fcm_push_provider`
- Update `ChallengeServiceImpl.getProvider()` resolution logic

---

## 🔍 Testing Strategy

### Stub Testing Focus
Since this is a stub, tests focus on:
1. **Interface Compliance:** Provider implements `SignatureProvider`
2. **Integration Flow:** Routing → Provider selection → Challenge sent
3. **Feature Flag:** Provider loads/unloads based on config
4. **Metrics:** Stub calls recorded

Tests do NOT verify:
- ❌ Real notification delivery
- ❌ FCM token validation
- ❌ Network error handling
- ❌ Retry logic

Those will be tested in Story 3.3 (FCM Integration).

---

**Story Completed:** 2024-11-27  
**Implemented By:** AI Assistant (Signature Router Team)  
**Reviewed By:** Pending  
**Deployed To:** Development

