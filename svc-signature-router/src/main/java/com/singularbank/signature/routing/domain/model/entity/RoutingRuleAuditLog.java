package com.singularbank.signature.routing.domain.model.entity;

import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Audit log entry for RoutingRule changes.
 * Critical Improvement #3: Audit Trail
 * 
 * <p>Tracks all modifications to routing rules for compliance and troubleshooting:
 * <ul>
 * <li>CREATE: New rule created</li>
 * <li>UPDATE: Existing rule modified (expression, channel, priority, etc.)</li>
 * <li>DELETE: Rule soft-deleted or hard-deleted</li>
 * <li>ENABLE: Rule enabled</li>
 * <li>DISABLE: Rule disabled</li>
 * </ul>
 * 
 * <p><strong>Immutability:</strong> Audit logs are append-only and never modified.
 * 
 * @since Critical Improvements - Audit Trail
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutingRuleAuditLog {
    
    private UUID id;
    private UUID ruleId;
    private AuditAction action;
    private String changedBy; // Usuario que hizo el cambio (de JWT)
    private Instant changedAt;
    private String ipAddress;
    private String userAgent;
    
    // Estado ANTES del cambio
    private String previousExpression;
    private ChannelType previousChannel;
    private Integer previousPriority;
    private Boolean previousEnabled;
    
    // Estado DESPUÉS del cambio
    private String newExpression;
    private ChannelType newChannel;
    private Integer newPriority;
    private Boolean newEnabled;
    
    // Metadata adicional
    private String changeReason; // Opcional: razón del cambio
    
    /**
     * Audit action types.
     */
    public enum AuditAction {
        CREATE,
        UPDATE,
        DELETE,
        ENABLE,
        DISABLE
    }
    
    /**
     * Factory method for CREATE action.
     */
    public static RoutingRuleAuditLog created(
        UUID ruleId,
        String expression,
        ChannelType channel,
        Integer priority,
        String changedBy,
        String ipAddress,
        String userAgent
    ) {
        return RoutingRuleAuditLog.builder()
            .id(UUID.randomUUID())
            .ruleId(ruleId)
            .action(AuditAction.CREATE)
            .changedBy(changedBy)
            .changedAt(Instant.now())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .newExpression(expression)
            .newChannel(channel)
            .newPriority(priority)
            .newEnabled(true)
            .build();
    }
    
    /**
     * Factory method for UPDATE action.
     */
    public static RoutingRuleAuditLog updated(
        UUID ruleId,
        String previousExpression,
        String newExpression,
        ChannelType previousChannel,
        ChannelType newChannel,
        Integer previousPriority,
        Integer newPriority,
        String changedBy,
        String ipAddress,
        String userAgent,
        String reason
    ) {
        return RoutingRuleAuditLog.builder()
            .id(UUID.randomUUID())
            .ruleId(ruleId)
            .action(AuditAction.UPDATE)
            .changedBy(changedBy)
            .changedAt(Instant.now())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .previousExpression(previousExpression)
            .newExpression(newExpression)
            .previousChannel(previousChannel)
            .newChannel(newChannel)
            .previousPriority(previousPriority)
            .newPriority(newPriority)
            .changeReason(reason)
            .build();
    }
    
    /**
     * Factory method for ENABLE action.
     */
    public static RoutingRuleAuditLog enabled(
        UUID ruleId,
        String changedBy,
        String ipAddress,
        String userAgent
    ) {
        return RoutingRuleAuditLog.builder()
            .id(UUID.randomUUID())
            .ruleId(ruleId)
            .action(AuditAction.ENABLE)
            .changedBy(changedBy)
            .changedAt(Instant.now())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .previousEnabled(false)
            .newEnabled(true)
            .build();
    }
    
    /**
     * Factory method for DISABLE action.
     */
    public static RoutingRuleAuditLog disabled(
        UUID ruleId,
        String changedBy,
        String ipAddress,
        String userAgent,
        String reason
    ) {
        return RoutingRuleAuditLog.builder()
            .id(UUID.randomUUID())
            .ruleId(ruleId)
            .action(AuditAction.DISABLE)
            .changedBy(changedBy)
            .changedAt(Instant.now())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .previousEnabled(true)
            .newEnabled(false)
            .changeReason(reason)
            .build();
    }
    
    /**
     * Factory method for DELETE action.
     */
    public static RoutingRuleAuditLog deleted(
        UUID ruleId,
        String expression,
        ChannelType channel,
        Integer priority,
        String changedBy,
        String ipAddress,
        String userAgent,
        String reason
    ) {
        return RoutingRuleAuditLog.builder()
            .id(UUID.randomUUID())
            .ruleId(ruleId)
            .action(AuditAction.DELETE)
            .changedBy(changedBy)
            .changedAt(Instant.now())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .previousExpression(expression)
            .previousChannel(channel)
            .previousPriority(priority)
            .previousEnabled(false)
            .changeReason(reason)
            .build();
    }
}

