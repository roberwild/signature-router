package com.bank.signature.domain.event;

import com.bank.signature.domain.model.valueobject.ProviderType;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnStateTransitionEvent;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when a circuit breaker transitions from HALF_OPEN back to OPEN (recovery failed).
 * 
 * <p><strong>Business Meaning:</strong></p>
 * <ul>
 *   <li>Test calls in HALF_OPEN state failed</li>
 *   <li>Provider is still experiencing failures</li>
 *   <li>Circuit breaker reopened - calls will be rejected again</li>
 *   <li>System will wait configured duration before next recovery attempt</li>
 * </ul>
 * 
 * <p><strong>Consumer Use Cases:</strong></p>
 * <ul>
 *   <li>Monitoring Service: Keep PagerDuty alert active, escalate if multiple recovery failures</li>
 *   <li>Analytics Service: Track recovery failure count, calculate downtime extension</li>
 *   <li>Dashboard Service: Show "Recovery Failed - Retrying" status</li>
 *   <li>Audit Service: Record recovery failure for incident analysis</li>
 * </ul>
 * 
 * <p><strong>Kafka Topic:</strong> signature.circuit-breaker.events</p>
 * 
 * @param eventId UUIDv7 unique event identifier
 * @param providerType Provider that failed recovery (SMS, PUSH, VOICE, BIOMETRIC)
 * @param fromState State before transition (HALF_OPEN)
 * @param toState State after transition (OPEN)
 * @param occurredAt Timestamp when circuit breaker transitioned
 * @param failureRate Failure rate during recovery test (e.g., 100% if all test calls failed)
 * @param bufferedCalls Number of calls in sliding window buffer
 * @param failedCalls Number of failed calls in sliding window
 * @param successfulCalls Number of successful calls in sliding window
 * @param nextRetryWaitDuration Duration until next recovery attempt (ISO-8601, e.g., "PT30S")
 * @param traceId Correlation ID for distributed tracing
 * 
 * @since Story 4-8 - Circuit Breaker Event Publishing
 */
public record CircuitBreakerFailedRecoveryEvent(
    UUID eventId,
    ProviderType providerType,
    CircuitBreaker.State fromState,
    CircuitBreaker.State toState,
    Instant occurredAt,
    Float failureRate,
    Integer bufferedCalls,
    Integer failedCalls,
    Integer successfulCalls,
    String nextRetryWaitDuration,
    String correlationId
) implements DomainEvent {
    
    @Override
    public UUID getAggregateId() {
        return UUID.nameUUIDFromBytes(providerType.name().getBytes());
    }
    
    @Override
    public String getAggregateType() {
        return "Provider";
    }
    
    @Override
    public String getEventType() {
        return "CIRCUIT_BREAKER_FAILED_RECOVERY";
    }
    
    @Override
    public Instant getOccurredAt() {
        return occurredAt;
    }
    
    @Override
    public UUID getEventId() {
        return eventId;
    }
    
    @Override
    public String getCorrelationId() {
        return correlationId;
    }
    
    /**
     * Factory method to create CircuitBreakerFailedRecoveryEvent from Resilience4j event.
     * 
     * @param r4jEvent Resilience4j CircuitBreakerOnStateTransitionEvent
     * @param circuitBreaker Circuit breaker instance
     * @param providerType Provider type extracted from circuit breaker name
     * @param nextRetryWaitDuration Configured wait duration until next recovery attempt
     * @param traceId Correlation ID from MDC
     * @return CircuitBreakerFailedRecoveryEvent
     */
    public static CircuitBreakerFailedRecoveryEvent fromResilient4jEvent(
        CircuitBreakerOnStateTransitionEvent r4jEvent,
        CircuitBreaker circuitBreaker,
        ProviderType providerType,
        String nextRetryWaitDuration,
        String traceId
    ) {
        CircuitBreaker.Metrics metrics = circuitBreaker.getMetrics();
        
        return new CircuitBreakerFailedRecoveryEvent(
            com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch(),
            providerType,
            r4jEvent.getStateTransition().getFromState(),
            r4jEvent.getStateTransition().getToState(),
            Instant.now(),
            metrics.getFailureRate(),
            metrics.getNumberOfBufferedCalls(),
            metrics.getNumberOfFailedCalls(),
            metrics.getNumberOfSuccessfulCalls(),
            nextRetryWaitDuration,
            traceId
        );
    }
}

