package com.bank.signature.application.usecase.provider;

import com.bank.signature.domain.model.ProviderConfig;

/**
 * Create Provider Use Case
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 * 
 * Use case for creating a new provider configuration.
 * 
 * Business Rules:
 * - Provider code must be unique
 * - All required fields must be provided
 * - Credentials must be stored in Vault (not in DB)
 * - Publishes ProviderCreatedEvent
 * - Records creation in history
 */
public interface CreateProviderUseCase {
    
    /**
     * Create a new provider configuration
     * 
     * @param providerConfig Provider to create
     * @return Created provider with generated ID
     * @throws IllegalArgumentException if provider code already exists
     * @throws IllegalStateException if validation fails
     */
    ProviderConfig execute(ProviderConfig providerConfig);
}

