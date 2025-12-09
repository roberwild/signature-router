package com.bank.signature.infrastructure.adapter.outbound.persistence.mapper;

import com.bank.signature.domain.model.entity.AuditLog;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.AuditLogEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper between AuditLog domain entity and AuditLogEntity JPA entity.
 * Epic 17: Comprehensive Audit Trail
 * Story 17.1: Audit Log Domain Entity & Repository
 * 
 * @since Epic 17
 */
@Component
public class AuditLogEntityMapper {
    
    /**
     * Convert domain AuditLog to JPA AuditLogEntity.
     */
    public AuditLogEntity toEntity(AuditLog domain) {
        if (domain == null) return null;
        
        return AuditLogEntity.builder()
            .id(domain.getId())
            .timestamp(domain.getTimestamp())
            .userId(domain.getUserId())
            .username(domain.getUsername())
            .operation(domain.getOperation())
            .entityType(domain.getEntityType())
            .entityId(domain.getEntityId())
            .entityName(domain.getEntityName())
            .changes(domain.getChanges())
            .ipAddress(domain.getIpAddress())
            .userAgent(domain.getUserAgent())
            .success(domain.isSuccess())
            .errorMessage(domain.getErrorMessage())
            .metadata(domain.getMetadata())
            .build();
    }
    
    /**
     * Convert JPA AuditLogEntity to domain AuditLog.
     */
    public AuditLog toDomain(AuditLogEntity entity) {
        if (entity == null) return null;
        
        return AuditLog.builder()
            .id(entity.getId())
            .timestamp(entity.getTimestamp())
            .userId(entity.getUserId())
            .username(entity.getUsername())
            .operation(entity.getOperation())
            .entityType(entity.getEntityType())
            .entityId(entity.getEntityId())
            .entityName(entity.getEntityName())
            .changes(entity.getChanges())
            .ipAddress(entity.getIpAddress())
            .userAgent(entity.getUserAgent())
            .success(entity.isSuccess())
            .errorMessage(entity.getErrorMessage())
            .metadata(entity.getMetadata())
            .build();
    }
}
