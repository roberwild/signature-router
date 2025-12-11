package com.singularbank.signature.routing.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Provider History Response DTO
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderHistoryResponse {
    
    private UUID id;
    
    @JsonProperty("provider_config_id")
    private UUID providerConfigId;
    
    @JsonProperty("changed_at")
    private Instant changedAt;
    
    @JsonProperty("changed_by")
    private String changedBy;
    
    @JsonProperty("change_type")
    private String changeType;
    
    @JsonProperty("old_config")
    private Map<String, Object> oldConfigJson;
    
    @JsonProperty("new_config")
    private Map<String, Object> newConfigJson;
    
    private String remarks;
}

