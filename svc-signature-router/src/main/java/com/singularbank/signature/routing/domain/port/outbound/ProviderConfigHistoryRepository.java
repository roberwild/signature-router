package com.singularbank.signature.routing.domain.port.outbound;

import com.singularbank.signature.routing.domain.model.ProviderConfigHistory;

import java.util.List;
import java.util.UUID;

/**
 * Provider Config History Repository Port
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 */
public interface ProviderConfigHistoryRepository {
    
    /**
     * Save audit history record
     */
    ProviderConfigHistory save(ProviderConfigHistory history);
    
    /**
     * Find all history for a provider
     */
    List<ProviderConfigHistory> findByProviderConfigId(UUID providerConfigId);
    
    /**
     * Find recent history (last N records)
     */
    List<ProviderConfigHistory> findRecentHistory(int limit);
}

