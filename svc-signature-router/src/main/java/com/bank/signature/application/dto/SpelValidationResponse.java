package com.bank.signature.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO for SpEL validation response.
 * Story 10.6: SpEL Security
 * 
 * @param isValid Whether the expression is valid
 * @param errorMessage Error message if invalid (null if valid)
 */
@Schema(description = "Result of SpEL expression validation")
public record SpelValidationResponse(
    
    @Schema(
        description = "Whether the SpEL expression is valid",
        example = "true"
    )
    boolean isValid,
    
    @Schema(
        description = "Error message if expression is invalid (null if valid)",
        example = "Dangerous pattern detected: 'runtime' is not allowed"
    )
    String errorMessage
) {
    public static SpelValidationResponse success() {
        return new SpelValidationResponse(true, null);
    }
    
    public static SpelValidationResponse failure(String errorMessage) {
        return new SpelValidationResponse(false, errorMessage);
    }
}

