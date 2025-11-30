package com.bank.signature.application.dto;

import com.bank.signature.domain.model.valueobject.ChannelType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating an existing routing rule.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * @param name Human-readable rule name
 * @param condition SpEL expression for rule matching
 * @param targetChannel Channel to use when rule matches
 * @param priority Rule evaluation priority (lower = higher priority)
 * @param enabled Whether the rule is active
 */
@Schema(description = "Request to update an existing routing rule")
public record UpdateRoutingRuleDto(
    
    @Schema(
        description = "Human-readable name for the rule",
        example = "High-value transactions to Voice",
        required = true
    )
    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name must not exceed 200 characters")
    String name,
    
    @Schema(
        description = "SpEL expression condition for rule matching",
        example = "context.amount.value > 1000.00 and context.amount.currency == 'EUR'",
        required = true
    )
    @NotBlank(message = "condition is required")
    @Size(max = 1000, message = "condition must not exceed 1000 characters")
    String condition,
    
    @Schema(
        description = "Target channel when rule matches",
        example = "VOICE",
        required = true
    )
    @NotNull(message = "targetChannel is required")
    ChannelType targetChannel,
    
    @Schema(
        description = "Rule evaluation priority (lower number = higher priority)",
        example = "10",
        required = true
    )
    @NotNull(message = "priority is required")
    @Min(value = 1, message = "priority must be at least 1")
    Integer priority,
    
    @Schema(
        description = "Whether the rule is active",
        example = "true",
        required = true
    )
    @NotNull(message = "enabled is required")
    Boolean enabled
) {
    
    /**
     * Compact constructor for validation.
     */
    public UpdateRoutingRuleDto {
        if (name != null) {
            name = name.trim();
        }
        if (condition != null) {
            condition = condition.trim();
        }
    }
}

