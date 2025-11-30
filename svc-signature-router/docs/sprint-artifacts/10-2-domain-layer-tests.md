# Story 10.2: Domain Layer Tests - Testing Coverage >90%

**Epic**: 10 - Quality Improvements & Technical Debt  
**Story ID**: 10.2  
**Story Key**: 10-2-domain-layer-tests  
**Status**: drafted  
**Created**: 2025-11-29  
**Story Points**: 5 SP  
**Priority**: 🔴 CRÍTICO

---

## Story

**As a** Developer  
**I want** >90% coverage en capa de dominio  
**So that** Reglas de negocio críticas estén protegidas contra regresión

---

## Context

Esta story implementa tests unitarios completos para la capa de dominio (aggregates y value objects), asegurando que todas las reglas de negocio críticas estén cubiertas por tests. El dominio es puro (sin dependencias de frameworks), por lo que los tests son rápidos y no requieren mocks.

**Source**: Evaluación de Calidad identificó que el coverage de dominio es <50%, lo cual es crítico porque el dominio contiene las reglas de negocio más importantes del sistema.

**Business Value**: 
- Protege reglas de negocio críticas contra regresión
- Facilita refactoring seguro del dominio
- Documenta comportamiento esperado del dominio
- Cumple con estándares bancarios de testing (>90% coverage en dominio)

**Prerequisites**: 
- ✅ Epic 1 completado (domain models existentes)
- ✅ Story 10.1 completada (ArchUnit tests validan arquitectura)

---

## Acceptance Criteria

### AC1: SignatureRequest Aggregate Tests

**Given** Aggregate `SignatureRequest`  
**When** Ejecuto `SignatureRequestTest.java`  
**Then** Coverage >95% con tests para:
- ✅ Crear signature request con builder
- ✅ Crear challenge (validar solo 1 activo a la vez)
- ✅ No permitir múltiples challenges activos (`ChallengeAlreadyActiveException`)
- ✅ Transiciones de estado válidas (PENDING → SIGNED → COMPLETED)
- ✅ Transiciones de estado inválidas (`InvalidStateTransitionException`)
- ✅ Expiración por TTL (`isExpired()`)
- ✅ Abortar signature request (`abort()`)
- ✅ Validar challenge pertenece a request (`ChallengeNotBelongsException`)
- ✅ Agregar eventos al routing timeline
- ✅ Validar TTL no excedido antes de completar (`TtlNotExceededException`)

**And** Tests ejecutan en <1s (sin I/O, dominio puro)

---

### AC2: SignatureChallenge Entity Tests

**Given** Entity `SignatureChallenge`  
**When** Ejecuto `SignatureChallengeTest.java`  
**Then** Coverage >90% con tests para:
- ✅ Crear challenge con código generado
- ✅ Validar código correcto (`validateCode()`)
- ✅ Validar código incorrecto (retorna false)
- ✅ Expirar challenge por timeout (`isExpired()`)
- ✅ Marcar como SENT (`markAsSent()`)
- ✅ Marcar como COMPLETED (`markAsCompleted()`)
- ✅ Marcar como FAILED (`markAsFailed()`)
- ✅ Validar transiciones de estado válidas
- ✅ Validar transiciones de estado inválidas

**And** Tests ejecutan en <1s

---

### AC3: RoutingRule Aggregate Tests

**Given** Aggregate `RoutingRule`  
**When** Ejecuto `RoutingRuleTest.java`  
**Then** Coverage >90% con tests para:
- ✅ Crear routing rule con builder
- ✅ Validar condición SpEL no nula
- ✅ Validar target channel no nulo
- ✅ Validar priority no nulo
- ✅ Habilitar/deshabilitar rule (`enable()`, `disable()`)
- ✅ Actualizar condición SpEL
- ✅ Actualizar target channel
- ✅ Actualizar priority

**And** Tests ejecutan en <1s

---

### AC4: Value Objects Tests (100% Coverage)

**Given** Value Objects existentes  
**When** Ejecuto tests unitarios  
**Then** Coverage 100% con tests para:

**TransactionContext:**
- ✅ Validación de amount no nulo
- ✅ Validación de merchantId no nulo/vacío
- ✅ Validación de orderId no nulo/vacío
- ✅ Validación de description no nulo/vacío
- ✅ Validación de hash SHA256 (64 chars hex)
- ✅ Inmutabilidad (record)

