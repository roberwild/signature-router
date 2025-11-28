package com.bank.signature.application.controller;

import com.bank.signature.application.dto.request.SetSystemModeRequest;
import com.bank.signature.application.dto.response.SystemModeResponse;
import com.bank.signature.domain.model.valueobject.SystemMode;
import com.bank.signature.infrastructure.resilience.DegradedModeManager;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for system mode management.
 * Story 4.3 AC8: Admin API Override
 * 
 * Allows administrators to:
 * - Query current system mode
 * - Manually set system to DEGRADED or MAINTENANCE mode
 * - Return system to NORMAL operation
 * 
 * Security: ALL endpoints require ROLE_ADMIN
 */
@RestController
@RequestMapping("/admin/system/mode")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - System Mode", description = "System operational mode management (admin only)")
@SecurityRequirement(name = "Bearer Authentication")
public class SystemModeController {
    
    private final DegradedModeManager degradedModeManager;
    
    /**
     * Get current system operational mode.
     * Story 4.3 AC8: Admin API Override
     * 
     * Returns:
     * - Current mode (NORMAL, DEGRADED, MAINTENANCE)
     * - Since timestamp (when mode was activated)
     * - Reason (if DEGRADED or MAINTENANCE)
     * - List of degraded providers
     * 
     * @return ResponseEntity with SystemModeResponse
     */
    @GetMapping
    @Operation(
        summary = "Get current system mode",
        description = "Retrieves the current operational mode of the system. " +
                      "Requires ROLE_ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "System mode retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = SystemModeResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - Requires ROLE_ADMIN",
            content = @Content(mediaType = "application/json")
        )
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemModeResponse> getCurrentMode() {
        log.debug("Admin requested current system mode");
        
        SystemModeResponse response = new SystemModeResponse(
            degradedModeManager.getCurrentMode(),
            degradedModeManager.getDegradedSince(),  // null if NORMAL
            degradedModeManager.getDegradedReason(),  // null if NORMAL
            degradedModeManager.getDegradedProviders()
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Manually set system operational mode.
     * Story 4.3 AC8: Admin API Override
     * 
     * Use cases:
     * - Set DEGRADED mode for planned maintenance
     * - Set MAINTENANCE mode to reject new requests
     * - Return to NORMAL mode manually
     * 
     * Security: Requires ROLE_ADMIN
     * Audit: Logs user identity and reason
     * 
     * @param request SetSystemModeRequest with mode and reason
     * @return ResponseEntity with updated SystemModeResponse
     */
    @PostMapping
    @Operation(
        summary = "Set system mode manually",
        description = "Manually sets the system operational mode. " +
                      "Requires ROLE_ADMIN. Audit log entry created with user identity."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "System mode updated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = SystemModeResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request (validation errors)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - Requires ROLE_ADMIN",
            content = @Content(mediaType = "application/json")
        )
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemModeResponse> setSystemMode(
        @Valid @RequestBody SetSystemModeRequest request
    ) {
        // TODO Story 4.3: Capture authenticated user identity for audit log
        // For MVP, using "ADMIN" as placeholder
        String adminUser = "ADMIN";  // Replace with SecurityContextHolder.getContext().getAuthentication().getName()
        
        log.warn("🔧 Admin override: setting system mode to {} (reason: \"{}\", user: {})", 
            request.mode(), request.reason(), adminUser);
        
        // Apply mode change
        switch (request.mode()) {
            case DEGRADED -> {
                String reason = (request.reason() != null && !request.reason().isBlank())
                    ? request.reason()
                    : "Manual admin override";
                degradedModeManager.enterDegradedMode(reason);
                
                // TODO Story 4.3: Write audit log entry
                log.info("AUDIT: System mode set to DEGRADED by admin: user={}, reason=\"{}\"", 
                    adminUser, reason);
            }
            case NORMAL -> {
                degradedModeManager.exitDegradedMode();
                
                // TODO Story 4.3: Write audit log entry
                log.info("AUDIT: System mode set to NORMAL by admin: user={}", adminUser);
            }
            case MAINTENANCE -> {
                // For MVP, treat MAINTENANCE same as DEGRADED
                // In production, MAINTENANCE may have different behavior (reject new requests)
                String reason = (request.reason() != null && !request.reason().isBlank())
                    ? request.reason()
                    : "Manual admin override - maintenance";
                degradedModeManager.enterDegradedMode(reason);
                
                // TODO Story 4.3: Write audit log entry
                log.info("AUDIT: System mode set to MAINTENANCE by admin: user={}, reason=\"{}\"", 
                    adminUser, reason);
            }
        }
        
        // Return updated mode
        SystemModeResponse response = new SystemModeResponse(
            degradedModeManager.getCurrentMode(),
            degradedModeManager.getDegradedSince(),
            degradedModeManager.getDegradedReason(),
            degradedModeManager.getDegradedProviders()
        );
        
        return ResponseEntity.ok(response);
    }
}

