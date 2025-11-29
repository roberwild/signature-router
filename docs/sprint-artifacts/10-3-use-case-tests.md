# Story 10.3: Use Case Tests - Testing Coverage >85%

**Epic**: 10 - Quality Improvements & Technical Debt  
**Story ID**: 10.3  
**Story Key**: 10-3-use-case-tests  
**Status**: drafted  
**Created**: 2025-11-29  
**Story Points**: 5 SP  
**Priority**: 🔴 CRÍTICO

---

## Story

**As a** Developer  
**I want** Tests de use cases con mocks de ports  
**So that** Orquestación de casos de uso esté validada

---

## Context

Esta story implementa tests unitarios completos para los use cases de la capa de aplicación, usando mocks de los ports (repositories, services) para validar la orquestación de casos de uso sin depender de infraestructura real (DB, Kafka, etc.).

**Source**: Evaluación de Calidad identificó que el coverage de use cases es <30%, lo cual es crítico porque los use cases orquestan toda la lógica de negocio.

**Business Value**: 
- Valida orquestación de casos de uso críticos
- Protege flujos de negocio contra regresión
- Facilita refactoring seguro de use cases
- Cumple con estándares bancarios de testing (>85% coverage en application layer)

**Prerequisites**: 
- ✅ Epic 2 completado (use cases existentes)
- ✅ Story 10.2 completada (domain layer tests)

---

## Acceptance Criteria

### AC1: StartSignatureUseCaseImpl Tests

**Given** Use case `StartSignatureUseCaseImpl`  
**When** Ejecuto `StartSignatureUseCaseImplTest.java`  
**Then** Coverage >85% con tests para:
- ✅ Happy path (crear signature → evaluar routing → guardar → crear challenge)
- ✅ Pseudonymization de customer ID
- ✅ Cálculo de hash de transaction context
- ✅ Evaluación de routing rules
- ✅ Creación de challenge para canal seleccionado
- ✅ Persistencia de signature request
- ✅ Degraded mode handling (PENDING_DEGRADED status)
- ✅ Rate limiting (customer-specific)
- ✅ Validación de input (customer ID nulo → exception)

**And** Mocks verifican interacciones:
- `verify(repository).save(any())`
- `verify(routingService).evaluate(any())`
- `verify(challengeService).createChallenge(any(), any(), any())`

---

### AC2: CompleteSignatureUseCaseImpl Tests

**Given** Use case `CompleteSignatureUseCaseImpl`  
**When** Ejecuto `CompleteSignatureUseCaseImplTest.java`  
**Then** Coverage >85% con tests para:
- ✅ Happy path (código correcto → SIGNED)
- ✅ Código incorrecto → error (max 3 intentos)
- ✅ Challenge expirado → exception
- ✅ Challenge no encontrado → NotFoundException
- ✅ Challenge no en estado SENT → InvalidStateTransitionException
- ✅ Max attempts exceeded → challenge marcado como FAILED
- ✅ Publicación de evento (SignatureCompletedEvent)
- ✅ Métricas registradas (success/failure counters)

**And** Mocks verifican interacciones:
- `verify(repository).findById(any())`
- `verify(repository).save(any())`
- `verify(eventPublisher).publish(any())`

---

### AC3: ManageRoutingRulesUseCaseImpl Tests

**Given** Use case `ManageRoutingRulesUseCaseImpl`  
**When** Ejecuto `ManageRoutingRulesUseCaseImplTest.java`  
**Then** Coverage >85% con tests para:

**Create Rule:**
- ✅ Happy path (crear rule → validar SpEL → guardar → audit log)
- ✅ SpEL inválido → InvalidSpelExpressionException
- ✅ Validación de SpEL antes de persistir

**Update Rule:**
- ✅ Happy path (actualizar rule → validar SpEL → guardar → audit log)
- ✅ Rule no encontrado → NotFoundException
- ✅ SpEL inválido → InvalidSpelExpressionException

**Get Rule:**
- ✅ Happy path (obtener rule por ID)
- ✅ Rule no encontrado → NotFoundException

