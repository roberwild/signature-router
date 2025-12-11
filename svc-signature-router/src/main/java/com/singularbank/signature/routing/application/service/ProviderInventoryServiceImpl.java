package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.application.dto.response.ProviderListResponse;
import com.singularbank.signature.routing.application.dto.response.ProviderResponse;
import com.singularbank.signature.routing.domain.model.ProviderType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Implementation of Provider Inventory Service
 * Story 13.4: Provider CRUD REST API
 * Epic 13: Providers CRUD Management
 * 
 * Lists configured providers from database.
 * This is part of the providers CRUD system.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderInventoryServiceImpl implements ProviderInventoryService {
    
    // TODO: Inject ProviderConfigRepository when Epic 13 is fully implemented
    
    /**
     * Get all configured providers.
     * 
     * @return Provider list response with all providers
     */
    @Override
    public ProviderListResponse getAllProviders() {
        log.info("Retrieving all configured providers");
        
        // TODO: Query from ProviderConfigRepository
        // For now, return empty list as placeholder
        List<ProviderResponse> providers = Collections.emptyList();
        
        return ProviderListResponse.builder()
            .providers(providers)
            .totalCount(0L)
            .build();
    }
    
    /**
     * Get a specific provider by its ID.
     * 
     * @param providerId Provider unique identifier
     * @return Provider response
     * @throws IllegalArgumentException if provider not found
     */
    @Override
    public ProviderResponse getProviderById(String providerId) {
        log.info("Retrieving provider: {}", providerId);
        
        // TODO: Query from ProviderConfigRepository
        throw new IllegalArgumentException("Provider not found: " + providerId);
    }
}
