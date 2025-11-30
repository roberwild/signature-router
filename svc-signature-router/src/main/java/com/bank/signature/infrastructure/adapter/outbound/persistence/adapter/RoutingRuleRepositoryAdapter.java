package com.bank.signature.infrastructure.adapter.outbound.persistence.adapter;

import com.bank.signature.domain.model.aggregate.RoutingRule;
import com.bank.signature.domain.port.outbound.RoutingRuleRepository;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.RoutingRuleEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.mapper.RoutingRuleEntityMapper;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.RoutingRuleJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter implementation for RoutingRuleRepository.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * Implements the domain port using Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RoutingRuleRepositoryAdapter implements RoutingRuleRepository {
    
    private final RoutingRuleJpaRepository jpaRepository;
    private final RoutingRuleEntityMapper mapper;
    
    @Override
    @Transactional
    public RoutingRule save(RoutingRule rule) {
        log.debug("Saving routing rule: id={}, name={}", rule.getId(), rule.getName());
        
        RoutingRuleEntity entity = mapper.toEntity(rule);
        RoutingRuleEntity savedEntity = jpaRepository.save(entity);
        
        log.info("Routing rule saved: id={}", savedEntity.getId());
        return mapper.toDomain(savedEntity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<RoutingRule> findById(UUID id) {
        log.debug("Finding routing rule by id: {}", id);
        
        return jpaRepository.findById(id)
            .map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RoutingRule> findAllActiveOrderedByPriority() {
        log.debug("Finding all active routing rules");
        
        List<RoutingRuleEntity> entities = jpaRepository.findAllActiveOrderedByPriority();
        
        log.info("Found {} active routing rules", entities.size());
        return entities.stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RoutingRule> findAllOrderedByPriority() {
        log.debug("Finding all non-deleted routing rules");
        
        List<RoutingRuleEntity> entities = jpaRepository.findAllOrderedByPriority();
        
        log.info("Found {} non-deleted routing rules", entities.size());
        return entities.stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsById(UUID id) {
        log.debug("Checking if routing rule exists: {}", id);
        
        return jpaRepository.existsById(id);
    }
    
    @Override
    @Transactional
    public void deleteById(UUID id) {
        log.warn("Hard deleting routing rule: {} (prefer soft delete)", id);
        
        jpaRepository.deleteById(id);
        
        log.info("Routing rule hard deleted: {}", id);
    }
}

