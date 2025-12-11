package com.singularbank.signature.routing.application.dto;

import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * DTO for creating a new routing rule.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * @param name Human-readable rule name
 * @param condition SpEL expression for rule matching
 * @param targetChannel Channel to use when rule matches
 * @param priority Rule evaluation priority (lower = higher priority)
 * @param enabled Whether the rule is active
 */
@Schema(description = "Request to create a new routing rule")
public record CreateRoutingRuleDto(
    
    @Schema(
        description = "Human-readable name for the rule",
        example = "High-value transactions to Voice",
        required = true
    )
    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name must not exceed 200 characters")
    String name,
    
    @Schema(
        description = "Optional detailed description of the rule purpose and usage",
        example = "Routes high-value transactions (>1000 EUR) to voice channel for enhanced security"
    )
    @Size(max = 1000, message = "description must not exceed 1000 characters")
    String description,
    
    @Schema(
        description = "SpEL expression condition for rule matching. " +
                      "Available variables: amountValue, amountCurrency, " +
                      "merchantId, orderId, description",
        example = "amountValue > 1000.00 && amountCurrency == 'EUR'",
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
        description = "Optional provider ID to use for this rule. If null, the system will select a provider based on the targetChannel.",
        example = "550e8400-e29b-41d4-a716-446655440000",
        required = false
    )
    UUID providerId,
    
    @Schema(
        description = "Rule evaluation priority (lower number = higher priority)",
        example = "10",
        required = true
    )
    @NotNull(message = "priority is required")
    @Min(value = 1, message = "priority must be at least 1")
    Integer priority,
    
    @Schema(
        description = "Whether the rule is active (default: true)",
        example = "true"
    )
    Boolean enabled
) {
    
    /**
     * Compact constructor with default values.
     */
    public CreateRoutingRuleDto {
        if (name != null) {
            name = name.trim();
        }
        if (description != null && !description.isBlank()) {
            description = description.trim();
        }
        if (condition != null) {
            condition = condition.trim();
        }
        if (enabled == null) {
            enabled = true; // Default to enabled
        }
    }
}

