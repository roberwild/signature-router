package com.bank.signature.domain.exception;

import java.time.Instant;
import java.util.UUID;

/**
 * Exception thrown when attempting to expire a signature request before TTL exceeded.
 * 
 * @since Story 1.5
 */
public class TtlNotExceededException extends DomainException {
    
    private static final String ERROR_CODE = "TTL_NOT_EXCEEDED";
    
    private final UUID signatureRequestId;
    private final Instant expiresAt;
    
    /**
     * Constructor with signature request ID and expiration time.
     * 
     * @param signatureRequestId ID of signature request
     * @param expiresAt Expiration timestamp
     */
    public TtlNotExceededException(UUID signatureRequestId, Instant expiresAt) {
        super(
            String.format("Cannot expire signature request %s, TTL not exceeded (expires at %s)", signatureRequestId, expiresAt),
            ERROR_CODE
        );
        this.signatureRequestId = signatureRequestId;
        this.expiresAt = expiresAt;
    }
    
    public UUID getSignatureRequestId() {
        return signatureRequestId;
    }
    
    public Instant getExpiresAt() {
        return expiresAt;
    }
}

