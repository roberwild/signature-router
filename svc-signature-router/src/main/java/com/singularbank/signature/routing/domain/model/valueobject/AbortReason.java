package com.singularbank.signature.routing.domain.model.valueobject;

/**
 * Enumeration of reasons why a signature request was aborted.
 * Story 2.12: Signature Abort (Admin Action)
 * 
 * @since Story 2.12
 */
public enum AbortReason {
    
    /**
     * User voluntarily cancelled the signature request.
     */
    USER_CANCELLED,
    
    /**
     * Fraud detection system flagged the transaction as suspicious.
     */
    FRAUD_DETECTED,
    
    /**
     * System error prevented completion (e.g., provider failure, timeout).
     */
    SYSTEM_ERROR,
    
    /**
     * Manual intervention by an administrator.
     */
    ADMIN_INTERVENTION,
    
    /**
     * All fallback channels exhausted without successful completion.
     */
    FALLBACK_EXHAUSTED
}

