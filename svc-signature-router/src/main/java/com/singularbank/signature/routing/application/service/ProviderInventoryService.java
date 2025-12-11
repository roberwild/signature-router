package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.application.dto.response.ProviderListResponse;
import com.singularbank.signature.routing.application.dto.response.ProviderResponse;

/**
 * Provider Inventory Service
 * Story 13.4: Provider CRUD REST API
 * Epic 13: Providers CRUD Management
 * 
 * Lists configured providers from database.
 */
public interface ProviderInventoryService {
    
    /**
     * Get list of all configured providers
     * 
     * @return Provider list response with all providers
     */
    ProviderListResponse getAllProviders();
    
    /**
     * Get single provider by ID
     * 
     * @param providerId Provider unique identifier (UUID as string)
     * @return Provider response
     * @throws IllegalArgumentException if provider not found
     */
    ProviderResponse getProviderById(String providerId);
}
