# Story 2.12: Signature Abort (Admin Action)

**Status:** ✅ Done  
**Epic:** Epic 2 - Signature Routing Engine  
**Sprint:** Sprint 2  
**Story Points:** 5

---

## 📋 Story Description

**As an** Admin  
**I want** Abortar signature requests manualmente  
**So that** Puedo cancelar transacciones sospechosas

---

## ✅ Acceptance Criteria

- [x] **AC1:** POST /api/v1/admin/signatures/{id}/abort con `{reason, details}`
- [x] **AC2:** Solo signatures PENDING pueden abortarse
- [x] **AC3:** Challenge activo se marca como FAILED
- [x] **AC4:** Publica evento SIGNATURE_ABORTED a Kafka
- [x] **AC5:** HTTP 200 con status ABORTED
- [x] **AC6:** Requiere role ADMIN (403 sin role)
- [x] **AC7:** Audit trail con reason y timestamp

---

## 🏗️ Implementation

### AbortReason Enum
**Values:**
- `USER_CANCELLED`: Usuario canceló voluntariamente
- `FRAUD_DETECTED`: Sistema de fraude detectó actividad sospechosa
- `SYSTEM_ERROR`: Error de sistema impide completación
- `ADMIN_INTERVENTION`: Intervención manual del administrador
- `FALLBACK_EXHAUSTED`: Todos los canales fallback agotados

### Domain Updates
**SignatureRequest:**
- `abort(AbortReason, String)`: Aborta el request
- Valida: solo PENDING puede abortarse
- Marca challenges activos como FAILED
- Agrega audit event a routingTimeline
- Nuevos campos: `abortedAt`, `abortReason`

### DTOs
- `AbortSignatureDto` (request): reason + details
- `AbortSignatureResponseDto` (response): id, status, abortReason, abortedAt, message

### Use Case: AbortSignatureUseCaseImpl
**Responsabilidades:**
1. Cargar aggregate
2. Abortar (aggregate valida business rules)
3. Guardar cambios
4. Publicar evento Kafka
5. Registrar métricas

### Event Publishing
**Domain Event:** `SignatureAbortedEvent`
- signatureRequestId, reason, details, abortedAt

**Kafka Topic:** `signature.aborted`

### Endpoint
```http
POST /api/v1/admin/signatures/{id}/abort
Authorization: Bearer {token}  # ROLE_ADMIN required
Content-Type: application/json

{
  "reason": "FRAUD_DETECTED",
  "details": "Fraud score: 0.95"
}
```

**Responses:**
- 200 OK: Signature aborted
- 400 Bad Request: Invalid state (not PENDING)
- 403 Forbidden: No ADMIN role
- 404 Not Found: Signature not found

### Security
- `@PreAuthorize("hasRole('ADMIN')")`: Spring Security
- Solo usuarios con role ADMIN pueden abortar

---

## 🗄️ Database Schema

**Tabla: signature_request**
- `aborted_at` TIMESTAMP: Timestamp del abort
- `abort_reason` VARCHAR(50): Enum as String
- Index: `idx_signature_request_aborted_at`

**Migration:** 0010-add-abort-fields-to-signature-request.yaml

---

## 🧪 Testing

**3 Tests (Integration):**
1. ✅ Abort PENDING signature → ABORTED
2. ✅ Reject abort without ADMIN role → 403
3. ✅ Reject abort of SIGNED signature → 400

**Results:** All passing ✅

---

## 📊 Metrics

- `signatures.aborted` (Counter): Aborts by reason tag

---

## 📚 Files

**Created (10):**
- AbortReason.java (enum)
- AbortSignatureDto.java
- AbortSignatureResponseDto.java
- SignatureAbortedEvent.java
- AbortSignatureUseCase.java (interface)
- AbortSignatureUseCaseImpl.java
- AdminSignatureController.java
- AbortSignatureIntegrationTest.java
- 0010-add-abort-fields-to-signature-request.yaml (×3)

**Modified (6):**
- SignatureRequest.java (abort method + fields)
- SignatureRequestEntity.java (+aborted_at, +abort_reason)
- SignatureRequestEntityMapper.java (map new fields)
- EventPublisher.java (+publishSignatureAborted)
- KafkaEventPublisher.java (+publishSignatureAborted impl)
- application.yml (+signature-aborted topic)

---

**Story Completed:** 2025-11-27  
**Implemented By:** AI Assistant

---

## 🎯 Epic 2 Status

**Epic 2: Signature Routing Engine - COMPLETADO** ✅

Sistema ahora puede:
- ✅ Recibir signature requests (Story 2.1)
- ✅ Evaluar routing rules con SpEL (Story 2.2, 2.3)
- ✅ Crear y enviar challenges (Stories 2.4-2.7)
- ✅ Consultar estado y timeline (Story 2.8)
- ✅ Expirar automáticamente (Story 2.9)
- ✅ Validar idempotency (Story 2.10)
- ✅ Completar signatures (Story 2.11)
- ✅ Abortar signatures (Story 2.12)

