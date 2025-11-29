package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.domain.model.valueobject.AuditEventType;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

/**
 * Spring Data JPA repository for AuditLogEntity.
 * Story 8.4: Audit Log - Immutable Storage
 * 
 * <p><b>Operations:</b></p>
 * <ul>
 *   <li>INSERT: save() to log new audit events</li>
 *   <li>SELECT: Query methods for filtering and pagination</li>
 *   <li>NO UPDATE: Audit logs are immutable</li>
 *   <li>NO DELETE: Retention managed by PostgreSQL partitioning</li>
 * </ul>
 * 
 * <p><b>Query Methods:</b></p>
 * <ul>
 *   <li>Filter by event type (e.g., ACCESS_DENIED)</li>
 *   <li>Filter by entity type (e.g., SIGNATURE_REQUEST)</li>
 *   <li>Filter by actor (username)</li>
 *   <li>Filter by date range (from/to timestamps)</li>
 *   <li>Pagination support for large result sets</li>
 * </ul>
 * 
 * @since Story 8.4
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {
    
    /**
     * Find audit logs by event type with pagination.
     * 
     * @param eventType The audit event type
     * @param pageable Pagination parameters
     * @return Page of audit log entities
     */
    Page<AuditLogEntity> findByEventType(AuditEventType eventType, Pageable pageable);
    
    /**
     * Find audit logs by entity type with pagination.
     * 
     * @param entityType The entity type (e.g., "SIGNATURE_REQUEST")
     * @param pageable Pagination parameters
     * @return Page of audit log entities
     */
    Page<AuditLogEntity> findByEntityType(String entityType, Pageable pageable);
    
    /**
     * Find audit logs by specific entity ID.
     * 
     * @param entityId The entity ID
     * @param pageable Pagination parameters
     * @return Page of audit log entities
     */
    Page<AuditLogEntity> findByEntityId(UUID entityId, Pageable pageable);
    
    /**
     * Find audit logs by actor (username) with pagination.
     * 
     * @param actor The username or service account
     * @param pageable Pagination parameters
     * @return Page of audit log entities
     */
    Page<AuditLogEntity> findByActor(String actor, Pageable pageable);
    
    /**
     * Find audit logs within a date range with pagination.
     * 
     * @param from Start timestamp (inclusive)
     * @param to End timestamp (inclusive)
     * @param pageable Pagination parameters
     * @return Page of audit log entities
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE a.createdAt >= :from AND a.createdAt <= :to")
    Page<AuditLogEntity> findByCreatedAtBetween(
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );
    
    /**
     * Find audit logs with multiple filters (comprehensive query for AuditLogController).
     * 
     * @param eventType Event type filter (nullable)
     * @param entityType Entity type filter (nullable)
     * @param actor Actor filter (nullable)
     * @param from Start timestamp (nullable)
     * @param to End timestamp (nullable)
     * @param pageable Pagination parameters
     * @return Page of audit log entities
     */
    @Query("SELECT a FROM AuditLogEntity a WHERE " +
            "(:eventType IS NULL OR a.eventType = :eventType) AND " +
            "(:entityType IS NULL OR a.entityType = :entityType) AND " +
            "(:actor IS NULL OR a.actor = :actor) AND " +
            "(:from IS NULL OR a.createdAt >= :from) AND " +
            "(:to IS NULL OR a.createdAt <= :to) " +
            "ORDER BY a.createdAt DESC")
    Page<AuditLogEntity> findWithFilters(
            @Param("eventType") AuditEventType eventType,
            @Param("entityType") String entityType,
            @Param("actor") String actor,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );
}

