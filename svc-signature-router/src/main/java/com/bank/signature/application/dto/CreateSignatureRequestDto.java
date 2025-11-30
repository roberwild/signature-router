package com.bank.signature.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for creating a new signature request.
 * Story 2.1: Create Signature Request Use Case
 * Story 2.5: Added phoneNumber for SMS delivery
 * 
 * @param customerId Customer identifier (will be pseudonymized)
 * @param phoneNumber User's phone number for SMS delivery (Story 2.5)
 * @param transactionContext Transaction details for signature
 */
@Schema(description = "Request to create a new digital signature")
public record CreateSignatureRequestDto(
    
    @Schema(
        description = "Customer identifier (will be pseudonymized for storage)",
        example = "customer-12345",
        required = true
    )
    @NotBlank(message = "customerId is required")
    String customerId,
    
    @Schema(
        description = "User's phone number for SMS delivery (E.164 format)",
        example = "+1234567890",
        required = true
    )
    @NotBlank(message = "phoneNumber is required")
    String phoneNumber,
    
    @Schema(
        description = "Transaction context containing amount, merchant, order details",
        required = true
    )
    @NotNull(message = "transactionContext is required")
    @Valid
    TransactionContextDto transactionContext
) {
    
    /**
     * Compact constructor for validation.
     */
    public CreateSignatureRequestDto {
        if (customerId != null) {
            customerId = customerId.trim();
        }
        if (phoneNumber != null) {
            phoneNumber = phoneNumber.trim();
        }
    }
}

