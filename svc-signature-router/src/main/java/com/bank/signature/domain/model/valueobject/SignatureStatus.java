package com.bank.signature.domain.model.valueobject;

/**
 * Signature request lifecycle status.
 * 
 * <p><b>State Transitions:</b></p>
 * <pre>
 * PENDING → CHALLENGED (when challenge created)
 * CHALLENGED → SIGNED (when challenge completed)
 * CHALLENGED → ABORTED (manual abort)
 * ANY → EXPIRED (when TTL exceeded)
 * </pre>
 * 
 * @since Story 1.5
 */
public enum SignatureStatus {
    /**
     * Initial state after creation, awaiting challenge creation.
     */
    PENDING,
    
    /**
     * Challenge sent to customer, awaiting completion.
     */
    CHALLENGED,
    
    /**
     * Challenge completed successfully, signature verified.
     */
    SIGNED,
    
    /**
     * Manually aborted by user or system (e.g., fraud detection).
     */
    ABORTED,
    
    /**
     * TTL exceeded (default 15 minutes), signature request expired.
     */
    EXPIRED,
    
    /**
     * Pending in degraded mode - request accepted but challenge queued.
     * Story 4.3: When system in degraded mode, challenges not sent immediately.
     * Will be processed when system recovers to normal operation.
     */
    PENDING_DEGRADED
}






