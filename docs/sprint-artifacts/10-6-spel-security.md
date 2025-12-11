# Story 10.6: SpEL Security - Whitelist TypeLocator y Validación

**Epic**: 10 - Quality Improvements & Technical Debt  
**Story ID**: 10.6  
**Story Key**: 10-6-spel-security  
**Status**: drafted  
**Created**: 2025-11-29  
**Story Points**: 5 SP  
**Priority**: 🔴 CRÍTICO

---

## Story

**As a** System Administrator  
**I want** Validación de reglas SpEL al crearlas  
**So that** Admin comprometido no pueda ejecutar código arbitrario

---

## Context

Esta story implementa validación de seguridad para expresiones SpEL usadas en routing rules. Actualmente, el sistema permite cualquier expresión SpEL, lo que representa un riesgo de seguridad crítico si un administrador comprometido intenta ejecutar código arbitrario (ej: `T(java.lang.Runtime).getRuntime().exec(...)`).

**Source**: Evaluación de Calidad identificó vulnerabilidad de SpEL injection.

**Business Value**:
- Previene ejecución de código arbitrario (security critical)
- Protege sistema contra administradores comprometidos
- Cumple con estándares bancarios de seguridad
- Mantiene funcionalidad de routing rules mientras previene abuso

**Prerequisites**:
- ✅ Epic 2 completado (routing rules con SpEL)
- ✅ Epic 1 completado (Spring Expression Language disponible)

---

## Acceptance Criteria

### AC1: SpelValidatorService Created

**Given** Application layer  
**When** Reviso `com.singularbank.signature.routing.application.service`  
**Then** Existe `SpelValidatorService` con métodos:
- `ValidationResult validate(String spelExpression)`
- `boolean isSafe(String spelExpression)`

### AC2: Whitelist TypeLocator Implemented

**Given** `SpelValidatorService`  
**When** Valida expresión SpEL  
**Then** Solo permite acceso a clases en whitelist:
- ✅ `com.singularbank.signature.routing.domain.model.valueobject.TransactionContext`
- ✅ `com.singularbank.signature.routing.domain.model.valueobject.Money`
- ✅ `java.lang.Math` (abs, max, min, etc.)
- ✅ `java.time.*` (LocalDate, Instant, etc.)
- ❌ PROHIBIDO: `java.lang.Runtime`
- ❌ PROHIBIDO: `java.lang.ProcessBuilder`
- ❌ PROHIBIDO: `java.io.File`
- ❌ PROHIBIDO: `java.lang.ClassLoader`

### AC3: Syntax Validation

**Given** Expresión SpEL  
**When** Sistema valida  
**Then** Verifica sintaxis válida (parser no lanza `ParseException`)

### AC4: Dangerous Method Calls Blocked

**Given** Expresión SpEL con métodos peligrosos  
**When** Sistema valida  
**Then** Rechaza expresiones como:
- `T(java.lang.Runtime).getRuntime().exec(...)`
- `new java.io.File(...).delete()`
- `#this.getClass().forName(...)`
- `T(java.lang.System).exit(0)`

### AC5: Integration in CreateRoutingRuleUseCase

**Given** `CreateRoutingRuleUseCase`  
**When** Admin crea routing rule con SpEL expression  
**Then** Sistema:
- Valida expresión ANTES de persistir
- Si válida: persiste rule normalmente
- Si inválida: lanza `InvalidSpelExpressionException` con mensaje claro

### AC6: Validation Endpoint Created

**Given** Admin Portal  
**When** Admin quiere validar expresión antes de crear rule  
**Then** Existe endpoint:
```
POST /api/v1/admin/routing-rules/validate-spel
Content-Type: application/json

{
  "expression": "transactionContext.amount.value > 1000"
}
```

**Response**:
```json
{
  "isValid": true,
  "errorMessage": null
}
```

**Error Response**:
```json
{
  "isValid": false,
  "errorMessage": "SpEL expression contains unsafe operations: T(java.lang.Runtime)"
}
```

### AC7: Security Audit of Existing Rules

**Given** Base de datos con routing rules existentes  
**When** Ejecuto security audit  
**Then** Sistema:
- Escanea todas las reglas en BD
- Identifica reglas con expresiones potencialmente peligrosas
- Genera reporte de seguridad
- Marca reglas para revisión manual

### AC8: Safe Expression Examples

**Given** Documentación  
**When** Reviso `SECURITY.md`  
**Then** Incluye ejemplos de expresiones válidas:
- `amount.value > 1000`
- `merchantId == 'MERCHANT_XYZ'`
- `amount.value > 500 && transactionType == 'PURCHASE'`
- `T(java.lang.Math).abs(amount.value) > 100`

**And** Ejemplos de expresiones inválidas con explicación

