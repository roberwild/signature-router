package com.bank.signature.infrastructure.adapter.inbound.rest;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bank.signature.domain.model.aggregate.RoutingRule;
import com.bank.signature.domain.port.outbound.RoutingRuleRepository;
import com.bank.signature.domain.service.SpelValidatorService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for security audit of routing rules.
 * Story 10.6: SpEL Security
 * Story 8.2: RBAC - Role-Based Access Control
 * 
 * <p>
 * Provides endpoint for auditing existing routing rules to identify
 * potentially dangerous SpEL expressions that may have been created before
 * enhanced security validation was implemented.
 * </p>
 * 
 * <p>
 * <b>Access Control:</b> ADMIN or AUDITOR (read-only for AUDITOR)
 * </p>
 * 
 * @since Story 10.6
 */
@RestController
@RequestMapping("/api/v1/admin/security")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Security Audit", description = "Security audit endpoints (ADMIN or AUDITOR)")
@SecurityRequirement(name = "bearerAuth")
public class SecurityAuditController {

    private final RoutingRuleRepository routingRuleRepository;
    private final SpelValidatorService spelValidatorService;

    /**
     * Audit all routing rules for security issues.
     * 
     * <p>
     * Scans all routing rules in the database and validates their SpEL expressions
     * using the current security rules. Identifies rules with potentially dangerous
     * expressions that should be reviewed manually.
     * </p>
     * 
     * @return Security audit report with list of potentially dangerous rules
     */
    @GetMapping("/audit-routing-rules")
    @PreAuthorize("hasAnyRole('PRF_ADMIN', 'PRF_CONSULTIVO')")
    @Operation(summary = "Audit routing rules for security issues", description = "Scans all routing rules and validates their SpEL expressions. "
            +
            "Identifies rules with potentially dangerous expressions that require manual review.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Audit completed", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = SecurityAuditReport.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (requires ADMIN role)")
    })
    public ResponseEntity<SecurityAuditReport> auditRoutingRules() {
        log.info("Starting security audit of routing rules...");

        List<RoutingRule> allRules = routingRuleRepository.findAllOrderedByPriority();
        log.debug("Found {} routing rules to audit", allRules.size());

        List<AuditResult> auditResults = allRules.stream()
                .map(rule -> {
                    com.bank.signature.domain.service.SpelValidatorService.ValidationResult validationResult = spelValidatorService
                            .validateWithResult(rule.getCondition());

                    return new AuditResult(
                            rule.getId(),
                            rule.getName(),
                            rule.getCondition(),
                            rule.getEnabled(),
                            validationResult.valid(),
                            validationResult.errorMessage());
                })
                .collect(Collectors.toList());

        long dangerousCount = auditResults.stream()
                .filter(result -> !result.isValid())
                .count();

        long enabledDangerousCount = auditResults.stream()
                .filter(result -> !result.isValid() && result.isEnabled())
                .count();

        SecurityAuditReport report = new SecurityAuditReport(
                allRules.size(),
                dangerousCount,
                enabledDangerousCount,
                auditResults);

        log.info("Security audit completed: {} total rules, {} dangerous, {} enabled dangerous",
                allRules.size(), dangerousCount, enabledDangerousCount);

        return ResponseEntity.ok(report);
    }

    /**
     * Security audit report.
     */
    @Value
    public static class SecurityAuditReport {
        int totalRules;
        long dangerousRulesCount;
        long enabledDangerousRulesCount;
        List<AuditResult> results;
    }

    /**
     * Audit result for a single routing rule.
     */
    @Value
    public static class AuditResult {
        java.util.UUID ruleId;
        String ruleName;
        String expression;
        boolean enabled;
        boolean isValid;
        String errorMessage;
    }
}
