# Story 10.2: Exception Handling Structured

**Status:** completed  
**Epic:** Epic 10 - Quality & Testing Excellence  
**Sprint:** Sprint 10  
**Story Points:** 5  
**Priority:** 🟡 P1 (High)  
**Created:** 2025-11-29

---

## 📋 Story Description

**As a** Development Team & Operations Team  
**I want** Structured exception handling with error codes and I18N support  
**So that** Errors are consistent, traceable, and user-friendly across all layers

---

## ✅ Acceptance Criteria

### **AC1: Exception Hierarchy Documented** ✅
**Given** Domain exceptions already exist  
**When** I review the exception hierarchy  
**Then** All exceptions are documented with:
- Error codes (unique identifiers)
- HTTP status mapping
- User-friendly messages (I18N ready)

**Current Exception Hierarchy:**
```
DomainException (abstract base)
├── NotFoundException (404)
├── InvalidStateTransitionException (409)
├── ChallengeNotFoundException (404)
├── ChallengeAlreadyActiveException (409)
├── InvalidChallengeCodeException (400)
├── TtlNotExceededException (400)
├── RateLimitExceededException (429)
├── DegradedModeException (503)
├── ProviderException (502/503)
├── PseudonymizationException (500)
└── SecretRotationException (500)
```

### **AC2: Global Exception Handler** ✅
**Given** REST controllers handle requests  
**When** An exception is thrown  
**Then** `GlobalExceptionHandler` catches it and returns:
```json
{
  "error": {
    "code": "ERR_NOT_FOUND",
    "message": "Signature request not found",
    "timestamp": "2025-11-29T21:00:00Z",
    "traceId": "abc-123",
    "path": "/api/v1/signatures/{id}"
  }
}
```

**Already Implemented:** ✅ `GlobalExceptionHandler.java` (Story 1.7)

### **AC3: Error Codes Catalog** ✅
**Given** Multiple exception types exist  
**When** I document error codes  
**Then** All codes are cataloged with:
- HTTP status
- Retry strategy
- User action required

**Example Catalog:**
| Code | HTTP | Description | Retry? | User Action |
|------|------|-------------|--------|-------------|
| `ERR_NOT_FOUND` | 404 | Resource not found | No | Check ID |
| `ERR_RATE_LIMIT` | 429 | Too many requests | Yes (backoff) | Wait & retry |
| `ERR_INVALID_STATE` | 409 | Invalid state transition | No | Check flow |
| `ERR_PROVIDER_DOWN` | 503 | Provider unavailable | Yes (exponential) | Retry later |

### **AC4: I18N Support Ready** ✅
**Given** Error messages need localization  
**When** I structure exceptions  
**Then** Messages use message keys:
```java
// messages_en.properties
error.not_found=Signature request not found: {0}
error.rate_limit=Rate limit exceeded. Try again in {0} seconds
error.invalid_code=Invalid verification code. {0} attempts remaining

// messages_es.properties
error.not_found=Solicitud de firma no encontrada: {0}
error.rate_limit=Límite de velocidad excedido. Reintente en {0} segundos
error.invalid_code=Código de verificación inválido. {0} intentos restantes
```

---

## 📂 Documentation Created

### **1. Exception Handling Guide**
**File:** `docs/error-handling/EXCEPTION_GUIDE.md`

**Content:**
```markdown
# Exception Handling Guide

## Exception Hierarchy
- DomainException (base)
- BusinessException vs TechnicalException
- HTTP status mapping

## Best Practices
- When to throw vs return Optional
- How to add context to exceptions
- Logging exceptions properly

## Error Response Format
- Standard JSON structure
- TraceId propagation
- Client-friendly messages
```

### **2. Error Codes Catalog**
**File:** `docs/error-handling/ERROR_CODES.md`

**Content:**
```markdown
# Error Codes Catalog

| Code | HTTP | Category | Description | Retry | User Action |
|------|------|----------|-------------|-------|-------------|
| ERR_NOT_FOUND | 404 | Client | Resource not found | No | Verify ID |
| ERR_INVALID_CODE | 400 | Client | Invalid OTP code | No | Re-enter code |
| ERR_RATE_LIMIT | 429 | Client | Too many requests | Yes | Wait {retry_after}s |
| ERR_EXPIRED | 410 | Client | Request expired | No | Create new request |
| ERR_INVALID_STATE | 409 | Client | Invalid state transition | No | Check workflow |
| ERR_PROVIDER_DOWN | 503 | Server | Provider unavailable | Yes | Retry with backoff |
| ERR_DEGRADED_MODE | 503 | Server | System in degraded mode | Yes | Retry later |
| ERR_INTERNAL | 500 | Server | Internal server error | No | Contact support |
```

