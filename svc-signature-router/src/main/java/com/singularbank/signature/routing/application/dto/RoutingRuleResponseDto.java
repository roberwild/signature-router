package com.singularbank.signature.routing.application.dto;

import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for routing rule response.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * @param id Unique identifier
 * @param name Human-readable rule name
 * @param condition SpEL expression condition
 * @param targetChannel Target channel when rule matches
 * @param priority Rule evaluation priority
 * @param enabled Whether the rule is active
 * @param createdBy User who created the rule
 * @param createdAt Timestamp when the rule was created
 * @param modifiedBy User who last modified the rule
 * @param modifiedAt Timestamp when the rule was last modified
 */
@Schema(description = "Response containing routing rule details")
public record RoutingRuleResponseDto(
    
    @Schema(
        description = "Unique identifier of the routing rule (UUIDv7)",
        example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001"
    )
    UUID id,
    
    @Schema(
        description = "Human-readable name for the rule",
        example = "High-value transactions to Voice"
    )
    String name,
    
    @Schema(
        description = "Optional detailed description of the rule purpose",
        example = "Routes high-value transactions (>1000 EUR) to voice channel for enhanced security"
    )
    String description,
    
    @Schema(
        description = "SpEL expression condition",
        example = "amountValue > 1000.00"
    )
    String condition,
    
    @Schema(
        description = "Target channel when rule matches",
        example = "VOICE"
    )
    ChannelType targetChannel,
    
    @Schema(
        description = "Optional provider ID to use for this rule",
        example = "550e8400-e29b-41d4-a716-446655440000"
    )
    UUID providerId,
    
    @Schema(
        description = "Rule evaluation priority (lower = higher priority)",
        example = "10"
    )
    Integer priority,
    
    @Schema(
        description = "Whether the rule is active",
        example = "true"
    )
    Boolean enabled,
    
    @Schema(
        description = "User who created the rule",
        example = "admin@bank.com"
    )
    String createdBy,
    
    @Schema(
        description = "Timestamp when the rule was created",
        example = "2025-11-27T10:30:00Z"
    )
    Instant createdAt,
    
    @Schema(
        description = "User who last modified the rule",
        example = "admin@bank.com"
    )
    String modifiedBy,
    
    @Schema(
        description = "Timestamp when the rule was last modified",
        example = "2025-11-27T11:45:00Z"
    )
    Instant modifiedAt
) {
}

