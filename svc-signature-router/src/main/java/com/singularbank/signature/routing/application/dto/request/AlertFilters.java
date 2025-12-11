package com.singularbank.signature.routing.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

/**
 * Alert Filters DTO
 * Story 12.7: Prometheus AlertManager Integration
 * 
 * Filters for querying alerts
 */
@Builder
@Schema(description = "Filters for querying alerts")
public record AlertFilters(
    
    @Schema(description = "Filter by severity", example = "CRITICAL", allowableValues = {"CRITICAL", "WARNING", "INFO"})
    String severity,
    
    @Schema(description = "Filter by status", example = "ACTIVE", allowableValues = {"ACTIVE", "ACKNOWLEDGED", "RESOLVED"})
    String status
) {}

