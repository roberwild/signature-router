package com.singularbank.signature.routing.application.dto;

import com.singularbank.signature.routing.domain.model.valueobject.AbortReason;
import com.singularbank.signature.routing.domain.model.valueobject.SignatureStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for the response after aborting a signature request.
 * Story 2.12: Signature Abort (Admin Action)
 * 
 * @param id Unique identifier of the signature request
 * @param status Updated status (should be ABORTED)
 * @param abortReason The reason for the abort
 * @param abortedAt Timestamp when the signature was aborted
 * @param message Success message
 */
@Schema(description = "Response after aborting a signature request")
public record AbortSignatureResponseDto(
    
    @Schema(description = "Unique identifier of the signature request", 
            example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001")
    UUID id,
    
    @Schema(description = "Updated status of the signature request", 
            example = "ABORTED")
    SignatureStatus status,
    
    @Schema(description = "Reason why the signature was aborted", 
            example = "FRAUD_DETECTED")
    AbortReason abortReason,
    
    @Schema(description = "Timestamp when the signature was aborted", 
            example = "2025-11-27T11:00:00Z")
    Instant abortedAt,
    
    @Schema(description = "Success message", 
            example = "Signature request aborted successfully")
    String message
) {
}

