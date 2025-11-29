# Workflow: dev-story

**Agente:** Developer (Dev)  
**Comando:** `/bmad:bmm:workflows:dev-story`  
**Estado previo requerido:** Story en estado `ready-for-dev` en `sprint-status.yaml`  
**Resultado:** Story implementada y movida a estado `review`

---

## 🎯 Propósito

Este workflow guía al **Developer** en la implementación completa de una historia técnica (story) que ya ha sido:
1. **Drafteada** por el Scrum Master (`create-story`)
2. **Contextualizada** técnicamente con artefactos y constraints (`story-context`)
3. **Lista para desarrollo** (estado `ready-for-dev`)

El developer implementa el código, tests, y documentación siguiendo estrictamente los **Acceptance Criteria** y el **Definition of Done**.

---

## 📋 Prerrequisitos

Antes de ejecutar este workflow, verifica:

1. ✅ **Story existe en `sprint-status.yaml` con estado `ready-for-dev`**
   - Epic debe estar `contexted` (tech-spec creado)
   - Story debe estar `drafted` (story file creado en `docs/sprint-artifacts/`)
   - Story debe estar `ready-for-dev` (story-context.xml creado)

2. ✅ **Archivos de contexto disponibles:**
   - `docs/sprint-artifacts/{story-key}.md` (story draft con ACs y tasks)
   - `docs/sprint-artifacts/{story-key}.context.xml` (technical context)
   - `docs/sprint-artifacts/tech-spec-epic-{N}.md` (epic tech spec)

3. ✅ **Entorno de desarrollo funcional:**
   - Java 21 instalado
   - Maven configurado
   - Docker Desktop corriendo (si la story requiere Testcontainers)
   - IDE configurado (VS Code / IntelliJ)

4. ✅ **Rama Git limpia:**
   ```powershell
   git status
   # Debe mostrar working tree clean o solo cambios de archivos de documentación BMM
   ```

---

## 🚀 Pasos del Workflow

### **PASO 1: Leer Contexto de la Historia**

**Objetivo:** Comprender completamente la historia antes de empezar a codificar.

**Acciones:**

1. **Leer Story Draft** (`docs/sprint-artifacts/{story-key}.md`)
   - **Acceptance Criteria (ACs):** Criterios de éxito (12 ACs típicamente)
   - **Tasks:** Tareas técnicas descompuestas (8-12 tasks con 40-60 subtasks)
   - **Story Points:** Estimación de esfuerzo (2-8 SP)
   - **Prerequisites:** Stories previas que deben estar `done`
   - **Definition of Done:** Checklist de completitud (15-25 items)

2. **Leer Story Context XML** (`docs/sprint-artifacts/{story-key}.context.xml`)
   - **Documentation Artifacts:** Fragmentos de arquitectura, PRD, epics relevantes
   - **Code Artifacts:** Templates de código, ejemplos, configuraciones
   - **Maven Dependencies:** Dependencias exactas con versiones
   - **Constraints:** Reglas arquitectónicas, tecnológicas, de testing (CRÍTICO seguir)
   - **Interfaces:** Contratos de interfaces/puertos/APIs
   - **Test Ideas:** Casos de test mapeados a ACs

3. **Leer Epic Tech Spec** (`docs/sprint-artifacts/tech-spec-epic-{N}.md`)
   - Contexto épico completo (arquitectura, NFRs, estrategias)
   - Decisiones técnicas de alto nivel

**Checklist PASO 1:**
- [ ] 12 Acceptance Criteria memorizados
- [ ] Constraints críticos identificados (etiquetas CRITICAL/HIGH)
- [ ] Dependencias Maven anotadas
- [ ] Templates de código revisados
- [ ] Test ideas mapeados a ACs

---

### **PASO 2: Crear Rama de Desarrollo**

**Objetivo:** Aislar el trabajo de la historia en una rama Git dedicada.

**Comando:**

```powershell
git checkout -b story/{story-key}

# Ejemplo para Story 9.2:
git checkout -b story/9-2-prometheus-metrics-export
```

**Convención de nombres:**
- Formato: `story/{story-key}`
- Usar guiones medios `-` (NO underscores `_`)
- Lowercase (minúsculas)

**Checklist PASO 2:**
- [ ] Rama creada con nombre correcto
- [ ] `git branch` muestra la rama activa

---

### **PASO 3: Implementar Code Artifacts (Tasks 1-N)**

**Objetivo:** Implementar el código funcional siguiendo los templates y constraints del contexto.

**Metodología TDD (Test-Driven Development):**

1. **RED:** Escribir test que falla (basado en AC)
2. **GREEN:** Implementar código mínimo para pasar test
3. **REFACTOR:** Mejorar código manteniendo tests pasando

**Orden de implementación típico:**

#### **3.1. Crear clases del dominio (domain layer)**
- **Ubicación:** `src/main/java/com/bank/signature/domain/`
- **Patrones:** Aggregate Root, Entity, Value Object (Java 21 records), Domain Exception, Enums
- **Constraints críticos:**
  - PURITY-1: **ZERO** imports de Spring/JPA/Jackson/Kafka en domain
  - DDD-1: Aggregates como únicos puntos de entrada
  - LOMBOK-1: @Builder + @Getter, NO @Setter

**Ejemplo (Story 9.2 - Domain Event):**

```java
// src/main/java/com/bank/signature/domain/model/valueobject/MetricEvent.java
package com.bank.signature.domain.model.valueobject;

import java.time.Instant;

public record MetricEvent(
    String metricName,
    double value,
    java.util.Map<String, String> tags,
    Instant timestamp
) {
    public MetricEvent {
        if (metricName == null || metricName.isBlank()) {
            throw new IllegalArgumentException("Metric name cannot be null or blank");
        }
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }

    public static MetricEvent of(String name, double value, java.util.Map<String, String> tags) {
        return new MetricEvent(name, value, tags, Instant.now());
    }
}
```

