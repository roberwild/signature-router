package com.bank.signature.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * DTO for completing a signature request by providing the challenge code.
 * Story 2.11: Signature Completion (User Response)
 * 
 * @param challengeId The ID of the challenge being completed
 * @param code The OTP code received by the user
 */
@Schema(description = "Request payload for completing a signature challenge")
public record CompleteSignatureDto(
    
    @NotNull(message = "Challenge ID is required")
    @Schema(description = "Unique identifier of the challenge to complete", 
            example = "01933e5d-8a1b-7c2d-9e3f-4a5b6c7d8e9f",
            required = true)
    UUID challengeId,
    
    @NotBlank(message = "Challenge code is required")
    @Schema(description = "The OTP code received by the user (e.g., via SMS)", 
            example = "123456",
            required = true,
            minLength = 6,
            maxLength = 6)
    String code
) {
}

