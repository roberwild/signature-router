package com.singularbank.signature.routing.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for SpEL validation request.
 * Story 10.6: SpEL Security
 * 
 * @param expression SpEL expression to validate
 */
@Schema(description = "Request to validate a SpEL expression")
public record SpelValidationRequest(
    
    @Schema(
        description = "SpEL expression to validate",
        example = "context.amount.value > 1000",
        required = true
    )
    @NotBlank(message = "SpEL expression is required")
    String expression
) {}