#### **3.2. Crear puertos del dominio (domain/port/outbound/)**
- **Ubicación:** `src/main/java/com/bank/signature/domain/port/outbound/`
- **Constraint HEXA-1:** Interfaces puras (NO dependencias de infra)
- **JavaDoc:** Mandatory con ejemplos de uso

**Ejemplo (Story 9.2 - MetricsPort):**

```java
// src/main/java/com/bank/signature/domain/port/outbound/MetricsPort.java
package com.bank.signature.domain.port.outbound;

import com.bank.signature.domain.model.valueobject.MetricEvent;

/**
 * Outbound port for publishing application metrics.
 * 
 * <p>This port abstracts the metrics backend (Prometheus, Micrometer, etc.)
 * from the domain layer following Hexagonal Architecture.
 * 
 * <p>Usage example:
 * <pre>
 * MetricsPort metricsPort = // injected
 * metricsPort.incrementCounter("signature.request.created", 
 *     Map.of("channel", "SMS", "provider", "TWILIO"));
 * </pre>
 */
public interface MetricsPort {
    void incrementCounter(String metricName, java.util.Map<String, String> tags);
    void recordGauge(String metricName, double value, java.util.Map<String, String> tags);
    void recordTimer(String metricName, long durationMs, java.util.Map<String, String> tags);
    void publishEvent(MetricEvent event);
}
```

#### **3.3. Crear adaptadores de infraestructura (infrastructure/adapter/)**
- **Ubicación:** `src/main/java/com/bank/signature/infrastructure/adapter/outbound/metrics/`
- **Annotations:** `@Component`, `@RequiredArgsConstructor`, `@Slf4j`, `@Transactional`
- **Constraint ADAPTER-1:** Implementar domain port, retornar domain models (NEVER infra models)

**Ejemplo (Story 9.2 - Prometheus Adapter):**

```java
// src/main/java/com/bank/signature/infrastructure/adapter/outbound/metrics/PrometheusMetricsAdapter.java
package com.bank.signature.infrastructure.adapter.outbound.metrics;

import com.bank.signature.domain.port.outbound.MetricsPort;
import com.bank.signature.domain.model.valueobject.MetricEvent;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PrometheusMetricsAdapter implements MetricsPort {

    private final MeterRegistry meterRegistry;

    @Override
    public void incrementCounter(String metricName, Map<String, String> tags) {
        try {
            Counter.builder(metricName)
                .tags(convertTags(tags))
                .register(meterRegistry)
                .increment();
            log.debug("Counter incremented: {} tags={}", metricName, tags);
        } catch (Exception e) {
            log.error("Failed to increment counter: {}", metricName, e);
        }
    }

    @Override
    public void recordGauge(String metricName, double value, Map<String, String> tags) {
        try {
            meterRegistry.gauge(metricName, convertTags(tags), value);
            log.debug("Gauge recorded: {} value={} tags={}", metricName, value, tags);
        } catch (Exception e) {
            log.error("Failed to record gauge: {}", metricName, e);
        }
    }

    @Override
    public void recordTimer(String metricName, long durationMs, Map<String, String> tags) {
        try {
            Timer.builder(metricName)
                .tags(convertTags(tags))
                .register(meterRegistry)
                .record(Duration.ofMillis(durationMs));
            log.debug("Timer recorded: {} duration={}ms tags={}", metricName, durationMs, tags);
        } catch (Exception e) {
            log.error("Failed to record timer: {}", metricName, e);
        }
    }

    @Override
    public void publishEvent(MetricEvent event) {
        // Delegado a los métodos específicos según tipo de métrica
        incrementCounter(event.metricName(), event.tags());
    }

    private io.micrometer.core.instrument.Tags convertTags(Map<String, String> tags) {
        return io.micrometer.core.instrument.Tags.of(
            tags.entrySet().stream()
                .map(e -> io.micrometer.core.instrument.Tag.of(e.getKey(), e.getValue()))
                .toList()
        );
    }
}
```

#### **3.4. Crear configuraciones Spring (infrastructure/config/)**
- **Ubicación:** `src/main/java/com/bank/signature/infrastructure/config/`
- **Annotations:** `@Configuration`, `@Bean`, `@ConditionalOnProperty`

**Ejemplo (Story 9.2 - Metrics Config):**

```java
// src/main/java/com/bank/signature/infrastructure/config/MetricsConfig.java
package com.bank.signature.infrastructure.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.config.MeterFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    @Bean
    public MeterFilter commonTagsFilter() {
        return MeterFilter.commonTags(
            "application", "signature-router",
            "environment", System.getProperty("spring.profiles.active", "local")
        );
    }

    @Bean
    public MeterFilter denyHealthCheckMetrics() {
        return MeterFilter.deny(id -> id.getName().startsWith("http.server.requests") 
            && id.getTag("uri").equals("/actuator/health"));
    }
}
```

#### **3.5. Actualizar application.yml (multi-environment)**
- **Ubicación:** `src/main/resources/application.yml` (base config)
- **Ubicación:** `src/main/resources/application-{local/uat/prod}.yml` (env-specific)

**Ejemplo (Story 9.2 - Prometheus Config):**

```yaml
# application.yml (base)
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
      base-path: /actuator
  endpoint:
    prometheus:
      enabled: true
    metrics:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
        step: 10s # Scrape interval
    tags:
      application: ${spring.application.name}
      environment: ${spring.profiles.active}
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
```

**Checklist PASO 3:**
- [ ] Todas las clases del dominio creadas (domain models, exceptions, enums)
- [ ] Puertos del dominio creados (interfaces en domain/port/outbound/)
- [ ] Adaptadores de infraestructura implementan puertos
- [ ] Configuraciones Spring creadas (@Configuration beans)
- [ ] application.yml actualizado con configs multi-environment
- [ ] NO hay imports prohibidos en domain layer (validar con grep)
- [ ] JavaDoc completo en interfaces públicas

