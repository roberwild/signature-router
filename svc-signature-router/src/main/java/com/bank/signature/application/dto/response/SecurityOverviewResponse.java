package com.bank.signature.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

/**
 * Security Overview Response DTO
 * Story 12.6: Keycloak Security Audit Endpoint
 * 
 * Aggregated security metrics for the Admin Panel
 */
@Builder
@Schema(description = "Security overview with aggregated metrics")
public record SecurityOverviewResponse(
    
    @Schema(description = "Total number of users in the system", example = "150")
    int totalUsers,
    
    @Schema(description = "Number of enabled users", example = "142")
    int enabledUsers,
    
    @Schema(description = "Percentage of users with 2FA enabled", example = "68.5")
    double twoFactorPercentage,
    
    @Schema(description = "Number of active sessions/tokens", example = "45")
    int activeTokens,
    
    @Schema(description = "Number of failed login attempts in last 24h", example = "12")
    int failedLogins24h,
    
    @Schema(description = "Number of successful logins in last 24h", example = "289")
    int successfulLogins24h,
    
    @Schema(description = "Overall security status", example = "GOOD", allowableValues = {"GOOD", "WARNING", "CRITICAL"})
    String status
) {}

