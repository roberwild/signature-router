package com.singularbank.signature.routing.domain.model.valueobject;

/**
 * Enumeration of audit actions (CRUD operations).
 * Story 8.4: Audit Log - Immutable Storage
 * 
 * <p>Represents the type of operation performed on an entity.</p>
 * 
 * @since Story 8.4
 */
public enum AuditAction {
    
    /**
     * Entity created (INSERT operation).
     */
    CREATE,
    
    /**
     * Entity read/accessed (SELECT operation).
     */
    READ,
    
    /**
     * Entity updated (UPDATE operation).
     */
    UPDATE,
    
    /**
     * Entity deleted (DELETE operation).
     */
    DELETE,
    
    /**
     * Security event (access denied, authentication failed, etc.).
     */
    SECURITY_EVENT
}