---

### **PASO 4: Implementar Unit Tests (TDD)**

**Objetivo:** Validar la lógica de negocio aisladamente (sin Spring, sin Testcontainers).

**Ubicación:** `src/test/java/com/bank/signature/domain/` (domain tests)  
**Framework:** JUnit 5 (puro), Mockito (solo si necesario), AssertJ

**Principios:**
- **FAST:** Cada test < 100ms
- **ISOLATED:** Sin dependencias externas (DB, Kafka, Vault, HTTP)
- **REPEATABLE:** Mismo resultado cada ejecución
- **Coverage target:** > 80% (JaCoCo)

**Ejemplo (Story 9.2 - MetricEvent Unit Test):**

```java
// src/test/java/com/bank/signature/domain/model/valueobject/MetricEventTest.java
package com.bank.signature.domain.model.valueobject;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class MetricEventTest {

    @Test
    void shouldCreateMetricEventWithFactoryMethod() {
        // Given
        String metricName = "signature.request.created";
        double value = 1.0;
        Map<String, String> tags = Map.of("channel", "SMS", "provider", "TWILIO");

        // When
        MetricEvent event = MetricEvent.of(metricName, value, tags);

        // Then
        assertThat(event.metricName()).isEqualTo(metricName);
        assertThat(event.value()).isEqualTo(value);
        assertThat(event.tags()).containsExactlyInAnyOrderEntriesOf(tags);
        assertThat(event.timestamp()).isNotNull();
        assertThat(event.timestamp()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    void shouldRejectNullMetricName() {
        // Given
        Map<String, String> tags = Map.of("key", "value");

        // When & Then
        assertThatThrownBy(() -> new MetricEvent(null, 1.0, tags, Instant.now()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Metric name cannot be null or blank");
    }

    @Test
    void shouldRejectBlankMetricName() {
        // Given
        Map<String, String> tags = Map.of("key", "value");

        // When & Then
        assertThatThrownBy(() -> new MetricEvent("   ", 1.0, tags, Instant.now()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Metric name cannot be null or blank");
    }

    @Test
    void shouldUseCurrentTimestampIfNull() {
        // Given
        Instant before = Instant.now();

        // When
        MetricEvent event = new MetricEvent("test.metric", 1.0, Map.of(), null);

        // Then
        Instant after = Instant.now();
        assertThat(event.timestamp()).isBetween(before, after);
    }
}
```

**Checklist PASO 4:**
- [ ] Tests unitarios creados para todas las clases del dominio
- [ ] Tests cubren casos exitosos (happy path)
- [ ] Tests cubren casos de error (excepciones, validaciones)
- [ ] Tests cubren edge cases (null, empty, límites)
- [ ] Tests nombrados con patrón `should{Behavior}When{Condition}`
- [ ] Assertions con AssertJ (NOT JUnit assertEquals)
- [ ] `mvn test -Dtest=*Test` pasa (SOLO unit tests, NO integration)

---

### **PASO 5: Implementar Integration Tests (Testcontainers)**

**Objetivo:** Validar la integración con infraestructura real (PostgreSQL, Kafka, Vault) usando Docker.

**Ubicación:** `src/test/java/com/bank/signature/infrastructure/`  
**Annotations:** `@SpringBootTest`, `@Testcontainers`, `@Container`, `@Transactional`  
**Framework:** JUnit 5, Spring Boot Test, Testcontainers, AssertJ

**Estructura típica:**

```java
// src/test/java/com/bank/signature/infrastructure/adapter/outbound/metrics/PrometheusMetricsAdapterIntegrationTest.java
package com.bank.signature.infrastructure.adapter.outbound.metrics;

import com.bank.signature.domain.port.outbound.MetricsPort;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PrometheusMetricsAdapterIntegrationTest {

    @Autowired
    private MetricsPort metricsPort;

    @Autowired
    private MeterRegistry meterRegistry;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldIncrementCounterAndExposeInPrometheusEndpoint() {
        // Given
        String metricName = "test.counter.total";
        Map<String, String> tags = Map.of("test", "true");

        // When
        metricsPort.incrementCounter(metricName, tags);
        metricsPort.incrementCounter(metricName, tags); // Increment twice

        // Then
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);
        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(response.getBody()).contains(metricName);
        assertThat(response.getBody()).contains("test=\"true\"");
        assertThat(response.getBody()).contains(" 2.0"); // Counter incremented twice
    }

    @Test
    void shouldRecordGaugeValue() {
        // Given
        String metricName = "test.gauge";
        Map<String, String> tags = Map.of("type", "integration");

        // When
        metricsPort.recordGauge(metricName, 42.5, tags);

        // Then
        double gaugeValue = meterRegistry.get(metricName)
            .tag("type", "integration")
            .gauge()
            .value();
        assertThat(gaugeValue).isEqualTo(42.5);
    }

    @Test
    void shouldRecordTimerDuration() {
        // Given
        String metricName = "test.timer";
        Map<String, String> tags = Map.of("operation", "test");

        // When
        metricsPort.recordTimer(metricName, 150L, tags); // 150ms

        // Then
        long timerCount = meterRegistry.get(metricName)
            .tag("operation", "test")
            .timer()
            .count();
        assertThat(timerCount).isEqualTo(1);
    }

    @Test
    void shouldHandleInvalidMetricNameGracefully() {
        // Given
        String invalidMetricName = null;
        Map<String, String> tags = Map.of();

        // When & Then (no exception thrown, gracefully logged)
        assertThatNoException().isThrownBy(() -> 
            metricsPort.incrementCounter(invalidMetricName, tags)
        );
    }
}
```

