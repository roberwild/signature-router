package com.bank.signature.application.dto;

import com.bank.signature.domain.model.valueobject.AbortReason;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for aborting a signature request.
 * Story 2.12: Signature Abort (Admin Action)
 * 
 * @param reason The reason for aborting the signature request
 * @param details Optional additional details about the abort (e.g., fraud score, admin notes)
 */
@Schema(description = "Request payload for aborting a signature request (admin only)")
public record AbortSignatureDto(
    
    @NotNull(message = "Abort reason is required")
    @Schema(
        description = "Reason for aborting the signature request",
        example = "FRAUD_DETECTED",
        required = true
    )
    AbortReason reason,
    
    @Schema(
        description = "Optional additional details about the abort",
        example = "Fraud score: 0.95, flagged by rule R-123",
        required = false
    )
    String details
) {
}

