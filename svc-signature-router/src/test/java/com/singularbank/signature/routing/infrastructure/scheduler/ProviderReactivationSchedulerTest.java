package com.singularbank.signature.routing.infrastructure.scheduler;

import com.singularbank.signature.routing.domain.event.ProviderReactivated;
import com.singularbank.signature.routing.domain.model.valueobject.HealthStatus;
import com.singularbank.signature.routing.domain.model.valueobject.ProviderType;
import com.singularbank.signature.routing.domain.port.outbound.EventPublisher;
import com.singularbank.signature.routing.domain.port.outbound.SignatureProviderPort;
import com.singularbank.signature.routing.infrastructure.resilience.DegradedModeManager;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProviderReactivationScheduler.
 * Story 4-5: Automatic Provider Reactivation
 * 
 * @since Story 4-5
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProviderReactivationScheduler Unit Tests")
class ProviderReactivationSchedulerTest {
    
    @Mock
    private DegradedModeManager degradedModeManager;
    
    @Mock
    private SignatureProviderPort signatureProviderAdapter;
    
    @Mock
    private EventPublisher eventPublisher;
    
    private MeterRegistry meterRegistry;
    private ProviderReactivationScheduler scheduler;
    
    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        scheduler = new ProviderReactivationScheduler(
            degradedModeManager,
            signatureProviderAdapter,
            eventPublisher,
            meterRegistry
        );
    }
    
    @Test
    @DisplayName("Should skip check when no degraded providers")
    void testNoDegradedProviders() {
        // Given
        when(degradedModeManager.getDegradedProviders()).thenReturn(List.of());
        
        // When
        scheduler.checkAndReactivateDegradedProviders();
        
        // Then
        verify(signatureProviderAdapter, never()).checkHealth(any());
        verify(degradedModeManager, never()).attemptReactivation(anyString());
    }
    
    @Test
    @DisplayName("Should reactivate provider when health check passes")
    void testSuccessfulReactivation() {
        // Given - SMS provider is degraded
        when(degradedModeManager.getDegradedProviders()).thenReturn(List.of("SMS"));
        
        // Health check passes
        HealthStatus healthyStatus = HealthStatus.up("Provider responding normally");
        when(signatureProviderAdapter.checkHealth(ProviderType.SMS)).thenReturn(healthyStatus);
        
        // Reactivation succeeds
        when(degradedModeManager.attemptReactivation("SMS")).thenReturn(true);
        
        // When
        scheduler.checkAndReactivateDegradedProviders();
        
        // Then - verify health check called
        verify(signatureProviderAdapter).checkHealth(ProviderType.SMS);
        
        // Verify reactivation attempted
        verify(degradedModeManager).attemptReactivation("SMS");
        
        // Verify metrics
        assertThat(meterRegistry.counter("provider.reactivations.total", "provider", "SMS").count())
            .isEqualTo(1.0);
        assertThat(meterRegistry.counter("provider.reactivation.attempts.total", 
            "provider", "SMS", "result", "success").count())
            .isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("Should NOT reactivate when health check fails")
    void testReactivationFailedHealthCheck() {
        // Given - PUSH provider is degraded
        when(degradedModeManager.getDegradedProviders()).thenReturn(List.of("PUSH"));
        
        // Health check fails
        HealthStatus unhealthyStatus = HealthStatus.down("Provider still unavailable");
        when(signatureProviderAdapter.checkHealth(ProviderType.PUSH)).thenReturn(unhealthyStatus);
        
        // When
        scheduler.checkAndReactivateDegradedProviders();
        
        // Then - verify health check called
        verify(signatureProviderAdapter).checkHealth(ProviderType.PUSH);
        
        // Verify reactivation NOT attempted (health check failed)
        verify(degradedModeManager, never()).attemptReactivation("PUSH");
        
        // Verify failure metric
        assertThat(meterRegistry.counter("provider.reactivation.attempts.total", 
            "provider", "PUSH", "result", "failure").count())
            .isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("Should check multiple degraded providers")
    void testMultipleDegradedProviders() {
        // Given - SMS and VOICE are degraded
        when(degradedModeManager.getDegradedProviders()).thenReturn(List.of("SMS", "VOICE"));
        
        // SMS health check passes
        when(signatureProviderAdapter.checkHealth(ProviderType.SMS))
            .thenReturn(HealthStatus.up("SMS healthy"));
        when(degradedModeManager.attemptReactivation("SMS")).thenReturn(true);
        
        // VOICE health check fails
        when(signatureProviderAdapter.checkHealth(ProviderType.VOICE))
            .thenReturn(HealthStatus.down("VOICE still down"));
        
        // When
        scheduler.checkAndReactivateDegradedProviders();
        
        // Then - both checked
        verify(signatureProviderAdapter).checkHealth(ProviderType.SMS);
        verify(signatureProviderAdapter).checkHealth(ProviderType.VOICE);
        
        // SMS reactivated, VOICE not
        verify(degradedModeManager).attemptReactivation("SMS");
        verify(degradedModeManager, never()).attemptReactivation("VOICE");
    }
    
    @Test
    @DisplayName("Should handle reactivation manager returning false")
    void testReactivationManagerReturnsFalse() {
        // Given
        when(degradedModeManager.getDegradedProviders()).thenReturn(List.of("SMS"));
        when(signatureProviderAdapter.checkHealth(ProviderType.SMS))
            .thenReturn(HealthStatus.up("Healthy"));
        
        // Manager returns false (circuit not in expected state)
        when(degradedModeManager.attemptReactivation("SMS")).thenReturn(false);
        
        // When
        scheduler.checkAndReactivateDegradedProviders();
        
        // Then - failure metric recorded
        assertThat(meterRegistry.counter("provider.reactivation.attempts.total", 
            "provider", "SMS", "result", "failure").count())
            .isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("Should handle invalid provider name gracefully")
    void testInvalidProviderName() {
        // Given - invalid provider name
        when(degradedModeManager.getDegradedProviders()).thenReturn(List.of("INVALID_PROVIDER"));
        
        // When - should not throw
        assertThatCode(() -> scheduler.checkAndReactivateDegradedProviders())
            .doesNotThrowAnyException();
    }
    
    @Test
    @DisplayName("Should handle exception during health check gracefully")
    void testHealthCheckException() {
        // Given
        when(degradedModeManager.getDegradedProviders()).thenReturn(List.of("SMS"));
        when(signatureProviderAdapter.checkHealth(ProviderType.SMS))
            .thenThrow(new RuntimeException("Network error"));
        
        // When - should not throw
        assertThatCode(() -> scheduler.checkAndReactivateDegradedProviders())
            .doesNotThrowAnyException();
        
        // Then - failure metric recorded
        assertThat(meterRegistry.counter("provider.reactivation.attempts.total", 
            "provider", "SMS", "result", "failure").count())
            .isEqualTo(1.0);
    }
}

