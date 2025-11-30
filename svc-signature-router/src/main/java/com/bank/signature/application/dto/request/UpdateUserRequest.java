package com.bank.signature.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import lombok.Builder;

import java.util.List;

/**
 * Update User Request DTO
 * Story 12.5: Keycloak Users Proxy Endpoint
 * 
 * Request to update an existing user in Keycloak
 */
@Builder
@Schema(description = "Request to update user information")
public record UpdateUserRequest(
    
    @Email(message = "Email must be valid")
    @Schema(description = "Email address", example = "updated@singularbank.com")
    String email,
    
    @Schema(description = "First name", example = "Jane")
    String firstName,
    
    @Schema(description = "Last name", example = "Smith")
    String lastName,
    
    @Schema(description = "Whether user is enabled", example = "true")
    Boolean enabled,
    
    @Schema(description = "User roles", example = "[\"ADMIN\", \"OPERATOR\"]")
    List<String> roles
) {}

