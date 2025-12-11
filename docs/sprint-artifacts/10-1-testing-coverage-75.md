# Story 10.1: Testing Coverage to 75%+

**Status:** in-progress  
**Epic:** Epic 10 v2 - Quality & Testing Excellence  
**Sprint:** Sprint 10  
**Story Points:** 8  
**Priority:** 🔴 P0 (CRITICAL - blocks production)  
**Created:** 2025-11-29

---

## 📋 Story Description

**As a** Development Team & SRE Team  
**I want** Comprehensive test suite with 75%+ code coverage  
**So that** We can confidently deploy to production with minimal regression risk and meet regulatory requirements for banking applications

---

## 🎯 Business Value

### **Why 75%+ Coverage is CRITICAL:**

1. **Regulatory Compliance** 🔴  
   - BCRA (Banco Central) requires 75%+ test coverage for banking systems
   - Cannot pass production audit without comprehensive testing
   - Blocks production deployment

2. **Risk Mitigation** 💰  
   - Current coverage: ~22% (HIGH RISK)
   - 1 bug in production = $500K+ (downtime + SLA penalties)
   - Comprehensive tests = 90% fewer production bugs

3. **Refactoring Confidence** 🛡️  
   - With 75%+ coverage: Safe to refactor/optimize
   - Without tests: Every change = potential production incident
   - Enables future innovation without fear

4. **Team Velocity** 🚀  
   - Tests as living documentation (faster onboarding)
   - Catch regressions in seconds (not hours debugging)
   - Faster feature delivery (no manual QA bottleneck)

---

## ✅ Acceptance Criteria

### **AC1: Domain Layer Coverage >90%**
**Given** Domain layer has aggregates, entities, and value objects  
**When** I run tests  
**Then** JaCoCo reports >90% coverage for `com.singularbank.signature.routing.domain.**`

**Files to Test:**
- `SignatureRequest.java` (aggregate) - state transitions, invariants
- `SignatureChallenge.java` (entity) - verification logic
- `RoutingRule.java` (aggregate) - SpEL evaluation
- Value Objects: `Money`, `TransactionContext`, `ChannelType`, `ProviderType`, etc.

---

### **AC2: Application Layer Coverage >85%**
**Given** Application layer has use cases and services  
**When** I run tests  
**Then** JaCoCo reports >85% coverage for `com.singularbank.signature.routing.application.**`

**Files to Test:**
- `StartSignatureUseCaseImpl.java`
- `CompleteSignatureUseCaseImpl.java`
- `AbortSignatureUseCaseImpl.java`
- `ManageRoutingRulesUseCaseImpl.java`
- `ChallengeServiceImpl.java`
- `IdempotencyServiceImpl.java`

---

### **AC3: Infrastructure Layer Coverage >70%**
**Given** Infrastructure layer has adapters and external integrations  
**When** I run tests (with Testcontainers for integration tests)  
**Then** JaCoCo reports >70% coverage for `com.singularbank.signature.routing.infrastructure.**`

**Files to Test:**
- Repository adapters (with Testcontainers PostgreSQL)
- REST controllers (with MockMvc + Security)
- Kafka event publishers (with Testcontainers Kafka)
- Provider integrations (stub mode)

---

### **AC4: E2E Tests for Critical Flows**
**Given** Complete signature flow is the most critical path  
**When** I run E2E tests  
**Then** All critical flows pass:
- ✅ Create signature request → Send challenge → User completes → Success
- ✅ Create signature request → User aborts → Aborted
- ✅ Create signature request → Expires → Expired
- ✅ Routing engine evaluates rules correctly
- ✅ Fallback chain triggers when provider fails
- ✅ Idempotency prevents duplicate requests

---

### **AC5: JaCoCo Enforcement Configured**
**Given** JaCoCo is configured in `pom.xml`  
**When** I run `mvn test`  
**Then** Build FAILS if coverage <75%  
**And** Coverage report is generated at `target/site/jacoco/index.html`

---

### **AC6: CI/CD Integration**
**Given** Tests are comprehensive  
**When** CI/CD pipeline runs  
**Then** Tests execute automatically  
**And** Pipeline FAILS if coverage <75%  
**And** Coverage report is published as artifact

---

## 📋 Tasks

### **Phase 1: Domain Layer Tests (Day 1-2)**

