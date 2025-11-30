package com.bank.signature.application.usecase.provider.impl;

import com.bank.signature.application.usecase.provider.GetProviderUseCase;
import com.bank.signature.domain.model.ProviderConfig;
import com.bank.signature.domain.port.outbound.ProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Get Provider Use Case Implementation
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GetProviderUseCaseImpl implements GetProviderUseCase {
    
    private final ProviderConfigRepository repository;
    
    @Override
    @Transactional(readOnly = true)
    public ProviderConfig execute(UUID providerId) {
        log.debug("Getting provider: id={}", providerId);
        
        return repository.findById(providerId)
            .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + providerId));
    }
}

