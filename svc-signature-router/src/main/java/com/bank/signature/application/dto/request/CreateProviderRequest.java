package com.bank.signature.application.dto.request;

import com.bank.signature.domain.model.ProviderType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Create Provider Request DTO
 * Story 13.4: Provider CRUD REST API
 * Epic 13: Providers CRUD Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProviderRequest {
    
    @NotNull(message = "Provider type is required")
    private ProviderType providerType;
    
    @NotBlank(message = "Provider name is required")
    @Size(max = 100, message = "Provider name must be at most 100 characters")
    private String providerName;
    
    @NotBlank(message = "Provider code is required")
    @Size(max = 50, message = "Provider code must be at most 50 characters")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Provider code must be lowercase alphanumeric with hyphens")
    private String providerCode;
    
    @Builder.Default
    private boolean enabled = true;
    
    @Min(value = 1, message = "Priority must be at least 1")
    @Max(value = 100, message = "Priority must be at most 100")
    @Builder.Default
    private int priority = 10;
    
    @Min(value = 1, message = "Timeout must be at least 1 second")
    @Max(value = 60, message = "Timeout must be at most 60 seconds")
    @Builder.Default
    private int timeoutSeconds = 5;
    
    @Min(value = 0, message = "Retry attempts cannot be negative")
    @Max(value = 5, message = "Retry attempts must be at most 5")
    @Builder.Default
    private int retryMaxAttempts = 3;
    
    @NotNull(message = "Config JSON is required")
    @NotEmpty(message = "Config JSON cannot be empty")
    private Map<String, Object> configJson;
    
    @NotBlank(message = "Vault path is required")
    @Size(max = 500, message = "Vault path must be at most 500 characters")
    private String vaultPath;
}

