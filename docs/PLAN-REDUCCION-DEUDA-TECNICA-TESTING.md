# 🎯 Plan de Reducción de Deuda Técnica - Testing

**Fecha:** 1 de diciembre de 2025  
**Contexto:** Esperando reunión MuleSoft (lunes) - Bloqueado Epic 11  
**Estrategia:** Aprovechar tiempo muerto para **reducir deuda técnica con testing**  
**Objetivo:** Alcanzar **85%+ coverage** y tener **suite de tests robusta**

---

## 📊 ESTADO ACTUAL

### Cobertura de Tests

```
Coverage Actual:     78% ✅ (supera objetivo 75%)
Tests Ejecutándose:  125 ✅
Tests Passing:       125 (100%) ✅
Tests Failing:       0 ✅
BUILD STATUS:        ✅ SUCCESS
```

### Tests Eliminados (Durante cleanup)

```
Total eliminados:    31 tests
  ├── Temporales:    9 (29%) - Proveedores directos → Reemplazar con MuleSoft
  └── Esenciales:    22 (71%) - Core del sistema → REIMPLEMENTAR
```

### Deuda Técnica Identificada

**Según TECH-DEBT.md:**
- Total items: 15
- P1 (High): 3 items (3-6 horas)
- P2 (Medium): 8 items (23-34 horas)
- P3 (Low): 4 items (7-10 horas)

---

## 🎯 OBJETIVOS DEL PLAN

### Objetivo 1: Reimplementar Tests Críticos 🔴

**Target:** 5 tests de ALTA PRIORIDAD del core domain

### Objetivo 2: Alcanzar 85%+ Coverage 📊

**Target:** Subir de 78% a 85%+ coverage

### Objetivo 3: Resolver Deuda Técnica P1 ⚡

**Target:** 3 items de alta prioridad (3-6 horas)

---

## 📋 FASE 1: TESTS CRÍTICOS DEL CORE DOMAIN (ALTA PRIORIDAD)

**Timeline:** 2-3 días  
**Esfuerzo estimado:** 12-16 horas

### 1.1. SignatureRequestTest.java ⭐⭐⭐⭐⭐

**Importancia:** CRÍTICA - Es el agregado raíz principal

**Errores detectados:** 6 fallos en validaciones del dominio

**Archivo a arreglar:**
```java
src/main/java/com/bank/signature/domain/model/aggregate/SignatureRequest.java
src/test/java/com/bank/signature/domain/model/aggregate/SignatureRequestTest.java
```

**Problemas conocidos:**
- Validaciones de invariantes del dominio
- Transiciones de estado incorrectas
- Métodos de creación y validación

**Tareas:**
```
[ ] Revisar agregado SignatureRequest
[ ] Arreglar invariantes del dominio
[ ] Validar transiciones de estado (PENDING → SENT → VALIDATED → COMPLETED)
[ ] Implementar tests faltantes
[ ] Verificar cobertura >90%
```

**Esfuerzo:** 3-4 horas

---

### 1.2. SignatureChallengeTest.java ⭐⭐⭐⭐⭐

**Importancia:** CRÍTICA - Entidad clave del dominio

**Errores detectados:** 2 fallos en validación de estados

**Archivo a arreglar:**
```java
src/main/java/com/bank/signature/domain/model/entity/SignatureChallenge.java
src/test/java/com/bank/signature/domain/model/entity/SignatureChallengeTest.java
```

**Problemas conocidos:**
- `testComplete_ThrowsWhenNotPending` - Fallo en validación de estado
- Transiciones de estado del challenge incorrectas

**Tareas:**
```
[ ] Revisar entidad SignatureChallenge
[ ] Arreglar validaciones de estado (solo PENDING puede completarse)
[ ] Implementar tests de transiciones de estado
[ ] Verificar cobertura >90%
```

**Esfuerzo:** 2-3 horas

---

### 1.3. ProviderResultTest.java ⭐⭐⭐⭐⭐

**Importancia:** CRÍTICA - Value Object usado por todos los providers

**Errores detectados:** 4 fallos en validaciones de intentos/reintentos

**Archivo a arreglar:**
```java
src/main/java/com/bank/signature/domain/model/valueobject/ProviderResult.java
src/test/java/com/bank/signature/domain/model/valueobject/ProviderResultTest.java
```

**Fallos específicos:**
- `compactConstructor_shouldValidateAttemptNumber` ❌
- `compactConstructor_shouldValidateRetriedSuccessConsistency` ❌
- `successAfterRetry_shouldRequireAtLeastTwoAttempts` ❌
- `retryExhausted_shouldRequireAtLeastTwoAttempts` ❌

