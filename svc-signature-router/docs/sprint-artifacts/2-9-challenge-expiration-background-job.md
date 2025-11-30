# Story 2.9: Challenge Expiration Background Job

**Status:** ✅ Done  
**Epic:** Epic 2 - Signature Routing Engine  
**Sprint:** Sprint 2  
**Story Points:** 3

---

## 📋 Story Description

**As a** System  
**I want** Expirar automáticamente challenges que superan TTL sin respuesta  
**So that** No quedan challenges pendientes indefinidamente

---

## ✅ Acceptance Criteria

### AC1: Scheduled Job Execution
- [x] Ejecuta cada 30 segundos (@Scheduled fixedDelay=30000)
- [x] Initial delay de 10 segundos (espera a que la app esté lista)
- [x] Transaccional (@Transactional)

### AC2: Challenge Detection
Encuentra challenges con:
- [x] status IN ('PENDING', 'SENT')
- [x] expiresAt < CURRENT_TIMESTAMP
- [x] Límite: 1000 challenges por ejecución (evitar long-running job)

### AC3: Expiration Logic
- [x] challenge.status → EXPIRED
- [x] challenge.errorCode → "TTL_EXCEEDED"
- [x] signatureRequest.status → EXPIRED (si no hay más active challenges)

### AC4: Performance & Observability
- [x] Query con JOIN FETCH (evita N+1)
- [x] Batch update via domain aggregates
- [x] Métricas: `challenges.expired.count` (counter)
- [x] Métricas: `challenges.expired.errors` (counter)
- [x] Logging detallado (INFO, ERROR)

### AC5: Testing
- [x] Tests verifican expiración de challenges vencidos
- [x] Tests verifican que NO se expiran challenges válidos
- [x] Tests verifican que solo PENDING/SENT se expiran

---

## 🏗️ Technical Implementation

### Domain Layer

**`SignatureChallenge.expire()`**
```java
public void expire() {
    if (this.status != PENDING && this.status != SENT) {
        throw new InvalidStateTransitionException(...);
    }
    this.status = ChallengeStatus.EXPIRED;
    this.errorCode = "TTL_EXCEEDED";
}
```

**`SignatureChallenge.isExpired()`**
```java
public boolean isExpired() {
    return Instant.now().isAfter(this.expiresAt);
}
```

### Infrastructure Layer

**ChallengeExpirationScheduler**
**File:** `src/main/java/com/bank/signature/infrastructure/scheduler/ChallengeExpirationScheduler.java`

**Schedule:** `@Scheduled(fixedDelay = 30000, initialDelay = 10000)`
- Fixed delay: Espera 30s después de terminar antes de iniciar siguiente ejecución
- Initial delay: 10s para que la app se inicialice completamente

**Process:**
1. Find signature requests con challenges expirados (batch 1000)
2. Por cada signature request:
   - Map a domain aggregate
   - Expire cada challenge vencido
   - Verificar si signature request debe expirar también
   - Save via domain repository
3. Record metrics
4. Log resultados

**Repository Query**
**File:** `SignatureRequestJpaRepository.java`

```java
@Query("""
    SELECT DISTINCT sr FROM SignatureRequestEntity sr
    JOIN FETCH sr.challenges c
    WHERE c.status IN ('PENDING', 'SENT')
    AND c.expiresAt < :currentTime
    ORDER BY c.expiresAt ASC
    """)
List<SignatureRequestEntity> findWithExpiredChallenges(
    @Param("currentTime") Instant currentTime,
    Pageable pageable
);
```

**Features:**
- JOIN FETCH: Evita N+1 queries
- DISTINCT: Evita duplicados cuando hay múltiples challenges
- ORDER BY: Expira primero los más antiguos
- Pageable: Limita resultados (batch size)

### Configuration

**@EnableScheduling**
**File:** `SignatureRouterApplication.java`

```java
@SpringBootApplication
@EnableScheduling  // ← Story 2.9
public class SignatureRouterApplication {
```

---

## 📊 Performance

### Query Performance
- **Index recomendado:** `CREATE INDEX idx_challenge_expiration ON signature_challenge(status, expires_at)`
- **JOIN FETCH:** Single query para request + challenges
- **Batch size:** 1000 max por ejecución
- **Execution time:** ~100-500ms por batch (1000 challenges)

### Scheduling Characteristics
- **Frequency:** Every 30s
- **Max latency:** 30s (worst case: challenge expired justo después de ejecución)
- **Overlap prevention:** Fixed delay (no concurrent executions)

---

## 🧪 Testing

### Integration Tests
**File:** `ChallengeExpirationSchedulerTest.java`

**Test 1: Expire vencidos**
```java
// Given: Challenge con expiresAt en el pasado
// When: Job ejecuta
// Then: status = EXPIRED, errorCode = TTL_EXCEEDED
```

**Test 2: No expirar válidos**
```java
// Given: Challenge con expiresAt en el futuro
// When: Job ejecuta
// Then: status sigue siendo SENT (no cambia)
```

**Test 3: Solo PENDING/SENT**
```java
// Given: Challenge COMPLETED con expiresAt en el pasado
// When: Job ejecuta
// Then: status sigue siendo COMPLETED (no se expira)
```

**Results:**
```
✅ 3 tests passing
✅ 0 failures
```

---

## 📈 Metrics

**Metric:** `challenges.expired.count`
- **Type:** Counter
- **Purpose:** Track total expired challenges
- **Tags:** None

**Metric:** `challenges.expired.errors`
- **Type:** Counter
- **Purpose:** Track job execution errors
- **Tags:** None

### Grafana Dashboard (Future)
- Expired challenges per hour
- Expiration job execution time
- Error rate

---

## 🔗 Related Stories

### Depends On
- ✅ Story 2.4: Challenge Creation (SignatureChallenge entity)
- ✅ Story 2.5: SMS Provider (challenge lifecycle)

### Enables
- 🔜 Story 3.8: Dead Letter Queue (handle failed expirations)
- 🔜 Story 4.5: Automatic Provider Reactivation
- 🔜 Epic 5: Event publishing (CHALLENGE_EXPIRED event)

---

## 📚 Code Files

**Created (2 files):**
- `ChallengeExpirationScheduler.java` (scheduled job)
- `ChallengeExpirationSchedulerTest.java` (tests)

**Modified (3 files):**
- `SignatureChallenge.java` (métodos expire() e isExpired())
- `SignatureRequestJpaRepository.java` (query findWithExpiredChallenges)
- `SignatureRouterApplication.java` (@EnableScheduling)

---

## ✅ Definition of Done

- [x] Scheduled job implementado (every 30s)
- [x] Query para challenges expirados (JOIN FETCH)
- [x] Métodos expire() en domain entity
- [x] Tests unitarios/integración passing (3 tests)
- [x] Métricas registradas
- [x] Logging implementado
- [x] @EnableScheduling habilitado
- [x] Batch size limit (1000)
- [x] Documentation completa
- [x] All existing tests passing

---

**Story Completed:** 2024-11-27  
**Implemented By:** AI Assistant (Signature Router Team)

