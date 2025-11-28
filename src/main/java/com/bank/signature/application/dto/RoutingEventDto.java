package com.bank.signature.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * DTO for routing timeline events.
 * Story 2.8: Query Signature Request (GET Endpoint)
 * 
 * Represents a single event in the routing decision timeline.
 * Events are ordered chronologically and provide audit trail.
 * 
 * Examples:
 * - REQUEST_CREATED
 * - RULE_EVALUATED: "Rule 'High Risk' matched → SMS"
 * - CHALLENGE_SENT: "SMS challenge sent via TWILIO"
 */
@Schema(description = "Routing timeline event")
public record RoutingEventDto(
    
    @Schema(
        description = "Timestamp when the event occurred",
        example = "2025-11-27T10:30:00Z"
    )
    Instant timestamp,
    
    @Schema(
        description = "Event type",
        example = "RULE_EVALUATED"
    )
    String event,
    
    @Schema(
        description = "Event details (optional)",
        example = "Rule 'High Risk' matched → SMS",
        nullable = true
    )
    String details
) {
}

