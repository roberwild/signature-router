package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.RoutingRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for RoutingRuleEntity.
 * Story 2.2: Routing Rules - CRUD API
 */
@Repository
public interface RoutingRuleJpaRepository extends JpaRepository<RoutingRuleEntity, UUID> {
    
    /**
     * Finds all active (enabled=true, deleted=false) routing rules
     * ordered by priority ascending.
     * 
     * @return List of active routing rules
     */
    @Query("SELECT r FROM RoutingRuleEntity r WHERE r.enabled = true AND r.deleted = false ORDER BY r.priority ASC")
    List<RoutingRuleEntity> findAllActiveOrderedByPriority();
    
    /**
     * Finds all non-deleted routing rules (including disabled)
     * ordered by priority ascending.
     * 
     * @return List of non-deleted routing rules
     */
    @Query("SELECT r FROM RoutingRuleEntity r WHERE r.deleted = false ORDER BY r.priority ASC")
    List<RoutingRuleEntity> findAllOrderedByPriority();
}

