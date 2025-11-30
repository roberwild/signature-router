package com.bank.signature.domain.model.valueobject;

import java.time.Instant;

/**
 * Immutable Value Object representing a routing event in signature request timeline.
 * 
 * <p><b>Audit Trail:</b> Used to track routing decisions, fallback triggers, and channel transitions.</p>
 * 
 * @param timestamp Event occurrence timestamp
 * @param eventType Event type (e.g., "CHALLENGE_SENT", "FALLBACK_TRIGGERED", "SIGNATURE_COMPLETED")
 * @param fromChannel Source channel (nullable for initial events)
 * @param toChannel Target channel (nullable for terminal events)
 * @param reason Event reason or description
 * @since Story 1.5
 */
public record RoutingEvent(
    Instant timestamp,
    String eventType,
    ChannelType fromChannel,
    ChannelType toChannel,
    String reason
) {
    
    /**
     * Compact constructor with validation.
     */
    public RoutingEvent {
        if (timestamp == null) {
            throw new IllegalArgumentException("Timestamp cannot be null");
        }
        if (eventType == null || eventType.isBlank()) {
            throw new IllegalArgumentException("EventType cannot be null or empty");
        }
        // fromChannel, toChannel can be null (initial/terminal events)
        if (reason == null) {
            reason = ""; // Empty string instead of null
        }
    }
}






