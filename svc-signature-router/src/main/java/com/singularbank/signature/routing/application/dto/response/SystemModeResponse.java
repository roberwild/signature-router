package com.singularbank.signature.routing.application.dto.response;

import com.singularbank.signature.routing.domain.model.valueobject.SystemMode;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for system mode queries.
 * Story 4.3 AC8: Admin API Override
 * 
 * @param currentMode      the current system operational mode
 * @param since            timestamp when current mode was activated
 * @param reason           reason for current mode (if DEGRADED or MAINTENANCE)
 * @param degradedProviders list of providers currently in degraded state
 */
@Schema(description = "Current system operational mode information")
public record SystemModeResponse(
    
    @Schema(description = "Current system mode", example = "DEGRADED")
    SystemMode currentMode,
    
    @Schema(description = "Timestamp when current mode was activated", example = "2025-11-28T10:30:00Z")
    Instant since,
    
    @Schema(description = "Reason for current mode", example = "Error rate 85% exceeds threshold 80%")
    String reason,
    
    @Schema(description = "List of providers in degraded state", example = "[\"SMS\", \"PUSH\"]")
    List<String> degradedProviders
) {
}