**Checklist PASO 5:**
- [ ] Integration tests creados con `@SpringBootTest`
- [ ] Testcontainers configurados si la story requiere (PostgreSQL, Kafka, Vault)
- [ ] Tests validan round-trip completo (write → read)
- [ ] Tests validan casos de error (timeouts, conexión perdida)
- [ ] Tests cubren todos los ACs que requieren infra (usualmente 6-8 de 12 ACs)
- [ ] `mvn verify` pasa (unit + integration tests)

---

### **PASO 6: Implementar ArchUnit Tests (Architecture Validation)**

**Objetivo:** Validar que el código sigue las reglas de Hexagonal Architecture automáticamente.

**Ubicación:** `src/test/java/com/bank/signature/architecture/HexagonalArchitectureTest.java` (MODIFICAR existente)  
**Framework:** ArchUnit

**Ejemplo (Story 9.2 - Metrics Port Purity Test):**

```java
// AÑADIR al archivo HexagonalArchitectureTest.java existente
@Test
void metricsPortShouldNotDependOnInfrastructure() {
    classes()
        .that().resideInAPackage("..domain.port.outbound..")
        .and().haveSimpleNameEndingWith("Port")
        .should().onlyDependOnClassesThat()
            .resideInAnyPackage(
                "..domain..",
                "java..",
                "lombok.."
            )
        .because("Domain ports MUST NOT depend on infrastructure (Hexagonal Architecture)")
        .check(importedClasses);
}

@Test
void metricsAdaptersShouldImplementDomainPorts() {
    classes()
        .that().resideInAPackage("..infrastructure.adapter.outbound.metrics..")
        .and().haveSimpleNameEndingWith("Adapter")
        .should().implement(MetricsPort.class)
        .because("Adapters MUST implement domain ports (Hexagonal Architecture)")
        .check(importedClasses);
}
```

**Checklist PASO 6:**
- [ ] ArchUnit tests añadidos para validar domain purity
- [ ] ArchUnit tests validan que adapters implementan ports
- [ ] ArchUnit tests validan package structure (domain/port/infrastructure)
- [ ] `mvn test -Dtest=HexagonalArchitectureTest` pasa

---

### **PASO 7: Actualizar Documentación**

**Objetivo:** Documentar la implementación para futuros desarrolladores y operaciones.

#### **7.1. Actualizar README.md**

**Sección típica para Story 9.2:**

```markdown
## Observability - Prometheus Metrics

La aplicación exporta métricas en formato Prometheus en el endpoint `/actuator/prometheus`.

### Métricas Disponibles

| Métrica | Tipo | Descripción | Tags |
|---------|------|-------------|------|
| `signature.request.created.total` | Counter | Total de solicitudes de firma creadas | `channel`, `customer_id` |
| `signature.challenge.sent.total` | Counter | Total de desafíos enviados | `provider`, `channel` |
| `signature.challenge.completed.total` | Counter | Total de desafíos completados | `status`, `channel` |
| `provider.call.duration` | Timer | Duración de llamadas a providers | `provider`, `status` |
| `routing.rule.evaluation.duration` | Timer | Duración de evaluación de reglas | `rule_id` |

### Configuración

Ver `application.yml` para configuración de exportación:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: prometheus
  metrics:
    export:
      prometheus:
        enabled: true
        step: 10s
```

### Consultar Métricas Localmente

```bash
curl http://localhost:8080/actuator/prometheus | grep signature
```

### Integración con Grafana

Ver `observability/grafana/dashboards/signature-router-dashboard.json` para dashboard completo.
```

#### **7.2. Actualizar CHANGELOG.md**

**Formato:**

```markdown
## [Unreleased] - Story 9.2: Prometheus Metrics Export

### Added
- **Prometheus Metrics Endpoint:** `/actuator/prometheus` expone 50+ métricas en formato Prometheus
- **MetricsPort Domain Interface:** Abstracción de métricas en domain layer (hexagonal architecture)
- **PrometheusMetricsAdapter:** Implementación con Micrometer MeterRegistry
- **MetricsConfig:** Configuración Spring para TimedAspect, common tags, filters
- **Business Metrics:**
  - `signature.request.created.total` (Counter) - Solicitudes creadas por channel/customer
  - `signature.challenge.sent.total` (Counter) - Desafíos enviados por provider/channel
  - `signature.challenge.completed.total` (Counter) - Desafíos completados por status
  - `provider.call.duration` (Timer) - Latencia de providers (P50/P95/P99)
  - `routing.rule.evaluation.duration` (Timer) - Latencia de routing engine
- **Infrastructure Metrics:**
  - JVM metrics (heap, threads, GC)
  - HTTP metrics (request duration, status codes)
  - Database connection pool (HikariCP)
  - Kafka producer/consumer metrics
- **Integration Tests:** 4 tests validando exportación Prometheus, counter/gauge/timer
- **Documentation:** README section Prometheus Metrics, JavaDoc MetricsPort

### Changed
- **ChallengeServiceImpl:** Integrado MetricsPort para tracking de challenges enviados
- **RoutingEngineServiceImpl:** Integrado MetricsPort para timing de evaluación de reglas
- **application.yml:** Añadida config Prometheus export (step 10s, percentiles 0.5/0.95/0.99)

### Technical Details
- **Dependencies:** micrometer-registry-prometheus (already included via Spring Boot Actuator)
- **Architecture:** Hexagonal - MetricsPort en domain/port/outbound, adapter en infrastructure
- **Coverage:** 18 unit tests + 4 integration tests = 22 tests (>85% coverage)
- **Files Created:** 8 files (MetricsPort, PrometheusMetricsAdapter, MetricsConfig, 4 tests, MetricsEvent VO)
- **Files Modified:** 5 files (ChallengeServiceImpl, RoutingEngineServiceImpl, application.yml, README, CHANGELOG)
```

#### **7.3. Actualizar Story File (Senior Developer Review Section)**

**Ubicación:** `docs/sprint-artifacts/{story-key}.md`  
**Sección:** Añadir al final del archivo

```markdown
---

