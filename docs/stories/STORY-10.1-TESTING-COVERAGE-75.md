# Story 10.1: Testing Coverage to 75%+

## 📋 Story Details

**ID:** STORY-10.1  
**Epic:** Epic 10 - Quality & Testing Excellence  
**Priority:** 🔴 P0 - CRITICAL  
**Effort:** 3-4 weeks  
**Assignee:** TBD  
**Status:** 📝 Planned

---

## 🎯 User Story

**As a** development team  
**I want** comprehensive test coverage (75%+)  
**So that** we can refactor with confidence and prevent regressions in production

---

## 📊 Current State

- **Test Files:** 39
- **Production Files:** 179
- **Coverage:** 21.8%
- **Target:** 75%+
- **Gap:** +53.2%

---

## ✅ Acceptance Criteria

### AC1: Domain Layer Tests (Week 1)
- [ ] `SignatureRequestTest.java`
  - State transitions (PENDING → SIGNED → COMPLETED)
  - Invariant: Only 1 active challenge
  - Edge case: Cannot sign expired request
  - Edge case: Cannot create challenge if one active
- [ ] `SignatureChallengeTest.java`
  - Verification logic (correct code, max attempts)
  - Status transitions (PENDING → SENT → VERIFIED/FAILED)
  - Edge case: Code expires after 3 minutes
- [ ] `RoutingRuleTest.java`
  - SpEL evaluation with various contexts
  - Priority ordering
  - Enable/disable logic
- [ ] All Value Objects tests
  - `MoneyTest` (currency validation, arithmetic)
  - `TransactionContextTest` (validation)
  - `ProviderResultTest`

**Coverage Target:** Domain layer ≥ 90%

### AC2: Application Layer Tests (Week 2)
- [ ] `StartSignatureUseCaseImplTest.java`
  - Happy path: Create request → Create challenge → Publish event
  - Error: Invalid customer ID
  - Error: Routing rules failure
  - Mock: RoutingService, PseudonymizationService, Repositories
- [ ] `CompleteSignatureUseCaseImplTest.java`
  - Happy path: Verify code → Mark signed → Publish event
  - Error: Invalid challenge code (3 attempts)
  - Error: Challenge expired
  - Error: Challenge already used
- [ ] `ManageRoutingRulesUseCaseTest.java`
  - CRUD operations
  - SpEL validation on create/update
  - Soft delete logic
- [ ] `ChallengeServiceImplTest.java`
  - Create challenge with provider
  - Verify challenge code
  - Handle provider failures
- [ ] `IdempotencyServiceTest.java`
  - Duplicate detection (same hash)
  - Conflict detection (different hash)
  - Cleanup of expired records

**Coverage Target:** Application layer ≥ 85%

### AC3: Infrastructure Layer Tests (Week 3)
- [ ] **Repository Integration Tests** (with Testcontainers)
  - `SignatureRequestRepositoryAdapterTest`
  - `RoutingRuleRepositoryAdapterTest`
  - `IdempotencyRecordRepositoryAdapterTest`
  - Test with real PostgreSQL (Testcontainers)
  - Test JSONB serialization/deserialization
  - Test complex queries (findByCustomerIdAndStatus, etc.)

- [ ] **Provider Tests** (Stub Mode)
  - `StubSmsProviderTest`
  - `StubPushProviderTest`
  - `StubVoiceProviderTest`
  - `StubBiometricProviderTest`
  - Test successful send
  - Test provider errors
  - Test circuit breaker behavior

- [ ] **Kafka Integration Tests** (with Testcontainers)
  - `OutboxEventPublisherTest`
  - Test event publishing
  - Test transaction rollback (event not published)
  - Test Avro serialization

- [ ] **REST Controller Tests** (with MockMvc)
  - `SignatureControllerTest`
  - `AdminRuleControllerTest`
  - `RoutingRuleValidationControllerTest`
  - Test authentication/authorization
  - Test request validation
  - Test error responses

**Coverage Target:** Infrastructure layer ≥ 70%

### AC4: End-to-End Tests (Week 4, Days 1-3)
- [ ] **Complete Signature Flow - SMS**
  ```java
  @Test
  void completeSignatureFlow_sms_success() {
      // 1. Create signature request
      // 2. Verify challenge created and SMS "sent" (stub)
      // 3. Get challenge details
      // 4. Complete signature with correct code
      // 5. Verify status is SIGNED
      // 6. Verify event published to Kafka
  }
  ```

- [ ] **Routing Rules Evaluation**
  ```java
  @Test
  void routingRules_highValue_biometric() {
      // Context: amount > 10000
      // Rule: amount > 5000 → BIOMETRIC
      // Verify: Challenge uses BIOMETRIC channel
  }
  ```

- [ ] **Fallback Scenario**
  ```java
  @Test
  void fallback_smsDown_voice() {
      // 1. Simulate SMS provider circuit breaker OPEN
      // 2. Create signature request
      // 3. Verify: Falls back to VOICE
  }
  ```

- [ ] **Idempotency Enforcement**
  ```java
  @Test
  void idempotency_duplicateRequest_cachedResponse() {
      // 1. Create request with idempotency key
      // 2. Send same request again (same key, same body)
      // 3. Verify: Returns cached response (no duplicate in DB)
  }
  ```

**Coverage Target:** E2E flows ≥ 90%

