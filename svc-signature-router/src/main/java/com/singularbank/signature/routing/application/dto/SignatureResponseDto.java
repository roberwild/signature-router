package com.singularbank.signature.routing.application.dto;

import com.singularbank.signature.routing.domain.model.valueobject.SignatureStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for signature request response.
 * Story 2.1: Create Signature Request Use Case
 * 
 * @param id Signature request unique identifier
 * @param status Current status of the signature request
 * @param createdAt Timestamp when the request was created
 * @param expiresAt Timestamp when the request expires
 */
@Schema(description = "Response containing signature request details")
public record SignatureResponseDto(
    
    @Schema(
        description = "Unique identifier of the signature request (UUIDv7)",
        example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001"
    )
    UUID id,
    
    @Schema(
        description = "Current status of the signature request",
        example = "PENDING"
    )
    SignatureStatus status,
    
    @Schema(
        description = "Timestamp when the request was created",
        example = "2025-11-27T10:30:00Z"
    )
    Instant createdAt,
    
    @Schema(
        description = "Timestamp when the request expires (TTL: 3 minutes by default)",
        example = "2025-11-27T10:33:00Z"
    )
    Instant expiresAt
) {
}

