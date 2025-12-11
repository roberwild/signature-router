package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.adapter;

import com.singularbank.signature.routing.domain.model.ProviderConfigHistory;
import com.singularbank.signature.routing.domain.port.outbound.ProviderConfigHistoryRepository;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.ProviderConfigHistoryEntity;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.mapper.ProviderConfigHistoryMapper;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.repository.ProviderConfigHistoryJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Provider Config History Repository Adapter
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProviderConfigHistoryRepositoryAdapter implements ProviderConfigHistoryRepository {
    
    private final ProviderConfigHistoryJpaRepository jpaRepository;
    private final ProviderConfigHistoryMapper mapper;
    
    @Override
    public ProviderConfigHistory save(ProviderConfigHistory history) {
        log.debug("Saving provider config history: providerConfigId={}, changeType={}", 
            history.getProviderConfigId(), history.getChangeType());
        
        ProviderConfigHistoryEntity entity = mapper.toEntity(history);
        ProviderConfigHistoryEntity saved = jpaRepository.save(entity);
        
        return mapper.toDomain(saved);
    }
    
    @Override
    public List<ProviderConfigHistory> findByProviderConfigId(UUID providerConfigId) {
        log.debug("Finding history for provider: {}", providerConfigId);
        
        return jpaRepository.findByProviderConfigIdOrderByChangedAtDesc(providerConfigId).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ProviderConfigHistory> findRecentHistory(int limit) {
        log.debug("Finding recent history: limit={}", limit);
        
        return jpaRepository.findAllByOrderByChangedAtDesc(PageRequest.of(0, limit)).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
}