#### **Task 1.1: SignatureRequest Aggregate Tests** (4h)
**File:** `src/test/java/com/bank/signature/domain/model/aggregate/SignatureRequestTest.java`

**Test Cases:**
```java
@Test void shouldCreatePendingSignatureRequest()
@Test void shouldTransitionToSignedWhenChallengeCompleted()
@Test void shouldTransitionToAbortedWhenUserAborts()
@Test void shouldTransitionToExpiredWhenTTLExceeds()
@Test void shouldThrowExceptionWhenInvalidStateTransition()
@Test void shouldCalculateRemainingTTL()
@Test void shouldFindChallengeById()
@Test void shouldThrowExceptionWhenChallengeNotFound()
@Test void shouldValidateInvariants() // Aggregate invariants
```

**Target:** >95% coverage for `SignatureRequest.java`

---

#### **Task 1.2: Value Objects Tests** (3h)
**Files:**
- `MoneyTest.java` - equality, comparison, arithmetic
- `TransactionContextTest.java` - immutability, validation
- `ChannelTypeTest.java` - enum validation
- `ProviderTypeTest.java` - enum validation
- `SignatureStatusTest.java` - state transitions
- `ChallengeStatusTest.java` - state transitions

**Target:** 100% coverage for all value objects

---

#### **Task 1.3: SignatureChallenge Entity Tests** (2h)
**File:** `SignatureChallengeTest.java`

**Test Cases:**
```java
@Test void shouldValidateCorrectCode()
@Test void shouldRejectIncorrectCode()
@Test void shouldMarkAsCompleted()
@Test void shouldMarkAsExpired()
@Test void shouldCalculateExpirationTime()
```

---

### **Phase 2: Application Layer Tests (Day 3-4)**

#### **Task 2.1: StartSignatureUseCaseImpl Tests** (4h)
**File:** `StartSignatureUseCaseImplTest.java`

**Test Cases:**
```java
@Test void shouldCreateSignatureRequestSuccessfully()
@Test void shouldPseudonymizeCustomerId()
@Test void shouldCalculateTransactionHash()
@Test void shouldEvaluateRoutingRules()
@Test void shouldCreateAndSendChallenge()
@Test void shouldSaveToRepository()
@Test void shouldRecordPrometheusMetrics()
@Test void shouldEnterDegradedModeWhenSystemDegraded()
@Test void shouldEnforceRateLimit()
@Test void shouldThrowExceptionWhenRateLimitExceeded()
```

**Mocking:**
- Mock `SignatureRequestRepository`
- Mock `RoutingService`
- Mock `ChallengeService`
- Mock `PseudonymizationService`
- Mock `DegradedModeManager`

**Target:** >90% coverage

---

#### **Task 2.2: CompleteSignatureUseCaseImpl Tests** (3h)
**File:** `CompleteSignatureUseCaseImplTest.java`

**Test Cases:**
```java
@Test void shouldCompleteSignatureWithValidCode()
@Test void shouldRejectInvalidCode()
@Test void shouldEnforceMaxAttempts()
@Test void shouldMarkChallengeAsCompleted()
@Test void shouldTransitionSignatureRequestToSigned()
@Test void shouldPublishSignatureCompletedEvent()
@Test void shouldRecordMetrics()
```

---

#### **Task 2.3: Other Use Cases Tests** (3h)
- `AbortSignatureUseCaseImplTest.java`
- `ManageRoutingRulesUseCaseImplTest.java`
- `QuerySignatureUseCaseImplTest.java`

---

### **Phase 3: Infrastructure Layer Tests (Day 5-6)**

#### **Task 3.1: Repository Integration Tests (Testcontainers)** (4h)
**File:** `SignatureRequestRepositoryIntegrationTest.java`

**Setup:**
```java
@Testcontainers
@SpringBootTest
class SignatureRequestRepositoryIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        // ...
    }
}
```

**Test Cases:**
```java
@Test void shouldSaveAndRetrieveSignatureRequest()
@Test void shouldUpdateSignatureRequestStatus()
@Test void shouldFindByIdWithChallenges()
@Test void shouldDeleteExpiredRequests()
@Test void shouldHandleJSONBColumns() // TransactionContext, RoutingTimeline
```

**Target:** >85% coverage for repository adapters

---

#### **Task 3.2: REST Controller Tests (MockMvc)** (4h)
**File:** `SignatureControllerIntegrationTest.java`

