package com.bank.signature.domain.model.aggregate;

import com.bank.signature.domain.model.valueobject.ChannelType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * RoutingRule aggregate root.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * Represents a routing rule with SpEL condition that determines
 * which channel to use for signature challenges based on transaction context.
 * 
 * Rules are evaluated in priority order (lower number = higher priority).
 * First matching rule determines the target channel.
 */
@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class RoutingRule {
    
    /**
     * Unique identifier (UUIDv7 for time-sortability).
     */
    private UUID id;
    
    /**
     * Human-readable name for the rule.
     * Example: "High-value transactions to Voice"
     */
    private String name;
    
    /**
     * SpEL expression condition.
     * Example: "context.amount.value > 1000.00 and context.merchantId == 'merchant-123'"
     * 
     * Available variables:
     * - context.amount.value (BigDecimal)
     * - context.amount.currency (String)
     * - context.merchantId (String)
     * - context.orderId (String)
     * - context.description (String)
     */
    private String condition;
    
    /**
     * Target channel when rule matches.
     */
    private ChannelType targetChannel;
    
    /**
     * Priority for rule evaluation (lower = higher priority).
     * Rules are evaluated in ascending order until first match.
     * Example: priority=1 evaluated before priority=2
     */
    private Integer priority;
    
    /**
     * Whether the rule is active.
     * Disabled rules are skipped during evaluation.
     */
    private Boolean enabled;
    
    /**
     * User who created the rule.
     */
    private String createdBy;
    
    /**
     * Timestamp when the rule was created.
     */
    private Instant createdAt;
    
    /**
     * User who last modified the rule.
     */
    private String modifiedBy;
    
    /**
     * Timestamp when the rule was last modified.
     */
    private Instant modifiedAt;
    
    /**
     * Soft delete flag.
     * Deleted rules are not evaluated but kept for audit.
     */
    private Boolean deleted;
    
    /**
     * User who deleted the rule.
     */
    private String deletedBy;
    
    /**
     * Timestamp when the rule was deleted.
     */
    private Instant deletedAt;
    
    /**
     * Business method: Mark rule as deleted (soft delete).
     * 
     * @param deletedBy User performing the deletion
     */
    public void markAsDeleted(String deletedBy) {
        this.deleted = true;
        this.deletedBy = deletedBy;
        this.deletedAt = Instant.now();
        this.enabled = false; // Disable when deleted
    }
    
    /**
     * Business method: Enable the rule.
     */
    public void enable() {
        if (Boolean.TRUE.equals(this.deleted)) {
            throw new IllegalStateException("Cannot enable a deleted rule");
        }
        this.enabled = true;
    }
    
    /**
     * Business method: Disable the rule.
     */
    public void disable() {
        this.enabled = false;
    }
    
    /**
     * Business method: Update rule details.
     * 
     * @param name New name
     * @param condition New SpEL condition
     * @param targetChannel New target channel
     * @param priority New priority
     * @param modifiedBy User performing the update
     */
    public void update(String name, String condition, ChannelType targetChannel, 
                       Integer priority, String modifiedBy) {
        if (Boolean.TRUE.equals(this.deleted)) {
            throw new IllegalStateException("Cannot update a deleted rule");
        }
        
        this.name = name;
        this.condition = condition;
        this.targetChannel = targetChannel;
        this.priority = priority;
        this.modifiedBy = modifiedBy;
        this.modifiedAt = Instant.now();
    }
}

