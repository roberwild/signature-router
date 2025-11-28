package com.bank.signature.domain.exception;

import java.util.UUID;

/**
 * Exception thrown when attempting to complete signature with a challenge that doesn't belong to the aggregate.
 * 
 * @since Story 1.5
 */
public class ChallengeNotBelongsException extends DomainException {
    
    private static final String ERROR_CODE = "CHALLENGE_NOT_BELONGS";
    
    private final UUID signatureRequestId;
    private final UUID challengeId;
    
    /**
     * Constructor with signature request ID and challenge ID.
     * 
     * @param signatureRequestId ID of signature request
     * @param challengeId ID of challenge that doesn't belong
     */
    public ChallengeNotBelongsException(UUID signatureRequestId, UUID challengeId) {
        super(
            String.format("Challenge %s does not belong to signature request %s", challengeId, signatureRequestId),
            ERROR_CODE
        );
        this.signatureRequestId = signatureRequestId;
        this.challengeId = challengeId;
    }
    
    public UUID getSignatureRequestId() {
        return signatureRequestId;
    }
    
    public UUID getChallengeId() {
        return challengeId;
    }
}

