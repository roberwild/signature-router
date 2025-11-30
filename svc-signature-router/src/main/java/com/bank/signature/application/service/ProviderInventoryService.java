package com.bank.signature.application.service;

import com.bank.signature.application.dto.response.ProviderListResponse;

import java.util.List;

/**
 * Provider Inventory Service
 * Story 12.3: Providers Read-Only Endpoint
 * 
 * Lists configured providers from Spring beans.
 * Read-only - CRUD not implemented (future Epic 13).
 */
public interface ProviderInventoryService {
    
    /**
     * Get list of all configured providers
     * 
     * @return List of providers with health status
     */
    List<ProviderListResponse> getAllProviders();
    
    /**
     * Get single provider by ID
     * 
     * @param providerId Provider unique identifier
     * @return Provider information with health status
     * @throws IllegalArgumentException if provider not found
     */
    ProviderListResponse getProviderById(String providerId);
}

