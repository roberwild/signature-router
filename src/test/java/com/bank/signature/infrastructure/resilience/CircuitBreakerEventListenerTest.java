package com.bank.signature.infrastructure.resilience;

import com.bank.signature.domain.event.*;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.port.outbound.EventPublisher;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnResetEvent;
import io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnStateTransitionEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.slf4j.MDC;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CircuitBreakerEventListener.
 * 
 * <p>Tests verify that circuit breaker state transitions correctly trigger domain event publishing:
 * <ul>
 * <li>CLOSED → OPEN: publishCircuitBreakerOpened</li>
 * <li>OPEN → HALF_OPEN: publishCircuitBreakerHalfOpen</li>
 * <li>HALF_OPEN → CLOSED: publishCircuitBreakerClosed</li>
 * <li>HALF_OPEN → OPEN: publishCircuitBreakerFailedRecovery</li>
 * <li>Manual reset: publishCircuitBreakerReset</li>
 * </ul>
 * 
 * @since Story 4-8 - Circuit Breaker Event Publishing
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CircuitBreakerEventListenerTest {
    
    @Mock
    private EventPublisher eventPublisher;
    
    @Mock
    private io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry circuitBreakerRegistry;
    
    @Mock
    private CircuitBreakerOnStateTransitionEvent stateTransitionEvent;
    
    @Mock
    private CircuitBreakerOnResetEvent resetEvent;
    
    @Mock
    private CircuitBreaker circuitBreaker;
    
    @Mock
    private CircuitBreaker.Metrics metrics;
    
    @InjectMocks
    private CircuitBreakerEventListener listener;
    
    @BeforeEach
    void setUp() {
        // Setup common mocks
        when(circuitBreakerRegistry.circuitBreaker(anyString())).thenReturn(circuitBreaker);
        when(circuitBreaker.getMetrics()).thenReturn(metrics);
        when(metrics.getFailureRate()).thenReturn(65.5f);
        when(metrics.getSlowCallRate()).thenReturn(12.3f);
        when(metrics.getNumberOfBufferedCalls()).thenReturn(10);
        when(metrics.getNumberOfFailedCalls()).thenReturn(7);
        when(metrics.getNumberOfSuccessfulCalls()).thenReturn(3);
        when(metrics.getNumberOfSlowCalls()).thenReturn(1);
        
        // Setup MDC traceId
        MDC.put("traceId", "test-trace-123");
    }
    
    @Test
    void shouldPublishOpenedEventWhenCircuitBreakerOpens() {
        // Given
        when(stateTransitionEvent.getCircuitBreakerName()).thenReturn("smsProvider");
        CircuitBreaker.StateTransition transition = mock(CircuitBreaker.StateTransition.class);
        when(transition.getFromState()).thenReturn(CircuitBreaker.State.CLOSED);
        when(transition.getToState()).thenReturn(CircuitBreaker.State.OPEN);
        when(stateTransitionEvent.getStateTransition()).thenReturn(transition);
        
        // When
        listener.onStateTransition(stateTransitionEvent);
        
        // Then
        ArgumentCaptor<CircuitBreakerOpenedEvent> eventCaptor = ArgumentCaptor.forClass(CircuitBreakerOpenedEvent.class);
        verify(eventPublisher).publishCircuitBreakerOpened(eventCaptor.capture());
        
        CircuitBreakerOpenedEvent event = eventCaptor.getValue();
        assertThat(event.providerType()).isEqualTo(ProviderType.SMS);
        assertThat(event.fromState()).isEqualTo(CircuitBreaker.State.CLOSED);
        assertThat(event.toState()).isEqualTo(CircuitBreaker.State.OPEN);
        assertThat(event.failureRate()).isEqualTo(65.5f);
        assertThat(event.threshold()).isEqualTo(50.0f);
        assertThat(event.degradedModeDuration()).isEqualTo("PT5M");
        assertThat(event.traceId()).isEqualTo("test-trace-123");
    }
    
    @Test
    void shouldPublishHalfOpenEventWhenCircuitBreakerHalfOpens() {
        // Given
        when(stateTransitionEvent.getCircuitBreakerName()).thenReturn("pushProvider");
        CircuitBreaker.StateTransition transition = mock(CircuitBreaker.StateTransition.class);
        when(transition.getFromState()).thenReturn(CircuitBreaker.State.OPEN);
        when(transition.getToState()).thenReturn(CircuitBreaker.State.HALF_OPEN);
        when(stateTransitionEvent.getStateTransition()).thenReturn(transition);
        
        // When
        listener.onStateTransition(stateTransitionEvent);
        
        // Then
        ArgumentCaptor<CircuitBreakerHalfOpenEvent> eventCaptor = ArgumentCaptor.forClass(CircuitBreakerHalfOpenEvent.class);
        verify(eventPublisher).publishCircuitBreakerHalfOpen(eventCaptor.capture());
        
        CircuitBreakerHalfOpenEvent event = eventCaptor.getValue();
        assertThat(event.providerType()).isEqualTo(ProviderType.PUSH);
        assertThat(event.fromState()).isEqualTo(CircuitBreaker.State.OPEN);
        assertThat(event.toState()).isEqualTo(CircuitBreaker.State.HALF_OPEN);
        assertThat(event.permittedTestCalls()).isEqualTo(3);
        assertThat(event.traceId()).isEqualTo("test-trace-123");
    }
    
    @Test
    void shouldPublishClosedEventWhenCircuitBreakerRecoveres() {
        // Given
        when(stateTransitionEvent.getCircuitBreakerName()).thenReturn("voiceProvider");
        CircuitBreaker.StateTransition transition = mock(CircuitBreaker.StateTransition.class);
        when(transition.getFromState()).thenReturn(CircuitBreaker.State.HALF_OPEN);
        when(transition.getToState()).thenReturn(CircuitBreaker.State.CLOSED);
        when(stateTransitionEvent.getStateTransition()).thenReturn(transition);
        
        // When
        listener.onStateTransition(stateTransitionEvent);
        
        // Then
        ArgumentCaptor<CircuitBreakerClosedEvent> eventCaptor = ArgumentCaptor.forClass(CircuitBreakerClosedEvent.class);
        verify(eventPublisher).publishCircuitBreakerClosed(eventCaptor.capture());
        
        CircuitBreakerClosedEvent event = eventCaptor.getValue();
        assertThat(event.providerType()).isEqualTo(ProviderType.VOICE);
        assertThat(event.fromState()).isEqualTo(CircuitBreaker.State.HALF_OPEN);
        assertThat(event.toState()).isEqualTo(CircuitBreaker.State.CLOSED);
        assertThat(event.recoveryDuration()).isNotNull();
        assertThat(event.traceId()).isEqualTo("test-trace-123");
    }
    
    @Test
    void shouldPublishFailedRecoveryEventWhenRecoveryFails() {
        // Given
        when(stateTransitionEvent.getCircuitBreakerName()).thenReturn("biometricProvider");
        CircuitBreaker.StateTransition transition = mock(CircuitBreaker.StateTransition.class);
        when(transition.getFromState()).thenReturn(CircuitBreaker.State.HALF_OPEN);
        when(transition.getToState()).thenReturn(CircuitBreaker.State.OPEN);
        when(stateTransitionEvent.getStateTransition()).thenReturn(transition);
        
        // When
        listener.onStateTransition(stateTransitionEvent);
        
        // Then
        ArgumentCaptor<CircuitBreakerFailedRecoveryEvent> eventCaptor = ArgumentCaptor.forClass(CircuitBreakerFailedRecoveryEvent.class);
        verify(eventPublisher).publishCircuitBreakerFailedRecovery(eventCaptor.capture());
        
        CircuitBreakerFailedRecoveryEvent event = eventCaptor.getValue();
        assertThat(event.providerType()).isEqualTo(ProviderType.BIOMETRIC);
        assertThat(event.fromState()).isEqualTo(CircuitBreaker.State.HALF_OPEN);
        assertThat(event.toState()).isEqualTo(CircuitBreaker.State.OPEN);
        assertThat(event.failureRate()).isEqualTo(65.5f);
        assertThat(event.nextRetryWaitDuration()).isEqualTo("PT30S");
        assertThat(event.traceId()).isEqualTo("test-trace-123");
    }
    
    @Test
    void shouldPublishResetEventWhenCircuitBreakerReset() {
        // Given
        when(resetEvent.getCircuitBreakerName()).thenReturn("smsProvider");
        
        // When
        listener.onReset(resetEvent);
        
        // Then
        ArgumentCaptor<CircuitBreakerResetEvent> eventCaptor = ArgumentCaptor.forClass(CircuitBreakerResetEvent.class);
        verify(eventPublisher).publishCircuitBreakerReset(eventCaptor.capture());
        
        CircuitBreakerResetEvent event = eventCaptor.getValue();
        assertThat(event.providerType()).isEqualTo(ProviderType.SMS);
        assertThat(event.resetBy()).isEqualTo("admin");
        assertThat(event.resetReason()).isEqualTo("Manual circuit breaker reset");
        assertThat(event.traceId()).isEqualTo("test-trace-123");
    }
    
    @Test
    void shouldNotFailProviderCallWhenKafkaPublishingFails() {
        // Given
        when(stateTransitionEvent.getCircuitBreakerName()).thenReturn("smsProvider");
        CircuitBreaker.StateTransition transition = mock(CircuitBreaker.StateTransition.class);
        when(transition.getFromState()).thenReturn(CircuitBreaker.State.CLOSED);
        when(transition.getToState()).thenReturn(CircuitBreaker.State.OPEN);
        when(stateTransitionEvent.getStateTransition()).thenReturn(transition);
        
        // Simulate Kafka publishing failure
        doThrow(new RuntimeException("Kafka connection failed"))
            .when(eventPublisher).publishCircuitBreakerOpened(any());
        
        // When & Then - should NOT throw exception
        listener.onStateTransition(stateTransitionEvent);
        
        // Verify event publishing was attempted
        verify(eventPublisher).publishCircuitBreakerOpened(any());
    }
    
    @Test
    void shouldExtractProviderTypeFromCircuitBreakerName() {
        // Test all provider types
        testProviderTypeExtraction("smsProvider", ProviderType.SMS);
        testProviderTypeExtraction("pushProvider", ProviderType.PUSH);
        testProviderTypeExtraction("voiceProvider", ProviderType.VOICE);
        testProviderTypeExtraction("biometricProvider", ProviderType.BIOMETRIC);
    }
    
    private void testProviderTypeExtraction(String circuitBreakerName, ProviderType expectedType) {
        // Given
        when(stateTransitionEvent.getCircuitBreakerName()).thenReturn(circuitBreakerName);
        CircuitBreaker.StateTransition transition = mock(CircuitBreaker.StateTransition.class);
        when(transition.getFromState()).thenReturn(CircuitBreaker.State.CLOSED);
        when(transition.getToState()).thenReturn(CircuitBreaker.State.OPEN);
        when(stateTransitionEvent.getStateTransition()).thenReturn(transition);
        
        // When
        listener.onStateTransition(stateTransitionEvent);
        
        // Then
        ArgumentCaptor<CircuitBreakerOpenedEvent> eventCaptor = ArgumentCaptor.forClass(CircuitBreakerOpenedEvent.class);
        verify(eventPublisher, atLeastOnce()).publishCircuitBreakerOpened(eventCaptor.capture());
        
        CircuitBreakerOpenedEvent event = eventCaptor.getValue();
        assertThat(event.providerType()).isEqualTo(expectedType);
    }
}

