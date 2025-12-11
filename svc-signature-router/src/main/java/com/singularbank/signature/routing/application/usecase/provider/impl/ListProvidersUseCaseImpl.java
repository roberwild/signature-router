package com.singularbank.signature.routing.application.usecase.provider.impl;

import com.singularbank.signature.routing.application.usecase.provider.ListProvidersUseCase;
import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.model.ProviderType;
import com.singularbank.signature.routing.domain.port.outbound.ProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * List Providers Use Case Implementation
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ListProvidersUseCaseImpl implements ListProvidersUseCase {
    
    private final ProviderConfigRepository repository;
    
    @Override
    @Transactional(readOnly = true)
    public List<ProviderConfig> execute() {
        log.debug("Listing all providers");
        return repository.findAll();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProviderConfig> executeByType(ProviderType type) {
        log.debug("Listing providers by type: {}", type);
        return repository.findByType(type);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProviderConfig> executeByEnabled(boolean enabled) {
        log.debug("Listing providers by enabled: {}", enabled);
        return repository.findByEnabled(enabled);
    }
}

