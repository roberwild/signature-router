package com.bank.signature.application.usecase.provider;

import com.bank.signature.domain.model.ProviderConfig;

import java.util.UUID;

/**
 * Get Provider Use Case
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 */
public interface GetProviderUseCase {
    ProviderConfig execute(UUID providerId);
}

