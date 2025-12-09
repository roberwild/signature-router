package com.bank.signature.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * Access Event Response DTO
 * Story 12.6: Keycloak Security Audit Endpoint
 * Epic 17: Updated to work with real audit_log data
 * 
 * Represents a login/access event for security audit
 */
@Schema(description = "Access event (login/logout) for security audit")
public record AccessEventResponse(
    
    @Schema(description = "Event ID", example = "evt-1234")
    String id,
    
    @Schema(description = "Event timestamp")
    Instant timestamp,
    
    @Schema(description = "Event type", example = "LOGIN", allowableValues = {"LOGIN", "LOGOUT", "LOGIN_ERROR"})
    String eventType,
    
    @Schema(description = "Username", example = "admin")
    String username,
    
    @Schema(description = "User ID (Keycloak)", example = "user-1")
    String userId,
    
    @Schema(description = "IP address", example = "192.168.1.100")
    String ipAddress,
    
    @Schema(description = "Whether the event was successful", example = "true")
    boolean success,
    
    @Schema(description = "Error message (if failed)", example = "Invalid credentials")
    String error
) {}

