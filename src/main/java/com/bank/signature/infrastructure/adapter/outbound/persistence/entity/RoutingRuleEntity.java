package com.bank.signature.infrastructure.adapter.outbound.persistence.entity;

import com.bank.signature.domain.model.valueobject.ChannelType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for RoutingRule.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * Maps to 'routing_rule' table (created by LiquidBase in Story 1.2).
 */
@Entity
@Table(name = "routing_rule")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutingRuleEntity {
    
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;
    
    @Column(name = "name", nullable = false, length = 200)
    private String name;
    
    @Column(name = "condition", nullable = false, length = 1000)
    private String condition;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "target_channel", nullable = false, length = 20)
    private ChannelType targetChannel;
    
    @Column(name = "priority", nullable = false)
    private Integer priority;
    
    @Column(name = "enabled", nullable = false)
    private Boolean enabled;
    
    @Column(name = "created_by", nullable = false, length = 255)
    private String createdBy;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "modified_by", length = 255)
    private String modifiedBy;
    
    @Column(name = "modified_at")
    private Instant modifiedAt;
    
    @Column(name = "deleted", nullable = false)
    @Builder.Default
    private Boolean deleted = false;
    
    @Column(name = "deleted_by", length = 255)
    private String deletedBy;
    
    @Column(name = "deleted_at")
    private Instant deletedAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (deleted == null) {
            deleted = false;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        modifiedAt = Instant.now();
    }
}

