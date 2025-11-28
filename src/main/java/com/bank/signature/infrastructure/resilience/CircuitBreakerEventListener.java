package com.bank.signature.infrastructure.resilience;

import com.bank.signature.domain.event.*;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.port.outbound.EventPublisher;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Event listener for Resilience4j circuit breaker events.
 * 
 * <p>This component listens to circuit breaker lifecycle events and publishes domain events to Kafka:
 * <ul>
 * <li>CLOSED → OPEN: publishCircuitBreakerOpened (provider degraded)</li>
 * <li>OPEN → HALF_OPEN: publishCircuitBreakerHalfOpen (testing recovery)</li>
 * <li>HALF_OPEN → CLOSED: publishCircuitBreakerClosed (provider recovered)</li>
 * <li>HALF_OPEN → OPEN: publishCircuitBreakerFailedRecovery (recovery failed)</li>
 * <li>Manual reset: publishCircuitBreakerReset (admin action)</li>
 * </ul>
 * 
 * <p><strong>Events Published to Kafka Topic:</strong> signature.circuit-breaker.events
 * 
 * <p><strong>Consumer Use Cases:</strong>
 * <ul>
 * <li>Monitoring Service: Trigger PagerDuty alerts on circuit breaker OPEN</li>
 * <li>Analytics Service: Calculate uptime, MTTR, SLA compliance</li>
 * <li>Dashboard Service: Real-time provider status updates</li>
 * <li>Audit Service: Compliance trail of circuit breaker transitions</li>
 * </ul>
 * 
 * <p><strong>Resilience Strategy:</strong>
 * If event publishing fails (Kafka down), the exception is caught and logged, but NOT re-thrown.
 * Circuit breaker state transitions are NOT blocked by event publishing failures.
 * 
 * @since Story 4-8 - Circuit Breaker Event Publishing
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CircuitBreakerEventListener {
    
    private final EventPublisher eventPublisher;
    private final io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry circuitBreakerRegistry;
    
    // Configuration constants (from application.yml)
    private static final String DEGRADED_MODE_DURATION = "PT5M";  // 5 minutes
    private static final String WAIT_DURATION = "PT30S";          // 30 seconds
    private static final float FAILURE_RATE_THRESHOLD = 50.0f;    // 50%
    private static final int PERMITTED_TEST_CALLS = 3;            // 3 test calls in HALF_OPEN
    
    /**
     * Handle circuit breaker state transition events.
     * 
     * <p>Triggered when circuit breaker transitions between states:
     * <ul>
     * <li>CLOSED → OPEN: Provider failed (failure rate > threshold)</li>
     * <li>OPEN → HALF_OPEN: Testing recovery (after wait duration)</li>
     * <li>HALF_OPEN → CLOSED: Recovery successful</li>
     * <li>HALF_OPEN → OPEN: Recovery failed</li>
     * </ul>
     * 
     * @param event the circuit breaker state transition event
     */
    @EventListener
    public void onStateTransition(CircuitBreakerOnStateTransitionEvent event) {
        String circuitBreakerName = event.getCircuitBreakerName();
        CircuitBreaker.StateTransition transition = event.getStateTransition();
        CircuitBreaker.State fromState = transition.getFromState();
        CircuitBreaker.State toState = transition.getToState();
        
        try {
            ProviderType providerType = extractProviderType(circuitBreakerName);
            String traceId = MDC.get("traceId");
            CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(circuitBreakerName);
            
            log.info("Circuit breaker state transition: provider={}, fromState={}, toState={}, failureRate={}%, traceId={}", 
                providerType,
                fromState,
                toState,
                circuitBreaker.getMetrics().getFailureRate(),
                traceId);
            
            // Publish appropriate domain event based on transition
            if (fromState == CircuitBreaker.State.CLOSED && toState == CircuitBreaker.State.OPEN) {
                publishOpenedEvent(event, circuitBreaker, providerType, traceId);
            } else if (fromState == CircuitBreaker.State.OPEN && toState == CircuitBreaker.State.HALF_OPEN) {
                publishHalfOpenEvent(event, circuitBreaker, providerType, traceId);
            } else if (fromState == CircuitBreaker.State.HALF_OPEN && toState == CircuitBreaker.State.CLOSED) {
                publishClosedEvent(event, circuitBreaker, providerType, traceId);
            } else if (fromState == CircuitBreaker.State.HALF_OPEN && toState == CircuitBreaker.State.OPEN) {
                publishFailedRecoveryEvent(event, circuitBreaker, providerType, traceId);
            }
            
        } catch (Exception e) {
            log.error("Error processing circuit breaker state transition: circuitBreaker={}, transition={} → {}, error={}", 
                circuitBreakerName, fromState, toState, e.getMessage(), e);
            // DO NOT re-throw - event publishing failures must not impact circuit breaker functionality
        }
    }
    
    /**
     * Handle circuit breaker reset events (manual admin action).
     * 
     * <p>Triggered when admin manually resets circuit breaker to CLOSED state.
     * 
     * @param event the circuit breaker reset event
     */
    @EventListener
    public void onReset(CircuitBreakerOnResetEvent event) {
        String circuitBreakerName = event.getCircuitBreakerName();
        
        try {
            ProviderType providerType = extractProviderType(circuitBreakerName);
            String traceId = MDC.get("traceId");
            
            log.info("Circuit breaker manually reset: provider={}, traceId={}", providerType, traceId);
            
            // Create and publish reset event
            CircuitBreakerResetEvent resetEvent = CircuitBreakerResetEvent.create(
                providerType,
                "admin",  // TODO: Extract actual admin user ID from SecurityContext
                "Manual circuit breaker reset",
                "UNKNOWN",  // Previous state not available in reset event
                traceId
            );
            
            eventPublisher.publishCircuitBreakerReset(resetEvent);
            
        } catch (Exception e) {
            log.error("Error publishing circuit breaker reset event: circuitBreaker={}, error={}", 
                circuitBreakerName, e.getMessage(), e);
            // DO NOT re-throw
        }
    }
    
    /**
     * Publish CircuitBreakerOpenedEvent when circuit transitions to OPEN state.
     * 
     * <p>Provider entered degraded mode (failure rate exceeded threshold).
     * 
     * @param event Resilience4j event
     * @param circuitBreaker Circuit breaker instance
     * @param providerType Provider type
     * @param traceId Trace ID from MDC
     */
    private void publishOpenedEvent(
        CircuitBreakerOnStateTransitionEvent event,
        CircuitBreaker circuitBreaker,
        ProviderType providerType,
        String traceId
    ) {
        CircuitBreakerOpenedEvent domainEvent = CircuitBreakerOpenedEvent.fromResilient4jEvent(
            event,
            circuitBreaker,
            providerType,
            DEGRADED_MODE_DURATION,
            FAILURE_RATE_THRESHOLD,
            traceId
        );
        
        eventPublisher.publishCircuitBreakerOpened(domainEvent);
        
        log.warn("Provider entered degraded mode: provider={}, failureRate={}%, threshold={}%, degradedDuration={}", 
            providerType,
            circuitBreaker.getMetrics().getFailureRate(),
            FAILURE_RATE_THRESHOLD,
            DEGRADED_MODE_DURATION);
    }
    
    /**
     * Publish CircuitBreakerHalfOpenEvent when circuit transitions to HALF_OPEN state.
     * 
     * <p>System testing provider recovery with limited test calls.
     * 
     * @param event Resilience4j event
     * @param circuitBreaker Circuit breaker instance
     * @param providerType Provider type
     * @param traceId Trace ID from MDC
     */
    private void publishHalfOpenEvent(
        CircuitBreakerOnStateTransitionEvent event,
        CircuitBreaker circuitBreaker,
        ProviderType providerType,
        String traceId
    ) {
        CircuitBreakerHalfOpenEvent domainEvent = CircuitBreakerHalfOpenEvent.fromResilient4jEvent(
            event,
            circuitBreaker,
            providerType,
            PERMITTED_TEST_CALLS,
            traceId
        );
        
        eventPublisher.publishCircuitBreakerHalfOpen(domainEvent);
        
        log.info("Circuit breaker testing recovery: provider={}, permittedTestCalls={}", 
            providerType, PERMITTED_TEST_CALLS);
    }
    
    /**
     * Publish CircuitBreakerClosedEvent when circuit transitions to CLOSED state.
     * 
     * <p>Provider successfully recovered, normal operation resumed.
     * 
     * @param event Resilience4j event
     * @param circuitBreaker Circuit breaker instance
     * @param providerType Provider type
     * @param traceId Trace ID from MDC
     */
    private void publishClosedEvent(
        CircuitBreakerOnStateTransitionEvent event,
        CircuitBreaker circuitBreaker,
        ProviderType providerType,
        String traceId
    ) {
        // TODO: Calculate actual recovery duration (time spent in OPEN/HALF_OPEN states)
        // For now, use a placeholder duration
        Duration recoveryDuration = Duration.ofSeconds(35);  // Example: 30s wait + 5s recovery test
        
        CircuitBreakerClosedEvent domainEvent = CircuitBreakerClosedEvent.fromResilient4jEvent(
            event,
            circuitBreaker,
            providerType,
            recoveryDuration,
            traceId
        );
        
        eventPublisher.publishCircuitBreakerClosed(domainEvent);
        
        log.info("Provider recovered successfully: provider={}, recoveryDuration={}, failureRate={}%", 
            providerType,
            recoveryDuration,
            circuitBreaker.getMetrics().getFailureRate());
    }
    
    /**
     * Publish CircuitBreakerFailedRecoveryEvent when recovery test fails.
     * 
     * <p>Circuit transitions from HALF_OPEN back to OPEN (provider still failing).
     * 
     * @param event Resilience4j event
     * @param circuitBreaker Circuit breaker instance
     * @param providerType Provider type
     * @param traceId Trace ID from MDC
     */
    private void publishFailedRecoveryEvent(
        CircuitBreakerOnStateTransitionEvent event,
        CircuitBreaker circuitBreaker,
        ProviderType providerType,
        String traceId
    ) {
        CircuitBreakerFailedRecoveryEvent domainEvent = CircuitBreakerFailedRecoveryEvent.fromResilient4jEvent(
            event,
            circuitBreaker,
            providerType,
            WAIT_DURATION,
            traceId
        );
        
        eventPublisher.publishCircuitBreakerFailedRecovery(domainEvent);
        
        log.warn("Provider recovery failed: provider={}, failureRate={}%, nextRetryIn={}", 
            providerType,
            circuitBreaker.getMetrics().getFailureRate(),
            WAIT_DURATION);
    }
    
    /**
     * Extract ProviderType from circuit breaker name.
     * 
     * <p>Converts circuit breaker instance names to ProviderType enum:
     * <ul>
     * <li>"smsProvider" → ProviderType.SMS</li>
     * <li>"pushProvider" → ProviderType.PUSH</li>
     * <li>"voiceProvider" → ProviderType.VOICE</li>
     * <li>"biometricProvider" → ProviderType.BIOMETRIC</li>
     * </ul>
     * 
     * @param circuitBreakerName the Resilience4j circuit breaker instance name
     * @return the ProviderType enum
     * @throws IllegalArgumentException if circuit breaker name is unrecognized
     */
    private ProviderType extractProviderType(String circuitBreakerName) {
        if (circuitBreakerName == null || circuitBreakerName.isEmpty()) {
            throw new IllegalArgumentException("Circuit breaker name cannot be null or empty");
        }
        
        // Remove "Provider" suffix and convert to uppercase
        String providerName = circuitBreakerName.replace("Provider", "").toUpperCase();
        
        return switch (providerName) {
            case "SMS" -> ProviderType.SMS;
            case "PUSH" -> ProviderType.PUSH;
            case "VOICE" -> ProviderType.VOICE;
            case "BIOMETRIC" -> ProviderType.BIOMETRIC;
            default -> throw new IllegalArgumentException(
                "Unknown circuit breaker name: " + circuitBreakerName + 
                ". Expected: smsProvider, pushProvider, voiceProvider, biometricProvider"
            );
        };
    }
}

