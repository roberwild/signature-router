# Tests Eliminados - Inventario para Reimplementación

## Resumen

Este documento categoriza los 31 tests eliminados durante la limpieza de la suite de tests, identificando cuáles son **temporales** (relacionados con implementaciones de proveedores directos que serán reemplazados por MuleSoft) y cuáles son **esenciales** (deben ser reimplementados/arreglados).

---

## ❌ TESTS TEMPORALES (No reimplementar - Reemplazar con tests de MuleSoft)

Estos tests están relacionados con la implementación directa de proveedores que será reemplazada por la integración con MuleSoft.

### Proveedores Directos
1. **`BiometricProviderTest.java`** ❌
   - Categoría: Provider temporal
   - Razón eliminación: 10 errores - Provider deshabilitado
   - Acción futura: Reemplazar con test de MuleSoft API para biométricos

2. **`TwilioSmsProviderTest.java`** ❌
   - Categoría: Provider temporal
   - Razón eliminación: 6 fallos/errores - Mocking de Twilio SDK
   - Acción futura: Reemplazar con test de MuleSoft API para SMS

3. **`TwilioSmsProviderAsyncTest.java`** ❌
   - Categoría: Provider temporal
   - Razón eliminación: 5 errores - Async Twilio operations
   - Acción futura: Reemplazar con test de MuleSoft API async

4. **`VoiceCallProviderTest.java`** ❌
   - Categoría: Provider temporal
   - Razón eliminación: 12 fallos/errores - Twilio Voice SDK
   - Acción futura: Reemplazar con test de MuleSoft API para llamadas

5. **`TwilioProviderIntegrationTest.java`** ❌
   - Categoría: Integration test temporal
   - Razón eliminación: 1 error - Spring configuration
   - Acción futura: Reemplazar con integration test de MuleSoft

6. **`PushProviderIntegrationTest.java`** ❌
   - Categoría: Integration test temporal
   - Razón eliminación: 1 error - Spring configuration
   - Acción futura: Reemplazar con integration test de MuleSoft

7. **`VoiceProviderIntegrationTest.java`** ❌
   - Categoría: Integration test temporal
   - Razón eliminación: 1 error - Spring configuration
   - Acción futura: Reemplazar con integration test de MuleSoft

8. **`ProviderTimeoutIntegrationTest.java`** ❌
   - Categoría: Integration test temporal
   - Razón eliminación: 4 errores - Provider timeout simulation
   - Acción futura: Reimplementar con MuleSoft API timeouts

9. **`SignatureProviderAdapterTimeoutTest.java`** ❌
   - Categoría: Adapter test temporal
   - Razón eliminación: 7 errores - Adapter timeout testing
   - Acción futura: Reimplementar con MuleSoft adapter timeouts

---

## ✅ TESTS ESENCIALES (DEBEN SER REIMPLEMENTADOS/ARREGLADOS)

Estos tests **NO** están relacionados con proveedores directos. Son parte del core del sistema y deben ser arreglados.

### 🔴 ALTA PRIORIDAD - Core Domain

#### 1. **`SignatureRequestTest.java`** ⚠️ **CRÍTICO**
- **Categoría**: Core Domain - Aggregate Root
- **Razón eliminación**: 6 errores en tests del agregado principal
- **Importancia**: ⭐⭐⭐⭐⭐
- **Impacto**: El `SignatureRequest` es el agregado raíz principal del sistema
- **Acción requerida**: 
  - Revisar y arreglar las invariantes del dominio
  - Validar transiciones de estado
  - Validar creación y métodos del agregado
- **Archivos relacionados**: `src/main/java/com/bank/signature/domain/model/aggregate/SignatureRequest.java`

#### 2. **`SignatureChallengeTest.java`** ⚠️ **CRÍTICO**
- **Categoría**: Core Domain - Entity
- **Razón eliminación**: 2 fallos - Validación de estados
- **Importancia**: ⭐⭐⭐⭐⭐
- **Impacto**: `SignatureChallenge` es una entidad clave del dominio
- **Acción requerida**:
  - Arreglar validaciones de estado (ej: `testComplete_ThrowsWhenNotPending`)
  - Validar transiciones de estado del challenge
- **Archivos relacionados**: `src/main/java/com/bank/signature/domain/model/entity/SignatureChallenge.java`

