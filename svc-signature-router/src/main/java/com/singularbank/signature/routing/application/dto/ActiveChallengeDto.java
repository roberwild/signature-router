package com.singularbank.signature.routing.application.dto;

import com.singularbank.signature.routing.domain.model.valueobject.ChallengeStatus;
import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for active challenge information.
 * Story 2.8: Query Signature Request (GET Endpoint)
 * 
 * Represents the currently active challenge (PENDING or SENT status).
 * Only one challenge can be active at a time per signature request.
 */
@Schema(description = "Currently active signature challenge")
public record ActiveChallengeDto(
    
    @Schema(
        description = "Unique identifier of the challenge",
        example = "01933e5d-8a1b-7c2d-9e3f-4a5b6c7d8e9f"
    )
    UUID id,
    
    @Schema(
        description = "Channel type used for this challenge",
        example = "SMS"
    )
    ChannelType channelType,
    
    @Schema(
        description = "Current status of the challenge",
        example = "SENT"
    )
    ChallengeStatus status,
    
    @Schema(
        description = "Timestamp when the challenge was sent (null if PENDING)",
        example = "2025-11-27T10:30:05Z",
        nullable = true
    )
    Instant sentAt,
    
    @Schema(
        description = "Timestamp when the challenge expires",
        example = "2025-11-27T10:35:00Z"
    )
    Instant expiresAt
) {
}

