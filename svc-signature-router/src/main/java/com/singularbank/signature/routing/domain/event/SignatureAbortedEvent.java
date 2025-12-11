package com.singularbank.signature.routing.domain.event;

import com.singularbank.signature.routing.domain.model.valueobject.AbortReason;
import com.github.f4b6a3.uuid.UuidCreator;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when a signature request is aborted.
 * Story 2.12: Signature Abort (Admin Action)
 * Story 5.1: Refactored to implement DomainEvent interface
 * 
 * @param eventId UUIDv7 unique event identifier
 * @param signatureRequestId The ID of the aborted signature request
 * @param reason The reason for the abort
 * @param details Optional additional details about the abort
 * @param abortedAt Timestamp when the signature was aborted
 * @param correlationId Correlation ID for distributed tracing
 */
public record SignatureAbortedEvent(
    UUID eventId,
    UUID signatureRequestId,
    AbortReason reason,
    String details,
    Instant abortedAt,
    String correlationId
) implements DomainEvent {
    
    @Override
    public UUID getAggregateId() {
        return signatureRequestId;
    }
    
    @Override
    public String getAggregateType() {
        return "SignatureRequest";
    }
    
    @Override
    public String getEventType() {
        return "SIGNATURE_ABORTED";
    }
    
    @Override
    public Instant getOccurredAt() {
        return abortedAt;
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
     * Factory method to create SignatureAbortedEvent.
     * 
     * @param signatureRequestId The signature request ID
     * @param reason Abort reason
     * @param details Optional details
     * @param correlationId Correlation ID from MDC
     * @return SignatureAbortedEvent
     */
    public static SignatureAbortedEvent create(
        UUID signatureRequestId,
        AbortReason reason,
        String details,
        String correlationId
    ) {
        return new SignatureAbortedEvent(
            UuidCreator.getTimeOrderedEpoch(),
            signatureRequestId,
            reason,
            details,
            Instant.now(),
            correlationId
        );
    }
}

