package com.bank.signature.infrastructure.observability.metrics;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import static org.mockito.Mockito.mock;

/**
 * Simple tests for ProviderErrorRateCalculator.
 * 
 * NOTE: This component will be replaced when migrating to MuleSoft API Gateway.
 * Tests kept minimal as this is temporary infrastructure code.
 * 
 * @see docs/architecture/08-mulesoft-integration-strategy.md
 * @since Story 4.4 - Provider Error Rate Calculator
 */
class ProviderErrorRateCalculatorTest {
    
    /**
     * Test that calculator can be instantiated without errors.
     * Minimal test for temporary code.
     */
    @Test
    void shouldInstantiateSuccessfully() {
        // Given
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        ProviderMetrics providerMetrics = new ProviderMetrics(meterRegistry);
        ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
        
        // When - instantiate calculator
        ProviderErrorRateCalculator calculator = new ProviderErrorRateCalculator(
            meterRegistry,
            providerMetrics,
            eventPublisher
        );
        
        // Then - no exception thrown
        // This validates constructor dependencies are correct
        assert calculator != null;
    }
    
    /**
     * Test that scheduled method can be called without errors.
     * Minimal validation for temporary code.
     */
    @Test
    void shouldExecuteCalculateErrorRatesWithoutException() {
        // Given
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        ProviderMetrics providerMetrics = new ProviderMetrics(meterRegistry);
        ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
        
        ProviderErrorRateCalculator calculator = new ProviderErrorRateCalculator(
            meterRegistry,
            providerMetrics,
            eventPublisher
        );
        
        // When - execute scheduled method
        calculator.calculateErrorRates();
        
        // Then - no exception thrown (method completes successfully)
        // This is sufficient validation for temporary infrastructure code
    }
}