## 📝 Developer Implementation Summary

**Implemented by:** Dev Agent (BMAD)  
**Implementation Date:** 2025-11-29  
**Status:** ✅ IMPLEMENTED - Ready for Code Review  

### Files Created (8 files)

1. `src/main/java/com/bank/signature/domain/port/outbound/MetricsPort.java` - Domain port interface (4 methods)
2. `src/main/java/com/bank/signature/domain/model/valueobject/MetricEvent.java` - Value object (Java 21 record)
3. `src/main/java/com/bank/signature/infrastructure/adapter/outbound/metrics/PrometheusMetricsAdapter.java` - Prometheus adapter (implements MetricsPort)
4. `src/main/java/com/bank/signature/infrastructure/config/MetricsConfig.java` - Spring config (TimedAspect, MeterFilters)
5. `src/test/java/com/bank/signature/domain/model/valueobject/MetricEventTest.java` - Unit test (4 tests)
6. `src/test/java/com/bank/signature/domain/port/outbound/MetricsPortTest.java` - Port contract test (3 tests)
7. `src/test/java/com/bank/signature/infrastructure/adapter/outbound/metrics/PrometheusMetricsAdapterTest.java` - Unit test (5 tests)
8. `src/test/java/com/bank/signature/infrastructure/adapter/outbound/metrics/PrometheusMetricsAdapterIntegrationTest.java` - Integration test (4 tests)

### Files Modified (5 files)

1. `src/main/java/com/bank/signature/application/service/ChallengeServiceImpl.java` - Injected MetricsPort, tracking challenge.sent
2. `src/main/java/com/bank/signature/application/service/RoutingEngineServiceImpl.java` - Injected MetricsPort, timing rule evaluation
3. `src/main/resources/application.yml` - Added Prometheus export config
4. `README.md` - Added "Observability - Prometheus Metrics" section (50 lines)
5. `CHANGELOG.md` - Added Story 9.2 entry (80 lines)

### Test Execution Results

```bash
mvn test -Dtest=*Test
# [INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0 (Unit tests)

mvn test -Dtest=*IntegrationTest
# [INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 (Integration tests)

mvn test -Dtest=HexagonalArchitectureTest
# [INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0 (ArchUnit validation)

mvn verify
# [INFO] Tests run: 29, Failures: 0, Errors: 0, Skipped: 0
# [INFO] JaCoCo Coverage: 87.3% (target >80% ✅)
```

### Acceptance Criteria Validation

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| AC1 | Prometheus endpoint `/actuator/prometheus` accessible | ✅ PASS | Integration test `shouldExposePrometheusEndpoint()` |
| AC2 | MetricsPort domain interface created | ✅ PASS | `MetricsPort.java` en domain/port/outbound/ |
| AC3 | PrometheusMetricsAdapter implements MetricsPort | ✅ PASS | ArchUnit test + adapter code |
| AC4 | Counter metrics incremented | ✅ PASS | Integration test `shouldIncrementCounterAndExposeInPrometheusEndpoint()` |
| AC5 | Gauge metrics recorded | ✅ PASS | Integration test `shouldRecordGaugeValue()` |
| AC6 | Timer metrics recorded | ✅ PASS | Integration test `shouldRecordTimerDuration()` |
| AC7 | ChallengeServiceImpl integrated | ✅ PASS | `metricsPort.incrementCounter("signature.challenge.sent.total")` |
| AC8 | RoutingEngineServiceImpl integrated | ✅ PASS | `metricsPort.recordTimer("routing.rule.evaluation.duration")` |
| AC9 | application.yml configured | ✅ PASS | `management.metrics.export.prometheus.enabled=true` |
| AC10 | Unit tests (>80% coverage) | ✅ PASS | JaCoCo report 87.3% |
| AC11 | Integration tests (Prometheus endpoint) | ✅ PASS | 4 integration tests |
| AC12 | Documentation updated | ✅ PASS | README + CHANGELOG + JavaDoc |

**Overall Acceptance Criteria:** 12/12 PASS (100%)

### Definition of Done Checklist

- [x] All 12 Acceptance Criteria validated
- [x] Unit tests written and passing (16 tests)
- [x] Integration tests written and passing (4 tests)
- [x] ArchUnit tests passing (domain purity validated)
- [x] Test coverage > 80% (JaCoCo: 87.3%)
- [x] `mvn clean verify` passing locally
- [x] No SonarQube critical/major issues (assumed clean for MVP)
- [x] JavaDoc complete on public interfaces (MetricsPort)
- [x] README.md updated (Observability section)
- [x] CHANGELOG.md updated (Story 9.2 entry)
- [x] No console errors in application startup
- [x] No regressions in existing tests (all 180+ tests passing)
- [x] Code follows Hexagonal Architecture (ArchUnit validated)
- [x] Multi-environment config tested (local profile)

**Status:** ✅ READY FOR CODE REVIEW

---

## 🔍 Senior Developer Review

**Reviewer:** [Pending]  
**Review Date:** [Pending]  
**Status:** [Pending Review]  

<!-- Code review findings will be added here -->
```

**Checklist PASO 7:**
- [ ] README.md actualizado con sección de la feature
- [ ] CHANGELOG.md actualizado con entry detallado (Added/Changed/Technical Details)
- [ ] Story file actualizado con "Developer Implementation Summary"
- [ ] JavaDoc completo en interfaces públicas
- [ ] Commits descriptivos (`git log --oneline`)

---

### **PASO 8: Ejecutar Suite Completa de Tests**

**Objetivo:** Validar que la implementación NO rompe nada existente (regression testing).

**Comandos:**

```powershell
# 1. Clean build
mvn clean

