package com.bank.signature.application.dto;

import com.bank.signature.domain.model.valueobject.SignatureStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for detailed signature request query response.
 * Story 2.8: Query Signature Request (GET Endpoint)
 * 
 * Contains complete information about a signature request including:
 * - Basic request details (id, status, timestamps)
 * - Tokenized customer ID (privacy: first 8 chars + "...")
 * - Active challenge details
 * - Routing timeline (audit trail)
 */
@Schema(description = "Detailed signature request information")
public record SignatureRequestDetailDto(
    
    @Schema(
        description = "Unique identifier of the signature request (UUIDv7)",
        example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001"
    )
    UUID id,
    
    @Schema(
        description = "Tokenized customer identifier (privacy: first 8 chars + '...')",
        example = "12345678..."
    )
    String customerId,
    
    @Schema(
        description = "Current status of the signature request",
        example = "PENDING"
    )
    SignatureStatus status,
    
    @Schema(
        description = "Active challenge (if any)",
        nullable = true
    )
    ActiveChallengeDto activeChallenge,
    
    @Schema(
        description = "Routing timeline showing decision flow",
        example = "[{\"timestamp\":\"2025-11-27T10:30:00Z\",\"event\":\"REQUEST_CREATED\",\"details\":null}]"
    )
    List<RoutingEventDto> routingTimeline,
    
    @Schema(
        description = "Timestamp when the request was created",
        example = "2025-11-27T10:30:00Z"
    )
    Instant createdAt,
    
    @Schema(
        description = "Timestamp when the request was last updated",
        example = "2025-11-27T10:30:15Z"
    )
    Instant updatedAt,
    
    @Schema(
        description = "Timestamp when the request expires (TTL: 3 minutes by default)",
        example = "2025-11-27T10:33:00Z"
    )
    Instant expiresAt
) {
}