**Money:**
- ✅ Validación de amount no nulo
- ✅ Validación de amount >= 0
- ✅ Validación de currency no nulo/vacío
- ✅ Método `add()` con misma currency
- ✅ Método `add()` con diferente currency (exception)
- ✅ Método `multiply()` con factor
- ✅ Inmutabilidad (record)

**Otros Value Objects:**
- ✅ `ChannelType`: valores válidos, métodos helper
- ✅ `ProviderType`: valores válidos, métodos helper
- ✅ `SignatureStatus`: transiciones válidas
- ✅ `ChallengeStatus`: transiciones válidas
- ✅ `ProviderResult`: creación success/failure
- ✅ `HealthStatus`: valores válidos

**And** Todos los tests ejecutan en <1s

---

### AC5: JaCoCo Coverage Report

**Given** Todos los tests ejecutados  
**When** Reviso reporte JaCoCo  
**Then** Domain layer muestra:
- ✅ Line coverage >90%
- ✅ Branch coverage >85%
- ✅ SignatureRequest: >95% coverage
- ✅ SignatureChallenge: >90% coverage
- ✅ RoutingRule: >90% coverage
- ✅ Value Objects: 100% coverage

**And** Reporte generado en `target/site/jacoco/index.html`

---

### AC6: Test Execution Performance

**Given** Suite completa de tests de dominio  
**When** Ejecuto `mvn test -Dtest=*Domain*Test`  
**Then** Todos los tests ejecutan en <5s total

**And** Tests son determinísticos (sin flakiness)

---

## Technical Notes

### Framework y Librerías

- **JUnit 5**: Framework de testing
- **AssertJ**: Assertions fluidas y legibles
- **Mockito**: NO necesario (dominio puro, sin dependencias)
- **JaCoCo**: Coverage reporting

### Patrón de Testing

**Arrange-Act-Assert (AAA)**:
```java
@Test
@DisplayName("Should not allow multiple active challenges")
void shouldNotAllowMultipleActiveChallenges() {
    // Arrange
    SignatureRequest request = SignatureRequest.builder()
        .id(UUID.randomUUID())
        .customerId("CUSTOMER_123")
        .status(SignatureStatus.PENDING)
        .build();
    
    request.createChallenge(ChannelType.SMS, ProviderType.TWILIO);
    
    // Act & Assert
    assertThatThrownBy(() -> 
        request.createChallenge(ChannelType.PUSH, ProviderType.FCM)
    ).isInstanceOf(ChallengeAlreadyActiveException.class)
     .hasMessageContaining("already active");
}
```

### Estructura de Tests

```
src/test/java/com/bank/signature/domain/
├── model/
│   ├── aggregate/
│   │   ├── SignatureRequestTest.java
│   │   ├── RoutingRuleTest.java
│   │   └── ...
│   ├── entity/
│   │   ├── SignatureChallengeTest.java
│   │   └── ...
│   └── valueobject/
│       ├── TransactionContextTest.java
│       ├── MoneyTest.java
│       └── ... (ya existen algunos)
```

---

## Definition of Done

- [ ] `SignatureRequestTest.java` creado con 15+ tests (>95% coverage)
- [ ] `SignatureChallengeTest.java` creado con 10+ tests (>90% coverage)
- [ ] `RoutingRuleTest.java` creado con 8+ tests (>90% coverage)
- [ ] Value Objects tests completados (100% coverage)
- [ ] Total: 25+ tests unitarios para dominio
- [ ] JaCoCo reporta: Domain layer >90% line coverage
- [ ] Todos los tests ejecutan en <5s total
- [ ] Tests integrados en pipeline CI (Maven build)
- [ ] Tests son determinísticos (sin flakiness)
- [ ] Documentación actualizada (README.md menciona coverage)

---

## Estimation

**Story Points**: 5 SP  
**Effort**: 2-3 días  
**Dependencies**: Story 10.1 (ArchUnit Tests) debe estar completada

---

## Related Stories

- **Story 10.1**: ArchUnit Tests (prerequisito)
- **Story 10.3**: Use Case Tests (siguiente en testing)
- **Story 10.4**: Testcontainers Integration (tests de adapters)

---

## Notes

- Los tests de dominio son rápidos porque no hay I/O ni mocks
- El dominio es puro, por lo que los tests validan lógica de negocio directamente
- Coverage >90% es crítico para reglas de negocio bancarias
- Los tests documentan el comportamiento esperado del dominio

