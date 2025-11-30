package com.bank.signature.application.dto.response;

import com.bank.signature.domain.model.ProviderType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Provider Template Response DTO
 * Story 13.7: Provider Templates & Presets
 * Epic 13: Providers CRUD Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderTemplateResponse {
    
    @JsonProperty("provider_type")
    private ProviderType providerType;
    
    @JsonProperty("template_name")
    private String templateName;
    
    private String description;
    
    @JsonProperty("default_config")
    private Map<String, Object> defaultConfig;
    
    @JsonProperty("required_credentials")
    private List<String> requiredCredentials;
    
    @JsonProperty("recommended_timeout_seconds")
    private int recommendedTimeoutSeconds;
    
    @JsonProperty("recommended_retry_max_attempts")
    private int recommendedRetryMaxAttempts;
    
    @JsonProperty("recommended_priority")
    private int recommendedPriority;
}

