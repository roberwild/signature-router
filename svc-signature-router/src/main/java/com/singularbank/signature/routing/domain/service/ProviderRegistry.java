package com.singularbank.signature.routing.domain.service;

import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.model.ProviderType;

import java.util.List;
import java.util.Optional;

/**
 * Provider Registry Domain Service
 * Story 13.6: Hot Reload Provider Registry
 * Epic 13: Providers CRUD Management
 * 
 * In-memory registry of active providers.
 * Hot-reloads when provider configurations change.
 * 
 * Purpose:
 * - Fast in-memory access to provider configurations
 * - No database queries during signature request routing
 * - Automatic refresh when providers change (via events)
 * - Thread-safe concurrent access
 */
public interface ProviderRegistry {
    
    /**
     * Get enabled providers for a type, ordered by priority
     * 
     * @param type Provider type
     * @return List of enabled providers (empty if none)
     */
    List<ProviderConfig> getEnabledProviders(ProviderType type);
    
    /**
     * Get provider by code
     * 
     * @param code Provider code
     * @return Optional provider
     */
    Optional<ProviderConfig> getProviderByCode(String code);
    
    /**
     * Get all providers (enabled and disabled)
     * 
     * @return List of all providers
     */
    List<ProviderConfig> getAllProviders();
    
    /**
     * Reload registry from database
     * Called automatically on startup and when providers change
     */
    void reload();
    
    /**
     * Get registry statistics
     * 
     * @return Registry stats
     */
    RegistryStats getStats();
    
    /**
     * Registry Statistics
     */
    record RegistryStats(
        int totalProviders,
        int enabledProviders,
        int smsProviders,
        int pushProviders,
        int voiceProviders,
        int biometricProviders,
        long lastReloadTimestamp
    ) {}
}

