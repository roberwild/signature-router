package com.singularbank.signature.routing.application.dto.request;

import com.singularbank.signature.routing.domain.model.valueobject.SystemMode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for manually setting system mode.
 * Story 4.3 AC8: Admin API Override
 * 
 * @param mode   the target system mode (NORMAL, DEGRADED, MAINTENANCE)
 * @param reason human-readable reason for mode change (required for DEGRADED/MAINTENANCE)
 */
@Schema(description = "Request to manually set system operational mode")
public record SetSystemModeRequest(
    
    @Schema(
        description = "Target system mode",
        example = "DEGRADED",
        allowableValues = {"NORMAL", "DEGRADED", "MAINTENANCE"}
    )
    @NotNull(message = "Mode is required")
    SystemMode mode,
    
    @Schema(
        description = "Reason for mode change (required for DEGRADED/MAINTENANCE)",
        example = "Manual override for planned maintenance window"
    )
    String reason
) {
}