# 2. Compile
mvn compile
# Debe mostrar: BUILD SUCCESS

# 3. Unit tests ONLY
mvn test -Dtest=*Test
# Debe mostrar: Tests run: X, Failures: 0, Errors: 0

# 4. Integration tests ONLY
mvn test -Dtest=*IntegrationTest
# Debe mostrar: Tests run: Y, Failures: 0, Errors: 0

# 5. ArchUnit tests
mvn test -Dtest=HexagonalArchitectureTest
# Debe mostrar: Tests run: Z, Failures: 0, Errors: 0

# 6. ALL tests + JaCoCo coverage report
mvn verify
# Debe mostrar: 
#   - Tests run: TOTAL, Failures: 0, Errors: 0
#   - JaCoCo Coverage Report: target/site/jacoco/index.html
#   - BUILD SUCCESS

# 7. Verificar coverage
# Abrir: target/site/jacoco/index.html
# Validar: Coverage > 80% (línea verde en JaCoCo)
```

**Checklist PASO 8:**
- [ ] `mvn clean compile` SUCCESS
- [ ] `mvn test` SUCCESS (ZERO failures)
- [ ] `mvn verify` SUCCESS (unit + integration + coverage)
- [ ] JaCoCo Coverage > 80% (validar en HTML report)
- [ ] NO warnings críticos en console output

---

### **PASO 9: Verificar Application Startup**

**Objetivo:** Validar que la aplicación inicia sin errores con Docker Compose.

**Comandos:**

```powershell
# 1. Iniciar infraestructura Docker
docker-compose up -d postgres kafka zookeeper schema-registry vault

# 2. Esperar healthchecks (30 segundos)
Start-Sleep -Seconds 30

# 3. Verificar servicios UP
docker-compose ps
# Todos los servicios deben mostrar "healthy" o "Up"

# 4. Iniciar aplicación Spring Boot
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Validar console output:
# ✅ NO debe mostrar:
#    - APPLICATION FAILED TO START
#    - BeanCreationException
#    - Connection refused
#    - NullPointerException
# ✅ DEBE mostrar:
#    - Started SignatureRouterApplication in X.XXX seconds
#    - Tomcat started on port(s): 8080 (http)
#    - Vault status: UP
#    - PostgreSQL status: UP
#    - Kafka status: UP
```

**Checklist PASO 9:**
- [ ] Docker Compose services UP (postgres, kafka, vault healthy)
- [ ] Application startup SUCCESS
- [ ] NO errors en console log
- [ ] Actuator health endpoint UP: `curl http://localhost:8080/actuator/health`
- [ ] Prometheus endpoint accessible: `curl http://localhost:8080/actuator/prometheus`

---

### **PASO 10: Validar Feature Funcionalmente (Manual Testing)**

**Objetivo:** Probar la feature implementada end-to-end manualmente (smoke test).

**Ejemplo para Story 9.2 (Prometheus Metrics):**

```powershell
# 1. Verificar Prometheus endpoint
curl http://localhost:8080/actuator/prometheus | Select-String "signature"

# Output esperado:
# signature_request_created_total{channel="SMS",customer_id="CUST123"} 5.0
# signature_challenge_sent_total{provider="TWILIO",channel="SMS"} 3.0
# provider_call_duration_seconds_count{provider="TWILIO",status="SUCCESS"} 3.0
# provider_call_duration_seconds_sum{provider="TWILIO",status="SUCCESS"} 0.456

# 2. Crear signature request via Postman/cURL
curl -X POST http://localhost:8080/api/v1/signature-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customerId": "CUST123",
    "amount": {"value": 100.00, "currency": "USD"},
    "transactionContext": {...}
  }'

# 3. Verificar métrica incrementada
curl http://localhost:8080/actuator/prometheus | Select-String "signature_request_created_total"

# Output esperado (counter incrementado):
# signature_request_created_total{channel="SMS",customer_id="CUST123"} 6.0
```

**Checklist PASO 10:**
- [ ] Feature funciona correctamente end-to-end
- [ ] Métricas/logs/outputs esperados aparecen
- [ ] NO errors en application log
- [ ] Happy path validado
- [ ] Al menos 1 error case validado (ej: invalid input → 400 Bad Request)

---

### **PASO 11: Commit & Push a Rama**

**Objetivo:** Guardar el trabajo en Git de forma organizada y atómica.

**Comandos:**

```powershell
# 1. Ver cambios
git status

# 2. Añadir archivos NUEVOS creados
git add src/main/java/com/bank/signature/domain/port/outbound/MetricsPort.java
git add src/main/java/com/bank/signature/infrastructure/adapter/outbound/metrics/PrometheusMetricsAdapter.java
# ... (añadir todos los archivos nuevos uno a uno)

# 3. Añadir archivos MODIFICADOS
git add src/main/java/com/bank/signature/application/service/ChallengeServiceImpl.java
git add src/main/resources/application.yml
git add README.md
git add CHANGELOG.md
git add docs/sprint-artifacts/9-2-prometheus-metrics-export.md

# 4. Verificar archivos staged
git status

# 5. Commit con mensaje descriptivo
git commit -m "feat: Story 9.2 - Prometheus Metrics Export

- Add MetricsPort domain interface (hexagonal architecture)
- Add PrometheusMetricsAdapter with Micrometer MeterRegistry
- Add MetricsConfig for TimedAspect and common tags
- Integrate MetricsPort in ChallengeServiceImpl (challenge.sent counter)
- Integrate MetricsPort in RoutingEngineServiceImpl (rule.evaluation timer)
- Add 16 unit tests + 4 integration tests (JaCoCo coverage 87.3%)
- Add ArchUnit validation for domain purity (MetricsPort)
- Update application.yml with Prometheus export config
- Update README.md with Observability section
- Update CHANGELOG.md with Story 9.2 entry

All 12 Acceptance Criteria validated.
Test execution: mvn verify - 29 tests passing, 0 failures.

Story Points: 5 SP
Status: ready-for-review"

# 6. Push a rama remota
git push origin story/9-2-prometheus-metrics-export
```

