package com.bank.signature.infrastructure.adapter.outbound.persistence;

import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.RoutingRuleAuditLogEntity;
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
 * JPA repository for RoutingRuleAuditLogEntity.
 * Critical Improvement #3: Audit Trail
 * 
 * @since Critical Improvements - Audit Trail
 */
@Repository
public interface RoutingRuleAuditLogJpaRepository extends JpaRepository<RoutingRuleAuditLogEntity, UUID> {
    
    /**
     * Find all audit logs for a specific rule (ordered by most recent first).
     */
    List<RoutingRuleAuditLogEntity> findByRuleIdOrderByChangedAtDesc(UUID ruleId);
    
    /**
     * Find audit logs for a specific rule with pagination.
     */
    Page<RoutingRuleAuditLogEntity> findByRuleIdOrderByChangedAtDesc(UUID ruleId, Pageable pageable);
    
    /**
     * Find audit logs by user (for admin auditing).
     */
    Page<RoutingRuleAuditLogEntity> findByChangedByOrderByChangedAtDesc(String changedBy, Pageable pageable);
    
    /**
     * Find audit logs within date range.
     */
    @Query("SELECT a FROM RoutingRuleAuditLogEntity a WHERE a.changedAt BETWEEN :start AND :end ORDER BY a.changedAt DESC")
    Page<RoutingRuleAuditLogEntity> findByDateRange(
        @Param("start") Instant start,
        @Param("end") Instant end,
        Pageable pageable
    );
    
    /**
     * Count audit logs for a rule.
     */
    long countByRuleId(UUID ruleId);
}

