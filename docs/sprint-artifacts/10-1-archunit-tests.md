# Story 10.1: ArchUnit Tests - Validación Automatizada de Arquitectura Hexagonal

**Epic**: 10 - Quality Improvements & Technical Debt  
**Story ID**: 10.1  
**Story Key**: 10-1-archunit-tests  
**Status**: drafted  
**Created**: 2025-11-29  
**Story Points**: 3 SP  
**Priority**: 🔴 CRÍTICO

---

## Story

**As a** Developer  
**I want** Tests automatizados que validen arquitectura hexagonal  
**So that** No se violen capas arquitectónicas en futuros cambios

---

## Context

Esta story implementa validación automatizada de arquitectura hexagonal usando ArchUnit, una librería que permite escribir tests que validan reglas arquitectónicas como parte del test suite. Esto previene que desarrolladores introduzcan dependencias incorrectas entre capas, manteniendo la pureza del dominio y la separación de concerns.

**Source**: Evaluación de Calidad identificó que falta `HexagonalArchitectureTest.java` mencionado en documentación pero no implementado.

**Business Value**: 
- Previene degradación arquitectónica
- Mantiene domain purity (requisito para DDD)
- Facilita refactoring seguro
- Cumple con estándares bancarios de arquitectura

**Prerequisites**: 
- ✅ Epic 1 completado (estructura hexagonal existente)
- ✅ Código base con domain, application, infrastructure layers

---

## Acceptance Criteria

### AC1: ArchUnit Dependency Added

**Given** El proyecto Maven  
**When** Reviso `pom.xml`  
**Then** Incluye dependencia:
```xml
<dependency>
    <groupId>com.tngtech.archunit</groupId>
    <artifactId>archunit-junit5</artifactId>
    <version>1.2.1</version>
    <scope>test</scope>
</dependency>
```

### AC2: HexagonalArchitectureTest Created

**Given** El paquete de tests  
**When** Reviso `src/test/java/com/bank/signature/architecture/`  
**Then** Existe `HexagonalArchitectureTest.java` con:
- Anotación `@AnalyzeClasses(packages = "com.singularbank.signature.routing")`
- Clase pública con métodos `@ArchTest` estáticos
- Mínimo 8 reglas ArchUnit implementadas

### AC3: Domain Layer Purity Validation

**Given** `HexagonalArchitectureTest.java`  
**When** Ejecuto tests  
**Then** Valida que `domain/` package NO depende de:
- `org.springframework.*`
- `javax.persistence.*` / `jakarta.persistence.*`
- `com.fasterxml.jackson.*`
- `org.apache.kafka.*`
- `..infrastructure..`

**And** Test falla si se agrega dependencia prohibida

### AC4: Application Layer Isolation

**Given** `HexagonalArchitectureTest.java`  
**When** Ejecuto tests  
**Then** Valida que `application/` package NO depende de:
- `..infrastructure.adapter..`
- `..infrastructure.adapter.*`

**And** `application/` puede depender de `domain/` e `infrastructure.config.*`

### AC5: Ports Are Interfaces

**Given** `HexagonalArchitectureTest.java`  
**When** Ejecuto tests  
**Then** Valida que todas las clases en `..domain.port..` son interfaces

### AC6: Adapters Implement Ports

**Given** `HexagonalArchitectureTest.java`  
**When** Ejecuto tests  
**Then** Valida que clases en `..infrastructure.adapter..` implementan interfaces de `..domain.port..`

### AC7: Unidirectional Dependency Flow

**Given** `HexagonalArchitectureTest.java`  
**When** Ejecuto tests  
**Then** Valida flujo unidireccional:
- Infrastructure → Application → Domain (permitido)
- Domain → Infrastructure (prohibido)
- Application → Infrastructure (prohibido, excepto config)

### AC8: Domain Models No JPA Annotations

**Given** `HexagonalArchitectureTest.java`  
**When** Ejecuto tests  
**Then** Valida que clases en `..domain.model..` NO tienen anotaciones:
- `@Entity`
- `@Table`
- `@Column`
- `@ManyToOne` / `@OneToMany`

### AC9: Maven Build Integration

**Given** `pom.xml`  
**When** Ejecuto `mvn test`  
**Then** ArchUnit tests ejecutan automáticamente

**And** Si algún test falla, build falla con error claro

### AC10: Tests Pass on Current Codebase

**Given** Código base actual  
**When** Ejecuto `mvn test -Dtest=HexagonalArchitectureTest`  
**Then** Todos los tests pasan (sin violaciones)

### AC11: Documentation Updated

**Given** README.md  
**When** Reviso sección "Architecture Validation"  
**Then** Incluye:
- Explicación de ArchUnit tests
- Cómo ejecutar tests manualmente
- Qué hacer si test falla
- Ejemplos de violaciones comunes

---

## Technical Notes

### ArchUnit Rules Implementation

