package com.singularbank.signature.routing.application.usecase.provider.impl;

import com.singularbank.signature.routing.application.usecase.provider.CreateProviderUseCase;
import com.singularbank.signature.routing.domain.event.ProviderConfigEvent;
import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.port.outbound.ProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Create Provider Use Case Implementation
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CreateProviderUseCaseImpl implements CreateProviderUseCase {
    
    private final ProviderConfigRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    @Transactional
    public ProviderConfig execute(ProviderConfig providerConfig) {
        log.info("Creating provider: code={}, type={}", providerConfig.getProviderCode(), providerConfig.getProviderType());
        
        // Validate
        providerConfig.validate();
        
        // Check uniqueness
        if (repository.existsByCode(providerConfig.getProviderCode())) {
            throw new IllegalArgumentException("Provider code already exists: " + providerConfig.getProviderCode());
        }
        
        // Generate ID if not provided
        if (providerConfig.getId() == null) {
            providerConfig = ProviderConfig.builder()
                .id(UUID.randomUUID())
                .providerType(providerConfig.getProviderType())
                .providerName(providerConfig.getProviderName())
                .providerCode(providerConfig.getProviderCode())
                .enabled(providerConfig.isEnabled())
                .priority(providerConfig.getPriority())
                .timeoutSeconds(providerConfig.getTimeoutSeconds())
                .retryMaxAttempts(providerConfig.getRetryMaxAttempts())
                .configJson(providerConfig.getConfigJson())
                .vaultPath(providerConfig.getVaultPath())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(providerConfig.getCreatedBy())
                .build();
        }
        
        // Save
        ProviderConfig saved = repository.save(providerConfig);
        
        // Publish event
        ProviderConfigEvent event = ProviderConfigEvent.created(
            saved.getId(),
            saved.getProviderCode(),
            saved.getProviderType(),
            saved.getCreatedBy()
        );
        eventPublisher.publishEvent(event);
        
        log.info("Provider created: id={}, code={}", saved.getId(), saved.getProviderCode());
        
        return saved;
    }
}

