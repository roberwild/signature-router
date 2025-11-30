package com.bank.signature.domain.model.event;

import com.bank.signature.domain.model.valueobject.AuditAction;
import com.bank.signature.domain.model.valueobject.AuditEventType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Domain event representing an auditable action in the system.
 * Story 8.4: Audit Log - Immutable Storage
 * 
 * <p><b>Purpose:</b> Capture security-critical events for compliance and forensics.</p>
 * 
 * <p><b>Immutability:</b> This is a record (immutable by design).</p>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>SOC 2 CC7.2: System monitoring</li>
 *   <li>PCI-DSS Req 10: Track and monitor access</li>
 *   <li>GDPR Art. 30: Records of processing activities</li>
 * </ul>
 * 
 * @param eventType Type of audit event (e.g., SIGNATURE_CREATED, ACCESS_DENIED)
 * @param entityType Type of entity affected (e.g., "SIGNATURE_REQUEST", "ROUTING_RULE")
 * @param entityId ID of the affected entity
 * @param action CRUD action performed (CREATE, READ, UPDATE, DELETE, SECURITY_EVENT)
 * @param actor Username or service account performing the action
 * @param actorRole Role of the actor (ADMIN, USER, SUPPORT, AUDITOR)
 * @param changes Before/after snapshot of changes (JSONB)
 * @param ipAddress IP address of the actor
 * @param userAgent User-Agent header (browser/client identification)
 * @param traceId Distributed tracing ID for correlation
 * 
 * @since Story 8.4
 */
public record AuditEvent(
        AuditEventType eventType,
        String entityType,
        UUID entityId,
        AuditAction action,
        String actor,
        String actorRole,
        Map<String, Object> changes,
        String ipAddress,
        String userAgent,
        String traceId
) {
    
    /**
     * Factory method for access denied events.
     * 
     * @param actor Username attempting access
     * @param actorRole Role of the actor
     * @param path Endpoint path attempted
     * @param method HTTP method
     * @param ipAddress IP address of the actor
     * @param userAgent User-Agent header
     * @param traceId Trace ID for correlation
     * @return AuditEvent for access denied
     */
    public static AuditEvent accessDenied(
            String actor,
            String actorRole,
            String path,
            String method,
            String ipAddress,
            String userAgent,
            String traceId
    ) {
        return new AuditEvent(
                AuditEventType.ACCESS_DENIED,
                "HTTP_REQUEST",
                null, // No specific entity ID
                AuditAction.SECURITY_EVENT,
                actor,
                actorRole,
                Map.of(
                        "path", path,
                        "method", method,
                        "timestamp", Instant.now().toString()
                ),
                ipAddress,
                userAgent,
                traceId
        );
    }
    
    /**
     * Factory method for signature created events.
     * 
     * @param signatureId Signature request ID
     * @param customerId Pseudonymized customer ID
     * @param actor Username creating the signature
     * @param actorRole Role of the actor
     * @param ipAddress IP address
     * @param userAgent User-Agent
     * @param traceId Trace ID
     * @return AuditEvent for signature creation
     */
    public static AuditEvent signatureCreated(
            UUID signatureId,
            String customerId,
            String actor,
            String actorRole,
            String ipAddress,
            String userAgent,
            String traceId
    ) {
        return new AuditEvent(
                AuditEventType.SIGNATURE_CREATED,
                "SIGNATURE_REQUEST",
                signatureId,
                AuditAction.CREATE,
                actor,
                actorRole,
                Map.of(
                        "customerId", customerId,
                        "status", "PENDING",
                        "timestamp", Instant.now().toString()
                ),
                ipAddress,
                userAgent,
                traceId
        );
    }
}