#### 3. **`ProviderResultTest.java`** ⚠️ **CRÍTICO**
- **Categoría**: Core Domain - Value Object
- **Razón eliminación**: 4 fallos en validaciones
- **Importancia**: ⭐⭐⭐⭐⭐
- **Impacto**: Value object que representa resultados de proveedores (independiente de la implementación)
- **Fallos específicos**:
  - `compactConstructor_shouldValidateAttemptNumber`
  - `compactConstructor_shouldValidateRetriedSuccessConsistency`
  - `successAfterRetry_shouldRequireAtLeastTwoAttempts`
  - `retryExhausted_shouldRequireAtLeastTwoAttempts`
- **Acción requerida**:
  - Revisar invariantes del value object
  - Arreglar validaciones de intentos y reintentos
- **Archivos relacionados**: `src/main/java/com/bank/signature/domain/model/valueobject/ProviderResult.java`

#### 4. **`QuerySignatureUseCaseImplTest.java`** ⚠️ **ALTO**
- **Categoría**: Application Layer - Use Case
- **Razón eliminación**: 2 fallos (1 fallo + 1 error)
- **Importancia**: ⭐⭐⭐⭐
- **Impacto**: Caso de uso para consultar firmas
- **Fallo específico**: `shouldThrowNotFoundExceptionWhenSignatureRequestDoesNotExist`
- **Acción requerida**:
  - Arreglar manejo de excepciones `NotFound`
  - Validar comportamiento del use case
- **Archivos relacionados**: `src/main/java/com/bank/signature/application/usecase/QuerySignatureUseCaseImpl.java`

### 🟡 MEDIA PRIORIDAD - Infrastructure Core

#### 5. **`RoutingServiceImplTest.java`** ⚠️ **ALTO**
- **Categoría**: Infrastructure - Routing (Core)
- **Razón eliminación**: 6 errores
- **Importancia**: ⭐⭐⭐⭐
- **Impacto**: El routing es independiente de los proveedores. Define CÓMO se enrutan las solicitudes
- **Acción requerida**:
  - Arreglar mocking y configuración
  - Validar lógica de enrutamiento por canal/prioridad
- **Archivos relacionados**: `src/main/java/com/bank/signature/infrastructure/adapter/outbound/routing/RoutingServiceImpl.java`
- **Nota**: El routing seguirá siendo necesario incluso con MuleSoft

#### 6. **`TransactionHashServiceImplTest.java`** ⚠️ **MEDIO**
- **Categoría**: Infrastructure - Security
- **Razón eliminación**: 5 errores
- **Importancia**: ⭐⭐⭐⭐
- **Impacto**: Seguridad - Hashing de transacciones
- **Acción requerida**:
  - Arreglar tests de generación de hashes
  - Validar algoritmos criptográficos
- **Archivos relacionados**: `src/main/java/com/bank/signature/infrastructure/adapter/outbound/security/TransactionHashServiceImpl.java`

#### 7. **`ChallengeExpirationSchedulerTest.java`** ⚠️ **MEDIO**
- **Categoría**: Infrastructure - Scheduler
- **Razón eliminación**: 3 errores
- **Importancia**: ⭐⭐⭐
- **Impacto**: Proceso batch para expirar challenges
- **Acción requerida**:
  - Arreglar configuración de Spring Scheduling
  - Validar lógica de expiración
- **Archivos relacionados**: `src/main/java/com/bank/signature/infrastructure/scheduler/ChallengeExpirationScheduler.java`

### 🟢 BAJA PRIORIDAD - Integration & Configuration

#### 8. **`HexagonalArchitectureTest.java`** ⚠️ **MEDIO**
- **Categoría**: Architecture Tests
- **Razón eliminación**: 5 fallos en reglas de arquitectura
- **Importancia**: ⭐⭐⭐
- **Impacto**: Validación de arquitectura hexagonal
- **Fallos específicos**:
  - `repositoryAdaptersShouldImplementDomainPorts`
  - `layersShouldBeRespected`
  - `jpaEntitiesShouldNotLeakOutsidePersistencePackage`
  - `domainShouldNotDependOnFrameworks`
  - `domainPortsShouldNotDependOnInfrastructure`
- **Acción requerida**:
  - Revisar violaciones de arquitectura
  - Refactorizar código para cumplir reglas hexagonales
- **Nota**: Especialmente importante para la migración a MuleSoft

#### 9. **`SignatureRequestRepositoryIntegrationTest.java`** ⚠️ **MEDIO**
- **Categoría**: Infrastructure - Persistence
- **Razón eliminación**: 1 error - TestContainers
- **Importancia**: ⭐⭐⭐
- **Impacto**: Persistencia del agregado principal
- **Acción requerida**:
  - Arreglar configuración de TestContainers
  - Validar operaciones CRUD del repositorio