### AC5: CI/CD Configuration (Week 4, Days 4-5)
- [ ] Update `pom.xml` with JaCoCo enforcement
  ```xml
  <plugin>
      <groupId>org.jacoco</groupId>
      <artifactId>jacoco-maven-plugin</artifactId>
      <executions>
          <execution>
              <id>check</id>
              <goals>
                  <goal>check</goal>
              </goals>
              <configuration>
                  <rules>
                      <rule>
                          <element>BUNDLE</element>
                          <limits>
                              <limit>
                                  <counter>INSTRUCTION</counter>
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
  ```

- [ ] Generate coverage report: `mvn clean verify jacoco:report`
- [ ] Commit coverage report to `docs/coverage/index.html`
- [ ] Update README with testing badge
- [ ] Document testing strategy in `docs/TESTING-STRATEGY.md`

**Coverage Target:** Overall project ≥ 75%

---

## 📝 Tasks Breakdown

### Week 1: Domain Layer (5 days)
- [ ] **Day 1:** Setup test infrastructure
  - [ ] Add Testcontainers dependencies
  - [ ] Configure JaCoCo
  - [ ] Create test base classes
- [ ] **Day 2-3:** SignatureRequest & SignatureChallenge tests
  - [ ] All state transitions
  - [ ] All business rules
  - [ ] Edge cases
- [ ] **Day 4:** RoutingRule tests
- [ ] **Day 5:** Value Objects tests + review

### Week 2: Application Layer (5 days)
- [ ] **Day 1-2:** Use Case tests (Start, Complete)
- [ ] **Day 3:** ManageRoutingRules + Challenge Service
- [ ] **Day 4:** Idempotency Service
- [ ] **Day 5:** Review + fix flaky tests

### Week 3: Infrastructure Layer (5 days)
- [ ] **Day 1-2:** Repository integration tests (Testcontainers)
- [ ] **Day 3:** Provider tests (stubs)
- [ ] **Day 4:** Kafka integration tests
- [ ] **Day 5:** Controller tests (MockMvc)

### Week 4: E2E + CI/CD (5 days)
- [ ] **Day 1-2:** E2E flow tests
- [ ] **Day 3:** Fallback & edge case E2E tests
- [ ] **Day 4:** CI/CD configuration
- [ ] **Day 5:** Documentation + final review

---

## 🧪 Testing Strategy

### Test Pyramid Distribution
```
         /\
        /E2\      10% - E2E Tests (4-5 tests)
       /____\
      /      \
     /  INT   \   30% - Integration Tests (~30 tests)
    /_________\
   /           \
  /    UNIT     \ 60% - Unit Tests (~100 tests)
 /______________\
```

### Test Naming Convention
```java
// Pattern: methodName_scenario_expectedBehavior

@Test
void createChallenge_whenActiveExists_throwsException() { }

@Test
void verifyCode_withCorrectCode_marksVerified() { }

@Test
void verifyCode_withWrongCode_decrementAttempts() { }
```

### Mocking Strategy
- **Domain Layer:** NO mocks (pure logic)
- **Application Layer:** Mock repositories, domain services
- **Infrastructure Layer:** Real database (Testcontainers), mock external APIs

---

## 🛠️ Tools & Libraries

### Required Dependencies
```xml
<!-- Testing -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- Testcontainers -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>kafka</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>

<!-- RestAssured -->
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <version>5.3.2</version>
    <scope>test</scope>
</dependency>
```

---

## 📊 Progress Tracking

### Coverage Progress
| Layer | Current | Target | Status |
|-------|---------|--------|--------|
| Domain | ~30% | 90% | 🔴 In Progress |
| Application | ~15% | 85% | 🔴 Not Started |
| Infrastructure | ~10% | 70% | 🔴 Not Started |
| Overall | 21.8% | 75% | 🔴 Not Started |

### Test Count Progress
| Type | Current | Target | Status |
|------|---------|--------|--------|
| Unit | ~25 | 100 | 🔴 In Progress |
| Integration | ~10 | 30 | 🔴 Not Started |
| E2E | ~4 | 5 | 🔴 Not Started |
| Total | 39 | 135 | 🔴 Not Started |

---

## ⚠️ Risks & Mitigation

### Risk 1: Tests Take Longer Than Expected
**Mitigation:**
- Start with critical paths
- Use test templates
- Pair programming for complex tests

### Risk 2: Testcontainers Slow Down Build
**Mitigation:**
- Use `@DirtiesContext` sparingly
- Reuse containers across tests
- Consider separate `integration-test` profile

### Risk 3: Flaky Tests
**Mitigation:**
- No Thread.sleep() - use Awaitility
- Proper test isolation
- Clean state between tests

---

## ✅ Definition of Done

- [ ] All acceptance criteria met
- [ ] Test coverage ≥ 75% (measured by JaCoCo)
- [ ] Build fails if coverage drops below 75%
- [ ] No flaky tests (10 consecutive successful runs)
- [ ] Test execution time < 5 minutes
- [ ] Documentation updated (TESTING-STRATEGY.md)
- [ ] Code reviewed
- [ ] E2E flow verified manually

---

## 📚 References

- [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/)
- [Testcontainers Guide](https://www.testcontainers.org/)
- [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [Hexagonal Architecture Testing](../architecture/HexagonalArchitectureTest.java)

---

**Story Owner:** TBD  
**Created:** 2025-11-29  
**Last Updated:** 2025-11-29

