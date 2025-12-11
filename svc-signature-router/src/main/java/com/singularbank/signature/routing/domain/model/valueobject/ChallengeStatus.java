package com.singularbank.signature.routing.domain.model.valueobject;

/**
 * Challenge lifecycle status.
 * 
 * @since Story 1.5
 */
public enum ChallengeStatus {
    /** Challenge sent to provider, awaiting delivery confirmation. */
    SENT,
    
    /** Challenge delivered to customer, awaiting user action. */
    PENDING,
    
    /** Challenge completed successfully (user verified). */
    COMPLETED,
    
    /** Challenge failed (e.g., wrong OTP, timeout, provider error). */
    FAILED,
    
    /** Challenge expired (TTL exceeded before completion). */
    EXPIRED
}






