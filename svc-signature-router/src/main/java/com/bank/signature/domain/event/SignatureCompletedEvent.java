package com.bank.signature.domain.event;

import com.bank.signature.domain.model.valueobject.ChannelType;
import com.github.f4b6a3.uuid.UuidCreator;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when a signature request is successfully completed.
 * Story 2.11: Signature Completion (User Response)
 * Story 5.1: Refactored to implement DomainEvent interface
 * 
 * @param eventId UUIDv7 unique event identifier
 * @param signatureRequestId The ID of the completed signature request
 * @param challengeId The ID of the completed challenge
 * @param channelType The channel used for completion (SMS, PUSH, VOICE)
 * @param completedAt Timestamp when the signature was completed
 * @param correlationId Correlation ID for distributed tracing
 */
public record SignatureCompletedEvent(
    UUID eventId,
    UUID signatureRequestId,
    UUID challengeId,
    ChannelType channelType,
    Instant completedAt,
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
        return "SIGNATURE_COMPLETED";
    }
    
    @Override
    public Instant getOccurredAt() {
        return completedAt;
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
     * Factory method to create SignatureCompletedEvent.
     * 
     * @param signatureRequestId The signature request ID
     * @param challengeId The challenge ID
     * @param channelType The channel used
     * @param correlationId Correlation ID from MDC
     * @return SignatureCompletedEvent
     */
    public static SignatureCompletedEvent create(
        UUID signatureRequestId,
        UUID challengeId,
        ChannelType channelType,
        String correlationId
    ) {
        return new SignatureCompletedEvent(
            UuidCreator.getTimeOrderedEpoch(),
            signatureRequestId,
            challengeId,
            channelType,
            Instant.now(),
            correlationId
        );
    }
}