**Setup:**
```java
@WebMvcTest(SignatureController.class)
@Import(SecurityConfig.class)
class SignatureControllerIntegrationTest {
    
    @Autowired MockMvc mockMvc;
    @MockBean StartSignatureUseCase startSignatureUseCase;
    // ...
}
```

**Test Cases:**
```java
@Test void shouldCreateSignatureRequestWithValidJWT()
@Test void shouldReject401WhenNoJWT()
@Test void shouldReject403WhenInsufficientScopes()
@Test void shouldValidateRequestBody()
@Test void shouldReturnIdempotentResponseForDuplicateKey()
@Test void shouldHandleGlobalExceptions()
```

---

#### **Task 3.3: Kafka Integration Tests** (3h)
**File:** `KafkaEventPublisherIntegrationTest.java`

**Setup:**
```java
@Testcontainers
@SpringBootTest
class KafkaEventPublisherIntegrationTest {
    
    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.5.0")
    );
}
```

**Test Cases:**
```java
@Test void shouldPublishSignatureCreatedEvent()
@Test void shouldPublishSignatureCompletedEvent()
@Test void shouldSerializeAvroCorrectly()
@Test void shouldPropagateTraceContext()
```

---

### **Phase 4: E2E Tests (Day 7)**

#### **Task 4.1: Complete Signature Flow E2E** (4h)
**File:** `CompleteSignatureFlowE2ETest.java`

**Setup:**
```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
class CompleteSignatureFlowE2ETest {
    
    @Container static PostgreSQLContainer<?> postgres = ...;
    @Container static KafkaContainer kafka = ...;
    
    @Autowired TestRestTemplate restTemplate;
}
```

**Test Case:**
```java
@Test
void shouldCompleteEntireSignatureFlow() {
    // 1. Create signature request
    ResponseEntity<SignatureRequestDTO> createResponse = 
        restTemplate.postForEntity("/api/v1/signatures", request, ...);
    
    // 2. Verify challenge sent
    assertThat(createResponse.getBody().getChallenges()).hasSize(1);
    
    // 3. Complete challenge
    ResponseEntity<SignatureCompletionDTO> completeResponse =
        restTemplate.postForEntity("/api/v1/signatures/.../complete", ...);
    
    // 4. Verify signature completed
    assertThat(completeResponse.getBody().getStatus()).isEqualTo("SIGNED");
    
    // 5. Verify event published to Kafka
    // ...
}
```

---

### **Phase 5: JaCoCo Configuration & Enforcement (Day 7)**

#### **Task 5.1: Configure JaCoCo in pom.xml** (1h)

