# Story 10.5: Idempotencia Funcional - IdempotencyService

**Epic**: 10 - Quality Improvements & Technical Debt  
**Story ID**: 10.5  
**Story Key**: 10-5-idempotency-functional  
**Status**: drafted  
**Created**: 2025-11-29  
**Story Points**: 5 SP  
**Priority**: 🔴 CRÍTICO

---

## Story

**As a** Client Application  
**I want** Enviar `Idempotency-Key` header para prevenir procesamiento duplicado  
**So that** Doble-click no cause doble SMS/doble costo

---

## Context

Esta story implementa idempotencia funcional para prevenir procesamiento duplicado de requests. Actualmente, si un cliente envía el mismo request dos veces (por ejemplo, doble-click), el sistema procesa ambas requests, resultando en doble SMS y doble costo.

**Source**: Evaluación de Calidad identificó que idempotencia no es funcional actualmente.

**Business Value**:
- Previene doble procesamiento (crítico para sistemas bancarios)
- Reduce costos (no envía SMS duplicados)
- Mejora experiencia de usuario (no errores por doble-click)
- Cumple con estándares bancarios de idempotencia

**Prerequisites**:
- ✅ Epic 1 completado (PostgreSQL, LiquidBase)
- ✅ Epic 2 completado (POST /api/v1/signatures endpoint)

---

## Acceptance Criteria

### AC1: Idempotency Record Table Created

**Given** LiquidBase migrations  
**When** Ejecuto migrations  
**Then** Se crea tabla `idempotency_record` con:
- `id` UUID PRIMARY KEY (default uuid_generate_v7())
- `idempotency_key` VARCHAR(255) UNIQUE NOT NULL
- `request_hash` VARCHAR(64) NOT NULL (SHA-256)
- `response_body` JSONB NOT NULL
- `status_code` INTEGER NOT NULL
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW()
- `expires_at` TIMESTAMP NOT NULL

**And** Índice en `idempotency_key` para búsqueda rápida  
**And** Índice en `expires_at` para cleanup job

### AC2: IdempotencyService Implemented

**Given** Application layer  
**When** Reviso `com.singularbank.signature.routing.application.service`  
**Then** Existe `IdempotencyService` con métodos:
- `Optional<IdempotencyRecord> checkAndStore(String key, String hash)`
- `Optional<IdempotencyRecord> getCachedResponse(String key)`
- `void cleanupExpiredRecords()`

### AC3: Request Hash Calculation

**Given** Request body  
**When** Sistema calcula hash  
**Then** Usa SHA-256 del request body serializado como JSON  
**And** Hash es consistente (mismo body → mismo hash)

### AC4: Controller Integration

**Given** `POST /api/v1/signatures` endpoint  
**When** Request incluye header `Idempotency-Key`  
**Then** Controller:
- Extrae header `Idempotency-Key` (opcional)
- Calcula `request_hash` del body
- Llama a `IdempotencyService.checkAndStore()`
- Si existe y hash coincide: retorna cached response
- Si existe y hash difiere: retorna HTTP 409 Conflict
- Si no existe: procesa request y guarda response

### AC5: Duplicate Request Handling

**Given** Request con `Idempotency-Key: uuid-123` procesado exitosamente  
**When** Cliente reenvía MISMO request con mismo key dentro de 24h  
**Then** Sistema:
- Detecta duplicate en `idempotency_record`
- Valida `request_hash` coincide
- Retorna cached `response_body` (HTTP 200/201 según original)
- NO ejecuta use case nuevamente
- NO envía SMS duplicado

### AC6: Key Conflict Handling

**Given** Request con `Idempotency-Key: uuid-123` ya procesado  
**When** Cliente envía DIFERENTE request con mismo key  
**Then** Sistema:
- Detecta duplicate en `idempotency_record`
- Valida `request_hash` NO coincide
- Retorna HTTP 409 Conflict con mensaje: "Idempotency key reused with different request"
- NO procesa request

### AC7: Expired Key Handling

**Given** Request con `Idempotency-Key: uuid-123` procesado hace >24h  
**When** Cliente reenvía request con mismo key  
**Then** Sistema:
- Detecta que key expiró (`expires_at < NOW()`)
- Procesa como nuevo request
- Guarda nuevo registro con mismo key
- Limpia registro antiguo (opcional, puede hacerlo cleanup job)

### AC8: Auto-Generate Key If Missing

**Given** Request SIN header `Idempotency-Key`  
**When** Sistema procesa request  
**Then** Sistema:
- Auto-genera UUID como idempotency key
- Procesa request normalmente
- Guarda registro con key generado
- Retorna response normalmente (cliente no ve diferencia)

### AC9: Cleanup Job Implemented