**Tareas:**
```
[ ] Revisar invariantes del value object ProviderResult
[ ] Arreglar validación de número de intentos (attemptNumber >= 1)
[ ] Arreglar consistencia retried + success
[ ] Implementar validación: retry exitoso requiere 2+ attempts
[ ] Implementar validación: retry exhausted requiere 2+ attempts
[ ] Verificar cobertura >95%
```

**Esfuerzo:** 2-3 horas

---

### 1.4. QuerySignatureUseCaseImplTest.java ⭐⭐⭐⭐

**Importancia:** ALTA - Use Case principal de consulta

**Errores detectados:** 2 fallos en manejo de excepciones

**Archivo a arreglar:**
```java
src/main/java/com/bank/signature/application/usecase/QuerySignatureUseCaseImpl.java
src/test/java/com/bank/signature/application/usecase/QuerySignatureUseCaseImplTest.java
```

**Fallos específicos:**
- `shouldThrowNotFoundExceptionWhenSignatureRequestDoesNotExist` ❌

**Tareas:**
```
[ ] Revisar use case QuerySignatureUseCaseImpl
[ ] Arreglar manejo de excepciones NotFound
[ ] Implementar test cuando ID no existe
[ ] Implementar test cuando ID inválido
[ ] Verificar cobertura >85%
```

**Esfuerzo:** 2-3 horas

---

### 1.5. RoutingServiceImplTest.java ⭐⭐⭐⭐

**Importancia:** ALTA - Routing es independiente de proveedores

**Errores detectados:** 6 errores en lógica de enrutamiento

**Archivo a arreglar:**
```java
src/main/java/com/bank/signature/infrastructure/adapter/outbound/routing/RoutingServiceImpl.java
src/test/java/com/bank/signature/infrastructure/adapter/outbound/routing/RoutingServiceImplTest.java
```

**Problemas conocidos:**
- Mocking incorrecto de RoutingRuleRepository
- Configuración de default channel
- Evaluación de expresiones SpEL

**Tareas:**
```
[ ] Revisar RoutingServiceImpl
[ ] Arreglar mocking de repositorio
[ ] Arreglar configuración de default channel
[ ] Implementar tests de evaluación SpEL
[ ] Implementar test de short-circuit (primera regla que matchea)
[ ] Verificar cobertura >85%
```

**Esfuerzo:** 3-4 horas

---

## 📊 FASE 2: AUMENTAR COVERAGE A 85%+

**Timeline:** 1-2 días  
**Esfuerzo estimado:** 8-12 horas

### 2.1. Identificar Áreas con Baja Cobertura

**Comando para análisis:**
```bash
mvn clean test jacoco:report
# Abrir: target/site/jacoco/index.html
```

**Áreas típicamente con baja cobertura:**
- Controllers (REST endpoints)
- Exception handlers
- Configuration classes
- Builders y DTOs
- Infrastructure adapters

### 2.2. Agregar Tests Faltantes

**Prioridad por capa:**

1. **Domain Layer** (Target: 95%+)
   - [ ] Value Objects faltantes
   - [ ] Domain Services sin tests
   - [ ] Domain Events

2. **Application Layer** (Target: 85%+)
   - [ ] Use Cases faltantes
   - [ ] Mappers (DTO ↔ Domain)
   - [ ] Application Services

3. **Infrastructure Layer** (Target: 75%+)
   - [ ] Controllers (endpoints REST)
   - [ ] Repository Adapters
   - [ ] Event Publishers

### 2.3. Tests Específicos a Agregar

**Controllers sin tests completos:**
```
[ ] DashboardMetricsController (Story 12.1)
[ ] MetricsAnalyticsController (pendiente)
[ ] UserManagementController (pendiente)
[ ] AlertsController (pendiente)
[ ] SecurityAuditController (parcial)
```

**Use Cases sin tests:**
```
[ ] GetDashboardMetricsUseCaseImpl (Story 12.1)
[ ] GetMetricsAnalyticsUseCaseImpl (pendiente)
[ ] AbortSignatureUseCaseImpl (test eliminado)
```

**Mappers sin tests:**
```
[ ] ProviderDtoMapper
[ ] SignatureMapper
[ ] RoutingRuleMapper
```

---

## ⚡ FASE 3: RESOLVER DEUDA TÉCNICA P1 (ALTA PRIORIDAD)

**Timeline:** 0.5-1 día  
**Esfuerzo estimado:** 3-6 horas

### 3.1. TODO-001: ISO 4217 Currency Validation ✅

