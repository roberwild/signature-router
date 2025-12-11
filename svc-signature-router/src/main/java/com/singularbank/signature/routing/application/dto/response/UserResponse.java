package com.singularbank.signature.routing.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.Instant;
import java.util.List;

/**
 * User Response DTO
 * Story 12.5: Keycloak Users Proxy Endpoint
 * 
 * Represents a user from Keycloak with mapped roles
 */
@Builder
@Schema(description = "User information from Keycloak")
public record UserResponse(
    
    @Schema(description = "User unique identifier (Keycloak ID)", example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    String id,
    
    @Schema(description = "Username", example = "admin")
    String username,
    
    @Schema(description = "Email address", example = "admin@singularbank.com")
    String email,
    
    @Schema(description = "First name", example = "Admin")
    String firstName,
    
    @Schema(description = "Last name", example = "User")
    String lastName,
    
    @Schema(description = "Whether user is enabled", example = "true")
    boolean enabled,
    
    @Schema(description = "User roles", example = "[\"ADMIN\", \"OPERATOR\"]")
    List<String> roles,
    
    @Schema(description = "User creation timestamp")
    Instant createdAt,
    
    @Schema(description = "Last access timestamp (nullable)")
    Instant lastAccess
) {}

