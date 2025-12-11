package com.singularbank.signature.routing.domain.port.outbound;

import com.singularbank.signature.routing.domain.model.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository Port for Audit Log operations.
 * Epic 17: Comprehensive Audit Trail
 * Story 17.1: Audit Log Domain Entity & Repository
 * 
 * <p>Provides access to immutable audit log records with advanced querying capabilities.
 * 
 * <p><b>Compliance:</b>
 * <ul>
 *   <li>PCI-DSS Req 10.2: Track all access to network resources</li>
 *   <li>PCI-DSS Req 10.3: Record audit trail entries</li>
 *   <li>SOC 2 CC6.1: Logical and physical access controls</li>
 *   <li>GDPR Article 30: Records of processing activities</li>
 * </ul>
 * 
 * @since Epic 17
 */
public interface AuditLogRepository {
    
    /**
     * Save an audit log entry.
     * 
     * @param auditLog the audit log to save
     * @return saved audit log with generated ID
     */
    AuditLog save(AuditLog auditLog);
    
    /**
     * Find audit log by ID.
     * 
     * @param id the audit log ID
     * @return optional audit log
     */
    Optional<AuditLog> findById(UUID id);
    
    /**
     * Find all audit logs with pagination.
     * 
     * @param pageable pagination parameters
     * @return page of audit logs
     */
    Page<AuditLog> findAll(Pageable pageable);
    
    /**
     * Find audit logs by username.
     * 
     * @param username the username
     * @param pageable pagination parameters
     * @return page of audit logs
     */
    Page<AuditLog> findByUsername(String username, Pageable pageable);
    
    /**
     * Find audit logs by operation type.
     * 
     * @param operation the operation type
     * @param pageable pagination parameters
     * @return page of audit logs
     */
    Page<AuditLog> findByOperation(AuditLog.OperationType operation, Pageable pageable);
    
    /**
     * Find audit logs by entity type.
     * 
     * @param entityType the entity type
     * @param pageable pagination parameters
     * @return page of audit logs
     */
    Page<AuditLog> findByEntityType(AuditLog.EntityType entityType, Pageable pageable);
    
    /**
     * Find audit logs for a specific entity.
     * 
     * @param entityId the entity ID
     * @return list of audit logs for the entity (ordered by timestamp DESC)
     */
    List<AuditLog> findByEntityId(String entityId);
    
    /**
     * Search audit logs with multiple criteria.
     * 
     * @param username optional username filter
     * @param operation optional operation filter
     * @param entityType optional entity type filter
     * @param startDate optional start date
     * @param endDate optional end date
     * @param pageable pagination parameters
     * @return page of filtered audit logs
     */
    Page<AuditLog> search(
        String username,
        AuditLog.OperationType operation,
        AuditLog.EntityType entityType,
        Instant startDate,
        Instant endDate,
        Pageable pageable
    );
    
    /**
     * Count total audit logs.
     * 
     * @return total count
     */
    long count();
    
    /**
     * Count audit logs by operation type.
     * 
     * @param operation the operation type
     * @return count
     */
    long countByOperation(AuditLog.OperationType operation);
    
    /**
     * Count audit logs by entity type.
     * 
     * @param entityType the entity type
     * @return count
     */
    long countByEntityType(AuditLog.EntityType entityType);
}