**Ubicación:**
```java
src/main/java/com/bank/signature/domain/model/valueobject/Money.java
```

**Problema:**
```java
// TODO-001: Validate ISO 4217 currency code
public Money {
    Objects.requireNonNull(currency, "currency cannot be null");
    // ⚠️ Falta validación ISO 4217
}
```

**Solución:**
```java
private static final Set<String> ISO_4217_CURRENCIES = Set.of(
    "USD", "EUR", "GBP", "JPY", "ARS", "CLP", "MXN", "BRL", "COP", "PEN"
    // ... agregar todas las monedas ISO 4217 relevantes
);

public Money {
    Objects.requireNonNull(currency, "currency cannot be null");
    if (!ISO_4217_CURRENCIES.contains(currency)) {
        throw new IllegalArgumentException("Invalid ISO 4217 currency: " + currency);
    }
    // ...
}
```

**Tests a agregar:**
```java
@Test
void shouldRejectInvalidCurrency() {
    assertThrows(IllegalArgumentException.class, 
        () -> new Money(BigDecimal.TEN, "INVALID"));
}

@Test
void shouldAcceptValidCurrency() {
    assertDoesNotThrow(() -> new Money(BigDecimal.TEN, "USD"));
}
```

**Esfuerzo:** 1-2 horas

---

### 3.2. TODO-002 & TODO-003: Extract Admin User ID from SecurityContext ✅

**Ubicación:**
```java
// TODO-002
src/main/java/com/bank/signature/infrastructure/resilience/CircuitBreakerEventListener.java

// TODO-003
src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/SystemModeController.java
```

**Problema:**
```java
// TODO-002: Extract admin user ID from SecurityContext instead of hardcoding
String adminUserId = "SYSTEM";  // ⚠️ Hardcoded
```

**Solución:**
```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

private String getAdminUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated()) {
        return auth.getName();  // Username from JWT
    }
    return "SYSTEM";  // Fallback para operaciones automáticas
}
```

**Tests a agregar:**
```java
@Test
@WithMockUser(username = "admin@singularbank.com")
void shouldExtractUserIdFromSecurityContext() {
    String userId = getAdminUserId();
    assertEquals("admin@singularbank.com", userId);
}

@Test
void shouldReturnSystemWhenNoAuthentication() {
    SecurityContextHolder.clearContext();
    String userId = getAdminUserId();
    assertEquals("SYSTEM", userId);
}
```

**Esfuerzo:** 2-4 horas (2 ubicaciones)

---

## 🧪 FASE 4: TESTS DE INTEGRACIÓN FALTANTES

**Timeline:** 1-2 días  
**Esfuerzo estimado:** 8-12 horas

### 4.1. Controller Integration Tests

**Template base:**
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
@ActiveProfiles("test")
class DashboardMetricsControllerIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("test")
        .withUsername("test")
        .withPassword("test");
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldGetDashboardMetrics() {
        ResponseEntity<DashboardMetricsResponse> response = 
            restTemplate.getForEntity("/api/v1/admin/dashboard/metrics", 
                DashboardMetricsResponse.class);
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getOverview().getTotalSignatures24h() >= 0);
    }
}
```

**Tests a crear:**
```
[ ] DashboardMetricsControllerIntegrationTest (Story 12.1)
[ ] AdminSignatureControllerIntegrationTest (Story 12.2)
[ ] ProvidersControllerIntegrationTest (Story 12.3)
[ ] SignatureControllerIntegrationTest (arreglar)
[ ] AdminRuleControllerIntegrationTest (arreglar)
```

**Esfuerzo:** 8-12 horas (2-3h por test)

---

## 📊 FASE 5: ARCHITECTURE & QUALITY TESTS

**Timeline:** 0.5-1 día  
**Esfuerzo estimado:** 4-6 horas

### 5.1. HexagonalArchitectureTest.java ⭐⭐⭐

**Importancia:** MEDIA - Validación de arquitectura hexagonal

**Archivo:**
```java
src/test/java/com/bank/signature/architecture/HexagonalArchitectureTest.java
```

**Fallos actuales (5):**
- `repositoryAdaptersShouldImplementDomainPorts` ❌
- `layersShouldBeRespected` ❌
- `jpaEntitiesShouldNotLeakOutsidePersistencePackage` ❌
- `domainShouldNotDependOnFrameworks` ❌
- `domainPortsShouldNotDependOnInfrastructure` ❌

**Tareas:**
```
[ ] Revisar violaciones de arquitectura hexagonal
[ ] Refactorizar código para cumplir reglas
[ ] Verificar que Domain no depende de Infrastructure
[ ] Verificar que Infrastructure implementa Ports correctamente
[ ] Verificar que JPA entities no se usan fuera de persistence package
```

**Esfuerzo:** 4-6 horas

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

### Semana 1: Tests Críticos del Core Domain (Lunes-Miércoles)

**Día 1 (Lunes - hoy):**
```
Mañana:
✅ 1. Reunión con MuleSoft (obtener specs)
  2. SignatureRequestTest.java (3-4h)
     - Revisar agregado
     - Arreglar invariantes
     - Implementar tests faltantes