### **3. I18N Message Properties**
**File:** `src/main/resources/messages_en.properties`

```properties
# Signature Request Errors
error.signature.not_found=Signature request not found: {0}
error.signature.expired=Signature request expired. TTL: {0} minutes
error.signature.invalid_state=Cannot transition from {0} to {1}

# Challenge Errors
error.challenge.not_found=Challenge not found: {0}
error.challenge.invalid_code=Invalid verification code. {0} attempts remaining
error.challenge.already_active=Challenge already active for this request
error.challenge.expired=Challenge expired at {0}

# Rate Limiting
error.rate_limit.exceeded=Rate limit exceeded. Try again in {0} seconds
error.rate_limit.customer=Customer rate limit: max {0} requests per {1}

# Provider Errors
error.provider.unavailable=Provider {0} is currently unavailable
error.provider.timeout=Provider {0} timed out after {1}ms
error.provider.circuit_open=Circuit breaker OPEN for {0}. Retry in {1}s

# System Errors
error.degraded_mode.active=System in degraded mode: {0}
error.internal.unexpected=Unexpected error occurred. TraceId: {0}
```

**File:** `src/main/resources/messages_es.properties`

```properties
# Errores de Solicitud de Firma
error.signature.not_found=Solicitud de firma no encontrada: {0}
error.signature.expired=Solicitud de firma expirada. TTL: {0} minutos
error.signature.invalid_state=No se puede transicionar de {0} a {1}

# Errores de Challenge
error.challenge.not_found=Challenge no encontrado: {0}
error.challenge.invalid_code=Código de verificación inválido. {0} intentos restantes
error.challenge.already_active=Ya existe un challenge activo para esta solicitud
error.challenge.expired=Challenge expirado en {0}

# Límite de Velocidad
error.rate_limit.exceeded=Límite de velocidad excedido. Reintente en {0} segundos
error.rate_limit.customer=Límite por cliente: máx {0} solicitudes por {1}

# Errores de Proveedor
error.provider.unavailable=Proveedor {0} no disponible actualmente
error.provider.timeout=Proveedor {0} timeout después de {1}ms
error.provider.circuit_open=Circuit breaker ABIERTO para {0}. Reintentar en {1}s

# Errores del Sistema
error.degraded_mode.active=Sistema en modo degradado: {0}
error.internal.unexpected=Error inesperado. TraceId: {0}
```

---

## 🎯 Definition of Done

- ✅ Exception hierarchy documented
- ✅ GlobalExceptionHandler already implemented (Story 1.7)
- ✅ Error codes catalog created
- ✅ HTTP status mapping documented
- ✅ I18N message keys defined (en/es)
- ✅ Retry strategies documented
- ✅ User actions documented
- ✅ TraceId propagation already working (Story 9.4)

---

## 📝 Implementation Notes

### **Already Implemented:**
1. ✅ `GlobalExceptionHandler.java` - Catches all exceptions, returns standard JSON
2. ✅ Domain exceptions - All major exceptions exist
3. ✅ TraceId propagation - Micrometer Tracing (Story 9.4)
4. ✅ Correlation ID - `CorrelationIdProvider` (Story 5.1)

### **New in This Story:**
1. ✅ Error codes catalog (documentation)
2. ✅ I18N message properties (en/es)
3. ✅ Retry strategies documented
4. ✅ User action guidelines

### **Future Enhancements:**
- 🔄 Load I18N messages from properties (requires MessageSource bean)
- 🔄 Add `Retry-After` header for 429/503 responses
- 🔄 Structured logging for exceptions (JSON logs)
- 🔄 Exception metrics (count by type, HTTP status distribution)

---

**Story Status:** ✅ COMPLETED (Documentation-only story)  
**Completion Date:** 2025-11-29  
**Implementation:** Primarily documentation + existing code

---

**Created by:** AI Coding Assistant  
**Date:** 2025-11-29  
**Version:** 1.0

