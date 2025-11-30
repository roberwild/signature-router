package com.bank.signature.application.usecase.provider.impl;

import com.bank.signature.application.usecase.provider.UpdateProviderUseCase;
import com.bank.signature.domain.event.ProviderConfigEvent;
import com.bank.signature.domain.model.ProviderConfig;
import com.bank.signature.domain.port.outbound.ProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Update Provider Use Case Implementation
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UpdateProviderUseCaseImpl implements UpdateProviderUseCase {
    
    private final ProviderConfigRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    @Transactional
    public ProviderConfig execute(ProviderConfig providerConfig) {
        log.info("Updating provider: id={}, code={}", providerConfig.getId(), providerConfig.getProviderCode());
        
        // Validate
        providerConfig.validate();
        
        // Check exists
        ProviderConfig existing = repository.findById(providerConfig.getId())
            .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + providerConfig.getId()));
        
        // Check code uniqueness (if changed)
        if (!existing.getProviderCode().equals(providerConfig.getProviderCode())) {
            if (repository.existsByCodeAndIdNot(providerConfig.getProviderCode(), providerConfig.getId())) {
                throw new IllegalArgumentException("Provider code already exists: " + providerConfig.getProviderCode());
            }
        }
        
        // Calculate changes for event
        Map<String, Object> changes = calculateChanges(existing, providerConfig);
        
        // Save
        ProviderConfig updated = repository.save(providerConfig);
        
        // Publish event
        if (!changes.isEmpty()) {
            ProviderConfigEvent event = ProviderConfigEvent.updated(
                updated.getId(),
                updated.getProviderCode(),
                updated.getProviderType(),
                changes,
                updated.getUpdatedBy(),
                null
            );
            eventPublisher.publishEvent(event);
        }
        
        log.info("Provider updated: id={}, changes={}", updated.getId(), changes.size());
        
        return updated;
    }
    
    private Map<String, Object> calculateChanges(ProviderConfig old, ProviderConfig updated) {
        Map<String, Object> changes = new HashMap<>();
        
        if (old.getTimeoutSeconds() != updated.getTimeoutSeconds()) {
            changes.put("timeout_seconds", Map.of("old", old.getTimeoutSeconds(), "new", updated.getTimeoutSeconds()));
        }
        if (old.getRetryMaxAttempts() != updated.getRetryMaxAttempts()) {
            changes.put("retry_max_attempts", Map.of("old", old.getRetryMaxAttempts(), "new", updated.getRetryMaxAttempts()));
        }
        if (old.getPriority() != updated.getPriority()) {
            changes.put("priority", Map.of("old", old.getPriority(), "new", updated.getPriority()));
        }
        if (old.isEnabled() != updated.isEnabled()) {
            changes.put("enabled", Map.of("old", old.isEnabled(), "new", updated.isEnabled()));
        }
        
        return changes;
    }
}