**List Rules:**
- ✅ Happy path (listar todas las rules ordenadas por priority)
- ✅ Lista vacía retorna lista vacía

**Delete Rule:**
- ✅ Happy path (soft delete → guardar → audit log)
- ✅ Rule no encontrado → NotFoundException

**And** Mocks verifican interacciones:
- `verify(repository).save(any())`
- `verify(repository).findById(any())`
- `verify(repository).findAllOrderedByPriority()`
- `verify(spelValidator).validate(any())`
- `verify(auditService).save(any())`

---

### AC4: JaCoCo Coverage Report

**Given** Todos los tests ejecutados  
**When** Reviso reporte JaCoCo  
**Then** Application layer muestra:
- ✅ Line coverage >85%
- ✅ Branch coverage >80%
- ✅ StartSignatureUseCaseImpl: >85% coverage
- ✅ CompleteSignatureUseCaseImpl: >85% coverage
- ✅ ManageRoutingRulesUseCaseImpl: >85% coverage

**And** Reporte generado en `target/site/jacoco/index.html`

---

### AC5: Test Execution Performance

**Given** Suite completa de tests de use cases  
**When** Ejecuto `mvn test -Dtest=*UseCase*Test`  
**Then** Todos los tests ejecutan en <10s total

**And** Tests son determinísticos (sin flakiness)

---

## Technical Notes

### Framework y Librerías

- **JUnit 5**: Framework de testing
- **Mockito**: Mocking framework para ports
- **AssertJ**: Assertions fluidas y legibles
- **JaCoCo**: Coverage reporting

### Patrón de Testing

**Given-When-Then con BDD**:
```java
@Test
@DisplayName("Should create signature request successfully")
void shouldCreateSignatureRequestSuccessfully() {
    // Given
    CreateSignatureRequestDto request = new CreateSignatureRequestDto(...);
    when(routingService.evaluate(any())).thenReturn(routingDecision);
    when(repository.save(any())).thenReturn(signatureRequest);
    
    // When
    SignatureRequest result = useCase.execute(request);
    
    // Then
    assertThat(result).isNotNull();
    assertThat(result.getStatus()).isEqualTo(SignatureStatus.PENDING);
    verify(repository).save(any());
    verify(routingService).evaluate(any());
}
```

### Estructura de Tests

```
src/test/java/com/bank/signature/application/usecase/
├── StartSignatureUseCaseImplTest.java
├── CompleteSignatureUseCaseImplTest.java
├── ManageRoutingRulesUseCaseImplTest.java
├── AbortSignatureUseCaseImplTest.java
└── QuerySignatureUseCaseImplTest.java
```

---

## Definition of Done

- [ ] `StartSignatureUseCaseImplTest.java` creado con 10+ tests (>85% coverage)
- [ ] `CompleteSignatureUseCaseImplTest.java` creado con 10+ tests (>85% coverage)
- [ ] `ManageRoutingRulesUseCaseImplTest.java` creado con 15+ tests (>85% coverage)
- [ ] Total: 35+ tests unitarios para use cases
- [ ] JaCoCo reporta: Application layer >85% line coverage
- [ ] Todos los tests ejecutan en <10s total
- [ ] Mocks verifican interacciones (save, publish, evaluate)
- [ ] Tests son determinísticos (sin flakiness)
- [ ] Tests integrados en pipeline CI (Maven build)

---

## Estimation

**Story Points**: 5 SP  
**Effort**: 2-3 días  
**Dependencies**: Story 10.2 (Domain Layer Tests) debe estar completada

---

## Related Stories

- **Story 10.2**: Domain Layer Tests (prerequisito)
- **Story 10.4**: Testcontainers Integration (tests de adapters, siguiente en testing)

---

## Notes

- Los tests de use cases usan mocks para aislar la lógica de orquestación
- No se requiere DB ni Kafka real (tests unitarios puros)
- Los mocks verifican que los ports se llaman correctamente
- Coverage >85% es crítico para validar orquestación de negocio

