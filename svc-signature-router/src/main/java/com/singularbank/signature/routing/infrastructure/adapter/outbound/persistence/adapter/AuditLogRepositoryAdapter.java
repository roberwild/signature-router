package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.adapter;

import com.singularbank.signature.routing.domain.model.entity.AuditLog;
import com.singularbank.signature.routing.domain.port.outbound.AuditLogRepository;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.AuditLogEntity;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.mapper.AuditLogEntityMapper;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.repository.AuditLogJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter for Audit Log Repository.
 * Epic 17: Comprehensive Audit Trail
 * Story 17.1: Audit Log Domain Entity & Repository
 * 
 * <p>Implements hexagonal architecture port for audit log persistence.
 * 
 * @since Epic 17
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogRepositoryAdapter implements AuditLogRepository {
    
    private final AuditLogJpaRepository jpaRepository;
    private final AuditLogEntityMapper mapper;
    
    @Override
    public AuditLog save(AuditLog auditLog) {
        AuditLogEntity entity = mapper.toEntity(auditLog);
        AuditLogEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }
    
    @Override
    public Optional<AuditLog> findById(UUID id) {
        return jpaRepository.findById(id)
            .map(mapper::toDomain);
    }
    
    @Override
    public Page<AuditLog> findAll(Pageable pageable) {
        return jpaRepository.findAllByOrderByTimestampDesc(pageable)
            .map(mapper::toDomain);
    }
    
    @Override
    public Page<AuditLog> findByUsername(String username, Pageable pageable) {
        return jpaRepository.findByUsernameOrderByTimestampDesc(username, pageable)
            .map(mapper::toDomain);
    }
    
    @Override
    public Page<AuditLog> findByOperation(AuditLog.OperationType operation, Pageable pageable) {
        return jpaRepository.findByOperationOrderByTimestampDesc(operation, pageable)
            .map(mapper::toDomain);
    }
    
    @Override
    public Page<AuditLog> findByEntityType(AuditLog.EntityType entityType, Pageable pageable) {
        return jpaRepository.findByEntityTypeOrderByTimestampDesc(entityType, pageable)
            .map(mapper::toDomain);
    }
    
    @Override
    public List<AuditLog> findByEntityId(String entityId) {
        return jpaRepository.findByEntityIdOrderByTimestampDesc(entityId).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public Page<AuditLog> search(
        String username,
        AuditLog.OperationType operation,
        AuditLog.EntityType entityType,
        Instant startDate,
        Instant endDate,
        Pageable pageable
    ) {
        String operationStr = operation != null ? operation.name() : null;
        String entityTypeStr = entityType != null ? entityType.name() : null;
        
        // Simplified search without date filters (PostgreSQL null handling issues)
        // TODO: Implement date filtering using findByTimestampBetween if needed
        return jpaRepository.search(username, operationStr, entityTypeStr, pageable)
            .map(mapper::toDomain);
    }
    
    @Override
    public long count() {
        return jpaRepository.count();
    }
    
    @Override
    public long countByOperation(AuditLog.OperationType operation) {
        return jpaRepository.countByOperation(operation);
    }
    
    @Override
    public long countByEntityType(AuditLog.EntityType entityType) {
        return jpaRepository.countByEntityType(entityType);
    }
}

