package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.mapper;

import com.singularbank.signature.routing.domain.model.ProviderConfigHistory;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.ProviderConfigHistoryEntity;
import org.springframework.stereotype.Component;

/**
 * Provider Config History Mapper
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 */
@Component
public class ProviderConfigHistoryMapper {
    
    public ProviderConfigHistory toDomain(ProviderConfigHistoryEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return ProviderConfigHistory.builder()
            .id(entity.getId())
            .providerConfigId(entity.getProviderConfigId())
            .changedAt(entity.getChangedAt())
            .changedBy(entity.getChangedBy())
            .changeType(entity.getChangeType())
            .oldConfigJson(entity.getOldConfigJson())
            .newConfigJson(entity.getNewConfigJson())
            .remarks(entity.getRemarks())
            .build();
    }
    
    public ProviderConfigHistoryEntity toEntity(ProviderConfigHistory domain) {
        if (domain == null) {
            return null;
        }
        
        return ProviderConfigHistoryEntity.builder()
            .id(domain.getId())
            .providerConfigId(domain.getProviderConfigId())
            .changedAt(domain.getChangedAt())
            .changedBy(domain.getChangedBy())
            .changeType(domain.getChangeType())
            .oldConfigJson(domain.getOldConfigJson())
            .newConfigJson(domain.getNewConfigJson())
            .remarks(domain.getRemarks())
            .build();
    }
}

