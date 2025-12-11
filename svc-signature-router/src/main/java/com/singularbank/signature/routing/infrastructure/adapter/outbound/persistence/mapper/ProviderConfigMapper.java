package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.mapper;

import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.ProviderConfigEntity;
import org.springframework.stereotype.Component;

/**
 * Provider Config Mapper
 * Story 13.2: Provider Domain Model & Repository
 * Epic 13: Providers CRUD Management
 * 
 * Maps between domain model (ProviderConfig) and JPA entity (ProviderConfigEntity).
 * 
 * Follows hexagonal architecture:
 * - Domain model is infrastructure-agnostic
 * - JPA entity is infrastructure-specific
 * - Mapper translates between the two
 */
@Component
public class ProviderConfigMapper {
    
    /**
     * Convert JPA entity to domain model
     * 
     * @param entity JPA entity
     * @return Domain model
     */
    public ProviderConfig toDomain(ProviderConfigEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return ProviderConfig.builder()
            .id(entity.getId())
            .providerType(entity.getProviderType())
            .providerName(entity.getProviderName())
            .providerCode(entity.getProviderCode())
            .enabled(entity.isEnabled())
            .priority(entity.getPriority())
            .timeoutSeconds(entity.getTimeoutSeconds())
            .retryMaxAttempts(entity.getRetryMaxAttempts())
            .configJson(entity.getConfigJson())
            .vaultPath(entity.getVaultPath())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .createdBy(entity.getCreatedBy())
            .updatedBy(entity.getUpdatedBy())
            .build();
    }
    
    /**
     * Convert domain model to JPA entity
     * 
     * @param domain Domain model
     * @return JPA entity
     */
    public ProviderConfigEntity toEntity(ProviderConfig domain) {
        if (domain == null) {
            return null;
        }
        
        return ProviderConfigEntity.builder()
            .id(domain.getId())
            .providerType(domain.getProviderType())
            .providerName(domain.getProviderName())
            .providerCode(domain.getProviderCode())
            .enabled(domain.isEnabled())
            .priority(domain.getPriority())
            .timeoutSeconds(domain.getTimeoutSeconds())
            .retryMaxAttempts(domain.getRetryMaxAttempts())
            .configJson(domain.getConfigJson())
            .vaultPath(domain.getVaultPath())
            .createdAt(domain.getCreatedAt())
            .updatedAt(domain.getUpdatedAt())
            .createdBy(domain.getCreatedBy())
            .updatedBy(domain.getUpdatedBy())
            .build();
    }
    
    /**
     * Update entity from domain model
     * Used for updates (preserves entity instance)
     * 
     * @param entity Existing entity
     * @param domain Domain model with updates
     */
    public void updateEntity(ProviderConfigEntity entity, ProviderConfig domain) {
        entity.setProviderType(domain.getProviderType());
        entity.setProviderName(domain.getProviderName());
        entity.setProviderCode(domain.getProviderCode());
        entity.setEnabled(domain.isEnabled());
        entity.setPriority(domain.getPriority());
        entity.setTimeoutSeconds(domain.getTimeoutSeconds());
        entity.setRetryMaxAttempts(domain.getRetryMaxAttempts());
        entity.setConfigJson(domain.getConfigJson());
        entity.setVaultPath(domain.getVaultPath());
        entity.setUpdatedBy(domain.getUpdatedBy());
        // updatedAt is set automatically by @PreUpdate
    }
}