### AC9: Tests Implemented

**Given** Test suite  
**When** Ejecuto tests de SpEL security  
**Then** Tests cubren:
- Expresiones válidas → aceptadas
- Expresiones peligrosas → rechazadas
- Syntax errors → rechazadas
- Integration con CreateRoutingRuleUseCase

---

## Technical Notes

### SpelValidatorService Implementation

```java
package com.singularbank.signature.routing.application.service;

import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.ParseException;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardTypeLocator;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class SpelValidatorService {
    
    private static final Set<String> ALLOWED_CLASSES = Set.of(
        "com.singularbank.signature.routing.domain.model.valueobject.TransactionContext",
        "com.singularbank.signature.routing.domain.model.valueobject.Money",
        "java.lang.Math",
        "java.time.LocalDate",
        "java.time.Instant"
    );
    
    private static final Set<String> FORBIDDEN_CLASSES = Set.of(
        "java.lang.Runtime",
        "java.lang.ProcessBuilder",
        "java.io.File",
        "java.lang.ClassLoader",
        "java.lang.System"
    );
    
    public ValidationResult validate(String spelExpression) {
        // 1. Syntax validation
        ExpressionParser parser = new SpelExpressionParser();
        try {
            Expression expr = parser.parseExpression(spelExpression);
        } catch (ParseException e) {
            return ValidationResult.invalid("Invalid SpEL syntax: " + e.getMessage());
        }
        
        // 2. Check for forbidden classes
        for (String forbiddenClass : FORBIDDEN_CLASSES) {
            if (spelExpression.contains(forbiddenClass)) {
                return ValidationResult.invalid(
                    "SpEL expression contains unsafe operations: " + forbiddenClass
                );
            }
        }
        
        // 3. Check for dangerous patterns
        if (containsDangerousPattern(spelExpression)) {
            return ValidationResult.invalid(
                "SpEL expression contains dangerous patterns"
            );
        }
        
        return ValidationResult.valid();
    }
    
    private boolean containsDangerousPattern(String expression) {
        String lower = expression.toLowerCase();
        return lower.contains(".exec(") ||
               lower.contains(".delete()") ||
               lower.contains(".forname(") ||
               lower.contains("system.exit");
    }
    
    public boolean isSafe(String spelExpression) {
        return validate(spelExpression).isValid();
    }
    
    public record ValidationResult(boolean isValid, String errorMessage) {
        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }
        
        public static ValidationResult invalid(String errorMessage) {
            return new ValidationResult(false, errorMessage);
        }
    }
}
```

### Custom TypeLocator (Alternative Approach)

```java
public class WhitelistTypeLocator extends StandardTypeLocator {
    
    @Override
    public Class<?> findType(String typeName) throws EvaluationException {
        if (!ALLOWED_CLASSES.contains(typeName)) {
            throw new SpelEvaluationException(
                SpelMessage.TYPE_NOT_FOUND,
                typeName
            );
        }
        return super.findType(typeName);
    }
}
```

### Integration in UseCase

```java
@Service
public class CreateRoutingRuleUseCaseImpl implements CreateRoutingRuleUseCase {
    
    private final SpelValidatorService spelValidator;
    private final RoutingRuleRepository repository;
    
    @Override
    @Transactional
    public RoutingRule execute(CreateRoutingRuleCommand command) {
        // Validate SpEL expression
        ValidationResult validation = spelValidator.validate(command.getExpression());
        if (!validation.isValid()) {
            throw new InvalidSpelExpressionException(validation.errorMessage());
        }
        
        // Create and persist rule
        RoutingRule rule = RoutingRule.builder()
            .expression(command.getExpression())
            .priority(command.getPriority())
            .build();
        
        return repository.save(rule);
    }
}
```

### Validation Endpoint

```java
@RestController
@RequestMapping("/api/v1/admin/routing-rules")
public class RoutingRuleValidationController {
    
    private final SpelValidatorService spelValidator;
    
    @PostMapping("/validate-spel")
    public ResponseEntity<SpelValidationResponse> validateSpel(
        @RequestBody SpelValidationRequest request
    ) {
        ValidationResult result = spelValidator.validate(request.getExpression());
        
        return ResponseEntity.ok(new SpelValidationResponse(
            result.isValid(),
            result.errorMessage()
        ));
    }
}
```

---

## Tasks

### Task 1: Create SpelValidatorService
**Estimated**: 2h

1. [ ] Crear `SpelValidatorService` en `application/service/`
2. [ ] Implementar whitelist de clases permitidas
3. [ ] Implementar lista de clases prohibidas
4. [ ] Implementar validación de sintaxis
5. [ ] Implementar detección de patrones peligrosos
6. [ ] Agregar JavaDoc completo

