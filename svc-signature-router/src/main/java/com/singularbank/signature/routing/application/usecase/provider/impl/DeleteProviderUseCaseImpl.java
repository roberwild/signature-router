package com.singularbank.signature.routing.application.usecase.provider.impl;

import com.singularbank.signature.routing.application.usecase.provider.DeleteProviderUseCase;
import com.singularbank.signature.routing.domain.event.ProviderConfigEvent;
import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.port.outbound.ProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Delete Provider Use Case Implementation
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 * 
 * Implements soft delete (disable provider) for safety
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeleteProviderUseCaseImpl implements DeleteProviderUseCase {
    
    private final ProviderConfigRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    @Transactional
    public void execute(UUID providerId) {
        log.info("Deleting provider: id={}", providerId);
        
        // Check exists
        ProviderConfig provider = repository.findById(providerId)
            .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + providerId));
        
        // Soft delete - disable provider
        provider.disable();
        repository.save(provider);
        
        // Publish event
        ProviderConfigEvent event = ProviderConfigEvent.disabled(
            provider.getId(),
            provider.getProviderCode(),
            provider.getProviderType(),
            "system",
            "Deleted via API"
        );
        eventPublisher.publishEvent(event);
        
        log.info("Provider deleted (disabled): id={}, code={}", providerId, provider.getProviderCode());
    }
}

