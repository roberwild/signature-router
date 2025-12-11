package com.singularbank.signature.routing.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

/**
 * DTO for monetary amounts.
 * Story 2.1: Create Signature Request Use Case
 * 
 * @param value Monetary value
 * @param currency ISO 4217 currency code
 */
@Schema(description = "Monetary amount with currency")
public record MoneyDto(
    
    @Schema(
        description = "Monetary value (must be positive)",
        example = "100.00",
        required = true
    )
    @NotNull(message = "amount value is required")
    @DecimalMin(value = "0.01", message = "amount value must be positive")
    BigDecimal value,
    
    @Schema(
        description = "ISO 4217 currency code",
        example = "EUR",
        required = true
    )
    @NotBlank(message = "currency is required")
    @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be a valid ISO 4217 code (3 uppercase letters)")
    String currency
) {
    
    /**
     * Compact constructor for validation.
     */
    public MoneyDto {
        if (currency != null) {
            currency = currency.trim().toUpperCase();
        }
    }
}

