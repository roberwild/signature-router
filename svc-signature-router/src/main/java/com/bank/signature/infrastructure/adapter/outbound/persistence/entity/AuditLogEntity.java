package com.bank.signature.infrastructure.adapter.outbound.persistence.entity;

import com.bank.signature.domain.model.valueobject.AuditAction;
import com.bank.signature.domain.model.valueobject.AuditEventType;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * JPA entity for immutable audit log storage.
 * Story 8.4: Audit Log - Immutable Storage
 * 
 * <p><b>Immutability:</b> This entity is INSERT-ONLY. No UPDATE or DELETE operations allowed.</p>
 * <ul>
 *   <li>PostgreSQL RLS policies prevent UPDATE/DELETE at database level</li>
 *   <li>JPA does not expose update() or delete() methods in service layer</li>
 *   <li>Retention: 365 days minimum (compliance requirement)</li>
 * </ul>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>SOC 2 CC7.2: System monitoring and logging</li>
 *   <li>PCI-DSS Req 10: Track and monitor all access to network resources</li>
 *   <li>GDPR Art. 30: Records of processing activities</li>
 * </ul>
 * 
 * @since Story 8.4
 */
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_log_event_type", columnList = "event_type"),
        @Index(name = "idx_audit_log_entity_type", columnList = "entity_type"),
        @Index(name = "idx_audit_log_entity_id", columnList = "entity_id"),
        @Index(name = "idx_audit_log_actor", columnList = "actor"),
        @Index(name = "idx_audit_log_created_at", columnList = "created_at"),
        @Index(name = "idx_audit_log_trace_id", columnList = "trace_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntity {
    
    /**
     * Primary key (UUIDv7 for time-ordered IDs).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    /**
     * Type of audit event (e.g., SIGNATURE_CREATED, ACCESS_DENIED).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private AuditEventType eventType;
    
    /**
     * Type of entity affected (e.g., "SIGNATURE_REQUEST", "ROUTING_RULE").
     */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;
    
    /**
     * ID of the affected entity (nullable for security events without specific entity).
     */
    @Column(name = "entity_id")
    private UUID entityId;
    
    /**
     * CRUD action performed (CREATE, READ, UPDATE, DELETE, SECURITY_EVENT).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuditAction action;
    
    /**
     * Username or service account performing the action.
     */
    @Column(nullable = false)
    private String actor;
    
    /**
     * Role of the actor (ADMIN, USER, SUPPORT, AUDITOR).
     */
    @Column(name = "actor_role", length = 50)
    private String actorRole;
    
    /**
     * Before/after snapshot of changes (JSONB for flexible structure).
     * Example: {"before": {"status": "PENDING"}, "after": {"status": "SIGNED"}}
     */
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> changes;
    
    /**
     * IP address of the actor (for security forensics).
     */
    @Column(name = "ip_address", length = 45) // IPv6 max length
    private String ipAddress;
    
    /**
     * User-Agent header (browser/client identification).
     */
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    /**
     * Distributed tracing ID for correlation with application logs.
     */
    @Column(name = "trace_id", length = 36)
    private String traceId;
    
    /**
     * Timestamp when the audit event was created (immutable).
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    /**
     * Pre-persist hook to set created_at timestamp.
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}

