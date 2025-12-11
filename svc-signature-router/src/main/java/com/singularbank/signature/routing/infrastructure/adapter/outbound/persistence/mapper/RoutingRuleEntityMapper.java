package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.mapper;

import com.singularbank.signature.routing.domain.model.aggregate.RoutingRule;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.RoutingRuleEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between RoutingRule domain model and RoutingRuleEntity.
 * Story 2.2: Routing Rules - CRUD API
 */
@Component
public class RoutingRuleEntityMapper {
    
    /**
     * Maps RoutingRule domain aggregate to RoutingRuleEntity (JPA).
     * 
     * @param rule Domain aggregate
     * @return JPA entity
     */
    public RoutingRuleEntity toEntity(RoutingRule rule) {
        if (rule == null) {
            return null;
        }
        
        return RoutingRuleEntity.builder()
            .id(rule.getId())
            .name(rule.getName())
            .description(rule.getDescription())
            .condition(rule.getCondition())
            .targetChannel(rule.getTargetChannel())
            .providerId(rule.getProviderId())
            .priority(rule.getPriority())
            .enabled(rule.getEnabled())
            .createdBy(rule.getCreatedBy())
            .createdAt(rule.getCreatedAt())
            .modifiedBy(rule.getModifiedBy())
            .modifiedAt(rule.getModifiedAt())
            .deleted(rule.getDeleted())
            .deletedBy(rule.getDeletedBy())
            .deletedAt(rule.getDeletedAt())
            .build();
    }
    
    /**
     * Maps RoutingRuleEntity (JPA) to RoutingRule domain aggregate.
     * 
     * @param entity JPA entity
     * @return Domain aggregate
     */
    public RoutingRule toDomain(RoutingRuleEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return RoutingRule.builder()
            .id(entity.getId())
            .name(entity.getName())
            .description(entity.getDescription())
            .condition(entity.getCondition())
            .targetChannel(entity.getTargetChannel())
            .providerId(entity.getProviderId())
            .priority(entity.getPriority())
            .enabled(entity.getEnabled())
            .createdBy(entity.getCreatedBy())
            .createdAt(entity.getCreatedAt())
            .modifiedBy(entity.getModifiedBy())
            .modifiedAt(entity.getModifiedAt())
            .deleted(entity.getDeleted())
            .deletedBy(entity.getDeletedBy())
            .deletedAt(entity.getDeletedAt())
            .build();
    }
    
    /**
     * Updates an existing RoutingRuleEntity with data from RoutingRule domain aggregate.
     * Preserves creation audit fields.
     * 
     * @param rule Domain aggregate with new data
     * @param entity Existing JPA entity to update
     */
    public void updateEntity(RoutingRule rule, RoutingRuleEntity entity) {
        if (rule == null || entity == null) {
            return;
        }
        
        entity.setName(rule.getName());
        entity.setDescription(rule.getDescription());
        entity.setCondition(rule.getCondition());
        entity.setTargetChannel(rule.getTargetChannel());
        entity.setProviderId(rule.getProviderId());
        entity.setPriority(rule.getPriority());
        entity.setEnabled(rule.getEnabled());
        entity.setModifiedBy(rule.getModifiedBy());
        entity.setModifiedAt(rule.getModifiedAt());
        entity.setDeleted(rule.getDeleted());
        entity.setDeletedBy(rule.getDeletedBy());
        entity.setDeletedAt(rule.getDeletedAt());
    }
}