**Convenciones de mensajes de commit:**
- **Formato:** `feat|fix|refactor|test|docs: <descripción corta>`
- **Cuerpo:** Bullet list de cambios principales
- **Footer:** Story Points, Status, Test results

**Checklist PASO 11:**
- [ ] `git status` muestra SOLO archivos relevantes a la story
- [ ] Commit message descriptivo con prefijo `feat:`
- [ ] Commit incluye resumen de cambios (bullet list)
- [ ] Push exitoso a origin
- [ ] Rama visible en GitHub: `git branch -r | grep story/`

---

### **PASO 12: Actualizar Sprint Status (YAML)**

**Objetivo:** Actualizar `sprint-status.yaml` para mover la story de `ready-for-dev` → `review`.

**Archivo:** `docs/sprint-artifacts/sprint-status.yaml`

**Cambio:**

```yaml
# ANTES:
9-2-prometheus-metrics-export: ready-for-dev # 📝 NEXT - 50+ metrics for SLO tracking (5 SP, 1 week)

# DESPUÉS:
9-2-prometheus-metrics-export: review # ✅ IMPLEMENTED (2025-11-29) - Ready for code review (5 SP, 87% coverage, 29 tests)
```

**Comandos:**

```powershell
# 1. Editar archivo
code docs/sprint-artifacts/sprint-status.yaml

# 2. Commit cambio
git add docs/sprint-artifacts/sprint-status.yaml
git commit -m "chore: Move Story 9.2 to review status"
git push origin story/9-2-prometheus-metrics-export
```

**Checklist PASO 12:**
- [ ] `sprint-status.yaml` actualizado
- [ ] Story status cambiado a `review`
- [ ] Comentario incluye fecha de implementación, coverage, tests
- [ ] Cambio committed y pushed

---

### **PASO 13: Actualizar Workflow Status (BMM)**

**Objetivo:** Registrar la ejecución del workflow `dev-story` en `bmm-workflow-status.yaml`.

**Archivo:** `docs/bmm-workflow-status.yaml`

**Añadir nueva entrada:**

```yaml
      - id: "dev-story-9.2"
        name: "Dev Story 9.2 (JIT)"
        agent: "dev"
        command: "/bmad:bmm:workflows:dev-story"
        status: "IMPLEMENTED"
        output: "Story 9.2 implemented: Prometheus Metrics Export"
        completed_date: "2025-11-29"
        story_id: "9.2"
        story_key: "9-2-prometheus-metrics-export"
        summary: "Complete implementation: MetricsPort domain interface, PrometheusMetricsAdapter, MetricsConfig, integration with ChallengeServiceImpl + RoutingEngineServiceImpl, 29 tests (87% coverage), documentation updated"
        sprint_status_updated: "9-2-prometheus-metrics-export: ready-for-dev → review"
        files_created: 8
        files_modified: 5
        implementation_highlights:
          - "MetricsPort domain interface (4 methods: incrementCounter, recordGauge, recordTimer, publishEvent)"
          - "PrometheusMetricsAdapter with Micrometer MeterRegistry (implements MetricsPort)"
          - "MetricsConfig Spring configuration (TimedAspect, common tags, MeterFilters)"
          - "MetricEvent value object (Java 21 record with compact constructor validation)"
          - "Integration ChallengeServiceImpl: metricsPort.incrementCounter(signature.challenge.sent.total)"
          - "Integration RoutingEngineServiceImpl: metricsPort.recordTimer(routing.rule.evaluation.duration)"
          - "Application.yml: Prometheus export enabled (step 10s, percentiles 0.5/0.95/0.99)"
          - "16 unit tests + 4 integration tests + ArchUnit validation (total 29 tests)"
          - "JaCoCo Coverage: 87.3% (target >80% ✅)"
          - "README.md: Observability - Prometheus Metrics section (50 lines)"
          - "CHANGELOG.md: Story 9.2 entry (80 lines)"
        test_results:
          - "Unit Tests: 16 tests PASS (MetricEvent, MetricsPort contract, PrometheusMetricsAdapter)"
          - "Integration Tests: 4 tests PASS (Prometheus endpoint, counter/gauge/timer)"
          - "ArchUnit Tests: 9 tests PASS (domain purity, adapter contract, package structure)"
          - "Total: 29 tests passing, 0 failures"
          - "Coverage: 87.3% (JaCoCo HTML report: target/site/jacoco/index.html)"
```

**Checklist PASO 13:**
- [ ] `bmm-workflow-status.yaml` actualizado con entrada `dev-story-9.2`
- [ ] Summary incluye highlights principales
- [ ] Test results documentados
- [ ] Files created/modified count correcto
- [ ] Committed y pushed

---

## ✅ Criterios de Éxito del Workflow

El workflow `dev-story` se considera **EXITOSO** cuando:

1. ✅ **12/12 Acceptance Criteria validados** (100%)
2. ✅ **Definition of Done checklist completo** (15-25 items)
3. ✅ **Tests pasando:**
   - Unit tests: > 15 tests
   - Integration tests: > 4 tests
   - ArchUnit tests: domain purity validated
   - `mvn verify` SUCCESS
4. ✅ **Coverage > 80%** (JaCoCo report)
5. ✅ **Application startup SUCCESS** (Docker Compose + Spring Boot)
6. ✅ **Feature funciona end-to-end** (manual smoke test)
7. ✅ **Documentación actualizada:**
   - README.md (feature section)
   - CHANGELOG.md (story entry)
   - Story file (implementation summary)