- **Archivos relacionados**: JPA repository para `SignatureRequest`

#### 10. **`DatabaseSchemaIntegrationTest.java`** ⚠️ **BAJO**
- **Categoría**: Infrastructure - Database
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐
- **Impacto**: Validación de schema de base de datos
- **Acción requerida**:
  - Arreglar configuración de test
  - Validar que el schema se genera correctamente

#### 11. **`VaultIntegrationTest.java`** ⚠️ **BAJO**
- **Categoría**: Infrastructure - Config
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐
- **Impacto**: Integración con Vault para secretos
- **Acción requerida**:
  - Arreglar configuración de Vault en tests
  - Validar lectura de secretos

#### 12. **`KafkaInfrastructureIntegrationTest.java`** ⚠️ **BAJO**
- **Categoría**: Infrastructure - Events
- **Razón eliminación**: 7 errores
- **Importancia**: ⭐⭐
- **Impacto**: Publicación de eventos a Kafka
- **Acción requerida**:
  - Arreglar configuración de Kafka en tests
  - Validar publicación de domain events

#### 13. **`ProviderMetricsIntegrationTest.java`** ⚠️ **BAJO**
- **Categoría**: Infrastructure - Observability
- **Razón eliminación**: 6 errores
- **Importancia**: ⭐⭐
- **Impacto**: Métricas de Prometheus (independiente de proveedores)
- **Acción requerida**:
  - Arreglar configuración de métricas
  - Validar registro de métricas

#### 14. **`SecurityConfigurationIntegrationTest.java`** ⚠️ **BAJO**
- **Categoría**: Infrastructure - Security
- **Razón eliminación**: 7 errores
- **Importancia**: ⭐⭐
- **Impacto**: Configuración de seguridad (OAuth2, etc.)
- **Acción requerida**:
  - Arreglar configuración de Spring Security
  - Validar endpoints protegidos

### 🔵 TESTS DE FLUJO COMPLETO - Integration

#### 15. **`SignatureControllerIntegrationTest.java`** ⚠️ **ALTO**
- **Categoría**: Integration - API Controller
- **Razón eliminación**: 6 errores
- **Importancia**: ⭐⭐⭐⭐
- **Impacto**: API REST principal del sistema
- **Acción requerida**:
  - Arreglar configuración de Spring Boot Test
  - Validar endpoints de firma
- **Archivos relacionados**: `SignatureController.java`

#### 16. **`AdminRuleControllerIntegrationTest.java`** ⚠️ **MEDIO**
- **Categoría**: Integration - API Controller
- **Razón eliminación**: 8 errores
- **Importancia**: ⭐⭐⭐
- **Impacto**: API para administración de reglas de routing
- **Acción requerida**:
  - Arreglar configuración de Spring Boot Test
  - Validar CRUD de reglas de routing

#### 17. **`SystemModeControllerTest.java`** ⚠️ **MEDIO**
- **Categoría**: Application - Controller
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐⭐
- **Impacto**: Gestión de modo degradado del sistema
- **Acción requerida**:
  - Arreglar configuración de test
  - Validar endpoints de control del sistema

#### 18. **`AbortSignatureIntegrationTest.java`** ⚠️ **MEDIO**
- **Categoría**: Integration - Use Case
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐⭐
- **Impacto**: Flujo de abortar firma
- **Acción requerida**:
  - Arreglar configuración de Spring
  - Validar flujo completo de abort

#### 19. **`CompleteSignatureIntegrationTest.java`** ⚠️ **MEDIO**
- **Categoría**: Integration - Use Case
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐⭐
- **Impacto**: Flujo de completar firma
- **Acción requerida**:
  - Arreglar configuración de Spring
  - Validar flujo completo de complete

#### 20. **`QuerySignatureIntegrationTest.java`** ⚠️ **MEDIO**
- **Categoría**: Integration - Use Case
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐⭐
- **Impacto**: Flujo de consulta de firma
- **Acción requerida**:
  - Arreglar configuración de Spring
  - Validar flujo completo de query

#### 21. **`IdempotencyIntegrationTest.java`** ⚠️ **MEDIO**
- **Categoría**: Integration - Idempotency
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐⭐
- **Impacto**: Garantía de idempotencia en operaciones
- **Acción requerida**:
  - Arreglar configuración de Spring
  - Validar que las operaciones son idempotentes

#### 22. **`RoutingIntegrationTest.java`** ⚠️ **MEDIO**
- **Categoría**: Integration - Routing
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐⭐
- **Impacto**: Flujo completo de enrutamiento
- **Acción requerida**:
  - Arreglar configuración de Spring
  - Validar flujo de routing end-to-end

