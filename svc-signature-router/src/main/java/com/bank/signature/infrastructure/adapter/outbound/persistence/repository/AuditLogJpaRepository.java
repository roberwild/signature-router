package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.domain.model.entity.AuditLog;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * JPA Repository for Audit Log.
 * Epic 17: Comprehensive Audit Trail
 * Story 17.1: Audit Log Domain Entity & Repository
 * 
 * @since Epic 17
 */
@Repository
public interface AuditLogJpaRepository extends JpaRepository<AuditLogEntity, UUID> {
    
    /**
     * Find all audit logs ordered by timestamp DESC.
     */
    Page<AuditLogEntity> findAllByOrderByTimestampDesc(Pageable pageable);
    
    /**
     * Find audit logs by username.
     */
    Page<AuditLogEntity> findByUsernameOrderByTimestampDesc(String username, Pageable pageable);
    
    /**
     * Find audit logs by operation type.
     */
    Page<AuditLogEntity> findByOperationOrderByTimestampDesc(AuditLog.OperationType operation, Pageable pageable);
    
    /**
     * Find audit logs by entity type.
     */
    Page<AuditLogEntity> findByEntityTypeOrderByTimestampDesc(AuditLog.EntityType entityType, Pageable pageable);
    
    /**
     * Find audit logs for a specific entity.
     */
    List<AuditLogEntity> findByEntityIdOrderByTimestampDesc(String entityId);
    
    /**
     * Search audit logs with multiple criteria (username, operation, entityType).
     * Uses native SQL for better PostgreSQL compatibility.
     */
    @Query(value = """
        SELECT * FROM audit_log a
        WHERE (:username IS NULL OR a.username = :username)
          AND (:operation IS NULL OR a.operation = :operation)
          AND (:entityType IS NULL OR a.entity_type = :entityType)
        ORDER BY a.timestamp DESC
        """, nativeQuery = true)
    Page<AuditLogEntity> search(
        @Param("username") String username,
        @Param("operation") String operation,
        @Param("entityType") String entityType,
        Pageable pageable
    );
    
    /**
     * Search audit logs with date range.
     */
    @Query(value = """
        SELECT * FROM audit_log a
        WHERE a.timestamp >= :startDate
          AND a.timestamp <= :endDate
        ORDER BY a.timestamp DESC
        """, nativeQuery = true)
    Page<AuditLogEntity> findByTimestampBetween(
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );
    
    /**
     * Count by operation type.
     */
    long countByOperation(AuditLog.OperationType operation);
    
    /**
     * Count by entity type.
     */
    long countByEntityType(AuditLog.EntityType entityType);
}

