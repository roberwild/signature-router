package com.bank.signature.application.mapper;

import com.bank.signature.application.dto.CreateRoutingRuleDto;
import com.bank.signature.application.dto.RoutingRuleResponseDto;
import com.bank.signature.application.dto.UpdateRoutingRuleDto;
import com.bank.signature.domain.model.aggregate.RoutingRule;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between RoutingRule DTOs and Domain models.
 * Story 2.2: Routing Rules - CRUD API
 */
@Component
public class RoutingRuleMapper {
    
    /**
     * Maps CreateRoutingRuleDto to RoutingRule domain aggregate.
     * Note: id, timestamps, and audit fields must be set by the use case.
     * 
     * @param dto The DTO to map
     * @return RoutingRule domain aggregate (without id and timestamps)
     */
    public RoutingRule toDomain(CreateRoutingRuleDto dto) {
        return RoutingRule.builder()
            .name(dto.name())
            .description(dto.description())
            .condition(dto.condition())
            .targetChannel(dto.targetChannel())
            .providerId(dto.providerId())
            .priority(dto.priority())
            .enabled(dto.enabled())
            .deleted(false)
            .build();
    }
    
    /**
     * Maps UpdateRoutingRuleDto to update fields on existing RoutingRule.
     * Returns updated values, use case must apply them to aggregate.
     * 
     * @param dto The DTO with updated values
     * @return RoutingRule with updated fields (for reference, not for direct use)
     */
    public void updateDomain(UpdateRoutingRuleDto dto, RoutingRule existingRule, String modifiedBy) {
        existingRule.update(
            dto.name(),
            dto.description(),
            dto.condition(),
            dto.targetChannel(),
            dto.providerId(),
            dto.priority(),
            modifiedBy
        );
        
        // Handle enabled/disabled separately
        if (Boolean.TRUE.equals(dto.enabled()) && !Boolean.TRUE.equals(existingRule.getEnabled())) {
            existingRule.enable();
        } else if (Boolean.FALSE.equals(dto.enabled()) && Boolean.TRUE.equals(existingRule.getEnabled())) {
            existingRule.disable();
        }
    }
    
    /**
     * Maps RoutingRule aggregate to RoutingRuleResponseDto.
     * 
     * @param rule The domain aggregate to map
     * @return RoutingRuleResponseDto
     */
    public RoutingRuleResponseDto toDto(RoutingRule rule) {
        return new RoutingRuleResponseDto(
            rule.getId(),
            rule.getName(),
            rule.getDescription(),
            rule.getCondition(),
            rule.getTargetChannel(),
            rule.getProviderId(),
            rule.getPriority(),
            rule.getEnabled(),
            rule.getCreatedBy(),
            rule.getCreatedAt(),
            rule.getModifiedBy(),
            rule.getModifiedAt()
        );
    }
}

