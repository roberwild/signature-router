package com.bank.signature.domain.exception;

import java.util.UUID;

/**
 * Exception thrown when attempting to create a challenge while one is already active.
 * 
 * <p><b>Business Rule:</b> Only 1 challenge with status PENDING allowed at a time.</p>
 * 
 * @since Story 1.5
 */
public class ChallengeAlreadyActiveException extends DomainException {
    
    private static final String ERROR_CODE = "CHALLENGE_ALREADY_ACTIVE";
    
    private final UUID signatureRequestId;
    
    /**
     * Constructor with signature request ID.
     * 
     * @param signatureRequestId ID of signature request that already has active challenge
     */
    public ChallengeAlreadyActiveException(UUID signatureRequestId) {
        super(String.format("Signature request %s already has an active challenge", signatureRequestId), ERROR_CODE);
        this.signatureRequestId = signatureRequestId;
    }
    
    public UUID getSignatureRequestId() {
        return signatureRequestId;
    }
}