**Given** Scheduled job  
**When** Job ejecuta (cada hora)  
**Then** Elimina registros donde `expires_at < NOW()`  
**And** Job es idempotente (puede ejecutar múltiples veces sin error)

### AC10: Tests Implemented

**Given** Test suite  
**When** Ejecuto tests de idempotencia  
**Then** Tests cubren:
- Duplicate request → cached response
- Key conflict → HTTP 409
- Expired key → new request
- Auto-generate key
- Cleanup job

---

## Technical Notes

### Database Schema

```sql
-- LiquidBase changeset
CREATE TABLE idempotency_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_body JSONB NOT NULL,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_idempotency_key ON idempotency_record(idempotency_key);
CREATE INDEX idx_idempotency_expires ON idempotency_record(expires_at);
```

### IdempotencyService Implementation

```java
package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.domain.model.IdempotencyRecord;
import com.singularbank.signature.routing.domain.port.outbound.IdempotencyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class IdempotencyService {
    
    private final IdempotencyRepository repository;
    private final HashService hashService;
    
    public IdempotencyService(IdempotencyRepository repository, HashService hashService) {
        this.repository = repository;
        this.hashService = hashService;
    }
    
    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> checkAndStore(String idempotencyKey, String requestHash) {
        Optional<IdempotencyRecord> existing = repository.findByKey(idempotencyKey);
        
        if (existing.isPresent() && !existing.get().isExpired()) {
            if (!existing.get().getRequestHash().equals(requestHash)) {
                throw new IdempotencyKeyConflictException(
                    "Idempotency key reused with different request"
                );
            }
            return existing; // Return cached response
        }
        
        return Optional.empty(); // Process new request
    }
    
    @Transactional
    public void storeResponse(String idempotencyKey, String requestHash, 
                             Object responseBody, int statusCode) {
        IdempotencyRecord record = IdempotencyRecord.builder()
            .idempotencyKey(idempotencyKey)
            .requestHash(requestHash)
            .responseBody(responseBody) // Serialized to JSONB
            .statusCode(statusCode)
            .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
            .build();
        
        repository.save(record);
    }
    
    @Transactional
    public void cleanupExpiredRecords() {
        repository.deleteExpired(Instant.now());
    }
}
```

### Controller Integration

```java
@PostMapping("/api/v1/signatures")
public ResponseEntity<SignatureResponseDto> createSignature(
    @RequestBody SignatureRequestDto request,
    @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
) {
    // Auto-generate key if missing
    if (idempotencyKey == null) {
        idempotencyKey = UUID.randomUUID().toString();
    }
    
    // Calculate request hash
    String requestHash = hashService.sha256(request);
    
    // Check for duplicate
    Optional<IdempotencyRecord> cached = idempotencyService.checkAndStore(
        idempotencyKey, 
        requestHash
    );
    
    if (cached.isPresent()) {
        // Return cached response
        return ResponseEntity
            .status(cached.get().getStatusCode())
            .body(deserialize(cached.get().getResponseBody()));
    }
    
    // Process new request
    SignatureRequest result = startSignatureUseCase.execute(request);
    SignatureResponseDto dto = mapper.toDto(result);
    
    // Store response
    idempotencyService.storeResponse(
        idempotencyKey,
        requestHash,
        dto,
        HttpStatus.CREATED.value()
    );
    
    return ResponseEntity.created(...).body(dto);
}
```

### Cleanup Job

```java
@Component
public class IdempotencyCleanupJob {
    
    private final IdempotencyService idempotencyService;
    
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void cleanupExpiredRecords() {
        idempotencyService.cleanupExpiredRecords();
    }
}
```

---

## Tasks

### Task 1: Create Database Schema
**Estimated**: 1h

1. [ ] Crear LiquidBase changeset para tabla `idempotency_record`
2. [ ] Agregar índices (idempotency_key, expires_at)
3. [ ] Ejecutar migration y verificar tabla creada
4. [ ] Crear rollback script

**Files to Create**:
- `src/main/resources/db/changelog/changesets/XXXX-idempotency-record-table.yaml`

### Task 2: Create Domain Model
**Estimated**: 1h

1. [ ] Crear `IdempotencyRecord` entity en `domain/model/`
2. [ ] Crear `IdempotencyRepository` port en `domain/port/outbound/`
3. [ ] Crear `IdempotencyKeyConflictException` en `domain/exception/`

**Files to Create**:
- `src/main/java/com/bank/signature/domain/model/IdempotencyRecord.java`
- `src/main/java/com/bank/signature/domain/port/outbound/IdempotencyRepository.java`
- `src/main/java/com/bank/signature/domain/exception/IdempotencyKeyConflictException.java`