8. ✅ **Git workflow completo:**
   - Rama `story/{story-key}` creada
   - Commits atómicos y descriptivos
   - Push a origin
9. ✅ **Sprint status actualizado:** `ready-for-dev` → `review`
10. ✅ **BMM workflow status actualizado:** Entry `dev-story-{N}` añadida

---

## 🚨 Troubleshooting

### **Problema 1: Tests fallan con "BeanCreationException"**

**Causa:** Configuración Spring incorrecta (missing @Component, missing properties, circular dependency)

**Solución:**
1. Verificar que todas las clases tienen anotaciones correctas (`@Component`, `@Configuration`, `@Service`)
2. Verificar `application.yml` y `application-test.yml` tienen todas las properties requeridas
3. Ejecutar `mvn clean compile` para regenerar clases
4. Revisar stack trace completo para identificar bean problemático

### **Problema 2: Testcontainers falla con "Could not start container"**

**Causa:** Docker Desktop no corriendo, puerto ocupado, imagen no disponible

**Solución:**
1. Verificar Docker Desktop está corriendo: `docker ps`
2. Verificar puerto libre: `netstat -ano | findstr "5432"` (PostgreSQL)
3. Limpiar containers: `docker-compose down -v`
4. Reiniciar Docker Desktop

### **Problema 3: Coverage < 80%**

**Causa:** Tests insuficientes, clases no cubiertas

**Solución:**
1. Ejecutar `mvn jacoco:report`
2. Abrir `target/site/jacoco/index.html`
3. Identificar clases con coverage bajo (rojas)
4. Añadir tests para esas clases
5. Re-ejecutar `mvn verify`

### **Problema 4: ArchUnit tests fallan "Domain purity violated"**

**Causa:** Imports prohibidos en domain layer (Spring, JPA, Jackson, Kafka)

**Solución:**
1. Revisar stack trace de ArchUnit para identificar clase problemática
2. Buscar imports prohibidos: `grep -r "import org.springframework" src/main/java/com/bank/signature/domain/`
3. Refactorizar para eliminar dependencia de infra
4. Re-ejecutar ArchUnit tests

### **Problema 5: Application no inicia "Vault connection refused"**

**Causa:** Vault Docker container no está corriendo

**Solución:**
1. Iniciar Vault: `docker-compose up -d vault`
2. Esperar healthcheck: `docker-compose ps vault` (debe mostrar "healthy")
3. Verificar logs: `docker-compose logs vault`
4. Reiniciar aplicación

---

## 📦 Outputs del Workflow

Al finalizar el workflow `dev-story`, se generan los siguientes artefactos:

1. **Código fuente:**
   - Clases del dominio (domain models, exceptions, enums)
   - Puertos del dominio (domain/port/outbound/)
   - Adaptadores de infraestructura (infrastructure/adapter/)
   - Configuraciones Spring (infrastructure/config/)

2. **Tests:**
   - Unit tests (src/test/java/.../domain/)
   - Integration tests (src/test/java/.../infrastructure/)
   - ArchUnit tests (src/test/java/.../architecture/)

3. **Configuración:**
   - application.yml (base config)
   - application-{local/uat/prod}.yml (env-specific)
   - pom.xml (Maven dependencies si se añadieron nuevas)

4. **Documentación:**
   - README.md (feature section)
   - CHANGELOG.md (story entry)
   - Story file (developer implementation summary)

5. **Git:**
   - Rama `story/{story-key}`
   - Commits atómicos
   - Push a origin

6. **Tracking:**
   - `sprint-status.yaml` actualizado (story → `review`)
   - `bmm-workflow-status.yaml` actualizado (workflow entry)

---

## 🔄 Próximo Workflow

Después de completar `dev-story`, el siguiente workflow es:

**`/bmad:bmm:workflows:code-review`**

- **Agente:** Senior Developer (Code Review AI)
- **Input:** Story en estado `review`
- **Output:** Code review report con findings (critical/high/medium/low)
- **Resultado:** Story movida a `done` (si APPROVED) o devuelta a `ready-for-dev` (si REJECTED)

---

## 📚 Referencias

- **Hexagonal Architecture:** `docs/architecture/02-hexagonal-structure.md`
- **Testing Strategy:** `docs/TESTING-GUIDE.md`
- **Epic Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-{N}.md`
- **Story Draft:** `docs/sprint-artifacts/{story-key}.md`
- **Story Context:** `docs/sprint-artifacts/{story-key}.context.xml`
- **Sprint Status:** `docs/sprint-artifacts/sprint-status.yaml`
- **BMM Workflow Status:** `docs/bmm-workflow-status.yaml`

---

## ✨ Tips para Developers

1. **Leer SIEMPRE el story context ANTES de codificar** (especialmente constraints CRITICAL/HIGH)
2. **Seguir TDD (Test-Driven Development):** RED → GREEN → REFACTOR
3. **Domain purity es NON-NEGOTIABLE:** ArchUnit validará automáticamente
4. **Commits atómicos:** 1 commit por task completado (NO 1 commit giant al final)
5. **Tests > Coverage number:** Prefiere 20 tests pequeños y específicos sobre 5 tests genéricos
6. **Multi-environment desde Day 1:** Siempre crear `application-{local/uat/prod}.yml`
7. **JavaDoc en interfaces públicas:** Futuro tú agradecerá la documentación
8. **Smoke test manual SIEMPRE:** No confiar solo en tests automatizados
9. **Docker Compose healthchecks:** Esperar 30s antes de iniciar Spring Boot
10. **Coverage reports:** Revisar HTML (NO solo el porcentaje agregado)

---

**Última actualización:** 2025-11-29  
**Versión:** 1.0  
**Mantenedor:** BMAD Team

