package com.bank.signature.domain.event;

import com.bank.signature.domain.model.valueobject.ProviderType;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnStateTransitionEvent;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when a circuit breaker transitions to HALF_OPEN state (testing recovery).
 * 
 * <p><strong>Business Meaning:</strong></p>
 * <ul>
 *   <li>Circuit breaker wait duration elapsed (e.g., 30 seconds after OPEN)</li>
 *   <li>System will attempt limited test calls to check provider recovery</li>
 *   <li>If test calls succeed: circuit closes (provider recovered)</li>
 *   <li>If test calls fail: circuit reopens (provider still failing)</li>
 * </ul>
 * 
 * <p><strong>Consumer Use Cases:</strong></p>
 * <ul>
 *   <li>Monitoring Service: Track recovery attempt initiated</li>
 *   <li>Analytics Service: Measure time in OPEN state before recovery test</li>
 *   <li>Dashboard Service: Show "Testing Recovery" status</li>
 * </ul>
 * 
 * <p><strong>Kafka Topic:</strong> signature.circuit-breaker.events</p>
 * 
 * @param eventId UUIDv7 unique event identifier
 * @param providerType Provider being tested (SMS, PUSH, VOICE, BIOMETRIC)
 * @param fromState State before transition (typically OPEN)
 * @param toState State after transition (HALF_OPEN)
 * @param occurredAt Timestamp when circuit breaker transitioned
 * @param bufferedCalls Number of calls in sliding window buffer
 * @param failedCalls Number of failed calls in sliding window
 * @param successfulCalls Number of successful calls in sliding window
 * @param permittedTestCalls Number of test calls permitted in HALF_OPEN (e.g., 3)
 * @param traceId Correlation ID for distributed tracing
 * 
 * @since Story 4-8 - Circuit Breaker Event Publishing
 */
public record CircuitBreakerHalfOpenEvent(
    UUID eventId,
    ProviderType providerType,
    CircuitBreaker.State fromState,
    CircuitBreaker.State toState,
    Instant occurredAt,
    Integer bufferedCalls,
    Integer failedCalls,
    Integer successfulCalls,
    Integer permittedTestCalls,
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
        return "CIRCUIT_BREAKER_HALF_OPEN";
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
     * Factory method to create CircuitBreakerHalfOpenEvent from Resilience4j event.
     * 
     * @param r4jEvent Resilience4j CircuitBreakerOnStateTransitionEvent
     * @param circuitBreaker Circuit breaker instance
     * @param providerType Provider type extracted from circuit breaker name
     * @param permittedTestCalls Configured number of permitted test calls in HALF_OPEN
     * @param traceId Correlation ID from MDC
     * @return CircuitBreakerHalfOpenEvent
     */
    public static CircuitBreakerHalfOpenEvent fromResilient4jEvent(
        CircuitBreakerOnStateTransitionEvent r4jEvent,
        CircuitBreaker circuitBreaker,
        ProviderType providerType,
        Integer permittedTestCalls,
        String traceId
    ) {
        CircuitBreaker.Metrics metrics = circuitBreaker.getMetrics();
        
        return new CircuitBreakerHalfOpenEvent(
            com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch(),
            providerType,
            r4jEvent.getStateTransition().getFromState(),
            r4jEvent.getStateTransition().getToState(),
            Instant.now(),
            metrics.getNumberOfBufferedCalls(),
            metrics.getNumberOfFailedCalls(),
            metrics.getNumberOfSuccessfulCalls(),
            permittedTestCalls,
            traceId
        );
    }
}

