# Story 2.11: Signature Completion (User Response)

**Status:** ✅ Done  
**Epic:** Epic 2 - Signature Routing Engine  
**Sprint:** Sprint 2  
**Story Points:** 8

---

## 📋 Story Description

**As a** User  
**I want** Completar firma ingresando código recibido  
**So that** La transacción bancaria se autoriza

---

## ✅ Acceptance Criteria

- [x] **AC1:** PATCH /api/v1/signatures/{id}/complete con `{challengeId, code}`
- [x] **AC2:** Valida: Challenge status = SENT, código correcto, no expirado
- [x] **AC3:** Si válido → challenge.status = COMPLETED, signatureRequest.status = SIGNED
- [x] **AC4:** Publica evento SIGNATURE_COMPLETED a Kafka
- [x] **AC5:** HTTP 400 si código incorrecto (max 3 intentos)
- [x] **AC6:** Después de 3 intentos → challenge.status = FAILED

---

## 🏗️ Implementation

### DTOs
- `CompleteSignatureDto` (request): challengeId + code
- `SignatureCompletionResponseDto` (response): id, status, completedAt, message

### Domain Updates
**SignatureChallenge:**
- `validateCode(String)`: Valida si código coincide
- State transition: SENT → COMPLETED

**SignatureRequest:**
- `findChallengeById(UUID)`: Busca challenge en aggregate
- `completeSignature(challenge)`: Marca request como SIGNED

### Use Case: CompleteSignatureUseCaseImpl
**Responsabilidades:**
1. Cargar aggregate
2. Validar challenge status (SENT) y expiración
3. Rate limiting: Max 3 intentos (ConcurrentHashMap in-memory)
4. Validar código OTP
5. Completar challenge → Completar signature
6. Publicar evento Kafka
7. Registrar métricas

**Rate Limiting:**
- `ConcurrentHashMap<UUID, AtomicInteger>` para contador de intentos
- Producción: migrar a Redis

### Event Publishing
**Domain Event:** `SignatureCompletedEvent`
- signatureRequestId, challengeId, channelType, completedAt

**Kafka Topic:** `signature.completed`
- Adapter: `KafkaEventPublisher`

### Endpoint
```http
PATCH /api/v1/signatures/{id}/complete
Content-Type: application/json

{
  "challengeId": "uuid",
  "code": "123456"
}
```

**Responses:**
- 200 OK: Signature completed
- 400 Bad Request: Invalid code (incluye remaining attempts)
- 404 Not Found: Signature/challenge not found

---

## 🧪 Testing

**3 Tests (Integration):**
1. ✅ Complete with valid code → SIGNED
2. ✅ Reject invalid code → 400
3. ✅ Fail after 3 attempts → FAILED

**Results:** All passing ✅

---

## 📊 Metrics

- `signatures.completed` (Counter): Successful completions
- `signatures.completion.duration` (Timer): Time from creation to completion
- `signatures.completion.failed` (Counter): Failed attempts (max_attempts)

---

## 📚 Files

**Created (10):**
- CompleteSignatureDto.java
- SignatureCompletionResponseDto.java
- InvalidChallengeCodeException.java
- ChallengeNotFoundException.java
- SignatureCompletedEvent.java
- EventPublisher.java (port)
- KafkaEventPublisher.java (adapter)
- CompleteSignatureUseCase.java (interface)
- CompleteSignatureUseCaseImpl.java
- CompleteSignatureIntegrationTest.java

**Modified (4):**
- SignatureChallenge.java (+validateCode method)
- SignatureRequest.java (+findChallengeById method)
- SignatureController.java (+PATCH endpoint)
- application.yml (+kafka topics config)

---

**Story Completed:** 2025-11-27  
**Implemented By:** AI Assistant

