package com.singularbank.signature.routing.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Provider Config History Domain Model
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 * 
 * Immutable audit record of provider configuration changes.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderConfigHistory {
    
    private UUID id;
    private UUID providerConfigId;
    private Instant changedAt;
    private String changedBy;
    private String changeType; // CREATE, UPDATE, DELETE, ENABLE, DISABLE
    private Map<String, Object> oldConfigJson;
    private Map<String, Object> newConfigJson;
    private String remarks;
}