```java
package com.singularbank.signature.routing.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;

@AnalyzeClasses(packages = "com.singularbank.signature.routing")
public class HexagonalArchitectureTest {

    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnInfrastructure =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..infrastructure..");

    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnSpring =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.springframework..");

    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnJPA =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("javax.persistence..", "jakarta.persistence..");

    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnJackson =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("com.fasterxml.jackson..");

    @ArchTest
    static final ArchRule applicationLayerShouldNotDependOnInfrastructureAdapters =
        noClasses()
            .that().resideInAPackage("..application..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..infrastructure.adapter..");

    @ArchTest
    static final ArchRule portsShouldBeInterfaces =
        classes()
            .that().resideInAPackage("..domain.port..")
            .should().beInterfaces();

    @ArchTest
    static final ArchRule adaptersShouldImplementPorts =
        classes()
            .that().resideInAPackage("..infrastructure.adapter..")
            .should().implement(
                com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage("..domain.port..")
            );

    @ArchTest
    static final ArchRule domainModelsShouldNotHaveJPAAnnotations =
        noClasses()
            .that().resideInAPackage("..domain.model..")
            .should().beAnnotatedWith("javax.persistence.Entity")
            .orShould().beAnnotatedWith("jakarta.persistence.Entity");
}
```

### Maven Configuration

No se requiere configuración especial en `pom.xml` más allá de la dependencia. ArchUnit se integra automáticamente con JUnit 5.

---

## Tasks

### Task 1: Add ArchUnit Dependency
**Estimated**: 15 min

1. [ ] Agregar dependencia `archunit-junit5:1.2.1` en `pom.xml` (test scope)
2. [ ] Ejecutar `mvn dependency:resolve` para verificar descarga
3. [ ] Verificar que no hay conflictos de versiones

**Files to Modify**:
- `pom.xml`

### Task 2: Create HexagonalArchitectureTest
**Estimated**: 2h

1. [ ] Crear directorio `src/test/java/com/bank/signature/architecture/`
2. [ ] Crear clase `HexagonalArchitectureTest.java`
3. [ ] Implementar 8+ reglas ArchUnit según ACs
4. [ ] Agregar JavaDoc explicando cada regla
5. [ ] Ejecutar tests y verificar que pasan

**Files to Create**:
- `src/test/java/com/bank/signature/architecture/HexagonalArchitectureTest.java`

### Task 3: Verify Tests Pass
**Estimated**: 30 min

1. [ ] Ejecutar `mvn test -Dtest=HexagonalArchitectureTest`
2. [ ] Verificar que todos los tests pasan
3. [ ] Si hay violaciones, documentarlas y decidir si corregir o ajustar reglas
4. [ ] Ejecutar suite completa de tests para verificar integración

### Task 4: Update Documentation
**Estimated**: 30 min

1. [ ] Agregar sección "Architecture Validation" en README.md
2. [ ] Documentar cómo ejecutar ArchUnit tests
3. [ ] Agregar ejemplos de violaciones comunes
4. [ ] Documentar qué hacer si test falla

**Files to Modify**:
- `README.md`

### Task 5: CI/CD Integration Verification
**Estimated**: 15 min

1. [ ] Verificar que CI/CD ejecuta tests automáticamente
2. [ ] Verificar que build falla si tests fallan
3. [ ] Documentar comportamiento en CI/CD docs si aplica

---

## Definition of Done

- [ ] ArchUnit dependency agregada en `pom.xml`
- [ ] `HexagonalArchitectureTest.java` creado con 8+ reglas
- [ ] Todos los tests pasan en codebase actual
- [ ] Tests integrados en Maven build (ejecutan automáticamente)
- [ ] Build falla si arquitectura viola
- [ ] README.md actualizado con sección "Architecture Validation"
- [ ] Code review aprobado

---

## Testing Strategy

### Unit Tests
- ArchUnit tests son tests unitarios que validan estructura de código
- No requieren mocks ni setup especial
- Ejecutan en <5 segundos

### Verification
- Ejecutar `mvn test -Dtest=HexagonalArchitectureTest`
- Verificar output muestra todos los tests pasando
- Intentar agregar dependencia prohibida y verificar que test falla

---

## Risks and Mitigations

**Risk**: Tests pueden fallar en codebase actual si hay violaciones existentes  
**Mitigation**: Revisar violaciones y decidir si corregir código o ajustar reglas (preferir corregir código)

**Risk**: Reglas muy estrictas pueden bloquear desarrollo legítimo  
**Mitigation**: Reglas basadas en arquitectura hexagonal estándar, ajustar solo si hay necesidad técnica clara

---

## References

- [ArchUnit Documentation](https://www.archunit.org/)
- [Hexagonal Architecture Pattern](https://alistair.cockburn.us/hexagonal-architecture/)
- Epic 10 Tech Spec: `docs/sprint-artifacts/tech-spec-epic-10.md`
- Quality Evaluation: `Evaluación_de_Calidad_del_Proyecto_Signature_Router.md`

---

**Next Story**: Story 10.5 (Idempotencia Funcional) puede comenzar en paralelo

