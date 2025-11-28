package com.bank.signature.domain.event;

import com.bank.signature.domain.model.valueobject.ProviderType;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnStateTransitionEvent;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when a circuit breaker transitions to CLOSED state (provider recovered).
 * 
 * <p><strong>Business Meaning:</strong></p>
 * <ul>
 *   <li>Provider successfully recovered from failure</li>
 *   <li>Test calls in HALF_OPEN state succeeded</li>
 *   <li>Normal operation resumed - all calls will be permitted</li>
 *   <li>Degraded mode deactivated</li>
 * </ul>
 * 
 * <p><strong>Consumer Use Cases:</strong></p>
 * <ul>
 *   <li>Monitoring Service: Clear PagerDuty alert, send recovery notification</li>
 *   <li>Analytics Service: Calculate MTTR (Mean Time To Repair), update uptime metrics</li>
 *   <li>Dashboard Service: Update status to "Healthy"</li>
 *   <li>Audit Service: Record successful recovery event</li>
 * </ul>
 * 
 * <p><strong>Kafka Topic:</strong> signature.circuit-breaker.events</p>
 * 
 * @param eventId UUIDv7 unique event identifier
 * @param providerType Provider that recovered (SMS, PUSH, VOICE, BIOMETRIC)
 * @param fromState State before transition (typically HALF_OPEN)
 * @param toState State after transition (CLOSED)
 * @param occurredAt Timestamp when circuit breaker transitioned
 * @param bufferedCalls Number of calls in sliding window buffer
 * @param failedCalls Number of failed calls in sliding window (should be low after recovery)
 * @param successfulCalls Number of successful calls in sliding window
 * @param failureRate Current failure rate percentage after recovery
 * @param recoveryDuration Duration provider was in OPEN/HALF_OPEN state (ISO-8601, e.g., "PT2M30S")
 * @param traceId Correlation ID for distributed tracing
 * 
 * @since Story 4-8 - Circuit Breaker Event Publishing
 */
public record CircuitBreakerClosedEvent(
    UUID eventId,
    ProviderType providerType,
    CircuitBreaker.State fromState,
    CircuitBreaker.State toState,
    Instant occurredAt,
    Integer bufferedCalls,
    Integer failedCalls,
    Integer successfulCalls,
    Float failureRate,
    String recoveryDuration,
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
        return "CIRCUIT_BREAKER_CLOSED";
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
     * Factory method to create CircuitBreakerClosedEvent from Resilience4j event.
     * 
     * @param r4jEvent Resilience4j CircuitBreakerOnStateTransitionEvent
     * @param circuitBreaker Circuit breaker instance
     * @param providerType Provider type extracted from circuit breaker name
     * @param recoveryDuration Duration provider was in failed state (calculated externally)
     * @param traceId Correlation ID from MDC
     * @return CircuitBreakerClosedEvent
     */
    public static CircuitBreakerClosedEvent fromResilient4jEvent(
        CircuitBreakerOnStateTransitionEvent r4jEvent,
        CircuitBreaker circuitBreaker,
        ProviderType providerType,
        Duration recoveryDuration,
        String traceId
    ) {
        CircuitBreaker.Metrics metrics = circuitBreaker.getMetrics();
        
        return new CircuitBreakerClosedEvent(
            com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch(),
            providerType,
            r4jEvent.getStateTransition().getFromState(),
            r4jEvent.getStateTransition().getToState(),
            Instant.now(),
            metrics.getNumberOfBufferedCalls(),
            metrics.getNumberOfFailedCalls(),
            metrics.getNumberOfSuccessfulCalls(),
            metrics.getFailureRate(),
            recoveryDuration != null ? recoveryDuration.toString() : "PT0S",
            traceId
        );
    }
}