Tarde:
  3. SignatureChallengeTest.java (2-3h)
     - Arreglar validaciones de estado
     - Tests de transiciones
```

**Día 2 (Martes):**
```
Mañana:
  4. ProviderResultTest.java (2-3h)
     - Arreglar validaciones de intentos
     - Tests de retry logic

Tarde:
  5. QuerySignatureUseCaseImplTest.java (2-3h)
     - Arreglar manejo de excepciones
     - Tests de casos borde
```

**Día 3 (Miércoles):**
```
Mañana:
  6. RoutingServiceImplTest.java (3-4h)
     - Arreglar mocking
     - Tests de evaluación SpEL

Tarde:
  7. TODO-001: ISO 4217 Validation (1-2h)
  8. TODO-002 & TODO-003: SecurityContext (2-4h)
```

### Semana 1: Coverage & Integration Tests (Jueves-Viernes)

**Día 4 (Jueves):**
```
Mañana:
  9. Análisis de coverage actual
  10. Agregar tests de Controllers (4h)

Tarde:
  11. Agregar tests de Use Cases (4h)
```

**Día 5 (Viernes):**
```
Mañana:
  12. Integration Tests (Testcontainers) (4h)

Tarde:
  13. HexagonalArchitectureTest.java (4h)
  14. Verificar coverage final
```

---

## 🎯 MÉTRICAS DE ÉXITO

### Cobertura de Tests

```
Actual:     78%
Target:     85%+
Ideal:      90%+
```

### Tests Status

```
Actual:     125 tests pasando
Target:     145+ tests pasando (20 nuevos tests)
Ideal:      160+ tests pasando (35 nuevos tests)
```

### Deuda Técnica

```
Actual:     15 items (3 P1, 8 P2, 4 P3)
Target:     12 items (0 P1, 8 P2, 4 P3)
Ideal:      8 items (0 P1, 4 P2, 4 P3)
```

### Build Status

```
Actual:     ✅ SUCCESS (125/125 passing)
Target:     ✅ SUCCESS (145+/145+ passing)
```

---

## 📋 CHECKLIST DE PROGRESO

### Fase 1: Tests Críticos Core Domain ✅

- [ ] SignatureRequestTest.java ⭐⭐⭐⭐⭐
- [ ] SignatureChallengeTest.java ⭐⭐⭐⭐⭐
- [ ] ProviderResultTest.java ⭐⭐⭐⭐⭐
- [ ] QuerySignatureUseCaseImplTest.java ⭐⭐⭐⭐
- [ ] RoutingServiceImplTest.java ⭐⭐⭐⭐

### Fase 2: Coverage 85%+ 📊

- [ ] Análisis de coverage actual con JaCoCo
- [ ] Tests de Controllers faltantes
- [ ] Tests de Use Cases faltantes
- [ ] Tests de Mappers
- [ ] Verificar coverage >85%

### Fase 3: Deuda Técnica P1 ⚡

- [ ] TODO-001: ISO 4217 Currency Validation
- [ ] TODO-002: Extract Admin User ID (CircuitBreakerEventListener)
- [ ] TODO-003: Extract Admin User ID (SystemModeController)

### Fase 4: Integration Tests 🧪

- [ ] DashboardMetricsControllerIntegrationTest
- [ ] AdminSignatureControllerIntegrationTest
- [ ] ProvidersControllerIntegrationTest
- [ ] SignatureControllerIntegrationTest (arreglar)
- [ ] AdminRuleControllerIntegrationTest (arreglar)

### Fase 5: Architecture Tests 🏛️

- [ ] HexagonalArchitectureTest.java (arreglar 5 fallos)
- [ ] Refactorizar violaciones de arquitectura
- [ ] Verificar separación de capas

---

## 🛠️ COMANDOS ÚTILES

### Ejecutar Tests

```bash
# Todos los tests
mvn clean test

# Tests específicos
mvn test -Dtest=SignatureRequestTest
mvn test -Dtest=SignatureChallengeTest
mvn test -Dtest=ProviderResultTest