### Task 3: Implement IdempotencyService
**Estimated**: 2h

1. [ ] Crear `IdempotencyService` en `application/service/`
2. [ ] Implementar `checkAndStore()` method
3. [ ] Implementar `storeResponse()` method
4. [ ] Implementar `cleanupExpiredRecords()` method
5. [ ] Agregar JavaDoc completo

**Files to Create**:
- `src/main/java/com/bank/signature/application/service/IdempotencyService.java`

### Task 4: Create HashService
**Estimated**: 30 min

1. [ ] Crear `HashService` utility para SHA-256
2. [ ] Implementar método `sha256(Object)` que serializa a JSON y hashea
3. [ ] Agregar tests unitarios

**Files to Create**:
- `src/main/java/com/bank/signature/application/service/HashService.java`

### Task 5: Integrate in Controller
**Estimated**: 1h

1. [ ] Modificar `POST /api/v1/signatures` controller
2. [ ] Extraer `Idempotency-Key` header
3. [ ] Calcular request hash
4. [ ] Integrar `IdempotencyService`
5. [ ] Manejar HTTP 409 Conflict

**Files to Modify**:
- `src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/SignatureController.java`

### Task 6: Create Repository Adapter
**Estimated**: 1h

1. [ ] Crear `IdempotencyRepositoryAdapter` implementando port
2. [ ] Crear JPA entity `IdempotencyRecordEntity`
3. [ ] Crear Spring Data JPA repository
4. [ ] Implementar métodos: `findByKey()`, `save()`, `deleteExpired()`

**Files to Create**:
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/persistence/IdempotencyRepositoryAdapter.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/persistence/entity/IdempotencyRecordEntity.java`
- `src/main/java/com/bank/signature/infrastructure/adapter/outbound/persistence/repository/IdempotencyRecordJpaRepository.java`

### Task 7: Create Cleanup Job
**Estimated**: 30 min

1. [ ] Crear `IdempotencyCleanupJob` con `@Scheduled`
2. [ ] Configurar cron expression (cada hora)
3. [ ] Agregar `@EnableScheduling` en main class si no existe

**Files to Create**:
- `src/main/java/com/bank/signature/infrastructure/job/IdempotencyCleanupJob.java`

### Task 8: Write Tests
**Estimated**: 2h

1. [ ] Crear `IdempotencyServiceTest` (unit tests con mocks)
2. [ ] Crear `IdempotencyControllerTest` (integration tests)
3. [ ] Test: duplicate request → cached response
4. [ ] Test: key conflict → HTTP 409
5. [ ] Test: expired key → new request
6. [ ] Test: auto-generate key
7. [ ] Test: cleanup job

**Files to Create**:
- `src/test/java/com/bank/signature/application/service/IdempotencyServiceTest.java`
- `src/test/java/com/bank/signature/infrastructure/adapter/inbound/rest/IdempotencyControllerTest.java`

---

## Definition of Done

- [ ] Tabla `idempotency_record` creada (Liquibase)
- [ ] `IdempotencyService` implementado
- [ ] Controller integrado (POST /signatures)
- [ ] Tests: duplicate key → cached response
- [ ] Tests: key conflict → HTTP 409
- [ ] Cleanup job implementado y configurado
- [ ] Code review aprobado
- [ ] Documentación actualizada

---

## Testing Strategy

### Unit Tests
- `IdempotencyServiceTest`: Mock repository, test lógica de negocio
- `HashServiceTest`: Test SHA-256 calculation

### Integration Tests
- `IdempotencyControllerTest`: Test completo con Testcontainers PostgreSQL
- Test scenarios: duplicate, conflict, expired, auto-generate

### Manual Testing
- Enviar request con `Idempotency-Key` header
- Reenviar mismo request → verificar cached response
- Enviar diferente request con mismo key → verificar HTTP 409

---

## Risks and Mitigations

**Risk**: Performance impact de lookup en BD  
**Mitigation**: Índice en `idempotency_key`, considerar cache en memoria (Caffeine) si necesario

**Risk**: JSONB serialization puede fallar con objetos complejos  
**Mitigation**: Usar Jackson ObjectMapper, manejar excepciones gracefully

**Risk**: Cleanup job puede ser lento con muchos registros  
**Mitigation**: Batch delete, ejecutar en horarios de bajo tráfico

---

## References

- Epic 10 Tech Spec: `docs/sprint-artifacts/tech-spec-epic-10.md`
- Quality Evaluation: `Evaluación_de_Calidad_del_Proyecto_Signature_Router.md`
- [Idempotency Best Practices](https://stripe.com/docs/api/idempotent_requests)

---

**Next Story**: Story 10.6 (SpEL Security) puede comenzar en paralelo

