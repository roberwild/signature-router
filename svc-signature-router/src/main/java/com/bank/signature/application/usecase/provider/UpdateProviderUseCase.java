package com.bank.signature.application.usecase.provider;

import com.bank.signature.domain.model.ProviderConfig;

/**
 * Update Provider Use Case
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 */
public interface UpdateProviderUseCase {
    ProviderConfig execute(ProviderConfig providerConfig);
}

