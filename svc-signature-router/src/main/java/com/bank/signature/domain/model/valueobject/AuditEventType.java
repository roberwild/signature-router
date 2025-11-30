package com.bank.signature.domain.model.valueobject;

/**
 * Enumeration of audit event types tracked in the system.
 * Story 8.4: Audit Log - Immutable Storage
 * 
 * <p><b>Categories:</b></p>
 * <ul>
 *   <li>Signature Lifecycle</li>
 *   <li>Routing Rules Management</li>
 *   <li>Security Events</li>
 *   <li>Provider Management</li>
 *   <li>Secrets Management</li>
 *   <li>GDPR Compliance</li>
 * </ul>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>SOC 2 CC7.2: Monitor system components</li>
 *   <li>PCI-DSS Req 10: Track and monitor all access</li>
 *   <li>GDPR Art. 30: Records of processing activities</li>
 * </ul>
 * 
 * @since Story 8.4
 */
public enum AuditEventType {
    
    // ========== Signature Lifecycle ==========
    SIGNATURE_CREATED,
    SIGNATURE_CHALLENGED,
    SIGNATURE_COMPLETED,
    SIGNATURE_EXPIRED,
    SIGNATURE_ABORTED,
    
    // ========== Routing Rules ==========
    ROUTING_RULE_CREATED,
    ROUTING_RULE_MODIFIED,
    ROUTING_RULE_DELETED,
    ROUTING_RULE_ENABLED,
    ROUTING_RULE_DISABLED,
    
    // ========== Security Events ==========
    ACCESS_DENIED,
    INVALID_JWT_TOKEN,
    RATE_LIMIT_EXCEEDED,
    AUTHENTICATION_FAILED,
    AUTHORIZATION_FAILED,
    
    // ========== Provider Management ==========
    PROVIDER_CONFIGURATION_CHANGED,
    PROVIDER_DEGRADED_MODE_ACTIVATED,
    PROVIDER_DEGRADED_MODE_DEACTIVATED,
    PROVIDER_CIRCUIT_BREAKER_OPENED,
    PROVIDER_CIRCUIT_BREAKER_CLOSED,
    
    // ========== Secrets Management ==========
    SECRET_ROTATED,
    SECRET_ROTATION_FAILED, // Story 8.5
    SECRET_ACCESS_ATTEMPTED,
    SECRET_ACCESS_DENIED,
    
    // ========== GDPR Compliance ==========
    CUSTOMER_DATA_EXPORTED,
    CUSTOMER_DATA_DELETED,
    CUSTOMER_CONSENT_RECORDED,
    CUSTOMER_CONSENT_REVOKED
}

