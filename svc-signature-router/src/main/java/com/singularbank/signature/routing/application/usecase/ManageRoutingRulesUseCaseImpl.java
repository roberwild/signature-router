package com.singularbank.signature.routing.application.usecase;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.singularbank.signature.routing.application.dto.CreateRoutingRuleDto;
import com.singularbank.signature.routing.application.dto.UpdateRoutingRuleDto;
import com.singularbank.signature.routing.application.mapper.RoutingRuleMapper;
import com.singularbank.signature.routing.application.service.RoutingRuleAuditService;
import com.singularbank.signature.routing.domain.exception.NotFoundException;
import com.singularbank.signature.routing.domain.model.aggregate.RoutingRule;
import com.singularbank.signature.routing.domain.model.entity.RoutingRuleAuditLog;
import com.singularbank.signature.routing.domain.model.valueobject.UUIDGenerator;
import com.singularbank.signature.routing.domain.port.outbound.RoutingRuleRepository;
import com.singularbank.signature.routing.domain.service.SpelValidatorService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of ManageRoutingRulesUseCase.
 * Story 2.2: Routing Rules - CRUD API
 * Critical Improvement #3: Audit Trail integrated
 * 
 * Orchestrates routing rule management operations with SpEL validation and
 * audit trail.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ManageRoutingRulesUseCaseImpl implements ManageRoutingRulesUseCase {

        private final RoutingRuleRepository repository;
        private final RoutingRuleMapper mapper;
        private final SpelValidatorService spelValidator;
        private final RoutingRuleAuditService auditService;

        @Override
        @Transactional
        public RoutingRule createRule(CreateRoutingRuleDto request, String createdBy) {
                log.info("Creating routing rule: name={}, createdBy={}", request.name(), createdBy);

                // 1. Validate SpEL condition
                spelValidator.validate(request.condition());
                log.debug("SpEL condition validated successfully: {}", request.condition());

                // 2. Map DTO to domain aggregate
                RoutingRule rule = mapper.toDomain(request);

                // 3. Set system-generated fields
                RoutingRule ruleWithMetadata = rule.toBuilder()
                                .id(UUIDGenerator.generateV7())
                                .createdBy(createdBy)
                                .createdAt(Instant.now())
                                .build();

                // 4. Persist routing rule
                RoutingRule savedRule = repository.save(ruleWithMetadata);

                // 5. Critical Improvement #3: Record audit log
                RoutingRuleAuditLog auditLog = RoutingRuleAuditLog.created(
                                savedRule.getId(),
                                savedRule.getCondition(),
                                savedRule.getTargetChannel(),
                                savedRule.getPriority(),
                                createdBy,
                                auditService.getClientIpAddress(),
                                auditService.getUserAgent());
                auditService.save(auditLog);

                log.info("Routing rule created successfully: id={}, priority={}",
                                savedRule.getId(), savedRule.getPriority());

                return savedRule;
        }

        @Override
        @Transactional
        public RoutingRule updateRule(UUID id, UpdateRoutingRuleDto request, String modifiedBy) {
                log.info("Updating routing rule: id={}, modifiedBy={}", id, modifiedBy);

                // 1. Find existing rule
                RoutingRule existingRule = repository.findById(id)
                                .orElseThrow(() -> new NotFoundException("RoutingRule", id));

                // 2. Validate SpEL condition (if changed)
                if (!existingRule.getCondition().equals(request.condition())) {
                        spelValidator.validate(request.condition());
                        log.debug("New SpEL condition validated successfully: {}", request.condition());
                }

                // 3. Capture previous state for audit
                String previousExpression = existingRule.getCondition();
                var previousChannel = existingRule.getTargetChannel();
                Integer previousPriority = existingRule.getPriority();

                // 4. Update rule using domain business method
                mapper.updateDomain(request, existingRule, modifiedBy);

                // 5. Persist updated rule
                RoutingRule updatedRule = repository.save(existingRule);

                // 6. Critical Improvement #3: Record audit log
                RoutingRuleAuditLog auditLog = RoutingRuleAuditLog.updated(
                                updatedRule.getId(),
                                previousExpression,
                                updatedRule.getCondition(),
                                previousChannel,
                                updatedRule.getTargetChannel(),
                                previousPriority,
                                updatedRule.getPriority(),
                                modifiedBy,
                                auditService.getClientIpAddress(),
                                auditService.getUserAgent(),
                                "Rule updated via Admin API");
                auditService.save(auditLog);

                log.info("Routing rule updated successfully: id={}", updatedRule.getId());

                return updatedRule;
        }

        @Override
        @Transactional(readOnly = true)
        public RoutingRule getRule(UUID id) {
                log.debug("Getting routing rule: id={}", id);

                return repository.findById(id)
                                .orElseThrow(() -> new NotFoundException("RoutingRule", id));
        }

        @Override
        @Transactional(readOnly = true)
        public List<RoutingRule> listRules() {
                log.debug("Listing all routing rules");

                List<RoutingRule> rules = repository.findAllOrderedByPriority();

                log.info("Found {} routing rules", rules.size());

                return rules;
        }

        @Override
        @Transactional
        public void deleteRule(UUID id, String deletedBy) {
                log.info("Deleting routing rule: id={}, deletedBy={}", id, deletedBy);

                // 1. Find existing rule
                RoutingRule existingRule = repository.findById(id)
                                .orElseThrow(() -> new NotFoundException("RoutingRule", id));

                // 2. Capture state for audit
                String expression = existingRule.getCondition();
                var channel = existingRule.getTargetChannel();
                Integer priority = existingRule.getPriority();

                // 3. Soft delete using domain business method
                existingRule.markAsDeleted(deletedBy);

                // 4. Persist soft-deleted rule
                repository.save(existingRule);

                // 5. Critical Improvement #3: Record audit log
                RoutingRuleAuditLog auditLog = RoutingRuleAuditLog.deleted(
                                id,
                                expression,
                                channel,
                                priority,
                                deletedBy,
                                auditService.getClientIpAddress(),
                                auditService.getUserAgent(),
                                "Rule deleted via Admin API");
                auditService.save(auditLog);

                log.info("Routing rule soft-deleted successfully: id={}", id);
        }

        @Override
        @Transactional
        public RoutingRule toggleRule(UUID id, boolean enabled, String modifiedBy) {
                log.info("Toggling routing rule: id={}, enabled={}, modifiedBy={}", id, enabled, modifiedBy);

                // 1. Find existing rule
                RoutingRule existingRule = repository.findById(id)
                                .orElseThrow(() -> new NotFoundException("RoutingRule", id));

                // 2. Capture previous state for audit
                Boolean previousEnabled = existingRule.getEnabled();

                // 3. Update enabled status using domain business method
                if (enabled) {
                        existingRule.enable();
                } else {
                        existingRule.disable();
                }

                // 4. Update using toBuilder to set modifiedBy and modifiedAt
                RoutingRule ruleToSave = existingRule.toBuilder()
                                .modifiedBy(modifiedBy)
                                .modifiedAt(Instant.now())
                                .build();

                // 5. Persist updated rule
                RoutingRule updatedRule = repository.save(ruleToSave);

                // 6. Record audit log
                RoutingRuleAuditLog auditLog = RoutingRuleAuditLog.updated(
                                updatedRule.getId(),
                                updatedRule.getCondition(),
                                updatedRule.getCondition(),
                                updatedRule.getTargetChannel(),
                                updatedRule.getTargetChannel(),
                                updatedRule.getPriority(),
                                updatedRule.getPriority(),
                                modifiedBy,
                                auditService.getClientIpAddress(),
                                auditService.getUserAgent(),
                                "Rule " + (enabled ? "enabled" : "disabled") + " via toggle (was: " + previousEnabled
                                                + ")");
                auditService.save(auditLog);

                log.info("Routing rule toggled successfully: id={}, enabled={}", updatedRule.getId(), enabled);

                return updatedRule;
        }
}