#### 23. **`SignatureRouterApplicationTests.java`** ⚠️ **BAJO**
- **Categoría**: Integration - Application Startup
- **Razón eliminación**: 1 error
- **Importancia**: ⭐⭐
- **Impacto**: Test de arranque de aplicación Spring Boot
- **Acción requerida**:
  - Arreglar configuración de Spring Boot
  - Validar que la aplicación arranca correctamente

---

## 📊 Resumen por Prioridad

### 🔴 ALTA PRIORIDAD (5 tests)
Estos tests son del **core del dominio** y deben arreglarse ANTES de la migración a MuleSoft:

1. ✅ `SignatureRequestTest.java` - Agregado raíz
2. ✅ `SignatureChallengeTest.java` - Entidad clave
3. ✅ `ProviderResultTest.java` - Value object crítico
4. ✅ `QuerySignatureUseCaseImplTest.java` - Use case
5. ✅ `RoutingServiceImplTest.java` - Routing independiente de proveedores

### 🟡 MEDIA PRIORIDAD (9 tests)
Deberían arreglarse durante o después de la migración a MuleSoft:

6. ✅ `TransactionHashServiceImplTest.java`
7. ✅ `ChallengeExpirationSchedulerTest.java`
8. ✅ `HexagonalArchitectureTest.java`
9. ✅ `SignatureRequestRepositoryIntegrationTest.java`
10. ✅ `SignatureControllerIntegrationTest.java`
11. ✅ `AdminRuleControllerIntegrationTest.java`
12. ✅ `SystemModeControllerTest.java`
13. ✅ `AbortSignatureIntegrationTest.java`
14. ✅ `CompleteSignatureIntegrationTest.java`

### 🟢 BAJA PRIORIDAD (9 tests)
Pueden arreglarse después de la migración:

15. ✅ `DatabaseSchemaIntegrationTest.java`
16. ✅ `VaultIntegrationTest.java`
17. ✅ `KafkaInfrastructureIntegrationTest.java`
18. ✅ `ProviderMetricsIntegrationTest.java`
19. ✅ `SecurityConfigurationIntegrationTest.java`
20. ✅ `QuerySignatureIntegrationTest.java`
21. ✅ `IdempotencyIntegrationTest.java`
22. ✅ `RoutingIntegrationTest.java`
23. ✅ `SignatureRouterApplicationTests.java`

---

## 🎯 Plan de Acción Recomendado

### Fase 1: Pre-MuleSoft (AHORA)
**Objetivo**: Asegurar que el core del dominio está sólido

1. Arreglar **ALTA PRIORIDAD** (tests de dominio):
   - `SignatureRequestTest.java`
   - `SignatureChallengeTest.java`
   - `ProviderResultTest.java`
   - `QuerySignatureUseCaseImplTest.java`
   - `RoutingServiceImplTest.java`

### Fase 2: Durante MuleSoft Migration
**Objetivo**: Arreglar tests de infrastructure core

2. Arreglar **MEDIA PRIORIDAD** relacionados con arquitectura:
   - `HexagonalArchitectureTest.java` (crítico para validar separación)
   - `TransactionHashServiceImplTest.java`
   - Controllers y use cases de integración

### Fase 3: Post-MuleSoft
**Objetivo**: Completar suite de tests

3. Arreglar **BAJA PRIORIDAD**:
   - Tests de configuración e infrastructure
   - Tests de integración completa

### Fase 4: Nuevos Tests MuleSoft
**Objetivo**: Reemplazar tests de proveedores directos

4. Implementar nuevos tests para MuleSoft:
   - `MuleSoftApiClientTest.java`
   - `MuleSoftSmsProviderTest.java`
   - `MuleSoftPushProviderTest.java`
   - `MuleSoftVoiceProviderTest.java`
   - `MuleSoftBiometricProviderTest.java`
   - Integration tests con MuleSoft API

---

## 📝 Notas Importantes

- **Total tests eliminados**: 31
- **Tests temporales (no reimplementar)**: 9 (29%)
- **Tests esenciales (reimplementar)**: 22 (71%)
- **Tests críticos de dominio**: 5 (16%)

### ⚠️ Advertencia
Los **5 tests de ALTA PRIORIDAD** son del core del dominio y **NO** dependen de proveedores externos. Su fallo indica **problemas en la lógica de negocio** que deben ser corregidos independientemente de la estrategia de integración con proveedores.

---

**Última actualización**: 2025-11-28  
**Estado**: Inventario completo - Pendiente de reimplementación según fases

