package com.singularbank.signature.routing.application.usecase.provider;

import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.model.ProviderType;

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

