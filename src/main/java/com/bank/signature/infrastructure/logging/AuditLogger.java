package com.bank.signature.infrastructure.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Dedicated audit logger for compliance and security events.
 * Critical Improvement #5: Structured JSON Logging
 * 
 * <p>Logs to separate audit.json file with 365-day retention.
 * 
 * <p>Use cases:
 * <ul>
 * <li>Authentication/authorization events</li>
 * <li>Routing rule changes (CREATE, UPDATE, DELETE)</li>
 * <li>Signature request lifecycle events</li>
 * <li>Provider configuration changes</li>
 * <li>Security violations (rate limit exceeded, invalid OTP, etc.)</li>
 * </ul>
 * 
 * @since Critical Improvements - Structured JSON Logging
 */
@Component
public class AuditLogger {
    
    private static final Logger AUDIT_LOGGER = LoggerFactory.getLogger("AUDIT_LOGGER");
    
    /**
     * Log an audit event with structured context.
     * 
     * @param eventType Type of audit event (e.g., "ROUTING_RULE_CREATED")
     * @param action Action performed (e.g., "CREATE", "UPDATE", "DELETE")
     * @param resourceId ID of affected resource
     * @param userId User who performed the action
     * @param result Result of the action ("SUCCESS", "FAILURE")
     * @param additionalContext Additional context map
     */
    public void logAuditEvent(
        String eventType,
        String action,
        String resourceId,
        String userId,
        String result,
        Map<String, Object> additionalContext
    ) {
        try {
            // Agregar campos de audit al MDC
            MDC.put("auditEventType", eventType);
            MDC.put("auditAction", action);
            MDC.put("auditResourceId", resourceId);
            MDC.put("auditUserId", userId);
            MDC.put("auditResult", result);
            
            // Agregar contexto adicional
            if (additionalContext != null) {
                additionalContext.forEach((key, value) -> 
                    MDC.put("audit_" + key, value != null ? value.toString() : "null")
                );
            }
            
            // Log mensaje estructurado
            AUDIT_LOGGER.info("Audit event: {} - {} on {} by {} ({})",
                eventType, action, resourceId, userId, result);
            
        } finally {
            // Limpiar campos de audit del MDC
            MDC.remove("auditEventType");
            MDC.remove("auditAction");
            MDC.remove("auditResourceId");
            MDC.remove("auditUserId");
            MDC.remove("auditResult");
            
            if (additionalContext != null) {
                additionalContext.keySet().forEach(key -> MDC.remove("audit_" + key));
            }
        }
    }
    
    /**
     * Log successful authentication.
     */
    public void logAuthentication(String userId, String ipAddress, String method) {
        logAuditEvent(
            "AUTHENTICATION",
            "LOGIN",
            userId,
            userId,
            "SUCCESS",
            Map.of("ipAddress", ipAddress, "method", method)
        );
    }
    
    /**
     * Log failed authentication.
     */
    public void logAuthenticationFailure(String userId, String ipAddress, String reason) {
        logAuditEvent(
            "AUTHENTICATION",
            "LOGIN_FAILED",
            userId,
            userId,
            "FAILURE",
            Map.of("ipAddress", ipAddress, "reason", reason)
        );
    }
    
    /**
     * Log routing rule change.
     */
    public void logRoutingRuleChange(String action, String ruleId, String userId, Map<String, Object> changes) {
        logAuditEvent(
            "ROUTING_RULE_CHANGE",
            action,
            ruleId,
            userId,
            "SUCCESS",
            changes
        );
    }
    
    /**
     * Log signature request lifecycle event.
     */
    public void logSignatureEvent(String action, String requestId, String customerId, String result) {
        logAuditEvent(
            "SIGNATURE_REQUEST",
            action,
            requestId,
            customerId,
            result,
            null
        );
    }
    
    /**
     * Log security violation.
     */
    public void logSecurityViolation(String violationType, String resourceId, String userId, String details) {
        logAuditEvent(
            "SECURITY_VIOLATION",
            violationType,
            resourceId,
            userId,
            "BLOCKED",
            Map.of("details", details)
        );
    }
}