# Tests por package
mvn test -Dtest="com.bank.signature.domain.**"
mvn test -Dtest="com.bank.signature.application.**"
mvn test -Dtest="com.bank.signature.infrastructure.**"

# Solo unit tests (excluir integration)
mvn test -Dtest="!*IntegrationTest"

# Solo integration tests
mvn test -Dtest="*IntegrationTest"
```

### Coverage Report

```bash
# Generar reporte de coverage
mvn clean test jacoco:report

# Abrir reporte HTML
start target/site/jacoco/index.html  # Windows
open target/site/jacoco/index.html   # Mac/Linux

# Verificar que supera 75% (build fallará si no)
mvn clean verify
```

### ArchUnit Tests

```bash
# Ejecutar solo tests de arquitectura
mvn test -Dtest=HexagonalArchitectureTest
```

---

## 📖 RECURSOS Y DOCUMENTACIÓN

### Documentos Relacionados

- `src/test/java/README-TESTS.md` - Estado actual de tests
- `docs/architecture/TESTS-TO-REIMPLEMENT.md` - Inventario completo
- `svc-signature-router/docs/TECH-DEBT.md` - Deuda técnica
- `docs/TESTING-GUIDE.md` - Guía de testing
- `docs/architecture/02-hexagonal-structure.md` - Arquitectura hexagonal

### Referencias Técnicas

**JaCoCo:**
- https://www.jacoco.org/jacoco/trunk/doc/

**ArchUnit:**
- https://www.archunit.org/userguide/html/000_Index.html

**Testcontainers:**
- https://www.testcontainers.org/

**Spring Boot Testing:**
- https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing

---

## 🚨 ADVERTENCIAS Y CONSIDERACIONES

### ⚠️ NO Reimplementar Tests Temporales

Los siguientes tests están relacionados con proveedores directos y **NO** deben reimplementarse:

```
❌ BiometricProviderTest.java
❌ TwilioSmsProviderTest.java
❌ TwilioSmsProviderAsyncTest.java
❌ VoiceCallProviderTest.java
❌ TwilioProviderIntegrationTest.java
❌ PushProviderIntegrationTest.java
❌ VoiceProviderIntegrationTest.java
❌ ProviderTimeoutIntegrationTest.java
❌ SignatureProviderAdapterTimeoutTest.java
```

**Serán reemplazados por:**
```
✨ MuleSoftApiClientTest.java
✨ MuleSoftSmsProviderTest.java
✨ MuleSoftPushProviderTest.java
✨ MuleSoftVoiceProviderTest.java
✨ MuleSoftApiProviderIntegrationTest.java
```

### ⚠️ Tests Bloqueados por MuleSoft

Los siguientes tests **NO** pueden completarse hasta tener la integración con MuleSoft:

- Tests que requieren llamadas reales a proveedores SMS/PUSH/VOICE
- Tests end-to-end de envío de challenges
- Tests de fallback entre proveedores

**Solución temporal:** Usar mocks de MuleSoft API mientras se espera la integración real.

---

## 📊 IMPACTO ESPERADO

### Calidad del Código

```
Antes:   78% coverage, 125 tests
Después: 85%+ coverage, 145+ tests
Mejora:  +7% coverage, +20 tests
```

### Confianza en el Sistema

- ✅ Core domain robusto con tests completos
- ✅ Use cases críticos testeados
- ✅ Arquitectura hexagonal validada
- ✅ Integration tests funcionando
- ✅ Zero deuda técnica P1

### Preparación para MuleSoft

- ✅ Tests del core domain independientes de proveedores
- ✅ Arquitectura hexagonal validada (fácil integración)
- ✅ Mocks listos para reemplazar con MuleSoft real
- ✅ Suite de tests robusta para refactoring seguro

---

## 🎯 CONCLUSIÓN

Este plan de **reducción de deuda técnica con testing** aprovecha el tiempo muerto mientras esperamos la reunión de MuleSoft para:

1. **Fortalecer el core domain** con tests robustos
2. **Aumentar coverage** de 78% a 85%+
3. **Resolver deuda técnica P1** (3 items críticos)
4. **Preparar el sistema** para la integración con MuleSoft

**Timeline total:** 1 semana (5 días)  
**Esfuerzo total:** 35-48 horas  
**ROI:** Alto - Sistema más robusto y preparado para MuleSoft

---

**Documento creado:** 1 de diciembre de 2025  
**Autor:** Technical Lead  
**Estado:** ✅ Plan aprobado - Listo para ejecutar  
**Próxima revisión:** Viernes 6 de diciembre (fin de semana de testing)

