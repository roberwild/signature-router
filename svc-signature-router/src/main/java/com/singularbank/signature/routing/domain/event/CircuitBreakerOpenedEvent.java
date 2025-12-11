package com.singularbank.signature.routing.domain.event;

import com.singularbank.signature.routing.domain.model.valueobject.ProviderType;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnStateTransitionEvent;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when a circuit breaker transitions to OPEN state (provider failed).
 * 
 * <p><strong>Business Meaning:</strong></p>
 * <ul>
 *   <li>Provider entered degraded mode (failure rate exceeded threshold)</li>
 *   <li>System will reject calls to this provider for configured wait duration</li>
 *   <li>Fallback chain should be attempted if available</li>
 * </ul>
 * 
 * <p><strong>Consumer Use Cases:</strong></p>
 * <ul>
 *   <li>Monitoring Service: Trigger PagerDuty alert for provider failure</li>
 *   <li>Analytics Service: Calculate uptime/downtime metrics</li>
 *   <li>Dashboard Service: Update real-time provider status</li>
 *   <li>Audit Service: Record circuit breaker transition for compliance</li>
 * </ul>
 * 
 * <p><strong>Kafka Topic:</strong> signature.events</p>
 * 
 * @param eventId UUIDv7 unique event identifier
 * @param providerType Provider that failed (SMS, PUSH, VOICE, BIOMETRIC)
 * @param fromState State before transition (typically CLOSED or HALF_OPEN)
 * @param toState State after transition (OPEN)
 * @param occurredAt Timestamp when circuit breaker transitioned
 * @param failureRate Failure rate percentage that triggered circuit breaker (e.g., 65.5%)
 * @param slowCallRate Slow call rate percentage
 * @param bufferedCalls Number of calls in sliding window buffer
 * @param failedCalls Number of failed calls in sliding window
 * @param successfulCalls Number of successful calls in sliding window
 * @param slowCalls Number of slow calls in sliding window
 * @param threshold Configured threshold that was exceeded (e.g., 50.0%)
 * @param degradedModeDuration Duration provider will be in degraded mode (ISO-8601, e.g., "PT5M")
 * @param correlationId Correlation ID for distributed tracing
 * 
 * @since Story 4-8 - Circuit Breaker Event Publishing
 * @since Story 5.1 - Implements DomainEvent interface
 */
public record CircuitBreakerOpenedEvent(
    UUID eventId,
    ProviderType providerType,
    CircuitBreaker.State fromState,
    CircuitBreaker.State toState,
    Instant occurredAt,
    Float failureRate,
    Float slowCallRate,
    Integer bufferedCalls,
    Integer failedCalls,
    Integer successfulCalls,
    Integer slowCalls,
    Float threshold,
    String degradedModeDuration,
    String correlationId
) implements DomainEvent {
    
    @Override
    public UUID getAggregateId() {
        // Circuit breaker events don't have a specific aggregate ID
        // Using provider name as pseudo-aggregate
        return UUID.nameUUIDFromBytes(providerType.name().getBytes());
    }
    
    @Override
    public String getAggregateType() {
        return "Provider";
    }
    
    @Override
    public String getEventType() {
        return "CIRCUIT_BREAKER_OPENED";
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
     * Factory method to create CircuitBreakerOpenedEvent from Resilience4j event.
     * 
     * @param r4jEvent Resilience4j CircuitBreakerOnStateTransitionEvent
     * @param circuitBreaker Circuit breaker instance
     * @param providerType Provider type extracted from circuit breaker name
     * @param degradedModeDuration Configured degraded mode duration (ISO-8601)
     * @param threshold Configured failure rate threshold
     * @param correlationId Correlation ID from MDC
     * @return CircuitBreakerOpenedEvent
     */
    public static CircuitBreakerOpenedEvent fromResilient4jEvent(
        CircuitBreakerOnStateTransitionEvent r4jEvent,
        CircuitBreaker circuitBreaker,
        ProviderType providerType,
        String degradedModeDuration,
        Float threshold,
        String correlationId
    ) {
        CircuitBreaker.Metrics metrics = circuitBreaker.getMetrics();
        
        return new CircuitBreakerOpenedEvent(
            com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch(),
            providerType,
            r4jEvent.getStateTransition().getFromState(),
            r4jEvent.getStateTransition().getToState(),
            Instant.now(),
            metrics.getFailureRate(),
            metrics.getSlowCallRate(),
            metrics.getNumberOfBufferedCalls(),
            metrics.getNumberOfFailedCalls(),
            metrics.getNumberOfSuccessfulCalls(),
            metrics.getNumberOfSlowCalls(),
            threshold,
            degradedModeDuration,
            correlationId
        );
    }
}

