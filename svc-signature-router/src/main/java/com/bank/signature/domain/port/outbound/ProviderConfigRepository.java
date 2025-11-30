package com.bank.signature.domain.port.outbound;

import com.bank.signature.domain.model.ProviderConfig;
import com.bank.signature.domain.model.ProviderType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Provider Config Repository Port (Outbound)
 * Story 13.2: Provider Domain Model & Repository
 * Epic 13: Providers CRUD Management
 * 
 * Hexagonal Architecture - Outbound Port
 * 
 * This interface defines the contract for provider configuration persistence.
 * Implementation will be in infrastructure layer (JPA adapter).
 * 
 * Methods follow domain language and business needs.
 */
public interface ProviderConfigRepository {
    
    /**
     * Save or update provider configuration
     * 
     * @param providerConfig Provider to save
     * @return Saved provider (with generated ID if new)
     */
    ProviderConfig save(ProviderConfig providerConfig);
    
    /**
     * Find provider by ID
     * 
     * @param id Provider ID
     * @return Optional provider
     */
    Optional<ProviderConfig> findById(UUID id);
    
    /**
     * Find provider by unique code
     * 
     * @param providerCode Provider code (e.g., "twilio-sms-prod")
     * @return Optional provider
     */
    Optional<ProviderConfig> findByCode(String providerCode);
    
    /**
     * Find all providers
     * 
     * @return List of all providers
     */
    List<ProviderConfig> findAll();
    
    /**
     * Find all providers of a specific type
     * 
     * @param providerType Provider type (SMS, PUSH, VOICE, BIOMETRIC)
     * @return List of providers
     */
    List<ProviderConfig> findByType(ProviderType providerType);
    
    /**
     * Find all enabled or disabled providers
     * 
     * @param enabled true for enabled, false for disabled
     * @return List of providers
     */
    List<ProviderConfig> findByEnabled(boolean enabled);
    
    /**
     * Find all enabled providers of a specific type
     * Ordered by priority (ascending - 1 is highest priority)
     * 
     * This is the main query for fallback chain resolution
     * 
     * @param providerType Provider type
     * @param enabled true for enabled providers
     * @return List of providers ordered by priority
     */
    List<ProviderConfig> findByTypeAndEnabledOrderByPriority(ProviderType providerType, boolean enabled);
    
    /**
     * Delete provider by ID
     * Note: Should be soft delete (set enabled=false) in most cases
     * 
     * @param id Provider ID
     */
    void deleteById(UUID id);
    
    /**
     * Check if provider code already exists
     * Used for uniqueness validation
     * 
     * @param providerCode Provider code
     * @return true if exists
     */
    boolean existsByCode(String providerCode);
    
    /**
     * Check if provider code exists excluding specific ID
     * Used for update validation (allow same code for same provider)
     * 
     * @param providerCode Provider code
     * @param excludeId ID to exclude from check
     * @return true if exists
     */
    boolean existsByCodeAndIdNot(String providerCode, UUID excludeId);
    
    /**
     * Count total providers
     * 
     * @return Total count
     */
    long count();
    
    /**
     * Count providers by type
     * 
     * @param providerType Provider type
     * @return Count
     */
    long countByType(ProviderType providerType);
    
    /**
     * Count enabled providers
     * 
     * @return Count
     */
    long countByEnabled(boolean enabled);
}

