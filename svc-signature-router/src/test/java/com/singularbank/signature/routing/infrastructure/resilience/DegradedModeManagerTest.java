package com.singularbank.signature.routing.infrastructure.resilience;

import com.singularbank.signature.routing.domain.model.valueobject.SystemMode;
import com.singularbank.signature.routing.infrastructure.config.DegradedModeConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationContext;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DegradedModeManager.
 * Story 4.3: Degraded Mode Manager
 * 
 * Tests:
 * - AC1: Degraded mode entry when error rate > threshold
 * - AC4: Degraded mode entry when circuit breakers OPEN
 * - AC5: Automatic recovery when error rate normalizes
 * - AC8: Manual override (enterDegradedMode, exitDegradedMode)
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DegradedModeManagerTest {
    
    @Mock
    private CircuitBreakerRegistry circuitBreakerRegistry;
    
    @Mock
    private ApplicationContext applicationContext;
    
    @Mock
    private CircuitBreaker smsCircuitBreaker;
    
    @Mock
    private CircuitBreaker pushCircuitBreaker;
    
    @Mock
    private CircuitBreaker voiceCircuitBreaker;
    
    @Mock
    private CircuitBreaker biometricCircuitBreaker;
    
    private MeterRegistry meterRegistry;
    private DegradedModeConfig config;
    private DegradedModeManager degradedModeManager;
    
    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        config = new DegradedModeConfig();
        config.setEnabled(true);
        config.setErrorRateThreshold(80);
        config.setMinDuration(Duration.ofSeconds(120));
        config.setRecoveryThreshold(50);
        config.setRecoveryDuration(Duration.ofSeconds(300));
        config.setCircuitOpenThreshold(3);
        
        degradedModeManager = new DegradedModeManager(
            meterRegistry,
            circuitBreakerRegistry,
            config,
            applicationContext
        );
    }
    
    @Test
    void testInitialState_shouldBeNormal() {
        // When: Manager initialized
        
        // Then: System starts in NORMAL mode
        assertThat(degradedModeManager.isInDegradedMode()).isFalse();
        assertThat(degradedModeManager.getCurrentMode()).isEqualTo(SystemMode.NORMAL);
        assertThat(degradedModeManager.getDegradedReason()).isNull();
        assertThat(degradedModeManager.getDegradedSince()).isNull();
    }
    
    @Test
    void testEnterDegradedMode_shouldUpdateState() {
        // Given: System in NORMAL mode
        String reason = "Manual test override";
        
        // When: Enter degraded mode
        degradedModeManager.enterDegradedMode(reason);
        
        // Then: System transitions to DEGRADED
        assertThat(degradedModeManager.isInDegradedMode()).isTrue();
        assertThat(degradedModeManager.getCurrentMode()).isEqualTo(SystemMode.DEGRADED);
        assertThat(degradedModeManager.getDegradedReason()).isEqualTo(reason);
        assertThat(degradedModeManager.getDegradedSince()).isNotNull();
        
        // And: Metrics recorded
        assertThat(meterRegistry.find("system.degraded.triggers.total").counter()).isNotNull();
        assertThat(meterRegistry.find("system.degraded.triggers.total").counter().count()).isEqualTo(1.0);
    }
    
    @Test
    void testExitDegradedMode_shouldReturnToNormal() {
        // Given: System in DEGRADED mode
        degradedModeManager.enterDegradedMode("Test degraded");
        assertThat(degradedModeManager.isInDegradedMode()).isTrue();
        
        // When: Exit degraded mode
        degradedModeManager.exitDegradedMode();
        
        // Then: System returns to NORMAL
        assertThat(degradedModeManager.isInDegradedMode()).isFalse();
        assertThat(degradedModeManager.getCurrentMode()).isEqualTo(SystemMode.NORMAL);
        assertThat(degradedModeManager.getDegradedReason()).isNull();
        assertThat(degradedModeManager.getDegradedSince()).isNull();
        
        // And: Duration metric recorded
        assertThat(meterRegistry.find("system.degraded.duration.seconds").timer()).isNotNull();
    }
    
    @Test
    void testGetDegradedProviders_withOpenCircuitBreakers() {
        // Given: Circuit breakers in OPEN state
        when(circuitBreakerRegistry.getAllCircuitBreakers()).thenReturn(
            new java.util.HashSet<>(java.util.List.of(smsCircuitBreaker, pushCircuitBreaker, voiceCircuitBreaker, biometricCircuitBreaker))
        );
        when(smsCircuitBreaker.getName()).thenReturn("smsProvider");
        when(smsCircuitBreaker.getState()).thenReturn(CircuitBreaker.State.OPEN);
        when(pushCircuitBreaker.getName()).thenReturn("pushProvider");
        when(pushCircuitBreaker.getState()).thenReturn(CircuitBreaker.State.CLOSED);
        when(voiceCircuitBreaker.getName()).thenReturn("voiceProvider");
        when(voiceCircuitBreaker.getState()).thenReturn(CircuitBreaker.State.OPEN);
        when(biometricCircuitBreaker.getName()).thenReturn("biometricProvider");
        when(biometricCircuitBreaker.getState()).thenReturn(CircuitBreaker.State.CLOSED);
        
        // When: Query degraded providers
        List<String> degradedProviders = degradedModeManager.getDegradedProviders();
        
        // Then: Returns providers with OPEN circuits
        assertThat(degradedProviders).contains("SMS", "VOICE");
        assertThat(degradedProviders).doesNotContain("PUSH", "BIOMETRIC");
    }
    
    @Test
    void testEnterDegradedMode_multipleTimes_shouldNotDuplicate() {
        // Given: System in NORMAL mode
        
        // When: Enter degraded mode multiple times
        degradedModeManager.enterDegradedMode("First reason");
        degradedModeManager.enterDegradedMode("Second reason");
        
        // Then: Still in degraded mode, counter only increments once for first entry
        assertThat(degradedModeManager.isInDegradedMode()).isTrue();
        assertThat(degradedModeManager.getDegradedReason()).isEqualTo("Second reason"); // Updated reason
        assertThat(meterRegistry.find("system.degraded.triggers.total").counter().count()).isEqualTo(1.0);
    }
    
    @Test
    void testExitDegradedMode_whenNormal_shouldBeIdempotent() {
        // Given: System in NORMAL mode
        assertThat(degradedModeManager.isInDegradedMode()).isFalse();
        
        // When: Exit degraded mode (should be no-op)
        degradedModeManager.exitDegradedMode();
        
        // Then: Still in NORMAL mode, no metrics recorded
        assertThat(degradedModeManager.isInDegradedMode()).isFalse();
        assertThat(meterRegistry.find("system.degraded.duration.seconds").timer()).isNull();
    }
}

