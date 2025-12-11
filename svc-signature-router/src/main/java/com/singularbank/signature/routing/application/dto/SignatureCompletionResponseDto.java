package com.singularbank.signature.routing.application.dto;

import com.singularbank.signature.routing.domain.model.valueobject.SignatureStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for the response after successfully completing a signature request.
 * Story 2.11: Signature Completion (User Response)
 * 
 * @param id Unique identifier of the signature request
 * @param status Updated status (should be SIGNED)
 * @param completedAt Timestamp when the signature was completed
 * @param message Success message for the user
 */
@Schema(description = "Response after successfully completing a signature request")
public record SignatureCompletionResponseDto(
    
    @Schema(description = "Unique identifier of the signature request", 
            example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001")
    UUID id,
    
    @Schema(description = "Updated status of the signature request", 
            example = "SIGNED")
    SignatureStatus status,
    
    @Schema(description = "Timestamp when the signature was completed", 
            example = "2025-11-27T10:35:00Z")
    Instant completedAt,
    
    @Schema(description = "Success message for the user", 
            example = "Signature completed successfully")
    String message
) {
}

