package com.bank.signature.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;

/**
 * Alert Response DTO
 * Story 12.7: Prometheus AlertManager Integration
 * 
 * Represents a system alert from Prometheus AlertManager
 */
@Builder
@Schema(description = "System alert from Prometheus AlertManager")
public record AlertResponse(
    
    @Schema(description = "Alert unique identifier", example = "alert-001")
    String id,
    
    @Schema(description = "Alert name", example = "HighErrorRate")
    String name,
    
    @Schema(description = "Alert description", example = "Error rate above 5% for 5 minutes")
    String description,
    
    @Schema(description = "Severity level", example = "CRITICAL", allowableValues = {"CRITICAL", "WARNING", "INFO"})
    String severity,
    
    @Schema(description = "Alert status", example = "ACTIVE", allowableValues = {"ACTIVE", "ACKNOWLEDGED", "RESOLVED"})
    String status,
    
    @Schema(description = "When the alert started")
    Instant startsAt,
    
    @Schema(description = "When the alert ended (null if active)")
    Instant endsAt,
    
    @Schema(description = "Alert labels", example = "{\"service\": \"signature-router\", \"env\": \"prod\"}")
    Map<String, String> labels,
    
    @Schema(description = "Alert annotations", example = "{\"runbook\": \"https://runbook.example.com/high-error-rate\"}")
    Map<String, String> annotations
) {}