**Add to `pom.xml`:**
```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.jacoco</groupId>
            <artifactId>jacoco-maven-plugin</artifactId>
            <version>0.8.11</version>
            <executions>
                <execution>
                    <id>prepare-agent</id>
                    <goals>
                        <goal>prepare-agent</goal>
                    </goals>
                </execution>
                <execution>
                    <id>report</id>
                    <phase>test</phase>
                    <goals>
                        <goal>report</goal>
                    </goals>
                </execution>
                <execution>
                    <id>check</id>
                    <phase>verify</phase>
                    <goals>
                        <goal>check</goal>
                    </goals>
                    <configuration>
                        <rules>
                            <rule>
                                <element>BUNDLE</element>
                                <limits>
                                    <limit>
                                        <counter>LINE</counter>
                                        <value>COVEREDRATIO</value>
                                        <minimum>0.75</minimum>
                                    </limit>
                                </limits>
                            </rule>
                        </rules>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

---

#### **Task 5.2: Document Testing Strategy** (1h)

**Update `README.md`:**
- Testing Philosophy section
- How to run tests locally
- How to generate coverage report
- Coverage requirements (75%+)

---

## 📂 Files to Create

### **Domain Layer Tests (15 files)**
1. `SignatureRequestTest.java` (~200 lines)
2. `SignatureChallengeTest.java` (~150 lines)
3. `RoutingRuleTest.java` (~150 lines)
4. `MoneyTest.java` (~100 lines)
5. `TransactionContextTest.java` (~80 lines)
6. `ChannelTypeTest.java` (~50 lines)
7. `ProviderTypeTest.java` (~50 lines)
8. `SignatureStatusTest.java` (~60 lines)
9. `ChallengeStatusTest.java` (~60 lines)
10. `RoutingEventTest.java` (~60 lines)
11. `ProviderResultTest.java` (~60 lines)
12-15. Other value objects tests

### **Application Layer Tests (8 files)**
1. `StartSignatureUseCaseImplTest.java` (~300 lines)
2. `CompleteSignatureUseCaseImplTest.java` (~250 lines)
3. `AbortSignatureUseCaseImplTest.java` (~150 lines)
4. `ManageRoutingRulesUseCaseImplTest.java` (~200 lines)
5. `QuerySignatureUseCaseImplTest.java` (~100 lines)
6. `ChallengeServiceImplTest.java` (~200 lines)
7. `IdempotencyServiceImplTest.java` (~150 lines)
8. Other service tests

### **Infrastructure Layer Tests (10 files)**
1. `SignatureRequestRepositoryIntegrationTest.java` (~250 lines)
2. `RoutingRuleRepositoryIntegrationTest.java` (~200 lines)
3. `SignatureControllerIntegrationTest.java` (~300 lines)
4. `RoutingRuleControllerIntegrationTest.java` (~200 lines)
5. `KafkaEventPublisherIntegrationTest.java` (~200 lines)
6. `TwilioSmsProviderTest.java` (~150 lines)
7. `PushNotificationProviderTest.java` (~150 lines)
8-10. Other infrastructure tests

### **E2E Tests (2 files)**
1. `CompleteSignatureFlowE2ETest.java` (~300 lines)
2. `RoutingFallbackE2ETest.java` (~250 lines)

**Total:** ~35 new test files (~5,500 lines)

---

## 🧪 Testing Strategy

### **Unit Tests (Domain + Application)**
- **Scope:** Pure business logic, no external dependencies
- **Tools:** JUnit 5, Mockito, AssertJ
- **Target:** >90% coverage
- **Speed:** Fast (<5ms per test)

### **Integration Tests (Infrastructure)**
- **Scope:** Adapters, repositories, external integrations
- **Tools:** Testcontainers, MockMvc, Spring Boot Test
- **Target:** >70% coverage
- **Speed:** Moderate (~500ms per test)

### **E2E Tests (Complete Flows)**
- **Scope:** Critical user journeys
- **Tools:** TestRestTemplate, Testcontainers
- **Target:** 100% critical flows covered
- **Speed:** Slow (~2-3s per test)

---

## 📊 Expected Coverage Breakdown

| Layer | Current | Target | Gap | Priority |
|-------|---------|--------|-----|----------|
| **Domain** | ~30% | >90% | +60% | 🔴 HIGH |
| **Application** | ~25% | >85% | +60% | 🔴 HIGH |
| **Infrastructure** | ~15% | >70% | +55% | 🟡 MEDIUM |
| **TOTAL** | **~22%** | **>75%** | **+53%** | 🔴 CRITICAL |

---

## 🎯 Definition of Done

- [ ] Domain layer tests: >90% coverage
- [ ] Application layer tests: >85% coverage
- [ ] Infrastructure layer tests: >70% coverage
- [ ] **Total coverage: >75%**
- [ ] JaCoCo configured to FAIL build if <75%
- [ ] All tests passing (0 failures)
- [ ] E2E tests cover critical flows
- [ ] Coverage report generated at `target/site/jacoco/index.html`
- [ ] README.md updated with testing strategy
- [ ] CI/CD pipeline fails if coverage <75%

---

## 🔗 Dependencies

- **JUnit 5** ✅ Already in pom.xml
- **Mockito** ✅ Already in pom.xml
- **AssertJ** ✅ Already in pom.xml
- **Testcontainers** ✅ Already in pom.xml
- **Spring Boot Test** ✅ Already in pom.xml
- **JaCoCo** ✅ Already in pom.xml (needs configuration)

---

## 📈 Success Metrics

- ✅ JaCoCo reports >75% total coverage
- ✅ Build FAILS if coverage drops below 75%
- ✅ 0 critical paths untested
- ✅ 0 test failures in CI/CD
- ✅ <5 minutes total test execution time

---

**Story Status:** ✅ READY FOR IMPLEMENTATION  
**Estimated Effort:** 8 Story Points (~1 week)  
**Priority:** 🔴 P0 (BLOCKS PRODUCTION)

---

**Created by:** AI Coding Assistant  
**Date:** 2025-11-29  
**Version:** 1.0

