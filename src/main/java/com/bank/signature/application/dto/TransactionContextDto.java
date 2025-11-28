package com.bank.signature.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for transaction context in signature requests.
 * Story 2.1: Create Signature Request Use Case
 * 
 * @param amount Transaction amount
 * @param merchantId Merchant identifier
 * @param orderId Order identifier
 * @param description Transaction description
 */
@Schema(description = "Transaction context for digital signature")
public record TransactionContextDto(
    
    @Schema(
        description = "Transaction amount",
        example = "{\"value\": \"100.00\", \"currency\": \"EUR\"}",
        required = true
    )
    @NotNull(message = "amount is required")
    @Valid
    MoneyDto amount,
    
    @Schema(
        description = "Merchant identifier",
        example = "merchant-789",
        required = true
    )
    @NotBlank(message = "merchantId is required")
    String merchantId,
    
    @Schema(
        description = "Order identifier",
        example = "order-456",
        required = true
    )
    @NotBlank(message = "orderId is required")
    String orderId,
    
    @Schema(
        description = "Transaction description",
        example = "Payment for Order #456"
    )
    String description
) {
    
    /**
     * Compact constructor for validation.
     */
    public TransactionContextDto {
        if (merchantId != null) {
            merchantId = merchantId.trim();
        }
        if (orderId != null) {
            orderId = orderId.trim();
        }
        if (description != null) {
            description = description.trim();
        }
    }
}

