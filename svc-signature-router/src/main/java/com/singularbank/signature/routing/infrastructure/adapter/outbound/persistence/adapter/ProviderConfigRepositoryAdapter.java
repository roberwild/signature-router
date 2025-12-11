package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.adapter;

import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.model.ProviderType;
import com.singularbank.signature.routing.domain.port.outbound.ProviderConfigRepository;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.ProviderConfigEntity;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.mapper.ProviderConfigMapper;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.repository.ProviderConfigJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Provider Config Repository Adapter
 * Story 13.2: Provider Domain Model & Repository
 * Epic 13: Providers CRUD Management
 * 
 * Hexagonal Architecture - Outbound Adapter (Secondary/Driven)
 * 
 * Implements the domain repository port using JPA.
 * Translates between domain models and JPA entities.
 * 
 * This adapter:
 * - Implements ProviderConfigRepository interface (domain port)
 * - Uses ProviderConfigJpaRepository (Spring Data)
 * - Uses ProviderConfigMapper to convert entities <-> domain models
 * - Hides JPA details from domain layer
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProviderConfigRepositoryAdapter implements ProviderConfigRepository {
    
    private final ProviderConfigJpaRepository jpaRepository;
    private final ProviderConfigMapper mapper;
    
    @Override
    public ProviderConfig save(ProviderConfig providerConfig) {
        log.debug("Saving provider config: {}", providerConfig.getProviderCode());
        
        ProviderConfigEntity entity = mapper.toEntity(providerConfig);
        ProviderConfigEntity saved = jpaRepository.save(entity);
        
        log.info("Provider config saved: id={}, code={}", saved.getId(), saved.getProviderCode());
        
        return mapper.toDomain(saved);
    }
    
    @Override
    public Optional<ProviderConfig> findById(UUID id) {
        log.debug("Finding provider config by ID: {}", id);
        
        return jpaRepository.findById(id)
            .map(mapper::toDomain);
    }
    
    @Override
    public Optional<ProviderConfig> findByCode(String providerCode) {
        log.debug("Finding provider config by code: {}", providerCode);
        
        return jpaRepository.findByProviderCode(providerCode)
            .map(mapper::toDomain);
    }
    
    @Override
    public List<ProviderConfig> findAll() {
        log.debug("Finding all provider configs");
        
        return jpaRepository.findAll().stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ProviderConfig> findByType(ProviderType providerType) {
        log.debug("Finding provider configs by type: {}", providerType);
        
        return jpaRepository.findByProviderType(providerType).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ProviderConfig> findByEnabled(boolean enabled) {
        log.debug("Finding provider configs by enabled: {}", enabled);
        
        return jpaRepository.findByEnabled(enabled).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ProviderConfig> findByTypeAndEnabledOrderByPriority(ProviderType providerType, boolean enabled) {
        log.debug("Finding provider configs by type={} and enabled={} ordered by priority", providerType, enabled);
        
        List<ProviderConfig> providers = jpaRepository
            .findByProviderTypeAndEnabledOrderByPriorityAsc(providerType, enabled).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
        
        log.debug("Found {} providers for type={}", providers.size(), providerType);
        
        return providers;
    }
    
    @Override
    public void deleteById(UUID id) {
        log.info("Deleting provider config: id={}", id);
        jpaRepository.deleteById(id);
    }
    
    @Override
    public boolean existsByCode(String providerCode) {
        return jpaRepository.existsByProviderCode(providerCode);
    }
    
    @Override
    public boolean existsByCodeAndIdNot(String providerCode, UUID excludeId) {
        return jpaRepository.existsByProviderCodeAndIdNot(providerCode, excludeId);
    }
    
    @Override
    public long count() {
        return jpaRepository.count();
    }
    
    @Override
    public long countByType(ProviderType providerType) {
        return jpaRepository.countByProviderType(providerType);
    }
    
    @Override
    public long countByEnabled(boolean enabled) {
        return jpaRepository.countByEnabled(enabled);
    }
}

