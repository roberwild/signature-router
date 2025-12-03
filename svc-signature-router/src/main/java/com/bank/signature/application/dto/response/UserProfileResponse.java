package com.bank.signature.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * Response DTO for user profile.
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Schema(description = "User profile information")
@Builder
public record UserProfileResponse(
    @Schema(description = "User profile ID")
    UUID id,
    
    @Schema(description = "Username")
    String username,
    
    @Schema(description = "Email address")
    String email,
    
    @Schema(description = "Full name")
    String fullName,
    
    @Schema(description = "First name")
    String firstName,
    
    @Schema(description = "Last name")
    String lastName,
    
    @Schema(description = "User roles")
    Set<String> roles,
    
    @Schema(description = "Primary role for display")
    String primaryRole,
    
    @Schema(description = "Department")
    String department,
    
    @Schema(description = "Whether user is active")
    boolean active,
    
    @Schema(description = "First login timestamp")
    Instant firstLoginAt,
    
    @Schema(description = "Last login timestamp")
    Instant lastLoginAt,
    
    @Schema(description = "Total login count")
    int loginCount,
    
    @Schema(description = "Last login IP address")
    String lastLoginIp
) {}

