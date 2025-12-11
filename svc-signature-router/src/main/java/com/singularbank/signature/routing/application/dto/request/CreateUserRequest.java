package com.singularbank.signature.routing.application.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

/**
 * Create User Request DTO
 * Story 12.5: Keycloak Users Proxy Endpoint
 * 
 * Request to create a new user in Keycloak
 */
@Builder
@Schema(description = "Request to create a new user")
public record CreateUserRequest(
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Schema(description = "Username (unique)", example = "newuser", required = true)
    String username,
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Schema(description = "Email address", example = "newuser@singularbank.com", required = true)
    String email,
    
    @NotBlank(message = "First name is required")
    @Schema(description = "First name", example = "John", required = true)
    String firstName,
    
    @NotBlank(message = "Last name is required")
    @Schema(description = "Last name", example = "Doe", required = true)
    String lastName,
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Schema(description = "Initial password", example = "SecurePassword123!", required = true)
    String password,
    
    @Schema(description = "User roles", example = "[\"VIEWER\"]")
    List<String> roles
) {}

