package com.bank.signature.application.dto.response;

import com.bank.signature.domain.model.ProviderType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Provider Response DTO
 * Story 13.4: Provider CRUD REST API
 * Epic 13: Providers CRUD Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderResponse {
    
    private UUID id;
    
    @JsonProperty("provider_type")
    private ProviderType providerType;
    
    @JsonProperty("provider_name")
    private String providerName;
    
    @JsonProperty("provider_code")
    private String providerCode;
    
    private boolean enabled;
    
    private int priority;
    
    @JsonProperty("timeout_seconds")
    private int timeoutSeconds;
    
    @JsonProperty("retry_max_attempts")
    private int retryMaxAttempts;
    
    @JsonProperty("config_json")
    private Map<String, Object> configJson;
    
    @JsonProperty("vault_path")
    private String vaultPath;
    
    @JsonProperty("created_at")
    private Instant createdAt;
    
    @JsonProperty("updated_at")
    private Instant updatedAt;
    
    @JsonProperty("created_by")
    private String createdBy;
    
    @JsonProperty("updated_by")
    private String updatedBy;
    
    // ========================================
    // MuleSoft Integration Fields (MOCK)
    // These fields simulate MuleSoft data until integration is complete
    // Using camelCase to match frontend TypeScript interfaces
    // ========================================
    
    private String muleSoftProviderId;
    
    private String muleSoftEndpoint;
    
    private String muleSoftStatus;
    
    private String healthStatus;
    
    private Instant lastHealthCheckAt;
    
    private Integer lastHealthLatency;
    
    private Instant lastSyncAt;
    
    // Metrics (MOCK - from MuleSoft when integrated)
    private Integer requestsToday;
    
    private Double successRate;
    
    private Integer avgLatency;
    
    private Integer fallbackCount;
    
    private Instant lastUsedAt;
}

