package com.singularbank.signature.routing.application.usecase;

import java.util.List;
import java.util.UUID;

import com.singularbank.signature.routing.application.dto.CreateRoutingRuleDto;
import com.singularbank.signature.routing.application.dto.UpdateRoutingRuleDto;
import com.singularbank.signature.routing.domain.model.aggregate.RoutingRule;

/**
 * Use case for managing routing rules (CRUD operations).
 * Story 2.2: Routing Rules - CRUD API
 * 
 * This is an inbound port in hexagonal architecture that defines
 * business operations for routing rule management.
 */
public interface ManageRoutingRulesUseCase {

    /**
     * Creates a new routing rule.
     * Validates SpEL condition before persisting.
     * 
     * @param request   The routing rule details
     * @param createdBy User creating the rule
     * @return The created RoutingRule aggregate
     * @throws com.singularbank.signature.routing.domain.exception.InvalidSpelExpressionException if
     *                                                                            SpEL
     *                                                                            invalid
     */
    RoutingRule createRule(CreateRoutingRuleDto request, String createdBy);

    /**
     * Updates an existing routing rule.
     * Validates SpEL condition before persisting.
     * 
     * @param id         The rule ID to update
     * @param request    The updated rule details
     * @param modifiedBy User modifying the rule
     * @return The updated RoutingRule aggregate
     * @throws com.singularbank.signature.routing.domain.exception.NotFoundException              if
     *                                                                            rule
     *                                                                            not
     *                                                                            found
     * @throws com.singularbank.signature.routing.domain.exception.InvalidSpelExpressionException if
     *                                                                            SpEL
     *                                                                            invalid
     */
    RoutingRule updateRule(UUID id, UpdateRoutingRuleDto request, String modifiedBy);

    /**
     * Finds a routing rule by ID.
     * 
     * @param id The rule ID
     * @return The RoutingRule aggregate
     * @throws com.singularbank.signature.routing.domain.exception.NotFoundException if rule not
     *                                                               found
     */
    RoutingRule getRule(UUID id);

    /**
     * Lists all routing rules (non-deleted) ordered by priority.
     * 
     * @return List of routing rules
     */
    List<RoutingRule> listRules();

    /**
     * Deletes a routing rule (soft delete).
     * 
     * @param id        The rule ID to delete
     * @param deletedBy User deleting the rule
     * @throws com.singularbank.signature.routing.domain.exception.NotFoundException if rule not
     *                                                               found
     */
    void deleteRule(UUID id, String deletedBy);

    /**
     * Toggles a routing rule's enabled status.
     * Story 14.3: Rule Enable/Disable Toggle
     * 
     * @param id         The rule ID to toggle
     * @param enabled    The new enabled status
     * @param modifiedBy User modifying the rule
     * @return The updated RoutingRule aggregate
     * @throws com.singularbank.signature.routing.domain.exception.NotFoundException if rule not
     *                                                               found
     */
    RoutingRule toggleRule(UUID id, boolean enabled, String modifiedBy);
}
