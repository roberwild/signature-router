package com.bank.signature.domain.event;

import com.bank.signature.domain.model.valueobject.ProviderType;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when a circuit breaker is manually reset by admin action.
 * 
 * <p><strong>Business Meaning:</strong></p>
 * <ul>
 *   <li>Admin manually reset circuit breaker (forced closure)</li>
 *   <li>Typically done after manual provider fix or emergency override</li>
 *   <li>Circuit breaker state reset to CLOSED regardless of metrics</li>
 *   <li>Sliding window cleared</li>
 * </ul>
 * 
 * <p><strong>Consumer Use Cases:</strong></p>
 * <ul>
 *   <li>Monitoring Service: Log admin intervention</li>
 *   <li>Analytics Service: Track manual resets for operational metrics</li>
 *   <li>Dashboard Service: Show "Manually Reset" status</li>
 *   <li>Audit Service: Record admin action with user ID for compliance</li>
 * </ul>
 * 
 * <p><strong>Kafka Topic:</strong> signature.circuit-breaker.events</p>
 * 
 * @param eventId UUIDv7 unique event identifier
 * @param providerType Provider that was reset (SMS, PUSH, VOICE, BIOMETRIC)
 * @param resetBy Admin user ID who performed the reset
 * @param resetReason Reason for manual reset (e.g., "Provider fix deployed", "Emergency override")
 * @param previousState State before reset (OPEN, HALF_OPEN, or CLOSED)
 * @param occurredAt Timestamp when circuit breaker was reset
 * @param traceId Correlation ID for distributed tracing
 * 
 * @since Story 4-8 - Circuit Breaker Event Publishing
 */
public record CircuitBreakerResetEvent(
    UUID eventId,
    ProviderType providerType,
    String resetBy,
    String resetReason,
    String previousState,
    Instant occurredAt,
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
        return "CIRCUIT_BREAKER_RESET";
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
     * Factory method to create CircuitBreakerResetEvent.
     * 
     * @param providerType Provider type extracted from circuit breaker name
     * @param resetBy Admin user ID who performed the reset
     * @param resetReason Reason for manual reset
     * @param previousState State before reset
     * @param traceId Correlation ID from MDC
     * @return CircuitBreakerResetEvent
     */
    public static CircuitBreakerResetEvent create(
        ProviderType providerType,
        String resetBy,
        String resetReason,
        String previousState,
        String traceId
    ) {
        return new CircuitBreakerResetEvent(
            com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch(),
            providerType,
            resetBy,
            resetReason,
            previousState,
            Instant.now(),
            traceId
        );
    }
}

