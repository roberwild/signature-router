package com.singularbank.signature.routing.domain.port.outbound;

import com.singularbank.signature.routing.domain.model.aggregate.RoutingRule;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Outbound port for RoutingRule persistence.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * This interface defines the contract for persistence operations
 * without coupling the domain to specific persistence technology.
 */
public interface RoutingRuleRepository {
    
    /**
     * Saves a routing rule (create or update).
     * 
     * @param rule The routing rule to save
     * @return The saved routing rule with generated/updated fields
     */
    RoutingRule save(RoutingRule rule);
    
    /**
     * Finds a routing rule by ID.
     * 
     * @param id The rule ID
     * @return Optional containing the rule if found, empty otherwise
     */
    Optional<RoutingRule> findById(UUID id);
    
    /**
     * Finds all active routing rules ordered by priority (ASC).
     * Excludes deleted rules.
     * 
     * @return List of active routing rules
     */
    List<RoutingRule> findAllActiveOrderedByPriority();
    
    /**
     * Finds all routing rules (including disabled, but not deleted).
     * Ordered by priority (ASC).
     * 
     * @return List of all non-deleted routing rules
     */
    List<RoutingRule> findAllOrderedByPriority();
    
    /**
     * Checks if a routing rule exists by ID.
     * 
     * @param id The rule ID
     * @return true if exists, false otherwise
     */
    boolean existsById(UUID id);
    
    /**
     * Deletes a routing rule by ID (hard delete - use with caution).
     * Prefer soft delete via RoutingRule.markAsDeleted().
     * 
     * @param id The rule ID
     */
    void deleteById(UUID id);
}

