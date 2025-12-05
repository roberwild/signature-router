package com.bank.signature.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for toggling a routing rule's enabled status.
 * Story 14.3: Rule Enable/Disable Toggle
 * 
 * @param enabled Whether the rule should be enabled or disabled
 */
@Schema(description = "Request to toggle a routing rule's enabled status")
public record ToggleRuleDto(

        @Schema(description = "Whether the rule should be enabled (true) or disabled (false)", example = "true", required = true) @NotNull(message = "enabled is required") Boolean enabled) {
}
