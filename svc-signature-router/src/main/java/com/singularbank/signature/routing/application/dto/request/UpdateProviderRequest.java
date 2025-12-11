package com.singularbank.signature.routing.application.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Update Provider Request DTO
 * Story 13.4: Provider CRUD REST API
 * Epic 13: Providers CRUD Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProviderRequest {
    
    @NotBlank(message = "Provider name is required")
    @Size(max = 100, message = "Provider name must be at most 100 characters")
    private String providerName;
    
    private Boolean enabled;
    
    @Min(value = 1, message = "Priority must be at least 1")
    @Max(value = 100, message = "Priority must be at most 100")
    private Integer priority;
    
    @Min(value = 1, message = "Timeout must be at least 1 second")
    @Max(value = 60, message = "Timeout must be at most 60 seconds")
    private Integer timeoutSeconds;
    
    @Min(value = 0, message = "Retry attempts cannot be negative")
    @Max(value = 5, message = "Retry attempts must be at most 5")
    private Integer retryMaxAttempts;
    
    private Map<String, Object> configJson;
    
    @Size(max = 500, message = "Vault path must be at most 500 characters")
    private String vaultPath;
}