**Files to Create**:
- `src/main/java/com/bank/signature/application/service/SpelValidatorService.java`

### Task 2: Create Domain Exception
**Estimated**: 15 min

1. [ ] Crear `InvalidSpelExpressionException` en `domain/exception/`
2. [ ] Extender `DomainException`
3. [ ] Agregar error code

**Files to Create**:
- `src/main/java/com/bank/signature/domain/exception/InvalidSpelExpressionException.java`

### Task 3: Integrate in CreateRoutingRuleUseCase
**Estimated**: 1h

1. [ ] Modificar `CreateRoutingRuleUseCaseImpl`
2. [ ] Agregar validación antes de persistir
3. [ ] Lanzar excepción si expresión inválida
4. [ ] Agregar tests

**Files to Modify**:
- `src/main/java/com/bank/signature/application/usecase/CreateRoutingRuleUseCaseImpl.java`

### Task 4: Create Validation Endpoint
**Estimated**: 1h

1. [ ] Crear `RoutingRuleValidationController`
2. [ ] Implementar `POST /validate-spel` endpoint
3. [ ] Crear DTOs de request/response
4. [ ] Agregar tests

**Files to Create**:
- `src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/RoutingRuleValidationController.java`
- `src/main/java/com/bank/signature/application/dto/SpelValidationRequest.java`
- `src/main/java/com/bank/signature/application/dto/SpelValidationResponse.java`

### Task 5: Security Audit Script
**Estimated**: 1h

1. [ ] Crear script/endpoint para auditar reglas existentes
2. [ ] Escanear todas las reglas en BD
3. [ ] Identificar reglas potencialmente peligrosas
4. [ ] Generar reporte

**Files to Create**:
- `src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/SecurityAuditController.java`

### Task 6: Write Tests
**Estimated**: 2h

1. [ ] Crear `SpelValidatorServiceTest` (unit tests)
2. [ ] Test: expresiones válidas → aceptadas
3. [ ] Test: expresiones peligrosas → rechazadas
4. [ ] Test: syntax errors → rechazadas
5. [ ] Crear `CreateRoutingRuleUseCaseImplTest` (integration)
6. [ ] Test: validación integrada en use case

**Files to Create**:
- `src/test/java/com/bank/signature/application/service/SpelValidatorServiceTest.java`
- `src/test/java/com/bank/signature/application/usecase/CreateRoutingRuleUseCaseImplTest.java` (modificar existente)

### Task 7: Update Documentation
**Estimated**: 1h

1. [ ] Crear/actualizar `SECURITY.md`
2. [ ] Documentar SpEL safe practices
3. [ ] Agregar ejemplos de expresiones válidas/inválidas
4. [ ] Documentar whitelist de clases

**Files to Create/Modify**:
- `SECURITY.md`

---

## Definition of Done

- [ ] `SpelValidatorService` implementado con whitelist
- [ ] Validación integrada en `CreateRoutingRuleUseCase`
- [ ] Endpoint de validación creado
- [ ] Tests: reglas maliciosas → rechazadas
- [ ] Security audit de reglas existentes completado
- [ ] Documentado en `SECURITY.md`
- [ ] Code review aprobado

---

## Testing Strategy

### Unit Tests
- `SpelValidatorServiceTest`: Test validación de expresiones
- Test cases: válidas, peligrosas, syntax errors

### Integration Tests
- `CreateRoutingRuleUseCaseImplTest`: Test integración con use case
- Test: crear rule con expresión válida → éxito
- Test: crear rule con expresión peligrosa → excepción

### Security Tests
- Intentar crear rule con `T(java.lang.Runtime).getRuntime().exec(...)`
- Verificar que es rechazado
- Verificar que no se ejecuta código

---

## Risks and Mitigations

**Risk**: Whitelist muy restrictiva puede bloquear expresiones válidas  
**Mitigation**: Iterar whitelist basado en reglas existentes, permitir extensión si necesario

**Risk**: Validación puede ser bypassed si se modifica código  
**Mitigation**: ArchUnit tests validan que validación siempre se ejecuta

**Risk**: Expresiones complejas pueden ser difíciles de validar  
**Mitigation**: Usar parser de SpEL, validar AST si necesario

---

## References

- Epic 10 Tech Spec: `docs/sprint-artifacts/tech-spec-epic-10.md`
- Quality Evaluation: `Evaluación_de_Calidad_del_Proyecto_Signature_Router.md`
- [Spring Expression Language Documentation](https://docs.spring.io/spring-framework/reference/core/expressions.html)
- [OWASP Code Injection](https://owasp.org/www-community/attacks/Code_Injection)

---

**Next Story**: Story 10.12 (TODO Cleanup) puede comenzar en paralelo

