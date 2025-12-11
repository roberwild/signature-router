package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity;

import com.singularbank.signature.routing.domain.model.entity.RoutingRuleAuditLog;
import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for routing_rule_audit_log table.
 * Critical Improvement #3: Audit Trail
 * 
 * <p>Immutable audit log entries for routing rule changes.
 * 
 * @since Critical Improvements - Audit Trail
 */
@Entity
@Table(name = "routing_rule_audit_log", indexes = {
    @Index(name = "idx_audit_rule_id", columnList = "rule_id"),
    @Index(name = "idx_audit_changed_at", columnList = "changed_at"),
    @Index(name = "idx_audit_changed_by", columnList = "changed_by")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutingRuleAuditLogEntity {
    
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;
    
    @Column(name = "rule_id", nullable = false, updatable = false)
    private UUID ruleId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20, updatable = false)
    private RoutingRuleAuditLog.AuditAction action;
    
    @Column(name = "changed_by", nullable = false, length = 100, updatable = false)
    private String changedBy;
    
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;
    
    @Column(name = "ip_address", length = 45, updatable = false) // IPv6 max length
    private String ipAddress;
    
    @Column(name = "user_agent", length = 500, updatable = false)
    private String userAgent;
    
    // Previous state
    @Column(name = "previous_expression", length = 1000, updatable = false)
    private String previousExpression;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "previous_channel", length = 20, updatable = false)
    private ChannelType previousChannel;
    
    @Column(name = "previous_priority", updatable = false)
    private Integer previousPriority;
    
    @Column(name = "previous_enabled", updatable = false)
    private Boolean previousEnabled;
    
    // New state
    @Column(name = "new_expression", length = 1000, updatable = false)
    private String newExpression;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "new_channel", length = 20, updatable = false)
    private ChannelType newChannel;
    
    @Column(name = "new_priority", updatable = false)
    private Integer newPriority;
    
    @Column(name = "new_enabled", updatable = false)
    private Boolean newEnabled;
    
    @Column(name = "change_reason", length = 500, updatable = false)
    private String changeReason;
    
    /**
     * Convert to domain model.
     */
    public RoutingRuleAuditLog toDomain() {
        return RoutingRuleAuditLog.builder()
            .id(id)
            .ruleId(ruleId)
            .action(action)
            .changedBy(changedBy)
            .changedAt(changedAt)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .previousExpression(previousExpression)
            .previousChannel(previousChannel)
            .previousPriority(previousPriority)
            .previousEnabled(previousEnabled)
            .newExpression(newExpression)
            .newChannel(newChannel)
            .newPriority(newPriority)
            .newEnabled(newEnabled)
            .changeReason(changeReason)
            .build();
    }
    
    /**
     * Create from domain model.
     */
    public static RoutingRuleAuditLogEntity fromDomain(RoutingRuleAuditLog log) {
        return RoutingRuleAuditLogEntity.builder()
            .id(log.getId())
            .ruleId(log.getRuleId())
            .action(log.getAction())
            .changedBy(log.getChangedBy())
            .changedAt(log.getChangedAt())
            .ipAddress(log.getIpAddress())
            .userAgent(log.getUserAgent())
            .previousExpression(log.getPreviousExpression())
            .previousChannel(log.getPreviousChannel())
            .previousPriority(log.getPreviousPriority())
            .previousEnabled(log.getPreviousEnabled())
            .newExpression(log.getNewExpression())
            .newChannel(log.getNewChannel())
            .newPriority(log.getNewPriority())
            .newEnabled(log.getNewEnabled())
            .changeReason(log.getChangeReason())
            .build();
    }
}

