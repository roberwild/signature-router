package com.bank.signature.application.usecase.provider;

import com.bank.signature.domain.model.ProviderConfig;
import com.bank.signature.domain.model.ProviderType;

import java.util.List;

/**
 * List Providers Use Case
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 */
public interface ListProvidersUseCase {
    List<ProviderConfig> execute();
    List<ProviderConfig> executeByType(ProviderType type);
    List<ProviderConfig> executeByEnabled(boolean enabled);
}

