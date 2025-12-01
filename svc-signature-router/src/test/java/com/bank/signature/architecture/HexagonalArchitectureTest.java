package com.bank.signature.architecture;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;

/**
 * ArchUnit tests for validating Hexagonal Architecture constraints.
 * 
 * <p>These tests ensure that the architectural boundaries are respected:
 * <ul>
 *   <li>Domain layer has ZERO dependencies on frameworks (Spring, JPA, Jackson, Kafka)</li>
 *   <li>Application layer does NOT depend on Infrastructure adapters</li>
 *   <li>Ports are interfaces (domain contracts)</li>
 *   <li>Adapters implement ports (infrastructure implementations)</li>
 *   <li>Unidirectional dependency flow: Infrastructure → Application → Domain</li>
 * </ul>
 * 
 * <p>If any test fails, it means the architecture has been violated and the build will fail.
 * This prevents architectural degradation over time.
 * 
 * @see <a href="https://www.archunit.org/">ArchUnit Documentation</a>
 * @see <a href="https://alistair.cockburn.us/hexagonal-architecture/">Hexagonal Architecture Pattern</a>
 */
@AnalyzeClasses(packages = "com.bank.signature")
public class HexagonalArchitectureTest {

    /**
     * Rule 1: Domain layer must NOT depend on Infrastructure layer.
     * 
     * Domain layer should be completely isolated from infrastructure concerns.
     * This ensures domain logic remains portable and testable without infrastructure.
     */
    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnInfrastructure =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..infrastructure..");

    /**
     * Rule 2: Domain models must NOT depend on Spring framework.
     * 
     * Domain models (aggregates, entities, value objects) should not use Spring annotations or classes.
     * This ensures domain logic is framework-agnostic.
     * 
     * NOTE: Domain ports may use Spring Data types (Pageable, Page) as these are
     * framework-agnostic interfaces. However, domain models should not depend on Spring.
     * 
     * KNOWN ISSUE: SignatureRequestRepository uses Pageable (Spring Data) - should be refactored
     * to use a domain-specific pagination interface. See Story 10.15 for improvement.
     */
    @ArchTest
    static final ArchRule domainModelsShouldNotDependOnSpring =
        noClasses()
            .that().resideInAPackage("..domain.model..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.springframework..");

    /**
     * Rule 3: Domain layer must NOT depend on JPA/Jakarta Persistence.
     * 
     * Domain models should not have JPA annotations (@Entity, @Table, etc.).
     * JPA entities belong in infrastructure layer, not domain.
     */
    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnJPA =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("javax.persistence..", "jakarta.persistence..");

    /**
     * Rule 4: Domain layer must NOT depend on Jackson (JSON serialization).
     * 
     * Domain models should not have Jackson annotations (@JsonIgnore, etc.).
     * Serialization concerns belong in infrastructure layer.
     */
    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnJackson =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("com.fasterxml.jackson..");

    /**
     * Rule 5: Domain layer must NOT depend on Kafka.
     * 
     * Domain should not know about messaging infrastructure.
     * Event publishing is handled by infrastructure adapters.
     */
    @ArchTest
    static final ArchRule domainLayerShouldNotDependOnKafka =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.apache.kafka..");

    /**
     * Rule 6: Application layer must NOT depend on Infrastructure adapters.
     * 
     * Application layer (use cases) should depend only on domain ports (interfaces),
     * not on infrastructure adapter implementations.
     * This ensures use cases remain testable with mocks.
     * 
     * NOTE: RoutingRuleAuditService is a known exception (TECH DEBT - see TECH-DEBT.md)
     * It's in application.service but accesses JPA repositories directly.
     * TODO: Move to infrastructure.adapter.outbound.audit
     */
    @ArchTest
    static final ArchRule applicationLayerShouldNotDependOnInfrastructureAdapters =
        noClasses()
            .that().resideInAPackage("..application..")
            .and().haveSimpleNameNotContaining("Test") // Exclude test classes
            .and().haveSimpleNameNotContaining("RoutingRuleAuditService") // Known exception
            .should().dependOnClassesThat()
            .resideInAnyPackage("..infrastructure.adapter..");

    /**
     * Rule 7: Ports (domain interfaces) must be interfaces.
     * 
     * All classes in domain.port packages should be interfaces.
     * Ports define contracts, not implementations.
     */
    @ArchTest
    static final ArchRule portsShouldBeInterfaces =
        classes()
            .that().resideInAPackage("..domain.port..")
            .should().beInterfaces();

    /**
     * Rule 8: Adapter classes must implement domain ports.
     * 
     * Infrastructure adapter classes (those ending in "Adapter" or implementing ports) 
     * should implement domain port interfaces. This ensures adapters fulfill domain contracts.
     * 
     * NOTE: Inbound adapters (REST controllers) do not implement ports - they use use cases.
     * NOTE: JPA entities, mappers, and other infrastructure classes are excluded.
     */
    @ArchTest
    static final ArchRule adaptersShouldImplementPorts =
        classes()
            .that().resideInAPackage("..infrastructure.adapter..")
            .and().areNotInterfaces()
            .and().haveSimpleNameEndingWith("Adapter") // Only adapter classes
            .should().implement(
                com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage("..domain.port..")
            );

    /**
     * Rule 9: Domain models must NOT have JPA annotations.
     * 
     * Domain models (aggregates, entities, value objects) should be pure Java classes.
     * JPA annotations belong in infrastructure JPA entities, not domain models.
     */
    @ArchTest
    static final ArchRule domainModelsShouldNotHaveJPAAnnotations =
        noClasses()
            .that().resideInAPackage("..domain.model..")
            .should().beAnnotatedWith("javax.persistence.Entity")
            .orShould().beAnnotatedWith("jakarta.persistence.Entity")
            .orShould().beAnnotatedWith("javax.persistence.Table")
            .orShould().beAnnotatedWith("jakarta.persistence.Table");

    /**
     * Rule 10: Application layer should not directly depend on infrastructure adapters.
     * 
     * Application services should depend on domain ports (interfaces), not infrastructure adapter implementations.
     * This ensures use cases remain testable with mocks.
     * 
     * NOTE: Some application services may need direct access to infrastructure for cross-cutting concerns
     * (e.g., audit logging). These are exceptions and should be documented.
     * 
     * KNOWN ISSUE: RoutingRuleAuditService depends directly on RoutingRuleAuditLogJpaRepository.
     * Should be refactored to use a domain port. See Story 10.15 for improvement.
     */
    @ArchTest
    static final ArchRule applicationServicesShouldNotDependOnAdapters =
        noClasses()
            .that().resideInAPackage("..application.service..")
            .and().haveSimpleNameNotContaining("Audit") // Exception: Audit services may access infrastructure directly
            .should().dependOnClassesThat()
            .resideInAnyPackage("..infrastructure.adapter..");

    /**
     * Rule 11: Domain models should not have Spring annotations.
     * 
     * Domain models should be framework-agnostic.
     * Spring annotations (@Component, @Service, etc.) belong in infrastructure.
     */
    @ArchTest
    static final ArchRule domainModelsShouldNotHaveSpringAnnotations =
        noClasses()
            .that().resideInAPackage("..domain.model..")
            .should().beAnnotatedWith("org.springframework.stereotype.Component")
            .orShould().beAnnotatedWith("org.springframework.stereotype.Service")
            .orShould().beAnnotatedWith("org.springframework.stereotype.Repository");
}

